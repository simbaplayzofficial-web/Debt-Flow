import React, { useState, useMemo } from 'react';
import { useStore } from '../store';
import { 
  Shield, Trash2, Search, Filter, 
  ArrowUpRight, ArrowDownRight, AlertTriangle, 
  User, ShieldCheck, ShieldAlert, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function CommandPanel() {
  const { users, currentUser, transactions, debts, deleteUser } = useStore();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.username.toLowerCase().includes(search.toLowerCase());
      const matchesRole = roleFilter === 'all' || u.role.toLowerCase() === roleFilter.toLowerCase();
      return matchesSearch && matchesRole;
    }).sort((a, b) => a.username.localeCompare(b.username));
  }, [users, search, roleFilter]);

  const handleDelete = async (userId: string, username: string) => {
    if (!confirm(`ERASE PROTOCOL: Confirm permanent removal of user @${username}? all identifying records will be purged.`)) return;
    
    try {
      setIsDeleting(userId);
      await deleteUser(userId);
      alert(`PURGE COMPLETE: @${username} has been neutralized from the system.`);
    } catch (error: any) {
      alert(`ACTION FAILED: ${error.message}`);
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-neutral-900 border border-neutral-800 p-8 rounded-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-[0.03] rotate-12">
          <Zap size={200} />
        </div>
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-xl shadow-blue-500/5">
            <Shield size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black italic tracking-tight text-white">Command Panel</h1>
            <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.3em] mt-1">High-Level Directory & Strategic Oversight</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500 group-focus-within:text-blue-500 transition-colors" size={16} />
            <input 
              type="text" 
              placeholder="Search Subject..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-neutral-950 border border-neutral-800 rounded-xl pl-11 pr-4 py-3 text-xs focus:outline-none focus:border-blue-500 transition-all font-bold tracking-tight w-48" 
            />
          </div>
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-xs font-bold text-neutral-400 focus:outline-none focus:border-blue-500 transition-all uppercase tracking-widest"
          >
            <option value="all">All Personnel</option>
            <option value="admin">Administrators</option>
            <option value="monitor">Monitors</option>
            <option value="user">Standard Units</option>
          </select>
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-950/60">
                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Operational Subject</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Clearance/Role</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Net Exposure (Ledger)</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800">Integrity Record</th>
                <th className="px-8 py-6 text-[10px] font-black text-neutral-500 uppercase tracking-widest border-b border-neutral-800 text-right">Strategic Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/50">
              {filteredUsers.map(user => (
                <motion.tr 
                  layout
                  key={user.id} 
                  className="group hover:bg-neutral-800/30 transition-all border-b border-neutral-800/20"
                >
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-neutral-950 border border-neutral-800 rounded-2xl flex items-center justify-center font-black text-neutral-500 group-hover:border-blue-500/40 group-hover:bg-blue-500/5 transition-all relative">
                        {user.username[0].toUpperCase()}
                        {user.isPermanentlyRemoved && (
                           <div className="absolute -top-1 -right-1 bg-red-600 rounded-full p-1 border-2 border-neutral-900">
                              <ShieldAlert size={8} className="text-white" />
                           </div>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-100 italic transition-all group-hover:text-white">@{user.username}</p>
                        <p className="text-[9px] text-neutral-600 font-mono mt-1 tracking-tighter">ID: {user.id.slice(0, 12)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                       <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border
                         ${user.role === 'ADMIN' ? 'bg-red-600/10 border-red-600/20 text-red-500' : 
                           user.role === 'MONITOR' ? 'bg-blue-600/10 border-blue-600/20 text-blue-500' : 
                           'bg-neutral-950 border-neutral-800 text-neutral-500'}
                       `}>
                          {user.role}
                       </div>
                       {user.role !== 'USER' && <ShieldCheck size={12} className="text-blue-500" />}
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black text-neutral-600 uppercase tracking-tighter">Liabilities</span>
                         <div className="flex items-center gap-1 text-red-500">
                           <ArrowDownRight size={12} />
                           <span className="text-sm font-black font-mono">{user.debtOwed}</span>
                         </div>
                      </div>
                      <div className="flex flex-col gap-1">
                         <span className="text-[8px] font-black text-neutral-600 uppercase tracking-tighter">Investments</span>
                         <div className="flex items-center gap-1 text-green-500">
                           <ArrowUpRight size={12} />
                           <span className="text-sm font-black font-mono">{user.debtToMe}</span>
                         </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                       <div className={`w-2.5 h-2.5 rounded-full shadow-sm
                         ${user.integrityLevel === 0 ? 'bg-green-500 shadow-green-500/20' : 
                           user.integrityLevel < 3 ? 'bg-yellow-500 shadow-yellow-500/20' : 
                           'bg-red-600 shadow-red-600/20'}
                       `} />
                       <div>
                         <span className="text-xs font-black text-neutral-200">LVL {user.integrityLevel}</span>
                         <span className="text-[9px] text-neutral-600 font-bold block uppercase tracking-tighter">{user.integrityScore}% Threshold</span>
                       </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    {currentUser?.role === 'ADMIN' ? (
                       <button 
                         disabled={user.id === currentUser.id || isDeleting === user.id}
                         onClick={() => handleDelete(user.id, user.username)}
                         className={`p-3 bg-red-600/10 border border-red-600/20 rounded-xl text-red-500 transition-all shadow-lg shadow-red-600/5
                           ${user.id === currentUser.id ? 'opacity-20 cursor-not-allowed grayscale' : 'hover:bg-red-600 hover:text-white hover:border-red-600'}
                         `}
                         title="Purge Subject"
                       >
                         {isDeleting === user.id ? (
                           <div className="w-5 h-5 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
                         ) : (
                           <Trash2 size={18} />
                         )}
                       </button>
                    ) : (
                       <div className="text-[9px] font-black uppercase text-neutral-700 tracking-widest italic border border-neutral-800 px-3 py-2 rounded-xl bg-neutral-950/50">
                         View Only Protocol
                       </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filteredUsers.length === 0 && (
            <div className="py-24 text-center">
               <AlertTriangle className="mx-auto text-neutral-800 mb-4" size={48} />
               <p className="text-neutral-600 font-black uppercase tracking-[0.2em] text-xs">No personnel matching query parameters found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Advisory Footer */}
      <div className="p-8 border border-neutral-800 border-dashed rounded-[2rem] bg-neutral-950/50">
         <div className="flex items-start gap-4">
            <AlertTriangle className="text-orange-500 mt-1" size={18} />
            <div>
               <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2">Operational Integrity Directive:</p>
               <p className="text-xs text-neutral-500 leading-relaxed max-w-2xl italic">
                 Personnel purging is a terminal action. Deleting an account will cascade through individual user profiles and restricted datasets. All financial exposures reflected in the ledger will remain as historical artifacts for audit purposes if the user is purged before resolution.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
}
