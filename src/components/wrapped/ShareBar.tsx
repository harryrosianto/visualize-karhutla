import { DownloadSimple, ImageSquare, LinkSimple, ShareNetwork, ThreadsLogo, XLogo } from '@phosphor-icons/react'
import { toBlob } from 'html-to-image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { Kab, Meta } from '../../lib/data'
import { shareText, threadsIntent, wrappedUrl, xIntent } from '../../lib/share'
import { SummaryCard } from './slides'

type Status = 'menyiapkan' | 'siap' | 'gagal'

/** Kartu bagikan 1080x1920 dirender di luar layar begitu slide rangkuman tampil, supaya tombol bagikan langsung bekerja. */
export function ShareBar({ kab, meta, kabs, onWide, busy }: { kab: Kab; meta: Meta; kabs: Kab[]; onWide?: () => void; busy?: boolean }) {
  const card = useRef<HTMLDivElement>(null)
  const blob = useRef<Blob | null>(null)
  const [status, setStatus] = useState<Status>('menyiapkan')
  const [note, setNote] = useState('')
  const canNativeShare = typeof navigator !== 'undefined' && !!navigator.share

  const render = useCallback(async () => {
    if (blob.current) return blob.current
    await document.fonts.ready
    const el = card.current
    if (!el) throw new Error('kartu tidak ada')
    const b = await toBlob(el, { width: 1080, height: 1920, pixelRatio: 1, cacheBust: true, backgroundColor: '#0C0A09' })
    if (!b) throw new Error('gagal membuat gambar')
    blob.current = b
    if (import.meta.env.DEV) (window as any).__shareBlob = b
    return b
  }, [])

  useEffect(() => {
    let alive = true
    blob.current = null
    setStatus('menyiapkan')
    const t = window.setTimeout(() => {
      render().then(() => alive && setStatus('siap')).catch(() => alive && setStatus('gagal'))
    }, 350)
    return () => { alive = false; window.clearTimeout(t) }
  }, [kab.slug, render])

  const flash = (m: string) => { setNote(m); window.setTimeout(() => setNote(''), 2600) }
  const fileName = `karhutla-wrapped-${kab.slug}.png`

  const download = (b: Blob) => {
    const url = URL.createObjectURL(b)
    const a = document.createElement('a')
    a.href = url; a.download = fileName
    document.body.appendChild(a); a.click(); a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 4000)
  }

  const onShare = async () => {
    try {
      const b = await render()
      setStatus('siap')
      const file = new File([b], fileName, { type: 'image/png' })
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `${kab.name} | Karhutla Wrapped 2026`, text: `${shareText(kab, meta)} ${wrappedUrl(kab.slug)}` })
      } else {
        download(b)
        flash('Gambar diunduh.')
      }
    } catch (e: any) {
      if (e?.name === 'AbortError') return
      setStatus('gagal')
      flash('Gambar belum dapat dibuat. Silakan coba kembali.')
    }
  }

  const copy = async () => {
    const url = wrappedUrl(kab.slug)
    try {
      await navigator.clipboard.writeText(url)
      flash('Tautan disalin.')
    } catch {
      const t = document.createElement('textarea')
      t.value = url; document.body.appendChild(t); t.select()
      try { document.execCommand('copy'); flash('Tautan disalin.') } catch { flash(url) }
      t.remove()
    }
  }

  const sec = 'btn btn-ghost min-h-12 min-w-0 flex-1 gap-1 px-1.5 text-[13px]'
  return (
    <div className="pointer-events-auto grid gap-2">
      <button type="button" onClick={onShare} disabled={status === 'menyiapkan'} className="btn btn-primary w-full disabled:opacity-70">
        {canNativeShare ? <ShareNetwork size={20} weight="bold" aria-hidden /> : <DownloadSimple size={20} weight="bold" aria-hidden />}
        {status === 'menyiapkan' ? 'Menyiapkan gambar...' : 'Bagikan ke Story'}
      </button>
      <div className="flex gap-1.5">
        <a className={sec} href={xIntent(kab, meta)} target="_blank" rel="noopener noreferrer"><XLogo size={16} weight="bold" aria-hidden />X</a>
        <a className={sec} href={threadsIntent(kab, meta)} target="_blank" rel="noopener noreferrer"><ThreadsLogo size={16} weight="bold" aria-hidden />Threads</a>
        <button type="button" onClick={copy} className={sec}><LinkSimple size={16} weight="bold" aria-hidden />Tautan</button>
        {onWide && <button type="button" onClick={onWide} disabled={busy} aria-label="Unduh gambar lanskap untuk X dan Threads" title="Gambar lanskap 16:9 untuk X dan Threads" className={sec}><ImageSquare size={16} weight="bold" aria-hidden />Lanskap</button>}
      </div>
      <div className="flex items-center justify-between text-sm">
        <Link to="/wrapped" className="inline-flex min-h-11 items-center text-fg-2 underline underline-offset-4 hover:text-fg">Telusuri wilayah lain</Link>
        <p role="status" aria-live="polite" className="text-fg">{note}</p>
      </div>

      {/* kartu untuk diekspor, di luar layar */}
      <div aria-hidden className="pointer-events-none fixed left-[-12000px] top-0" style={{ width: 1080, height: 1920 }}>
        <div ref={card} style={{ width: 1080, height: 1920 }} className="[container-type:inline-size]">
          <SummaryCard kab={kab} kabs={kabs} meta={meta} variant="export" />
        </div>
      </div>
    </div>
  )
}
