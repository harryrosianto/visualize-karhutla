import { motion, useReducedMotion, useScroll, useTransform } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Picture } from './Picture'
import { ParallaxScene } from './ParallaxScene'
import { EmberCanvas } from './EmberCanvas'

const base = import.meta.env.BASE_URL
const ease = [0.16, 1, 0.3, 1] as const

/** Slot video: taruh public/media/hero.mp4. Selama belum ada, pakai gambar dengan overlay gelap. */
function useHeroVideo() {
  const [ok, setOk] = useState(false)
  const reduce = useReducedMotion()
  useEffect(() => {
    if (reduce) return
    const conn = (navigator as any).connection
    if (conn?.saveData) return
    let alive = true
    fetch(`${base}media/hero.mp4`, { method: 'HEAD' })
      .then(r => alive && setOk(r.ok && (r.headers.get('content-type') ?? '').startsWith('video')))
      .catch(() => {})
    return () => { alive = false }
  }, [reduce])
  return ok
}

export function Hero() {
  const reduce = useReducedMotion()
  const video = useHeroVideo()
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const textY = useTransform(scrollYProgress, [0, 1], reduce ? [0, 0] : [0, 140])
  const textOpacity = useTransform(scrollYProgress, [0, 0.7], reduce ? [1, 1] : [1, 0])
  const rise = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: d, ease },
  })
  return (
    <section ref={ref} className="relative isolate flex min-h-[100dvh] items-center overflow-hidden">
      {video ? (
        <div className="absolute inset-0 -z-20 bg-ink">
          <Picture name="hero-forest-night" eager sizes="100vw" className="size-full object-cover" position="60% 50%" />
          <video className="absolute inset-0 size-full object-cover" autoPlay muted loop playsInline poster={`${base}media/hero-poster.jpg`} aria-hidden>
            <source src={`${base}media/hero.mp4`} type="video/mp4" />
          </video>
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink via-ink/70 to-ink/35" />
        </div>
      ) : (
        <div className="absolute inset-0 -z-20"><ParallaxScene target={ref} /></div>
      )}
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/35 to-transparent" />
      <EmberCanvas className="-z-10" />

      <motion.div style={{ y: textY, opacity: textOpacity }} className="mx-auto w-full max-w-[1400px] px-4 pb-24 pt-28 md:px-8">
        <motion.h1 {...rise(0.1)} className="text-[clamp(3.5rem,13.5vw,10rem)] font-extrabold leading-[0.88] tracking-tighter text-fg">
          Visualize<br />Karhutla<span className="text-ember">.</span>
        </motion.h1>
        <motion.p {...rise(0.25)} className="mt-4 pb-1 font-serif text-3xl italic leading-[1.1] text-ember md:text-5xl">
          Setahun di balik asap Kalimantan.
        </motion.p>
        <motion.p {...rise(0.4)} className="mt-6 max-w-[46ch] text-base leading-relaxed text-fg-2 md:text-lg">
          Titik panas, bulan terparah, dan peringkat kabupatenmu dari data satelit yang bisa kamu bagikan.
        </motion.p>
        <motion.div {...rise(0.55)} className="mt-8 flex flex-wrap gap-3">
          <a href="#cek" className="btn btn-primary">Cek wilayahmu <ArrowRight weight="bold" size={18} aria-hidden /></a>
          <Link to="/peta" className="btn btn-ghost">Buka peta</Link>
        </motion.div>
      </motion.div>
    </section>
  )
}
