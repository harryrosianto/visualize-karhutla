import { ArrowLeft, ArrowSquareOut, LinkSimple } from '@phosphor-icons/react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { KATEGORI, cerita } from '../lib/cerita'
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
      <p className="mt-6 text-sm font-semibold text-ember">{KATEGORI[c.kategori].label}{c.wilayah ? <span className="font-normal text-fg-3"> · {c.wilayah}</span> : null}</p>
      <h1 className="mt-3 font-serif text-4xl font-bold leading-[1.1] tracking-tight text-fg md:text-5xl">{c.judul}</h1>
      {c.ringkasan && <p className="mt-5 font-serif text-xl leading-relaxed text-fg-2 md:text-2xl">{c.ringkasan}</p>}
      <div className="mt-8 flex items-center justify-between gap-4 border-y border-line py-4 text-sm text-fg-3">
        <p><span className="font-semibold text-fg">{c.penulis}</span>{c.tanggal ? ` · ${fmtDate(c.tanggal)}` : ''} · {c.menit} menit baca</p>
        <button type="button" onClick={copy} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-3 text-fg-2 hover:text-fg"><LinkSimple size={16} weight="bold" aria-hidden />Salin tautan</button>
      </div>
      <p role="status" aria-live="polite" className="mt-2 min-h-5 text-sm text-fg">{note}</p>
      {c.gambar && <img src={c.gambar} alt="" className="mt-6 w-full rounded-panel border border-line" />}
      <div className="cerita-prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />

      {(c.sumber || c.rujukan) && (
        <aside className="mt-12 rounded-panel border border-line bg-ink-2 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wide text-fg-3">Sumber</h2>
          {c.rujukan && <p className="mt-2 font-serif text-lg leading-relaxed text-fg-2">{c.rujukan}</p>}
          {c.sumber && <a href={c.sumber} target="_blank" rel="noopener noreferrer nofollow" className="mt-3 inline-flex items-center gap-1.5 font-semibold text-fg underline decoration-ember underline-offset-4 hover:text-ember">Buka publikasi asli<ArrowSquareOut size={16} weight="bold" aria-hidden /></a>}
        </aside>
      )}

      {others.length > 0 && (
        <section className="mt-16 border-t border-line pt-10" aria-labelledby="lainnya">
          <h2 id="lainnya" className="text-xl font-bold text-fg">Cerita lainnya</h2>
          <ul className="mt-5 grid gap-5">
            {others.map(o => (
              <li key={o.slug}><Link to={`/cerita/${o.slug}`} className="block"><span className="text-xs font-semibold text-ember">{KATEGORI[o.kategori].label}</span><span className="mt-1 block text-lg font-bold leading-snug text-fg hover:text-ember">{o.judul}</span><span className="text-sm text-fg-3">{o.penulis}</span></Link></li>
            ))}
          </ul>
        </section>
      )}
    </article>
  )
}
