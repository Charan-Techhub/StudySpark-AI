import React from 'react';
import { Sparkles, BrainCircuit, BookOpen, GraduationCap, CheckCircle, ArrowRight, Zap, HelpCircle } from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

export default function LandingPage({ onGetStarted }: LandingPageProps) {
  const features = [
    {
      icon: <BrainCircuit className="h-6 w-6 text-emerald-400" />,
      title: "Smart Summaries",
      desc: "Instant breakdown into multiple lengths: short highlights, medium, detailed study sheets, or academic abstracts."
    },
    {
      icon: <GraduationCap className="h-6 w-6 text-cyan-400" />,
      title: "AI Mentor Guidance",
      desc: "Our interactive chatbot mentor answers specific formulas, explains math equations, and gives textbook examples."
    },
    {
      icon: <Sparkles className="h-6 w-6 text-purple-400" />,
      title: "Quiz Generator",
      desc: "Transform any material into interactive MCQs, True/False lists, short statements or long academic answers."
    },
    {
      icon: <BookOpen className="h-6 w-6 text-pink-400" />,
      title: "Recall Flashcards",
      desc: "Fully responsive flippable visual flashcards with bookmarked lists, quick shuffling, and automated active-recall practice."
    },
    {
      icon: <Zap className="h-6 w-6 text-yellow-400" />,
      title: "Study Planner",
      desc: "Generates custom daily schedule slots, space-repetition calendars, and milestone trackers based on your exam dates."
    }
  ];

  const testimonials = [
    {
      quote: "StudySpark AI revolutionized my biochemistry study prep. I generated 40 custom flashcards from my lecture slide notes in under 10 seconds. Got an A!",
      author: "Elena Rostov",
      role: "Undergrad, Stanford University"
    },
    {
      quote: "The Study Planner saved me for my engineering boards. It parsed standard textbook chapters, highlighted critical formulas in red, and auto-scheduled daily revision times.",
      author: "Devon Chen",
      role: "M.S. Candidate, MIT"
    }
  ];

  const faqs = [
    {
      q: "What files can I upload to StudySpark AI?",
      a: "You can upload standard TXT, RTF, PDF, DOCX, DOC, PPTX, PPT, XLSX, or XLS files, or directly copy and paste your notes into our text workspace editor."
    },
    {
      q: "How does the AI highlighter color-coding work?",
      a: "Our AI model parses text and colors Definitions in bright blue, Exam Questions or vital points in red, Examples in green, and Keywords in vivid yellow."
    },
    {
      q: "Can I download my notes and summaries?",
      a: "Yes! StudySpark provides a beautifully formatted PDF export feature that allows you to download your polished study notes, summaries, tables, and highlights instantly for offline viewing."
    }
  ];

  return (
    <div className="relative min-h-screen bg-slate-50 text-slate-800 overflow-hidden font-sans">
      {/* Background Gradients */}
      <div className="absolute top-0 left-0 w-full h-[600px] bg-gradient-to-b from-indigo-50/60 via-slate-50/20 to-transparent pointer-events-none" />
      <div className="absolute top-[340px] right-[-200px] w-[500px] h-[500px] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="absolute top-[800px] left-[-250px] w-[600px] h-[600px] bg-violet-600/5 rounded-full filter blur-[150px] pointer-events-none" />

      {/* Header */}
      <header className="relative max-w-7xl mx-auto px-6 py-6 flex items-center justify-between border-b border-slate-200/60">
        <div className="flex items-center space-x-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-md">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            StudySpark <span className="text-indigo-600 font-semibold">AI</span>
          </span>
        </div>
        <div>
          <button 
            onClick={onGetStarted}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-all duration-200 shadow-sm flex items-center gap-2 cursor-pointer"
          >
            Go to Dashboard <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative max-w-5xl mx-auto text-center px-6 pt-20 pb-24">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-750 text-xs font-semibold mb-8 hover:border-indigo-300 shadow-sm transition-all">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500 animate-pulse" />
          The Ultimate Academic Accelerator
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6 leading-tight">
          Supercharge Your Study Session With <strong className="text-indigo-600 font-extrabold">Next-Gen AI</strong>
        </h1>
        <p className="text-lg md:text-xl text-slate-500 max-w-3xl mx-auto mb-10 leading-relaxed font-normal">
          Upload PDFs, Word docs, notes or textbooks. Unlock color-coded AI smart summaries, active-recall study flashcards, complete test generators, calendars, and a robust personal AI Mentor.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={onGetStarted}
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-md font-bold bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 transition-all duration-300 transform hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-2"
          >
            Get Started For Free <ArrowRight className="h-5 w-5" />
          </button>
          <a
            href="#features"
            className="w-full sm:w-auto px-8 py-4 rounded-xl text-md font-semibold bg-white border border-slate-200 text-slate-650 hover:bg-slate-50 hover:text-slate-800 transition-all duration-200 text-center flex items-center justify-center"
          >
            Explore Features
          </a>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="relative max-w-7xl mx-auto px-6 py-20 border-t border-slate-200/80">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 mb-4">
            Everything You Need, All Powered by AI
          </h2>
          <p className="text-slate-500 text-base md:text-lg">
            Say goodbye to disorganized notes and boring textbook cramming. Our multimodal parser processes all formats to synthesize pristine learning aids.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feat, idx) => (
            <div 
              key={idx} 
              className="group p-8 rounded-2xl bg-white border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/5 p-6 flex flex-col space-y-4 hover:shadow-md transition-all duration-300"
            >
              <div className="h-12 w-12 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center group-hover:scale-105 transition-transform duration-200">
                {feat.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-800 tracking-tight">{feat.title}</h3>
              <p className="text-slate-550 text-sm leading-relaxed flex-grow">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials */}
      <section className="relative max-w-6xl mx-auto px-6 py-16 border-t border-slate-200/80">
        <div className="text-center mb-12">
          <span className="text-sm font-semibold tracking-wider text-indigo-600 uppercase">Testimonials</span>
          <h2 className="text-3xl font-bold text-slate-900 mt-2">Loved by Students & Academics</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {testimonials.map((test, index) => (
            <div 
              key={index} 
              className="p-8 rounded-2xl bg-white border border-slate-200 flex flex-col justify-between shadow-sm"
            >
              <p className="text-slate-650 italic text-md leading-relaxed mb-6">
                "{test.quote}"
              </p>
              <div className="flex items-center space-x-4">
                <div className="h-[44px] w-[44px] rounded-full bg-slate-50 flex items-center justify-center font-bold text-indigo-600 text-lg border border-slate-200 shadow-inner">
                  {test.author.charAt(0)}
                </div>
                <div>
                  <h4 className="font-semibold text-slate-800 text-sm">{test.author}</h4>
                  <p className="text-xs text-slate-400 font-mono">{test.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative max-w-4xl mx-auto px-6 py-16 border-t border-slate-200/80">
        <h2 className="text-3xl font-bold text-slate-900 text-center mb-10 flex items-center justify-center gap-3">
          <HelpCircle className="h-7 w-7 text-indigo-500" /> Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          {faqs.map((faq, index) => (
            <div 
              key={index}
              className="p-6 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50 transition-all shadow-sm"
            >
              <h4 className="text-lg font-bold text-slate-800 mb-2 flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                {faq.q}
              </h4>
              <p className="text-slate-600 text-sm leading-relaxed pl-7 font-normal">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative max-w-7xl mx-auto px-6 py-10 border-t border-slate-200/80 flex flex-col md:flex-row items-center justify-between text-slate-450 text-sm">
        <div>
          &copy; {new Date().getFullYear()} StudySpark AI. All rights reserved. Registered SaaS product.
        </div>
        <div className="flex space-x-6 mt-4 md:mt-0 font-mono text-xs">
          <a href="#" className="hover:text-indigo-600 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Contact Support</a>
        </div>
      </footer>
    </div>
  );
}
