import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { 
  Send, Sparkles, MessageCircle, Bot, User as UserIcon, 
  Trash2, RotateCcw, AlertTriangle, Cpu, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  collection, query, orderBy, onSnapshot, addDoc, 
  deleteDoc, getDocs, where 
} from 'firebase/firestore';
import { db } from '../firebase';
import { askChatterbox } from '../lib/chatterboxAI';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function Chatterbox() {
  const currentUser = useStore(state => state.currentUser);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Load chat history from Firestore
  useEffect(() => {
    if (!currentUser) return;

    const q = query(
      collection(db, 'chatHistory'),
      where('uid', '==', currentUser.id),
      orderBy('timestamp', 'asc')
    );

    const unsub = onSnapshot(q, (snapshot) => {
      const dbMsgs: ChatMessage[] = [];
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.message) {
          dbMsgs.push({
            id: doc.id + '-usr',
            role: 'user',
            content: data.message,
            timestamp: data.timestamp || new Date().toISOString()
          });
        }
        if (data.response) {
          dbMsgs.push({
            id: doc.id + '-ast',
            role: 'assistant',
            content: data.response,
            timestamp: data.timestamp || new Date().toISOString()
          });
        }
      });
      setMessages(dbMsgs);
    }, (err) => {
      console.error("ChatHistory load error:", err);
      setErrorStatus("Uplink sync error. Utilizing offline buffer state.");
    });

    return () => unsub();
  }, [currentUser]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const userText = input.trim();
    if (!userText || isLoading || !currentUser) return;

    setInput('');
    setIsLoading(true);
    setErrorStatus(null);

    // Form history context to pass to AI call
    const chatHistoryPayload = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    // Optimistically add the message to the local display before Firebase sync completes
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const aiResponse = await askChatterbox({
        messages: chatHistoryPayload.slice(-10), // Send last 10 messages for context
        userText: userText
      });

      // Save to chatHistory Firestore collection
      await addDoc(collection(db, 'chatHistory'), {
        uid: currentUser.id,
        message: userText,
        response: aiResponse,
        timestamp: new Date().toISOString()
      });

    } catch (err: any) {
      console.error("Chatterbox Send Error:", err);
      // Fallback instruction: "If AI fails: 'Chatterbox temporarily unavailable.' Never crash the app."
      setErrorStatus("Chatterbox temporarily unavailable.");
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!currentUser || !confirm("Erase all chat history? This is permanent.")) return;
    try {
      const q = query(
        collection(db, 'chatHistory'),
        where('uid', '==', currentUser.id)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      setMessages([]);
    } catch (error) {
      console.error("Error clearing logs:", error);
    }
  };

  return (
    <div 
      className="flex flex-col h-[calc(100vh-14rem)] bg-neutral-950 border border-neutral-800 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      id="chatterbox-chat-hub"
    >
      {/* Header Pipeline Panel */}
      <div className="px-6 py-4 bg-black/60 border-b border-neutral-800 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
            <Cpu size={18} className="animate-pulse" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-black uppercase tracking-widest text-neutral-200 flex items-center gap-2">
              <Terminal size={12} className="text-amber-500/80" />
              Chatterbox Interface
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[9px] font-bold text-neutral-400 font-mono uppercase tracking-widest">
                Nodes Stable / Secure Protocol
              </span>
            </div>
          </div>
        </div>

        <button 
          onClick={clearHistory}
          disabled={messages.length === 0}
          className="p-2 text-neutral-600 hover:text-red-400 disabled:opacity-30 disabled:hover:text-neutral-600 active:scale-95 transition-all"
          title="Clear Terminal Cache"
          id="btn-clear-chatterbox-cache"
        >
          <Trash2 size={16} />
        </button>
      </div>

      {/* Screen Feed - Scanlines & Visual gradients */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar bg-neutral-950/40 relative"
        style={{
          backgroundImage: 'radial-gradient(circle at 50% 10%, rgba(245, 158, 11, 0.02), transparent)'
        }}
      >
        {/* Subtle retro overlay scanline effect */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.015] bg-[linear-gradient(rgba(180,180,180,0.1)_1px,transparent_1px)] bg-[size:100%_4px]" />

        {messages.length === 0 && !isLoading && (
          <div className="h-full flex flex-col items-center justify-center text-center max-w-sm mx-auto space-y-5 py-12">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-3xl flex items-center justify-center text-neutral-600">
               <Bot size={28} />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-mono font-black text-neutral-300 uppercase tracking-widest">
                UPLINK READY
              </p>
              <p className="text-[11px] text-neutral-500 leading-relaxed font-sans max-w-xs">
                Welcome to DebtFlow assistance portal. Query history, science, system navigation directions, or get general knowledge.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full pt-4">
               {[
                 "How do I navigate my dashboard?",
                 "Explain the history of debt ledgers",
                 "How is integrity calculated?",
                 "Give me a science fact"
               ].map(q => (
                 <button 
                   key={q}
                   onClick={() => { setInput(q); }}
                   className="p-3 bg-neutral-950 confessions-btn border border-neutral-900 rounded-2xl text-[10px] text-neutral-400 hover:border-amber-600 hover:text-white transition-all text-left font-serif font-sans"
                 >
                   {q}
                 </button>
               ))}
            </div>
          </div>
        )}

        <div className="space-y-6">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex items-start gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  msg.role === 'user' 
                    ? 'bg-amber-600/10 border-amber-600/20 text-amber-500' 
                    : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                }`}>
                  {msg.role === 'user' ? <UserIcon size={14} /> : <Bot size={14} />}
                </div>

                <div className={`max-w-[80%] ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                  <div className={`inline-block px-4 py-3 rounded-2xl text-xs md:text-sm ${
                    msg.role === 'user' 
                      ? 'bg-amber-600/10 text-neutral-200 border border-amber-500/20 rounded-tr-none' 
                      : 'bg-neutral-900/60 border border-neutral-800 text-neutral-300 rounded-tl-none'
                  }`}>
                    <div className="markdown-body prose prose-invert prose-sm max-w-none text-left leading-relaxed font-sans font-light">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                    </div>
                  </div>
                  <div className="mt-1 flex items-center gap-1.5 px-1 justify-start">
                    <span className="text-[8px] font-mono font-bold uppercase text-neutral-600 tracking-wider">
                      {msg.role === 'user' ? 'GUEST_PAYLOAD' : 'SYSTEM_NODE'}
                    </span>
                    <span className="text-[7px] text-neutral-700">|</span>
                    <span className="text-[7px] font-mono text-neutral-600 uppercase">
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
                 <Sparkles size={13} className="animate-spin" />
              </div>
              <div className="px-4 py-3 bg-neutral-910 border border-neutral-800 rounded-2xl rounded-tl-none flex items-center gap-3">
                <div className="flex gap-1.5">
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                </div>
                <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-neutral-400">
                  Chatterbox resolving...
                </span>
              </div>
            </motion.div>
          )}

          {errorStatus && (
            <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-2xl flex items-center gap-3 max-w-md mx-auto">
               <AlertTriangle size={16} className="text-red-500 flex-shrink-0 animate-bounce" />
               <p className="text-[10px] font-mono font-bold text-red-400 uppercase tracking-widest leading-relaxed">
                 {errorStatus}
               </p>
               <button 
                 onClick={handleSendMessage}
                 className="p-1.5 bg-red-900/40 hover:bg-red-900 text-red-200 border border-red-700/50 rounded-lg transition-colors ml-auto flex items-center gap-1 font-mono text-[8px] uppercase tracking-wider font-bold"
                 id="btn-retry-chatterbox"
               >
                  <RotateCcw size={10} />
                  Retry
               </button>
            </div>
          )}
        </div>
      </div>

      {/* Input Tray */}
      <div className="p-5 bg-black/40 border-t border-neutral-800">
        <form onSubmit={handleSendMessage} className="relative">
          <input 
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={isLoading}
            placeholder="Ask a question or type a message..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl pl-5 pr-14 py-3.5 text-xs text-neutral-200 placeholder:text-neutral-700 hover:border-neutral-700 focus:border-amber-500/50 outline-none transition-all font-mono shadow-inner"
            id="chatterbox-user-text-input"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <button 
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-amber-600 hover:bg-amber-500 disabled:opacity-20 disabled:hover:bg-amber-600 text-black p-2 rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] active:scale-95"
              id="chatterbox-send-button"
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
