import { TOPIK_BAWAAN } from '../content/topik'
import { resolveUrl } from './markdown'

/** Cerita karhutla: tulisan warga, peneliti, dan masyarakat. Setiap cerita adalah satu berkas Markdown di src/content/cerita/, dikelompokkan dengan topik. */

export interface Cerita {
  slug: string
  judul: string
  penulis: string
  /** alamat portofolio atau media sosial penulis (opsional) */
  tautan?: string
  /** foto profil: nomor avatar bawaan (1-9) atau alamat gambar unggahan */
  foto: number | string
  tanggal: string
  ringkasan: string
  topik: string[]
  /** tautan sumber atau rujukan, bila ada */
  sumber?: string
  rujukan?: string
  gambar?: string
  wilayah?: string
  body: string
  menit: number
}

const files = import.meta.glob('../content/cerita/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

/** Rapikan nama topik: spasi tunggal, huruf awal kapital, hanya huruf, angka, spasi, & dan -, maksimal 30 karakter. */
export function normTopik(s: string): string {
  const t = s.replace(/[^\p{L}\p{N}\s&-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30).trim()
  return t ? t.charAt(0).toUpperCase() + t.slice(1) : ''
}
export const slugTopik = (s: string) => s.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')

/** Pisahkan frontmatter sederhana (baris `kunci: nilai`) dari isi Markdown. */
function parse(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.replace(/^﻿/, '').match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of m[1].split(/\r?\n/)) {
    const k = line.match(/^([a-zA-Z_]+):\s*(.*)$/)
    if (k) meta[k[1]] = k[2].trim().replace(/^["']|["']$/g, '')
  }
  return { meta, body: m[2] }
}

export const cerita: Cerita[] = Object.entries(files)
  .map(([path, raw]) => {
    const slug = path.split('/').pop()!.replace(/\.md$/, '')
    const { meta, body } = parse(raw)
    if (!meta.judul) return null
    const kata = body.trim().split(/\s+/).length
    const n = Number(meta.foto)
    const foto: number | string = Number.isInteger(n) && n >= 1 && n <= 9 ? n : meta.foto ? resolveUrl(meta.foto) || 1 : 1
    const tautan = /^https:\/\//i.test(meta.tautan ?? '') ? meta.tautan : undefined
    return {
      slug, judul: meta.judul, penulis: meta.penulis || 'Anonim', tautan, foto, tanggal: meta.tanggal || '', ringkasan: meta.ringkasan || '',
      topik: (meta.topik ?? '').split(',').map(normTopik).filter(Boolean).slice(0, 5),
      sumber: meta.sumber || undefined, rujukan: meta.rujukan || undefined, gambar: meta.gambar ? resolveUrl(meta.gambar) || undefined : undefined, wilayah: meta.wilayah || undefined,
      body, menit: Math.max(1, Math.round(kata / 200)),
    } as Cerita
  })
  .filter((c): c is Cerita => !!c)
  .sort((a, b) => b.tanggal.localeCompare(a.tanggal))

/** Topik yang bisa dipilih atau disaring: topik bawaan ditambah topik buatan penulis yang sudah dipakai pada cerita terbit (tanpa duplikat). */
export function semuaTopik(): string[] {
  const seen = new Map<string, string>()
  for (const t of [...TOPIK_BAWAAN, ...cerita.flatMap(c => c.topik)]) if (!seen.has(slugTopik(t))) seen.set(slugTopik(t), t)
  return [...seen.values()]
}

/** Topik yang dipakai oleh cerita terbit, diurutkan menurut jumlah cerita (untuk penyaring di daftar). */
export function topikTerpakai(): { nama: string; slug: string; jumlah: number }[] {
  const m = new Map<string, { nama: string; slug: string; jumlah: number }>()
  for (const c of cerita) for (const t of c.topik) { const s = slugTopik(t); const e = m.get(s); if (e) e.jumlah++; else m.set(s, { nama: t, slug: s, jumlah: 1 }) }
  return [...m.values()].sort((a, b) => b.jumlah - a.jumlah || a.nama.localeCompare(b.nama))
}
