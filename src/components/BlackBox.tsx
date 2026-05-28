import React, { useState } from 'react';
import { motion } from 'motion/react';
import { useStore } from '../store';
import { 
  Lock, 
  Terminal, 
  Send, 
  CheckCircle, 
  AlertTriangle, 
  EyeOff, 
  ShieldAlert,
  Loader2
} from 'lucide-react';

interface BlackBoxProps {
  source: 'groups_blackbox' | 'profile_blackbox';
}

export const BlackBox: React.FC<BlackBoxProps> = ({ source }) => {
  const submitComplaint = useStore(state => state.submitComplaint);
  const [complaintText, setComplaintText] = useState('');
  const [category, setCategory] = useState('General');
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const categories = [
    'General',
    'Policy Violation',
    'System Abuse / Corrupt Practice',
    'Harassment or Coercion',
    'Security Vulnerability',
    'False Debt Representation',
    'Collateral Disputes'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;

    setStatus('sending');
    setErrorMessage('');

    try {
      await submitComplaint(category, complaintText.trim());
      setStatus('success');
      setComplaintText('');
      setCategory('General');
      // Reset success message after 5 seconds
      setTimeout(() => setStatus('idle'), 5000);
    } catch (err: any) {
      console.error(err);
      setStatus('error');
      setErrorMessage(err?.message || 'Uplink transmission failure.');
    }
  };

  return (
    <div 
      className="relative bg-black border border-amber-600/30 rounded-3xl p-6 md:p-8 overflow-hidden shadow-[0_0_50px_-15px_rgba(245,158,11,0.15)] max-w-2xl mx-auto"
      style={{
        backgroundImage: 'radial-gradient(ellipse at top, rgba(245, 158, 11, 0.05), transparent)'
      }}
      id={`blackbox-container-${source}`}
    >
      {/* Visual background overlay (terminal grid/scanlines) */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.02]" 
           style={{
             backgroundImage: 'linear-gradient(rgba(180, 180, 180, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(180, 180, 180, 0.1) 1px, transparent 1px)',
             backgroundSize: '20px 20px'
           }} 
      />

      {/* Security level badge & status indicator */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-amber-900/30 pb-6 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 animate-pulse">
            <Lock size={18} />
          </div>
          <div>
            <h4 className="font-mono text-[10px] text-amber-500 font-bold uppercase tracking-widest">
              Classified Submission Portal
            </h4>
            <h3 className="text-lg font-black text-white uppercase tracking-tight font-sans">
              BLACK BOX CHANNELS
            </h3>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-neutral-900/80 border border-neutral-800 px-3 py-1.5 rounded-full">
          <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping" />
          <span className="font-mono text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
            SECURE LINK STABLE
          </span>
        </div>
      </div>

      {/* Secure notification banner */}
      <div className="bg-neutral-950/80 border border-neutral-800 p-4 rounded-2xl mb-6 flex items-start gap-3">
        <EyeOff className="text-neutral-500 mt-0.5 shrink-0" size={16} />
        <p className="text-xs text-neutral-400 leading-relaxed font-sans">
          <strong className="text-neutral-200">Zero Identity Logging Protocol:</strong> Your username, user ID, IP address, and system metadata are strictly stripped of all outbound package payloads before reaching firestore registries. 
        </p>
      </div>

      {status === 'success' ? (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="py-12 flex flex-col items-center text-center space-y-4"
        >
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-full text-emerald-500">
            <CheckCircle size={40} />
          </div>
          <h4 className="text-base font-black text-emerald-200 uppercase tracking-tight">
            Anonymous report transmitted securely.
          </h4>
          <p className="text-xs text-neutral-400 max-w-md font-sans">
            Your anonymous complaint packet has been encrypted and recorded dynamically. Staff monitors can view the concern in their secure desk dashboard.
          </p>
          <button 
            onClick={() => setStatus('idle')}
            className="mt-4 px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-neutral-300 font-mono text-[10px] uppercase font-bold tracking-widest border border-neutral-800 rounded-xl transition-all"
            id={`btn-reset-blackbox-${source}`}
          >
            Submit Another Complaint
          </button>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Dropdown */}
          <div className="space-y-2">
            <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
              Select Classification Category
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-200 font-sans focus:outline-none focus:border-amber-600/40 transition-all appearance-none cursor-pointer"
                id={`blackbox-category-select-${source}`}
              >
                {categories.map((cat, idx) => (
                  <option key={idx} value={cat} className="bg-neutral-950 text-neutral-200">
                    {cat}
                  </option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-neutral-500 text-xs">
                ▼
              </div>
            </div>
          </div>

          {/* Secure Message Field */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="block text-[10px] font-mono text-neutral-400 uppercase tracking-wider font-bold">
                Detailed Complaint Dossier
              </label>
              <span className="font-mono text-[9px] text-neutral-600">
                MAX 2000 CHARACTERS
              </span>
            </div>
            <textarea
              required
              rows={5}
              maxLength={2000}
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
              placeholder="Submit anonymous concern..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3.5 text-xs text-neutral-200 font-sans focus:outline-none focus:border-amber-600/40 transition-all placeholder-neutral-600 leading-relaxed resize-none"
              id={`blackbox-message-textarea-${source}`}
            />
          </div>

          {/* Error fallback display */}
          {status === 'error' && (
            <div className="p-3 bg-red-950/50 border border-red-900/50 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-neutral-900">
            <div className="flex items-center gap-2 text-[10px] text-neutral-500 font-mono">
              <Terminal size={12} className="text-amber-500/50" />
              <span>UPLINK ORIGIN: CLASSIFIED_GUEST</span>
            </div>

            <button
              type="submit"
              disabled={status === 'sending' || !complaintText.trim()}
              className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-mono text-xs font-black uppercase tracking-widest transition-all ${
                status === 'sending' || !complaintText.trim()
                  ? 'bg-neutral-900 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                  : 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-600/10 cursor-pointer'
              }`}
              id={`blackbox-submit-button-${source}`}
            >
              {status === 'sending' ? (
                <>
                  <Loader2 className="animate-spin text-neutral-400" size={14} />
                  Transmitting...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Submit Packet
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};
