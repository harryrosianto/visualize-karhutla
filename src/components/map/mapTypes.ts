import type { Meta, ProvinceId } from '../../lib/data'

export type MapMode = 'titik' | 'hex'
export type Bounds = [number, number, number, number]
/** 'all', id wilayah (kalimantan, sumatra, papua, jawa, balinusa, sulawesi, maluku), atau id provinsi */
export type Filter = string

export interface Resolved {
  /** provinsi terpilih; null berarti semua */
  ids: ProvinceId[] | null
  /** rentang indeks provinsi pada meta.provinces (urutannya dikelompokkan per pulau, jadi berurutan) */
  range: [number, number]
  /** kerangka kamera (barat, selatan, timur, utara) */
  bounds: Bounds
  island: string | null
}

const FALLBACK: Bounds = [94.5, -9.5, 141.2, 6.2]

/** Menerjemahkan filter peta menjadi daftar provinsi, rentang indeks, dan kerangka kamera. */
export function resolveFilter(filter: Filter, meta: Meta | null): Resolved {
  const provs = meta?.provinces ?? []
  const all: Resolved = { ids: null, range: [0, Math.max(0, provs.length - 1)], bounds: unionBounds(provs.map(p => p.bounds)) ?? FALLBACK, island: null }
  if (filter === 'all' || !provs.length) return all
  const chosen = provs.filter(p => p.id === filter || p.island === filter)
  if (!chosen.length) return all
  const idx = chosen.map(p => provs.indexOf(p))
  return {
    ids: chosen.map(p => p.id), range: [Math.min(...idx), Math.max(...idx)],
    bounds: unionBounds(chosen.map(p => p.bounds)) ?? FALLBACK, island: chosen[0].island,
  }
}

function unionBounds(bs: Bounds[]): Bounds | null {
  if (!bs.length) return null
  return [Math.min(...bs.map(b => b[0])), Math.min(...bs.map(b => b[1])), Math.max(...bs.map(b => b[2])), Math.max(...bs.map(b => b[3]))]
}

const SATUPETA = 'https://kspservices.big.go.id/satupeta/rest/services/PUBLIK'

/** Lapisan tambahan dari layanan peta publik Kebijakan Satu Peta (BIG): gambar dari server mereka, dimuat hanya setelah dinyalakan. Tanpa nama pemegang izin. */
export interface OverlayDef {
  id: string; label: string; desc: string; swatch: string; opacity: number; hueRotate?: number
  /** keterangan sumber dan batasan yang tampil bersama lapisan ini */
  source: string
  /** URL tile tetap (lapisan statis) */
  url?: string
  /** lapisan citra harian NASA GIBS: URL dibentuk dari tanggal pada slider */
  daily?: { layer: string; matrix: string; ext: 'jpg' | 'png' }
}

const BIG_SOURCE = 'Layanan peta publik Kebijakan Satu Peta (BIG), data per Agustus 2024, sehingga bisa berbeda dari kondisi terkini. Dimuat dari server pemerintah dan bisa memerlukan waktu. Batas konsesi tidak menunjukkan siapa yang menyebabkan kebakaran.'
const GIBS_SOURCE = 'Citra harian NASA GIBS (satelit VIIRS NOAA-20 dan MODIS Terra) untuk tanggal pada slider. Awan menutupi asap dan citra bisa kosong atau belum tersedia untuk hari terbaru. Ini gambar satelit, bukan pengukuran kualitas udara.'

/** URL tile citra harian GIBS (EPSG:3857). Tanggal dibatasi sampai kemarin (UTC) karena citra hari ini belum tersedia. */
export function gibsUrl(d: NonNullable<OverlayDef['daily']>, date: string) {
  const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10)
  const day = date > y ? y : date
  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${d.layer}/default/${day}/${d.matrix}/{z}/{y}/{x}.${d.ext}`
}
export const OVERLAYS: OverlayDef[] = [
  {
    id: 'foto', label: 'Foto satelit', desc: 'Foto satelit hari itu; asap tampak sebagai kabut putih keabuan', swatch: '#cbd5e1', opacity: 0.9,
    daily: { layer: 'VIIRS_NOAA20_CorrectedReflectance_TrueColor', matrix: 'GoogleMapsCompatible_Level9', ext: 'jpg' }, source: GIBS_SOURCE,
  },
  {
    id: 'aerosol', label: 'Aerosol (asap)', desc: 'Kepekatan partikel di udara (aerosol optical depth); makin pekat, makin banyak asap atau debu', swatch: '#a855f7', opacity: 0.5,
    daily: { layer: 'MODIS_Terra_Aerosol', matrix: 'GoogleMapsCompatible_Level6', ext: 'png' }, source: GIBS_SOURCE,
  },
  {
    id: 'gambut', label: 'Gambut', source: BIG_SOURCE, desc: 'Kesatuan Hidrologis Gambut (KHG), area yang memuat ekosistem gambut (garis arsir)', swatch: '#33ff33', opacity: 0.9, hueRotate: 120,
    url: `${SATUPETA}/SUMBER_DAYA_ALAM_DAN_LINGKUNGAN/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:37&f=image`,
  },
  {
    id: 'hti', label: 'Konsesi HTI', source: BIG_SOURCE, desc: 'Izin hutan tanaman industri (IUPHHK-HTI), batas saja', swatch: '#c26bff', opacity: 0.9, hueRotate: 180,
    url: `${SATUPETA}/PERIZINAN_DAN_PERTANAHAN/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:2&f=image`,
  },
  {
    id: 'ha', label: 'Konsesi hutan alam', source: BIG_SOURCE, desc: 'Izin hutan alam (IUPHHK-HA), batas saja', swatch: '#0070ff', opacity: 0.9,
    url: `${SATUPETA}/PERIZINAN_DAN_PERTANAHAN/MapServer/export?bbox={bbox-epsg-3857}&bboxSR=3857&imageSR=3857&size=256,256&format=png32&transparent=true&layers=show:1&f=image`,
  },
]
export const OVERLAY_IDS = OVERLAYS.map(o => o.id)
