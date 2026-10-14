import { ArrayBufferTarget, Muxer } from 'mp4-muxer'
import type { CommunityTemplate } from './community'

const W = 1080
const H = 1920
const TOTAL = 15
const HOLD_START = 1.2
const HOLD_END = 1.8
const PAD = 86
const GAP = 24
const COL_W = (W - PAD * 2 - GAP) / 2
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


const hasWebCodecs = () => typeof VideoEncoder !== 'undefined' && typeof VideoFrame !== 'undefined'
const hasRecorder = () => typeof MediaRecorder !== 'undefined' && typeof HTMLCanvasElement !== 'undefined' && 'captureStream' in HTMLCanvasElement.prototype
export const canRecordGallery = () => hasWebCodecs() || hasRecorder()

const FPS = 30
const CODECS = ['avc1.640028', 'avc1.4D0028', 'avc1.42E028']

/** Encode bingkai demi bingkai dengan stempel waktu pasti (tidak bergantung kecepatan perangkat) dan kemas sebagai MP4 berdurasi tepat. Mengembalikan null bila H.264 tidak tersedia. */
async function encodeOffline(canvas: HTMLCanvasElement, draw: (t: number) => void, onProgress?: (p: number) => void): Promise<Blob | null> {
  if (!hasWebCodecs()) return null
  let codec = ''
  for (const c of CODECS) {
    try { const r = await VideoEncoder.isConfigSupported({ codec: c, width: W, height: H, bitrate: 4_500_000, framerate: FPS }); if (r.supported) { codec = c; break } } catch { /* coba berikutnya */ }
  }
  if (!codec) return null
  const target = new ArrayBufferTarget()
  const muxer = new Muxer({ target, video: { codec: 'avc', width: W, height: H }, fastStart: 'in-memory' })
  let failure: unknown = null
  const encoder = new VideoEncoder({ output: (chunk, meta) => muxer.addVideoChunk(chunk, meta), error: e => { failure = e } })
  encoder.configure({ codec, width: W, height: H, bitrate: 4_500_000, framerate: FPS })
  const frames = TOTAL * FPS
  for (let n = 0; n < frames; n++) {
    if (failure) throw failure
    draw(n / FPS)
    const frame = new VideoFrame(canvas, { timestamp: Math.round((n * 1_000_000) / FPS), duration: Math.round(1_000_000 / FPS) })
    encoder.encode(frame, { keyFrame: n % (FPS * 2) === 0 })
    frame.close()
    while (encoder.encodeQueueSize > 6) await new Promise(r => setTimeout(r, 4))
    if (n % 6 === 0) { onProgress?.(n / frames); await new Promise(r => setTimeout(r, 0)) }
  }
  await encoder.flush()
  encoder.close()
  if (failure) throw failure
  muxer.finalize()
  onProgress?.(1)
  return new Blob([target.buffer], { type: 'video/mp4' })
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = () => reject(new Error('gambar gagal dimuat'))
    img.src = src
  })
}

const easeInOut = (x: number) => { const k = Math.min(1, Math.max(0, x)); return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2 }

function fitText(ctx: CanvasRenderingContext2D, text: string, maxW: number) {
  if (ctx.measureText(text).width <= maxW) return text
  let s = text
  while (s.length > 1 && ctx.measureText(s + '…').width > maxW) s = s.slice(0, -1)
  return s.trimEnd() + '…'
}

interface Tile { i: number; x: number; y: number; w: number; h: number; bmp?: ImageBitmap }

/** Video Story 9:16 (1080x1920, 15 detik): galeri warga bergulir turun, setiap karya tampil dalam rasio aslinya (tanpa dipotong). */
export async function renderGalleryVideo(items: CommunityTemplate[], opts: { fontFamily: string; onProgress?: (p: number) => void }): Promise<GalleryVideo> {
  const imgs = await Promise.all(items.map(t => loadImage(t.full)))
  if (document.fonts) await document.fonts.ready

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!
  const font = (weight: number, size: number) => `${weight} ${size}px ${opts.fontFamily}`

  // tata letak dua kolom (masonry): karya berikutnya masuk ke kolom yang lebih pendek
  const HEADER = 700
  const CAPTION = 118
  const colY = [HEADER, HEADER]
  const tiles: Tile[] = []
  imgs.forEach((img, i) => {
    const c = colY[0] <= colY[1] ? 0 : 1
    const h = Math.min(900, COL_W * (img.naturalHeight / img.naturalWidth))
    const w = Math.min(COL_W, h * (img.naturalWidth / img.naturalHeight))
    tiles.push({ i, x: PAD + c * (COL_W + GAP) + (COL_W - w) / 2, y: colY[c], w, h })
    colY[c] += h + CAPTION + 30
  })
  const gridEnd = Math.max(colY[0], colY[1])
  const FOOTER_TOP = gridEnd + 40
  const contentH = FOOTER_TOP + 520
  const maxScroll = Math.max(0, contentH - H)

  // muat ulang ke ukuran tampil dan dekode sebelum merekam, agar tidak ada jeda dekode saat bergulir
  await Promise.all(tiles.map(async t => {
    try { t.bmp = await createImageBitmap(imgs[t.i], { resizeWidth: Math.round(t.w), resizeHeight: Math.round(t.h), resizeQuality: 'high' }) } catch { /* pakai gambar asli */ }
  }))
  const MAXW = W - PAD * 2
  const fit = (weight: number, size: number, text: string) => {
    let sz = size
    ctx.font = font(weight, sz)
    while (ctx.measureText(text).width > MAXW && sz > 24) { sz -= 2; ctx.font = font(weight, sz) }
    return sz
  }

  const drawContent = (scroll: number) => {
    ctx.fillStyle = INK
    ctx.fillRect(0, 0, W, H)
    ctx.save()
    ctx.translate(0, -scroll)
    ctx.textBaseline = 'alphabetic'
    // judul
    ctx.fillStyle = FG
    fit(800, 156, 'Galeri warga.')
    ctx.fillText('Galeri warga', PAD, 470)
    const w = ctx.measureText('Galeri warga').width
    ctx.fillStyle = EMBER
    ctx.fillText('.', PAD + w, 470)
    fit(500, 46, 'Karya warga untuk mengingatkan:')
    ctx.fillStyle = FG2
    ctx.fillText('Karya warga untuk mengingatkan:', PAD, 560)
    ctx.fillText('karhutla belum berakhir.', PAD, 620)
    // karya (hanya yang terlihat)
    for (const t of tiles) {
      if (t.y + t.h + CAPTION < scroll - 40 || t.y > scroll + H + 40) continue
      const img = imgs[t.i]
      ctx.save()
      ctx.beginPath(); ctx.roundRect(t.x, t.y, t.w, t.h, 28); ctx.clip()
      ctx.fillStyle = '#16120F'; ctx.fillRect(t.x, t.y, t.w, t.h)
      ctx.drawImage(t.bmp ?? img, t.x, t.y, t.w, t.h)
      ctx.restore()
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.roundRect(t.x, t.y, t.w, t.h, 28); ctx.stroke()
      const cx = PAD + (tiles[t.i].x - PAD >= COL_W ? COL_W + GAP : 0)
      ctx.fillStyle = FG
      ctx.font = font(700, 34)
      ctx.fillText(fitText(ctx, items[t.i].title, COL_W), cx, t.y + t.h + 52)
      ctx.fillStyle = FG3
      ctx.font = font(500, 29)
      ctx.fillText(fitText(ctx, `Oleh ${items[t.i].creator}`, COL_W), cx, t.y + t.h + 92)
    }
    // penutup
    ctx.fillStyle = FG
    fit(800, 132, 'karyamu.')
    ctx.fillText('Kirim', PAD, FOOTER_TOP + 190)
    ctx.fillText('karyamu', PAD, FOOTER_TOP + 330)
    const w2 = ctx.measureText('karyamu').width
    ctx.fillStyle = EMBER
    ctx.fillText('.', PAD + w2, FOOTER_TOP + 330)
    fit(800, 56, '#visualizekarhutla')
    ctx.fillText('#visualizekarhutla', PAD, FOOTER_TOP + 430)
    ctx.restore()
  }

  const draw = (t: number) => {
    const k = (t - HOLD_START) / (TOTAL - HOLD_START - HOLD_END)
    drawContent(maxScroll * easeInOut(k))
    // gradasi atas dan penanda merek tetap di tempat
    const g = ctx.createLinearGradient(0, 0, 0, 230)
    g.addColorStop(0, 'rgba(12,10,9,0.96)'); g.addColorStop(1, 'rgba(12,10,9,0)')
    ctx.fillStyle = g
    ctx.fillRect(0, 0, W, 230)
    ctx.font = font(800, 46)
    ctx.fillStyle = FG
    ctx.fillText('Visualize Karhutla', PAD, 130)
    ctx.fillStyle = EMBER
    ctx.fillText('.', PAD + ctx.measureText('Visualize Karhutla').width, 130)
  }

  draw(0)
  try {
    const mp4 = await encodeOffline(canvas, draw, opts.onProgress)
    if (mp4) return { blob: mp4, ext: 'mp4', mime: 'video/mp4', seconds: TOTAL }
  } catch { /* lanjut ke perekam waktu nyata */ }
  if (!hasRecorder()) throw new Error('pembuat video tidak didukung')
  const picked = MIMES.find(([m]) => MediaRecorder.isTypeSupported(m))
  if (!picked) throw new Error('perekam video tidak didukung')
  const [mime, ext] = picked
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
      draw(Math.min(t, TOTAL))
      opts.onProgress?.(Math.min(1, t / TOTAL))
      if (t >= TOTAL) resolve()
      else requestAnimationFrame(tick)
    }
    requestAnimationFrame(tick)
  })
  rec.stop()
  stream.getTracks().forEach(tr => tr.stop())
  await stopped
  return { blob: new Blob(chunks, { type: mime.split(';')[0] }), ext, mime: mime.split(';')[0], seconds: TOTAL }
}
