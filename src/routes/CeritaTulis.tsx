import { ArrowLeft, Image as ImageIcon, Plus, Quotes, Minus, ListBullets, TextHTwo, TextHThree, TextB, TextItalic, LinkSimple } from '@phosphor-icons/react'
import Placeholder from '@tiptap/extension-placeholder'
import ImageExt from '@tiptap/extension-image'
import { EditorContent, useEditor, useEditorState } from '@tiptap/react'
import { BubbleMenu, FloatingMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import TurndownService from 'turndown'
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { AvatarPicker } from '../components/AvatarPicker'
import { randomAvatar } from '../components/PenulisAvatar'
import { TopikPicker } from '../components/TopikPicker'
import { renderMarkdown } from '../lib/markdown'
import { CERITA_URL, TURNSTILE_SITEKEY } from '../lib/site'

declare global {
  interface Window { turnstile?: { render: (el: HTMLElement, opts: Record<string, unknown>) => string; reset: (id?: string) => void; remove: (id: string) => void } }
}

const DRAFT_KEY = 'cerita-draf-v1'
const MAX_IMAGES = 8
const MAX_IMAGE_BYTES = 3 * 1024 * 1024

const td = new TurndownService({ headingStyle: 'atx', bulletListMarker: '-', codeBlockStyle: 'fenced', hr: '---', emDelimiter: '_' })

interface Draft { judul: string; html: string; topik: string[]; penulis: string; tautan: string; avatar: number; foto: string; wilayah: string; sumber: string }
const emptyDraft: Draft = { judul: '', html: '', topik: [], penulis: '', tautan: '', avatar: 0, foto: '', wilayah: '', sumber: '' }

function loadDraft(): Draft {
  try { return { ...emptyDraft, ...(JSON.parse(localStorage.getItem(DRAFT_KEY) ?? '{}') as Partial<Draft>) } } catch { return emptyDraft }
}

/** Perkecil gambar di browser (sisi terpanjang 1600 px, JPEG) lalu kembalikan sebagai data URL agar bisa disimpan di draf dan dikirim. */
async function toDataUrl(file: File): Promise<string> {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  const ctx = c.getContext('2d')!
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, c.width, c.height)
  ctx.drawImage(bmp, 0, 0, c.width, c.height)
  return c.toDataURL('image/jpeg', 0.85)
}

function dataUrlToFile(url: string, name: string): File {
  const [head, b64] = url.split(',')
  const mime = /data:([^;]+)/.exec(head)?.[1] ?? 'image/jpeg'
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return new File([bytes], name, { type: mime })
}

/** Ubah isi penyunting menjadi Markdown; gambar disisipkan sebagai img:N dan dikembalikan terpisah sebagai berkas. */
function serialize(html: string) {
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const files: File[] = []
  doc.querySelectorAll('img').forEach(img => {
    const src = img.getAttribute('src') ?? ''
    if (src.startsWith('data:image/')) { files.push(dataUrlToFile(src, `gambar-${files.length + 1}.jpg`)); img.setAttribute('src', `img:${files.length}`) } else img.remove()
  })
  return { markdown: td.turndown(doc.body.innerHTML).trim(), files }
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

export default function CeritaTulis() {
  const initial = useRef<Draft>(loadDraft())
  const [judul, setJudul] = useState(initial.current.judul)
  const [topik, setTopik] = useState<string[]>(initial.current.topik)
  const [penulis, setPenulis] = useState(initial.current.penulis)
  const [tautan, setTautan] = useState(initial.current.tautan)
  const [avatar, setAvatar] = useState(initial.current.avatar || randomAvatar())
  const [foto, setFoto] = useState(initial.current.foto)
  const [wilayah, setWilayah] = useState(initial.current.wilayah)
  const [sumber, setSumber] = useState(initial.current.sumber)
  const [saved, setSaved] = useState<'baru' | 'menyimpan' | 'tersimpan' | 'penuh'>('baru')
  const [preview, setPreview] = useState(false)
  const [previewHtml, setPreviewHtml] = useState('')
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done'>('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [imgError, setImgError] = useState('')
  const fileInput = useRef<HTMLInputElement>(null)
  const captchaBox = useRef<HTMLDivElement>(null)
  const widget = useRef('')
  const timer = useRef<number>(0)

  const insertImage = useCallback(async (ed: NonNullable<ReturnType<typeof useEditor>>, file: File) => {
    setImgError('')
    if (!/^image\/(png|jpe?g|webp|gif)$/.test(file.type)) { setImgError('Gunakan gambar PNG, JPG, WebP, atau GIF.'); return }
    let count = 0
    ed.state.doc.descendants(n => { if (n.type.name === 'image') count++ })
    if (count >= MAX_IMAGES) { setImgError(`Maksimal ${MAX_IMAGES} gambar per tulisan.`); return }
    try {
      const src = await toDataUrl(file)
      if (src.length * 0.75 > MAX_IMAGE_BYTES) { setImgError('Gambar terlalu besar setelah dikecilkan.'); return }
      ed.chain().focus().setImage({ src, alt: '' }).run()
    } catch { setImgError('Gambar tidak dapat dibaca.') }
  }, [])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] }, codeBlock: false, code: false, strike: false, underline: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' } },
      }),
      ImageExt.configure({ allowBase64: true }),
      Placeholder.configure({ placeholder: 'Tulis ceritamu...' }),
    ],
    content: initial.current.html || '',
    editorProps: {
      attributes: { class: 'cerita-prose cerita-editor focus:outline-none', 'aria-label': 'Isi tulisan', role: 'textbox', 'aria-multiline': 'true' },
      handlePaste: (_v, e) => {
        const f = Array.from(e.clipboardData?.files ?? []).find(x => x.type.startsWith('image/'))
        if (f && editorRef.current) { e.preventDefault(); void insertImage(editorRef.current, f); return true }
        return false
      },
      handleDrop: (_v, e) => {
        const f = Array.from((e as DragEvent).dataTransfer?.files ?? []).find(x => x.type.startsWith('image/'))
        if (f && editorRef.current) { e.preventDefault(); void insertImage(editorRef.current, f); return true }
        return false
      },
    },
  })
  const editorRef = useRef(editor)
  editorRef.current = editor

  const st = useEditorState({
    editor,
    selector: ({ editor: e }) => ({ bold: !!e?.isActive('bold'), italic: !!e?.isActive('italic'), link: !!e?.isActive('link'), h2: !!e?.isActive('heading', { level: 2 }), quote: !!e?.isActive('blockquote') }),
  })

  // simpan draf otomatis; gambar ikut tersimpan sebagai data URL selama kuota peramban cukup
  const save = useCallback(() => {
    if (!editor) return
    setSaved('menyimpan')
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => {
      try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ judul, html: editor.getHTML(), topik, penulis, tautan, avatar, foto, wilayah, sumber } satisfies Draft))
        setSaved('tersimpan')
      } catch { setSaved('penuh') }
    }, 800)
  }, [editor, judul, topik, penulis, tautan, avatar, foto, wilayah, sumber])
  useEffect(() => { if (phase !== 'done') save() }, [judul, topik, penulis, tautan, avatar, foto, wilayah, sumber, save, phase])
  useEffect(() => {
    if (!editor) return
    const h = () => { if (phase !== 'done') save() }
    editor.on('update', h)
    return () => { editor.off('update', h) }
  }, [editor, save, phase])
  useEffect(() => { document.title = 'Tulis cerita | Visualize Karhutla'; return () => { document.title = 'Visualize Karhutla'; window.clearTimeout(timer.current) } }, [])

  // captcha Turnstile
  useEffect(() => {
    if (!TURNSTILE_SITEKEY || phase === 'done') return
    let alive = true
    loadTurnstile().then(() => {
      if (!alive || !captchaBox.current || !window.turnstile || widget.current) return
      widget.current = window.turnstile.render(captchaBox.current, { sitekey: TURNSTILE_SITEKEY, theme: 'dark', callback: (t: string) => setToken(t), 'expired-callback': () => setToken(''), 'error-callback': () => setToken('') })
    }).catch(() => setError('Captcha tidak dapat dimuat. Muat ulang halaman lalu coba lagi.'))
    return () => { alive = false; if (widget.current && window.turnstile) { window.turnstile.remove(widget.current); widget.current = '' } }
  }, [phase])

  const togglePreview = () => {
    if (!preview && editor) setPreviewHtml(renderMarkdown(serialize(editor.getHTML()).markdown.replace(/\(img:(\d+)\)/g, '(#)')))
    setPreview(v => !v)
  }

  const addLink = () => {
    if (!editor) return
    const prev = editor.getAttributes('link').href as string | undefined
    const url = window.prompt('Alamat tautan (https://...)', prev ?? 'https://')
    if (url === null) return
    if (url.trim() === '') { editor.chain().focus().extendMarkRange('link').unsetLink().run(); return }
    if (!/^https?:\/\//i.test(url.trim())) { setImgError('Tautan harus diawali http:// atau https://'); return }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url.trim() }).run()
  }

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    if (!editor) return
    const { markdown, files } = serialize(editor.getHTML())
    if (judul.trim().length < 5) { setError('Judul minimal 5 huruf.'); return }
    if (markdown.split(/\s+/).length < 30) { setError('Tulisan terlalu singkat (minimal 30 kata).'); return }
    if (topik.length === 0) { setError('Pilih atau buat minimal satu topik.'); return }
    if (!penulis.trim()) { setError('Isi nama penulis.'); return }
    if (!token) { setError('Selesaikan verifikasi captcha terlebih dahulu.'); return }
    setPhase('sending')
    try {
      const fd = new FormData(e.currentTarget)
      fd.set('judul', judul.trim()); fd.set('topik', topik.join(',')); fd.set('penulis', penulis.trim()); fd.set('tautan_penulis', tautan.trim()); fd.set('wilayah', wilayah.trim()); fd.set('sumber', sumber.trim())
      if (foto) fd.append('foto', dataUrlToFile(foto, 'foto-penulis.jpg')); else fd.set('avatar', String(avatar))
      fd.set('isi', markdown); fd.set('cf-turnstile-response', token)
      for (const f of files) fd.append('gambar', f, f.name)
      const res = await fetch(CERITA_URL, { method: 'POST', body: fd })
      const out = (await res.json().catch(() => ({}))) as { ok?: boolean; message?: string }
      if (!res.ok || !out.ok) throw new Error(out.message || 'Tulisan belum dapat dikirim. Silakan coba lagi.')
      try { localStorage.removeItem(DRAFT_KEY) } catch { /* abaikan */ }
      setPhase('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Tulisan belum dapat dikirim. Silakan coba lagi.')
      setPhase('idle'); setToken('')
      if (widget.current && window.turnstile) window.turnstile.reset(widget.current)
    }
  }

  if (phase === 'done') {
    return (
      <div className="mx-auto max-w-[700px] px-4 pb-28 pt-40">
        <h1 className="font-serif text-4xl font-bold leading-tight text-fg md:text-5xl">Terima kasih<span className="text-ember">.</span></h1>
        <p className="mt-5 font-serif text-xl leading-relaxed text-fg-2">Tulisan Anda sudah masuk antrean tinjauan. Setelah disetujui pemelihara, tulisan akan terbit di halaman Cerita karhutla dengan nama Anda.</p>
        <Link to="/cerita" className="btn btn-primary mt-8">Kembali ke Cerita karhutla</Link>
      </div>
    )
  }

  const input = 'mt-1 w-full rounded-panel border border-line bg-ink-2 px-4 py-3 text-fg placeholder:text-fg-3 focus:border-ember focus:outline-none'
  const mbtn = (active: boolean) => `grid size-9 place-items-center rounded-md ${active ? 'bg-ember text-ink' : 'text-fg hover:bg-fg/10'}`
  const status = saved === 'menyimpan' ? 'Menyimpan...' : saved === 'tersimpan' ? 'Draf tersimpan' : saved === 'penuh' ? 'Draf terlalu besar untuk disimpan otomatis' : 'Draf'

  return (
    <div className="mx-auto max-w-[700px] px-4 pb-28 pt-28 md:pt-32">
      <div className="flex items-center justify-between gap-4 text-sm text-fg-3">
        <p className="flex items-center gap-3"><Link to="/cerita" className="inline-flex min-h-11 items-center gap-1.5 hover:text-fg"><ArrowLeft size={16} weight="bold" aria-hidden />Cerita</Link><span role="status" aria-live="polite">{status}</span></p>
        <div className="flex items-center gap-2">
          <button type="button" onClick={togglePreview} className="min-h-10 rounded-full border border-line px-4 font-semibold text-fg-2 hover:text-fg">{preview ? 'Kembali menulis' : 'Pratinjau'}</button>
          <a href="#kirim" className="inline-flex min-h-10 items-center rounded-full bg-ember px-4 font-semibold text-ink">Terbitkan</a>
        </div>
      </div>

      {preview ? (
        <article className="mt-10" aria-label="Pratinjau tulisan">
          <h1 className="font-serif text-4xl font-bold leading-[1.1] tracking-tight text-fg md:text-5xl">{judul || 'Tanpa judul'}</h1>
          <div className="cerita-prose mt-8" dangerouslySetInnerHTML={{ __html: previewHtml }} />
          <p className="mt-6 text-sm text-fg-3">Pratinjau: gambar tampil setelah tulisan terbit.</p>
        </article>
      ) : (
        <div className="mt-10">
          <textarea value={judul} onChange={e => setJudul(e.target.value)} rows={1} maxLength={120} aria-label="Judul" placeholder="Judul"
            onInput={e => { const t = e.currentTarget; t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' }}
            className="w-full resize-none overflow-hidden bg-transparent font-serif text-4xl font-bold leading-[1.15] tracking-tight text-fg placeholder:text-fg-3 focus:outline-none md:text-5xl" />
          <div className="relative mt-6">
            <EditorContent editor={editor} />
            {editor && (
              <>
                <FloatingMenu editor={editor} options={{ placement: 'bottom-start', offset: 6 }}>
                  <div className="flex flex-wrap items-center gap-1 rounded-full border border-line bg-ink-2 p-1 shadow-xl" role="toolbar" aria-label="Tambahkan elemen">
                    <span className="grid size-9 place-items-center text-fg-3" aria-hidden><Plus size={18} weight="bold" /></span>
                    <button type="button" aria-label="Sisipkan gambar" title="Gambar" onClick={() => fileInput.current?.click()} className={mbtn(false)}><ImageIcon size={20} aria-hidden /></button>
                    <button type="button" aria-label="Judul bagian" title="Judul bagian" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={mbtn(false)}><TextHTwo size={20} aria-hidden /></button>
                    <button type="button" aria-label="Subjudul" title="Subjudul" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={mbtn(false)}><TextHThree size={20} aria-hidden /></button>
                    <button type="button" aria-label="Kutipan" title="Kutipan" onClick={() => editor.chain().focus().toggleBlockquote().run()} className={mbtn(false)}><Quotes size={20} aria-hidden /></button>
                    <button type="button" aria-label="Daftar" title="Daftar" onClick={() => editor.chain().focus().toggleBulletList().run()} className={mbtn(false)}><ListBullets size={20} aria-hidden /></button>
                    <button type="button" aria-label="Garis pemisah" title="Garis pemisah" onClick={() => editor.chain().focus().setHorizontalRule().run()} className={mbtn(false)}><Minus size={20} aria-hidden /></button>
                  </div>
                </FloatingMenu>
                <BubbleMenu editor={editor} options={{ placement: 'top', offset: 8 }} shouldShow={({ editor: e, state }) => !state.selection.empty && e.isEditable && !e.isActive('image')}>
                  <div className="flex items-center gap-1 rounded-lg border border-line bg-ink-2 p-1 shadow-xl" role="toolbar" aria-label="Format teks">
                    <button type="button" aria-label="Tebal" aria-pressed={st?.bold} onClick={() => editor.chain().focus().toggleBold().run()} className={mbtn(!!st?.bold)}><TextB size={18} weight="bold" aria-hidden /></button>
                    <button type="button" aria-label="Miring" aria-pressed={st?.italic} onClick={() => editor.chain().focus().toggleItalic().run()} className={mbtn(!!st?.italic)}><TextItalic size={18} weight="bold" aria-hidden /></button>
                    <button type="button" aria-label="Tautan" aria-pressed={st?.link} onClick={addLink} className={mbtn(!!st?.link)}><LinkSimple size={18} weight="bold" aria-hidden /></button>
                    <button type="button" aria-label="Judul bagian" aria-pressed={st?.h2} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={mbtn(!!st?.h2)}><TextHTwo size={18} aria-hidden /></button>
                    <button type="button" aria-label="Kutipan" aria-pressed={st?.quote} onClick={() => editor.chain().focus().toggleBlockquote().run()} className={mbtn(!!st?.quote)}><Quotes size={18} aria-hidden /></button>
                  </div>
                </BubbleMenu>
              </>
            )}
          </div>
          <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f && editor) void insertImage(editor, f); e.target.value = '' }} />
          <p className="mt-6 text-sm text-fg-3">Klik baris kosong lalu tombol di bawahnya untuk menambah gambar, judul bagian, kutipan, atau daftar. Blok teks untuk memberi format. Gambar juga dapat ditempel atau diseret ke sini.</p>
          {imgError && <p role="alert" className="mt-2 text-sm text-ember">{imgError}</p>}
        </div>
      )}

      <form id="kirim" onSubmit={submit} className="mt-16 grid scroll-mt-24 gap-5 rounded-panel border border-line bg-ink-2 p-6">
        <h2 className="text-2xl font-bold text-fg">Sebelum terbit</h2>
        <TopikPicker value={topik} onChange={setTopik} />
        <label className="block text-sm font-semibold text-fg">Nama penulis
          <input value={penulis} onChange={e => setPenulis(e.target.value)} maxLength={60} className={input} placeholder="Nama atau nama pena (tampil di tulisan)" />
        </label>
        <label className="block text-sm font-semibold text-fg">Tautan portofolio atau media sosial <span className="font-normal text-fg-3">(opsional)</span>
          <input value={tautan} onChange={e => setTautan(e.target.value)} type="url" maxLength={200} className={input} placeholder="https://" />
        </label>
        <AvatarPicker avatar={avatar} foto={foto} onAvatar={setAvatar} onFoto={setFoto} onError={setImgError} />
        <label className="block text-sm font-semibold text-fg">Wilayah terkait <span className="font-normal text-fg-3">(opsional)</span>
          <input value={wilayah} onChange={e => setWilayah(e.target.value)} maxLength={80} className={input} placeholder="Misalnya kabupaten atau provinsi" />
        </label>
        <label className="block text-sm font-semibold text-fg">Tautan sumber atau rujukan <span className="font-normal text-fg-3">(opsional)</span>
          <input value={sumber} onChange={e => setSumber(e.target.value)} type="url" maxLength={300} className={input} placeholder="https:// atau tautan DOI" />
          <span className="mt-1 block text-xs font-normal text-fg-3">Untuk tulisan berbasis publikasi, tulis dengan kata-kata sendiri dan sertakan tautannya; jangan menyalin seluruh isi yang berhak cipta.</span>
        </label>
        <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute left-[-9999px] h-0 w-0 opacity-0" />
        <label className="flex items-start gap-3 text-sm text-fg-2"><input type="checkbox" name="hak" required className="mt-1 size-4 accent-[#ff6a1f]" /><span>Tulisan ini karya saya sendiri (atau saya berhak penuh mengirimkannya), dan saya mengizinkan situs memuatnya dengan mencantumkan nama saya.</span></label>
        <label className="flex items-start gap-3 text-sm text-fg-2"><input type="checkbox" name="izin" required className="mt-1 size-4 accent-[#ff6a1f]" /><span>Saya tidak mencantumkan data pribadi pihak lain tanpa izin.</span></label>
        {TURNSTILE_SITEKEY ? <div ref={captchaBox} /> : <p className="text-sm text-fg-2">Pengiriman belum aktif untuk sementara. Silakan coba lagi nanti.</p>}
        {error && <p role="alert" className="text-sm text-ember">{error}</p>}
        <p className="text-xs text-fg-3">Tulisan ditinjau pemelihara sebelum terbit. Judul, isi, dan nama penulis akan tampil publik.</p>
        <button type="submit" disabled={phase === 'sending' || !TURNSTILE_SITEKEY} className="btn btn-primary w-full disabled:opacity-60 sm:w-fit">{phase === 'sending' ? 'Mengirim...' : 'Kirim untuk ditinjau'}</button>
      </form>
    </div>
  )
}
