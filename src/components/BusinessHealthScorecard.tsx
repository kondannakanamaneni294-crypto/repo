import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Percent, DollarSign, Users, Award, 
  HelpCircle, ChevronDown, ChevronUp, RefreshCw, 
  Layers, Lightbulb, ShieldAlert, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { Business, KnowledgeBase, DocumentMeta } from '../services/db';
import { motion, AnimatePresence } from 'motion/react';

interface ScorecardData {
  overallScore: number;
  overallStatus: 'good' | 'average' | 'poor';
  overallSummary: string;
  kpis: {
    revenueGrowth: {
      value: string;
      status: 'good' | 'average' | 'poor';
      explanation: string;
      advice: string;
    };
    profitMargin: {
      value: string;
      status: 'good' | 'average' | 'poor';
      explanation: string;
      advice: string;
    };
    cac: {
      value: string;
      status: 'good' | 'average' | 'poor';
      explanation: string;
      advice: string;
    };
    ltv: {
      value: string;
      status: 'good' | 'average' | 'poor';
      explanation: string;
      advice: string;
    };
  };
  detailedBreakdown: {
    category: string;
    score: number;
    status: 'good' | 'average' | 'poor';
    findings: string;
  }[];
  sourceUsed: string;
}

interface BusinessHealthScorecardProps {
  business: Business;
  kbase: KnowledgeBase | null;
  documents: DocumentMeta[];
  stateVersion: number;
}

export default function BusinessHealthScorecard({ 
  business, 
  kbase, 
  documents,
  stateVersion
}: BusinessHealthScorecardProps) {
  const [data, setData] = useState<ScorecardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedKpi, setExpandedKpi] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchScorecard = async (showRefreshIndicator = false) => {
    if (showRefreshIndicator) setIsRefreshing(true);
    else setLoading(true);
    
    setError(null);
    try {
      const response = await fetch('/api/dashboard/scorecard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: business,
          knowledgeBase: kbase,
          documents: documents.map(d => ({
            name: d.name,
            content: d.content,
            summary: d.summary
          }))
        })
      });

      if (!response.ok) {
        throw new Error('Failed to compute health metrics');
      }

      const result = await response.json();
      setData(result);
    } catch (err: any) {
      console.error('Error loading scorecard:', err);
      setError(err.message || 'Could not calculate scorecard metrics');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchScorecard();
  }, [business.id, stateVersion, documents.length]);

  const getStatusColor = (status: 'good' | 'average' | 'poor') => {
    if (status === 'good') return {
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      text: 'text-emerald-600',
      badgeBg: 'bg-emerald-100 text-emerald-800',
      dot: 'bg-emerald-500',
      border: 'border-emerald-500/20',
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-600" />
    };
    if (status === 'average') return {
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      text: 'text-amber-600',
      badgeBg: 'bg-amber-100 text-amber-800',
      dot: 'bg-amber-500',
      border: 'border-amber-500/20',
      icon: <AlertTriangle className="w-4 h-4 text-amber-600" />
    };
    return {
      bg: 'bg-rose-50 border-rose-200 text-rose-700',
      text: 'text-rose-600',
      badgeBg: 'bg-rose-100 text-rose-800',
      dot: 'bg-rose-500',
      border: 'border-rose-500/20',
      icon: <ShieldAlert className="w-4 h-4 text-rose-600" />
    };
  };

  const kpiMeta = {
    revenueGrowth: {
      label: 'Revenue Growth',
      icon: TrendingUp,
      desc: 'Year-over-Year top-line sales velocity'
    },
    profitMargin: {
      label: 'Profit Margin',
      icon: Percent,
      desc: 'Standard bottom-line capital capture rate'
    },
    cac: {
      label: 'Acquisition Cost (CAC)',
      icon: DollarSign,
      desc: 'Average marketing & sales burn per client'
    },
    ltv: {
      label: 'Lifetime Value (LTV)',
      icon: Users,
      desc: 'Average aggregate gross margin value per customer'
    }
  };

  if (loading) {
    return (
      <div id="scorecard-loading" className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 animate-pulse">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-6 w-48 bg-slate-200 rounded-md" />
            <div className="h-4 w-72 bg-slate-200 rounded-md" />
          </div>
          <div className="h-8 w-8 bg-slate-200 rounded-full" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="md:col-span-1 flex flex-col items-center justify-center p-6 border border-slate-100 rounded-2xl space-y-4">
            <div className="h-24 w-24 bg-slate-200 rounded-full" />
            <div className="h-4 w-24 bg-slate-200 rounded-md" />
          </div>
          <div className="md:col-span-2 grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(n => (
              <div key={n} className="p-4 border border-slate-100 rounded-2xl space-y-2">
                <div className="h-4 w-20 bg-slate-200 rounded-md" />
                <div className="h-6 w-16 bg-slate-200 rounded-md" />
                <div className="h-3 w-full bg-slate-200 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div id="scorecard-error" className="bg-red-50/50 border border-red-150 rounded-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-sm font-black text-slate-800">Scorecard Calculation Failed</h4>
          <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
            {error || 'Unable to compute high-fidelity business intelligence metrics at this time.'}
          </p>
        </div>
        <button 
          onClick={() => fetchScorecard()}
          className="px-4 py-2 bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-900 transition-all cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Retry Calculation
        </button>
      </div>
    );
  }

  const overall = getStatusColor(data.overallStatus);

  return (
    <div 
      id="business-health-scorecard" 
      className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-8 shadow-xs relative overflow-hidden group"
    >
      
      {/* Absolute background accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full blur-3xl -mr-20 -mt-20 opacity-40 pointer-events-none group-hover:opacity-60 transition-all duration-300" />

      {/* 1. Scorecard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Business Health Scorecard</h2>
            {isRefreshing && <RefreshCw className="w-4 h-4 text-slate-400 animate-spin" />}
          </div>
          <p className="text-xs font-semibold text-slate-500">
            Real-time quantitative diagnostics derived from profiles, goals, and active documents.
          </p>
        </div>
        
        <button
          onClick={() => fetchScorecard(true)}
          disabled={isRefreshing}
          className="px-3 py-1.5 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-800 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1.5 self-start sm:self-center disabled:opacity-50 cursor-pointer shadow-3xs"
          title="Recalculate metrics"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Recalculate
        </button>
      </div>

      {/* 2. Main Dashboard Diagnostic Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
        
        {/* Left column: Overall Circular Gauge and Summary */}
        <div className="lg:col-span-4 flex flex-col items-center p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center space-y-4">
          <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-400">Executive Health Rating</h3>
          
          {/* Circular SVG Gauge */}
          <div className="relative w-28 h-28 flex items-center justify-center">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="56"
                cy="56"
                r="48"
                className="stroke-slate-100 fill-none"
                strokeWidth="8"
              />
              <motion.circle
                cx="56"
                cy="56"
                r="48"
                className={`fill-none ${
                  data.overallStatus === 'good' ? 'stroke-emerald-500' :
                  data.overallStatus === 'average' ? 'stroke-amber-500' : 'stroke-rose-500'
                }`}
                strokeWidth="8"
                strokeDasharray={301.6}
                initial={{ strokeDashoffset: 301.6 }}
                animate={{ strokeDashoffset: 301.6 - (301.6 * data.overallScore) / 100 }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-slate-800 tracking-tight">{data.overallScore}</span>
              <span className="text-[9px] font-extrabold uppercase text-slate-400">Index</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-center">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${overall.badgeBg}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${overall.dot}`} />
                {data.overallStatus} Rating
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-600 leading-relaxed">
              {data.overallSummary}
            </p>
          </div>
        </div>

        {/* Right column: KPI Cards Grid */}
        <div className="lg:col-span-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Object.entries(data.kpis).map(([key, rawKpi]) => {
              const kpi = rawKpi as { value: string; status: 'good' | 'average' | 'poor'; explanation: string; advice: string };
              const meta = kpiMeta[key as keyof typeof kpiMeta];
              const kpiStatus = getStatusColor(kpi.status);
              const isExpanded = expandedKpi === key;
              const Icon = meta.icon;

              return (
                <div 
                  key={key}
                  onClick={() => setExpandedKpi(isExpanded ? null : key)}
                  className={`bg-white border rounded-xl p-4 transition-all duration-200 cursor-pointer flex flex-col justify-between group/card relative select-none ${
                    isExpanded 
                      ? 'border-slate-800 shadow-xs ring-1 ring-slate-800/5' 
                      : 'border-slate-150 hover:border-slate-300 hover:shadow-3xs'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-slate-50 border border-slate-100 rounded-lg group-hover/card:bg-slate-100/80 transition-colors">
                        <Icon className="w-4 h-4 text-slate-600" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-slate-800">{meta.label}</h4>
                        <p className="text-[10px] text-slate-400 font-medium truncate max-w-[150px]">{meta.desc}</p>
                      </div>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest ${kpiStatus.badgeBg}`}>
                      {kpi.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline justify-between">
                    <span className="text-lg font-black text-slate-900 tracking-tight">{kpi.value}</span>
                    <span className="text-[10px] text-slate-500 font-bold hover:text-slate-800 flex items-center gap-0.5 transition-colors">
                      {isExpanded ? 'Collapse' : 'Details'} 
                      {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* KPI Expanded Strategic Recommendation Panel */}
          <AnimatePresence mode="wait">
            {expandedKpi && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.15 }}
                className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lightbulb className="w-4 h-4 text-[#1E40AF]" />
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                      Strategic Alignment Advisory • {kpiMeta[expandedKpi as keyof typeof kpiMeta].label}
                    </span>
                  </div>
                  <button 
                    onClick={() => setExpandedKpi(null)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold underline cursor-pointer"
                  >
                    Close Advice
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                  <div className="md:col-span-2 space-y-1">
                    <span className="font-extrabold text-slate-400 uppercase text-[9px] tracking-wider block">Diagnostic Summary</span>
                    <p className="font-semibold text-slate-600 leading-relaxed">
                      {data.kpis[expandedKpi as keyof typeof data.kpis].explanation}
                    </p>
                  </div>
                  <div className="bg-white border border-slate-150 p-3 rounded-xl space-y-1">
                    <span className="font-extrabold text-[#1E40AF] uppercase text-[9px] tracking-wider flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Board Directive
                    </span>
                    <p className="font-bold text-slate-800 leading-relaxed text-[11px]">
                      {data.kpis[expandedKpi as keyof typeof data.kpis].advice}
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

      </div>

      {/* 3. Deep Analytical Breakdown Grid */}
      <div className="pt-6 border-t border-slate-100 relative z-10">
        <div className="flex items-center gap-1.5 mb-4">
          <Layers className="w-4 h-4 text-slate-400" />
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Detailed Structural Breakdown</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {data.detailedBreakdown.map((breakdown, idx) => {
            const status = getStatusColor(breakdown.status);
            return (
              <div 
                key={idx} 
                className="border border-slate-150 rounded-xl p-4 bg-white hover:border-slate-350 transition-all flex flex-col justify-between space-y-4"
              >
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-800">{breakdown.category}</span>
                  <span className={`w-2 h-2 rounded-full ${status.dot}`} title={`${breakdown.status} health`} />
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-end">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Department Index</span>
                    <span className="text-xs font-black text-slate-700">{breakdown.score}%</span>
                  </div>
                  
                  {/* Styled Progress Bar */}
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <motion.div 
                      className={`h-full rounded-full ${
                        breakdown.status === 'good' ? 'bg-emerald-500' :
                        breakdown.status === 'average' ? 'bg-amber-500' : 'bg-rose-500'
                      }`}
                      initial={{ width: 0 }}
                      animate={{ width: `${breakdown.score}%` }}
                      transition={{ duration: 1.0, delay: idx * 0.1, ease: "easeOut" }}
                    />
                  </div>
                </div>

                <p className="text-[11px] font-semibold text-slate-500 leading-relaxed">
                  {breakdown.findings}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Scorecard Footer (Source Grounding Audit) */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 relative z-10">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-slate-400" />
          <span>Diagnostic Mode:</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-md lowercase first-letter:uppercase font-black">
            {data.sourceUsed}
          </span>
        </div>

        {data.sourceUsed === 'industry benchmarks and business profile' && (
          <p className="text-[10px] text-[#1E40AF] font-bold normal-case leading-relaxed text-center sm:text-right">
            💡 <span className="font-black">PRO-TIP:</span> Upload specific financial Excel, CSV, or PDF spreadsheets in the <span className="font-extrabold">Documents</span> tab to ground these scores on actual business transactions!
          </p>
        )}
      </div>

    </div>
  );
}
