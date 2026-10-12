import { motion, useReducedMotion } from 'motion/react'
import { ArrowRight } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Picture } from './Picture'
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
  const rise = (d: number) => ({
    initial: reduce ? false : { opacity: 0, y: 28 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.9, delay: d, ease },
  })
  return (
    <section className="relative isolate flex min-h-[100dvh] items-end overflow-hidden">
      <div className="absolute inset-0 -z-20 bg-ink">
        <Picture name="hero-forest-night" eager sizes="100vw" className="size-full object-cover" position="60% 50%" />
        {video && (
          <video
            className="absolute inset-0 size-full object-cover"
            autoPlay muted loop playsInline
            poster={`${base}media/hero-poster.jpg`}
            aria-hidden
          >
            <source src={`${base}media/hero.mp4`} type="video/mp4" />
          </video>
        )}
      </div>
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/70 to-ink/35" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-r from-ink/80 via-ink/20 to-transparent" />
      <EmberCanvas className="-z-10 mix-blend-screen" />

      <div className="mx-auto w-full max-w-[1400px] px-4 pb-14 pt-28 md:px-8 md:pb-20">
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
      </div>
    </section>
  )
}
