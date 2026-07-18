import React, { useState, useEffect, useRef } from 'react';
import { 
  Brain, Building, FileText, Database, 
  LogOut, RefreshCw, Bell, Menu, X, Lock, MessageSquare, Send
} from 'lucide-react';
import { DB, Business, KnowledgeBase } from '../services/db';

// Subpages
import Boardroom from './Boardroom';
import Reports from './Reports';
import Documents from './Documents';
import Profile from './Profile';

interface DashboardProps {
  onLogout: () => void;
  onPurge: () => void;
}

export default function Dashboard({ onLogout, onPurge }: DashboardProps) {
  const [currentTab, setCurrentTab] = useState<'boardroom' | 'profile' | 'reports' | 'docs'>('boardroom');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Database State Trigger
  const [stateVersion, setStateVersion] = useState(0);
  const triggerStateReload = () => setStateVersion(prev => prev + 1);

  // Database Seeding States
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState<boolean | null>(null);
  const [seedError, setSeedError] = useState<string | null>(null);

  const handleSeedDatabase = async () => {
    setIsSeeding(true);
    setSeedSuccess(null);
    setSeedError(null);
    try {
      await (DB as any).seedInitialCollections();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(null), 5000);
    } catch (err: any) {
      console.error("Database seeding failed:", err);
      setSeedError(err.message || String(err));
    } finally {
      setIsSeeding(false);
    }
  };

  // Loaded DB data
  const [business, setBusiness] = useState<Business | null>(null);
  const [kbase, setKbase] = useState<KnowledgeBase | null>(null);

  // On-demand Onboarding Interview States
  const [showInterview, setShowInterview] = useState(false);
  const [chat, setChat] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    {
      sender: 'ai',
      text: "Welcome back! To compile your boardroom memory, let me know what specific products or services you primarily sell, and who your typical target customers are."
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isFinishingOnboarding, setIsFinishingOnboarding] = useState(false);
  const [interviewError, setInterviewError] = useState<string | null>(null);

  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showInterview) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chat, showInterview]);

  useEffect(() => {
    setBusiness(DB.getBusiness());
    setKbase(DB.getKnowledgeBase());
  }, [stateVersion]);

  if (!business || !kbase) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6 text-center">
        <div className="space-y-4">
          <Loader2 className="w-10 h-10 text-[#1E40AF] animate-spin mx-auto" />
          <h3 className="text-lg font-bold">Resyncing Corporate profile...</h3>
        </div>
      </div>
    );
  }

  const handleSendInterviewMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoadingQuestion) return;

    const userMsg = userInput.trim();
    setUserInput('');
    
    const updatedChat = [...chat, { sender: 'user' as const, text: userMsg }];
    setChat(updatedChat);
    setIsLoadingQuestion(true);
    setInterviewError(null);

    try {
      const docs = DB.getDocuments().filter(d => d.businessId === business.id);
      const response = await fetch('/api/discover/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: business,
          documents: docs,
          chatHistory: updatedChat
        })
      });

      if (!response.ok) {
        let errMsg = 'Server failed to respond to discovery chat';
        try {
          const errData = await response.json();
          if (errData?.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.isComplete && data.analysis) {
        setIsFinishingOnboarding(true);
        try {
          await DB.saveKnowledgeBase(data.analysis);
          await DB.addNotification(
            "AI Knowledge Base Compiled!",
            `BoardMind AI has compiled a complete SWOT, departments profile, and KPIs for ${business.name}.`,
            "success"
          );
          setTimeout(() => {
            triggerStateReload();
            setIsFinishingOnboarding(false);
            setShowInterview(false);
          }, 3000);
        } catch (err: any) {
          setIsFinishingOnboarding(false);
          setInterviewError(err.message || 'Saving knowledge base failed.');
        }
      } else {
        setChat(prev => [...prev, { sender: 'ai', text: data.nextQuestion }]);
      }
    } catch (err: any) {
      console.error(err);
      setInterviewError(err.message || 'Discovery chat failed.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  const retryLastInterviewAttempt = async () => {
    if (isLoadingQuestion) return;
    setIsLoadingQuestion(true);
    setInterviewError(null);

    try {
      const docs = DB.getDocuments().filter(d => d.businessId === business.id);
      const response = await fetch('/api/discover/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: business,
          documents: docs,
          chatHistory: chat
        })
      });

      if (!response.ok) {
        let errMsg = 'Server failed to respond to discovery chat';
        try {
          const errData = await response.json();
          if (errData?.error) {
            errMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(errMsg);
      }

      const data = await response.json();

      if (data.isComplete && data.analysis) {
        setIsFinishingOnboarding(true);
        try {
          await DB.saveKnowledgeBase(data.analysis);
          await DB.addNotification(
            "AI Knowledge Base Compiled!",
            `BoardMind AI has compiled a complete SWOT, departments profile, and KPIs for ${business.name}.`,
            "success"
          );
          setTimeout(() => {
            triggerStateReload();
            setIsFinishingOnboarding(false);
            setShowInterview(false);
          }, 3000);
        } catch (err: any) {
          setIsFinishingOnboarding(false);
          setInterviewError(err.message || 'Saving knowledge base failed.');
        }
      } else {
        setChat(prev => [...prev, { sender: 'ai', text: data.nextQuestion }]);
      }
    } catch (err: any) {
      console.error(err);
      setInterviewError(err.message || 'Discovery chat failed.');
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  // Check if the Knowledge Base has been fully analyzed and compiled (either demo or completed onboarding)
  const isKBaseComplete = business.id?.startsWith('demo-01') || (kbase.vision !== undefined && !kbase.businessSummary.includes("Actively completing AI onboarding"));

  // Nav Links Configuration
  const menuItems = [
    { id: 'boardroom', label: 'Boardroom', icon: Brain },
    { id: 'docs', label: 'Documents', icon: Database },
    { id: 'reports', label: 'Reports', icon: FileText },
    { id: 'profile', label: 'Profile', icon: Building },
  ];

  return (
    <div className="h-screen bg-[#F8FAFC] flex font-sans text-slate-800 overflow-hidden">
      
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/50 backdrop-blur-xs z-30 md:hidden"
        />
      )}

      {/* Left Sidebar (fixed on desktop, slide-over drawer on mobile) */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 shrink-0 transition-transform duration-300 md:relative md:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} print:hidden h-screen overflow-y-auto`}>
        <div>
          {/* Logo */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#1E40AF] text-white p-2 rounded-xl">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="font-extrabold text-sm text-white tracking-wide uppercase">BoardMind AI</h2>
                <span className="text-[10px] text-slate-500 font-semibold tracking-widest uppercase">EXECUTIVE PLATFORM</span>
              </div>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 md:hidden cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Current Business Card */}
          <div className="p-4 mx-4 my-6 bg-slate-950 rounded-xl border border-slate-850">
            <h4 className="text-xs font-extrabold text-white truncate">{business.name}</h4>
            <p className="text-[10px] text-slate-500 font-medium mt-0.5 uppercase tracking-wider">{business.industry} • {business.size}</p>
          </div>

          {/* Menu Links */}
          <nav className="px-3 space-y-1">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isLocked = item.id === 'boardroom' && !isKBaseComplete;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => {
                    setCurrentTab(item.id as any);
                    setIsSidebarOpen(false); // Close mobile drawer
                  }}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl text-xs font-bold transition-all cursor-pointer ${currentTab === item.id ? 'bg-[#1E40AF] text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'}`}
                >
                  <div className="flex items-center gap-3">
                    {isLocked ? <Lock className="w-4 h-4 text-amber-500 shrink-0" /> : <Icon className="w-4 h-4 shrink-0" />}
                    <span>{item.label}</span>
                  </div>
                  {isLocked && (
                    <span className="bg-amber-500/10 text-amber-400 text-[9px] px-1.5 py-0.5 rounded-sm uppercase tracking-wider font-extrabold">Locked</span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom actions */}
        <div className="p-4 border-t border-slate-800 space-y-2">
          <button
            onClick={() => {
              onLogout();
              setIsSidebarOpen(false);
            }}
            className="w-full flex items-center gap-2 px-4 py-3 text-xs font-bold text-slate-400 hover:text-red-400 transition-all cursor-pointer rounded-xl hover:bg-red-500/10"
          >
            <LogOut className="w-4 h-4" /> Save & Exit Registry
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        
        {/* Top Header */}
        <header className="sticky top-0 bg-white border-b border-slate-200/80 z-20 px-6 md:px-8 py-4 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 md:hidden text-slate-600 cursor-pointer"
              title="Open Navigation Menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <div className="flex items-center gap-4">
            {/* Quick stats indicator */}
            <div className="hidden md:flex gap-4 border-r border-slate-200 pr-6 text-right">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold">Target Goals</span>
                <p className="text-xs font-extrabold text-slate-800">3 Strategic Measures</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2.5">
              {/* Temporary Seeding Button */}
              <button
                onClick={handleSeedDatabase}
                disabled={isSeeding}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer border ${
                  seedSuccess 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                    : seedError 
                    ? 'bg-rose-50 border-rose-200 text-rose-700'
                    : 'bg-[#1E40AF] hover:bg-[#2563EB] text-white border-[#1E40AF]'
                }`}
                title="Temporary Seeding Tool"
              >
                <Database className={`w-3.5 h-3.5 ${isSeeding ? 'animate-spin' : ''}`} />
                <span>
                  {isSeeding ? 'Initializing...' : seedSuccess ? 'Database Seeded!' : seedError ? `Error: ${seedError}` : 'Initialize Database'}
                </span>
              </button>

              <div className="bg-slate-100 p-2 rounded-xl">
                <Bell className="w-4 h-4 text-slate-500" />
              </div>
              <span className="text-xs font-bold text-slate-600">Executive Advisor</span>
            </div>
          </div>
        </header>

        {/* Dynamic Inner Panel */}
        <main className="flex-1 overflow-y-auto p-8 max-w-7xl w-full mx-auto">
          
          {/* TAB 1: BOARDROOM */}
          {currentTab === 'boardroom' && (
            !isKBaseComplete ? (
              showInterview ? (
                <div id="boardroom-interview-view" className="max-w-2xl mx-auto bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col h-[550px] justify-between">
                  <div>
                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-5 h-5 text-[#1E40AF]" />
                        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Boardroom Discovery Interview</h3>
                      </div>
                      <button
                        onClick={() => setShowInterview(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 font-bold px-2 py-1 border border-slate-200 rounded-lg cursor-pointer"
                      >
                        Back to Lock Screen
                      </button>
                    </div>
                    <p className="text-xs text-slate-500 mb-4">
                      Answer the questions below so your directors can map out your strategic landscape and unlock full Boardroom advisory features.
                    </p>
                  </div>

                  {isFinishingOnboarding ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                      <RefreshCw className="w-10 h-10 text-[#1E40AF] animate-spin mb-4" />
                      <h4 className="text-sm font-bold text-slate-800 mb-1">Analyzing Interview Context</h4>
                      <p className="text-xs text-slate-400 max-w-sm">
                        Placing directors in seats, building SWOT matrices, mapping functional departments, and outlining target metrics...
                      </p>
                    </div>
                  ) : (
                    <>
                      {/* Chat Scroll Container */}
                      <div className="flex-1 overflow-y-auto bg-slate-50 p-4 rounded-xl space-y-4 mb-4 border border-slate-100">
                        {chat.map((msg, idx) => (
                          <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`p-3.5 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-xs ${msg.sender === 'user' ? 'bg-[#1E40AF] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                              <p className="font-extrabold mb-1 uppercase text-[8px] tracking-wider opacity-75">{msg.sender === 'user' ? 'You' : 'Senior Board Consultant'}</p>
                              <p>{msg.text}</p>
                            </div>
                          </div>
                        ))}
                        {isLoadingQuestion && (
                          <div className="flex justify-start">
                            <div className="bg-white border border-slate-200 p-3 rounded-xl flex items-center gap-2">
                              <RefreshCw className="w-4 h-4 text-[#1E40AF] animate-spin" />
                              <span className="text-xs text-slate-400">Consultant is analyzing...</span>
                            </div>
                          </div>
                        )}
                        {interviewError && (
                          <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs text-red-600 font-semibold space-y-2">
                            <p>{interviewError}</p>
                            <button
                              type="button"
                              onClick={retryLastInterviewAttempt}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all font-bold cursor-pointer"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-pulse" />
                              Retry Advisory Connection
                            </button>
                          </div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>

                      {/* Message input */}
                      <form onSubmit={handleSendInterviewMessage} className="flex gap-2">
                        <input
                          type="text"
                          required
                          placeholder="Provide details about your target market, channels, or products..."
                          value={userInput}
                          onChange={e => setUserInput(e.target.value)}
                          disabled={isLoadingQuestion}
                          className="flex-1 border border-slate-200 p-3 rounded-xl text-xs focus:border-[#1E40AF] outline-hidden bg-white"
                        />
                        <button
                          type="submit"
                          disabled={isLoadingQuestion}
                          className="bg-[#1E40AF] hover:bg-[#2563EB] disabled:opacity-50 text-white p-3 rounded-xl flex items-center justify-center cursor-pointer transition-all shrink-0"
                          title="Send message"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </>
                  )}
                </div>
              ) : (
                <div id="boardroom-locked-view" className="max-w-md mx-auto text-center py-20 space-y-6">
                  <div className="bg-amber-50 text-amber-600 p-6 rounded-full inline-block border border-amber-200 animate-pulse">
                    <Lock className="w-12 h-12" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Boardroom Access Locked</h3>
                    <p className="text-sm font-semibold text-slate-500 leading-relaxed text-slate-500">
                      Complete your executive onboarding interview to unlock the Boardroom. Your virtual board of directors requires a completed Business Knowledge Base to formulate strategic resolutions.
                    </p>
                  </div>
                  <div className="pt-4 flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => setShowInterview(true)}
                      className="px-6 py-3 bg-[#1E40AF] hover:bg-[#2563EB] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                    >
                      <MessageSquare className="w-4 h-4" /> Resume Discovery Interview
                    </button>
                    <button
                      onClick={() => setCurrentTab('profile')}
                      className="px-6 py-3 border border-slate-200 text-slate-600 hover:bg-slate-50 font-bold rounded-xl text-xs cursor-pointer"
                    >
                      View Company Profile
                    </button>
                  </div>
                </div>
              )
            ) : (
              <Boardroom 
                business={business} 
                kbase={kbase} 
                onDecisionCreated={triggerStateReload} 
                stateVersion={stateVersion}
              />
            )
          )}

          {/* TAB 2: BUSINESS PROFILE */}
          {currentTab === 'profile' && (
            <Profile 
              business={business} 
              kbase={kbase} 
              onUpdate={triggerStateReload} 
            />
          )}

          {/* TAB 3: REPORTS */}
          {currentTab === 'reports' && (
            <Reports 
              business={business} 
              kbase={kbase} 
              onReportCreated={triggerStateReload} 
            />
          )}

          {/* TAB 4: DOCUMENT MEMORY */}
          {currentTab === 'docs' && (
            <Documents 
              businessId={business.id} 
              onDocumentsUpdated={triggerStateReload} 
            />
          )}

        </main>
      </div>

    </div>
  );
}

// Help Icon/Loader mock because they are inside child files but need to be robust
function Loader2({ className }: { className?: string }) {
  return <RefreshCw className={className} />;
}
