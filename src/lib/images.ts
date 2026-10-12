// Menyusun srcset dari hasil `npm run images` di src/assets/images/.
const urls = import.meta.glob('../assets/images/*.{avif,webp}', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

export type ImageName = 'hero-forest-night' | 'embers-closeup' | 'grass-fire-smoke'

export function imageSet(name: ImageName) {
  const build = (ext: 'avif' | 'webp') => {
    const entries = Object.entries(urls)
      .map(([k, v]) => {
        const m = k.match(/\/([a-z-]+)-(\d+)\.(avif|webp)$/)
        return m && m[1] === name && m[3] === ext ? { w: Number(m[2]), url: v } : null
      })
      .filter((x): x is { w: number; url: string } => !!x)
      .sort((a, b) => a.w - b.w)
    return { srcset: entries.map(e => `${e.url} ${e.w}w`).join(', '), fallback: entries[Math.floor(entries.length / 2)]?.url ?? '', largest: entries[entries.length - 1]?.url ?? '' }
  }
  return { avif: build('avif'), webp: build('webp') }
}

export const ALT: Record<ImageName, string> = {
  'hero-forest-night': 'Hutan di lereng bukit terbakar pada malam hari, nyala api oranye menembus kabut asap tebal di antara siluet pepohonan.',
  'embers-closeup': 'Percikan bara berterbangan di udara malam di atas semak yang terbakar, cahaya jingga redup di dasar gambar.',
  'grass-fire-smoke': 'Api menjalar di rerumputan kering di bawah pohon-pohon gundul, asap putih tebal menyelimuti lahan.',
}
