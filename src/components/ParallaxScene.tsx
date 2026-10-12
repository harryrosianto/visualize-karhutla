import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, type MotionValue } from 'motion/react'
import { useEffect, type RefObject } from 'react'

// Lapisan hasil `npm run scene` (scripts/build-scene.ts): lanskap buatan pemilik proyek + siluet pohon yang ditanam di punggung bukit.
const urls = import.meta.glob('../assets/scene/*.{webp,avif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const u = (name: string, ext: 'webp' | 'avif' = 'webp') => urls[`../assets/scene/${name}.${ext}`]
const SIZES = '(max-width: 767px) 2200px, calc(100dvh * 3.4)'

/** kedalaman: 0 = jauh (hampir diam), 1 = dekat (mengikuti halaman) */
const LAYERS = [
  { id: 'l1', depth: 0.1 },
  { id: 'l2', depth: 0.28 },
  { id: 'l3', depth: 0.5 },
  { id: 'l4', depth: 0.72 },
  { id: 'l5', depth: 1 },
]

function Layer({ depth, progress, mx, my, children }: {
  depth: number; progress: MotionValue<number>; mx: MotionValue<number>; my: MotionValue<number>; children: React.ReactNode
}) {
  // scroll: lapisan jauh tertinggal (turun pelan), lapisan dekat mengikuti halaman. pointer: geser horizontal kecil.
  const y = useTransform([progress, my] as MotionValue<number>[], ([p, m]: number[]) => p * (1 - depth) * 380 + m * depth * 14)
  const x = useTransform(mx, v => v * depth * 46)
  return (
    <motion.div aria-hidden className="absolute inset-x-[-4%] inset-y-0" style={{ x, y }}>
      {children}
    </motion.div>
  )
}

/** Adegan lanskap berlapis dengan parallax scroll dan pointer. Statis saat prefers-reduced-motion. */
export function ParallaxScene({ target }: { target: RefObject<HTMLElement | null> }) {
  const reduce = useReducedMotion()
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

  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-ink">
      {/* langit senja berasap: gelap di atas, jingga terang di garis punggung bukit */}
      <motion.div className="absolute inset-[-6%_-2%_-2%_-2%]" style={{ y: skyY, background: 'linear-gradient(to bottom, #2a0f07 0%, #5a1d0a 18%, #a23a0e 34%, #e8590f 46%, #f97316 54%, #fdba74 64%)' }} />

      {/* kawanan burung terbang: dua kelompok berbeda ukuran dan kecepatan */}
      <Layer depth={0.06} progress={progress} mx={mx} my={my}>
        <img src={u('birds')} alt="" width={520} height={292} draggable={false} className="bird-flock absolute left-[14%] top-[17%] w-[min(34vw,360px)]" />
        <img src={u('birds')} alt="" width={520} height={292} draggable={false} className="bird-flock bird-flock-2 absolute right-[16%] top-[27%] w-[min(20vw,220px)] -scale-x-100" />
      </Layer>

      {LAYERS.map((l, i) => (
        <Layer key={l.id} depth={l.depth} progress={progress} mx={mx} my={my}>
          <picture>
            <source type="image/avif" srcSet={`${u(`${l.id}-2200`, 'avif')} 2200w, ${u(`${l.id}-3000`, 'avif')} 3000w`} sizes={SIZES} />
            <img
              src={u(`${l.id}-3000`)}
              srcSet={`${u(`${l.id}-2200`)} 2200w, ${u(`${l.id}-3000`)} 3000w`}
              sizes={SIZES}
              alt="" width={3000} height={890} draggable={false}
              loading="eager" decoding="async" fetchPriority={i === 0 ? 'high' : 'auto'}
              className="size-full object-cover object-[55%_100%] md:object-bottom"
            />
          </picture>
        </Layer>
      ))}
    </div>
  )
}
