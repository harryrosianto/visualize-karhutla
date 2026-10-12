import { Pause, Play, ShareNetwork, X } from '@phosphor-icons/react'
import { AnimatePresence, animate, motion, useMotionValue, useReducedMotion } from 'motion/react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

export interface StorySlide { id: string; title: string; node: ReactNode }

interface Props {
  slides: StorySlide[]
  duration?: number // ms per slide
  isSample: boolean
  onExit: () => void
  /** Elemen interaktif pada slide terakhir (tombol bagikan), ditaruh di atas lapisan ketuk. */
  overlayLast?: ReactNode
  onIndex?: (i: number) => void
  /** bagikan layar yang sedang tampil sebagai gambar */
  onShareSlide?: (i: number) => void
  sharing?: boolean
}

const HOLD_MS = 220

/** Story player gaya Instagram: progress, auto-advance, ketuk kiri/kanan, tahan untuk jeda, geser, panah keyboard. */
export function StoryPlayer({ slides, duration = 5000, isSample, onExit, overlayLast, onIndex, onShareSlide, sharing }: Props) {
  const reduce = useReducedMotion()
  const [idx, setIdx] = useState(0)
  const [manualPause, setManualPause] = useState(false)
  const [holdPause, setHoldPause] = useState(false)
  const [hidden, setHidden] = useState(typeof document !== 'undefined' && document.hidden)
  const progress = useMotionValue(0)
  const last = slides.length - 1
  const paused = manualPause || holdPause || hidden

  const go = useCallback((n: number) => setIdx(i => Math.max(0, Math.min(last, typeof n === 'number' ? n : i))), [last])
  const next = useCallback(() => setIdx(i => Math.min(last, i + 1)), [last])
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])

  useEffect(() => { progress.set(idx === last ? 1 : 0); onIndex?.(idx) }, [idx, last, progress, onIndex])

  useEffect(() => {
    if (paused || idx === last) return
    const c = animate(progress, 1, {
      duration: ((1 - progress.get()) * duration) / 1000, ease: 'linear',
      onComplete: () => setIdx(i => Math.min(last, i + 1)),
    })
    return () => c.stop()
  }, [idx, paused, duration, last, progress])

  useEffect(() => {
    const v = () => setHidden(document.hidden)
    document.addEventListener('visibilitychange', v)
    return () => document.removeEventListener('visibilitychange', v)
  }, [])

  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') { e.preventDefault(); next() }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); prev() }
      else if (e.key === 'Escape') onExit()
      else if (e.key === ' ' && !(e.target instanceof HTMLButtonElement || e.target instanceof HTMLAnchorElement)) { e.preventDefault(); setManualPause(p => !p) }
    }
    window.addEventListener('keydown', k)
    return () => window.removeEventListener('keydown', k)
  }, [next, prev, onExit])

  /* gestur pada lapisan ketuk */
  const g = useRef({ x: 0, y: 0, held: false, timer: 0 as number | undefined, active: false })
  const down = (e: React.PointerEvent) => {
    const s = g.current
    s.x = e.clientX; s.y = e.clientY; s.held = false; s.active = true
    window.clearTimeout(s.timer)
    s.timer = window.setTimeout(() => { s.held = true; setHoldPause(true) }, HOLD_MS)
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const up = (e: React.PointerEvent) => {
    const s = g.current
    if (!s.active) return
    s.active = false
    window.clearTimeout(s.timer)
    const dx = e.clientX - s.x, dy = e.clientY - s.y
    if (s.held) { setHoldPause(false); if (Math.abs(dx) < 60 && dy < 90) return }
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) { dx < 0 ? next() : prev(); return }
    if (dy > 100 && Math.abs(dy) > Math.abs(dx)) { onExit(); return }
    if (s.held) return
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
    ;(e.clientX - r.left) / r.width < 0.32 ? prev() : next()
  }
  const cancel = () => { const s = g.current; s.active = false; window.clearTimeout(s.timer); if (s.held) setHoldPause(false) }

  const slide = slides[idx]
  return (
    <div className="fixed inset-0 z-40 grid place-items-center overflow-hidden bg-ink" role="region" aria-roledescription="carousel" aria-label="Karhutla Wrapped">
      <div aria-hidden className="glow-ember absolute inset-0 opacity-60" />
      <div className="relative h-dvh overflow-hidden bg-ink [container-type:inline-size]" style={{ width: 'min(100vw, calc(100dvh * 9 / 16))' }}>
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div key={slide.id} className="absolute inset-0"
            initial={reduce ? false : { opacity: 0, scale: 1.03 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.985 }}
            transition={{ duration: reduce ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}>
            {slide.node}
          </motion.div>
        </AnimatePresence>

        {/* lapisan ketuk: di bawah header dan tombol */}
        <div className="absolute inset-0 touch-none select-none" onPointerDown={down} onPointerUp={up} onPointerCancel={cancel} aria-hidden />

        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 px-[3cqw] pt-[3cqw]">
          <div className="flex gap-[1.2cqw]" aria-hidden>
            {slides.map((s, i) => (
              <div key={s.id} className="h-[0.9cqw] min-h-[3px] flex-1 overflow-hidden rounded-full bg-fg/25">
                <motion.div className="size-full origin-left rounded-full bg-fg" style={i === idx ? { scaleX: progress } : { scaleX: i < idx ? 1 : 0 }} />
              </div>
            ))}
          </div>
          {isSample && <div className="-mx-[3cqw] mt-[2.4cqw] bg-ember py-[1.2cqw] text-center text-[3cqw] font-bold tracking-wide text-ink">DATA CONTOH</div>}
          <div className="mt-[2cqw] flex items-center justify-between">
            <p translate="no" className="text-[4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span></p>
            <div className="pointer-events-auto flex items-center">
              <button type="button" onClick={() => setManualPause(p => !p)} aria-label={manualPause ? 'Lanjutkan ringkasan' : 'Jeda ringkasan'} className="grid size-11 place-items-center rounded-full text-fg hover:bg-fg/10">
                {manualPause ? <Play size={22} weight="fill" aria-hidden /> : <Pause size={22} weight="fill" aria-hidden />}
              </button>
              {onShareSlide && (
                <button type="button" onClick={() => { setManualPause(true); onShareSlide(idx) }} disabled={sharing} aria-busy={sharing}
                  aria-label="Bagikan layar ini sebagai gambar" className="grid size-11 place-items-center rounded-full text-fg hover:bg-fg/10 disabled:opacity-50">
                  <ShareNetwork size={22} weight="bold" aria-hidden />
                </button>
              )}
              <button type="button" onClick={onExit} aria-label="Tutup ringkasan" className="grid size-11 place-items-center rounded-full text-fg hover:bg-fg/10">
                <X size={22} weight="bold" aria-hidden />
              </button>
            </div>
          </div>
        </div>

        {idx === last && overlayLast && <div className="absolute inset-x-0 bottom-0 z-10 px-[6cqw] pb-[4cqw]">{overlayLast}</div>}

        <p className="sr-only" aria-live="polite">Layar {idx + 1} dari {slides.length}: {slide.title}</p>
        <div className="sr-only">
          <button type="button" onClick={prev} disabled={idx === 0}>Layar sebelumnya</button>
          <button type="button" onClick={next} disabled={idx === last}>Layar berikutnya</button>
        </div>
      </div>
    </div>
  )
}
