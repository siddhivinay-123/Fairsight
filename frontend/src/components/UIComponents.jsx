import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

// ── Fairness Score Gauge ──────────────────────────────────────────────────────
export function FairnessGauge({ score = 0, size = 140 }) {
  const R = 52
  const C = 2 * Math.PI * R
  const clamp = Math.max(0, Math.min(100, score))
  const offset = C - (clamp / 100) * C * 0.75

  const color = clamp >= 75 ? '#39ff14' : clamp >= 45 ? '#ff6b35' : '#ff2d55'
  const label = clamp >= 75 ? 'FAIR' : clamp >= 45 ? 'BIASED' : 'HIGH RISK'

  return (
    <div className="flex flex-col items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 130 130">
        {/* Background track */}
        <circle cx="65" cy="65" r={R} fill="none" stroke="#1e2d52" strokeWidth="8"
          strokeDasharray={`${C * 0.75} ${C * 0.25}`}
          strokeDashoffset={-C * 0.125}
          strokeLinecap="round"
          transform="rotate(135 65 65)"
        />
        {/* Score arc */}
        <circle cx="65" cy="65" r={R} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={`${C * 0.75} ${C * 0.25}`}
          strokeDashoffset={offset - C * 0.125 + C * 0.75 - C * 0.75}
          strokeLinecap="round"
          className="gauge-ring"
          style={{
            stroke: color,
            filter: `drop-shadow(0 0 8px ${color})`,
            transition: 'stroke-dashoffset 1s cubic-bezier(0.16,1,0.3,1)',
            strokeDasharray: `${(clamp / 100) * C * 0.75} ${C}`,
            strokeDashoffset: `${-C * 0.125}`,
            transform: 'rotate(135deg)',
            transformOrigin: '65px 65px',
          }}
        />
        <text x="65" y="60" textAnchor="middle" fill={color}
          fontFamily="Space Mono, monospace" fontSize="22" fontWeight="700">
          {Math.round(clamp)}
        </text>
        <text x="65" y="76" textAnchor="middle" fill={color}
          fontFamily="Space Mono, monospace" fontSize="9" opacity="0.8">
          {label}
        </text>
      </svg>
    </div>
  )
}

// ── SHAP Waterfall Chart ──────────────────────────────────────────────────────
export function ShapChart({ shapValues = {} }) {
  const entries = Object.entries(shapValues).slice(0, 10)
  const maxAbs = Math.max(...entries.map(([, v]) => Math.abs(v)), 0.01)

  return (
    <div className="space-y-1.5">
      {entries.map(([feature, value]) => {
        const pct = Math.abs(value) / maxAbs * 100
        const positive = value > 0
        return (
          <div key={feature} className="flex items-center gap-2 group">
            <span className="font-mono text-xs text-soft w-32 truncate text-right shrink-0" title={feature}>
              {feature}
            </span>
            <div className="flex-1 relative h-5 bg-panel rounded overflow-hidden">
              {positive ? (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute left-0 top-0 h-full shap-bar-positive rounded"
                />
              ) : (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="absolute right-0 top-0 h-full shap-bar-negative rounded"
                />
              )}
            </div>
            <span className={`font-mono text-xs w-14 text-right shrink-0 ${positive ? 'text-neon' : 'text-danger'}`}>
              {positive ? '+' : ''}{value.toFixed(3)}
            </span>
          </div>
        )
      })}
      <div className="flex justify-between text-xs text-muted mt-2 font-mono">
        <span>← biases against</span>
        <span>boosts for →</span>
      </div>
    </div>
  )
}

// ── Metric Card ───────────────────────────────────────────────────────────────
export function MetricCard({ label, value, unit = '', delta, color = '#00e5ff', icon }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 hover-glow gradient-border"
      data-hover
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs text-muted font-mono uppercase tracking-wider">{label}</span>
        {icon && <span className="text-xs" style={{ color }}>{icon}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-2xl font-display font-bold" style={{ color, textShadow: `0 0 20px ${color}66` }}>
          {value}
        </span>
        {unit && <span className="text-xs text-soft font-mono">{unit}</span>}
      </div>
      {delta !== undefined && (
        <div className={`text-xs font-mono mt-1 ${delta >= 0 ? 'text-neon' : 'text-danger'}`}>
          {delta >= 0 ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}% from last hour
        </div>
      )}
    </motion.div>
  )
}

// ── Fairness Metrics Table ────────────────────────────────────────────────────
export function MetricsTable({ metrics = {} }) {
  const rows = [
    { key: 'disparate_impact', label: 'Disparate Impact', ideal: '≥ 0.8', danger: v => v < 0.8 },
    { key: 'equal_opportunity_diff', label: 'Equal Opportunity Δ', ideal: '≈ 0', danger: v => Math.abs(v) > 0.1 },
    { key: 'statistical_parity_diff', label: 'Statistical Parity Δ', ideal: '≈ 0', danger: v => Math.abs(v) > 0.1 },
    { key: 'average_odds_diff', label: 'Avg Odds Diff', ideal: '≈ 0', danger: v => Math.abs(v) > 0.1 },
    { key: 'theil_index', label: 'Theil Index', ideal: '≈ 0', danger: v => v > 0.2 },
    { key: 'individual_fairness', label: 'Individual Fairness', ideal: '≥ 0.8', danger: v => v < 0.8 },
  ]

  return (
    <div className="space-y-1">
      {rows.map(({ key, label, ideal, danger }) => {
        const val = metrics[key] ?? 0
        const bad = danger(val)
        return (
          <div key={key} className="flex items-center justify-between py-2 px-3 data-row rounded-lg">
            <span className="text-xs text-soft font-body">{label}</span>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted font-mono">{ideal}</span>
              <span className={`text-xs font-mono font-bold w-16 text-right ${bad ? 'text-danger' : 'text-neon'}`}>
                {val.toFixed(4)}
              </span>
              <span className={`w-2 h-2 rounded-full ${bad ? 'bg-danger' : 'bg-neon'}`}
                style={{ boxShadow: `0 0 6px ${bad ? '#ff2d55' : '#39ff14'}` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ── Severity Badge ─────────────────────────────────────────────────────────────
export function SeverityBadge({ severity }) {
  const classes = {
    low: 'badge-clean',
    medium: 'badge-warn',
    high: 'badge-high',
  }
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono uppercase tracking-wider ${classes[severity] || 'badge-clean'}`}>
      {severity}
    </span>
  )
}

// ── Live Event Row ────────────────────────────────────────────────────────────
export function LiveEventRow({ event, index }) {
  const score = event.fairness_score ?? 0
  const color = score >= 75 ? '#39ff14' : score >= 45 ? '#ff6b35' : '#ff2d55'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      className="flex items-center gap-3 py-2.5 px-3 data-row rounded-lg border border-transparent hover:border-border"
    >
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
        style={{ background: `${color}15`, border: `1px solid ${color}44` }}>
        <span className="text-xs font-mono font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-body text-soft truncate">
          {event.domain} · {event.timestamp ? new Date(event.timestamp).toLocaleTimeString() : '—'}
        </div>
        <div className="text-xs font-mono text-muted truncate">
          {event.bias_detected ? '⚠ Bias detected' : '✓ Passed'} · {event.latency_ms}ms
        </div>
      </div>
      <SeverityBadge severity={event.bias_severity || 'low'} />
    </motion.div>
  )
}

// ── Animated Counter ──────────────────────────────────────────────────────────
export function AnimCounter({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const start = useRef(0)
  const frameRef = useRef(null)

  useEffect(() => {
    const from = start.current
    const to = value
    const began = performance.now()
    start.current = value

    const tick = (now) => {
      const elapsed = now - began
      const progress = Math.min(elapsed / duration, 1)
      const ease = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * ease))
      if (progress < 1) frameRef.current = requestAnimationFrame(tick)
    }

    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])

  return <>{display.toLocaleString()}</>
}

// ── Pulsing Status Indicator ──────────────────────────────────────────────────
export function StatusIndicator({ connected }) {
  return (
    <div className="flex items-center gap-2">
      <div className={connected ? 'live-dot' : 'w-2 h-2 rounded-full bg-muted'} />
      <span className={`text-xs font-mono ${connected ? 'text-neon' : 'text-muted'}`}>
        {connected ? 'LIVE' : 'OFFLINE'}
      </span>
    </div>
  )
}
