import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  Send, Sparkles, MessageCircle, Bot, User as UserIcon, 
  Trash2, RotateCcw, AlertCircle, ShieldAlert, Cpu, 
  ChevronDown, Search, Zap, Globe, Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  serverTimestamp, deleteDoc, getDocs 
} from 'firebase/firestore';
import { db } from '../firebase';
import { askChatterbox } from '../lib/chatterboxAI';

interface ChatMessage {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: any;
}

type ResponseMode = 'Normal' | 'Deep Research' | 'Quick Summary' | 'Political Analysis' | 'Educational';

export default function Chatterbox() {
  const { 
    currentUser, users, transactions, allWarnings,
    votes, monitoringPillars, currentLeaderboard, bills,
    announcements
  } = useStore();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [responseMode, setResponseMode] = useState<ResponseMode>('Normal');
  const [showModeDropdown, setShowModeDropdown] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chatterbox_threads', currentUser.id, 'messages'),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ChatMessage[];
      setMessages(msgs);
    }, (err) => {
      console.error("Chatterbox Sync Error:", err);
      setErrorStatus("CONNECTION ERROR: Intelligence uplink offline.");
    });

    return () => unsub();
  }, [currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const sanitizeContextData = () => {
    // STRICT DATA FILTER: ONLY ALLOW PUBLIC/SUMMARIZED DATA
    const safeContext = {
      timestamp: new Date().toISOString(),
      platform_metrics: {
        total_participants: users.length,
        governance_active_votes: votes.filter(v => v.status === 'active').length,
        economic_bills: bills.filter(b => b.status === 'active').length,
      },
      leaderboard: currentLeaderboard ? {
        top_contributor: currentLeaderboard.communityCarer?.username,
        honored_sender: currentLeaderboard.bestSender?.username,
      } : 'Updating...',
      representatives: users.filter(u => u.role === 'monitor' || u.role === 'admin').slice(0, 10).map(u => ({
        username: u.username,
        role: u.role,
        integrity: u.integrityScore,
        warnings: u.warningCount
      })),
      recent_announcements: announcements.slice(0, 3).map(a => a.title),
      governance_pillars: monitoringPillars.slice(0, 5).map(p => ({
        topic: p.title,
        verdict: p.verdict?.substring(0, 50) + '...'
      })),
      warnings_overview: {
        total_issued: allWarnings.length,
        critical_incidents: allWarnings.filter(w => (w.level || 0) >= 3).length
      }
    };

    return JSON.stringify(safeContext);
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userText = input.trim();
    if (!userText || isLoading || !currentUser) return;

    setInput('');
    setIsLoading(true);
    setErrorStatus(null);

    // Optimistic Update for instant feedback
    const optimisticUserId = 'optimistic-' + Date.now();
    const optimisticUserMsg: ChatMessage = {
      id: optimisticUserId,
      role: 'user',
      content: userText,
      timestamp: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 }
    };
    setMessages(prev => [...prev, optimisticUserMsg]);

    // Persist user message to Firestore
    try {
      await addDoc(collection(db, 'chatterbox_threads', currentUser.id, 'messages'), {
        role: 'user',
        content: userText,
        timestamp: serverTimestamp()
      });
    } catch (err) {
      console.error("Backlog Sync Failure:", err);
    }

    try {
      const aiResponse = await askChatterbox({
        messages: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
        context: sanitizeContextData(),
        userText: userText,
        deepResearch: responseMode === 'Deep Research',
        responseMode: responseMode
      });

      // Persist AI response
      await addDoc(collection(db, 'chatterbox_threads', currentUser.id, 'messages'), {
        role: 'assistant',
        content: aiResponse,
        timestamp: serverTimestamp()
      });
    } catch (error: any) {
      console.error("Chatterbox Critical Failure:", error);
      setErrorStatus(error.message || "Target uplink failed to acknowledge transmission.");
      
      // Remove optimistic message on permanent failure if needed, 
      // but usually better to leave it and show error
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!currentUser || !confirm("PURGE LOGS? This action will permanently erase your transmission history.")) return;
    try {
      const q = query(collection(db, 'chatterbox_threads', currentUser.id, 'messages'));
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
    } catch (error) {
      console.error("Purge Error:", error);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
      {/* Header Pipeline */}
      <div className="px-6 py-4 bg-neutral-900/50 border-b border-neutral-800 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-500">
            <Cpu size={20} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-black uppercase tracking-widest text-neutral-200">Chatterbox Uplink</h2>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-green-500/70 uppercase tracking-tighter">Active Node: Gemini 2.0 Flash</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-[10px] font-black uppercase tracking-widest text-neutral-400 hover:text-amber-500 transition-colors flex items-center gap-2"
            >
              {responseMode} <ChevronDown size={12} />
            </button>
            <AnimatePresence>
              {showModeDropdown && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute top-full right-0 mt-2 w-48 bg-neutral-900 border border-neutral-800 rounded-2xl p-2 z-50 shadow-2xl"
                >
                  {(['Normal', 'Deep Research', 'Quick Summary', 'Political Analysis', 'Educational'] as ResponseMode[]).map(mode => (
                    <button
                      key={mode}
                      onClick={() => { setResponseMode(mode); setShowModeDropdown(false); }}
                      className={`w-full text-left px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-colors ${
                        responseMode === mode ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button 
            onClick={clearHistory}
            className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
            title="Purge Archives"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {/* Transmission Feed */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-[radial-gradient(circle_at_50%_0%,rgba(245,158,11,0.03),transparent)]"
      >
        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-4">
            <div className="w-16 h-16 bg-neutral-900 rounded-3xl border border-neutral-800 flex items-center justify-center text-neutral-700">
               <Bot size={32} />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-black text-neutral-400 uppercase tracking-widest">Synthesizing Hub Ready</p>
              <p className="text-[10px] text-neutral-600 font-bold italic">Query the platform metrics or global knowledge bank.</p>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full pt-4">
               {["Debt Trends?", "Who is top representative?", "Market Analysis", "Climate Policy"].map(q => (
                 <button 
                   key={q}
                   onClick={() => { setInput(q); handleSendMessage(); }}
                   className="p-2 border border-neutral-800 rounded-xl text-[9px] text-neutral-500 hover:border-amber-500/30 hover:text-amber-500 transition-all font-black uppercase tracking-tighter"
                 >
                   {q}
                 </button>
               ))}
            </div>
          </div>
        )}

        <AnimatePresence mode="popLayout">
          {messages.map((msg, idx) => (
            <motion.div
              key={msg.id || idx}
              initial={{ opacity: 0, x: msg.role === 'user' ? 20 : -20 }}
              animate={{ opacity: 1, x: 0 }}
              className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${
                msg.role === 'user' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}>
                {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
              </div>

              <div className={`max-w-[85%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block px-5 py-3 rounded-2xl text-sm ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/10 text-neutral-200 border border-blue-500/20 rounded-tr-none' 
                    : 'bg-neutral-900 border border-neutral-800 text-neutral-300 rounded-tl-none'
                }`}>
                  <div className="markdown-body prose prose-invert prose-sm max-w-none">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                  </div>
                </div>
                <div className="mt-1 flex items-center gap-2 px-1">
                  <span className="text-[8px] font-black uppercase text-neutral-600 tracking-widest italic">
                    {msg.role === 'user' ? 'Local User' : 'Intelligence Engine'}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
            className="flex items-start gap-4"
          >
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
               <Zap size={14} className="animate-spin-slow" />
            </div>
            <div className="px-5 py-3 bg-neutral-900 border border-neutral-800 rounded-2xl rounded-tl-none flex items-center gap-3">
              <div className="flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-neutral-500">Chatterbox is analyzing data...</span>
            </div>
          </motion.div>
        )}

        {errorStatus && (
          <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-2xl flex items-center gap-3 max-w-md mx-auto">
             <AlertCircle size={18} className="text-red-500 flex-shrink-0" />
             <p className="text-[10px] font-bold text-red-400 uppercase tracking-widest leading-relaxed">{errorStatus}</p>
             <button 
               onClick={handleSendMessage}
               className="p-2 bg-red-500 text-black rounded-lg hover:bg-red-400 transition-colors ml-auto"
               title="Retry"
             >
                <RotateCcw size={14} />
             </button>
          </div>
        )}
      </div>

      {/* Input Pipeline */}
      <div className="p-6 bg-neutral-900/30 border-t border-neutral-800">
        <form onSubmit={handleSendMessage} className="relative">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-neutral-600" size={18} />
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Query technical intelligence..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-14 pr-16 py-4 text-sm text-neutral-200 placeholder:text-neutral-700 focus:border-amber-500/50 outline-none transition-all shadow-inner font-medium italic"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-30 text-black p-2.5 rounded-xl transition-all shadow-lg shadow-amber-950/20 active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </form>
        
        <div className="mt-4 flex items-center justify-between px-2">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Globe size={10} className="text-neutral-500" />
              <span className="text-[8px] font-black uppercase text-neutral-600 tracking-widest">Global Ops enabled</span>
            </div>
            <div className="flex items-center gap-2 text-neutral-600">
              <Scale size={10} />
              <span className="text-[8px] font-black uppercase tracking-widest">Neutral Arbitration logic</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5 grayscale opacity-50">
             <div className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
             <span className="text-[8px] font-black uppercase text-neutral-600 tracking-widest leading-none">Security Filter: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}
