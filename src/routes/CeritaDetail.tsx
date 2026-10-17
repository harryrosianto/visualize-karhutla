import { ArrowLeft, ArrowSquareOut, LinkSimple } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PenulisAvatar } from '../components/PenulisAvatar'
import { cerita, slugTopik } from '../lib/cerita'
import { fmtDate } from '../lib/data'
import { renderMarkdown } from '../lib/markdown'
import { siteUrl } from '../lib/share'

export default function CeritaDetail() {
  const { slug } = useParams()
  const c = cerita.find(x => x.slug === slug)
  const html = useMemo(() => (c ? renderMarkdown(c.body) : ''), [c])
  const [note, setNote] = useState('')

  useEffect(() => {
    if (c) document.title = `${c.judul} | Cerita karhutla`
    return () => { document.title = 'Visualize Karhutla' }
  }, [c])

  if (!c) {
    return (
      <div className="mx-auto max-w-[760px] px-4 pb-28 pt-40">
        <h1 className="text-4xl font-extrabold tracking-tighter text-fg">Cerita tidak ditemukan<span className="text-ember">.</span></h1>
        <p className="mt-4 text-fg-2">Tautan ini tidak sesuai dengan cerita mana pun.</p>
        <Link to="/cerita" className="btn btn-primary mt-8">Lihat semua cerita</Link>
      </div>
    )
  }

  const copy = async () => {
    const url = `${siteUrl()}/cerita/${c.slug}`
    try { await navigator.clipboard.writeText(url); setNote('Tautan disalin.') } catch { setNote(url) }
    window.setTimeout(() => setNote(''), 2600)
  }
  const others = cerita.filter(x => x.slug !== c.slug).slice(0, 3)

  return (
    <article className="mx-auto max-w-[720px] px-4 pb-28 pt-32 md:pt-40">
      <Link to="/cerita" className="inline-flex min-h-11 items-center gap-2 text-sm text-fg-3 hover:text-fg"><ArrowLeft size={16} weight="bold" aria-hidden />Cerita karhutla</Link>
      {c.wilayah && <p className="mt-6 text-sm text-fg-3">{c.wilayah}</p>}
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-fg md:text-5xl">{c.judul}</h1>
      <div className="mt-8 flex items-center justify-between gap-4 border-y border-line py-4 text-sm text-fg-3">
        <div className="flex min-w-0 items-center gap-3">
          <PenulisAvatar foto={c.foto} size={44} />
          <p className="min-w-0">
            <span className="block truncate font-semibold text-fg">{c.tautan ? <a href={c.tautan} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-ember underline-offset-4 hover:text-ember">{c.penulis}</a> : c.penulis}</span>
            <span className="block">{c.tanggal ? `${fmtDate(c.tanggal)} · ` : ''}{c.menit} menit baca</span>
          </p>
        </div>
        <button type="button" onClick={copy} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-3 text-fg-2 hover:text-fg"><LinkSimple size={16} weight="bold" aria-hidden />Salin tautan</button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-fg">{note}</p>
      <div className="cerita-prose mt-10" dangerouslySetInnerHTML={{ __html: html }} />

      {c.topik.length > 0 && (
        <ul className="mt-12 flex flex-wrap gap-2" aria-label="Topik">
          {c.topik.map(t => <li key={t}><Link to={`/cerita?topik=${slugTopik(t)}`} className="inline-flex min-h-9 items-center rounded-full bg-ink-3 px-4 text-sm font-semibold text-fg-2 hover:text-fg">{t}</Link></li>)}
        </ul>
      )}

      {(c.sumber || c.rujukan) && (
        <aside className="mt-12 rounded-panel border border-line bg-ink-2 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg-3">Sumber dan rujukan</h2>
          {c.rujukan && <p className="mt-2 font-serif text-lg leading-relaxed text-fg-2">{c.rujukan}</p>}
          {c.sumber && <a href={c.sumber} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-fg underline decoration-ember underline-offset-4 hover:text-ember">Buka publikasi asli<ArrowSquareOut size={16} weight="bold" aria-hidden /></a>}
        </aside>
      )}

      {others.length > 0 && (
        <section className="mt-16 border-t border-line pt-10" aria-labelledby="lainnya">
          <h2 id="lainnya" className="text-xl font-bold text-fg">Cerita lainnya</h2>
          <ul className="mt-5 grid gap-5">
            {others.map(o => (
              <li key={o.slug}><Link to={`/cerita/${o.slug}`} className="block"><span className="flex items-center gap-2 text-xs text-fg-3"><PenulisAvatar foto={o.foto} size={20} />{o.penulis}</span><span className="mt-1 block text-lg font-bold leading-snug text-fg hover:text-ember">{o.judul}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
