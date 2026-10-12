// Pembangkit siluet lanskap orisinal berbasis seed untuk adegan parallax hero: punggung bukit dan
// berbagai jenis pohon (pinus, cemara ramping, berdaun lebar, mati, tunggul patah, tumbang, miring, terbakar).
export const W = 1600
export const H = 900

type P = [number, number]

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
type R = () => number

const f1 = (n: number) => n.toFixed(1)
const poly = (pts: P[]) => 'M' + pts.map(([x, y]) => `${f1(x)} ${f1(y)}`).join(' L') + ' Z '

/** Fungsi tinggi punggung bukit: jumlah gelombang sinus acak dengan amplitudo menurun. */
export function ridgeFn(seed: number, base: number, amp: number, detail = 5) {
  const r = rng(seed)
  const waves = Array.from({ length: detail }, (_, i) => ({
    a: 1 / (i + 1) ** 1.15,
    f: (1.2 + i * 1.7 + r() * 1.2) * 2 * Math.PI,
    p: r() * Math.PI * 2,
  }))
  const norm = waves.reduce((s, w) => s + w.a, 0)
  return (x: number) => base - amp * (waves.reduce((s, w) => s + w.a * Math.sin((x / W) * w.f + w.p), 0) / norm)
}

export function ridgePath(y: (x: number) => number, step = 14) {
  let d = `M0 ${H} L0 ${f1(y(0))}`
  for (let x = step; x <= W; x += step) d += ` L${x} ${f1(y(x))}`
  return d + ` L${W} ${H} Z`
}

/* ---------- jenis pohon: tiap fungsi mengembalikan subpath tertutup ---------- */

/** Pinus bertingkat dengan tepi bergerigi. */
function pine(x: number, yb: number, h: number, r: R) {
  const w = h * (0.34 + r() * 0.1), top = yb - h, tiers = 4
  const right: P[] = []
  for (let i = 0; i < tiers; i++) {
    const bottom = top + h * ((i + 1) / tiers) * 0.94, half = (w / 2) * ((i + 1) / tiers)
    right.push([half, bottom], [half * 0.4, bottom - h * 0.012])
  }
  const pts: P[] = [[x, top], ...right.map(([hx, py]) => [x + hx, py] as P), [x + w * 0.05, yb], [x - w * 0.05, yb]]
  for (let i = right.length - 1; i >= 0; i--) pts.push([x - right[i][0], right[i][1]])
  return poly(pts)
}

/** Cemara ramping: banyak tingkat kecil, ujung runcing. */
function spruce(x: number, yb: number, h: number, r: R) {
  const w = h * (0.2 + r() * 0.06), top = yb - h, tiers = 8
  const right: P[] = []
  for (let i = 0; i < tiers; i++) {
    const y = top + h * ((i + 1) / tiers) * 0.95, half = (w / 2) * (0.35 + (0.65 * (i + 1)) / tiers)
    right.push([half, y + h * 0.02], [half * 0.3, y - h * 0.045])
  }
  const pts: P[] = [[x, top], ...right.map(([hx, py]) => [x + hx, py] as P), [x + w * 0.04, yb], [x - w * 0.04, yb]]
  for (let i = right.length - 1; i >= 0; i--) pts.push([x - right[i][0], right[i][1]])
  return poly(pts)
}

/** Pohon berdaun lebar: tajuk bulat bergelombang di atas batang. */
function broadleaf(x: number, yb: number, h: number, r: R) {
  const tw = h * 0.05, cx = x, cy = yb - h * 0.66, rad = h * (0.26 + r() * 0.06)
  const crown: P[] = []
  const n = 16, ph = r() * 6
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2
    const k = 0.84 + 0.2 * Math.sin(a * 3 + ph) + r() * 0.08
    crown.push([cx + Math.cos(a) * rad * 1.05 * k, cy + Math.sin(a) * rad * 0.9 * k])
  }
  return poly([[x - tw, yb], [x - tw * 0.6, cy + rad * 0.3], [x + tw * 0.6, cy + rad * 0.3], [x + tw, yb]]) + poly(crown)
}

/** Batang meruncing dari (x,yb) ke atas dengan kemiringan lean (radian dari vertikal). */
function trunk(x: number, yb: number, h: number, w0: number, w1: number, lean = 0): { d: string; at: (t: number) => P } {
  const tx = x + Math.sin(lean) * h, ty = yb - Math.cos(lean) * h
  const nx = Math.cos(lean), ny = Math.sin(lean)
  const d = poly([[x - nx * w0, yb - ny * w0], [tx - nx * w1, ty - ny * w1], [tx + nx * w1, ty + ny * w1], [x + nx * w0, yb + ny * w0]])
  return { d, at: (t: number) => [x + (tx - x) * t, yb + (ty - yb) * t] }
}

/** Cabang tirus dari titik (x,y), arah ang (radian dari vertikal, + ke kanan), panjang len. */
function branch(x: number, y: number, ang: number, len: number, w: number) {
  const ex = x + Math.sin(ang) * len, ey = y - Math.cos(ang) * len
  const nx = Math.cos(ang), ny = Math.sin(ang)
  return poly([[x - nx * w, y - ny * w], [ex, ey], [x + nx * w, y + ny * w]])
}

/** Pohon mati: batang gundul bercabang tanpa daun. */
function deadTree(x: number, yb: number, h: number, r: R) {
  const lean = (r() - 0.5) * 0.12
  const t = trunk(x, yb, h, h * 0.032, h * 0.008, lean)
  let d = t.d
  const n = 5 + Math.floor(r() * 4)
  for (let i = 0; i < n; i++) {
    const k = 0.3 + (i / n) * 0.62 + r() * 0.05
    const [bx, by] = t.at(k)
    const side = i % 2 ? 1 : -1
    const ang = side * (0.45 + r() * 0.55)
    const len = h * (0.2 + r() * 0.14) * (1 - k * 0.45)
    d += branch(bx, by, ang, len, h * 0.011)
    // ranting pecahan di ujung cabang
    const ex = bx + Math.sin(ang) * len, ey = by - Math.cos(ang) * len
    d += branch(ex, ey, ang + side * 0.5, len * 0.45, h * 0.006)
  }
  return d + branch(...t.at(1), 0, h * 0.08, h * 0.006)
}

/** Tunggul patah bekas terbakar: batang pendek dengan puncak bergerigi. */
function snag(x: number, yb: number, h: number, r: R) {
  const w0 = h * 0.07, w1 = h * 0.045, top = yb - h
  const pts: P[] = [
    [x - w0, yb], [x - w1, top + h * 0.12], [x - w1 * 0.9, top + h * 0.03], [x - w1 * 0.3, top - h * 0.04 * r()],
    [x + w1 * 0.1, top + h * 0.09], [x + w1 * 0.55, top - h * 0.07 * r()], [x + w1, top + h * 0.05], [x + w1, top + h * 0.14], [x + w0, yb],
  ]
  let d = poly(pts)
  if (r() > 0.4) d += branch(x + w1, top + h * 0.3, 1.1 + r() * 0.3, h * 0.22, h * 0.012)
  return d
}

/** Pohon tumbang: batang rebah miring dengan bongkahan akar terangkat dan tunggul cabang. */
function fallen(x: number, yb: number, len: number, r: R, dir = r() > 0.5 ? 1 : -1, tilt = 0.12 + r() * 0.2) {
  const w0 = len * 0.045, w1 = len * 0.018
  const ex = x + dir * len * Math.cos(tilt), ey = yb - len * Math.sin(tilt)
  const nx = -Math.sin(tilt) * dir * -1, ny = Math.cos(tilt)
  let d = poly([[x - nx * 0 + 0, yb - w0 * ny], [ex, ey - w1 * ny], [ex, ey + w1 * ny], [x, yb + w0 * ny]])
  // bongkahan akar
  const root: P[] = []
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2, k = 0.8 + r() * 0.5
    root.push([x - dir * w0 * 0.8 + Math.cos(a) * w0 * 2.2 * k, yb - w0 * 1.2 + Math.sin(a) * w0 * 2.6 * k])
  }
  d += poly(root)
  for (let i = 0; i < 3; i++) {
    const k = 0.3 + i * 0.22 + r() * 0.08
    d += branch(x + (ex - x) * k, yb + (ey - yb) * k, -dir * (0.25 + r() * 0.5), len * (0.1 + r() * 0.08), len * 0.007)
  }
  return d
}

/** Pohon yang condong hampir roboh: batang miring tajam dengan sisa tajuk gundul. */
function toppling(x: number, yb: number, h: number, r: R) {
  const dir = r() > 0.5 ? 1 : -1
  const lean = dir * (0.55 + r() * 0.35)
  const t = trunk(x, yb, h, h * 0.035, h * 0.01, lean)
  let d = t.d
  for (let i = 0; i < 4; i++) {
    const k = 0.45 + i * 0.14
    const [bx, by] = t.at(k)
    d += branch(bx, by, lean + (i % 2 ? 1 : -1) * (0.6 + r() * 0.4), h * (0.16 + r() * 0.1), h * 0.009)
  }
  return d
}

/** Nyala api: tiga lidah runcing berbeda tinggi, pangkal di (x,y), skala s. */
function tongue(cx: number, y: number, w: number, hg: number) {
  const p = (a: number, b: number) => `${f1(a)} ${f1(b)}`
  return `M${p(cx, y - hg)} C${p(cx + w * 0.15, y - hg * 0.62)} ${p(cx + w, y - hg * 0.5)} ${p(cx + w, y - hg * 0.18)} C${p(cx + w, y + hg * 0.08)} ${p(cx - w, y + hg * 0.08)} ${p(cx - w, y - hg * 0.18)} C${p(cx - w, y - hg * 0.5)} ${p(cx - w * 0.2, y - hg * 0.55)} ${p(cx, y - hg)} Z `
}
function flame(x: number, y: number, s: number) {
  return tongue(x - s * 0.34, y, s * 0.3, s * 1.1) + tongue(x, y, s * 0.4, s * 1.8) + tongue(x + s * 0.36, y, s * 0.28, s * 1.25)
}

export type TreeKind = 'pine' | 'spruce' | 'broadleaf' | 'dead' | 'snag' | 'fallen' | 'toppling' | 'burningPine' | 'burningDead'

export interface TreeSpec { kind: TreeKind; count: number; h: [number, number] }

export interface Flame { d: string; delay: number; hot: boolean }
export interface Glow { x: number; y: number; r: number }
export interface LayerGeo { trees: string; flames: Flame[]; glows: Glow[] }

/** Menanam campuran pohon di atas punggung bukit y(x). */
export function buildForest(seed: number, y: (x: number) => number, specs: TreeSpec[]): LayerGeo {
  const r = rng(seed)
  let trees = ''
  const flames: Flame[] = []
  const glows: Glow[] = []
  // posisi acak beraturan agar tidak menumpuk
  const slots: { spec: TreeSpec; x: number }[] = []
  for (const spec of specs) for (let i = 0; i < spec.count; i++) slots.push({ spec, x: (i + r() * 0.9) / spec.count * W })
  for (const { spec, x } of slots) {
    const h = spec.h[0] + r() * (spec.h[1] - spec.h[0])
    const yb = y(x) + 6
    switch (spec.kind) {
      case 'pine': trees += pine(x, yb, h, r); break
      case 'spruce': trees += spruce(x, yb, h, r); break
      case 'broadleaf': trees += broadleaf(x, yb, h, r); break
      case 'dead': trees += deadTree(x, yb, h, r); break
      case 'snag': trees += snag(x, yb, h, r); break
      case 'fallen': trees += fallen(x, yb, h * 1.7, r); break
      case 'toppling': trees += toppling(x, yb, h, r); break
      case 'burningPine':
      case 'burningDead': {
        trees += spec.kind === 'burningPine' ? pine(x, yb, h, r) : deadTree(x, yb, h, r)
        const s = h * 0.16
        // nyala di tajuk dan sepanjang batang
        const spots: P[] = [[x, yb - h * 0.9], [x - h * 0.08, yb - h * 0.62], [x + h * 0.09, yb - h * 0.5], [x, yb - h * 0.34], [x - h * 0.07, yb - h * 0.16]]
        spots.forEach(([fx, fy], i) => flames.push({ d: flame(fx, fy, s * (1.15 - i * 0.12)), delay: r() * 1.2, hot: i < 3 }))
        glows.push({ x, y: yb - h * 0.6, r: h * 1.3 })
        break
      }
    }
  }
  return { trees, flames, glows }
}

/** Tiang listrik dengan palang dan kabel melorot (bagian dari lapisan depan). */
export function powerLine(y: (x: number) => number, xs: number[], height: number) {
  let d = ''
  const tops: P[] = []
  for (const x of xs) {
    const yb = y(x) + 6, top = yb - height
    d += poly([[x - 3, yb], [x - 2.2, top], [x + 2.2, top], [x + 3, yb]])
    d += poly([[x - height * 0.17, top + 14], [x + height * 0.17, top + 14], [x + height * 0.17, top + 20], [x - height * 0.17, top + 20]])
    tops.push([x, top + 15])
  }
  let wires = ''
  for (let i = 0; i < tops.length - 1; i++) {
    const [x1, y1] = tops[i], [x2, y2] = tops[i + 1]
    for (const off of [-height * 0.15, height * 0.15]) wires += `M${f1(x1 + off)} ${f1(y1)} Q${f1((x1 + x2) / 2 + off)} ${f1(Math.max(y1, y2) + 70)} ${f1(x2 + off)} ${f1(y2)} `
  }
  return { poles: d, wires }
}

/** Menara pengawas kebakaran kecil di puncak punggung bukit. */
export function lookoutTower(y: (x: number) => number, xFrom: number, xTo: number) {
  let bx = xFrom, by = 1e9
  for (let x = xFrom; x <= xTo; x += 4) { const v = y(x); if (v < by) { by = v; bx = x } }
  const base = by + 4, h = 46, w = 12
  let d = poly([[bx - w, base], [bx - w * 0.55, base - h], [bx - w * 0.4, base - h], [bx - w * 0.9, base]])
  d += poly([[bx + w, base], [bx + w * 0.55, base - h], [bx + w * 0.4, base - h], [bx + w * 0.9, base]])
  d += poly([[bx - w * 0.7, base - h * 0.5], [bx + w * 0.7, base - h * 0.5], [bx + w * 0.7, base - h * 0.45], [bx - w * 0.7, base - h * 0.45]])
  d += poly([[bx - w * 0.8, base - h], [bx + w * 0.8, base - h], [bx + w * 0.8, base - h - 11], [bx - w * 0.8, base - h - 11]])
  d += poly([[bx - w * 1.05, base - h - 11], [bx, base - h - 21], [bx + w * 1.05, base - h - 11]])
  return d
}

/** Kawanan burung kecil berbentuk V. */
export function birds(seed: number, cx: number, cy: number, n: number) {
  const r = rng(seed)
  let d = ''
  for (let i = 0; i < n; i++) {
    const x = cx + (r() - 0.5) * 220, y = cy + (r() - 0.5) * 90, s = 5 + r() * 5
    d += `M${f1(x - s)} ${f1(y - s * 0.3)} Q${f1(x - s * 0.4)} ${f1(y - s * 0.55)} ${f1(x)} ${f1(y)} Q${f1(x + s * 0.4)} ${f1(y - s * 0.55)} ${f1(x + s)} ${f1(y - s * 0.3)} `
  }
  return d
}
