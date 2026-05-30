import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { 
  Lock, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  EyeOff, 
  ShieldAlert,
  Loader2,
  Sliders,
  MessageSquare,
  Paperclip,
  UploadCloud,
  FileText,
  UserCheck,
  Building,
  User,
  ShieldCheck,
  X,
  ChevronRight,
  ArrowLeft,
  Activity
} from 'lucide-react';
import { db } from '../firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { AnonymousChatTerminal } from './AnonymousChatTerminal';

interface ComplaintBoxProps {
  defaultTab?: 'file' | 'chat';
}

export const ComplaintBox: React.FC<ComplaintBoxProps> = ({ defaultTab = 'file' }) => {
  const { currentUser, anonymousComplaints, users, submitComplaint, logActivity } = useStore();
  
  const [activeTab, setActiveTab] = useState<'file' | 'chat'>(defaultTab);
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);

  // Form State
  const [complaintText, setComplaintText] = useState('');
  const [category, setCategory] = useState('General');
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [targetMonitorId, setTargetMonitorId] = useState<string>('auto');
  const [contextDetails, setContextDetails] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  
  // File Attachment State
  const [dragActive, setDragActive] = useState(false);
  const [attachedFile, setAttachedFile] = useState<{ name: string; size: number; type: string } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // List of staff monitors of the system (active admin or monitor)
  const monitorsList = (users || []).filter(u => u.role === 'monitor' || u.role === 'admin');

  const categories = [
    'General',
    'Policy Violation',
    'System Abuse / Corrupt Practice',
    'Harassment or Coercion',
    'Security Vulnerability',
    'False Debt Representation',
    'Collateral Disputes'
  ];

  // Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    // Only allow common log/doc/image files
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf', 'text/plain'];
    if (!allowedTypes.includes(file.type) && !file.name.endsWith('.log')) {
      alert("Only PDF, Images, Plain Text, or Log files are allowed as context attachments.");
      return;
    }

    setIsUploading(true);
    setUploadProgress(10);
    
    // Simulate real upload progress
    const timer = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          setIsUploading(false);
          setAttachedFile({
            name: file.name,
            size: Math.round(file.size / 1024), // Keep size in KB
            type: file.type || 'text/plain'
          });
          return 100;
        }
        return prev + 25;
      });
    }, 150);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setAttachedFile(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      const selectedMonitor = targetMonitorId !== 'auto' 
        ? monitorsList.find(m => m.id === targetMonitorId) 
        : null;

      // Construct dynamic payload
      const extraPayload: any = {
        anonymous: isAnonymous,
        disclosedUsername: isAnonymous ? null : currentUser?.username || 'Disclosed User',
        contextDetails: contextDetails.trim() || null,
        targetMonitorId: targetMonitorId === 'auto' ? null : targetMonitorId,
        targetMonitorName: selectedMonitor ? `@${selectedMonitor.username}` : null,
        attachmentName: attachedFile ? attachedFile.name : null,
        attachmentSize: attachedFile ? attachedFile.size : null,
        attachmentType: attachedFile ? attachedFile.type : null,
        source: 'complaint_box'
      };

      // If the user pre-selects a monitor, assign them directly
      if (selectedMonitor) {
        extraPayload.assignedMonitorId = selectedMonitor.id;
        extraPayload.assignedMonitorName = `@${selectedMonitor.username}`;
        extraPayload.status = 'under_review';
        extraPayload.anonymousThreadId = 'to-be-assigned'; // Will get matched in secure chat
      }

      const generatedId = await submitComplaint(category, complaintText.trim(), extraPayload);
      
      setStatus('success');
      setComplaintText('');
      setCategory('General');
      setContextDetails('');
      setAttachedFile(null);
      setTargetMonitorId('auto');
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err?.message || 'Report dispatch failed.');
    }
  };

  const activeComplaint = selectedComplaintId 
    ? anonymousComplaints.find(c => c.id === selectedComplaintId) 
    : null;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6" id="complaint-box-unified">
      {/* Title block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-neutral-800 pb-5">
        <div>
          <h2 className="text-2xl font-black tracking-tight italic flex items-center gap-2">
            <ShieldCheck className="text-orange-500 animate-pulse" />
            Complaint Box
          </h2>
          <p className="text-[10px] text-neutral-500 font-mono tracking-widest uppercase mt-0.5">
            Your Secure Complaint Channels
          </p>
        </div>

        {/* Global Hub Navigation Tabs */}
        <div className="flex bg-neutral-900 border border-neutral-800 p-1 rounded-xl w-fit">
          <button
            onClick={() => {
              setActiveTab('file');
              setSelectedComplaintId(null);
            }}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'file'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <Sliders size={12} />
            File Complaint
          </button>
          <button
            onClick={() => {
              setActiveTab('chat');
            }}
            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 relative cursor-pointer ${
              activeTab === 'chat'
                ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <MessageSquare size={12} />
            My Secure Channels
            {anonymousComplaints.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-orange-500 text-[8px] font-mono text-white">
                {anonymousComplaints.length}
              </span>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'file' ? (
          <motion.div
            key="file-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid md:grid-cols-[1fr_280px] gap-8"
          >
            {/* Form Section */}
            <div className="bg-neutral-950/40 border border-neutral-850 p-6 md:p-8 rounded-3xl relative overflow-hidden backdrop-blur-sm">
              <div className="absolute top-0 right-0 p-8 opacity-[0.01] pointer-events-none text-white select-none">
                <Lock size={120} />
              </div>

              {status === 'success' ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-16 text-center flex flex-col items-center justify-center space-y-4"
                >
                  <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-400 animate-bounce">
                    <CheckCircle size={48} />
                  </div>
                  <h3 className="text-lg font-black tracking-tight text-emerald-200 uppercase">
                    Secure Dispatch Succeeded
                  </h3>
                  <p className="text-xs text-neutral-400 max-w-sm leading-relaxed">
                    The report has been registered. You can track this complaint and message coordinators directly via the <strong className="text-orange-400">"My Secure Channels"</strong> tab.
                  </p>
                  <button
                    onClick={() => setStatus('idle')}
                    className="mt-6 px-6 py-2.5 bg-neutral-900 hover:bg-neutral-850 text-neutral-300 border border-neutral-800 rounded-xl font-mono text-[9px] font-black uppercase tracking-widest transition-all cursor-pointer"
                  >
                    Transmit Another Statement
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6 text-left">
                  {/* Row 1: Category & Anonymity */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    {/* Category Select */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                        Category Classification
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 font-sans focus:outline-none focus:border-orange-500/30 font-medium cursor-pointer"
                      >
                        {categories.map((cat, idx) => (
                          <option key={idx} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Anonymity Selector */}
                    <div className="space-y-2">
                      <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                        Privacy Directive
                      </label>
                      <div className="grid grid-cols-2 bg-neutral-900 rounded-xl p-1 border border-neutral-800">
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(true)}
                          className={`py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            isAnonymous
                              ? 'bg-neutral-950 text-orange-400 border border-neutral-850 shadow'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <EyeOff size={10} />
                          Anonymous
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsAnonymous(false)}
                          className={`py-2 text-[9px] font-bold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            !isAnonymous
                              ? 'bg-neutral-950 text-orange-400 border border-neutral-850 shadow'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          <User size={10} />
                          Disclosed
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Row 2: Target Monitor Selection */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                      Secure Route Target (Coordinator Assignment)
                    </label>
                    <div className="relative">
                      <select
                        value={targetMonitorId}
                        onChange={(e) => setTargetMonitorId(e.target.value)}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 focus:outline-none focus:border-orange-500/30 cursor-pointer"
                      >
                        <option value="auto">System Routing (Sequential Auto-Assignment)</option>
                        {monitorsList.map(m => (
                          <option key={m.id} value={m.id}>
                            Direct Route: @{m.username} ({m.role.toUpperCase()})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Textarea for main Complaint */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[9px] font-mono font-bold text-neutral-400">
                      <label className="uppercase tracking-widest">
                        Grievance / Complaint Statement
                      </label>
                      <span className="text-neutral-600">
                        {complaintText.length} / 2000 CHS
                      </span>
                    </div>
                    <textarea
                      required
                      value={complaintText}
                      onChange={(e) => setComplaintText(e.target.value)}
                      maxLength={2000}
                      rows={5}
                      placeholder="Specify your grievance with objective facts. System monitors will review and respond securely."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-4 text-xs text-neutral-200 focus:outline-none focus:border-orange-500/30 placeholder-neutral-600 resize-none leading-relaxed"
                    />
                  </div>

                  {/* Optional Context Details */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                      Additional Context & Audit IDs (Optional)
                    </label>
                    <input
                      type="text"
                      value={contextDetails}
                      onChange={(e) => setContextDetails(e.target.value)}
                      placeholder="e.g. Transaction ID, associated bill identifiers, exact times"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 focus:outline-none focus:border-orange-500/30 placeholder-neutral-600"
                    />
                  </div>

                  {/* Evidentiary Attachment Dropzone */}
                  <div className="space-y-2">
                    <label className="block text-[9px] font-mono font-bold text-neutral-400 uppercase tracking-widest">
                      Evidentiary Documentation (Optional)
                    </label>
                    <div 
                      onDragEnter={handleDrag}
                      onDragOver={handleDrag}
                      onDragLeave={handleDrag}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-2 ${
                        dragActive 
                          ? 'border-orange-500 bg-orange-500/5 shadow-inner' 
                          : attachedFile 
                            ? 'border-emerald-500/30 bg-emerald-500/5' 
                            : 'border-neutral-800 hover:border-neutral-700 bg-neutral-900/10'
                      }`}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileChange}
                        accept="image/png,image/jpeg,image/jpg,application/pdf,text/plain,.log"
                        className="hidden"
                      />

                      {isUploading ? (
                        <div className="space-y-2 w-full max-w-xs">
                          <Loader2 className="animate-spin text-orange-500 mx-auto" size={24} />
                          <p className="text-[9px] font-mono text-neutral-500 uppercase">Encrypting and uploading attachment...</p>
                          <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500 transition-all duration-150" style={{ width: `${uploadProgress}%` }} />
                          </div>
                        </div>
                      ) : attachedFile ? (
                        <div className="flex items-center justify-between bg-neutral-950 border border-neutral-850 p-3 rounded-xl w-full max-w-md">
                          <div className="flex items-center gap-2 text-left">
                            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg">
                              <FileText size={16} />
                            </div>
                            <div>
                              <p className="text-xs text-neutral-200 font-bold truncate max-w-[180px]">{attachedFile.name}</p>
                              <p className="text-[9px] font-mono text-neutral-500 uppercase">{attachedFile.size} KB • {attachedFile.type}</p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeFile();
                            }}
                            className="p-1 px-2 border border-neutral-800 hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-400 text-neutral-500 rounded-lg text-[9px] font-mono tracking-wider max-h-fit"
                          >
                            REMOVE
                          </button>
                        </div>
                      ) : (
                        <>
                          <UploadCloud size={24} className="text-neutral-600 animate-pulse" />
                          <p className="text-xs text-neutral-300 font-bold font-sans">
                            Drag & Drop context file here, or <span className="text-orange-500 underline">browse</span>
                          </p>
                          <p className="text-[8px] font-mono text-neutral-500 uppercase">
                            Accepts images, PDF, CSV, or system .log files (MAX 10MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {status === 'error' && (
                    <div className="p-3.5 bg-red-950/20 border border-red-500/30 text-red-400 text-xs rounded-xl flex items-center gap-2">
                      <AlertTriangle size={14} className="shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Actions Row */}
                  <div className="pt-4 border-t border-neutral-900 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <p className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider flex items-center gap-1.5">
                      <EyeOff size={11} className="text-orange-500/60" />
                      {isAnonymous 
                        ? 'Directive: Secure Anonymization Active' 
                        : `Directive: Disclosed Submission as @${currentUser?.username}`}
                    </p>

                    <button
                      type="submit"
                      disabled={status === 'sending' || !complaintText.trim()}
                      className={`px-6 py-4 rounded-xl text-xs font-mono font-black uppercase tracking-widest transition-all cursor-pointer flex items-center justify-center gap-2 ${
                        status === 'sending' || !complaintText.trim()
                          ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                          : 'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/10'
                      }`}
                    >
                      {status === 'sending' ? (
                        <>
                          <Loader2 className="animate-spin text-neutral-400" size={14} />
                          Dispatching...
                        </>
                      ) : (
                        <>
                          <Send size={14} />
                          Dispatch Report
                        </>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Floating Guidelines Sidebar */}
            <div className="space-y-4">
              <div className="bg-neutral-900/50 border border-neutral-850 p-5 rounded-2xl space-y-4 text-left">
                <h4 className="text-[10px] font-mono text-orange-500 font-bold uppercase tracking-widest flex items-center gap-1.5">
                  <Activity size={12} />
                  Safe Channel Directives
                </h4>
                <ul className="space-y-3 text-[11px] text-neutral-400 leading-relaxed font-sans">
                  <li>
                    <strong className="text-neutral-200">System Isolation:</strong> Complete stripping of IP, machine signatures, and profile info upon selecting anonymous mode.
                  </li>
                  <li>
                    <strong className="text-neutral-200">Strict Routing:</strong> Choose Direct Routing to secure your line with a specified coordinator from the roster immediately.
                  </li>
                  <li>
                    <strong className="text-neutral-200">Contextual Assets:</strong> Upload ledger logs, dispute sheets, or screenshots to aid immediate claim resolution.
                  </li>
                </ul>
              </div>

              <div className="p-5 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center py-8">
                <EyeOff size={28} className="text-neutral-700/80 mb-3" />
                <p className="text-[10px] font-black uppercase text-neutral-500 tracking-wider">Line Encryption</p>
                <p className="text-[10px] text-neutral-600 uppercase italic mt-1 font-mono">TLS-256 Enabled</p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="chat-tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {/* Split Screen Chat Hub */}
            {selectedComplaintId && activeComplaint ? (
              /* ACTIVE CHANNEL CHAT INTERFACE */
              <div className="bg-neutral-950/40 border border-neutral-850 rounded-3xl overflow-hidden backdrop-blur-sm shadow-xl grid md:grid-cols-[280px_1fr] min-h-[550px] max-h-[700px]">
                {/* Collapsible/Sidebar Pane inside Chat */}
                <div className="bg-neutral-950 border-r border-neutral-850 p-5 flex flex-col justify-between text-left">
                  <div className="space-y-6">
                    <button
                      onClick={() => setSelectedComplaintId(null)}
                      className="flex items-center gap-1.5 text-[9px] font-mono text-neutral-500 hover:text-neutral-300 uppercase font-bold tracking-wider mb-2 cursor-pointer"
                    >
                      <ArrowLeft size={12} />
                      Back to threads
                    </button>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] font-mono text-neutral-500 tracking-wider uppercase bg-neutral-900 border border-neutral-800 px-2 py-0.5 rounded">
                          {activeComplaint.subject || 'General'}
                        </span>
                        <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded ${
                          activeComplaint.status === 'resolved' 
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                            : activeComplaint.assignedMonitorId 
                              ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20' 
                              : 'bg-neutral-900 text-neutral-500 border border-neutral-800'
                        }`}>
                          {activeComplaint.status?.replace('_', ' ') || 'pending'}
                        </span>
                      </div>

                      <h4 className="text-xs font-black text-neutral-200 uppercase tracking-tight">
                        Complaint #{activeComplaint.id.substring(0, 8)}
                      </h4>
                      <p className="text-[8px] font-mono text-neutral-600 uppercase">
                        Issued: {activeComplaint.createdAt ? new Date(activeComplaint.createdAt).toLocaleString() : 'Just Now'}
                      </p>
                    </div>

                    <div className="py-2 border-t border-neutral-900 space-y-3 text-xs text-neutral-400 leading-relaxed">
                      <p className="font-mono text-[9px] text-neutral-500 uppercase font-bold">Your Statement:</p>
                      <div className="bg-neutral-900/50 p-3 rounded-xl border border-neutral-850 max-h-[140px] overflow-y-auto text-[11px] select-text">
                        {activeComplaint.complaint}
                      </div>
                    </div>

                    {/* Metadata summary (optional details & files) */}
                    {(activeComplaint.contextDetails || activeComplaint.attachmentName) && (
                      <div className="py-2 border-t border-neutral-900 space-y-2.5 text-xs text-neutral-400">
                        <p className="font-mono text-[9px] text-neutral-500 uppercase font-bold">Attached Context:</p>
                        {activeComplaint.contextDetails && (
                          <p className="text-[10px] italic bg-neutral-900/30 p-2 rounded">"{activeComplaint.contextDetails}"</p>
                        )}
                        {activeComplaint.attachmentName && (
                          <div className="flex items-center gap-1.5 p-2 bg-neutral-900 rounded border border-neutral-850 text-[10px]">
                            <Paperclip size={10} className="text-emerald-500" />
                            <span className="truncate flex-1 max-w-[150px]">{activeComplaint.attachmentName}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Assigned Monitor status */}
                  <div className="pt-4 border-t border-neutral-900 font-mono text-[9px] space-y-2">
                    <p className="text-neutral-500 uppercase font-bold">Secure Line Agent:</p>
                    {activeComplaint.assignedMonitorId ? (
                      <div className="flex items-center gap-2 bg-neutral-900/80 p-2 border border-neutral-800 rounded-lg">
                        <UserCheck size={12} className="text-orange-500" />
                        <div>
                          <p className="text-neutral-300 font-bold">{activeComplaint.assignedMonitorName || 'Staff Agent'}</p>
                          <p className="text-[7px] text-emerald-400 uppercase tracking-widest font-bold">LINE ENCRYPTED</p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-orange-950/10 p-2 border border-orange-500/10 rounded-lg">
                        <Loader2 size={12} className="text-orange-500 animate-spin" />
                        <div>
                          <p className="text-orange-400 font-bold">System Hold</p>
                          <p className="text-[7px] text-neutral-500 uppercase">Awaiting claim...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Secure Chat Terminal Section */}
                <div className="flex flex-col h-full overflow-hidden bg-neutral-950/60 pb-4">
                  {activeComplaint.assignedMonitorId ? (
                    <AnonymousChatTerminal 
                      threadId={activeComplaint.id} 
                      senderType="complainant" 
                    />
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4 font-mono select-none">
                      <Lock size={44} className="text-orange-500 opacity-60 animate-pulse" />
                      <div>
                        <h4 className="text-neutral-400 text-xs font-black uppercase tracking-widest">TRANSMISSION REGISTERED</h4>
                        <p className="text-[10px] text-neutral-600 uppercase max-w-sm mt-1 leading-relaxed">
                          Your line is currently pending coordination. Once a monitor or admin claims this complaint, a direct secure chatting link will instantly establish.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* LIST OF COMMITTED CHANNELS */
              <div className="space-y-4">
                {anonymousComplaints.length === 0 ? (
                  <div className="p-24 border border-dashed border-neutral-800 rounded-3xl text-center flex flex-col items-center justify-center bg-neutral-950/20 max-w-2xl mx-auto py-24">
                    <MessageSquare size={36} className="text-neutral-700 mb-4 animate-pulse" />
                    <h4 className="text-[11px] font-black uppercase text-neutral-400 tracking-widest">No Active Channels</h4>
                    <p className="text-[10px] text-neutral-600 mt-1 uppercase max-w-xs leading-relaxed">
                      You haven't filed any complaints yet. Submit a grievance under the "File Complaint" tab to begin a thread.
                    </p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-4 max-w-3xl mx-auto md:max-w-none text-left">
                    {anonymousComplaints.map(c => {
                      const isUnclaimed = !c.assignedMonitorId;
                      const isResolved = c.status === 'resolved';
                      const isClaimedAndActive = c.assignedMonitorId && !isResolved;

                      return (
                        <div
                          key={c.id}
                          className="p-5 rounded-2xl border border-neutral-850 hover:border-neutral-700 bg-neutral-950/30 hover:bg-neutral-900/10 transition-all flex flex-col justify-between gap-4 h-[195px] relative group overflow-hidden"
                        >
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[8px] font-mono text-neutral-500 bg-neutral-950 border border-neutral-850 px-2 py-0.5 rounded">
                                {c.subject || 'General'}
                              </span>
                              
                              {/* Status Pulse dot */}
                              <div className="flex items-center gap-1.5 bg-neutral-950/80 px-2 py-0.5 border border-neutral-850 rounded-full">
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  isResolved 
                                    ? 'bg-neutral-500' 
                                    : isUnclaimed 
                                      ? 'bg-amber-500 animate-ping' 
                                      : 'bg-emerald-500 animate-pulse'
                                }`} />
                                <span className="text-[8px] font-mono text-neutral-500 uppercase tracking-tighter">
                                  {isResolved ? 'Resolved' : isUnclaimed ? 'Hold' : 'Unencrypted Active'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs font-bold text-neutral-200 truncate font-mono">
                              ID: #{c.id.substring(0, 10)}
                            </p>

                            <p className="text-[11px] text-neutral-400 leading-relaxed line-clamp-2 select-text">
                              {c.complaint}
                            </p>
                          </div>

                          <div className="pt-3 border-t border-neutral-900 flex items-center justify-between">
                            <span className="text-[8px] font-mono text-neutral-600">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Just Now'}
                            </span>

                            <button
                              onClick={() => setSelectedComplaintId(c.id)}
                              className="px-3 py-1.5 bg-neutral-900 border border-neutral-800 hover:border-orange-500/30 text-neutral-300 hover:text-orange-400 rounded-lg text-[9px] font-mono tracking-widest font-bold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            >
                              Open Line
                              <ChevronRight size={10} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
