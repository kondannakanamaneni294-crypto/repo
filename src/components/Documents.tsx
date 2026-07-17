import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, Trash2, FileText, Info, Eye, Edit2, X, AlertTriangle, 
  FileUp, FileCheck2
} from 'lucide-react';
import { DB, DocumentMeta } from '../services/db';

interface DocumentsProps {
  businessId: string;
  onDocumentsUpdated: () => void;
}

export default function Documents({ businessId, onDocumentsUpdated }: DocumentsProps) {
  const [dragActive, setDragActive] = useState(false);
  const [localDocs, setLocalDocs] = useState<DocumentMeta[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Interaction modals state
  const [viewingDoc, setViewingDoc] = useState<DocumentMeta | null>(null);
  const [renamingDoc, setRenamingDoc] = useState<DocumentMeta | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);

  // Sync documents list from DB
  const syncDocs = () => {
    const list = DB.getDocuments().filter(d => d.businessId === businessId);
    setLocalDocs(list);
  };

  useEffect(() => {
    syncDocs();
  }, [businessId]);

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
    setError(null);
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toUpperCase() || '';
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
          
          // Call the server endpoint for deep analysis
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
            throw new Error(`Document Analysis failed: ${response.statusText}`);
          }
          
          const analysis = await response.json();
          
          await DB.addDocument({
            businessId,
            name: file.name,
            type: ext || 'TXT',
            size: `${Math.round(file.size / 1024)} KB`,
            content: analysis.extractedInfo || textFallback || `Analyzed document parameters.`,
            summary: analysis.summary || `Parsed business parameters from uploaded asset: ${file.name}`
          }, file);
          
          await DB.addNotification(
            "Document Saved",
            `File "${file.name}" uploaded and analyzed by AI successfully.`,
            "success"
          );
          
          syncDocs();
          onDocumentsUpdated();
        } catch (err: any) {
          console.error("Failed to upload document:", err);
          let errMsg = err instanceof Error ? err.message : String(err);
          try {
            const parsed = JSON.parse(errMsg);
            if (parsed && parsed.error) errMsg = parsed.error;
          } catch {}
          setError(errMsg);
        }
      };
      
      if (isText) {
        reader.readAsText(file);
      } else {
        reader.readAsDataURL(file);
      }
    }
  };

  const handleDeleteTrigger = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingDocId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDocId) return;
    setError(null);
    try {
      await DB.deleteDocument(deletingDocId);
      await DB.addNotification(
        "Document Removed",
        "The selected document was removed from BoardMind AI's active memory.",
        "warning"
      );
      setDeletingDocId(null);
      syncDocs();
      onDocumentsUpdated();
    } catch (err: any) {
      console.error("Failed to delete document:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    }
  };

  const handleRenameTrigger = (doc: DocumentMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingDoc(doc);
    setRenameValue(doc.name);
  };

  const handleConfirmRename = async () => {
    if (!renamingDoc || !renameValue.trim()) return;
    setError(null);
    
    const updatedDoc: DocumentMeta = {
      ...renamingDoc,
      name: renameValue.trim()
    };
    
    try {
      await DB.updateDocument(updatedDoc);
      await DB.addNotification(
        "Document Renamed",
        `Successfully renamed document to "${renameValue.trim()}".`,
        "success"
      );
      
      setRenamingDoc(null);
      setRenameValue('');
      syncDocs();
      onDocumentsUpdated();
    } catch (err: any) {
      console.error("Failed to rename document:", err);
      let errMsg = err instanceof Error ? err.message : String(err);
      try {
        const parsed = JSON.parse(errMsg);
        if (parsed && parsed.error) errMsg = parsed.error;
      } catch {}
      setError(errMsg);
    }
  };

  const handleViewDoc = (doc: DocumentMeta, e: React.MouseEvent) => {
    e.stopPropagation();
    setViewingDoc(doc);
  };

  const getFileIcon = (type: string) => {
    const t = type.toUpperCase();
    if (t === 'PDF') return <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-rose-600"><FileText className="w-5 h-5" /></div>;
    if (['XLS', 'XLSX', 'CSV'].includes(t)) return <div className="p-3.5 bg-emerald-50 border border-emerald-100 rounded-xl text-emerald-600"><FileText className="w-5 h-5" /></div>;
    if (['PNG', 'JPG', 'JPEG', 'SVG', 'WEBP'].includes(t)) return <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600"><FileText className="w-5 h-5" /></div>;
    return <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-600"><FileText className="w-5 h-5" /></div>;
  };

  return (
    <div id="documents-view" className="space-y-8 max-w-4xl mx-auto">
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-xs flex flex-col gap-1 relative animate-fade-in print:hidden">
          <p className="font-bold">Database Write Error</p>
          <p>{error}</p>
          <button type="button" onClick={() => setError(null)} className="text-left font-bold underline mt-1 text-[10px] text-red-800 cursor-pointer">
            Dismiss
          </button>
        </div>
      )}
      
      {/* 1. Elegant Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-black text-slate-900 tracking-tight">Documents</h2>
        <p className="text-sm font-semibold text-slate-500 leading-relaxed max-w-2xl">
          Upload business documents to help BoardMind AI better understand your business and provide more accurate recommendations.
        </p>
      </div>

      {/* 2. Drag & Drop Upload Container */}
      <div 
        id="doc-drag-drop-area"
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl p-8 md:p-12 text-center transition-all duration-200 bg-white relative ${dragActive ? 'border-[#1E40AF] bg-blue-50/10 shadow-xs scale-[0.99]' : 'border-slate-200 hover:border-slate-300'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          multiple 
          onChange={handleFileInput} 
          className="hidden" 
          accept=".pdf,.xlsx,.xls,.csv,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
        />
        <div className="max-w-md mx-auto flex flex-col items-center">
          <div className="bg-blue-50/50 p-4 rounded-full border border-blue-100 mb-4 text-[#1E40AF]">
            <Upload className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 mb-1">Drag & Drop upload</h3>
          <p className="text-xs text-slate-400 font-medium mb-4">or drag your files directly into this box</p>
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-6 py-2.5 bg-[#1E40AF] hover:bg-[#2563EB] text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-2"
          >
            <FileUp className="w-4 h-4" /> Upload Documents
          </button>

          <div className="mt-6 flex flex-wrap justify-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>Supported:</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">PDF</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Excel</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Word</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">CSV</span>
            <span className="bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md">Images</span>
          </div>
        </div>
      </div>

      {/* 3. Automatic Context Banner */}
      <div className="flex gap-3.5 p-4.5 bg-blue-50/25 border border-blue-100 rounded-2xl text-[#1E40AF] text-xs font-semibold leading-relaxed">
        <div className="bg-[#1E40AF]/10 p-2.5 rounded-xl text-[#1E40AF] self-start">
          <FileCheck2 className="w-5 h-5" />
        </div>
        <div>
          <span className="font-extrabold uppercase text-[10px] tracking-wider block mb-0.5">Automated Boardroom Sync</span>
          <p className="text-slate-600">
            BoardMind AI automatically analyzes all uploaded documents during strategic discussions. You don't need to manually search or map your files—relevancy is handled entirely in the background.
          </p>
        </div>
      </div>

      {/* 4. Uploaded Documents List */}
      <div className="space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">Uploaded Documents ({localDocs.length})</h3>
        </div>

        {localDocs.length === 0 ? (
          <div className="text-center py-12 bg-slate-50/30 border border-slate-150 rounded-2xl text-slate-400">
            <Info className="w-8 h-8 mx-auto text-slate-300 mb-2" />
            <p className="text-xs font-bold">No business documents have been uploaded yet.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Upload file assets above to begin feeding context to the board.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {localDocs.map(doc => (
              <div 
                key={doc.id} 
                className="bg-white border border-slate-200/80 p-4.5 rounded-2xl flex items-center justify-between gap-4 hover:shadow-2xs transition-all hover:border-slate-300"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {getFileIcon(doc.type)}
                  <div className="min-w-0">
                    <h4 className="text-xs font-black text-slate-800 truncate" title={doc.name}>
                      {doc.name}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase mt-1">
                      <span>{doc.type}</span>
                      <span>•</span>
                      <span>{doc.size}</span>
                      <span>•</span>
                      <span className="lowercase first-letter:uppercase">{new Date(doc.uploadDate).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 print:hidden">
                  <button
                    onClick={(e) => handleViewDoc(doc, e)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer border border-slate-150"
                    title="View Document"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleRenameTrigger(doc, e)}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-lg transition-all cursor-pointer border border-slate-150"
                    title="Rename Document"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteTrigger(doc.id, e)}
                    className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-all cursor-pointer border border-red-100"
                    title="Delete Document"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* VIEW DOCUMENT CONTENT MODAL */}
      {viewingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="min-w-0">
                <span className="text-[9px] bg-[#1E40AF]/15 text-[#1E40AF] px-2 py-0.5 rounded-md font-extrabold uppercase tracking-widest mb-1 inline-block">
                  {viewingDoc.type} Asset
                </span>
                <h3 className="text-xs md:text-sm font-black text-slate-800 truncate" title={viewingDoc.name}>
                  {viewingDoc.name}
                </h3>
              </div>
              <button 
                onClick={() => setViewingDoc(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer shrink-0"
              >
                <X className="w-4.5 h-4.5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-600 leading-relaxed">
              <div className="space-y-1.5">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Document Summary</h5>
                <p className="bg-blue-50/20 border border-blue-100/50 p-3 rounded-xl text-[#1E40AF]">
                  {viewingDoc.summary || `Extracted and synchronized with executive memory vectors.`}
                </p>
              </div>

              <div className="space-y-1.5">
                <h5 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Document Text Preview</h5>
                <pre className="whitespace-pre-wrap font-mono text-[11px] bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-slate-700 max-h-64 overflow-y-auto">
                  {viewingDoc.content}
                </pre>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 bg-slate-50/30 text-right shrink-0">
              <button
                onClick={() => setViewingDoc(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENAME DOCUMENT MODAL */}
      {renamingDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-xl space-y-4">
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Rename Document</h3>
            <p className="text-xs text-slate-500">Provide a clean, descriptive name so that the board directors can identify this asset easily.</p>
            <input
              type="text"
              className="w-full border-2 border-slate-200 px-3 py-2.5 rounded-xl text-xs font-semibold focus:border-[#1E40AF] outline-hidden bg-white text-slate-850"
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              placeholder="Enter file name..."
              autoFocus
            />
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                onClick={() => {
                  setRenamingDoc(null);
                  setRenameValue('');
                }}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRename}
                disabled={!renameValue.trim() || renameValue.trim() === renamingDoc.name}
                className="px-4 py-2 bg-[#1E40AF] hover:bg-[#2563EB] text-white text-xs font-bold rounded-lg cursor-pointer disabled:opacity-50"
              >
                Save Name
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingDocId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-55">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full border border-slate-200 shadow-xl space-y-4 text-center">
            <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wide">Remove Document?</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Are you sure you want to delete this document? Doing so will instantly erase it from BoardMind AI's active boardroom memory.
            </p>
            <div className="flex gap-2.5 pt-2 justify-center">
              <button
                onClick={() => setDeletingDocId(null)}
                className="px-4 py-2 border border-slate-200 text-slate-500 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer w-1/2"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg cursor-pointer w-1/2"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
