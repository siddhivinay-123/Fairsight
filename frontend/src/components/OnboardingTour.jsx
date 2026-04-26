import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function OnboardingTour({ onDismiss, onTabChange }) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState(null);

  const steps = [
    {
      title: "Welcome to FairSight!",
      desc: "The world's most advanced Responsible AI auditing platform. Let's take a quick 9-step tour.",
      insight: "Our engine processes 1,000+ data points per second to ensure fairness.",
      target: null, tab: 'dashboard'
    },
    {
      title: "Real-Time System KPIs",
      desc: "Monitor your platform's health. We track total audits, caught bias, and average fairness scores live.",
      insight: "Real-time bias tracking ensures compliance with laws like NYC LL144.",
      target: "#tour-kpis", tab: 'dashboard'
    },
    {
      title: "Fairness Trends",
      desc: "Watch how your AI's fairness evolves. Identifying score dips helps you stop bias before it scales.",
      insight: "SHAP is the same technique used by Google, Microsoft, and IBM to explain AI.",
      target: "#tour-trend", tab: 'dashboard'
    },
    {
      title: "Live Decision Stream",
      desc: "Every automated decision made by your company flows through here for a transparency audit.",
      insight: "Continuous monitoring prevents 'model drift' where AI becomes biased over time.",
      target: "#tour-feed-stream", tab: 'live'
    },
    {
      title: "Explainable AI (XAI)",
      desc: "Dive into any specific decision. See exactly which factors (age, location, etc.) caused a bias flag.",
      insight: "Transparency in AI decisions is the primary requirement of the EU AI Act.",
      target: "#tour-feed-details", tab: 'live'
    },
    {
      title: "Manual Audit Tool",
      desc: "Have a suspicious case? Input the criteria here to run a manual 'Human-in-the-Loop' audit.",
      insight: "Manual overrides are essential for handling complex, edge-case discrimination.",
      target: "#tour-audit-form", tab: 'audit'
    },
    {
      title: "The AI Career Coach",
      desc: "Our newest feature! Analyze resumes for bias, calculate ATS scores, and get a 4-phase career roadmap.",
      insight: "AI-driven guidance removes subconscious recruiter bias from the hiring pipeline.",
      target: "#tour-sidebar", tab: 'career' // Highlighting sidebar tab since it's new
    },
    {
      title: "Advanced Analytics",
      desc: "Aggregated reports for legal compliance. Export domain distributions and fairness history.",
      insight: "Statistical parity is a key legal metric for proving non-discriminatory hiring.",
      target: "#tour-analytics-charts", tab: 'analytics'
    },
    {
      title: "You're All Set!",
      desc: "FairSight is now active. You can replay this tour anytime by clicking the '?' button in the header.",
      insight: "Remember: Responsible AI isn't a feature—it's a requirement.",
      target: null, tab: 'dashboard'
    }
  ];

  const currentStep = steps[step];

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
    
    setTimeout(() => {
      const el = document.querySelector(targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
      }
    }, 150);
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
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px] pointer-events-auto"
      />

      <AnimatePresence mode="wait">
        {targetRect && (
          <motion.div
            key={currentStep.target}
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute border-2 border-neon shadow-[0_0_40px_#39ff1444] bg-white/5 rounded-xl pointer-events-none z-[101]"
            style={{
              top: targetRect.top - 12,
              left: targetRect.left - 12,
              width: targetRect.width + 24,
              height: targetRect.height + 24,
            }}
          />
        )}
      </AnimatePresence>

      <div className="absolute inset-0 flex flex-col items-center justify-end pb-20 pointer-events-none">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass-panel p-8 shadow-[0_30px_70px_rgba(0,0,0,0.7)] border border-border/50 pointer-events-auto z-[102] w-[420px] relative"
          style={{}}
        >
          {/* Progress dots */}
          <div className="flex justify-center gap-1.5 mb-6">
            {steps.map((_, i) => (
              <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${i === step ? 'w-6 bg-neon' : 'w-1.5 bg-border'}`} />
            ))}
          </div>

          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-mono text-muted uppercase tracking-widest">Step {step + 1} of 9</span>
            <button onClick={onDismiss} className="text-muted hover:text-white text-[10px] font-mono uppercase tracking-widest">Skip Tour</button>
          </div>
          
          <h3 className="text-2xl font-display font-bold text-white mb-3">
            <span className="text-neon mr-2">✦</span>{currentStep.title}
          </h3>
          <p className="text-sm text-[#8892b0] font-body leading-relaxed mb-6">
            {currentStep.desc}
          </p>

          {/* Cyan Tip Box */}
          <div className="bg-[#00e5ff]/10 border border-[#00e5ff]/30 rounded-lg p-4 mb-8 flex gap-3 items-start shadow-[inset_0_0_20px_#00e5ff05]">
            <span className="text-accent text-lg">💡</span>
            <div>
              <div className="text-[10px] font-mono text-accent uppercase tracking-wider mb-1">Pro Insight</div>
              <div className="text-xs text-accent/90 font-body leading-tight">{currentStep.insight}</div>
            </div>
          </div>

          <div className="flex gap-4">
            {step > 0 && (
              <button 
                onClick={() => setStep(step - 1)}
                className="flex-1 py-3 px-4 rounded border border-border text-[#e2e8f0] font-mono text-xs hover:bg-white/5 transition-colors"
              >
                BACK
              </button>
            )}
            <button 
              onClick={handleNext}
              className="flex-[2] py-3 px-4 rounded bg-neon/10 border border-neon/50 text-neon font-mono text-xs hover:bg-neon/20 transition-all shadow-[0_0_20px_rgba(57,255,20,0.2)] flex items-center justify-center gap-2"
            >
              {step === steps.length - 1 ? 'LAUNCH PLATFORM' : 'NEXT STEP'}
              <span className="text-[10px]">→</span>
            </button>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
