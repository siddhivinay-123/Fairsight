import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FairnessGauge, ShapChart, SeverityBadge } from './UIComponents.jsx'
import { useApi } from '../hooks/useApi.js'

export default function BiasSimulator() {
  const { audit } = useApi()
  
  // Default base features
  const defaultFeatures = {
    age: 35,
    experience_years: 6,
    education_score: 70, // proxy for education
    gender_proxy: 50, // proxy for gender bias (0=female, 100=male)
    resume_score: 80
  }

  const [features, setFeatures] = useState(defaultFeatures)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [snapshots, setSnapshots] = useState([])
  const timeoutRef = useRef(null)

  // Simulation fallback in case backend doesn't support these specific numeric proxies
  const generateMockResult = (f) => {
    // Simple heuristic for mock simulation
    let biasScore = 0;
    if (f.age > 50) biasScore += (f.age - 50) * 1.5;
    if (f.gender_proxy < 40) biasScore += (40 - f.gender_proxy) * 0.8;
    
    let fairness = Math.max(10, 100 - biasScore);
    
    return {
      fairness_score: fairness,
      bias_detected: fairness < 75,
      bias_severity: fairness < 45 ? 'high' : fairness < 75 ? 'medium' : 'low',
      original_prediction: 0.65,
      corrected_prediction: Math.min(0.99, 0.65 + (biasScore / 200)),
      shap_values: {
        age: f.age > 40 ? -0.15 : 0.05,
        experience_years: f.experience_years > 5 ? 0.2 : 0.01,
        education: f.education_score > 60 ? 0.1 : -0.05,
        gender: f.gender_proxy < 50 ? -0.1 : 0.02,
        resume: f.resume_score > 50 ? 0.15 : -0.1,
      }
    }
  }

  const runAudit = async (currentFeatures) => {
    setLoading(true)
    try {
      // Try hitting the backend audit endpoint
      const res = await audit(
        {
          name: 'Simulator Candidate',
          age: currentFeatures.age,
          experience_years: currentFeatures.experience_years,
          education: `Level ${Math.floor(currentFeatures.education_score / 20)}`,
          resume_text: `Score: ${currentFeatures.resume_score}, GenderProxy: ${currentFeatures.gender_proxy}`
        },
        0.65,
        'hiring'
      )
      setResult(res)
    } catch (e) {
      // Offline / Fallback mock
      setResult(generateMockResult(currentFeatures))
    } finally {
      setLoading(false)
    }
  }

  // Trigger re-audit 300ms after slider changes
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      runAudit(features)
    }, 300)
    return () => clearTimeout(timeoutRef.current)
  }, [features])

  const handleSliderChange = (e, key) => {
    setFeatures(prev => ({ ...prev, [key]: Number(e.target.value) }))
  }

  const takeSnapshot = () => {
    if (!result) return
    setSnapshots(prev => [{
      id: Date.now(),
      features: { ...features },
      result: { ...result }
    }, ...prev])
  }

  const slidersConfig = [
    { key: 'age', label: 'Age', min: 18, max: 70, step: 1 },
    { key: 'experience_years', label: 'Experience (Years)', min: 0, max: 40, step: 1 },
    { key: 'education_score', label: 'Education Quality (Score)', min: 0, max: 100, step: 1 },
    { key: 'gender_proxy', label: 'Gender Proxy (0=F, 100=M)', min: 0, max: 100, step: 1 },
    { key: 'resume_score', label: 'Resume Text Score', min: 0, max: 100, step: 1 },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 page-enter">
      {/* Controls Panel */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-mono text-muted uppercase tracking-widest">Interactive Simulator</h2>
            <p className="text-xs text-soft mt-1">Adjust features to see live impact on fairness and SHAP values.</p>
          </div>
          <button onClick={takeSnapshot} className="btn-neon text-xs py-1.5 px-3 flex items-center gap-2">
            <span>📷</span> Snapshot
          </button>
        </div>

        <div className="space-y-6">
          {slidersConfig.map(({ key, label, min, max, step }) => (
            <div key={key}>
              <div className="flex justify-between items-end mb-2">
                <label className="text-xs text-soft font-mono">{label}</label>
                <span className="text-xs font-mono text-accent">{features[key]}</span>
              </div>
              <input
                type="range"
                min={min}
                max={max}
                step={step}
                value={features[key]}
                onChange={(e) => handleSliderChange(e, key)}
                className="w-full h-1.5 bg-panel rounded-lg appearance-none cursor-pointer slider-neon"
                style={{
                  background: `linear-gradient(to right, #00e5ff ${((features[key] - min) / (max - min)) * 100}%, #1e2d52 ${((features[key] - min) / (max - min)) * 100}%)`
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Live Result Panel */}
      <div className="space-y-6">
        <div className="glass-panel p-6 min-h-[300px] flex flex-col justify-center relative">
          {loading && <div className="absolute top-4 right-4 text-xs font-mono text-muted animate-pulse">Auditing...</div>}
          
          {result ? (
            <div className="animate-in fade-in zoom-in duration-300">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted font-mono uppercase tracking-wider">Live Fairness Score</span>
                <SeverityBadge severity={result.bias_severity} />
              </div>
              
              <div className="flex items-center gap-8 mb-6">
                <FairnessGauge score={result.fairness_score} size={140} />
                <div className="flex-1 space-y-3">
                   <div className="flex justify-between">
                    <span className="text-xs text-muted font-mono">Original</span>
                    <span className="text-sm font-mono text-warn">
                      {(result.original_prediction * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted font-mono">Corrected</span>
                    <span className="text-sm font-mono text-neon">
                      {(result.corrected_prediction * 100).toFixed(0)}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">Live SHAP Impact</div>
                <ShapChart shapValues={result.shap_values || {}} />
              </div>
            </div>
          ) : (
             <div className="text-center text-muted text-sm font-mono">Loading simulator...</div>
          )}
        </div>
      </div>

      {/* Snapshots Panel */}
      {snapshots.length > 0 && (
        <div className="lg:col-span-2 glass-panel p-6 mt-4">
          <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">What-If Scenarios (Snapshots)</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            <AnimatePresence>
              {snapshots.map((snap) => (
                <motion.div 
                  key={snap.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-panel/50 p-4 rounded-lg border border-border relative group"
                >
                  <button 
                    onClick={() => setSnapshots(prev => prev.filter(s => s.id !== snap.id))}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-muted hover:text-danger text-xs p-1"
                  >
                    ✕
                  </button>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs text-soft font-mono">Snapshot</span>
                    <span className="text-[10px] text-muted font-mono">{new Date(snap.id).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4 mb-3">
                    <FairnessGauge score={snap.result.fairness_score} size={60} />
                    <div className="text-xs space-y-1">
                      <div className="text-muted">Age: <span className="text-soft">{snap.features.age}</span></div>
                      <div className="text-muted">Exp: <span className="text-soft">{snap.features.experience_years}</span></div>
                      <div className="text-muted">Gender: <span className="text-soft">{snap.features.gender_proxy}</span></div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}
