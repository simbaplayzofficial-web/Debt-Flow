import React, { useState } from 'react';
import { useStore, UserProfile, UserRole } from '../store';
import { 
  Users, ShieldCheck, User as UserIcon, Search, 
  Settings, Save, AlertCircle, Clock, CheckCircle2, ShieldAlert, Shield, Hammer
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ControlPanel() {
  const { users, currentUser, updateUserRole, updateSpecialOpsAccess } = useStore();
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

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.username || '').localeCompare(b.username || ''));

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
      setErrorStatus("Role amendment rejected by ledger.");
      setTimeout(() => setErrorStatus(null), 5000);
    } finally {
      setUpdatingId(null);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8">
        <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center text-red-500 mb-4 border border-red-500/20">
          <AlertCircle size={32} />
        </div>
        <h2 className="text-xl font-black uppercase text-neutral-200">Access Restricted</h2>
        <p className="text-neutral-500 mt-2 max-w-sm">The Control Panel is reserved for sovereign authorities. Your current clearance is insufficient.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header Pipeline */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-neutral-850">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase text-neutral-100 flex items-center gap-3">
            <Settings size={36} className="text-red-500" />
            Control Panel <span className="text-neutral-600">/</span> <span className="text-red-400">Roles</span>
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2 italic">
            Central Authority & Real-Time Role Governance
          </p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-red-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search registry by @username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-neutral-200 outline-none focus:border-red-500/40 transition-all shadow-inner placeholder-neutral-650"
          />
        </div>
      </div>

      {/* Cyberpunk Instructions Panel */}
      <div className="p-4 bg-neutral-950 border border-neutral-800 rounded-2xl relative overflow-hidden group">
        <div className="absolute top-0 left-0 w-1 p-[1px] bg-red-500 h-full shadow-[0_0_15px_rgba(239,68,68,0.5)]" />
        <div className="flex items-start gap-3">
          <ShieldAlert size={18} className="text-red-500 mt-0.5 animate-pulse" />
          <div>
            <p className="text-[10px] font-black uppercase text-red-500 tracking-[0.2em]">Operational Warning</p>
            <p className="text-[10px] text-neutral-400 leading-relaxed mt-1">
              Role amendments execute instantly across the decentralized network ledger. Affected operators’ navigation, capabilities, and system parameters align dynamically on next mutation request. For safety, admins cannot change their own roles.
            </p>
          </div>
        </div>
      </div>

      {/* Member Registry Table */}
      <div className="bg-neutral-950 border border-neutral-850 rounded-[2rem] overflow-hidden shadow-2xl relative">
        
        {/* Subtle scanline effect overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_60%,rgba(0,0,0,0.8)_100%)] opacity-30" />
        
        <div className="overflow-x-auto relative">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-850 bg-neutral-900/40">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Operator Name</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Current Rank</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Security Status</th>
                <th className="px-8 py-5 text-center text-[10px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Special Ops</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-neutral-500 tracking-[0.25em] italic">Authority reassignment</th>
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
                      className="group hover:bg-neutral-900/20 transition-all duration-150"
                    >
                      {/* Name Col */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className={`w-11 h-11 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-500 border relative overflow-hidden group-hover:border-red-500/20 transition-all ${
                            user.role === 'admin' ? 'border-red-500/10' :
                            user.role === 'monitor' ? 'border-orange-500/10' : 'border-neutral-800'
                          }`}>
                            <UserIcon size={20} className={
                              user.role === 'admin' ? 'text-red-500/60' :
                              user.role === 'monitor' ? 'text-orange-500/60' : 'text-blue-550/60'
                            } />
                            {user.status === 'suspended' && (
                              <div className="absolute inset-0 bg-red-600/20 backdrop-blur-[1px]" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className={`font-black uppercase tracking-tight italic text-xs ${
                                user.status === 'suspended' ? 'text-red-400 font-bold decoration-slice' : 'text-neutral-150'
                              }`}>
                                @{user.username}
                              </p>
                              {isSelf && (
                                <span className="px-1.5 py-0.5 bg-neutral-900 text-neutral-500 rounded text-[7px] font-black uppercase letter-spacing-[0.2em]">SELF</span>
                              )}
                            </div>
                            <p className="text-[9px] text-neutral-650 font-bold uppercase tracking-widest mt-1">
                              Registered: {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'LEGACY RECORD'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Rank Col with Custom Badges */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          {user.role === 'admin' && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-red-500/10 border-red-500/30 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.15)] select-none">
                              🛡️ Admin
                            </span>
                          )}
                          {user.role === 'monitor' && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-orange-500/10 border-orange-500/30 text-orange-400 shadow-[0_0_10px_rgba(249,115,22,0.15)] select-none">
                              ⚖️ Monitor
                            </span>
                          )}
                          {(!user.role || user.role === 'user') && (
                            <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border bg-blue-505/10 border-blue-500/20 text-blue-400 shadow-[0_0_10px_rgba(59,130,246,0.1)] select-none">
                              👤 Standard
                            </span>
                          )}

                          {user.requestedRole && user.requestedRole !== user.role && (
                            <div className="flex items-center gap-1.5 text-[8px] text-orange-400 font-mono font-bold uppercase italic animate-pulse">
                              <Clock size={10} />
                              Req: {user.requestedRole}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Status Col */}
                      <td className="px-8 py-5">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              user.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                              user.status === 'suspended' ? 'bg-red-500 animate-pulse' : 'bg-orange-500'
                            }`} />
                            <span className="text-[9px] font-black text-neutral-450 uppercase tracking-widest">{user.status}</span>
                          </div>
                          <p className="text-[8px] font-mono text-neutral-600 tracking-tighter uppercase select-text">
                            UID: {user.id.substring(0, 12)}...
                          </p>
                        </div>
                      </td>

                      {/* Special Ops Toggle Col */}
                      <td className="px-8 py-5 text-center">
                        <div className="inline-flex flex-col items-center gap-1">
                          {user.specialOpsAccess ? (
                            <span className="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-950/40 px-2 py-0.5 rounded border border-red-500/30 animate-pulse">
                              ● Cleared
                            </span>
                          ) : (
                            <span className="text-[8px] font-black uppercase tracking-widest text-neutral-600 bg-neutral-950/40 px-2 py-0.5 rounded border border-neutral-900 border-none select-none">
                              No Access
                            </span>
                          )}
                          <button
                            disabled={updatingId === user.id}
                            onClick={async () => {
                              try {
                                await updateSpecialOpsAccess(user.id, !user.specialOpsAccess);
                              } catch (err: any) {
                                alert(`Error amending access: ${err.message}`);
                              }
                            }}
                            className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-wider transition-all border font-mono cursor-pointer ${
                              user.specialOpsAccess
                                ? 'bg-neutral-900 border-neutral-800 hover:border-red-500/40 hover:text-red-405 text-neutral-450'
                                : 'bg-red-950/20 hover:bg-red-950/40 border-red-950 text-red-500'
                            }`}
                          >
                            {user.specialOpsAccess ? "Revoke" : "Grant"}
                          </button>
                        </div>
                      </td>

                      {/* Change Role Selection Controls */}
                      <td className="px-8 py-5 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <div className="flex bg-neutral-950 p-1 border border-neutral-850 rounded-xl gap-1">
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
                                  className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-wider transition-all ${
                                    isActive
                                      ? r === 'admin' ? 'bg-red-600/10 border border-red-500/20 text-red-500 font-extrabold shadow-[0_0_10px_rgba(239,68,68,0.1)]'
                                        : r === 'monitor' ? 'bg-orange-600/10 border border-orange-500/20 text-orange-400 font-extrabold shadow-[0_0_10px_rgba(249,115,22,0.1)]'
                                        : 'bg-blue-600/10 border border-blue-500/20 text-blue-400 font-extrabold shadow-[0_0_10px_rgba(59,130,246,0.1)]'
                                      : isSelf
                                        ? 'text-neutral-700 cursor-not-allowed opacity-30 text-[8px]'
                                        : 'text-neutral-500 hover:text-neutral-300 hover:bg-neutral-900/60'
                                  }`}
                                >
                                  {r === 'user' ? 'Standard' : r}
                                </button>
                              );
                            })}
                          </div>

                          <div className="w-6 flex items-center justify-center">
                            {updatingId === user.id ? (
                              <Clock size={12} className="animate-spin text-red-500" />
                            ) : successId === user.id ? (
                              <CheckCircle2 size={14} className="text-green-500" />
                            ) : null}
                          </div>
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
             <div className="w-16 h-16 bg-neutral-900 rounded-3xl flex items-center justify-center text-neutral-600 border border-neutral-850 mx-auto">
                <Users size={32} />
             </div>
             <p className="text-neutral-500 font-bold uppercase tracking-widest italic text-xs">Registry search mismatch.</p>
          </div>
        )}
      </div>

      {/* Cyberpunk Role Information Matrix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
        <div className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
              Standard Operator
           </p>
           <ul className="space-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
              <li>• initiate lent/payment transactions</li>
              <li>• full chatterbox intelligence access</li>
              <li>• participate in community groups</li>
              <li>• submit anonymous concern reports</li>
              <li>• zero command capabilities</li>
           </ul>
        </div>

        <div className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-orange-500/10 transition-colors" />
           <p className="text-[10px] font-black text-orange-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <span className="w-1.5 h-1.5 bg-orange-500 rounded-full shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
              Monitor Authority
           </p>
           <ul className="space-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
              <li>• inherit all standard operations</li>
              <li>• full secure complaints desk clearance</li>
              <li>• investigate & mutate anonymized complaints</li>
              <li>• moderate group communication feeds</li>
              <li>• restricted system configuration clearance</li>
           </ul>
        </div>

        <div className="bg-neutral-900/30 border border-neutral-850 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-red-500/10 transition-colors" />
           <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <span className="w-1.5 h-1.5 bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
              Admin Sovereignty
           </p>
           <ul className="space-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
              <li>• total database & config override access</li>
              <li>• instant real-time role amendments</li>
              <li>• approve and onboard pending user clearings</li>
              <li>• audit command histories and debug structures</li>
              <li>• direct and complete workspace clearance</li>
           </ul>
        </div>
      </div>

      {/* Cyberpunk Confirmation Modal Popup */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 bg-neutral-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-950 border-2 border-red-500/40 rounded-3xl p-8 max-w-sm w-full text-center relative overflow-hidden shadow-[0_0_30px_rgba(239,68,68,0.15)]"
            >
              
              {/* Scanline line decorative animation */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-1/2 w-full translate-y-[-100%] animate-[scan_3s_linear_infinite] pointer-events-none" />
              
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto mb-4 border border-red-500/20">
                <ShieldAlert size={24} className="animate-pulse" />
              </div>

              <h3 className="text-base font-black uppercase text-neutral-100 tracking-widest italic mb-2">
                REASSIGN SECURITY CLEARENCE?
              </h3>
              
              <p className="text-[11px] text-neutral-400 leading-relaxed mb-6 select-text">
                Confirm role reassignment of <span className="text-red-400 font-extrabold">@{confirmModal.username}</span> from <span className="text-neutral-500 capitalize">{confirmModal.oldRole}</span> to <span className="text-red-400 font-extrabold uppercase">{confirmModal.newRole === 'user' ? 'Standard' : confirmModal.newRole}</span>? This takes action instantly across all active nodes.
              </p>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 py-3 bg-neutral-900 hover:bg-neutral-850 text-neutral-400 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all border border-neutral-800"
                >
                  ABORT SECURELY
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleRoleUpdate(confirmModal.userId, confirmModal.newRole);
                    setConfirmModal(null);
                  }}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white text-[10px] font-black uppercase tracking-wider rounded-xl shadow-lg shadow-red-950/50 transition-all border border-red-650"
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
