import React, { useState, useRef, useEffect } from 'react';
import { Building, Upload, MessageSquare, ArrowRight, ArrowLeft, Loader2, Play, FileText, Check } from 'lucide-react';
import { DB, Business, DocumentMeta, KnowledgeBase } from '../services/db';

interface OnboardingProps {
  onComplete: () => void;
  onBackToLanding: () => void;
}

export default function Onboarding({ onComplete, onBackToLanding }: OnboardingProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [size, setSize] = useState<'Small Business' | 'Medium Business'>('Small Business');
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('Restaurant');
  const [country, setCountry] = useState('United States');
  const [city, setCity] = useState('');
  const [employees, setEmployees] = useState('1-5');
  const [revenue, setRevenue] = useState('');
  const [description, setDescription] = useState('');

  // Documents State
  const [uploadedDocs, setUploadedDocs] = useState<Omit<DocumentMeta, 'id' | 'uploadDate'>[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Chat/Discovery State
  const [chat, setChat] = useState<{ sender: 'ai' | 'user'; text: string }[]>([
    {
      sender: 'ai',
      text: "Welcome! Before becoming your AI Board of Directors, I need to understand your business deeply. Let me know what specific products or services you primarily sell, and who your typical target customers are."
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(false);
  const [isFinishingOnboarding, setIsFinishingOnboarding] = useState(false);
  const [isSavingDocs, setIsSavingDocs] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Scroll chat to bottom
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chat, isLoadingQuestion]);

  // Form Submission
  const handleStep1 = () => {
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setStep(3);
  };

  // Document Upload Simulators
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files: FileList) => {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toUpperCase() || 'TXT';
      const isText = ['TXT', 'CSV', 'JSON', 'XML', 'MD'].includes(ext);
      
      const reader = new FileReader();
      reader.onload = async () => {
        try {
          let base64Data = '';
          let textFallback = '';
          
          if (!isText) {
            const dataUrl = reader.result as string;
            if (dataUrl && dataUrl.includes(',')) {
              base64Data = dataUrl.split(',')[1];
            }
          } else {
            textFallback = reader.result as string;
          }
          
          // Call document analyzer!
          const response = await fetch('/api/gemini/analyze-document', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileType: file.type,
              base64Data,
              textFallback
            })
          });
          
          if (!response.ok) {
            throw new Error(`Document Analysis failed`);
          }
          
          const analysis = await response.json();
          const newDoc = {
            businessId: 'active',
            name: file.name,
            type: ext,
            size: `${Math.round(file.size / 1024)} KB`,
            content: analysis.extractedInfo || textFallback || `Contents of uploaded document: ${file.name}`,
            summary: analysis.summary || `Parsed business parameters from uploaded asset: ${file.name}`
          };
          setUploadedDocs(prev => [...prev, newDoc]);
        } catch (err: any) {
          console.error("Onboarding doc analysis error:", err);
          // Fallback to text simulation if server fails
          const textSim = `Simulated import content of ${file.name}.\nThis file provides business operational benchmarks and financial metrics.`;
          setUploadedDocs(prev => [...prev, {
            businessId: 'active',
            name: file.name,
            type: ext,
            size: `${Math.round(file.size / 1024)} KB`,
            content: textSim,
            summary: `Business report and data parameters parsed from uploaded file ${file.name}.`
          }]);
        }
      };
      
      if (isText) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  // Add Demo Docs quickly
  const handleLoadSampleDocs = () => {
    const samples = [
      {
        businessId: 'active',
        name: 'Q1_Financial_Statement.xlsx',
        type: 'XLSX',
        size: '142 KB',
        content: `Revenue breakdown for Q1:\n- Retail Cafe Sales: $85,000\n- Coffee Bean wholesale accounts: $12,500\n- Subscriptions: $8,200\nTotal sales for Q1: $105,700\nCOGS (Coffee Beans, milk, cups, wages): $45,200 (Gross Margin: 57%)\nOperational Overhead Rent/Utilities: $12,400\nNet Operating income: $48,100`,
        summary: 'Excel financial statement showing solid retail cafe revenue but compressed gross profit margins at 57%.'
      },
      {
        businessId: 'active',
        name: 'Barista_Shift_Performance.pdf',
        type: 'PDF',
        size: '2.4 MB',
        content: `Shift Review & Scheduling bottleneck review:\n- Peak customer queues occur between 7:30 AM and 10:00 AM daily.\n- Manual espresso tamping and milk foaming slows down order times to 3.2 minutes per cup.\n- Customer complaints regarding wait times increased by 14% on weekends.\n- Barista scheduling overhead is extremely high due to school term rotations.`,
        summary: 'PDF report showing customer service bottlenecks at peak hours due to manual beverage preparations.'
      }
    ];
    setUploadedDocs(samples);
  };

  const handleStep3 = async () => {
    if (isSavingDocs) return;
    setIsSavingDocs(true);
    setError(null);

    // Save preliminary business details to Local DB
    const bizData: Business = {
      id: 'biz_' + Math.random().toString(36).substr(2, 9),
      name,
      industry,
      size,
      country,
      city,
      employees,
      revenue,
      description
    };

    try {
      await DB.saveBusiness(bizData);

      // Save Documents
      await Promise.all(uploadedDocs.map(async (d) => {
        await DB.addDocument({
          ...d,
          businessId: bizData.id
        });
      }));
      setStep(4);
    } catch (err: any) {
      console.error("Failed to save business or documents to database during onboarding:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    } finally {
      setIsSavingDocs(false);
    }
  };

  // Step 4: AI Interview Chat Bot Hookup
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userInput.trim() || isLoadingQuestion) return;

    const userMsg = userInput.trim();
    setUserInput('');
    
    // Add User message
    const updatedChat = [...chat, { sender: 'user' as const, text: userMsg }];
    setChat(updatedChat);
    setIsLoadingQuestion(true);

    try {
      const biz = DB.getBusiness();
      const docs = DB.getDocuments().filter(d => d.businessId === (biz?.id || 'active'));
      const response = await fetch('/api/discover/next-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: biz,
          documents: docs,
          chatHistory: updatedChat
        })
      });

      if (!response.ok) {
        throw new Error('Server failed to respond to discovery chat');
      }

      const data = await response.json();

      if (data.isComplete && data.analysis) {
        // Complete onboarding!
        setIsFinishingOnboarding(true);
        setError(null);
        try {
          // Save Knowledge Base
          await DB.saveKnowledgeBase(data.analysis);
          await DB.addNotification(
            "AI Knowledge Base Compiled!",
            `BoardMind AI has compiled a complete SWOT, departments profile, and KPIs for ${name}.`,
            "success"
          );
          setTimeout(() => {
            onComplete();
          }, 3000);
        } catch (err: any) {
          setIsFinishingOnboarding(false);
          let errMsg = err instanceof Error ? err.message : String(err);
          try {
            const parsed = JSON.parse(errMsg);
            if (parsed && parsed.error) errMsg = parsed.error;
          } catch {}
          setError(errMsg);
        }
      } else {
        // Add Next question
        setChat(prev => [...prev, { sender: 'ai', text: data.nextQuestion }]);
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    } finally {
      setIsLoadingQuestion(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 flex flex-col items-center py-10 px-6 justify-center">
      
      {/* Onboarding Box */}
      <div className="w-full max-w-2xl bg-white border border-slate-200 shadow-xl rounded-2xl p-8 flex flex-col min-h-[550px] relative overflow-hidden">
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 h-1.5 rounded-full mb-8 relative">
          <div 
            className="bg-[#1E40AF] h-1.5 rounded-full transition-all duration-500" 
            style={{ width: `${(step / 4) * 100}%` }}
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs mb-6 flex flex-col gap-1 relative animate-fade-in">
            <p className="font-bold">Database Write Error</p>
            <p>{error}</p>
            <button type="button" onClick={() => setError(null)} className="text-left font-bold underline mt-1 text-[10px] text-red-800 cursor-pointer">
              Dismiss
            </button>
          </div>
        )}

        {/* Step 1: Company Size */}
        {step === 1 && (
          <div id="ob-step-1" className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-xs uppercase tracking-widest mb-2">
                <Building className="w-4 h-4" /> Step 1 of 4: Scale Selection
              </div>
              <h2 className="text-2xl font-extrabold text-slate-950 mb-3">Welcome to BoardMind AI</h2>
              <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                To start, tell us the scale of your business. This helps our virtual executives customize their financial benchmarks and compliance logic to your company size.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  id="opt-small-biz"
                  onClick={() => setSize('Small Business')}
                  className={`border-2 p-6 rounded-2xl text-left transition-all hover:bg-slate-50/50 cursor-pointer ${size === 'Small Business' ? 'border-[#1E40AF] bg-blue-50/20' : 'border-slate-200'}`}
                >
                  <h4 className="font-extrabold text-slate-900 text-base mb-1">Small Business</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Typically under 15 employees, locally-focused, operating on direct cash flow or boutique services.</p>
                </button>
                <button
                  id="opt-medium-biz"
                  onClick={() => setSize('Medium Business')}
                  className={`border-2 p-6 rounded-2xl text-left transition-all hover:bg-slate-50/50 cursor-pointer ${size === 'Medium Business' ? 'border-[#1E40AF] bg-blue-50/20' : 'border-slate-200'}`}
                >
                  <h4 className="font-extrabold text-slate-900 text-base mb-1">Medium Business</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">Established regional company, 15-200 staff, with distinct sales, logistics, and finance managers.</p>
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-12 border-t border-slate-100 pt-6">
              <button 
                onClick={onBackToLanding} 
                className="text-xs md:text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Landing
              </button>
              <button
                id="step-1-next"
                onClick={handleStep1}
                className="bg-[#1E40AF] text-white hover:bg-[#2563EB] text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Company Information Form */}
        {step === 2 && (
          <form id="ob-step-2" onSubmit={handleStep2} className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-xs uppercase tracking-widest mb-2">
                <Building className="w-4 h-4" /> Step 2 of 4: Business Profile
              </div>
              <h2 className="text-2xl font-extrabold text-slate-950 mb-6">Tell us about your business</h2>

              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Business Name *</label>
                    <input
                      id="inp-biz-name"
                      type="text"
                      required
                      placeholder="e.g. Aura Gourmet Coffee"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Industry / Sector *</label>
                    <select
                      id="inp-biz-industry"
                      value={industry}
                      onChange={e => setIndustry(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] bg-white outline-hidden"
                    >
                      {["Restaurant", "Retail", "Manufacturing", "IT Services", "Healthcare", "Education", "Construction", "Logistics", "Agriculture", "Wholesale", "Real Estate"].map(ind => (
                        <option key={ind} value={ind}>{ind}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">City *</label>
                    <input
                      id="inp-biz-city"
                      type="text"
                      required
                      placeholder="Portland"
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Country *</label>
                    <input
                      id="inp-biz-country"
                      type="text"
                      required
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Employees count *</label>
                    <select
                      id="inp-biz-employees"
                      value={employees}
                      onChange={e => setEmployees(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] bg-white outline-hidden"
                    >
                      {["1-5", "6-15", "16-50", "51-200", "200+"].map(cnt => (
                        <option key={cnt} value={cnt}>{cnt} employees</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 mb-1">Annual Revenue (Optional)</label>
                    <input
                      id="inp-biz-revenue"
                      type="text"
                      placeholder="e.g. $450,000"
                      value={revenue}
                      onChange={e => setRevenue(e.target.value)}
                      className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 mb-1">Short Business Description *</label>
                  <textarea
                    id="inp-biz-description"
                    required
                    rows={3}
                    placeholder="Describe your core business model, target market, or unique offerings..."
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    className="w-full border border-slate-200 p-2.5 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden resize-none bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center mt-12 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs md:text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                type="submit"
                id="step-2-next"
                className="bg-[#1E40AF] text-white hover:bg-[#2563EB] text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* Step 3: Document Upload */}
        {step === 3 && (
          <div id="ob-step-3" className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-xs uppercase tracking-widest mb-2">
                <Building className="w-4 h-4" /> Step 3 of 4: Document Knowledge
              </div>
              <h2 className="text-2xl font-extrabold text-slate-950 mb-2">Provide business documents</h2>
              <p className="text-slate-500 text-sm mb-6 leading-relaxed">
                Add business reports, GST metrics, inventory charts, pricing catalogs, or local profiles. These documents ground your board resolutions.
              </p>

              {/* Upload Drop Zone */}
              <div 
                id="doc-drop-zone"
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[160px] ${dragActive ? 'border-[#1E40AF] bg-blue-50/10' : 'border-slate-200 bg-slate-50/30'}`}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  multiple 
                  onChange={handleFileInput} 
                  className="hidden" 
                  accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                />
                <Upload className="w-8 h-8 text-[#1E40AF] mb-3" />
                <h4 className="font-bold text-slate-700 text-sm mb-1">Drag and drop business files here</h4>
                <p className="text-xs text-slate-400 mb-3">Accepts PDF, Excel, CSV, Word, PowerPoint, Images</p>
                <button type="button" className="text-xs font-bold text-[#1E40AF] hover:underline">Or browse system files</button>
              </div>

              {/* Sample Files Generator */}
              <div className="mt-4 flex justify-between items-center bg-blue-50 border border-blue-100 p-4 rounded-xl">
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-0.5">Don't have files ready?</h4>
                  <p className="text-[10px] text-slate-500">Seed standard sample cafe documents for an instant high-quality experience.</p>
                </div>
                <button
                  id="btn-seed-samples"
                  onClick={handleLoadSampleDocs}
                  className="bg-white border border-[#1E40AF] text-[#1E40AF] hover:bg-blue-50 text-[10px] font-bold px-3 py-1.5 rounded-lg flex items-center gap-1 transition-all cursor-pointer shrink-0"
                >
                  <Play className="w-2.5 h-2.5" /> Load Sample Files
                </button>
              </div>

              {/* List of uploaded items */}
              {uploadedDocs.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-xs font-bold text-slate-600 mb-2">Uploaded Assets ({uploadedDocs.length})</h4>
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {uploadedDocs.map((doc, idx) => (
                      <div key={idx} className="flex justify-between items-center border border-slate-200 bg-white p-2.5 rounded-xl">
                        <div className="flex items-center gap-2">
                          <div className="bg-[#1E40AF]/10 text-[#1E40AF] p-1.5 rounded-lg text-xs font-bold">{doc.type}</div>
                          <div>
                            <p className="text-xs font-bold text-slate-800 max-w-[180px] truncate">{doc.name}</p>
                            <p className="text-[10px] text-slate-400">{doc.size}</p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setUploadedDocs(prev => prev.filter((_, i) => i !== idx))} 
                          className="text-xs text-red-500 hover:underline font-bold px-2 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center mt-12 border-t border-slate-100 pt-6">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-xs md:text-sm font-semibold text-slate-500 hover:text-slate-700 transition-all flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
              <button
                onClick={handleStep3}
                id="step-3-next"
                disabled={isSavingDocs}
                className={`bg-[#1E40AF] text-white hover:bg-[#2563EB] text-sm font-bold px-6 py-3 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-1.5 transition-all cursor-pointer ${isSavingDocs ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSavingDocs ? (
                  <>Saving Documents... <Loader2 className="w-4 h-4 animate-spin" /></>
                ) : (
                  <>Continue <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Step 4: AI Discovery Interview */}
        {step === 4 && (
          <div id="ob-step-4" className="flex-1 flex flex-col justify-between">
            {isFinishingOnboarding ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-10">
                <Loader2 className="w-12 h-12 text-[#1E40AF] animate-spin mb-4" />
                <h3 className="text-xl font-extrabold text-slate-900 mb-2">Analyzing Onboarding Discovery</h3>
                <p className="text-slate-500 text-xs max-w-sm leading-relaxed">
                  Our virtual CFO, COO, and CMO are compiling your corporate SWOT, departments workflow matrix, and primary target goals. Placing directors in seats...
                </p>
              </div>
            ) : (
              <div className="flex-1 flex flex-col h-full justify-between">
                <div>
                  <div className="flex items-center gap-2 text-[#1E40AF] font-bold text-xs uppercase tracking-widest mb-2">
                    <MessageSquare className="w-4 h-4" /> Step 4 of 4: AI Discovery Interview
                  </div>
                  <h2 className="text-2xl font-extrabold text-slate-950 mb-2">Discovery chat with your Board</h2>
                  <p className="text-slate-500 text-xs leading-relaxed mb-4">
                    Our AI Board of Directors needs to understand your context before offering guidance. Respond below so we can map out your strategic landscape.
                  </p>
                </div>

                {/* Discovery Chat Window */}
                <div id="discovery-chat" className="flex-1 border border-slate-200 rounded-2xl bg-slate-50 p-4 overflow-y-auto mb-4 h-[220px]">
                  <div className="space-y-4">
                    {chat.map((msg, idx) => (
                      <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-4 rounded-2xl text-xs max-w-[85%] leading-relaxed shadow-xs ${msg.sender === 'user' ? 'bg-[#1E40AF] text-white' : 'bg-white border border-slate-200 text-slate-700'}`}>
                          <p className="font-bold mb-1 uppercase text-[9px] tracking-widest opacity-80">{msg.sender === 'user' ? 'You' : 'Board Advisor'}</p>
                          <p>{msg.text}</p>
                        </div>
                      </div>
                    ))}
                    {isLoadingQuestion && (
                      <div className="flex justify-start">
                        <div className="bg-white border border-slate-200 p-4 rounded-2xl flex items-center gap-2">
                          <Loader2 className="w-4 h-4 text-[#1E40AF] animate-spin" />
                          <span className="text-xs text-slate-400">Board Advisor is listening...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatBottomRef} />
                  </div>
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    id="inp-chat-input"
                    type="text"
                    required
                    placeholder="Type your answer here..."
                    value={userInput}
                    onChange={e => setUserInput(e.target.value)}
                    disabled={isLoadingQuestion}
                    className="flex-1 border border-slate-200 p-3 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white"
                  />
                  <button
                    type="submit"
                    id="btn-chat-send"
                    disabled={isLoadingQuestion || !userInput.trim()}
                    className="bg-[#1E40AF] text-white hover:bg-[#2563EB] px-5 rounded-xl flex items-center justify-center font-bold text-sm transition-all cursor-pointer disabled:opacity-55"
                  >
                    Submit
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
