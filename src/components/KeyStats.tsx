import { useMemo } from 'react'
import { motion, useReducedMotion } from 'motion/react'
import { useData } from '../lib/DataContext'
import { MONTHS, fmt } from '../lib/data'
import { CountUp } from './CountUp'
import { Picture } from './Picture'
import { SourceNote } from './SourceNote'

/** Satu angka besar di kiri + daftar angka pendukung; foto di kanan. */
export function KeyStats() {
  const { kabs, meta } = useData()
  const reduce = useReducedMotion()
  const s = useMemo(() => {
    if (!kabs.length) return null
    const total = kabs.reduce((a, k) => a + k.total2026, 0)
    const top = [...kabs].sort((a, b) => b.total2026 - a.total2026)[0]
    const monthly = Array(10).fill(0)
    kabs.forEach(k => k.monthly.forEach((n, i) => (monthly[i] += n)))
    const peak = monthly.indexOf(Math.max(...monthly))
    const prov = new Map<string, number>()
    kabs.forEach(k => prov.set(k.provinceName, (prov.get(k.provinceName) ?? 0) + k.total2026))
    const topProv = [...prov.entries()].sort((a, b) => b[1] - a[1])[0]
    return { total, top, peak, peakN: monthly[peak], topProv }
  }, [kabs])

  return (
    <section className="relative mx-auto grid max-w-[1400px] gap-12 px-4 py-24 md:grid-cols-12 md:gap-8 md:px-8 md:py-36">
      <div className="md:col-span-7">
        <h2 className="text-xl font-semibold leading-snug text-fg-2 md:text-2xl">Titik panas terdeteksi satelit di Kalimantan sepanjang 2026</h2>
        <p className="mt-6 text-[clamp(4.25rem,17vw,12rem)] font-extrabold leading-[0.9] tracking-tighter text-fg">
          {s ? <CountUp value={s.total} duration={2.2} /> : <span className="inline-block h-[0.9em] w-3/4 animate-pulse rounded-panel bg-ink-3" />}
          <span className="text-ember">.</span>
        </p>
        <SourceNote className="mt-4" />

        <dl className="mt-14 max-w-xl divide-y divide-line">
          {s ? (
            <>
              <Row term="Kabupaten terbanyak" desc={s.top.name} sub={`${fmt(s.top.total2026)} titik`} />
              <Row term="Provinsi terbanyak" desc={s.topProv[0]} sub={`${fmt(s.topProv[1])} titik`} />
              <Row term="Bulan puncak" desc={MONTHS[s.peak]} sub={`${fmt(s.peakN)} titik`} />
            </>
          ) : null}
        </dl>
        <p className="mt-6 max-w-[60ch] text-sm leading-relaxed text-fg-3">
          Titik panas menandai piksel satelit yang lebih panas dari sekitarnya. Ini indikator kebakaran, bukan luas lahan yang terbakar.
          {meta?.isSample ? ' Angka di atas adalah DATA CONTOH.' : ''}
        </p>
      </div>

      <motion.figure
        initial={reduce ? false : { opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        className="relative min-h-[320px] overflow-hidden rounded-panel md:col-span-5 md:mt-24 md:min-h-[560px]"
      >
        <Picture name="grass-fire-smoke" sizes="(min-width: 768px) 40vw, 100vw" className="absolute inset-0 size-full object-cover" position="40% 60%" />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/40 to-ink/60" />
      </motion.figure>
    </section>
  )
}

function Row({ term, desc, sub }: { term: string; desc: string; sub: string }) {
  return (
    <div className="grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5">
      <dt className="text-sm text-fg-3">{term}</dt>
      <dd className="col-start-1 text-2xl font-bold tracking-tight text-fg md:text-3xl">{desc}</dd>
      <dd className="col-start-2 row-span-2 row-start-1 self-center text-right text-sm text-fg-2 num">{sub}</dd>
    </div>
  )
}
