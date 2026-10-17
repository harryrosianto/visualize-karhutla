// Membuat ikon tab browser dari assets-src/favicon-api.jpg: latar putih dibuat transparan, dipangkas, lalu diberi bantalan persegi.
import sharp from 'sharp'

const src = sharp('assets-src/favicon-api.jpg').ensureAlpha()
const { data, info } = await src.raw().toBuffer({ resolveWithObject: true })
// alfa dari kedekatan terhadap putih (tepi halus tanpa halo putih)
for (let i = 0; i < data.length; i += 4) {
  const d = 255 - Math.min(data[i], data[i + 1], data[i + 2])
  const a = Math.max(0, Math.min(255, (d - 6) * 6))
  data[i + 3] = a
}
const cut = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).trim({ threshold: 1 }).png().toBuffer()
const m = await sharp(cut).metadata()
const side = Math.max(m.width!, m.height!)
const pad = Math.round(side * 0.06)
const square = await sharp(cut).extend({
  top: pad + Math.floor((side - m.height!) / 2), bottom: pad + Math.ceil((side - m.height!) / 2),
  left: pad + Math.floor((side - m.width!) / 2), right: pad + Math.ceil((side - m.width!) / 2), background: { r: 0, g: 0, b: 0, alpha: 0 },
}).png().toBuffer()
for (const [name, size] of [['favicon-32.png', 32], ['favicon-192.png', 192]] as const)
  await sharp(square).resize(size, size).png({ compressionLevel: 9 }).toFile(`public/${name}`)
// ikon layar utama iOS: latar gelap, tanpa transparansi
await sharp(square).resize(140, 140).extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#0C0A09' }).flatten({ background: '#0C0A09' }).png().toFile('public/apple-touch-icon.png')
console.log('ok favicon')
