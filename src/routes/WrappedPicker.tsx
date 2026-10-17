import { ArrowRight } from '@phosphor-icons/react'
import { Link, useNavigate } from 'react-router-dom'
import { KabupatenPicker } from '../components/KabupatenPicker'

export default function WrappedPicker() {
  const nav = useNavigate()
  return (
    <section className="mx-auto min-h-[80dvh] max-w-[1400px] px-4 pb-32 pt-40 md:px-8">
      <h1 translate="no" className="max-w-[14ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">Karhutla Wrapped<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-fg-2">Pilih kabupaten/kota untuk melihat ringkasan titik panas tahun 2026 dalam delapan layar.</p>
      <ul className="mt-8 grid max-w-3xl gap-3 sm:grid-cols-2 sm:gap-4">
        {[
          { to: '/wrapped/kalimantan', title: 'Seluruh wilayah', desc: 'Lihat ringkasan gabungan seluruh provinsi.' },
          { to: '/templat', title: 'Templat Instagram Story', desc: 'Unduh templat kampanye kesadaran karhutla.' },
        ].map(c => (
          <li key={c.to}>
            <Link to={c.to} className="group flex h-full min-h-[104px] items-center justify-between gap-4 rounded-panel border border-line bg-ink-2 p-5 transition-colors hover:border-ember">
              <span>
                <span className="block text-lg font-bold text-fg">{c.title}</span>
                <span className="mt-1 block text-sm leading-snug text-fg-2">{c.desc}</span>
              </span>
              <ArrowRight size={22} weight="bold" aria-hidden className="shrink-0 text-ember transition-transform group-hover:translate-x-1" />
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-10 text-sm text-fg-3">Atau pilih kabupaten/kota:</p>
      <div className="mt-3"><KabupatenPicker autoFocus onSelect={k => nav('/wrapped/' + k.slug)} /></div>
    </section>
  )
}
