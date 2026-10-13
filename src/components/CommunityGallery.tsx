import { DownloadSimple } from '@phosphor-icons/react'
import { communityTemplates } from '../lib/community'

/** Galeri warga: karya ilustrator, fotografer, dan desainer yang sudah disetujui. Dipakai di beranda dan halaman Templat. */
export function CommunityGallery({ limit, className = '' }: { limit?: number; className?: string }) {
  const items = limit ? communityTemplates.slice(0, limit) : communityTemplates
  if (items.length === 0) return <p className="mt-10 text-fg-3">Belum ada karya dari warga. Jadilah kontributor pertama.</p>
  return (
    <ul className={`mt-10 columns-2 gap-4 md:columns-4 md:gap-6 ${className}`}>
      {items.map(t => (
        <li key={t.id} className="mb-8 break-inside-avoid">
          <img src={t.thumb} alt={`Karya ${t.title} oleh ${t.creator}`} width={t.width} height={t.height} loading="lazy" decoding="async" className="w-full rounded-panel border border-line" style={{ aspectRatio: `${t.width} / ${t.height}` }} />
          <p className="mt-2 text-sm font-semibold text-fg">{t.title}</p>
          <p className="text-sm text-fg-3">
            Oleh {t.creatorUrl ? <a href={t.creatorUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-ember underline-offset-4 hover:text-fg">{t.creator}</a> : t.creator}
          </p>
          <a href={t.full} download={`karhutla-galeri-${t.id}.${t.ext}`} className="btn btn-ghost mt-2 min-h-11 w-full gap-1.5 px-2 text-sm"><DownloadSimple size={18} weight="bold" aria-hidden />Unduh</a>
        </li>
      ))}
    </ul>
  )
}
