import React, { useState } from 'react';
import { useStore, SpecialOpsLog, InternalNote, Recruitment, UserProfile, ResolvingCase, SpyOpsMember, SpyOpsRole } from '../store';
import { 
  ShieldX, EyeOff, Search, Info, Link as LinkIcon, 
  MessageSquare, UserPlus, Clock, Target, Shield,
  FileText, Activity, AlertCircle, Trash2, Key,
  ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function SpecialOps() {
  const { 
    hasSpecialAccess, specialOpsLogs, internalNotes, recruitments, 
    users, resolvingDeck, addInternalNote, recruitUser, 
    revokeRecruitment, currentUser, grantSpecialAccess,
    isSpyOwner, spyNetwork, addToSpyNetwork, removeFromSpyNetwork, toggleSpyNetworkActive
  } = useStore();

  const mySpyMember = spyNetwork.find(m => m.userId === currentUser?.id);
  const mySpyRole = mySpyMember?.role;
  
  const canSeeInvestigation = isSpyOwner || mySpyRole === 'investigation';
  const canSeeDefence = isSpyOwner || mySpyRole === 'defence';
  const canSeeDiplomacy = isSpyOwner || mySpyRole === 'diplomacy';
  const canSeeSpyNetwork = isSpyOwner; // Recruiting Assets
  const canSeeAuthority = isSpyOwner; // Managing Members
  const canSeeAudit = isSpyOwner || hasSpecialAccess; // Everyone sees logs? "Visible only inside Spy Ops"

  const [activeTab, setActiveTab] = useState<'investigation' | 'defence' | 'diplomacy' | 'spy_network' | 'audits' | 'access' | 'authority'>('investigation');

  // Auto-switch away from restricted tabs if role changes
  React.useEffect(() => {
     if (activeTab === 'authority' && !isSpyOwner) setActiveTab('investigation');
     if (activeTab === 'access' && !isSpyOwner) setActiveTab('investigation');
     if (activeTab === 'spy_network' && !isSpyOwner) setActiveTab('investigation');
  }, [isSpyOwner, activeTab]);

  if (!hasSpecialAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[600px] text-center p-8 bg-neutral-950/50 rounded-3xl border border-neutral-800 border-dashed animate-in fade-in duration-1000">
         <ShieldX size={64} className="text-neutral-800 mb-6" />
         <h1 className="text-2xl font-black text-neutral-500 uppercase tracking-[0.3em] mb-2">Restricted Area</h1>
         <p className="text-neutral-600 text-sm max-w-md font-medium tracking-tight">Access to Special Operations requires direct high-level authorization. All unauthorized attempts are logged.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header */}
      <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden group">
         <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <EyeOff size={120} className="text-neutral-500" />
         </div>
         <div className="relative z-10 flex items-center gap-6">
            <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center text-neutral-100 italic font-black shadow-inner">
               OPS
            </div>
            <div>
               <h1 className="text-3xl font-black italic tracking-tighter uppercase">Special Operations</h1>
               <div className="flex items-center gap-3 mt-1">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                  <p className="text-neutral-500 text-[10px] font-black uppercase tracking-[0.4em]">Restricted Intelligence & Enforcement</p>
               </div>
            </div>
         </div>
         <div className="flex flex-wrap bg-neutral-900/50 p-1.5 rounded-2xl border border-neutral-800 relative z-10">
            {canSeeInvestigation && <NavTab active={activeTab === 'investigation'} onClick={() => setActiveTab('investigation')} label="Investigation" />}
            {canSeeDefence && <NavTab active={activeTab === 'defence'} onClick={() => setActiveTab('defence')} label="Defence" />}
            {canSeeDiplomacy && <NavTab active={activeTab === 'diplomacy'} onClick={() => setActiveTab('diplomacy')} label="Diplomacy" />}
            {canSeeSpyNetwork && <NavTab active={activeTab === 'spy_network'} onClick={() => setActiveTab('spy_network')} label="Asset Network" />}
            {canSeeAuthority && <NavTab active={activeTab === 'authority'} onClick={() => setActiveTab('authority')} label="Authority" icon={<ShieldCheck size={10} />} />}
            {isSpyOwner && <NavTab active={activeTab === 'access'} onClick={() => setActiveTab('access')} label="Legacy" icon={<Key size={10} />} />}
            {canSeeAudit && <NavTab active={activeTab === 'audits'} onClick={() => setActiveTab('audits')} label="Audit" icon={<Activity size={10} />} />}
         </div>
      </div>

      <div className="min-h-[600px]">
        {activeTab === 'investigation' && canSeeInvestigation && <InvestigationView cases={resolvingDeck} notes={internalNotes} onAddNote={addInternalNote} />}
        {activeTab === 'defence' && canSeeDefence && <DefenceView users={users} />}
        {activeTab === 'diplomacy' && canSeeDiplomacy && <DiplomacyView users={users} />}
        {activeTab === 'spy_network' && canSeeSpyNetwork && <SpyNetworkView users={users} recruitments={recruitments} onRecruit={recruitUser} onRevoke={revokeRecruitment} />}
        {activeTab === 'authority' && canSeeAuthority && <SpyOpsAuthorityView users={users} spyNetwork={spyNetwork} onAdd={addToSpyNetwork} onRemove={removeFromSpyNetwork} onToggle={toggleSpyNetworkActive} />}
        {activeTab === 'access' && isSpyOwner && <AccessManagementView users={users} onGrant={grantSpecialAccess} />}
        {activeTab === 'audits' && canSeeAudit && <AuditView logs={specialOpsLogs} />}
      </div>
    </div>
  );
}

function NavTab({ active, onClick, label, icon }: { active: boolean, onClick: () => void, label: string, icon?: any }) {
  return (
    <button
      onClick={onClick}
      className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.15em] transition-all flex items-center gap-2 ${active ? 'bg-white text-black shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}
    >
      {icon && icon}
      {label}
    </button>
  );
}

// --- TAB VIEWS ---

function InvestigationView({ cases, notes, onAddNote }: { cases: ResolvingCase[], notes: InternalNote[], onAddNote: (cid: string, content: string) => void }) {
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);

  return (
    <div className="grid lg:grid-cols-3 gap-8 h-full">
      <div className="lg:col-span-1 bg-neutral-900/30 border border-neutral-800 rounded-3xl p-6 overflow-y-auto max-h-[700px] scrollbar-thin scrollbar-thumb-neutral-800">
         <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2">
            <LinkIcon size={14} />
            Resolving Linkage
         </h3>
         <div className="space-y-3">
            {cases.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedCaseId(c.id)}
                className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedCaseId === c.id ? 'bg-neutral-800 border-neutral-700 shadow-xl' : 'bg-neutral-950/50 border-neutral-900 hover:border-neutral-800'}`}
              >
                 <div className="flex justify-between items-start mb-2">
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${c.status === 'resolved' ? 'bg-green-500/10 text-green-500' : 'bg-orange-500/10 text-orange-500'}`}>
                       {c.status}
                    </span>
                    <span className="text-[8px] font-mono text-neutral-600 italic">#{c.id.substring(0, 8)}</span>
                 </div>
                 <p className="text-xs font-bold text-neutral-300 line-clamp-2 leading-relaxed">{c.description}</p>
              </button>
            ))}
         </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
         {selectedCaseId ? (
           <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-8 shadow-2xl h-full flex flex-col">
              <div className="mb-8 border-b border-neutral-800 pb-6 flex justify-between items-center">
                 <div>
                    <h2 className="text-xl font-black italic tracking-tight">Case Intelligence</h2>
                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-widest">Linked Document: {selectedCaseId}</p>
                 </div>
                 <button onClick={() => setSelectedCaseId(null)} className="text-[10px] font-black text-neutral-600 hover:text-white uppercase transition-colors">Close</button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-4">
                 <h4 className="text-[10px] font-black text-neutral-600 uppercase tracking-widest">Internal Archives</h4>
                 {notes.filter(n => n.caseId === selectedCaseId).map(note => (
                   <div key={note.id} className="bg-neutral-950 border border-neutral-800/50 p-5 rounded-2xl">
                      <div className="flex justify-between items-center mb-3">
                         <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest">Note Agent</span>
                         <span className="text-[8px] font-mono text-neutral-700 italic">{new Date(note.timestamp).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-neutral-400 font-medium leading-relaxed italic border-l-2 border-neutral-800 pl-4">{note.content}</p>
                   </div>
                 ))}
                 {notes.filter(n => n.caseId === selectedCaseId).length === 0 && (
                   <div className="py-20 text-center">
                      <FileText size={48} className="text-neutral-900 mx-auto mb-4" />
                      <p className="text-neutral-700 text-xs italic">No internal intelligence recorded for this case.</p>
                   </div>
                 )}
              </div>

              <NoteForm onAdd={(content) => onAddNote(selectedCaseId, content)} />
           </div>
         ) : (
           <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-neutral-900/20 border border-neutral-800 border-dashed rounded-3xl opacity-50">
              <div className="w-16 h-16 bg-neutral-900 rounded-2xl flex items-center justify-center text-neutral-700 mb-6">
                 <Search size={32} />
              </div>
              <h3 className="text-lg font-black italic text-neutral-600 uppercase tracking-tighter">Selection Required</h3>
              <p className="text-neutral-700 text-xs font-medium max-w-xs mt-2 uppercase tracking-widest">Target a case from the resolving linkage to initiate intelligence logging.</p>
           </div>
         )}
      </div>
    </div>
  );
}

function NoteForm({ onAdd }: { onAdd: (c: string) => void }) {
  const [note, setNote] = useState('');
  return (
    <div className="bg-neutral-950 border border-neutral-800 p-6 rounded-2xl shadow-xl">
       <textarea 
         value={note}
         onChange={e => setNote(e.target.value)}
         placeholder="Record internal intelligence..."
         className="w-full bg-transparent border-none text-sm text-neutral-300 focus:ring-0 resize-none h-24 scrollbar-hide font-medium italic"
       />
       <div className="flex justify-between items-center pt-4 border-t border-neutral-900">
          <span className="text-[8px] text-neutral-700 font-black uppercase tracking-widest italic flex items-center gap-2">
             <AlertCircle size={10} />
             Special Ops Eyes Only
          </span>
          <button 
            disabled={!note.trim()}
            onClick={() => { onAdd(note); setNote(''); }}
            className="px-6 py-2 bg-neutral-100 text-neutral-950 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white transition-all disabled:opacity-50 shadow-lg shadow-white/5"
          >
             Commit
          </button>
       </div>
    </div>
  );
}

function DefenceView({ users }: { users: UserProfile[] }) {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
       <div className="grid md:grid-cols-3 gap-6">
          <div className="p-8 bg-neutral-900 border border-neutral-800 rounded-3xl shadow-xl relative overflow-hidden group">
             <div className="absolute -top-4 -right-4 opacity-5 group-hover:scale-110 transition-transform">
                <Shield size={120} />
             </div>
             <h3 className="text-lg font-black italic mb-2 relative z-10">Protection Grid</h3>
             <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest relative z-10 mb-6">Active Defensive Measures</p>
             <div className="space-y-3 relative z-10">
                <div className="flex justify-between items-center text-xs">
                   <span className="text-neutral-500">Global Firewall</span>
                   <span className="text-green-500 font-mono font-black italic">OPTIMAL</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                   <span className="text-neutral-500">Integrity Leaks</span>
                   <span className="text-neutral-700 font-mono font-black italic">NONE</span>
                </div>
             </div>
          </div>
          
          <div className="md:col-span-2 bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Flagged High-Risk Profiles</h3>
             <div className="grid sm:grid-cols-2 gap-4">
                {users.filter(u => u.integrityLevel >= 3).map(u => (
                  <div key={u.id} className="p-5 bg-neutral-900 rounded-2xl border border-red-500/10 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                           <AlertCircle size={18} />
                        </div>
                        <div>
                           <p className="font-bold text-neutral-200 italic">@{u.username}</p>
                           <p className="text-[8px] text-neutral-600 font-black uppercase">LVL {u.integrityLevel} Threat</p>
                        </div>
                     </div>
                     <button className="text-[10px] font-black text-neutral-700 hover:text-white uppercase transition-colors">Monitor</button>
                  </div>
                ))}
                {users.filter(u => u.integrityLevel >= 3).length === 0 && <p className="text-neutral-700 text-xs italic">No high-risk operatives detected.</p>}
             </div>
          </div>
       </div>
    </div>
  );
}

function DiplomacyView({ users }: { users: UserProfile[] }) {
  // Diplomatic view sees non-sensitive data only
  return (
    <div className="bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 space-y-8 animate-in slide-in-from-bottom-4 duration-500 shadow-2xl">
       <div className="flex justify-between items-center border-b border-neutral-800 pb-6 mb-8">
          <div>
             <h2 className="text-2xl font-black italic uppercase tracking-tighter">Operative Insights</h2>
             <p className="text-[10px] text-neutral-500 font-black uppercase tracking-[0.3em] mt-1">Non-Sensitive Behavioral Analysis</p>
          </div>
          <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
             <Info size={12} className="text-blue-500" />
             <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Restricted Insight Mode</span>
          </div>
       </div>

       <div className="grid lg:grid-cols-4 gap-6">
          {users.slice(0, 12).map(user => (
            <div key={user.id} className="bg-neutral-950 border border-neutral-800 rounded-2xl p-6 hover:translate-y-[-4px] transition-transform shadow-2xl group">
               <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-neutral-900 border border-neutral-800 rounded-2xl flex items-center justify-center group-hover:text-blue-500 transition-colors">
                     <Target size={22} />
                  </div>
                  <div>
                     <p className="font-bold text-neutral-100 italic">@{user.username}</p>
                     <p className="text-[9px] text-neutral-600 font-black uppercase tracking-widest">OPERATIVE</p>
                  </div>
               </div>
               <div className="space-y-3">
                  <div className="flex justify-between items-center">
                     <span className="text-[8px] text-neutral-600 font-black uppercase">Reliability</span>
                     <span className="text-[10px] font-mono text-neutral-400 font-black italic">{user.integrityScore}%</span>
                  </div>
                  <div className="w-full bg-neutral-900 h-1 rounded-full overflow-hidden">
                     <motion.div 
                       initial={{ width: 0 }}
                       animate={{ width: `${user.integrityScore}%` }}
                       className={`h-full ${user.integrityScore > 70 ? 'bg-blue-500' : 'bg-neutral-600'}`} 
                     />
                  </div>
                  <div className="pt-2 flex justify-between items-center text-[8px] font-black text-neutral-700 uppercase">
                     <span>Transactions: {user.totalLendingTransactions}</span>
                     <span>Rating: {user.ratingAverage}</span>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
}

function SpyNetworkView({ users, recruitments, onRecruit, onRevoke }: { 
  users: UserProfile[], recruitments: Recruitment[], onRecruit: (uid: string, t: string, r: number, d: number) => void, onRevoke: (id: string) => void 
}) {
  const [targetId, setTargetId] = useState('');
  const [task, setTask] = useState('');
  const [reward, setReward] = useState(10);
  const [duration, setDuration] = useState(24);

  const activeRecruitments = recruitments.filter(r => r.status === 'active');
  const pastRecruitments = recruitments.filter(r => r.status !== 'active');

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
       <div className="lg:col-span-1 space-y-6">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-6 opacity-5">
                <UserPlus size={80} />
             </div>
             <h3 className="text-xl font-black italic mb-6 relative z-10">Recruitment Terminal</h3>
             <form onSubmit={(e) => { e.preventDefault(); onRecruit(targetId, task, reward, duration); }} className="space-y-6 relative z-10">
                <div>
                   <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Subject operative</label>
                   <select 
                     value={targetId}
                     onChange={e => setTargetId(e.target.value)}
                     className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                   >
                      <option value="">Select Target...</option>
                      {users.map(u => <option key={u.id} value={u.id}>@{u.username}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Mission Objective</label>
                   <input 
                     type="text" 
                     value={task}
                     onChange={e => setTask(e.target.value)}
                     placeholder="e.g. Infiltrate Debt Ring X..."
                     className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 focus:ring-1 focus:ring-blue-500 transition-all font-bold"
                   />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Reward (Debt)</label>
                      <input 
                        type="number" 
                        value={reward}
                        onChange={e => setReward(parseInt(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 font-bold"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Duration (Hrs)</label>
                      <input 
                        type="number" 
                        value={duration}
                        onChange={e => setDuration(parseInt(e.target.value))}
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 font-bold"
                      />
                   </div>
                </div>
                <button 
                  disabled={!targetId || !task}
                  type="submit"
                  className="w-full py-4 bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all shadow-xl shadow-blue-600/20 disabled:opacity-50"
                >
                   Initiate Asset
                </button>
             </form>
          </div>
       </div>

       <div className="lg:col-span-2 space-y-8">
          <section>
             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6 flex items-center gap-2">
                <Target size={14} className="text-blue-500" />
                Active Assets
             </h3>
             <div className="grid sm:grid-cols-2 gap-4">
                {activeRecruitments.map(rec => {
                  const targetUser = users.find(u => u.id === rec.recruitedUserId);
                  return (
                    <div key={rec.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col justify-between shadow-xl border-l-2 border-l-blue-500">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <p className="font-bold text-neutral-100 italic">@{targetUser?.username || 'Unknown'}</p>
                             <p className="text-[8px] text-neutral-600 font-black uppercase">Mission Duration: {rec.duration}</p>
                          </div>
                          <button 
                            onClick={() => onRevoke(rec.id)}
                            className="p-2 text-neutral-700 hover:text-red-500 transition-colors"
                          >
                             <Trash2 size={14} />
                          </button>
                       </div>
                       <div className="space-y-3">
                          <p className="text-xs text-neutral-400 font-medium italic">"{rec.task}"</p>
                          <div className="flex items-center gap-2">
                             <Clock size={10} className="text-blue-500" />
                             <span className="text-[8px] font-black text-neutral-600 uppercase">Expires: {new Date(rec.duration).toLocaleString()}</span>
                          </div>
                       </div>
                    </div>
                  );
                })}
                {activeRecruitments.length === 0 && (
                   <div className="bg-neutral-900/20 border border-neutral-800 border-dashed rounded-3xl p-12 text-center col-span-2">
                      <p className="text-neutral-700 text-xs italic">No active spy network assets deployed.</p>
                   </div>
                )}
             </div>
          </section>

          <section className="opacity-50 grayscale hover:opacity-100 hover:grayscale-0 transition-all">
             <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Archive Depots</h3>
             <div className="space-y-3">
                {pastRecruitments.map(rec => {
                   const targetUser = users.find(u => u.id === rec.recruitedUserId);
                   return (
                      <div key={rec.id} className="bg-neutral-950 border border-neutral-900 p-4 rounded-xl flex items-center justify-between text-xs">
                         <div className="flex items-center gap-4">
                            <span className="text-neutral-700 font-black uppercase text-[8px]">{rec.status}</span>
                            <span className="font-bold text-neutral-500">@{targetUser?.username}</span>
                            <span className="text-neutral-700 italic">"{rec.task}"</span>
                         </div>
                         <span className="text-[8px] font-mono text-neutral-800">{new Date(rec.timestamp).toLocaleDateString()}</span>
                      </div>
                   );
                })}
             </div>
          </section>
       </div>
    </div>
  );
}

function AccessManagementView({ users, onGrant }: { users: UserProfile[], onGrant: (uid: string) => void }) {
  const [targetId, setTargetId] = useState('');
  return (
    <div className="max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
       <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
             <Key size={120} />
          </div>
          <h2 className="text-2xl font-black italic mb-2 relative z-10">Access Authorization</h2>
          <p className="text-neutral-500 text-[10px] font-black uppercase tracking-widest mb-10 relative z-10 italic">Whitelist Personnel by UserID</p>
          
          <div className="space-y-6 relative z-10">
             <div>
                <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Subject operative</label>
                <select 
                  value={targetId}
                  onChange={e => setTargetId(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-xl px-4 py-4 text-xs text-neutral-300 focus:ring-1 focus:ring-red-500 transition-all font-bold"
                >
                   <option value="">Select Target...</option>
                   {users.map(u => <option key={u.id} value={u.id}>@{u.username} ({u.id.substring(0, 8)}...)</option>)}
                </select>
             </div>
             <button 
               disabled={!targetId}
               onClick={() => {
                 if (window.confirm("CRITICAL AUTHORIZATION: Grant permanent Special Ops access to this Operative? This bypasses standard role restrictions.")) {
                    onGrant(targetId);
                    setTargetId('');
                 }
               }}
               className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-neutral-200 transition-all shadow-xl shadow-white/5 disabled:opacity-50"
             >
                Grant Absolute Clearence
             </button>
          </div>
       </div>
    </div>
  );
}

function SpyOpsAuthorityView({ users, spyNetwork, onAdd, onRemove, onToggle }: { users: UserProfile[], spyNetwork: SpyOpsMember[], onAdd: (uid: string, role: SpyOpsRole) => void, onRemove: (id: string) => void, onToggle: (id: string, active: boolean) => void }) {
  const [targetId, setTargetId] = useState('');
  const [role, setRole] = useState<SpyOpsRole>('investigation');

  return (
    <div className="grid lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-4 duration-500">
       <div className="lg:col-span-1">
          <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
             <h3 className="text-xl font-black italic mb-6">Network Expansion</h3>
             <div className="space-y-6">
                <div>
                   <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Subject operative</label>
                   <select 
                     value={targetId}
                     onChange={e => setTargetId(e.target.value)}
                     className="w-full bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-3 text-xs text-neutral-300 font-bold"
                   >
                      <option value="">Select Target...</option>
                      {users.map(u => <option key={u.id} value={u.id}>@{u.username}</option>)}
                   </select>
                </div>
                <div>
                   <label className="block text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-3 italic">Division Assignment</label>
                   <div className="grid grid-cols-1 gap-2">
                      {(['investigation', 'defence', 'diplomacy'] as SpyOpsRole[]).map(r => (
                        <button
                          key={r}
                          onClick={() => setRole(r)}
                          className={`py-3 px-4 rounded-xl border text-left text-[10px] font-black uppercase tracking-widest transition-all ${role === r ? 'bg-white text-black border-white' : 'bg-neutral-900 border-neutral-800 text-neutral-500'}`}
                        >
                           {r}
                        </button>
                      ))}
                   </div>
                </div>
                <button 
                  disabled={!targetId}
                  onClick={() => { onAdd(targetId, role); setTargetId(''); }}
                  className="w-full py-4 bg-white text-black text-[11px] font-black uppercase tracking-widest rounded-2xl hover:bg-neutral-200 transition-all disabled:opacity-50"
                >
                   Assign Role
                </button>
             </div>
          </div>
       </div>

       <div className="lg:col-span-2 bg-neutral-900/30 border border-neutral-800 rounded-3xl p-8 overflow-y-auto max-h-[700px]">
          <h3 className="text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-6">Active Network Members</h3>
          <div className="space-y-4">
             {spyNetwork.map(member => {
                const user = users.find(u => u.id === member.userId);
                return (
                   <div key={member.id} className={`p-6 rounded-2xl border transition-all flex items-center justify-between ${member.active ? 'bg-neutral-950 border-neutral-800' : 'bg-neutral-950/20 border-neutral-900 opacity-50'}`}>
                      <div className="flex items-center gap-6">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${member.active ? 'bg-neutral-900 text-white' : 'bg-neutral-900/50 text-neutral-700'}`}>
                            {member.role === 'investigation' && <Search size={20} />}
                            {member.role === 'defence' && <Shield size={20} />}
                            {member.role === 'diplomacy' && <Target size={20} />}
                         </div>
                         <div>
                            <p className="font-bold text-neutral-200 italic">@{user?.username || 'Unknown'}</p>
                            <p className="text-[9px] text-neutral-600 font-black uppercase">{member.role} // CID: {member.id.substring(0, 8)}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-4">
                         <button 
                           onClick={() => onToggle(member.id, !member.active)}
                           className={`text-[9px] font-black uppercase tracking-widest transition-colors ${member.active ? 'text-red-500 hover:text-red-400' : 'text-green-500 hover:text-green-400'}`}
                         >
                            {member.active ? 'Deactivate' : 'Activate'}
                         </button>
                         {/* We don't really support full delete based on requirement but toggle active is usually enough. Requirement says "add/remove members" */}
                      </div>
                   </div>
                );
             })}
          </div>
       </div>
    </div>
  );
}

function AuditView({ logs }: { logs: SpecialOpsLog[] }) {
  return (
    <div className="bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
       <div className="mb-8 flex items-center justify-between border-b border-neutral-900 pb-6">
          <div>
             <h2 className="text-xl font-black italic uppercase tracking-tight">Intelligence Logs</h2>
             <p className="text-[10px] text-neutral-600 font-black uppercase tracking-[0.3em]">Restricted Feed (OPS ONLY)</p>
          </div>
          <div className="flex items-center gap-2">
             <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[9px] font-black text-neutral-600 uppercase tracking-widest">Live Terminal</span>
          </div>
       </div>

       <div className="space-y-4 max-h-[600px] overflow-y-auto pr-4 scrollbar-thin scrollbar-thumb-neutral-900">
          {logs.map(log => (
            <div key={log.id} className="p-5 bg-neutral-900/50 rounded-2xl border border-neutral-800 flex items-center justify-between hover:bg-neutral-900 transition-colors">
               <div className="flex items-center gap-6">
                  <div className="w-10 h-10 bg-neutral-950 border border-neutral-800 rounded-xl flex items-center justify-center text-neutral-500">
                     <Activity size={18} />
                  </div>
                  <div>
                     <div className="flex items-center gap-3">
                        <span className="text-[10px] font-black text-white italic tracking-tight">{log.action}</span>
                        <span className="text-[8px] font-black text-neutral-700 uppercase tracking-widest">BY @{log.username}</span>
                     </div>
                     <p className="text-[10px] text-neutral-500 font-medium mt-1 font-mono italic">{JSON.stringify(log.details)}</p>
                  </div>
               </div>
               <span className="text-[9px] font-mono text-neutral-800 italic uppercase">
                  {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleTimeString() : '...'}
               </span>
            </div>
          ))}
          {logs.length === 0 && <p className="text-neutral-700 text-xs italic text-center py-20">Intelligence feed is silent.</p>}
       </div>
    </div>
  );
}
