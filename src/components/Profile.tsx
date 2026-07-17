import { useState } from 'react';
import { Building, Globe, Users, DollarSign, Edit3, Grid, Sparkles, CheckCircle, Award, Save, X, FileText } from 'lucide-react';
import { DB, Business, KnowledgeBase } from '../services/db';

interface ProfileProps {
  business: Business;
  kbase: KnowledgeBase;
  onUpdate: () => void;
}

export default function Profile({ business, kbase, onUpdate }: ProfileProps) {
  const [activeSection, setActiveSection] = useState<'kbase' | 'profile'>('kbase');
  const [isEditing, setIsEditing] = useState(false);

  // Edit states
  const [name, setName] = useState(business.name || '');
  const [industry, setIndustry] = useState(business.industry || 'Restaurant');
  const [size, setSize] = useState<'Small Business' | 'Medium Business'>(business.size || 'Small Business');
  const [city, setCity] = useState(business.city || '');
  const [country, setCountry] = useState(business.country || '');
  const [employees, setEmployees] = useState(business.employees || '1-5');
  const [revenue, setRevenue] = useState(business.revenue || '');
  const [description, setDescription] = useState(business.description || '');

  const handleSave = async () => {
    if (!name.trim()) return;

    const updatedBiz: Business = {
      ...business,
      name,
      industry,
      size,
      city,
      country,
      employees,
      revenue,
      description
    };

    await DB.saveBusiness(updatedBiz);
    setIsEditing(false);
    onUpdate();
  };

  const handleCancel = () => {
    // Reset fields to business props
    setName(business.name || '');
    setIndustry(business.industry || 'Restaurant');
    setSize(business.size || 'Small Business');
    setCity(business.city || '');
    setCountry(business.country || '');
    setEmployees(business.employees || '1-5');
    setRevenue(business.revenue || '');
    setDescription(business.description || '');
    setIsEditing(false);
  };

  return (
    <div id="profile-view" className="space-y-6">
      
      {/* Navigation tabs */}
      <div className="flex border-b border-slate-200 gap-4 print:hidden justify-between items-center">
        <div className="flex gap-4">
          <button
            onClick={() => setActiveSection('kbase')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeSection === 'kbase' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            AI Knowledge Base Memory
          </button>
          <button
            onClick={() => setActiveSection('profile')}
            className={`pb-3 text-sm font-bold border-b-2 transition-all cursor-pointer ${activeSection === 'profile' ? 'border-[#1E40AF] text-[#1E40AF]' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            Company Registry Details
          </button>
        </div>

        {activeSection === 'profile' && !isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E40AF]/10 hover:bg-[#1E40AF]/15 text-[#1E40AF] font-bold text-xs rounded-xl cursor-pointer transition-all"
          >
            <Edit3 className="w-3.5 h-3.5" /> Edit Profile
          </button>
        )}
      </div>

      {/* AI KNOWLEDGE BASE VIEW */}
      {activeSection === 'kbase' && (
        <div className="space-y-6">
          
          {/* Incomplete warning banner */}
          {!(business.id === 'demo-01' || (kbase.vision !== undefined && !kbase.businessSummary.includes("Actively completing AI onboarding"))) && (
            <div className="bg-amber-50 border border-amber-200/80 rounded-2xl p-6 space-y-2">
              <h4 className="text-xs font-black text-amber-800 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> AI Knowledge Base Compiler In Progress
              </h4>
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                Your Boardroom advisor is currently waiting for more strategic input. To complete your corporate memory, compile SWOT indexes, and formulate strategic resolutions, please navigate to the <strong>Boardroom</strong> tab to resume your Boardroom Discovery Interview.
              </p>
            </div>
          )}

          {/* Executive Overview banner */}
          <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-xs space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" /> Executive Business Overview
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              {kbase.businessSummary}
            </p>
            <div className="border-t border-slate-100 pt-4 flex flex-col md:flex-row gap-4 justify-between text-xs text-slate-400">
              <p>Mission Statement: <span className="font-semibold text-slate-700 italic">"{kbase.mission}"</span></p>
            </div>
          </div>

          {/* Core products & pricing margins */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] mb-4">Core Offerings / Products</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                {kbase.products.map((p, idx) => (
                  <li key={idx} className="flex items-center gap-2 border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                    <CheckCircle className="w-4 h-4 text-[#1E40AF]" /> {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] mb-4">Revenue & Pricing Mechanics</h4>
              <ul className="space-y-2 text-xs text-slate-600 font-medium">
                {kbase.revenueStreams.map((r, idx) => (
                  <li key={idx} className="flex items-center gap-2 border border-slate-100 p-2.5 rounded-xl bg-slate-50/50">
                    <DollarSign className="w-4 h-4 text-emerald-500" /> {r}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Beautiful SWOT Quadrants Matrix */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-4 flex items-center gap-1.5">
              <Grid className="w-4 h-4 text-[#1E40AF]" /> Comprehensive SWOT Matrix
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Strengths */}
              <div className="border border-blue-100 bg-blue-50/10 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-[#1E40AF] uppercase tracking-wider mb-3">Strengths (Internal)</h4>
                <ul className="space-y-2">
                  {kbase.strengths.map((s, idx) => (
                    <li key={idx} className="text-xs text-slate-500 leading-relaxed flex items-start gap-1">
                      <span className="text-[#1E40AF] font-bold">•</span> {s}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Weaknesses */}
              <div className="border border-orange-100 bg-orange-50/10 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-3">Weaknesses (Internal)</h4>
                <ul className="space-y-2">
                  {kbase.weaknesses.map((w, idx) => (
                    <li key={idx} className="text-xs text-slate-500 leading-relaxed flex items-start gap-1">
                      <span className="text-orange-500 font-bold">•</span> {w}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Opportunities */}
              <div className="border border-emerald-100 bg-emerald-50/10 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-3">Opportunities (External)</h4>
                <ul className="space-y-2">
                  {kbase.opportunities.map((o, idx) => (
                    <li key={idx} className="text-xs text-slate-500 leading-relaxed flex items-start gap-1">
                      <span className="text-emerald-500 font-bold">•</span> {o}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Threats */}
              <div className="border border-red-100 bg-red-50/10 p-5 rounded-2xl">
                <h4 className="text-xs font-bold text-red-600 uppercase tracking-wider mb-3">Threats (External)</h4>
                <ul className="space-y-2">
                  {kbase.threats.map((t, idx) => (
                    <li key={idx} className="text-xs text-slate-500 leading-relaxed flex items-start gap-1">
                      <span className="text-red-500 font-bold">•</span> {t}
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          </div>

          {/* Departments, Metrics & Preferences */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Functional Departments</h4>
              <ul className="space-y-2">
                {kbase.departments.map((d, idx) => (
                  <li key={idx} className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-100">{d}</li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Target KPI Metrics</h4>
              <ul className="space-y-2">
                {kbase.metrics.map((m, idx) => (
                  <li key={idx} className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex justify-between">
                    <span>{m}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Advisory Style Preferences</h4>
              <ul className="space-y-2">
                {kbase.decisionPreferences.map((p, idx) => (
                  <li key={idx} className="text-xs text-slate-500 font-semibold bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-500" /> {p}
                  </li>
                ))}
              </ul>
            </div>

          </div>

        </div>
      )}

      {/* REGISTRY DETAILS VIEW */}
      {activeSection === 'profile' && (
        <div className="bg-white p-8 rounded-2xl border border-slate-200/60 shadow-xs">
          {isEditing ? (
            <div className="space-y-6">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">Edit Company Registry Profile</h3>
                <div className="flex gap-2">
                  <button
                    onClick={handleCancel}
                    className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 text-slate-500 hover:bg-slate-50 font-bold text-xs rounded-xl cursor-pointer transition-all"
                  >
                    <X className="w-3.5 h-3.5" /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#1E40AF] text-white hover:bg-[#2563EB] font-bold text-xs rounded-xl cursor-pointer transition-all shadow-sm"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Changes
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Business Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Industry / Sector *</label>
                    <select
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] bg-white outline-hidden text-slate-800"
                    >
                      {["Restaurant", "Retail", "Manufacturing", "IT Services", "Healthcare", "Education", "Construction", "Logistics", "Agriculture", "Wholesale", "Real Estate"].map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">City *</label>
                    <input
                      type="text"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Country *</label>
                    <input
                      type="text"
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Company Size Scale *</label>
                    <select
                      value={size}
                      onChange={e => setSize(e.target.value as any)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] bg-white outline-hidden text-slate-800"
                    >
                      <option value="Small Business">Small Business</option>
                      <option value="Medium Business">Medium Business</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">Employees Count *</label>
                    <select
                      value={employees}
                      onChange={e => setEmployees(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] bg-white outline-hidden text-slate-800"
                    >
                      {["1-5", "6-15", "16-50", "51-200", "200+"].map(cnt => (
                        <option key={cnt} value={cnt}>{cnt} employees</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Annual Revenue (Optional)</label>
                  <input
                    type="text"
                    value={revenue}
                    onChange={e => setRevenue(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">Short Business Description *</label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden resize-none bg-white text-slate-800"
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">Company Metadata Profile</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <Building className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Legal Entity Name</span>
                      <p className="text-xs font-bold text-slate-800">{business.name}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <Globe className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Primary Industry Category</span>
                      <p className="text-xs font-bold text-[#1E40AF]">{business.industry}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <Users className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Operating Scale</span>
                      <p className="text-xs font-bold text-slate-800">{business.size} ({business.employees} staff)</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 border-l border-slate-100 pl-6">
                  <div className="flex gap-3 items-center">
                    <Building className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">HQ Location</span>
                      <p className="text-xs font-bold text-slate-800">{business.city}, {business.country}</p>
                    </div>
                  </div>

                  <div className="flex gap-3 items-center">
                    <DollarSign className="w-5 h-5 text-slate-400 shrink-0" />
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Estimated Annual Revenue</span>
                      <p className="text-xs font-bold text-slate-800">{business.revenue || 'Not declared'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {business.description && (
                <div className="border-t border-slate-100 pt-6">
                  <div className="flex gap-3 items-start">
                    <FileText className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Short Business Description</span>
                      <p className="text-xs text-slate-600 leading-relaxed mt-1 font-medium">{business.description}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
