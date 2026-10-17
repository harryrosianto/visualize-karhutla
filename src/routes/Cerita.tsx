import { PencilSimpleLine } from '@phosphor-icons/react'
import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { PenulisAvatar } from '../components/PenulisAvatar'
import { cerita, slugTopik, topikTerpakai } from '../lib/cerita'
import { fmtDate } from '../lib/data'

export default function Cerita() {
  const [params, setParams] = useSearchParams()
  const terpakai = topikTerpakai()
  const aktif = terpakai.find(t => t.slug === params.get('topik'))
  const [announce, setAnnounce] = useState('')
  const list = aktif ? cerita.filter(c => c.topik.some(t => slugTopik(t) === aktif.slug)) : cerita
  const pilih = (slug: string | null) => setParams(slug ? { topik: slug } : {}, { replace: true })

  useEffect(() => { document.title = 'Cerita karhutla | Visualize Karhutla'; return () => { document.title = 'Visualize Karhutla' } }, [])
  useEffect(() => { setAnnounce(`${list.length} cerita ditampilkan`) }, [list.length])

  return (
    <div className="mx-auto max-w-[760px] px-4 pb-28 pt-32 md:pt-40">
      <h1 className="text-4xl font-extrabold leading-[1] tracking-tighter text-fg sm:text-5xl md:text-7xl">Cerita karhutla<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-fg-2">Kajian ilmiah, kisah warga terdampak, dan pandangan masyarakat tentang kebakaran hutan dan lahan. Angka memberi gambaran; cerita menjelaskan dampaknya.</p>
      <Link to="/cerita/tulis" className="btn btn-primary mt-8"><PencilSimpleLine size={18} weight="bold" aria-hidden />Tulis ceritamu</Link>

      {terpakai.length > 0 && (
        <div className="mt-10 border-b border-line pb-4">
          <p className="text-sm font-semibold text-fg-3">Topik</p>
          <div role="group" aria-label="Saring menurut topik" className="mt-3 flex flex-wrap gap-2">
            <button type="button" aria-pressed={!aktif} onClick={() => pilih(null)} className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${!aktif ? 'bg-ember text-ink' : 'border border-line text-fg-2 hover:text-fg'}`}>Semua</button>
            {terpakai.map(t => (
              <button key={t.slug} type="button" aria-pressed={aktif?.slug === t.slug} onClick={() => pilih(t.slug)} className={`min-h-10 rounded-full px-4 text-sm font-semibold transition-colors ${aktif?.slug === t.slug ? 'bg-ember text-ink' : 'border border-line text-fg-2 hover:text-fg'}`}>{t.nama}</button>
            ))}
          </div>
        </div>
      )}
      <p role="status" aria-live="polite" className="sr-only">{announce}</p>

      {list.length === 0 ? (
        <div className="py-16">
          <p className="font-serif text-2xl leading-snug text-fg">Belum ada cerita{aktif ? ' pada topik ini' : ''}.</p>
          <p className="mt-3 max-w-[50ch] text-fg-2">Jadilah penulis pertama. Kisah Anda, sependek apa pun, membantu orang lain memahami apa yang terjadi di lapangan.</p>
          <Link to="/cerita/tulis" className="btn btn-ghost mt-6">Mulai menulis</Link>
        </div>
      ) : (
        <ul>
          {list.map(c => (
            <li key={c.slug} className="border-b border-line py-8">
              <article>
                <p className="flex items-center gap-2 text-sm text-fg-2">
                  <PenulisAvatar foto={c.foto} size={24} />
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
                <p className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-fg-3">
                  {c.topik.slice(0, 2).map(t => <button key={t} type="button" onClick={() => pilih(slugTopik(t))} className="rounded-full bg-ink-3 px-3 py-1 text-xs font-semibold text-fg-2 hover:text-fg">{t}</button>)}
                  {c.wilayah && <span>{c.wilayah}</span>}
                  <span>{c.menit} menit baca</span>
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
