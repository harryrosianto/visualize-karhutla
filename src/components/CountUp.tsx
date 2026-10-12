import { animate, useInView } from 'motion/react'
import { useStaticMotion } from './ExportContext'
import { useEffect, useRef } from 'react'
import { fmt } from '../lib/data'

interface Props { value: number; duration?: number; start?: boolean; format?: (n: number) => string; className?: string }

/** Angka naik dari 0. Menulis langsung ke DOM (bukan state) agar tidak re-render per frame. */
export function CountUp({ value, duration = 1.6, start, format = fmt, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.4 })
  const reduce = useStaticMotion()
  const go = start ?? inView
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (reduce || !go) { el.textContent = format(go || reduce ? value : 0); return }
    const c = animate(0, value, { duration, ease: [0.16, 1, 0.3, 1], onUpdate: v => { el.textContent = format(v) } })
    return () => c.stop()
  }, [go, value, reduce, duration, format])
  return <span ref={ref} className={className + ' num'}>{format(reduce ? value : 0)}</span>
}
