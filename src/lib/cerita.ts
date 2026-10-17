/** Cerita karhutla: artikel ilmiah, cerita warga terdampak, dan opini publik. Setiap cerita adalah satu berkas Markdown di src/content/cerita/. */

export type Kategori = 'ilmiah' | 'warga' | 'opini'

export const KATEGORI: Record<Kategori, { label: string; ringkas: string }> = {
  ilmiah: { label: 'Artikel ilmiah', ringkas: 'Kajian dan temuan penelitian' },
  warga: { label: 'Cerita warga', ringkas: 'Kisah langsung dari warga terdampak' },
  opini: { label: 'Opini publik', ringkas: 'Pandangan dan tanggapan masyarakat' },
}

export interface Cerita {
  slug: string
  judul: string
  kategori: Kategori
  penulis: string
  tanggal: string
  ringkasan: string
  /** untuk artikel ilmiah: tautan ke publikasi asli atau DOI */
  sumber?: string
  /** untuk artikel ilmiah: rujukan lengkap (APA) */
  rujukan?: string
  gambar?: string
  wilayah?: string
  body: string
  menit: number
}

const files = import.meta.glob('../content/cerita/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

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
    const kategori = (['ilmiah', 'warga', 'opini'] as const).find(k => k === meta.kategori)
    if (!kategori || !meta.judul) return null
    const kata = body.trim().split(/\s+/).length
    return {
      slug, judul: meta.judul, kategori, penulis: meta.penulis || 'Anonim', tanggal: meta.tanggal || '', ringkasan: meta.ringkasan || '',
      sumber: meta.sumber || undefined, rujukan: meta.rujukan || undefined, gambar: meta.gambar || undefined, wilayah: meta.wilayah || undefined,
      body, menit: Math.max(1, Math.round(kata / 200)),
    } as Cerita
  })
  .filter((c): c is Cerita => !!c)
  .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
