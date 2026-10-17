// Mengubah isu "[Cerita]" yang disetujui pemelihara menjadi berkas Markdown di src/content/cerita/ (dan gambar di public/cerita/<slug>/).
// Dipanggil oleh .github/workflows/approve-cerita.yml saat label "setujui-cerita" dipasang.
// Masukan hanya lewat variabel lingkungan: ISSUE_BODY, ISSUE_NUMBER. Uji lokal: APPROVE_ALLOW_HOSTS=127.0.0.1.
import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const body = process.env.ISSUE_BODY ?? ''
const issue = Number(process.env.ISSUE_NUMBER)
if (!body || !Number.isInteger(issue) || issue <= 0) { console.error('ISSUE_BODY atau ISSUE_NUMBER tidak valid'); process.exit(1) }

function sections(md: string) {
  const out: Record<string, string> = {}
  for (const p of md.replace(/\r/g, '').split(/^### +/m).slice(1)) {
    const nl = p.indexOf('\n')
    out[(nl < 0 ? p : p.slice(0, nl)).trim().toLowerCase()] = (nl < 0 ? '' : p.slice(nl + 1)).trim()
  }
  return out
}
const one = (s: string, max: number) => s.replace(/[\u0000-\u001f\u007f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max)
const noResp = (s: string) => !s || /^_no response_$/i.test(s.trim())

const s = sections(body)
const topik = [...new Map(((s['topik'] ?? '').split(',') as string[])
  .map(t => t.replace(/[^\p{L}\p{N}\s&-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30).trim()).filter(Boolean)
  .map(t => [t.toLowerCase(), t.charAt(0).toUpperCase() + t.slice(1)] as const)).values()].slice(0, 5)
const judul = one(s['judul'] ?? '', 120)
const penulis = one(s['nama penulis'] ?? '', 60)
const wilayahRaw = s['wilayah terkait'] ?? ''
const wilayah = noResp(wilayahRaw) ? '' : one(wilayahRaw, 80)
const sumberRaw = (s['tautan sumber atau rujukan'] ?? s['tautan sumber (khusus artikel ilmiah)'] ?? '').trim()
const sumber = /^https:\/\/[^\s<>"'`]{3,300}$/i.test(sumberRaw) ? sumberRaw : ''
let isi = (s['isi tulisan'] ?? '').trim()
const consent = s['pernyataan'] ?? ''
const tautanRaw = (s['tautan penulis (portofolio atau media sosial)'] ?? '').trim()
const tautan = /^https:\/\/[^\s<>"'`]{3,200}$/i.test(tautanRaw) ? tautanRaw : ''
const fotoSection = s['foto profil'] ?? ''
if (topik.length < 1) { console.error('Topik wajib diisi'); process.exit(1) }
if (judul.length < 5 || !penulis) { console.error('Judul atau nama penulis tidak valid'); process.exit(1) }
if (!/\[x\]/i.test(consent) || /\[ \]/.test(consent)) { console.error('Pernyataan belum dicentang seluruhnya'); process.exit(1) }
if (isi.split(/\s+/).length < 30) { console.error('Isi tulisan terlalu singkat'); process.exit(1) }

const slug = (judul.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50).replace(/-+$/, '') || 'cerita') + '-' + issue
const outMd = `src/content/cerita/${slug}.md`
if (fs.existsSync(outMd)) { console.log(`${outMd} sudah ada, dilewati`); process.exit(0) }

const allowed = (u: URL) =>
  u.hostname === 'github.com' ? u.pathname.startsWith('/user-attachments/') : u.hostname.endsWith('.githubusercontent.com') || (process.env.APPROVE_ALLOW_HOSTS ?? '').split(',').filter(Boolean).includes(u.hostname)

// unduh dan optimalkan gambar; gambar dari host lain dibuang (diganti teks alternatif)
const imgDir = `public/cerita/${slug}`
const imgRe = /!\[([^\]]*)\]\((\S+?)(?:\s+"[^"]*")?\)/g
const matches = [...isi.matchAll(imgRe)]
let count = 0
let cover = ''
const replacements = new Map<string, string>()
for (const m of matches) {
  const [whole, alt, url] = m
  if (replacements.has(whole)) continue
  let rep = alt
  try {
    const u = new URL(url)
    if (allowed(u) && count < 10) {
      const res = await fetch(url, { redirect: 'follow' })
      if (!res.ok) throw new Error(String(res.status))
      const buf = Buffer.from(await res.arrayBuffer())
      if (buf.length > 12 * 1024 * 1024) throw new Error('terlalu besar')
      const meta = await sharp(buf).metadata()
      if (!meta.format || !['png', 'jpeg', 'webp', 'gif', 'avif'].includes(meta.format)) throw new Error('format')
      count++
      fs.mkdirSync(imgDir, { recursive: true })
      await sharp(buf, { limitInputPixels: 120_000_000 }).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82 }).toFile(path.join(imgDir, `${count}.webp`))
      const rel = `cerita/${slug}/${count}.webp`
      if (!cover) cover = rel
      rep = `![${alt.replace(/[\[\]]/g, '')}](${rel})`
    }
  } catch (e) {
    console.warn(`Gambar dilewati (${url.slice(0, 60)}): ${(e as Error).message}`)
  }
  replacements.set(whole, rep)
}
for (const [from, to] of replacements) isi = isi.split(from).join(to)

// foto profil penulis: unggahan (dioptimalkan 256x256), avatar bawaan pilihan penulis, atau avatar acak
let foto = ''
const fotoUrl = /!\[[^\]]*\]\((\S+?)\)/.exec(fotoSection)?.[1]
if (fotoUrl) {
  try {
    const u = new URL(fotoUrl)
    if (!allowed(u)) throw new Error('host tidak diizinkan')
    const res = await fetch(fotoUrl, { redirect: 'follow' })
    if (!res.ok) throw new Error(String(res.status))
    const buf = Buffer.from(await res.arrayBuffer())
    if (buf.length > 4 * 1024 * 1024) throw new Error('terlalu besar')
    const meta = await sharp(buf).metadata()
    if (!meta.format || !['png', 'jpeg', 'webp'].includes(meta.format)) throw new Error('format')
    fs.mkdirSync(imgDir, { recursive: true })
    await sharp(buf).rotate().resize(256, 256, { fit: 'cover' }).webp({ quality: 85 }).toFile(path.join(imgDir, 'penulis.webp'))
    foto = `cerita/${slug}/penulis.webp`
  } catch (e) {
    console.warn(`Foto profil dilewati: ${(e as Error).message}`)
  }
}
if (!foto) {
  const n = Number(/Avatar bawaan:\s*(\d+)/i.exec(fotoSection)?.[1])
  foto = String(Number.isInteger(n) && n >= 1 && n <= 9 ? n : 1 + Math.floor(Math.random() * 9))
}

// ringkasan: paragraf pertama berupa teks biasa
const firstPara = isi.split(/\n{2,}/).map(p => p.replace(/!\[[^\]]*\]\([^)]*\)/g, '').replace(/\[([^\]]*)\]\([^)]*\)/g, '$1').replace(/[*_`]/g, '').replace(/^[#>\-\s]+/, '').replace(/\s+/g, ' ').trim()).find(p => p.length > 20) ?? ''
const ringkasan = firstPara.length > 180 ? firstPara.slice(0, 177).replace(/\s+\S*$/, '') + '...' : firstPara
const tanggal = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' })
const fm = [
  '---',
  `judul: ${judul}`,
  `topik: ${topik.join(', ')}`,
  `penulis: ${penulis}`,
  tautan && `tautan: ${tautan}`,
  `foto: ${foto}`,
  `tanggal: ${tanggal}`,
  wilayah && `wilayah: ${wilayah}`,
  ringkasan && `ringkasan: ${ringkasan.replace(/\n/g, ' ')}`,
  cover && `gambar: ${cover}`,
  sumber && `sumber: ${sumber}`,
  '---', '',
].filter(Boolean).join('\n')
fs.mkdirSync('src/content/cerita', { recursive: true })
fs.writeFileSync(outMd, fm + '\n' + isi.trim() + '\n')
console.log(`Ditambahkan: ${outMd} (${count} gambar)`)
if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `slug=${slug}\n`)
