/**
 * Normaliseert wetenschappelijke namen naar enkel "Genus species".
 * Dit verwijdert alle extra taxonomische ballast (auteurs, jaartallen, haakjes)
 * zodat de zoekmachine van Waarneming.nl een zuivere match kan maken.
 */
export const normalizeScientificName = (name: string): string => {
  if (!name) return "";
  
  // Verwijder alles tussen haakjes, komma's en overbodige witruimte
  let clean = name.replace(/\s*\([^)]*\)/g, '')
                  .replace(/,/g, '')
                  .trim();
  
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    // Pak alleen de eerste twee delen: Genus en species
    // Forceer de juiste casing voor maximale compatibiliteit
    const genus = parts[0].charAt(0).toUpperCase() + parts[0].slice(1).toLowerCase();
    const species = parts[1].toLowerCase();
    return `${genus} ${species}`;
  }
  return parts[0];
};

/**
 * Haalt Nederlandstalige data op van Wikipedia.
 */
export const fetchWikiDutchData = async (scientificName: string): Promise<{ name: string, summary: string, url: string } | null> => {
  try {
    const normalized = normalizeScientificName(scientificName);
    const url = `https://nl.wikipedia.org/w/api.php?action=query&prop=extracts|info&exsentences=4&explaintext=1&inprop=url&titles=${encodeURIComponent(normalized)}&redirects=1&format=json&origin=*`;
    const res = await fetch(url);
    const data = await res.json();
    
    if (data.query?.pages) {
      const pageId = Object.keys(data.query.pages)[0];
      const page = data.query.pages[pageId];
      if (pageId !== "-1" && page.extract) {
        return { name: page.title, summary: page.extract, url: page.fullurl };
      }
    }
    return null;
  } catch (error) {
    return null;
  }
};

/**
 * Haalt de hoofdafbeelding van Wikipedia op.
 */
export const fetchWikiImage = async (scientificName: string): Promise<string | null> => {
  try {
    const normalized = normalizeScientificName(scientificName);
    const url = `https://nl.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(normalized)}&redirects=1&origin=*`;
    const response = await fetch(url);
    const data = await response.json();
    const pages = data.query.pages;
    const pageId = Object.keys(pages)[0];
    if (pageId !== "-1" && pages[pageId].original) {
      return pages[pageId].original.source;
    }
    return null;
  } catch (error) {
    return null;
  }
};

// De ID-gebaseerde functies zijn verwijderd omdat we nu standaard de zoek-fallback gebruiken.
