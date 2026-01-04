import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  X, 
  Navigation, 
  ChevronDown, 
  ChevronUp, 
  Bird, 
  Bug, 
  ShieldAlert, 
  Calendar, 
  Info, 
  Snowflake 
} from 'lucide-react';
import { City, Category, SpeciesRecord } from './types.ts';
import { MONTHS } from './constants.ts';
import { fetchTopSpecies } from './services/gbifService.ts';
import { fetchEndangeredSpecies, IUCN_INFO, RED_LIST_LEGEND } from './services/nbaService.ts';
import { searchDutchCities } from './services/locationService.ts';
import LoadingScreen from './components/LoadingScreen.tsx';
import SpeciesDetail from './components/SpeciesDetail.tsx';

const ButterflyIcon = ({ size = 24, className = "" }: { size?: number; className?: string }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 11c1 0 1.5 1.5 1.5 3c0 2-1 3.5-1.5 3.5s-1.5-1.5-1.5-3.5c0-1.5.5-3 1.5-3z" />
    <path d="M11 11c-.5-2-1.5-3-3.5-3.5" />
    <path d="M13 11c.5-2-1.5-3 3.5-3.5" />
    <path d="M10.5 13.5C6 9 2 11 2 15.5c0 3 4 4 8.5 3" />
    <path d="M10.5 18c-2 0-5 1-5 4 0 2 4 2 6.5-1" />
    <path d="M13.5 13.5C18 9 22 11 22 15.5c0 3-4 4-8.5 3" />
    <path d="M13.5 18c2 0 5 1 5 4 0 2-4 2-6.5-1" />
  </svg>
);

const CategoryIcon = ({ cat, size = 14, className = "" }: { cat: Category | null, size?: number, className?: string }) => {
  if (!cat) return <Search size={size} className={className} />;
  switch (cat) {
    case Category.BIRDS: return <Bird size={size} className={className} />;
    case Category.BUTTERFLIES: return <ButterflyIcon size={size} className={className} />;
    case Category.INSECTS: return <Bug size={size} className={className} />;
    case Category.ENDANGERED: return <ShieldAlert size={size} className={className} />;
    case Category.ENDANGERED_NL: return <ShieldAlert size={size} className={className} />;
    default: return <Search size={size} className={className} />;
  }
};

const App: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [speciesList, setSpeciesList] = useState<(SpeciesRecord & { dutchName?: string })[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedSpecies, setSelectedSpecies] = useState<(SpeciesRecord & { dutchName?: string }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showIucnLegend, setShowIucnLegend] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<number | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (searchRef.current && !searchRef.current.contains(target)) setIsSearching(false);
      if (categoryRef.current && !categoryRef.current.contains(target)) setIsCategoryMenuOpen(false);
      if (monthRef.current && !monthRef.current.contains(target)) setIsMonthMenuOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadData = async () => {
    if (!selectedCity || !selectedMonth || !activeCategory) return;
    setLoading(true);
    try {
      let data: (SpeciesRecord & { dutchName?: string })[] = [];
      if (activeCategory === Category.ENDANGERED) {
        data = await fetchEndangeredSpecies(selectedCity.lat, selectedCity.lng, selectedMonth, false);
      } else if (activeCategory === Category.ENDANGERED_NL) {
        data = await fetchEndangeredSpecies(selectedCity.lat, selectedCity.lng, selectedMonth, true);
      } else {
        data = await fetchTopSpecies(activeCategory, selectedCity.lat, selectedCity.lng, selectedMonth);
      }
      setSpeciesList(data);
    } catch (error) { setSpeciesList([]); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (!selectedCity || !selectedMonth || !activeCategory) return;
    loadData();
    setShowIucnLegend(false);
    const scrollTimer = setTimeout(() => {
      if (mainRef.current) mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 150);
    return () => clearTimeout(scrollTimer);
  }, [selectedCity, selectedMonth, activeCategory]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.trim().length >= 2) {
      searchTimeout.current = window.setTimeout(async () => {
        const results = await searchDutchCities(val);
        setSearchResults(results);
      }, 500); 
    } else { setSearchResults([]); }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setSelectedCity({ name: 'Mijn Locatie', lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsSearching(false);
        setSearchQuery('');
      }, (err) => { alert("Locatie toegang geweigerd."); });
    }
  };

  const isWinterMonth = selectedMonth ? (selectedMonth >= 11 || selectedMonth <= 2) : false;
  const isInsectCategory = activeCategory === Category.BUTTERFLIES || activeCategory === Category.INSECTS;
  const isEndangeredCategory = activeCategory === Category.ENDANGERED || activeCategory === Category.ENDANGERED_NL;

  return (
    <div className="min-h-screen bg-[#FDFDFB] pb-40">
      <section className="bg-[#111111] text-white px-6 py-16 md:py-24 border-b-[8px] border-emerald-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-1 bg-emerald-500"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Data gedreven natuurgids</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-8 leading-[0.9] uppercase max-w-2xl">
            Lokale<br />wildernis
          </h1>
          <p className="text-lg md:text-xl text-stone-400 font-serif italic max-w-xl leading-relaxed">
            Ontdek de top 15 meest waargenomen soorten van deze maand, berekend op basis van recente natuur data (<a href="https://www.gbif.org/country/NL/summary" target="_blank" rel="noopener noreferrer" className="underline decoration-stone-600 hover:text-emerald-400 transition-colors">GBIF</a>, 2023-2025). Welke soorten kan je deze maand verwachten?
          </p>
        </div>
      </section>

      <div className="sticky top-0 z-40 bg-stone-100 border-b border-stone-200 shadow-sm md:shadow-none">
        <div className="max-w-screen-xl mx-auto px-0 md:px-4 md:py-6">
          <div className="flex flex-col md:flex-row md:gap-4">
            <div className="flex border-b md:border-0 border-stone-200 h-16 md:h-20 md:flex-1 md:gap-4">
              <div ref={searchRef} className="flex-1 relative border-r md:border border-stone-200 md:bg-white md:rounded-sm md:shadow-sm transition-all hover:shadow-md group">
                {isSearching ? (
                  <div className="absolute inset-0 bg-white md:rounded-sm z-50 flex items-center px-4 md:px-6">
                    <Search size={16} className="text-emerald-600 mr-3" />
                    <input type="text" placeholder="Kies een locatie" autoFocus className="w-full bg-transparent outline-none font-bold uppercase tracking-wider text-xs text-stone-900 placeholder:text-stone-400" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} />
                    <button onClick={() => setIsSearching(false)} className="p-2 text-stone-400 hover:text-stone-900"><X size={16} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setIsSearching(true); setIsMonthMenuOpen(false); setIsCategoryMenuOpen(false); }} className="w-full h-full flex items-center gap-3 px-6 hover:bg-stone-50 md:hover:bg-white transition-colors text-left">
                    <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
                    <div className="truncate">
                      <span className="block text-[7px] font-black text-stone-600 uppercase tracking-widest mb-0">Locatie</span>
                      <span className={`block text-xs font-bold uppercase tracking-wider truncate ${!selectedCity ? 'text-stone-400' : 'text-stone-900'}`}>{selectedCity ? selectedCity.name : 'Kies een locatie'}</span>
                    </div>
                  </button>
                )}
                {isSearching && (searchQuery.trim().length >= 1 || searchResults.length > 0) && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 md:rounded-sm shadow-2xl z-[60] mt-2 max-h-80 overflow-y-auto animate-fadeIn">
                    <button onClick={useCurrentLocation} className="w-full flex items-center gap-3 p-4 hover:bg-emerald-50 text-emerald-800 font-black transition-colors border-b border-stone-100 uppercase text-[9px] tracking-widest">
                      <Navigation size={12} /> Huidige locatie
                    </button>
                    {searchResults.map(city => (
                      <div key={`${city.lat}-${city.lng}-${city.name}`} onClick={() => { setSelectedCity(city); setIsSearching(false); setSearchQuery(''); setSearchResults([]); }} className="p-4 hover:bg-stone-900 hover:text-white cursor-pointer transition-colors border-b border-stone-50 flex flex-col">
                        <span className="font-bold uppercase tracking-wider text-[11px]">{city.name}</span>
                        {city.fullName && city.fullName !== city.name && <span className="text-[9px] opacity-60 italic">{city.fullName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div ref={monthRef} className="relative flex-1 md:bg-white md:border md:border-stone-200 md:rounded-sm md:shadow-sm transition-all hover:shadow-md h-full">
                <button onClick={() => { setIsMonthMenuOpen(!isMonthMenuOpen); setIsSearching(false); setIsCategoryMenuOpen(false); }} className="w-full h-full flex items-center justify-between px-6 hover:bg-stone-50 md:hover:bg-white transition-colors text-left">
                  <div className="truncate">
                    <span className="block text-[7px] font-black text-stone-600 uppercase tracking-widest mb-0">Maand</span>
                    <span className={`block text-xs font-bold uppercase tracking-wider truncate ${!selectedMonth ? 'text-stone-400' : 'text-stone-900'}`}>{selectedMonth ? MONTHS[selectedMonth - 1] : 'Selecteer maand'}</span>
                  </div>
                  <ChevronDown className={`text-stone-400 transition-transform duration-300 ${isMonthMenuOpen ? 'rotate-180' : ''}`} size={14} />
                </button>
                {isMonthMenuOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 md:rounded-sm shadow-2xl z-[60] mt-2 max-h-80 overflow-y-auto animate-fadeIn">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => { setSelectedMonth(i + 1); setIsMonthMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 transition-colors border-b border-stone-50 last:border-0 ${selectedMonth === i + 1 ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-stone-50 text-stone-600'}`}>
                        <span className="font-bold uppercase tracking-widest text-[10px]">{m}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div ref={categoryRef} className="relative bg-stone-50 md:bg-white md:flex-1 md:border md:border-stone-200 md:rounded-sm md:shadow-sm transition-all hover:shadow-md border-b md:border-b border-stone-200 h-14 md:h-20">
              <button onClick={() => { setIsCategoryMenuOpen(!isCategoryMenuOpen); setIsSearching(false); setIsMonthMenuOpen(false); }} className="w-full h-full flex items-center justify-between px-6 hover:bg-stone-50 md:hover:bg-white transition-colors text-left">
                <div className="flex items-center gap-3">
                  <div className="text-emerald-600"><CategoryIcon cat={activeCategory} size={16} /></div>
                  <div>
                    <span className="block text-[7px] font-black text-stone-600 uppercase tracking-widest mb-0">Wat zoek je?</span>
                    <span className={`block text-xs font-bold uppercase tracking-wider ${!activeCategory ? 'text-stone-400' : 'text-stone-900'}`}>{activeCategory || 'Maak een keuze...'}</span>
                  </div>
                </div>
                <ChevronDown className={`text-stone-400 transition-transform duration-300 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} size={16} />
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 md:rounded-sm shadow-2xl z-50 mt-2 animate-fadeIn overflow-hidden">
                  {(Object.values(Category) as Category[]).map((cat) => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setIsCategoryMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 transition-colors border-b border-stone-50 last:border-0 ${activeCategory === cat ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-stone-50 text-stone-600'}`}>
                      <div className={activeCategory === cat ? 'text-emerald-600' : 'text-stone-400'}><CategoryIcon cat={cat} size={16} /></div>
                      <span className="font-bold uppercase tracking-widest text-[10px]">{cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main ref={mainRef} className="bg-white scroll-mt-32 md:scroll-mt-40">
        <div className="max-w-screen-xl mx-auto p-4 md:p-12">
          {!selectedCity ? (
            <div className="py-24 md:py-32 flex flex-col items-center text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                <MapPin size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tighter uppercase">Kies een Locatie</h2>
              <p className="text-stone-400 font-serif italic text-lg max-w-sm text-center">Selecteer je locatie om lokale waarnemingen te ontdekken</p>
            </div>
          ) : !selectedMonth ? (
            <div className="py-24 md:py-32 flex flex-col items-center text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                <Calendar size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tighter uppercase">Selecteer Maand</h2>
              <p className="text-stone-400 font-serif italic text-lg max-w-sm text-center">Voor welke periode wilt u de lokale natuur bekijken?</p>
            </div>
          ) : !activeCategory ? (
            <div className="py-24 md:py-32 flex flex-col items-center text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                <CategoryIcon cat={null} size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tighter uppercase">Kies een Categorie</h2>
              <p className="text-stone-400 font-serif italic text-lg max-w-sm text-center">Selecteer hierboven wat je wilt ontdekken in {selectedCity.name}</p>
            </div>
          ) : loading ? (
            <LoadingScreen />
          ) : (
            <>
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-stone-900 pb-8 gap-4">
                <div>
                  <h2 className="text-5xl font-serif font-bold tracking-tighter leading-none mb-3 text-stone-900">{selectedCity.name}</h2>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${isEndangeredCategory ? 'bg-red-50 text-red-600 border-red-100' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{activeCategory}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{MONTHS[selectedMonth - 1]}</span>
                  </div>
                </div>
                {isEndangeredCategory && (
                  <button onClick={() => setShowIucnLegend(!showIucnLegend)} className="text-[10px] font-black text-stone-400 uppercase tracking-widest flex items-center gap-2 hover:text-stone-900 transition-colors group p-2">
                    <Info size={14} /> Rode Lijstcategorieën {showIucnLegend ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                )}
              </div>

              {activeCategory === Category.ENDANGERED && !loading && speciesList.length > 0 && !showIucnLegend && (
                <div className="mb-12 animate-fadeIn"><p className="text-xl md:text-2xl text-stone-800 leading-relaxed font-serif italic border-l-4 border-red-500 pl-6 py-2 text-left">Overzicht van soorten die op deze locatie zijn waargenomen met een internationaal bedreigde status volgens de IUCN</p></div>
              )}
              {activeCategory === Category.ENDANGERED_NL && !loading && speciesList.length > 0 && !showIucnLegend && (
                <div className="mb-12 animate-fadeIn"><p className="text-xl md:text-2xl text-stone-800 leading-relaxed font-serif italic border-l-4 border-red-500 pl-6 py-2 text-left">Overzicht van soorten die op deze locatie zijn waargenomen en op de Nederlandse Rode Lijst staan</p></div>
              )}
              {isInsectCategory && isWinterMonth && (
                <div className="mb-12 bg-stone-50 border-l-4 border-stone-300 p-8 flex items-start gap-6 animate-fadeIn">
                  <Snowflake size={24} className="text-stone-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 mb-2 text-left">Winternotitie</h4>
                    <p className="text-lg font-serif italic text-stone-600 leading-relaxed text-left">In de winter zijn de meeste insecten in rust. Je vindt ze dan niet in de lucht, maar verscholen als eitje, larve of pop. De waarnemingen in deze lijst kunnen daarom ook betrekking hebben op deze (onvolwassen) rustende stadia. Sommige soorten overwinteren als volwassen insect.</p>
                  </div>
                </div>
              )}
              {isEndangeredCategory && showIucnLegend && (
                <div className="mb-12 bg-white border border-stone-200 rounded-2xl p-6 md:p-10 shadow-xl animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12">
                    {RED_LIST_LEGEND.map((item, idx) => {
                      // Bepaal badge code gebaseerd op titel tekst
                      const isEB = item.title.includes('Ernstig');
                      const isBE = item.title.includes('Bedreigd');
                      const isKW = item.title.includes('Kwetsbaar');
                      const isGE = item.title.includes('Gevoelig');
                      const badgeText = isEB ? 'EB/CR' : isBE ? 'BE/EN' : isKW ? 'KW/VU' : 'GE/NT';
                      const badgeColor = isEB || isBE ? 'bg-red-50 text-red-600 border-red-100' : isKW ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-stone-50 text-stone-500 border-stone-200';

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <div className={`shrink-0 w-16 h-16 rounded-xl border flex items-center justify-center text-[10px] font-black text-center leading-tight p-2 ${badgeColor}`}>
                            {badgeText}
                          </div>
                          <div className="space-y-3 flex-1">
                            <h4 className="text-sm font-bold text-stone-900 tracking-tight">{item.title}</h4>
                            <ul className="space-y-3">
                              {item.bullets.map((bullet, bIdx) => (
                                <li key={bIdx} className="flex gap-2 text-[12px] text-stone-600 leading-relaxed text-left">
                                  <span className="shrink-0 text-emerald-600">•</span>
                                  <span>{bullet}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-8 gap-y-16 animate-fadeIn">
                {speciesList.map((species, index) => (
                  <div key={species.key} onClick={() => setSelectedSpecies(species)} className="group cursor-pointer flex flex-col">
                    <div className="relative aspect-square mb-5 bg-stone-100 border border-stone-200 overflow-hidden transition-all duration-500 group-hover:border-emerald-600 shadow-sm group-hover:shadow-xl">
                      <img src={species.imageUrl} alt={species.scientificName} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" loading="lazy" />
                      <div className="absolute top-0 left-0 bg-white/90 px-3 py-1 border-b border-r border-stone-100 z-10"><span className="text-stone-900 text-sm font-serif font-bold italic">{(index + 1).toString().padStart(2, '0')}</span></div>
                    </div>
                    <h3 className="text-stone-900 font-bold text-lg leading-tight font-serif mb-1 group-hover:text-emerald-700">{species.dutchName}</h3>
                    <p className="text-[10px] text-stone-400 italic mb-3">{species.scientificName}</p>
                    {species.conservationStatus && (
                      <span className={`mt-auto inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border ${isEndangeredCategory ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{species.conservationStatus}</span>
                    )}
                  </div>
                ))}
                {speciesList.length === 0 && (
                  <div className="col-span-full py-40 text-center border-2 border-dashed border-stone-200 rounded-lg">
                    <div className="flex flex-col items-center"><Info size={48} className="mb-6 text-stone-200" /><p className="text-stone-400 font-serif italic text-2xl mb-2">Geen resultaten gevonden</p><p className="text-stone-300 text-[9px] uppercase tracking-widest font-black">Probeer een andere stad of periode</p></div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
      <SpeciesDetail species={selectedSpecies} onClose={() => setSelectedSpecies(null)} />
    </div>
  );
};

export default App;