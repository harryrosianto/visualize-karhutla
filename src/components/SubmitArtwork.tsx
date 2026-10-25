import { ArrowDown, ArrowUp, DotsSixVertical, SortAscending, UploadSimple, X } from '@phosphor-icons/react'
import { Reorder, useDragControls } from 'motion/react'
import { useEffect, useRef, useState, type FormEvent } from 'react'
import { SUBMIT_URL, TURNSTILE_SITEKEY } from '../lib/site'

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id: string) => void } }
}

const MAX_FILES = 10 // satu kiriman = satu karya atau satu seri berurutan
const MAX_BYTES = 5 * 1024 * 1024
const MAX_TOTAL = 30 * 1024 * 1024
const MAX_GIF_BYTES = 5 * 1024 * 1024
const OK_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

interface Item { id: string; file: File; url: string }
const fmtSize = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`)

/** Satu baris gambar: diseret lewat pegangan di kiri, digeser dengan tombol naik/turun (untuk keyboard), atau dihapus. */
function Row({ it, k, n, onMove, onRemove }: { it: Item; k: number; n: number; onMove: (from: number, to: number) => void; onRemove: () => void }) {
  const controls = useDragControls()
  const btn = 'grid size-11 shrink-0 place-items-center rounded-full text-fg-2 transition-colors hover:text-fg disabled:opacity-30'
  return (
    <Reorder.Item value={it} dragListener={false} dragControls={controls} whileDrag={{ scale: 1.02, boxShadow: '0 12px 30px rgb(0 0 0 / 0.5)', zIndex: 20 }}
      className="relative flex items-center gap-2 rounded-panel border border-line bg-ink p-2 sm:gap-3">
      <button type="button" onPointerDown={e => controls.start(e)} aria-label={`Seret untuk memindah ${it.file.name}`}
        className="grid size-11 shrink-0 cursor-grab touch-none place-items-center rounded-full text-fg-3 hover:text-fg active:cursor-grabbing"><DotsSixVertical size={22} weight="bold" aria-hidden /></button>
      <img src={it.url} alt="" draggable={false} className="size-14 shrink-0 rounded-lg border border-line bg-ink-2 object-cover" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg"><span className={`mr-1.5 inline-block rounded-full px-2 py-0.5 text-xs ${k === 0 ? 'bg-ember text-ink' : 'bg-ink-3 text-fg-2'}`}>{k === 0 ? 'Sampul' : k + 1}</span>{it.file.name}</p>
        <p className="text-xs text-fg-3">{fmtSize(it.file.size)}{it.file.type === 'image/gif' ? ' · GIF' : ''}</p>
      </div>
      <button type="button" onClick={() => onMove(k, k - 1)} disabled={k === 0} aria-label={`Naikkan ${it.file.name} ke urutan ${k}`} className={btn}><ArrowUp size={18} weight="bold" aria-hidden /></button>
      <button type="button" onClick={() => onMove(k, k + 1)} disabled={k === n - 1} aria-label={`Turunkan ${it.file.name} ke urutan ${k + 2}`} className={btn}><ArrowDown size={18} weight="bold" aria-hidden /></button>
      <button type="button" onClick={onRemove} aria-label={`Hapus ${it.file.name}`} className={btn}><X size={18} weight="bold" aria-hidden /></button>
    </Reorder.Item>
  )
}

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
  const [items, setItems] = useState<Item[]>([])
  const itemsRef = useRef<Item[]>([])
  itemsRef.current = items
  const [token, setToken] = useState('')
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string>('')
  const enabled = !!TURNSTILE_SITEKEY
  // lepas URL pratinjau saat komponen dilepas
  useEffect(() => () => { itemsRef.current.forEach(i => URL.revokeObjectURL(i.url)) }, [])

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

  // gambar ditambahkan ke daftar (bukan menggantikan); urutan akhir diatur sebelum dikirim
  const pick = (list: FileList | null) => {
    const arr = Array.from(list ?? [])
    if (!arr.length) return
    if (arr.some(f => !OK_TYPES.includes(f.type))) { setError('Gunakan gambar PNG, JPG, WebP, atau GIF.'); return }
    const big = arr.find(f => f.type === 'image/gif' && f.size > MAX_GIF_BYTES)
    if (big) { setError(`GIF "${big.name}" melebihi 5 MB. Kecilkan dahulu atau pakai jalur GitHub atau DM.`); return }
    const known = new Set(items.map(i => `${i.file.name}|${i.file.size}|${i.file.lastModified}`))
    const fresh = arr.filter(f => !known.has(`${f.name}|${f.size}|${f.lastModified}`))
    if (items.length + fresh.length > MAX_FILES) { setError(`Maksimal ${MAX_FILES} gambar per kiriman.`); return }
    setError('')
    setItems(prev => [...prev, ...fresh.map(f => ({ id: crypto.randomUUID(), file: f, url: URL.createObjectURL(f) }))])
  }
  const move = (from: number, to: number) => setItems(prev => {
    if (to < 0 || to >= prev.length) return prev
    const next = [...prev]
    const [x] = next.splice(from, 1)
    next.splice(to, 0, x)
    return next
  })
  const remove = (id: string) => setItems(prev => {
    const x = prev.find(i => i.id === id)
    if (x) URL.revokeObjectURL(x.url)
    return prev.filter(i => i.id !== id)
  })
  const sortByName = () => setItems(prev => [...prev].sort((a, b) => a.file.name.localeCompare(b.file.name, undefined, { numeric: true, sensitivity: 'base' })))

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!items.length) { setError('Pilih minimal satu gambar.'); return }
    if (!token) { setError('Selesaikan verifikasi captcha terlebih dahulu.'); return }
    setPhase('sending')
    try {
      const fd = new FormData(e.currentTarget)
      fd.delete('gambar')
      let total = 0
      for (const { file: f } of items) {
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
      items.forEach(i => URL.revokeObjectURL(i.url))
      setItems([])
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
          <div>
            <label htmlFor="gambar-input" className="block text-sm font-semibold text-fg">Gambar</label>
            <input id="gambar-input" type="file" accept={OK_TYPES.join(',')} multiple onChange={e => { pick(e.target.files); e.target.value = '' }}
              className={`${input} file:mr-3 file:rounded-full file:border-0 file:bg-ember file:px-4 file:py-1.5 file:font-semibold file:text-ink`} />
            <p className="mt-1 text-xs text-fg-3">PNG, JPG, WebP, atau GIF animasi (GIF maksimal 5 MB). Hingga {MAX_FILES} gambar. Lebih dari satu gambar ditampilkan sebagai satu seri yang bisa digeser, dengan satu judul dan satu deskripsi; gambar pertama menjadi sampul. Gambar besar dikecilkan otomatis. Ukuran dan rasio bebas.</p>
            {items.length > 0 && (
              <div className="mt-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs text-fg-2">{items.length} gambar. Seret pegangan <DotsSixVertical size={14} weight="bold" aria-hidden className="inline align-text-bottom" /> atau pakai tombol panah untuk mengatur urutan seri.</p>
                  {items.length > 1 && <button type="button" onClick={sortByName} className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-line px-3 text-xs font-semibold text-fg-2 hover:text-fg"><SortAscending size={16} weight="bold" aria-hidden />Urutkan menurut nama</button>}
                </div>
                <Reorder.Group axis="y" values={items} onReorder={setItems} className="mt-2 grid gap-2">
                  {items.map((it, k) => <Row key={it.id} it={it} k={k} n={items.length} onMove={move} onRemove={() => remove(it.id)} />)}
                </Reorder.Group>
              </div>
            )}
          </div>
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
