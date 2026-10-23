// Mengunduh batas wilayah geoBoundaries (IDN ADM1/ADM2, CC BY 3.0 IGO / ODbL) dan
// menyaring kabupaten/kota di Kalimantan, Sumatra, dan Papua. ADM2 tidak membawa atribut
// provinsi, jadi provinsi ditentukan dari ADM1 yang memuat titik pusat kabupaten.
import fs from 'node:fs'
import path from 'node:path'
import booleanPointInPolygon from '@turf/boolean-point-in-polygon'
import { point } from '@turf/helpers'
import type { Feature, FeatureCollection, MultiPolygon, Polygon, Position } from 'geojson'
import { PROVINCES } from './shared'

const SRC = 'data/boundaries/src'
const URLS = {
  adm1: 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM1/geoBoundaries-IDN-ADM1_simplified.geojson',
  adm2: 'https://github.com/wmgeolab/geoBoundaries/raw/9469f09/releaseData/gbOpen/IDN/ADM2/geoBoundaries-IDN-ADM2_simplified.geojson',
}
async function load(key: 'adm1' | 'adm2'): Promise<FeatureCollection> {
  const file = path.join(SRC, `${key}.geojson`)
  if (!fs.existsSync(file)) {
    fs.mkdirSync(SRC, { recursive: true })
    const res = await fetch(URLS[key], { redirect: 'follow' })
    if (!res.ok) throw new Error(`Gagal mengunduh ${URLS[key]}: ${res.status}. Batas wilayah tidak dikarang; unduh manual ke ${file}.`)
    fs.writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  return JSON.parse(fs.readFileSync(file, 'utf8'))
}

// ADM1 geoBoundaries (OSM 2017) belum memuat pemekaran/perubahan batas: koreksi berdasarkan pembagian administratif resmi.
const OWNER_OVERRIDE: Record<string, string> = {
  Seruyan: 'kalteng', 'Kutai Barat': 'kaltim', 'Mahakam Hulu': 'kaltim', Malinau: 'kaltara',
  Dairi: 'sumut', Karo: 'sumut', 'Musi Banyuasin': 'sumsel', 'Bengkulu Selatan': 'bengkulu', 'Lampung Barat': 'lampung',
  'Kota Sungai Penuh': 'jambi', 'Batang Hari': 'jambi', 'Tanjung Jabung Timur': 'jambi', 'Muara Enim': 'sumsel', 'Kota Pagar Alam': 'sumsel',
  // Jawa, Sulawesi, Nusa Tenggara, Maluku: batas ADM1 yang kasar menempatkan sebagian kabupaten pada provinsi tetangga atau tidak sama sekali
  'Kota Jakarta Barat': 'dki', 'Kepulauan Seribu': 'dki', Bojonegoro: 'jatim', Magetan: 'jatim', Ngawi: 'jatim',
  'Bone Bolango': 'gorontalo', 'Mamuju Utara': 'sulbar', 'Morowali Utara': 'sulteng', 'Parigi Moutong': 'sulteng', Kolaka: 'sultra',
  Sikka: 'ntt', 'Halmahera Tengah': 'malut',
}
// bukan kabupaten/kota (danau) pada data geoBoundaries
const EXCLUDE = new Set(['Danau', 'Danau Toba', 'Waduk Cirata', 'Hutan', 'Wadung Kedungombo'])
// pemekaran Papua 2022: ADM1 geoBoundaries hanya Papua dan Papua Barat, jadi kabupaten dipetakan menurut nama
const PAPUA_MAP: Record<string, string[]> = {
  papsel: ['Merauke', 'Boven Digoel', 'Mappi', 'Asmat'],
  papteng: ['Nabire', 'Paniai', 'Mimika', 'Puncak Jaya', 'Puncak', 'Dogiyai', 'Intan Jaya', 'Deiyai'],
  pappeg: ['Jayawijaya', 'Lanny Jaya', 'Mamberamo Tengah', 'Nduga', 'Pegunungan Bintang', 'Tolikara', 'Yalimo', 'Yahukimo'],
  papbarda: ['Sorong', 'Kota Sorong', 'Sorong Selatan', 'Raja Ampat', 'Tambrauw', 'Maybrat'],
  papbar: ['Fakfak', 'Kaimana', 'Manokwari', 'Manokwari Selatan', 'Pegunungan Arfak', 'Teluk Bintuni', 'Teluk Wondama'],
  papua: ['Jayapura', 'Kota Jayapura', 'Keerom', 'Sarmi', 'Waropen', 'Biak Numfor', 'Supiori', 'Kepulauan Yapen', 'Mamberamo Raya'],
}
const PAPUA_OF = new Map(Object.entries(PAPUA_MAP).flatMap(([id, names]) => names.map(n => [n, id] as const)))
const round = (n: number) => Math.round(n * 1e4) / 1e4
function roundCoords(c: any): any {
  return typeof c[0] === 'number' ? [round(c[0]), round(c[1])] : c.map(roundCoords)
}
export function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}
function ringArea(r: Position[]) {
  let a = 0
  for (let i = 0; i < r.length - 1; i++) a += r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
  return a / 2
}
function centroid(geom: Polygon | MultiPolygon): [number, number] {
  const polys = geom.type === 'Polygon' ? [geom.coordinates] : geom.coordinates
  let best = polys[0], bestA = 0
  for (const p of polys) { const a = Math.abs(ringArea(p[0])); if (a >= bestA) { bestA = a; best = p } }
  const r = best[0]; let cx = 0, cy = 0, a = 0
  for (let i = 0; i < r.length - 1; i++) {
    const f = r[i][0] * r[i + 1][1] - r[i + 1][0] * r[i][1]
    cx += (r[i][0] + r[i + 1][0]) * f; cy += (r[i][1] + r[i + 1][1]) * f; a += f
  }
  return [cx / (3 * a), cy / (3 * a)]
}

async function main() {
  const adm1 = await load('adm1'), adm2 = await load('adm2')
  const prov = PROVINCES.filter(p => p.adm1).map(p => ({ ...p, feat: adm1.features.find(f => f.properties?.shapeName === p.adm1) as Feature<Polygon | MultiPolygon> }))
  for (const p of prov) if (!p.feat) throw new Error(`ADM1 ${p.adm1} tidak ditemukan`)
  const byId = (id: string) => PROVINCES.find(p => p.id === id)!
  const out: Record<string, Feature[]> = {}
  const seen = new Set<string>()
  const items: { f: Feature<Polygon | MultiPolygon>; c: [number, number]; nm: string; owner: (typeof PROVINCES)[number] }[] = []
  const unassigned: string[] = []
  for (const f of adm2.features as Feature<Polygon | MultiPolygon>[]) {
    const c = centroid(f.geometry)
    const pt = point(c)
    // titik pusat bisa jatuh di luar poligon cekung; uji juga satu titik dari cincin terluar
    const probe = point((f.geometry.type === 'Polygon' ? f.geometry.coordinates[0] : f.geometry.coordinates[0][0])[0])
    const nm = String(f.properties?.shapeName)
    if (EXCLUDE.has(nm)) continue
    let owner: (typeof PROVINCES)[number] | undefined = OWNER_OVERRIDE[nm] ? byId(OWNER_OVERRIDE[nm]) : prov.find(p => booleanPointInPolygon(pt, p.feat) || booleanPointInPolygon(probe, p.feat))
    if (owner && owner.island === 'papua' && PAPUA_OF.has(nm)) owner = byId(PAPUA_OF.get(nm)!)
    if (!owner) { unassigned.push(nm); continue }
    items.push({ f, c, nm, owner })
  }
  // slug wilayah lama (Kalimantan, Sumatra, Papua) dibagikan lebih dulu agar tautan yang sudah beredar tidak berubah; wilayah baru menyusul
  const LEGACY = new Set(['kalimantan', 'sumatra', 'papua'])
  items.sort((a, b) => Number(!LEGACY.has(a.owner.island)) - Number(!LEGACY.has(b.owner.island)))
  for (const { f, c, nm: name, owner } of items) {
    let slug = slugify(name)
    if (seen.has(slug)) slug += '-' + owner.id
    seen.add(slug)
    ;(out[owner.id] ||= []).push({
      type: 'Feature',
      properties: { slug, name, provinceId: owner.id, provinceName: owner.name, centroid: [round(c[0]), round(c[1])] },
      geometry: { ...f.geometry, coordinates: roundCoords(f.geometry.coordinates) } as any,
    })
  }
  if (unassigned.length) console.log('TIDAK TERPETAKAN:', unassigned.join(', '))
  fs.mkdirSync('public/data', { recursive: true })
  let total = 0
  for (const p of PROVINCES) {
    const feats = out[p.id] || []
    total += feats.length
    fs.writeFileSync(`public/data/boundaries-${p.id}.json`, JSON.stringify({ type: 'FeatureCollection', features: feats }))
    console.log(p.id, feats.length, feats.map(f => f.properties!.name).join(', '))
  }
  console.log('total', total)
}
main().catch(e => { console.error(e); process.exit(1) })
