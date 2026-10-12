// Pasca-build: membuat gambar Open Graph 1200x630 per kabupaten dan HTML statis per rute
// (dengan meta og:image) supaya tautan punya pratinjau di X/Threads. Jalan otomatis setelah `npm run build`.
// Atur alamat publik lewat VITE_SITE_URL di .env (juga dipakai tautan bagikan di aplikasi).
import fs from 'node:fs'
import path from 'node:path'
import satori from 'satori'
import { Resvg } from '@resvg/resvg-js'
import sharp from 'sharp'

try { process.loadEnvFile('.env') } catch { /* .env opsional */ }
const SITE = (process.env.VITE_SITE_URL || 'http://localhost:4173').replace(/\/+$/, '')
if (!process.env.VITE_SITE_URL) console.warn(`[og] VITE_SITE_URL belum diatur. og:image memakai ${SITE}. Atur di .env sebelum deploy.`)

const DIST = 'dist'
if (!fs.existsSync(path.join(DIST, 'index.html'))) { console.error('[og] dist/index.html tidak ada. Jalankan vite build dulu.'); process.exit(1) }

const meta = JSON.parse(fs.readFileSync('public/data/meta.json', 'utf8'))
const kabsOnly: any[] = JSON.parse(fs.readFileSync('public/data/kabupaten.json', 'utf8'))
// entri gabungan seluruh Kalimantan, sama seperti buildRegion di src/lib/data.ts
const kabs: any[] = [...kabsOnly, { slug: 'kalimantan', name: 'Kalimantan', provinceName: 'Lima provinsi', total2026: kabsOnly.reduce((a, k) => a + k.total2026, 0) }]
const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(Math.round(n))
const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
const dateLabel = (iso: string) => { const [y, m, d] = iso.split('-').map(Number); return `${d} ${MONTHS[m - 1]} ${y}` }

const font = (f: string) => fs.readFileSync(f)
const fonts: any[] = [
  { name: 'Grotesk', data: font('node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-800-normal.woff'), weight: 800, style: 'normal' },
  { name: 'Grotesk', data: font('node_modules/@fontsource/schibsted-grotesk/files/schibsted-grotesk-latin-500-normal.woff'), weight: 500, style: 'normal' },
]

// latar: foto hero dengan overlay gelap, dibuat sekali
const bgPng = await sharp('src/assets/images/hero-forest-night-1600.webp')
  .resize(1200, 630, { fit: 'cover', position: 'attention' })
  .composite([{ input: Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#0C0A09" stop-opacity="0.96"/><stop offset="0.65" stop-color="#0C0A09" stop-opacity="0.78"/><stop offset="1" stop-color="#0C0A09" stop-opacity="0.55"/></linearGradient></defs><rect width="1200" height="630" fill="url(#g)"/></svg>') }])
  .png().toBuffer()
const bg = 'data:image/png;base64,' + bgPng.toString('base64')

type N = any
const h = (type: string, style: Record<string, any>, ...children: any[]): N => ({ type, props: { style: { display: 'flex', ...style }, children: children.length === 1 ? children[0] : children } })
const txt = (style: Record<string, any>, s: string) => h('div', style, s)

function tree(opts: { kicker: string; title: string; big?: string; sub?: string; foot: string }): N {
  return h('div', { width: 1200, height: 630, position: 'relative', flexDirection: 'column', color: '#F5F5F4', fontFamily: 'Grotesk' },
    { type: 'img', props: { src: bg, width: 1200, height: 630, style: { position: 'absolute', left: 0, top: 0 } } },
    meta.isSample ? h('div', { width: 1200, height: 44, background: '#F97316', color: '#0C0A09', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, position: 'absolute', left: 0, top: 0 }, 'DATA CONTOH. Angka bersifat fiktif, hanya untuk pengujian tampilan.') : h('div', {}),
    h('div', { position: 'absolute', left: 0, top: 86, flexDirection: 'column', padding: '0 72px', width: 1200, height: 500, justifyContent: 'space-between' },
      h('div', { flexDirection: 'column' },
        txt({ fontSize: 30, fontWeight: 500, color: '#D6D3D1' }, opts.kicker),
        h('div', { fontSize: opts.title.length > 14 ? 92 : 112, fontWeight: 800, letterSpacing: -4, lineHeight: 1.02, marginTop: 6 }, opts.title, h('div', { color: '#F97316' }, '.')),
        opts.big ? h('div', { alignItems: 'baseline', marginTop: 22 },
          h('div', { fontSize: 150, fontWeight: 800, letterSpacing: -6, lineHeight: 1 }, opts.big),
          h('div', { fontSize: 32, fontWeight: 500, color: '#D6D3D1', marginLeft: 22 }, opts.sub ?? '')) : h('div', {}),
      ),
      h('div', { width: 1056, justifyContent: 'space-between', alignItems: 'flex-end', fontSize: 22, color: '#D6D3D1', fontWeight: 500 },
        txt({ maxWidth: 640 }, opts.foot),
        h('div', { fontSize: 30, fontWeight: 800, color: '#F5F5F4' }, 'Visualize Karhutla', h('div', { color: '#F97316' }, '.')),
      ),
    ),
  )
}

async function png(node: N): Promise<Buffer> {
  const svg = await satori(node, { width: 1200, height: 630, fonts })
  const raw = new Resvg(svg, { fitTo: { mode: 'width', value: 1200 } }).render().asPng()
  return sharp(raw).jpeg({ quality: 84, mozjpeg: true }).toBuffer()
}

const foot = `Data per ${dateLabel(meta.dataDate)}. Sumber: NASA FIRMS, SiPongi Kemenhut. Batas wilayah: geoBoundaries.${meta.isSample ? ' DATA CONTOH.' : ''}`
fs.mkdirSync(path.join(DIST, 'og'), { recursive: true })

console.log(`[og] membuat ${kabs.length + 1} gambar...`)
fs.writeFileSync(path.join(DIST, 'og', 'default.jpg'), await png(tree({ kicker: 'Karhutla Kalimantan 2026', title: 'Setahun di balik asap', foot })))
for (const k of kabs) {
  const out = await png(tree({ kicker: `Karhutla Wrapped 2026, ${k.provinceName}`, title: k.name, big: fmt(k.total2026), sub: 'titik panas sejak 1 Januari 2026', foot }))
  fs.writeFileSync(path.join(DIST, 'og', `${k.slug}.jpg`), out)
}

// HTML statis per rute
const base = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8')
const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
function page(o: { title: string; desc: string; image: string; url: string }) {
  let html = base
  html = html.replace(/<title>.*?<\/title>/, `<title>${esc(o.title)}</title>`)
  html = html.replace(/<meta name="description"[^>]*>/, `<meta name="description" content="${esc(o.desc)}" />`)
  html = html.replace(/<meta property="og:(title|description|type|image|url)"[^>]*>\s*/g, '').replace(/<meta name="twitter:[^>]*>\s*/g, '')
  const tags = [
    ['property', 'og:title', o.title], ['property', 'og:description', o.desc], ['property', 'og:image', o.image], ['property', 'og:image:width', '1200'], ['property', 'og:image:height', '630'],
    ['property', 'og:image:alt', o.title], ['property', 'og:url', o.url], ['property', 'og:locale', 'id_ID'],
    ['name', 'twitter:card', 'summary_large_image'], ['name', 'twitter:title', o.title], ['name', 'twitter:description', o.desc], ['name', 'twitter:image', o.image],
  ].map(([a, b, c]) => `    <meta ${a}="${b}" content="${esc(c)}" />`).join('\n')
  return html.replace('</head>', `${tags}\n    <link rel="canonical" href="${esc(o.url)}" />\n  </head>`)
}
const write = (rel: string, html: string) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html) }
const sampleNote = meta.isSample ? ' (DATA CONTOH)' : ''
const defaults = { desc: `Peta titik panas dan ringkasan Karhutla Wrapped per kabupaten/kota di Kalimantan tahun 2026${sampleNote}. Sumber data: NASA FIRMS dan SiPongi Kemenhut.`, image: `${SITE}/og/default.jpg` }
write('index.html', page({ title: 'Visualize Karhutla', ...defaults, url: SITE + '/' }))
for (const [route, title] of [['peta', 'Peta titik panas | Visualize Karhutla'], ['wrapped', 'Karhutla Wrapped 2026 | Visualize Karhutla'], ['tentang', 'Tentang data | Visualize Karhutla'], ['kontribusi', 'Kontribusi | Visualize Karhutla']])
  write(`${route}/index.html`, page({ title, ...defaults, url: `${SITE}/${route}` }))
for (const k of kabs) {
  write(`wrapped/${k.slug}/index.html`, page({
    title: `${k.name} | Karhutla Wrapped 2026`,
    desc: `${k.name}, ${k.provinceName}: ${fmt(k.total2026)} titik panas sejak 1 Januari 2026${sampleNote}. Ringkasan lengkap dalam tujuh layar.`,
    image: `${SITE}/og/${k.slug}.jpg`, url: `${SITE}/wrapped/${k.slug}`,
  }))
}
console.log(`[og] selesai: ${kabs.length} halaman Wrapped, og:image ${SITE}/og/<slug>.jpg`)
