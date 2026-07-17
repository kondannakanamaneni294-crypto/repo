import React, { useState, useEffect } from 'react';
import { DB, User, Business } from './services/db';
import { db } from './services/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

// Modular Pages
import LandingPage from './components/LandingPage';
import Onboarding from './components/Onboarding';
import Dashboard from './components/Dashboard';

import { Building, Lock, Mail, Users, Globe, ShieldAlert, Sparkles, Loader2, ArrowLeft } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  
  // View States
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  
  // Input fields
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  
  // Auth notifications
  const [authError, setAuthError] = useState('');
  const [authSuccess, setAuthSuccess] = useState('');
  const [isAuthLoading, setIsAuthLoading] = useState(false);

  const [isInitialLoad, setIsInitialLoad] = useState(true);

  // Sync state on load using Firebase Auth subscription
  useEffect(() => {
    const unsubscribe = DB.onAuthChange((user, biz) => {
      setCurrentUser(user);
      setBusiness(biz);
      setIsInitialLoad(false);
      
      // Run complete Firebase diagnostics audit automatically if authenticated
      if (user) {
        DB.runFirebaseDiagnostics().then(results => {
          console.log("Firebase E2E Diagnostics Run Completed.", results);
        }).catch(err => {
          console.error("Firebase E2E Diagnostics Run Exception:", err);
        });
      }
    });
    return () => unsubscribe();
  }, []);

  // Autonomous DB Seeder on Page Load (runs when user is authenticated)
  useEffect(() => {
    if (!currentUser) return;

    const seedAutonomously = async () => {
      // Check if we already seeded in this session/browser to avoid infinite duplication
      if (localStorage.getItem('boardmind_autonomous_seeded') === 'true') {
        console.log("ℹ️ Autonomous database seeding already executed in a previous session.");
        return;
      }

      console.log("🚀 Starting autonomous database seeding...");
      try {
        // 1. Seed 'users' collection with basic details
        const userRef = await addDoc(collection(db, 'users'), {
          displayName: "Abhi Owner",
          email: "owner@abhi-restaurant.com",
          role: "Business Owner",
          createdAt: serverTimestamp()
        });
        console.log("🔥 Added user document:", userRef.id);

        // 2. Seed 'businessProfiles' collection with 'Abhi Restaurant'
        const bizRef = await addDoc(collection(db, 'businessProfiles'), {
          name: "Abhi Restaurant",
          industry: "Food & Beverage QSR",
          location: "Delhi, India",
          teamSize: 5,
          createdAt: serverTimestamp()
        });
        console.log("🔥 Added business profile document:", bizRef.id);

        // 3. Seed 'financialMetrics' linked to Abhi Restaurant with Q1 2026 data
        const metricsRef = await addDoc(collection(db, 'financialMetrics'), {
          businessProfileId: bizRef.id,
          quarter: "Q1 2026",
          revenueGrowth: 12.5,
          profitMargin: 18.2,
          cac: 145,
          ltv: 1850,
          createdAt: serverTimestamp()
        });
        console.log("🔥 Added financial metrics document:", metricsRef.id);

        // Mark as seeded to prevent redundant writes
        localStorage.setItem('boardmind_autonomous_seeded', 'true');
        console.log("🔥 SUCCESS: Firebase seeded autonomously!");
      } catch (error: any) {
        console.error("❌ FIREBASE FAILURE REASON:", error);
      }
    };

    seedAutonomously();
  }, [currentUser]);

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthSuccess('');
    setIsAuthLoading(true);

    try {
      if (authMode === 'forgot') {
        await DB.sendPasswordReset(authEmail);
        setAuthSuccess(`Password reset email dispatched to ${authEmail}. Please check your inbox.`);
        setIsAuthLoading(false);
        return;
      }

      if (authMode === 'login') {
        await DB.loginWithEmail(authEmail, authPassword);
        setShowAuthModal(false);
      } else {
        // Signup
        if (!authName.trim()) {
          setAuthError('Display Name is required');
          setIsAuthLoading(false);
          return;
        }
        await DB.signupWithEmail(authEmail, authPassword, authName);
        setShowAuthModal(false);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      await DB.loginWithGoogle();
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Google Authentication failed.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  // 1-Click Load Demo Feature
  const handleLoadDemo = async () => {
    setIsAuthLoading(true);
    setAuthError('');
    try {
      // Fast-track by signing in or creating a persistent demo account
      const demoEmail = 'auraroasters@example.com';
      const demoPassword = 'democafeportland123';
      
      let user;
      try {
        user = await DB.loginWithEmail(demoEmail, demoPassword);
      } catch (loginErr) {
        // If user doesn't exist yet, sign up
        user = await DB.signupWithEmail(demoEmail, demoPassword, 'Marcus Sterling');
      }

      // Seed the full cafe boardroom demo data into Firestore under this UID
      await DB.loadDemoDataIntoFirestore(user.uid);
      setShowAuthModal(false);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to load demo cafe registry.');
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await DB.logout();
    setCurrentUser(null);
    setBusiness(null);
  };

  const handlePurge = async () => {
    if (window.confirm("Are you sure you want to completely purge your corporate registry? All documents, resolutions, and reports will be wiped forever.")) {
      await DB.deleteBusiness();
      await DB.logout();
      setCurrentUser(null);
      setBusiness(null);
    }
  };

  // View Router Logic
  if (isInitialLoad) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <Loader2 className="w-12 h-12 text-teal-400 animate-spin mb-4" />
        <p className="text-slate-400 font-mono text-sm">Synchronizing with BoardMind Cloud...</p>
      </div>
    );
  }

  if (currentUser) {
    if (business) {
      // User is logged in and business profile onboarding is completed
      return (
        <Dashboard 
          onLogout={handleLogout} 
          onPurge={handlePurge} 
        />
      );
    } else {
      // User is logged in but needs to complete onboarding
      return (
        <Onboarding 
          onComplete={() => setBusiness(DB.getBusiness())} 
          onBackToLanding={handleLogout}
        />
      );
    }
  }

  // Not logged in: Show landing page
  return (
    <div className="relative min-h-screen bg-[#F8FAFC]">
      <LandingPage
        onStart={() => {
          setAuthMode('signup');
          setAuthEmail('');
          setAuthPassword('');
          setAuthName('');
          setAuthError('');
          setAuthSuccess('');
          setShowAuthModal(true);
        }}
        onLogin={() => {
          setAuthMode('login');
          setAuthEmail('');
          setAuthPassword('');
          setAuthError('');
          setAuthSuccess('');
          setShowAuthModal(true);
        }}
        onLoadDemo={handleLoadDemo}
      />

      {/* Authentication Modal Backdrop */}
      {showAuthModal && (
        <div id="auth-modal" className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center z-50 px-6 py-10 overflow-y-auto">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-md p-8 relative flex flex-col justify-between">
            
            {/* Close */}
            <button 
              onClick={() => setShowAuthModal(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 font-extrabold text-sm cursor-pointer"
            >
              ✕
            </button>

            {/* Title */}
            <div className="text-center mb-6">
              <div className="bg-[#1E40AF] text-white p-2.5 rounded-xl inline-block mb-3">
                <Building className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-extrabold text-slate-950">
                {authMode === 'login' && 'Sign in to BoardMind'}
                {authMode === 'signup' && 'Create your SME Workspace'}
                {authMode === 'forgot' && 'Reset your Credential key'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'login' && 'Access your persistent board registry.'}
                {authMode === 'signup' && 'Get started with your free 10-person virtual board.'}
                {authMode === 'forgot' && "Provide your email to dispatch a simulated recovery key."}
              </p>
            </div>

            {/* Error/Success */}
            {authError && (
              <div id="auth-error-alert" className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" />
                <span>{authError}</span>
              </div>
            )}
            {authSuccess && (
              <div id="auth-success-alert" className="mb-4 bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <Sparkles className="w-4 h-4 shrink-0 text-emerald-500" />
                <span>{authSuccess}</span>
              </div>
            )}

            {/* Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === 'signup' && (
                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Display Name *</label>
                  <input
                    id="auth-input-name"
                    type="text"
                    required
                    placeholder="e.g. Marcus Sterling"
                    value={authName}
                    onChange={e => setAuthName(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-600 mb-1">Email Address *</label>
                <input
                  id="auth-input-email"
                  type="email"
                  required
                  placeholder="e.g. owner@auraroasters.com"
                  value={authEmail}
                  onChange={e => setAuthEmail(e.target.value)}
                  className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                />
              </div>

              {authMode !== 'forgot' && (
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-600">Workspace Password *</label>
                    {authMode === 'login' && (
                      <button 
                        type="button"
                        onClick={() => {
                          setAuthMode('forgot');
                          setAuthError('');
                          setAuthSuccess('');
                        }} 
                        className="text-[10px] font-bold text-[#1E40AF] hover:underline cursor-pointer"
                      >
                        Forgot Password?
                      </button>
                    )}
                  </div>
                  <input
                    id="auth-input-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={authPassword}
                    onChange={e => setAuthPassword(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                  />
                </div>
              )}

              <button
                type="submit"
                id="btn-auth-submit"
                disabled={isAuthLoading}
                className="w-full bg-[#1E40AF] hover:bg-[#2563EB] disabled:opacity-55 text-white font-bold py-3 rounded-xl shadow-lg transition-all flex items-center justify-center gap-1.5 text-sm mt-6 cursor-pointer"
              >
                {isAuthLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Verifying...
                  </>
                ) : (
                  <>
                    {authMode === 'login' && 'Sign In'}
                    {authMode === 'signup' && 'Create Free Account'}
                    {authMode === 'forgot' && 'Send Recovery Key'}
                  </>
                )}
              </button>
            </form>

            {/* Google OAuth & Demo Splitter */}
            {authMode !== 'forgot' && (
              <div className="mt-6 space-y-4">
                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase tracking-wider">Or fast-track access</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {/* Google */}
                  <button
                    onClick={handleGoogleLogin}
                    disabled={isAuthLoading}
                    className="border border-slate-300 hover:border-slate-400 text-slate-700 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 bg-white shadow-xs transition-all cursor-pointer"
                  >
                    Google Login
                  </button>
                  {/* Demo */}
                  <button
                    id="btn-auth-demo"
                    onClick={handleLoadDemo}
                    disabled={isAuthLoading}
                    className="bg-blue-50 border border-blue-200 text-[#1E40AF] hover:bg-blue-100 text-xs font-bold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    Load Demo Cafe
                  </button>
                </div>
              </div>
            )}

            {/* Auth switcher footer */}
            <div className="text-center mt-6 text-xs text-slate-400 font-medium">
              {authMode === 'login' && (
                <p>New to BoardMind? <button onClick={() => { setAuthMode('signup'); setAuthError(''); setAuthSuccess(''); }} className="text-[#1E40AF] font-bold hover:underline cursor-pointer">Start Free Consultation</button></p>
              )}
              {authMode === 'signup' && (
                <p>Already have an account? <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="text-[#1E40AF] font-bold hover:underline cursor-pointer">Sign In</button></p>
              )}
              {authMode === 'forgot' && (
                <button onClick={() => { setAuthMode('login'); setAuthError(''); setAuthSuccess(''); }} className="text-[#1E40AF] font-bold hover:underline flex items-center justify-center gap-1 mx-auto cursor-pointer mt-2">
                  <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
                </button>
              )}
            </div>

            {/* Temporary Location Host Display */}
            <div className="text-center mt-4 text-[10px] font-mono text-slate-400 bg-slate-50 py-1.5 rounded-lg border border-slate-150 select-all">
              Host: {window.location.host}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
