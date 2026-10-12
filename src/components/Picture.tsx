import { ALT, imageSet, type ImageName } from '../lib/images'
import { useExporting } from './ExportContext'

interface Props {
  name: ImageName
  sizes?: string
  eager?: boolean
  decorative?: boolean
  className?: string
  position?: string
  alt?: string
}

/** Gambar responsif AVIF/WebP dengan srcset. Lazy kecuali eager (hero). */
export function Picture({ name, sizes = '100vw', eager, decorative = true, className, position = 'center', alt }: Props) {
  const s = imageSet(name)
  const exporting = useExporting()
  // saat diekspor ke PNG, <picture>/<source> tidak ikut tersalin dengan benar; pakai <img> biasa
  if (exporting) return <img src={s.webp.largest} alt="" className={className} style={{ objectPosition: position }} />
  return (
    <picture>
      <source type="image/avif" srcSet={s.avif.srcset} sizes={sizes} />
      <source type="image/webp" srcSet={s.webp.srcset} sizes={sizes} />
      <img
        src={s.webp.fallback}
        alt={decorative ? '' : (alt ?? ALT[name])}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        decoding={eager ? 'sync' : 'async'}
        className={className}
        style={{ objectPosition: position }}
      />
    </picture>
  )
}
