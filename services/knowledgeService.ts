import { SpeciesDetail } from '../types';

/**
 * Gecureerde database van veelvoorkomende Nederlandse soorten.
 * De IDs zijn verwijderd om foutieve redirects te voorkomen; we gebruiken nu de zoek-fallback.
 */
export const SPECIES_KNOWLEDGE: Record<string, SpeciesDetail> = {
  "platalea leucorodia": {
    dutchName: "Lepelaar", scientificName: "Platalea leucorodia",
    wikiSummary: "De lepelaar is een onmiskenbare grote witte vogel met een lange, platte snavel die aan het uiteinde breed en spatelvormig is.",
    identification: ["Lange lepelvormige zwarte snavel", "Geheel wit verenkleed", "Lange zwarte poten"],
    locationTip: "Vaak te zien in waterrijke parken bij de stad.", imageUrl: ""
  },
  "parus major": { 
    dutchName: "Koolmees", scientificName: "Parus major",
    wikiSummary: "De koolmees is herkenbaar aan zijn zwarte kop met witte wangen en een gele borst met een zwarte middenstreep.",
    identification: ["Zwarte kop met witte wangen", "Gele borst met zwarte 'strop'"], 
    locationTip: "Komt overal voor waar bomen, struiken of nestkasten zijn.", imageUrl: "" 
  },
  "cyanistes caeruleus": { 
    dutchName: "Pimpelmees", scientificName: "Cyanistes caeruleus",
    wikiSummary: "De pimpelmees is een kleine vogel met een opvallend blauw petje en blauwe vleugels.",
    identification: ["Blauw petje en vleugels", "Witte wangen met zwarte oogstreep"], 
    locationTip: "Hangt vaak acrobatisch aan dunne takjes.", imageUrl: "" 
  },
  "falco tinnunculus": {
    dutchName: "Torenvalk", scientificName: "Falco tinnunculus",
    wikiSummary: "De torenvalk staat bekend om zijn vermogen om in de lucht te 'bidden' (stilhangen op één plek).",
    identification: ["Biddende vlucht", "Roestbruine rug", "Lange staart"],
    locationTip: "Vaak te zien boven braakliggende terreinen.", imageUrl: ""
  },
  "erithacus rubecula": {
    dutchName: "Roodborst", scientificName: "Erithacus rubecula",
    wikiSummary: "De roodborst is herkenbaar aan zijn feloranje borst en gezicht. Hij is vrij tam.",
    identification: ["Oranjerode borst en gezicht", "Grote zwarte kraaloogjes"],
    locationTip: "Komt vaak dichtbij als je in de tuin werkt.", imageUrl: ""
  },
  "turdus merula": { 
    dutchName: "Merel", scientificName: "Turdus merula",
    wikiSummary: "De merel is herkenbaar aan het zwarte verenkleed en de oranjegele snavel bij het mannetje.",
    identification: ["Mannetje zwart met oranje snavel", "Vrouwtje donkerbruin"], 
    locationTip: "Algemeen in tuinen en parken.", imageUrl: "" 
  },
  "passer domesticus": { 
    dutchName: "Huismus", scientificName: "Passer domesticus",
    wikiSummary: "De huismus leeft altijd in de nabijheid van mensen. Het mannetje heeft een grijze kruin en zwarte bef.",
    identification: ["Mannetje met zwarte bef", "Vrouwtje bruingrijs gestreept"], 
    locationTip: "Zoek ze in hagen bij woningen.", imageUrl: "" 
  },
  "apis mellifera": { 
    dutchName: "Honingbij", scientificName: "Apis mellifera",
    wikiSummary: "De honingbij is essentieel voor de bestuiving van bloemen en bomen in de stad.",
    identification: ["Goudbruin behaard", "Gestreepte achterlijf"], 
    locationTip: "Te vinden op bloemenrijke borders.", imageUrl: "" 
  }
};

export const getSpeciesInfo = (scientificName: string): SpeciesDetail => {
  const cleanName = scientificName.toLowerCase().trim();
  const entry = SPECIES_KNOWLEDGE[cleanName];
  if (entry) return { ...entry };
  return {
    dutchName: scientificName,
    scientificName: scientificName,
    identification: ["Let op de specifieke vorm en kleurpatronen van deze soort."],
    locationTip: "Deze soort komt veelvuldig voor in de Nederlandse stadsnatuur.",
    imageUrl: ""
  };
};
