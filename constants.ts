import { City } from './types';

export const CITIES: City[] = [
  { name: 'Amsterdam', lat: 52.3676, lng: 4.9041 },
  { name: 'Rotterdam', lat: 51.9225, lng: 4.47917 },
  { name: 'Utrecht', lat: 52.0907, lng: 5.1214 },
  { name: 'Den Haag', lat: 52.0705, lng: 4.3007 },
  { name: 'Eindhoven', lat: 51.4416, lng: 5.4697 },
  { name: 'Groningen', lat: 53.2194, lng: 6.5665 },
  { name: 'Tilburg', lat: 51.5555, lng: 5.0913 },
  { name: 'Almere', lat: 52.3713, lng: 5.2221 },
  { name: 'Breda', lat: 51.5895, lng: 4.7744 },
  { name: 'Nijmegen', lat: 51.8126, lng: 5.8372 },
  { name: 'Apeldoorn', lat: 52.2112, lng: 5.9699 },
  { name: 'Enschede', lat: 52.2215, lng: 6.8937 },
  { name: 'Haarlem', lat: 52.3874, lng: 4.6462 },
  { name: 'Arnhem', lat: 51.9851, lng: 5.8987 },
  { name: 'Amersfoort', lat: 52.1561, lng: 5.3878 },
  { name: 'Zaanstad', lat: 52.442, lng: 4.8292 },
  { name: "'s-Hertogenbosch", lat: 51.6978, lng: 5.3037 },
  { name: 'Leiden', lat: 52.1601, lng: 4.497 },
  { name: 'Dordrecht', lat: 51.8133, lng: 4.6901 },
  { name: 'Maastricht', lat: 50.8514, lng: 5.691 },
];

export const MONTHS = [
  'Januari', 'Februari', 'Maart', 'April', 'Mei', 'Juni',
  'Juli', 'Augustus', 'September', 'Oktober', 'November', 'December'
];

export const CATEGORY_KEYS = {
  'Top 15 - vogels': 'classKey=212',
  'Top 15 - Vlinders': 'orderKey=797',
  'Top 15 - Bijen, Libellen & Wespen': 'orderKey=1457&orderKey=789',
};

export const GBIF_BASE_URL = 'https://api.gbif.org/v1';
export const NBA_BASE_URL = 'https://api.biodiversitydata.nl/v2';