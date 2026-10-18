import { Play } from '@phosphor-icons/react'
import { useState } from 'react'

const VIDEO = {
  id: 'aks6P_onYqo',
  title: 'Pahami Akar Masalah Kebakaran Hutan dalam 22 Menit | Second Thoughts on Karhutla',
  channel: 'The Reformist',
  channelUrl: 'https://www.youtube.com/@thereformistid',
}

/** Video YouTube tentang karhutla. Pemutar baru dimuat setelah diklik (tanpa pelacakan YouTube saat halaman dibuka) dan memakai domain youtube-nocookie. */
export function VideoSection() {
  const [play, setPlay] = useState(false)
  return (
    <section id="video" aria-labelledby="video-judul" className="mx-auto max-w-[1400px] px-4 py-24 md:px-8 md:py-36">
      <div className="grid gap-8 md:grid-cols-12 md:items-end">
        <div className="md:col-span-4">
          <h2 id="video-judul" className="text-4xl font-extrabold leading-[1.02] tracking-tighter text-fg md:text-5xl">Akar masalah karhutla<span className="text-ember">.</span></h2>
          <p className="mt-5 max-w-[36ch] text-base leading-relaxed text-fg-2">Titik panas di peta punya sebab. Tonton pembahasan tentang mengapa hutan dan lahan terus terbakar setiap tahun.</p>
          <p className="mt-5 text-sm text-fg-3">
            Video milik <a href={VIDEO.channelUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-ember underline-offset-4 hover:text-fg">{VIDEO.channel}</a>, diputar dari YouTube.
            {' '}<a href={`https://www.youtube.com/watch?v=${VIDEO.id}`} target="_blank" rel="noopener noreferrer" className="underline decoration-ember underline-offset-4 hover:text-fg">Buka di YouTube</a>
          </p>
        </div>
        <div className="relative aspect-video overflow-hidden rounded-panel border border-line bg-ink-2 md:col-span-8">
          {play ? (
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${VIDEO.id}?autoplay=1&rel=0`}
              title={VIDEO.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <button type="button" onClick={() => setPlay(true)} aria-label={`Putar video: ${VIDEO.title}`}
              className="group absolute inset-0 grid place-items-center bg-gradient-to-br from-ink-2 via-ink-3 to-ink text-left">
              <span aria-hidden className="absolute inset-0 opacity-60 [background:radial-gradient(60%_60%_at_30%_100%,rgb(249_115_22/0.35),transparent)]" />
              <span className="relative grid size-20 place-items-center rounded-full bg-ember text-ink transition-transform group-hover:scale-105 group-active:scale-95 md:size-24">
                <Play size={36} weight="fill" aria-hidden />
              </span>
              <span className="absolute inset-x-0 bottom-0 p-4 md:p-6">
                <span className="block max-w-[34ch] text-lg font-bold leading-tight text-fg md:text-2xl">{VIDEO.title.split(' | ')[0]}</span>
                <span className="mt-1 block text-sm text-fg-2">{VIDEO.channel} · 22 menit · tekan untuk memutar</span>
              </span>
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
