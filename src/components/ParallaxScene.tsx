import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, useMemo, type RefObject } from 'react'
import { H, W, birds, buildForest, lookoutTower, powerLine, ridgeFn, ridgePath, type Flame, type Glow } from '../lib/landscape'
import { Picture } from './Picture'

interface LayerSpec {
  id: string
  fill: string
  /** kedalaman: 0 = jauh (hampir diam), 1 = dekat (bergerak penuh) */
  depth: number
  ground: string
  trees: string
  extra?: string
  wires?: string
  flames: Flame[]
  glows: Glow[]
}

function useLayers(): LayerSpec[] {
  return useMemo(() => {
    const r1 = ridgeFn(11, 520, 70, 5), r2 = ridgeFn(23, 600, 78, 6), r3 = ridgeFn(37, 676, 70, 6), r4 = ridgeFn(53, 756, 56, 6), r5 = ridgeFn(71, 838, 40, 5)
    const f2 = buildForest(5, r2, [
      { kind: 'pine', count: 40, h: [16, 34] }, { kind: 'spruce', count: 30, h: [18, 36] }, { kind: 'broadleaf', count: 8, h: [18, 32] },
      { kind: 'snag', count: 4, h: [12, 20] }, { kind: 'burningPine', count: 2, h: [26, 34] },
    ])
    const f3 = buildForest(7, r3, [
      { kind: 'pine', count: 26, h: [30, 60] }, { kind: 'spruce', count: 24, h: [34, 66] }, { kind: 'broadleaf', count: 6, h: [32, 52] },
      { kind: 'dead', count: 5, h: [40, 70] }, { kind: 'snag', count: 5, h: [20, 38] }, { kind: 'fallen', count: 3, h: [18, 28] }, { kind: 'burningPine', count: 2, h: [50, 66] },
    ])
    const f4 = buildForest(9, r4, [
      { kind: 'pine', count: 16, h: [56, 110] }, { kind: 'spruce', count: 14, h: [64, 120] }, { kind: 'dead', count: 6, h: [80, 130] },
      { kind: 'snag', count: 6, h: [36, 60] }, { kind: 'toppling', count: 3, h: [80, 110] }, { kind: 'fallen', count: 3, h: [30, 44] },
      { kind: 'burningPine', count: 2, h: [90, 120] }, { kind: 'burningDead', count: 3, h: [80, 110] },
    ])
    const f5 = buildForest(13, r5, [
      { kind: 'pine', count: 8, h: [140, 250] }, { kind: 'spruce', count: 5, h: [160, 260] }, { kind: 'dead', count: 3, h: [180, 260] },
      { kind: 'snag', count: 3, h: [70, 110] }, { kind: 'toppling', count: 2, h: [140, 200] }, { kind: 'fallen', count: 2, h: [40, 60] },
      { kind: 'burningDead', count: 2, h: [170, 230] }, { kind: 'burningPine', count: 1, h: [200, 250] },
    ])
    const pl = powerLine(r5, [960, 1200, 1440], 210)
    return [
      { id: 'r1', fill: '#b8501a', depth: 0.12, ground: ridgePath(r1), trees: '', extra: lookoutTower(r1, 880, 1300), flames: [], glows: [] },
      { id: 'r2', fill: '#8f3a14', depth: 0.3, ground: ridgePath(r2), ...f2 },
      { id: 'r3', fill: '#5e2410', depth: 0.5, ground: ridgePath(r3), ...f3 },
      { id: 'r4', fill: '#34140a', depth: 0.72, ground: ridgePath(r4), ...f4 },
      { id: 'r5', fill: '#0c0a09', depth: 1, ground: ridgePath(r5), ...f5, extra: pl.poles, wires: pl.wires },
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
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, #2a0f07 0%, #5a1d0a 22%, #9a3412 40%, #d9500f 54%, #f97316 63%, #fdba74 72%)' }} />
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
            <path d={l.ground} fill={l.fill} />
            <path d={l.trees + (l.extra ?? '')} fill={l.fill} />
            {l.wires && <path d={l.wires} fill="none" stroke={l.fill} strokeWidth={2.2} />}
          </svg>
          {(l.flames.length > 0 || l.glows.length > 0) && (
            // api dan cahaya di svg terpisah agar animasi kedip hanya menggambar ulang bentuk kecil
            <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMax slice" className="absolute inset-0 size-full">
              <defs>
                <radialGradient id={`gl-${l.id}`}><stop offset="0" stopColor="#f97316" stopOpacity="0.5" /><stop offset="1" stopColor="#f97316" stopOpacity="0" /></radialGradient>
                <linearGradient id={`fl-${l.id}`} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#fde68a" /><stop offset="0.55" stopColor="#fb923c" /><stop offset="1" stopColor="#ea580c" /></linearGradient>
              </defs>
              {l.glows.map((g, k) => <circle key={k} cx={g.x} cy={g.y} r={g.r} fill={`url(#gl-${l.id})`} />)}
              {l.flames.map((f, k) => <path key={k} d={f.d} fill={`url(#fl-${l.id})`} className="flame" style={{ animationDelay: `${f.delay}s` }} />)}
            </svg>
          )}
          {i < 4 && (
            // kabut tipis di kaki tiap punggung bukit memberi kedalaman atmosfer
            <div className="absolute inset-x-0" style={{ bottom: `${[44, 36, 28, 20][i]}%`, height: '14%', background: `linear-gradient(to top, rgb(249 115 22 / ${[0.2, 0.15, 0.1, 0.06][i]}), transparent)` }} />
          )}
        </Layer>
      ))}
    </div>
  )
}
