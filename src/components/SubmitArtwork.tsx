import { UploadSimple } from '@phosphor-icons/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SUBMIT_URL, TURNSTILE_SITEKEY } from '../lib/site'

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id: string) => void } }
}

const MAX_FILES = 10 // satu kiriman = satu karya atau satu seri berurutan
const MAX_BYTES = 5 * 1024 * 1024
const MAX_TOTAL = 30 * 1024 * 1024
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

function loadTurnstile() {
  return new Promise<void>((resolve, reject) => {
    if (window.turnstile) return resolve()
    const s = document.createElement('script')
    s.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    s.async = true
    s.onload = () => resolve()
    s.onerror = () => reject(new Error('captcha'))
    document.head.appendChild(s)
  })
}

/** Perkecil gambar besar di browser (sisi terpanjang 2400 px) agar unggahan ringan; gambar kecil dikirim apa adanya. */
async function prepare(file: File): Promise<File> {
  if (file.size <= 1.5 * 1024 * 1024 || file.type === 'image/gif') return file
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 2400 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise<Blob | null>(r => c.toBlob(r, 'image/jpeg', 0.88))
  if (!blob) return file
  return new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' })
}

/** Formulir kirim karya langsung dari situs (tanpa akun GitHub). Hanya tampil bila kunci Turnstile dikonfigurasi. */
export function SubmitArtwork({ className = '' }: { className?: string }) {
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const [files, setFiles] = useState<File[]>([])
  const [token, setToken] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string>('')
  const enabled = !!TURNSTILE_SITEKEY

  useEffect(() => {
    if (!enabled || phase === 'done') return
    let alive = true
    loadTurnstile().then(() => {
      if (!alive || !box.current || !window.turnstile || widget.current) return
      widget.current = window.turnstile.render(box.current, {
        sitekey: TURNSTILE_SITEKEY, theme: 'dark',
        callback: (t: string) => setToken(t),
        'expired-callback': () => setToken(''),
        'error-callback': () => setToken(''),
      })
    }).catch(() => setError('Captcha tidak dapat dimuat. Muat ulang halaman atau pakai jalur GitHub atau DM.'))
    return () => {
      alive = false
      if (widget.current && window.turnstile) { window.turnstile.remove(widget.current); widget.current = '' }
    }
  }, [enabled, phase])

  if (!enabled) return null

  const pick = (list: FileList | null) => {
    const arr = Array.from(list ?? [])
    if (arr.some(f => !OK_TYPES.includes(f.type))) { setError('Gunakan gambar PNG, JPG, WebP, atau GIF.'); return }
    if (arr.length > MAX_FILES) { setError(`Maksimal ${MAX_FILES} gambar per kiriman.`); return }
    setError('')
    setFiles(arr)
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!files.length) { setError('Pilih minimal satu gambar.'); return }
    if (!token) { setError('Selesaikan verifikasi captcha terlebih dahulu.'); return }
    setPhase('sending')
    try {
      const fd = new FormData(e.currentTarget)
      fd.delete('gambar')
      let total = 0
      for (const f of files) {
        const p = await prepare(f)
        if (p.size > MAX_BYTES) throw new Error('Gambar terlalu besar (maksimal 5 MB setelah dikecilkan). Gunakan jalur GitHub atau DM untuk berkas besar.')
        total += p.size
        fd.append('gambar', p, p.name)
      }
      if (total > MAX_TOTAL) throw new Error('Total ukuran gambar terlalu besar (maksimal 30 MB). Kurangi jumlah gambar atau pakai jalur GitHub atau DM.')
      fd.set('cf-turnstile-response', token)
      const res = await fetch(SUBMIT_URL, { method: 'POST', body: fd })
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!res.ok || !out.ok) throw new Error(out.message || 'Kiriman belum dapat diproses. Silakan coba lagi.')
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Kiriman belum dapat diproses. Silakan coba lagi.')
      setPhase('idle')
      setToken('')
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current)
    }
  }

  const input = 'mt-1 w-full rounded-panel border border-line bg-ink-2 px-4 py-3 text-fg placeholder:text-fg-3 focus:border-ember focus:outline-none'
  if (phase === 'done') {
    return (
      <div className={className}>
        <p role="status" className="max-w-[60ch] rounded-panel border border-ember bg-ember/10 p-5 text-fg">Terima kasih. Karya Anda sudah masuk antrean tinjauan. Setelah disetujui, karya akan tampil di galeri lengkap dengan nama Anda.</p>
      </div>
    )
  }
  return (
    <div className={className}>
      <details className="max-w-xl rounded-panel border border-line bg-ink-2 p-5" id="kirim-karya">
        <summary className="flex cursor-pointer list-none items-center gap-2 font-bold text-fg"><UploadSimple size={20} weight="bold" aria-hidden />Kirim karya langsung dari sini (tanpa akun GitHub)</summary>
        <form onSubmit={submit} className="mt-5 grid gap-4">
          <label className="block text-sm font-semibold text-fg">Judul karya
            <input name="judul" required maxLength={80} className={input} />
          </label>
          <label className="block text-sm font-semibold text-fg">Deskripsi <span className="font-normal text-fg-3">(opsional)</span>
            <textarea name="deskripsi" rows={3} maxLength={400} className={input} placeholder="Satu deskripsi singkat untuk karya atau seri ini" />
          </label>
          <label className="block text-sm font-semibold text-fg">Nama kreator
            <input name="kreator" required maxLength={60} className={input} placeholder="Nama atau nama pena (tampil sebagai kredit)" />
          </label>
          <label className="block text-sm font-semibold text-fg">Tautan portofolio atau media sosial <span className="font-normal text-fg-3">(opsional)</span>
            <input name="tautan" type="url" maxLength={200} className={input} placeholder="https://" />
          </label>
          <label className="block text-sm font-semibold text-fg">Gambar
            <input name="gambar" type="file" accept={OK_TYPES.join(',')} multiple onChange={e => pick(e.target.files)} className={`${input} file:mr-3 file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-1.5 file:font-semibold file:text-ink`} />
            <span className="mt-1 block text-xs font-normal text-fg-3">PNG, JPG, WebP, atau GIF. Hingga {MAX_FILES} gambar. Lebih dari satu gambar ditampilkan sebagai satu seri yang bisa digeser, dengan satu judul dan satu deskripsi; gambar pertama menjadi sampul. Gambar besar dikecilkan otomatis. Ukuran dan rasio bebas.</span>
            {files.length > 1 && <span className="mt-2 block text-xs font-normal text-fg">Urutan seri: {files.map((f, k) => `${k + 1}. ${f.name}`).join('; ')}</span>}
          </label>
          {/* kolom jebakan bot: tidak terlihat oleh manusia */}
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
          <label className="flex items-start gap-3 text-sm text-fg-2"><input type="checkbox" name="hak" required className="mt-1 size-4 accent-[#ff6a1f]" /><span>Karya ini buatan saya sendiri (atau saya berhak penuh menyumbangkannya), dan tidak memuat merek, karya, atau wajah orang lain tanpa izin.</span></label>
          <label className="flex items-start gap-3 text-sm text-fg-2"><input type="checkbox" name="izin" required className="mt-1 size-4 accent-[#ff6a1f]" /><span>Saya mengizinkan pengunjung memakai, mengunduh, dan membagikan karya ini secara gratis untuk kampanye kesadaran karhutla dengan mencantumkan nama saya sebagai kredit.</span></label>
          <div ref={box} />
          {error && <p role="alert" className="text-sm text-ember">{error}</p>}
          <p className="text-xs text-fg-3">Kiriman ditinjau pemelihara sebelum tayang. Judul dan nama kreator akan tampil publik. Jangan mencantumkan data pribadi lain.</p>
          <button type="submit" disabled={phase === 'sending'} className="btn btn-primary w-full disabled:opacity-60 sm:w-fit">{phase === 'sending' ? 'Mengirim...' : 'Kirim karya'}</button>
        </form>
      </details>
    </div>
  )
}
