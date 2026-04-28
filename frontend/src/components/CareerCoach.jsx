import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Search, ShieldCheck, Target, AlertTriangle, 
  CheckCircle2, Map, BrainCircuit, FileText, 
  ChevronRight, Star, GraduationCap, Briefcase, Sparkles, Loader2
} from 'lucide-react';

const API_BASE = 'http://localhost:8000';

export default function CareerCoach() {
  const [resume, setResume] = useState('');
  const [path, setPath] = useState('swe');
  const [level, setLevel] = useState('mid');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const CAREER_PATHS = {
    swe:    'Software Engineer',
    ml:     'ML/AI Engineer',
    ds:     'Data Scientist',
    pm:     'Product Manager',
    cyber:  'Cybersecurity',
    devops: 'DevOps Engineer',
  };

  const analyzeResume = async () => {
    if (!resume.trim() || resume.trim().length < 10) {
      setError('Please paste your resume content (at least a few sentences).');
      return;
    }
    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const res = await fetch(`${API_BASE}/career-coach/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: resume,
          target_path: path,
          target_level: level,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.detail || 'Analysis failed.');
      }

      const data = await res.json();
      setAnalysis(data);
    } catch (e) {
      setError(e.message || 'Could not connect to backend. Make sure the API server is running on port 8000.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 page-enter pb-12">
      {/* Header */}
      <div className="glass-panel p-6 bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_#00e5ff33]">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">AI Career Coach</h1>
            <p className="text-sm text-muted font-body">Powered by Gemini — personalized analysis for your actual resume.</p>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[10px] font-mono text-neon/80 bg-neon/10 border border-neon/30 px-3 py-1.5 rounded-full">
            <Sparkles size={10} /> GEMINI AI POWERED
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Input Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 space-y-5">
            <div className="flex items-center gap-2 text-xs font-mono text-muted uppercase tracking-widest mb-2">
              <FileText size={14} className="text-accent" />
              Resume Analysis Engine
            </div>

            <textarea
              className="cyber-input h-64 resize-none text-[13px] leading-relaxed"
              placeholder="Paste your full resume content here for a real AI-powered analysis. The more detail you provide, the more personalized the coaching..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted uppercase">Target Path</label>
                <select className="cyber-input" value={path} onChange={(e) => setPath(e.target.value)}>
                  {Object.entries(CAREER_PATHS).map(([id, name]) => (
                    <option key={id} value={id}>{name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted uppercase">Target Level</label>
                <select className="cyber-input" value={level} onChange={(e) => setLevel(e.target.value)}>
                  <option value="junior">Junior / Associate</option>
                  <option value="mid">Mid-Level / Senior</option>
                  <option value="staff">Staff / Lead / Mgmt</option>
                </select>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-xs font-mono">
                ⚠ {error}
              </div>
            )}

            <button 
              onClick={analyzeResume}
              disabled={loading || !resume.trim()}
              className="btn-neon w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <><Loader2 size={16} className="animate-spin" /> ANALYZING WITH GEMINI AI...</>
              ) : (
                <>ANALYZE PROFILE <ChevronRight size={16} /></>
              )}
            </button>

            {loading && (
              <div className="text-center text-xs font-mono text-muted animate-pulse">
                Gemini is reading your resume and crafting personalized advice...
              </div>
            )}
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!analysis && !loading ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-12 text-center border-dashed border-border flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-panel border border-border flex items-center justify-center text-muted mb-4 opacity-50">
                  <Search size={32} />
                </div>
                <h2 className="text-soft font-display text-lg mb-2">Awaiting Data Input</h2>
                <p className="text-muted text-sm max-w-xs font-body">Paste your resume and select a career path to get personalized, AI-generated coaching — different for every resume.</p>
              </motion.div>
            ) : analysis ? (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* ATS Score + Skills Gap */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-panel" />
                        <motion.circle 
                          cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={364.4}
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * (analysis.ats_score || 0)) / 100 }}
                          transition={{ duration: 1.2, ease: "easeOut" }}
                          className={analysis.ats_score > 70 ? "text-neon" : analysis.ats_score > 40 ? "text-warn" : "text-danger"}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-mono font-bold text-white">{analysis.ats_score}%</span>
                        <span className="text-[8px] font-mono text-muted uppercase tracking-widest">ATS Score</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-center text-muted">
                      Matched {analysis.matched_ats?.length || 0} / {(analysis.path_info?.ats?.length || 8)} core industry keywords
                    </div>
                    {analysis.matched_ats?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3 justify-center">
                        {analysis.matched_ats.map(k => (
                          <span key={k} className="px-1.5 py-0.5 bg-neon/10 border border-neon/30 text-neon text-[9px] font-mono rounded">
                            ✓ {k}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="glass-panel p-6 space-y-4">
                    <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                      <Target size={14} className="text-accent" /> Skills Gap Analysis
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] font-mono text-muted mb-2">MISSING CORE SKILLS</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missing_core?.length > 0 ? (
                            analysis.missing_core.map(s => (
                              <span key={s} className="px-2 py-1 bg-danger/10 border border-danger/30 text-danger text-[10px] font-mono rounded-md">
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-neon text-[10px] font-mono flex items-center gap-1">
                              <CheckCircle2 size={12} /> All core skills present
                            </span>
                          )}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-mono text-muted mb-2">RECOMMENDED CERTS</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.path_info?.skills?.nice?.map(n => (
                            <span key={n} className="px-2 py-1 bg-accent/10 border border-accent/30 text-accent text-[10px] font-mono rounded-md">
                              {n}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Coaching Tips — this is the personalized part */}
                {analysis.ai_tips?.length > 0 && (
                  <div className="glass-panel p-6 bg-gradient-to-br from-[#002f3a]/60 to-panel">
                    <div className="flex items-center gap-2 text-xs font-mono text-neon uppercase mb-4">
                      <Sparkles size={14} /> Gemini AI — Personalized Coaching
                    </div>
                    <div className="space-y-3">
                      {analysis.ai_tips.map((tip, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          className="flex gap-3 p-3 bg-neon/5 border border-neon/20 rounded-lg"
                        >
                          <span className="text-neon shrink-0 border border-neon/30 bg-neon/10 rounded-full w-5 h-5 flex items-center justify-center text-xs font-mono font-bold">
                            {i + 1}
                          </span>
                          <span className="text-[13px] text-soft font-body leading-relaxed">{tip}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bias Flags */}
                <div className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                      <ShieldCheck size={14} className="text-neon" /> Bias Phrase Audit
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${(analysis.bias_flags?.length || 0) === 0 ? 'bg-neon/10 text-neon' : 'bg-danger/10 text-danger'}`}>
                      {analysis.bias_flags?.length || 0} ISSUES FOUND
                    </span>
                  </div>
                  
                  {analysis.bias_flags?.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.bias_flags.map((b, i) => (
                        <div key={i} className="p-3 bg-white/5 border border-border rounded-lg flex items-start gap-3">
                          <AlertTriangle className={b.severity === 'high' ? 'text-danger' : 'text-warn'} size={16} />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-xs font-bold text-soft">"{b.phrase}"</span>
                              <span className="text-[8px] px-1.5 py-0.5 bg-panel border border-border text-muted rounded uppercase">{b.category}</span>
                            </div>
                            <div className="text-[11px] text-muted leading-relaxed">
                              <span className="text-accent font-mono">FIX:</span> {b.fix}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-muted font-body italic text-sm">
                      No known bias-correlated phrases detected. Your resume uses neutral, professional language.
                    </div>
                  )}
                </div>

                {/* 4-Phase Roadmap */}
                <div className="glass-panel p-6">
                  <div className="text-xs font-mono text-muted uppercase flex items-center gap-2 mb-6">
                    <Map size={14} className="text-warn" /> 12-Week Winning Roadmap
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                      { week: '1-4', title: 'Resume Pivot', icon: <FileText size={14}/>, color: 'text-accent', desc: 'Fix bias flags and inject ATS keywords from your analysis.' },
                      { week: '5-8', title: 'Skill Sprint', icon: <BrainCircuit size={14}/>, color: 'text-neon', desc: `Get certified in ${analysis.missing_core?.slice(0,2).join(' & ') || 'missing core skills'}.` },
                      { week: '9-12', title: 'Portfolio', icon: <Rocket size={14}/>, color: 'text-warn', desc: `Build 3 case studies for ${CAREER_PATHS[analysis.target_path] || 'your target role'}.` },
                      { week: '13+', title: 'Prep & Win', icon: <Briefcase size={14}/>, color: 'text-soft', desc: 'Mock interviews using role-specific tips above.' }
                    ].map((phase, i) => (
                      <div key={i} className="relative p-3 bg-panel border border-border rounded-lg group hover:border-accent/40 transition-colors">
                        <div className={`text-[10px] font-mono ${phase.color} mb-2`}>WEEKS {phase.week}</div>
                        <div className="flex items-center gap-2 mb-2 font-display font-bold text-sm text-white">
                          {phase.icon} {phase.title}
                        </div>
                        <div className="text-[10px] text-muted leading-tight">{phase.desc}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Interview Tips */}
                {analysis.path_info?.tips && (
                  <div className="glass-panel p-6 bg-[#ff6b35]/5 border-[#ff6b35]/20">
                    <div className="text-xs font-mono text-[#ff6b35] uppercase flex items-center gap-2 mb-4">
                      <Star size={14} /> Expert Interview Strategies — {CAREER_PATHS[analysis.target_path]}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        <div className="text-[10px] font-mono text-muted uppercase">ROLE-SPECIFIC TIPS</div>
                        {analysis.path_info.tips.map((tip, i) => (
                          <div key={i} className="flex gap-2 text-xs text-soft font-body">
                            <span className="text-[#ff6b35]">→</span> {tip}
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-black/40 rounded-lg border border-[#ff6b35]/10">
                        <div className="text-[10px] font-mono text-[#ff6b35] mb-2 uppercase">MASTER THE STAR METHOD</div>
                        <div className="space-y-2 text-[10px] text-muted font-body">
                          <div><strong className="text-soft">S</strong>ituation: Briefly set the scene.</div>
                          <div><strong className="text-soft">T</strong>ask: Explain the goal or problem.</div>
                          <div><strong className="text-soft">A</strong>ction: What <em className="text-accent">you</em> specifically did.</div>
                          <div><strong className="text-soft">R</strong>esult: Quantified outcome (e.g., +20% growth).</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
