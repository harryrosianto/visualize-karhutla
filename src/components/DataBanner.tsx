import { useEffect, useRef } from 'react'
import { useData } from '../lib/DataContext'

/** Banner wajib selama data contoh dipakai. Tinggi diekspos sebagai --banner-h agar halaman peta pas layar. */
export function DataBanner() {
  const { meta } = useData()
  const ref = useRef<HTMLDivElement>(null)
  const show = !!meta?.isSample
  useEffect(() => {
    const root = document.documentElement
    if (!show || !ref.current) { root.style.setProperty('--banner-h', '0px'); return }
    const el = ref.current
    const set = () => root.style.setProperty('--banner-h', `${el.offsetHeight}px`)
    set()
    const ro = new ResizeObserver(set)
    ro.observe(el)
    return () => ro.disconnect()
  }, [show])
  if (!show) return null
  return (
    <div ref={ref} role="status" className="relative z-40 bg-ember px-4 py-2 text-center text-sm font-bold tracking-wide text-ink">
      DATA CONTOH. Angka pada situs ini bersifat fiktif dan hanya untuk pengujian tampilan. Hanya batas wilayah yang asli.
    </div>
  )
}
