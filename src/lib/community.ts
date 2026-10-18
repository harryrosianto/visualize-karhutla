import data from '../content/communityTemplates.json'

export interface CommunitySlide {
  id: string
  ext: 'jpg' | 'png'
  width: number
  height: number
  full: string
  thumb: string
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

type Raw = Omit<CommunityTemplate, 'full' | 'thumb' | 'slides'> & { more?: Omit<CommunitySlide, 'full' | 'thumb'>[] }

const urls = import.meta.glob('../assets/community/*.{jpg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>
const resolve = (s: { id: string; ext: 'jpg' | 'png'; width: number; height: number }): CommunitySlide => ({
  ...s, full: urls[`../assets/community/${s.id}.${s.ext}`], thumb: urls[`../assets/community/${s.id}-thumb.webp`],
})

export const communityTemplates: CommunityTemplate[] = (data as Raw[])
  .map(({ more, ...t }) => {
    const slides = [resolve(t), ...(more ?? []).map(resolve)].filter(s => s.full && s.thumb)
    return { ...t, full: slides[0]?.full, thumb: slides[0]?.thumb, slides }
  })
  .filter(t => t.full && t.thumb)
  .reverse()
