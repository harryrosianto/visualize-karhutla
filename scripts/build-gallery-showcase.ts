// Membuat video penampilan Galeri warga ukuran desktop (1920x1080, MP4) dari seluruh karya yang sudah masuk.
// Semua gambar diskalakan ke lebar yang sama dan disusun dalam kolom (masonry), judul dan nama kreator di bawah tiap gambar,
// lalu digulir dari atas ke bawah. Karya berseri tampil satu per satu (setiap slide sebagai kartu sendiri).
// Pakai: npx tsx scripts/build-gallery-showcase.ts [keluaran.mp4]   (butuh ffmpeg di PATH)
import fs from 'node:fs'
import path from 'node:path'
import { spawn } from 'node:child_process'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp, { type OverlayOptions } from 'sharp'

const OUT = process.argv[2] || 'assets-src/video/galeri-warga-desktop.mp4'
const W = 1920, H = 1080, FPS = 30
const COLS = 3, CARD_W = 560, GAP = 40, MARGIN_X = (W - COLS * CARD_W - (COLS - 1) * GAP) / 2
const CAP_H = 112, CAP_GAP = 14, ROW_GAP = 56, RADIUS = 14
const SPEED = Number(process.env.SPEED || 210) // piksel per detik
const BG = '#0C0A09'

const font = (f: string) => fs.readFileSync(f)
const fonts: any[] = [
  { name: 'Grotesk', data: font('node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Grotesk', data: font('node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-500-normal.woff'), weight: 500, style: 'normal' },
]
type N = any
const h = (type: string, style: Record<string, any>, ...children: any[]): N => ({ type, props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children } })
async function render(node: N, w: number, hh: number): Promise<Buffer> {
  const svg = await satori(node, { width: w, height: hh, fonts })
  return new Resvg(svg, { fitTo: { mode: 'width', value: w } }).render().asPng()
}

// ---- data: gambar terbaru dulu, seperti urutan di galeri; slide berseri diurai satu per satu
interface Card { id: string; ext: string; title: string; creator: string; note: string }
const data = JSON.parse(fs.readFileSync('src/content/communityTemplates.json', 'utf8')) as any[]
const cards: Card[] = []
for (const e of [...data].reverse()) {
  const all = [{ id: e.id, ext: e.ext, anim: !!e.anim }, ...(e.more ?? []).map((m: any) => ({ id: m.id, ext: m.ext, anim: !!m.anim }))]
  all.forEach((s, k) => cards.push({
    id: s.id, ext: s.ext, title: e.title.trim(), creator: e.creator.trim(),
    note: [all.length > 1 ? `${k + 1} dari ${all.length}` : '', s.anim ? 'GIF' : ''].filter(Boolean).join(' · '),
  }))
}
const creators = [...new Set(cards.map(c => c.creator))]
const odd = cards.filter(c => /[^\u0000-ɏ‘-”–—…]/.test(c.title + c.creator))
if (odd.length) console.warn('Peringatan: karakter di luar huruf Latin pada', odd.map(o => o.id).join(', '), '(mungkin tidak tampil)')
console.log(`${cards.length} kartu dari ${data.length} karya, ${creators.length} kreator`)

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s)
const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg"><rect width="${CARD_W}" height="9999" rx="${RADIUS}" ry="${RADIUS}"/></svg>`)

// ---- siapkan tiap kartu: gambar berlebar sama + keterangan di bawahnya
interface Prepared { img: Buffer; imgH: number; cap: Buffer; total: number }
const prepared: Prepared[] = []
for (const c of cards) {
  const file = `src/assets/community/${c.id}.${c.ext}`
  const resized = await sharp(file).rotate().resize({ width: CARD_W }).removeAlpha().png().toBuffer()
  const m = await sharp(resized).metadata()
  const imgH = m.height!
  const roundedMask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_W}" height="${imgH}"><rect width="${CARD_W}" height="${imgH}" rx="${RADIUS}" ry="${RADIUS}" fill="#fff"/></svg>`)
  const img = await sharp(resized).composite([{ input: roundedMask, blend: 'dest-in' }]).png().toBuffer()
  const cap = await render(
    h('div', { width: CARD_W, height: CAP_H, flexDirection: 'column', fontFamily: 'Grotesk' },
      h('div', { fontSize: 27, fontWeight: 800, color: '#F5F5F4', lineHeight: 1.2, letterSpacing: -0.4 }, clip(c.title, 70)),
      h('div', { fontSize: 22, fontWeight: 500, color: '#A8A29E', marginTop: 8 }, `oleh ${clip(c.creator, 34)}${c.note ? ' · ' + c.note : ''}`)),
    CARD_W, CAP_H)
  prepared.push({ img, imgH, cap, total: imgH + CAP_GAP + CAP_H + ROW_GAP })
  void mask
}

// ---- tata letak masonry: kartu berikutnya ke kolom yang paling pendek
const colTop = Array(COLS).fill(H) // blok sampul (1080 px) di paling atas, kolom mulai di bawahnya
const placements: { i: number; x: number; y: number }[] = []
prepared.forEach((p, i) => {
  const col = colTop.indexOf(Math.min(...colTop))
  placements.push({ i, x: MARGIN_X + col * (CARD_W + GAP), y: colTop[col] })
  colTop[col] += p.total
})
const contentEnd = Math.max(...colTop)
const TOTAL_H = contentEnd + H // blok penutup (1080 px) di bawah
console.log(`tinggi dinding ${TOTAL_H}px, jarak gulir ${TOTAL_H - H}px`)

// ---- blok sampul dan penutup
const glow = (pos: string) => `radial-gradient(circle at ${pos}, rgba(249,115,22,0.32), rgba(12,10,9,0) 62%)`
const intro = await render(
  h('div', { width: W, height: H, flexDirection: 'column', justifyContent: 'center', padding: '0 170px', backgroundColor: BG, backgroundImage: glow('25% 105%'), color: '#F5F5F4', fontFamily: 'Grotesk' },
    h('div', { fontSize: 38, fontWeight: 500, color: '#D6D3D1' }, 'Visualize Karhutla'),
    h('div', { fontSize: 250, fontWeight: 800, letterSpacing: -11, lineHeight: 1, marginTop: 8 }, 'Galeri warga', h('div', { color: '#F97316' }, '.')),
    h('div', { fontSize: 48, fontWeight: 500, color: '#D6D3D1', marginTop: 34, maxWidth: 1250, lineHeight: 1.3 }, `${cards.length} karya dari ${creators.length} kreator untuk mengingatkan bahwa karhutla belum berakhir.`)),
  W, H)
const names = creators.map(c => clip(c, 28))
const outro = await render(
  h('div', { width: W, height: H, flexDirection: 'column', justifyContent: 'center', padding: '0 170px', backgroundColor: BG, backgroundImage: glow('75% 105%'), color: '#F5F5F4', fontFamily: 'Grotesk' },
    h('div', { fontSize: 120, fontWeight: 800, letterSpacing: -5, lineHeight: 1.02 }, 'Terima kasih para kreator', h('div', { color: '#F97316' }, '.')),
    h('div', { fontSize: 31, fontWeight: 500, color: '#D6D3D1', marginTop: 40, lineHeight: 1.55, flexWrap: 'wrap', maxWidth: 1580 }, names.join('   ·   ')),
    h('div', { fontSize: 46, fontWeight: 800, marginTop: 56 }, 'Kirim karyamu ke galeri warga Visualize Karhutla', h('div', { color: '#F97316' }, '.'))),
  W, H)

// ---- rakit dinding
const comps: OverlayOptions[] = [{ input: intro, left: 0, top: 0 }, { input: outro, left: 0, top: contentEnd }]
for (const p of placements) {
  const pr = prepared[p.i]
  comps.push({ input: pr.img, left: p.x, top: p.y }, { input: pr.cap, left: p.x, top: p.y + pr.imgH + CAP_GAP })
}
console.log('menyusun dinding...')
const { data: wall, info: wallInfo } = await sharp({ create: { width: W, height: TOTAL_H, channels: 3, background: BG } }).composite(comps).removeAlpha().raw().toBuffer({ resolveWithObject: true })
if (wallInfo.channels !== 3 || wall.length !== W * TOTAL_H * 3) throw new Error(`ukuran dinding tidak sesuai (${wallInfo.channels} kanal, ${wall.length} byte)`)

// pudar di tepi atas dan bawah layar supaya kartu muncul dan hilang halus
const fade = await sharp(Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs>
    <linearGradient id="t" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${BG}" stop-opacity="0.95"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></linearGradient>
    <linearGradient id="b" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${BG}" stop-opacity="0.95"/><stop offset="1" stop-color="${BG}" stop-opacity="0"/></linearGradient></defs>
    <rect width="${W}" height="90" fill="url(#t)"/><rect y="${H - 90}" width="${W}" height="90" fill="url(#b)"/></svg>`)).png().toBuffer()
const fadePath = path.join(path.dirname(OUT), '_fade.png')
fs.mkdirSync(path.dirname(OUT), { recursive: true })
fs.writeFileSync(fadePath, fade)

// ---- jadwal gulir: diam sebentar, percepatan halus, kecepatan tetap, perlambatan halus, diam di penutup
const L = TOTAL_H - H, A = 0.9, HOLD_START = 1.6, HOLD_END = 2.4
const scrollTime = L / SPEED + A
const duration = HOLD_START + scrollTime + HOLD_END
const frames = Math.round(duration * FPS)
const yAt = (t: number) => {
  const s = t - HOLD_START
  if (s <= 0) return 0
  if (s >= scrollTime) return L
  if (s < A) return (SPEED * s * s) / (2 * A)
  if (s > scrollTime - A) { const r = scrollTime - s; return L - (SPEED * r * r) / (2 * A) }
  return (SPEED * A) / 2 + SPEED * (s - A)
}
console.log(`durasi ${duration.toFixed(1)} detik, ${frames} bingkai pada ${SPEED} px/detik`)

const ff = spawn('ffmpeg', [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', `${W}x${H}`, '-framerate', String(FPS), '-i', 'pipe:0',
  '-loop', '1', '-framerate', String(FPS), '-i', fadePath,
  '-filter_complex', '[0:v][1:v]overlay=0:0:shortest=1,format=yuv420p',
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-r', String(FPS), '-movflags', '+faststart', OUT,
], { stdio: ['pipe', 'inherit', 'inherit'] })
const done = new Promise<number>(res => ff.on('close', code => res(code ?? 1)))
ff.stdin.on('error', () => { /* ffmpeg berhenti lebih dulu; kode keluar dilaporkan di bawah */ })
for (let f = 0; f < frames; f++) {
  const y = Math.min(L, Math.max(0, Math.round(yAt(f / FPS))))
  const slice = wall.subarray(y * W * 3, (y + H) * W * 3)
  if (!ff.stdin.write(slice)) await new Promise(r => ff.stdin.once('drain', r))
  if (f % 300 === 0) process.stdout.write(`\r${f}/${frames}`)
}
ff.stdin.end()
const code = await done
fs.rmSync(fadePath, { force: true })
if (code !== 0) { console.error('\nffmpeg gagal, kode', code); process.exit(1) }
console.log(`\nselesai: ${OUT} (${(fs.statSync(OUT).size / 1024 / 1024).toFixed(1)} MB)`)
