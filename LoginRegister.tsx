import React, { useState } from 'react';
import { Sparkles, Mail, Lock, User, LogIn, UserPlus } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginRegisterProps {
  onAuthSuccess: (user: UserProfile) => void;
  onGuestMode: () => void;
}

export default function LoginRegister({ onAuthSuccess, onGuestMode }: LoginRegisterProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [institution, setInstitution] = useState('');
  const [studyGoal, setStudyGoal] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!email || !password) {
      setErrorMsg('Please provide email and password.');
      return;
    }

    if (!isLogin && !name) {
      setErrorMsg('Please specify your name.');
      return;
    }

    // Load registered users database in localStorage
    const savedUsersStr = localStorage.getItem('studyspark_registered_users') || '[]';
    let users: any[] = [];
    try {
      users = JSON.parse(savedUsersStr);
    } catch {
      users = [];
    }

    if (isLogin) {
      // Find user
      const existingUser = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      if (existingUser) {
        const profile: UserProfile = {
          name: existingUser.name,
          email: existingUser.email,
          institution: existingUser.institution || 'Self-Study',
          studyGoal: existingUser.studyGoal || 'Exams Preparation',
          joinedDate: existingUser.joinedDate || new Date().toISOString().split('T')[0],
          avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(existingUser.name)}`
        };
        setSuccessMsg(`Welcome back, ${existingUser.name}! Loading dashboard...`);
        setTimeout(() => {
          onAuthSuccess(profile);
        }, 1000);
      } else {
        // Check if there is a default account so student can instantly test
        if (email.toLowerCase() === 'student@studyspark.ai' && password === 'studyspark') {
          const defaultProfile: UserProfile = {
            name: 'Academic Scholar',
            email: 'student@studyspark.ai',
            institution: 'University of Science',
            studyGoal: 'Master Calculus & Quantum Physics',
            joinedDate: '2026-06-20',
            avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Scholar'
          };
          setSuccessMsg('Welcome to StudySpark! Loading dashboard...');
          setTimeout(() => {
            onAuthSuccess(defaultProfile);
          }, 1000);
        } else {
          setErrorMsg('Invalid email or password. Feel free to use Guest Mode or register a new account!');
        }
      }
    } else {
      // Check if user already exists
      const alreadyRegistered = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (alreadyRegistered) {
        setErrorMsg('Email already registered! Try logging in.');
        return;
      }

      // Save user
      const newUser = {
        name,
        email,
        password,
        institution: institution || 'Self-Study',
        studyGoal: studyGoal || 'General Learning',
        joinedDate: new Date().toISOString().split('T')[0]
      };
      users.push(newUser);
      localStorage.setItem('studyspark_registered_users', JSON.stringify(users));

      const profile: UserProfile = {
        name: newUser.name,
        email: newUser.email,
        institution: newUser.institution,
        studyGoal: newUser.studyGoal,
        joinedDate: newUser.joinedDate,
        avatarUrl: `https://api.dicebear.com/7.x/pixel-art/svg?seed=${encodeURIComponent(newUser.name)}`
      };

      setSuccessMsg(`Account created for ${name}! Redirecting to dashboard...`);
      setTimeout(() => {
        onAuthSuccess(profile);
      }, 1000);
    }
  };

  const handleGoogleLogin = () => {
    setErrorMsg('');
    setSuccessMsg('');
    // Highly interactive mock Google authentication
    const mockGoogleProfile: UserProfile = {
      name: 'Charan Gannavarapu',
      email: 'charan.gannavarapu2006@gmail.com',
      institution: 'Global Academy of Technology',
      studyGoal: 'Deep Learning & Advanced Engineering Math',
      joinedDate: new Date().toISOString().split('T')[0],
      avatarUrl: 'https://api.dicebear.com/7.x/pixel-art/svg?seed=Charan'
    };
    setSuccessMsg('Signing in with Google auth... Initializing StudySpark Cloud.');
    setTimeout(() => {
      onAuthSuccess(mockGoogleProfile);
    }, 1200);
  };

  return (
    <div className="relative min-h-screen bg-slate-50 flex items-center justify-center p-6 text-slate-800 overflow-hidden font-sans">
      {/* Radiant Glow Spots */}
      <div className="absolute top-[10%] left-[20%] w-[400px] h-[400px] bg-indigo-100/30 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-indigo-200/20 rounded-full filter blur-[100px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-white border border-slate-200 rounded-3xl p-8 shadow-xl shadow-slate-200/50">
        
        {/* Brand header */}
        <div className="flex flex-col items-center mb-8">
          <div className="h-12 w-12 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-md mb-3">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {isLogin ? 'Welcome back' : 'Create your account'}
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-[280px] text-center">
            {isLogin ? 'Log in to continue learning with your personal AI tutors.' : 'Join hundreds of scholars turning transcripts into perfect study aids.'}
          </p>
        </div>

        {/* Info alerts */}
        {errorMsg && (
          <div id="auth-error-alert" className="mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div id="auth-success-alert" className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleFormSubmit} className="space-y-4">
          
          {!isLogin && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
                  <input 
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="E.g. Alan Turing"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 font-sans transition-all shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Institution / School</label>
                <div className="relative">
                  <span className="absolute left-3.5 top-3.5 text-slate-400 font-sans text-sm font-semibold">@</span>
                  <input 
                    type="text"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    placeholder="E.g. Cambridge College"
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans shadow-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Study Goal / Exam Target</label>
                <input 
                  type="text"
                  value={studyGoal}
                  onChange={(e) => setStudyGoal(e.target.value)}
                  placeholder="E.g. Pass Calculus AP, Learn organic chem"
                  className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans shadow-sm"
                />
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@school.edu"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans shadow-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase font-mono tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-400" />
              <input 
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans shadow-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl shadow-md shadow-indigo-600/10 cursor-pointer active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm mt-3"
          >
            {isLogin ? (
              <>
                <LogIn className="h-4.5 w-4.5" /> Sign In
              </>
            ) : (
              <>
                <UserPlus className="h-4.5 w-4.5" /> Register Profile
              </>
            )}
          </button>
        </form>

        <div className="relative my-6 flex items-center justify-center">
          <div className="absolute w-full border-t border-slate-205" />
          <span className="relative bg-white px-3 text-xs text-slate-450 uppercase font-mono font-bold">Or Connect with</span>
        </div>

        {/* Google Authentication Button */}
        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 py-2.5 px-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition active:scale-[0.98] cursor-pointer font-sans mb-3 shadow-sm"
        >
          <svg className="h-4.5 w-4.5 text-red-500" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.25.61 4.5 1.62l2.435-2.435C17.41 1.69 14.97 1 12.24 1A9.99 9.99 0 002.25 11a9.991 9.991 0 009.99 10c5.445 0 9.77-3.834 9.77-9.715 0-.585-.05-1.154-.15-1.7H12.24z"/>
          </svg>
          Google Login
        </button>

        <button
          onClick={onGuestMode}
          type="button"
          className="w-full bg-slate-50 hover:bg-slate-100 text-indigo-600 font-semibold py-2 px-4 rounded-xl text-xs flex items-center justify-center gap-1 transition cursor-pointer shadow-sm"
        >
          Skip / Enter in Guest Mode &rarr;
        </button>

        {/* Footer info toggle */}
        <div className="text-center mt-6 text-xs text-slate-500">
          {isLogin ? (
            <p>
              Don't have an account?{' '}
              <button onClick={() => setIsLogin(false)} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
                Create one now
              </button>
            </p>
          ) : (
            <p>
              Already registered?{' '}
              <button onClick={() => setIsLogin(true)} className="text-indigo-600 font-semibold hover:underline cursor-pointer">
                Log in here
              </button>
            </p>
          )}
          {isLogin && (
            <div className="mt-3 p-2 bg-slate-50 border border-slate-150 rounded-lg text-slate-500 font-mono text-[10px]">
              Fast test credentials: <span className="text-slate-700 font-semibold">student@studyspark.ai</span> / <span className="text-slate-700 font-semibold">studyspark</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
