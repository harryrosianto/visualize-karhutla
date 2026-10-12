import { useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useEffect } from 'react'
import { StoryPlayer, type StorySlide } from '../components/wrapped/StoryPlayer'
import { SlideBurned, SlideMonth, SlideOpening, SlideRank, SlideTotal, SummaryCard } from '../components/wrapped/slides'
import { ShareBar } from '../components/wrapped/ShareBar'
import { useData } from '../lib/DataContext'
import { REGION_SLUG } from '../lib/data'

export default function WrappedPage() {
  const { slug } = useParams()
  const nav = useNavigate()
  const { kabs, meta, region, error } = useData()
  const kab = slug === REGION_SLUG ? region ?? undefined : kabs.find(k => k.slug === slug)
  const exit = useCallback(() => nav('/wrapped'), [nav])

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
      { id: 'ringkas', title: 'Rangkuman', node: <SummaryCard {...c} /> },
    ]
  }, [kab, kabs, meta])

  if (error) return <Message title="Data belum dapat dimuat" body="Periksa sambungan internet, kemudian muat ulang halaman." />
  if (!kabs.length || !meta) return <div className="grid min-h-dvh place-items-center bg-ink text-fg-3" role="status">Memuat ringkasan...</div>
  if (!kab || !slides) return <Message title="Wilayah tidak ditemukan" body="Tautan ini tidak sesuai dengan kabupaten/kota maupun wilayah Kalimantan." />

  return (
    <StoryPlayer slides={slides} isSample={meta.isSample} onExit={exit} overlayLast={<ShareBar kab={kab} meta={meta} kabs={kabs} />} />
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
