import { Link, useNavigate } from 'react-router-dom'
import { Hero } from '../components/Hero'
import { KabupatenPicker } from '../components/KabupatenPicker'
import { KeyStats } from '../components/KeyStats'
import { MapTeaser } from '../components/MapTeaser'
import { CommunityGallery } from '../components/CommunityGallery'
import { GalleryCollage } from '../components/GalleryCollage'
import { GalleryStory } from '../components/GalleryStory'
import { Picture } from '../components/Picture'
import { communityTemplates } from '../lib/community'

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

function Gallery() {
  return (
    <section id="galeri-warga" aria-labelledby="galeri-judul" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-36">
      <h2 id="galeri-judul" className="max-w-[14ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">Galeri warga<span className="text-ember">.</span></h2>
      <p className="mt-6 max-w-[52ch] text-base leading-relaxed text-fg-2 md:text-lg">
        Ilustrasi, foto, dan desain dari warga untuk mengingatkan bahwa karhutla belum berakhir. Unduh dan bagikan dengan mencantumkan nama kreator, atau kirim karya Anda sendiri.
      </p>
      <CommunityGallery limit={8} />
      <div className="mt-2 flex flex-wrap gap-3">
        <Link to="/templat#galeri-warga" className="btn btn-primary">{communityTemplates.length > 8 ? 'Lihat seluruh galeri' : 'Buka halaman galeri dan templat'}</Link>
        <Link to="/templat#galeri-warga" className="btn btn-ghost">Kirim karya Anda</Link>
      </div>
      <GalleryStory className="mt-4" />
      <GalleryCollage className="mt-4" />
    </section>
  )
}

export default function Landing() {
  return (
    <>
      <Hero />
      <KeyStats />
      <MapTeaser />
      <Gallery />
      <CheckRegion />
    </>
  )
}
