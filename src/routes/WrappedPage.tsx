import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ExportStage } from '../components/ExportContext'
import { StoryPlayer, type StorySlide } from '../components/wrapped/StoryPlayer'
import { SlideBurned, SlideCampaign, SlideMonth, SlideOpening, SlideRank, SlideTotal, SummaryCard, SummaryWide } from '../components/wrapped/slides'
import { ShareBar } from '../components/wrapped/ShareBar'
import { useData } from '../lib/DataContext'
import { REGION_SLUG, type Meta } from '../lib/data'
import { renderPng, shareOrDownload } from '../lib/exportImage'
import { shareText, siteHost, wrappedUrl } from '../lib/share'

type Job = { kind: 'slide'; idx: number } | { kind: 'wide' }

/** Bingkai merek untuk gambar layar yang dibagikan: wordmark, alamat situs, dan pita DATA CONTOH bila perlu. */
function ExportFrame({ meta, children }: { meta: Meta; children: ReactNode }) {
  return (
    <div className="relative size-full">
      {children}
      {meta.isSample && <div className="absolute inset-x-0 top-0 bg-ember py-[2cqw] text-center text-[3.6cqw] font-bold tracking-wide text-ink">DATA CONTOH. Angka bersifat fiktif dan hanya untuk pengujian tampilan.</div>}
      <div className="absolute inset-x-0 flex items-baseline justify-between px-[8cqw]" style={{ top: meta.isSample ? '12cqw' : '9cqw' }}>
        <p translate="no" className="text-[4.4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span></p>
        <p className="text-[3.2cqw] text-fg-2">{siteHost()}</p>
      </div>
    </div>
  )
}

export default function WrappedPage() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { kabs, meta, region, error } = useData()
  const kab = slug === REGION_SLUG ? region ?? undefined : kabs.find(k => k.slug === slug)
  const exit = useCallback(() => nav('/wrapped'), [nav])
  const [job, setJob] = useState<Job | null>(null)
  const [note, setNote] = useState('')
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (kab) document.title = `${kab.name} | Karhutla Wrapped 2026`
    return () => { document.title = 'Visualize Karhutla' }
  }, [kab])

  const slides = useMemo<StorySlide[] | null>(() => {
    if (!kab || !meta) return null
    const c = { kab, kabs, meta }
    return [
      { id: 'buka', title: `Setahun di balik asap, ${kab.name}`, node: <SlideOpening {...c} /> },
      { id: 'total', title: 'Total titik panas', node: <SlideTotal {...c} /> },
      { id: 'luas', title: 'Luas terbakar', node: <SlideBurned {...c} /> },
      { id: 'bulan', title: 'Bulan paling berasap', node: <SlideMonth {...c} /> },
      { id: 'rank', title: 'Peringkat di Kalimantan', node: <SlideRank {...c} /> },
      { id: 'kampanye', title: 'Karhutla belum berakhir. The fires are not over.', node: <SlideCampaign /> },
      { id: 'ringkas', title: 'Rangkuman', node: <SummaryCard {...c} /> },
    ]
  }, [kab, kabs, meta])

  // render dan bagikan gambar: satu layar (1080x1920) atau rangkuman lanskap (1600x900)
  useEffect(() => {
    if (!job || !kab || !meta || !slides) return
    let alive = true
    const flash = (m: string) => { if (alive) { setNote(m); window.setTimeout(() => setNote(''), 3200) } }
    ;(async () => {
      await new Promise(r => setTimeout(r, 250))
      try {
        const wide = job.kind === 'wide'
        const blob = await renderPng(stage.current!, wide ? 1600 : 1080, wide ? 900 : 1920)
        const base = `karhutla-wrapped-${kab.slug}`
        const name = wide ? `${base}-lanskap.png` : `${base}-layar-${job.idx + 1}.png`
        const r = await shareOrDownload(blob, name, { title: `${kab.name} | Karhutla Wrapped 2026`, text: `${shareText(kab, meta)} ${wrappedUrl(kab.slug)}` })
        if (r === 'diunduh') flash(wide ? 'Gambar lanskap diunduh. Lampirkan pada kiriman X atau Threads.' : 'Gambar diunduh.')
      } catch {
        flash('Gambar belum dapat dibuat. Silakan coba kembali.')
      } finally {
        if (alive) setJob(null)
      }
    })()
    return () => { alive = false }
  }, [job, kab, meta, slides])

  if (error) return <Message title="Data belum dapat dimuat" body="Periksa sambungan internet, kemudian muat ulang halaman." />
  if (!kabs.length || !meta) return <div className="grid min-h-dvh place-items-center bg-ink text-fg-3" role="status">Memuat ringkasan...</div>
  if (!kab || !slides) return <Message title="Wilayah tidak ditemukan" body="Tautan ini tidak sesuai dengan kabupaten/kota maupun wilayah Kalimantan." />

  const c = { kab, kabs, meta }
  return (
    <>
      <StoryPlayer
        slides={slides} isSample={meta.isSample} onExit={exit}
        onShareSlide={idx => setJob({ kind: 'slide', idx })} sharing={!!job}
        overlayLast={<ShareBar kab={kab} meta={meta} kabs={kabs} onWide={() => setJob({ kind: 'wide' })} busy={!!job} />}
      />
      <p role="status" aria-live="polite" className="pointer-events-none fixed inset-x-0 top-24 z-50 mx-auto w-fit max-w-[90vw] rounded-full bg-ink-2 px-4 py-2 text-center text-sm text-fg empty:hidden">{job ? 'Menyiapkan gambar...' : note}</p>
      {job?.kind === 'wide' && <ExportStage ref={stage} width={1600} height={900}><SummaryWide {...c} /></ExportStage>}
      {job?.kind === 'slide' && (
        <ExportStage ref={stage} width={1080} height={1920}>
          {slides[job.idx].id === 'ringkas'
            ? <SummaryCard {...c} variant="export" />
            : <ExportFrame meta={meta}>{slides[job.idx].node}</ExportFrame>}
        </ExportStage>
      )}
    </>
  )
}

function Message({ title, body }: { title: string; body: string }) {
  return (
    <section className="grid min-h-dvh place-items-center bg-ink px-4 text-center">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tighter text-fg">{title}<span className="text-ember">.</span></h1>
        <p className="mt-3 text-fg-2">{body}</p>
        <Link to="/wrapped" className="btn btn-primary mt-8">Pilih wilayah</Link>
      </div>
    </section>
  )
}
