import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../store';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { 
  Terminal, 
  Send, 
  Lock, 
  EyeOff, 
  ShieldAlert, 
  Cpu, 
  Loader2, 
  CheckCircle,
  HelpCircle
} from 'lucide-react';

interface ChatMessage {
  id: string;
  threadId: string;
  senderType: 'monitor' | 'complainant';
  message: string;
  timestamp: string;
}

interface AnonymousChatTerminalProps {
  threadId: string;
  senderType: 'monitor' | 'complainant';
}

export const AnonymousChatTerminal: React.FC<AnonymousChatTerminalProps> = ({ 
  threadId, 
  senderType 
}) => {
  const sendAnonymousChatMessage = useStore(state => state.sendAnonymousChatMessage);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Set up real-time listener for this thread
  useEffect(() => {
    setLoading(true);
    setError(null);
    
    const q = query(
      collection(db, 'complaintMessages'),
      where('complaintId', '==', threadId),
      orderBy('createdAt', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
      setLoading(false);
      
      // Auto scroll
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (err) => {
      console.error("Chat terminal listener failed:", err);
      setError("Secure channel decryption failure. Thread has strict access policies.");
      setLoading(false);
    });

    return () => unsubscribe();
  }, [threadId]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    
    setSending(true);
    try {
      // Send roles: user / monitor
      await sendComplaintMessage(threadId, inputText.trim());
      setInputText('');
    } catch (err: any) {
      console.error(err);
      setError("Package packet transmission rejected.");
    } finally {
      setSending(false);
    }
  };

  return (
    <div 
      className="bg-black border border-emerald-500/20 rounded-2xl p-4 flex flex-col h-[400px] shadow-[0_0_30px_rgba(16,185,129,0.05)] relative overflow-hidden font-mono"
      style={{
        backgroundImage: 'radial-gradient(circle at bottom, rgba(16, 185, 129, 0.05), transparent)'
      }}
      id={`chat-terminal-${threadId}`}
    >
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%)] bg-[size:100%_4px]" />
      
      {/* Terminal Title Header */}
      <div className="flex items-center justify-between border-b border-emerald-950 pb-3 mb-4 shrink-0">
        <div className="flex items-center gap-2">
          <Terminal size={14} className="text-emerald-500 animate-pulse" />
          <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-400">
            Anonymous Line Established
          </span>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-500/10">
          <Lock size={10} className="text-emerald-500" />
          <span className="text-[8px] uppercase tracking-wider text-emerald-500">
            Identity Protected
          </span>
        </div>
      </div>

      {/* Cyberpunk Alerts Line */}
      <div className="bg-emerald-950/10 border border-emerald-950/40 rounded-lg p-2 mb-3 shrink-0 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu size={12} className="text-emerald-500" />
          <span className="text-[8px] text-emerald-600 uppercase tracking-wider">
            Secure Complaint Channel
          </span>
        </div>
        <span className="text-[8px] font-bold text-emerald-500 bg-emerald-950/40 px-1.5 py-0.5 rounded animate-pulse">
          ● ONLINE_SECURE
        </span>
      </div>

      {/* Message Output Thread */}
      <div className="flex-1 overflow-y-auto space-y-3.5 pr-1.5 custom-scrollbar text-xs">
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-2 py-10">
            <Loader2 className="animate-spin text-emerald-500" size={20} />
            <span className="text-[9px] text-emerald-600 uppercase tracking-widest animate-pulse">Decrypting secure ledger...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-xl text-red-500 text-center space-y-2 my-10">
            <ShieldAlert size={18} className="mx-auto" />
            <p className="text-[10px] uppercase font-bold tracking-wider">{error}</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-2 opacity-50 my-10">
            <HelpCircle size={20} className="text-emerald-600" />
            <p className="text-[10px] text-emerald-600 uppercase tracking-wider font-bold">ledger packet empty</p>
            <p className="text-[9px] text-neutral-500 italic max-w-xs uppercase">No secure transmissions recorded on this line yet.</p>
          </div>
        ) : (
          messages.map((msg, idx) => {
            const isMe = msg.senderType === senderType;
            return (
              <motion.div
                key={msg.id || idx}
                initial={{ opacity: 0, x: isMe ? 5 : -5 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                {/*Sender Header*/}
                <span className={`text-[8px] uppercase tracking-wider mb-1 font-bold ${
                  isMe ? 'text-emerald-500' : 'text-neutral-500'
                }`}>
                  {isMe ? '• YOU' : '• SECURE OPERATOR'}
                </span>

                {/*Message Bubbles*/}
                <div 
                  className={`max-w-[85%] rounded-xl px-4 py-2.5 leading-normal relative select-text border font-sans text-xs ${
                    isMe
                      ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-200'
                      : 'bg-neutral-900 border-neutral-850 text-neutral-300'
                  }`}
                >
                  <p className="whitespace-pre-wrap select-text">{msg.message}</p>
                </div>
                
                {/* Timestamp */}
                <span className="text-[7px] text-neutral-600 scale-90 mt-1 uppercase">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              </motion.div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Bar */}
      <form onSubmit={handleSend} className="mt-3 pt-3 border-t border-emerald-950/50 shrink-0 flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Transmit secure message packets..."
          disabled={loading || !!error}
          className="flex-1 bg-neutral-950/95 border border-emerald-950 text-xs text-emerald-400 placeholder-emerald-950 focus:placeholder-emerald-800 rounded-xl px-4 py-3 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
        />
        <button
          type="submit"
          disabled={loading || sending || !inputText.trim() || !!error}
          className={`px-4 rounded-xl flex items-center justify-center border transition-all ${
            !inputText.trim() || !!error || loading
              ? 'bg-neutral-950 border-neutral-850 text-neutral-600 cursor-not-allowed'
              : 'bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-400 border-emerald-500/30 hover:border-emerald-500/60 cursor-pointer animate-pulse'
          }`}
          id={`send-btn-${threadId}`}
        >
          {sending ? (
            <Loader2 size={14} className="animate-spin text-emerald-500" />
          ) : (
            <Send size={14} />
          )}
        </button>
      </form>
    </div>
  );
};
