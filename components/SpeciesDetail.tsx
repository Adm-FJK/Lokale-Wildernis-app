
import React, { useEffect, useState } from 'react';
import { X, ExternalLink, BookOpen, ShieldAlert, Info, Landmark } from 'lucide-react';
import { SpeciesRecord, SpeciesDetail as SpeciesDetailType, Category } from '../types';
import { getSpeciesInfo } from '../services/knowledgeService';
import { fetchWikiImage, fetchWikiDutchData, normalizeScientificName } from '../services/wikiService';
import { IUCN_INFO } from '../services/nbaService';

interface Props {
  species: (SpeciesRecord & { dutchName?: string }) | null;
  onClose: () => void;
  activeCategory?: Category;
  currentMonth?: number;
}

const SpeciesDetail: React.FC<Props> = ({ species, onClose }) => {
  const [details, setDetails] = useState<SpeciesDetailType | null>(null);
  const [highResImage, setHighResImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (species) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [species]);

  useEffect(() => {
    const loadData = async () => {
      if (!species) {
        setDetails(null);
        setHighResImage(null);
        return;
      }

      setLoading(true);
      const normalizedName = normalizeScientificName(species.scientificName);
      const localInfo = getSpeciesInfo(normalizedName);
      let info = { ...localInfo, redListLink: species.redListLink };

      const [wikiData, wikiImage] = await Promise.all([
        fetchWikiDutchData(normalizedName),
        fetchWikiImage(normalizedName)
      ]);
      
      if (wikiData) {
        info.dutchName = wikiData.name;
        info.wikiSummary = wikiData.summary;
        info.wikiUrl = wikiData.url;
      }
      
      setHighResImage(wikiImage);
      setDetails(info);
      setLoading(false);
    };

    loadData();
  }, [species]);

  if (!species || !details) return null;

  const cleanSciName = normalizeScientificName(species.scientificName);
  const waarnemingUrl = `https://waarneming.nl/species/search/?q=${encodeURIComponent(cleanSciName)}&advanced=on`;

  const iucnCodeMatch = species.conservationStatus?.match(/\(([^)]+)\)/);
  const iucnCode = iucnCodeMatch ? iucnCodeMatch[1] : null;
  const iucnDetail = iucnCode ? IUCN_INFO[iucnCode] : null;

  // Samengestelde status tekst bouwen
  const fullStatusText = iucnDetail 
    ? `${iucnDetail.label} / ${iucnDetail.english}` 
    : species.conservationStatus;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-6 transition-opacity duration-300 ${species ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
      <div className="absolute inset-0 bg-stone-900/95 backdrop-blur-md" onClick={onClose} />
      
      <div className={`relative bg-white w-full max-w-5xl transition-all duration-500 ease-out transform ${species ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-12 opacity-0'} h-full sm:h-auto sm:max-h-[92vh] overflow-hidden shadow-[0_35px_60px_-15px_rgba(0,0,0,0.6)] sm:rounded-3xl flex flex-col`}>
        
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 p-4 bg-stone-900 text-white hover:bg-emerald-700 transition-all z-[60] rounded-full shadow-2xl active:scale-90"
        >
          <X size={24} strokeWidth={2.5} />
        </button>

        <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col lg:flex-row bg-white">
          <div className="lg:w-[45%] bg-stone-50 flex shrink-0 border-b lg:border-b-0 lg:border-r border-stone-100 relative">
            <div className="w-full h-full p-8 flex items-center justify-center min-h-[350px] lg:min-h-0">
              <img 
                src={highResImage || species.imageUrl} 
                alt={species.scientificName} 
                className={`max-w-full max-h-[50vh] lg:max-h-[80vh] w-auto h-auto object-contain drop-shadow-[0_20px_50px_rgba(0,0,0,0.2)] transition-all duration-700 ${loading ? 'opacity-20 blur-md' : 'opacity-100'}`}
              />
              {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-emerald-900 border-t-transparent animate-spin rounded-full" />
                </div>
              )}
            </div>
          </div>

          <div className="lg:w-[55%] flex flex-col bg-white overflow-visible lg:overflow-hidden">
            <div className="flex-1 lg:overflow-y-auto p-8 md:p-12 lg:p-16">
              <header className="mb-10">
                <div className="h-1 w-12 bg-emerald-600 mb-6 rounded-full"></div>
                
                {species.conservationStatus && (
                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 bg-red-50 text-red-700 px-4 py-2 rounded-lg border border-red-100 w-fit">
                      <ShieldAlert size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">{fullStatusText}</span>
                    </div>
                    {iucnDetail && (
                      <p className="text-[11px] leading-snug text-stone-500 italic max-w-sm">
                        <span className="font-bold">Internationale IUCN-status ({iucnDetail.english}):</span> {iucnDetail.description}
                      </p>
                    )}
                  </div>
                )}

                <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif font-bold text-stone-900 leading-none mb-3 tracking-tighter uppercase">
                  {details.dutchName}
                </h1>
                <p className="text-lg italic text-stone-400 font-serif">
                  {species.scientificName}
                </p>
              </header>
              
              <div className="prose prose-stone max-w-none mb-12">
                <p className="text-lg md:text-xl text-stone-800 leading-relaxed italic font-serif border-l-4 border-stone-100 pl-6">
                  {details.wikiSummary || "Omschrijving wordt geladen..."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-auto">
                {details.wikiUrl && (
                  <a href={details.wikiUrl} target="_blank" rel="noopener noreferrer" 
                    className="flex items-center justify-center gap-3 py-4 bg-white text-stone-900 border-2 border-stone-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-stone-50 transition-all rounded-xl shadow-lg">
                    <BookOpen size={14} /> Bron Wikipedia
                  </a>
                )}
                
                <a href={waarnemingUrl} target="_blank" rel="noopener noreferrer" 
                  className="flex items-center justify-center gap-3 py-4 bg-emerald-900 text-white text-[10px] font-black uppercase tracking-[0.2em] hover:bg-emerald-800 transition-all rounded-xl shadow-lg">
                  <ExternalLink size={14} /> Waarneming.nl
                </a>

                {details.redListLink && (
                  <a href={details.redListLink} target="_blank" rel="noopener noreferrer" 
                    className="sm:col-span-2 flex items-center justify-center gap-3 py-4 bg-white text-stone-900 border-2 border-stone-900 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-stone-50 transition-all rounded-xl shadow-lg">
                    <Landmark size={14} /> Nederlands Soortenregister
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SpeciesDetail;
