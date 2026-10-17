// Memotong lembar ikon hewan (3x3, src/icon-pp.jpg, desain Freepik) menjadi sembilan foto profil bulat 256x256
// di src/assets/avatars/a1.webp ... a9.webp. Jalankan: npx tsx scripts/build-avatars.ts
import fs from 'node:fs'
import sharp from 'sharp'

const SRC = 'src/icon-pp.jpg'
const OUT = 'src/assets/avatars'
if (!fs.existsSync(SRC)) { console.error(`${SRC} tidak ada`); process.exit(1) }
fs.mkdirSync(OUT, { recursive: true })

const { data, info } = await sharp(SRC).raw().toBuffer({ resolveWithObject: true })
const W = info.width, H = info.height, C = info.channels
const bg = [data[0], data[1], data[2]]
const isBg = (x: number, y: number) => { const i = (y * W + x) * C; return Math.abs(data[i] - bg[0]) < 10 && Math.abs(data[i + 1] - bg[1]) < 10 && Math.abs(data[i + 2] - bg[2]) < 10 }

let n = 0
for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) {
  // cari kotak pembatas lingkaran pada tiap sel (baris teks atribusi di bawah diabaikan)
  const x0 = Math.floor((c * W) / 3), x1 = Math.floor(((c + 1) * W) / 3), y0 = Math.floor((r * H * 0.93) / 3), y1 = Math.floor(((r + 1) * H * 0.93) / 3)
  let minx = 1e9, miny = 1e9, maxx = -1, maxy = -1
  for (let y = y0; y < y1; y += 2) for (let x = x0; x < x1; x += 2) if (!isBg(x, y)) { minx = Math.min(minx, x); maxx = Math.max(maxx, x); miny = Math.min(miny, y); maxy = Math.max(maxy, y) }
  const d = Math.max(maxx - minx, maxy - miny)
  const cx = Math.round((minx + maxx) / 2), cy = Math.round((miny + maxy) / 2)
  const maskSvg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${d}" height="${d}"><circle cx="${d / 2}" cy="${d / 2}" r="${d / 2 - 3}" fill="#fff"/></svg>`)
  n++
  const mask = await sharp(maskSvg).resize(d, d).png().toBuffer()
  const crop = await sharp(SRC).extract({ left: Math.max(0, cx - Math.floor(d / 2)), top: Math.max(0, cy - Math.floor(d / 2)), width: d, height: d }).png().toBuffer()
  const round = await sharp(crop).ensureAlpha().composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer()
  await sharp(round).resize(256, 256).webp({ quality: 88 }).toFile(`${OUT}/a${n}.webp`)
}
console.log(`${n} avatar dibuat di ${OUT}`)
