/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import LandingPage from './components/LandingPage';
import LoginRegister from './components/LoginRegister';
import Sidebar from './components/Sidebar';
import DashboardView from './components/DashboardView';
import UploadView from './components/UploadView';
import SummarizerView from './components/SummarizerView';
import MentorView from './components/MentorView';
import QuizView from './components/QuizView';
import FlashcardView from './components/FlashcardView';
import PlannerView from './components/PlannerView';
import ProfileSettingsView from './components/ProfileSettingsView';

import { 
  UserProfile, 
  UploadedFile, 
  StudyPlan, 
  StudySparkNotification, 
  DashboardStats 
} from './types';
import { Sparkles, Trash2, X, CheckSquare } from 'lucide-react';

export default function App() {
  // Core navigation tab state
  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // User auth state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Workspace files list
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [activeDocument, setActiveDocument] = useState<UploadedFile | null>(null);

  // Study schedule plan state
  const [currentPlan, setCurrentPlan] = useState<StudyPlan | null>(null);

  // System notification alerts state
  const [notifications, setNotifications] = useState<StudySparkNotification[]>([
    {
      id: 'n_welcome',
      title: 'StudySpark AI Online',
      description: 'Your advanced AI active-recall learning instruments are ready.',
      type: 'success',
      timestamp: 'Just now',
      read: false
    }
  ]);
  const [showNotifications, setShowNotifications] = useState(false);

  // Statistics trackers
  const [studyHours, setStudyHours] = useState(6);
  const [quizScore, setQuizScore] = useState(0);

  // Synchronize Auth on startup
  useEffect(() => {
    const cachedUser = localStorage.getItem('studyspark_current_user');
    if (cachedUser) {
      try {
        const profile = JSON.parse(cachedUser);
        setUser(profile);
        setCurrentTab('dashboard');
      } catch {
        setUser(null);
      }
    }

    // Load materials list
    const cachedFiles = localStorage.getItem('studyspark_files');
    if (cachedFiles) {
      try {
        const files: UploadedFile[] = JSON.parse(cachedFiles);
        setUploadedFiles(files);
        if (files.length > 0) {
          setActiveDocument(files[0]);
        }
      } catch {
        setUploadedFiles([]);
      }
    }

    // Load active scheduler plan
    const cachedPlan = localStorage.getItem('studyspark_planner_plan');
    if (cachedPlan) {
      try {
        const plan: StudyPlan = JSON.parse(cachedPlan);
        setCurrentPlan(plan);
      } catch {
        setCurrentPlan(null);
      }
    }

    // Load stats
    const cachedHours = localStorage.getItem('studyspark_stats_hours');
    const cachedScore = localStorage.getItem('studyspark_stats_score');
    if (cachedHours) setStudyHours(Number(cachedHours));
    if (cachedScore) setQuizScore(Number(cachedScore));
  }, []);

  // Utility to fire custom notification toast
  const addNotification = (title: string, desc: string, type: 'info' | 'success' | 'warning' = 'info') => {
    const newNote: StudySparkNotification = {
      id: `note_${Date.now()}`,
      title,
      description: desc,
      type,
      timestamp: new Date().toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
      read: false
    };

    setNotifications(prev => {
      const updated = [newNote, ...prev];
      return updated.slice(0, 15); // keep max 15 alerts
    });
  };

  const handleUpdateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
    localStorage.setItem('studyspark_current_user', JSON.stringify(updatedUser));
  };

  const handleClearStats = () => {
    setUploadedFiles([]);
    setActiveDocument(null);
    setCurrentPlan(null);
    setStudyHours(0);
    setQuizScore(0);
    localStorage.removeItem('studyspark_files');
    localStorage.removeItem('studyspark_planner_plan');
    localStorage.setItem('studyspark_stats_hours', '0');
    localStorage.setItem('studyspark_stats_score', '0');
  };

  const handleAuthSuccess = (profile: UserProfile) => {
    setUser(profile);
    localStorage.setItem('studyspark_current_user', JSON.stringify(profile));
    setCurrentTab('dashboard');
    addNotification('Identity Authorized', `Logged in successfully as ${profile.name}!`, 'success');
  };

  const handleGuestMode = () => {
    const guestProfile: UserProfile = {
      name: 'Guest Scholar',
      email: 'guest@studyspark.ai',
      joinedDate: new Date().toISOString().split('T')[0],
      institution: 'Guest Academy',
      studyGoal: 'Try StudySpark active-recall guides',
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Guest'
    };
    setUser(guestProfile);
    setCurrentTab('dashboard');
    addNotification('Guest Mode Activated', 'Explore AI parsers and study generators freely.', 'info');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('studyspark_current_user');
    setCurrentTab('landing');
  };

  // Files adjustments sync
  const handleAddDocument = (doc: UploadedFile) => {
    const updated = [doc, ...uploadedFiles];
    setUploadedFiles(updated);
    setActiveDocument(doc);
    localStorage.setItem('studyspark_files', JSON.stringify(updated));

    // increment learning stats on file upload
    const nextHours = studyHours + 1.2;
    setStudyHours(parseFloat(nextHours.toFixed(1)));
    localStorage.setItem('studyspark_stats_hours', nextHours.toFixed(1));

    addNotification(
      'Document Configured',
      `"${doc.name}" is now stored in workspace list.`,
      'success'
    );
  };

  const handleDeleteDocument = (docId: string) => {
    const updated = uploadedFiles.filter(d => d.id !== docId);
    setUploadedFiles(updated);
    localStorage.setItem('studyspark_files', JSON.stringify(updated));

    if (activeDocument?.id === docId) {
      setActiveDocument(updated.length > 0 ? updated[0] : null);
    }

    addNotification(
      'Document Removed',
      'The selected text workbook was purged from browser list.',
      'info'
    );
  };

  const handleUpdateDocumentText = (docId: string, text: string) => {
    const updated = uploadedFiles.map(d => d.id === docId ? { ...d, extractedText: text } : d);
    setUploadedFiles(updated);
    localStorage.setItem('studyspark_files', JSON.stringify(updated));

    if (activeDocument && activeDocument.id === docId) {
      setActiveDocument(prev => prev ? { ...prev, extractedText: text } : null);
    }
  };

  // Planner configurations
  const handleSetPlan = (plan: StudyPlan) => {
    setCurrentPlan(plan);
    localStorage.setItem('studyspark_planner_plan', JSON.stringify(plan));
  };

  const handleToggleScheduleItem = (itemId: string) => {
    if (!currentPlan) return;
    
    const updatedSchedule = currentPlan.dailySchedule.map(slot => {
      if (slot.id === itemId) {
        const nextState = !slot.completed;
        if (nextState) {
          // Increment progress hours
          const added = studyHours + 0.5;
          setStudyHours(parseFloat(added.toFixed(1)));
          localStorage.setItem('studyspark_stats_hours', added.toFixed(1));
          addNotification('Study Time Complete', `Completed slot "${slot.task}"! Tracked study stats.`, 'success');
        }
        return { ...slot, completed: nextState };
      }
      return slot;
    });

    const activePlan = {
      ...currentPlan,
      dailySchedule: updatedSchedule
    };

    setCurrentPlan(activePlan);
    localStorage.setItem('studyspark_planner_plan', JSON.stringify(activePlan));
  };

  // Quizzes scoring increments
  const handleUpdateQuizStats = (score: number) => {
    const nextHours = parseFloat((studyHours + 0.8).toFixed(1));
    setStudyHours(nextHours);
    localStorage.setItem('studyspark_stats_hours', nextHours.toString());

    // Calc average quiz scores
    const currentScores = quizScore > 0 ? [quizScore, score] : [score];
    const mean = Math.round(currentScores.reduce((a, b) => a + b, 0) / currentScores.length);
    setQuizScore(mean);
    localStorage.setItem('studyspark_stats_score', mean.toString());
  };

  // Select document directly
  const handleSelectDocumentDirect = (docId: string) => {
    const found = uploadedFiles.find(f => f.id === docId);
    if (found) setActiveDocument(found);
  };

  // Stats packaging
  const dashboardStats: DashboardStats = {
    documentsCount: uploadedFiles.length,
    studyHours: studyHours,
    averageQuizScore: quizScore,
    learnedCount: uploadedFiles.filter(f => f.metadata).length,
    streak: uploadedFiles.length > 0 ? 5 : 1, // simulated high visual streak based on uploads
    chartData: [
      { day: 'Mon', hours: 1.5, quizzes: 80 },
      { day: 'Tue', hours: studyHours > 3 ? 3.0 : 0.8, quizzes: 90 },
      { day: 'Wed', hours: studyHours > 5 ? 4.5 : 1.2, quizzes: 75 }
    ]
  };

  // Render selection helpers
  const renderTabContent = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardView 
            user={user}
            uploadedFiles={uploadedFiles}
            onTabChange={setCurrentTab}
            stats={dashboardStats}
            currentPlan={currentPlan}
            onToggleScheduleItem={handleToggleScheduleItem}
            onSelectDocument={handleSelectDocumentDirect}
          />
        );
      case 'upload':
        return (
          <UploadView 
            uploadedFiles={uploadedFiles}
            activeDocument={activeDocument}
            onSelectDocument={setActiveDocument}
            onAddDocument={handleAddDocument}
            onDeleteDocument={handleDeleteDocument}
            onUpdateDocumentText={handleUpdateDocumentText}
          />
        );
      case 'summaries':
        return (
          <SummarizerView 
            activeDocument={activeDocument}
            uploadedFiles={uploadedFiles}
            onSelectDocument={setActiveDocument}
            onAddNotification={addNotification}
          />
        );
      case 'mentor':
        return (
          <MentorView 
            activeDocument={activeDocument}
            uploadedFiles={uploadedFiles}
            onSelectDocument={setActiveDocument}
          />
        );
      case 'quiz':
        return (
          <QuizView 
            activeDocument={activeDocument}
            uploadedFiles={uploadedFiles}
            onSelectDocument={setActiveDocument}
            onAddNotification={addNotification}
            onUpdateQuizStats={handleUpdateQuizStats}
          />
        );
      case 'flashcards':
        return (
          <FlashcardView 
            activeDocument={activeDocument}
            uploadedFiles={uploadedFiles}
            onSelectDocument={setActiveDocument}
            onAddNotification={addNotification}
          />
        );
      case 'planner':
        return (
          <PlannerView 
            currentPlan={currentPlan}
            onSetPlan={handleSetPlan}
            onToggleScheduleItem={handleToggleScheduleItem}
            onAddNotification={addNotification}
            activeDocument={activeDocument}
            uploadedFiles={uploadedFiles}
          />
        );
      case 'settings':
        return (
          <ProfileSettingsView 
            user={user}
            onUpdateUser={handleUpdateUser}
            onClearStats={handleClearStats}
            onLogout={handleLogout}
            onAddNotification={addNotification}
          />
        );
      default:
        return <LandingPage onGetStarted={() => setCurrentTab(user ? 'dashboard' : 'auth')} />;
    }
  };

  // 1. Render Landing view
  if (currentTab === 'landing') {
    return <LandingPage onGetStarted={() => setCurrentTab(user ? 'dashboard' : 'auth')} />;
  }

  // 2. Render Login Form block
  if (currentTab === 'auth') {
    return (
      <LoginRegister 
        onAuthSuccess={handleAuthSuccess}
        onGuestMode={handleGuestMode}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800 overflow-hidden">
      
      {/* Sidebar menu Navigation */}
      <Sidebar 
        currentTab={currentTab}
        onTabChange={(tab) => { setCurrentTab(tab); setShowNotifications(false); }}
        user={user}
        notifications={notifications}
        onToggleNotifications={() => setShowNotifications(!showNotifications)}
        showNotifications={showNotifications}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Primary content areas wrapper */}
      <main className="flex-grow overflow-y-auto relative bg-slate-50">
        {renderTabContent()}

        {/* Notifications Slide-In Drawer overlay */}
        {showNotifications && (
          <div className="absolute top-0 right-0 h-full w-80 bg-white border-l border-slate-200 shadow-2xl z-50 flex flex-col justify-between">
            <div className="p-6">
              <div className="flex items-center justify-between border-b border-slate-105 pb-3 mb-4">
                <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5 font-mono uppercase">
                  <Sparkles size={16} className="text-indigo-600 animate-pulse" /> System Alerts
                </h3>
                <button 
                  onClick={() => setShowNotifications(false)}
                  className="text-slate-400 hover:text-slate-800 transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Lists drawer */}
              <div className="space-y-3.5 max-h-[80vh] overflow-y-auto pr-1">
                {notifications.map(note => (
                  <div 
                    key={note.id}
                    className={`p-3.5 rounded-xl border text-xs ${
                      note.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' :
                      note.type === 'warning' ? 'bg-rose-50 border-rose-100 text-rose-800' : 
                      'bg-slate-50 border-slate-200 text-slate-600'
                    }`}
                  >
                    <div className="flex justify-between items-baseline">
                      <strong className="font-bold leading-normal text-slate-800">{note.title}</strong>
                      <span className="text-[9px] text-slate-400 font-mono shrink-0 select-none">{note.timestamp}</span>
                    </div>
                    <p className="text-slate-500 mt-1 leading-normal font-sans text-[11px]">{note.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Clear trigger footer */}
            <div className="p-4 border-t border-slate-105 flex justify-between">
              <button
                onClick={() => setNotifications([{ id: 'n_01', title: 'Stream Reset', description: 'Study alerts cleaned.', type: 'info', timestamp: 'Now', read: true }])}
                className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-55 text-slate-500 hover:text-slate-800 text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-2"
              >
                <Trash2 size={13} /> Clear Board Logs
              </button>
            </div>
          </div>
        )}
      </main>

    </div>
  );
}
