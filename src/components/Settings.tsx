import React, { useState } from 'react';
import { Sliders, Download, Trash2, Info, CheckCircle, ShieldAlert } from 'lucide-react';
import { DB, Business } from '../services/db';

interface SettingsProps {
  business: Business;
  onPurge: () => void;
}

export default function Settings({ business, onPurge }: SettingsProps) {
  const [boardStyle, setBoardStyle] = useState<'balanced' | 'conservative' | 'aggressive'>('balanced');
  const [isSaved, setIsSaved] = useState(false);

  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    DB.addNotification(
      "AI Preferences Updated",
      `Board boardroom communication style adjusted to: ${boardStyle.toUpperCase()}`,
      "info"
    );
    setTimeout(() => {
      setIsSaved(false);
    }, 2500);
  };

  const handleExportData = () => {
    const backup = {
      business,
      kbase: DB.getKnowledgeBase(),
      documents: DB.getDocuments(),
      decisions: DB.getDecisions(),
      reports: DB.getReports(),
      tasks: DB.getTasks(),
      notifications: DB.getNotifications()
    };
    
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `boardmind_backup_${business.id}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div id="settings-view" className="space-y-6">
      
      {/* Intro Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs">
        <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
          <Sliders className="w-6 h-6 text-[#1E40AF]" /> Workspace Settings & Preferences
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Adjust the debate parameters for your board of directors, export strategic plans, or wipe local databases.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Board preferences */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs md:col-span-2">
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 mb-4">Boardroom AI Preferences</h3>
          
          <form onSubmit={handleSavePreferences} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-2">Advisory Debate Style</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'conservative', title: 'Conservative', desc: 'Prioritizes liquidity, capital safety, and minimal debt risk.' },
                  { id: 'balanced', title: 'Balanced', desc: 'Standard business optimization blending margin focus and moderate growth.' },
                  { id: 'aggressive', title: 'Aggressive', desc: 'Highly opportunistic, recommends faster staff expansions and debt leverage.' }
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBoardStyle(item.id as any)}
                    className={`border p-4 rounded-xl text-left hover:bg-slate-50 transition-all cursor-pointer flex flex-col justify-between min-h-[110px] ${boardStyle === item.id ? 'border-[#1E40AF] bg-blue-50/10' : 'border-slate-200'}`}
                  >
                    <span className="font-bold text-xs text-slate-800">{item.title}</span>
                    <span className="text-[10px] text-slate-400 mt-2 leading-relaxed">{item.desc}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                id="btn-save-settings"
                className="bg-[#1E40AF] hover:bg-[#2563EB] text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center gap-1 cursor-pointer transition-all"
              >
                {isSaved ? <><CheckCircle className="w-4 h-4 text-emerald-400" /> Preferences Saved</> : <>Save Preferences</>}
              </button>
            </div>
          </form>
        </div>

        {/* Data backups & purge panel */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/60 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3 mb-4">Registry Actions</h3>
            
            <div className="space-y-4">
              {/* Backup */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-800">Export Strategic Registry</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Download a structured backup JSON file containing all company profiles, SWOT matrices, boardroom chats, and compiled reports.</p>
                <button
                  onClick={handleExportData}
                  className="w-full bg-slate-50 border border-slate-200 text-slate-600 hover:text-[#1E40AF] hover:border-[#1E40AF] text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Export Local Backup
                </button>
              </div>

              {/* Purge */}
              <div className="space-y-2 pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-slate-800 text-red-600 flex items-center gap-1"><ShieldAlert className="w-4 h-4 text-red-500" /> Delete Business Data</h4>
                <p className="text-[10px] text-slate-400 leading-relaxed">Wipes local storage. Deletes all knowledge bases, uploaded PDF files, decisions log, and active credentials immediately. This is irreversible.</p>
                <button
                  id="btn-wipe-data"
                  onClick={onPurge}
                  className="w-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold py-2.5 rounded-xl transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Wipe Local Workspace
                </button>
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 mt-6 leading-relaxed flex gap-1 items-start bg-slate-50 p-2.5 rounded-xl">
            <Info className="w-4 h-4 shrink-0 text-slate-400 mt-0.5" />
            <span>Workspace resides securely inside local cloud registries. Purges occur instantly across local nodes.</span>
          </div>
        </div>

      </div>

    </div>
  );
}
