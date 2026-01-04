export interface City {
  name: string;
  fullName?: string;
  lat: number;
  lng: number;
}

export enum Category {
  BIRDS = 'Top 15 - vogels',
  BUTTERFLIES = 'Top 15 - Vlinders',
  INSECTS = 'Top 15 - Bijen, Libellen & Wespen',
  ENDANGERED_NL = 'Bedreigd - NL Rode Lijst',
  ENDANGERED = 'Bedreigd WereldWijd (IUCN)'
}

export interface SpeciesRecord {
  key: number | string;
  scientificName: string;
  count: number;
  imageUrl?: string;
  dutchName?: string;
  visibilityLabel?: string;
  visibilityColor?: string;
  conservationStatus?: string;
  redListLink?: string; // Nieuw: link naar nederlandsesoorten.nl
}

export interface SpeciesDetail {
  dutchName: string;
  scientificName: string;
  identification: string[];
  locationTip: string;
  imageUrl: string;
  wikiSummary?: string;
  wikiUrl?: string;
  waarnemingUrl?: string;
  conservationStatus?: string;
  redListLink?: string; // Nieuw
}

export interface GBIFOccurrenceFacet {
  name: string;
  count: number;
}