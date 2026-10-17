import { ArrowRight } from '@phosphor-icons/react'
import { useInView } from 'motion/react'
import { useEffect, useMemo, useRef, useState } from 'react'
import fireUrl from '../assets/media/fire.webp'
import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { loadBoundaries, type ProvinceId } from '../lib/data'
import { SourceNote } from './SourceNote'

const PROV: ProvinceId[] = ['kalbar', 'kalteng', 'kalsel', 'kaltim', 'kaltara']
const LON0 = 108.7, LON1 = 119.4, LAT0 = -4.3, LAT1 = 4.5

/** Cuplikan peta ringan (kanvas 2D, tanpa MapLibre) supaya landing tetap cepat. */
export function MapTeaser() {
  const { kabs } = useData()
  const wrap = useRef<HTMLDivElement>(null)
  const cv = useRef<HTMLCanvasElement>(null)
  const near = useInView(wrap, { once: true, margin: '300px 0px' })
  const [box, setBox] = useState({ w: 0, h: 0 })
  useEffect(() => {
    const c = cv.current
    if (!c) return
    const ro = new ResizeObserver(() => setBox({ w: c.clientWidth, h: c.clientHeight }))
    ro.observe(c)
    return () => ro.disconnect()
  }, [])
  // ikon api pada 28 kabupaten dengan titik panas terbanyak, memakai proyeksi yang sama dengan kanvas
  const icons = useMemo(() => {
    if (!box.w || !kabs.length) return []
    const s = Math.min(box.w / (LON1 - LON0), box.h / (LAT1 - LAT0))
    const ox = (box.w - (LON1 - LON0) * s) / 2, oy = (box.h - (LAT1 - LAT0) * s) / 2
    const top = [...kabs].sort((a, b) => b.total2026 - a.total2026).slice(0, 28)
    const max = top[0]?.total2026 || 1
    return top.map(k => ({ slug: k.slug, name: k.name, x: ox + (k.centroid[0] - LON0) * s, y: oy + (LAT1 - k.centroid[1]) * s, size: 22 + 50 * Math.sqrt(k.total2026 / max) }))
  }, [box, kabs])

  useEffect(() => {
    if (!near || !kabs.length || !cv.current) return
    const canvas = cv.current
    let alive = true
    Promise.all(PROV.map(loadBoundaries)).then(cols => {
      if (!alive) return
      const draw = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 2)
        const w = canvas.clientWidth, h = canvas.clientHeight
        canvas.width = w * dpr; canvas.height = h * dpr
        const ctx = canvas.getContext('2d')!
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
        const sx = w / (LON1 - LON0), sy = h / (LAT1 - LAT0), s = Math.min(sx, sy)
        const ox = (w - (LON1 - LON0) * s) / 2, oy = (h - (LAT1 - LAT0) * s) / 2
        const P = (lon: number, lat: number): [number, number] => [ox + (lon - LON0) * s, oy + (LAT1 - lat) * s]
        ctx.clearRect(0, 0, w, h)
        ctx.lineWidth = 0.8; ctx.strokeStyle = '#6b564a'; ctx.fillStyle = '#241b16'
        for (const col of cols) for (const f of col.features) {
          const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
          ctx.beginPath()
          for (const poly of polys) for (const ring of poly) ring.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py) })
          ctx.fill('evenodd'); ctx.stroke()
        }
      }
      draw()
      const ro = new ResizeObserver(draw); ro.observe(canvas)
      ;(canvas as any)._ro = ro
    }).catch(() => {})
    return () => { alive = false; (canvas as any)._ro?.disconnect() }
  }, [near, kabs])

  return (
    <section className="border-y border-line bg-ink-2">
      <div ref={wrap} className="mx-auto grid max-w-[1400px] gap-8 px-4 py-20 md:grid-cols-12 md:px-8 md:py-28">
        <div className="md:col-span-4 md:self-end">
          <h2 className="text-4xl font-extrabold leading-[1.02] tracking-tighter text-fg md:text-5xl">Sebaran titik panas</h2>
          <p className="mt-5 max-w-[34ch] text-base leading-relaxed text-fg-2">Ukuran ikon api menunjukkan jumlah titik panas pada tiap kabupaten/kota.</p>
          <Link to="/peta" className="btn btn-primary mt-8">Lihat peta <ArrowRight weight="bold" size={18} aria-hidden /></Link>
          <SourceNote className="mt-6" />
        </div>
        <Link to="/peta" aria-label="Lihat peta titik panas" className="relative block aspect-[5/4] md:col-span-8 md:aspect-[16/11]">
          <canvas ref={cv} role="img" aria-label="Peta dengan ikon api di kabupaten berpanas terbanyak" className="size-full" />
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {icons.map(i => (
              <img key={i.slug} src={fireUrl} alt="" width={i.size} height={i.size} draggable={false} loading="lazy"
                className="absolute max-w-none" style={{ left: i.x - i.size / 2, top: i.y - i.size, width: i.size, height: i.size, filter: 'drop-shadow(0 0 8px rgb(249 115 22 / 0.5))' }} />
            ))}
          </div>
        </Link>
      </div>
    </section>
  )
}
