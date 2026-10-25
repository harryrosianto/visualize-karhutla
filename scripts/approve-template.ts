// Memproses kiriman templat dari komunitas (GitHub Issue) setelah disetujui pemelihara.
// Dipanggil oleh .github/workflows/approve-template.yml saat label "setujui-templat" dipasang.
// Masukan hanya lewat variabel lingkungan (bukan interpolasi shell): ISSUE_BODY, ISSUE_NUMBER.
// Untuk uji lokal: APPROVE_ALLOW_HOSTS=127.0.0.1 (tambahan host yang diizinkan, hanya untuk pengujian).
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const OUT_DIR = 'src/assets/community'
const DATA = 'src/content/communityTemplates.json'
const MAX_BYTES = 12 * 1024 * 1024
const MAX_IMAGES = 10 // satu kiriman = satu karya atau satu seri (gambar pertama jadi sampul)
const FORMATS = new Set(['png', 'jpeg', 'webp', 'gif', 'avif'])

const body = process.env.ISSUE_BODY ?? ''
const issue = Number(process.env.ISSUE_NUMBER)
if (!body || !Number.isInteger(issue) || issue <= 0) { console.error('ISSUE_BODY atau ISSUE_NUMBER tidak valid'); process.exit(1) }

/** Pecah isi formulir isu GitHub ("### Label" lalu isinya) menjadi peta label -> isi. */
function sections(md: string) {
  const out: Record<string, string> = {}
  const parts = md.replace(/\r/g, '').split(/^### +/m).slice(1)
  for (const p of parts) {
    const nl = p.indexOf('\n')
    const key = (nl < 0 ? p : p.slice(0, nl)).trim().toLowerCase()
    out[key] = (nl < 0 ? '' : p.slice(nl + 1)).trim()
  }
  return out
}
const clean = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
const empty = (s: string) => !s || /^_no response_$/i.test(s.trim())

const s = sections(body)
const title = clean(s['judul templat'] ?? '', 80)
const creator = clean(s['nama kreator'] ?? '', 60)
const description = empty(s['deskripsi'] ?? '') ? '' : clean(s['deskripsi'], 400)
let creatorUrl = (s['tautan portofolio atau akun media sosial'] ?? '').trim()
if (empty(creatorUrl) || !/^https:\/\/[^\s<>"']+$/i.test(creatorUrl)) creatorUrl = ''
const consent = s['pernyataan'] ?? ''
if (!title || !creator) { console.error('Judul dan nama kreator wajib diisi'); process.exit(1) }
if (!/\[x\]/i.test(consent) || /\[ \]/.test(consent)) { console.error('Pernyataan hak cipta belum dicentang seluruhnya'); process.exit(1) }

const allowed = (host: string) =>
  host === 'github.com' || host.endsWith('.githubusercontent.com') || (process.env.APPROVE_ALLOW_HOSTS ?? '').split(',').filter(Boolean).includes(host)
const imageSection = s['gambar'] ?? ''
const urls = [...new Set([...imageSection.matchAll(/https?:\/\/[^\s)"'<>\]]+/g)].map(m => m[0]))]
  .filter(u => { try { const x = new URL(u); return allowed(x.hostname) && (x.hostname !== 'github.com' || x.pathname.startsWith('/user-attachments/')) } catch { return false } })
  .slice(0, MAX_IMAGES)
if (!urls.length) { console.error('Tidak ada gambar yang dapat diproses pada kiriman'); process.exit(1) }

fs.mkdirSync(OUT_DIR, { recursive: true })
const list: any[] = fs.existsSync(DATA) ? JSON.parse(fs.readFileSync(DATA, 'utf8')) : []
const added: string[] = []
const coverId = `t${issue}-1`

if (list.some(x => x.id === coverId)) {
  console.log('Ditambahkan: (tidak ada, sudah ada sebelumnya)')
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, 'count=0\n')
  process.exit(0)
}

// gambar pertama = sampul entri; sisanya menjadi slide berurutan pada entri yang sama (more)
const slides: { id: string; ext: string; width: number; height: number; anim?: true }[] = []
const MAX_GIF_BYTES = 5 * 1024 * 1024
const MAX_FRAMES = 200
for (const [i, url] of urls.entries()) {
  const res = await fetch(url, { redirect: 'follow' })
  if (!res.ok) { console.error(`Gagal mengunduh ${url}: ${res.status}`); process.exit(1) }
  const buf = Buffer.from(await res.arrayBuffer())
  if (buf.length > MAX_BYTES) { console.error(`Berkas ${i + 1} melebihi 12 MB`); process.exit(1) }
  let meta
  try { meta = await sharp(buf, { pages: -1 }).metadata() } catch { console.error(`Berkas ${i + 1} bukan gambar yang dikenali`); process.exit(1) }
  if (!meta.format || !FORMATS.has(meta.format) || !meta.width || !meta.height) { console.error(`Format berkas ${i + 1} tidak didukung (${meta.format})`); process.exit(1) }
  const id = `t${issue}-${i + 1}`
  const animated = (meta.pages ?? 1) > 1 && (meta.format === 'gif' || meta.format === 'webp')
  // jumlah bingkai yang dibaca dibatasi (opsi pages tidak boleh melebihi jumlah bingkai berkas)
  const frames = Math.min(meta.pages ?? 1, MAX_FRAMES)
  // gambar diam: bingkai pertama (juga untuk GIF animasi), dipakai kolase, video, dan sebagai poster
  const still = sharp(buf, { limitInputPixels: 120_000_000, page: 0 }).rotate().resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
  // berkas unduhan: JPG (atau PNG bila ada transparansi) agar dapat langsung diunggah ke Instagram dari galeri
  const ext = meta.hasAlpha ? 'png' : 'jpg'
  const flat = meta.hasAlpha ? still.clone().png({ compressionLevel: 9 }) : still.clone().flatten({ background: '#ffffff' }).jpeg({ quality: 88, mozjpeg: true })
  const info = await flat.toFile(path.join(OUT_DIR, `${id}.${ext}`))
  await sharp(buf, { page: 0 }).rotate().resize({ width: 640, withoutEnlargement: true }).webp({ quality: 74 }).toFile(path.join(OUT_DIR, `${id}-thumb.webp`))
  if (animated) {
    // GIF asli untuk diunduh (bila terlalu besar atau bukan GIF, dikodekan ulang lebih kecil) dan WebP animasi ringan untuk pratinjau
    let gif: Buffer = meta.format === 'gif' && buf.length <= MAX_GIF_BYTES ? buf : Buffer.alloc(0)
    for (const w of [640, 480, 360]) {
      if (gif.length) break
      const g = await sharp(buf, { pages: frames, limitInputPixels: 120_000_000 }).resize({ width: Math.min(w, meta.width!), withoutEnlargement: true }).gif({ loop: 0 }).toBuffer()
      if (g.length <= MAX_GIF_BYTES) gif = g
    }
    if (!gif.length) { console.error(`GIF ${i + 1} terlalu besar meski sudah dikecilkan (maksimal 5 MB)`); process.exit(1) }
    fs.writeFileSync(path.join(OUT_DIR, `${id}.gif`), gif)
    let webp: Buffer = Buffer.alloc(0)
    for (const [w, q] of [[480, 65], [400, 55], [320, 45]] as const) {
      webp = await sharp(buf, { pages: frames, limitInputPixels: 120_000_000 }).resize({ width: Math.min(w, meta.width!), withoutEnlargement: true }).webp({ quality: q, effort: 4, loop: 0 }).toBuffer()
      if (webp.length <= 3 * 1024 * 1024) break
    }
    fs.writeFileSync(path.join(OUT_DIR, `${id}-anim.webp`), webp)
    console.log(`  ${id}: GIF animasi, ${frames} bingkai (gif ${Math.round(gif.length / 1024)} KB, pratinjau ${Math.round(webp.length / 1024)} KB)`)
  }
  slides.push({ id, ext, width: info.width, height: info.height, ...(animated ? { anim: true as const } : {}) })
  added.push(id)
}

const [cover, ...more] = slides
list.push({
  id: cover.id, ext: cover.ext, title, creator, creatorUrl, width: cover.width, height: cover.height, issue,
  ...(cover.anim ? { anim: true } : {}),
  ...(description ? { description } : {}),
  ...(more.length ? { more } : {}),
})

fs.writeFileSync(DATA, JSON.stringify(list, null, 2) + '\n')
console.log(`Ditambahkan: ${added.join(', ')}${more.length ? ` (seri ${slides.length} gambar)` : ''}`)
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `count=${added.length}\n`)
