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
    currentUser,
    users, transactions, debts, activityLogs, 
    announcements, resolvingDeck, anonymousComplaints,
    debtAdjustments, groupPosts, resetSystem 
  } = useStore();
  
  const [activeTab, setActiveTab] = useState<DataTab>('registry');
  const [search, setSearch] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // Advanced activity log filters
  const [filterRole, setFilterRole] = useState<string>('all');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterDate, setFilterDate] = useState<string>('all'); // all, today, 3days, 7days, 30days
  const [filterLocation, setFilterLocation] = useState<string>('all');

  const filteredUsers = useMemo(() => {
    return users.filter(u => 
      (u.username || '').toLowerCase().includes((search || '').toLowerCase())
    ).sort((a,b) => (a.username || '').localeCompare(b.username || ''));
  }, [users, search]);

  const filteredLogs = useMemo(() => {
    return (activityLogs || []).filter(l => {
      // 1. Restricted Module logs check (only visible to admins with specialOpsAccess)
      if (l.location === 'Restricted Module') {
        if (!currentUser || currentUser.role !== 'admin' || currentUser.specialOpsAccess !== true) {
          return false;
        }
      }

      // 2. Search query alignment
      const s = (search || '').toLowerCase();
      const username = l.username || users.find(u => u.id === l.userId)?.username || l.userId || '';
      const action = l.activityType || l.action || '';
      const desc = l.description || '';
      const loc = l.location || '';
      
      const matchSearch = s === '' ||
        username.toLowerCase().includes(s) ||
        action.toLowerCase().includes(s) ||
        desc.toLowerCase().includes(s) ||
        loc.toLowerCase().includes(s);

      if (!matchSearch) return false;

      // 3. Role filtration
      if (filterRole !== 'all') {
        const logRole = l.role || users.find(u => u.id === l.userId)?.role || 'user';
        if (logRole !== filterRole) return false;
      }

      // 4. Severity filtration
      if (filterSeverity !== 'all') {
        if (l.severity !== filterSeverity) return false;
      }

      // 5. Section/location filtration
      if (filterLocation !== 'all') {
        if (l.location !== filterLocation) return false;
      }

      // 6. Date window alignment
      if (filterDate !== 'all') {
        const logTime = new Date(l.timestamp?.toDate?.() || l.timestamp || 0).getTime();
        const now = Date.now();
        if (filterDate === 'today') {
          const startOfToday = new Date().setHours(0,0,0,0);
          if (logTime < startOfToday) return false;
        } else if (filterDate === '3days') {
          if (logTime < now - 3 * 24 * 60 * 60 * 1000) return false;
        } else if (filterDate === '7days') {
          if (logTime < now - 7 * 24 * 60 * 60 * 1000) return false;
        } else if (filterDate === '30days') {
          if (logTime < now - 30 * 24 * 60 * 60 * 1000) return false;
        }
      }

      return true;
    }).sort((a,b) => {
      const timeA = new Date(a.timestamp?.toDate?.() || a.timestamp || 0).getTime();
      const timeB = new Date(b.timestamp?.toDate?.() || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
  }, [activityLogs, search, users, filterRole, filterSeverity, filterLocation, filterDate, currentUser]);

  const validatedTransactions = useMemo(() => {
    return transactions.filter(t => t.validatedBy).sort((a,b) => (b.validatedAt || '').localeCompare(a.validatedAt || ''));
  }, [transactions]);

  const locations = useMemo(() => {
    const list = new Set<string>();
    (activityLogs || []).forEach(l => {
      if (l.location) {
        if (l.location === 'Restricted Module') {
          if (currentUser?.role === 'admin' && currentUser?.specialOpsAccess === true) {
            list.add(l.location);
          }
        } else {
          list.add(l.location);
        }
      }
    });
    return Array.from(list).sort();
  }, [activityLogs, currentUser]);

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
            className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl"
          >
            {/* Header with live operational heartbeat */}
            <div className="p-8 border-b border-neutral-800 bg-neutral-950/40 flex flex-col xl:flex-row xl:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-500"></span>
                  </div>
                  <h2 className="text-xl font-bold tracking-tight text-neutral-100 flex items-center gap-2 italic">
                    <Activity size={18} className="text-amber-500" />
                    INTELLIGENCE TELEMETRY FEED
                  </h2>
                  <span className="bg-neutral-850 border border-neutral-800 text-neutral-400 text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider">
                    {filteredLogs.length} SECURED RECORDS
                  </span>
                </div>
                <p className="text-xs text-neutral-500 max-w-xl">
                  Platform telemetry log compiling operational audit histories, clearance modifications, and ledger entries in real time.
                </p>
              </div>

              {/* Dynamic search bar */}
              <div className="relative group w-full xl:w-72">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-amber-500 transition-colors" size={16} />
                <input 
                  type="text" 
                  placeholder="Query by action, tag, or description..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-amber-500 transition-all font-mono italic text-neutral-200" 
                />
              </div>
            </div>

            {/* Advanced filtering panel */}
            <div className="p-6 bg-neutral-950/20 border-b border-neutral-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Role filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black tracking-widest text-neutral-500 uppercase">Operative Role</label>
                <select
                  value={filterRole}
                  onChange={(e) => setFilterRole(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-805 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Clearances</option>
                  <option value="user">User Clearance</option>
                  <option value="monitor">Monitor Sovereignty</option>
                  <option value="admin">Administrator High Office</option>
                </select>
              </div>

              {/* Severity filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black tracking-widest text-neutral-500 uppercase">Anomaly Severity</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-805 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Severities</option>
                  <option value="info">Info (Standard Ops)</option>
                  <option value="warning">Warning (Elevated Alerts)</option>
                  <option value="critical">Critical (Integrity Breaches)</option>
                </select>
              </div>

              {/* Location filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black tracking-widest text-neutral-400 uppercase">Deployment Area</label>
                <select
                  value={filterLocation}
                  onChange={(e) => setFilterLocation(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-805 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Subsystems</option>
                  {locations.map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>

              {/* Date window filter */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black tracking-widest text-neutral-400 uppercase">Temporal Window</label>
                <select
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-805 rounded-xl px-4 py-2.5 text-xs font-semibold text-neutral-300 focus:outline-none focus:border-amber-500 cursor-pointer"
                >
                  <option value="all">All Historic Periods</option>
                  <option value="today">Today (Cycle Start)</option>
                  <option value="3days">Last 72 Hours</option>
                  <option value="7days">Last 7 Solar Cycles</option>
                  <option value="30days">Last 30 Solar Cycles</option>
                </select>
              </div>
            </div>

            {/* Feed command terminal list */}
            <div className="divide-y divide-neutral-800/60 max-h-[500px] overflow-y-auto font-mono text-xs">
              {filteredLogs.length === 0 ? (
                <div className="p-12 text-center text-neutral-500 space-y-2 italic">
                  <p className="text-sm font-bold uppercase tracking-wider text-neutral-600">No Telemetry Matches Found</p>
                  <p className="text-xs">Adjust filter matrices to scan other quadrants.</p>
                </div>
              ) : (
                filteredLogs.map((log, index) => {
                  const logTimeStr = log.timestamp?.toDate?.() 
                    ? log.timestamp.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) 
                    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                  
                  const logDateStr = log.timestamp?.toDate?.() 
                    ? log.timestamp.toDate().toLocaleDateString() 
                    : new Date().toLocaleDateString();

                  // Define severity colors & glow metrics
                  let badgeColors = 'text-blue-400 bg-blue-500/5 border-blue-500/20';
                  let rowBorderColor = 'hover:border-l-blue-500 border-l-transparent';
                  if (log.severity === 'critical') {
                    badgeColors = 'text-red-400 bg-red-400/10 border-red-500/30 font-extrabold animate-pulse';
                    rowBorderColor = 'hover:border-l-red-500 border-l-transparent';
                  } else if (log.severity === 'warning') {
                    badgeColors = 'text-amber-500 bg-amber-500/5 border-amber-500/25 font-bold';
                    rowBorderColor = 'hover:border-l-amber-500 border-l-transparent';
                  }

                  // Retrieve detailed username
                  const resolvedUser = users.find(u => u.id === log.userId);
                  const logUsername = log.username || resolvedUser?.username || log.userId || 'system';
                  
                  // Role Badge coloring
                  let roleTagColor = 'text-neutral-400 border-neutral-800';
                  if (log.role === 'admin') {
                    roleTagColor = 'text-red-400 border-red-900/30 bg-red-950/20';
                  } else if (log.role === 'monitor') {
                    roleTagColor = 'text-amber-400 border-amber-900/30 bg-amber-950/20';
                  }

                  return (
                    <div 
                      key={log.id || `activity-item-${index}`} 
                      className={`p-5 hover:bg-neutral-850/30 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 transition-all duration-200 ${rowBorderColor}`}
                    >
                      {/* Left: Time tracker & operative user */}
                      <div className="flex flex-wrap items-center gap-3 md:w-[70%]">
                        <span className="text-[10px] text-neutral-500 bg-neutral-950 border border-neutral-805 px-2.5 py-1 rounded-md font-mono" title={logDateStr}>
                          [{logTimeStr}]
                        </span>

                        <div className="flex items-center gap-1.5 bg-neutral-950/50 px-2 py-0.5 rounded border border-neutral-850">
                          <span className="font-bold text-neutral-200 italic">
                            @{logUsername}
                          </span>
                          <span className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded border ${roleTagColor}`}>
                            {log.role || resolvedUser?.role || 'user'}
                          </span>
                        </div>

                        {/* Mid-right: Actual Action description sentence */}
                        <span className="text-neutral-300 font-sans pl-1">
                          {log.description || log.action || log.activityType}
                        </span>
                      </div>

                      {/* Right: Badge type and location track */}
                      <div className="flex items-center justify-between md:justify-end gap-4 font-mono text-[10px] md:w-[30%]">
                        <span className={`px-2 py-1.5 rounded border ${badgeColors} tracking-widest uppercase text-[9px]`}>
                          {log.severity || 'info'}
                        </span>
                        <span className="text-neutral-500 bg-neutral-950 border border-neutral-805 px-3 py-1.5 rounded-lg text-right font-black tracking-wider uppercase">
                          {log.location || 'SYSTEM'}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
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
