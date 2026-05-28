import React, { useState, useEffect } from 'react';
import { useStore } from '../store';
import { LogIn, UserPlus, Shield, Activity, User as UserIcon, Eye, EyeOff, Check, AlertTriangle, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

type LoginMode = 'user' | 'admin' | 'monitor';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [mode, setMode] = useState<LoginMode>('user');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Custom interactive UX states
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  
  // Inline feedback states
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const { login, signUp, authError } = useStore();

  // Reset errors when mode or view shifts
  useEffect(() => {
    useStore.setState({ authError: null });
    setUsernameError('');
    setPasswordError('');
    setConfirmPasswordError('');
  }, [isLogin, mode]);

  // Handle inline validation when values change
  useEffect(() => {
    if (!isLogin && username) {
      if (username.length < 3) {
        setUsernameError('Username must be at least 3 characters');
      } else if (username.length > 20) {
        setUsernameError('Username cannot exceed 20 characters');
      } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        setUsernameError('Only alphanumeric letters, numbers, and underscores are allowed');
      } else {
        setUsernameError('');
      }
    } else {
      setUsernameError('');
    }
  }, [username, isLogin]);

  useEffect(() => {
    if (!isLogin && password) {
      if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters');
      } else {
        setPasswordError('');
      }
    } else {
      setPasswordError('');
    }
    
    // Check match
    if (!isLogin && confirmPassword) {
      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
    } else {
      setConfirmPasswordError('');
    }
  }, [password, confirmPassword, isLogin]);

  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, label: 'None', color: 'bg-neutral-800', width: 'w-0', text: 'text-neutral-500' };
    let score = 0;
    if (pass.length >= 6) score++;
    if (pass.length >= 10) score++;
    if (/[A-Z]/.test(pass)) score++;
    if (/[0-9]/.test(pass)) score++;
    if (/[^A-Za-z0-9]/.test(pass)) score++;
    
    switch (score) {
      case 1: return { score, label: 'Fragile', color: 'bg-red-500 shadow-md shadow-red-500/20', width: 'w-1/4', text: 'text-red-400' };
      case 2: return { score, label: 'Modest', color: 'bg-orange-500 shadow-md shadow-orange-500/20', width: 'w-2/4', text: 'text-orange-400' };
      case 3: return { score, label: 'Satisfactory', color: 'bg-yellow-500 shadow-md shadow-yellow-500/20', width: 'w-3/4', text: 'text-yellow-400' };
      case 4:
      case 5: return { score, label: 'Fortified', color: 'bg-emerald-500 shadow-md shadow-emerald-500/20', width: 'w-full', text: 'text-emerald-400' };
      default: return { score: 0, label: 'None', color: 'bg-neutral-800', width: 'w-0', text: 'text-neutral-500' };
    }
  };

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    useStore.setState({ authError: null });
    const trimmedUsername = username.trim();

    // Core validation checks
    if (!trimmedUsername || !password) {
      useStore.setState({ authError: "All credentials are required to establish connection." });
      return;
    }

    if (!isLogin) {
      const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
      if (!usernameRegex.test(trimmedUsername)) {
        setUsernameError("Username must be 3-20 characters, containing only letters, numbers, or underscores.");
        return;
      }

      if (password.length < 6) {
        setPasswordError("Password must be at least 6 characters.");
        return;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError("Passwords do not match.");
        return;
      }
    }

    setLoading(true);

    try {
      if (isLogin) {
        console.log(`[UI_LOGIN] Submitting connection req for user: @${trimmedUsername} Mode: ${mode}`);
        const success = await login(trimmedUsername, password);
        console.log(`[UI_LOGIN_RESULT] Login response status: ${success ? 'RESOLVED' : 'REJECTED'}`);
      } else {
        console.log(`[UI_SIGNUP] Initiating account generation: @${trimmedUsername} Role requested: ${mode}`);
        const success = await signUp(trimmedUsername, '', password, mode);
        console.log(`[UI_SIGNUP_RESULT] Account creation response: ${success ? 'RESOLVED' : 'REJECTED'}`);
        
        if (success) {
          setSignUpSuccess(true);
          console.log("[UI_SIGNUP] Transitioning into success message context. Handing over to admin queue.");
          
          setTimeout(() => {
            setSignUpSuccess(false);
            setIsLogin(true); // Switch to login tab
            setPassword('');
            setConfirmPassword('');
          }, 4500);
        }
      }
    } catch (err: any) {
      console.error("[UI_SUBMIT_FATAL] Error occurred during processing stream:", err);
      useStore.setState({ authError: err.message || "A secure connection could not be established." });
    } finally {
      setLoading(false);
    }
  };

  const getModeStyles = () => {
    switch (mode) {
      case 'admin': return { 
        bg: 'bg-red-500/10', 
        border: 'border-red-500/20', 
        text: 'text-red-400 shadow-sm shadow-red-500/10', 
        label: 'Admin Terminal Access', 
        focus: 'focus:border-red-500 focus:ring-red-500/10', 
        button: 'bg-red-600 hover:bg-red-500 shadow-xl shadow-red-950/40 text-red-50',
        accent: 'text-red-500'
      };
      case 'monitor': return { 
        bg: 'bg-orange-500/10', 
        border: 'border-orange-500/20', 
        text: 'text-orange-400 shadow-sm shadow-orange-500/10', 
        label: 'Council Workspace Clearance', 
        focus: 'focus:border-orange-500 focus:ring-orange-500/10', 
        button: 'bg-orange-600 hover:bg-orange-500 shadow-xl shadow-orange-950/40 text-orange-50',
        accent: 'text-orange-500'
      };
      default: return { 
        bg: 'bg-blue-500/10', 
        border: 'border-blue-500/20', 
        text: 'text-blue-400 shadow-sm shadow-blue-500/10', 
        label: 'Standard User Access', 
        focus: 'focus:border-blue-500 focus:ring-blue-500/10', 
        button: 'bg-blue-600 hover:bg-blue-500 shadow-xl shadow-blue-950/40 text-blue-50',
        accent: 'text-blue-500'
      };
    }
  };

  const style = getModeStyles();

  return (
    <div className="min-h-screen bg-neutral-950 flex items-center justify-center p-4 selection:bg-neutral-800 selection:text-white">
      {/* Cinematic Cyberpunk Background Accents */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      
      <motion.div 
        key={isLogin ? "login" : "signup"}
        initial={{ opacity: 0, scale: 0.97, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md bg-neutral-900/90 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl relative backdrop-blur-md"
      >
        {/* Connection Mode Ribbon Banner */}
        <div className={`absolute top-0 left-0 right-0 h-14 px-4 flex items-center justify-between ${style.bg} border-b ${style.border} transition-colors duration-300`}>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full animate-pulse ${mode === 'admin' ? 'bg-red-500' : mode === 'monitor' ? 'bg-orange-500' : 'bg-blue-500'}`} />
            <div className={`text-[10px] font-black uppercase tracking-[0.2em] font-mono ${style.text}`}>
              {style.label} {isLogin ? 'SECURED' : 'REGISTRATION'}
            </div>
          </div>
          <div className="text-[9px] font-mono text-neutral-500 tracking-wider">
            UTC: {new Date().toISOString().substring(11, 19)}
          </div>
        </div>

        <div className="p-8 pt-20">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black bg-gradient-to-r from-neutral-100 via-neutral-200 to-neutral-400 bg-clip-text text-transparent italic tracking-wider uppercase font-sans">
              DebtFlow
            </h1>
            <p className="text-neutral-500 text-[11px] font-mono uppercase tracking-[0.15em] mt-1.5">
              {isLogin ? 'SYSTEM INITIALIZATION & ACCESS AUTHORIZATION' : 'ESTABLISH NEW DEBTFLOW PROTOCOL IDENTITY'}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {signUpSuccess ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-12 flex flex-col items-center justify-center text-center space-y-4"
              >
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-lg shadow-emerald-500/10">
                  <Check size={32} className="animate-bounce" />
                </div>
                <h3 className="text-lg font-black font-sans text-emerald-400 uppercase tracking-widest text-center">Protocol Logged</h3>
                <p className="text-neutral-200 text-xs max-w-sm font-mono leading-relaxed px-4 text-center">
                  Request sent for admin validation.
                </p>
                <div className="w-24 h-1.5 bg-neutral-950 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ left: '-100%' }}
                    animate={{ left: '100%' }}
                    transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                    className="h-full bg-emerald-500 relative w-1/2" 
                  />
                </div>
              </motion.div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* Protocol Clearance Tabs */}
                <div>
                  <span className="block text-[10px] font-black text-neutral-500 uppercase tracking-widest mb-2 font-mono">
                    Select Clearance Mode
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setMode('user')}
                      className={`py-2 px-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all font-mono flex flex-col items-center gap-1.5 ${mode === 'user' ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-md shadow-blue-500/5' : 'bg-neutral-950/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'}`}
                    >
                      <UserIcon size={12} />
                      Standard
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('monitor')}
                      className={`py-2 px-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all font-mono flex flex-col items-center gap-1.5 ${mode === 'monitor' ? 'bg-orange-500/10 border-orange-500/40 text-orange-400 shadow-md shadow-orange-500/5' : 'bg-neutral-950/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'}`}
                    >
                      <Activity size={12} />
                      Council Workspace
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('admin')}
                      className={`py-2 px-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all font-mono flex flex-col items-center gap-1.5 ${mode === 'admin' ? 'bg-red-500/10 border-red-500/40 text-red-400 shadow-md shadow-red-500/5' : 'bg-neutral-950/50 border-neutral-800 text-neutral-500 hover:border-neutral-700 hover:text-neutral-400'}`}
                    >
                      <Shield size={12} />
                      Admin Terminal
                    </button>
                  </div>
                </div>

                {/* Username Input Field */}
                <div>
                  <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 font-mono">
                    Ledger Username
                  </label>
                  <div className="relative flex items-center">
                    <input
                      type="text"
                      id="username-input"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className={`w-full bg-neutral-950 border ${usernameError ? 'border-red-500/50' : 'border-neutral-800'} rounded-lg pl-4 pr-32 py-3 text-neutral-200 text-sm focus:outline-none transition-all font-mono placeholder:text-neutral-700 ${style.focus}`}
                      placeholder="e.g. simba"
                      disabled={loading}
                      required
                    />
                    <div className="absolute right-3 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[9px] font-black text-neutral-500 uppercase tracking-widest pointer-events-none select-none font-mono">
                      @debtflow.com
                    </div>
                  </div>
                  {/* Inline username feedback */}
                  <AnimatePresence>
                    {usernameError && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-[10px] mt-1.5 font-mono flex items-center gap-1.5"
                      >
                        <AlertTriangle size={10} />
                        {usernameError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Password Input Field */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest font-mono">
                      Security Password
                    </label>
                    {!isLogin && password && (
                      <span className={`text-[9px] font-black uppercase tracking-wider font-mono ${strength.text}`}>
                        Strength: {strength.label}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password-input"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={`w-full bg-neutral-950 border ${passwordError ? 'border-red-500/50' : 'border-neutral-800'} rounded-lg pl-4 pr-12 py-3 text-neutral-200 text-sm focus:outline-none transition-all font-mono placeholder:text-neutral-700 ${style.focus}`}
                      placeholder="••••••••"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 p-1.5 text-neutral-500 hover:text-neutral-300 transition-colors rounded"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  
                  {/* Password Strength Meter Overlay */}
                  {!isLogin && password && (
                    <div className="mt-2 bg-neutral-950 border border-neutral-800/60 p-1.5 rounded-md">
                      <div className="w-full h-1 bg-neutral-900 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full ${strength.color} transition-all duration-300`} 
                          animate={{ width: strength.score === 1 ? '25%' : strength.score === 2 ? '50%' : strength.score === 3 ? '75%' : strength.score >= 4 ? '100%' : '0%' }}
                        />
                      </div>
                      <p className="text-[8px] text-neutral-500 mt-1 font-mono tracking-wide leading-relaxed">
                        Secure protocols recommend min 6 characters combining uppercase, numbers, and symbols.
                      </p>
                    </div>
                  )}

                  {/* Inline password error */}
                  <AnimatePresence>
                    {passwordError && (
                      <motion.p 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="text-red-400 text-[10px] mt-1.5 font-mono flex items-center gap-1.5"
                      >
                        <AlertTriangle size={10} />
                        {passwordError}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </div>

                {/* Confirm Password Input (Only on Sign Up) */}
                <AnimatePresence>
                  {!isLogin && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <label className="block text-[10px] font-black text-neutral-400 uppercase tracking-widest mb-2 font-mono">
                        Conform Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="confirm-password-input"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className={`w-full bg-neutral-950 border ${confirmPasswordError ? 'border-red-500/50' : 'border-neutral-800'} rounded-lg pl-4 pr-12 py-3 text-neutral-200 text-sm focus:outline-none transition-all font-mono placeholder:text-neutral-700 ${style.focus}`}
                          placeholder="••••••••"
                          disabled={loading}
                          required
                        />
                      </div>
                      {confirmPasswordError && (
                        <p className="text-red-400 text-[10px] mt-1.5 font-mono flex items-center gap-1.5">
                          <AlertTriangle size={10} />
                          {confirmPasswordError}
                        </p>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Remember Me Toggle */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="sr-only"
                    />
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${rememberMe ? 'bg-blue-600 border-blue-500 text-white' : 'bg-neutral-950 border-neutral-800 text-transparent hover:border-neutral-700'}`}>
                      <Check size={10} className="stroke-[3]" />
                    </div>
                    <span className="text-[10px] font-black text-neutral-500 hover:text-neutral-400 font-mono uppercase tracking-widest transition-colors">
                      Remember Session
                    </span>
                  </label>
                  
                  {isLogin && (
                    <span className="text-[9px] font-mono text-neutral-500 italic">
                      Security Level: Class IV
                    </span>
                  )}
                </div>

                {/* Real-time system authentication errors */}
                <AnimatePresence>
                  {authError && (
                    <motion.div 
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="bg-red-500/5 p-3.5 rounded-lg border border-red-500/20 text-red-400 text-[10px] font-mono leading-relaxed"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle size={14} className="flex-shrink-0 text-red-500 mt-0.5" />
                        <div>
                          <span className="font-black uppercase tracking-wider block mb-1 font-bold">
                            {isLogin ? "Authorization Refused" : "Registration Refused"}
                          </span>
                          {authError}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Submission Action Button */}
                <button
                  type="submit"
                  disabled={loading || !!usernameError || !!passwordError || !!confirmPasswordError}
                  className={`w-full ${style.button} font-black uppercase tracking-widest py-3.5 rounded-lg text-xs mt-3 transition-all flex items-center justify-center gap-2 overflow-hidden relative group disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {/* Subtle hover laser glow */}
                  <span className="absolute inset-0 w-full h-full bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {loading ? (
                    <div className="w-5 h-5 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
                  ) : isLogin ? (
                    <LogIn size={15} />
                  ) : (
                    <UserPlus size={15} />
                  )}
                  {loading 
                    ? (isLogin ? 'TRANSMITTING CODES...' : 'ENCODING DECK PROFILE...') 
                    : (isLogin ? `Authorize Connection` : 'Generate Protocol Profile')}
                </button>
              </form>
            )}
          </AnimatePresence>

          {/* Core Navigation Triggers inside visual box */}
          <div className="mt-8 pt-6 border-t border-neutral-800 text-center flex items-center justify-between">
            <button
              onClick={() => setIsLogin(!isLogin)}
              disabled={loading}
              className="text-neutral-500 hover:text-neutral-300 text-[10px] font-black uppercase tracking-widest font-mono transition-all hover:tracking-wider duration-300 disabled:opacity-50"
            >
              {isLogin ? "Generate Account" : "Access Authorized Deck"}
            </button>
            {mode !== 'user' && (
              <button 
                onClick={() => setMode('user')}
                disabled={loading}
                className="text-neutral-500 hover:text-white text-[10px] font-mono tracking-tighter transition-colors select-none"
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
