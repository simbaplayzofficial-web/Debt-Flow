import React, { useEffect, useState } from 'react';
import { useStore, AnnouncementSection } from '../store';
import { AnonymousChatTerminal } from './AnonymousChatTerminal';
import { 
  CheckCircle2, XCircle, Clock, User, FileText, ShieldCheck, 
  AlertCircle, TrendingUp, Layout, Scale, ShieldAlert, Star, 
  Shield, Megaphone, Send, Trash2, ListChecks, Activity, Users,
  Gavel, RotateCcw, AlertTriangle, Search, Settings, Filter, Calendar,
  Archive, FileEdit, UserCheck, EyeOff, Lock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type WorkspaceTab = 'validations' | 'bill_filing' | 'complaints' | 'enforcement';

export const MonitorWorkspace: React.FC = () => {
  // In the MonitorWorkspace component:
  // Instead of:
  // const { anonymousComplaints, ... } = useStore();
  // We need to fetch and manage complaints in the component based on the new local state.
  // ...
  const { 
    transactions, users, approveTransaction, rejectTransaction, 
    currentUser, roleRequests, rolesConfig, updateRolesConfig, resolveRoleRequest,
    // REMOVED anonymousComplaints, updateAnonymousComplaintStatus, etc.
    activityLogs, resolvingDeck, resolveBill,
    announcements, postAnnouncement, deleteAnnouncement, debtAdjustments,
    systemStatus, updateSystemStatus, issueWarning, revokeWarning, updateWarningRules, deleteUser,
    warningRules, allWarnings,
    // Add new methods:
    claimComplaint, resolveComplaint, sendComplaintMessage
  } = useStore();
  
  // ...
  // When rendering the list:
  // Use localComplaints instead of anonymousComplaints
  // When claiming:
  // await claimComplaint(complaintId);
  // When resolving:
  // await resolveComplaint(complaintId);
  // When sending message:
  // await sendComplaintMessage(complaintId, message);

  const [activeTab, setActiveTab] = useState<WorkspaceTab>('validations');
  const [loading, setLoading] = useState<string | null>(null);
  const [resolutionModal, setResolutionModal] = useState<string | null>(null);

  // Complaints Workspace States
  const [complaintsSubTab, setComplaintsSubTab] = useState<'pending' | 'under_review' | 'resolved'>('pending');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string | null>(null);
  const [tempNotes, setTempNotes] = useState('');
  const [verdictInput, setVerdictInput] = useState('');
  const [isNotesSaving, setIsNotesSaving] = useState(false);
  const [localComplaints, setLocalComplaints] = useState<Complaint[]>([]);
  const [complaintsLoading, setComplaintsLoading] = useState(true);

  // Realtime Listener for Complaints
  useEffect(() => {
    setComplaintsLoading(true);
    const q = query(
      collection(db, "complaints"),
      where("status", "==", complaintsSubTab),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const complaintData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Complaint[];
      setLocalComplaints(complaintData);
      setComplaintsLoading(false);
    }, (error) => {
      console.error("Complaint listener failed:", error);
      setComplaintsLoading(false);
    });

    return () => unsubscribe();
  }, [complaintsSubTab]);

  // Bill Filing states
  const [billTitle, setBillTitle] = useState('');
  const [billCategory, setBillCategory] = useState('Governance');
  const [billDescription, setBillDescription] = useState('');
  const [billPriority, setBillPriority] = useState('Medium');
  const [isFiling, setIsFiling] = useState(false);

  // Enforcement states
  const [enforcementSubTab, setEnforcementSubTab] = useState<'disputes' | 'warnings'>('disputes');
  const [warnUser, setWarnUser] = useState('');
  const [warnReason, setWarnReason] = useState('');
  const [isSubmittingWarn, setIsSubmittingWarn] = useState(false);
  const [editingRules, setEditingRules] = useState<any[]>([]);

  useEffect(() => {
    if (activeTab === 'enforcement' && currentUser?.role !== 'admin') {
      setActiveTab('validations');
    }
  }, [activeTab, currentUser]);

  useEffect(() => {
    if (warningRules.length > 0 && editingRules.length === 0) {
      setEditingRules(warningRules);
    }
  }, [warningRules]);

  const handleIssueWarning = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!warnUser || !warnReason || isSubmittingWarn) return;
    setIsSubmittingWarn(true);
    try {
      await issueWarning(warnUser, 0, warnReason);
      setWarnUser('');
      setWarnReason('');
      alert("WARNING LOGGED: User integrity adjusted.");
    } catch (err: any) {
      alert(`ENFORCEMENT FAILED: ${err.message}`);
    } finally {
      setIsSubmittingWarn(false);
    }
  };

  const handleUpdateRules = async () => {
    try {
      await updateWarningRules(editingRules);
      alert("DIRECTIVES UPDATED: System rules synchronized.");
    } catch (err: any) {
      alert(`UPDATE FAILED: ${err.message}`);
    }
  };

  const handleFileBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!billTitle || !billDescription || isFiling) return;
    setIsFiling(true);
    try {
      await useStore.getState().createBill(billTitle, billCategory, billDescription, billPriority);
      setBillTitle('');
      setBillDescription('');
      setBillCategory('Governance');
      setBillPriority('Medium');
      alert("LEGISLATIVE PROTOCOL INITIATED: Bill published.");
      setActiveTab('complaints'); // Redirect to complaints tab
    } catch (err: any) {
      alert(`FILING FAILED: ${err.message}`);
    } finally {
      setIsFiling(false);
    }
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'monitor' && currentUser?.role !== 'add_admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-neutral-500">
        <AlertCircle size={48} className="mb-4 opacity-20" />
        <p className="text-sm font-bold uppercase tracking-widest">Access Restricted</p>
        <p className="text-[10px] mt-2 opacity-60">Monitors & Admins Only</p>
      </div>
    );
  }

  const pendingTransactions = transactions
    .filter(t => t.status === 'pending')
    .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));

  const pendingComplaintsCount = anonymousComplaints.filter(c => c.status === 'pending').length;
  const pendingCases = resolvingDeck.filter(c => c.status === 'under_investigation').length;
  const pendingDebts = debtAdjustments.filter(a => a.status === 'REQUESTED').length;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black italic tracking-tighter text-neutral-100 flex items-center gap-3">
             <Layout className="text-blue-500" size={32} />
             Council <span className="text-blue-500">Workspace</span>
          </h1>
          <p className="text-neutral-500 text-xs font-bold uppercase tracking-[0.2em] mt-2">
            Central Command & Validation Protocol
          </p>
        </div>
        
        <div className="flex gap-4 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
           <button 
             onClick={() => setActiveTab('bill_filing')}
             className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
           >
             <Send size={16} />
             <span className="text-[10px] font-black uppercase tracking-widest text-nowrap">File New Bill</span>
           </button>
           <div className="bg-neutral-900 border border-neutral-800 px-6 py-3 rounded-2xl flex-shrink-0">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-1 italic">Vitals State</p>
              <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${systemStatus?.emergencyLevel === 3 ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)] animate-pulse' : systemStatus?.emergencyLevel === 2 ? 'bg-orange-500' : 'bg-blue-500'}`} />
                 <p className={`text-xl font-black italic tracking-tighter uppercase ${systemStatus?.emergencyLevel === 3 ? 'text-red-500' : systemStatus?.emergencyLevel === 2 ? 'text-orange-500' : 'text-blue-500'}`}>
                    {systemStatus?.emergencyLevel === 3 ? 'CRITICAL' : systemStatus?.emergencyLevel === 2 ? 'HIGH ALERT' : 'SECURE'}
                 </p>
              </div>
           </div>
        </div>
      </header>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap gap-2 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl">
         {[
           { id: 'validations', label: 'Validations', icon: ListChecks, count: pendingTransactions.length + pendingDebts },
           { id: 'bill_filing', label: 'Bill Filing', icon: Send, count: 0 },
           { id: 'complaints', label: 'Complaints', icon: ShieldAlert, count: pendingComplaintsCount },
           ...(currentUser?.role === 'admin' ? [{ id: 'enforcement', label: 'Enforcement', icon: Gavel, count: pendingCases }] : []),
         ].map((t) => (
           <button
             key={t.id}
             onClick={() => setActiveTab(t.id as WorkspaceTab)}
             className={`flex-1 min-w-[200px] px-4 py-3 rounded-xl flex items-center justify-center gap-2 transition-all group ${
               activeTab === t.id 
                 ? 'bg-neutral-100 text-neutral-950 shadow-xl' 
                 : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900'
             }`}
           >
             <t.icon size={16} className={activeTab === t.id ? 'text-neutral-950' : 'group-hover:text-neutral-300'} />
             <span className="text-[10px] font-black uppercase tracking-widest">{t.label}</span>
             {t.count > 0 && (
               <span className={`ml-1 px-1.5 py-0.5 rounded text-[8px] font-black ${
                 activeTab === t.id ? 'bg-neutral-950 text-white' : 'bg-orange-500 text-white'
               }`}>
                 {t.count}
               </span>
             )}
           </button>
         ))}
      </div>

      <main className="min-h-[60vh]">
        <AnimatePresence mode="wait">
          {activeTab === 'validations' && (
            <motion.div 
              key="validations"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold tracking-tight italic flex items-center gap-2">
                  <ListChecks className="text-blue-500" />
                  Transaction Validations
                </h2>
              </div>
              
              <div className="grid gap-4">
                {pendingTransactions.map(tx => {
                  const sender = users.find(u => u.id === tx.senderId);
                  const asker = users.find(u => u.id === tx.askerId);
                  return (
                    <div key={tx.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 lg:p-8 relative overflow-hidden group">
                      <div className="flex flex-col lg:flex-row gap-8 items-center">
                        <div className="flex-1 w-full flex items-center justify-around bg-neutral-950/50 p-6 rounded-2xl border border-neutral-800/50">
                           <div className="text-center">
                              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 italic">Sender</p>
                              <div className="flex items-center justify-center gap-2">
                                 <User size={14} className="text-blue-500" />
                                 <span className="text-sm font-black text-neutral-100 italic">@{sender?.username || 'Unknown'}</span>
                              </div>
                           </div>
                           <TrendingUp size={24} className="text-neutral-800 mx-4" />
                           <div className="text-center">
                              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2 italic">Asker</p>
                              <div className="flex items-center justify-center gap-2">
                                 <User size={14} className="text-orange-500" />
                                 <span className="text-sm font-black text-neutral-100 italic">@{asker?.username || 'Unknown'}</span>
                              </div>
                           </div>
                        </div>

                        <div className="flex flex-col gap-1 text-center lg:text-left">
                           <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Recorded</p>
                           <p className="text-2xl font-black italic text-neutral-100 uppercase tracking-tighter">{tx.pages} Pages</p>
                           <p className="text-[9px] text-neutral-600 font-mono italic">
                             {new Date(tx.createdAt?.seconds * 1000).toLocaleString()}
                           </p>
                        </div>

                        <div className="bg-blue-600/10 border border-blue-600/20 px-8 py-4 rounded-2xl text-center">
                           <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 italic">Value</p>
                           <p className="text-3xl font-black italic text-blue-500 uppercase tracking-tighter">
                             {tx.isCommunityService ? '0 CS' : `${tx.debt} DB`}
                           </p>
                        </div>

                        <div className="flex gap-2 w-full lg:w-auto">
                           <button 
                             onClick={async () => {
                                setLoading(tx.id);
                                try {
                                  await approveTransaction(tx.id);
                                  alert("Transaction Approved.");
                                } catch (err: any) {
                                  alert(err.message);
                                }
                                setLoading(null);
                             }}
                             disabled={!!loading}
                             className="flex-1 lg:w-32 bg-neutral-100 hover:bg-white text-neutral-950 py-4 rounded-2xl flex flex-col items-center justify-center transition-all shadow-xl active:scale-95"
                           >
                             <CheckCircle2 size={24} className="mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-widest">Approve</span>
                           </button>
                           <button 
                             onClick={async () => {
                               if(confirm('Reject this transaction?')) {
                                 setLoading(tx.id);
                                 try {
                                   await rejectTransaction(tx.id);
                                   alert("Transaction Rejected.");
                                 } catch (err: any) {
                                   alert(err.message);
                                 }
                                 setLoading(null);
                               }
                             }}
                             disabled={!!loading}
                             className="flex-1 lg:w-32 bg-neutral-800 hover:bg-red-900 text-neutral-400 hover:text-red-500 border border-neutral-700 py-4 rounded-2xl flex flex-col items-center justify-center transition-all active:scale-95"
                           >
                             <XCircle size={24} className="mb-1" />
                             <span className="text-[9px] font-black uppercase tracking-widest">Reject</span>
                           </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {pendingTransactions.length === 0 && (
                  <div className="bg-neutral-900/30 border border-neutral-800 border-dashed rounded-[3rem] p-32 text-center">
                     <ShieldCheck size={64} className="mx-auto text-neutral-800 mb-6" />
                     <p className="text-neutral-600 text-sm font-black uppercase tracking-[0.3em] italic">Equilibrium maintained. Zero pending records.</p>
                  </div>
                )}
              </div>

              {/* Debt Adjustment Approvals */}
              <div className="pt-10 border-t border-neutral-800 space-y-6">
                <h2 className="text-xl font-bold tracking-tight italic flex items-center gap-2 text-green-500 font-sans">
                  <TrendingUp size={24} />
                  Debt Forgiveness Approvals
                </h2>
                <div className="grid md:grid-cols-2 gap-6">
                  {debtAdjustments.filter(a => a.status === 'REQUESTED').map(adj => {
                    const borrower = users.find(u => u.id === adj.borrowerId);
                    const lender = users.find(u => u.id === adj.lenderId);
                    return (
                      <div key={adj.id} className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl group transition-all hover:border-green-500/30 animate-pulse">
                        <p className="text-xs font-bold text-neutral-200 mb-2">
                          <span className="text-green-400">@{lender?.username}</span> requests forgiveness for <span className="text-blue-400">@{borrower?.username}</span>
                        </p>
                        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 mb-6 flex justify-between items-center">
                          <div>
                            <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1 italic">Forgiveness Amount</p>
                            <p className="text-2xl font-black italic tracking-tighter text-blue-500">{adj.amount} DB</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] text-neutral-500 font-bold uppercase mb-1 italic">Date Lodged</p>
                            <p className="text-[10px] text-neutral-400 font-mono italic">{new Date(adj.requestedAt).toLocaleDateString()}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 font-sans">
                          <button 
                            onClick={async () => { 
                              if (confirm("Approve adjustment?")) {
                                setLoading(adj.id);
                                try {
                                  await useStore.getState().approveDebtAdjustment(adj.id);
                                  alert("Adjustment Approved.");
                                } catch(err: any) {
                                  alert(err.message);
                                }
                                setLoading(null);
                              } 
                            }}
                            disabled={!!loading}
                            className="flex-1 py-3 bg-green-600 hover:bg-green-500 text-white text-[10px] font-black uppercase rounded-xl transition-all shadow-lg shadow-green-900/20 cursor-pointer text-center"
                          >
                            Approve
                          </button>
                          <button 
                            onClick={async () => { 
                              if (confirm("Reject adjustment?")) {
                                setLoading(adj.id);
                                try {
                                   await useStore.getState().rejectDebtAdjustment(adj.id);
                                   alert("Adjustment Rejected.");
                                } catch(err: any) {
                                  alert(err.message);
                                }
                                setLoading(null);
                              } 
                            }}
                            disabled={!!loading}
                            className="flex-1 py-3 bg-neutral-850 hover:bg-red-900 text-neutral-400 hover:text-red-500 border border-neutral-700 text-[10px] font-black uppercase rounded-xl transition-all cursor-pointer text-center"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {debtAdjustments.filter(a => a.status === 'REQUESTED').length === 0 && (
                    <div className="p-16 border border-neutral-800 border-dashed rounded-[3rem] text-center col-span-full bg-neutral-950/20">
                      <CheckCircle2 size={32} className="mx-auto text-neutral-800 mb-4 opacity-20" />
                      <p className="text-neutral-600 text-[11px] font-black uppercase tracking-widest italic">No pending adjustments.</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

           {activeTab === 'bill_filing' && (
            <motion.div
              key="bill_filing"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="max-w-4xl mx-auto"
            >
              <div className="bg-neutral-900 border border-neutral-800 rounded-[3rem] p-10 lg:p-16 relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                   <Send size={120} />
                </div>
                
                <header className="mb-12 space-y-4">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase text-blue-500 flex items-center gap-4">
                    <Megaphone size={32} />
                    Legislative Hub
                  </h2>
                  <p className="text-neutral-500 text-xs font-bold uppercase tracking-widest leading-relaxed">
                    Official Protocol for System Proposals, Policy Shifts, and Operational Directives.
                  </p>
                </header>

                <form onSubmit={handleFileBill} className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                  <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">Bill Title</label>
                    <input 
                      required
                      type="text"
                      value={billTitle}
                      onChange={e => setBillTitle(e.target.value)}
                      placeholder="e.g. Monitor Reform 01: Integrity Thresholds"
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-100 outline-none focus:border-blue-500 transition-all font-bold italic"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">Category</label>
                    <select 
                      value={billCategory}
                      onChange={e => setBillCategory(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-100 outline-none focus:border-blue-500 transition-all font-bold italic appearance-none cursor-pointer"
                    >
                      {['Governance', 'Economy', 'Warnings', 'Elections', 'Community Service', 'Monitor Reform'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">Priority Matrix</label>
                    <select 
                      value={billPriority}
                      onChange={e => setBillPriority(e.target.value)}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-100 outline-none focus:border-blue-500 transition-all font-bold italic appearance-none cursor-pointer"
                    >
                      {['Low', 'Medium', 'High', 'Emergency'].map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2 col-span-full">
                    <label className="text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-4">Detailed Description</label>
                    <textarea 
                      required
                      value={billDescription}
                      onChange={e => setBillDescription(e.target.value)}
                      placeholder="Draft the complete policy shift or operational change..."
                      className="w-full bg-neutral-950 border border-neutral-800 rounded-[2rem] px-6 py-6 text-sm text-neutral-100 outline-none focus:border-blue-500 transition-all font-medium italic min-h-[200px] resize-none"
                    />
                  </div>

                  <div className="col-span-full flex flex-col md:flex-row items-center gap-6 pt-4">
                    <div className="flex-1 space-y-1 text-center md:text-left">
                       <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest">Proposed By</p>
                       <p className="text-sm font-black text-blue-500 italic">@{currentUser?.username}</p>
                    </div>
                    <button 
                      type="submit"
                      disabled={isFiling}
                      className="w-full md:w-auto bg-neutral-100 hover:bg-white text-neutral-950 px-12 py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-2xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3"
                    >
                      {isFiling ? <RotateCcw size={16} className="animate-spin" /> : <ShieldCheck size={18} />}
                      Publish Official Bill
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {/* COMPLAINTS - Anonymous Black Box Workspace */}
          {activeTab === 'complaints' && (
            <motion.div
              key="complaints"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6 animate-in fade-in"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-neutral-850">
                <div>
                  <h2 className="text-2xl font-black tracking-tight italic flex items-center gap-2">
                    <ShieldCheck className="text-orange-500" />
                    Secure Complaints Desk
                  </h2>
                  <p className="text-[10px] text-neutral-500 font-mono tracking-wider uppercase mt-1">
                    Anonymous Transmission Portal
                  </p>
                </div>
                {/* Sub tabs matching pending, under_review, resolved, archived */}
                <div className="flex bg-neutral-900 p-1 border border-neutral-800 rounded-xl gap-1">
                  {(['pending', 'under_review', 'resolved', 'archived'] as const).map(tab => {
                    const count = anonymousComplaints.filter(c => c.status === tab).length;
                    return (
                      <button
                        key={tab}
                        onClick={() => {
                          setComplaintsSubTab(tab);
                          setSelectedComplaintId(null);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                          complaintsSubTab === tab
                            ? 'bg-orange-500/10 text-orange-400 border border-orange-500/20'
                            : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-955/40'
                        }`}
                      >
                        {tab.replace('_', ' ')}
                        {count > 0 && (
                          <span className="ml-1.5 px-1 py-0.5 bg-neutral-950 rounded text-[8px] font-mono text-neutral-400">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Master Split Grid */}
              <div className="grid lg:grid-cols-[1fr_400px] gap-8">
                {/* Complaints List Pane */}
                <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
                  {anonymousComplaints.filter(c => c.status === complaintsSubTab).length === 0 ? (
                    <div className="p-20 border border-dashed border-neutral-800 rounded-3xl text-center flex flex-col items-center justify-center bg-neutral-900/10">
                      <Lock size={32} className="text-neutral-700/50 mb-4 animate-pulse" />
                      <p className="text-[10px] font-black uppercase text-neutral-500 tracking-widest">No Transmissions</p>
                      <p className="text-[10px] text-neutral-600 mt-1 italic uppercase">Sub-deck currently unoccupied.</p>
                    </div>
                  ) : (
                    anonymousComplaints
                      .filter(c => c.status === complaintsSubTab)
                      .map(c => {
                        const assignedUser = users.find(u => u.id === c.assignedTo);
                        const isSelected = selectedComplaintId === c.id;
                        return (
                          <div
                            key={c.id}
                            onClick={() => {
                              setSelectedComplaintId(c.id);
                              setTempNotes(c.internalNotes || '');
                            }}
                            className={`p-6 rounded-2xl border transition-all duration-300 cursor-pointer text-left relative overflow-hidden group hover:shadow-lg ${
                              isSelected
                                ? 'bg-orange-500/5 border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.05)]'
                                : 'bg-neutral-900 border-neutral-800 hover:border-neutral-700'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-3">
                              <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 bg-neutral-950 rounded-md text-orange-400 border border-orange-500/10">
                                {c.category || 'General'}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] font-mono text-neutral-500">
                                  {new Date(c.createdAt).toLocaleDateString()}
                                </span>
                                <span className={`text-[7px] font-bold py-0.5 px-1 rounded uppercase select-none ${
                                  c.source?.includes('groups') ? 'bg-blue-600/10 text-blue-400' : 'bg-purple-600/10 text-purple-400'
                                }`}>
                                  {c.source === 'groups_blackbox' ? 'Groups' : 'Profile'}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-neutral-300 line-clamp-3 leading-relaxed mb-4">
                              {c.message}
                            </p>

                            <div className="flex items-center justify-between pt-3 border-t border-neutral-850">
                              <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-tighter">
                                Code ID: #{c.id.substring(0, 8)}
                              </span>
                              <span className="text-[9px] font-bold text-neutral-500 flex items-center gap-1">
                                <User size={10} className="text-neutral-600" />
                                {assignedUser ? `@${assignedUser.username}` : 'Unassigned'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                  )}
                </div>

                {/* Complaint Details Panel */}
                <aside className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 h-fit min-h-[400px] flex flex-col justify-between">
                  {selectedComplaintId ? (() => {
                    const complaint = anonymousComplaints.find(c => c.id === selectedComplaintId);
                    if (!complaint) return null;
                    const assignedUser = users.find(u => u.id === complaint.assignedTo);
                    const staffUsers = users.filter(u => u.role === 'admin' || u.role === 'monitor');

                    return (
                      <div className="space-y-6 flex-1 flex flex-col justify-between">
                        {/* Upper Details */}
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black text-orange-400 bg-orange-500/5 px-2.5 py-1 border border-orange-500/10 rounded-lg uppercase tracking-wider">
                              Category: {complaint.category || 'General'}
                            </span>
                            <span className="text-[8px] text-neutral-500 font-mono">
                              File Code ID: #{complaint.id.substring(0, 10)}
                            </span>
                          </div>

                          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-850">
                            <h4 className="text-[9px] font-mono font-bold text-neutral-600 uppercase mb-2">Original Anonymized Statement</h4>
                            <p className="text-xs text-neutral-300 leading-relaxed whitespace-pre-wrap select-text">
                              {complaint.message}
                            </p>
                          </div>

                          {/* Secure Assignment & Communications Line */}
                          {(() => {
                            const isLockedByOther = complaint.assignedMonitorId && complaint.assignedMonitorId !== currentUser?.id;
                            
                            if (isLockedByOther) {
                              return (
                                <div className="bg-red-950/20 border border-red-500/20 rounded-2xl p-5 text-center space-y-3 font-mono">
                                  <Lock size={18} className="text-red-500 mx-auto animate-pulse" />
                                  <h3 className="text-red-400 text-[10px] font-bold uppercase tracking-wider">SECURED LINE LOCKED</h3>
                                  <p className="text-[10px] text-neutral-400 leading-relaxed">
                                    This complaint is locked to coordinator <span className="text-red-400 font-bold">{complaint.assignedMonitorName || 'another staff monitor'}</span>. 
                                    Barred from intercepting transmissions.
                                  </p>
                                </div>
                              );
                            }

                            if (!complaint.assignedMonitorId) {
                              return (
                                <div className="bg-neutral-950 border border-neutral-850 rounded-2xl p-5 space-y-4 text-center">
                                  <ShieldAlert size={28} className="text-orange-500 mx-auto animate-pulse" />
                                  <div className="space-y-1">
                                    <h4 className="text-neutral-300 text-xs font-bold uppercase tracking-wider">Unclaimed Transmission</h4>
                                    <p className="text-[9px] text-neutral-500">Claim to establish secure anonymous correspondence line.</p>
                                  </div>
                                  <button
                                    onClick={async () => {
                                      await claimAnonymousComplaint(complaint.id);
                                    }}
                                    className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-[10px] uppercase font-bold tracking-widest font-mono rounded-xl transition-all shadow-md shadow-orange-500/10 cursor-pointer"
                                  >
                                    Claim Complaint
                                  </button>
                                </div>
                              );
                            }

                            return (
                              <div className="space-y-4">
                                <div className="p-3 bg-emerald-950/10 border border-emerald-500/10 rounded-xl flex items-center justify-between">
                                  <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                                    Correspondence Active
                                  </span>
                                  <span className="text-[8px] text-neutral-500 font-mono">
                                    Secured to you
                                  </span>
                                </div>

                                {!complaint.anonymousThreadId ? (
                                  <div className="bg-neutral-950 border border-neutral-850 rounded-xl p-4 text-center space-y-3">
                                    <p className="text-[9px] text-neutral-400">Establish a real-time anonymized link with complainant.</p>
                                    <button
                                      onClick={async () => {
                                        await openAnonymousLine(complaint.id);
                                      }}
                                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] uppercase tracking-widest font-bold rounded-xl transition-all cursor-pointer shadow-md shadow-emerald-600/10"
                                    >
                                      Open Anonymous Line
                                    </button>
                                  </div>
                                ) : (
                                  <div className="space-y-2">
                                    <label className="block text-[9px] font-black text-neutral-500 uppercase tracking-widest ml-1">
                                      Live Secure Chat Transceiver
                                    </label>
                                    <AnonymousChatTerminal threadId={complaint.id} senderType="monitor" />
                                  </div>
                                )}
                              </div>
                            );
                          })()}

                          {/* Notes Textarea */}
                          {complaint.assignedMonitorId === currentUser?.id && (
                            <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between ml-1">
                              <label className="text-[9px] font-black text-neutral-500 uppercase tracking-widest">
                                Internal Staff Notes
                              </label>
                              <span className="text-[8px] text-neutral-600 font-mono">Visible to Staff Only</span>
                            </div>
                            <textarea
                              value={tempNotes}
                              onChange={(e) => setTempNotes(e.target.value)}
                              placeholder="Add private investigation notes here..."
                              className="w-full bg-neutral-900 border border-neutral-800 rounded-xl p-3 text-xs text-neutral-300 h-24 max-h-32 resize-none focus:border-neutral-700 outline-none"
                            />
                            <button
                              onClick={async () => {
                                setIsNotesSaving(true);
                                try {
                                  await updateAnonymousComplaintNotes(complaint.id, tempNotes);
                                  alert("Notes synchronized with central ledger.");
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsNotesSaving(false);
                                }
                              }}
                              disabled={isNotesSaving}
                              className="w-full bg-neutral-800 hover:bg-neutral-750 text-neutral-300 border border-neutral-800 text-[9px] font-black py-2.5 rounded-lg uppercase tracking-wider transition-all"
                            >
                              {isNotesSaving ? 'Saving note...' : 'Synch Internal Notes'}
                            </button>
                          </div>
                          )}
                        </div>

                        {/* Status Mutation Actions */}
                        {complaint.assignedMonitorId === currentUser?.id && (
                          <div className="pt-4 border-t border-neutral-850 space-y-3">
                          <p className="text-[9px] font-black text-neutral-600 uppercase tracking-widest ml-1 text-center">
                            Workflow Enactments
                          </p>
                          <div className="grid grid-cols-2 gap-2">
                            {complaint.status !== 'under_review' && (
                              <button
                                onClick={async () => {
                                  await updateAnonymousComplaintStatus(complaint.id, 'under_review');
                                }}
                                className="py-2.5 bg-orange-600/10 border border-orange-500/20 text-orange-400 text-[9px] font-black uppercase rounded-lg hover:bg-orange-600 hover:text-white transition-all text-center"
                              >
                                Mark Review
                              </button>
                            )}
                            {complaint.status !== 'resolved' && (
                              <button
                                onClick={async () => {
                                  await updateAnonymousComplaintStatus(complaint.id, 'resolved');
                                }}
                                className="py-2.5 bg-green-600/10 border border-green-500/20 text-green-400 text-[9px] font-black uppercase rounded-lg hover:bg-green-600 hover:text-white transition-all text-center"
                              >
                                Resolve
                              </button>
                            )}
                            {complaint.status !== 'archived' && (
                              <button
                                onClick={async () => {
                                  await updateAnonymousComplaintStatus(complaint.id, 'archived');
                                }}
                                className="py-2.5 bg-neutral-800 border border-neutral-700 text-neutral-300 text-[9px] font-black uppercase rounded-lg hover:bg-neutral-700 transition-all text-center col-span-2"
                              >
                                Archive Complaint
                              </button>
                            )}
                          </div>

                          <button
                            onClick={async () => {
                              if (confirm("Are you absolutely certain you wish to purge this database file record? This action is non-reversible.")) {
                                await deleteAnonymousComplaint(complaint.id);
                                setSelectedComplaintId(null);
                                alert("Transmission purged completely.");
                              }
                            }}
                            className="w-full py-2 bg-red-600/10 border border-red-500/20 text-red-500 text-[9px] font-black uppercase rounded-lg hover:bg-red-600 hover:text-white transition-all text-center mt-2"
                          >
                            Delete / Purge
                          </button>
                        </div>
                        )}
                      </div>
                    );
                  })() : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center py-20 opacity-40">
                      <Lock size={32} className="text-neutral-700 mb-3" />
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] italic">Zero Node Selected</p>
                      <p className="text-[10px] text-neutral-600 italic mt-1 leading-normal">
                        Select an active transmission item on the left panel to execute staff workflow protocols.
                      </p>
                    </div>
                  )}
                </aside>
              </div>
            </motion.div>
          )}

          {/* ENFORCEMENT - Consolidated Resolving Deck & Warnings */}
          {activeTab === 'enforcement' && currentUser?.role === 'admin' && (
            <motion.div 
               key="enforcement"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="space-y-8"
            >
               {/* Sub-tab Navigation */}
               <div className="flex gap-4 p-1 bg-neutral-950 border border-neutral-800 rounded-2xl w-fit mx-auto">
                  <button 
                    onClick={() => setEnforcementSubTab('disputes')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      enforcementSubTab === 'disputes' 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Active Disputes
                  </button>
                  <button 
                    onClick={() => setEnforcementSubTab('warnings')}
                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                      enforcementSubTab === 'warnings' 
                        ? 'bg-red-600 text-white shadow-lg shadow-red-900/20' 
                        : 'text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    Warning & Enforcement
                  </button>
               </div>

               <AnimatePresence mode="wait">
                  {enforcementSubTab === 'disputes' ? (
                     <motion.div
                       key="disputes_panel"
                       initial={{ opacity: 0, x: -10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 10 }}
                       className="space-y-8"
                     >
                        <div className="grid lg:grid-cols-2 gap-8">
                           {/* Resolving Deck Functionality */}
                           <div className="space-y-6">
                              <h2 className="text-xl font-bold tracking-tight italic flex items-center gap-2">
                                 <Scale className="text-orange-500" />
                                 Ongoing Disputes
                              </h2>
                              <div className="space-y-4">
                                 {resolvingDeck.filter(c => c.status === 'under_investigation').map(c => (
                                    <div key={c.id} className="bg-neutral-900 border border-neutral-800 p-8 rounded-4xl group hover:border-orange-500/30 transition-all shadow-xl">
                                       <div className="flex justify-between items-start mb-6">
                                          <div className="flex items-center gap-3">
                                             <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
                                             <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest italic border border-orange-500/20 px-3 py-1 rounded-lg">Investigation Pulse</span>
                                          </div>
                                          <span className="text-[10px] text-neutral-600 font-mono italic">{new Date(c.timestamp).toLocaleDateString()}</span>
                                       </div>
                                       <p className="text-sm text-neutral-300 italic leading-relaxed mb-8 flex-1">"{c.description}"</p>
                                       <button 
                                          onClick={() => setResolutionModal(c.id)}
                                          className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-orange-900/20 transition-all active:scale-95 flex items-center justify-center gap-3"
                                       >
                                          <Scale size={16} />
                                          Initiate Resolution Matrix
                                       </button>
                                    </div>
                                 ))}
                                 {resolvingDeck.filter(c => c.status === 'under_investigation').length === 0 && (
                                    <div className="p-32 border border-neutral-800 border-dashed rounded-[3rem] text-center">
                                       <ShieldCheck size={48} className="mx-auto text-neutral-800 mb-6 opacity-20" />
                                       <p className="text-neutral-600 text-[11px] font-black uppercase tracking-widest italic">All disputes resolved.</p>
                                    </div>
                                 )}
                              </div>
                           </div>

                           {/* Enforcement Chronology / Log Investigation */}
                           <div className="space-y-6">
                              <h2 className="text-xl font-bold tracking-tight italic flex items-center gap-2">
                                 <Activity className="text-blue-500" />
                                 Log Investigation Audit
                              </h2>
                              <div className="bg-neutral-900 border border-neutral-800 rounded-[2.5rem] overflow-hidden">
                                 <div className="p-6 border-b border-neutral-800 bg-neutral-950/30">
                                    <span className="text-[10px] font-black uppercase text-neutral-500 tracking-widest italic">Seal & Log Records</span>
                                 </div>
                                 <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                                    {activityLogs.slice(0, 50).map((log, logIdx) => (
                                       <div key={log.id || `enforcement-log-${logIdx}`} className="p-6 border-b border-neutral-800/30 flex items-center justify-between hover:bg-white/[0.01] transition-all">
                                          <div className="space-y-1">
                                             <p className="text-xs text-neutral-200 font-bold italic">{log.action}</p>
                                             <div className="flex items-center gap-3">
                                                <p className="text-[9px] text-neutral-600 font-mono italic uppercase">{new Date(log.timestamp).toLocaleString()}</p>
                                                <span className="text-[8px] px-2 py-0.5 bg-neutral-950 text-neutral-500 rounded border border-neutral-800 uppercase font-black">{log.location || 'GLOBAL'}</span>
                                             </div>
                                          </div>
                                          <Shield size={14} className="text-neutral-700" />
                                       </div>
                                    ))}
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  ) : (
                     <motion.div
                       key="warnings_panel"
                       initial={{ opacity: 0, x: 10 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: -10 }}
                       className="space-y-8"
                     >
                        <div className="grid lg:grid-cols-2 gap-8">
                           {/* Issue Warning Form */}
                           <div className="space-y-6">
                              <h2 className="text-xl font-bold tracking-tight italic flex items-center gap-2">
                                 <AlertTriangle className="text-red-500" />
                                 Publish Enforcement Directive
                              </h2>
                              <section className="bg-neutral-900 border border-neutral-800 p-8 rounded-[2rem] shadow-xl relative overflow-hidden">
                                 <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
                                    <AlertTriangle size={64} />
                                 </div>
                                 <form onSubmit={handleIssueWarning} className="space-y-6 relative z-10">
                                    <div className="space-y-2">
                                       <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-2 italic">Subject Username</label>
                                       <input 
                                          type="text"
                                          value={warnUser}
                                          onChange={e => setWarnUser(e.target.value)}
                                          placeholder="e.g. simba"
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-6 py-4 text-sm text-neutral-100 outline-none focus:border-red-500 transition-all font-bold italic"
                                          required
                                       />
                                    </div>
                                    <div className="space-y-2">
                                       <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest ml-2 italic">Violation Narrative</label>
                                       <textarea 
                                          value={warnReason}
                                          onChange={e => setWarnReason(e.target.value)}
                                          placeholder="Provide specific infraction justification..."
                                          className="w-full bg-neutral-950 border border-neutral-800 rounded-[2rem] px-6 py-4 text-sm text-neutral-100 outline-none focus:border-red-500 transition-all font-medium italic resize-none h-32"
                                          required
                                       />
                                    </div>
                                    <button 
                                       type="submit"
                                       disabled={isSubmittingWarn}
                                       className="w-full bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-black py-5 rounded-2xl uppercase tracking-[0.2rem] text-xs transition-all shadow-xl shadow-red-900/20 flex items-center justify-center gap-3 active:scale-95 group"
                                    >
                                       {isSubmittingWarn ? <RotateCcw size={20} className="animate-spin" /> : <ShieldAlert size={18} className="group-hover:scale-110 transition-transform" />}
                                       Publish Enforcement
                                    </button>
                                 </form>
                              </section>
                           </div>

                           {/* Ruleset Config */}
                           <div className="space-y-8">
                              <div className="space-y-6">
                                 <div className="flex items-center justify-between">
                                    <h2 className="text-xl font-bold tracking-tight italic flex items-center gap-2 text-neutral-400">
                                       <Settings size={20} />
                                       Directives Ruleset
                                    </h2>
                                    {(currentUser?.role === 'admin' || currentUser?.role === 'add_admin') && (
                                       <button 
                                          onClick={handleUpdateRules}
                                          className="text-[10px] font-black uppercase text-blue-500 hover:text-white transition-colors"
                                       >
                                          Save Matrix
                                       </button>
                                    )}
                                 </div>
                                 <div className="bg-neutral-900/50 border border-neutral-800 p-6 rounded-[2rem] space-y-4">
                                    {editingRules.map((rule, idx) => (
                                       <div key={rule.level} className="bg-neutral-950 border border-neutral-800 p-5 rounded-2xl flex items-center gap-4">
                                          <div className="bg-neutral-900 px-3 py-1 rounded-lg border border-neutral-800">
                                             <p className="text-[10px] font-black italic text-orange-500 line-clamp-1">LV {rule.level}</p>
                                          </div>
                                          <input 
                                             value={rule.penalty}
                                             onChange={e => {
                                                const next = [...editingRules];
                                                next[idx].penalty = e.target.value;
                                                setEditingRules(next);
                                             }}
                                             placeholder="Penalty description..."
                                             className="flex-1 bg-transparent text-[10px] text-neutral-400 font-bold italic outline-none"
                                          />
                                          <div className="flex items-center gap-1 w-16">
                                             <input 
                                                type="number"
                                                value={rule.integrityDeduction}
                                                onChange={e => {
                                                   const next = [...editingRules];
                                                   next[idx].integrityDeduction = parseInt(e.target.value);
                                                   setEditingRules(next);
                                                }}
                                                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-2 py-1 text-[10px] text-red-500 font-black italic outline-none"
                                             />
                                             <span className="text-[8px] font-black italic text-neutral-600">%</span>
                                          </div>
                                       </div>
                                    ))}
                                 </div>
                              </div>

                              {/* Warning Registry Overlay */}
                              <div className="space-y-4">
                                 <h2 className="text-lg font-bold tracking-tight italic flex items-center gap-2">
                                    <Users className="text-orange-500" size={20} />
                                    Active Warnings Registry
                                 </h2>
                                 <div className="bg-neutral-900 border border-neutral-800 rounded-[2rem] overflow-hidden max-h-[300px] overflow-y-auto custom-scrollbar">
                                    <div className="space-y-1">
                                       {allWarnings.filter(w => !w.revokedBy).slice().reverse().map(w => (
                                          <div key={w.id} className="p-4 border-b border-neutral-800/50 flex items-center justify-between group hover:bg-white/[0.01]">
                                             <div className="space-y-1">
                                                <p className="text-xs font-black text-neutral-200 italic">@{users.find(u => u.id === w.targetId)?.username || 'sys'}</p>
                                                <p className="text-[9px] text-neutral-500 font-bold italic line-clamp-1">"{w.reason}"</p>
                                             </div>
                                             <div className="flex items-center gap-3">
                                                <span className="text-[8px] px-2 py-0.5 bg-red-950 text-red-500 rounded font-black italic">LV {w.level}</span>
                                                <button 
                                                   onClick={() => revokeWarning(w.targetId, w.id)}
                                                   className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-neutral-600 hover:text-green-500"
                                                   title="Revoke Warning"
                                                >
                                                   <XCircle size={14} />
                                                </button>
                                             </div>
                                          </div>
                                       ))}
                                       {allWarnings.filter(w => !w.revokedBy).length === 0 && (
                                          <div className="p-8 text-center text-neutral-600 italic text-[10px] font-black uppercase tracking-widest">
                                             Zero active warnings.
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                           </div>
                        </div>
                     </motion.div>
                  )}
               </AnimatePresence>
            </motion.div>
          )}
         </AnimatePresence>
      </main>

      {/* Resolution Modal */}
      {resolutionModal && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-2xl z-[200] flex items-center justify-center p-4">
           <motion.div 
             initial={{ scale: 0.9, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-[4rem] overflow-hidden"
           >
              <div className="p-12 space-y-10">
                 <div className="flex justify-between items-start">
                    <div>
                       <h3 className="text-3xl font-black italic tracking-tighter uppercase text-orange-500 flex items-center gap-3">
                          <Scale size={32} />
                          Resolution Interface
                       </h3>
                       <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.2em] mt-2 italic">Case ID: {resolutionModal}</p>
                    </div>
                    <button onClick={() => setResolutionModal(null)} className="p-4 bg-neutral-950 text-neutral-500 hover:text-white rounded-3xl border border-neutral-800 transition-all">
                       <XCircle size={32} />
                    </button>
                 </div>

                 <div className="grid md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                       <div className="bg-neutral-950 p-8 rounded-[3rem] border border-neutral-800 shadow-inner">
                          <p className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-4 italic">Original Deposition</p>
                          <p className="text-sm text-neutral-200 italic leading-relaxed">
                             "{resolvingDeck.find(d => d.id === resolutionModal)?.description}"
                          </p>
                       </div>
                       
                       <div className="bg-orange-500/5 p-8 rounded-[3rem] border border-orange-500/20">
                          <h4 className="text-[11px] font-black text-orange-500 uppercase tracking-widest mb-4 italic">System Recommendation</h4>
                          <p className="text-xs text-neutral-400 font-medium italic">Verify log chronologies before initiating judicial finality. Cross-reference with Validation Records in Master Data.</p>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h4 className="text-[11px] font-black text-neutral-500 uppercase tracking-widest ml-4 italic">Resolution Protocol</h4>
                       <div className="flex flex-col gap-4">
                          <button 
                             onClick={async () => {
                                await resolveBill(resolutionModal!, "PASSED");
                                setResolutionModal(null);
                                alert("BILL RESOLVED: Balance restored.");
                             }}
                             className="w-full py-6 bg-green-600 hover:bg-green-500 text-white font-black uppercase tracking-[0.2em] rounded-3xl shadow-xl shadow-green-900/20 transition-all active:scale-95 text-xs"
                          >
                             Validate & Restructure
                          </button>
                          <button 
                             onClick={async () => {
                                await resolveBill(resolutionModal!, "VETOED");
                                setResolutionModal(null);
                                alert("LOG EXPUNGED: Case dismissed.");
                             }}
                             className="w-full py-6 bg-neutral-800 hover:bg-neutral-700 text-neutral-400 font-black uppercase tracking-[0.2em] rounded-3xl transition-all active:scale-95 text-xs"
                          >
                             Expunge Record
                          </button>
                       </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>
      )}
    </div>
  );
};
