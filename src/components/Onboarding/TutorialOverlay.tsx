import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useStore } from '../../store';
import { featureRegistry } from '../../featureRegistry';
import { ShieldCheck, Info, ChevronRight, X } from 'lucide-react';

export const TutorialOverlay = () => {
    const { currentUser, isTutorialRunning, completeTutorial } = useStore();
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    
    // Filter registry based on role
    const steps = featureRegistry.filter(f => currentUser && f.roleAccess.includes(currentUser.role));
    
    if (!isTutorialRunning || steps.length === 0) return null;
    
    const currentStep = steps[currentStepIndex];
    
    const next = () => {
        if (currentStepIndex < steps.length - 1) {
            setCurrentStepIndex(currentStepIndex + 1);
        } else {
            completeTutorial();
        }
    };
    
    const skip = () => {
        completeTutorial();
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-neutral-900 border border-neutral-700 p-8 rounded-3xl max-w-lg w-full mx-4 shadow-2xl relative overflow-hidden"
            >
                {/* Cyberpunk aura */}
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <Info size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase text-blue-500 tracking-[0.2em] italic font-mono">
                           OPERATIONAL BRIEFING {currentStepIndex + 1} / {steps.length}
                        </span>
                    </div>
                    <button onClick={skip} className="text-neutral-500 hover:text-neutral-200 transition-colors p-1">
                        <X size={16} />
                    </button>
                </div>
                
                <h2 className="text-2xl font-black text-white italic mb-4 font-mono tracking-tighter">
                   {currentStep.title} ACCESS
                </h2>
                <div className="text-neutral-300 text-xs mb-8 leading-relaxed font-mono bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                    {currentStep.description}
                </div>
                
                <div className="flex justify-between items-center">
                    <button 
                        onClick={() => setCurrentStepIndex(Math.max(0, currentStepIndex - 1))} 
                        disabled={currentStepIndex === 0}
                        className="text-neutral-600 hover:text-neutral-300 font-bold text-[10px] uppercase italic tracking-widest disabled:opacity-30"
                    >
                        Revert Step
                    </button>
                    <button 
                        onClick={next} 
                        className="bg-blue-600 text-white font-black text-[10px] uppercase px-8 py-3 rounded-xl italic tracking-widest flex items-center gap-2 hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        {currentStepIndex < steps.length - 1 ? 'Acknowledge' : 'Finalize Protocol'}
                        <ChevronRight size={14} />
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
