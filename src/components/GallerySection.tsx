import { CommunityGallery } from './CommunityGallery'
import { GalleryCollage } from './GalleryCollage'
import { GalleryStory } from './GalleryStory'
import { SubmitArtwork } from './SubmitArtwork'
import { THREADS_URL, issueUrl } from '../lib/site'

/** Galeri warga lengkap: ajakan dan formulir kirim karya, alat bagikan (video Story dan kolase), serta seluruh karya. Dipakai di halaman Galeri dan Templat. */
export function GallerySection({ asPage = false }: { asPage?: boolean }) {
  const Heading = asPage ? 'h1' : 'h2'
  return (
    <section id="galeri-warga" aria-labelledby="galeri-warga-judul" className={asPage ? '' : 'mt-20 scroll-mt-24 border-t border-line pt-14'}>
      <Heading id="galeri-warga-judul" className={asPage ? 'max-w-[14ch] text-4xl font-extrabold leading-[1] tracking-tighter text-fg sm:text-5xl md:text-7xl' : 'text-3xl font-extrabold tracking-tight text-fg md:text-4xl'}>Galeri warga<span className="text-ember">.</span></Heading>
      <p className="mt-4 max-w-[60ch] text-fg-2">Karya ilustrator, fotografer, dan desainer grafis yang disumbangkan untuk kampanye ini. Semua kiriman ditinjau pemelihara sebelum dimuat. Silakan unduh dan bagikan dengan mencantumkan nama kreator.</p>
      <SubmitArtwork className="mt-6" />
      <div className="mt-6 flex flex-wrap gap-3">
        <a href={issueUrl('templat.yml')} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Kirim lewat GitHub</a>
        <a href={THREADS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Kirim lewat DM Threads</a>
      </div>
      <p className="mt-3 max-w-[60ch] text-sm text-fg-3">Ukuran dan rasio bebas: Story 9:16, lanskap desktop, atau lainnya. Kirim lewat formulir, lewat GitHub (akun gratis), atau lewat DM Threads @harrierosss. Semua kiriman disetujui terlebih dahulu sebelum tampil di sini.</p>
      <GalleryStory className="mt-6" />
      <GalleryCollage className="mt-4" />
      <CommunityGallery />
    </section>
  )
}
