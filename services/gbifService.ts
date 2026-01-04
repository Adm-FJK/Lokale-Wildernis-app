
import { GBIF_BASE_URL, CATEGORY_KEYS } from '../constants';
import { Category, SpeciesRecord } from '../types';
import { SPECIES_KNOWLEDGE } from './knowledgeService';
import { fetchWikiImage, fetchWikiDutchData, normalizeScientificName } from './wikiService';

export const fetchTopSpecies = async (
  category: Category,
  lat: number,
  lng: number,
  month: number
): Promise<(SpeciesRecord & { dutchName?: string })[]> => {
  const range = 0.15;
  const minLat = lat - range;
  const maxLat = lat + range;
  const minLng = lng - range;
  const maxLng = lng + range;

  const param = CATEGORY_KEYS[category as keyof typeof CATEGORY_KEYS];
  const limit = 15;

  try {
    const url = `${GBIF_BASE_URL}/occurrence/search?country=NL&month=${month}&year=2023,2025&facet=speciesKey&facetLimit=15&limit=0&${param}&decimalLatitude=${minLat},${maxLat}&decimalLongitude=${minLng},${maxLng}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`GBIF API Error: ${res.status}`);
    const data = await res.json();
    
    const facets = data.facets?.find((f: any) => f.field === 'SPECIES_KEY')?.counts || [];
    const topFacets = facets.slice(0, limit);

    if (topFacets.length === 0) return [];

    const speciesRecords = await Promise.all(
      topFacets.map(async (facet: any) => {
        try {
          const sRes = await fetch(`${GBIF_BASE_URL}/species/${facet.name}`);
          if (!sRes.ok) return null;
          const sData = await sRes.json();
          
          const rawName = sData.canonicalName || sData.scientificName;
          const sciName = rawName.split(' (')[0].trim();
          const cleanKey = normalizeScientificName(sciName);
          
          const [img, wiki] = await Promise.all([
            fetchWikiImage(sciName),
            fetchWikiDutchData(sciName)
          ]);

          let dutchName = wiki?.name;
          if (!dutchName) {
            const local = SPECIES_KNOWLEDGE[cleanKey];
            if (local) dutchName = local.dutchName;
          }

          const finalImageUrl = img || "https://upload.wikimedia.org/wikipedia/commons/a/ac/No_image_available.svg";

          return {
            key: sData.key,
            scientificName: sciName,
            count: facet.count,
            imageUrl: finalImageUrl,
            dutchName: dutchName || sciName
          };
        } catch (e) {
          return null;
        }
      })
    );

    return speciesRecords.filter((s): s is (SpeciesRecord & { dutchName?: string }) => s !== null);
  } catch (error) {
    console.error('Fetch error:', error);
    return [];
  }
};
