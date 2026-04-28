import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../hooks/useApi'
import { SeverityBadge } from './UIComponents'
import InvitationModal from './InvitationModal'

export default function UploadCandidates() {
  const { uploadCandidates, getCandidates, clearCandidates } = useApi()
  const [candidates, setCandidates] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState(null)
  const fileInputRef = useRef(null)

  const fetchCandidates = async () => {
    try {
      const data = await getCandidates()
      setCandidates(data.candidates || [])
    } catch (e) {
      console.error('Failed to fetch candidates:', e)
    }
  }

  useEffect(() => {
    fetchCandidates()
  }, [])

  const handleFileUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    setLoading(true)
    setError(null)
    setSuccess(null)

    try {
      const res = await uploadCandidates(file)
      setSuccess(`Successfully uploaded ${res.uploaded_count} candidates.`)
      fetchCandidates()
      if (fileInputRef.current) fileInputRef.current.value = ''
    } catch (e) {
      setError(e.message || 'Failed to upload candidates.')
    } finally {
      setLoading(false)
    }
  }

  const handleClear = async () => {
    if (!confirm('Are you sure you want to clear all candidate data?')) return
    try {
      await clearCandidates()
      setCandidates([])
    } catch (e) {
      setError('Failed to clear candidates.')
    }
  }

  const handleSelectCandidate = (cand) => {
    setSelectedCandidate(cand)
    setModalOpen(true)
  }

  const handleInvitationSuccess = (candidateId) => {
    // Update local state to show 'Sent' status without re-fetching everything
    setCandidates(prev => prev.map(c => 
      c._id === candidateId 
        ? { ...c, invitationStatus: 'Sent ✅' } 
        : c
    ))
    setSuccess('Invitation sent successfully!')
    setTimeout(() => setSuccess(null), 3000)
  }

  return (
    <div className="space-y-6 page-enter">
      {/* Upload Section */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-mono text-muted uppercase tracking-widest">Candidate Ingestion</h2>
            <p className="text-xs text-soft mt-1">Upload CSV or JSON files to audit candidate pools for bias.</p>
          </div>
          <button 
            onClick={handleClear}
            className="text-[10px] font-mono text-danger/60 hover:text-danger transition-colors border border-danger/20 hover:border-danger/40 px-2 py-1 rounded"
          >
            CLEAR DATABASE
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border hover:border-accent/40 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all bg-panel/30 hover:bg-accent/5 group"
          >
            <div className="text-3xl mb-3 group-hover:scale-110 transition-transform">📂</div>
            <div className="text-xs font-mono text-soft group-hover:text-accent transition-colors text-center">
              {loading ? 'PROCESSING...' : 'CLICK TO UPLOAD CSV/JSON'}
            </div>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".csv,.json"
            />
          </div>

          <div className="space-y-4">
            <div className="glass-panel bg-panel/20 p-4 border-l-2 border-accent">
              <h3 className="text-[10px] font-mono text-accent uppercase mb-2">Supported Format</h3>
              <ul className="text-[10px] text-muted space-y-1 font-mono">
                <li>• CSV: name, age, experience_years, education, resume_text, skills</li>
                <li>• JSON: Array of objects or &#123;"candidates": [...]&#125;</li>
              </ul>
            </div>

            {error && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-danger/10 border border-danger/20 rounded text-danger text-[10px] font-mono">
                ⚠ ERROR: {error}
              </motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-3 bg-neon/10 border border-neon/20 rounded text-neon text-[10px] font-mono">
                ✓ SUCCESS: {success}
              </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* Candidates List */}
      <div className="glass-panel p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-mono text-muted uppercase tracking-widest">Ingested Pool ({candidates.length})</h2>
          <div className="flex gap-2">
            <div className="h-2 w-2 rounded-full bg-neon animate-pulse" />
            <span className="text-[10px] font-mono text-muted">LIVE DATABASE</span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scroll">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border">
                <th className="py-3 px-4 text-[10px] font-mono text-muted uppercase tracking-wider">Candidate</th>
                <th className="py-3 px-4 text-[10px] font-mono text-muted uppercase tracking-wider">Experience</th>
                <th className="py-3 px-4 text-[10px] font-mono text-muted uppercase tracking-wider">Education</th>
                <th className="py-3 px-4 text-[10px] font-mono text-muted uppercase tracking-wider">Skills</th>
                <th className="py-3 px-4 text-[10px] font-mono text-muted uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {candidates.map((cand, i) => (
                  <motion.tr 
                    key={cand._id || i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="border-b border-border/50 hover:bg-panel/40 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="text-xs font-medium text-soft">{cand && typeof cand.name !== 'object' ? cand.name : 'Anonymous'}</div>
                      <div className="text-[10px] text-muted font-mono">{cand && cand.age && typeof cand.age !== 'object' ? `${cand.age} yrs` : 'Age N/A'}</div>
                    </td>
                    <td className="py-3 px-4 text-xs font-mono text-soft">
                      {cand && cand.experience_years && typeof cand.experience_years !== 'object' ? cand.experience_years : 0} years
                    </td>
                    <td className="py-3 px-4 text-[10px] text-muted truncate max-w-[150px]">
                      {cand && typeof cand.education !== 'object' ? cand.education : 'N/A'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap gap-1">
                        {(typeof cand.skills === 'string' 
                            ? cand.skills.split(',') 
                            : Array.isArray(cand.skills) ? cand.skills : []
                          ).slice(0, 3).map((s, j) => (
                          <span key={j} className="text-[8px] bg-accent/10 text-accent px-1.5 py-0.5 rounded border border-accent/20">
                            {String(s).trim()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {cand.invitationStatus === 'Sent ✅' ? (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] bg-neon/10 text-neon px-2 py-1 rounded border border-neon/20 flex items-center w-fit gap-1 font-mono">
                            ✓ SENT
                          </span>
                          <button 
                            onClick={() => handleSelectCandidate(cand)}
                            className="text-[10px] text-muted hover:text-accent underline font-mono"
                          >
                            RESEND
                          </button>
                        </div>
                      ) : cand.invitationStatus === 'Pending ⏳' ? (
                        <span className="text-[10px] bg-warning/10 text-warning px-2 py-1 rounded border border-warning/20 flex items-center w-fit gap-1 font-mono">
                          ⏳ PENDING
                        </span>
                      ) : (
                        <button 
                          onClick={() => handleSelectCandidate(cand)}
                          className="text-[10px] bg-accent/10 text-accent hover:bg-accent hover:text-background px-3 py-1.5 rounded transition-colors font-mono font-bold"
                        >
                          SELECT CANDIDATE
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
              {candidates.length === 0 && (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-muted font-mono text-xs">
                    No candidates in pool. Upload a file to begin analysis.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <InvitationModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        candidate={selectedCandidate}
        onSuccess={handleInvitationSuccess}
      />
    </div>
  )
}
