import React, { useState } from 'react';
import { 
  Sparkles, 
  Activity, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  Award,
  BookOpen,
  Copy,
  Printer
} from 'lucide-react';
import { UploadedFile, Quiz, QuizQuestion } from '../types';

interface QuizViewProps {
  activeDocument: UploadedFile | null;
  uploadedFiles: UploadedFile[];
  onSelectDocument: (doc: UploadedFile) => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success') => void;
  onUpdateQuizStats: (score: number) => void;
}

export default function QuizView({
  activeDocument,
  uploadedFiles,
  onSelectDocument,
  onAddNotification,
  onUpdateQuizStats
}: QuizViewProps) {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionCount, setQuestionCount] = useState(5);
  const [isCompiling, setIsCompiling] = useState(false);
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [solved, setSolved] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleGenerateQuiz = async () => {
    if (!activeDocument) return;
    setIsCompiling(true);
    setSolved(false);

    try {
      const response = await fetch('/api/gemini/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: activeDocument.extractedText,
          difficulty: difficulty,
          count: questionCount
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate quiz');
      }

      const data = await response.json();
      const loadedQuestions: QuizQuestion[] = data.questions || [];

      const newQuiz: Quiz = {
        id: `quiz_${Date.now()}`,
        docId: activeDocument.id,
        title: `AI Evaluation: ${activeDocument.name}`,
        difficulty: difficulty,
        questions: loadedQuestions.map(q => ({
          ...q,
          userAnswer: ''
        }))
      };

      setCurrentQuiz(newQuiz);
      onAddNotification(
        'AI Quiz Formulated',
        `Generated ${questionCount} testing questions on "${activeDocument.name}".`,
        'success'
      );
    } catch (e: any) {
      console.error(e);
      // Dynamic fallback generator from the document's sentences
      const sentences = (activeDocument?.extractedText || '').split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 25 && s.length < 180);
      const fallbackQuestions: QuizQuestion[] = [];
      
      const parsedCount = Math.max(2, questionCount);
      const limit = sentences.length > 0 ? Math.min(parsedCount, sentences.length) : parsedCount;
      
      if (sentences.length > 0) {
        for (let i = 0; i < limit; i++) {
          const sentence = sentences[i];
          const words = sentence.split(/\s+/).filter(w => w.length > 6 && !['through', 'without', 'between', 'because', 'government', 'education', 'programme'].includes(w.toLowerCase()));
          const keyword = words[0] || 'objective';
          const capitalizedKeyword = keyword.charAt(0).toUpperCase() + keyword.slice(1);
          
          if (i % 3 === 0) {
            fallbackQuestions.push({
              id: `q_fb_${i}`,
              type: 'mcq',
              question: `In reference to "${activeDocument?.name || 'notes'}", which statement corresponds directly to "${capitalizedKeyword}"?`,
              options: [
                sentence,
                `An alternative thesis detailing random structural variables related to ${keyword}.`,
                `A standard general assumption regarding theoretical ${keyword}.`,
                `This is an irrelevant statement concerning generalized features of ${keyword}.`
              ].sort(() => Math.random() - 0.5),
              correctAnswer: sentence,
              explanation: `The textbook context directly states: "${sentence}".`
            });
          } else if (i % 3 === 1) {
            fallbackQuestions.push({
              id: `q_fb_${i}`,
              type: 'true-false',
              question: `True or False: The text indicates that: "${sentence}".`,
              correctAnswer: 'True',
              explanation: `This is directly paraphrased or quoted from the source: "${sentence}".`
            });
          } else {
            fallbackQuestions.push({
              id: `q_fb_${i}`,
              type: 'fill-blank',
              question: `Complete this concept: "${sentence.replace(new RegExp(keyword, 'gi'), '_______')}".`,
              correctAnswer: keyword.toLowerCase(),
              explanation: `The missing term is "${keyword}", as in: "${sentence}".`
            });
          }
        }
      } else {
        // Safe standard fallback if text is somehow entirely empty
        fallbackQuestions.push(
          {
            id: 'q_fb_none1',
            type: 'mcq',
            question: `Which represents the primary objective of studying "${activeDocument?.name || 'materials'}"?`,
            options: [
              `Familiarize oneself with core details of ${activeDocument?.name || 'study content'}.`,
              'Passive storage of superficial templates.',
              'Randomized verification logs.',
              'Continuous telemetry and structural review.'
            ].sort(() => Math.random() - 0.5),
            correctAnswer: `Familiarize oneself with core details of ${activeDocument?.name || 'study content'}.`,
            explanation: 'Active retrieve techniques recommend focusing deeply on material headings and central objectives.'
          },
          {
            id: 'q_fb_none2',
            type: 'true-false',
            question: `The main goal of "${activeDocument?.name || 'your notes'}" is to synthesize academic mastery.`,
            correctAnswer: 'True',
            explanation: 'Yes, study guides exist to facilitate deeper cognitive connections.'
          }
        );
      }

      const fallbackQuiz: Quiz = {
        id: `quiz_${Date.now()}`,
        docId: activeDocument?.id || 'doc_mock',
        title: `Dynamic Evaluation: ${activeDocument?.name || 'Academic notes'}`,
        difficulty: difficulty,
        questions: fallbackQuestions
      };

      setCurrentQuiz(fallbackQuiz);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleSelectOption = (questionId: string, option: string) => {
    if (!currentQuiz || solved) return;
    
    setCurrentQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => {
          if (q.id === questionId) {
            return { ...q, userAnswer: option };
          }
          return q;
        })
      };
    });
  };

  const handleTextInput = (questionId: string, value: string) => {
    if (!currentQuiz || solved) return;

    setCurrentQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: prev.questions.map(q => {
          if (q.id === questionId) {
            return { ...q, userAnswer: value };
          }
          return q;
        })
      };
    });
  };

  const handleEvaluateQuiz = () => {
    if (!currentQuiz || solved) return;

    let correctCount = 0;
    const evaluatedQuestions = currentQuiz.questions.map(q => {
      let isCorrect = false;

      if (q.type === 'mcq' || q.type === 'true-false') {
        isCorrect = q.userAnswer?.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
      } else if (q.type === 'fill-blank') {
        const userClean = q.userAnswer?.trim().toLowerCase() || '';
        const answerClean = q.correctAnswer.trim().toLowerCase();
        isCorrect = answerClean.includes(userClean) && userClean.length > 2;
      } else {
        // short or long answers get automated general completion passing on filled text
        isCorrect = (q.userAnswer?.trim().length || 0) > 10;
      }

      if (isCorrect) correctCount++;

      return {
        ...q,
        isCorrect
      };
    });

    const finalPct = Math.round((correctCount / currentQuiz.questions.length) * 100);

    setCurrentQuiz(prev => {
      if (!prev) return null;
      return {
        ...prev,
        questions: evaluatedQuestions,
        score: finalPct
      };
    });

    setSolved(true);
    onUpdateQuizStats(finalPct);
    onAddNotification(
      'Exam Graded',
      `You completed testing with a score of ${finalPct}%. Check correct guides!`,
      'success'
    );
  };

  const handleCopyToClipboard = () => {
    if (!currentQuiz) return;
    let textOut = `=== ${currentQuiz.title} ===\n\n`;
    currentQuiz.questions.forEach((q, idx) => {
      textOut += `Q${idx + 1}: ${q.question}\n`;
      if (q.options) {
        textOut += `Options:\n` + q.options.map(o => `- ${o}`).join('\n') + '\n';
      }
      textOut += `Correct Answer: ${q.correctAnswer}\n`;
      textOut += `Explanation: ${q.explanation}\n\n`;
    });

    navigator.clipboard.writeText(textOut);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800">AI Quiz Generator</h1>
        <p className="text-sm text-slate-500 mt-1">Transform textbooks dynamically into multi-modal exams. Highlight mistakes, record score tracking, and study explanations.</p>
      </div>

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column 4: Controls */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Active doc select */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500 mb-3 block">1. Exam Materials Source</h3>
            {uploadedFiles.length > 0 ? (
              <div className="space-y-2">
                {uploadedFiles.map(file => (
                  <button
                    key={file.id}
                    onClick={() => onSelectDocument(file)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between gap-3 transition cursor-pointer ${
                      activeDocument?.id === file.id
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-750 font-semibold'
                        : 'border-slate-150 bg-slate-50 text-slate-600 hover:border-slate-350'
                    }`}
                  >
                    <span className="text-xs font-bold truncate">{file.name}</span>
                    <span className="text-[10px] uppercase font-mono text-slate-500">{file.type}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500 italic">No academic materials imported yet. Setup some sources in Workspace tab first.</div>
            )}
          </div>

          {/* Test parameters configure */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">2. Exam Structure Parameters</h3>
            
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Difficulty Tier:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['easy', 'medium', 'hard'] as const).map(diff => (
                  <button
                    key={diff}
                    onClick={() => setDifficulty(diff)}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                      difficulty === diff
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-750'
                        : 'border-slate-150 bg-slate-50 text-slate-500 hover:text-slate-805 hover:bg-slate-100'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-slate-550 uppercase tracking-widest font-mono">Questions Volume: ({questionCount})</label>
              <input 
                type="range"
                min={3}
                max={10}
                step={1}
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>3 questions</span>
                <span>10 questions</span>
              </div>
            </div>

            <button
              onClick={handleGenerateQuiz}
              disabled={!activeDocument || isCompiling}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold py-3.5 px-4 rounded-xl cursor-pointer shadow-sm transition active:scale-[0.98] text-xs flex items-center justify-center gap-2 mt-4"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" /> Generating Exam Sheet...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-white" /> Formulate AI Quiz
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right column 8: Active testing platform */}
        <div className="lg:col-span-8">
          
          {currentQuiz ? (
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-6">
              
              {/* Title bar */}
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5 truncate">
                    <Award className="text-indigo-605 shrink-0" size={18} />
                    {currentQuiz.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1 select-none text-[10px] text-slate-500 font-mono uppercase font-semibold">
                    <span>Difficulty: {currentQuiz.difficulty}</span>
                    <span>•</span>
                    <span>{currentQuiz.questions.length} Concepts Examined</span>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 border border-slate-205 text-slate-650 hover:bg-slate-50 rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    {copied ? 'Copied✓' : <Copy size={13} />}
                  </button>
                </div>
              </div>

              {/* Progress and score alerts */}
              {solved && (
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-6">
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">Final Academic Mark</h4>
                    <div className="text-3xl font-black text-indigo-605 mt-1 font-mono">{currentQuiz.score}%</div>
                    <p className="text-[10px] text-slate-500 mt-1 font-bold">Mistakes are highlighted. Explanations below are ready.</p>
                  </div>
                  
                  <div className="text-right">
                    <span className="text-[10px] text-slate-500 font-mono block">Accuracy</span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border inline-block mt-1 ${
                      (currentQuiz.score || 0) >= 80 ? 'bg-emerald-50 text-emerald-700 border-emerald-250' :
                      (currentQuiz.score || 0) >= 50 ? 'bg-yellow-50 text-yellow-805 border-yellow-250' : 'bg-red-50 text-red-750 border-red-250'
                    }`}>
                      {(currentQuiz.score || 0) >= 80 ? 'Outstanding Master' : (currentQuiz.score || 0) >= 50 ? 'Developing' : 'Review Suggested'}
                    </span>
                  </div>
                </div>
              )}

              {/* Questions Stream */}
              <div className="space-y-8 divide-y divide-slate-100 pb-4">
                {currentQuiz.questions.map((q, idx) => {
                  const showingExplanation = solved;
                  return (
                    <div key={q.id || idx} className={`${idx > 0 ? 'pt-6' : ''} space-y-4`}>
                      <div className="flex items-start gap-3">
                        <span className="h-6 w-6 rounded-md bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-indigo-650 shrink-0 select-none">
                          {idx + 1}
                        </span>
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 leading-normal">{q.question}</h4>
                          <span className="text-[9px] text-slate-500 uppercase font-mono tracking-wider font-bold inline-block mt-1">[{q.type.replace('-', ' ')}]</span>
                        </div>
                      </div>

                      {/* Question Answer fields based on types */}
                      {q.type === 'mcq' && q.options && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-9">
                          {q.options.map(opt => {
                            const selected = q.userAnswer === opt;
                            const isCorrectAnswer = opt.toLowerCase() === q.correctAnswer.toLowerCase();
                            
                            let cardStyle = 'border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-600';
                            if (selected) {
                              cardStyle = 'border-indigo-500 bg-indigo-50 text-indigo-750 font-semibold';
                            }
                            if (showingExplanation) {
                              if (isCorrectAnswer) {
                                cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold';
                              } else if (selected && !isCorrectAnswer) {
                                cardStyle = 'border-red-500 bg-red-50 text-red-700 line-through';
                              }
                            }

                            return (
                              <button
                                key={opt}
                                disabled={solved}
                                onClick={() => handleSelectOption(q.id, opt)}
                                className={`p-3 rounded-xl border text-left text-xs transition cursor-pointer select-none leading-relaxed flex items-center justify-between gap-3 ${cardStyle}`}
                              >
                                <span>{opt}</span>
                                {showingExplanation && isCorrectAnswer && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                                {showingExplanation && selected && !isCorrectAnswer && <XCircle className="h-4 w-4 text-red-600 shrink-0" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {q.type === 'true-false' && (
                        <div className="flex gap-4 pl-9">
                          {['True', 'False'].map(opt => {
                            const selected = q.userAnswer === opt;
                            const isCorrectAnswer = opt.toLowerCase() === q.correctAnswer.toLowerCase();

                            let cardStyle = 'border-slate-200 hover:border-slate-350 bg-slate-50 text-slate-600';
                            if (selected) {
                              cardStyle = 'border-indigo-500 bg-indigo-50 text-indigo-750 font-semibold';
                            }
                            if (showingExplanation) {
                              if (isCorrectAnswer) {
                                cardStyle = 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold';
                              } else if (selected) {
                                cardStyle = 'border-red-500 bg-red-55 text-red-700 line-through';
                              }
                            }

                            return (
                              <button
                                key={opt}
                                disabled={solved}
                                onClick={() => handleSelectOption(q.id, opt)}
                                className={`px-6 py-2.5 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center gap-2 ${cardStyle}`}
                              >
                                {opt}
                                {showingExplanation && isCorrectAnswer && <CheckCircle2 size={13} className="text-emerald-650" />}
                              </button>
                            );
                          })}
                        </div>
                      )}

                      {(q.type === 'fill-blank' || q.type === 'short-answer' || q.type === 'long-answer') && (
                        <div className="pl-9 space-y-2">
                          <textarea
                            disabled={solved}
                            value={q.userAnswer}
                            onInput={(e) => handleTextInput(q.id, (e.target as HTMLTextAreaElement).value)}
                            placeholder={q.type === 'fill-blank' ? 'Type missing term here...' : 'Compose your comprehensive evaluation response here...'}
                            rows={q.type === 'long-answer' ? 4 : 2}
                            className="w-full bg-slate-50 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-505 font-sans"
                          />
                          {showingExplanation && (
                            <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl">
                              <span className="text-[9px] text-emerald-700 font-mono font-bold uppercase tracking-wider block">Recommended Ideal Answer</span>
                              <p className="text-xs font-sans text-slate-800 font-bold mt-1 max-w-none">{q.correctAnswer}</p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Explanations block */}
                      {showingExplanation && q.explanation && (
                        <div className="mt-3.5 ml-9 p-4 rounded-xl bg-slate-50 border border-slate-150 text-[11px] text-slate-500 leading-relaxed font-sans flex gap-2.5">
                          <HelpCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-slate-850 uppercase tracking-wide block mb-1">Tutor Explanation Guide:</span>
                            {q.explanation}
                          </div>
                        </div>
                      )}

                    </div>
                  );
                })}
              </div>

              {!solved && (
                <button
                  onClick={handleEvaluateQuiz}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-3.5 px-4 rounded-xl cursor-pointer shadow-sm transition active:scale-[0.98] text-xs uppercase tracking-wide"
                >
                  Grade & Submit Exam Sheet
                </button>
              )}

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 border-dashed text-center flex flex-col justify-center items-center h-[400px] text-slate-500 space-y-3 shadow-sm">
              <Activity className="h-10 w-10 text-indigo-505 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Preview tests & exams</h3>
              <p className="text-xs text-slate-500 max-w-sm leading-relaxed">Select an active textbook in source configurations, adjust exam metrics (volume & complexity), and formulate quizzes.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
