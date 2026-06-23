import React from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  GraduationCap, 
  BookOpen, 
  Activity, 
  Calendar,
  Layers,
  ArrowRight,
  Flame,
  Award,
  BookOpenCheck,
  CheckSquare,
  Clock,
  Sparkle,
  Plus
} from 'lucide-react';
import { UserProfile, UploadedFile, DashboardStats, StudyPlan } from '../types';

interface DashboardViewProps {
  user: UserProfile | null;
  uploadedFiles: UploadedFile[];
  onTabChange: (tab: string) => void;
  stats: DashboardStats;
  currentPlan: StudyPlan | null;
  onToggleScheduleItem: (itemId: string) => void;
  onSelectDocument: (docId: string) => void;
}

export default function DashboardView({
  user,
  uploadedFiles,
  onTabChange,
  stats,
  currentPlan,
  onToggleScheduleItem,
  onSelectDocument
}: DashboardViewProps) {

  // Dynamic greeting based on current local time
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning 🌅';
    if (hour < 18) return 'Good Afternoon ☀️';
    return 'Good Evening 🌌';
  };

  const aiTips = [
    { title: "Retrieval Practice", desc: "Generating flashcards triggers active recall, strengthening neuro-connections 80% better than highlight reading." },
    { title: "Feynman Technique", desc: "Ask the AI Mentor to explain a concept 'like I am 5 years old.' If you can explain it simply, you master the topic." },
    { title: "Spaced Repetitions", desc: "Use the Study Planner's Revision steps precisely 1 day, 3 days, and 7 days after reading a chapter." }
  ];

  // Activities log derived from documents and stats
  const recentActivities = [
    ...(uploadedFiles.slice(0, 3).map(f => ({
      text: `Processed document: "${f.name}" (${f.metadata?.subject || 'Analyzing...'})`,
      time: `Added ${f.uploadedAt}`,
      actionText: "Open",
      action: () => { onSelectDocument(f.id); onTabChange('upload'); }
    }))),
    ...(currentPlan ? [{
      text: "Personal Study Schedule created",
      time: "Generated just now",
      actionText: "View Schedule",
      action: () => onTabChange('planner')
    }] : [])
  ];

  // Calculate quick progress
  const totalTasks = currentPlan?.dailySchedule.length || 0;
  const completedTasks = currentPlan?.dailySchedule.filter(t => t.completed).length || 0;
  const taskProgressPct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-50 text-slate-800 min-h-screen font-sans">
      
      {/* Upper Welcome Header banner */}
      <div className="relative rounded-3xl p-6 md:p-8 bg-white border border-slate-200 overflow-hidden shadow-sm">
        <div className="absolute -top-12 -right-12 h-36 w-36 bg-indigo-500/5 rounded-full blur-[40px] pointer-events-none" />
        <div className="absolute bottom-[-50px] left-[10%] h-36 w-44 bg-purple-500/5 rounded-full blur-[50px] pointer-events-none" />
        
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-[10px] md:text-xs font-bold tracking-widest text-indigo-600 font-mono uppercase bg-indigo-50 px-2.5 py-1 rounded-md inline-block mb-3 border border-indigo-200/40">
              {getGreeting()}
            </h2>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 mb-2 leading-tight">
              Ready to burn through textbooks, <span className="text-slate-700 italic">{user?.name || 'Scholar'}?</span>
            </h1>
            <p className="text-slate-500 text-sm max-w-2xl leading-relaxed">
              Your StudySpark AI engines are online. Upload raw material in any format to generate instant study notes, test quizzes, active recall flashcards, and step-by-step chat revision.
            </p>
          </div>

          <div className="flex select-none items-center gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4 shrink-0 shadow-sm">
            <div className="h-12 w-12 rounded-xl bg-orange-50 border border-orange-100/50 flex items-center justify-center text-orange-650">
              <Flame className="h-7 w-7 animate-pulse" />
            </div>
            <div>
              <div className="text-2xl font-black text-orange-600 font-mono leading-none flex items-baseline gap-1">
                {stats.streak} <span className="text-xs text-slate-400 font-normal">days</span>
              </div>
              <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider mt-1">Study Streak</p>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Stat Item 1 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Uploaded Docs</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1.5 font-mono">{stats.documentsCount}</div>
            <p className="text-[10px] text-slate-500 mt-1">Raw textbooks or notes</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600">
            <FileText size={22} />
          </div>
        </div>

        {/* Stat Item 2 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Learning Hours</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1.5 font-mono">{stats.studyHours}</div>
            <p className="text-[10px] text-emerald-600 mt-1 flex items-center gap-1">
              Active sessions tracked
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <Clock size={22} />
          </div>
        </div>

        {/* Stat Item 3 */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Mean Quiz Score</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1.5 font-mono">
              {stats.averageQuizScore > 0 ? `${stats.averageQuizScore}%` : 'N/A'}
            </div>
            <p className="text-[10px] text-slate-500 mt-1">From active test modules</p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-cyan-50 border border-cyan-105 flex items-center justify-center text-cyan-605">
            <Award size={22} />
          </div>
        </div>

        {/* Stat Item 4: Circular Progress Tracker */}
        <div className="p-6 rounded-2xl bg-white border border-slate-200 flex items-center justify-between shadow-sm">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-mono">Task Completion</span>
            <div className="text-3xl font-extrabold text-slate-900 mt-1.5 font-mono">{taskProgressPct}%</div>
            <p className="text-[10px] text-slate-500 mt-1">Today's scheduler checklist</p>
          </div>
          <div className="relative h-14 w-14 shrink-0 flex items-center justify-center">
            {/* SVG circle gauge */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-indigo-600 transition-all duration-500"
                strokeDasharray={`${taskProgressPct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <span className="absolute text-[10px] font-mono font-bold text-slate-600">{completedTasks}/{totalTasks}</span>
          </div>
        </div>

      </div>

      {/* Main Content Splitting area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left 8 columns: Quick Actions, Recent Uploads, Scheduler */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Quick Actions Panel */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <h3 className="text-sm font-bold text-slate-800 mb-4 uppercase tracking-wider font-mono flex items-center gap-2">
              <Sparkles className="h-4.5 w-4.5 text-indigo-600" /> Study Quick Actions
            </h3>
            
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              
              <button 
                onClick={() => onTabChange('upload')}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white group text-left cursor-pointer transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-purple-100 border border-purple-200 flex items-center justify-center text-purple-650 group-hover:scale-105 transition-transform mb-3">
                  <Upload size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">Upload Document</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Parse text, PDF, Word, Excel, Powerpoint slides.</p>
              </button>

              <button 
                onClick={() => onTabChange('summaries')}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white group text-left cursor-pointer transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-cyan-100 border border-cyan-200 flex items-center justify-center text-cyan-650 group-hover:scale-105 transition-transform mb-3">
                  <BookOpen size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">AI Summarizer</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Get colored critical highlights & study briefs.</p>
              </button>

              <button 
                onClick={() => onTabChange('mentor')}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white group text-left cursor-pointer transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-650 group-hover:scale-105 transition-transform mb-3">
                  <GraduationCap size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">Ask AI Mentor</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Chat with supportive coach to explain difficult steps.</p>
              </button>

              <button 
                onClick={() => onTabChange('quiz')}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white group text-left cursor-pointer transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-650 group-hover:scale-105 transition-transform mb-3">
                  <Activity size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">Create AI Quiz</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Generate MCQs, true-false checks, and scoring.</p>
              </button>

              <button 
                onClick={() => onTabChange('flashcards')}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white group text-left cursor-pointer transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-pink-100 border border-pink-205 flex items-center justify-center text-pink-650 group-hover:scale-105 transition-transform mb-3">
                  <Layers size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">Recall Cards</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Shuffle terms, flip card answers, and bookmark tags.</p>
              </button>

              <button 
                onClick={() => onTabChange('planner')}
                className="p-5 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white group text-left cursor-pointer transition-all"
              >
                <div className="h-10 w-10 rounded-xl bg-indigo-100 border border-indigo-200 flex items-center justify-center text-indigo-650 group-hover:scale-105 transition-transform mb-3">
                  <Calendar size={18} />
                </div>
                <h4 className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">Active Schedule</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed">Update target dates to build calendar timelines.</p>
              </button>

            </div>
          </div>

          {/* Today's Study Plan checklist widget */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider font-mono flex items-center gap-2">
                <Calendar className="h-4.5 w-4.5 text-indigo-605" /> Today's Study Planner Checklist
              </h3>
              <button 
                onClick={() => onTabChange('planner')}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                Customize Plan &rarr;
              </button>
            </div>

            {currentPlan && currentPlan.dailySchedule.length > 0 ? (
              <div className="divide-y divide-slate-100">
                {currentPlan.dailySchedule.map(item => (
                  <div key={item.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        onClick={() => onToggleScheduleItem(item.id)}
                        className={`h-5 w-5 rounded-md border flex items-center justify-center cursor-pointer transition-all ${
                          item.completed 
                            ? 'bg-emerald-500 border-emerald-400 text-white' 
                            : 'border-slate-250 hover:border-slate-400 bg-slate-50 text-transparent'
                        }`}
                      >
                        ✓
                      </button>
                      <div className="min-w-0">
                        <p className={`text-sm font-semibold truncate ${item.completed ? 'line-through text-slate-400 font-normal' : 'text-slate-800'}`}>
                          {item.task}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] text-slate-450 font-semibold uppercase tracking-wider">{item.subject}</span>
                          <span className="text-[9px] font-mono text-slate-300 font-bold">•</span>
                          <span className={`text-[9px] font-mono font-bold px-1 rounded uppercase ${
                            item.priority === 'high' ? 'text-red-600 bg-red-50 border border-red-200' : 
                            item.priority === 'medium' ? 'text-yellow-600 bg-yellow-50 border border-yellow-200' : 'text-slate-500 bg-slate-100'
                          }`}>
                            {item.priority} priority
                          </span>
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-mono text-slate-500 bg-slate-100 px-2 py-1 rounded shrink-0">{item.time}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-550 text-xs mb-3">No study schedules active for today.</p>
                <button
                  onClick={() => onTabChange('planner')}
                  className="px-4 py-2 bg-indigo-50 text-indigo-650 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Generate Dynamic Planner
                </button>
              </div>
            )}
          </div>

          {/* Recent Uploads widget */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider font-mono flex items-center gap-2">
                <FileText className="h-4.5 w-4.5 text-indigo-605" /> Recent Parsed Documents
              </h3>
              <button 
                onClick={() => onTabChange('upload')}
                className="text-xs text-indigo-605 hover:text-indigo-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                Upload more <Plus size={14} />
              </button>
            </div>

            {uploadedFiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {uploadedFiles.map(file => (
                  <div 
                    key={file.id}
                    onClick={() => { onSelectDocument(file.id); onTabChange('upload'); }}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-150 hover:border-indigo-400 hover:bg-white cursor-pointer transition flex items-center justify-between group shadow-sm hover:shadow-md"
                  >
                    <div className="min-w-0 pr-4">
                      <h4 className="text-sm font-bold text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                        {file.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-semibold font-mono mt-0.5 uppercase">
                        {file.metadata?.subject || 'Analyzing subjects...'}
                      </p>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 bg-white border border-slate-200 px-2 py-1 rounded">
                      {file.size}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-slate-50 rounded-2xl border border-slate-200 border-dashed">
                <p className="text-slate-550 text-xs mb-3">No documents in workspace yet.</p>
                <button
                  onClick={() => onTabChange('upload')}
                  className="px-4 py-2 bg-indigo-50 text-indigo-605 border border-indigo-200 hover:bg-indigo-100 text-xs font-bold rounded-xl cursor-pointer"
                >
                  Configure Workspace Now
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Right 4 columns: Recent Activity + AI study tips */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* AI Tips widget */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-full filter blur-xl pointer-events-none" />
            <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider font-mono flex items-center gap-2 mb-4">
              <Sparkle className="h-4 w-4 text-indigo-500 animate-spin-slow" /> StudySpark Daily AI Tips
            </h3>

            <div className="space-y-4">
              {aiTips.map((tip, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-150">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 mb-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-indigo-500 shrink-0" />
                    {tip.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-sans">{tip.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity Log */}
          <div className="p-6 rounded-3xl bg-white border border-slate-205 shadow-sm">
            <h3 className="text-sm font-bold text-slate-850 uppercase tracking-wider font-mono mb-4 flex items-center gap-1.5">
              <Activity className="h-4.5 w-4.5 text-indigo-600" /> Recent Session Log
            </h3>

            {recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((act, index) => (
                  <div key={index} className="flex gap-3">
                    <div className="relative flex flex-col items-center">
                      <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                      {index < recentActivities.length - 1 && (
                        <div className="w-0.5 bg-slate-200 flex-grow my-1 border-dashed border-l border-slate-300" />
                      )}
                    </div>
                    <div className="min-w-0 flex-grow pb-1">
                      <p className="text-xs font-medium text-slate-700">{act.text}</p>
                      <span className="text-[10px] text-slate-400 font-mono inline-block mt-0.5">{act.time}</span>
                      {act.action && (
                        <button
                           onClick={act.action}
                           className="block text-[10px] text-indigo-600 font-bold hover:underline mt-1 hover:text-indigo-700 cursor-pointer"
                        >
                          {act.actionText} &rarr;
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6">
                <p className="text-slate-500 font-mono text-xs">No active activities today. Open a document to start logging points.</p>
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
