import React, { useState } from 'react';
import { useStore } from '../store';
import { LogIn, UserPlus, Shield, Activity, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

type LoginMode = 'user' | 'admin' | 'monitor';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [mode, setMode] = useState<LoginMode>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const { login, signUp, authError } = useStore();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      await login(username, password);
    } else {
      if (password !== confirmPassword) {
        useStore.setState({ authError: "Passwords do not match" });
        return;
      }
      // Pass the selected mode as the requested role (user remains user but with a pending high-privilege request if selected)
      await signUp(username, '', password, mode === 'user' ? undefined : mode);
    }
  };

  const getModeStyles = () => {
    switch (mode) {
      case 'admin': return { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', label: 'Admin Access' };
      case 'monitor': return { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Monitor Authority' };
      default: return { bg: '', border: '', text: '', label: 'Standard User' };
    }
  };

  const style = getModeStyles();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative"
      >
        {mode !== 'user' && (
          <div className={`absolute top-0 left-0 right-0 h-1 px-4 py-8 flex items-center justify-center ${style.bg} border-b ${style.border}`}>
             <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] ${style.text}`}>
                {mode === 'admin' ? <Shield size={12} /> : <Activity size={12} />}
                {style.label} {isLogin ? '' : 'REQUESTED'}
             </div>
          </div>
        )}

        <div className={`p-8 ${mode !== 'user' ? 'pt-20' : ''}`}>
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold bg-gradient-to-br from-blue-400 to-blue-600 bg-clip-text text-transparent italic">
              DebtFlow
            </h1>
            <p className="text-neutral-500 text-sm mt-2">{isLogin ? 'Work Exchange System' : 'Protocol Registration'}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Mode selection for both Login and Registration */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              <button
                type="button"
                onClick={() => setMode('user')}
                className={`py-2 px-1 text-[8px] font-black uppercase tracking-tighter rounded-lg border transition-all ${mode === 'user' ? 'bg-blue-500/10 border-blue-500 text-blue-500' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
              >
                Standard
              </button>
              <button
                type="button"
                onClick={() => setMode('monitor')}
                className={`py-2 px-1 text-[8px] font-black uppercase tracking-tighter rounded-lg border transition-all ${mode === 'monitor' ? 'bg-orange-500/10 border-orange-500 text-orange-500' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
              >
                Monitor Deck
              </button>
              <button
                type="button"
                onClick={() => setMode('admin')}
                className={`py-2 px-1 text-[8px] font-black uppercase tracking-tighter rounded-lg border transition-all ${mode === 'admin' ? 'bg-red-500/10 border-red-500 text-red-500' : 'bg-neutral-950 border-neutral-800 text-neutral-600'}`}
              >
                Admin Terminal
              </button>
            </div>
            <div>
              <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">
                Username
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-4 pr-32 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                  placeholder="e.g. simba"
                  required
                />
                <div className="absolute right-3 px-3 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] font-black text-neutral-500 uppercase tracking-widest pointer-events-none">
                  @debtflow.com
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                  placeholder="********"
                  required
                />
              </div>

              {!isLogin && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-3 text-neutral-200 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20 transition-all font-mono"
                    placeholder="********"
                    required
                  />
                </motion.div>
              )}
            </div>

            {authError && (
              <p className="text-red-500 text-xs mt-2 bg-red-500/5 p-3 rounded-lg border border-red-500/20">{authError}</p>
            )}

            <button
              type="submit"
              className={`w-full ${mode === 'admin' ? 'bg-red-600 hover:bg-red-500' : mode === 'monitor' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'} text-white font-semibold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-lg`}
            >
              {isLogin ? <LogIn size={18} /> : <UserPlus size={18} />}
              {isLogin ? `Authorize ${mode}` : 'CREATE ACCOUNT'}
            </button>
          </form>

          {isLogin && (
            <div className={`mt-6 border-t border-neutral-800 pt-6`}>
               <p className="text-[9px] text-neutral-600 font-black uppercase text-center mb-4 tracking-[0.2em]">Select specialized protocol above for high-clearance access</p>
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-neutral-800 text-center flex items-center justify-between">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-neutral-500 hover:text-white text-xs transition-colors"
            >
              {isLogin ? "CREATE ACCOUNT" : "Already Registered?"}
            </button>
            {mode !== 'user' && (
               <button 
                onClick={() => setMode('user')}
                className="text-blue-500 hover:text-blue-400 text-[10px] font-black uppercase tracking-widest"
               >
                 Exit Secure Mode
               </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
