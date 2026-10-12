import { useEffect, useRef } from 'react'
import { useReducedMotion } from 'motion/react'

/** Percikan bara kecil yang naik pelan. Statis saat reduced motion, berhenti saat tak terlihat. */
export function EmberCanvas({ className = '' }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  const reduce = useReducedMotion()

  useEffect(() => {
    const cv = ref.current
    if (!cv) return
    const ctx = cv.getContext('2d')
    if (!ctx) return
    let w = 0, h = 0, raf = 0, visible = true
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const count = window.innerWidth < 768 ? 28 : 55
    type P = { x: number; y: number; r: number; v: number; d: number; a: number; ph: number }
    const mk = (init: boolean): P => ({
      x: Math.random() * w, y: init ? Math.random() * h : h + 10, r: 0.6 + Math.random() * 1.8,
      v: 8 + Math.random() * 26, d: (Math.random() - 0.5) * 14, a: 0.25 + Math.random() * 0.6, ph: Math.random() * 6.28,
    })
    let ps: P[] = []
    const resize = () => {
      w = cv.clientWidth; h = cv.clientHeight
      cv.width = w * dpr; cv.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ps = Array.from({ length: count }, () => mk(true))
      draw(0)
    }
    function draw(dt: number) {
      ctx!.clearRect(0, 0, w, h)
      for (const p of ps) {
        p.y -= p.v * dt; p.x += (p.d + Math.sin(p.ph += dt * 1.5) * 8) * dt
        if (p.y < -10) Object.assign(p, mk(false))
        const fade = Math.min(1, p.y / (h * 0.4 + 1))
        ctx!.beginPath()
        ctx!.fillStyle = `rgba(249,115,22,${p.a * fade})`
        ctx!.shadowColor = 'rgba(249,115,22,.8)'; ctx!.shadowBlur = 6
        ctx!.arc(p.x, p.y, p.r, 0, 6.283); ctx!.fill()
      }
    }
    let last = performance.now()
    const loop = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); last = t
      if (visible && !document.hidden) draw(dt)
      raf = requestAnimationFrame(loop)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(cv)
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting }); io.observe(cv)
    if (!reduce) raf = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect() }
  }, [reduce])

  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 size-full ${className}`} />
}
