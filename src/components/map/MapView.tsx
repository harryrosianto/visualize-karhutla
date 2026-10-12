import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, Map as MLMap } from 'maplibre-gl'
import workerUrl from '../../lib/mlWorker?worker&url'
import { HexagonLayer, MapLibreOverlay, ScatterplotLayer } from 'deck.gl'
import { DataFilterExtension } from '@deck.gl/extensions'
import { useEffect, useMemo, useRef, useState } from 'react'
import { pickKabupaten } from '../../lib/geo'
import type { ProvinceId } from '../../lib/data'
import type { Bounds, MapMode } from './mapTypes'
import { PROVS, type Merged } from './useMapData'

maplibregl.setWorkerUrl(workerUrl)
const STYLE = 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
const ext = new DataFilterExtension({ filterSize: 2 })
const HEX_COLORS: [number, number, number][] = [[67, 20, 7], [124, 45, 18], [194, 65, 12], [249, 115, 22], [251, 146, 60], [239, 68, 68]]
const EMPTY = { type: 'FeatureCollection', features: [] } as const

interface Props {
  merged: Merged | null
  mode: MapMode
  day: number
  filter: 'all' | ProvinceId
  selectedSlug: string | null
  onSelect: (slug: string) => void
  fitBounds: Bounds
  fitKey: number
  flyTo: { lon: number; lat: number; key: number } | null
  reduceMotion: boolean
}

export default function MapView({ merged, mode, day, filter, selectedSlug, onSelect, fitBounds, fitKey, flyTo, reduceMotion }: Props) {
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const overlay = useRef<MapLibreOverlay | null>(null)
  const [ready, setReady] = useState(false)
  const onSelectRef = useRef(onSelect)
  onSelectRef.current = onSelect

  const features = useMemo(() => {
    if (!merged) return []
    return filter === 'all' ? merged.boundaries.features : merged.boundaries.features.filter(f => f.properties.provinceId === filter)
  }, [merged, filter])
  const featuresRef = useRef(features)
  featuresRef.current = features

  useEffect(() => {
    if (!el.current) return
    const small = window.innerWidth < 768
    const m = new maplibregl.Map({
      container: el.current, style: STYLE, center: [113.9, 0.1], zoom: small ? 4.1 : 5.1, minZoom: 3.5, maxZoom: 11,
      attributionControl: { compact: true }, dragRotate: true, pitchWithRotate: true,
    })
    if (!small) m.addControl(new maplibregl.NavigationControl({ showCompass: true }), 'bottom-right')
    const o = new MapLibreOverlay({ interleaved: false, layers: [] })
    m.addControl(o as any)
    // klik/ketuk peta: cari kabupaten lewat point-in-polygon, tanpa picking poligon terisi
    m.on('click', e => {
      const slug = pickKabupaten(e.lngLat.lng, e.lngLat.lat, featuresRef.current as any)
      if (slug) onSelectRef.current(slug)
    })
    // garis batas kabupaten sebagai layer garis native MapLibre (diproses di worker, bukan main thread)
    m.on('load', () => {
      m.addSource('kab', { type: 'geojson', data: EMPTY as any })
      m.addLayer({ id: 'kab-line', type: 'line', source: 'kab', paint: { 'line-color': '#A8A29E', 'line-opacity': 0.3, 'line-width': 0.7 } })
      m.addLayer({ id: 'kab-sel', type: 'line', source: 'kab', filter: ['==', ['get', 'slug'], ''], paint: { 'line-color': '#F97316', 'line-width': 2.6 } })
      setReady(true)
    })
    map.current = m; overlay.current = o
    return () => { m.remove(); map.current = null; overlay.current = null; setReady(false) }
  }, [])

  useEffect(() => {
    if (!ready || !map.current) return
    ;(map.current.getSource('kab') as GeoJSONSource).setData({ type: 'FeatureCollection', features } as any)
  }, [ready, features])

  useEffect(() => {
    if (!ready || !map.current) return
    map.current.setFilter('kab-sel', ['==', ['get', 'slug'], selectedSlug ?? ''])
  }, [ready, selectedSlug])

  // sesuaikan pandangan saat filter provinsi berubah
  useEffect(() => {
    const m = map.current
    if (!m) return
    const pad = window.innerWidth < 768 ? { top: 150, bottom: 190, left: 20, right: 20 } : { top: 110, bottom: 150, left: 40, right: 420 }
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

  const fRange = useMemo<[number, number]>(() => {
    if (filter === 'all') return [0, PROVS.length - 1]
    const i = PROVS.indexOf(filter)
    return [i, i]
  }, [filter])

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

  return <div ref={el} className="absolute inset-0 bg-ink" aria-label="Peta interaktif titik panas Kalimantan" role="application" />
}
