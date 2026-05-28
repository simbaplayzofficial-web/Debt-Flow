import React, { useState } from 'react';
import { useStore } from './store';
import { 
  LayoutDashboard, User as UserIcon, Users, Settings, 
  LogOut, Bell, Menu, X, ChevronRight, ShieldCheck, Database, Gavel,
  EyeOff, MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Components
import Dashboard from './components/Dashboard';
import Profile from './components/Profile';
import Groups from './components/Groups';
import Login from './components/Login';
import MasterDataPanel from './components/MasterDataPanel';
import Representatives from './components/Representatives';
import SpecialOps from './components/SpecialOps';
import { MonitorWorkspace } from './components/MonitorWorkspace';
import Chatterbox from './components/Chatterbox';
import ControlPanel from './components/ControlPanel';
import { TutorialGateway } from './components/Onboarding/TutorialGateway';

function SidebarItem({ icon: Icon, label, active, onClick, className = '' }: { icon: any, label: string, active: boolean, onClick: () => void, className?: string }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
        active 
          ? 'bg-blue-600/10 text-blue-400 font-medium' 
          : 'text-neutral-500 hover:bg-neutral-900 hover:text-neutral-200'
      } ${className}`}
    >
      <Icon size={20} className={active ? 'text-blue-500' : ''} />
      <span className="flex-1 text-left">{label}</span>
      {active && <ChevronRight size={14} className="opacity-50" />}
    </button>
  );
}

export default function App() {
  const { currentUser, logout, isLoading, hasSpecialAccess, specialOpsMode, setSpecialOpsMode } = useStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Role-based Access Enforcement
  React.useEffect(() => {
    if (!currentUser) return;
    
    const accessMap: Record<string, boolean> = {
      dashboard: true,
      profile: true,
      groups: true,
      chatterbox: true,
      representatives: true,
      specialops: hasSpecialAccess && specialOpsMode,
      monitor: currentUser.role === 'admin' || currentUser.role === 'monitor',
      master: currentUser.role === 'admin',
      control: currentUser.role === 'admin'
    };

    if (!accessMap[activeTab]) {
      setActiveTab('dashboard');
    }
  }, [currentUser, activeTab, hasSpecialAccess, specialOpsMode]);

  // DEBUG LOG (Requested)
  React.useEffect(() => {
    if (currentUser) {
      console.log("Current Role (UI State):", currentUser.role);
    }
  }, [currentUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (!currentUser) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'profile': return <Profile />;
      case 'groups': return <Groups />;
      case 'master': return <MasterDataPanel />;
      case 'representatives': return <Representatives />;
      case 'specialops': return <SpecialOps />;
      case 'monitor': return <MonitorWorkspace />;
      case 'chatterbox': return <Chatterbox />;
      case 'control': return <ControlPanel />;
      default: return <Dashboard />;
    }
  };

  if (hasSpecialAccess && specialOpsMode) {
    return (
      <div className="min-h-screen bg-black text-red-500 flex flex-col font-mono selection:bg-red-650/30 overflow-hidden relative">
        {/* Cybersecurity scanline aesthetic */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.002),rgba(0,0,255,0.03))] bg-[size:100%_4px,3px_100%] pointer-events-none z-50 opacity-35" />
        
        {/* Classified Top Navigation Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-red-950 bg-neutral-950/90 backdrop-blur-xl relative z-40">
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-red-600 shadow-[0_0_10px_#ef4444] animate-pulse" />
            <span className="w-2.5 h-2.5 absolute rounded-full bg-red-500" />
            <h1 className="text-sm font-black tracking-[0.3em] uppercase text-red-500">
              SPECIAL OPERATIONS SECURE PORTAL
            </h1>
            <span className="px-2 py-0.5 border border-red-500/20 text-[8px] bg-red-950/20 text-red-400 font-bold tracking-widest uppercase">
              Classified Stream
            </span>
          </div>

          <div className="flex items-center gap-4">
            <p className="text-[10px] text-neutral-500 tracking-wider font-bold uppercase">
              OPERATIVE: @{currentUser.username} | CLEARANCE: OMNI
            </p>
            <button
              onClick={() => {
                setSpecialOpsMode(false);
                setActiveTab('dashboard');
              }}
              className="px-4 py-2 bg-red-950/65 hover:bg-red-900/65 border border-red-500/30 hover:border-red-500 text-red-450 rounded-xl transition-all text-xs font-black uppercase tracking-widest flex items-center gap-2 shadow-[0_0_15px_rgba(239,68,68,0.1)] hover:shadow-[0_0_20px_rgba(239,68,68,0.2)] cursor-pointer"
            >
              <EyeOff size={14} />
              Terminate Session
            </button>
          </div>
        </header>

        {/* Classified Console Workspace */}
        <div className="flex-1 overflow-y-auto bg-black p-8 text-neutral-200">
          <div className="max-w-7xl mx-auto space-y-8">
            <SpecialOps />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex overflow-hidden font-sans selection:bg-blue-500/30">
      <TutorialGateway />
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setIsSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-neutral-900 border-r border-neutral-800 
        transform transition-transform duration-300 ease-out flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center font-bold text-white">D</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent italic">
              DebtFlow
            </h1>
          </div>
          <button className="lg:hidden text-neutral-500 hover:text-white" onClick={() => setIsSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 py-4">
          <SidebarItem 
            icon={LayoutDashboard} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => { setActiveTab('dashboard'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={UserIcon} 
            label="Profile" 
            active={activeTab === 'profile'} 
            onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={Users} 
            label="Groups" 
            active={activeTab === 'groups'} 
            onClick={() => { setActiveTab('groups'); setIsSidebarOpen(false); }} 
          />
          <SidebarItem 
            icon={MessageCircle} 
            label="Chatterbox" 
            active={activeTab === 'chatterbox'} 
            onClick={() => { setActiveTab('chatterbox'); setIsSidebarOpen(false); }} 
            className="text-amber-400 border-amber-500/10 hover:bg-amber-500/10"
          />
          <SidebarItem 
            icon={UserIcon} 
            label="Representatives" 
            active={activeTab === 'representatives'} 
            onClick={() => { setActiveTab('representatives'); setIsSidebarOpen(false); }} 
          />
          {(currentUser.role === 'admin' || currentUser.role === 'monitor') && (
            <SidebarItem 
              icon={ShieldCheck} 
              label="Council Workspace" 
              active={activeTab === 'monitor'} 
              onClick={() => { setActiveTab('monitor'); setIsSidebarOpen(false); }} 
              className="bg-blue-500/5 text-blue-400 border-blue-500/10 hover:bg-blue-500/10"
            />
          )}
          {currentUser.role === 'admin' && (
            <SidebarItem 
              icon={Settings} 
              label="Control Panel" 
              active={activeTab === 'control'} 
              onClick={() => { setActiveTab('control'); setIsSidebarOpen(false); }} 
              className="bg-purple-500/5 text-purple-400 border-purple-500/10 hover:bg-purple-500/10"
            />
          )}
          {currentUser.role === 'admin' && (
            <SidebarItem 
              icon={Database} 
              label="Master Data" 
              active={activeTab === 'master'} 
              onClick={() => { setActiveTab('master'); setIsSidebarOpen(false); }} 
            />
          )}
        </nav>

        <div className="p-4 border-t border-neutral-800 space-y-4">
          <div className="px-4 py-3 bg-neutral-950 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-neutral-900 rounded-full flex items-center justify-center border border-neutral-700">
                <UserIcon size={20} className="text-neutral-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{currentUser.username}</p>
                <div className="flex items-center gap-1 text-[10px] text-neutral-500 uppercase tracking-widest font-bold">
                  {currentUser.role !== 'user' && <ShieldCheck size={10} className="text-blue-500" />}
                  {currentUser.role.replace('_', ' ')}
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-xl transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-neutral-800 bg-neutral-900/50 backdrop-blur-xl z-30">
          <button 
            className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 px-4 lg:hidden">
             <h1 className="text-lg font-bold italic bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">DebtFlow</h1>
          </div>

          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={() => alert("COMMUNICATION HUB: Your activity is fully synchronized with the DebtFlow cloud.")}
              className="p-2 text-neutral-500 hover:text-neutral-200 relative transition-colors shadow-sm"
            >
              <Bell size={20} />
              <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-blue-500 rounded-full" />
            </button>
          </div>
        </header>

        {/* Scrollable Area */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 lg:p-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="max-w-7xl mx-auto"
          >
            {renderContent()}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
