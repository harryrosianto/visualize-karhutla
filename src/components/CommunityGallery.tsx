import { CaretLeft, CaretRight, DownloadSimple } from '@phosphor-icons/react'
import { useReducedMotion } from 'motion/react'
import { useRef, useState, type KeyboardEvent } from 'react'
import { communityTemplates, type CommunityTemplate } from '../lib/community'

/** Satu karya. Bila berupa seri (lebih dari satu gambar), gambarnya dapat digeser: sapuan jari, panah, atau tombol panah keyboard. */
function ArtworkCard({ t }: { t: CommunityTemplate }) {
  const n = t.slides.length
  const reduce = !!useReducedMotion()
  const track = useRef<HTMLUListElement>(null)
  const [i, setI] = useState(0)
  const go = (to: number) => {
    const el = track.current
    if (!el) return
    const k = Math.max(0, Math.min(n - 1, to))
    el.scrollTo({ left: k * el.clientWidth, behavior: reduce ? 'auto' : 'smooth' })
  }
  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') { e.preventDefault(); go(i + 1) }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(i - 1) }
  }
  const cur = t.slides[i] ?? t.slides[0]
  const arrow = 'absolute top-1/2 grid size-11 -translate-y-1/2 place-items-center rounded-full border border-line bg-ink/80 text-fg backdrop-blur transition-opacity hover:bg-ink disabled:pointer-events-none disabled:opacity-0'
  return (
    <>
      <div className="relative" {...(n > 1 ? { role: 'group', 'aria-roledescription': 'carousel', 'aria-label': `Seri ${t.title}, ${n} gambar`, tabIndex: 0, onKeyDown: onKey } : {})}>
        <ul ref={track} onScroll={n > 1 ? e => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth)) : undefined}
          className={`flex overflow-hidden rounded-panel border border-line ${n > 1 ? 'snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden' : ''}`}
          style={{ aspectRatio: `${t.width} / ${t.height}` }}>
          {t.slides.map((s, k) => (
            <li key={s.id} className="size-full shrink-0 snap-center" {...(n > 1 ? { role: 'group', 'aria-roledescription': 'slide', 'aria-label': `${k + 1} dari ${n}` } : {})}>
              <img src={s.thumb} alt={`${n > 1 ? `Gambar ${k + 1} dari ${n}: ` : 'Karya '}${t.title} oleh ${t.creator}`} width={s.width} height={s.height} loading="lazy" decoding="async" draggable={false} className="size-full bg-ink-2 object-contain" />
            </li>
          ))}
        </ul>
        {n > 1 && (
          <>
            <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="Gambar sebelumnya" className={`${arrow} left-2`}><CaretLeft size={20} weight="bold" aria-hidden /></button>
            <button type="button" onClick={() => go(i + 1)} disabled={i === n - 1} aria-label="Gambar berikutnya" className={`${arrow} right-2`}><CaretRight size={20} weight="bold" aria-hidden /></button>
            <p aria-hidden className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/80 px-2.5 py-0.5 text-xs font-semibold text-fg num">{i + 1}/{n}</p>
            <p className="sr-only" aria-live="polite">Gambar {i + 1} dari {n}</p>
          </>
        )}
      </div>
      <p className="mt-2 text-sm font-semibold text-fg">{t.title}</p>
      {t.description && <p className="mt-0.5 text-sm text-fg-2">{t.description}</p>}
      <p className="text-sm text-fg-3">
        Oleh {t.creatorUrl ? <a href={t.creatorUrl} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-ember underline-offset-4 hover:text-fg">{t.creator}</a> : t.creator}
        {n > 1 && <span> · seri {n} gambar</span>}
      </p>
      <a href={cur.full} download={`karhutla-galeri-${cur.id}.${cur.ext}`} className="btn btn-ghost mt-2 min-h-11 w-full gap-1.5 px-2 text-sm"><DownloadSimple size={18} weight="bold" aria-hidden />{n > 1 ? `Unduh gambar ${i + 1}` : 'Unduh'}</a>
    </>
  )
}

/** Galeri warga: karya ilustrator, fotografer, dan desainer yang sudah disetujui. Dipakai di beranda dan halaman Templat. */
export function CommunityGallery({ limit, className = '' }: { limit?: number; className?: string }) {
  const items = limit ? communityTemplates.slice(0, limit) : communityTemplates
  if (items.length === 0) return <p className="mt-10 text-fg-3">Belum ada karya dari warga. Jadilah kontributor pertama.</p>
  return (
    <ul className={`mt-10 columns-2 gap-4 md:columns-4 md:gap-6 ${className}`}>
      {items.map(t => (
        <li key={t.id} className="mb-8 break-inside-avoid"><ArtworkCard t={t} /></li>
      ))}
    </ul>
  )
}
