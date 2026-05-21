import React, { useState } from 'react';
import { useStore, UserProfile, AppRole } from '../store';
import { 
  Users, Shield, Eye, Settings, ChevronDown, ChevronUp,
  Search, Filter, Plus, Trash2, CheckCircle2, XCircle,
  Vote as VoteIcon, Trophy, Gavel, Calendar, AlertTriangle, UserPlus,
  BarChart3, PieChart as PieIcon, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, BarChart, Bar, XAxis, YAxis } from 'recharts';

export default function Representatives() {
  const { 
    users, roles, currentUser, updateUserRole, updateRolePermissions,
    votes, createVote, submitVote, closeVote
  } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'hierarchy' | 'definitions' | 'vote'>('hierarchy');

  const isAdmin = currentUser?.role === 'admin';

  const filteredUsers = (users || []).filter(u => 
    (u.username || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const categorizedUsers = {
    admin: filteredUsers.filter(u => u.role === 'admin'),
    monitor: filteredUsers.filter(u => u.role === 'monitor'),
    user: filteredUsers.filter(u => u.role === 'user' || !['admin', 'monitor'].includes(u.role))
  };

  if (!currentUser) return null;

  try {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        {/* Header */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-purple-600/10 border border-purple-500/20 rounded-2xl flex items-center justify-center text-purple-500">
                 <Users size={28} />
              </div>
              <div>
                 <h1 className="text-2xl font-bold italic">Representatives</h1>
                 <p className="text-neutral-500 text-xs font-black uppercase tracking-[0.2em] mt-1">Personnel Hierarchy & Permissions</p>
              </div>
           </div>
           <div className="flex bg-neutral-950 p-1.5 rounded-2xl border border-neutral-800">
              <button
                onClick={() => setActiveTab('hierarchy')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'hierarchy' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Hierarchy
              </button>
              <button
                onClick={() => setActiveTab('definitions')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'definitions' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Role Definitions
              </button>
              <button
                onClick={() => setActiveTab('vote')}
                className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'vote' ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/20' : 'text-neutral-500 hover:text-neutral-300'}`}
              >
                Vote
              </button>
           </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3">
            {activeTab === 'hierarchy' ? (
              <div className="space-y-8">
                {/* Admins */}
                <section>
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-red-500" />
                    Administrators
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(categorizedUsers.admin || []).map(user => (
                      <UserCard key={user.id} user={user} isAdmin={isAdmin} currentRole={currentUser?.role} onRoleChange={updateUserRole} availableRoles={roles} />
                    ))}
                    {categorizedUsers.admin.length === 0 && <p className="text-neutral-600 text-xs italic">No high-level authorities logged.</p>}
                  </div>
                </section>

                {/* Monitors */}
                <section>
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Eye size={16} className="text-blue-500" />
                    Monitors
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {(categorizedUsers.monitor || []).map(user => (
                      <UserCard key={user.id} user={user} isAdmin={isAdmin} currentRole={currentUser?.role} onRoleChange={updateUserRole} availableRoles={roles} />
                    ))}
                    {categorizedUsers.monitor.length === 0 && <p className="text-neutral-600 text-xs italic">No investigative personnel detected.</p>}
                  </div>
                </section>

                {/* Standard Users */}
                <section>
                  <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Users size={16} className="text-neutral-500" />
                    General Operatives
                  </h3>
                  <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
                    {(categorizedUsers.user || []).map(user => (
                      <UserCard key={user.id} user={user} isAdmin={isAdmin} currentRole={currentUser?.role} onRoleChange={updateUserRole} availableRoles={roles} />
                    ))}
                  </div>
                </section>
              </div>
            ) : activeTab === 'definitions' ? (
              <div className="space-y-6">
                 {roles.map(role => (
                   <div key={role.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl">
                      <div className="flex items-center justify-between mb-6">
                         <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                              role.id === 'admin' ? 'bg-red-500/10 text-red-500' :
                              role.id === 'monitor' ? 'bg-blue-500/10 text-blue-500' :
                              'bg-neutral-500/10 text-neutral-500'
                            }`}>
                               <Settings size={22} />
                            </div>
                            <div>
                               <h4 className="text-lg font-bold italic">{role.roleName}</h4>
                               <p className="text-[10px] text-neutral-500 font-black uppercase tracking-widest">ID: {role.id}</p>
                            </div>
                         </div>
                         {isAdmin && (
                           <button 
                             onClick={() => {
                               const perm = prompt("Add permission string (e.g. MANAGE_USERS):");
                               if (perm) updateRolePermissions(role.id, [...role.permissions, perm]);
                             }}
                             className="p-2 hover:bg-neutral-800 rounded-xl transition-colors text-purple-500"
                           >
                              <Plus size={20} />
                           </button>
                         )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                         {role.permissions.map(perm => (
                           <div key={perm} className="flex items-center gap-2 bg-neutral-950 border border-neutral-800 px-4 py-2 rounded-xl">
                              <span className="text-[10px] font-mono text-neutral-400 font-bold">{perm}</span>
                              {isAdmin && (
                                <button 
                                  onClick={() => {
                                    if (window.confirm(`REVOKE PERMISSION: Remove ${perm} from ${role.roleName}?`)) {
                                      updateRolePermissions(role.id, role.permissions.filter(p => p !== perm));
                                    }
                                  }}
                                  className="text-neutral-600 hover:text-red-500 transition-colors"
                                >
                                  <XCircle size={14} />
                                </button>
                              )}
                           </div>
                         ))}
                         {role.permissions.length === 0 && <p className="text-neutral-600 text-[10px] italic">No permissions defined.</p>}
                      </div>
                   </div>
                 ))}
              </div>
            ) : activeTab === 'vote' ? (
              <VoteSection 
                votes={votes} 
                isAdmin={isAdmin} 
                currentUser={currentUser}
                onCreate={createVote}
                onVote={submitVote}
                onClose={closeVote}
              />
            ) : (
              <div className="text-center py-20 bg-neutral-900/50 border-2 border-dashed border-neutral-800 rounded-3xl">
                 <AlertTriangle className="mx-auto text-neutral-700 mb-4" size={40} />
                 <p className="text-neutral-500 italic text-sm">Target module unreachable. Attempting reconnection...</p>
              </div>
            )}
          </div>

          {/* Sidebar Search/Stats */}
          <div className="space-y-6">
             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Registry Filter</label>
                <div className="relative">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-600" size={14} />
                   <input 
                     type="text" 
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                     placeholder="Operative name..."
                     className="w-full bg-neutral-950 border border-neutral-800 rounded-xl pl-10 pr-4 py-3 text-xs focus:outline-none focus:border-purple-500 transition-all font-bold"
                   />
                </div>
             </div>

             <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 shadow-xl">
                <h4 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-4">Hierarchy Stats</h4>
                <div className="space-y-4">
                   <StatRow label="Active Admins" value={categorizedUsers.admin.length} color="text-red-500" />
                   <StatRow label="Active Monitors" value={categorizedUsers.monitor.length} color="text-blue-500" />
                   <StatRow label="General Operatives" value={categorizedUsers.user.length} color="text-neutral-400" />
                </div>
             </div>
          </div>
        </div>
      </div>
    );
  } catch (e) {
    console.error("Representatives Crash:", e);
    return (
      <div className="p-10 bg-red-900/10 border border-red-500/20 rounded-3xl text-center flex flex-col items-center justify-center min-h-[400px]">
        <AlertTriangle size={48} className="text-red-500 mb-4" />
        <h2 className="text-xl font-bold text-red-500 mb-2 italic">Systems Failure Detected</h2>
        <p className="text-sm text-neutral-400 max-w-md">The personnel registry encountered a runtime error and has been suspended for security.</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-6 px-6 py-2 bg-red-500/20 text-red-500 border border-red-500/30 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all"
        >
          Reboot Module
        </button>
      </div>
    );
  }
}

function UserCard({ user, isAdmin, currentRole, onRoleChange, availableRoles }: { 
  user: UserProfile, 
  isAdmin: boolean, 
  currentRole?: string,
  onRoleChange: (uid: string, role: string) => void,
  availableRoles: AppRole[]
}) {
  const [isChanging, setIsChanging] = useState(false);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition-all group shadow-lg">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-600 group-hover:text-purple-500 transition-colors">
                <Users size={20} />
             </div>
             <div>
                <p className="font-bold text-neutral-100 italic">@{user.username}</p>
                <p className="text-[9px] text-neutral-500 uppercase font-black tracking-widest">{user.role}</p>
             </div>
          </div>
          {isAdmin && currentRole === 'admin' && (
            <button 
              onClick={() => setIsChanging(!isChanging)}
              className="p-2 hover:bg-neutral-800 rounded-lg text-neutral-600 hover:text-white transition-all"
            >
               <Settings size={14} />
            </button>
          )}
       </div>

       <AnimatePresence>
          {isChanging && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-4"
            >
               <div className="grid grid-cols-2 gap-2 pt-2">
                  {availableRoles.map(r => (
                    <button
                      key={r.id}
                      onClick={() => {
                        if (window.confirm(`PROMOTE/DEMOTE: Transition @${user.username} to ${r.roleName}?`)) {
                          onRoleChange(user.id, r.id);
                          setIsChanging(false);
                        }
                      }}
                      className={`text-[9px] font-black uppercase py-2 px-3 rounded-lg border transition-all ${
                        user.role === r.id 
                          ? 'bg-purple-600 border-purple-500 text-white' 
                          : 'bg-neutral-950 border-neutral-800 text-neutral-500 hover:border-neutral-700'
                      }`}
                    >
                      {r.roleName}
                    </button>
                  ))}
               </div>
            </motion.div>
          )}
       </AnimatePresence>

       <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
             <CheckCircle2 size={10} className="text-green-500" />
             <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-tighter">Authorized</span>
          </div>
          <span className="text-[10px] font-mono text-neutral-700">UID: {user.id.substring(0, 8)}</span>
       </div>
    </div>
  );
}

function StatRow({ label, value, color }: { label: string, value: number, color: string }) {
  return (
    <div className="flex items-center justify-between">
       <span className="text-[10px] text-neutral-600 font-bold uppercase">{label}</span>
       <span className={`text-lg font-black italic ${color}`}>{value}</span>
    </div>
  );
}

function VoteSection({ 
  votes, isAdmin, currentUser, onCreate, onVote, onClose 
}: { 
  votes: any[], 
  isAdmin: boolean, 
  currentUser: any,
  onCreate: (title: string, type: string, options: string[], isAnonymous: boolean) => Promise<void>,
  onVote: (voteId: string, option: string) => Promise<void>,
  onClose: (voteId: string) => Promise<void>
}) {
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [voteType, setVoteType] = useState('Election');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddOption = () => setOptions([...options, '']);
  
  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleCreate = async () => {
    if (!title) return setError("Vote title required");
    const validOptions = options.filter(opt => opt.trim() !== '');
    if (validOptions.length < 2) return setError("Minimum 2 valid options required");
    
    setLoading(true);
    try {
      await onCreate(title, voteType, validOptions, isAnonymous);
      setShowForm(false);
      setTitle('');
      setOptions(['', '']);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#6366f1', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-black text-neutral-500 uppercase tracking-widest flex items-center gap-2">
          <Gavel size={16} className="text-purple-500" />
          Active Votes & History
        </h3>
        {isAdmin && (
          <button 
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20"
          >
            <UserPlus size={14} />
            Conduct Vote
          </button>
        )}
      </div>

      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl space-y-6"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Vote Title</label>
                  <input 
                    type="text"
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. Should warning rules change?"
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Vote Type</label>
                  <select 
                    value={voteType}
                    onChange={e => setVoteType(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-purple-500 font-bold appearance-none cursor-pointer"
                  >
                    {['Election', 'Polling', 'Decision', 'Confidence Vote'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-4 pt-4">
                   <div className="flex-1">
                      <p className="text-[10px] font-black text-white uppercase tracking-widest">Visibility Mode</p>
                      <p className="text-[9px] text-neutral-500 uppercase font-bold mt-1">
                        {isAnonymous ? "ANONYMOUS (Default)" : "PUBLIC (Names revealed)"}
                      </p>
                   </div>
                   <button 
                     onClick={() => setIsAnonymous(!isAnonymous)}
                     className={`w-12 h-6 rounded-full relative transition-colors ${isAnonymous ? 'bg-purple-600' : 'bg-neutral-700'}`}
                   >
                      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isAnonymous ? 'left-7' : 'left-1'}`} />
                   </button>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2">Options</label>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {options.map((opt, idx) => (
                    <div key={idx} className="flex gap-2">
                       <input 
                         value={opt}
                         onChange={e => {
                           const newOpts = [...options];
                           newOpts[idx] = e.target.value;
                           setOptions(newOpts);
                         }}
                         placeholder={`Option ${idx + 1}`}
                         className="flex-1 bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-2 text-xs font-bold"
                       />
                       <button 
                         onClick={() => handleRemoveOption(idx)}
                         className="p-2 text-neutral-600 hover:text-red-500 transition-colors"
                         disabled={options.length <= 2}
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                  <div className="flex items-center gap-4 bg-neutral-950/50 border border-neutral-800 border-dashed p-3 rounded-xl">
                      <div className="flex-1">
                         <p className="text-[10px] font-black text-neutral-500 uppercase">NOTA</p>
                         <p className="text-[8px] text-neutral-600 uppercase font-black">Automatically added to every vote</p>
                      </div>
                      <Info size={14} className="text-neutral-700" />
                  </div>
                </div>
                <button 
                  onClick={handleAddOption}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-neutral-800 py-3 rounded-xl text-[10px] font-black uppercase text-neutral-500 hover:text-neutral-300 hover:border-neutral-600 transition-all"
                >
                  <Plus size={14} /> Add Option
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-[10px] font-bold italic">{error}</p>}

            <div className="flex justify-end gap-4 pt-4 border-t border-neutral-800">
              <button onClick={() => setShowForm(false)} className="text-neutral-500 text-[10px] font-black uppercase hover:text-neutral-300">Cancel</button>
              <button 
                onClick={handleCreate}
                disabled={loading}
                className="bg-green-600 text-white px-8 py-3 rounded-xl text-[10px] font-black uppercase hover:bg-green-700 transition-all disabled:opacity-50 shadow-lg shadow-green-600/20"
              >
                {loading ? 'Transmitting...' : 'Start Vote'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-6">
        {(votes || []).sort((a,b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)).map(vote => (
          <div key={vote.id} className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <div className="flex items-center gap-3">
                 <span className="text-[9px] font-black text-neutral-600 uppercase tracking-[0.2em]">{vote.type}</span>
                 <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                   vote.status === 'active' ? 'bg-green-500/10 text-green-500 animate-pulse' : 'bg-neutral-700/50 text-neutral-400'
                 }`}>
                   {vote.status}
                 </span>
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-10">
              {/* Vote Info & Controls */}
              <div className="lg:w-1/3 flex flex-col">
                 <div className="mb-6">
                    <h4 className="text-xl font-bold italic mb-2 group-hover:text-purple-400 transition-colors">{vote.title}</h4>
                    <div className="flex items-center gap-4 text-neutral-500 text-[10px] font-mono">
                       <span className="flex items-center gap-1.5"><Calendar size={12} /> {vote.createdAt?.toDate ? vote.createdAt.toDate().toLocaleDateString() : 'N/A'}</span>
                       <span className="flex items-center gap-1.5"><Users size={12} /> {vote.totalVotes || 0} Responses</span>
                    </div>
                 </div>
                 
                 <div className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 mb-6">
                    <p className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
                       <Filter size={12} className="text-purple-500" />
                       Voting Parameters
                    </p>
                    <div className="space-y-2">
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-neutral-600">ANONYMITY</span>
                          <span className={vote.isAnonymous ? 'text-green-500' : 'text-amber-500'}>{vote.isAnonymous ? 'ENABLED' : 'DISABLED'}</span>
                       </div>
                       <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-neutral-600">MANDATORY OPTION</span>
                          <span className="text-purple-500">NOTA INCLUDED</span>
                       </div>
                    </div>
                 </div>

                 {isAdmin && vote.status === 'active' && (
                   <button 
                     onClick={() => {
                        if (window.confirm("PERMANENT ACTION: Close this vote and finalize all calculations?")) {
                           onClose(vote.id);
                        }
                     }}
                     className="mt-auto w-full group relative overflow-hidden bg-purple-600 text-white py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-purple-600/20 active:scale-95 transition-all"
                   >
                     <span className="relative z-10 flex items-center justify-center gap-2">
                        <CheckCircle2 size={16} />
                        Stop Vote & Lock Results
                     </span>
                   </button>
                 )}

                 {vote.userVotedOption && vote.status === 'active' && (
                   <div className="mt-auto bg-green-500/5 border border-green-500/10 p-5 rounded-2xl flex flex-col items-center gap-2">
                      <div className="flex items-center gap-2 text-green-500 text-[10px] font-black uppercase">
                         <CheckCircle2 size={16} />
                         Session Synchronized
                      </div>
                      <p className="text-[9px] text-green-600/60 font-bold uppercase text-center italic">
                        Your response has been secured in the encrypted ledger.
                      </p>
                   </div>
                 )}
              </div>

              {/* Voting Body or Results */}
              <div className="lg:w-2/3">
                {vote.status === 'active' ? (
                  <div className="grid sm:grid-cols-2 gap-4 h-full">
                    {vote.options.map((opt: string) => (
                      <button 
                        key={opt}
                        disabled={!!vote.userVotedOption}
                        onClick={() => {
                          if (window.confirm(`SUBMIT RESPONSE: Lock in your choice for "${opt}"?`)) {
                            onVote(vote.id, opt);
                          }
                        }}
                        className={`group/opt p-6 rounded-2xl border transition-all flex flex-col items-center justify-center text-center gap-3 min-h-[140px] ${
                          vote.userVotedOption === opt 
                            ? 'bg-purple-600/10 border-purple-500 text-purple-400' 
                            : vote.userVotedOption
                             ? 'bg-neutral-950 border-neutral-900 opacity-50 grayscale cursor-not-allowed'
                             : 'bg-neutral-950 border-neutral-800 hover:border-purple-500/50 hover:bg-neutral-900'
                        }`}
                      >
                         <h5 className="font-bold text-sm tracking-tight">{opt}</h5>
                         {!vote.userVotedOption && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-neutral-500 group-hover/opt:text-purple-500 transition-colors">
                               <VoteIcon size={14} />
                               Select
                            </div>
                         )}
                         {vote.userVotedOption === opt && (
                            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase text-purple-500 italic">
                               <CheckCircle2 size={14} />
                               Selected
                            </div>
                         )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="bg-neutral-950 rounded-2xl p-8 border border-neutral-800 border-dashed h-full min-h-[400px] flex flex-col">
                     <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-purple-600/10 rounded-xl flex items-center justify-center text-purple-500">
                              <BarChart3 size={20} />
                           </div>
                           <h5 className="text-sm font-black uppercase tracking-widest italic">Calculated Outcomes</h5>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] font-black text-neutral-600 uppercase">Winner</p>
                           <p className="text-xs font-bold text-yellow-500 italic">
                              {(() => {
                                let max = -1;
                                let winner = "NULL";
                                Object.entries(vote.results || {}).forEach(([k, v]: [any, any]) => {
                                  if (v.count > max) {
                                    max = v.count;
                                    winner = k;
                                  }
                                });
                                return winner === "NOTA" ? "None Of The Above (RESET)" : winner;
                              })()}
                           </p>
                        </div>
                     </div>

                     <div className="flex-1 w-full min-h-[250px]">
                        <ResponsiveContainer width="100%" height="100%">
                           <PieChart>
                              <Pie
                                data={Object.entries(vote.results || {}).map(([name, val]: [any, any]) => ({ name, value: val.count }))}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                              >
                                {Object.entries(vote.results || {}).map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#0a0a0a', border: '1px solid #262626', borderRadius: '12px', fontSize: '10px' }}
                                itemStyle={{ fontWeight: 'bold' }}
                              />
                           </PieChart>
                        </ResponsiveContainer>
                     </div>

                     {/* Detail breakdown */}
                     <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Object.entries(vote.results || {}).map(([name, val]: [any, any], idx) => (
                          <div key={name} className="space-y-2">
                             <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                                   <span className="text-[10px] font-bold text-neutral-300 truncate max-w-[100px]">{name}</span>
                                </div>
                                <span className="text-xs font-black text-white">{val.count}</span>
                             </div>
                             {!vote.isAnonymous && val.users?.length > 0 && (
                               <div className="flex flex-wrap gap-1">
                                  {val.users.map((u: string) => (
                                    <span key={u} className="text-[8px] bg-neutral-900 px-2 py-0.5 rounded-full text-neutral-500 border border-neutral-800">@{u}</span>
                                  ))}
                               </div>
                             )}
                          </div>
                        ))}
                     </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!votes || votes.length === 0) && (
          <div className="text-center py-24 bg-neutral-900/50 border-2 border-dashed border-neutral-800 rounded-3xl group hover:border-purple-500/30 transition-all">
             <motion.div
               animate={{ rotate: [0, 10, -10, 0] }}
               transition={{ repeat: Infinity, duration: 5 }}
             >
               <VoteIcon className="mx-auto text-neutral-800 group-hover:text-purple-600 transition-colors mb-6" size={48} />
             </motion.div>
             <h4 className="text-lg font-bold text-neutral-400 italic mb-2">No Active Legislative Sessions</h4>
             <p className="text-neutral-600 text-sm max-w-sm mx-auto">The voting registry is empty. Authorized administrators can initiate a new session to drive community decisions.</p>
          </div>
        )}
      </div>
    </div>
  );
}
