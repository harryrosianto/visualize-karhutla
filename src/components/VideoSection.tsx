import { Play, SpeakerHigh } from '@phosphor-icons/react'
import { useInView, useReducedMotion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'

const YT_ORIGIN = 'https://www.youtube-nocookie.com'
const VIDEO = {
  id: 'aks6P_onYqo',
  title: 'Pahami Akar Masalah Kebakaran Hutan dalam 22 Menit | Second Thoughts on Karhutla',
  channel: 'The Reformist',
  channelUrl: 'https://www.youtube.com/@thereformistid',
}

/** Video YouTube tentang karhutla. Pemutar baru dimuat saat video mulai terlihat (diputar otomatis tanpa suara, sesuai aturan browser) atau saat tombol putar ditekan (dengan suara). Memakai domain youtube-nocookie. Tidak diputar otomatis bila pengguna memilih gerak dikurangi atau hemat data. */
export function VideoSection() {
  const [play, setPlay] = useState(false)
  const [muted, setMuted] = useState(false)
  const [soundOff, setSoundOff] = useState(false)
  const box = useRef<HTMLDivElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const reduce = useReducedMotion()
  const visible = useInView(box, { once: true, amount: 0.6 })
  useEffect(() => {
    const saveData = (navigator as any).connection?.saveData === true
    if (visible && !reduce && !saveData && !play) { setMuted(true); setSoundOff(true); setPlay(true) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reduce])
  // pemutar mengirim status (termasuk muted) lewat postMessage setelah kita "mendengarkan"; tombol hilang bila suara sudah menyala dari mana pun
  useEffect(() => {
    if (!play) return
    const onMsg = (e: MessageEvent) => {
      if (e.origin !== YT_ORIGIN || e.source !== frame.current?.contentWindow || typeof e.data !== 'string') return
      try { const m = JSON.parse(e.data); if (typeof m?.info?.muted === 'boolean') setSoundOff(m.info.muted) } catch { /* abaikan */ }
    }
    window.addEventListener('message', onMsg)
    return () => window.removeEventListener('message', onMsg)
  }, [play])
  const send = (msg: object) => frame.current?.contentWindow?.postMessage(JSON.stringify(msg), YT_ORIGIN)
  const listen = () => { send({ event: 'listening', id: 1 }); window.setTimeout(() => send({ event: 'listening', id: 1 }), 1200) }
  const unmute = () => { send({ event: 'command', func: 'unMute', args: [] }); send({ event: 'command', func: 'setVolume', args: [100] }); setSoundOff(false) }
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
        <div ref={box} className="relative aspect-video overflow-hidden rounded-panel border border-line bg-ink-2 md:col-span-8">
          {play ? (
            <iframe
              ref={frame} onLoad={listen}
              src={`${YT_ORIGIN}/embed/${VIDEO.id}?autoplay=1&rel=0&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}${muted ? '&mute=1' : ''}`}
              title={VIDEO.title}
              allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              className="absolute inset-0 size-full"
            />
          ) : (
            <button type="button" onClick={() => { setMuted(false); setSoundOff(false); setPlay(true) }} aria-label={`Putar video: ${VIDEO.title}`}
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
          {play && soundOff && (
            <button type="button" onClick={unmute}
              className="absolute left-3 top-3 z-10 inline-flex min-h-11 items-center gap-2 rounded-full bg-ember px-4 text-sm font-bold text-ink shadow-lg transition-transform active:scale-95 md:left-4 md:top-4">
              <SpeakerHigh size={20} weight="fill" aria-hidden />Nyalakan suara
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
