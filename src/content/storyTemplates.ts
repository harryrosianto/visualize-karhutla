import type { ImageName } from '../lib/images'

/** Templat Instagram Story bertema kesadaran karhutla. Data seluruh wilayah hanya dipakai pada templat berangka. */
export interface StoryTemplateDef {
  id: string
  image: ImageName
  /** full: foto memenuhi bingkai (untuk foto beresolusi tinggi); split: foto di bagian atas, panel gelap di bawah */
  layout: 'full' | 'split'
  position: string
  headline: string
  sub: string
  /** bila true, headline memakai total titik panas seluruh wilayah: "{n} hotspots." */
  stat?: boolean
  /** deskripsi singkat dalam Bahasa Indonesia untuk pembaca layar */
  alt: string
}

export const HASHTAG = '#visualizekarhutla'

export const TEMPLATES: StoryTemplateDef[] = [
  { id: 'hutan-terbakar', image: 'wildfire-1', layout: 'full', position: '50% 40%', headline: 'The forest is burning.', sub: 'Orangutans are running out of trees to climb.', alt: 'Orangutan pada pohon gundul di lanskap berasap.' },
  { id: 'di-balik-titik', image: 'wildfire-2', layout: 'split', position: '50% 50%', headline: 'Behind every hotspot, a life.', sub: 'Rescuers carry out what the fires leave behind.', alt: 'Petugas menggendong orangutan di tengah asap.' },
  { id: 'asap-tanpa-batas', image: 'wildfire-3', layout: 'split', position: '50% 50%', headline: 'Smoke has no borders.', sub: 'What burns here is breathed far beyond it.', alt: 'Asap tebal di atas hutan yang terbakar, tampak dari udara.' },
  { id: 'belum-berakhir', image: 'hero-forest-night', layout: 'full', position: '62% 50%', headline: 'The fires are not over.', sub: 'Tell someone today.', alt: 'Hutan terbakar pada malam hari.' },
  { id: 'masih-di-sana', image: 'firefighters-manggala', layout: 'split', position: '50% 50%', headline: 'They are still out there.', sub: 'Thank the people putting it out. Then ask why it keeps burning.', alt: 'Petugas pemadam menyemprotkan air ke lahan terbakar.' },
  { id: 'jaga-garis', image: 'firefighters-silhouette', layout: 'split', position: '50% 50%', headline: 'Hold the line.', sub: 'Forests and peatlands need defenders, not bystanders.', alt: 'Siluet petugas pemadam di depan kobaran api.' },
  { id: 'cegah', image: 'grass-fire-smoke', layout: 'full', position: '50% 50%', headline: 'Prevent it. Do not just put it out.', sub: 'Demand protection for forests and peat before they burn.', alt: 'Api menjalar di rerumputan kering di bawah pohon gundul.' },
  { id: 'bara', image: 'embers-closeup', layout: 'full', position: '50% 60%', headline: 'hotspots.', sub: 'In 2026, so far. Every ember is a warning.', stat: true, alt: 'Percikan bara beterbangan di udara malam.' },
]
