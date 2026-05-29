import React, { useState, useEffect } from 'react';
import { useStore, GroupId, Bill, BillComment, BillStaffComment } from '../store';
import { 
  Shield, MessageSquare, Scale, Box, Send, 
  Eye, Archive, MessageCircle, Info, BookOpen,
  Plus, Edit2, User, Lock, EyeOff
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { BlackBox } from './BlackBox';
import { ChatterPanel } from './ChatterPanel';

export default function Groups() {
  const { 
    currentUser, groupPosts, postToGroup, 
    resolvingDeck, resolveBill,
    createResolvingCase, users,
    bills, createBill, updateBill, postBillComment, postBillStaffComment
  } = useStore();

  const [activeGroup, setActiveGroup] = useState<string>('studying');
  const [postInput, setPostInput] = useState('');
  const [selectedBillId, setSelectedBillId] = useState<string | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [billComments, setBillComments] = useState<BillComment[]>([]);
  const [billStaffComments, setBillStaffComments] = useState<BillStaffComment[]>([]);

  // Bill Resolution state
  const [isResolvingBill, setIsResolvingBill] = useState(false);
  const [verdictInput, setVerdictInput] = useState('');
  
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
    await postToGroup(activeGroup as GroupId, postInput);
    setPostInput('');
  };

  return (
    <div className="space-y-10">
      {/* Group Navigation Bar - To select purpose */}
      <div className="flex flex-wrap gap-2 p-1.5 bg-neutral-900 border border-neutral-800 rounded-2xl w-fit">
        {[
          { id: 'studying', label: 'Studying Together', icon: BookOpen },
          { id: 'chatting', label: 'Chatting Together', icon: MessageCircle },
          { id: 'monitoring', label: 'Monitor Workspace', icon: Shield },
          { id: 'blackbox', label: 'Black Box', icon: Lock },
          { id: 'chattering', label: 'Direct Chat', icon: MessageSquare },
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
          {activeGroup === 'chattering' ? (
             <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-neutral-950/20">
              <ChatterPanel />
            </div>
          ) : activeGroup === 'blackbox' ? (
            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-neutral-950/20">
              <BlackBox source="groups_blackbox" />
            </div>
          ) : activeGroup === 'monitoring' ? (
            <div className="flex flex-col h-full bg-neutral-950/20">
              {/* Bills Header */}
              <div className="p-6 border-b border-neutral-800 bg-neutral-900/40 flex items-center justify-between">
                <div>
                   <h3 className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic">
                     <Shield size={16} className="text-blue-500" />
                     Monitor Workspace
                   </h3>
                   <p className="text-[10px] text-neutral-500 font-bold uppercase mt-1">Community Discussion & Policy</p>
                </div>
                <div className="flex items-center gap-2">
                   <Info size={14} className="text-neutral-600" />
                   <span className="text-[9px] font-bold text-neutral-600 uppercase italic">Discussion Channel</span>
                </div>
              </div>

              {/* Complaints Content */}
              <div className="flex-1 overflow-hidden grid grid-cols-[300px_1fr]">
                {/* Bills List Sidebar */}
                <div className="border-r border-neutral-800 overflow-y-auto custom-scrollbar p-4 space-y-3 bg-neutral-950/40">
                  <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest mb-2 px-2">Active Bills</p>
                  {bills.filter(b => b.status !== 'resolved').map(bill => (
                    <button
                      key={bill.id}
                      onClick={() => {
                        setSelectedBillId(bill.id);
                      }}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedBillId === bill.id 
                          ? 'bg-blue-600/10 border-blue-500/50 shadow-lg' 
                          : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-2">
                        <span className={`text-[7px] font-black uppercase px-1.5 py-0.5 rounded leading-none ${
                          bill.priority === 'Emergency' ? 'bg-red-500 text-white' : 
                          bill.priority === 'High' ? 'bg-orange-500 text-white' : 'bg-neutral-800 text-neutral-400'
                        }`}>
                          {bill.priority}
                        </span>
                        <span className="text-[7px] font-black text-blue-500 uppercase italic tracking-tighter">
                          {bill.category}
                        </span>
                      </div>
                      <h4 className="text-[11px] font-black text-neutral-100 uppercase tracking-tight leading-tight line-clamp-2">{bill.title}</h4>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-800/50">
                        <span className="text-[8px] font-mono text-neutral-500 uppercase italic">
                          {new Date(bill.timestamp).toLocaleDateString()}
                        </span>
                        <span className="text-[8px] font-bold text-neutral-600 italic">@{bill.proposedBy}</span>
                      </div>
                    </button>
                  ))}
                  {bills.length === 0 && (
                    <div className="text-center py-10 opacity-50 px-4">
                      <Shield size={24} className="mx-auto mb-2 text-neutral-700" />
                      <p className="text-[10px] font-bold text-neutral-600 italic">No bills drafted yet.</p>
                    </div>
                  )}
                </div>

                {/* Discussion Area */}
                <div className="flex flex-col overflow-hidden bg-neutral-900/20">
                  {selectedBill ? (
                    <div className="flex flex-col h-full overflow-hidden">
                      {/* Bill Meta */}
                      <div className="p-8 bg-neutral-950/40 border-b border-neutral-800">
                        <div className="flex items-start justify-between mb-4">
                           <div className="flex-1">
                             <div className="flex items-center gap-3 mb-2">
                               <span className="text-[9px] font-black text-blue-500 uppercase px-2 py-1 bg-blue-500/10 rounded-lg border border-blue-500/20 italic tracking-widest">{selectedBill.category}</span>
                               <span className="text-[9px] font-black text-neutral-500 uppercase tracking-widest italic tracking-[0.2em]">PROPOSED BY @{selectedBill.proposedBy}</span>
                             </div>
                             <h2 className="text-2xl font-black italic text-white leading-tight uppercase tracking-tighter">{selectedBill.title}</h2>
                           </div>
                           <div className="flex flex-col items-end gap-1">
                               <div className="flex items-center gap-2">
                                 <div className={`w-2 h-2 rounded-full ${selectedBill.priority === 'Emergency' ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`} />
                                 <span className="text-[10px] font-mono text-neutral-300 bg-neutral-800 px-2 py-1 rounded-md uppercase tracking-widest italic">{selectedBill.priority} Priority</span>
                               </div>
                               <span className="text-[8px] text-neutral-600 font-mono italic">FILED: {new Date(selectedBill.timestamp).toLocaleString()}</span>
                           </div>
                        </div>
                        <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-2xl italic">
                          <p className="text-xs text-neutral-400 leading-relaxed max-w-4xl">{selectedBill.description}</p>
                        </div>
                        
                        {currentUser?.role === 'admin' && selectedBill.status !== 'resolved' && (
                          <div className="flex gap-4 pt-4 border-t border-neutral-800">
                             {isResolvingBill ? (
                               <div className="flex-1 space-y-4">
                                  <textarea 
                                    value={verdictInput}
                                    onChange={e => setVerdictInput(e.target.value)}
                                    placeholder="Enter final bill verdict / resolution details..."
                                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl p-4 text-xs text-white outline-none focus:border-green-500 h-24"
                                  />
                                  <div className="flex gap-2">
                                    <button 
                                      onClick={async () => {
                                        if (!verdictInput.trim()) return;
                                        await resolveBill(selectedBill.id, verdictInput);
                                        setIsResolvingBill(false);
                                        setVerdictInput('');
                                        alert("Success: Bill has been resolved.");
                                      }}
                                      className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-lg transition-all"
                                    >
                                      Confirm Verdict
                                    </button>
                                    <button 
                                      onClick={() => setIsResolvingBill(false)}
                                      className="px-4 py-2 bg-neutral-800 text-neutral-400 text-[10px] font-black uppercase rounded-lg"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                               </div>
                             ) : (
                               <button 
                                 onClick={() => setIsResolvingBill(true)}
                                 className="flex items-center gap-2 px-4 py-2 bg-green-600/10 border border-green-500/30 text-green-500 text-[10px] font-black uppercase rounded-lg hover:bg-green-600 hover:text-white transition-all"
                               >
                                 <Scale size={14} /> Resolve & Pass Verdict
                               </button>
                             )}
                          </div>
                        )}
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
                           {(currentUser?.role === 'admin' || currentUser?.role === 'monitor') ? (
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
           {/* Resolving Issues Column */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
              <div className="p-5 border-b border-neutral-800 bg-orange-600/5 flex items-center gap-2">
                 <Scale size={16} className="text-orange-500" />
                 <h3 className="text-xs font-black uppercase tracking-widest italic">Resolving Deck</h3>
              </div>
              <div className="p-5 space-y-4 max-h-60 overflow-y-auto custom-scrollbar">
                {resolvingDeck.filter(c => c.status === 'under_investigation').map(c => (
                   <div 
                     key={c.id} 
                     className="w-full text-left p-4 rounded-xl relative overflow-hidden bg-orange-500/5 border border-orange-500/10"
                   >
                      <div className="absolute top-0 right-0 w-12 h-12 bg-orange-500/10 -mr-6 -mt-6 rotate-45" />
                      <p className="text-xs text-orange-200 leading-relaxed italic truncate">{c.description}</p>
                      <p className="text-[10px] text-neutral-500 mt-2 font-black uppercase tracking-widest leading-relaxed">Refer specifically to Monitor Workspace for details.</p>
                   </div>
                ))}
                {resolvingDeck.filter(c => c.status === 'under_investigation').length === 0 && (
                   <p className="text-xs text-neutral-600 text-center italic py-4">Equilibrium maintained.</p>
                )}
               </div>
           </div>

           {/* Complaint Box Redirect Card */}
           <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-[0_0_20px_rgba(245,158,11,0.02)]">
              <div className="p-5 border-b border-neutral-800 bg-amber-600/5 flex items-center gap-2">
                 <Lock size={16} className="text-amber-500 animate-pulse" />
                 <h3 className="text-xs font-black uppercase tracking-widest italic text-amber-500">Black Box</h3>
              </div>
              <div className="p-5">
                 <p className="text-[10px] text-neutral-400 mb-4 leading-relaxed">Submit anonymous complaints directly to system monitors.</p>
                 <button 
                   onClick={() => setActiveGroup('blackbox')}
                   className="w-full bg-amber-600 hover:bg-amber-500 text-white font-mono text-[10px] uppercase font-bold tracking-widest py-3 rounded-xl transition-all shadow-md shadow-amber-600/10 cursor-pointer text-center flex items-center justify-center gap-2"
                   id="btn-sidebar-blackbox-redirect"
                 >
                   <EyeOff size={12} /> Access Black Box
                 </button>
              </div>
           </div>
        </aside>
      </div>

      {/* Global View (Bottom Section) */}
      <div className="grid lg:grid-cols-1 gap-6 pt-10 border-t border-neutral-800">
          {/* Column 2: Internal Stats */}
          <div className="bg-neutral-900/50 border border-neutral-800 p-8 rounded-4xl">
             <div className="flex items-center justify-between mb-8">
                <h4 className="text-[12px] font-black uppercase tracking-[0.3em] text-neutral-500 flex items-center gap-3 italic">
                  <Shield size={16} /> Unit Statistics & Control
                </h4>
                <div className="w-12 h-1 bg-neutral-800 rounded-full" />
             </div>
             <div className="grid md:grid-cols-2 gap-8">
                <div className="flex justify-between items-center bg-neutral-950 p-8 rounded-3xl border border-neutral-800 shadow-inner group transition-all hover:border-blue-500/30">
                   <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                      <div>
                         <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1 italic">Connected Nodes</p>
                         <p className="text-[10px] font-bold text-neutral-300 uppercase italic">Operational Members</p>
                      </div>
                   </div>
                   <span className="text-4xl font-black italic text-blue-500 tracking-tighter">{users.length}</span>
                </div>
                <div className="p-8 border border-dashed border-neutral-800 rounded-3xl flex flex-col items-center justify-center text-center bg-neutral-950/20">
                   <Shield size={32} className="text-neutral-800 mb-4 opacity-40" />
                   <p className="text-[10px] font-black uppercase text-neutral-500 tracking-[0.2em] italic">Administrative Directive</p>
                   <p className="text-[10px] italic mt-2 text-neutral-600 max-w-[300px]">Bill filings and user validations are managed via the Monitor Workspace.</p>
                </div>
             </div>
          </div>
      </div>
    </div>
  );
}
