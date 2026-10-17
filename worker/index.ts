// Worker Cloudflare: melayani situs statis (aset) dan menerima kiriman karya warga di POST /api/submit.
// Alurnya: periksa captcha dan berkas -> simpan gambar ke repositori unggahan terpisah -> buat isu berlabel "templat"
// pada repositori utama dengan token milik pemelihara. Penayangan tetap menunggu label "setujui-templat" dari pemelihara.

interface Env {
  ASSETS: { fetch(request: Request): Promise<Response> }
  /** secret: token GitHub fine-grained (Issues: RW pada repositori utama, Contents: RW pada repositori unggahan) */
  GITHUB_TOKEN: string
  /** secret: kunci rahasia Cloudflare Turnstile */
  TURNSTILE_SECRET: string
  ISSUES_REPO: string
  UPLOADS_REPO: string
  UPLOADS_BRANCH?: string
  ALLOWED_ORIGINS?: string
  /** hanya untuk pengujian lokal */
  GITHUB_API?: string
  TURNSTILE_VERIFY_URL?: string
}

const MAX_FILES = 6
const MAX_FILE_BYTES = 5 * 1024 * 1024
const MAX_BODY_BYTES = MAX_FILES * MAX_FILE_BYTES + 256 * 1024

class HttpError extends Error {
  constructor(public status: number, public code: string, message: string) { super(message) }
}

const json = (data: unknown, status = 200, headers: HeadersInit = {}) =>
  new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers } })

function allowedOrigins(env: Env, self: string) {
  return new Set([self, ...(env.ALLOWED_ORIGINS ?? '').split(',').map(s => s.trim()).filter(Boolean)])
}

function corsHeaders(origin: string | null, allowed: Set<string>): Record<string, string> {
  if (!origin || !allowed.has(origin)) return {}
  return { 'Access-Control-Allow-Origin': origin, 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Max-Age': '86400', Vary: 'Origin' }
}

/** Deteksi jenis gambar dari tanda tangan berkas (bukan dari nama atau tipe yang dikirim klien). */
function sniff(b: Uint8Array): { ext: string; mime: string } | null {
  if (b.length < 12) return null
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return { ext: 'png', mime: 'image/png' }
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { ext: 'jpg', mime: 'image/jpeg' }
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38) return { ext: 'gif', mime: 'image/gif' }
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { ext: 'webp', mime: 'image/webp' }
  return null
}

/** Bersihkan teks bebas: tanpa kendali/HTML, panjang dibatasi, dan @ atau #angka dinetralkan agar tidak memicu notifikasi/rujukan di GitHub. */
const clean = (s: string, max: number) =>
  s.replace(/[\u0000-\u001f\u007f<>`]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max).replace(/@/g, '@​').replace(/#(?=\d)/g, '#​')

function toBase64(bytes: Uint8Array) {
  let bin = ''
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
  return btoa(bin)
}

async function gh(env: Env, method: string, path: string, body?: unknown) {
  const res = await fetch(`${env.GITHUB_API ?? 'https://api.github.com'}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
      'User-Agent': 'visualize-karhutla-submit',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!res.ok) throw new HttpError(502, 'github', `GitHub menolak permintaan (${res.status}).`)
  return res.json() as Promise<any>
}

async function verifyCaptcha(env: Env, token: string, ip: string | null) {
  if (!token) throw new HttpError(400, 'captcha', 'Verifikasi captcha belum selesai. Silakan coba lagi.')
  const body = new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: token })
  if (ip) body.set('remoteip', ip)
  const res = await fetch(env.TURNSTILE_VERIFY_URL ?? 'https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body })
  const out = (await res.json().catch(() => ({}))) as { success?: boolean }
  if (!out.success) throw new HttpError(400, 'captcha', 'Verifikasi captcha gagal. Muat ulang halaman lalu coba lagi.')
}

async function handleSubmit(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin')
  const allowed = allowedOrigins(env, new URL(request.url).origin)
  const cors = corsHeaders(origin, allowed)
  try {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST') throw new HttpError(405, 'method', 'Metode tidak didukung.')
    if (origin && !allowed.has(origin)) throw new HttpError(403, 'origin', 'Asal permintaan tidak diizinkan.')
    if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET) throw new HttpError(503, 'config', 'Layanan unggah belum dikonfigurasi.')
    const len = Number(request.headers.get('Content-Length') ?? 0)
    if (len > MAX_BODY_BYTES) throw new HttpError(413, 'size', 'Ukuran kiriman terlalu besar.')

    let form: FormData
    try { form = await request.formData() } catch { throw new HttpError(400, 'form', 'Formulir tidak dapat dibaca.') }
    // kolom jebakan untuk bot: manusia tidak melihatnya, jadi harus kosong
    if (String(form.get('website') ?? '').trim()) return json({ ok: true }, 200, cors)

    await verifyCaptcha(env, String(form.get('cf-turnstile-response') ?? ''), request.headers.get('CF-Connecting-IP'))

    const judul = clean(String(form.get('judul') ?? ''), 80)
    const kreator = clean(String(form.get('kreator') ?? ''), 60)
    let tautan = String(form.get('tautan') ?? '').trim()
    if (tautan && !/^https:\/\/[^\s<>"'`]{3,200}$/i.test(tautan)) throw new HttpError(400, 'tautan', 'Tautan harus diawali https:// dan tidak berisi spasi.')
    if (!judul || !kreator) throw new HttpError(400, 'field', 'Judul dan nama kreator wajib diisi.')
    if (form.get('hak') !== 'on' || form.get('izin') !== 'on') throw new HttpError(400, 'consent', 'Kedua pernyataan wajib dicentang.')
    if (/[​-‏]/.test(tautan)) tautan = ''

    const files = form.getAll('gambar').filter((f): f is File => typeof f !== 'string' && (f as File).size > 0)
    if (files.length < 1) throw new HttpError(400, 'files', 'Unggah minimal satu gambar.')
    if (files.length > MAX_FILES) throw new HttpError(400, 'files', `Maksimal ${MAX_FILES} gambar per kiriman.`)

    const prepared: { bytes: Uint8Array; ext: string }[] = []
    for (const f of files) {
      if (f.size > MAX_FILE_BYTES) throw new HttpError(413, 'size', 'Setiap gambar maksimal 5 MB.')
      const bytes = new Uint8Array(await f.arrayBuffer())
      const kind = sniff(bytes)
      if (!kind) throw new HttpError(415, 'type', 'Format gambar tidak didukung. Gunakan PNG, JPG, WebP, atau GIF.')
      prepared.push({ bytes, ext: kind.ext })
    }

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const rand = crypto.randomUUID().slice(0, 8)
    const branch = env.UPLOADS_BRANCH || 'main'
    const urls: string[] = []
    for (const [i, p] of prepared.entries()) {
      const path = `uploads/${stamp}-${rand}-${i + 1}.${p.ext}`
      await gh(env, 'PUT', `/repos/${env.UPLOADS_REPO}/contents/${path}`, { message: `Unggahan ${stamp}-${rand}-${i + 1}`, content: toBase64(p.bytes), branch })
      urls.push(`https://raw.githubusercontent.com/${env.UPLOADS_REPO}/${branch}/${path}`)
    }

    const body = [
      '### Judul templat', '', judul, '',
      '### Nama kreator', '', kreator, '',
      '### Tautan portofolio atau akun media sosial', '', tautan || '_No response_', '',
      '### Gambar', '', ...urls.map((u, i) => `![gambar-${i + 1}](${u})`), '',
      '### Pernyataan', '',
      '- [X] Karya ini buatan saya sendiri (atau saya berhak penuh menyumbangkannya), dan tidak memuat merek, karya, atau wajah orang lain tanpa izin.',
      '- [X] Saya mengizinkan pengunjung memakai, mengunduh, dan membagikan karya ini secara gratis untuk kampanye kesadaran karhutla dengan mencantumkan nama saya sebagai kredit.', '',
      '### Asal kiriman', '', '_Dikirim lewat formulir di situs (tanpa akun GitHub). Gambar tersimpan pada repositori unggahan terpisah._',
    ].join('\n')
    await gh(env, 'POST', `/repos/${env.ISSUES_REPO}/issues`, { title: `[Templat] ${judul}`, body, labels: ['templat'] })
    return json({ ok: true }, 200, cors)
  } catch (e) {
    if (e instanceof HttpError) return json({ ok: false, error: e.code, message: e.message }, e.status, cors)
    return json({ ok: false, error: 'internal', message: 'Terjadi kesalahan pada server. Silakan coba lagi.' }, 500, cors)
  }
}

const CERITA_MAX_TOPIK = 5
const CERITA_MAX_FOTO_BYTES = 1024 * 1024
const CERITA_MAX_IMAGES = 8
const CERITA_MAX_IMAGE_BYTES = 3 * 1024 * 1024
const CERITA_MAX_CHARS = 40000

/** Bersihkan isi Markdown dari penulis: HTML mentah dinetralkan, hanya gambar hasil unggahan (img:N) yang dipertahankan, dan @ dinetralkan agar tidak memicu notifikasi. */
function cleanMarkdown(src: string, imageCount: number) {
  let md = src.replace(/\r\n?/g, '\n').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
  md = md.replace(/<(?=[a-zA-Z!/?])/g, '&lt;')
  md = md.replace(/!\[([^\]]*)\]\(([^)\s]*)(?:\s+"[^"]*")?\)/g, (_m, alt: string, url: string) => {
    const k = /^img:(\d+)$/.exec(url)
    if (k && Number(k[1]) >= 1 && Number(k[1]) <= imageCount) return `![${alt.replace(/[\[\]]/g, '')}](${url})`
    return alt
  })
  return md.replace(/@/g, '@​')
}

async function handleCerita(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin')
  const allowed = allowedOrigins(env, new URL(request.url).origin)
  const cors = corsHeaders(origin, allowed)
  try {
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors })
    if (request.method !== 'POST') throw new HttpError(405, 'method', 'Metode tidak didukung.')
    if (origin && !allowed.has(origin)) throw new HttpError(403, 'origin', 'Asal permintaan tidak diizinkan.')
    if (!env.GITHUB_TOKEN || !env.TURNSTILE_SECRET) throw new HttpError(503, 'config', 'Layanan unggah belum dikonfigurasi.')
    const len = Number(request.headers.get('Content-Length') ?? 0)
    if (len > CERITA_MAX_IMAGES * CERITA_MAX_IMAGE_BYTES + 400 * 1024) throw new HttpError(413, 'size', 'Ukuran kiriman terlalu besar.')

    let form: FormData
    try { form = await request.formData() } catch { throw new HttpError(400, 'form', 'Formulir tidak dapat dibaca.') }
    if (String(form.get('website') ?? '').trim()) return json({ ok: true }, 200, cors)
    await verifyCaptcha(env, String(form.get('cf-turnstile-response') ?? ''), request.headers.get('CF-Connecting-IP'))

    const judul = clean(String(form.get('judul') ?? ''), 120)
    const penulis = clean(String(form.get('penulis') ?? ''), 60)
    const wilayah = clean(String(form.get('wilayah') ?? ''), 80)
    let tautanPenulis = String(form.get('tautan_penulis') ?? '').trim()
    if (tautanPenulis && !/^https:\/\/[^\s<>"'`]{3,200}$/i.test(tautanPenulis)) throw new HttpError(400, 'tautan', 'Tautan portofolio harus diawali https:// dan tidak berisi spasi.')
    const topikRaw = String(form.get('topik') ?? '').split(',').map(t => t.replace(/[^\p{L}\p{N}\s&-]/gu, '').replace(/\s+/g, ' ').trim().slice(0, 30).trim()).filter(Boolean)
    const topik = [...new Map(topikRaw.map(t => [t.toLowerCase(), t.charAt(0).toUpperCase() + t.slice(1)])).values()].slice(0, CERITA_MAX_TOPIK)
    if (topik.length < 1) throw new HttpError(400, 'topik', 'Pilih atau buat minimal satu topik.')
    const avatarN = Number(form.get('avatar'))
    const avatar = Number.isInteger(avatarN) && avatarN >= 1 && avatarN <= 9 ? avatarN : 0
    let sumber = String(form.get('sumber') ?? '').trim()
    if (sumber && !/^https:\/\/[^\s<>"'`]{3,300}$/i.test(sumber)) throw new HttpError(400, 'sumber', 'Tautan sumber harus diawali https:// dan tidak berisi spasi.')
    if (judul.length < 5 || !penulis) throw new HttpError(400, 'field', 'Judul (minimal 5 huruf) dan nama penulis wajib diisi.')
    if (form.get('hak') !== 'on' || form.get('izin') !== 'on') throw new HttpError(400, 'consent', 'Kedua pernyataan wajib dicentang.')
    const raw = String(form.get('isi') ?? '')
    if (raw.length > CERITA_MAX_CHARS) throw new HttpError(413, 'size', 'Tulisan terlalu panjang (maksimal 40.000 karakter).')
    if (raw.trim().split(/\s+/).length < 30) throw new HttpError(400, 'isi', 'Tulisan terlalu singkat (minimal 30 kata).')

    const files = form.getAll('gambar').filter((f): f is File => typeof f !== 'string' && (f as File).size > 0)
    if (files.length > CERITA_MAX_IMAGES) throw new HttpError(400, 'files', `Maksimal ${CERITA_MAX_IMAGES} gambar per tulisan.`)
    const prepared: { bytes: Uint8Array; ext: string }[] = []
    for (const f of files) {
      if (f.size > CERITA_MAX_IMAGE_BYTES) throw new HttpError(413, 'size', 'Setiap gambar maksimal 3 MB.')
      const bytes = new Uint8Array(await f.arrayBuffer())
      const kind = sniff(bytes)
      if (!kind) throw new HttpError(415, 'type', 'Format gambar tidak didukung. Gunakan PNG, JPG, WebP, atau GIF.')
      prepared.push({ bytes, ext: kind.ext })
    }

    const fotoFile = form.get('foto')
    let foto: { bytes: Uint8Array; ext: string } | null = null
    if (typeof fotoFile !== 'string' && fotoFile && (fotoFile as File).size > 0) {
      const ff = fotoFile as File
      if (ff.size > CERITA_MAX_FOTO_BYTES) throw new HttpError(413, 'size', 'Foto profil maksimal 1 MB.')
      const bytes = new Uint8Array(await ff.arrayBuffer())
      const kind = sniff(bytes)
      if (!kind || kind.ext === 'gif') throw new HttpError(415, 'type', 'Foto profil harus PNG, JPG, atau WebP.')
      foto = { bytes, ext: kind.ext }
    }

    const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const rand = crypto.randomUUID().slice(0, 8)
    const branch = env.UPLOADS_BRANCH || 'main'
    const urls: string[] = []
    let fotoUrl = ''
    if (foto) {
      const path = `cerita/${stamp}-${rand}-foto.${foto.ext}`
      await gh(env, 'PUT', `/repos/${env.UPLOADS_REPO}/contents/${path}`, { message: `Foto penulis ${stamp}-${rand}`, content: toBase64(foto.bytes), branch })
      fotoUrl = `https://raw.githubusercontent.com/${env.UPLOADS_REPO}/${branch}/${path}`
    }
    for (const [i, p] of prepared.entries()) {
      const path = `cerita/${stamp}-${rand}-${i + 1}.${p.ext}`
      await gh(env, 'PUT', `/repos/${env.UPLOADS_REPO}/contents/${path}`, { message: `Gambar cerita ${stamp}-${rand}-${i + 1}`, content: toBase64(p.bytes), branch })
      urls.push(`https://raw.githubusercontent.com/${env.UPLOADS_REPO}/${branch}/${path}`)
    }
    let isi = cleanMarkdown(raw, prepared.length)
    isi = isi.replace(/\(img:(\d+)\)/g, (_m, n: string) => `(${urls[Number(n) - 1]})`)
    if (/^https?:\/\//i.test(sumber) === false) sumber = ''
    if (/[\u200b-\u200f]/.test(tautanPenulis)) tautanPenulis = ''

    const body = [
      '### Topik', '', topik.join(', '), '',
      '### Judul', '', judul, '',
      '### Nama penulis', '', penulis, '',
      '### Tautan penulis (portofolio atau media sosial)', '', tautanPenulis || '_No response_', '',
      '### Foto profil', '', fotoUrl ? `![foto-penulis](${fotoUrl})` : (avatar ? `Avatar bawaan: ${avatar}` : '_No response_'), '',
      '### Wilayah terkait', '', wilayah || '_No response_', '',
      '### Tautan sumber atau rujukan', '', sumber || '_No response_', '',
      '### Isi tulisan', '', isi, '',
      '### Pernyataan', '',
      '- [X] Tulisan ini karya saya sendiri (atau saya berhak penuh mengirimkannya), dan saya mengizinkan situs memuatnya dengan mencantumkan nama saya.',
      '- [X] Saya tidak mencantumkan data pribadi pihak lain tanpa izin.', '',
      '### Asal kiriman', '', '_Ditulis dan dikirim lewat penyunting di situs (tanpa akun GitHub). Gambar tersimpan pada repositori unggahan terpisah._',
    ].join('\n')
    await gh(env, 'POST', `/repos/${env.ISSUES_REPO}/issues`, { title: `[Cerita] ${judul}`, body, labels: ['cerita'] })
    return json({ ok: true }, 200, cors)
  } catch (e) {
    if (e instanceof HttpError) return json({ ok: false, error: e.code, message: e.message }, e.status, cors)
    return json({ ok: false, error: 'internal', message: 'Terjadi kesalahan pada server. Silakan coba lagi.' }, 500, cors)
  }
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const { pathname } = new URL(request.url)
    if (pathname === '/api/submit') return handleSubmit(request, env)
    if (pathname === '/api/cerita') return handleCerita(request, env)
    return env.ASSETS.fetch(request)
  },
}
