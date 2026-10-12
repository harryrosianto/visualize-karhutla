// Mengoptimalkan gambar sumber di assets-src/ menjadi AVIF + WebP berbagai lebar di src/assets/images/.
import fs from 'node:fs'
import sharp from 'sharp'

const OUT = 'src/assets/images'
const IMAGES = [
  { file: 'hero-forest-night', widths: [480, 960, 1600, 2400] },
  { file: 'embers-closeup', widths: [480, 960, 1440] },
  { file: 'grass-fire-smoke', widths: [480, 960, 1600] },
]
fs.mkdirSync(OUT, { recursive: true })
for (const img of IMAGES) {
  const src = `assets-src/${img.file}.jpg`
  const meta = await sharp(src).metadata()
  for (const w of img.widths) {
    if (w > (meta.width ?? 0)) continue
    const base = sharp(src).resize({ width: w })
    await base.clone().avif({ quality: 50, effort: 4 }).toFile(`${OUT}/${img.file}-${w}.avif`)
    await base.clone().webp({ quality: 72 }).toFile(`${OUT}/${img.file}-${w}.webp`)
  }
  console.log('ok', img.file)
}
// poster hero untuk slot video (JPG, dipakai juga sebagai og fallback)
fs.mkdirSync('public/media', { recursive: true })
await sharp('assets-src/hero-forest-night.jpg').resize({ width: 1600 }).jpeg({ quality: 70, mozjpeg: true }).toFile('public/media/hero-poster.jpg')
