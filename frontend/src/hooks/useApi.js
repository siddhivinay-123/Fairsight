import { useState, useEffect, useRef, useCallback } from 'react'
import { addDoc, collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore'
import { db } from '../firebase'

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'
const WS_BASE  = API_BASE.replace('http', 'ws')

// ── API Hook ─────────────────────────────────────────────────────────────────
export function useApi() {
  const audit = useCallback(async (features, prediction, domain = 'hiring') => {
    const res = await fetch(`${API_BASE}/audit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ features, prediction, domain }),
    })
    if (!res.ok) throw new Error('Audit failed')
    const json = await res.json()
    // Save to Firebase (non-blocking)
    addDoc(collection(db, 'audits'), { ...json, createdAt: new Date() })
      .catch(e => console.error('Firebase DB Error:', e))
    return json
  }, [])

  const auditBatch = useCallback(async (records) => {
    const res = await fetch(`${API_BASE}/audit/batch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    })
    return res.json()
  }, [])

  const getStats = useCallback(async () => {
    const res = await fetch(`${API_BASE}/stats/summary`)
    return res.json()
  }, [])

  const simulate = useCallback(async () => {
    const res = await fetch(`${API_BASE}/demo/simulate`)
    return res.json()
  }, [])

  const uploadCandidates = useCallback(async (file) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await fetch(`${API_BASE}/upload-candidates`, {
      method: 'POST',
      body: formData,
    })
    if (!res.ok) throw new Error('Upload failed')
    return res.json()
  }, [])

  const getCandidates = useCallback(async (limit = 100, offset = 0) => {
    const res = await fetch(`${API_BASE}/candidates?limit=${limit}&offset=${offset}`)
    if (!res.ok) throw new Error('Failed to fetch candidates')
    return res.json()
  }, [])

  const clearCandidates = useCallback(async () => {
    const res = await fetch(`${API_BASE}/candidates`, { method: 'DELETE' })
    return res.json()
  }, [])

  const sendInvitation = useCallback(async (payload) => {
    const res = await fetch(`${API_BASE}/send-invitation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to send invitation')
    return res.json()
  }, [])

  const generateInvitation = useCallback(async (payload) => {
    const res = await fetch(`${API_BASE}/generate-invitation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to generate invitation')
    return res.json()
  }, [])

  return { audit, auditBatch, getStats, simulate, uploadCandidates, getCandidates, clearCandidates, sendInvitation, generateInvitation }
}

// ── WebSocket Live Feed ──────────────────────────────────────────────────────
export function useLiveFeed(maxEvents = 50) {
  const [events, setEvents] = useState([])
  const [connected, setConnected] = useState(false)
  const [stats, setStats] = useState({ total: 0, biased: 0, avgScore: 0 })
  const wsRef = useRef(null)
  const reconnectTimer = useRef(null)

  const connect = useCallback(() => {
    try {
      const ws = new WebSocket(`${WS_BASE}/ws`)
      wsRef.current = ws

      ws.onopen = () => setConnected(true)
      ws.onclose = () => {
        setConnected(false)
        reconnectTimer.current = setTimeout(connect, 3000)
      }
      ws.onerror = () => ws.close()

      ws.onmessage = async (msg) => {
        try {
          const packet = JSON.parse(msg.data)
          if (packet.type === 'live_audit' || packet.type === 'audit_result') {
            const data = packet.data
            
            // Optionally, we could save the live simulation to Firestore too
            // try { await addDoc(collection(db, 'audits'), { ...data, createdAt: new Date() }) } catch(e) {}

            setEvents(prev => {
              const next = [{ ...data, id: Date.now() + Math.random() }, ...prev].slice(0, maxEvents)
              return next
            })
            setStats(prev => {
              const total = prev.total + 1
              const biased = prev.biased + (data.bias_detected ? 1 : 0)
              const avgScore = (prev.avgScore * prev.total + data.fairness_score) / total
              return { total, biased, avgScore: Math.round(avgScore * 10) / 10 }
            })
          }
        } catch (_) {}
      }
    } catch (_) {}
  }, [maxEvents])

  useEffect(() => {
    connect()
    return () => {
      clearTimeout(reconnectTimer.current)
      wsRef.current?.close()
    }
  }, [connect])

  return { events, connected, stats }
}

// ── Stats Hook ────────────────────────────────────────────────────────────────
export function useStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const { getStats } = useApi()

  useEffect(() => {
    getStats().then(d => { setData(d); setLoading(false) }).catch(() => setLoading(false))
    const t = setInterval(() => getStats().then(setData).catch(() => {}), 30000)
    return () => clearInterval(t)
  }, [getStats])

  return { data, loading }
}
