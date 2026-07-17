import { useState } from 'react';
import { Building, Play, ShieldAlert, Sparkles, TrendingUp, CheckCircle, HelpCircle, ArrowRight } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLogin: () => void;
  onLoadDemo: () => void;
}

export default function LandingPage({ onStart, onLogin, onLoadDemo }: LandingPageProps) {
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How is BoardMind AI different from ChatGPT?",
      a: "Generic AI chatbots do not have persistent context of your specific business. BoardMind AI conducts an intensive initial onboarding discovery interview and integrates your financial reports, inventory data, and business plans. Every decision simulation is directly grounded in your unique business profile, industry factors, and uploaded files."
    },
    {
      q: "Who are the AI executives on the board?",
      a: "Our board consists of 10 specialized virtual executives: CEO, CFO, COO, CMO, CTO, HR Director, Legal Advisor, Risk Analyst, Data Analyst, and an Industry Expert. They analyze business problems from their respective expert domains and debate with each other in a simulated live board meeting before compiling an actionable board resolution."
    },
    {
      q: "Is my business data secure?",
      a: "Absolutely. All documents and profile information are isolated. Your files are securely tracked and metadata stored in Firestore with strict user isolation rules, and your business details are never shared or used to train public AI models."
    },
    {
      q: "Can I download board resolutions and reviews?",
      a: "Yes. Our Reports module generates a premium, print-ready, corporate-style strategic board report including Executive Summaries, interactive financial projections, SWOT analysis, and 30-90-360 day implementation roadmaps that you can export directly."
    }
  ];

  return (
    <div id="landing-page" className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans flex flex-col">
      {/* Header */}
      <header id="landing-header" className="sticky top-0 bg-white/85 backdrop-blur-md border-b border-slate-200/80 z-40 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-[#1E40AF] text-white p-2.5 rounded-xl shadow-md">
            <Building className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold tracking-tight text-[#1E40AF]">BoardMind AI</h1>
            <p className="text-xs text-slate-500 font-medium">AI Board of Directors</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            id="btn-quick-demo"
            onClick={onLoadDemo} 
            className="text-xs md:text-sm font-semibold text-slate-600 hover:text-[#1E40AF] px-4 py-2 transition-all cursor-pointer"
          >
            Quick Demo
          </button>
          <button 
            id="btn-login"
            onClick={onLogin} 
            className="text-xs md:text-sm font-semibold text-slate-700 border border-slate-300 hover:border-[#1E40AF] hover:text-[#1E40AF] px-5 py-2 rounded-xl transition-all cursor-pointer"
          >
            Login
          </button>
          <button 
            id="btn-get-started"
            onClick={onStart} 
            className="text-xs md:text-sm font-bold bg-[#1E40AF] text-white shadow-lg hover:bg-[#2563EB] px-5 py-2.5 rounded-xl transition-all cursor-pointer"
          >
            Start Free
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section id="hero" className="max-w-7xl mx-auto px-6 pt-16 pb-20 text-center flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200/80 text-[#1E40AF] text-xs font-semibold px-4 py-1.5 rounded-full mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Intelligent Advisory Engine for SMEs</span>
        </div>
        <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight leading-tight max-w-4xl mb-6">
          Your AI Board of Directors
        </h2>
        <p className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
          Make smarter business decisions with an AI executive team trained on YOUR business. Grounded in your financials, reports, and strategic goals.
        </p>
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <button 
            id="hero-start"
            onClick={onStart} 
            className="w-full sm:w-auto bg-[#1E40AF] hover:bg-[#2563EB] text-white font-bold text-base px-8 py-4 rounded-xl shadow-xl hover:shadow-blue-200 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Start Free Consultation <ArrowRight className="w-5 h-5" />
          </button>
          <button 
            id="hero-demo"
            onClick={onLoadDemo} 
            className="w-full sm:w-auto bg-white border border-slate-300 text-slate-700 hover:border-[#1E40AF] hover:text-[#1E40AF] font-bold text-base px-8 py-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Play className="w-4 h-4 text-[#1E40AF] fill-[#1E40AF]" /> Load Instant Demo
          </button>
        </div>

        {/* Feature Highlights Grid */}
        <div id="features" className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl mt-8">
          <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm text-left">
            <div className="bg-blue-100 text-[#1E40AF] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deep Business Onboarding</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              We interview you to understand products, customers, pricing, and threats. We build a personalized company profile.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm text-left">
            <div className="bg-blue-100 text-[#1E40AF] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <Building className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Multi-Agent Board Discussions</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              CEO, CFO, and CMO debate pricing, hiring, and expansions. Hear different roles debate before reaching final consensus.
            </p>
          </div>
          <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-sm text-left">
            <div className="bg-blue-100 text-[#1E40AF] w-12 h-12 rounded-xl flex items-center justify-center mb-6">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">What-If Scenario Simulator</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Simulate changes in pricing, staff counts, or equipment purchases. Get projected benefits, financial impacts, and risk matrices.
            </p>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="bg-slate-100/60 border-t border-b border-slate-200/50 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-black text-center tracking-tight mb-4 text-slate-900">How BoardMind AI Works</h2>
          <p className="text-center text-slate-500 max-w-xl mx-auto mb-16 text-sm md:text-base">
            Transition from generic answers to highly specialized business advisories in 4 easy steps.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Select Company Size", desc: "Define your scale (Small/Medium Business) to establish standard benchmark targets." },
              { step: "02", title: "Upload Files", desc: "Upload GST reports, product catalogs, financial statements, or checklists to seed raw context." },
              { step: "03", title: "AI Discovery Interview", desc: "The AI conducts a smart, 1-on-1 interview, asking deep follow-up questions to understand goals." },
              { step: "04", title: "Enter the Boardroom", desc: "Interact with 10 virtual directors. Simulate board debates, test scenarios, and export reports." }
            ].map((s, idx) => (
              <div key={idx} className="relative flex flex-col">
                <span className="text-4xl font-extrabold text-[#1E40AF]/20 mb-2">{s.step}</span>
                <h4 className="text-base font-bold text-slate-800 mb-2">{s.title}</h4>
                <p className="text-slate-500 text-xs leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Target Industries */}
      <section id="industries" className="py-20 px-6 max-w-6xl mx-auto">
        <h2 className="text-3xl font-black text-center tracking-tight mb-4 text-slate-900 font-sans">Target Industries</h2>
        <p className="text-center text-slate-500 max-w-md mx-auto mb-12 text-sm">
          Tailored expertise mapped directly to your specific business type.
        </p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {["Retail", "Restaurant & Café", "IT Services", "Manufacturing", "Clinic & Healthcare", "Education", "Construction", "Logistics", "Agriculture", "Wholesale", "Real Estate", "Textile"].map((industry, idx) => (
            <div key={idx} className="bg-white border border-slate-200 p-4 rounded-xl text-center shadow-xs font-semibold text-sm text-slate-700 hover:border-[#1E40AF] transition-all">
              {industry}
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Table Section */}
      <section id="pricing" className="bg-slate-900 text-white py-20 px-6">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl font-black mb-4">Transparent Pricing for Growing Businesses</h2>
          <p className="text-slate-400 mb-12 max-w-md mx-auto text-sm">
            All plans include unlimited document uploads and access to the complete 10-person executive boardroom.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto text-left">
            <div className="border border-slate-800 bg-slate-950 p-8 rounded-2xl">
              <span className="text-[#0EA5E9] font-bold text-xs uppercase tracking-widest">Growth Plan</span>
              <h3 className="text-2xl font-black mt-2 mb-1">Standard</h3>
              <p className="text-slate-400 text-xs mb-6">Perfect for small businesses and local cafes.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">$0</span>
                <span className="text-slate-400 text-sm">/ forever free in beta</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Standard Onboarding Interview</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Full 10-Director Executive Board</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Up to 10 Document Uploads</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> What-If Decision Simulator</li>
              </ul>
              <button onClick={onStart} className="w-full bg-[#1E40AF] hover:bg-[#2563EB] text-white font-bold py-3 rounded-xl transition-all cursor-pointer text-center text-sm">
                Get Started Free
              </button>
            </div>
            <div className="border border-[#1E40AF] bg-blue-950/20 p-8 rounded-2xl relative">
              <span className="absolute top-4 right-4 bg-[#1E40AF] text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">Premium</span>
              <span className="text-[#0EA5E9] font-bold text-xs uppercase tracking-widest">Enterprise Plan</span>
              <h3 className="text-2xl font-black mt-2 mb-1">Enterprise Advisory</h3>
              <p className="text-slate-300 text-xs mb-6">For multi-branch and medium-scale enterprises.</p>
              <div className="flex items-baseline gap-1 mb-6">
                <span className="text-4xl font-extrabold">Custom</span>
                <span className="text-slate-400 text-sm">/ contact sales</span>
              </div>
              <ul className="space-y-3 text-xs text-slate-300 mb-8">
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated Custom AI Executives</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Unlimited Cloud Document storage</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Team-wide collaborative Boardrooms</li>
                <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> Dedicated SLA support and customized integrations</li>
              </ul>
              <button onClick={onStart} className="w-full bg-white text-[#1E40AF] hover:bg-slate-100 font-bold py-3 rounded-xl transition-all cursor-pointer text-center text-sm">
                Contact Enterprise
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion Section */}
      <section id="faq" className="py-20 px-6 max-w-4xl mx-auto">
        <h2 className="text-3xl font-black text-center tracking-tight mb-4 text-slate-900">Frequently Asked Questions</h2>
        <p className="text-center text-slate-500 mb-12 text-sm">
          Everything you need to know about BoardMind AI.
        </p>
        <div className="space-y-4">
          {faqs.map((f, idx) => (
            <div key={idx} className="border border-slate-200 rounded-2xl bg-white overflow-hidden shadow-xs">
              <button 
                onClick={() => setActiveFaq(activeFaq === idx ? null : idx)} 
                className="w-full text-left p-6 flex justify-between items-center hover:bg-slate-50 transition-all font-bold text-slate-800 text-sm md:text-base cursor-pointer"
              >
                <span>{f.q}</span>
                <span className="text-[#1E40AF] font-bold text-xl">{activeFaq === idx ? '−' : '+'}</span>
              </button>
              {activeFaq === idx && (
                <div className="px-6 pb-6 text-slate-500 text-sm leading-relaxed border-t border-slate-100 pt-4">
                  {f.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer id="landing-footer" className="bg-slate-100 border-t border-slate-200 py-12 px-6 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-[#1E40AF] text-white p-1.5 rounded-lg">
              <Building className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[#1E40AF]">BoardMind AI</span>
          </div>
          <div className="text-xs text-slate-500">
            &copy; {new Date().getFullYear()} BoardMind AI. All rights reserved. Built for professional small & medium businesses.
          </div>
        </div>
      </footer>
    </div>
  );
}
