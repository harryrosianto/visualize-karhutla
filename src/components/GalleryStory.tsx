import { DownloadSimple, FilmSlate, ShareNetwork } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { communityTemplates } from '../lib/community'
import { canRecordGallery, renderGalleryVideo, type GalleryVideo } from '../lib/galleryVideo'
import { downloadBlob } from '../lib/exportImage'
import { siteUrl } from '../lib/share'

const MAX_ITEMS = 10

/** Membuat video Story IG (9:16) berisi karya Galeri warga yang berganti otomatis, lalu dibagikan atau diunduh. */
export function GalleryStory({ className = '' }: { className?: string }) {
  const [phase, setPhase] = useState<'idle' | 'busy' | 'ready' | 'error'>('idle')
  const [progress, setProgress] = useState(0)
  const [video, setVideo] = useState<GalleryVideo | null>(null)
  const [url, setUrl] = useState('')
  const [note, setNote] = useState('')
  const items = communityTemplates.slice(0, MAX_ITEMS)
  const supported = canRecordGallery()

  useEffect(() => () => { if (url) URL.revokeObjectURL(url) }, [url])
  if (!items.length || !supported) return null

  const make = async () => {
    setPhase('busy'); setProgress(0); setNote('')
    try {
      const family = getComputedStyle(document.body).fontFamily || 'sans-serif'
      const v = await renderGalleryVideo(items, { fontFamily: family, onProgress: setProgress })
      if (url) URL.revokeObjectURL(url)
      setVideo(v); setUrl(URL.createObjectURL(v.blob)); setPhase('ready')
    } catch {
      setPhase('error')
    }
  }
  const fileName = () => `galeri-warga-karhutla.${video!.ext}`
  const flash = (m: string) => { setNote(m); window.setTimeout(() => setNote(''), 3200) }
  const share = async () => {
    if (!video) return
    const file = new File([video.blob], fileName(), { type: video.mime })
    if (navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: 'Galeri warga | Visualize Karhutla', text: `Karhutla belum berakhir. Lihat galeri warga: ${siteUrl()}/galeri #visualizekarhutla` }); return } catch (e: any) { if (e?.name === 'AbortError') return }
    }
    downloadBlob(video.blob, fileName()); flash('Video diunduh. Unggah ke Instagram Story dari galeri.')
  }

  return (
    <div className={className}>
      <button type="button" onClick={make} disabled={phase === 'busy'} aria-busy={phase === 'busy'} className="btn btn-ghost gap-2 disabled:opacity-70">
        <FilmSlate size={18} weight="bold" aria-hidden />
        {phase === 'busy' ? `Menyiapkan video... ${Math.round(progress * 100)}%` : phase === 'ready' ? 'Buat ulang video Story' : 'Bagikan galeri sebagai Story (video)'}
      </button>
      {phase === 'busy' && <p role="status" className="mt-3 max-w-[52ch] text-sm text-fg-3">Video direkam secara langsung (sekitar {Math.round(2.2 + items.length * 2.4 + 2.6)} detik). Biarkan tab ini tetap terbuka dan terlihat sampai selesai.</p>}
      {phase === 'error' && <p role="alert" className="mt-3 text-sm text-fg">Video belum dapat dibuat di browser ini. Silakan coba lagi atau pakai browser lain.</p>}
      {phase === 'ready' && video && (
        <div className="mt-5 grid max-w-[260px] gap-3">
          <video src={url} controls autoPlay muted loop playsInline className="aspect-[9/16] w-full rounded-panel border border-line bg-ink-2" aria-label="Pratinjau video Story galeri warga" />
          <button type="button" onClick={share} className="btn btn-primary min-h-11 w-full gap-1.5 px-2 text-sm"><ShareNetwork size={18} weight="bold" aria-hidden />Bagikan ke Story</button>
          <button type="button" onClick={() => { downloadBlob(video.blob, fileName()); flash('Video diunduh.') }} className="btn btn-ghost min-h-11 w-full gap-1.5 px-2 text-sm"><DownloadSimple size={18} weight="bold" aria-hidden />Unduh video ({video.ext.toUpperCase()})</button>
          {video.ext === 'webm' && <p className="text-xs text-fg-3">Browser ini menghasilkan WebM. Jika Instagram menolaknya, ubah ke MP4 dahulu atau buat videonya dari Chrome terbaru atau Safari.</p>}
          <p role="status" aria-live="polite" className="min-h-5 text-sm text-fg">{note}</p>
        </div>
      )}
    </div>
  )
}
