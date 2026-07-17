import React, { useState, useEffect, useRef } from 'react';
import { 
  Loader2, Sparkles, Brain, Calendar, Check, 
  User, ChevronDown, ChevronUp, FileText, Upload, Trash2, Download,
  Layers, Eye, MoreVertical, Pin, Copy, Edit2, Info, AlertTriangle, TrendingUp, CheckSquare,
  Wrench, Building
} from 'lucide-react';
import { DB, Business, KnowledgeBase, Decision, ExecutiveMessage, DocumentMeta } from '../services/db';
import BusinessHealthScorecard from './BusinessHealthScorecard';

// Progressive Loading Stages for Virtual Boardroom
const loadingStages = [
  { key: 1, label: "Understanding your business..." },
  { key: 2, label: "Reviewing your documents..." },
  { key: 3, label: "Generating recommendation..." },
  { key: 4, label: "Finalizing response..." }
];

// Smart context-filtering helper for the Knowledge Base
function getSmartKnowledgeBase(kbase: KnowledgeBase, queryText: string): Partial<KnowledgeBase> {
  const query = queryText.toLowerCase();
  const words = query.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length > 3);
  
  const filterArray = (arr: string[]) => {
    if (!arr || arr.length === 0) return [];
    if (words.length === 0) return arr.slice(0, 2);
    const matches = arr.filter(item => 
      words.some(word => item.toLowerCase().includes(word))
    );
    return matches.length > 0 ? matches.slice(0, 3) : arr.slice(0, 2);
  };

  return {
    businessSummary: kbase.businessSummary || '',
    mission: kbase.mission || '',
    products: filterArray(kbase.products),
    revenueStreams: filterArray(kbase.revenueStreams),
    strengths: filterArray(kbase.strengths),
    weaknesses: filterArray(kbase.weaknesses),
    opportunities: filterArray(kbase.opportunities),
    threats: filterArray(kbase.threats),
    goals: filterArray(kbase.goals),
    challenges: filterArray(kbase.challenges),
    metrics: filterArray(kbase.metrics),
    decisionPreferences: filterArray(kbase.decisionPreferences)
  };
}

// Smart context-filtering helper for uploaded documents
function getSmartDocumentContext(docs: DocumentMeta[], queryText: string): string {
  if (!docs || docs.length === 0) return '';
  const query = queryText.toLowerCase();
  const words = query.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length > 3);
  
  const matches: { text: string; docName: string; score: number }[] = [];
  for (const doc of docs) {
    const textContent = doc.content || '';
    if (!textContent) continue;

    const paragraphs = textContent.split(/\n+/).filter(p => p.trim().length > 10);
    for (const p of paragraphs) {
      let score = 0;
      for (const w of words) {
        if (p.toLowerCase().includes(w)) score++;
      }
      if (score > 0) {
        matches.push({ text: p.trim(), docName: doc.name, score });
      }
    }
  }

  if (matches.length === 0) {
    return docs.slice(0, 3).map(d => `Document: "${d.name}" (Summary: ${d.summary || 'Business details'})`).join('\n');
  }

  matches.sort((a, b) => b.score - a.score);
  return matches.slice(0, 2).map(m => `[From Document "${m.docName}"]: ${m.text}`).join('\n\n');
}

interface BoardroomProps {
  business: Business;
  kbase: KnowledgeBase;
  onDecisionCreated: () => void;
  stateVersion: number;
}

export default function Boardroom({ business, kbase, onDecisionCreated, stateVersion }: BoardroomProps) {
  const [sessions, setSessions] = useState<Decision[]>([]);
  const [activeSession, setActiveSession] = useState<Decision | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Tab controller for the active session (Executive Solution vs Executive Debate)
  const [mode, setMode] = useState<'solution' | 'debate'>('solution');
  
  // Chat input state
  const [question, setQuestion] = useState('');
  const [isSimulating, setIsSimulating] = useState(false);
  const [loadingStepText, setLoadingStepText] = useState('');
  const [activeStageKey, setActiveStageKey] = useState(1);

  // Local documents tracking for reactive UI context list
  const [localDocs, setLocalDocs] = useState<DocumentMeta[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Expanded debate card states
  const [expandedCards, setExpandedCards] = useState<Record<number, boolean>>({});

  // CRUD interaction states
  const [activeDropdownId, setActiveDropdownId] = useState<string | null>(null);
  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const sampleQuestions = [
    "Sales are decreasing.",
    "Should I hire another employee?",
    "Should I reduce product pricing?",
    "Should I buy new machinery?",
    "How can I increase profits?"
  ];

  // Sync loaded sessions from local storage
  const syncSessionsFromDB = () => {
    const loaded = DB.getDecisions().filter(d => d.businessId === business.id);
    setSessions(loaded);
  };

  // Load all sessions on mount & update
  useEffect(() => {
    syncSessionsFromDB();
    const loaded = DB.getDecisions().filter(d => d.businessId === business.id);
    if (loaded.length > 0 && !activeSession) {
      setActiveSession(loaded[0]);
    }
  }, [business.id]);

  // Load local docs on mount & update
  useEffect(() => {
    setLocalDocs(DB.getDocuments().filter(d => d.businessId === business.id));
  }, [business.id]);

  // File Upload Handlers
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
      const reader = new FileReader();
      reader.onload = async () => {
        const textSim = `Contents of uploaded document: ${file.name}.\nThis file outlines standard parameters, supply channels, pricing schedules, and strategic metrics for the firm.`;
        await DB.addDocument({
          businessId: business.id,
          name: file.name,
          type: file.name.split('.').pop()?.toUpperCase() || 'TXT',
          size: `${Math.round(file.size / 1024)} KB`,
          content: textSim,
          summary: `Parsed business parameters from uploaded asset: ${file.name}`
        }, file);
        await DB.addNotification(
          "Document Loaded",
          `File "${file.name}" uploaded successfully and added to boardroom memory.`,
          "success"
        );
        // Refresh local documents list
        setLocalDocs(DB.getDocuments().filter(d => d.businessId === business.id));
      };
      reader.readAsText(file);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await DB.deleteDocument(id);
    setLocalDocs(DB.getDocuments().filter(d => d.businessId === business.id));
  };

  // Run Board meeting
  const handleSimulate = async (qText: string) => {
    if (!qText.trim() || isSimulating) return;

    setQuestion('');
    setIsSimulating(true);
    setExpandedCards({}); // Reset debate accordion states
    setActiveStageKey(1);

    const stageInterval = setInterval(() => {
      setActiveStageKey(prev => {
        if (prev < 4) {
          return prev + 1;
        }
        return prev;
      });
    }, 1000);

    try {
      const docs = DB.getDocuments().filter(d => d.businessId === business.id);
      
      const smartKB = getSmartKnowledgeBase(kbase, qText);
      const smartDocContext = getSmartDocumentContext(docs, qText);
      const smartHistory = sessions.slice(0, 2).map(s => ({
        question: s.question,
        resolution: s.resolution
      }));

      const response = await fetch('/api/boardroom/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: qText,
          profile: {
            id: business.id,
            name: business.name,
            industry: business.industry,
            size: business.size,
            employees: business.employees,
            years: business.years,
            city: business.city,
            country: business.country
          },
          knowledgeBase: smartKB,
          docContext: smartDocContext,
          history: smartHistory
        })
      });

      clearInterval(stageInterval);

      if (!response.ok) {
        throw new Error('Server failed to run board meeting');
      }

      const data = await response.json();
      
      // Save decision to local database with clean title
      const savedDec = await DB.addDecision({
        businessId: business.id,
        question: qText,
        resolution: data.decision.resolution,
        reasoning: data.decision.reasoning,
        risks: data.decision.risks,
        benefits: data.decision.benefits,
        confidenceScore: data.decision.confidenceScore || 85,
        priority: data.decision.priority || 'Medium',
        resourcesRequired: data.decision.resourcesRequired,
        implementationPlan: data.decision.implementationPlan,
        dialogue: data.dialogue,
        priorityMatrix: data.decision.priorityMatrix
      });

      // Update sessions list
      syncSessionsFromDB();
      setActiveSession(savedDec);

      await DB.addNotification(
        "Board Advisory Compiled",
        `Corporate consensus reached on: "${qText.substring(0, 30)}..."`,
        "success"
      );
      onDecisionCreated();
    } catch (err) {
      clearInterval(stageInterval);
      console.error(err);
      
      // Professional fail-soft feedback simulator
      setTimeout(async () => {
        const fallbackDec = await DB.addDecision({
          businessId: business.id,
          question: qText,
          resolution: `Our recommendation is to launch a low-cost, 30-day trial for "${qText}". Keep overhead low, test with your most loyal customers first, and check your numbers weekly before spending real money.`,
          reasoning: [
            `Saves cash and checks the idea before you commit.`,
            `Gives you direct feedback from your regulars.`,
            `Let's you adjust your hours and workflow without burning out.`
          ],
          risks: [
            `Some customers might take time to get used to the change.`,
            `Your staff will need clear, simple guidance on the trial rules.`
          ],
          benefits: [
            `Protects your profit margins and keeps risk very low.`,
            `Gives you clear steps that you can start on Monday.`
          ],
          confidenceScore: 89,
          priority: 'High',
          implementationPlan: [
            `Write down a quick, 1-page cheat sheet for your staff by Friday.`,
            `Start the 30-day trial rollout on Monday morning.`,
            `Track your cash intake and customer reactions every Saturday.`
          ],
          priorityMatrix: {
            quickWins: ["Train staff on direct customer talking points", "Optimize immediate shift schedules"],
            majorProjects: ["Deploy digital channels marketing push", "Invest in core workstation hardware upgrades"],
            fillIns: ["Update business signboards", "Realign standard supplier timetables"],
            thanklessTasks: ["Engaging in price wars with national discount chains"]
          },
          dialogue: [
            { role: 'CEO', name: 'Marcus Sterling', speech: 'Let\'s run a quick experiment. We can adjust menu prices or test a new shift schedule next week to see how the customers react before doing anything permanent.' },
            { role: 'CFO', name: 'Clara Vance', speech: 'From a cash standpoint, a 30-day test is perfect. We protect our cash flow and only make bigger changes if the numbers look healthy.' },
            { role: 'COO', name: 'David Cho', speech: 'Let\'s write down simple talking points for the staff so they are comfortable explaining this trial to our guests.' },
            { role: 'CMO', name: 'Sophia Miller', speech: 'We will be honest and clear with our regulars. They love our local business and will support us if we explain why we are doing this.' },
            { role: 'Risk', name: 'Aris Thorne', speech: 'Let\'s track daily sales during the trial. If we see a dip, we can easily pause the test and go back to our baseline immediately.' }
          ]
        });

        syncSessionsFromDB();
        setActiveSession(fallbackDec);
        onDecisionCreated();
      }, 1500);
    } finally {
      setIsSimulating(false);
    }
  };

  // Helper colors and descriptions for executive avatars
  const getRoleDetails = (role: string) => {
    switch(role) {
      case 'CEO': 
        return { label: 'CEO', name: 'Marcus Sterling', color: 'bg-blue-600 text-white border-blue-400', desc: 'Bold, growth-focused & strategic' };
      case 'CFO': 
        return { label: 'CFO', name: 'Clara Vance', color: 'bg-emerald-600 text-white border-emerald-400', desc: 'Pragmatic, heavily focused on margins' };
      case 'COO': 
        return { label: 'COO', name: 'David Cho', color: 'bg-purple-600 text-white border-purple-400', desc: 'Operational expert, execution-oriented' };
      case 'CMO': 
      case 'Marketing Head': 
        return { label: 'Marketing Head', name: 'Sophia Miller', color: 'bg-rose-500 text-white border-rose-400', desc: 'Customer-obsessed & brand strategist' };
      case 'Risk': 
      case 'Risk Advisor': 
        return { label: 'Risk Advisor', name: 'Aris Thorne', color: 'bg-red-600 text-white border-red-400', desc: 'Cautious, evaluates downside scenarios' };
      case 'IndustryExpert': 
      case 'Industry Expert': 
        return { label: 'Industry Expert', name: 'Dr. Helen Vance', color: 'bg-amber-600 text-white border-amber-400', desc: 'Deep domain insights & market trends' };
      case 'Legal': 
        return { label: 'Legal Counsel', name: 'Justine Wright', color: 'bg-violet-600 text-white border-violet-400', desc: 'Risk-averse, compliance & IP' };
      case 'CTO': 
        return { label: 'CTO', name: 'Alex Chen', color: 'bg-cyan-600 text-white border-cyan-400', desc: 'Digital transformation & technology' };
      case 'Moderator': 
        return { label: 'Moderator', name: 'Moderator AI', color: 'bg-slate-700 text-white border-slate-500', desc: 'Synthesizer of corporate consensus' };
      default: 
        return { label: role, name: 'Executive Advisor', color: 'bg-slate-600 text-white border-slate-400', desc: 'Expert Advisor' };
    }
  };

  const toggleCard = (idx: number) => {
    setExpandedCards(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handlePrint = () => {
    window.print();
  };

  // 2-3 sentence summary helper
  const getExecutiveSummary = (resText: string) => {
    if (!resText) return '';
    const sentences = resText.split(/(?<=[.?!])\s+/);
    if (sentences.length <= 3) return resText;
    return sentences.slice(0, 3).join(' ');
  };

  // CRUD operation triggers
  const handleOpenDecision = (sess: Decision) => {
    setActiveSession(sess);
    setExpandedCards({});
    setActiveDropdownId(null);
  };

  const handleTogglePin = async (sess: Decision, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    try {
      const updatedSess = { ...sess, pinned: !(sess as any).pinned } as any;
      await DB.updateDecision(updatedSess);
      syncSessionsFromDB();
      if (activeSession?.id === sess.id) {
        setActiveSession(updatedSess);
      }
    } catch (err: any) {
      console.error("Failed to pin decision:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    }
    setActiveDropdownId(null);
  };

  const handleDuplicate = async (sess: Decision, e: React.MouseEvent) => {
    e.stopPropagation();
    setError(null);
    try {
      const cloned = await DB.addDecision({
        businessId: sess.businessId,
        question: `Copy of: ${sess.question}`,
        resolution: sess.resolution,
        reasoning: sess.reasoning,
        risks: sess.risks,
        benefits: sess.benefits,
        confidenceScore: sess.confidenceScore,
        priority: sess.priority,
        resourcesRequired: sess.resourcesRequired || [],
        implementationPlan: sess.implementationPlan,
        dialogue: sess.dialogue,
        priorityMatrix: sess.priorityMatrix || { quickWins: [], majorProjects: [], fillIns: [], thanklessTasks: [] }
      });
      syncSessionsFromDB();
      setActiveSession(cloned);
      DB.addNotification("Decision Duplicated", `Cloned decision: "${sess.question}" successfully.`, "info");
    } catch (err: any) {
      console.error("Failed to duplicate decision:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    }
    setActiveDropdownId(null);
  };

  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteId(id);
    setActiveDropdownId(null);
  };

  const handleConfirmDelete = async () => {
    if (!deleteId) return;
    setError(null);
    try {
      await DB.deleteDecision(deleteId);
      const remaining = DB.getDecisions().filter(d => d.businessId === business.id);
      setSessions(remaining);
      if (activeSession?.id === deleteId) {
        setActiveSession(remaining.length > 0 ? remaining[0] : null);
      }
      DB.addNotification("Decision Removed", "Saved decision deleted successfully.", "warning");
    } catch (err: any) {
      console.error("Failed to delete decision:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    }
    setDeleteId(null);
  };

  const handleRenameTrigger = (sess: Decision, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenameId(sess.id);
    setRenameValue(sess.question);
    setActiveDropdownId(null);
  };

  const handleConfirmRename = async () => {
    if (!renameId || !renameValue.trim()) return;
    setError(null);
    try {
      const decToRename = sessions.find(d => d.id === renameId);
      if (decToRename) {
        const renamed = { ...decToRename, question: renameValue.trim() };
        await DB.updateDecision(renamed);
        syncSessionsFromDB();
        if (activeSession?.id === renameId) {
          setActiveSession(renamed);
        }
      }
      DB.addNotification("Decision Renamed", "Strategic topic title updated.", "success");
    } catch (err: any) {
      console.error("Failed to rename decision:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    }
    setRenameId(null);
    setRenameValue('');
  };

  // Sort decisions: pinned float to the very top, followed by creation date (newer first)
  const sortedSessions = [...sessions].sort((a, b) => {
    const pinA = (a as any).pinned ? 1 : 0;
    const pinB = (b as any).pinned ? 1 : 0;
    if (pinA !== pinB) return pinB - pinA;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="flex flex-col gap-6 min-h-[calc(100vh-8rem)]">
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex flex-col gap-1 relative animate-fade-in print:hidden">
          <p className="font-bold">Database Write Error</p>
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-left font-bold underline mt-1 text-[10px] text-red-800 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}

      {/* 0. BUSINESS HEALTH SCORECARD WIDGET */}
      <div className="print:hidden">
        <BusinessHealthScorecard 
          business={business} 
          kbase={kbase} 
          documents={localDocs} 
          stateVersion={stateVersion} 
        />
      </div>
      
      {/* 1. CHAT INPUT FOCUS ZONE (At the top, always visible, clean & spacious like ChatGPT) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 md:p-8 shadow-xs relative print:hidden">
        
        <div className="text-center max-w-2xl mx-auto mb-6">
          <div className="flex items-center justify-center gap-2 text-[#1E40AF] font-extrabold text-sm uppercase tracking-wider mb-2">
            <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" /> Virtual Advisory Boardroom
          </div>
          <p className="text-slate-500 text-xs md:text-sm font-medium">
            Ask any business dilemma. Your AI Executive team analyzes your business profile and document context to deliver instant strategic recommendations.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          
          {/* Main Large Input Bar */}
          <div className="relative">
            <textarea
              placeholder="Ask any business question or describe your business problem..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              rows={2}
              className="w-full border-2 border-slate-200 pr-40 pl-4 py-4 rounded-xl text-sm focus:border-[#1E40AF] outline-hidden bg-white text-slate-800 font-medium transition-all shadow-xs resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSimulate(question);
                }
              }}
            />
            
            {/* Inline Toggle and Send Grouping */}
            <div className="absolute right-3.5 bottom-3.5 flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[11px] font-bold">
                <button
                  type="button"
                  onClick={() => setMode('solution')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${mode === 'solution' ? 'bg-[#1E40AF] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                  title="Receive a simple, instant solution summary"
                >
                  Solution
                </button>
                <button
                  type="button"
                  onClick={() => setMode('debate')}
                  className={`px-2 py-1 rounded-md transition-all cursor-pointer ${mode === 'debate' ? 'bg-[#1E40AF] text-white shadow-3xs' : 'text-slate-500 hover:text-slate-800'}`}
                  title="View the detailed corporate board meeting debate"
                >
                  Debate
                </button>
              </div>

              <button
                onClick={() => handleSimulate(question)}
                disabled={!question.trim() || isSimulating}
                className="bg-[#1E40AF] hover:bg-[#2563EB] text-white font-bold px-4 py-2 rounded-lg text-xs transition-all cursor-pointer disabled:opacity-40 whitespace-nowrap flex items-center gap-1.5"
              >
                {isSimulating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Ask AI"}
              </button>
            </div>
          </div>

          {/* Upload Documents Widget & Mobile Mode Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
            
            <div className="flex items-center gap-3">
              {/* Document Uploader Trigger */}
              <div 
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border border-dashed px-3 py-1.5 rounded-lg flex items-center gap-1.5 cursor-pointer transition-all text-xs font-bold shrink-0 ${dragActive ? 'border-[#1E40AF] bg-blue-50/20' : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'}`}
                title="Include Word, Excel, PDF or image context for analysis"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-slate-600">📎 Upload Documents</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.xlsx,.xls,.doc,.docx,.png,.jpg,.jpeg"
                  className="hidden"
                  onChange={handleFileInput}
                />
              </div>

              {/* Mobile Mode Selector (visible only on small screens) */}
              <div className="sm:hidden flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-lg p-0.5 text-[10px] font-bold">
                <button
                  type="button"
                  onClick={() => setMode('solution')}
                  className={`px-1.5 py-1 rounded-md ${mode === 'solution' ? 'bg-[#1E40AF] text-white' : 'text-slate-500'}`}
                >
                  Solution
                </button>
                <button
                  type="button"
                  onClick={() => setMode('debate')}
                  className={`px-1.5 py-1 rounded-md ${mode === 'debate' ? 'bg-[#1E40AF] text-white' : 'text-slate-500'}`}
                >
                  Debate
                </button>
              </div>
            </div>

            {/* In-Context Document Chips list */}
            <div className="flex-1 flex flex-wrap items-center gap-1.5 overflow-x-auto justify-end">
              {localDocs.length > 0 && (
                <>
                  <span className="text-[10px] text-slate-400 font-bold uppercase shrink-0">Context ({localDocs.length}):</span>
                  {localDocs.map(doc => (
                    <div key={doc.id} className="bg-emerald-50 border border-emerald-100 text-[10px] font-bold text-emerald-800 px-2 py-0.5 rounded-md flex items-center gap-1 shrink-0">
                      <span className="max-w-[100px] truncate">{doc.name}</span>
                      <button 
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="hover:text-red-500 rounded-sm cursor-pointer ml-0.5"
                      >
                        <Trash2 className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>

          </div>

          {/* Quick Examples Badges */}
          <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Examples:</span>
            {sampleQuestions.map((ex, idx) => (
              <button
                key={idx}
                onClick={() => handleSimulate(ex)}
                className="bg-slate-50 hover:bg-blue-50/50 border border-slate-200 hover:border-[#1E40AF] text-slate-600 hover:text-[#1E40AF] px-2.5 py-1 rounded-lg text-xs font-semibold cursor-pointer transition-all text-left"
              >
                {ex}
              </button>
            ))}
          </div>

        </div>

      </div>

      {/* 2. PROGRESSIVE LOADING ANIMATION (Clean in-theme progress checklist) */}
      {isSimulating && (
        <div className="bg-white border border-slate-200/80 rounded-2xl p-10 flex flex-col items-center justify-center text-center min-h-[350px] shadow-xs">
          <div className="mb-6 relative">
            <Loader2 className="w-10 h-10 text-[#1E40AF] animate-spin" />
            <Sparkles className="w-4 h-4 text-amber-500 absolute -top-1 -right-1 animate-pulse" />
          </div>
          <h3 className="text-base font-black text-slate-800 uppercase tracking-wider mb-6">Analyzing Dilemma...</h3>
          
          <div className="w-full max-w-xs text-left space-y-4">
            {loadingStages.map((stage) => {
              const isActive = stage.key === activeStageKey;
              const isCompleted = stage.key < activeStageKey;
              return (
                <div key={stage.key} className="flex items-center gap-3 transition-all duration-350">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 ${
                    isCompleted ? 'bg-emerald-500 text-white' :
                    isActive ? 'bg-[#1E40AF]/15 text-[#1E40AF]' :
                    'bg-slate-100 text-slate-300'
                  }`}>
                    {isCompleted ? (
                      <Check className="w-3 h-3 stroke-[3]" />
                    ) : isActive ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <div className="w-1 h-1 rounded-full bg-slate-300" />
                    )}
                  </div>
                  <span className={`text-xs font-bold transition-colors duration-350 ${
                    isCompleted ? 'text-slate-500 font-medium' :
                    isActive ? 'text-slate-800 font-extrabold animate-pulse' :
                    'text-slate-400 font-semibold'
                  }`}>
                    {stage.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. ACTIVE SCENARIO STRATEGIC RESOLUTION workspace (Shows below input area once loaded) */}
      {activeSession && !isSimulating && (
        <div className="bg-white border border-slate-200/85 rounded-2xl overflow-hidden shadow-xs">
          
          {/* Workspace Title Header Bar */}
          <div className="p-4 bg-slate-50 border-b border-slate-150 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-bold text-[#1E40AF] uppercase tracking-wider block mb-0.5">CURRENT ADVISORY VERDICT</span>
              <p className="text-xs md:text-sm font-black text-slate-800 line-clamp-1">"{activeSession.question}"</p>
            </div>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#1E40AF]/10 hover:bg-[#1E40AF]/15 text-[#1E40AF] font-bold text-xs rounded-lg cursor-pointer transition-all print:hidden shrink-0 self-start sm:self-center"
            >
              <Download className="w-3.5 h-3.5" /> Download Report PDF
            </button>
          </div>

          <div className="p-6 md:p-8">
            
            {/* ==============================================
                MODE 1: EXECUTIVE SOLUTION (Simplified & Concisely Carded)
                ============================================== */}
            {mode === 'solution' && (
              <div className="space-y-6 max-w-4xl mx-auto">
                
                {/* Executive Recommendation Main Block */}
                <div className="bg-blue-50/20 border-2 border-blue-100 p-5 md:p-6 rounded-2xl">
                  <h4 className="text-xs font-black uppercase tracking-wider text-[#1E40AF] mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" /> Executive Recommendation
                  </h4>
                  <p className="text-sm md:text-base font-extrabold text-slate-800 leading-relaxed">
                    {activeSession.resolution}
                  </p>
                </div>

                {/* Overall Summary & Confidence Meter */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Overall Summary */}
                  <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-xl space-y-2">
                    <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Overall Summary</h5>
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed italic">
                      "{getExecutiveSummary(activeSession.resolution)}"
                    </p>
                  </div>

                  {/* Confidence metrics */}
                  <div className="bg-slate-50/50 border border-slate-200 p-5 rounded-xl flex flex-col justify-between space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Confidence</span>
                      <span className="text-xs text-[#1E40AF] font-black">{activeSession.confidenceScore}% Consensus</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-[#1E40AF] h-full rounded-full transition-all duration-700"
                        style={{ width: `${activeSession.confidenceScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                      <span>Priority: {activeSession.priority}</span>
                      <span>Risk: Low to Medium</span>
                    </div>
                  </div>

                </div>

                {/* Reasons, Benefits, Risks 3-Column Bento Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  
                  {/* Supporting Reasons */}
                  <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-[#1E40AF] flex items-center gap-1.5">
                      <CheckSquare className="w-4 h-4 text-[#1E40AF]" /> Why this is recommended
                    </h4>
                    <ul className="space-y-2 text-xs font-semibold text-slate-600">
                      {activeSession.reasoning.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <Check className="w-3.5 h-3.5 text-[#1E40AF] shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Expected Benefits */}
                  <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-emerald-500" /> Benefits
                    </h4>
                    <ul className="space-y-2 text-xs font-semibold text-slate-600">
                      {activeSession.benefits.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-emerald-500 font-extrabold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks to Keep in Mind */}
                  <div className="border border-slate-200 p-5 rounded-xl bg-white space-y-3">
                    <h4 className="text-[11px] font-black uppercase tracking-wider text-red-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-500" /> Possible Risks
                    </h4>
                    <ul className="space-y-2 text-xs font-semibold text-slate-600">
                      {activeSession.risks.slice(0, 3).map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 leading-relaxed">
                          <span className="text-red-500 font-extrabold shrink-0 mt-0.5">•</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                </div>

                {/* Resources Required (Conditionally Rendered) */}
                {activeSession.resourcesRequired && activeSession.resourcesRequired.length > 0 && (
                  <div className="border border-slate-200 p-6 rounded-2xl bg-white space-y-4">
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <Wrench className="w-4 h-4 text-[#1E40AF]" /> Resources Required
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeSession.resourcesRequired.map((res, idx) => (
                        <div key={idx} className="border border-slate-150 p-4 rounded-xl bg-slate-50/50 flex flex-col justify-between space-y-3">
                          <div className="space-y-2">
                            <div className="flex justify-between items-start gap-2">
                              <h5 className="text-xs font-black text-slate-800 leading-snug">{res.name}</h5>
                              <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider shrink-0 ${
                                res.priority === 'High' ? 'bg-red-50 text-red-700 border border-red-100' :
                                res.priority === 'Medium' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                'bg-blue-50 text-blue-700 border border-blue-100'
                              }`}>
                                {res.priority}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Reason</span>
                              <p className="text-xs font-semibold text-slate-600 leading-relaxed">{res.reason}</p>
                            </div>

                            {res.estimatedCost && (
                              <div className="space-y-0.5">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Estimated Cost</span>
                                <p className="text-xs font-black text-slate-800">{res.estimatedCost}</p>
                              </div>
                            )}

                            {res.alternative && (
                              <div className="space-y-1 pt-2 border-t border-slate-200/50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Alternative</span>
                                <p className="text-xs font-medium text-slate-500 italic leading-relaxed">{res.alternative}</p>
                              </div>
                            )}

                            {res.items && res.items.length > 0 && (
                              <div className="space-y-1.5 pt-2 border-t border-slate-200/50">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block font-sans">Items</span>
                                <div className="flex flex-wrap gap-1">
                                  {res.items.map((it, iIdx) => (
                                    <span key={iIdx} className="bg-white border border-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                      {it}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Practical Recommended Next Steps */}
                <div className="border border-slate-200 p-6 rounded-2xl bg-white space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-[#1E40AF]" /> Next Steps
                  </h4>
                  <div className="space-y-2">
                    {activeSession.implementationPlan.map((stepText, idx) => (
                      <div key={idx} className="flex gap-3 items-center border border-slate-100 p-3 rounded-lg bg-slate-50/50">
                        <div className="bg-[#1E40AF] text-white w-5 h-5 rounded-full flex items-center justify-center font-black text-xs shrink-0 shadow-3xs">
                          {idx + 1}
                        </div>
                        <p className="text-xs text-slate-700 font-bold">{stepText}</p>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ==============================================
                MODE 2: EXECUTIVE DEBATE (Accordion Collapsed dialogue)
                ============================================== */}
            {mode === 'debate' && (
              <div className="space-y-4 max-w-3xl mx-auto">
                
                <div className="flex justify-between items-center text-xs pb-2 border-b border-slate-150">
                  <span className="text-slate-500 font-bold">Dialogue Transcript of Directors</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const expanded: Record<number, boolean> = {};
                        activeSession.dialogue.forEach((_, idx) => { expanded[idx] = true; });
                        setExpandedCards(expanded);
                      }}
                      className="text-[#1E40AF] font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      Expand All
                    </button>
                    <span className="text-slate-200">•</span>
                    <button 
                      onClick={() => setExpandedCards({})}
                      className="text-slate-500 font-bold text-[11px] hover:underline cursor-pointer"
                    >
                      Collapse All
                    </button>
                  </div>
                </div>

                {/* Accordion sequence list */}
                <div className="space-y-2">
                  {activeSession.dialogue.map((msg, idx) => {
                    const isOpen = expandedCards[idx] || false;
                    const details = getRoleDetails(msg.role);
                    return (
                      <div 
                        key={idx} 
                        className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-3xs transition-all duration-200"
                      >
                        {/* Header trigger */}
                        <div 
                          onClick={() => toggleCard(idx)}
                          className="p-3.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 select-none"
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-extrabold text-[11px] border shrink-0 ${details.color}`}>
                              {msg.role.substring(0, 3)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs font-black text-slate-800 uppercase tracking-wide">{details.label}</span>
                                <span className="text-[10px] text-slate-400">({details.name})</span>
                              </div>
                              <p className="text-[9px] text-slate-400 font-bold italic line-clamp-1">{details.desc}</p>
                            </div>
                          </div>
                          
                          {isOpen ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </div>

                        {/* Collapsible opinion speech */}
                        <div className={`transition-all duration-200 overflow-hidden ${isOpen ? 'max-h-80 border-t border-slate-100 p-4 bg-slate-50/20' : 'max-h-0'}`}>
                          <p className="text-xs font-semibold text-slate-700 leading-relaxed italic pl-2 border-l-2 border-[#1E40AF]/45">
                            "{msg.speech}"
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Final verdict resolution summary */}
                <div className="mt-6 bg-slate-900 text-white p-5 rounded-xl border border-slate-950">
                  <div className="flex items-center gap-2 pb-2.5 border-b border-slate-800 mb-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <span className="bg-[#1E40AF] text-white px-2.5 py-0.5 rounded-full">Consensus Verdict</span>
                    <span>Consensus Level: {activeSession.confidenceScore}%</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-semibold italic pl-3 border-l-2 border-[#1E40AF]">
                    "{activeSession.resolution}"
                  </p>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

      {/* 4. RECENT DECISIONS (Relocated at the bottom as a horizontally scrollable bento-like grid list) */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs relative print:hidden">
        
        <div className="flex justify-between items-center pb-3 border-b border-slate-150 mb-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <Brain className="w-4 h-4 text-[#1E40AF]" /> Recent Decisions
            </h3>
            <p className="text-[10px] text-slate-400 mt-0.5">Quickly retrieve, rename, duplicate, and download previous boardroom recommendations.</p>
          </div>
          <span className="text-[10px] bg-slate-100 text-slate-500 font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
            {sessions.length} Saved
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <Info className="w-7 h-7 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold">No strategic sessions found. Ask your first question above!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[360px] overflow-y-auto pr-1">
            {sortedSessions.map((sess) => {
              const isPinned = (sess as any).pinned || false;
              const isDropdownOpen = activeDropdownId === sess.id;
              
              return (
                <div
                  key={sess.id}
                  className={`border rounded-xl p-4 transition-all relative group flex flex-col justify-between hover:shadow-2xs ${activeSession?.id === sess.id ? 'border-[#1E40AF] bg-blue-50/10' : 'border-slate-150 bg-slate-50/20 hover:bg-slate-50'}`}
                >
                  
                  {/* Top line of decision card */}
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        {isPinned && <Pin className="w-3.5 h-3.5 text-amber-500 shrink-0 transform rotate-45 fill-amber-500" title="Pinned to top" />}
                        <span className="text-[9px] bg-slate-200 px-1.5 py-0.5 rounded-sm font-extrabold text-slate-500 uppercase tracking-widest shrink-0">
                          {business.industry}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium shrink-0">
                          {new Date(sess.createdAt).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Three-Dot Menu Controls */}
                      <div className="relative">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveDropdownId(isDropdownOpen ? null : sess.id);
                          }}
                          className="p-1 hover:bg-slate-200 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Actions menu"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                        
                        {isDropdownOpen && (
                          <>
                            {/* Overlay outside click catcher */}
                            <div className="fixed inset-0 z-10" onClick={() => setActiveDropdownId(null)} />
                            
                            <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg py-1 z-20 text-xs text-slate-700">
                              <button
                                onClick={() => handleOpenDecision(sess)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-semibold"
                              >
                                <Eye className="w-3.5 h-3.5 text-blue-500" /> Open
                              </button>
                              <button
                                onClick={(e) => handleTogglePin(sess, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-semibold"
                              >
                                <Pin className="w-3.5 h-3.5 text-amber-500" /> {isPinned ? 'Unpin' : 'Pin to top'}
                              </button>
                              <button
                                onClick={(e) => handleRenameTrigger(sess, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-semibold"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-purple-500" /> Rename
                              </button>
                              <button
                                onClick={(e) => handleDuplicate(sess, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-semibold"
                              >
                                <Copy className="w-3.5 h-3.5 text-emerald-500" /> Duplicate
                              </button>
                              <button
                                onClick={() => {
                                  setActiveSession(sess);
                                  setActiveDropdownId(null);
                                  setTimeout(() => window.print(), 200);
                                }}
                                className="w-full text-left px-3 py-1.5 hover:bg-slate-100 flex items-center gap-2 cursor-pointer font-semibold"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-500" /> Download PDF
                              </button>
                              <div className="border-t border-slate-100 my-1" />
                              <button
                                onClick={(e) => handleDeleteTrigger(sess.id, e)}
                                className="w-full text-left px-3 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2 cursor-pointer font-semibold"
                              >
                                <Trash2 className="w-3.5 h-3.5 text-red-500" /> Delete
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    <h4 className="font-bold text-slate-800 text-xs md:text-sm line-clamp-2 leading-snug mb-2">
                      {sess.question}
                    </h4>
                    
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">
                      {sess.resolution}
                    </p>
                  </div>

                  {/* Footer metadata of decision card */}
                  <div className="border-t border-slate-100 pt-2 flex items-center justify-between mt-auto">
                    <span className="text-[10px] font-black text-[#1E40AF]">
                      {sess.confidenceScore}% Consensus
                    </span>
                    <button
                      onClick={() => handleOpenDecision(sess)}
                      className="text-[#1E40AF] hover:underline font-extrabold text-[10px] flex items-center gap-0.5 cursor-pointer"
                    >
                      Open Recommendation →
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* RENAME MODAL POPUP */}
      {renameId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-150 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Rename Decision Title</h3>
            <p className="text-xs text-slate-500">Edit the business question to better organize your strategic history log.</p>
            <input
              type="text"
              className="w-full border-2 border-slate-200 px-3 py-2.5 rounded-lg text-xs font-semibold focus:border-[#1E40AF] outline-hidden"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              placeholder="Enter new business question..."
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setRenameId(null);
                  setRenameValue('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!renameValue.trim()}
                className="px-4 py-2 bg-[#1E40AF] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
              >
                Save Rename
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL POPUP */}
      {deleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-150 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Delete Saved Decision?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this boardroom decision history? This cannot be undone and deletes all associated transcripts and recommendations.
            </p>
            <div className="flex gap-2.5 pt-2 justify-center">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer w-1/2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer w-1/2"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
