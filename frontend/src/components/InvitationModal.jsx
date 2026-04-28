import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApi } from '../hooks/useApi'

export default function InvitationModal({ candidate, isOpen, onClose, onSuccess }) {
  const { sendInvitation, generateInvitation } = useApi()
  const [message, setMessage] = useState('')
  const [interviewDate, setInterviewDate] = useState('')
  const [interviewType, setInterviewType] = useState('Online')
  const [meetingLink, setMeetingLink] = useState('')
  const [tone, setTone] = useState('Formal')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  useEffect(() => {
    if (isOpen && candidate) {
      setMessage(`Hello ${candidate.name || 'Candidate'},\n\nCongratulations! You have been shortlisted for the next round at FairSight.\nWe would like to invite you for an interview.`)
      setInterviewDate('')
      setMeetingLink('')
    }
  }, [isOpen, candidate])

  const handleGenerateAI = async () => {
    setAiLoading(true)
    try {
      const res = await generateInvitation({
        candidateName: candidate.name || 'Candidate',
        companyName: 'FairSight',
        tone: tone
      })
      setMessage(res.message)
    } catch (e) {
      console.error(e)
      alert("Failed to generate AI message.")
    } finally {
      setAiLoading(false)
    }
  }

  const handleSend = async () => {
    setLoading(true)
    try {
      await sendInvitation({
        candidateId: candidate._id,
        message,
        interviewDate: interviewDate || undefined,
        interviewType,
        meetingLink: meetingLink || undefined
      })
      onSuccess(candidate._id)
      onClose()
    } catch (e) {
      console.error(e)
      alert("Failed to send invitation.")
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen || !candidate) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          
          {/* Modal */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg bg-panel border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            {/* Header */}
            <div className="p-6 border-b border-border bg-panel/50">
              <h2 className="text-xl font-mono text-soft">Send Interview Invitation</h2>
              <p className="text-xs text-muted mt-1">To: <span className="text-accent">{candidate.name || 'Candidate'}</span></p>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto custom-scroll space-y-5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-mono text-muted uppercase">Message</label>
                <div className="flex gap-2 items-center">
                  <select 
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    className="bg-background border border-border text-xs text-soft rounded px-2 py-1 outline-none"
                  >
                    <option value="Formal">Formal</option>
                    <option value="Friendly">Friendly</option>
                    <option value="Persuasive">Persuasive</option>
                  </select>
                  <button 
                    onClick={handleGenerateAI}
                    disabled={aiLoading}
                    className="text-[10px] bg-accent/10 text-accent hover:bg-accent/20 px-2 py-1 rounded border border-accent/20 transition-colors flex items-center gap-1"
                  >
                    {aiLoading ? 'GENERATING...' : '✨ AI REWRITE'}
                  </button>
                </div>
              </div>
              <textarea 
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full bg-background/50 border border-border rounded-lg p-3 text-sm text-soft focus:border-accent outline-none transition-colors"
                placeholder="Type your invitation message..."
              />

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted uppercase">Interview Date</label>
                  <input 
                    type="datetime-local" 
                    value={interviewDate}
                    onChange={(e) => setInterviewDate(e.target.value)}
                    className="w-full bg-background border border-border text-xs text-soft rounded px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted uppercase">Interview Type</label>
                  <select 
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full bg-background border border-border text-xs text-soft rounded px-3 py-2 outline-none focus:border-accent"
                  >
                    <option value="Online">Online</option>
                    <option value="Offline">Offline / On-site</option>
                  </select>
                </div>
              </div>

              {interviewType === 'Online' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted uppercase">Meeting Link</label>
                  <input 
                    type="url" 
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://meet.google.com/..."
                    className="w-full bg-background border border-border text-xs text-soft rounded px-3 py-2 outline-none focus:border-accent"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-border bg-panel/50 flex justify-end gap-3">
              <button 
                onClick={onClose}
                className="px-4 py-2 text-xs font-mono text-muted hover:text-soft transition-colors"
              >
                CANCEL
              </button>
              <button 
                onClick={handleSend}
                disabled={loading}
                className="px-6 py-2 text-xs font-mono bg-accent text-background rounded hover:brightness-110 transition-all font-bold disabled:opacity-50 flex items-center gap-2"
              >
                {loading ? 'SENDING...' : 'SEND NOW 🚀'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
