import { Camera, Shuffle, X } from '@phosphor-icons/react'
import { useRef } from 'react'
import { PenulisAvatar, randomAvatar } from './PenulisAvatar'

/** Pangkas gambar menjadi persegi 256x256 (JPEG) di browser. */
export async function cropSquare(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  const s = Math.min(bmp.width, bmp.height)
  const c = document.createElement('canvas')
  c.width = 256
  c.height = 256
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, 256, 256)
  ctx.drawImage(bmp, (bmp.width - s) / 2, (bmp.height - s) / 2, s, s, 0, 0, 256, 256)
  return c.toDataURL('image/jpeg', 0.88)
}

/** Pemilih foto profil penulis: unggah sendiri (opsional) atau pilih dari sembilan avatar hewan bawaan. */
export function AvatarPicker({ avatar, foto, onAvatar, onFoto, onError }: { avatar: number; foto: string; onAvatar: (n: number) => void; onFoto: (dataUrl: string) => void; onError: (m: string) => void }) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <fieldset>
      <legend className="text-sm font-semibold text-fg">Foto profil <span className="font-normal text-fg-3">(opsional; bila tidak diisi dipakai avatar bawaan)</span></legend>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <PenulisAvatar foto={foto || avatar} size={56} className="ring-2 ring-ember" />
        <button type="button" onClick={() => input.current?.click()} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-line px-4 text-sm font-semibold text-fg-2 hover:text-fg"><Camera size={16} weight="bold" aria-hidden />Unggah foto</button>
        {foto && <button type="button" onClick={() => onFoto('')} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-fg-2 hover:text-fg"><X size={14} weight="bold" aria-hidden />Hapus foto</button>}
        {!foto && <button type="button" onClick={() => onAvatar(randomAvatar())} className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-line px-4 text-sm text-fg-2 hover:text-fg"><Shuffle size={14} weight="bold" aria-hidden />Acak</button>}
        <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={async e => {
          const f = e.target.files?.[0]; e.target.value = ''
          if (!f) return
          if (!/^image\/(png|jpe?g|webp)$/.test(f.type)) { onError('Foto profil harus PNG, JPG, atau WebP.'); return }
          try { onFoto(await cropSquare(f)) } catch { onError('Foto tidak dapat dibaca.') }
        }} />
      </div>
      <div role="radiogroup" aria-label="Avatar bawaan" className="mt-3 flex flex-wrap gap-2">
        {Array.from({ length: 9 }, (_, i) => i + 1).map(n => (
          <button key={n} type="button" role="radio" aria-checked={!foto && avatar === n} aria-label={`Avatar ${n}`} onClick={() => { onFoto(''); onAvatar(n) }}
            className={`rounded-full p-0.5 ${!foto && avatar === n ? 'ring-2 ring-ember' : 'opacity-70 hover:opacity-100'}`}><PenulisAvatar foto={n} size={40} /></button>
        ))}
      </div>
    </fieldset>
  )
}
