import { PencilSimpleLine } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { KATEGORI, cerita, type Kategori } from '../lib/cerita'
import { fmtDate } from '../lib/data'
import { THREADS_URL, issueUrl } from '../lib/site'

const TABS: ('semua' | Kategori)[] = ['semua', 'ilmiah', 'warga', 'opini']

export default function Cerita() {
  const [params, setParams] = useSearchParams()
  const tab = (TABS as string[]).includes(params.get('k') ?? '') ? (params.get('k') as 'semua' | Kategori) : 'semua'
  const [announce, setAnnounce] = useState('')
  const list = tab === 'semua' ? cerita : cerita.filter(c => c.kategori === tab)

  useEffect(() => { document.title = 'Cerita karhutla | Visualize Karhutla'; return () => { document.title = 'Visualize Karhutla' } }, [])
  useEffect(() => { setAnnounce(`${list.length} cerita ditampilkan`) }, [list.length])

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-28 pt-32 md:pt-40">
      <h1 className="text-4xl font-extrabold leading-[1] tracking-tighter text-fg sm:text-5xl md:text-7xl">Cerita karhutla<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-fg-2">Kajian ilmiah, kisah warga terdampak, dan pandangan masyarakat tentang kebakaran hutan dan lahan. Angka memberi gambaran; cerita menjelaskan dampaknya.</p>

      <div role="tablist" aria-label="Kategori cerita" className="mt-10 flex flex-wrap gap-2 border-b border-line pb-4">
        {TABS.map(t => (
          <button key={t} type="button" role="tab" aria-selected={tab === t} onClick={() => setParams(t === 'semua' ? {} : { k: t }, { replace: true })}
            className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${tab === t ? 'bg-ember text-ink' : 'border border-line text-fg-2 hover:text-fg'}`}>
            {t === 'semua' ? 'Semua' : KATEGORI[t].label}
          </button>
        ))}
      </div>
      <p role="status" aria-live="polite" className="sr-only">{announce}</p>

      {list.length === 0 ? (
        <div className="py-16">
          <p className="font-serif text-2xl leading-snug text-fg">Belum ada cerita di kategori ini.</p>
          <p className="mt-3 max-w-[50ch] text-fg-2">Jadilah penulis pertama. Kisah Anda, sependek apa pun, membantu orang lain memahami apa yang terjadi di lapangan.</p>
        </div>
      ) : (
        <ul>
          {list.map(c => (
            <li key={c.slug} className="border-b border-line py-8">
              <article>
                <p className="flex items-center gap-2 text-sm text-fg-2">
                  <span aria-hidden className="grid size-6 place-items-center rounded-full bg-ink-3 text-xs font-bold text-fg">{c.penulis.trim().charAt(0).toUpperCase()}</span>
                  <span className="font-semibold text-fg">{c.penulis}</span>
                  {c.tanggal && <span className="text-fg-3">· {fmtDate(c.tanggal)}</span>}
                </p>
                <div className="mt-3 grid grid-cols-[1fr_auto] items-start gap-4 sm:gap-8">
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold leading-tight tracking-tight text-fg md:text-2xl"><Link to={`/cerita/${c.slug}`} className="hover:text-ember">{c.judul}</Link></h2>
                    {c.ringkasan && <p className="mt-2 line-clamp-3 font-serif text-base leading-relaxed text-fg-2 md:text-lg">{c.ringkasan}</p>}
                  </div>
                  {c.gambar && <Link to={`/cerita/${c.slug}`} tabIndex={-1} aria-hidden className="block w-24 sm:w-40"><img src={c.gambar} alt="" loading="lazy" className="aspect-[4/3] w-full rounded-lg border border-line object-cover" /></Link>}
                </div>
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-fg-3">
                  <span className="rounded-full bg-ink-3 px-3 py-1 text-xs font-semibold text-fg-2">{KATEGORI[c.kategori].label}</span>
                  {c.wilayah && <span>{c.wilayah}</span>}
                  <span>{c.menit} menit baca</span>
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}

      <aside className="mt-14 rounded-panel border border-line bg-ink-2 p-6">
        <h2 className="flex items-center gap-2 text-xl font-bold text-fg"><PencilSimpleLine size={22} weight="bold" aria-hidden />Tulis ceritamu</h2>
        <p className="mt-3 text-fg-2">Anda warga terdampak, peneliti, atau ingin menyampaikan pendapat? Tulis langsung di situs seperti di Medium, tanpa akun. Setiap kiriman ditinjau pemelihara sebelum dimuat, dan nama penulis dicantumkan.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/cerita/tulis" className="btn btn-primary">Tulis di sini</Link>
          <a href={issueUrl('cerita.yml')} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Kirim lewat GitHub</a>
          <a href={THREADS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">DM Threads</a>
        </div>
      </aside>
    </div>
  )
}
