const urls = import.meta.glob('../assets/avatars/a*.webp', { eager: true, query: '?url', import: 'default' }) as Record<string, string>

/** Alamat avatar bawaan (nomor 1 sampai 9). */
export const avatarUrl = (n: number) => urls[`../assets/avatars/a${n}.webp`] ?? urls['../assets/avatars/a1.webp']
export const randomAvatar = () => 1 + Math.floor(Math.random() * 9)

/** Foto profil penulis: avatar bawaan (nomor) atau gambar unggahan (alamat). */
export function PenulisAvatar({ foto, size = 28, className = '' }: { foto: number | string; size?: number; className?: string }) {
  const src = typeof foto === 'number' ? avatarUrl(foto) : foto
  return <img src={src} alt="" width={size} height={size} loading="lazy" decoding="async" className={`shrink-0 rounded-full bg-ink-3 object-cover ${className}`} style={{ width: size, height: size }} />
}
