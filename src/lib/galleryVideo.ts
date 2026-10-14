import type { CommunityTemplate } from './community'

const W = 1080
const H = 1920
const INTRO = 2.2
const SLIDE = 2.4
const OUTRO = 2.6
const FADE = 0.5
const INK = '#0C0A09'
const EMBER = '#FF6A1F'
const FG = '#F5F1EC'
const FG2 = '#CFC6BD'
const FG3 = '#968C82'

export interface GalleryVideo { blob: Blob; ext: 'mp4' | 'webm'; mime: string; seconds: number }

const MIMES: [string, 'mp4' | 'webm'][] = [
  ['video/mp4;codecs=avc1.42E01E', 'mp4'],
  ['video/mp4', 'mp4'],
  ['video/webm;codecs=vp9', 'webm'],
  ['video/webm;codecs=vp8', 'webm'],
  ['video/webm', 'webm'],
]

export const canRecordGallery = () => typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('gambar gagal dimuat'))
    img.src = src
  })
}

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3)

function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number, maxLines: number) {
  const words = text.split(/\s+/)
  const lines: string[] = []
  let cur = ''
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w
    if (ctx.measureText(test).width > maxW && cur) { lines.push(cur); cur = w } else cur = test
  }
  if (cur) lines.push(cur)
  if (lines.length > maxLines) { lines.length = maxLines; lines[maxLines - 1] = lines[maxLines - 1].replace(/\s*\S*$/, '') + '…' }
  return lines
}

/** Susun video Story 9:16 (1080x1920) berisi galeri warga: pembuka, satu layar per karya, dan penutup. Direkam dari canvas lewat MediaRecorder. */
export async function renderGalleryVideo(items: CommunityTemplate[], opts: { fontFamily: string; onProgress?: (p: number) => void }): Promise<GalleryVideo> {
  const picked = MIMES.find(([m]) => MediaRecorder.isTypeSupported(m))
  if (!picked) throw new Error('perekam video tidak didukung')
  const [mime, ext] = picked
  const imgs = await Promise.all(items.map(t => loadImage(t.full)))
  if (document.fonts) await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const font = (weight: number, size: number) => `${weight} ${size}px ${opts.fontFamily}`
  const total = INTRO + items.length * SLIDE + OUTRO

  const bg = () => {
    ctx.fillStyle = INK
    ctx.fillRect(0, 0, W, H)
    const g = ctx.createRadialGradient(W / 2, H + 120, 40, W / 2, H + 120, 1100)
    g.addColorStop(0, 'rgba(255,106,31,0.28)')
    g.addColorStop(1, 'rgba(255,106,31,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, H)
    ctx.textBaseline = 'alphabetic'
    ctx.font = font(800, 46)
    ctx.fillStyle = FG
    ctx.fillText('Visualize Karhutla', 86, 130)
    const w = ctx.measureText('Visualize Karhutla').width
    ctx.fillStyle = EMBER
    ctx.fillText('.', 86 + w, 130)
  }

  const intro = (local: number) => {
    const a = ease(local / 0.7)
    ctx.globalAlpha = a
    ctx.fillStyle = FG
    ctx.font = font(800, 168)
    ctx.fillText('Galeri', 86, 820 + (1 - a) * 40)
    ctx.fillText('warga', 86, 990 + (1 - a) * 40)
    const w = ctx.measureText('warga').width
    ctx.fillStyle = EMBER
    ctx.fillText('.', 86 + w, 990 + (1 - a) * 40)
    ctx.font = font(500, 54)
    ctx.fillStyle = FG2
    wrap(ctx, 'Karya warga untuk mengingatkan: karhutla belum berakhir.', 860, 3).forEach((l, i) => ctx.fillText(l, 86, 1130 + i * 72))
    ctx.globalAlpha = 1
  }

  const art = (i: number, local: number) => {
    const t = items[i]
    const img = imgs[i]
    const boxX = 70, boxY = 300, boxW = 940, boxH = 1040
    const zoom = 1 + 0.035 * Math.min(1, local / SLIDE)
    const s = Math.min(boxW / img.naturalWidth, boxH / img.naturalHeight) * zoom
    const dw = img.naturalWidth * s, dh = img.naturalHeight * s
    const cx = boxX + boxW / 2, cy = boxY + boxH / 2
    ctx.save()
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, 40)
    ctx.clip()
    ctx.fillStyle = '#16120F'
    ctx.fillRect(boxX, boxY, boxW, boxH)
    ctx.drawImage(img, cx - dw / 2, cy - dh / 2, dw, dh)
    ctx.restore()
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.roundRect(boxX, boxY, boxW, boxH, 40)
    ctx.stroke()
    ctx.fillStyle = FG
    ctx.font = font(800, 68)
    const lines = wrap(ctx, t.title, 940, 2)
    lines.forEach((l, k) => ctx.fillText(l, 70, 1450 + k * 80))
    ctx.font = font(500, 46)
    ctx.fillStyle = FG3
    ctx.fillText(`Oleh ${t.creator}`, 70, 1450 + lines.length * 80 + 24)
    ctx.fillStyle = FG3
    ctx.font = font(600, 36)
    ctx.fillText(`${i + 1} / ${items.length}`, 70, 1790)
  }

  const outro = (local: number) => {
    const a = ease(local / 0.7)
    ctx.globalAlpha = a
    ctx.fillStyle = FG
    ctx.font = font(800, 140)
    ctx.fillText('Kirim', 86, 820 + (1 - a) * 40)
    ctx.fillText('karyamu', 86, 970 + (1 - a) * 40)
    const w = ctx.measureText('karyamu').width
    ctx.fillStyle = EMBER
    ctx.fillText('.', 86 + w, 970 + (1 - a) * 40)
    ctx.font = font(500, 54)
    ctx.fillStyle = FG2
    wrap(ctx, 'Ilustrator, fotografer, dan desainer: karyamu bisa tampil di galeri ini.', 860, 3).forEach((l, i) => ctx.fillText(l, 86, 1110 + i * 72))
    ctx.font = font(800, 58)
    ctx.fillStyle = EMBER
    ctx.fillText('#visualizekarhutla', 86, 1420)
    ctx.globalAlpha = 1
  }

  const draw = (t: number) => {
    bg()
    if (t < INTRO) { intro(t); return }
    const u = t - INTRO
    if (u >= items.length * SLIDE) { outro(u - items.length * SLIDE); return }
    const i = Math.floor(u / SLIDE)
    const local = u - i * SLIDE
    // masuk dari kanan sambil memudar; layar sebelumnya keluar ke kiri
    if (local < FADE) {
      const k = ease(local / FADE)
      if (i > 0) {
        ctx.save(); ctx.globalAlpha = 1 - k; ctx.translate(-140 * k, 0); art(i - 1, SLIDE); ctx.restore()
      }
      ctx.save(); ctx.globalAlpha = k; ctx.translate(140 * (1 - k), 0); art(i, local); ctx.restore()
    } else art(i, local)
  }

  draw(0)
  const stream = canvas.captureStream(30)
  const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: 6_000_000 })
  const chunks: Blob[] = []
  rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data) }
  const stopped = new Promise<void>(res => { rec.onstop = () => res() })
  rec.start(500)
  const t0 = performance.now()
  await new Promise<void>(resolve => {
    const tick = () => {
      const t = (performance.now() - t0) / 1000
      draw(Math.min(t, total - 0.001))
      opts.onProgress?.(Math.min(1, t / total))
      if (t >= total) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  rec.stop()
  stream.getTracks().forEach(tr => tr.stop())
  await stopped
  return { blob: new Blob(chunks, { type: mime.split(';')[0] }), ext, mime: mime.split(';')[0], seconds: total }
}
