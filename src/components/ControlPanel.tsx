import React, { useState } from 'react';
import { useStore, UserProfile, UserRole } from '../store';
import { 
  Users, ShieldCheck, User as UserIcon, Search, 
  Settings, AlertCircle, Clock, CheckCircle2, ShieldAlert, Shield, 
  Terminal, Activity, Eye, Ban, Check, X, ShieldX, UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ControlPanel() {
  const { 
    users, 
    currentUser, 
    updateUserRole, 
    updateSpecialOpsAccess,
    pendingAccountRequests,
    approvePendingRequest,
    rejectPendingRequest,
    toggleUserSuspension,
    updateUserStats,
    activityLogs
  } = useStore();

  const [activeTab, setActiveTab] = useState<'members' | 'validation' | 'audits'>('members');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<string | null>(null);
  
  // Custom confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    userId: string;
    username: string;
    oldRole: UserRole;
    newRole: UserRole;
  } | null>(null);

  // Selected User Details Modal State
  const [viewingUser, setViewingUser] = useState<UserProfile | null>(null);

  // Editable stats for selected user
  const [editIntegrity, setEditIntegrity] = useState<number>(100);
  const [editWarnings, setEditWarnings] = useState<number>(0);

  React.useEffect(() => {
    if (viewingUser) {
      setEditIntegrity(viewingUser.integrity ?? viewingUser.integrityScore ?? 100);
      setEditWarnings(viewingUser.warningCount ?? viewingUser.warnings ?? 0);
    }
  }, [viewingUser]);

  const filteredUsers = users.filter(user => 
    (user.username || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  const pendingRequests = (pendingAccountRequests || []).filter(req => req.status === 'pending');

  const handleRoleUpdate = async (userId: string, newRole: UserRole) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    
    setUpdatingId(userId);
    setErrorStatus(null);
    setSuccessId(null);
    
    try {
      await updateUserRole(userId, newRole);
      setSuccessId(userId);
      setTimeout(() => setSuccessId(null), 3000);
    } catch (error: any) {
      console.error("Role assignment failed:", error);
      setErrorStatus(error.message || "Role amendment rejected by ledger.");
      setTimeout(() => setErrorStatus(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    setUpdatingId(requestId);
    setErrorStatus(null);
    try {
      await approvePendingRequest(requestId);
    } catch (error: any) {
      console.error("Approval failed:", error);
      setErrorStatus(error.message || "Failed to approve credential request.");
      setTimeout(() => setErrorStatus(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRejectRequest = async (requestId: string) => {
    if (!window.confirm("Are you sure you want to REJECT this registration request?")) return;
    setUpdatingId(requestId);
    setErrorStatus(null);
    try {
      await rejectPendingRequest(requestId);
    } catch (error: any) {
      console.error("Rejection failed:", error);
      setErrorStatus(error.message || "Failed to reject request.");
      setTimeout(() => setErrorStatus(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleToggleSuspension = async (userId: string) => {
    setUpdatingId(userId);
    setErrorStatus(null);
    try {
      await toggleUserSuspension(userId);
    } catch (error: any) {
      console.error("Suspension switch failed:", error);
      setErrorStatus(error.message || "Lead lock change failed.");
      setTimeout(() => setErrorStatus(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-neutral-950/20 border border-neutral-900 rounded-3xl">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black uppercase tracking-widest text-neutral-200">Clearance Mismatch</h2>
        <p className="text-neutral-500 mt-2 max-w-sm text-xs font-medium">The Sovereign Control Panel holds command-level nodes. Your user account does not possess sovereign administration permissions.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Panel */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6 pb-6 border-b border-neutral-900">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-red-500 tracking-[0.3em]">
            <Shield size={12} className="text-red-500 animate-pulse" />
            Sovereign Admin Mode
          </div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase text-neutral-150 mt-1 flex items-center gap-3">
            Control Panel <span className="text-neutral-700">/</span> <span className="text-red-500 shadow-sm">{activeTab === 'members' ? 'Registry' : activeTab === 'validation' ? 'Validation' : 'Audit Logs'}</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-wider text-[10px] mt-1.5 italic">
            DebtFlow Sovereign Network Ledger Administration
          </p>
        </div>

        {/* Search Field for Active Member Table */}
        {activeTab === 'members' && (
          <div className="relative w-full lg:w-80 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-600 group-focus-within:text-red-500 transition-colors" size={16} />
            <input 
              type="text"
              placeholder="Query register by username or uid..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-950 border border-neutral-900 rounded-2xl pl-11 pr-4 py-3 text-xs text-neutral-300 outline-none focus:border-red-500/40 focus:ring-1 focus:ring-red-500/10 transition-all font-mono"
            />
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex bg-neutral-950 p-1 rounded-2xl border border-neutral-900 max-w-xl gap-1">
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'members'
              ? 'bg-neutral-900 border border-neutral-800 text-neutral-100 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40'
          }`}
        >
          <Users size={14} />
          Members
          <span className="ml-1 px-1.5 py-0.5 bg-neutral-900/80 text-neutral-500 rounded text-[9px] font-mono font-bold">
            {users.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('validation')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer relative ${
            activeTab === 'validation'
              ? 'bg-neutral-900 border border-neutral-800 text-red-500 shadow-[0_0_20px_rgba(239,68,68,0.05)]'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40'
          }`}
        >
          <UserCheck size={14} />
          Validation
          {pendingRequests.length > 0 && (
            <span className="px-1.5 py-0.5 bg-red-650 text-white rounded-full text-[9px] font-black animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.4)]">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`flex-1 py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all cursor-pointer ${
            activeTab === 'audits'
              ? 'bg-neutral-900 border border-neutral-800 text-neutral-100 shadow-[0_0_15px_rgba(255,255,255,0.02)]'
              : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/40'
          }`}
        >
          <Terminal size={14} />
          System Audits
        </button>
      </div>

      {/* Toast Alert Banner */}
      <AnimatePresence>
        {errorStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-red-950/20 border border-red-950 rounded-2xl flex items-center gap-3 text-red-400 text-xs font-bold"
          >
            <ShieldAlert size={16} />
            <span>{errorStatus}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Rendering Switch */}
      {activeTab === 'members' && (
        <div className="space-y-6">
          {/* Cyberpunk Instructions Ribbon */}
          <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] bg-red-500 h-full" />
            <div className="flex items-start gap-3">
              <ShieldAlert size={16} className="text-red-500 mt-0.5 animate-pulse" />
              <div>
                <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">Operational Warning</p>
                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                  Active database mutation is enabled. Suspension halts ledger write access instantly. Warnings, clearance scoring, and Special Ops properties reflect on-the-fly across live endpoints.
                </p>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl relative">
            <div className="overflow-x-auto relative">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-900/30">
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Operator Name</th>
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Rank / Clearance</th>
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Stat Metric</th>
                    <th className="px-6 py-5 text-center text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Special Ops</th>
                    <th className="px-6 py-5 text-right text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Admin Operations</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  <AnimatePresence mode="popLayout">
                    {filteredUsers.map((user) => {
                      const isSelf = user.id === currentUser.id;
                      
                      return (
                        <motion.tr 
                          key={user.id}
                          layout
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="group hover:bg-neutral-900/10 transition-all duration-150"
                        >
                          {/* Name Col */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 bg-neutral-900 rounded-xl flex items-center justify-center text-neutral-500 border relative overflow-hidden group-hover:border-red-500/20 transition-all ${
                                user.role === 'admin' ? 'border-red-500/20' :
                                user.role === 'monitor' ? 'border-orange-500/25' : 'border-neutral-850'
                              }`}>
                                <UserIcon size={16} className={
                                  user.role === 'admin' ? 'text-red-500' :
                                  user.role === 'monitor' ? 'text-orange-400' : 'text-neutral-400'
                                } />
                                {user.status === 'suspended' && (
                                  <div className="absolute inset-0 bg-red-650/30 flex items-center justify-center text-red-500 backdrop-blur-[1px]">
                                    <Ban size={12} className="text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <p className={`font-black uppercase tracking-tight text-xs ${
                                    user.status === 'suspended' ? 'text-neutral-600 line-through' : 'text-neutral-200'
                                  }`}>
                                    @{user.username}
                                  </p>
                                  {isSelf && (
                                    <span className="px-1 py-0.2 bg-neutral-900 text-neutral-500 rounded text-[6px] font-black uppercase tracking-widest">SOLE_ADMIN</span>
                                  )}
                                  {user.status === 'suspended' && (
                                    <span className="px-1.5 py-0.2 bg-red-950/40 text-red-500 rounded text-[6px] font-black uppercase tracking-widest border border-red-500/20">SUSPENDED</span>
                                  )}
                                </div>
                                <p className="text-[8px] text-neutral-600 font-mono uppercase mt-0.5">
                                  REG: {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'PRE-UPGRADE'}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Rank Badge Col */}
                          <td className="px-6 py-5">
                            <div className="flex items-center gap-2">
                              {user.role === 'admin' && (
                                <span className="px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)] select-none">
                                  🛡️ Admin
                                </span>
                              )}
                              {user.role === 'monitor' && (
                                <span className="px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)] select-none">
                                  ⚖️ Monitor
                                </span>
                              )}
                              {(!user.role || user.role === 'user') && (
                                <span className="px-2.5 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border bg-neutral-900 border-neutral-800 text-neutral-400 select-none">
                                  👤 Standard
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Stat Metrics */}
                          <td className="px-6 py-5">
                            <div className="space-y-0.5">
                              <p className="text-[9px] text-neutral-450 uppercase font-black">
                                INTEGRITY: <span className={user.integrity !== undefined && user.integrity < 60 ? 'text-red-500' : 'text-green-500'}>{user.integrity ?? 100}%</span>
                              </p>
                              <p className="text-[8px] text-neutral-600 font-mono">
                                WARNINGS: {user.warningCount || user.warnings || 0}
                              </p>
                            </div>
                          </td>

                          {/* Special Ops Toggle */}
                          <td className="px-6 py-5 text-center">
                            <div className="inline-flex flex-col items-center gap-1">
                              <button
                                disabled={updatingId === user.id}
                                onClick={async () => {
                                  try {
                                    setUpdatingId(user.id);
                                    await updateSpecialOpsAccess(user.id, !user.specialOpsAccess);
                                  } catch (err: any) {
                                    setErrorStatus(`Special ops update failed: ${err.message}`);
                                    setTimeout(() => setErrorStatus(null), 4000);
                                  } finally {
                                    setUpdatingId(null);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all border font-mono cursor-pointer ${
                                  user.specialOpsAccess
                                    ? 'bg-red-950/20 border-red-500/30 text-red-400 hover:bg-neutral-900 hover:text-neutral-500'
                                    : 'bg-neutral-900 border-neutral-850 hover:bg-neutral-850 text-neutral-500 hover:text-neutral-300'
                                }`}
                              >
                                {user.specialOpsAccess ? "ACTIVE SPECIAL OPS" : "UNAUTHORIZED"}
                              </button>
                            </div>
                          </td>

                          {/* Administrative Actions */}
                          <td className="px-6 py-5 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* View Profile details */}
                              <button
                                onClick={() => setViewingUser(user)}
                                className="p-2 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 rounded-xl hover:text-white border border-neutral-850 transition-colors cursor-pointer"
                                title="View Comprehensive Node Details"
                              >
                                <Eye size={12} />
                              </button>

                              {/* Reassign rank picker */}
                              <div className="flex bg-neutral-950 p-[3px] border border-neutral-900 rounded-xl gap-0.5">
                                {(['user', 'monitor', 'admin'] as const).map((r) => {
                                  const isActive = (user.role || 'user') === r;
                                  return (
                                    <button
                                      key={r}
                                      disabled={isSelf || updatingId === user.id}
                                      onClick={() => {
                                        setConfirmModal({
                                          userId: user.id,
                                          username: user.username,
                                          oldRole: (user.role || 'user') as UserRole,
                                          newRole: r as UserRole
                                        });
                                      }}
                                      className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all disabled:opacity-20 cursor-pointer ${
                                        isActive
                                          ? r === 'admin' ? 'bg-red-500/10 border border-red-500/20 text-red-500 font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                            : r === 'monitor' ? 'bg-orange-500/10 border border-orange-500/20 text-orange-400 font-extrabold'
                                            : 'bg-neutral-900 border border-neutral-800 text-neutral-300 font-extrabold'
                                          : 'text-neutral-600 hover:text-neutral-400'
                                      }`}
                                    >
                                      {r === 'user' ? 'Standard' : r}
                                    </button>
                                  );
                                })}
                              </div>

                              {/* Toggle Suspension Lock */}
                              <button
                                disabled={isSelf || updatingId === user.id}
                                onClick={() => handleToggleSuspension(user.id)}
                                className={`px-2.5 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all border disabled:opacity-10 cursor-pointer ${
                                  user.status === 'suspended'
                                    ? 'bg-green-950/25 text-green-500 border-green-500/20 hover:bg-green-950/40'
                                    : 'bg-red-950/20 text-red-500 border-red-500/20 hover:bg-red-950/40'
                                }`}
                              >
                                {user.status === 'suspended' ? 'UNSUSPEND' : 'SUSPEND'}
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="p-20 text-center space-y-4">
                 <div className="w-12 h-12 bg-neutral-900 rounded-3xl flex items-center justify-center text-neutral-600 border border-neutral-850 mx-auto">
                    <Users size={20} />
                 </div>
                 <p className="text-neutral-500 font-bold uppercase tracking-widest italic text-xs">Registry search mismatch.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'validation' && (
        <div className="space-y-6">
          <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] bg-red-500 h-full" />
            <div className="flex items-start gap-3">
              <CheckCircle2 size={16} className="text-red-500 mt-0.5 animate-pulse" />
              <div>
                <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">Operational Validation Workflow</p>
                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                  New users requesting network clearance are queued below. Approving a request generates their authentic credentials on the primary Firebase domain, initializes their user profile schema, and activates their session capabilities. Rejecting burns the request securely.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-900 rounded-[2rem] overflow-hidden shadow-2xl">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-neutral-900 bg-neutral-900/30">
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Requested Handle</th>
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Generated Email</th>
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Target Status</th>
                    <th className="px-6 py-5 text-left text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Creation Date</th>
                    <th className="px-6 py-5 text-right text-[9px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Clearance Approval</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-900">
                  <AnimatePresence mode="popLayout">
                    {pendingRequests.map((req) => (
                      <motion.tr 
                        key={req.id}
                        layout
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="group hover:bg-neutral-900/10"
                      >
                        <td className="px-6 py-5 font-black text-xs text-neutral-100 uppercase">
                          @{req.username}
                        </td>
                        <td className="px-6 py-5 text-xs text-neutral-500 font-mono">
                          {req.generatedEmail}
                        </td>
                        <td className="px-6 py-5">
                          <span className={`px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                            req.requestedRole === 'Monitor' 
                              ? 'bg-orange-500/10 border-orange-500/30 text-orange-400' 
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400'
                          }`}>
                            {req.requestedRole} Request
                          </span>
                        </td>
                        <td className="px-6 py-5 text-xs font-mono text-neutral-600">
                          {req.createdAt ? new Date(req.createdAt).toLocaleString() : 'PENDING TIME'}
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex justify-end gap-2.5">
                            <button
                              disabled={updatingId === req.id}
                              onClick={() => handleRejectRequest(req.id)}
                              className="px-3.5 py-1.5 bg-neutral-900 hover:bg-red-950/20 text-neutral-500 hover:text-red-500 border border-neutral-850 hover:border-red-500/20 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer"
                            >
                              Reject Request
                            </button>
                            <button
                              disabled={updatingId === req.id}
                              onClick={() => handleApproveRequest(req.id)}
                              className="px-4 py-1.5 bg-red-650 hover:bg-red-500 text-white shadow-md shadow-red-950 rounded-xl text-[9px] font-black uppercase tracking-wider transition-colors flex items-center gap-1.5 cursor-pointer"
                            >
                              {updatingId === req.id ? (
                                <Clock size={10} className="animate-spin text-white" />
                              ) : (
                                <Check size={10} />
                              )}
                              Approve Ledger
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>

            {pendingRequests.length === 0 && (
              <div className="p-20 text-center space-y-4">
                <div className="w-12 h-12 bg-neutral-900 rounded-3xl flex items-center justify-center text-neutral-600 border border-neutral-850 mx-auto">
                  <ShieldCheck size={20} className="text-green-500" />
                </div>
                <p className="text-neutral-500 font-bold uppercase tracking-widest italic text-xs">All account requests onboarded. Queue is empty.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'audits' && (
        <div className="space-y-6">
          <div className="p-4 bg-neutral-950 border border-neutral-900 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-[3px] bg-red-500 h-full" />
            <div className="flex items-start gap-4">
              <Terminal size={16} className="text-red-500 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">Administrative Audit Trail</p>
                <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
                  The logs below track sovereignty adjustments, approvals, and security warning changes in real-time. This trail acts as the immutable record of system governance.
                </p>
              </div>
            </div>
          </div>

          {/* Audit Logs Terminal */}
          <div className="bg-neutral-950 border border-neutral-900 rounded-[2rem] p-6 shadow-2xl relative">
            <div className="flex items-center gap-2 mb-4 text-xs font-mono font-bold uppercase tracking-widest text-neutral-500 pb-4 border-b border-neutral-900">
              <Activity size={12} className="text-red-500" />
              SYSTEM LOG CONTROLLER INSTANCE: SECURITYADMIN_LEVEL_3
            </div>

            <div className="font-mono text-[10px] leading-relaxed p-4 bg-black/50 border border-neutral-900 rounded-2xl max-h-[400px] overflow-y-auto space-y-3.5 custom-scrollbar text-neutral-300">
              {activityLogs && activityLogs.length > 0 ? (
                activityLogs.map((log) => (
                  <div key={log.id} className="border-b border-neutral-900/40 pb-2 flex flex-col md:flex-row justify-between md:items-start gap-2">
                    <div>
                      <span className="text-red-500/70 font-semibold uppercase tracking-wider">{`[${log.action || 'EVENT'}]`}</span>
                      <span className="text-neutral-405 font-medium ml-2">{typeof log.details === 'string' ? log.details : JSON.stringify(log.details)}</span>
                    </div>
                    <div className="text-neutral-600 text-[8px] whitespace-nowrap self-end md:self-start">
                      {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'UTC BLOCK TIME'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-neutral-700 py-10 py-16 uppercase italic">NO ADMINISTRATIVE SYSTEM ACTIVITY LOGGED</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Viewing User Details Modal popup */}
      <AnimatePresence>
        {viewingUser && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border border-neutral-900 rounded-3xl p-8 max-w-lg w-full relative max-h-[85vh] overflow-y-auto"
            >
              <div className="flex justify-between items-center pb-4 border-b border-neutral-900 mb-6">
                <div className="flex items-center gap-2.5">
                  <UserIcon size={16} className="text-neutral-400" />
                  <h3 className="text-sm font-black uppercase text-neutral-100 tracking-wider">
                    OPERATOR METADATA CARD
                  </h3>
                </div>
                <button 
                  onClick={() => setViewingUser(null)}
                  className="p-1.5 hover:bg-neutral-900 rounded-lg text-neutral-500 hover:text-white transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-900">
                    <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Username</p>
                    <p className="text-xs font-black text-neutral-200 uppercase mt-1">@{viewingUser.username}</p>
                  </div>
                  <div className="bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-900">
                    <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Operator Role</p>
                    <p className="text-xs font-black text-neutral-200 uppercase mt-1">{viewingUser.role || 'user'}</p>
                  </div>
                  <div className="bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-900">
                    <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Account Status</p>
                    <p className="text-xs font-black text-neutral-200 uppercase mt-1">{viewingUser.status || 'active'}</p>
                  </div>
                  <div className="bg-neutral-900/40 p-3.5 rounded-xl border border-neutral-900 col-span-2">
                    <p className="text-[8px] text-neutral-600 font-black uppercase tracking-widest">Secure Hex UID</p>
                    <p className="text-xs font-mono text-neutral-300 mt-1 select-all">{viewingUser.id}</p>
                  </div>
                </div>

                {/* Sovereign Mutators */}
                <div className="p-4 bg-neutral-950/80 border-2 border-red-500/20 rounded-2xl space-y-4 shadow-[0_0_20px_rgba(239,68,68,0.05)]">
                  <p className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-1.5 italic">
                    <Settings size={12} className="animate-spin text-red-500" />
                    SOVEREIGN STATISTICS AMENDMENTS
                  </p>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Integrity Mutator */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-450 uppercase">Integrity Score (0-100%)</label>
                      <input 
                        type="number" 
                        min="0"
                        max="100"
                        value={editIntegrity}
                        onChange={(e) => setEditIntegrity(Math.max(0, Math.min(100, parseInt(e.target.value) || 0)))}
                        className="w-full bg-neutral-900 border border-neutral-805 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-red-500/40"
                      />
                    </div>

                    {/* Warnings Mutator */}
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-neutral-450 uppercase">Warnings Counter</label>
                      <input 
                        type="number" 
                        min="0"
                        max="10"
                        value={editWarnings}
                        onChange={(e) => setEditWarnings(Math.max(0, Math.min(10, parseInt(e.target.value) || 0)))}
                        className="w-full bg-neutral-900 border border-neutral-805 rounded-xl px-4 py-2.5 text-xs font-mono font-bold text-neutral-100 focus:outline-none focus:border-red-500/40"
                      />
                    </div>
                  </div>

                  <button
                    onClick={async () => {
                      try {
                        await updateUserStats(viewingUser.id, editIntegrity, editWarnings);
                        setViewingUser(null);
                      } catch (err: any) {
                        setErrorStatus(err.message || "Mutation failed.");
                        setTimeout(() => setErrorStatus(null), 5000);
                      }
                    }}
                    className="w-full py-3 bg-red-650 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-[0_0_15px_rgba(239,68,68,0.2)] border border-red-650 cursor-pointer"
                  >
                    COMMIT SOVEREIGN MUTATION
                  </button>
                </div>

                <div className="pt-4 border-t border-neutral-900">
                  <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-2">RAW DATABASE DOC PROFILE</p>
                  <pre className="p-4 bg-black/60 border border-neutral-900 rounded-2xl text-[9px] text-neutral-400 font-mono overflow-x-auto select-all max-h-[120px]">
                    {JSON.stringify({
                      ...viewingUser,
                      createdAt: viewingUser.createdAt ? 'Timestamp Record' : undefined
                    }, null, 2)}
                  </pre>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Cyberpink Confirmation Modal Popup */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border-2 border-red-500/40 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-[0_0_35px_rgba(239,68,68,0.1)] animate-in"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-1/2 w-full translate-y-[-100%] animate-[scan_3s_linear_infinite] pointer-events-none" />
              
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-500/20 shadow-[0_0_12px_rgba(239,68,68,0.1)]">
                <ShieldAlert size={20} className="animate-pulse" />
              </div>

              <h3 className="text-sm font-black uppercase text-neutral-100 tracking-wider mb-2 italic">
                SET SECURITY RANK CLEARENCE?
              </h3>
              
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-6 select-text">
                Confirm role reassignment of <span className="text-red-400 font-extrabold">@{confirmModal.username}</span> from <span className="text-neutral-500 capitalize">{confirmModal.oldRole}</span> to <span className="text-red-400 font-extrabold uppercase">{confirmModal.newRole === 'user' ? 'Standard' : confirmModal.newRole}</span>? This takes action instantly across all active nodes.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-neutral-800 cursor-pointer"
                >
                  ABORT SECURELY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleUpdate(confirmModal.userId, confirmModal.newRole);
                    setConfirmModal(null);
                  }}
                  className="flex-1 py-3 bg-red-650 hover:bg-red-505 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-950/20 transition-all border border-red-650 cursor-pointer"
                >
                  ENACT SHIFT
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
