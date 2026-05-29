import React from 'react';
import { useStore, AnnouncementSection } from '../store';
import { 
  Megaphone, Award, Star, TrendingUp, ShieldAlert, 
  Clock, ShieldCheck, Trash2, X, Send, Scale, Heart, 
  Gift, CheckCircle2, ChevronRight
} from 'lucide-react';
import { motion } from 'motion/react';

export default function Dashboard() {
  const { 
    announcements, users, currentUser, rewards, currentLeaderboard,
    transactions, complaints, rolesConfig, debtAdjustments, roleRequests,
    updateRolesConfig,
    resolveRoleRequest,
    activityLogs, postAnnouncement, deleteAnnouncement, issueWarning,
    createResolvingCase, systemStatus, updateSystemStatus, claimReward
  } = useStore();

  const [showAnnounceModal, setShowAnnounceModal] = React.useState(false);
  const [annForm, setAnnForm] = React.useState({ 
    title: '', 
    content: '', 
    section: (currentUser?.role === 'monitor' ? 'MONITORING' : 'GLOBAL') as AnnouncementSection 
  });

  // Logic for rankings
  const validUsers = users.filter(u => !u.isPermanentlyRemoved);
  
  const activeAnnouncements = announcements.filter(ann => {
    if (!ann.expiresAt) return true; // Legacy support
    return new Date(ann.expiresAt).getTime() > Date.now();
  });
  
  const lbCarer = currentLeaderboard?.communityCarer;
  const communityCarerName = lbCarer?.username || 'None';
  const communityCarerContribution = lbCarer?.totalContribution || 0;

  const lbSenderOfMonth = currentLeaderboard?.senderOfTheMonth;
  const senderOfMonthName = lbSenderOfMonth?.username || 'None';
  const senderOfMonthDebts = lbSenderOfMonth?.totalDebts || 0;

  const lbBestSender = currentLeaderboard?.bestSender;
  const bestSenderName = lbBestSender?.username || 'None';
  const bestSenderRating = lbBestSender?.averageRating || 0;

  const myClaimableRewards = rewards.filter(r => r.userId === currentUser?.id && !r.claimed);

  const [rewardChoiceModal, setRewardChoiceModal] = React.useState<string | null>(null);

  // 1. Global Efficiency Calculation
  const last7DaysTransactions = transactions.filter(t => {
    const txTime = new Date(t.createdAt?.toDate?.() || t.createdAt).getTime();
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
          {(currentUser?.role === 'admin' || currentUser?.role === 'monitor' || currentUser?.role === 'add_admin') && (
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
                    {(currentUser?.role === 'admin' || currentUser?.role === 'add_admin') && (
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
      <div className="grid md:grid-cols-4 gap-6">
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
             
             {currentUser?.role === 'admin' ? (
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

        {/* Column 4: Community Carer */}
        <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl group overflow-hidden relative">
          <div className="absolute -top-6 -right-6 opacity-5 group-hover:rotate-12 transition-transform">
             <Heart size={80} />
          </div>
          <div className="flex items-center gap-3 mb-4">
             <div className="p-2 bg-pink-500/10 rounded-lg text-pink-500">
               <Heart size={18} />
             </div>
             <h3 className="text-xs font-black uppercase tracking-widest text-neutral-400">Community Carer</h3>
          </div>
          <div className="space-y-1 relative z-10">
             <p className="text-xl font-black italic tracking-tighter text-pink-500 uppercase">
               @{communityCarerName}
             </p>
             <p className="text-[10px] font-bold text-neutral-500 uppercase">
               {communityCarerContribution} Contributions
             </p>
          </div>
          <div className="mt-4 pt-4 border-t border-neutral-800/50 flex justify-between text-[8px] font-bold text-neutral-600 uppercase tracking-widest">
             <span>Top CS Provider</span>
             <Heart size={10} className="text-pink-500/50" />
          </div>
        </div>
      </div>

      {/* Reward Claims Notify */}
      {myClaimableRewards.length > 0 && (
         <motion.div 
           initial={{ y: 20, opacity: 0 }}
           animate={{ y: 0, opacity: 1 }}
           className="bg-gradient-to-r from-blue-600 to-purple-600 p-8 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6"
         >
            <div className="flex items-center gap-6">
               <div className="p-4 bg-white/10 rounded-2xl">
                  <Gift size={32} className="text-white" />
               </div>
               <div>
                  <h3 className="text-2xl font-black italic text-white uppercase tracking-tight">Reward Available</h3>
                  <p className="text-white/70 text-xs font-bold uppercase tracking-widest">You have {myClaimableRewards.length} unclaimed ranking reward(s)</p>
               </div>
            </div>
            <div className="flex gap-4">
               {myClaimableRewards.map(r => (
                 <button 
                   key={r.id}
                   onClick={() => setRewardChoiceModal(r.id)}
                   className="px-8 py-3 bg-white text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] rounded-xl hover:bg-neutral-100 transition-all shadow-xl"
                 >
                    Claim {r.type.replace('_', ' ')}
                 </button>
               ))}
            </div>
         </motion.div>
      )}

      {/* Main Ranking Section */}
      <div className="grid lg:grid-cols-2 gap-8 pb-10">
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

          {lbSenderOfMonth ? (
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <p className="text-neutral-400 text-xs font-mono mb-1 uppercase tracking-tighter italic">Top Contributor</p>
                <h4 className="text-4xl font-black italic tracking-tight mb-2 text-neutral-100 uppercase">{senderOfMonthName}</h4>
                <div className="flex items-center gap-4 text-sm">
                   <span className="flex items-center gap-1.5 text-orange-400 font-bold bg-orange-400/5 px-2 py-0.5 rounded border border-orange-400/10">
                     <TrendingUp size={14} />
                     {senderOfMonthDebts} Approved Debts
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

          {lbSenderOfMonth?.userId === currentUser?.id && (
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

          {lbBestSender ? (
            <div className="flex items-end gap-6">
              <div className="flex-1">
                <p className="text-neutral-400 text-xs font-mono mb-1 uppercase tracking-tighter italic">Top Rated</p>
                <h4 className="text-4xl font-black italic tracking-tight mb-2 text-neutral-100 uppercase">{bestSenderName}</h4>
                <div className="flex items-center gap-4 text-sm">
                   <span className="flex items-center gap-1.5 text-yellow-400 font-bold bg-yellow-400/5 px-2 py-0.5 rounded border border-yellow-400/10">
                     <Star size={14} fill="currentColor" />
                     {bestSenderRating.toFixed(1)} Average Rating
                   </span>
                </div>
              </div>
              <div className="hidden sm:block">
                <div className="w-16 h-16 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center">
                  <Star size={32} className="text-yellow-500 opacity-20" />
                </div>
              </div>
            </div>
          ) : (
            <p className="text-neutral-600 italic">No rankings yet.</p>
          )}
        </motion.div>
      </div>

      {/* Activity Logs */}
      {activityLogs.length > 0 && (
        <section className="pt-10 border-t border-neutral-800">
           <div className="flex items-center gap-3 mb-6">
             <div className="p-2 bg-neutral-800 rounded-lg text-neutral-400">
               <Clock size={20} />
             </div>
             <h2 className="text-xl font-bold uppercase tracking-tighter italic">Activity Protocol</h2>
           </div>
           
           <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-xl">
              <div className="px-6 py-4 border-b border-neutral-800 flex justify-between items-center">
                 <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">Recent Events</span>
                 <span className="text-[10px] font-bold text-neutral-600">Total Logs: {activityLogs.length}</span>
              </div>
              <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                 <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-neutral-900 z-10">
                       <tr className="border-b border-neutral-800">
                          <th className="px-6 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Type</th>
                          <th className="px-6 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest">Action</th>
                          <th className="px-6 py-3 text-[9px] font-black text-neutral-500 uppercase tracking-widest text-right">Timestamp</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-neutral-800/50">
                       {activityLogs.slice(0, 50).map((log, logIdx) => (
                         <tr key={log.id || `dash-log-${logIdx}`} className="hover:bg-white/[0.02] transition-colors group">
                            <td className="px-6 py-4">
                               <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                                 log.type === 'transaction' ? 'bg-blue-500/10 text-blue-400' :
                                 log.type === 'admin' ? 'bg-red-500/10 text-red-400' :
                                 'bg-neutral-800 text-neutral-400'
                               }`}>
                                 {log.type}
                               </span>
                            </td>
                            <td className="px-6 py-4">
                               <p className="text-xs text-neutral-300 font-medium group-hover:text-white">{log.action}</p>
                            </td>
                            <td className="px-6 py-4 text-right">
                               <span className="text-[10px] text-neutral-600 font-mono italic">
                                 {new Date(log.timestamp).toLocaleString([], { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}
                               </span>
                            </td>
                         </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
           </div>
        </section>
      )}
      
      {/* Reward Choice Modal */}
      {rewardChoiceModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[110] flex items-center justify-center p-4">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden shadow-2xl"
           >
              <div className="p-10">
                 <h2 className="text-2xl font-black italic mb-2 uppercase tracking-tight">Select Your Reward</h2>
                 <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-10">Choose wisely. This action is final.</p>
                 
                 <div className="grid gap-4">
                    <button 
                      onClick={() => {
                        claimReward(rewardChoiceModal, 'debt_clear');
                        setRewardChoiceModal(null);
                      }}
                      className="group bg-neutral-950 border border-neutral-800 p-6 rounded-3xl hover:border-blue-500 transition-all text-left"
                    >
                       <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-500 group-hover:bg-blue-500 group-hover:text-white transition-all">
                             <TrendingUp size={24} />
                          </div>
                          <div>
                             <h4 className="font-black italic uppercase tracking-tight">Debt-Free Pass</h4>
                             <p className="text-[9px] text-neutral-500 font-bold uppercase">Clear all active DB debt</p>
                          </div>
                       </div>
                    </button>

                    <button 
                      onClick={() => {
                        claimReward(rewardChoiceModal, 'warning_revoke');
                        setRewardChoiceModal(null);
                      }}
                      className="group bg-neutral-950 border border-neutral-800 p-6 rounded-3xl hover:border-red-500 transition-all text-left"
                    >
                       <div className="flex items-center gap-4 mb-3">
                          <div className="p-3 bg-red-500/10 rounded-2xl text-red-500 group-hover:bg-red-500 group-hover:text-white transition-all">
                             <ShieldAlert size={24} />
                          </div>
                          <div>
                             <h4 className="font-black italic uppercase tracking-tight">Judicial Mercy</h4>
                             <p className="text-[9px] text-neutral-500 font-bold uppercase">Revoke 1 Integrity Warning</p>
                          </div>
                       </div>
                    </button>
                    
                    <button 
                      onClick={() => setRewardChoiceModal(null)}
                      className="mt-4 w-full py-4 text-[10px] font-black text-neutral-600 uppercase tracking-widest hover:text-white transition-colors"
                    >
                       Decide Later
                    </button>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
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
                   section: (currentUser?.role === 'monitor' ? 'MONITORING' : 'GLOBAL') as AnnouncementSection 
                 });
               }}>
                  <div>
                    <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Notice Type</label>
                    <div className="grid grid-cols-3 gap-3">
                       {['GLOBAL', 'MONITORING', 'RESOLVING'].map((s) => {
                         const isDisabled = currentUser?.role === 'monitor' && s === 'GLOBAL';
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
