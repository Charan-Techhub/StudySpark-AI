import React, { useState } from 'react';
import { 
  User, 
  Settings, 
  Trash2, 
  Check, 
  Sparkles, 
  AlertTriangle,
  LogOut,
  Sliders,
  Shield,
  Upload
} from 'lucide-react';
import { UserProfile } from '../types';

interface ProfileSettingsViewProps {
  user: UserProfile | null;
  onUpdateUser: (user: UserProfile) => void;
  onClearStats: () => void;
  onLogout: () => void;
  onAddNotification: (title: string, desc: string, type: 'info' | 'success' | 'warning') => void;
}

export default function ProfileSettingsView({
  user,
  onUpdateUser,
  onClearStats,
  onLogout,
  onAddNotification
}: ProfileSettingsViewProps) {
  const [name, setName] = useState(user?.name || 'Local Scholar');
  const [email, setEmail] = useState(user?.email || 'scholar@studyspark.ai');
  const [institution, setInstitution] = useState(user?.institution || 'Global Academy');
  const [studyGoal, setStudyGoal] = useState(user?.studyGoal || 'Learn Organic Chemistry');
  const [avatarSeed, setAvatarSeed] = useState(user?.name || 'Scholar');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [dailyReminder, setDailyReminder] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);

    const updatedProfile: UserProfile = {
      name: name.trim(),
      email: email.trim(),
      institution: institution.trim(),
      studyGoal: studyGoal.trim(),
      joinedDate: user?.joinedDate || new Date().toISOString().split('T')[0],
      avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}`
    };

    onUpdateUser(updatedProfile);
    onAddNotification('Profile Configured', 'Your personal bio was saved in the browser cache database.', 'success');

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleResetHistory = () => {
    onClearStats();
    onAddNotification(
      'Stats Reset Approved',
      'Discarded logged streak levels and clear active textbook lists.',
      'warning'
    );
  };

  return (
    <div className="p-6 md:p-8 space-y-8 bg-slate-950 text-slate-100 min-h-screen font-sans">
      
      {/* Header */}
      <div className="border-b border-slate-900 pb-5">
        <h1 className="text-3xl font-extrabold text-white">Profile & Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure your personal university credentials, learning reminders, and clean cached lists.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left column 7: Profile forms */}
        <div className="lg:col-span-7 p-6 md:p-8 rounded-3xl bg-slate-900/30 border border-slate-900/60 shadow-md">
          <h3 className="text-sm font-bold text-white mb-6 uppercase tracking-wider font-mono text-slate-400 flex items-center gap-2">
            <User className="h-4.5 w-4.5 text-cyan-400" /> Academic Dossier Configuration
          </h3>

          <form onSubmit={handleSaveProfile} className="space-y-5">
            
            <div className="flex items-center gap-4 border-b border-slate-900 pb-5">
              <img 
                src={`https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(avatarSeed)}`}
                alt="Dicebear block avatar"
                className="h-16 w-16 rounded-2xl bg-slate-950 border border-slate-800 p-1 shrink-0"
              />
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block font-bold">Avatar Pixel-Art seed:</span>
                <input 
                  type="text"
                  value={avatarSeed}
                  onChange={(e) => setAvatarSeed(e.target.value)}
                  placeholder="Type anything to randomize pixel seed"
                  className="bg-slate-950 border border-slate-850 rounded-lg p-2 text-xs text-slate-200 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Dossier Name</label>
                <input 
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono font-bold">Primary Academy Email</label>
                <input 
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">School / Academy Institution</label>
                <input 
                  type="text"
                  value={institution}
                  onChange={(e) => setInstitution(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono">Primary Scholar Objectives</label>
                <input 
                  type="text"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  className="w-full bg-slate-950/50 border border-slate-850 rounded-xl py-3 px-4 text-xs text-slate-200 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-cyan-500 hover:from-purple-500 hover:to-cyan-400 text-white font-bold rounded-xl shadow-md transition active:scale-[0.98] text-xs flex items-center gap-1.5 mt-2 cursor-pointer"
            >
              {isSaved ? <><Check size={14} className="text-emerald-400" /> Bio Parameters Saved</> : <><Sliders size={14} /> UpdateBio Profile</>}
            </button>
          </form>

        </div>

        {/* Right column 5: Safety coordinates, reset and config switches */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Preferences switcher checklist */}
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900/60 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider font-mono text-slate-400 flex items-center gap-1.5">
              <Settings className="h-4.5 w-4.5 text-indigo-400" /> Scholar Preferences
            </h3>

            <div className="divide-y divide-slate-900">
              
              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 leading-normal">Card Audio Effects</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">Toggle sound loops during quiz submit and card spin actions.</p>
                </div>
                <button
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className={`h-5 w-9 shrink-0 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${soundEnabled ? 'bg-indigo-500' : 'bg-slate-850'}`}
                >
                  <span className={`h-3 w-3 bg-white rounded-full transition-transform ${soundEnabled ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="py-3.5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="text-xs font-bold text-slate-200 leading-normal">Study Reminders notifications</h4>
                  <p className="text-[9.5px] text-slate-500 mt-0.5">Auto notify when flashcards generate, summaries process or goals align.</p>
                </div>
                <button
                  onClick={() => setDailyReminder(!dailyReminder)}
                  className={`h-5 w-9 shrink-0 rounded-full transition-colors relative flex items-center p-1 cursor-pointer ${dailyReminder ? 'bg-indigo-500' : 'bg-slate-850'}`}
                >
                  <span className={`h-3 w-3 bg-white rounded-full transition-transform ${dailyReminder ? 'translate-x-4' : 'translate-x-0'}`} />
                </button>
              </div>

            </div>
          </div>

          {/* Safety section for resetting cache */}
          <div className="p-6 rounded-3xl bg-slate-900/30 border border-slate-900/60 shadow-md space-y-4">
            <h3 className="text-sm font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Shield className="h-4.5 w-4.5 text-rose-500" /> Danger System boundaries
            </h3>

            <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
              StudySpark registers and compiles your textbooks, summaries, plans, streaks, and quiz results inside standard `localStorage` memory fields. Cleaning your browser storage cleans your dashboard progress.
            </p>

            <div className="pt-2 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleResetHistory}
                type="button"
                className="w-full p-3 border border-red-950 hover:bg-red-950/15 text-red-400 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <Trash2 size={14} /> Clear Local Databanks
              </button>

              <button
                onClick={onLogout}
                type="button"
                className="w-full p-3 bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-350 text-xs font-bold rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <LogOut size={14} /> End Active Session
              </button>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
