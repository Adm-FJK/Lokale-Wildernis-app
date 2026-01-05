import { useState, useEffect, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  X, 
  Navigation, 
  ChevronDown, 
  Bird, 
  Bug, 
  ShieldAlert, 
  Calendar, 
  Info, 
  Snowflake,
  HelpCircle
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
  const [showInfo, setShowInfo] = useState(false);
  const [isCategoryMenuOpen, setIsCategoryMenuOpen] = useState(false);
  const [isMonthMenuOpen, setIsMonthMenuOpen] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const categoryRef = useRef<HTMLDivElement>(null);
  const monthRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const top15QuestionRef = useRef<HTMLDivElement>(null);
  const redListQuestionRef = useRef<HTMLDivElement>(null);
  const searchTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (showInfo) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [showInfo]);

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
    
    // Auto-scroll logic refined for sticky header
    const scrollTimer = setTimeout(() => {
      if (mainRef.current) {
        mainRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 200);
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
  const isTop15Category = activeCategory === Category.BIRDS || activeCategory === Category.BUTTERFLIES || activeCategory === Category.INSECTS;

  const openTop15Info = () => {
    setShowInfo(true);
    setTimeout(() => {
      top15QuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  const openRedListInfo = () => {
    setShowInfo(true);
    setTimeout(() => {
      redListQuestionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-[#FDFDFB] pb-40 w-full relative">
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
          
          <button 
            onClick={() => setShowInfo(true)}
            className="mt-8 flex items-center gap-2.5 px-5 py-2.5 border border-white/20 rounded-full text-white/70 hover:text-white hover:border-white hover:bg-white/5 transition-all text-[10px] font-black uppercase tracking-widest group"
          >
            <Info size={14} className="text-emerald-500" />
            Over deze tool
          </button>
        </div>
      </section>

      {/* Info Overlay */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8 animate-fadeIn">
          <div className="absolute inset-0 bg-stone-950/90 backdrop-blur-xl" onClick={() => setShowInfo(false)} />
          <div className="relative bg-white w-full max-w-2xl max-h-[85vh] rounded-3xl shadow-2xl flex flex-col border border-stone-200 overflow-hidden">
            <button 
              onClick={() => setShowInfo(false)} 
              className="absolute top-4 right-4 p-3 text-stone-400 hover:text-stone-900 transition-all active:scale-90 z-[110] bg-white/60 backdrop-blur-md rounded-full shadow-sm"
            >
              <X size={28} strokeWidth={2.5} />
            </button>

            <div className="flex-1 overflow-y-auto p-6 sm:p-10 md:p-12 lg:p-16">
              <div className="mb-12">
                <div className="h-1.5 w-12 bg-emerald-600 mb-6 rounded-full"></div>
                <h2 className="text-3xl md:text-4xl font-serif font-bold text-stone-900 tracking-tighter uppercase">Over deze tool</h2>
              </div>
              <div className="space-y-12">
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Wat doet deze tool?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    Deze tool visualiseert actuele biodiversiteitsdata voor elke locatie in Nederland. Het bundelt waarnemingen uit databases om een overzicht te geven van de meest voorkomende soorten van dit moment. Daarnaast koppelt het recente waarnemingsdata aan de officiële Rode Lijsten, om te zien welke soorten een bedreigde status hebben op nationaal of internationaal niveau.
                  </p>
                </div>
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Waar komt de data vandaan?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    De data is afkomstig uit <a href="https://www.gbif.org/" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700">GBIF</a>, een internationale digitale database die natuurgegevens van over de hele wereld koppelt. Voor Nederland bevat dit gegevens van onder andere waarneming.nl, onderzoeksinstituten, universities en natuurbeschermingsorganisaties.
                  </p>
                </div>
                <div ref={top15QuestionRef} className="animate-fadeIn scroll-mt-8">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Hoe wordt de top 15-soortenlijst samengesteld?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    De top 15 wordt berekend op basis van natuurdata van de afgelopen drie year (2023-2025). Per locatie wordt er in een gebied van circa 18x11 kilometer gekeken hoeveel unieke waarnemingen er voor elke soort zijn gedaan in de geselecteerde maand. De soorten die het vaakst zijn doorgegeven aan platforms zoals <a href="http://waarneming.nl/" target="_blank" rel="noopener noreferrer" className="underline hover:text-emerald-700">Waarneming.nl</a> en vervolgens in de internationale GBIF-database zijn beland, vormen de top 15.
                  </p>
                </div>
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Waarom zie ik minder dan 15 soorten in de lijst staan?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    Dat kan gebeuren als er in de door jou gekozen maand en regio niet genoeg verschillende soorten zijn doorgegeven aan de database. De app toont alleen soorten die in de afgelopen drie jaar (2023-2025) daadwerkelijk zijn waargenomen. Vooral in de koude wintermaanden worden er minder insecten geregistreerd, waardoor de lijst korter kan zijn dan de maximaal 15 soorten. Daarnaast worden er in sommige gebieden soms minder soorten waargenomen en doorgegeven.
                  </p>
                </div>
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Waarom staat een zeldzame soort hoog in de lijst?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    De top 15 wordt bepaald door het <em>aantal</em> waarnemingen in de database. Soms kan een zeldzame soort hoog eindigen. Dit kan bijvoorbeeld voorkomen wanneer een groep biologen onderzoek doet naar één specifieke zeldzame soort in de regio. Er komen dan in één keer heel veel meldingen in de database.
                  </p>
                </div>
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Wat is het waarnemingseffect?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    Het waarnemingseffect betekent dat de lijst niet alleen laat zien wat er in de natuur leeft, maar ook waar mensen graag naar kijken. Soorten die opvallen (zoals een felgekleurde vlinder) of op makkelijk bereikbare plekken zitten (zoals in een stadspark), worden vaker doorgegeven dan onopvallende soorten in afgelegen gebieden. Hierdoor staan 'populaire' soorten vaak hoger in de lijst dan soorten die wel veel voorkomen, maar minder vaak worden gemeld.
                  </p>
                </div>
                <div ref={redListQuestionRef} className="animate-fadeIn scroll-mt-8">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Wat is het verschil tussen de Nederlandse rode lijst en die van de IUCN?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    De IUCN-status kijkt naar hoe het wereldwijd met een soort gaat. Een soort kan wereldwijd heel algemeen zijn (status: <em>Niet bedreigd</em>), maar in Nederland ontzettend zeldzaam of zelfs bijna verdwenen. De Nederlandse Rode Lijst is specifiek door de overheid opgesteld voor onze eigen natuur en bevat soorten die specifiek in Nederland zeldzaam zijn en/of sterk in aantal afnemen.
                  </p>
                </div>
                <div className="animate-fadeIn">
                  <h3 className="text-xl font-serif font-bold text-emerald-900 mb-3">Waarom zie ik soms een verouderde IUCN-status?</h3>
                  <p className="text-stone-600 leading-relaxed font-serif italic text-base md:text-lg border-l-4 border-stone-100 pl-6">
                    Natuurdata is altijd in beweging. Er kan een vertraging optreden bij de synchronisatie tussen de bronorganisaties (IUCN) en de centrale databases van GBIF. De meest actuele status is ook te vinden op de officiële website van de IUCN of het Nederlands Soortenregister.
                  </p>
                </div>
              </div>
              <div className="mt-16 pt-8 border-t border-stone-100">
                <p className="text-[10px] font-black uppercase tracking-widest text-stone-300">Lokale Wildernis © 2025</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Filter Header - Fixed sticky bug and simplified mobile border logic */}
      <div className="sticky top-0 z-[60] bg-white border-b border-stone-200 shadow-sm md:shadow-md">
        <div className="max-w-screen-xl mx-auto px-0 md:px-4 md:py-6">
          <div className="flex flex-col md:flex-row md:gap-4">
            <div className="flex md:flex-1 md:gap-4">
              <div ref={searchRef} className="flex-1 relative border-r md:border border-stone-200 bg-white md:rounded-sm md:shadow-sm transition-all hover:shadow-md group h-16 md:h-20 min-w-0">
                {isSearching ? (
                  <div className="absolute inset-0 bg-white md:rounded-sm z-50 flex items-center px-4 md:px-6">
                    <Search size={16} className="text-emerald-600 mr-3 shrink-0" />
                    <input type="text" placeholder="Kies een locatie" autoFocus className="w-full bg-transparent outline-none font-bold uppercase tracking-wider text-[10px] md:text-sm text-stone-900 placeholder:text-stone-400 md:placeholder:text-stone-500" value={searchQuery} onChange={(e) => handleSearchChange(e.target.value)} />
                    <button onClick={() => setIsSearching(false)} className="p-2 text-stone-400 hover:text-stone-900"><X size={16} /></button>
                  </div>
                ) : (
                  <button onClick={() => { setIsSearching(true); setIsMonthMenuOpen(false); setIsCategoryMenuOpen(false); }} className="w-full h-full flex items-center gap-3 px-4 md:px-6 hover:bg-stone-50 md:hover:bg-white transition-colors text-left min-w-0">
                    <MapPin size={16} className="text-emerald-600 flex-shrink-0" />
                    <div className="min-w-0 truncate">
                      <span className="block text-[7px] md:text-[10px] font-black text-stone-600 md:text-stone-800 uppercase tracking-widest mb-0 truncate">Locatie</span>
                      <span className={`block text-[10px] md:text-sm font-bold uppercase tracking-wider truncate ${!selectedCity ? 'text-stone-400 md:text-stone-500' : 'text-stone-900'}`}>{selectedCity ? selectedCity.name : 'Kies een locatie'}</span>
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
                        <span className="font-bold uppercase tracking-wider text-[11px] md:text-sm">{city.name}</span>
                        {city.fullName && city.fullName !== city.name && <span className="text-[9px] md:text-[11px] opacity-60 italic truncate">{city.fullName}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div ref={monthRef} className="relative flex-1 bg-white md:border md:border-stone-200 md:rounded-sm md:shadow-sm transition-all hover:shadow-md h-16 md:h-20 min-w-0">
                <button onClick={() => { setIsMonthMenuOpen(!isMonthMenuOpen); setIsSearching(false); setIsCategoryMenuOpen(false); }} className="w-full h-full flex items-center justify-between px-4 md:px-6 hover:bg-stone-50 md:hover:bg-white transition-colors text-left min-w-0">
                  <div className="min-w-0 truncate">
                    <span className="block text-[7px] md:text-[10px] font-black text-stone-600 md:text-stone-800 uppercase tracking-widest mb-0 truncate">Maand</span>
                    <span className={`block text-[10px] md:text-sm font-bold uppercase tracking-wider truncate ${!selectedMonth ? 'text-stone-400 md:text-stone-500' : 'text-stone-900'}`}>{selectedMonth ? MONTHS[selectedMonth - 1] : 'Selecteer maand'}</span>
                  </div>
                  <ChevronDown className={`text-stone-400 transition-transform duration-300 shrink-0 ${isMonthMenuOpen ? 'rotate-180' : ''}`} size={14} />
                </button>
                {isMonthMenuOpen && (
                  <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 md:rounded-sm shadow-2xl z-[60] mt-2 max-h-80 overflow-y-auto animate-fadeIn">
                    {MONTHS.map((m, i) => (
                      <button key={m} onClick={() => { setSelectedMonth(i + 1); setIsMonthMenuOpen(false); }} className={`w-full flex items-center gap-4 p-4 transition-colors border-b border-stone-50 last:border-0 ${selectedMonth === i + 1 ? 'bg-emerald-50 text-emerald-900 font-bold' : 'hover:bg-stone-50 text-stone-600'}`}>
                        <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">{m}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div ref={categoryRef} className="relative bg-white md:flex-1 md:border md:border-stone-200 md:rounded-sm md:shadow-sm transition-all hover:shadow-md h-14 md:h-20 w-full">
              <button onClick={() => { setIsCategoryMenuOpen(!isCategoryMenuOpen); setIsSearching(false); setIsMonthMenuOpen(false); }} className="w-full h-full flex items-center justify-between px-4 md:px-6 hover:bg-stone-50 md:hover:bg-white transition-colors text-left min-w-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="text-emerald-600 shrink-0"><CategoryIcon cat={activeCategory} size={16} /></div>
                  <div className="min-w-0">
                    <span className="block text-[7px] md:text-[10px] font-black text-stone-600 md:text-stone-800 uppercase tracking-widest mb-0 truncate">Wat zoek je?</span>
                    <span className={`block text-[10px] md:text-sm font-bold uppercase tracking-wider truncate ${!activeCategory ? 'text-stone-400 md:text-stone-500' : 'text-stone-900'}`}>{activeCategory || 'Maak een keuze...'}</span>
                  </div>
                </div>
                <ChevronDown className={`text-stone-400 transition-transform duration-300 shrink-0 ${isCategoryMenuOpen ? 'rotate-180' : ''}`} size={16} />
              </button>
              {isCategoryMenuOpen && (
                <div className="absolute top-full left-0 right-0 bg-white border border-stone-200 md:rounded-sm shadow-2xl z-[60] mt-2 animate-fadeIn overflow-hidden">
                  {(Object.values(Category) as Category[]).map((cat) => (
                    <button key={cat} onClick={() => { setActiveCategory(cat); setIsCategoryMenuOpen(false); }} className={`w-full flex items-center gap-4 p-5 transition-colors border-b border-stone-50 last:border-0 ${activeCategory === cat ? 'bg-emerald-50 text-emerald-900' : 'hover:bg-stone-50 text-stone-600'}`}>
                      <div className={activeCategory === cat ? 'text-emerald-600' : 'text-stone-400'}><CategoryIcon cat={cat} size={16} /></div>
                      <span className="font-bold uppercase tracking-widest text-[10px] md:text-xs">{cat}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main ref={mainRef} className="bg-white scroll-mt-40 md:scroll-mt-64">
        <div className="max-w-screen-xl mx-auto p-4 md:p-12">
          {!selectedCity ? (
            <div className="py-24 md:py-32 flex flex-col items-center text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                <MapPin size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tighter uppercase">Kies een Locatie</h2>
              <p className="text-stone-400 font-serif italic text-lg max-sm text-center">Selecteer je locatie om lokale waarnemingen te ontdekken</p>
            </div>
          ) : !selectedMonth ? (
            <div className="py-24 md:py-32 flex flex-col items-center text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                <Calendar size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tighter uppercase">Selecteer Maand</h2>
              <p className="text-stone-400 font-serif italic text-lg max-sm text-center">Voor welke periode wilt u de lokale natuur bekijken?</p>
            </div>
          ) : !activeCategory ? (
            <div className="py-24 md:py-32 flex flex-col items-center text-center animate-fadeIn">
              <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center mb-8 border border-emerald-100">
                <CategoryIcon cat={null} size={24} className="text-emerald-600" />
              </div>
              <h2 className="text-4xl font-serif font-bold text-stone-900 mb-4 tracking-tighter uppercase">Kies een Categorie</h2>
              <p className="text-stone-400 font-serif italic text-lg max-sm text-center">Selecteer hierboven wat je wilt ontdekken in {selectedCity.name}</p>
            </div>
          ) : loading ? (
            <LoadingScreen />
          ) : (
            <>
              <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between border-b-2 border-stone-900 pb-8 gap-6">
                <div className="min-w-0">
                  <h2 className="text-4xl md:text-5xl font-serif font-bold tracking-tighter leading-none mb-3 text-stone-900 break-words">{selectedCity.name}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`px-3 py-1 text-[9px] font-black uppercase tracking-widest rounded-full border ${isEndangeredCategory ? 'bg-red-50 text-red-600 border-red-100' : 'bg-stone-100 text-stone-500 border-stone-200'}`}>{activeCategory}</span>
                    <span className="text-stone-300">•</span>
                    <span className="text-[10px] font-black text-stone-400 uppercase tracking-widest">{MONTHS[selectedMonth - 1]}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 sm:justify-end">
                  {isEndangeredCategory && (
                    <div className="flex flex-col gap-2 items-start sm:flex-row sm:items-center">
                      <button 
                        onClick={openRedListInfo}
                        className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-emerald-950 transition-all duration-300 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md active:scale-95 shrink-0 w-fit cursor-pointer"
                      >
                        <div className="bg-emerald-600 rounded-full p-1 text-white">
                          <HelpCircle size={12} strokeWidth={2.5} />
                        </div>
                        <span className="text-xs font-serif font-bold italic tracking-tight leading-none">Uitleg Rode Lijst</span>
                      </button>

                      <button 
                        onClick={() => setShowIucnLegend(!showIucnLegend)} 
                        className="flex items-center gap-3 px-4 py-2 bg-stone-100 border border-stone-200 rounded-full text-stone-900 transition-all hover:bg-stone-200 active:scale-95 shrink-0 w-fit"
                      >
                        <Info size={14} strokeWidth={2.5} className="text-stone-900 fill-stone-900/10" />
                        <span className="text-[9px] font-black uppercase tracking-widest leading-none">Rode Lijstcategorieën</span>
                        <div className={`transition-transform duration-300 ${showIucnLegend ? 'rotate-180' : ''}`}>
                          <ChevronDown size={14} strokeWidth={3} className="text-stone-900" />
                        </div>
                      </button>
                    </div>
                  )}
                  {isTop15Category && (
                    <button 
                      onClick={openTop15Info}
                      className="flex items-center gap-3 px-4 py-2.5 bg-emerald-50/50 border border-emerald-100 rounded-2xl text-emerald-950 transition-all duration-300 hover:bg-emerald-50 hover:border-emerald-300 hover:shadow-md active:scale-95 shrink-0 w-fit cursor-pointer"
                    >
                      <div className="bg-emerald-600 rounded-full p-1 text-white">
                        <HelpCircle size={12} strokeWidth={2.5} />
                      </div>
                      <span className="text-xs font-serif font-bold italic tracking-tight leading-none">Uitleg top 15</span>
                    </button>
                  )}
                </div>
              </div>

              {/* RESTORED: Legend block for endangered species */}
              {isEndangeredCategory && showIucnLegend && (
                <div className="mb-12 bg-white border border-stone-200 rounded-2xl p-6 md:p-10 shadow-xl animate-fadeIn">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-12 text-left">
                    {RED_LIST_LEGEND.map((item, idx) => {
                      const isEB = item.title.includes('Ernstig');
                      const isBE = item.title.includes('Bedreigd');
                      const isKW = item.title.includes('Kwetsbaar');
                      const badgeText = isEB ? 'EB/CR' : isBE ? 'BE/EN' : isKW ? 'KW/VU' : 'GE/NT';
                      const badgeColor = isEB || isBE ? 'bg-red-50 text-red-600 border-red-100' : isKW ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-stone-50 text-stone-500 border-stone-200';

                      return (
                        <div key={idx} className="flex flex-col sm:flex-row gap-4 sm:gap-6">
                          <div className={`shrink-0 w-14 h-14 rounded-xl border flex items-center justify-center text-[9px] font-black text-center leading-tight p-2 ${badgeColor}`}>
                            {badgeText}
                          </div>
                          <div className="space-y-2 flex-1">
                            <h4 className="text-sm font-bold text-stone-900 tracking-tight">{item.title}</h4>
                            <ul className="space-y-2">
                              {item.bullets.map((bullet, bIdx) => (
                                <li key={bIdx} className="flex gap-2 text-[11px] text-stone-600 leading-relaxed">
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

              {/* RESTORED: Winter month warning for insects */}
              {isInsectCategory && isWinterMonth && (
                <div className="mb-12 bg-stone-50 border-l-4 border-stone-300 p-6 md:p-8 flex items-start gap-4 md:gap-6 animate-fadeIn">
                  <Snowflake size={24} className="text-stone-400 shrink-0 mt-1" />
                  <div>
                    <h4 className="text-[9px] font-black uppercase tracking-widest text-stone-400 mb-2">Winternotitie</h4>
                    <p className="text-base font-serif italic text-stone-600 leading-relaxed">In de winter zijn de meeste insecten in rust. Je vindt ze dan niet in de lucht, maar verscholen als eitje, larve of pop. De waarnemingen in deze lijst kunnen daarom ook betrekking hebben op deze (onvolwassen) rustende stadia. Sommige soorten overwinteren als volwassen insect. </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-x-4 md:gap-x-8 gap-y-12 md:gap-y-16 animate-fadeIn">
                {speciesList.map((species, index) => (
                  <div key={species.key} onClick={() => setSelectedSpecies(species)} className="group cursor-pointer flex flex-col min-w-0">
                    <div className="relative aspect-square mb-4 bg-stone-100 border border-stone-200 overflow-hidden transition-all duration-500 group-hover:border-emerald-600 shadow-sm group-hover:shadow-lg">
                      <img src={species.imageUrl} alt={species.scientificName} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all duration-700 group-hover:scale-105" loading="lazy" />
                      <div className="absolute top-0 left-0 bg-white/90 px-2.5 py-1 border-b border-r border-stone-100 z-10"><span className="text-stone-900 text-xs font-serif font-bold italic">{(index + 1).toString().padStart(2, '0')}</span></div>
                    </div>
                    <h3 className="text-stone-900 font-bold text-base md:text-lg leading-tight font-serif mb-1 group-hover:text-emerald-700 break-words">{species.dutchName}</h3>
                    <p className="text-[9px] text-stone-400 italic mb-3 break-words">{species.scientificName}</p>
                    {species.conservationStatus && (
                      <span className={`mt-auto inline-block px-2 py-0.5 text-[8px] font-black uppercase tracking-widest rounded border w-fit ${isEndangeredCategory ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'}`}>{species.conservationStatus}</span>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <SpeciesDetail species={selectedSpecies} onClose={() => setSelectedSpecies(null)} activeCategory={activeCategory || undefined} />
    </div>
  );
};

export default App;