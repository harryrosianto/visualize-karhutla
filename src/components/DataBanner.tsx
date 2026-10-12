import { useData } from '../lib/DataContext'

/** Banner wajib selama data contoh dipakai. */
export function DataBanner() {
  const { meta } = useData()
  if (!meta?.isSample) return null
  return (
    <div role="status" className="relative z-40 bg-ember px-4 py-2 text-center text-sm font-bold tracking-wide text-ink">
      DATA CONTOH. Angka di situs ini fiktif, hanya untuk menguji tampilan. Batas wilayah asli.
    </div>
  )
}
