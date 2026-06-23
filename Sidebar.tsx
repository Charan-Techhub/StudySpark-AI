import React from 'react';
import { 
  Sparkles, 
  LayoutDashboard, 
  Upload, 
  BookOpen, 
  GraduationCap, 
  Activity, 
  Sparkle, 
  Brain,
  Calendar,
  Settings,
  Bell,
  LogOut,
  User,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { UserProfile, StudySparkNotification } from '../types';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: UserProfile | null;
  notifications: StudySparkNotification[];
  onToggleNotifications: () => void;
  showNotifications: boolean;
  onLogout: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({
  currentTab,
  onTabChange,
  user,
  notifications,
  onToggleNotifications,
  showNotifications,
  onLogout,
  collapsed,
  onToggleCollapse
}: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'upload', label: 'Upload Workspace', icon: <Upload size={20} /> },
    { id: 'summaries', label: 'AI Summaries', icon: <BookOpen size={20} /> },
    { id: 'mentor', label: 'AI Mentor Chat', icon: <GraduationCap size={20} /> },
    { id: 'quiz', label: 'AI Exam Prep (Quiz)', icon: <Activity size={20} /> },
    { id: 'flashcards', label: 'Recall Flashcards', icon: <Brain size={20} /> },
    { id: 'planner', label: 'Study Scheduler', icon: <Calendar size={20} /> },
    { id: 'settings', label: 'Profile & Settings', icon: <Settings size={20} /> },
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <aside className={`relative shrink-0 bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'}`}>
      
      {/* Upper Navigation block */}
      <div>
        {/* Brand header */}
        <div className="p-6 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3 overflow-hidden">
            <div className="h-9 w-9 shrink-0 rounded-xl bg-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4.5 w-4.5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-md font-bold tracking-tight text-slate-800 whitespace-nowrap">
                StudySpark <span className="text-indigo-600 font-mono text-xs">AI</span>
              </span>
            )}
          </div>
          <button 
            onClick={onToggleCollapse}
            className="p-1 px-1.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          </button>
        </div>

        {/* User Card inside Sidebar */}
        {!collapsed && user && (
          <div className="p-4 mx-3 my-4 rounded-2xl bg-slate-50 border border-slate-150 flex items-center gap-3">
            <img 
              src={user.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(user.name)}`} 
              alt="Avatar" 
              className="h-10 w-10 rounded-xl bg-white border border-slate-200 p-0.5 object-cover"
            />
            <div className="min-w-0 flex-grow">
              <h4 className="text-xs font-bold text-slate-800 truncate">{user.name}</h4>
              <p className="text-[10px] text-slate-500 truncate font-mono">{user.email}</p>
            </div>
          </div>
        )}

        {/* Navigation list */}
        <nav className="p-4 space-y-1.5">
          {menuItems.map(item => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left text-sm font-semibold transition-all cursor-pointer ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-600 border-l-4 border-indigo-600 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
                }`}
              >
                <span className={isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600'}>
                  {item.icon}
                </span>
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Footer System with Notifications & Logout */}
      <div className="p-4 border-t border-slate-100 space-y-2">
        <button
          onClick={onToggleNotifications}
          className={`w-full flex items-center justify-between px-4 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
            showNotifications 
              ? 'bg-slate-100 border border-slate-200 text-indigo-600 font-bold' 
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="relative">
              <Bell size={20} />
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 text-white rounded-full flex items-center justify-center text-[9px] font-bold">
                  {unreadNotifications}
                </span>
              )}
            </div>
            {!collapsed && <span>System Alerts</span>}
          </div>
          {!collapsed && unreadNotifications > 0 && (
            <span className="text-[10px] bg-red-105 text-red-650 px-1.5 py-0.5 rounded-full font-bold">
              New
            </span>
          )}
        </button>

        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-left text-sm font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
        >
          <LogOut size={20} />
          {!collapsed && <span>Quit Study Session</span>}
        </button>
      </div>
    </aside>
  );
}
