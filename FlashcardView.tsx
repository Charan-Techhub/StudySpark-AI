import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Brain, 
  Loader2, 
  RotateCw, 
  Bookmark, 
  BookmarkCheck, 
  Shuffle, 
  ArrowLeft, 
  ArrowRight,
  Check,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Award
} from 'lucide-react';
import { UploadedFile, Flashcard } from '../types';

interface FlashcardViewProps {
  activeDocument: UploadedFile | null;
  uploadedFiles: UploadedFile[];
  onSelectDocument: (doc: UploadedFile) => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success') => void;
}

export default function FlashcardView({
  activeDocument,
  uploadedFiles,
  onSelectDocument,
  onAddNotification
}: FlashcardViewProps) {
  const [cardsCount, setCardsCount] = useState(8);
  const [isCompiling, setIsCompiling] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [practiceMode, setPracticeMode] = useState(false);
  
  // Scoring parameters for testing sessions
  const [masteredCount, setMasteredCount] = useState(0);
  const [reviewedKeys, setReviewedKeys] = useState<Record<string, 'mastered' | 'skipped'>>({});

  const handleGenerateCards = async () => {
    if (!activeDocument) return;
    setIsCompiling(true);
    setFlipped(false);
    setCurrentIndex(0);
    setPracticeMode(true);
    setMasteredCount(0);
    setReviewedKeys({});

    try {
      const response = await fetch('/api/gemini/flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeDocument.extractedText,
          count: cardsCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate cards');
      }

      const data = await response.json();
      const loaded: Flashcard[] = data.flashcards || [];

      setFlashcards(loaded.map(card => ({
        ...card,
        docId: activeDocument.id,
        bookmarked: false
      })));

      onAddNotification(
        'Flashcards Forged',
        `Generated ${cardsCount} smart recall cards for "${activeDocument.name}".`,
        'success'
      );
    } catch (e: any) {
      console.error(e);
      // Dynamic fallback generator from the document's sentences and definitions
      const sentences = (activeDocument?.extractedText || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 180);
      const fallbackList: Flashcard[] = [];
      const countLimit = Math.min(cardsCount, Math.max(3, sentences.length));

      if (sentences.length > 0) {
        for (let i = 0; i < countLimit; i++) {
          const sentence = sentences[i];
          const words = sentence.split(/\s+/).filter(w => w.length > 6 && !['through', 'without', 'between', 'because', 'government', 'education', 'programme'].includes(w.toLowerCase()));
          const keyword = words[0] || 'concept';
          const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          
          fallbackList.push({
            id: `card_fb_${i}`,
            docId: activeDocument?.id || 'doc_mock',
            question: `Explain the meaning and key context of "${capitalizedKeyword}" found in your document`,
            answer: sentence,
            bookmarked: false
          });
        }
      } else {
        // Safe standard fallback if text is entirely empty
        fallbackList.push(
          {
            id: 'card_fb_empty1',
            docId: activeDocument?.id || 'doc_mock',
            question: `What is the core target of studying: "${activeDocument?.name || 'materials'}"?`,
            answer: `The central purpose of studying "${activeDocument?.name || 'this note set'}" is to master its definitions, formulas, and structural principles through deliberate testing.`,
            bookmarked: false
          },
          {
            id: 'card_fb_empty2',
            docId: activeDocument?.id || 'doc_mock',
            question: "Why is active retrieval superior to rereading?",
            answer: "Retrieval practice forces neural triggers pulling facts from mental memory, building long term retention rather than cognitive visual familiarity.",
            bookmarked: false
          }
        );
      }
      setFlashcards(fallbackList);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleBookmark = (cardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlashcards(prev => prev.map(c => {
      if (c.id === cardId) {
        const nextState = !c.bookmarked;
        onAddNotification(
          nextState ? 'Card Bookmarked' : 'Bookmark Removed',
          nextState ? 'Added card to review priorities list.' : 'Removed card from bookmark stack.',
          'info'
        );
        return { ...c, bookmarked: nextState };
      }
      return c;
    }));
  };

  const handleShuffle = () => {
    if (flashcards.length === 0) return;
    setFlipped(false);
    
    // Shuffle logic
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    setFlashcards(shuffled);
    setCurrentIndex(0);
    setMasteredCount(0);
    setReviewedKeys({});

    onAddNotification(
      'Vocabulary Shuffled',
      'The cards stack has been randomly reordered.',
      'info'
    );
  };

  const handleRecordMastery = (status: 'mastered' | 'skipped') => {
    if (flashcards.length === 0) return;
    const currentCard = flashcards[currentIndex];

    setReviewedKeys(prev => {
      const alreadyReviewed = prev[currentCard.id];
      if (alreadyReviewed === 'mastered' && status === 'skipped') {
        setMasteredCount(c => Math.max(0, c - 1));
      } else if (alreadyReviewed !== 'mastered' && status === 'mastered') {
        setMasteredCount(c => c + 1);
      }
      return {
        ...prev,
        [currentCard.id]: status
      };
    });

    // Advance index card if not last index
    if (currentIndex < flashcards.length - 1) {
      setTimeout(() => {
        setFlipped(false);
        setCurrentIndex(i => i + 1);
      }, 300);
    }
  };

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setFlipped(false);
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setFlipped(false);
      setCurrentIndex(prev => prev - 1);
    }
  };

  const currentCard = flashcards[currentIndex];
  const totalCards = flashcards.length;

  return (    <div className="p-6 md:p-8 space-y-8 bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800">Recall Flashcards</h1>
        <p className="text-sm text-slate-500 mt-1">Activate high impact Spaced Repetition using flippable visual decks. Bookmark difficult definitions to study later.</p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column 4: Configurations */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active doc selection */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500 mb-3 block">1. Study Decks Source</h3>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => onSelectDocument(file)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                      activeDocument?.id === file.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-750'
                        : 'border-slate-150 bg-slate-50 text-slate-600 hover:border-slate-350'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{file.name}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-505">{file.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No materials imported. Configure sources in Workspace tab to extract vocabulary.</div>
            )}
          </div>

          {/* Card settings panel */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">2. Vocabulary Generation</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Decks Size: ({cardsCount} cards)</label>
              <input 
                type="range"
                min={4}
                max={15}
                step={1}
                value={cardsCount}
                onChange={(e) => setCardsCount(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>4 cards</span>
                <span>15 cards</span>
              </div>
            </div>

            <button
              onClick={handleGenerateCards}
              disabled={!activeDocument || isCompiling}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-sm transition active:scale-[0.98] text-xs flex items-center justify-center gap-2 mt-4 cursor-pointer"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Gathering Academic Cards...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" /> Forge Recall Cards
                </>
              )}
            </button>
          </div>

          {/* Helpful recall details */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 text-xs text-slate-500 space-y-2 leading-relaxed shadow-sm">
            <h4 className="text-indigo-605 font-bold uppercase tracking-wider font-mono text-[10px]">active recall tip</h4>
            <p>Do not flip immediately. Try to state the dictionary definition or math equation loudly in your room first, then flip to compare. This triggers high depth storage!</p>
          </div>

        </div>

        {/* Right column 8: Dynamic active flippable card play */}
        <div className="lg:col-span-8 space-y-6">
          
          {currentCard ? (
            <div className="space-y-6">
              
              {/* Cards Navigation menu and shuffle header */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <span className="text-xs font-mono text-slate-500">
                  Card <strong className="text-slate-800">{currentIndex + 1}</strong> of <strong className="text-slate-800">{totalCards}</strong>
                </span>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShuffle}
                    className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-800 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                    title="Shuffle Cards Stack"
                  >
                    <Shuffle size={14} /> <span className="hidden sm:inline font-semibold">Shuffle Stack</span>
                  </button>
                </div>
              </div>

              {/* Progressive practice stats bar */}
              <div className="grid grid-cols-3 gap-4 bg-white border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Cards Mastered</span>
                  <p className="text-lg font-black text-emerald-600 font-mono mt-0.5">{masteredCount} / {totalCards}</p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Study Accuracy</span>
                  <p className="text-lg font-black text-indigo-600 font-mono mt-0.5">
                    {totalCards > 0 ? `${Math.round((masteredCount / totalCards) * 100)}%` : '0%'}
                  </p>
                </div>
                <div>
                  <span className="text-[9px] text-slate-500 uppercase tracking-wider font-mono block">Status State</span>
                  <span className="text-[10px] font-mono font-bold uppercase text-slate-500 block mt-1">
                    {reviewedKeys[currentCard.id] || 'unreviewed'}
                  </span>
                </div>
              </div>

              {/* Master Flippable Visual Card Box */}
              <div 
                onClick={() => setFlipped(!flipped)}
                className={`relative h-[280px] w-full rounded-2xl cursor-pointer border transition-all duration-500 transform-gpu ${
                  flipped 
                    ? 'border-indigo-200 bg-white shadow-md' 
                    : 'border-slate-200 hover:border-indigo-400 bg-white shadow-sm'
                }`}
              >
                {/* Visual bookmark tag in corners */}
                <button
                  onClick={(e) => handleBookmark(currentCard.id, e)}
                  className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-indigo-600 rounded-xl bg-slate-50 border border-slate-200"
                >
                  {currentCard.bookmarked ? <BookmarkCheck size={18} className="text-indigo-600" /> : <Bookmark size={18} />}
                </button>

                {/* Front Side: Question */}
                {!flipped ? (
                  <div className="absolute inset-0 p-8 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-indigo-600 tracking-wider uppercase font-extrabold bg-indigo-50 border border-indigo-100 px-2.5 py-1 rounded-md">
                        Front: Retrieval Prompt
                      </span>
                    </div>
                    
                    <div className="text-center py-4">
                      <h3 className="text-lg md:text-xl font-bold text-slate-800 max-w-xl mx-auto leading-relaxed">
                        {currentCard.question}
                      </h3>
                    </div>

                    <div className="text-center font-semibold text-[10px] text-slate-400 uppercase tracking-widest font-mono flex items-center justify-center gap-1.5">
                      <RotateCw className="h-3.5 w-3.5 animate-spin-slow text-indigo-500" /> Click Anywhere to reveal answer
                    </div>
                  </div>
                ) : (
                  /* Back Side: Answer */
                  <div className="absolute inset-0 p-8 flex flex-col justify-between bg-slate-50/50 rounded-2xl">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-600 tracking-wider uppercase font-extrabold bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-md">
                        Back: Model Answer
                      </span>
                    </div>

                    <div className="text-center py-4">
                      <p className="text-sm md:text-md font-medium text-slate-700 max-w-xl mx-auto leading-relaxed">
                        {currentCard.answer}
                      </p>
                    </div>

                    <div className="text-center font-semibold text-[10px] text-slate-400 uppercase tracking-widest font-mono">
                      Click to spin back
                    </div>
                  </div>
                )}
              </div>

              {/* Active Evaluation Controllers */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-3 border border-slate-200 disabled:opacity-45 rounded-xl text-xs hover:bg-slate-100 text-slate-700 cursor-pointer font-bold flex items-center gap-1"
                  >
                    <ChevronLeft size={15} /> Previous
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === totalCards - 1}
                    className="p-3 border border-slate-200 disabled:opacity-45 rounded-xl text-xs hover:bg-slate-100 text-slate-700 cursor-pointer font-bold flex items-center gap-1"
                  >
                    Next <ChevronRight size={15} />
                  </button>
                </div>

                <div className="flex items-center gap-3 w-full sm:w-auto">
                  <button
                    onClick={() => handleRecordMastery('skipped')}
                    className="flex-grow sm:flex-grow-0 px-5 py-3 border border-slate-200 hover:bg-rose-50 text-rose-600 text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    Mark as Hard / Skip
                  </button>
                  <button
                    onClick={() => handleRecordMastery('mastered')}
                    className="flex-grow sm:flex-grow-0 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Check size={14} strokeWidth={3} /> Mastered Concept
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 border-dashed text-center flex flex-col justify-center items-center h-[400px] text-slate-500 space-y-3 shadow-sm">
              <Brain className="h-10 w-10 text-indigo-500 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Preview digital study cards</h3>
              <p className="text-xs text-slate-500 max-w-sm">Select an active study source, set appropriate vocabulary counts, and compile decks to run active-recall exercises.</p>
            </div>
          )}

          {/* Bookmarked stack quick review lists */}
          {flashcards.some(c => c.bookmarked) && (
            <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-505">Bookmarked Recall stack Quick Review</h4>
              <div className="divide-y divide-slate-150 max-h-[160px] overflow-y-auto pr-1">
                {flashcards.filter(c => c.bookmarked).map(card => (
                  <div key={card.id} className="py-2.5 flex justify-between items-center gap-4 text-xs">
                    <div className="min-w-0 pr-2">
                      <strong className="text-slate-700 truncate block font-semibold">{card.question}</strong>
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">{card.answer}</p>
                    </div>
                    <button
                      onClick={(e) => handleBookmark(card.id, e)}
                      className="text-[10px] text-indigo-600 hover:underline shrink-0 font-bold"
                    >
                      Unbookmark
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
