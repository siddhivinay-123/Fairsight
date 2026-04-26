import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  FairnessGauge, MetricCard, LiveEventRow,
  StatusIndicator, AnimCounter, ShapChart, MetricsTable, SeverityBadge
} from './components/UIComponents.jsx'
import { useLiveFeed, useApi, useStats } from './hooks/useApi.js'
import { AuthProvider, useAuth } from './contexts/AuthContext.jsx'
import AuthScreen from './components/AuthScreen.jsx'
import OnboardingTour from './components/OnboardingTour.jsx'
import CareerCoach from './components/CareerCoach.jsx'

// ── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="glass-panel p-2 text-xs font-mono border-accent">
      <div className="text-muted mb-1">{label}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color }}>{p.name}: {typeof p.value === 'number' ? p.value.toFixed(1) : p.value}</div>
      ))}
    </div>
  )
}

// ── Sidebar Nav ───────────────────────────────────────────────────────────────
function Sidebar({ activeTab, setTab }) {
  const { logout, currentUser } = useAuth();
  const tabs = [
    { id: 'dashboard', icon: '◈', label: 'Dashboard' },
    { id: 'live',      icon: '◉', label: 'Live Feed' },
    { id: 'audit',     icon: '◎', label: 'Audit Tool' },
    { id: 'career',    icon: '🚀', label: 'Career Coach', badge: 'NEW' },
    { id: 'analytics', icon: '◇', label: 'Analytics' },
    { id: 'demo',      icon: '◆', label: 'Demo Mode' },
  ]

  return (
    <div id="tour-sidebar" className="glass-panel flex flex-col h-full w-56 shrink-0 border-r border-border py-6 px-4">
      {/* Logo */}
      <div className="mb-8 px-2">
        <div className="text-accent font-display text-xl font-bold tracking-tight glow-cyan">
          FAIR<span className="text-neon">SIGHT</span>
        </div>
        <div className="text-muted text-xs font-mono mt-0.5">AI Bias Audit Engine v1.0</div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-1 flex-1">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 ${
              activeTab === t.id
                ? 'bg-accent/10 text-accent border border-accent/30'
                : 'text-muted hover:text-soft hover:bg-panel'
            }`}
          >
            <span className="text-lg leading-none">{t.icon}</span>
            <span className="text-xs font-mono uppercase tracking-wider flex-1">{t.label}</span>
            {t.badge && (
              <span className="bg-[#ff6b35] text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-[0_0_8px_#ff6b3566]">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto px-2 pt-4 border-t border-border">
        {currentUser && (
          <div className="space-y-3 mb-4">
            <button 
              onClick={() => window.dispatchEvent(new CustomEvent('start-fairsight-tour'))}
              className="w-full text-left text-[10px] text-accent/70 hover:text-accent font-mono transition-colors flex items-center gap-2"
            >
              ✦ Replay guided tour
            </button>
            <button onClick={logout} className="w-full text-left text-xs text-danger/80 hover:text-danger font-mono transition-colors">
              ← Logout ({currentUser.email?.split('@')[0]})
            </button>
          </div>
        )}
        <div className="text-xs text-muted font-mono">
          <div>EU AI Act Ready</div>
          <div className="text-neon/70">NYC LL144 Compliant</div>
        </div>
      </div>
    </div>
  )
}

// ── Dashboard Home ────────────────────────────────────────────────────────────
function DashboardHome({ liveStats, events, statsData }) {
  const trendData = statsData?.fairness_trend || Array.from({ length: 24 }, (_, i) => ({
    hour: i, score: 60 + Math.random() * 25
  }))
  const topBias = statsData?.top_bias_types || []

  return (
    <div className="space-y-6 page-enter">
      {/* KPI row */}
      <div id="tour-kpis" className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard label="Audits Today" value={<AnimCounter value={statsData?.total_audits_today || liveStats.total} />}
          color="#00e5ff" icon="◈" delta={4.2} />
        <MetricCard label="Bias Caught" value={<AnimCounter value={statsData?.bias_caught_today || liveStats.biased} />}
          color="#ff6b35" icon="⚠" delta={-2.1} />
        <MetricCard label="Avg Fairness Score" value={liveStats.avgScore || statsData?.avg_fairness_score || 0}
          unit="/100" color="#39ff14" icon="◆" delta={1.8} />
        <MetricCard label="Live Latency" value="127" unit="ms" color="#00e5ff" icon="◎" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Fairness trend */}
        <div id="tour-trend" className="glass-panel p-4">
          <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">
            Fairness Score — 24h trend
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00e5ff" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#00e5ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d52" />
              <XAxis dataKey="hour" tick={{ fill: '#4a5578', fontSize: 10, fontFamily: 'JetBrains Mono' }}
                tickFormatter={v => `${v}h`} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4a5578', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <Tooltip content={<ChartTooltip />} />
              <Area dataKey="score" stroke="#00e5ff" fill="url(#scoreGrad)" strokeWidth={2}
                dot={false} activeDot={{ r: 4, fill: '#00e5ff' }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Bias type breakdown */}
        <div id="tour-bias-types" className="glass-panel p-4">
          <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">
            Bias Type Distribution
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={topBias} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d52" horizontal={false} />
              <XAxis type="number" tick={{ fill: '#4a5578', fontSize: 10, fontFamily: 'JetBrains Mono' }} />
              <YAxis type="category" dataKey="type" tick={{ fill: '#8892b0', fontSize: 10, fontFamily: 'DM Sans' }}
                width={110} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {topBias.map((_, i) => (
                  <Cell key={i} fill={['#00e5ff', '#39ff14', '#ff6b35', '#ff2d55'][i % 4]}
                    fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent events */}
      <div id="tour-recent" className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted font-mono uppercase tracking-wider">Recent Audits</span>
          <span className="text-xs text-accent font-mono">{events.length} events</span>
        </div>
        <div className="space-y-1 max-h-64 overflow-y-auto custom-scroll">
          <AnimatePresence>
            {events.slice(0, 12).map((e, i) => <LiveEventRow key={e.id} event={e} index={i} />)}
          </AnimatePresence>
          {events.length === 0 && (
            <div className="text-center py-8 text-muted text-sm font-mono">
              Waiting for live events...
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Live Feed ─────────────────────────────────────────────────────────────────
function LiveFeedPanel({ events, connected }) {
  const [selected, setSelected] = useState(null)
  const current = selected || events[0]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 page-enter">
      {/* Event list */}
      <div id="tour-feed-stream" className="glass-panel p-4">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs text-muted font-mono uppercase tracking-wider">Live Decision Stream</span>
          <StatusIndicator connected={connected} />
        </div>
        <div className="space-y-1 h-96 overflow-y-auto custom-scroll">
          {events.map((e, i) => (
            <div key={e.id} onClick={() => setSelected(e)} className="cursor-pointer">
              <LiveEventRow event={e} index={i} />
            </div>
          ))}
          {events.length === 0 && (
            <div className="text-center py-16 text-muted text-sm font-mono">
              <div className="hex-loader mx-auto mb-4" />
              Connecting to live feed...
            </div>
          )}
        </div>
      </div>

      {/* Detail panel */}
      <div id="tour-feed-details" className="space-y-4">
        {current ? (
          <>
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted font-mono uppercase tracking-wider">Decision Detail</span>
                <SeverityBadge severity={current.bias_severity || 'low'} />
              </div>
              <div className="flex items-center gap-6">
                <FairnessGauge score={current.fairness_score} size={120} />
                <div className="space-y-2">
                  <div>
                    <div className="text-xs text-muted font-mono">Original Score</div>
                    <div className="text-lg font-mono font-bold text-soft">
                      {(current.original_prediction * 100).toFixed(0)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted font-mono">Corrected Score</div>
                    <div className="text-lg font-mono font-bold text-neon">
                      {(current.corrected_prediction * 100).toFixed(0)}%
                      <span className="text-xs ml-1 text-neon/70">
                        (+{current.fairness_improvement?.toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted font-mono">Domain</div>
                    <div className="text-sm font-mono text-accent capitalize">{current.domain}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-4">
              <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">
                SHAP Explainability
              </div>
              <ShapChart shapValues={current.shap_values || {}} />
            </div>

            {current.recommendation?.length > 0 && (
              <div className="glass-panel p-4">
                <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">
                  AI Recommendations
                </div>
                <ul className="space-y-2">
                  {current.recommendation.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs font-body text-soft">
                      <span className="text-accent shrink-0">→</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel p-8 text-center">
            <div className="text-muted text-sm font-mono">Select an event to inspect</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Audit Tool ────────────────────────────────────────────────────────────────
function AuditTool() {
  const { audit } = useApi()
  const [form, setForm] = useState({
    name: 'Alex Johnson',
    age: '35',
    experience_years: '6',
    education: 'State University',
    resume_text: "women's leadership award, maternity leave 2022",
    skills: 'Python, Machine Learning',
    domain: 'hiring',
    prediction: '0.62',
  })
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async () => {
    setLoading(true); setError(null)
    try {
      const { domain, prediction, ...features } = form
      const res = await audit(
        { ...features, age: Number(features.age), experience_years: Number(features.experience_years) },
        parseFloat(prediction),
        domain
      )
      setResult(res)
    } catch (e) {
      setError('Failed to connect to backend. Make sure the API is running.')
    } finally {
      setLoading(false)
    }
  }

  const fields = [
    { key: 'name', label: 'Candidate Name', type: 'text' },
    { key: 'age', label: 'Age', type: 'number' },
    { key: 'experience_years', label: 'Years Experience', type: 'number' },
    { key: 'education', label: 'Education', type: 'text' },
    { key: 'skills', label: 'Skills', type: 'text' },
    { key: 'prediction', label: 'AI Score (0–1)', type: 'number' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 page-enter">
      {/* Input form */}
      <div id="tour-audit-form" className="glass-panel p-6">
        <div className="text-xs text-muted font-mono uppercase tracking-wider mb-5">
          Audit a Decision
        </div>
        <div className="space-y-4">
          {fields.map(f => (
            <div key={f.key}>
              <label className="block text-xs text-muted font-mono mb-1.5">{f.label}</label>
              <input
                className="cyber-input"
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs text-muted font-mono mb-1.5">Resume / Notes</label>
            <textarea
              className="cyber-input resize-none"
              rows={3}
              value={form.resume_text}
              onChange={e => setForm(p => ({ ...p, resume_text: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-xs text-muted font-mono mb-1.5">Domain</label>
            <select className="cyber-input"
              value={form.domain}
              onChange={e => setForm(p => ({ ...p, domain: e.target.value }))}>
              <option value="hiring">Hiring</option>
              <option value="finance">Finance</option>
              <option value="healthcare">Healthcare</option>
            </select>
          </div>
          <button onClick={handleSubmit} disabled={loading}
            className="btn-neon w-full mt-2 py-2.5 disabled:opacity-50">
            {loading ? 'Auditing...' : 'RUN AUDIT →'}
          </button>
          {error && <div className="text-danger text-xs font-mono mt-2">{error}</div>}
        </div>
      </div>

      {/* Results */}
      <div id="tour-audit-result" className="space-y-4">
        {result ? (
          <>
            <div className="glass-panel p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs text-muted font-mono uppercase tracking-wider">Audit Result</span>
                <SeverityBadge severity={result.bias_severity} />
              </div>
              <div className="flex items-center gap-6">
                <FairnessGauge score={result.fairness_score} size={130} />
                <div className="space-y-3 flex-1">
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
                  <div className="flex justify-between">
                    <span className="text-xs text-muted font-mono">Improvement</span>
                    <span className="text-sm font-mono text-accent">
                      +{result.fairness_improvement?.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted font-mono">Latency</span>
                    <span className="text-sm font-mono text-soft">{result.latency_ms}ms</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-panel p-5">
              <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">Fairness Metrics</div>
              <MetricsTable metrics={result.metrics} />
            </div>

            {/* NEW: Career Guidance Panel */}
            {result.career_guidance && result.career_guidance.length > 0 && (
              <div className="glass-panel p-5 bg-gradient-to-br from-[#002f3a] to-panel">
                <div className="text-xs text-neon font-mono uppercase tracking-wider mb-3">
                  🚀 Interview & Career Guidance
                </div>
                <div className="text-sm font-body text-soft mb-3">
                  Based on the resume and profile analysis, here are tailored instructions to help crack this position:
                </div>
                <ul className="space-y-3">
                  {result.career_guidance.map((tip, i) => (
                    <li key={i} className="flex gap-3 text-sm font-body text-[#e2e8f0]">
                      <span className="text-neon/70 shrink-0 border border-neon/30 bg-neon/10 rounded-full w-5 h-5 flex items-center justify-center text-xs">
                        {i + 1}
                      </span>
                      <span>{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="glass-panel p-5">
              <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">
                SHAP Feature Impact
              </div>
              <ShapChart shapValues={result.shap_values || {}} />
            </div>

            {result.recommendation?.length > 0 && (
              <div className="glass-panel p-5">
                <div className="text-xs text-muted font-mono uppercase tracking-wider mb-3">Recommendations</div>
                <ul className="space-y-2">
                  {result.recommendation.map((r, i) => (
                    <li key={i} className="flex gap-2 text-xs font-body text-soft">
                      <span className="text-accent shrink-0">→</span><span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="glass-panel p-8 text-center">
            <div className="text-4xl mb-4 opacity-30">◎</div>
            <div className="text-muted text-sm font-mono">Submit a decision to see the audit result</div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Analytics ─────────────────────────────────────────────────────────────────
function Analytics({ events }) {
  const scoreData = events.slice(0, 30).reverse().map((e, i) => ({
    i,
    score: e.fairness_score,
    original: Math.round(e.original_prediction * 100),
    corrected: Math.round(e.corrected_prediction * 100),
  }))

  const domainDist = events.reduce((acc, e) => {
    acc[e.domain] = (acc[e.domain] || 0) + 1; return acc
  }, {})
  const domainData = Object.entries(domainDist).map(([name, value]) => ({ name, value }))

  return (
    <div className="space-y-4 page-enter">
      <div id="tour-analytics-charts" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="glass-panel p-4">
          <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">
            Score Correction Impact
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={scoreData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d52" />
              <XAxis dataKey="i" tick={{ fill: '#4a5578', fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4a5578', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line dataKey="original" stroke="#ff6b35" strokeWidth={2} dot={false} name="Original %" />
              <Line dataKey="corrected" stroke="#39ff14" strokeWidth={2} dot={false} name="Corrected %" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-panel p-4">
          <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">
            Domain Distribution
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={domainData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e2d52" />
              <XAxis dataKey="name" tick={{ fill: '#8892b0', fontSize: 11, fontFamily: 'DM Sans' }} />
              <YAxis tick={{ fill: '#4a5578', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {domainData.map((_, i) => <Cell key={i} fill={['#00e5ff', '#39ff14', '#ff6b35'][i]} fillOpacity={0.8} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel p-4">
        <div className="text-xs text-muted font-mono uppercase tracking-wider mb-4">
          Fairness Score History
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={scoreData}>
            <defs>
              <linearGradient id="fairGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#39ff14" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#39ff14" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e2d52" />
            <XAxis dataKey="i" tick={{ fill: '#4a5578', fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fill: '#4a5578', fontSize: 10 }} />
            <Tooltip content={<ChartTooltip />} />
            <Area dataKey="score" stroke="#39ff14" fill="url(#fairGrad)" strokeWidth={2}
              dot={false} name="Fairness Score" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Demo Mode ─────────────────────────────────────────────────────────────────
function DemoMode() {
  const { simulate } = useApi()
  const [running, setRunning] = useState(false)
  const [results, setResults] = useState([])
  const [step, setStep] = useState(0)

  const demos = [
    {
      title: 'Gender Bias in Hiring',
      desc: 'An AI screening tool discriminates against female candidates based on resume language.',
      features: { name: 'Sarah Chen', age: 34, experience_years: 7, education: 'UC Berkeley',
        resume_text: "women's tech leadership, maternity leave 2021, she/her" },
      prediction: 0.41,
      domain: 'hiring',
    },
    {
      title: 'Age Discrimination',
      desc: 'Senior candidate penalized purely based on age inferred from graduation year.',
      features: { name: 'Robert Wilson', age: 52, experience_years: 25, education: 'MIT 1994',
        resume_text: 'extensive experience, 25 years in industry' },
      prediction: 0.38,
      domain: 'hiring',
    },
    {
      title: 'Location-Based Financial Redlining',
      desc: 'Loan AI uses ZIP code as a proxy for race, rejecting historically Black neighborhoods.',
      features: { name: 'Marcus Johnson', zip_code: '90059', income: 75000, credit_score: 720,
        address: 'South Central, Los Angeles' },
      prediction: 0.32,
      domain: 'finance',
    },
  ]

  const runDemo = async (demo) => {
    const { useApi: _u, ...rest } = { ...demo }
    setRunning(true)
    try {
      const res = await fetch('http://localhost:8000/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: demo.features, prediction: demo.prediction, domain: demo.domain })
      })
      const data = await res.json()
      setResults(prev => [{ ...data, title: demo.title }, ...prev])
    } catch (e) {
      // Offline demo — generate mock result
      const mock = {
        title: demo.title,
        fairness_score: Math.round(25 + Math.random() * 30),
        bias_detected: true,
        bias_severity: 'high',
        original_prediction: demo.prediction,
        corrected_prediction: demo.prediction + 0.22,
        fairness_improvement: 22,
        latency_ms: 127,
        metrics: {
          disparate_impact: 0.61, equal_opportunity_diff: -0.24,
          statistical_parity_diff: -0.18, average_odds_diff: -0.15,
          theil_index: 0.31, individual_fairness: 0.57,
        },
        shap_values: Object.fromEntries(
          Object.keys(demo.features).map(k => [k, parseFloat((Math.random() * 0.4 - 0.3).toFixed(4))])
        ),
        recommendation: [
          'Remove gender-correlated language from feature extraction',
          'Apply Equalized Odds post-processing before deployment',
          'Audit training data for historical sampling bias',
        ],
        timestamp: new Date().toISOString(),
      }
      setResults(prev => [mock, ...prev])
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="space-y-6 page-enter">
      <div className="glass-panel p-5">
        <div className="text-xs text-muted font-mono uppercase tracking-wider mb-2">Demo Scenarios</div>
        <div className="text-xs text-soft font-body mb-5">
          Real-world bias scenarios modeled after documented AI failures. Click to run the audit.
        </div>
        <div id="tour-demo-grid" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {demos.map((demo, i) => (
            <motion.div
              key={i}
              whileHover={{ scale: 1.02 }}
              className="glass-panel gradient-border p-4 hover-glow"
            >
              <div className="text-sm font-body font-medium text-soft mb-2">{demo.title}</div>
              <div className="text-xs text-muted font-body mb-4 leading-relaxed">{demo.desc}</div>
              <button
                onClick={() => runDemo(demo)}
                disabled={running}
                className="btn-neon w-full text-xs py-2 disabled:opacity-50"
              >
                {running ? 'Auditing...' : 'Run Audit →'}
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {results.length > 0 && (
        <div className="space-y-4">
          {results.map((r, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-panel p-5"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-sm font-body font-medium text-soft">{r.title}</div>
                  <div className="text-xs text-muted font-mono mt-0.5">{r.timestamp ? new Date(r.timestamp).toLocaleTimeString() : ''}</div>
                </div>
                <SeverityBadge severity={r.bias_severity} />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="flex items-center gap-4">
                  <FairnessGauge score={r.fairness_score} size={100} />
                  <div className="space-y-2">
                    <div>
                      <div className="text-xs text-muted font-mono">Original</div>
                      <div className="text-base font-mono text-warn font-bold">{(r.original_prediction * 100).toFixed(0)}%</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted font-mono">Corrected</div>
                      <div className="text-base font-mono text-neon font-bold">{(r.corrected_prediction * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </div>
                <div className="lg:col-span-2">
                  <div className="text-xs text-muted font-mono mb-2">SHAP Explanation</div>
                  <ShapChart shapValues={r.shap_values || {}} />
                </div>
              </div>
              {r.recommendation?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="text-xs text-muted font-mono mb-2">Remediation</div>
                  <div className="flex flex-wrap gap-2">
                    {r.recommendation.map((rec, j) => (
                      <span key={j} className="text-xs text-soft font-body bg-panel border border-border rounded px-2 py-1">
                        → {rec}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main App ──────────────────────────────────────────────────────────────────
function MainLayout() {
  const { currentUser } = useAuth()
  const [activeTab, setTab] = useState('dashboard')
  const { events, connected, stats: liveStats } = useLiveFeed()
  const { data: statsData } = useStats()
  
  // State for Onboarding Guide
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const tourDone = localStorage.getItem(`fairsight_onboarding_done_${currentUser.uid}`);
      if (!tourDone) {
        // Small delay to ensure the dashboard UI has stabilized
        const timer = setTimeout(() => setShowGuide(true), 1500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentUser]);

  const dismissGuide = () => {
    if (currentUser) {
      localStorage.setItem(`fairsight_onboarding_done_${currentUser.uid}`, 'true');
    }
    setShowGuide(false);
  };

  useEffect(() => {
    const handleStartTour = () => setShowGuide(true);
    window.addEventListener('start-fairsight-tour', handleStartTour);
    return () => window.removeEventListener('start-fairsight-tour', handleStartTour);
  }, []);

  if (!currentUser) {
    return <AuthScreen />
  }

  return (
    <div className="flex h-screen overflow-hidden relative">
      <div className="relative z-10 flex w-full h-full">
        <AnimatePresence>
          {showGuide && <OnboardingTour onDismiss={dismissGuide} onTabChange={setTab} />}
        </AnimatePresence>
        
        <Sidebar activeTab={activeTab} setTab={setTab} />

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {/* Header */}
          <div className="glass-panel rounded-none border-x-0 border-t-0 px-6 py-3 flex items-center justify-between shrink-0">
            <div>
              <div className="text-sm font-body font-medium text-soft capitalize">{activeTab}</div>
              <div className="text-xs text-muted font-mono">FairSight · Responsible AI Platform</div>
            </div>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => window.dispatchEvent(new CustomEvent('start-fairsight-tour'))}
                className="w-8 h-8 rounded-full border border-border flex items-center justify-center text-muted hover:text-accent hover:border-accent transition-all font-mono text-sm"
                title="Help & Tour"
              >
                ?
              </button>
              <StatusIndicator connected={connected} />
              <div className="text-xs font-mono text-muted">
                {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>

          {/* Page content */}
          <div className="flex-1 overflow-y-auto p-6 custom-scroll grid-bg">
            <AnimatePresence mode="wait">
              <motion.div key={activeTab} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}>
                {activeTab === 'dashboard' && <DashboardHome liveStats={liveStats} events={events} statsData={statsData} />}
                {activeTab === 'live' && <LiveFeedPanel events={events} connected={connected} />}
                {activeTab === 'audit' && <AuditTool />}
                {activeTab === 'career' && <CareerCoach />}
                {activeTab === 'analytics' && <Analytics events={events} />}
                {activeTab === 'demo' && <DemoMode />}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <MainLayout />
    </AuthProvider>
  )
}
