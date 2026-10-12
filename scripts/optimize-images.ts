// Mengoptimalkan gambar sumber di assets-src/ menjadi AVIF + WebP berbagai lebar di src/assets/images/.
import fs from 'node:fs'
import sharp from 'sharp'

const OUT = 'src/assets/images'
const IMAGES = [
  { file: 'hero-forest-night', widths: [480, 960, 1600, 2400] },
  { file: 'embers-closeup', widths: [480, 960, 1440] },
  { file: 'grass-fire-smoke', widths: [480, 960, 1600] },
  { file: 'firefighters-manggala', ext: 'webp', widths: [480, 960] },
  { file: 'firefighters-silhouette', ext: 'webp', widths: [480, 960, 1600] },
]
fs.mkdirSync(OUT, { recursive: true })
for (const img of IMAGES) {
  const src = `assets-src/${img.file}.${(img as { ext?: string }).ext ?? 'jpg'}`
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

// siluet hutan hangus: ilustrasi hitam-putih dijadikan alfa (putih = transparan), hitam pekat dengan tepi halus
{
  const src = 'assets-src/burnt-forest-bw.avif'
  const { data, info } = await sharp(src).resize({ width: 1800 }).greyscale().raw().toBuffer({ resolveWithObject: true })
  const rgba = Buffer.alloc(info.width * info.height * 4)
  for (let i = 0; i < data.length; i++) {
    const a = Math.max(0, Math.min(255, Math.round((235 - data[i]) * 1.45)))
    rgba[i * 4] = 12; rgba[i * 4 + 1] = 10; rgba[i * 4 + 2] = 9; rgba[i * 4 + 3] = a
  }
  const base = sharp(rgba, { raw: { width: info.width, height: info.height, channels: 4 } })
  for (const w of [800, 1800]) {
    await base.clone().resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(`${OUT}/burnt-forest-${w}.avif`)
    await base.clone().resize({ width: w }).webp({ quality: 78, alphaQuality: 90 }).toFile(`${OUT}/burnt-forest-${w}.webp`)
  }
  console.log('ok burnt-forest')
}
