import React, { useState } from 'react';
import { useStore, UserProfile, UserRole } from '../store';
import { 
  Users, ShieldCheck, User as UserIcon, Search, 
  Settings, Save, AlertCircle, Clock, CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function ControlPanel() {
  const { users, currentUser, updateUserRole } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [errorStatus, setErrorStatus] = useState<{id: string, message: string} | null>(null);
  const [localRoles, setLocalRoles] = useState<Record<string, UserRole>>({});

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.id.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => (a.username || '').localeCompare(b.username || ''));

  const handleRoleUpdate = async (userId: string) => {
    if (!currentUser || currentUser.role !== 'admin') return;
    const newRole = localRoles[userId];
    if (!newRole) return;
    
    setUpdatingId(userId);
    setErrorStatus(null);
    setSuccessId(null);
    
    try {
      await updateUserRole(userId, newRole);
      setSuccessId(userId);
      setTimeout(() => setSuccessId(null), 3000);
      setLocalRoles(prev => {
        const next = { ...prev };
        delete next[userId];
        return next;
      });
    } catch (error: any) {
      console.error("Role assignment failed:", error);
      setErrorStatus({ id: userId, message: "Update failed. Check authority logs." });
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
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tighter italic uppercase text-neutral-100 flex items-center gap-3">
            <Settings size={36} className="text-blue-500" />
            Control Panel
          </h1>
          <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs mt-2 italic">Central Authority & Role Governance</p>
        </div>

        <div className="relative w-full md:w-80 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" size={18} />
          <input 
            type="text"
            placeholder="Search Registry..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-2xl pl-12 pr-4 py-3 text-sm text-neutral-200 outline-none focus:border-blue-500/50 transition-all shadow-inner"
          />
        </div>
      </div>

      {/* Member Registry */}
      <div className="bg-neutral-900/40 border border-neutral-800 rounded-[2.5rem] overflow-hidden backdrop-blur-md shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-900/60">
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-neutral-500 tracking-widest italic">Member Presence</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-neutral-500 tracking-widest italic">Assigned Authority</th>
                <th className="px-8 py-5 text-left text-[10px] font-black uppercase text-neutral-500 tracking-widest italic">Status / ID</th>
                <th className="px-8 py-5 text-right text-[10px] font-black uppercase text-neutral-500 tracking-widest italic">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              <AnimatePresence mode="popLayout">
                {filteredUsers.map((user) => (
                  <motion.tr 
                    key={user.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="group hover:bg-neutral-800/30 transition-colors"
                  >
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-neutral-800 rounded-2xl flex items-center justify-center text-neutral-500 border border-neutral-700/50 relative overflow-hidden group-hover:border-blue-500/30 transition-colors">
                           <UserIcon size={24} />
                           {user.status === 'suspended' && <div className="absolute inset-0 bg-red-500/20 backdrop-blur-[1px]" />}
                        </div>
                        <div>
                          <p className={`font-black uppercase tracking-tight italic ${user.status === 'suspended' ? 'text-red-400' : 'text-neutral-100'}`}>
                            {user.username}
                          </p>
                          <p className="text-[10px] text-neutral-600 font-bold uppercase tracking-wider">
                            Joined {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2">
                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                          user.role === 'admin' ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' :
                          user.role === 'monitor' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
                          'bg-neutral-800 border-neutral-700 text-neutral-500'
                        }`}>
                          {user.role}
                        </span>
                        {user.requestedRole && user.requestedRole !== user.role && (
                          <div className="flex items-center gap-1.5 text-[9px] text-amber-500 font-black uppercase italic animate-pulse">
                            <Clock size={10} />
                            Requested {user.requestedRole}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.status === 'active' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]' :
                            user.status === 'suspended' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">{user.status}</span>
                        </div>
                        <p className="text-[8px] font-mono text-neutral-600 tracking-tighter uppercase tabular-nums">UID: {user.id}</p>
                      </div>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <select 
                          disabled={updatingId === user.id || user.id === currentUser.id}
                          value={localRoles[user.id] || user.role}
                          onChange={(e) => setLocalRoles(prev => ({ ...prev, [user.id]: e.target.value as UserRole }))}
                          className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest outline-none focus:border-blue-500/50 transition-all appearance-none cursor-pointer disabled:opacity-50"
                        >
                          <option value="user">Standard</option>
                          <option value="monitor">Monitor</option>
                          <option value="admin">Admin</option>
                        </select>

                        <button
                          onClick={() => handleRoleUpdate(user.id)}
                          disabled={updatingId === user.id || !localRoles[user.id] || localRoles[user.id] === user.role}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                            localRoles[user.id] && localRoles[user.id] !== user.role
                              ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20'
                              : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-50'
                          }`}
                        >
                          {updatingId === user.id ? <Clock size={12} className="animate-spin" /> : <Save size={12} />}
                          Apply Role
                        </button>
                        
                        <div className="w-6 flex items-center justify-center">
                          {successId === user.id ? (
                            <CheckCircle2 size={16} className="text-green-500" />
                          ) : errorStatus?.id === user.id ? (
                            <AlertCircle size={16} className="text-red-500" />
                          ) : null}
                        </div>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
        
        {filteredUsers.length === 0 && (
          <div className="p-20 text-center space-y-4">
             <div className="w-16 h-16 bg-neutral-800 rounded-3xl flex items-center justify-center text-neutral-600 border border-neutral-700 mx-auto">
                <Users size={32} />
             </div>
             <p className="text-neutral-500 font-bold uppercase tracking-widest italic text-xs">No matching subjects found in the registry</p>
          </div>
        )}
      </div>

      {/* Authority Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
           <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <span className="w-1 h-1 bg-blue-500 rounded-full" />
              Standard Access
           </p>
           <ul className="space-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
              <li>• Transaction Submission</li>
              <li>• Chatterbox Uplink</li>
              <li>• Governance Voting</li>
              <li>• Public Intelligence</li>
           </ul>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/10 transition-colors" />
           <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <span className="w-1 h-1 bg-blue-500 rounded-full" />
              Monitor Authority
           </p>
           <ul className="space-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
              <li>• All Standard Access</li>
              <li>• Transaction Validation</li>
              <li>• System Moderation</li>
              <li>• Workspace Clearance</li>
           </ul>
        </div>

        <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-3xl relative overflow-hidden group">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-amber-500/10 transition-colors" />
           <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
              <span className="w-1 h-1 bg-amber-500 rounded-full" />
              Admin Sovereignty
           </p>
           <ul className="space-y-2 text-[10px] font-bold text-neutral-400 uppercase tracking-tighter">
              <li>• Inherited Authorities</li>
              <li>• Role Assignment</li>
              <li>• Master Data Control</li>
              <li>• Governance Overrides</li>
           </ul>
        </div>
      </div>
    </div>
  );
}
