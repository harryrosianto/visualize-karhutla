import { fmt, type Kab, type Meta } from './data'

const base = import.meta.env.BASE_URL
/** URL publik situs. Set VITE_SITE_URL saat build agar tautan dan og:image absolut. */
export function siteUrl() {
  const env = import.meta.env.VITE_SITE_URL as string | undefined
  const raw = env || (typeof location !== 'undefined' ? location.origin + base : '')
  return raw.replace(/\/+$/, '')
}
export const siteHost = () => siteUrl().replace(/^https?:\/\//, '')
export const wrappedUrl = (slug: string) => `${siteUrl()}/wrapped/${slug}`

export function shareText(kab: Kab, meta: Meta) {
  const sample = meta.isSample ? ' (DATA CONTOH)' : ''
  return `${kab.name}: ${fmt(kab.total2026)} titik panas karhutla sepanjang 2026${sample}. Cek wilayahmu di Karhutla Wrapped.`
}

export const xIntent = (kab: Kab, meta: Meta) =>
  `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText(kab, meta))}&url=${encodeURIComponent(wrappedUrl(kab.slug))}`

export const threadsIntent = (kab: Kab, meta: Meta) =>
  `https://www.threads.net/intent/post?text=${encodeURIComponent(`${shareText(kab, meta)} ${wrappedUrl(kab.slug)}`)}`
