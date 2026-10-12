import { useNavigate } from 'react-router-dom'
import { KabupatenPicker } from '../components/KabupatenPicker'

export default function WrappedPicker() {
  const nav = useNavigate()
  return (
    <section className="mx-auto min-h-[80dvh] max-w-[1400px] px-4 pb-32 pt-40 md:px-8">
      <h1 className="max-w-[14ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">Karhutla Wrapped<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-fg-2">Pilih kabupaten atau kota di Kalimantan untuk melihat ceritanya.</p>
      <div className="mt-10"><KabupatenPicker autoFocus onSelect={k => nav('/wrapped/' + k.slug)} /></div>
    </section>
  )
}
