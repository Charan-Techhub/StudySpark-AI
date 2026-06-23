import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Calendar, 
  Loader2, 
  CheckCircle2, 
  Plus, 
  Trash, 
  Info,
  Clock,
  Printer,
  Copy
} from 'lucide-react';
import { StudyPlan, UploadedFile } from '../types';

interface PlannerViewProps {
  currentPlan: StudyPlan | null;
  onSetPlan: (plan: StudyPlan) => void;
  onToggleScheduleItem: (itemId: string) => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success') => void;
  activeDocument?: UploadedFile | null;
  uploadedFiles?: UploadedFile[];
}

export default function PlannerView({
  currentPlan,
  onSetPlan,
  onToggleScheduleItem,
  onAddNotification,
  activeDocument,
  uploadedFiles
}: PlannerViewProps) {
  const [examDate, setExamDate] = useState('2026-07-15');
  const [hoursAlloc, setHoursAlloc] = useState(4);
  const [subjectInput, setSubjectInput] = useState('');
  const [subjectsList, setSubjectsList] = useState<string[]>([]);
  const [priority, setPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [isCompiling, setIsCompiling] = useState(false);
  const [copied, setCopied] = useState(false);

  // Auto-populate subjects list from uploaded files and active document
  useEffect(() => {
    if (uploadedFiles && uploadedFiles.length > 0) {
      const activeSubject = activeDocument?.metadata?.subject || activeDocument?.name || '';
      const otherSubjects = uploadedFiles
        .map(f => f.metadata?.subject || f.name)
        .filter(s => s !== activeSubject);
      
      const uniqueSubjects = Array.from(new Set([activeSubject, ...otherSubjects]))
        .filter(Boolean)
        .map(s => s.trim());
      
      if (uniqueSubjects.length > 0) {
        setSubjectsList(uniqueSubjects);
      }
    }
  }, [uploadedFiles, activeDocument]);

  // Subjects adding utilities
  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectInput.trim()) return;
    if (subjectsList.includes(subjectInput.trim())) return;
    setSubjectsList(prev => [...prev, subjectInput.trim()]);
    setSubjectInput('');
  };

  const handleRemoveSubject = (subjectName: string) => {
    setSubjectsList(prev => prev.filter(s => s !== subjectName));
  };

  const handleAssemblePlanner = async () => {
    if (subjectsList.length === 0) return;
    setIsCompiling(true);
    try {
      const response = await fetch('/api/gemini/planner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          examDate: examDate,
          hoursAvailable: hoursAlloc,
          subjects: subjectsList,
          priority: priority,
          contextText: activeDocument?.extractedText || '',
          documentName: activeDocument?.name || '',
          documentLength: activeDocument?.extractedText?.length || 0
        })
      });

      if (!response.ok) {
        throw new Error('Failed to generate planner');
      }

      const generatedPlan: StudyPlan = await response.json();
      onSetPlan(generatedPlan);
      
      onAddNotification(
        'Planner Orchestrated',
        `Generated calendar timeline ending on ${examDate} for ${subjectsList.length} subjects.`,
        'success'
      );
    } catch (e: any) {
      console.error(e);
      // Fallback planner matching parameters on network failure
      const fallbackPlan: StudyPlan = {
        id: `plan_${Date.now()}`,
        examDate: examDate,
        hoursAvailable: hoursAlloc,
        subjects: subjectsList,
        priority: priority,
        dailySchedule: [
          { id: 's_fb1', time: '08:30 - 10:00', task: 'Review active formulas and diagrams', subject: subjectsList[0], priority: 'high', completed: false },
          { id: 's_fb2', time: '10:30 - 12:00', task: 'Synthesize flashcard recall questions', subject: subjectsList[1] || subjectsList[0], priority: 'medium', completed: false },
          { id: 's_fb3', time: '14:00 - 15:30', task: 'Solve quiz testing questions in exam module', subject: subjectsList[2] || subjectsList[0], priority: 'medium', completed: false }
        ],
        weeklySchedule: [
          { id: 'w_fb1', day: 'Day 1 & Day 2', tasks: ['Active Summaries synthesis on core modules', 'Solve questions lists with mock answers'] },
          { id: 'w_fb2', day: 'Day 3 & Day 4', tasks: ['Spaced Repetitions recall practice', 'Ask AI Mentor to solve formulas proofs'] },
          { id: 'w_fb3', day: 'Day 5 (Review)', tasks: ['Review bookmarked flashcards deck', 'Full mock exam grading evaluation'] }
        ],
        revisionPlan: [
          'Verify key vocabulary terms exactly 1 day after reading chapters.',
          'Rerun difficult quizzes 3 days later to measure accuracy shifts.',
          'Hold 2-minute whiteboard summaries on high-priority red highlighted concepts.'
        ],
        progress: 0
      };

      onSetPlan(fallbackPlan);
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyToClipboard = () => {
    if (!currentPlan) return;
    let out = `=== STUDY PLAN FOR: EXAM ON ${currentPlan.examDate} ===\n\n`;
    out += `Daily Allocated Hours: ${currentPlan.hoursAvailable} hours\n\n`;
    out += `=== DAILY SLOTS ===\n`;
    currentPlan.dailySchedule.forEach(slot => {
      out += `${slot.time} - ${slot.task} (${slot.subject}) [${slot.priority} priority] - ${slot.completed ? 'Done' : 'Pending'}\n`;
    });
    out += `\n=== REVISION PLAN ===\n`;
    currentPlan.revisionPlan.forEach((r, idx) => {
      out += `${idx + 1}. ${r}\n`;
    });

    navigator.clipboard.writeText(out);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handlePrint = () => {
    window.print();
  };

  // calculate progressive track value
  const totalTasks = currentPlan?.dailySchedule.length || 0;
  const completedTasks = currentPlan?.dailySchedule.filter(t => t.completed).length || 0;
  const progressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-3xl font-extrabold text-slate-800">Study Scheduler</h1>
        <p className="text-sm text-slate-500 mt-1">Generate dynamic calendars, custom time slots and spaced reviews customized around target exam dates.</p>
      </div>

      {/* Main split dashboard content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column 4: Inputs and variables */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Settings board */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">1. Scheduler Settings</h3>

            {/* Exam Date input value */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Target Exam Date:</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                <input 
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-10 pr-3 text-xs text-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Allocated hours slider */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Allocated Daily Hours: ({hoursAlloc} hrs)</label>
              <div className="flex items-center gap-3">
                <Clock className="h-4.5 w-4.5 text-indigo-605 shrink-0" />
                <input 
                  type="range"
                  min={1}
                  max={8}
                  step={1}
                  value={hoursAlloc}
                  onChange={(e) => setHoursAlloc(Number(e.target.value))}
                  className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                />
              </div>
            </div>

            {/* Focus priority selectors */}
            <div className="space-y-1.5 pt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono font-bold">Focus Intensity:</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low', 'medium', 'high'] as const).map(pr => (
                  <button
                    key={pr}
                    onClick={() => setPriority(pr)}
                    className={`p-2.5 rounded-xl border text-xs font-bold capitalize transition cursor-pointer ${
                      priority === pr
                        ? 'border-indigo-500 bg-indigo-50 text-indigo-705'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-550 hover:text-slate-800 bg-white'
                    }`}
                  >
                    {pr}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Subjects adders */}
          <div className="p-5 rounded-2xl bg-white border border-slate-200 space-y-3 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">2. Active Exam Subjects</h3>
            
            <form onSubmit={handleAddSubject} className="flex gap-2">
              <input 
                type="text"
                placeholder="Subject name (e.g., Biology)"
                value={subjectInput}
                onChange={(e) => setSubjectInput(e.target.value)}
                className="w-full bg-slate-50 border border-slate-205 px-3 py-2 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-indigo-500 rounded-xl"
              />
              <button
                type="submit"
                className="p-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-600 rounded-xl flex items-center justify-center cursor-pointer font-bold"
              >
                <Plus size={16} />
              </button>
            </form>

            {subjectsList.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-2 max-h-[140px] overflow-y-auto pr-1">
                {subjectsList.map(sub => (
                  <span 
                    key={sub}
                    className="text-[9.5px] font-bold px-2 py-1 bg-slate-100 border border-slate-200 text-slate-600 rounded-lg flex items-center gap-1.5 shrink-0"
                  >
                    {sub}
                    <button 
                      type="button" 
                      onClick={() => handleRemoveSubject(sub)}
                      className="text-slate-400 hover:text-rose-600 font-bold hover:scale-105"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-[10px] text-slate-400 italic">No course topics populated yet. Select or upload a document to auto-fill course topics, or type key topics manually above.</p>
            )}

            <button
              onClick={handleAssemblePlanner}
              disabled={subjectsList.length === 0 || isCompiling}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-extrabold py-3 px-4 rounded-xl shadow-sm transition active:scale-[0.98] text-xs flex items-center justify-center gap-2 mt-2 cursor-pointer"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin font-semibold" /> Orchestrating Scheduler...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-indigo-300" /> Generate Study Planner
                </>
              )}
            </button>
          </div>

        </div>

        {/* Right column 8: Dynamic generated StudyPlan view */}
        <div className="lg:col-span-8">
          
          {currentPlan ? (
            <div className="p-6 md:p-8 rounded-3xl bg-white border border-slate-200 shadow-md space-y-6">
              
              {/* Header inside planner */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-800 flex items-center gap-1.5">
                    <Calendar size={18} className="text-indigo-650" /> Complete Exam Timeline Calendar
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">Exam locked target: {currentPlan.examDate} • daily study: {currentPlan.hoursAvailable} hours</p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleCopyToClipboard}
                    className="p-2 border border-slate-205 hover:bg-slate-50 text-slate-600 hover:text-slate-805 rounded-xl text-xs bg-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                  >
                    {copied ? 'Copied' : <><Copy size={13} /> Clipboard</>}
                  </button>
                  <button
                    onClick={handlePrint}
                    className="p-2 border border-slate-205 hover:bg-slate-50 text-slate-600 hover:text-slate-805 rounded-xl text-xs bg-white flex items-center gap-1 transition cursor-pointer shadow-sm"
                  >
                    <Printer size={13} /> Print List
                  </button>
                </div>
              </div>

              {/* Progress gauge */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="flex justify-between text-xs font-semibold">
                  <span className="text-slate-500 font-mono tracking-wide uppercase">Today's Scheduler Slot Progress</span>
                  <span className="text-indigo-600 font-mono font-bold">{progressPct}% ({completedTasks} completed / {totalTasks} total)</span>
                </div>
                <div className="w-full h-1.5 bg-slate-205 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-605 transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>
              
              {/* Daily schedule checklists */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">Daily Study Blocks Checklist</h4>
                <div className="divide-y divide-slate-150 bg-slate-50 p-4 border border-slate-200 rounded-2xl">
                  {currentPlan.dailySchedule.map(slot => (
                    <div key={slot.id} className="py-3.5 flex items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          onClick={() => onToggleScheduleItem(slot.id)}
                          className={`h-5 w-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                            slot.completed 
                              ? 'bg-indigo-600 border-indigo-550 text-white font-bold text-xs' 
                              : 'border-slate-300 bg-white text-transparent hover:border-indigo-505'
                          }`}
                        >
                          ✓
                        </button>

                        <div className="min-w-0">
                          <p className={`text-xs font-bold truncate leading-relaxed ${slot.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                            {slot.task}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 select-none font-mono text-[9px]">
                            <span className="text-slate-500 font-bold uppercase">{slot.subject}</span>
                            <span className="text-slate-400">•</span>
                            <span className={`px-1 rounded font-bold uppercase ${
                              slot.priority === 'high' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-slate-200 text-slate-600'
                            }`}>{slot.priority} focus</span>
                          </div>
                        </div>
                      </div>

                      <span className="text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded shrink-0 shadow-sm">
                        {slot.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weekly schedules */}
              {currentPlan.weeklySchedule && currentPlan.weeklySchedule.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-500">Weekly Macro-Milestone Tracks</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {currentPlan.weeklySchedule.map(wk => (
                      <div key={wk.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col justify-between shadow-sm">
                        <span className="text-[10px] text-indigo-605 font-mono font-black uppercase tracking-wider block mb-2">{wk.day}</span>
                        <ul className="space-y-2">
                          {wk.tasks.map((task, idx) => (
                            <li key={idx} className="text-[11px] text-slate-600 leading-normal flex items-start gap-1.5 font-sans">
                              <span className="h-1.5 w-1.5 bg-indigo-400 rounded-full shrink-0 mt-1.5" />
                              {task}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Revision Plans */}
              {currentPlan.revisionPlan && currentPlan.revisionPlan.length > 0 && (
                <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-2.5">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider font-mono text-indigo-755">Spaced Repetitions Retention Plan</h4>
                  <ul className="space-y-2">
                    {currentPlan.revisionPlan.map((rev, idx) => (
                      <li key={idx} className="text-xs text-slate-600 flex items-start gap-2 font-sans">
                        <span className="h-5 w-5 bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-full flex items-center justify-center text-[10px] font-mono font-bold shrink-0 mt-0.5 shadow-sm">
                          {idx + 1}
                        </span>
                        <p className="leading-relaxed mt-0.5">{rev}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ) : (
            <div className="p-12 rounded-3xl bg-white border border-slate-200 border-dashed text-center flex flex-col justify-center items-center h-[400px] text-slate-500 space-y-3 shadow-sm">
              <Calendar className="h-10 w-10 text-indigo-550 animate-pulse" />
              <h3 className="text-sm font-bold text-slate-800">Preview study calendar and planning blocks</h3>
              <p className="text-xs text-slate-500 max-w-sm">Determine your locked examinations date, adjust available preparation hours, add subject courses and compile study plans.</p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
