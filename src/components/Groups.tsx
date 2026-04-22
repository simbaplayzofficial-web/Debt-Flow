import React, { useState, useEffect } from 'react';
import { useStore, GroupId, Bill, BillComment, BillStaffComment } from '../store';
import { 
  Shield, MessageSquare, Scale, Box, Send, 
  Eye, Archive, MessageCircle, Info, BookOpen,
  Plus, Edit2, User, Lock
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export default function Groups() {
  const { 
    currentUser, groupPosts, postToGroup, 
    resolvingDeck, justiceNexus, postVerdict, 
    createResolvingCase, complaints, 
    addComplaint, reviewComplaint, users,
    bills, createBill, updateBill, postBillComment, postBillStaffComment
  } = useStore();

  const [activeGroup, setActiveGroup] = useState<GroupId | 'monitoring'>('studying');
  const [postInput, setPostInput] = useState('');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [billComments, setBillComments] = useState<BillComment[]>([]);
  const [billStaffComments, setBillStaffComments] = useState<BillStaffComment[]>([]);

  // Bill Creation/Editing state
  const [isCreatingBill, setIsCreatingBill] = useState(false);
  const [billTitle, setBillTitle] = useState('');
  const [billDesc, setBillDesc] = useState('');
  
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [verdictInput, setVerdictInput] = useState('');
  const [actionInput, setActionInput] = useState('');

  const selectedBill = bills.find(b => b.id === selectedBillId);
  const selectedCase = resolvingDeck.find(c => c.id === selectedCaseId);

  useEffect(() => {
    if (!selectedBillId) {
      setBillComments([]);
      setBillStaffComments([]);
      return;
    }

    const unsubPublic = onSnapshot(
      query(collection(db, 'bills', selectedBillId, 'comments'), orderBy('timestamp', 'asc')),
      (snap) => setBillComments(snap.docs.map(d => d.data() as BillComment))
    );

    const unsubStaff = onSnapshot(
      query(collection(db, 'bills', selectedBillId, 'staffComments'), orderBy('timestamp', 'asc')),
      (snap) => setBillStaffComments(snap.docs.map(d => d.data() as BillStaffComment)),
      (err) => console.warn("Staff Comments Access Denied:", err.message)
    );

    return () => {
      unsubPublic();
      unsubStaff();
    };
  }, [selectedBillId]);

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postInput.trim()) return;
    await postToGroup(activeGroup, postInput);
    setPostInput('');
  };

  return (
    <div className="space-y-10">
      {/* Group Navigation Bar - To select purpose */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit">
        {[
          { id: 'studying', label: 'Studying Together', icon: BookOpen },
          { id: 'chatting', label: 'Chatting Together', icon: MessageCircle },
          { id: 'monitoring', label: 'Monitor Deck', icon: Shield },
        ].map(g => (
          <button
            key={g.id}
            onClick={() => setActiveGroup(g.id as any)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeGroup === g.id 
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                : 'text-neutral-500 hover:text-neutral-300'
            }`}
          >
            <g.icon size={16} />
            {g.label}
          </button>
        ))}
      </div>

      {/* Main Group Content Area */}
      <div className="grid lg:grid-cols-[1fr_400px] gap-8">
        {/* Active Communication Stream */}
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl flex flex-col h-[700px] overflow-hidden">
          {activeGroup === 'monitoring' ? (
            <div className="flex flex-col h-full bg-neutral-950/20">
              {/* Bills Header */}
              <div className="p-6 border-b border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic">
                     <Shield size={16} className="text-blue-500" />
                     Monitor Deck
                   </h3>
                   <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Legislative & Policy Discussion</p>
                </div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') && (
                  <button 
                    onClick={() => {
                      setIsCreatingBill(true);
                      setBillTitle('');
                      setBillDesc('');
                      setSelectedBillId(null);
                    }}
                    className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 text-xs font-bold transition-all"
                  >
                    <Plus size={14} /> New Bill
                  </button>
                )}
              </div>

              {/* Monitor Deck Content */}
              <div className="flex-1 overflow-hidden grid grid-cols-[300px_1fr]">
                {/* Bills List Sidebar */}
                <div className="border-r border-neutral-800 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-neutral-950/40">
                  <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 px-2">Active Bills</p>
                  {bills.map(bill => (
                    <button
                      key={bill.id}
                      onClick={() => {
                        setSelectedBillId(bill.id);
                        setIsCreatingBill(false);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedBillId === bill.id 
                          ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' 
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <h4 className="text-xs font-bold text-neutral-200 truncate">{bill.title}</h4>
                      <p className="text-[10px] text-neutral-500 mt-1 truncate">{bill.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-[8px] font-mono text-neutral-600 uppercase">
                          {new Date(bill.timestamp).toLocaleDateString()}
                        </span>
                        {bill.lastEditedBy && <Edit2 size={10} className="text-blue-500/50" />}
                      </div>
                    </button>
                  ))}
                  {bills.length === 0 && !isCreatingBill && (
                    <div className="text-center py-10 opacity-50 px-4">
                      <Shield size={24} className="mx-auto mb-2 text-neutral-700" />
                      <p className="text-[10px] font-bold text-neutral-600 italic">No bills drafted yet.</p>
                    </div>
                  )}
                </div>

                {/* Discussion Area */}
                <div className="flex flex-col overflow-hidden bg-neutral-900/20">
                  {isCreatingBill ? (
                    <div className="p-8 space-y-6 max-w-2xl mx-auto w-full">
                       <h2 className="text-lg font-black italic text-blue-500 uppercase tracking-tight">Draft New Lex Bill</h2>
                       <div className="space-y-4">
                          <div>
                            <label className="text-[10px] font-black text-neutral-500 uppercase mb-2 block">Bill Title</label>
                            <input 
                              value={billTitle}
                              onChange={e => setBillTitle(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all"
                              placeholder="e.g. Bill #405: The Transparency Act"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-black text-neutral-500 uppercase mb-2 block">Description & Payload</label>
                            <textarea 
                              value={billDesc}
                              onChange={e => setBillDesc(e.target.value)}
                              className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:border-blue-500 outline-none transition-all h-48"
                              placeholder="Describe the proposed changes or rules..."
                            />
                          </div>
                          <div className="flex gap-4 pt-4">
                            <button 
                              onClick={async () => {
                                try {
                                  if (selectedBillId) {
                                    await updateBill(selectedBillId, billTitle, billDesc);
                                    alert("BILL UPDATED: Policy changes synchronized.");
                                  } else {
                                    await createBill(billTitle, billDesc);
                                    alert("BILL PUBLISHED: Monitor Deck updated.");
                                  }
                                  setIsCreatingBill(false);
                                  setSelectedBillId(null);
                                } catch (error: any) {
                                  alert(`SYNC FAILURE: ${error.message}`);
                                }
                              }}
                              className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg"
                            >
                              {selectedBillId ? 'Update Proposal' : 'Publish to Deck'}
                            </button>
                            <button 
                              onClick={() => setIsCreatingBill(false)}
                              className="px-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 font-bold rounded-xl transition-all"
                            >
                              Abort
                            </button>
                          </div>
                       </div>
                    </div>
                  ) : selectedBill ? (
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Bill Meta */}
                      <div className="p-6 bg-neutral-950/40 border-b border-neutral-800">
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex-1">
                             <h2 className="text-xl font-black italic text-white leading-tight">{selectedBill.title}</h2>
                             {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') && (
                               <button 
                                 onClick={() => {
                                   setBillTitle(selectedBill.title);
                                   setBillDesc(selectedBill.description);
                                   setIsCreatingBill(true);
                                 }}
                                 className="mt-2 text-[10px] font-black uppercase text-blue-500 hover:text-blue-400 flex items-center gap-1"
                               >
                                 <Edit2 size={10} /> Edit Proposal
                               </button>
                             )}
                           </div>
                           <div className="flex flex-col items-end gap-1">
                              <span className="text-[10px] font-mono text-blue-500 bg-blue-500/10 px-2 py-1 rounded-md">STATUS: ACTIVE DISCUSSION</span>
                              <span className="text-[8px] text-neutral-600 font-mono italic">PUBLISHED: {new Date(selectedBill.timestamp).toLocaleString()}</span>
                           </div>
                        </div>
                        <p className="text-sm text-neutral-400 leading-relaxed max-w-4xl">{selectedBill.description}</p>
                      </div>

                      {/* Dual Comment Columns */}
                      <div className="flex-1 overflow-hidden grid grid-cols-2 gap-px bg-neutral-800">
                        {/* Public Discussion */}
                        <div className="bg-neutral-900 flex flex-col overflow-hidden">
                           <div className="p-4 border-b border-neutral-800 bg-neutral-950/50 flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-400 flex items-center gap-2">
                                <MessageSquare size={12} /> Public Forum
                              </h4>
                              <span className="text-[8px] text-neutral-600">ALL PARTICIPANTS</span>
                           </div>
                           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                              {billComments.map((comment, i) => {
                                const author = users.find(u => u.id === comment.userId);
                                return (
                                  <div key={comment.id} className="group">
                                    <div className="flex items-center gap-2 mb-1">
                                      <span className="text-[10px] font-black text-neutral-300 uppercase italic">@{author?.username || 'unknown'}</span>
                                      <span className="text-[8px] text-neutral-600">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="bg-neutral-950 border border-neutral-800 p-3 rounded-2xl rounded-tl-none group-hover:border-neutral-700 transition-all">
                                      <p className="text-xs text-neutral-400">{comment.message}</p>
                                    </div>
                                  </div>
                                );
                              })}
                              {billComments.length === 0 && <div className="text-center py-20 opacity-30 italic text-xs">No public feedback yet.</div>}
                           </div>
                           <form 
                             onSubmit={async (e) => {
                               e.preventDefault();
                               const val = (e.currentTarget.elements.namedItem('msg') as HTMLInputElement).value;
                               if (val.trim()) {
                                 await postBillComment(selectedBillId, val);
                                 (e.currentTarget.elements.namedItem('msg') as HTMLInputElement).value = '';
                               }
                             }}
                             className="p-3 border-t border-neutral-800 bg-neutral-950/30 flex gap-2"
                           >
                              <input name="msg" placeholder="Voice your opinion..." className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 text-xs outline-none focus:border-neutral-600 transition-all" />
                              <button className="p-2 bg-neutral-800 rounded-xl hover:bg-neutral-700 transition-all"><Send size={14} /></button>
                           </form>
                        </div>

                        {/* Staff Discussion (restricted) */}
                        <div className="bg-neutral-950/50 flex flex-col overflow-hidden relative">
                           <div className="p-4 border-b border-neutral-800 bg-blue-900/10 flex items-center justify-between">
                              <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 flex items-center gap-2 italic">
                                <Lock size={12} /> Staff Secure Line
                              </h4>
                              <span className="text-[8px] text-blue-900 font-bold uppercase">Restricted Access</span>
                           </div>
                           {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') ? (
                             <>
                               <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                                  {billStaffComments.map((comment, i) => {
                                    const author = users.find(u => u.id === comment.userId);
                                    return (
                                      <div key={comment.id} className="group">
                                        <div className="flex items-center gap-2 mb-1 justify-end">
                                          <span className="text-[8px] text-blue-900 font-bold uppercase">{comment.role}</span>
                                          <span className="text-[10px] font-black text-blue-500 uppercase italic">@{author?.username || 'unknown'}</span>
                                          <span className="text-[8px] text-neutral-600">{new Date(comment.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                        </div>
                                        <div className="bg-blue-600/5 border border-blue-500/20 p-3 rounded-2xl rounded-tr-none group-hover:border-blue-500/30 transition-all ml-auto max-w-[90%]">
                                          <p className="text-xs text-neutral-300">{comment.message}</p>
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {billStaffComments.length === 0 && <div className="text-center py-20 opacity-30 italic text-xs text-blue-500">Secure staff discussion empty.</div>}
                               </div>
                               <form 
                                 onSubmit={async (e) => {
                                   e.preventDefault();
                                   const val = (e.currentTarget.elements.namedItem('msg') as HTMLInputElement).value;
                                   if (val.trim()) {
                                     await postBillStaffComment(selectedBillId, val);
                                     (e.currentTarget.elements.namedItem('msg') as HTMLInputElement).value = '';
                                   }
                                 }}
                                 className="p-3 border-t border-neutral-800 bg-blue-900/10 flex gap-2"
                               >
                                  <input name="msg" placeholder="Staff directive/input..." className="flex-1 bg-neutral-900/50 border border-blue-900/30 rounded-xl px-4 py-2 text-xs outline-none focus:border-blue-500 transition-all text-blue-100 placeholder:text-blue-900/50" />
                                  <button className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-600/20"><Send size={14} /></button>
                               </form>
                             </>
                           ) : (
                             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-950/20 backdrop-blur-sm">
                                <Lock size={32} className="text-neutral-800 mb-4" />
                                <h5 className="text-[10px] font-black uppercase text-neutral-600 tracking-[0.2em] mb-2">Encrypted Channel</h5>
                                <p className="text-[10px] text-neutral-700 italic max-w-[200px]">This frequency is reserved for official Staff directives only.</p>
                             </div>
                           )}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-neutral-700 space-y-4 px-10 text-center">
                       <Shield size={48} className="opacity-20 translate-y-2" />
                       <div>
                          <p className="text-sm font-black uppercase tracking-[0.3em] italic mb-1">Select a File</p>
                          <p className="text-xs italic opacity-50">Choose a bill from the left deck to view discussions.</p>
                       </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/30">
                <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic">
                  {activeGroup === 'studying' ? <BookOpen size={16} className="text-blue-500" /> : <MessageCircle size={16} className="text-green-500" />}
                  {activeGroup.replace('_', ' ')}
                </h3>
                <span className="text-[10px] font-bold text-neutral-500">{activeGroup === 'studying' ? 'REQUESTS & OFFERS' : 'GOSSIP & FREE CHAT'}</span>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {groupPosts[activeGroup as GroupId]?.map((post, i) => {
                  const author = users.find(u => u.id === post.authorId);
                  const isOwn = post.authorId === currentUser?.id;
                  return (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={post.id} 
                      className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`max-w-[80%] rounded-2xl p-4 ${
                        isOwn ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-neutral-800 text-neutral-200 rounded-tl-none'
                      }`}>
                        <p className="text-sm">{post.content}</p>
                      </div>
                      <div className="mt-1 flex items-center gap-2 px-1">
                        <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-widest">{author?.username || 'System'}</span>
                        <span className="text-[8px] text-neutral-600">{new Date(post.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </motion.div>
                  );
                })}
                {groupPosts[activeGroup as GroupId]?.length === 0 && (
                  <div className="h-full flex items-center justify-center text-neutral-600 text-sm italic">
                      No transmissions in this channel yet.
                  </div>
                )}
              </div>

              <form onSubmit={handlePost} className="p-4 border-t border-neutral-800 bg-neutral-950/30 flex gap-2">
                <input 
                  type="text" 
                  value={postInput}
                  onChange={(e) => setPostInput(e.target.value)}
                  placeholder={`Post to ${activeGroup.replace('_', ' ')}...`}
                  className="flex-1 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2.5 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-all"
                />
                <button type="submit" className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl transition-all shadow-lg shadow-blue-500/10">
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </section>

        {/* Sidebar Mini-Feeds / Fixed Columns Section */}
        <aside className="space-y-8">
           {/* Monitor's Pillar */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800 bg-blue-600/5 flex items-center gap-2">
                 <Shield size={16} className="text-blue-500" />
                 <h3 className="text-xs font-black uppercase tracking-widest italic">Monitoring Pillars</h3>
              </div>
              <div className="p-5 space-y-4">
                 <div className="space-y-2">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter italic">Verdict Board</p>
                    {justiceNexus.length > 0 ? (
                      justiceNexus.slice(0, 2).map(v => (
                        <div key={v.id} className="p-3 bg-neutral-950 border border-neutral-800 rounded-xl">
                           <p className="text-xs text-neutral-300 font-bold mb-1 italic">"{v.verdict}"</p>
                           <p className="text-[10px] text-blue-500 font-mono">ACTION: {v.actionTaken}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-[10px] text-neutral-600 italic">No verdicts issued.</p>
                    )}
                 </div>
                 <div className="pt-4 border-t border-neutral-800">
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-tighter italic">New Rules</p>
                    <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">Rule #1: Debts must be settled within biological timelines.</p>
                 </div>
              </div>
           </div>

           {/* Resolving Issues Column */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800 bg-orange-600/5 flex items-center gap-2">
                 <Scale size={16} className="text-orange-500" />
                 <h3 className="text-xs font-black uppercase tracking-widest italic">Resolving Deck</h3>
              </div>
              <div className="p-5 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                {resolvingDeck.filter(c => c.status === 'under_investigation').map(c => (
                   <button 
                     key={c.id} 
                     onClick={() => setSelectedCaseId(c.id)}
                     className={`w-full text-left p-4 rounded-xl relative overflow-hidden transition-all border ${
                       selectedCaseId === c.id 
                         ? 'bg-orange-500/10 border-orange-500/50' 
                         : 'bg-orange-500/5 border-orange-500/10 hover:border-orange-500/30'
                     }`}
                   >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 -mr-6 -mt-6 rotate-45" />
                      <p className="text-xs text-orange-200 leading-relaxed italic truncate">{c.description}</p>
                      <span className="text-[9px] font-bold text-orange-500/80 uppercase tracking-widest block mt-2">Status: Under Investigation</span>
                   </button>
                ))}
                {resolvingDeck.filter(c => c.status === 'under_investigation').length === 0 && (
                   <p className="text-xs text-neutral-600 text-center italic py-4">Equilibrium maintained.</p>
                )}
               </div>
           </div>

           {/* Complaint Box */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800 bg-red-600/5 flex items-center gap-2">
                 <Box size={16} className="text-red-500" />
                 <h3 className="text-xs font-black uppercase tracking-widest italic">Black Box (Anonymous)</h3>
              </div>
              <div className="p-5">
                 <p className="text-[10px] text-neutral-500 mb-4 leading-relaxed">Direct line to High Admin and Monitors. Subject to absolute secrecy.</p>
                 <textarea 
                   placeholder="Submit encrypted complaint..."
                   className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 focus:outline-none focus:border-red-500/50 h-24 mb-3 transition-all"
                   onKeyPress={(e) => {
                     if (e.key === 'Enter' && !e.shiftKey) {
                       e.preventDefault();
                       const val = e.currentTarget.value;
                       if (val) {
                          addComplaint(val);
                          e.currentTarget.value = '';
                          alert("Complaint filed anonymously.");
                       }
                     }
                   }}
                 />
                 <div className="flex items-center justify-between text-[9px] text-neutral-600 font-bold uppercase">
                    <span>Monitored encrypted</span>
                    <Shield size={10} />
                 </div>
              </div>
           </div>
        </aside>
      </div>

      {/* Global View (Bottom Section) */}
      <div className="grid lg:grid-cols-2 gap-6 pt-10 border-t border-neutral-800">
          {/* Column 1: Justice Nexus Feed */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-4 flex items-center gap-2 italic">
                <Scale size={12} /> Justice Nexus
             </h4>
             <div className="grid sm:grid-cols-2 gap-3">
                {justiceNexus.slice(0, 4).map(v => (
                  <div key={v.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-start gap-2 group">
                     <Shield size={10} className="text-blue-500 mt-1 flex-shrink-0" />
                     <div>
                        <p className="text-[11px] font-bold text-neutral-100 italic mb-0.5">"{v.verdict}"</p>
                        <p className="text-[9px] text-neutral-500 leading-relaxed font-mono uppercase tracking-tighter shadow-sm">{v.actionTaken}</p>
                     </div>
                  </div>
                ))}
                {justiceNexus.length === 0 && (
                  <p className="text-[10px] text-neutral-600 italic">Judicial peace prevails.</p>
                )}
             </div>
          </div>

          {/* Column 2: Internal Affairs (Complaint Box for Staff) */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-3xl">
             <h4 className="text-[10px] font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2 italic">
               <Box size={12} /> Internal Affairs
             </h4>
             <div className="space-y-4">
                <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-2xl border border-neutral-800">
                   <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-neutral-300 uppercase">Active Internal Inquiries</span>
                   </div>
                   <span className="text-xl font-black italic text-red-500">{complaints.filter(c => c.reviewedBy.length === 0).length}</span>
                </div>
                {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') ? (
                  <div className="pt-2">
                    <p className="text-[10px] text-neutral-600 italic mb-3">Staff verification required for review:</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar pr-2">
                       {complaints.filter(c => !c.reviewedBy.includes(currentUser.id)).map(c => (
                         <div key={c.id} className="p-4 bg-red-950/5 border border-red-950/20 rounded-2xl group relative hover:bg-red-950/10 transition-all">
                            <p className="text-[10px] text-neutral-300 leading-relaxed italic pr-8">"{c.content}"</p>
                            <button 
                              onClick={() => reviewComplaint(c.id)}
                              className="absolute top-4 right-4 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-950 border border-neutral-800 rounded-lg text-green-500 hover:text-green-400"
                            >
                               <Eye size={12} />
                            </button>
                         </div>
                       ))}
                       {complaints.filter(c => !c.reviewedBy.includes(currentUser.id)).length === 0 && (
                          <div className="text-center py-6 border border-dashed border-neutral-800 rounded-2xl opacity-50">
                             <p className="text-[10px] text-neutral-600 uppercase font-black tracking-widest italic font-mono">Queue Clear</p>
                          </div>
                       )}
                    </div>
                  </div>
                ) : (
                  <div className="p-6 border border-dashed border-neutral-800 rounded-2xl flex flex-col items-center justify-center text-center opacity-40">
                     <Lock size={24} className="text-neutral-700 mb-3" />
                     <p className="text-[9px] font-black uppercase text-neutral-600 tracking-widest">Inquiry Access Locked</p>
                     <p className="text-[9px] italic mt-1 leading-relaxed">Encrypted data strictly for Admin/Monitor review only.</p>
                  </div>
                )}
             </div>
          </div>
      </div>
      {/* Case Resolution Modal */}
      {selectedCaseId && selectedCase && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-2xl bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            <div className="p-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
                    <Scale size={24} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">Justice Nexus Protocol</h3>
                    <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest mt-1">Pending Resolution File</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedCaseId(null)}
                  className="p-2 text-neutral-500 hover:text-white"
                >
                  <Lock size={20} />
                </button>
              </div>

              <div className="p-6 bg-neutral-950 border border-neutral-800 rounded-3xl mb-8">
                 <p className="text-[10px] font-black text-orange-500 uppercase tracking-[0.2em] mb-3">Investigation Description:</p>
                 <p className="text-neutral-200 italic leading-relaxed text-sm">"{selectedCase.description}"</p>
                 <div className="mt-4 flex gap-2 flex-wrap">
                    {selectedCase.involvedUsers.map(u => (
                      <span key={u} className="text-[9px] font-black uppercase px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-neutral-500">@{u}</span>
                    ))}
                 </div>
              </div>

              {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') ? (
                <div className="space-y-6">
                   <div className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Final Verdict</label>
                        <textarea 
                          value={verdictInput}
                          onChange={(e) => setVerdictInput(e.target.value)}
                          placeholder="State the findings of the investigation..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl p-4 text-sm text-white focus:border-orange-500 outline-none transition-all h-24"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Action / Penalty</label>
                        <input 
                          type="text"
                          value={actionInput}
                          onChange={(e) => setActionInput(e.target.value)}
                          placeholder="e.g. Warning Level 2 Issued, Debt Forgiven..."
                          className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-sm text-white focus:border-orange-500 outline-none transition-all"
                        />
                      </div>
                   </div>

                   <div className="flex gap-4 pt-4">
                      <button 
                        onClick={() => {
                          setSelectedCaseId(null);
                          setVerdictInput('');
                          setActionInput('');
                        }}
                        className="flex-1 py-4 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                      >
                        Suspend
                      </button>
                      <button 
                         onClick={async () => {
                           try {
                             if (!verdictInput || !actionInput) {
                               alert("ADJUDICATION ERROR: Verdict and Action parameters required.");
                               return;
                             }
                             await postVerdict(selectedCaseId, verdictInput, actionInput);
                             setSelectedCaseId(null);
                             setVerdictInput('');
                             setActionInput('');
                             alert("CASE SEALED: Verdict published to Justice Nexus.");
                           } catch (error: any) {
                             alert("SYNC ERROR: " + error.message);
                           }
                         }}
                         className="flex-2 py-4 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-600/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3"
                      >
                        <Scale size={18} /> Seal & Log Verdict
                      </button>
                   </div>
                </div>
              ) : (
                <div className="text-center py-10 opacity-50 bg-neutral-950 rounded-3xl border border-neutral-800">
                   <Lock size={32} className="mx-auto mb-4 text-neutral-600" />
                   <p className="text-xs uppercase font-black tracking-widest text-neutral-600">Administrative Locked: View Only</p>
                   <button 
                     onClick={() => setSelectedCaseId(null)}
                     className="mt-6 px-10 py-3 bg-neutral-800 rounded-xl text-[10px] font-black uppercase text-neutral-400 hover:text-white transition-colors"
                   >
                     Close File
                   </button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
