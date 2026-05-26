import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Database, Download, Trash2, Search, 
  ChevronDown, ChevronUp, AlertTriangle, ShieldCheck,
  ArrowUpRight, ArrowDownRight, History, FileText,
  UserCheck, Activity, CheckCircle2, CloudFog
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import * as XLSX from 'xlsx';

type DataTab = 'registry' | 'activity' | 'validations' | 'backup';

export default function MasterDataPanel() {
  const { 
    users, transactions, debts, activityLogs, 
    announcements, resolvingDeck, anonymousComplaints,
    debtAdjustments, groupPosts, resetSystem 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<DataTab>('registry');
  const [search, setSearch] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.username || '').toLowerCase().includes((search || '').toLowerCase())
    ).sort((a,b) => (a.username || '').localeCompare(b.username || ''));
  }, [users, search]);

  const filteredLogs = useMemo(() => {
    return activityLogs.filter(l => {
      const username = users.find(u => u.id === l.userId)?.username || l.userId || '';
      const action = l.action || '';
      const s = (search || '').toLowerCase();
      return username.toLowerCase().includes(s) || action.toLowerCase().includes(s);
    }).sort((a,b) => {
      const timeA = new Date(a.timestamp?.toDate?.() || a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp?.toDate?.() || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [activityLogs, search, users]);

  const validatedTransactions = useMemo(() => {
    return transactions.filter(t => t.validatedBy).sort((a,b) => (b.validatedAt || '').localeCompare(a.validatedAt || ''));
  }, [transactions]);

  const handleExportAndReset = async () => {
    try {
      setIsResetting(true);
      
      // 1. Prepare Data for Excel
      const wb = XLSX.utils.book_new();
      
      // Users Sheet
      const usersData = users.map(u => ({
        ID: u.id,
        Username: u.username,
        Role: u.role,
        IntegrityLVL: u.integrityLevel,
        IntegrityScore: u.integrityScore,
        WarningLevel: u.warningCount,
        DebtOwed: u.debtOwed,
        DebtToMe: u.debtToMe,
        CommunityService: u.communityServicesNeeded,
        IsRemoved: u.isPermanentlyRemoved
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(usersData), "Users");
      
      // Transactions Sheet
      const txData = transactions.map(t => ({
        ID: t.id,
        Lender: users.find(u => u.id === t.senderId)?.username || t.senderId,
        Borrower: users.find(u => u.id === t.askerId)?.username || t.askerId,
        Pages: t.pages,
        Debt: t.debt,
        Status: t.status,
        IsCommunityService: t.isCommunityService,
        Timestamp: t.createdAt?.toDate?.() || t.createdAt
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(txData), "Transactions");
      
      // Ledger Sheet
      const ledgerData = debts.map(d => ({
        ID: d.id,
        User1: users.find(u => u.id === d.user1Id)?.username || d.user1Id,
        User2: users.find(u => u.id === d.user2Id)?.username || d.user2Id,
        Balance: d.netBalance,
        UpdatedAt: d.updatedAt
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ledgerData), "Ledger");

      // Warnings Sheet
      try {
        const { getDocs, collectionGroup } = await import('firebase/firestore');
        const { db } = await import('../firebase');
        const warningsSnap = await getDocs(collectionGroup(db, 'warnings'));
        const warningsData = warningsSnap.docs.map(d => {
          const data = d.data();
          const target = users.find(u => d.ref.path.includes(u.id));
          return {
            ID: d.id,
            TargetUser: target?.username || 'Unknown',
            Level: data.level,
            Reason: data.reason,
            IssuedBy: users.find(u => u.id === data.issuedBy)?.username || data.issuedBy,
            Timestamp: data.timestamp
          };
        });
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(warningsData), "Warnings");
      } catch (e) {
        console.warn("Could not export detailed warnings sheet (Index might be missing).");
      }
      
      // Resolving Deck Sheet
      const resolvingData = resolvingDeck.map(c => ({
        ID: c.id,
        Description: c.description,
        Involved: c.involvedUsers.join(', '),
        Status: c.status,
        CreatedBy: users.find(u => u.id === c.createdBy)?.username || c.createdBy,
        Timestamp: c.timestamp
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(resolvingData), "Resolving Deck");

      // Anonymous Complaints Sheet
      const complData = (anonymousComplaints || []).map(ac => ({
        ID: ac.id,
        Message: ac.message,
        Category: ac.category || 'General',
        CreatedAt: ac.createdAt,
        Status: ac.status,
        Source: ac.source,
        AssignedTo: users.find(u => u.id === ac.assignedTo)?.username || ac.assignedTo || 'Unassigned',
        InternalNotes: ac.internalNotes || ''
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(complData), "Anonymous Complaints");

      // Activity Logs Sheet
      const logsData = activityLogs.map(l => ({
        ID: l.id,
        Worker: users.find(u => u.id === l.userId)?.username || l.userId,
        Action: l.action,
        Details: l.details,
        Timestamp: l.timestamp
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(logsData), "Activity Logs");

      // Announcements Sheet
      const annData = announcements.map(a => ({
        ID: a.id,
        Title: a.title,
        Section: a.section,
        Author: users.find(u => u.id === a.authorId)?.username || a.authorId,
        Posted: a.timestamp,
        Expires: a.expiresAt
      }));
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(annData), "Announcements");

      // Export file
      XLSX.writeFile(wb, `DebtFlow_MasterData_Backup_${new Date().toISOString().split('T')[0]}.xlsx`);

      // 2. Clear Collections
      await resetSystem();
      
      alert("System Reset Successfully. All data exported to Excel.");
      setShowConfirm(false);
    } catch (error) {
      console.error("Master Reset Error:", error);
      alert("Error during reset. Check console.");
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-lg shadow-blue-500/5">
            <Database size={28} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tight uppercase">Master Data</h1>
            <p className="text-neutral-500 text-[10px] font-black mt-1 uppercase tracking-widest">Authority Core & Persistent Records</p>
          </div>
        </div>

        <div className="flex bg-neutral-950 p-1 rounded-2xl border border-neutral-800">
          {(['registry', 'activity', 'validations', 'backup'] as DataTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSearch('');
              }}
              className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              {tab.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'registry' && (
          <motion.section 
            key="registry"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
          >
            <div className="p-8 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <UserCheck className="text-blue-500" size={20} />
                <h2 className="text-xl font-bold italic">Operative Registry</h2>
                <span className="bg-neutral-800 text-neutral-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase">{users.length} Records</span>
              </div>
              
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Scan directory..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-all font-medium italic" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950/50">
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Status</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 text-center">Integrity Matrix</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 text-center">Financial Load</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 text-right">Audit Depth</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredUsers.map(user => {
                    const userTransactions = transactions.filter(t => t.senderId === user.id || t.askerId === user.id);
                    return (
                      <tr key={user.id} className="hover:bg-neutral-800/20 transition-colors group">
                        <td className="px-8 py-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 bg-neutral-800 rounded-xl flex items-center justify-center font-black text-neutral-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                               {user.username[0].toUpperCase()}
                             </div>
                             <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-neutral-100 italic">@{user.username}</span>
                                  {user.role !== 'user' && <ShieldCheck size={12} className="text-blue-500" />}
                                </div>
                                <span className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">{user.role}</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col items-center gap-1">
                             <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm
                               ${user.integrityLevel === 0 ? 'bg-green-500/20 text-green-500' : 
                                 user.integrityLevel < 3 ? 'bg-yellow-500/20 text-yellow-500' : 
                                 'bg-red-500/20 text-red-500'}
                             `}>
                               LVL {user.integrityLevel}
                             </div>
                             <div className="text-[9px] text-neutral-600 font-black uppercase italic">
                               {user.warningCount} Infractions
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6">
                          <div className="flex flex-col items-center gap-1">
                             <div className="flex items-center gap-2">
                               <ArrowUpRight size={12} className="text-green-500" />
                               <span className="text-xs font-black text-green-500">{user.debtToMe} DB</span>
                             </div>
                             <div className="flex items-center gap-2">
                               <ArrowDownRight size={12} className="text-red-500" />
                               <span className="text-xs font-black text-red-500">{user.debtOwed} DB</span>
                             </div>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800 italic">
                             {userTransactions.length} OPS
                           </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {activeTab === 'activity' && (
          <motion.section 
            key="activity"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
          >
            <div className="p-8 border-b border-neutral-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <Activity className="text-orange-500" size={20} />
                <h2 className="text-xl font-bold italic">Activity Intelligence</h2>
                <span className="bg-neutral-800 text-neutral-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase">{activityLogs.length} Events</span>
              </div>
              
              <div className="relative group w-full md:w-64">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-orange-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  placeholder="Filter logs..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-12 pr-4 py-3 text-sm focus:outline-none focus:border-orange-500 transition-all font-medium italic" 
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950/50">
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Operative</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Action Matrix</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Time Segment</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 text-right">Deployment Area</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {filteredLogs.map(log => (
                    <tr key={log.id || Math.random().toString()} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="px-8 py-6">
                        <span className="font-bold text-neutral-100 italic">@{users.find(u => u.id === log.userId)?.username || log.userId}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-blue-400 bg-blue-500/5 px-2 py-1 rounded border border-blue-500/10 uppercase tracking-widest">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-mono text-neutral-500 italic">
                          {log.timestamp?.toDate?.() ? log.timestamp.toDate().toLocaleString() : new Date().toLocaleString()}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">
                          {log.location || 'SYSTEM'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {activeTab === 'validations' && (
          <motion.section 
            key="validations"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden"
          >
            <div className="p-8 border-b border-neutral-800">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-green-500" size={20} />
                <h2 className="text-xl font-bold italic">Validation Records</h2>
                <span className="bg-neutral-800 text-neutral-400 text-[10px] font-black px-2 py-1 rounded-lg uppercase">{validatedTransactions.length} Verified</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-neutral-950/50">
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Transaction ID</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Participants</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Value</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Validator</th>
                    <th className="px-8 py-5 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 text-right">Verification Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/50">
                  {validatedTransactions.map(tx => (
                    <tr key={tx.id} className="hover:bg-neutral-800/20 transition-colors">
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-mono text-neutral-500 italic">#{tx.id.substring(0, 8)}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-green-500 font-bold italic">@{users.find(u => u.id === tx.senderId)?.username}</span>
                          <span className="text-neutral-600 font-black">→</span>
                          <span className="text-blue-500 font-bold italic">@{users.find(u => u.id === tx.askerId)?.username}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-neutral-100">{tx.debt} DB</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/5 px-2 py-1 rounded italic">
                          @{tx.validatedBy}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <span className="text-[10px] font-mono text-neutral-600 italic">
                          {tx.validatedAt ? new Date(tx.validatedAt).toLocaleString() : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.section>
        )}

        {activeTab === 'backup' && (
          <motion.section 
            key="backup"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="bg-neutral-900 border border-neutral-800 p-12 rounded-[3rem] text-center space-y-8">
               <div className="w-24 h-24 bg-red-600/10 rounded-full flex items-center justify-center text-red-500 mx-auto border-2 border-red-500/20 shadow-[0_0_50px_rgba(220,38,38,0.1)]">
                 <CloudFog size={48} />
               </div>
               <div className="max-w-md mx-auto space-y-4">
                 <h2 className="text-3xl font-black italic uppercase tracking-tighter">Emergency Purge Cycle</h2>
                 <p className="text-neutral-400 text-sm leading-relaxed italic">
                   Initiating this protocol will export all system data to an encrypted Excel matrix and permanently excise all database collections.
                 </p>
               </div>
               
               <button 
                onClick={() => setShowConfirm(true)}
                disabled={isResetting}
                className="inline-flex items-center gap-4 px-10 py-6 bg-red-600 hover:bg-red-500 text-white font-black rounded-3xl transition-all shadow-2xl shadow-red-600/20 uppercase tracking-[0.2em] text-xs disabled:opacity-50"
              >
                <Trash2 size={20} />
                Execute Global Archive & Wipe
              </button>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
               <div className="bg-neutral-950 border border-neutral-800 p-8 rounded-[2rem] space-y-2">
                 <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">Ledger Size</p>
                 <p className="text-2xl font-black italic text-neutral-100">{debts.length} Strings</p>
               </div>
               <div className="bg-neutral-950 border border-neutral-800 p-8 rounded-[2rem] space-y-2">
                 <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">Total Operations</p>
                 <p className="text-2xl font-black italic text-neutral-100">{transactions.length} Verified</p>
               </div>
               <div className="bg-neutral-950 border border-neutral-800 p-8 rounded-[2rem] space-y-2">
                 <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest italic">Intelligence Depth</p>
                 <p className="text-2xl font-black italic text-neutral-100">{activityLogs.length} Events</p>
               </div>
            </div>
          </motion.section>
        )}
      </AnimatePresence>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirm && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-xl bg-neutral-950 border-2 border-red-600/30 rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_-20px_rgba(220,38,38,0.3)]"
            >
              <div className="p-10 text-center">
                <div className="w-20 h-20 bg-red-600/20 rounded-full flex items-center justify-center text-red-500 mx-auto mb-8 animate-pulse">
                  <AlertTriangle size={48} />
                </div>
                <h3 className="text-3xl font-black italic mb-4">CRITICAL SYSTEM RESET</h3>
                <p className="text-neutral-400 leading-relaxed mb-8">
                  You are about to export all community records and <span className="text-red-500 font-bold uppercase">PERMANENTLY WIPE</span> all collections.
                  This includes transactions, ledgers, profiles, and logs. This action is <span className="text-white font-bold italic">irreversible</span>.
                </p>
                
                <div className="p-6 bg-neutral-900 border border-neutral-800 rounded-3xl mb-8 text-left">
                   <p className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.2em] mb-3">Safe Protocol Active:</p>
                   <ul className="text-xs text-neutral-200 space-y-2 list-disc list-inside">
                     <li>Current administrator session remains valid.</li>
                     <li>Excel backup will be generated immediately.</li>
                     <li>System state resets to timestamp zero.</li>
                   </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                  <button 
                    onClick={() => setShowConfirm(false)}
                    className="flex-1 py-4 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 font-black rounded-2xl transition-all uppercase tracking-widest text-xs"
                  >
                    Abort Protocol
                  </button>
                  <button 
                    onClick={handleExportAndReset}
                    disabled={isResetting}
                    className="flex-1 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl transition-all shadow-lg shadow-red-600/20 uppercase tracking-widest text-xs flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isResetting ? (
                      <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Download size={18} />
                    )}
                    Confirm & Execute
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
