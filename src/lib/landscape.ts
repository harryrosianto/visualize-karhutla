// Pembangkit siluet lanskap orisinal (punggung bukit dan pinus) berbasis seed, untuk adegan parallax hero.
export const W = 1600
export const H = 900

function rng(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

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
  let d = `M0 ${H} L0 ${y(0).toFixed(1)}`
  for (let x = step; x <= W; x += step) d += ` L${x} ${y(x).toFixed(1)}`
  return d + ` L${W} ${H} Z`
}

/** Deretan pinus bertingkat berdiri di atas punggung bukit y(x). */
export function pinePath(seed: number, y: (x: number) => number, count: number, minH: number, maxH: number) {
  const r = rng(seed)
  let d = ''
  for (let n = 0; n < count; n++) {
    const x = ((n + r() * 0.9) / count) * W
    const h = minH + r() * (maxH - minH)
    const w = h * (0.34 + r() * 0.1)
    const yb = y(x) + 6
    const top = yb - h
    const tiers = 4
    const right: [number, number][] = []
    for (let i = 0; i < tiers; i++) {
      const bottom = top + h * ((i + 1) / tiers) * 0.94
      const half = (w / 2) * ((i + 1) / tiers)
      right.push([half, bottom], [half * 0.4, bottom - h * 0.012])
    }
    const pts: [number, number][] = [[x, top]]
    right.forEach(([hx, py]) => pts.push([x + hx, py]))
    pts.push([x + w * 0.05, yb])
    pts.push([x - w * 0.05, yb])
    for (let i = right.length - 1; i >= 0; i--) pts.push([x - right[i][0], right[i][1]])
    d += 'M' + pts.map(([px, py]) => `${px.toFixed(1)} ${py.toFixed(1)}`).join(' L') + ' Z '
  }
  return d
}
