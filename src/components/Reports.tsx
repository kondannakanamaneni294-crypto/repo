import { useState } from 'react';
import { Loader2, Download, FileText, Calendar, Plus, RefreshCw } from 'lucide-react';
import { DB, Business, KnowledgeBase, Report } from '../services/db';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

interface ReportsProps {
  business: Business;
  kbase: KnowledgeBase;
  onReportCreated: () => void;
}

export default function Reports({ business, kbase, onReportCreated }: ReportsProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reportsList = DB.getReports();

  const handleGenerateReport = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    setActiveReport(null);
    setError(null);

    try {
      const decisions = DB.getDecisions();
      const response = await fetch('/api/gemini/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          profile: business,
          knowledgeBase: kbase,
          decisionHistory: decisions
        })
      });

      if (!response.ok) {
        throw new Error('Server failed to generate report');
      }

      const data = await response.json();
      
      // Save report to database
      const savedRep = await DB.addReport({
        businessId: business.id,
        executiveSummary: data.executiveSummary,
        problem: data.problem,
        discussion: data.discussion,
        swot: data.swot,
        riskAnalysis: data.riskAnalysis,
        recommendations: data.recommendations,
        priorityMatrix: data.priorityMatrix,
        plan30Day: data.plan30Day,
        plan90Day: data.plan90Day,
        plan1Year: data.plan1Year,
        charts: data.charts
      });

      setActiveReport(savedRep);
      await DB.addNotification(
        "Advisory Report Created",
        `Corporate Review Report compiled for ${business.name}.`,
        "success"
      );
      onReportCreated();
    } catch (err: any) {
      console.error(err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div id="reports-view" className="space-y-6">
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex flex-col gap-1 relative animate-fade-in print:hidden">
          <p className="font-bold">Report Generation Error</p>
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-left font-bold underline mt-1 text-[10px] text-red-800 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      
      {/* Top Banner */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <FileText className="w-6 h-6 text-[#1E40AF]" /> Board Advisory Reports
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Generate and print full strategic reports analyzing corporate SWOT, department health charts, risk assessments, and implementation action plans.
          </p>
        </div>
        <button
          id="btn-generate-report"
          onClick={handleGenerateReport}
          disabled={isGenerating}
          className="bg-[#1E40AF] text-white hover:bg-[#2563EB] disabled:opacity-55 font-bold text-xs md:text-sm px-5 py-3 rounded-xl flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" /> Compiling Report...
            </>
          ) : (
            <>
              <Plus className="w-4 h-4" /> Generate Strategic Report
            </>
          )}
        </button>
      </div>

      {/* Reports Split Area */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Sidebar History List */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs lg:col-span-1 space-y-4 print:hidden">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Reports Archive</h3>
          
          {reportsList.length === 0 ? (
            <p className="text-xs text-slate-400">No reports generated yet. Click above to compile your first report.</p>
          ) : (
            <div className="space-y-2 max-h-[350px] overflow-y-auto">
              {reportsList.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setActiveReport(rep)}
                  className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex flex-col gap-1 cursor-pointer ${activeReport?.id === rep.id ? 'border-[#1E40AF] bg-blue-50/20' : 'border-slate-150 hover:bg-slate-50'}`}
                >
                  <span className="font-bold text-slate-800">Strategic Review</span>
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(rep.createdAt).toLocaleDateString()}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Report Content View */}
        <div className="lg:col-span-3">
          {isGenerating && (
            <div id="report-compiling-panel" className="bg-slate-900 text-white p-12 rounded-2xl text-center space-y-4">
              <Loader2 className="w-10 h-10 text-[#0EA5E9] animate-spin mx-auto" />
              <h3 className="text-lg font-bold tracking-tight">Compiling Annual Advisory Review</h3>
              <p className="text-slate-400 text-xs max-w-md mx-auto leading-relaxed">
                Assembling department diagnostic metrics. Drafting swot structures. Plotting revenue projections trendcharts. Preparing action plans...
              </p>
            </div>
          )}

          {!isGenerating && !activeReport && (
            <div className="bg-white border border-slate-200 p-12 rounded-2xl text-center text-slate-400 space-y-2 flex flex-col items-center">
              <FileText className="w-12 h-12 text-slate-200" />
              <h4 className="font-bold text-slate-700 text-sm">No Active Report Selected</h4>
              <p className="text-xs text-slate-400 max-w-xs leading-relaxed">Select a generated report from the archive sidebar or compile a new review today.</p>
            </div>
          )}

          {!isGenerating && activeReport && (
            <div id="corporate-report-paper" className="bg-white p-8 md:p-12 border border-slate-250 rounded-2xl shadow-sm space-y-8 relative overflow-hidden print:border-none print:p-0 print:shadow-none">
              
              {/* Report Header */}
              <div className="border-b-2 border-slate-900 pb-6 flex justify-between items-end">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#1E40AF]">CONFIDENTIAL ADVISORY REPORT</span>
                  <h1 className="text-2xl font-black text-slate-950 mt-1">{business.name}</h1>
                  <p className="text-xs text-slate-500 font-medium">Strategic Board Review • Generated: {new Date(activeReport.createdAt).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={handlePrint}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer print:hidden"
                >
                  <Download className="w-4 h-4" /> Print / Save PDF
                </button>
              </div>

              {/* Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E40AF] border-b border-slate-100 pb-1">I. Executive Summary</h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium bg-slate-50/55 p-4 rounded-xl border border-slate-150">
                  {activeReport.executiveSummary}
                </p>
              </div>

              {/* Problem Statement */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E40AF] border-b border-slate-100 pb-1">II. Primary Challenges</h3>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {activeReport.problem}
                </p>
              </div>

              {/* Charts Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E40AF] border-b border-slate-100 pb-1">III. Performance Diagnostics</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Department Scores */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center">
                    <h4 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider text-center">Organizational Health Scores</h4>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={activeReport.charts.health}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                          <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Bar dataKey="score" fill="#1E40AF" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Revenue Growth */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col items-center">
                    <h4 className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider text-center">Revenue Trajectory Index</h4>
                    <div className="w-full h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={activeReport.charts.revenueProjections}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="year" tick={{ fontSize: 10 }} />
                          <YAxis tick={{ fontSize: 10 }} />
                          <Tooltip />
                          <Line type="monotone" dataKey="revenue" stroke="#2563EB" strokeWidth={3} dot={{ r: 5 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              {/* SWOT Matrix Section */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E40AF] border-b border-slate-100 pb-1">IV. Strategic SWOT Analysis</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-blue-150 p-4 rounded-xl bg-blue-50/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E40AF] mb-2">Strengths</h4>
                    <ul className="space-y-1">
                      {activeReport.swot.strengths.map((s, i) => (
                        <li key={i} className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1"><span className="text-[#1E40AF] font-bold">•</span> {s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-orange-150 p-4 rounded-xl bg-orange-50/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">Weaknesses</h4>
                    <ul className="space-y-1">
                      {activeReport.swot.weaknesses.map((w, i) => (
                        <li key={i} className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1"><span className="text-orange-500 font-bold">•</span> {w}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-emerald-150 p-4 rounded-xl bg-emerald-50/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-2">Opportunities</h4>
                    <ul className="space-y-1">
                      {activeReport.swot.opportunities.map((o, i) => (
                        <li key={i} className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1"><span className="text-emerald-500 font-bold">•</span> {o}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="border border-red-150 p-4 rounded-xl bg-red-50/10">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-red-600 mb-2">Threats</h4>
                    <ul className="space-y-1">
                      {activeReport.swot.threats.map((t, i) => (
                        <li key={i} className="text-[11px] text-slate-500 leading-relaxed flex items-start gap-1"><span className="text-red-500 font-bold">•</span> {t}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Priority Action Matrix */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E40AF] border-b border-slate-100 pb-1">V. Decision Priority Matrix</h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="border border-slate-200 p-4 rounded-xl">
                    <h4 className="font-bold text-slate-800 mb-2 text-[11px] uppercase tracking-wider">Quick Wins (Low Effort, High Impact)</h4>
                    {activeReport.priorityMatrix.quickWins.map((q, i) => <p key={i} className="text-slate-500 text-[11px] leading-relaxed mb-1">• {q}</p>)}
                  </div>
                  <div className="border border-slate-200 p-4 rounded-xl">
                    <h4 className="font-bold text-slate-800 mb-2 text-[11px] uppercase tracking-wider">Major Projects (High Effort, High Impact)</h4>
                    {activeReport.priorityMatrix.majorProjects.map((m, i) => <p key={i} className="text-slate-500 text-[11px] leading-relaxed mb-1">• {m}</p>)}
                  </div>
                </div>
              </div>

              {/* Implementation Roadmap */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-[#1E40AF] border-b border-slate-100 pb-1">VI. Board Implementation Roadmaps</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="text-xs font-bold text-[#1E40AF] mb-1">30-Day Launch Phase</h4>
                    <ul className="space-y-1 text-[11px] text-slate-500 pl-4 list-disc">
                      {activeReport.plan30Day.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E40AF] mb-1">90-Day Scaling Phase</h4>
                    <ul className="space-y-1 text-[11px] text-slate-500 pl-4 list-disc">
                      {activeReport.plan90Day.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#1E40AF] mb-1">1-Year Strategic Directives</h4>
                    <ul className="space-y-1 text-[11px] text-slate-500 pl-4 list-disc">
                      {activeReport.plan1Year.map((p, i) => <li key={i}>{p}</li>)}
                    </ul>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

      </div>

    </div>
  );
}
