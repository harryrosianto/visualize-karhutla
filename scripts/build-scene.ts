// Menyusun lapisan parallax hero dari aset buatan pemilik proyek (assets-src/scene):
// lima lapisan lanskap + siluet pohon (pinus, pohon mati, tunggul) yang ditanam di punggung bukit dan diwarnai
// sesuai lapisannya, orangutan yang bertengger di tunggul, dan burung. Hasil: WebP di src/assets/scene/.
// Pakai: npx tsx scripts/build-scene.ts [--preview]
import fs from 'node:fs'
import sharp, { type OverlayOptions } from 'sharp'

const SRC = 'assets-src/scene'
const OUT = 'src/assets/scene'
const LW = 3500, LH = 1038
fs.mkdirSync(OUT, { recursive: true })

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const PINES = ['pine-tree-silhouette-3-147x300', 'pine-tree-silhouette-4-110x300', 'tree-silhouette-9-231x300', 'tree-silhouette-10-130x300']
const DEAD = ['dead-tree-silhouette-1-421x1024', 'dead-tree-silhouette-11-285x1024', 'dead-tree-silhouette-2-393x1024', 'dead-tree-silhouette-3-649x1024', 'dead-tree-silhouette-4-696x1024']
const SNAG = 'dead-tree-silhouette-6' // tunggul hangus bercabang pendek, tempat orangutan

interface Plan { name: string; file: string; seed: number; items: { kind: 'pine' | 'dead'; count: number; h: [number, number] }[] }
const PLANS: Plan[] = [
  { name: 'l1', file: 'parallax3.png', seed: 3, items: [{ kind: 'pine', count: 10, h: [34, 62] }] },
  { name: 'l2', file: 'parallax4.png', seed: 4, items: [{ kind: 'pine', count: 11, h: [50, 96] }, { kind: 'dead', count: 2, h: [70, 100] }] },
  { name: 'l3', file: 'parallax5.png', seed: 5, items: [{ kind: 'pine', count: 12, h: [90, 170] }, { kind: 'dead', count: 4, h: [130, 190] }] },
  { name: 'l4', file: 'parallax6.png', seed: 6, items: [{ kind: 'pine', count: 5, h: [190, 300] }, { kind: 'dead', count: 3, h: [240, 340] }] },
  { name: 'l5', file: 'parallax8.png', seed: 8, items: [{ kind: 'dead', count: 3, h: [520, 700] }] },
]

async function layerInfo(file: string) {
  const { data, info } = await sharp(`${SRC}/${file}`).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
  const w = info.width, h = info.height
  const top = new Int32Array(w).fill(-1)
  for (let x = 0; x < w; x++) for (let y = 0; y < h; y++) if (data[(y * w + x) * 4 + 3] > 128) { top[x] = y; break }
  // warna dasar lapisan: rata-rata piksel opak di baris dekat dasar
  let r = 0, g = 0, b = 0, n = 0
  for (let x = 0; x < w; x += 7) { const i = ((h - 6) * w + x) * 4; if (data[i + 3] > 200) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++ } }
  const color = { r: Math.round(r / n), g: Math.round(g / n), b: Math.round(b / n) }
  // tanah = titik terendah puncak siluet dalam jendela +-24 px, supaya pohon kecil bawaan tidak jadi pijakan
  const ground = (x: number) => {
    let m = -1
    for (let k = -24; k <= 24; k += 4) { const t = top[Math.min(w - 1, Math.max(0, x + k))]; if (t < 0) return -1; m = Math.max(m, t) }
    return m
  }
  return { w, h, top, color, ground }
}

/** Siluet hitam beralpha diwarnai dengan warna lapisan. */
async function tinted(file: string, height: number, c: { r: number; g: number; b: number }, flip = false) {
  let img = sharp(`${SRC}/${file.includes(".") ? file : file + ".png"}`).resize({ height: Math.round(height) })
  if (flip) img = img.flop()
  const png = await img.png().toBuffer()
  const m = await sharp(png).metadata()
  const out = await sharp({ create: { width: m.width!, height: m.height!, channels: 4, background: { ...c, alpha: 1 } } })
    .composite([{ input: png, blend: 'dest-in' }]).png().toBuffer()
  return { buf: out, w: m.width!, h: m.height! }
}

async function main() {
  const preview = process.argv.includes('--preview')
  for (const plan of PLANS) {
    const info = await layerInfo(plan.file)
    const r = rng(plan.seed * 101)
    const comps: OverlayOptions[] = []
    const used: number[] = []
    for (const it of plan.items) {
      let placed = 0, tries = 0
      while (placed < it.count && tries++ < 400) {
        const x = Math.floor(120 + r() * (LW - 240))
        const gy = info.ground(x)
        if (gy < 0 || gy > LH - 20) continue
        const h = it.h[0] + r() * (it.h[1] - it.h[0])
        if (used.some(u => Math.abs(u - x) < h * 0.28)) continue
        const file = it.kind === 'pine' ? PINES[Math.floor(r() * PINES.length)] : DEAD[Math.floor(r() * DEAD.length)]
        const t = await tinted(file, h, info.color, r() > 0.5)
        comps.push({ input: t.buf, left: Math.round(x - t.w / 2), top: Math.round(gy + h * 0.025 - t.h) })
        used.push(x); placed++
      }
    }
    if (plan.name === 'l5') {
      // tunggul hangus besar di tengah, dan orangutan bertengger di dahannya
      const sx = 1930, sh = 760
      const gy = info.ground(sx)
      const snag = await tinted(`${SNAG}.png`, sh, info.color)
      const sleft = Math.round(sx - snag.w / 2), stop = Math.round(gy + 8 - snag.h)
      comps.push({ input: snag.buf, left: sleft, top: stop })
      const oh = 250
      const ou = await tinted('orangutan.webp', oh, info.color)
      comps.push({ input: ou.buf, left: Math.round(sx + snag.w * 0.1), top: Math.round(stop + snag.h * 0.43 - ou.h * 0.5) })
    }
    let base = await sharp(`${SRC}/${plan.file}`).ensureAlpha().png().toBuffer()
    if (plan.name === 'l4') {
      // aset ini punya tepi kiri lurus berbentuk kotak; pudarkan alfa di sekitar tepi agar menyatu dengan lapisan belakang
      const { data, info } = await sharp(base).raw().toBuffer({ resolveWithObject: true })
      let first = info.width
      for (let x = 0; x < info.width && first === info.width; x++) for (let y = 0; y < info.height; y += 6) if (data[(y * info.width + x) * 4 + 3] > 128) { first = x; break }
      const ramp = 650
      for (let x = first; x < Math.min(info.width, first + ramp); x++) {
        const k = (x - first) / ramp
        for (let y = 0; y < info.height; y++) data[(y * info.width + x) * 4 + 3] = Math.round(data[(y * info.width + x) * 4 + 3] * k * k)
      }
      base = await sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).png().toBuffer()
    }
    const composed = await sharp(base).composite(comps).png().toBuffer()
    for (const w of [2200, 3000]) {
      const r = sharp(composed).resize({ width: w })
      await r.clone().avif({ quality: 52, effort: 6 }).toFile(`${OUT}/${plan.name}-${w}.avif`)
      await r.clone().webp({ quality: 72, alphaQuality: 85, effort: 6 }).toFile(`${OUT}/${plan.name}-${w}.webp`)
    }
    if (preview) await sharp(composed).resize({ width: 1750 }).png().toFile(`${OUT}/_preview-${plan.name}.png`)
    console.log(plan.name, 'warna', info.color, 'pohon', comps.length)
  }
  // burung: siluet gelap berwarna karat agar kontras dengan langit jingga
  const birds = await tinted('fly-bird.png', 360, { r: 60, g: 22, b: 10 })
  await sharp(birds.buf).resize({ width: 520 }).webp({ quality: 85, alphaQuality: 95 }).toFile(`${OUT}/birds.webp`)
  console.log('selesai')
}
main()
