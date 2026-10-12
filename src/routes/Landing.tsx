import { Link, useNavigate } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { KabupatenPicker } from '../components/KabupatenPicker'
import { KeyStats } from '../components/KeyStats'
import { MapTeaser } from '../components/MapTeaser'
import { Picture } from '../components/Picture'

function CheckRegion() {
  const nav = useNavigate()
  return (
    <section id="cek" className="relative isolate overflow-hidden">
      <Picture name="firefighters-silhouette" sizes="100vw" className="absolute inset-0 -z-20 size-full object-cover" position="30% 50%" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-ink/80" />
      <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-ink-2 via-transparent to-ink" />
      <div className="mx-auto max-w-[1400px] px-4 py-28 md:px-8 md:py-44">
        <h2 className="max-w-[14ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">
          Telusuri data karhutla per wilayah<span className="text-ember">.</span>
        </h2>
        <p className="mt-6 max-w-[44ch] text-base leading-relaxed text-fg-2 md:text-lg">
          Pilih kabupaten/kota atau seluruh Kalimantan untuk melihat ringkasannya dalam delapan layar, kemudian bagikan.
        </p>
        <Link to="/wrapped/kalimantan" className="mt-8 inline-flex min-h-11 items-center text-fg-2 underline decoration-ember underline-offset-4 hover:text-fg">Lihat ringkasan seluruh Kalimantan</Link>
        <div className="mt-4">
          <KabupatenPicker onSelect={k => nav(`/wrapped/${k.slug}`)} />
        </div>
      </div>
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <Hero />
      <KeyStats />
      <MapTeaser />
      <CheckRegion />
    </>
  )
}
