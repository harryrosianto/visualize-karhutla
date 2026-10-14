import { DownloadSimple, ImagesSquare, ShareNetwork } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { communityTemplates } from '../lib/community'
import { downloadBlob, shareOrDownload } from '../lib/exportImage'
import { renderGalleryCollage } from '../lib/galleryCollage'
import { siteUrl } from '../lib/share'

/** Kolase desktop 16:9 berisi seluruh karya Galeri warga (rasio asli, tanpa dipotong). */
export function GalleryCollage({ className = '' }: { className?: string }) {
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ready' | 'error'>('idle')
  const [blob, setBlob] = useState<Blob | null>(null)
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const canShare = typeof navigator !== 'undefined' && !!navigator.share

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  if (!communityTemplates.length) return null

  const make = async () => {
    setPhase('busy'); setNote('')
    try {
      const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
      const b = await renderGalleryCollage(communityTemplates, { fontFamily: family })
      if (url) URL.revokeObjectURL(url)
      setBlob(b); setUrl(URL.createObjectURL(b)); setPhase('ready')
    } catch { setPhase('error') }
  }
  const flash = (m: string) => { setNote(m); window.setTimeout(() => setNote(''), 3200) }

  return (
    <div className={className}>
      <button type="button" onClick={make} disabled={phase === 'busy'} aria-busy={phase === 'busy'} className="btn btn-ghost gap-2 disabled:opacity-70">
        <ImagesSquare size={18} weight="bold" aria-hidden />
        {phase === 'busy' ? 'Menyusun kolase...' : phase === 'ready' ? 'Susun ulang kolase' : 'Kolase desktop (semua karya)'}
      </button>
      {phase === 'error' && <p role="alert" className="mt-3 text-sm text-fg">Kolase belum dapat dibuat. Silakan coba lagi.</p>}
      {phase === 'ready' && blob && (
        <div className="mt-5 grid max-w-xl gap-3">
          <img src={url} alt={`Kolase seluruh ${communityTemplates.length} karya Galeri warga`} className="w-full rounded-panel border border-line" />
          <div className="flex flex-wrap gap-3">
            {canShare && <button type="button" onClick={async () => { const r = await shareOrDownload(blob, 'galeri-warga-karhutla-desktop.png', { title: 'Galeri warga | Visualize Karhutla', text: `Karhutla belum berakhir. Lihat galeri warga: ${siteUrl()}/galeri #visualizekarhutla` }); if (r === 'diunduh') flash('Gambar diunduh.') }} className="btn btn-primary min-h-11 gap-1.5 px-4 text-sm"><ShareNetwork size={18} weight="bold" aria-hidden />Bagikan</button>}
            <button type="button" onClick={() => { downloadBlob(blob, 'galeri-warga-karhutla-desktop.png'); flash('Gambar diunduh.') }} className={`btn min-h-11 gap-1.5 px-4 text-sm ${canShare ? 'btn-ghost' : 'btn-primary'}`}><DownloadSimple size={18} weight="bold" aria-hidden />Unduh gambar (2560 x 1440)</button>
          </div>
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-fg">{note}</p>
        </div>
      )}
    </div>
  )
}
