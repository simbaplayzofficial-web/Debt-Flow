import React from 'react';
import { useStore, AnnouncementSection } from '../store';
import { 
  Megaphone, Award, Star, TrendingUp, ShieldAlert, 
  Clock, ShieldCheck, Trash2, X, Send, Scale
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { 
    announcements, users, currentUser, 
    transactions, complaints, rolesConfig, debtAdjustments,
    approveTransaction, rejectTransaction, reviewComplaint, updateRolesConfig, resolveForgiveness,
    activityLogs, postAnnouncement, deleteAnnouncement, issueWarning,
    createResolvingCase, systemStatus, updateSystemStatus
  } = useStore();

  const [showAnnounceModal, setShowAnnounceModal] = React.useState(false);
  const [annForm, setAnnForm] = React.useState({ 
    title: '', 
    content: '', 
    section: (currentUser?.role === 'MONITOR' ? 'MONITORING' : 'GLOBAL') as AnnouncementSection 
  });

  // Logic for rankings
  const validUsers = users.filter(u => !u.isPermanentlyRemoved);
  
  const activeAnnouncements = announcements.filter(ann => {
    if (!ann.expiresAt) return true; // Legacy support
    return new Date(ann.expiresAt).getTime() > Date.now();
  });
  
  const senderOfMonth = [...validUsers].sort((a, b) => (b.totalLendingTransactions || 0) - (a.totalLendingTransactions || 0))[0];
  const bestSender = [...validUsers]
    .filter(u => (u.ratingCount || 0) > 0)
    .sort((a, b) => (b.ratingAverage || 0) - (a.ratingAverage || 0))[0];

  // 1. Global Efficiency Calculation
  const last7DaysTransactions = transactions.filter(t => {
    const txTime = new Date(t.timestamp).getTime();
    const sevenDaysAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
    return txTime > sevenDaysAgo && t.status === 'completed';
  });
  const txCount = last7DaysTransactions.length;
  let efficiencyScore = 'LOW';
  let efficiencyColor = 'text-red-500';
  if (txCount > 30) {
    efficiencyScore = 'PEAK';
    efficiencyColor = 'text-green-500';
  } else if (txCount > 15) {
    efficiencyScore = 'HIGH';
    efficiencyColor = 'text-blue-500';
  } else if (txCount > 5) {
    efficiencyScore = 'MODERATE';
    efficiencyColor = 'text-yellow-500';
  }

  // 2. Warning Status Stats
  const usersWithWarnings = users.filter(u => u.integrityLevel > 0);
  const warningBreakdown = {
    lvl1: users.filter(u => u.integrityLevel === 1).length,
    lvl2: users.filter(u => u.integrityLevel === 2).length,
    lvl3: users.filter(u => u.integrityLevel === 3).length,
    lvl4: users.filter(u => u.integrityLevel === 4).length,
    lvl5: users.filter(u => u.integrityLevel === 5).length,
  };

  return (
    <div className="space-y-10">
      {/* Announcements Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Megaphone size={20} />
            </div>
            <h2 className="text-xl font-bold italic">Announcements</h2>
          </div>
          {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR' || currentUser?.role === 'ADD_ADMIN') && (
            <button 
              onClick={() => setShowAnnounceModal(true)}
              className="bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-lg shadow-blue-500/20 uppercase tracking-widest transition-all active:scale-95"
            >
              Post Announcement
            </button>
          )}
        </div>
        
        <div className="grid gap-4">
          {activeAnnouncements.length > 0 ? (
            activeAnnouncements.map((ann, i) => (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                key={ann.id} 
                className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl relative overflow-hidden group"
              >
                <div className={`absolute top-0 left-0 w-1 h-full opacity-50 ${
                  ann.section === 'GLOBAL' ? 'bg-blue-600' :
                  ann.section === 'MONITORING' ? 'bg-orange-500' : 'bg-green-500'
                }`} />
                <div className="flex justify-between items-start mb-4">
                  <div className="space-y-1">
                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] px-2 py-0.5 rounded ${
                      ann.section === 'GLOBAL' ? 'bg-blue-500/10 text-blue-500' :
                      ann.section === 'MONITORING' ? 'bg-orange-500/10 text-orange-500' : 'bg-green-500/10 text-green-500'
                    }`}>
                      {ann.section} Section
                    </span>
                    <h4 className="text-md font-bold text-neutral-100 tracking-tight">{ann.title}</h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-neutral-500 font-mono italic">
                      {new Date(ann.timestamp).toLocaleDateString()}
                    </span>
                    {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADD_ADMIN') && (
                      <button 
                        onClick={() => {
                          if (confirm("Delete this announcement?")) deleteAnnouncement(ann.id);
                        }}
                        className="p-1.5 text-neutral-600 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                        title="Delete Announcement"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-neutral-400 leading-relaxed text-sm whitespace-pre-wrap">{ann.content}</p>
                <div className="mt-6 flex items-center gap-2 pt-4 border-t border-neutral-800/50">
                  <div className="w-6 h-6 bg-neutral-800 rounded-full border border-neutral-700 flex items-center justify-center text-[10px] font-bold text-neutral-500 uppercase">
                    {(users.find(u => u.id === ann.authorId)?.username || 'A')[0]}
                  </div>
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">
                    Verified By {users.find(u => u.id === ann.authorId)?.username || 'Admin'}
                  </span>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="bg-neutral-900/50 border border-neutral-800 border-dashed p-12 rounded-3xl text-center">
              <Megaphone className="mx-auto text-neutral-800 mb-4" size={40} />
              <p className="text-neutral-600 text-sm italic italic">No active system announcements.</p>
            </div>
          )}
        </div>
      </section>

      {/* Control Metrics Columns */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Column 1: Global Efficiency */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <TrendingUp size={18} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Global Efficiency</h3>
          </div>
          <div className="space-y-1">
            <p className={`text-3xl font-black italic italic tracking-tight ${efficiencyColor}`}>
              {efficiencyScore}
            </p>
            <p className="text-[10px] font-bold text-neutral-500 uppercase">
              {txCount} transactions in last 7 days
            </p>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-800/50 flex justify-between items-center">
             <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest italic">Weekly Cycle</span>
             <div className="flex gap-0.5">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className={`w-3 h-1 rounded-full ${i <= (txCount / 10) + 1 ? 'bg-blue-500' : 'bg-neutral-800'}`} />
                ))}
             </div>
          </div>
        </div>

        {/* Column 2: Warning Status */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
               <ShieldAlert size={18} />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Warning Status</h3>
          </div>
          <div className="flex items-end justify-between">
             <div className="space-y-1">
               <p className="text-3xl font-black italic tracking-tight text-neutral-100">
                 {usersWithWarnings.length}
               </p>
               <p className="text-[10px] font-bold text-neutral-500 uppercase">Active Restrictions</p>
             </div>
             <div className="flex gap-1 items-end h-10">
                {[1, 2, 3, 4, 5].map(lvl => {
                  const count = (warningBreakdown as any)[`lvl${lvl}`];
                  const height = Math.min(100, Math.max(10, (count / (usersWithWarnings.length || 1)) * 100));
                  return (
                    <div 
                      key={lvl} 
                      className={`w-2 rounded-t-sm transition-all ${
                        lvl === 1 ? 'bg-green-500' : 
                        lvl === 2 ? 'bg-yellow-500' : 
                        lvl === 3 ? 'bg-orange-500' : 
                        lvl === 4 ? 'bg-orange-600' : 'bg-red-600'
                      }`}
                      style={{ height: `${height}%` }}
                      title={`LVL${lvl}: ${count} users`}
                    />
                  );
                })}
             </div>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-800/50 flex justify-between text-[8px] font-bold text-neutral-600 uppercase tracking-widest">
             <span>LVL 1-5 Breakdown</span>
             <span>Real-time Sync</span>
          </div>
        </div>

        {/* Column 3: System Synchronised */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl group">
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-green-500/10 rounded-lg text-green-500">
               <Clock size={18} />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">System Synchronised</h3>
          </div>
          <div className="space-y-3">
             <div className="flex items-center justify-between">
               <p className={`text-2xl font-black italic tracking-tighter uppercase ${
                 systemStatus?.emergencyLevel === 3 ? 'text-red-500 animate-pulse' : 
                 systemStatus?.emergencyLevel === 2 ? 'text-orange-500' : 'text-blue-500'
               }`}>
                 {systemStatus?.emergencyLevel === 1 ? 'Normal Alert' : 
                  systemStatus?.emergencyLevel === 2 ? 'High Alert' : 'Critical'}
               </p>
               <div className="flex items-center gap-1">
                 <div className={`w-2 h-2 rounded-full ${systemStatus?.emergencyLevel === 1 ? 'bg-blue-500' : 'bg-neutral-800'}`} />
                 <div className={`w-2 h-2 rounded-full ${systemStatus?.emergencyLevel === 2 ? 'bg-orange-500' : 'bg-neutral-800'}`} />
                 <div className={`w-2 h-2 rounded-full ${systemStatus?.emergencyLevel === 3 ? 'bg-red-500' : 'bg-neutral-800'}`} />
               </div>
             </div>
             
             {currentUser?.role === 'ADMIN' ? (
                <div className="flex gap-1 pt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                   {[1, 2, 3].map((lvl) => (
                     <button
                       key={lvl}
                       onClick={() => updateSystemStatus(lvl as 1 | 2 | 3)}
                       className={`flex-1 py-1 rounded-md text-[8px] font-black uppercase transition-all ${
                         systemStatus?.emergencyLevel === lvl 
                           ? 'bg-neutral-100 text-neutral-950' 
                           : 'bg-neutral-800 text-neutral-500 hover:bg-neutral-700'
                       }`}
                     >
                       LVL{lvl}
                     </button>
                   ))}
                </div>
             ) : (
                <p className="text-[9px] text-neutral-600 italic">State locked by High Administrators.</p>
             )}
          </div>
        </div>
      </div>

      {/* Main Ranking Section */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Sender of the Month */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all" />
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500">
              <Award size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Sender of the Month</h3>
              <p className="text-neutral-500 text-xs">Based on lending transactions</p>
            </div>
          </div>

          {senderOfMonth ? (
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <p className="text-neutral-400 text-xs font-mono mb-1 uppercase tracking-tighter italic">Top Contributor</p>
                <h4 className="text-4xl font-black italic tracking-tight mb-2 text-neutral-100 uppercase">{senderOfMonth.username}</h4>
                <div className="flex items-center gap-4 text-sm">
                   <span className="flex items-center gap-1.5 text-orange-400 font-bold bg-orange-400/5 px-2 py-0.5 rounded border border-orange-400/10">
                     <TrendingUp size={14} />
                     {senderOfMonth.totalLendingTransactions || 0} Leads
                   </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center">
                  <Award size={32} className="text-orange-500 opacity-20" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-neutral-600 italic">No rankings yet.</p>
          )}

          {senderOfMonth?.id === currentUser?.id && (
            <div className="mt-8 p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
               <p className="text-xs text-orange-400 font-bold mb-1 italic">Reward Choice Available:</p>
               <p className="text-[10px] text-orange-500/80 leading-relaxed">Remove one warning OR get a one-time Debt-Free Pass. Contact Admin to claim.</p>
            </div>
          )}
        </motion.div>

        {/* Best Sender */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-500/10 rounded-full blur-3xl group-hover:bg-yellow-500/20 transition-all" />
          <div className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-yellow-500/10 rounded-2xl text-yellow-500">
              <Star size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Best Sender</h3>
              <p className="text-neutral-500 text-xs">Based on user ratings</p>
            </div>
          </div>

          {bestSender ? (
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <p className="text-neutral-400 text-xs font-mono mb-1 uppercase tracking-tighter italic">Top Rated</p>
                <h4 className="text-4xl font-black italic tracking-tight mb-2 text-neutral-100 uppercase">{bestSender.username}</h4>
                <div className="flex items-center gap-4 text-sm">
                   <span className="flex items-center gap-1.5 text-yellow-400 font-bold bg-yellow-400/5 px-2 py-0.5 rounded border border-yellow-400/10">
                     <Star size={14} fill="currentColor" />
                     {(bestSender.ratingAverage || 0).toFixed(1)} Rating
                   </span>
                   <span className="text-neutral-500 text-[10px] font-mono">({bestSender.ratingCount || 0} Reviews)</span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center">
                  <Star size={32} className="text-yellow-500 opacity-20" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-neutral-600 italic">No ratings yet.</p>
          )}
        </motion.div>
      </div>

      {/* Monitor / Admin Control Panel */}
      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR' || currentUser?.role === 'ADD_ADMIN') && (
        <section className="space-y-8 pt-10 border-t border-neutral-800">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500">
               <ShieldAlert size={20} />
             </div>
             <h2 className="text-xl font-bold">Monitor Authorities</h2>
           </div>

           <div className="grid lg:grid-cols-2 gap-8">
              {/* Pending Approvals */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                 <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Pending Validation
                    <span className="bg-orange-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                       {transactions.filter(t => t.status === 'pending').length}
                    </span>
                 </h3>
                 <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
                    {transactions.filter(t => t.status === 'pending').map(tx => {
                      const receiver = users.find(u => u.id === tx.receiverId);
                      const sender = users.find(u => u.id === tx.senderId);
                      return (
                        <div key={tx.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl flex items-center justify-between gap-4 group hover:border-orange-500/30 transition-all">
                           <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[8px] font-black uppercase px-1 rounded bg-neutral-800 text-neutral-400">{tx.type}</span>
                                {tx.isCommunityService && <span className="text-[8px] font-black uppercase px-1 rounded bg-blue-500/20 text-blue-400">CS</span>}
                              </div>
                              <p className="text-xs font-bold truncate">
                                 <span className="text-blue-400">{sender?.username}</span> → <span className="text-blue-400">{receiver?.username}</span>
                              </p>
                              <p className="text-[10px] text-neutral-500 mt-1 italic">{tx.workName} ({tx.pages} pages)</p>
                              <p className="text-[10px] font-black text-orange-500 uppercase mt-0.5">{tx.amount} DB Value</p>
                           </div>
                           <div className="flex gap-2">
                             <button 
                                onClick={async () => {
                                  try {
                                    await approveTransaction(tx.id);
                                    alert("TRANSACTION APPROVED: Consensus reached.");
                                  } catch (error: any) {
                                    alert("APPROVAL FAILED: " + error.message);
                                  }
                                }}
                                className="px-3 py-1.5 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-green-600/20"
                              >
                                 Approve
                             </button>
                             <button 
                                onClick={async () => {
                                  try {
                                    await rejectTransaction(tx.id);
                                    alert("TRANSACTION REJECTED: Monitor record synchronized.");
                                  } catch (error: any) {
                                    alert("REJECTION FAILED: " + error.message);
                                  }
                                }}
                                className="px-3 py-1.5 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                              >
                                 Reject
                             </button>
                           </div>
                        </div>
                      );
                    })}
                    {transactions.filter(t => t.status === 'pending').length === 0 && (
                      <p className="text-neutral-600 text-xs italic text-center py-4">All transactions cleared.</p>
                    )}
                 </div>
              </div>

              {/* Anonymous Complaints */}
              <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6">
                 <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                    Complaint Queue
                    <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                       {complaints.filter(c => !c.reviewedBy.includes(currentUser.id)).length}
                    </span>
                 </h3>
                 <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                    {complaints.map(c => (
                      <div key={c.id} className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl">
                         <p className="text-xs text-neutral-300 leading-relaxed italic">"{c.content}"</p>
                         <div className="mt-3 flex items-center justify-between">
                            <span className="text-[9px] text-neutral-600 font-mono italic">{new Date(c.timestamp).toLocaleString()}</span>
                            {!c.reviewedBy.includes(currentUser.id) ? (
                              <button 
                                onClick={() => reviewComplaint(c.id)}
                                className="text-blue-500 hover:text-blue-400 text-[9px] font-black uppercase tracking-widest"
                              >
                                Mark Reviewed
                              </button>
                            ) : (
                              <span className="text-green-500 text-[9px] font-black uppercase tracking-widest">Reviewed</span>
                            )}
                         </div>
                      </div>
                    ))}
                    {complaints.length === 0 && (
                      <p className="text-neutral-600 text-xs italic text-center py-4">No complaints recorded.</p>
                    )}
                 </div>
              </div>

               {/* Debt Forgiveness (Resolving Deck) */}
               {currentUser?.role === 'ADMIN' && (
                 <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 lg:col-span-2">
                    <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4 flex items-center justify-between">
                       Resolving Deck (Debt Adjustments)
                       <span className="bg-green-500 text-white text-[10px] px-2 py-0.5 rounded-full">
                          {debtAdjustments.filter(a => a.status === 'REQUESTED').length}
                       </span>
                    </h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                       {debtAdjustments.filter(a => a.status === 'REQUESTED').map(adj => {
                         const borrower = users.find(u => u.id === adj.borrowerId);
                         const lender = users.find(u => u.id === adj.lenderId);
                         return (
                           <div key={adj.id} className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl">
                              <p className="text-xs font-bold text-neutral-200 mb-1">
                                <span className="text-green-400">{lender?.username}</span> requests forgiveness for <span className="text-blue-400">{borrower?.username}</span>
                              </p>
                              <p className="text-[10px] text-neutral-500 mb-4">Amount: {adj.amount} DB</p>
                              <div className="flex gap-2">
                                 <button 
                                   onClick={() => {
                                      if (confirm("Approve this debt adjustment?")) {
                                         resolveForgiveness(adj.id, true);
                                      }
                                   }}
                                   className="flex-1 py-2 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-lg"
                                 >
                                   Approve
                                 </button>
                                 <button 
                                   onClick={() => {
                                      if (confirm("Reject this debt adjustment?")) {
                                         resolveForgiveness(adj.id, false);
                                      }
                                   }}
                                   className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase rounded-lg"
                                 >
                                   Reject
                                 </button>
                              </div>
                           </div>
                         );
                       })}
                       {debtAdjustments.filter(a => a.status === 'REQUESTED').length === 0 && (
                         <div className="col-span-full py-8 text-center bg-neutral-950/30 border border-neutral-800 border-dashed rounded-2xl">
                            <p className="text-neutral-600 text-xs italic">Resolving deck is clear.</p>
                         </div>
                       )}
                    </div>
                 </div>
               )}
           </div>
        </section>
      )}






      {/* Admin Role Management */}
      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'ADD_ADMIN') && (
        <section className="pt-10 border-t border-neutral-800">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-red-500/10 rounded-lg text-red-500">
               <ShieldCheck size={20} />
             </div>
             <h2 className="text-xl font-bold">Role Matrix Control</h2>
           </div>

           <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                 <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Administrators</h3>
                 <div className="flex flex-wrap gap-2 mb-4">
                    {rolesConfig.admins.map(a => (
                      <span key={a} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center gap-2">
                         {a}
                         <button 
                            onClick={async () => {
                              const newAdmins = rolesConfig.admins.filter(x => x !== a);
                              if (newAdmins.length === 0) return alert("System must have at least one admin.");
                              await updateRolesConfig(newAdmins, rolesConfig.monitors);
                            }}
                            className="hover:text-white"
                          >
                            ×
                         </button>
                      </span>
                    ))}
                 </div>
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.currentTarget.adminName as HTMLInputElement;
                    const name = input.value.trim().toLowerCase();
                    if (!name) return;
                    if (rolesConfig.admins.includes(name)) return alert("User already an admin.");
                    await updateRolesConfig([...rolesConfig.admins, name], rolesConfig.monitors);
                    input.value = '';
                 }} className="flex gap-2">
                    <input name="adminName" type="text" placeholder="Add username..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-red-500" />
                    <button type="submit" className="bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl">ADD</button>
                 </form>
              </div>

              <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-2xl">
                 <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">Monitors</h3>
                 <div className="flex flex-wrap gap-2 mb-4">
                    {rolesConfig.monitors.map(m => (
                      <span key={m} className="px-3 py-1 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-bold rounded-full flex items-center gap-2">
                         {m}
                         <button 
                            onClick={async () => {
                              const newMonitors = rolesConfig.monitors.filter(x => x !== m);
                              await updateRolesConfig(rolesConfig.admins, newMonitors);
                            }}
                            className="hover:text-white"
                          >
                            ×
                         </button>
                      </span>
                    ))}
                 </div>
                 <form onSubmit={async (e) => {
                    e.preventDefault();
                    const input = e.currentTarget.monitorName as HTMLInputElement;
                    const name = input.value.trim().toLowerCase();
                    if (!name) return;
                    if (rolesConfig.monitors.includes(name)) return alert("User already a monitor.");
                    await updateRolesConfig(rolesConfig.admins, [...rolesConfig.monitors, name]);
                    input.value = '';
                 }} className="flex gap-2">
                    <input name="monitorName" type="text" placeholder="Add username..." className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-orange-500" />
                    <button type="submit" className="bg-orange-600 hover:bg-orange-500 text-white text-[10px] font-bold px-4 py-2 rounded-xl">ADD</button>
                 </form>
              </div>
           </div>
        </section>
      )}

      {/* Global Activity Log */}
      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') && (
        <section className="bg-orange-500/5 border border-orange-500/10 p-8 rounded-3xl mt-12">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h3 className="text-xl font-bold flex items-center gap-2 italic">
                  <ShieldAlert className="text-orange-500" size={24} />
                  System Punishment Center
                </h3>
                <p className="text-xs text-neutral-500 mt-1">Issue official warnings and integrity deductions.</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-orange-500/50 uppercase tracking-[0.2em]">Authorized Access Only</p>
              </div>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const form = e.currentTarget;
              const username = (form.elements.namedItem('warnUsername') as HTMLInputElement).value;
              const reason = (form.elements.namedItem('warnReason') as HTMLTextAreaElement).value;

              if (!username || !reason) return alert("All fields are required.");
              
              const confirmed = window.confirm(`Issue an official warning to @${username}? This will automatically increase their Integrity LVL according to the mapping rules.`);
              if (confirmed) {
                await issueWarning(username, 0, reason); // Level is ignored by store logic now
                form.reset();
              }
            }} className="grid md:grid-cols-3 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Target Username</label>
                  <input name="warnUsername" type="text" placeholder="e.g. johndoe" className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500" required />
                </div>
                <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl">
                   <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 text-center">Auto-Derivation Active</p>
                   <p className="text-[10px] text-neutral-600 text-center leading-relaxed">
                     System will automatically assign the next Warning Level (1-5) and apply respective penalties based on the user's current record.
                   </p>
                </div>
              </div>
              <div className="md:col-span-2 flex flex-col gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Justification / Reason</label>
                  <textarea name="warnReason" placeholder="Detailed reason for the warning..." className="w-full h-full min-h-[100px] bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500 resize-none" required />
                </div>
                <button type="submit" className="w-full bg-orange-600 hover:bg-orange-500 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-orange-600/20">
                  Execute System Verdict
                </button>
              </div>
            </form>
        </section>
      )}

      {(currentUser?.role === 'ADMIN' || currentUser?.role === 'MONITOR') && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 mt-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500">
               <Scale size={24} />
            </div>
            <div>
               <h3 className="text-2xl font-bold italic">Resolving Deck Initiation</h3>
               <p className="text-neutral-500 text-xs uppercase tracking-widest font-black">Open New Investigation</p>
            </div>
          </div>

          <form onSubmit={async (e: any) => {
            e.preventDefault();
            const form = e.currentTarget;
            const description = (form.elements.namedItem('caseDescription') as HTMLTextAreaElement).value;
            const usersList = (form.elements.namedItem('involvedUsers') as HTMLInputElement).value;
            
            if (description && usersList) {
              try {
                const involved = usersList.split(',').map(s => s.trim().replace('@', ''));
                await createResolvingCase(description, involved);
                form.reset();
                alert("INVESTIGATION SEALED: Case has been logged in the Resolving Deck.");
              } catch (error: any) {
                alert(`FAILED TO SEAL: ${error.message || 'Check connection'}`);
              }
            } else {
              alert("CRITICAL ERROR: Investigation cannot be sealed without all required parameters.");
            }
          }}>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Involved Users (comma separated @usernames)</label>
                  <input name="involvedUsers" placeholder="@user1, @user2..." className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all font-mono" required />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl uppercase tracking-[0.2em] text-xs transition-all shadow-lg shadow-orange-600/20">
                  Seal & Log Investigation
                </button>
              </div>
              <div>
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Detailed Case Description</label>
                <textarea name="caseDescription" placeholder="Outline the dispute or suspected discrepancy..." className="w-full h-full min-h-[120px] bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none font-medium" required />
              </div>
            </div>
          </form>
        </section>
      )}

      {currentUser?.role === 'ADMIN' && (
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 mt-10">
           <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-6 flex items-center justify-between">
             Global Activity Log
             <span className="text-[10px] text-neutral-500 font-normal">Real-time Admin Feed</span>
           </h3>
           <div className="space-y-4 max-h-[500px] overflow-y-auto custom-scrollbar pr-2">
              {activityLogs.map(log => {
                const logDate = log.timestamp?.toDate ? log.timestamp.toDate() : (log.timestamp ? new Date(log.timestamp) : new Date());
                const displayDetails = typeof log.details === 'object' 
                  ? JSON.stringify(log.details).replace(/[{}"]/g, '').replace(/:/g, ': ').replace(/,/g, ' | ')
                  : log.details;

                return (
                  <div key={log.id} className="text-[11px] font-mono border-b border-neutral-800/50 pb-3 flex items-start gap-4 hover:bg-white/5 transition-colors group px-2">
                     <span className="text-neutral-600 shrink-0 w-20 py-1">{logDate.toLocaleTimeString()}</span>
                     <p className="text-neutral-300 flex-1 py-1">
                       <span className="text-blue-500 font-black">[{log.username || 'SYSTEM'}]</span>
                       <span className="mx-2 text-neutral-500 font-bold">{log.action}:</span>
                       <span className="text-white group-hover:text-blue-200 transition-colors">{displayDetails}</span>
                     </p>
                     <span className="text-[9px] text-neutral-700 font-mono uppercase shrink-0 pt-1">{logDate.toLocaleDateString()}</span>
                  </div>
                );
              })}
              {activityLogs.length === 0 && (
                <p className="text-neutral-600 italic text-xs py-10 text-center">No activity recorded for this period.</p>
              )}
           </div>
        </div>
      )}
      {/* Announcement Modal */}
      {showAnnounceModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="p-8">
               <div className="flex justify-between items-center mb-8">
                 <h3 className="text-xl font-bold italic flex items-center gap-2">
                   <Megaphone className="text-blue-500" size={24} />
                   Broadcast Message
                 </h3>
                 <button onClick={() => setShowAnnounceModal(false)} className="text-neutral-500 hover:text-white transition-colors">
                   <X size={24} />
                 </button>
               </div>

               <form className="space-y-6" onSubmit={async (e) => {
                 e.preventDefault();
                 await postAnnouncement(annForm.title, annForm.content, annForm.section);
                 setShowAnnounceModal(false);
                 setAnnForm({ 
                   title: '', 
                   content: '', 
                   section: (currentUser?.role === 'MONITOR' ? 'MONITORING' : 'GLOBAL') as AnnouncementSection 
                 });
               }}>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Notice Type</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['GLOBAL', 'MONITORING', 'RESOLVING'].map((s) => {
                         const isDisabled = currentUser?.role === 'MONITOR' && s === 'GLOBAL';
                         return (
                           <button
                             key={s}
                             type="button"
                             disabled={isDisabled}
                             onClick={() => setAnnForm(prev => ({ ...prev, section: s as any }))}
                             className={`py-3 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                               annForm.section === s 
                                 ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-600/20' 
                                 : isDisabled 
                                    ? 'bg-neutral-950 border-neutral-900 text-neutral-800 cursor-not-allowed opacity-30'
                                    : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                             }`}
                           >
                             {s}
                           </button>
                         );
                       })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Headline</label>
                    <input 
                       type="text"
                       value={annForm.title}
                       onChange={e => setAnnForm(prev => ({ ...prev, title: e.target.value }))}
                       placeholder="e.g. System Maintenance Scheduled"
                       className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-all font-bold"
                       required
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Broadcast Content</label>
                    <textarea 
                       rows={5}
                       value={annForm.content}
                       onChange={e => setAnnForm(prev => ({ ...prev, content: e.target.value }))}
                       placeholder="Describe the notice in detail..."
                       className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 text-sm text-neutral-200 focus:outline-none focus:border-blue-500 transition-all resize-none"
                       required
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl shadow-xl shadow-blue-500/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 uppercase tracking-widest text-xs"
                  >
                    <Send size={16} />
                    Publish Announcement
                  </button>
               </form>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
