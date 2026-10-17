import { ArrowDown, LinkSimple, ShareNetwork, ThreadsLogo, WhatsappLogo, XLogo } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { ExportStage } from './ExportContext'
import { PenulisAvatar } from './PenulisAvatar'
import type { Cerita } from '../lib/cerita'
import { renderPng, shareOrDownload } from '../lib/exportImage'
import { siteUrl } from '../lib/share'

/** Kartu Instagram Story 1080x1920 untuk satu tulisan. Bagian bawah sengaja dikosongkan untuk stiker Tautan yang ditambahkan pengguna di aplikasi Instagram. */
function StoryCard({ c }: { c: Cerita }) {
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      {c.gambar
        ? <img src={c.gambar} alt="" className="absolute inset-0 size-full object-cover" />
        : <div aria-hidden className="glow-ember absolute inset-0 opacity-70" />}
      <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgb(12 10 9 / 0.55) 0%, rgb(12 10 9 / 0.45) 30%, rgb(12 10 9 / 0.88) 62%, rgb(12 10 9 / 0.97) 100%)' }} />
      <p translate="no" className="absolute left-[8cqw] top-[9cqw] text-[4.4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span> <span className="ml-[2cqw] font-semibold text-fg-2">Cerita karhutla</span></p>
      <div className="absolute inset-x-[8cqw] top-[56cqw]">
        {c.topik.length > 0 && <p className="text-[3.8cqw] font-semibold tracking-wide text-ember">{c.topik.slice(0, 2).join('  ·  ')}</p>}
        <h2 className="mt-[3cqw] line-clamp-5 font-serif text-[9.4cqw] font-bold leading-[1.08] tracking-tight text-fg">{c.judul}</h2>
        <div className="mt-[6cqw] flex items-center gap-[3cqw]">
          <PenulisAvatar foto={c.foto} size={80} />
          <p className="text-[4cqw] leading-tight text-fg-2"><span className="block font-semibold text-fg">{c.penulis}</span>{c.menit} menit baca</p>
        </div>
      </div>
      <p className="absolute inset-x-[8cqw] bottom-[42cqw] text-[4.2cqw] font-semibold text-fg-2">Baca selengkapnya</p>
      <ArrowDown aria-hidden weight="bold" className="absolute left-[8cqw] bottom-[35cqw] size-[5cqw] text-ember" />
    </div>
  )
}

/** Bagikan tulisan: kartu Story (dengan tautan otomatis disalin), WhatsApp, X, Threads, dan salin tautan. */
export function CeritaShare({ c }: { c: Cerita }) {
  const [busy, setBusy] = useState(false)
  const [note, setNote] = useState('')
  const stage = useRef<HTMLDivElement>(null)
  const url = `${siteUrl()}/cerita/${c.slug}`
  const text = `${c.judul}, oleh ${c.penulis}`

  const copy = async () => { try { await navigator.clipboard.writeText(url); return true } catch { return false } }

  useEffect(() => {
    if (!busy) return
    let alive = true
    const flash = (m: string, ms = 6000) => { if (alive) { setNote(m); window.setTimeout(() => setNote(''), ms) } }
    ;(async () => {
      await new Promise(r => setTimeout(r, 300))
      try {
        const blob = await renderPng(stage.current!, 1080, 1920)
        const r = await shareOrDownload(blob, `cerita-karhutla-${c.slug}.png`, { title: c.judul, text: `${text} ${url}` })
        if (r !== 'batal') flash('Tautan tulisan sudah disalin. Di Instagram, tambahkan stiker Tautan di Story, lalu tempel alamatnya agar bisa diklik.')
      } catch {
        flash('Gambar belum dapat dibuat. Silakan coba kembali.', 3200)
      } finally {
        if (alive) setBusy(false)
      }
    })()
    return () => { alive = false }
  }, [busy, c.judul, c.slug, text, url])

  const btn = 'btn btn-ghost min-h-11 gap-2 px-4 text-sm'
  return (
    <section aria-labelledby="bagikan" className="mt-12 rounded-panel border border-line bg-ink-2 p-5">
      <h2 id="bagikan" className="text-lg font-bold text-fg">Bagikan tulisan ini</h2>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" disabled={busy} aria-busy={busy} onClick={async () => { await copy(); setBusy(true) }} className="btn btn-primary min-h-11 gap-2 px-4 text-sm disabled:opacity-60"><ShareNetwork size={18} weight="bold" aria-hidden />{busy ? 'Menyiapkan gambar...' : 'Bagikan ke Story'}</button>
        <a className={btn} href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer"><WhatsappLogo size={18} weight="bold" aria-hidden />WhatsApp</a>
        <a className={btn} href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener noreferrer"><XLogo size={16} weight="bold" aria-hidden />X</a>
        <a className={btn} href={`https://www.threads.net/intent/post?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener noreferrer"><ThreadsLogo size={16} weight="bold" aria-hidden />Threads</a>
        <button type="button" className={btn} onClick={async () => { setNote((await copy()) ? 'Tautan disalin.' : url); window.setTimeout(() => setNote(''), 4000) }}><LinkSimple size={16} weight="bold" aria-hidden />Salin tautan</button>
      </div>
      <p role="status" aria-live="polite" className="mt-3 min-h-5 max-w-[60ch] text-sm text-fg-2">{note}</p>
      <p className="mt-1 max-w-[60ch] text-xs text-fg-3">Instagram hanya mengizinkan tautan yang bisa diklik lewat stiker Tautan yang Anda tambahkan sendiri di aplikasinya. Kartu Story menyisakan ruang kosong di bawah untuk stiker itu.</p>
      {busy && <ExportStage ref={stage} width={1080} height={1920}><StoryCard c={c} /></ExportStage>}
    </section>
  )
}
