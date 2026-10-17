// Mengoptimalkan gambar sumber di assets-src/ menjadi AVIF + WebP berbagai lebar di src/assets/images/.
import fs from 'node:fs'
import sharp from 'sharp'

const OUT = 'src/assets/images'
const IMAGES = [
  { file: 'hero-forest-night', widths: [480, 960, 1600, 2400] },
  { file: 'embers-closeup', widths: [480, 960, 1440, 2160] },
  { file: 'grass-fire-smoke', widths: [480, 960, 1600, 2400] },
  { file: 'firefighters-manggala', ext: 'webp', widths: [480, 960, 1024] },
  { file: 'firefighters-silhouette', ext: 'webp', widths: [480, 960, 1600] },
  { file: 'wildfire-1', ext: 'avif', widths: [480, 960, 1600, 2400] },
  { file: 'wildfire-2', widths: [480, 960, 1500] },
  { file: 'wildfire-3', widths: [480, 960, 1360] },
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


// foto pengembang: dipotong persegi 1:1 (wajah dan boneka), lebar 360 dan 720
{
  const crop = sharp('assets-src/developer.webp').extract({ left: 0, top: 330, width: 720, height: 720 })
  for (const w of [360, 720]) {
    await crop.clone().resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(`${OUT}/developer-${w}.avif`)
    await crop.clone().resize({ width: w }).webp({ quality: 80 }).toFile(`${OUT}/developer-${w}.webp`)
  }
  console.log('ok developer')
}

// ilustrasi pengembang (sisi belakang kartu balik di halaman Tentang): persegi, lebar 360 dan 720
{
  const art = sharp('assets-src/developer-art.jpg')
  for (const w of [360, 720]) {
    await art.clone().resize({ width: w }).avif({ quality: 55, effort: 4 }).toFile(`${OUT}/developer-art-${w}.avif`)
    await art.clone().resize({ width: w }).webp({ quality: 82 }).toFile(`${OUT}/developer-art-${w}.webp`)
  }
  console.log('ok developer-art')
}
