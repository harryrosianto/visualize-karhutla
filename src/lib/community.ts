import data from '../content/communityTemplates.json'

export interface CommunitySlide {
  id: string
  ext: 'jpg' | 'png'
  width: number
  height: number
  /** gambar diam (bingkai pertama bila GIF); dipakai kolase dan video */
  full: string
  thumb: string
  /** hanya untuk GIF animasi: pratinjau WebP animasi dan berkas GIF untuk diunduh */
  anim?: { webp: string; gif: string }
}

/** Karya sumbangan komunitas yang sudah disetujui pemelihara (ditambahkan otomatis oleh alur approve-template).
 *  Satu entri = satu karya atau satu seri berurutan. Bidang id/ext/width/height/full/thumb adalah gambar pertama (sampul),
 *  dipakai kolase dan video; seluruh gambar seri ada di `slides` (sampul di urutan pertama). */
export interface CommunityTemplate {
  id: string
  ext: 'jpg' | 'png'
  title: string
  creator: string
  creatorUrl: string
  description?: string
  width: number
  height: number
  issue: number
  full: string
  thumb: string
  slides: CommunitySlide[]
}

type RawSlide = { id: string; ext: 'jpg' | 'png'; width: number; height: number; anim?: boolean }
type Raw = Omit<CommunityTemplate, 'full' | 'thumb' | 'slides'> & { anim?: boolean; more?: RawSlide[] }

const urls = import.meta.glob('../assets/community/*.{jpg,png,webp,gif}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const resolve = (s: RawSlide): CommunitySlide => {
  const { anim, ...rest } = s
  const webp = urls[`../assets/community/${s.id}-anim.webp`], gif = urls[`../assets/community/${s.id}.gif`]
  return {
    ...rest, full: urls[`../assets/community/${s.id}.${s.ext}`], thumb: urls[`../assets/community/${s.id}-thumb.webp`],
    ...(anim && webp && gif ? { anim: { webp, gif } } : {}),
  }
}

export const communityTemplates: CommunityTemplate[] = (data as Raw[])
  .map(({ more, anim, ...t }) => {
    const slides = [resolve({ ...t, anim }), ...(more ?? []).map(resolve)].filter(s => s.full && s.thumb)
    return { ...t, full: slides[0]?.full, thumb: slides[0]?.thumb, slides }
  })
  .filter(t => t.full && t.thumb)
  .reverse()
