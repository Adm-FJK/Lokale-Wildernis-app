
import { City } from '../types';

/**
 * Zoekt locaties via Nominatim (OpenStreetMap) met specifieke optimalisaties voor Nederland.
 * Bevat filtering om straatnamen te negeren en een match-check op de getoonde naam.
 */
export const searchDutchCities = async (query: string): Promise<City[]> => {
  if (query.trim().length < 2) return [];

  const cleanQuery = query.trim();
  const lowerQuery = cleanQuery.toLowerCase();
  
  // Nominatim URL met NL focus
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(cleanQuery)}&countrycodes=nl&limit=15&addressdetails=1&viewbox=3.2,53.6,7.2,50.6&bounded=1`;

  try {
    const response = await fetch(url, {
      headers: {
        'Accept-Language': 'nl'
      }
    });

    if (!response.ok) return [];
    
    const data = await response.json();

    return data
      .filter((item: any) => {
        // Bestaande blacklist (om straten en huizen te weren zoals eerder gevraagd)
        const blacklistTypes = ['highway', 'house', 'postcode', 'bus_stop', 'address'];
        const isBlacklisted = blacklistTypes.some(type => 
          item.class === type || item.type === type
        );
        return !isBlacklisted;
      })
      .map((item: any) => {
        // Pak de allereerste naam die Nominatim teruggeeft (vaak de meest relevante match)
        const primaryMatchName = item.display_name.split(',')[0];
        
        // Pak de administratieve naam (stad/dorp) als fallback
        const adminName = item.address.city || 
                          item.address.town || 
                          item.address.village || 
                          item.address.municipality;

        // Als de primaire match (bijv. "Den Haag") de zoekterm bevat, gebruiken we die.
        // Anders vallen we terug op de administratieve naam.
        const finalName = primaryMatchName.toLowerCase().includes(lowerQuery) 
          ? primaryMatchName 
          : (adminName || primaryMatchName);

        return {
          name: finalName,
          fullName: item.display_name,
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon)
        };
      })
      // OPTIE 1: De "Naam-Match" Check
      // We laten alleen resultaten zien waarbij de zoekterm voorkomt in de naam die we tonen.
      .filter((city: City) => {
        return city.name.toLowerCase().includes(lowerQuery);
      })
      // Verwijder dubbele plaatsnamen
      .filter((city: City, index: number, self: City[]) =>
        index === self.findIndex((t) => t.name === city.name)
      )
      .slice(0, 10);
      
  } catch (error) {
    console.error('Nominatim error:', error);
    return [];
  }
};
