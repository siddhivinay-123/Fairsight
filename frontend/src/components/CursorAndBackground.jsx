import { useEffect, useRef, useCallback } from 'react'

// ── Particle System ──────────────────────────────────────────────────────────
function initParticles(canvas) {
  const ctx = canvas.getContext('2d')
  let W = canvas.width = window.innerWidth
  let H = canvas.height = window.innerHeight
  let mouse = { x: W / 2, y: H / 2 }
  let animId

  const PARTICLE_COUNT = 80
  const CONNECTION_DIST = 130
  const MOUSE_DIST = 160

  const particles = Array.from({ length: PARTICLE_COUNT }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    vx: (Math.random() - 0.5) * 0.4,
    vy: (Math.random() - 0.5) * 0.4,
    r: Math.random() * 1.5 + 0.5,
    opacity: Math.random() * 0.5 + 0.2,
    pulse: Math.random() * Math.PI * 2,
  }))

  function draw() {
    ctx.clearRect(0, 0, W, H)

    // Update and draw particles
    for (const p of particles) {
      p.x += p.vx
      p.y += p.vy
      p.pulse += 0.02

      // Mouse attraction
      const dx = mouse.x - p.x
      const dy = mouse.y - p.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < MOUSE_DIST) {
        const force = (MOUSE_DIST - dist) / MOUSE_DIST
        p.vx += dx * force * 0.0004
        p.vy += dy * force * 0.0004
      }

      // Speed limit
      const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy)
      if (speed > 1.2) { p.vx *= 0.98; p.vy *= 0.98 }

      // Bounce
      if (p.x < 0 || p.x > W) p.vx *= -1
      if (p.y < 0 || p.y > H) p.vy *= -1

      const glow = 0.5 + 0.5 * Math.sin(p.pulse)
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.r + glow * 0.5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(0, 229, 255, ${p.opacity * (0.6 + glow * 0.4)})`
      ctx.shadowBlur = 8 * glow
      ctx.shadowColor = '#00e5ff'
      ctx.fill()
      ctx.shadowBlur = 0
    }

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i], b = particles[j]
        const dx = a.x - b.x, dy = a.y - b.y
        const d = Math.sqrt(dx * dx + dy * dy)
        if (d < CONNECTION_DIST) {
          const alpha = (1 - d / CONNECTION_DIST) * 0.25
          ctx.beginPath()
          ctx.moveTo(a.x, a.y)
          ctx.lineTo(b.x, b.y)
          ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`
          ctx.lineWidth = 0.5
          ctx.stroke()
        }
      }

      // Mouse connections
      const p = particles[i]
      const mdx = mouse.x - p.x, mdy = mouse.y - p.y
      const md = Math.sqrt(mdx * mdx + mdy * mdy)
      if (md < MOUSE_DIST) {
        const alpha = (1 - md / MOUSE_DIST) * 0.5
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(mouse.x, mouse.y)
        ctx.strokeStyle = `rgba(0, 229, 255, ${alpha})`
        ctx.lineWidth = 0.8
        ctx.stroke()
      }
    }

    animId = requestAnimationFrame(draw)
  }

  draw()

  const handleResize = () => {
    W = canvas.width = window.innerWidth
    H = canvas.height = window.innerHeight
  }

  return {
    setMouse: (x, y) => { mouse.x = x; mouse.y = y },
    destroy: () => {
      cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
    },
    handleResize,
  }
}

// ── Cursor Trail ─────────────────────────────────────────────────────────────
const TRAIL_LENGTH = 8

export default function CursorAndBackground() {
  const canvasRef = useRef(null)
  const dotRef = useRef(null)
  const ringRef = useRef(null)
  const trailsRef = useRef([])
  const particleSystem = useRef(null)
  const mouseRef = useRef({ x: 0, y: 0 })
  const ringPos = useRef({ x: 0, y: 0 })
  const trailPositions = useRef(Array(TRAIL_LENGTH).fill({ x: 0, y: 0 }))
  const animRef = useRef(null)

  const animate = useCallback(() => {
    // Smooth ring follow
    const { x, y } = mouseRef.current
    ringPos.current.x += (x - ringPos.current.x) * 0.12
    ringPos.current.y += (y - ringPos.current.y) * 0.12

    if (ringRef.current) {
      ringRef.current.style.left = ringPos.current.x + 'px'
      ringRef.current.style.top  = ringPos.current.y + 'px'
    }

    // Trail positions cascade
    trailPositions.current = [
      { x, y },
      ...trailPositions.current.slice(0, TRAIL_LENGTH - 1)
    ]

    trailsRef.current.forEach((el, i) => {
      if (!el) return
      const pos = trailPositions.current[i] || { x, y }
      const scale = 1 - i / TRAIL_LENGTH
      const opacity = (1 - i / TRAIL_LENGTH) * 0.5
      el.style.left = pos.x + 'px'
      el.style.top  = pos.y + 'px'
      el.style.opacity = opacity
      el.style.transform = `translate(-50%, -50%) scale(${scale})`
    })

    animRef.current = requestAnimationFrame(animate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    particleSystem.current = initParticles(canvas)
    window.addEventListener('resize', particleSystem.current.handleResize)

    const handleMouseMove = (e) => {
      const { clientX: x, clientY: y } = e
      mouseRef.current = { x, y }

      if (dotRef.current) {
        dotRef.current.style.left = x + 'px'
        dotRef.current.style.top  = y + 'px'
      }

      particleSystem.current?.setMouse(x, y)
    }

    const handleHoverIn = () => ringRef.current?.classList.add('hovering')
    const handleHoverOut = () => ringRef.current?.classList.remove('hovering')

    // Watch for hoverable elements
    document.addEventListener('mousemove', handleMouseMove)

    const observer = new MutationObserver(() => {
      document.querySelectorAll('button, a, [data-hover]').forEach(el => {
        el.addEventListener('mouseenter', handleHoverIn)
        el.addEventListener('mouseleave', handleHoverOut)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    animRef.current = requestAnimationFrame(animate)

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      cancelAnimationFrame(animRef.current)
      particleSystem.current?.destroy()
      observer.disconnect()
    }
  }, [animate])

  return (
    <>
      {/* Particle canvas */}
      <canvas ref={canvasRef} id="bg-canvas" />

      {/* Background mesh orbs */}
      <div className="bg-mesh pointer-events-none">
        <div className="bg-mesh-orb" style={{ width: 600, height: 600, top: '-20%', left: '-10%', background: '#00e5ff', '--duration': '25s' }} />
        <div className="bg-mesh-orb" style={{ width: 500, height: 500, bottom: '-20%', right: '-10%', background: '#39ff14', '--duration': '32s' }} />
        <div className="bg-mesh-orb" style={{ width: 400, height: 400, top: '40%', left: '40%', background: '#ff6b35', '--duration': '18s' }} />
      </div>

      {/* Noise grain overlay */}
      <div className="noise-overlay pointer-events-none" />

      {/* Cursor elements */}
      <div ref={dotRef} className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
      {Array.from({ length: TRAIL_LENGTH }).map((_, i) => (
        <div
          key={i}
          ref={el => trailsRef.current[i] = el}
          className="cursor-trail"
          style={{ width: 4 - i * 0.3, height: 4 - i * 0.3 }}
        />
      ))}
    </>
  )
}
