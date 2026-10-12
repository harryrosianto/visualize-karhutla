import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useMemo, type RefObject } from 'react'
import { H, W, pinePath, ridgeFn, ridgePath } from '../lib/landscape'
import { Picture } from './Picture'

interface LayerSpec {
  id: string
  fill: string
  /** kedalaman: 0 = jauh (hampir diam), 1 = dekat (bergerak penuh) */
  depth: number
  d: string
}

function useLayers(): LayerSpec[] {
  return useMemo(() => {
    const r1 = ridgeFn(11, 520, 70, 5), r2 = ridgeFn(23, 600, 78, 6), r3 = ridgeFn(37, 676, 70, 6), r4 = ridgeFn(53, 756, 56, 6), r5 = ridgeFn(71, 838, 40, 5)
    return [
      { id: 'r1', fill: '#6a260d', depth: 0.12, d: ridgePath(r1) },
      { id: 'r2', fill: '#4a1a0a', depth: 0.3, d: ridgePath(r2) + pinePath(5, r2, 70, 16, 34) },
      { id: 'r3', fill: '#2e1008', depth: 0.5, d: ridgePath(r3) + pinePath(7, r3, 54, 28, 62) },
      { id: 'r4', fill: '#1a0a06', depth: 0.72, d: ridgePath(r4) + pinePath(9, r4, 36, 54, 110) },
      { id: 'r5', fill: '#0c0a09', depth: 1, d: ridgePath(r5) + pinePath(13, r5, 18, 120, 240) },
    ]
  }, [])
}

function Layer({ depth, progress, mx, my, children }: {
  depth: number; progress: MotionValue<number>; mx: MotionValue<number>; my: MotionValue<number>; children: React.ReactNode
}) {
  // scroll: lapisan jauh tertinggal (turun pelan), lapisan dekat mengikuti halaman. pointer: geser mini berlawanan kedalaman.
  const y = useTransform([progress, my] as MotionValue<number>[], ([p, m]: number[]) => p * (1 - depth) * 380 + m * depth * 14)
  const x = useTransform(mx, v => v * depth * 46)
  return (
    <motion.div aria-hidden className="absolute inset-x-[-4%] bottom-0 top-0" style={{ x, y }}>
      {children}
    </motion.div>
  )
}

/** Adegan lanskap bara berlapis dengan parallax scroll dan pointer. Statis saat prefers-reduced-motion. */
export function ParallaxScene({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion()
  const layers = useLayers()
  const { scrollYProgress } = useScroll({ target, offset: ['start start', 'end start'] })
  const still = useMotionValue(0)
  const progress = reduce ? still : scrollYProgress
  const rawX = useMotionValue(0), rawY = useMotionValue(0)
  const mx = useSpring(rawX, { stiffness: 60, damping: 18, mass: 0.6 })
  const my = useSpring(rawY, { stiffness: 60, damping: 18, mass: 0.6 })

  useEffect(() => {
    if (reduce || !target.current) return
    const el = target.current
    const move = (e: PointerEvent) => {
      if (e.pointerType === 'touch') return
      const r = el.getBoundingClientRect()
      rawX.set((e.clientX - r.left) / r.width - 0.5)
      rawY.set((e.clientY - r.top) / r.height - 0.5)
    }
    const leave = () => { rawX.set(0); rawY.set(0) }
    el.addEventListener('pointermove', move)
    el.addEventListener('pointerleave', leave)
    return () => { el.removeEventListener('pointermove', move); el.removeEventListener('pointerleave', leave) }
  }, [reduce, target, rawX, rawY])

  const skyY = useTransform(progress, p => p * 160)
  const sunY = useTransform(progress, p => p * 240)
  const sunX = useTransform(mx, v => v * -22)

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      {/* langit senja berasap */}
      <motion.div className="absolute inset-[-6%_-2%_-2%_-2%]" style={{ y: skyY }}>
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #0c0a09 0%, #240d07 20%, #5b2008 40%, #b9440e 53%, #f97316 62%, #fdba74 70%)' }} />
        <Picture name="hero-forest-night" eager sizes="100vw" className="absolute inset-0 size-full object-cover opacity-30" position="60% 40%" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgb(12 10 9 / 0.55), transparent 55%)' }} />
      </motion.div>

      {/* matahari tertutup asap */}
      <motion.div className="absolute right-[8%] top-[38%] size-[min(46vw,520px)]" style={{ y: sunY, x: sunX }}>
        <div className="size-full rounded-full" style={{ background: 'radial-gradient(circle, rgb(254 215 170 / 0.95) 0%, rgb(251 146 60 / 0.75) 22%, rgb(194 65 12 / 0.35) 48%, transparent 70%)' }} />
      </motion.div>

      {layers.map((l, i) => (
        <Layer key={l.id} depth={l.depth} progress={progress} mx={mx} my={my}>
          <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
            <path d={l.d} fill={l.fill} />
          </svg>
          {i < 4 && (
            // kabut tipis di kaki tiap punggung bukit memberi kedalaman atmosfer
            <div className="absolute inset-x-0" style={{ bottom: `${[44, 36, 28, 20][i]}%`, height: '14%', background: `linear-gradient(to top, rgb(249 115 22 / ${[0.2, 0.15, 0.1, 0.06][i]}), transparent)` }} />
          )}
        </Layer>
      ))}
    </div>
  )
}
