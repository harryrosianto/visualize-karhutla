import { useEffect } from 'react'
import { GallerySection } from '../components/GallerySection'

export default function Galeri() {
  useEffect(() => { document.title = 'Galeri warga | Visualize Karhutla'; return () => { document.title = 'Visualize Karhutla' } }, [])
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-28 pt-32 md:px-8 md:pt-40">
      <GallerySection asPage />
    </div>
  )
}
