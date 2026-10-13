import data from '../content/communityTemplates.json'

/** Templat sumbangan komunitas yang sudah disetujui pemelihara (ditambahkan otomatis oleh alur approve-template). */
export interface CommunityTemplate {
  id: string
  ext: 'jpg' | 'png'
  title: string
  creator: string
  creatorUrl: string
  width: number
  height: number
  issue: number
  full: string
  thumb: string
}

const urls = import.meta.glob('../assets/community/*.{jpg,png,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export const communityTemplates: CommunityTemplate[] = (data as Omit<CommunityTemplate, 'full' | 'thumb'>[])
  .map(t => ({ ...t, full: urls[`../assets/community/${t.id}.${t.ext}`], thumb: urls[`../assets/community/${t.id}-thumb.webp`] }))
  .filter(t => t.full && t.thumb)
  .reverse()
