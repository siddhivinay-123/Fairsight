import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Rocket, Search, ShieldCheck, Target, AlertTriangle, 
  CheckCircle2, Map, BrainCircuit, FileText, 
  ChevronRight, Star, GraduationCap, Briefcase
} from 'lucide-react';

const BIAS_PHRASES = [
  { phrase: "maternity leave", category: "Family/Gender", severity: "high", fix: "Remove mention of specific leave types; focus purely on skills." },
  { phrase: "stay-at-home parent", category: "Family/Gender", severity: "high", fix: "List as 'Professional Sabbatical' or omit if not relevant to role." },
  { phrase: "recent graduate", category: "Age", severity: "medium", fix: "Use 'Junior Professional' or 'Entry-Level' to avoid age-based filtering." },
  { phrase: "digital native", category: "Age", severity: "medium", fix: "List specific technical proficiencies instead." },
  { phrase: "cultural fit", category: "Subjective Bias", severity: "medium", fix: "Focus on 'Cultural Contribution' or specific value alignment." },
  { phrase: "native speaker", category: "National Origin", severity: "high", fix: "Use 'Proficient in [Language]' or 'Fluent' instead." },
  { phrase: "energetic", category: "Age", severity: "low", fix: "Use 'Results-driven' or 'Highly productive'." },
  { phrase: "church", category: "Religion", severity: "high", fix: "Use 'Non-profit Organization' or 'Community Group' if necessary." },
  { phrase: "married", category: "Marital Status", severity: "high", fix: "Remove marital status entirely; it is a legal liability." },
  { phrase: "she/her", category: "Gender", severity: "medium", fix: "Consider a gender-neutral resume if you suspect bias in initial screening." },
  { phrase: "he/him", category: "Gender", severity: "medium", fix: "Consider a gender-neutral resume if you suspect bias in initial screening." },
  { phrase: "gap year", category: "Socio-economic", severity: "low", fix: "Provide brief professional context for the gap." },
  { phrase: "clean-shaven", category: "Appearance/Religion", severity: "high", fix: "Do not mention grooming/appearance in a professional document." },
  { phrase: "university of california", category: "Regional", severity: "low", fix: "Focus on degree and honors rather than institutional location." }
];

const CAREER_PATHS = {
  swe: { 
    name: "Software Engineer", 
    ats: ["React", "Node.js", "Docker", "Unit Testing", "CI/CD", "TypeScript", "System Design", "Agile"],
    skills: { core: ["JavaScript", "Python", "SQL"], nice: ["AWS", "Kubernetes", "GraphQL"] },
    tips: ["Be ready for LeetCode medium", "Explain Big O in your answers", "Know your React lifecycle", "Practice Whiteboarding", "Understand REST vs GraphQL"]
  },
  ml: { 
    name: "ML/AI Engineer", 
    ats: ["PyTorch", "TensorFlow", "Scikit-learn", "Model Deployment", "Neural Networks", "NLP", "Feature Engineering", "Pandas"],
    skills: { core: ["Python", "Linear Algebra", "Calculus"], nice: ["Cloud ML", "MLOps", "Fine-tuning"] },
    tips: ["Explain Overfitting vs Underfitting", "Know the math behind Transformers", "Discuss ethical AI implications", "Explain precision/recall trade-offs", "Be ready for data cleaning questions"]
  },
  ds: { 
    name: "Data Scientist", 
    ats: ["Statistics", "R", "Tableau", "PowerBI", "Hypothesis Testing", "Data Mining", "Storytelling", "A/B Testing"],
    skills: { core: ["Python", "SQL", "Stats"], nice: ["Big Data", "AutoML", "Excel Mastery"] },
    tips: ["Focus on business value", "Explain p-values simply", "Practice SQL join optimization", "Visualize your findings during interview", "Know when to use a Forest vs Linear"]
  },
  pm: { 
    name: "Product Manager", 
    ats: ["Roadmapping", "Backlog Grooming", "Stakeholder Mgmt", "KPIs", "User Research", "Agile", "Scrum", "Data-Driven"],
    skills: { core: ["Communication", "Market Analysis", "Strategic Planning"], nice: ["UX Design Basics", "Growth Hacking", "MBA"] },
    tips: ["Use the CIRCLES framework", "Focus on 'The Why'", "Explain how you prioritize", "Discuss a time you failed", "Know your product metrics"]
  },
  cyber: { 
    name: "Cybersecurity", 
    ats: ["Pentesting", "Network Security", "Compliance", "SOC", "Firewalls", "Identity Mgmt", "Cryptography", "Incident Response"],
    skills: { core: ["Networking", "Linux", "OSINT"], nice: ["CEH", "CISSP", "Cloud Security"] },
    tips: ["Explain the CIA triad", "Know common port numbers", "Discuss latest CVEs", "Explain Zero Trust architecture", "Practice CTF challenges"]
  },
  devops: { 
    name: "DevOps Engineer", 
    ats: ["Terraform", "Ansible", "Kubernetes", "Jenkins", "AWS/Azure", "Monitoring", "Infrastructure as Code", "Python"],
    skills: { core: ["Linux", "Scripting", "Cloud Architecture"], nice: ["Site Reliability", "Security", "Prometheus"] },
    tips: ["Explain 12-factor apps", "Discuss blue-green deployments", "Know your Docker container isolation", "Explain IaC benefits", "Practice Shell scripting"]
  }
};

export default function CareerCoach() {
  const [resume, setResume] = useState('');
  const [path, setPath] = useState('swe');
  const [level, setLevel] = useState('mid');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeResume = () => {
    setLoading(true);
    setTimeout(() => {
      const lowerResume = resume.toLowerCase();
      
      // Bias Audit
      const foundBias = BIAS_PHRASES.filter(b => lowerResume.includes(b.phrase.toLowerCase()));
      
      // ATS Score
      const matchedAts = CAREER_PATHS[path].ats.filter(term => lowerResume.includes(term.toLowerCase()));
      const atsScore = Math.round((matchedAts.length / 8) * 100);
      
      // Skills Gap
      const missingCore = CAREER_PATHS[path].skills.core.filter(s => !lowerResume.includes(s.toLowerCase()));
      
      setAnalysis({
        bias: foundBias,
        atsScore,
        matchedAts,
        missingCore,
        path: CAREER_PATHS[path]
      });
      setLoading(false);
    }, 1200);
  };

  return (
    <div className="space-y-6 page-enter pb-12">
      {/* Header Section */}
      <div className="glass-panel p-6 bg-gradient-to-r from-accent/5 to-transparent">
        <div className="flex items-center gap-4 mb-2">
          <div className="w-12 h-12 rounded-xl bg-accent/20 flex items-center justify-center text-accent shadow-[0_0_20px_#00e5ff33]">
            <Rocket size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-white tracking-tight">AI Career Coach</h1>
            <p className="text-sm text-muted font-body">Optimize your professional profile for bias-free, high-impact hiring.</p>
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
              placeholder="Paste your resume content here for a full bias audit and ATS optimization..."
              value={resume}
              onChange={(e) => setResume(e.target.value)}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-muted uppercase">Target Path</label>
                <select className="cyber-input" value={path} onChange={(e) => setPath(e.target.value)}>
                  {Object.entries(CAREER_PATHS).map(([id, p]) => (
                    <option key={id} value={id}>{p.name}</option>
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

            <button 
              onClick={analyzeResume}
              disabled={loading || !resume}
              className="btn-neon w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <div className="hex-loader w-4 h-4" />
              ) : (
                <>ANALYZE PROFILE <ChevronRight size={16} /></>
              )}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-3 space-y-6">
          <AnimatePresence mode="wait">
            {!analysis ? (
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="glass-panel p-12 text-center border-dashed border-border flex flex-col items-center"
              >
                <div className="w-16 h-16 rounded-full bg-panel border border-border flex items-center justify-center text-muted mb-4 opacity-50">
                  <Search size={32} />
                </div>
                <h2 className="text-soft font-display text-lg mb-2">Awaiting Data Input</h2>
                <p className="text-muted text-sm max-w-xs font-body">Paste your resume and select a career path to generate a personalized roadmap and bias audit.</p>
              </motion.div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Score Rings & Skills */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="glass-panel p-6 flex flex-col items-center justify-center">
                    <div className="relative w-32 h-32 mb-4">
                      <svg className="w-full h-full transform -rotate-90">
                        <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-panel" />
                        <motion.circle 
                          cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" 
                          strokeDasharray={364.4}
                          initial={{ strokeDashoffset: 364.4 }}
                          animate={{ strokeDashoffset: 364.4 - (364.4 * analysis.atsScore) / 100 }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={analysis.atsScore > 70 ? "text-neon" : analysis.atsScore > 40 ? "text-warn" : "text-danger"}
                        />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-mono font-bold text-white">{analysis.atsScore}%</span>
                        <span className="text-[8px] font-mono text-muted uppercase tracking-widest">ATS Score</span>
                      </div>
                    </div>
                    <div className="text-[10px] font-mono text-center text-muted">
                      Matched {analysis.matchedAts.length} / 8 core industry keywords
                    </div>
                  </div>

                  <div className="glass-panel p-6 space-y-4">
                    <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                      <Target size={14} className="text-accent" /> Skills Gap Analysis
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="text-[10px] font-mono text-muted mb-2">MISSING CORE SKILLS</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.missingCore.length > 0 ? (
                            analysis.missingCore.map(s => (
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
                        <div className="text-[10px] font-mono text-muted mb-2">RECOMMENDED CERTIFICATIONS</div>
                        <div className="flex flex-wrap gap-2">
                          {analysis.path.skills.nice.map(n => (
                            <span key={n} className="px-2 py-1 bg-accent/10 border border-accent/30 text-accent text-[10px] font-mono rounded-md">
                              {n} Professional
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bias Flags */}
                <div className="glass-panel p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-xs font-mono text-muted uppercase flex items-center gap-2">
                      <ShieldCheck size={14} className="text-neon" /> Bias Phrase Audit
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${analysis.bias.length === 0 ? 'bg-neon/10 text-neon' : 'bg-danger/10 text-danger'}`}>
                      {analysis.bias.length} ISSUES FOUND
                    </span>
                  </div>
                  
                  {analysis.bias.length > 0 ? (
                    <div className="space-y-3">
                      {analysis.bias.map((b, i) => (
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
                      { week: '1-4', title: 'Resume Pivot', icon: <FileText size={14}/>, color: 'text-accent', desc: 'Fix bias flags and inject ATS keywords.' },
                      { week: '5-8', title: 'Skill Sprint', icon: <BrainCircuit size={14}/>, color: 'text-neon', desc: 'Get certified in missing core skills.' },
                      { week: '9-12', title: 'Portfolio', icon: <Rocket size={14}/>, color: 'text-warn', desc: 'Build 3 case studies for target role.' },
                      { week: '13+', title: 'Prep & Win', icon: <Briefcase size={14}/>, color: 'text-soft', desc: 'Mock interviews and aggressive networking.' }
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
                <div className="glass-panel p-6 bg-[#ff6b35]/5 border-[#ff6b35]/20">
                  <div className="text-xs font-mono text-[#ff6b35] uppercase flex items-center gap-2 mb-4">
                    <Star size={14} /> Expert Interview Strategies
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-[10px] font-mono text-muted uppercase">ROLE-SPECIFIC TIPS</div>
                      {analysis.path.tips.map((tip, i) => (
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
