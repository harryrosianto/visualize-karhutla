import { DownloadSimple, ImagesSquare, ShareNetwork } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { ExportStage } from './ExportContext'
import { communityTemplates } from '../lib/community'
import { renderPng, shareOrDownload } from '../lib/exportImage'
import { siteUrl } from '../lib/share'

const COUNT = 6

/** Kolase Story 9:16 berisi karya Galeri warga terbaru. Ukuran memakai cqw agar sama untuk ekspor 1080x1920. */
function CollageCard() {
  const items = communityTemplates.slice(0, COUNT)
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      <div aria-hidden className="glow-ember absolute inset-x-0 bottom-0 h-[45%] opacity-40" />
      <p translate="no" className="absolute left-[8cqw] top-[9cqw] text-[4.4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span></p>
      <h3 className="absolute left-[8cqw] top-[19cqw] text-[14cqw] font-extrabold leading-[0.95] tracking-tighter text-fg">Galeri warga<span className="text-ember">.</span></h3>
      <div className="absolute inset-x-[8cqw] top-[44cqw] grid grid-cols-2 gap-x-[2.6cqw] gap-y-[2.4cqw]">
        {items.map(t => (
          <div key={t.id} className="min-w-0">
            <div className="h-[28cqw] overflow-hidden rounded-[2.4cqw] border border-fg/15 bg-ink-2">
              <img src={t.thumb} alt="" className="size-full object-cover" />
            </div>
            <p className="mt-[1.2cqw] truncate text-[3cqw] leading-tight text-fg-2"><span translate="no">{t.creator}</span></p>
          </div>
        ))}
      </div>
      <div className="absolute inset-x-[8cqw] bottom-[9cqw]">
        <p className="text-[8cqw] font-extrabold leading-none tracking-tighter text-fg">Kirim karyamu<span className="text-ember">.</span></p>
        <p className="mt-[2.4cqw] text-[3.8cqw] font-semibold text-ember">#visualizekarhutla</p>
      </div>
    </div>
  )
}

/** Tombol untuk membagikan atau mengunduh kolase Galeri warga dalam ukuran Story IG. */
export function GalleryCollage({ className = '' }: { className?: string }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const stage = useRef<HTMLDivElement>(null)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share
  const empty = communityTemplates.length === 0

  useEffect(() => {
    if (!busy) return
    let alive = true
    const flash = (m: string) => { if (alive) { setNote(m); window.setTimeout(() => setNote(''), 3200) } }
    ;(async () => {
      await new Promise(r => setTimeout(r, 300))
      try {
        const blob = await renderPng(stage.current!, 1080, 1920)
        const r = await shareOrDownload(blob, 'galeri-warga-karhutla.png', { title: 'Galeri warga | Visualize Karhutla', text: `Karhutla belum berakhir. Lihat galeri warga: ${siteUrl()}/galeri #visualizekarhutla` })
        if (r === 'diunduh') flash('Gambar diunduh. Unggah ke Instagram Story dari galeri.')
      } catch {
        flash('Gambar belum dapat dibuat. Silakan coba kembali.')
      } finally {
        if (alive) setBusy(false)
      }
    })()
    return () => { alive = false }
  }, [busy])

  if (empty) return null
  return (
    <div className={className}>
      <button type="button" onClick={() => setBusy(true)} disabled={busy} aria-busy={busy} className="btn btn-ghost gap-2 disabled:opacity-70">
        <ImagesSquare size={18} weight="bold" aria-hidden />
        {busy ? 'Menyiapkan gambar...' : 'Bagikan kolase galeri ke Story'}
        {!busy && (canShare ? <ShareNetwork size={16} weight="bold" aria-hidden /> : <DownloadSimple size={16} weight="bold" aria-hidden />)}
      </button>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-fg">{note}</p>
      {busy && <ExportStage ref={stage} width={1080} height={1920}><CollageCard /></ExportStage>}
    </div>
  )
}
