
import { GBIF_BASE_URL } from '../constants';
import { SpeciesRecord } from '../types';
import { fetchWikiImage, fetchWikiDutchData, normalizeScientificName } from './wikiService';

export const IUCN_INFO: Record<string, any> = {
  'CR': { label: 'Ernstig bedreigd (EB)', english: 'Critically Endangered', description: 'Hoog risico op uitsterven.' },
  'EN': { label: 'Bedreigd (BE)', english: 'Endangered', description: 'Hoog risico op uitsterven.' },
  'VU': { label: 'Kwetsbaar (KW)', english: 'Vulnerable', description: 'Aanzienlijk risico.' },
  'NT': { label: 'Gevoelig (GE)', english: 'Near Threatened', description: 'Nadert kwetsbare status.' }
};

let cachedRedList: Map<string, any> | null = null;

const getRedList = async () => {
  if (cachedRedList) return cachedRedList;
  try {
    const res = await fetch('/data/redlist_nl.json');
    if (!res.ok) throw new Error("Could not load redlist");
    const data = await res.json();
    cachedRedList = new Map(data.map((d: any) => [normalizeScientificName(d["wetenschappelijke naam"]).toLowerCase(), d]));
    return cachedRedList;
  } catch (e) { 
    return new Map(); 
  }
};

export const fetchEndangeredSpecies = async (lat: number, lng: number, month: number, isNL: boolean = false): Promise<SpeciesRecord[]> => {
  const range = 0.15;
  const url = isNL 
    ? `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&decimalLatitude=${lat-range},${lat+range}&decimalLongitude=${lng-range},${lng+range}&facet=speciesKey&facetLimit=500&limit=0`
    : `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&iucn_red_list_category=CR&iucn_red_list_category=EN&iucn_red_list_category=VU&decimalLatitude=${lat-range},${lat+range}&decimalLongitude=${lng-range},${lng+range}&facet=speciesKey&facetLimit=50&limit=0`;

  const rl = await getRedList();
  const res = await fetch(url);
  const data = await res.json();
  const facets = data.facets?.find((f: any) => f.field === 'SPECIES_KEY')?.counts || [];
  
  const results: SpeciesRecord[] = [];
  for (const f of facets) {
    try {
      const sRes = await fetch(`${GBIF_BASE_URL}/species/${f.name}`);
      const sData = await sRes.json();
      const name = normalizeScientificName(sData.canonicalName || sData.scientificName);
      const nlData = rl.get(name.toLowerCase());
      
      if (isNL && !nlData) continue;
      
      const [img, wiki] = await Promise.all([fetchWikiImage(name), fetchWikiDutchData(name)]);
      results.push({
        key: sData.key,
        scientificName: name,
        count: f.count,
        imageUrl: img || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg",
        dutchName: wiki?.name || name,
        conservationStatus: nlData ? nlData["status NL"] : (sData.iucnRedListCategory || 'NT'),
        redListLink: nlData?.link
      });
      if (results.length >= 15) break;
    } catch (e) {
      continue;
    }
  }
  return results;
};
