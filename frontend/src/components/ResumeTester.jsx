import { useState } from 'react'
import { motion } from 'framer-motion'
import { FairnessGauge } from './UIComponents.jsx'

export default function ResumeTester() {
  const [resumeA, setResumeA] = useState("Dedicated professional with 5 years of experience. Handled customer complaints and managed schedules. Organized and efficient.")
  const [resumeB, setResumeB] = useState("Dedicated professional with 5 years of experience. Spearheaded conflict resolution initiatives and led cross-functional team scheduling, increasing efficiency by 20%.")
  
  const [analyzing, setAnalyzing] = useState(false)
  const [results, setResults] = useState(null)

  const handleAnalyze = () => {
    setAnalyzing(true)
    
    // Simulate API delay and mock Gemini-style analysis
    setTimeout(() => {
      // Basic diff highlighting (mock)
      const diffHtml = resumeB.split(' ').map((word, index) => {
        if (!resumeA.includes(word)) {
          return `<span class="bg-neon/20 text-neon px-1 rounded mx-0.5 font-medium">${word}</span>`
        }
        return word
      }).join(' ')

      setResults({
        scoreA: { bias: 65, ats: 42 },
        scoreB: { bias: 88, ats: 78 },
        diffHtml,
        insight: "Replacing passive verbs like 'handled' with action-oriented metrics ('Spearheaded', 'increasing efficiency by 20%') significantly improved ATS match while reducing passive-gendered language bias."
      })
      setAnalyzing(false)
    }, 1200)
  }

  return (
    <div className="space-y-6 page-enter flex flex-col h-full">
      <div className="glass-panel p-6 shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h2 className="text-sm font-mono text-muted uppercase tracking-widest">Resume A/B Tester</h2>
            <p className="text-xs text-soft mt-1">Paste two versions of a resume to instantly compare Bias Scores and ATS Matching.</p>
          </div>
          <button 
            onClick={handleAnalyze} 
            disabled={analyzing || !resumeA || !resumeB}
            className="btn-neon text-sm py-2 px-6"
          >
            {analyzing ? 'Analyzing...' : 'Analyze Resumes →'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
        <div className="glass-panel p-5 flex flex-col gap-3">
          <div className="text-xs text-muted font-mono uppercase tracking-wider flex justify-between">
            <span>Version A (Original)</span>
            {results && <span className="text-warn font-bold">ATS: {results.scoreA.ats}%</span>}
          </div>
          <textarea 
            value={resumeA}
            onChange={(e) => setResumeA(e.target.value)}
            className="cyber-input w-full h-40 resize-none font-body text-sm leading-relaxed"
            placeholder="Paste original resume text here..."
          />
        </div>
        
        <div className="glass-panel p-5 flex flex-col gap-3 relative">
          <div className="text-xs text-neon font-mono uppercase tracking-wider flex justify-between">
            <span>Version B (Improved)</span>
            {results && <span className="text-neon font-bold">ATS: {results.scoreB.ats}%</span>}
          </div>
          <textarea 
            value={resumeB}
            onChange={(e) => setResumeB(e.target.value)}
            className="cyber-input w-full h-40 resize-none font-body text-sm leading-relaxed border-neon/50 focus:border-neon"
            placeholder="Paste improved resume text here..."
          />
        </div>
      </div>

      {results && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1"
        >
          {/* Scores Panel */}
          <div className="glass-panel p-6 col-span-1 flex flex-col justify-center items-center gap-6">
            <div className="w-full text-center">
               <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">Version A Bias</div>
               <FairnessGauge score={results.scoreA.bias} size={110} />
            </div>
            <div className="w-full h-px bg-border my-2" />
            <div className="w-full text-center">
               <div className="text-xs text-neon font-mono uppercase tracking-wider mb-4">Version B Bias</div>
               <FairnessGauge score={results.scoreB.bias} size={110} />
            </div>
          </div>

          {/* Diff and Insights Panel */}
          <div className="glass-panel p-6 col-span-1 lg:col-span-2 flex flex-col gap-6">
            <div>
              <div className="text-xs text-neon font-mono uppercase tracking-wider mb-3 flex items-center gap-2">
                <span>✦</span> AI Insight
              </div>
              <div className="p-4 rounded-lg bg-panel border border-border/50 text-sm font-body text-soft leading-relaxed shadow-inner">
                {results.insight}
              </div>
            </div>

            <div className="flex-1 flex flex-col">
              <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">
                Improvement Highlights (Diff)
              </div>
              <div 
                className="flex-1 p-4 rounded-lg bg-black/40 border border-border text-sm font-body text-soft leading-relaxed overflow-y-auto"
                dangerouslySetInnerHTML={{ __html: results.diffHtml }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
