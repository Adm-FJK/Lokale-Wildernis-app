
import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, MapPin, X, Navigation, ChevronDown, ChevronUp, 
  Bird, Bug, ShieldAlert, Calendar, Info, Snowflake 
} from 'lucide-react';
import { Category, SpeciesRecord, City } from './types';
import { MONTHS } from './constants';
import { fetchTopSpecies } from './services/gbifService';
import { fetchEndangeredSpecies } from './services/nbaService';
import { searchDutchCities } from './services/locationService';
import LoadingScreen from './components/LoadingScreen';
import SpeciesDetail from './components/SpeciesDetail';

const ButterflyIcon = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 11c1 0 1.5 1.5 1.5 3c0 2-1 3.5-1.5 3.5s-1.5-1.5-1.5-3.5c0-1.5.5-3 1.5-3z" />
    <path d="M11 11c-.5-2-1.5-3-3.5-3.5" />
    <path d="M13 11c.5-2-1.5-3 3.5-3.5" />
    <path d="M10.5 13.5C6 9 2 11 2 15.5c0 3 4 4 8.5 3" />
    <path d="M10.5 18c-2 0-5 1-5 4 0 2 4 2 6.5-1" />
    <path d="M13.5 13.5C18 9 22 11 22 15.5c0 3-4 4-8.5 3" />
    <path d="M13.5 18c2 0 5 1 5 4 0 2-4 2-6.5-1" />
  </svg>
);

const App: React.FC = () => {
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState<Category | null>(null);
  const [speciesList, setSpeciesList] = useState<(SpeciesRecord & { dutchName?: string })[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<(SpeciesRecord & { dutchName?: string }) | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<City[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<any>(null);

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
    } catch (error) {
      console.error(error);
      setSpeciesList([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedCity && selectedMonth && activeCategory) {
      loadData();
      setTimeout(() => mainRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    }
  }, [selectedCity, selectedMonth, activeCategory]);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (val.trim().length >= 2) {
      searchTimeout.current = setTimeout(async () => {
        const results = await searchDutchCities(val);
        setSearchResults(results);
      }, 500);
    } else {
      setSearchResults([]);
    }
  };

  const useCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setSelectedCity({ name: 'Mijn Locatie', lat: pos.coords.latitude, lng: pos.coords.longitude });
        setIsSearching(false);
        setSearchQuery('');
      });
    }
  };

  const CategoryIcon = ({ cat, size = 14, className = "" }: { cat: Category | null, size?: number, className?: string }) => {
    if (!cat) return <Search size={size} className={className} />;
    switch (cat) {
      case Category.BIRDS: return <Bird size={size} className={className} />;
      case Category.BUTTERFLIES: return <ButterflyIcon size={size} className={className} />;
      case Category.INSECTS: return <Bug size={size} className={className} />;
      case Category.ENDANGERED: 
      case Category.ENDANGERED_NL: return <ShieldAlert size={size} className={className} />;
      default: return <Search size={size} className={className} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] pb-40">
      <section className="bg-[#111111] text-white px-6 py-16 md:py-24 border-b-[8px] border-emerald-900">
        <div className="max-w-screen-xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-10 h-1 bg-emerald-500"></div>
            <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400">Data gedreven natuurgids</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-serif font-bold tracking-tighter mb-8 leading-[0.9] uppercase max-w-2xl">Lokale<br />wildernis</h1>
          <p className="text-lg md:text-xl text-stone-400 font-serif italic max-w-xl leading-relaxed">Ontdek de top 15 meest waargenomen soorten van deze maand.</p>
        </div>
      </section>

      <div className="sticky top-0 z-40 bg-stone-100 border-b border-stone-200">
        <div className="max-w-screen-xl mx-auto px-0 md:px-4 md:py-6 flex flex-col md:flex-row md:gap-4">
          <div className="flex border-b md:border-0 border-stone-200 h-16 md:h-20 md:flex-1 md:gap-4">
            <div ref={searchRef} className="flex-1 relative border-r md:border border-stone-200 md:bg-white transition-all">
              {isSearching ? (
                <div className="absolute inset-0 bg-white z-50 flex items-center px-4">
                  <Search size={16} className="text-emerald-600 mr-3" />
                  <input type="text" placeholder="Kies een locatie" autoFocus className="w-full outline-none text-xs font-bold uppercase" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} />
                  <button onClick={() => setIsSearching(false)} className="p-2"><X size={16} /></button>
                </div>
              ) : (
                <button onClick={() => setIsSearching(true)} className="w-full h-full flex items-center gap-3 px-6 text-left">
                  <MapPin size={16} className="text-emerald-600" />
                  <div>
                    <span className="block text-[7px] font-black uppercase">Locatie</span>
                    <span className="block text-xs font-bold uppercase">{selectedCity ? selectedCity.name : 'Kies locatie'}</span>
                  </div>
                </button>
              )}
              {isSearching && (searchQuery || searchResults.length > 0) && (
                <div className="absolute top-full left-0 right-0 bg-white border shadow-2xl z-[60] mt-2 max-h-80 overflow-y-auto">
                  <button onClick={useCurrentLocation} className="w-full flex items-center gap-3 p-4 hover:bg-emerald-50 text-[9px] font-black uppercase">
                    <Navigation size={12} /> Huidige locatie
                  </button>
                  {searchResults.map(city => (
                    <div key={`${city.lat}-${city.lng}`} onClick={() => { setSelectedCity(city); setIsSearching(false); }} className="p-4 hover:bg-stone-900 hover:text-white cursor-pointer border-b">
                      <span className="font-bold uppercase text-[11px]">{city.name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div ref={monthRef} className="relative flex-1 md:bg-white md:border border-stone-200 h-full">
              <button onClick={() => setIsMonthMenuOpen(!isMonthMenuOpen)} className="w-full h-full flex items-center justify-between px-6 text-left">
                <div>
                  <span className="block text-[7px] font-black uppercase">Maand</span>
                  <span className="block text-xs font-bold uppercase">{selectedMonth ? MONTHS[selectedMonth - 1] : 'Selecteer maand'}</span>
                </div>
                <ChevronDown size={14} className={isMonthMenuOpen ? 'rotate-180' : ''} />
              </button>
              {isMonthMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border shadow-2xl z-[60] mt-2 max-h-80 overflow-y-auto">
                  {MONTHS.map((m, i) => (
                    <button key={m} onClick={() => { setSelectedMonth(i + 1); setIsMonthMenuOpen(false); }} className="w-full p-4 border-b text-[10px] font-bold uppercase hover:bg-emerald-50">
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div ref={categoryRef} className="relative bg-stone-50 md:bg-white md:flex-1 md:border border-stone-200 h-14 md:h-20">
            <button onClick={() => setIsCategoryMenuOpen(!isCategoryMenuOpen)} className="w-full h-full flex items-center justify-between px-6 text-left">
              <div className="flex items-center gap-3">
                <CategoryIcon cat={activeCategory} size={16} className="text-emerald-600" />
                <div>
                  <span className="block text-[7px] font-black uppercase">Wat zoek je?</span>
                  <span className="block text-xs font-bold uppercase">{activeCategory || 'Maak keuze...'}</span>
                </div>
              </div>
              <ChevronDown size={16} className={isCategoryMenuOpen ? 'rotate-180' : ''} />
            </button>
            {isCategoryMenuOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border shadow-2xl z-50 mt-2">
                {Object.values(Category).map((cat) => (
                  <button key={cat} onClick={() => { setActiveCategory(cat); setIsCategoryMenuOpen(false); }} className="w-full flex items-center gap-4 p-5 border-b hover:bg-emerald-50 text-[10px] font-bold uppercase">
                    <CategoryIcon cat={cat} size={16} /> {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main ref={mainRef} className="bg-white">
        <div className="max-w-screen-xl mx-auto p-4 md:p-12">
          {!selectedCity || !selectedMonth || !activeCategory ? (
            <div className="py-24 flex flex-col items-center text-center opacity-40">
              <Info size={48} className="mb-6" />
              <h2 className="text-2xl font-serif font-bold uppercase">Maak een selectie hierboven</h2>
            </div>
          ) : loading ? (
            <LoadingScreen />
          ) : (
            <>
              <div className="mb-8 border-b-2 border-stone-900 pb-8">
                <h2 className="text-5xl font-serif font-bold tracking-tighter mb-3">{selectedCity.name}</h2>
                <div className="flex items-center gap-3 text-[10px] font-black uppercase text-stone-400">
                  <span className="text-emerald-600">{activeCategory}</span>
                  <span>•</span>
                  <span>{MONTHS[selectedMonth - 1]}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-x-8 gap-y-16">
                {speciesList.map((species, index) => (
                  <div key={species.key} onClick={() => setSelectedSpecies(species)} className="group cursor-pointer">
                    <div className="relative aspect-square mb-5 border overflow-hidden shadow-sm group-hover:border-emerald-600 transition-all">
                      <img src={species.imageUrl} alt={species.scientificName} className="w-full h-full object-cover grayscale-[0.3] group-hover:grayscale-0 transition-all" />
                      <div className="absolute top-0 left-0 bg-white/90 px-3 py-1 text-xs font-serif italic border-b border-r">{(index + 1).toString().padStart(2, '0')}</div>
                    </div>
                    <h3 className="font-serif font-bold text-lg leading-tight mb-1">{species.dutchName}</h3>
                    <p className="text-[10px] text-stone-400 italic mb-2">{species.scientificName}</p>
                    {species.conservationStatus && (
                      <span className="inline-block px-2 py-0.5 text-[8px] font-black uppercase border rounded bg-red-50 text-red-600">{species.conservationStatus}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>

      <SpeciesDetail 
        species={selectedSpecies} 
        onClose={() => setSelectedSpecies(null)} 
        activeCategory={activeCategory || undefined}
        currentMonth={selectedMonth || undefined}
      />
    </div>
  );
};

export default App;
