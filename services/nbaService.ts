
import { GBIF_BASE_URL } from '../constants.ts';
import { SpeciesRecord } from '../types.ts';
import { fetchWikiImage, fetchWikiDutchData, normalizeScientificName } from './wikiService.ts';

/**
 * DE BELANGRIJKSTE VARIABELE VOOR DE DATA:
 * Zodra je het bestand op GitHub hebt gezet, plak je de 'Raw' URL hieronder tussen de aanhalingstekens.
 */
const GITHUB_REDLIST_RAW_URL = "JOUW_GITHUB_RAW_URL_HIER";

export const IUCN_INFO: Record<string, { label: string, english: string, description: string }> = {
  'CR': { label: 'Ernstig bedreigd (EB)', english: 'Critically Endangered (CR)', description: 'Zeer hoog risico op uitsterven in het wild.' },
  'EN': { label: 'Bedreigd (BE)', english: 'Endangered (EN)', description: 'Hoog risico op uitsterven in het wild.' },
  'VU': { label: 'Kwetsbaar (KW)', english: 'Vulnerable (VU)', description: 'Aanzienlijk risico op uitsterven in het wild.' },
  'NT': { label: 'Gevoelig (GE)', english: 'Near Threatened (NT)', description: 'Nog niet bedreigd, maar nadert kwetsbare status.' },
  'EB': { label: 'Ernstig bedreigd (EB)', english: 'Critically Endangered (CR)', description: 'Zeer hoog risico op uitsterven in het wild.' },
  'BE': { label: 'Bedreigd (BE)', english: 'Endangered (EN)', description: 'Hoog risico op uitsterven in het wild.' },
  'KW': { label: 'Kwetsbaar (KW)', english: 'Vulnerable (VU)', description: 'Aanzienlijk risico op uitsterven in het wild.' },
  'GE': { label: 'Gevoelig (GE)', english: 'Near Threatened (NT)', description: 'Nog niet bedreigd, maar nadert kwetsbare status.' }
};

const mapIucnStatus = (code: string | null | undefined): string => {
  const finalCode = code || 'NE';
  return IUCN_INFO[finalCode]?.label ? `${IUCN_INFO[finalCode].label}` : finalCode;
};

const mapNLStatus = (rawStatus: string): string => {
  const s = rawStatus.toLowerCase().trim();
  if (s === 'gevoelig') return 'Gevoelig (GE)';
  if (s === 'kwetsbaar') return 'Kwetsbaar (KW)';
  if (s === 'bedreigd') return 'Bedreigd (BE)';
  if (s === 'ernstig bedreigd') return 'Ernstig bedreigd (EB)';
  return rawStatus;
};

let cachedRedListMap: Map<string, { status: string, link?: string }> | null = null;

/**
 * Slimme lader: probeert eerst lokaal (Vercel/Lokaal), daarna GitHub (AI Studio Preview)
 */
const getRedListNLMap = async (): Promise<Map<string, { status: string, link?: string }>> => {
  if (cachedRedListMap) return cachedRedListMap;
  
  let fullData: any[] = [];
  
  try {
    // Gebruik de juiste bestandsnaam redlist_nl.json
    const localRes = await fetch('./data/redlist_nl.json');
    if (localRes.ok) {
      fullData = await localRes.json();
    } else {
      if (GITHUB_REDLIST_RAW_URL && GITHUB_REDLIST_RAW_URL !== "JOUW_GITHUB_RAW_URL_HIER") {
        const remoteRes = await fetch(GITHUB_REDLIST_RAW_URL);
        if (remoteRes.ok) fullData = await remoteRes.json();
      }
    }

    const map = new Map<string, { status: string, link?: string }>();
    if (Array.isArray(fullData)) {
      fullData.forEach(entry => {
        const name = normalizeScientificName(entry["wetenschappelijke naam"] || "");
        if (name) {
          map.set(name.toLowerCase(), {
            status: mapNLStatus(entry["status NL"] || "Onbekend"),
            link: entry["link"]
          });
        }
      });
    }
    
    cachedRedListMap = map;
    return cachedRedListMap;
  } catch (e) {
    console.warn("Kon Rode Lijst data niet laden van bronnen", e);
    return new Map();
  }
};

const resolveIucnStatus = async (speciesKey: number | string, sData: any): Promise<string> => {
  if (sData.iucnRedListCategory) return sData.iucnRedListCategory;
  if (sData.threatStatus && sData.threatStatus.length > 0) return sData.threatStatus[0];
  try {
    const occRes = await fetch(`${GBIF_BASE_URL}/occurrence/search?speciesKey=${speciesKey}&limit=1`);
    if (occRes.ok) {
      const occData = await occRes.json();
      return occData.results?.[0]?.iucnRedListCategory || 'NE';
    }
  } catch (e) {}
  return 'NE';
};

export const fetchEndangeredSpecies = async (
  lat: number,
  lng: number,
  month: number,
  isDutchSpecific: boolean = false
): Promise<SpeciesRecord[]> => {
  const range = 0.15; 
  const minLat = lat - range;
  const maxLat = lat + range;
  const minLng = lng - range;
  const maxLng = lng + range;

  const url = isDutchSpecific
    ? `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&kingdomKey=1&decimalLatitude=${minLat},${maxLat}&decimalLongitude=${minLng},${maxLng}&facet=speciesKey&facetLimit=5000&limit=0`
    : `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&kingdomKey=1&decimalLatitude=${minLat},${maxLat}&decimalLongitude=${minLng},${maxLng}&iucn_red_list_category=CR&iucn_red_list_category=EN&iucn_red_list_category=VU&iucn_red_list_category=NT&facet=speciesKey&facetLimit=50&limit=0`;

  try {
    const redListMap = await getRedListNLMap();
    const response = await fetch(url);
    const data = await response.json();
    const facets = data.facets?.find((f: any) => f.field === 'SPECIES_KEY')?.counts || [];
    
    const finalResults: SpeciesRecord[] = [];
    const maxMatches = 50;
    const batchSize = 100;

    for (let i = 0; i < facets.length && finalResults.length < maxMatches; i += batchSize) {
      const batch = facets.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (facet: any) => {
          try {
            const sRes = await fetch(`${GBIF_BASE_URL}/species/${facet.name}`);
            const sData = await sRes.json();
            const normalized = normalizeScientificName(sData.canonicalName || sData.scientificName);
            
            if (isDutchSpecific) {
              const nlData = redListMap.get(normalized.toLowerCase());
              if (!nlData) return null;
              const [img, wiki] = await Promise.all([fetchWikiImage(normalized), fetchWikiDutchData(normalized)]);
              return {
                key: sData.key,
                scientificName: normalized,
                count: facet.count,
                imageUrl: img || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
                dutchName: wiki?.name || normalized,
                conservationStatus: nlData.status,
                redListLink: nlData.link
              };
            } else {
              const iucnCode = await resolveIucnStatus(facet.name, sData);
              if (['LC', 'DD', 'NE'].includes(iucnCode)) return null;
              const [img, wiki] = await Promise.all([fetchWikiImage(normalized), fetchWikiDutchData(normalized)]);
              return {
                key: sData.key,
                scientificName: normalized,
                count: facet.count,
                imageUrl: img || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
                dutchName: wiki?.name || normalized,
                conservationStatus: mapIucnStatus(iucnCode),
              };
            }
          } catch (e) { return null; }
        })
      );
      finalResults.push(...batchResults.filter((r): r is SpeciesRecord => r !== null));
    }
    return finalResults.slice(0, maxMatches);
  } catch (error) {
    return [];
  }
};
