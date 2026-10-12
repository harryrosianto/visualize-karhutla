import { ArrowRight } from '@phosphor-icons/react'
import { useInView } from 'motion/react'
import { useEffect, useRef } from 'react'
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
        ctx.lineWidth = 0.6; ctx.strokeStyle = '#3a312b'; ctx.fillStyle = '#17120f'
        for (const col of cols) for (const f of col.features) {
          const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates
          ctx.beginPath()
          for (const poly of polys) for (const ring of poly) ring.forEach(([x, y], i) => { const [px, py] = P(x, y); i ? ctx.lineTo(px, py) : ctx.moveTo(px, py) })
          ctx.fill('evenodd'); ctx.stroke()
        }
        const max = Math.max(...kabs.map(k => k.total2026))
        ctx.globalCompositeOperation = 'lighter'
        for (const k of kabs) {
          const [px, py] = P(k.centroid[0], k.centroid[1])
          const r = 5 + Math.sqrt(k.total2026 / max) * Math.min(w, h) * 0.075
          const g = ctx.createRadialGradient(px, py, 0, px, py, r)
          g.addColorStop(0, 'rgba(249,115,22,0.85)'); g.addColorStop(0.4, 'rgba(194,65,12,0.35)'); g.addColorStop(1, 'rgba(154,52,18,0)')
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px, py, r, 0, 6.283); ctx.fill()
        }
        ctx.globalCompositeOperation = 'source-over'
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
          <h2 className="text-4xl font-extrabold leading-[1.02] tracking-tighter text-fg md:text-5xl">Di mana apinya menyala</h2>
          <p className="mt-5 max-w-[34ch] text-base leading-relaxed text-fg-2">Lingkaran membesar di kabupaten dengan titik panas terbanyak.</p>
          <Link to="/peta" className="btn btn-primary mt-8">Buka peta <ArrowRight weight="bold" size={18} aria-hidden /></Link>
          <SourceNote className="mt-6" />
        </div>
        <Link to="/peta" aria-label="Buka peta titik panas Kalimantan" className="relative block aspect-[5/4] md:col-span-8 md:aspect-[16/11]">
          <canvas ref={cv} role="img" aria-label="Peta Kalimantan dengan lingkaran bara di kabupaten berpanas terbanyak" className="size-full" />
        </Link>
      </div>
    </section>
  )
}
