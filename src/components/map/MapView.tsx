import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import { HexagonLayer, MapLibreOverlay, ScatterplotLayer } from 'deck.gl'
import { DataFilterExtension } from '@deck.gl/extensions'
import { useEffect, useMemo, useRef, useState } from 'react'
import { pickKabupaten } from '../../lib/geo'
import type { ProvinceId } from '../../lib/data'
import type { Bounds, MapMode } from './mapTypes'
import type { Merged } from './useMapData'

// worker disalin dari node_modules oleh scripts/copy-maplibre-worker.mjs (lihat catatan di skrip itu)
maplibregl.setWorkerUrl(`${import.meta.env.BASE_URL}vendor/maplibre-gl-worker.mjs`)
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const ext = new DataFilterExtension({ filterSize: 2 })
const HEX_COLORS: [number, number, number][] = [[67, 20, 7], [124, 45, 18], [194, 65, 12], [249, 115, 22], [251, 146, 60], [239, 68, 68]]
const EMPTY = { type: 'FeatureCollection', features: [] } as const
const LABEL_FONT = ['Montserrat Medium', 'Open Sans Bold', 'Noto Sans Regular']
const nf = new Intl.NumberFormat('id-ID')

interface Props {
  merged: Merged | null
  mode: MapMode
  day: number
  /** provinsi terpilih (null: semua) dan rentang indeksnya untuk filter GPU */
  provIds: ProvinceId[] | null
  fRange: [number, number]
  selectedSlug: string | null
  onSelect: (slug: string) => void
  fitBounds: Bounds
  fitKey: number
  flyTo: { lon: number; lat: number; key: number } | null
  reduceMotion: boolean
}

export default function MapView({ merged, mode, day, provIds, fRange, selectedSlug, onSelect, fitBounds, fitKey, flyTo, reduceMotion }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const overlay = useRef<MapLibreOverlay | null>(null)
  const [ready, setReady] = useState(false)
  const tip = useRef<HTMLDivElement>(null)
  const hover = useRef<string | null>(null)
  const dayRef = useRef(day)
  dayRef.current = day
  const mergedRef = useRef(merged)
  mergedRef.current = merged
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const features = useMemo(() => {
    if (!merged) return []
    return provIds ? merged.boundaries.features.filter(f => provIds.includes(f.properties.provinceId)) : merged.boundaries.features
  }, [merged, provIds])
  const featuresRef = useRef(features)
  featuresRef.current = features

  useEffect(() => {
    if (!el.current) return
    const small = window.innerWidth < 768
    const m = new maplibregl.Map({
      container: el.current, style: STYLE, center: [118, -1.5], zoom: small ? 3 : 4, minZoom: 2.8, maxZoom: 11,
      attributionControl: { compact: true }, dragRotate: true, pitchWithRotate: true,
    })
    m.on('error', e => console.error('[peta]', e.error?.message ?? e))
    if (!small) m.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')
    const o = new MapLibreOverlay({ interleaved: false, layers: [] })
    m.addControl(o as any)
    // klik/ketuk peta: cari kabupaten lewat point-in-polygon, tanpa picking poligon terisi
    m.on('click', e => {
      const slug = pickKabupaten(e.lngLat.lng, e.lngLat.lat, featuresRef.current as any)
      if (slug) onSelectRef.current(slug)
    })
    // sorotan dan tooltip saat kursor berada di atas kabupaten/kota (hanya perangkat dengan kursor)
    let lastMove = 0
    const showTip = (slug: string | null, x: number, y: number) => {
      const el = tip.current
      if (!el) return
      if (slug !== hover.current) {
        hover.current = slug
        if (m.getLayer('kab-hover')) m.setFilter('kab-hover', ['==', ['get', 'slug'], slug ?? ''])
        m.getCanvas().style.cursor = slug ? 'pointer' : ''
        const f = slug ? featuresRef.current.find((q: any) => q.properties.slug === slug) as any : null
        const cum = slug ? mergedRef.current?.kabCum[slug] : undefined
        if (f) {
          const n = cum ? cum[Math.min(dayRef.current, cum.length - 1)] : 0
          el.innerHTML = '<strong></strong><span></span><span></span>'
          const [a, b, c] = Array.from(el.children) as HTMLElement[]
          a.textContent = f.properties.name
          b.textContent = f.properties.provinceName ?? ''
          c.textContent = nf.format(n) + ' titik panas sejak 1 Januari'
        }
      }
      el.style.opacity = slug ? '1' : '0'
      if (slug) el.style.transform = `translate(${Math.min(x + 16, m.getContainer().clientWidth - 240)}px, ${y + 16}px)`
    }
    m.on('mousemove', e => {
      const t = performance.now()
      if (t - lastMove < 40) return
      lastMove = t
      showTip(pickKabupaten(e.lngLat.lng, e.lngLat.lat, featuresRef.current as any), e.point.x, e.point.y)
    })
    m.on('mouseout', () => showTip(null, 0, 0))
    // garis batas kabupaten sebagai layer garis native MapLibre (diproses di worker, bukan main thread)
    m.on('load', () => {
      m.addSource('kab', { type: 'geojson', data: EMPTY as any })
      m.addLayer({ id: 'kab-line', type: 'line', source: 'kab', paint: { 'line-color': '#A8A29E', 'line-opacity': 0.3, 'line-width': 0.7 } })
      m.addLayer({ id: 'kab-hover', type: 'line', source: 'kab', filter: ['==', ['get', 'slug'], ''], paint: { 'line-color': '#F5F5F4', 'line-width': 1.6, 'line-opacity': 0.85 } })
      m.addLayer({ id: 'kab-sel', type: 'line', source: 'kab', filter: ['==', ['get', 'slug'], ''], paint: { 'line-color': '#F97316', 'line-width': 2.6 } })
      // nama provinsi (zoom jauh) dan kabupaten/kota (zoom dekat); label provinsi bawaan peta dasar berbahasa Inggris sehingga disembunyikan
      if (m.getLayer('place_state')) m.setLayoutProperty('place_state', 'visibility', 'none')
      m.addSource('lbl-prov', { type: 'geojson', data: EMPTY as any })
      m.addSource('lbl-kab', { type: 'geojson', data: EMPTY as any })
      m.addLayer({ id: 'lbl-prov', type: 'symbol', source: 'lbl-prov', maxzoom: 6.6, layout: { 'text-field': ['get', 'name'], 'text-font': LABEL_FONT, 'text-size': 13, 'text-transform': 'uppercase', 'text-letter-spacing': 0.12, 'text-max-width': 8 }, paint: { 'text-color': '#F5F5F4', 'text-opacity': 0.8, 'text-halo-color': '#0C0A09', 'text-halo-width': 1.6 } })
      m.addLayer({ id: 'lbl-kab', type: 'symbol', source: 'lbl-kab', minzoom: 6.2, layout: { 'text-field': ['get', 'name'], 'text-font': LABEL_FONT, 'text-size': ['interpolate', ['linear'], ['zoom'], 6.2, 10, 9, 13], 'text-max-width': 7, 'text-allow-overlap': false }, paint: { 'text-color': '#F5F5F4', 'text-opacity': 0.92, 'text-halo-color': '#0C0A09', 'text-halo-width': 1.6 } })
      setReady(true)
    })
    map.current = m; overlay.current = o
    return () => { m.remove(); map.current = null; overlay.current = null; setReady(false) }
  }, [])

  useEffect(() => {
    if (!ready || !map.current) return
    ;(map.current.getSource('kab') as GeoJSONSource).setData({ type: 'FeatureCollection', features } as any)
    const pt = (name: string, c: number[]) => ({ type: 'Feature', properties: { name }, geometry: { type: 'Point', coordinates: c } })
    ;(map.current.getSource('lbl-kab') as GeoJSONSource).setData({ type: 'FeatureCollection', features: features.map((f: any) => pt(f.properties.name, f.properties.centroid)) } as any)
    const byProv = new Map<string, { name: string; x: number; y: number; n: number }>()
    for (const f of features as any[]) {
      const p = byProv.get(f.properties.provinceId) ?? { name: f.properties.provinceName ?? '', x: 0, y: 0, n: 0 }
      p.x += f.properties.centroid[0]; p.y += f.properties.centroid[1]; p.n++
      byProv.set(f.properties.provinceId, p)
    }
    ;(map.current.getSource('lbl-prov') as GeoJSONSource).setData({ type: 'FeatureCollection', features: [...byProv.values()].map(p => pt(p.name, [p.x / p.n, p.y / p.n])) } as any)
  }, [ready, features])

  useEffect(() => {
    if (!ready || !map.current) return
    map.current.setFilter('kab-sel', ['==', ['get', 'slug'], selectedSlug ?? ''])
  }, [ready, selectedSlug])

  // sesuaikan pandangan saat filter provinsi berubah
  useEffect(() => {
    const m = map.current
    if (!m) return
    const pad = window.innerWidth < 768 ? { top: 200, bottom: 190, left: 20, right: 20 } : { top: 110, bottom: 150, left: 40, right: 420 }
    m.fitBounds([[fitBounds[0], fitBounds[1]], [fitBounds[2], fitBounds[3]]], { padding: pad, duration: reduceMotion ? 0 : 900 })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey])

  useEffect(() => {
    if (!flyTo || !map.current) return
    map.current.flyTo({ center: [flyTo.lon, flyTo.lat], zoom: Math.max(map.current.getZoom(), 7.2), duration: reduceMotion ? 0 : 1100, essential: false })
  }, [flyTo, reduceMotion])

  useEffect(() => {
    map.current?.easeTo({ pitch: mode === 'hex' ? 55 : 0, bearing: mode === 'hex' ? -18 : 0, duration: reduceMotion ? 0 : 900 })
  }, [mode, reduceMotion])

  const hexData = useMemo(() => {
    if (!merged || mode !== 'hex') return []
    const out: [number, number][] = []
    for (let i = 0; i < merged.n; i++) {
      const f1 = merged.filter[i * 2], pv = merged.filter[i * 2 + 1]
      if (f1 <= day && pv >= fRange[0] && pv <= fRange[1]) out.push([merged.position[i * 2], merged.position[i * 2 + 1]])
    }
    return out
  }, [merged, mode, day, fRange])


  useEffect(() => {
    const o = overlay.current
    if (!o) return
    const layers: any[] = []
    if (merged) {
      if (mode === 'titik') {
        const data = { length: merged.n, attributes: {
          getPosition: { value: merged.position, size: 2 },
          getFilterValue: { value: merged.filter, size: 2 },
          getFillColor: { value: merged.color, size: 4, normalized: true },
        } } as any
        const blend = { blend: true, blendColorSrcFactor: 'src-alpha', blendColorDstFactor: 'one', blendAlphaSrcFactor: 'one', blendAlphaDstFactor: 'one' } as any
        // titik lama memudar (rentang lunak 21 hari); titik 5 hari terakhir menyala dengan halo
        layers.push(new ScatterplotLayer({
          id: 'trail', data, radiusUnits: 'meters', getRadius: 1600, radiusMinPixels: 1.1, radiusMaxPixels: 6, opacity: 0.5, parameters: blend,
          extensions: [ext],
          filterRange: [[0, day], fRange] as any, filterSoftRange: [[day - 21, day], fRange] as any, filterTransformSize: true,
        } as any))
        layers.push(new ScatterplotLayer({
          id: 'glow', data, radiusUnits: 'meters', getRadius: 8000, radiusMinPixels: 5, radiusMaxPixels: 26, opacity: 0.16, parameters: blend,
          extensions: [ext], filterRange: [[day - 4, day], fRange] as any,
        } as any))
        layers.push(new ScatterplotLayer({
          id: 'core', data, radiusUnits: 'meters', getRadius: 2600, radiusMinPixels: 2, radiusMaxPixels: 9, opacity: 1,
          extensions: [ext], filterRange: [[day - 4, day], fRange] as any,
        } as any))
      } else {
        layers.push(new HexagonLayer<[number, number]>({
          id: 'hex', data: hexData, getPosition: d => d, radius: 7000, extruded: true, coverage: 0.88,
          elevationScale: 80, elevationRange: [0, 3000], upperPercentile: 99.5, colorRange: HEX_COLORS,
          material: { ambient: 0.5, diffuse: 0.6, shininess: 20, specularColor: [249, 115, 22] }, pickable: false,
          transitions: reduceMotion ? undefined : { elevationScale: 300 },
        }))
      }
    }
    o.setProps({ layers })
  }, [merged, mode, day, fRange, hexData, reduceMotion])

  return (
    <div className="absolute inset-0 bg-ink">
      <div ref={el} className="absolute inset-0" aria-label="Peta interaktif titik panas" role="application" />
      <div ref={tip} aria-hidden className="map-tip pointer-events-none absolute left-0 top-0 z-10 grid w-56 gap-0.5 rounded-xl border border-line bg-ink-2/95 px-3 py-2 text-xs text-fg-2 opacity-0 transition-opacity" />
    </div>
  )
}
