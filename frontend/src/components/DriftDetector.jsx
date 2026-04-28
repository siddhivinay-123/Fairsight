import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

// Simple linear regression to find the slope of y values
const calculateSlope = (yValues) => {
  const n = yValues.length
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    sumX += i
    sumY += yValues[i]
    sumXY += i * yValues[i]
    sumX2 += i * i
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
  return slope
}

// Sparkline SVG component
const Sparkline = ({ data, slope }) => {
  const min = Math.min(...data) - 5
  const max = Math.max(...data) + 5
  const range = max - min || 1
  
  const width = 120
  const height = 40
  
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - ((d - min) / range) * height
    return `${x},${y}`
  }).join(' ')

  // Green if improving/steady, Red if declining
  const color = slope >= 0 ? '#39ff14' : '#ff2d55'

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  )
}

export default function DriftDetector() {
  // Initialize baseline data (7 days of fairness scores around 90)
  const [data, setData] = useState({
    'Female Candidates': [92, 91, 93, 90, 92, 94, 93],
    'Applicants Over 50': [88, 89, 88, 87, 88, 89, 88],
    'Non-Traditional Education': [85, 86, 84, 85, 87, 86, 85]
  })

  const [alerts, setAlerts] = useState([])

  // Re-calculate slopes and check for alerts whenever data changes
  useEffect(() => {
    const newAlerts = []
    Object.entries(data).forEach(([group, scores]) => {
      const slope = calculateSlope(scores)
      // If slope is strongly negative (rapid decline in fairness)
      if (slope < -0.5) {
        newAlerts.push({
          id: `${group}-${Date.now()}`,
          group,
          slope: slope.toFixed(2),
          message: `Drift detected! Fairness score for ${group} is declining rapidly.`
        })
      }
    })
    setAlerts(newAlerts)
  }, [data])

  const injectBiasEvent = () => {
    // Drop the scores significantly in the last two days for 'Applicants Over 50'
    setData(prev => ({
      ...prev,
      'Applicants Over 50': [88, 89, 88, 87, 88, 65, 45]
    }))
  }

  const resetData = () => {
    setData({
      'Female Candidates': [92, 91, 93, 90, 92, 94, 93],
      'Applicants Over 50': [88, 89, 88, 87, 88, 89, 88],
      'Non-Traditional Education': [85, 86, 84, 85, 87, 86, 85]
    })
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="glass-panel p-6 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-mono text-muted uppercase tracking-widest">Demographic Drift Detector</h2>
          <p className="text-xs text-soft mt-1">7-Day Rolling Fairness Trend Analysis via Linear Regression.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={resetData} className="btn-neon bg-transparent border-border text-muted hover:text-soft text-xs py-1.5 px-4">
            Reset
          </button>
          <button onClick={injectBiasEvent} className="btn-neon text-xs py-1.5 px-4 bg-danger/20 border-danger/50 text-danger hover:bg-danger/40">
            ⚠️ Inject Bias Event
          </button>
        </div>
      </div>

      {/* Alerts Banner */}
      <AnimatePresence>
        {alerts.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, height: 0, mb: 0 }}
            animate={{ opacity: 1, height: 'auto', mb: 24 }}
            exit={{ opacity: 0, height: 0, mb: 0 }}
            className="overflow-hidden"
          >
            <div className="glass-panel border-danger bg-danger/10 p-4 space-y-3">
              <div className="flex items-center gap-2 text-danger font-mono text-xs uppercase tracking-wider font-bold">
                <span className="animate-pulse">🔴</span> CRITICAL ALERTS
              </div>
              {alerts.map(alert => (
                <div key={alert.id} className="text-sm text-soft font-body bg-black/40 p-3 rounded border border-danger/30 flex justify-between items-center">
                  <span>{alert.message}</span>
                  <span className="text-danger font-mono text-xs font-bold">Slope: {alert.slope}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Demographics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(data).map(([group, scores]) => {
          const slope = calculateSlope(scores)
          const isDeclining = slope < 0
          const latestScore = scores[scores.length - 1]
          
          return (
            <div key={group} className={`glass-panel p-5 border-t-2 ${isDeclining ? 'border-t-danger/50' : 'border-t-neon/50'}`}>
              <div className="text-xs font-mono uppercase tracking-wider text-muted mb-4 truncate" title={group}>
                {group}
              </div>
              
              <div className="flex items-end justify-between mb-6">
                <div>
                  <div className="text-xs text-soft font-mono mb-1">Current Score</div>
                  <div className={`text-3xl font-display font-bold ${isDeclining ? 'text-warn' : 'text-neon'}`}>
                    {latestScore}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-soft font-mono mb-1">Trend Slope</div>
                  <div className={`text-sm font-mono font-bold ${isDeclining ? 'text-danger' : 'text-neon'}`}>
                    {slope > 0 ? '+' : ''}{slope.toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-4 flex items-center justify-center relative">
                <Sparkline data={scores} slope={slope} />
                <div className="absolute top-2 left-2 text-[10px] text-muted font-mono">7-Day Trend</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
