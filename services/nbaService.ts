import { GBIF_BASE_URL } from '../constants';
import { SpeciesRecord } from '../types';
import { fetchWikiImage, fetchWikiDutchData, normalizeScientificName } from './wikiService';

export const IUCN_INFO: Record<string, { label: string, english: string, description: string }> = {
  // Internationale codes
  'CR': { 
    label: 'Ernstig bedreigd (EB)', 
    english: 'Critically Endangered (CR)', 
    description: 'Soorten die zeer sterk zijn afgenomen en zeer zeldzaam zijn. De soort loopt een extreem hoog risico om in het wild uit te sterven.' 
  },
  'EN': { 
    label: 'Bedreigd (BE)', 
    english: 'Endangered (EN)', 
    description: 'Soorten die sterk zijn afgenomen en zeldzaam tot zeer zeldzaam zijn en soorten die zeer sterk zijn afgenomen en zeldzaam zijn. De soort loopt een zeer hoog risico om in het wild uit te sterven.' 
  },
  'VU': { 
    label: 'Kwetsbaar (KW)', 
    english: 'Vulnerable (VU)', 
    description: 'Soorten die zijn afgenomen en vrij tot zeer zeldzaam zijn en soorten die sterk tot zeer sterk zijn afgenomen en vrij zeldzaam zijn. De soort loopt een hoog risico om in het wild uit te sterven.' 
  },
  'NT': { 
    label: 'Gevoelig (GE)', 
    english: 'Near Threatened (NT)', 
    description: 'Soorten die stabiel zijn of toegenomen, maar zeer zeldzaam zijn en soorten die sterk tot zeer sterk zijn afgenomen, maar nog algemeen zijn. De soort is nog niet bedreigd, maar nadert de status kwetsbaar.' 
  },
  // Nederlandse codes (voor matching in SpeciesDetail)
  'EB': { 
    label: 'Ernstig bedreigd (EB)', 
    english: 'Critically Endangered (CR)', 
    description: 'Soorten die zeer sterk zijn afgenomen en zeer zeldzaam zijn. De soort loopt een extreem hoog risico om in het wild uit te sterven.' 
  },
  'BE': { 
    label: 'Bedreigd (BE)', 
    english: 'Endangered (EN)', 
    description: 'Soorten die sterk zijn afgenomen en zeldzaam tot zeer zeldzaam zijn en soorten die zeer sterk zijn afgenomen en zeldzaam zijn. De soort loopt een zeer hoog risico om in het wild uit te sterven.' 
  },
  'KW': { 
    label: 'Kwetsbaar (KW)', 
    english: 'Vulnerable (VU)', 
    description: 'Soorten die zijn afgenomen en vrij tot zeer zeldzaam zijn en soorten die sterk tot zeer sterk zijn afgenomen en vrij zeldzaam zijn. De soort loopt een hoog risico om in het wild uit te sterven.' 
  },
  'GE': { 
    label: 'Gevoelig (GE)', 
    english: 'Near Threatened (NT)', 
    description: 'Soorten die stabiel zijn of toegenomen, maar zeer zeldzaam zijn en soorten die sterk tot zeer sterk zijn afgenomen, maar nog algemeen zijn. De soort is nog niet bedreigd, maar nadert de status kwetsbaar.' 
  }
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

// Cache voor de lokale Rode Lijst
let cachedRedListMap: Map<string, { status: string, link?: string }> | null = null;

const getRedListNLMap = async (): Promise<Map<string, { status: string, link?: string }>> => {
  if (cachedRedListMap) return cachedRedListMap;
  
  try {
    const files = [
      './data/redlist_nl_1.json',
      './data/redlist_nl_2.json',
      './data/redlist_nl_3.json',
      './data/redlist_nl_4.json'
    ];

    const responses = await Promise.all(files.map(f => fetch(f)));
    let fullData: any[] = [];
    
    for (const res of responses) {
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) fullData = fullData.concat(data);
      }
    }
    
    const map = new Map<string, { status: string, link?: string }>();
    fullData.forEach(entry => {
      const name = normalizeScientificName(entry["wetenschappelijke naam"] || "");
      if (name) {
        map.set(name.toLowerCase(), {
          status: mapNLStatus(entry["status NL"] || "Onbekend"),
          link: entry["link"]
        });
      }
    });
    
    cachedRedListMap = map;
    return cachedRedListMap;
  } catch (e) {
    console.warn("Kon Rode Lijst data niet laden", e);
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
      const statusFromOcc = occData.results?.[0]?.iucnRedListCategory;
      if (statusFromOcc) return statusFromOcc;
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

  let url: string;
  if (isDutchSpecific) {
    url = `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&kingdomKey=1&decimalLatitude=${minLat},${maxLat}&decimalLongitude=${minLng},${maxLng}&facet=speciesKey&facetLimit=10000&limit=0`;
  } else {
    url = `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&kingdomKey=1&decimalLatitude=${minLat},${maxLat}&decimalLongitude=${minLng},${maxLng}&iucn_red_list_category=CR&iucn_red_list_category=EN&iucn_red_list_category=VU&iucn_red_list_category=NT&facet=speciesKey&facetLimit=50&limit=0`;
  }

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
              
              const [img, wiki] = await Promise.all([
                fetchWikiImage(normalized),
                fetchWikiDutchData(normalized)
              ]);

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

              const [img, wiki] = await Promise.all([
                fetchWikiImage(normalized),
                fetchWikiDutchData(normalized)
              ]);

              return {
                key: sData.key,
                scientificName: normalized,
                count: facet.count,
                imageUrl: img || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
                dutchName: wiki?.name || normalized,
                conservationStatus: mapIucnStatus(iucnCode),
              };
            }
          } catch (e) {
            return null;
          }
        })
      );

      const validMatches = batchResults.filter((r): r is SpeciesRecord => r !== null);
      finalResults.push(...validMatches);
    }

    return finalResults.slice(0, maxMatches);
  } catch (error) {
    console.error("Fout tijdens fetch:", error);
    return [];
  }
};