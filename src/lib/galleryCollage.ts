import type { CommunityTemplate } from './community'

const CW = 2560
const CH = 1440
const MARGIN = 40
const TOP = 150
const BOTTOM = 170
const GAP = 14
const BOX_W = CW - MARGIN * 2
const BOX_H = CH - TOP - BOTTOM
const INK = '#0C0A09'
const EMBER = '#FF6A1F'
const FG = '#F5F1EC'
const FG2 = '#CFC6BD'
const FG3 = '#968C82'

interface Placed { i: number; x: number; y: number; w: number; h: number }

/** PRNG deterministik agar hasil kolase konsisten untuk kumpulan karya yang sama. */
function rng(seed: number) { return () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296 } }

type Node = { kind: 'leaf'; i: number; a: number } | { kind: 'h' | 'v'; l: Node; r: Node; a: number }

function build(ids: number[], asp: number[], rand: () => number): Node {
  if (ids.length === 1) return { kind: 'leaf', i: ids[0], a: asp[ids[0]] }
  const mid = ids.length / 2
  const cut = Math.min(ids.length - 1, Math.max(1, Math.round(mid + (rand() - 0.5) * ids.length * 0.6)))
  const l = build(ids.slice(0, cut), asp, rand)
  const r = build(ids.slice(cut), asp, rand)
  return rand() < 0.5 ? { kind: 'h', l, r, a: l.a + r.a } : { kind: 'v', l, r, a: 1 / (1 / l.a + 1 / r.a) }
}

/** Letakkan pohon pembagian pada persegi panjang; sel anak berbagi ruang sesuai rasio sehingga setiap karya mengisi selnya persis menurut rasio aslinya. */
function place(n: Node, x: number, y: number, w: number, h: number, out: { i: number; x: number; y: number; w: number; h: number }[]) {
  if (n.kind === 'leaf') { out.push({ i: n.i, x, y, w, h }); return }
  if (n.kind === 'h') {
    const w1 = (w * n.l.a) / (n.l.a + n.r.a)
    place(n.l, x, y, w1, h, out); place(n.r, x + w1, y, w - w1, h, out)
  } else {
    const h1 = (h * (1 / n.l.a)) / (1 / n.l.a + 1 / n.r.a)
    place(n.l, x, y, w, h1, out); place(n.r, x, y + h1, w, h - h1, out)
  }
}

/** Susun SEMUA karya menjadi mosaik tanpa pemotongan (rasio asli terjaga). Mencoba banyak pohon pembagian acak (deterministik) dan memilih yang paling mendekati rasio bingkai dengan ukuran petak paling seimbang. */
export function layoutMosaic(aspects: number[]): Placed[] {
  const n = aspects.length
  if (!n) return []
  const target = BOX_W / BOX_H
  const rand = rng(n * 7919 + 13)
  let best: { root: Node; score: number } | null = null
  const ids = aspects.map((_, i) => i)
  const tries = n === 1 ? 1 : 12000
  for (let t = 0; t < tries; t++) {
    const order = ids.slice()
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [order[i], order[j]] = [order[j], order[i]] }
    const root = build(order, aspects, rand)
    const cells: { i: number; x: number; y: number; w: number; h: number }[] = []
    place(root, 0, 0, root.a, 1, cells)
    const areas = cells.map(c => c.w * c.h)
    const score = Math.abs(Math.log(root.a / target)) + 0.12 * Math.log(Math.max(...areas) / Math.min(...areas))
    if (!best || score < best.score) best = { root, score }
  }
  const root = best!.root
  const w = Math.min(BOX_W, BOX_H * root.a)
  const h = w / root.a
  const ox = MARGIN + (BOX_W - w) / 2
  const oy = TOP + (BOX_H - h) / 2
  const cells: { i: number; x: number; y: number; w: number; h: number }[] = []
  place(root, ox, oy, w, h, cells)
  // jarak antarpetak: sisakan GAP/2 di tiap sisi sel, lalu muat gambar di dalamnya menurut rasio aslinya
  return cells.map(c => {
    const iw = Math.max(1, c.w - GAP), ih = Math.max(1, c.h - GAP)
    const a = aspects[c.i]
    const fw = Math.min(iw, ih * a), fh = fw / a
    return { i: c.i, x: c.x + (c.w - fw) / 2, y: c.y + (c.h - fh) / 2, w: fw, h: fh }
  })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('gambar gagal dimuat'))
    img.src = src
  })
}

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s.trimEnd() + '…'
}

/** Kolase desktop 16:9 (2560x1440) berisi seluruh karya Galeri warga dalam rasio aslinya (tanpa dipotong). */
export async function renderGalleryCollage(items: CommunityTemplate[], opts: { fontFamily: string }): Promise<Blob> {
  const imgs = await Promise.all(items.map(t => loadImage(t.full)))
  if (document.fonts) await document.fonts.ready
  const canvas = document.createElement('canvas')
  canvas.width = CW
  canvas.height = CH
  const ctx = canvas.getContext('2d')!
  const font = (w: number, s: number) => `${w} ${s}px ${opts.fontFamily}`
  ctx.fillStyle = INK
  ctx.fillRect(0, 0, CW, CH)
  const g = ctx.createRadialGradient(CW / 2, CH + 200, 50, CW / 2, CH + 200, 1400)
  g.addColorStop(0, 'rgba(255,106,31,0.22)'); g.addColorStop(1, 'rgba(255,106,31,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, CW, CH)

  ctx.textBaseline = 'alphabetic'
  ctx.font = font(800, 84)
  ctx.fillStyle = FG
  ctx.fillText('Galeri warga', MARGIN + 6, 108)
  ctx.fillStyle = EMBER
  ctx.fillText('.', MARGIN + 6 + ctx.measureText('Galeri warga').width, 108)
  ctx.font = font(800, 44)
  ctx.fillStyle = FG
  const wm = 'Visualize Karhutla'
  const wmW = ctx.measureText(wm).width
  ctx.fillText(wm, CW - MARGIN - 6 - wmW - ctx.measureText('.').width, 100)
  ctx.fillStyle = EMBER
  ctx.fillText('.', CW - MARGIN - 6 - ctx.measureText('.').width, 100)

  ctx.imageSmoothingQuality = 'high'
  const placed = layoutMosaic(imgs.map(im => im.naturalWidth / im.naturalHeight))
  const r = Math.max(6, Math.min(16, Math.min(...placed.map(p => Math.min(p.w, p.h))) * 0.06))
  for (const p of placed) {
    ctx.save()
    ctx.beginPath(); ctx.roundRect(p.x, p.y, p.w, p.h, r); ctx.clip()
    ctx.drawImage(imgs[p.i], p.x, p.y, p.w, p.h)
    ctx.restore()
  }

  const names = [...new Set(items.map(t => t.creator))]
  ctx.font = font(600, 40)
  ctx.fillStyle = FG2
  ctx.fillText(`Karya ${names.length} warga untuk mengingatkan: karhutla belum berakhir.`, MARGIN + 6, CH - 100)
  ctx.font = font(800, 42)
  ctx.fillStyle = EMBER
  const tag = '#visualizekarhutla'
  ctx.fillText(tag, CW - MARGIN - 6 - ctx.measureText(tag).width, CH - 100)
  ctx.font = font(500, 30)
  ctx.fillStyle = FG3
  ctx.fillText(fitText(ctx, `Karya: ${names.join(', ')}`, CW - MARGIN * 2 - 12), MARGIN + 6, CH - 48)

  return await new Promise<Blob>((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('gagal membuat gambar'))), 'image/png'))
}
