import { DownloadSimple, ShareNetwork } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { ExportStage } from '../components/ExportContext'
import { AddYoursTemplate, StoryTemplate } from '../components/wrapped/StoryTemplate'
import { HASHTAG, TEMPLATES } from '../content/storyTemplates'
import { useData } from '../lib/DataContext'
import { downloadBlob, renderPng, shareOrDownload } from '../lib/exportImage'
import { siteUrl } from '../lib/share'
import { CommunityGallery } from '../components/CommunityGallery'
import { ADD_YOURS_URL, THREADS_URL, issueUrl } from '../lib/site'

const ADD_YOURS = { id: 'add-yours', headline: 'Add yours' }
const PROMPT = 'Add yours: how are you speaking up for Kalimantan’s forests? #visualizekarhutla'

type Job = { id: string; mode: 'bagikan' | 'unduh' }

export default function Templates() {
  const { region } = useData()
  const total = region?.total2026 ?? null
  const [job, setJob] = useState<Job | null>(null)
  const [note, setNote] = useState('')
  const stage = useRef<HTMLDivElement>(null)
  const canShare = typeof navigator !== 'undefined' && !!navigator.share
  const isAdd = job?.id === 'add-yours'
  const current = job && (isAdd ? ADD_YOURS : TEMPLATES.find(t => t.id === job.id))

  useEffect(() => { document.title = 'Templat Story | Visualize Karhutla' }, [])

  useEffect(() => {
    if (!job || !current) return
    let alive = true
    const flash = (m: string) => { if (alive) { setNote(m); window.setTimeout(() => setNote(''), 3200) } }
    ;(async () => {
      await new Promise(r => setTimeout(r, 250))
      try {
        const blob = await renderPng(stage.current!, 1080, 1920)
        const name = `karhutla-story-${current.id}.png`
        if (job.mode === 'unduh') { downloadBlob(blob, name); flash('Gambar diunduh.') }
        else {
          const r = await shareOrDownload(blob, name, { title: 'Karhutla belum berakhir', text: `${current.headline.replace(/\.$/, '')}. ${HASHTAG} ${siteUrl()}/` })
          if (r === 'diunduh') flash('Gambar diunduh. Unggah ke Instagram Story dari galeri.')
        }
      } catch {
        flash('Gambar belum dapat dibuat. Silakan coba kembali.')
      } finally {
        if (alive) setJob(null)
      }
    })()
    return () => { alive = false }
  }, [job, current])

  const busy = !!job
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-28 pt-32 md:px-8 md:pt-40">
      <h1 className="max-w-[14ch] text-4xl font-extrabold leading-[1] tracking-tighter text-fg sm:text-5xl md:text-7xl">Templat Story<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-fg-2">
        Delapan templat Instagram Story bertema kesadaran karhutla, ditambah templat Add Yours. Unduh gambarnya, lalu unggah ke Story Anda. Di ponsel, tombol Bagikan membuka lembar bagikan perangkat sehingga gambar dapat langsung dikirim ke Instagram.
      </p>
      <p role="status" aria-live="polite" className="mt-4 min-h-6 text-sm text-fg">{busy ? 'Menyiapkan gambar...' : note}</p>

      <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-4 md:gap-x-6">
        {TEMPLATES.map(t => (
          <li key={t.id} className="min-w-0">
            <div role="img" aria-label={`${t.alt} Tulisan: ${t.headline}`} className="aspect-[9/16] overflow-hidden rounded-panel border border-line [container-type:inline-size]">
              <StoryTemplate t={t} total={total} />
            </div>
            <div className="mt-3 grid gap-2">
              <button type="button" disabled={busy} onClick={() => setJob({ id: t.id, mode: canShare ? 'bagikan' : 'unduh' })} className="btn btn-primary min-h-11 w-full gap-1.5 px-2 text-sm disabled:opacity-60">
                {canShare ? <ShareNetwork size={18} weight="bold" aria-hidden /> : <DownloadSimple size={18} weight="bold" aria-hidden />}
                {canShare ? 'Bagikan ke Story' : 'Unduh gambar'}
              </button>
              {canShare && (
                <button type="button" disabled={busy} onClick={() => setJob({ id: t.id, mode: 'unduh' })} className="btn btn-ghost min-h-11 w-full gap-1.5 px-2 text-sm disabled:opacity-60">
                  <DownloadSimple size={18} weight="bold" aria-hidden />Unduh
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <section aria-labelledby="addyours" className="mt-20 grid gap-10 border-t border-line pt-14 md:grid-cols-[minmax(0,280px)_1fr] md:gap-14">
        <div>
          <div role="img" aria-label="Templat Add Yours: slide penutup Wrapped dengan ruang kosong untuk stiker." className="aspect-[9/16] overflow-hidden rounded-panel border border-line [container-type:inline-size]">
            <AddYoursTemplate />
          </div>
          <div className="mt-3 grid gap-2">
            <button type="button" disabled={busy} onClick={() => setJob({ id: 'add-yours', mode: canShare ? 'bagikan' : 'unduh' })} className="btn btn-primary min-h-11 w-full gap-1.5 px-2 text-sm disabled:opacity-60">
              {canShare ? <ShareNetwork size={18} weight="bold" aria-hidden /> : <DownloadSimple size={18} weight="bold" aria-hidden />}
              {canShare ? 'Bagikan ke Story' : 'Unduh gambar'}
            </button>
            {canShare && <button type="button" disabled={busy} onClick={() => setJob({ id: 'add-yours', mode: 'unduh' })} className="btn btn-ghost min-h-11 w-full gap-1.5 px-2 text-sm disabled:opacity-60"><DownloadSimple size={18} weight="bold" aria-hidden />Unduh</button>}
          </div>
        </div>
        <div className="max-w-[56ch]">
          <h2 id="addyours" className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">Templat Add Yours<span className="text-ember">.</span></h2>
          <p className="mt-4 text-fg-2">Stiker Add Yours hanya dapat dibuat di dalam aplikasi Instagram, sehingga tidak bisa disertakan pada gambar. Templat ini menyisakan area kosong di bagian bawah untuk diisi stiker itu.</p>
          <ol className="mt-6 grid list-decimal gap-3 pl-5 text-fg-2">
            <li>Unduh templat ini, lalu buka Instagram dan pilih gambar tersebut sebagai Story baru.</li>
            <li>Ketuk ikon stiker, pilih <strong className="text-fg">Add Yours</strong>, lalu tempel pertanyaan pada kolom teks.</li>
            <li>Geser dan sesuaikan ukuran stiker di area kosong bagian bawah, kemudian unggah.</li>
          </ol>
          <div className="mt-6 rounded-panel border border-ember/60 bg-ember/10 p-5">
            <p className="font-bold text-fg">Ingin ikut tanpa membuat templat sendiri?</p>
            <p className="mt-1 text-sm text-fg-2">Buka Story Add Yours kami di Instagram, ketuk stikernya, lalu tambahkan Story Anda.</p>
            <a href={ADD_YOURS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-primary mt-4">Ikut Add Yours di Instagram</a>
          </div>
          <p className="mt-6 text-sm text-fg-3">Usulan teks stiker:</p>
          <p lang="en" translate="no" className="mt-1 rounded-panel border border-line bg-ink-2 p-4 text-fg">{PROMPT}</p>
          <button type="button" onClick={async () => { try { await navigator.clipboard.writeText(PROMPT); setNote('Teks stiker disalin.') } catch { setNote('Teks belum dapat disalin. Salin secara manual.') } window.setTimeout(() => setNote(''), 2600) }} className="btn btn-ghost mt-3">Salin teks stiker</button>
        </div>
      </section>

      <section id="galeri-warga" aria-labelledby="galeri-warga-judul" className="mt-20 scroll-mt-24 border-t border-line pt-14">
        <h2 id="galeri-warga-judul" className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">Galeri warga<span className="text-ember">.</span></h2>
        <p className="mt-4 max-w-[60ch] text-fg-2">Karya ilustrator, fotografer, dan desainer grafis yang disumbangkan untuk kampanye ini. Semua kiriman ditinjau pemelihara sebelum dimuat. Silakan unduh dan bagikan dengan mencantumkan nama kreator.</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <a href={issueUrl('templat.yml')} target="_blank" rel="noopener noreferrer" className="btn btn-primary">Kirim lewat GitHub</a>
          <a href={THREADS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Kirim lewat DM Threads</a>
        </div>
        <p className="mt-3 max-w-[60ch] text-sm text-fg-3">Ukuran dan rasio bebas: Story 9:16, lanskap desktop, atau lainnya. Kirim lewat GitHub (akun gratis) atau, bila tidak punya akun, lewat DM Threads @harrierosss. Semua kiriman disetujui terlebih dahulu sebelum tampil di sini.</p>
        <CommunityGallery />
      </section>

      <p className="mt-12 max-w-[64ch] text-sm leading-relaxed text-fg-3">
        Gambar berukuran 1080 x 1920 piksel (rasio 9:16). Foto bersumber dari aset bebas royalti; lihat rincian pada halaman Tentang. Angka pada templat terakhir berasal dari NASA FIRMS (VIIRS NOAA-20) dan mengikuti data terbaru situs ini.
      </p>
      {current && <ExportStage ref={stage} width={1080} height={1920}>{isAdd ? <AddYoursTemplate /> : <StoryTemplate t={current as typeof TEMPLATES[number]} total={total} />}</ExportStage>}
    </section>
  )
}
