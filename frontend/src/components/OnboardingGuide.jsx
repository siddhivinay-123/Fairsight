import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingGuide({ onDismiss, onTabChange }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);
  const containerRef = useRef(null);

  const steps = [
    {
      title: "Welcome to FairSight!",
      desc: "This guide will walk you through all the features of the Responsible AI ecosystem. Click 'NEXT STEP' to begin.",
      target: null, tab: 'dashboard'
    },
    {
      title: "System KPIs",
      desc: "Monitor your overall fairness score and bias detection metrics in real-time.",
      target: "#tour-kpis", tab: 'dashboard'
    },
    {
      title: "Fairness Trends",
      desc: "Analyze score fluctuations over the last 24 hours to catch systemic issues early.",
      target: "#tour-trend", tab: 'dashboard'
    },
    {
      title: "Live Feed Stream",
      desc: "Switching to the Live Feed... Here you can see every single AI decision being processed by the engine.",
      target: "#tour-feed-stream", tab: 'live'
    },
    {
      title: "Decision Details",
      desc: "Inspect specific audits to see SHAP explainability and automated remediation advice.",
      target: "#tour-feed-details", tab: 'live'
    },
    {
      title: "Manual Audit Tool",
      desc: "Switching to the Audit Tool... Use this to manually test candidate profiles and get career guidance.",
      target: "#tour-audit-form", tab: 'audit'
    },
    {
      title: "Audit Results",
      desc: "View fairness metrics like Disparate Impact and get AI-powered career winning tips.",
      target: "#tour-audit-result", tab: 'audit'
    },
    {
      title: "Advanced Analytics",
      desc: "Switching to Analytics... Deep-dive into domain distributions and score correction impacts.",
      target: "#tour-analytics-charts", tab: 'analytics'
    },
    {
      title: "Interactive Demo",
      desc: "Finally, our Demo Mode provides real-world scenarios to test bias detection in different contexts.",
      target: "#tour-demo-grid", tab: 'demo'
    },
    {
      title: "Ready to Explore!",
      desc: "You now know all the core features. Start auditing and ensure AI fairness across your platform.",
      target: null, tab: 'dashboard'
    }
  ];

  const currentStep = steps[step];

  // Handle Tab Switching
  useEffect(() => {
    if (onTabChange && currentStep.tab) {
      onTabChange(currentStep.tab);
    }
  }, [step, currentStep.tab, onTabChange]);

  const updateTargetRect = useCallback(() => {
    const targetId = steps[step].target;
    if (!targetId) {
      setTargetRect(null);
      return;
    }
    
    // Add a small delay for tab switching transition
    setTimeout(() => {
      const el = document.querySelector(targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    }, 100);
  }, [step]);

  useEffect(() => {
    updateTargetRect();
    window.addEventListener('resize', updateTargetRect);
    return () => window.removeEventListener('resize', updateTargetRect);
  }, [updateTargetRect]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onDismiss();
    }
  };

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none" ref={containerRef}>
      {/* Dimmer backdrop */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px] pointer-events-auto"
        onClick={() => {}} 
      />

      {/* Spotlight Effect */}
      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={currentStep.target}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute border-2 border-[#39ff14] shadow-[0_0_30px_#39ff1444] bg-white/5 rounded-xl pointer-events-none z-[101]"
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        )}
      </AnimatePresence>

      {/* Tooltip Content */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <motion.div
          key={step}
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className={`glass-panel p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border/50 pointer-events-auto z-[102] w-[340px] 
            ${targetRect ? 'absolute' : 'relative'}`}
          style={targetRect ? {
            top: targetRect.bottom + 40 > window.innerHeight - 250 ? targetRect.top - 240 : targetRect.bottom + 40,
            left: Math.min(Math.max(20, targetRect.left + (targetRect.width / 2) - 170), window.innerWidth - 360)
          } : {}}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex gap-1">
              {steps.map((_, i) => (
                <div key={i} className={`h-1 w-4 rounded-full transition-colors ${i === step ? 'bg-neon' : 'bg-border'}`} />
              ))}
            </div>
            <button 
              onClick={onDismiss}
              className="text-muted hover:text-white text-[10px] font-mono transition-colors uppercase tracking-widest"
            >
              Skip
            </button>
          </div>
          
          <h3 className="text-xl font-display font-bold text-white mb-3 flex items-center gap-2">
            <span className="text-neon animate-pulse">✦</span> {currentStep.title}
          </h3>
          <p className="text-sm text-[#8892b0] font-body leading-relaxed mb-8">
            {currentStep.desc}
          </p>

          <div className="flex gap-4">
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex-1 py-2.5 px-4 rounded border border-border text-[#e2e8f0] font-mono text-xs hover:bg-white/5 transition-colors"
              >
                BACK
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-[2] py-2.5 px-4 rounded bg-neon/10 border border-neon/40 text-neon font-mono text-xs hover:bg-neon/20 transition-all shadow-[0_0_15px_rgba(57,255,20,0.15)] flex items-center justify-center gap-2"
            >
              {step === steps.length - 1 ? 'LAUNCH PLATFORM' : 'NEXT STEP'}
              <span className="text-[10px]">→</span>
            </button>
          </div>

          {/* Arrow pointing to element */}
          {targetRect && (
            <div className={`absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-[#141d35] border-l border-t border-border/50 rotate-45 
              ${targetRect.bottom + 40 > window.innerHeight - 250 ? '-bottom-2 rotate-[225deg]' : '-top-2'}`} 
            />
          )}
        </motion.div>
      </div>
    </div>
  );
}
