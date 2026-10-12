import { Link, useNavigate } from 'react-router-dom'
import { KabupatenPicker } from '../components/KabupatenPicker'

export default function WrappedPicker() {
  const nav = useNavigate()
  return (
    <section className="mx-auto min-h-[80dvh] max-w-[1400px] px-4 pb-32 pt-40 md:px-8">
      <h1 translate="no" className="max-w-[14ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">Karhutla Wrapped<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-fg-2">Pilih kabupaten/kota di Kalimantan untuk melihat ringkasan titik panas tahun 2026 dalam delapan layar.</p>
      <Link to="/wrapped/kalimantan" className="mt-8 inline-flex min-h-11 items-center text-fg-2 underline decoration-ember underline-offset-4 hover:text-fg">Lihat ringkasan seluruh Kalimantan</Link>
      <div className="mt-4"><KabupatenPicker autoFocus onSelect={k => nav('/wrapped/' + k.slug)} /></div>
    </section>
  )
}
