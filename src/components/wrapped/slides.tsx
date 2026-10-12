import { motion, useReducedMotion, type Variants } from 'motion/react'
import type { ReactNode } from 'react'
import { HA_PER_FIELD, MONTHS, fmt, fmtDate, provinceTotals, sourceLine, type Kab, type Meta } from '../../lib/data'
import { siteHost } from '../../lib/share'
import { CountUp } from '../CountUp'
import { Picture } from '../Picture'
import type { ImageName } from '../../lib/images'
import { MonthBars } from './MonthBars'

export interface SlideCtx { kab: Kab; kabs: Kab[]; meta: Meta }

/** Ukuran huruf angka besar supaya muat lebar bingkai (satuan cqw = 1% lebar bingkai). */
const fit = (text: string, max = 34) => ({ fontSize: `${Math.min(max, 84 / (text.length * 0.56))}cqw` })

function useVariants(): { box: Variants; item: Variants } {
  const reduce = useReducedMotion()
  return {
    box: { hidden: {}, show: { transition: { staggerChildren: reduce ? 0 : 0.12, delayChildren: reduce ? 0 : 0.15 } } },
    item: {
      hidden: reduce ? { opacity: 1 } : { opacity: 0, y: 22 },
      show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.8, ease: [0.16, 1, 0.3, 1] } },
    },
  }
}

interface ShellProps { image?: ImageName; position?: string; dim?: number; children: ReactNode; footer?: ReactNode; glow?: boolean }

/** Latar slide: foto dengan overlay gelap (min 72%) atau warna solid + cahaya bara. */
export function SlideShell({ image, position = 'center', dim = 0.74, children, footer, glow = true }: ShellProps) {
  const { box } = useVariants()
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      {image ? (
        <>
          <div className="kb absolute inset-0"><Picture name={image} eager sizes="(min-width: 768px) 40vw, 100vw" className="size-full object-cover" position={position} /></div>
          <div aria-hidden className="absolute inset-0" style={{ background: `linear-gradient(to bottom, rgb(12 10 9 / ${dim}) 0%, rgb(12 10 9 / ${dim + 0.1}) 55%, rgb(12 10 9 / 0.95) 100%)` }} />
        </>
      ) : glow ? (
        <div aria-hidden className="glow-ember absolute inset-0 opacity-80" />
      ) : null}
      <motion.div variants={box} initial="hidden" animate="show" className="relative flex size-full flex-col px-[8cqw] pb-[10cqw] pt-[30cqw]">
        {children}
        {footer && <div className="mt-auto pt-[5cqw] text-[3.1cqw] leading-snug text-fg-2">{footer}</div>}
      </motion.div>
    </div>
  )
}

export const Kicker = ({ children }: { children: ReactNode }) => {
  const { item } = useVariants()
  return <motion.p variants={item} className="text-[4.6cqw] font-semibold leading-snug text-fg-2">{children}</motion.p>
}
export const Lead = ({ children }: { children: ReactNode }) => {
  const { item } = useVariants()
  return <motion.p variants={item} className="mt-[4cqw] max-w-[30ch] text-[4.6cqw] leading-snug text-fg-2">{children}</motion.p>
}
function Big({ text, children, max }: { text: string; children: ReactNode; max?: number }) {
  const { item } = useVariants()
  return <motion.p variants={item} style={fit(text, max)} className="mt-[3cqw] font-extrabold leading-[0.95] tracking-tighter text-fg">{children}<span className="text-ember">.</span></motion.p>
}
const Src = ({ meta, kind = 'hotspot' }: { meta: Meta; kind?: 'hotspot' | 'burnedArea' }) => <>{sourceLine(meta, kind)}</>

export function pct(now: number, before: number | null) {
  if (!before) return null
  return ((now - before) / before) * 100
}

/* 1. Pembuka */
export function SlideOpening({ kab }: SlideCtx) {
  const { item } = useVariants()
  return (
    <SlideShell image="hero-forest-night" position="62% 50%" dim={0.62}>
      <Kicker>Karhutla Wrapped 2026</Kicker>
      <motion.h2 variants={item} className="mt-[4cqw] text-[17cqw] font-extrabold leading-[0.92] tracking-tighter text-fg">Setahun di balik asap<span className="text-ember">.</span></motion.h2>
      <motion.p variants={item} style={{ fontSize: `${Math.min(14, 74 / (kab.name.length * 0.5))}cqw` }} className="mt-[7cqw] pb-[1cqw] font-serif italic leading-[1.1] text-ember">{kab.name}</motion.p>
      <motion.p variants={item} className="mt-[2cqw] text-[4.6cqw] text-fg-2">{kab.provinceName}</motion.p>
    </SlideShell>
  )
}

/** Kalimat perbandingan dengan periode yang sama pada 2025. */
function compareText(kab: Kab, meta: Meta) {
  const d = pct(kab.total2026, kab.total2025)
  if (d === null) return 'Data pembanding tahun 2025 belum tersedia.'
  return `${d >= 0 ? 'Meningkat' : 'Menurun'} ${fmt(Math.abs(d))}% dibandingkan ${fmt(kab.total2025!)} titik pada periode yang sama tahun 2025${meta.isSample ? ' (angka contoh)' : ''}.`
}

/* 2. Total titik panas */
export function SlideTotal({ kab, meta }: SlideCtx) {
  const txt = fmt(kab.total2026)
  const { item } = useVariants()
  return (
    <SlideShell image="embers-closeup" position="50% 65%" dim={0.7} footer={<Src meta={meta} />}>
      <Kicker>Jumlah titik panas yang terdeteksi di {kab.name}</Kicker>
      <Big text={txt}><CountUp value={kab.total2026} duration={1.8} start /></Big>
      <Lead>sejak 1 Januari 2026</Lead>
      <motion.p variants={item} className="mt-[8cqw] max-w-[28ch] text-[5.2cqw] font-semibold leading-snug text-fg">{compareText(kab, meta)}</motion.p>
    </SlideShell>
  )
}

/* 3. Luas terbakar */
export function SlideBurned({ kab, meta }: SlideCtx) {
  const { item } = useVariants()
  const fields = kab.burnedHa === null ? null : Math.round(kab.burnedHa / HA_PER_FIELD)
  return (
    <SlideShell image="firefighters-manggala" position="46% 50%" dim={0.78} footer={<Src meta={meta} kind="burnedArea" />}>
      <Kicker>Estimasi luas lahan terbakar setara dengan</Kicker>
      {fields === null ? (
        <>
          <motion.p variants={item} className="mt-[4cqw] text-[13cqw] font-extrabold leading-[0.98] tracking-tighter text-fg">Belum tersedia<span className="text-ember">.</span></motion.p>
          <Lead>Data luas lahan terbakar dari SiPongi untuk wilayah ini belum tersedia.</Lead>
        </>
      ) : (
        <>
          <Big text={fmt(fields)}><CountUp value={fields} duration={1.8} start /></Big>
          <Lead>lapangan sepak bola</Lead>
          <motion.p variants={item} className="mt-[8cqw] max-w-[30ch] text-[4.4cqw] leading-snug text-fg-2">
            Luas lahan terbakar tercatat {fmt(kab.burnedHa!)} hektare. Satu lapangan sepak bola dihitung seluas {String(HA_PER_FIELD).replace('.', ',')} hektare.
          </motion.p>
        </>
      )}
    </SlideShell>
  )
}

/* 4. Bulan dengan titik panas terbanyak */
export function SlideMonth({ kab, meta }: SlideCtx) {
  const { item } = useVariants()
  const n = kab.monthly[kab.peakMonth]
  const share = kab.total2026 ? (n / kab.total2026) * 100 : 0
  return (
    <SlideShell footer={<Src meta={meta} />}>
      <Kicker>Bulan dengan titik panas terbanyak</Kicker>
      <Big text={MONTHS[kab.peakMonth]} max={20}>{MONTHS[kab.peakMonth]}</Big>
      <Lead>{fmt(n)} titik panas, atau {fmt(share)}% dari total sepanjang tahun ini.</Lead>
      <motion.div variants={item} className="mt-[9cqw]"><MonthBars values={kab.monthly} peak={kab.peakMonth} /></motion.div>
    </SlideShell>
  )
}

/* 5. Peringkat (kabupaten/kota) atau peringkat provinsi (seluruh Kalimantan) */
export function SlideRank({ kab, kabs, meta }: SlideCtx) {
  const { item } = useVariants()
  if (kab.isRegion) {
    const prov = provinceTotals(kabs, meta)
    return (
      <SlideShell image="firefighters-silhouette" position="32% 50%" dim={0.74} footer={<Src meta={meta} />}>
        <Kicker>Provinsi dengan titik panas terbanyak</Kicker>
        <Big text={prov[0].name} max={16}>{prov[0].name}</Big>
        <Lead>{fmt(prov[0].total)} titik panas, atau {fmt((prov[0].total / kab.total2026) * 100)}% dari total Kalimantan.</Lead>
        <motion.ol variants={item} className="mt-[8cqw] grid gap-[2.2cqw]">
          {prov.map((p, i) => (
            <li key={p.id} className={`flex items-baseline justify-between gap-[3cqw] border-l-[0.8cqw] pl-[3.2cqw] text-[4.4cqw] leading-tight ${i === 0 ? 'border-ember font-bold text-fg' : 'border-fg-3/30 text-fg-2'}`}>
              <span><span className="num inline-block w-[9cqw] text-fg-3">{i + 1}</span>{p.name}</span>
              <span className="num">{fmt(p.total)}</span>
            </li>
          ))}
        </motion.ol>
      </SlideShell>
    )
  }
  const sorted = [...kabs].sort((a, b) => a.rankKalimantan - b.rankKalimantan)
  const i = sorted.findIndex(k => k.slug === kab.slug)
  const lo = Math.max(0, Math.min(i - 2, sorted.length - 5))
  const ladder = sorted.slice(lo, lo + 5)
  const inProv = kabs.filter(k => k.provinceId === kab.provinceId).sort((a, b) => b.total2026 - a.total2026)
  const provRank = inProv.findIndex(k => k.slug === kab.slug) + 1
  return (
    <SlideShell image="firefighters-silhouette" position="32% 50%" dim={0.74} footer={<Src meta={meta} />}>
      <Kicker>Peringkat jumlah titik panas di Kalimantan</Kicker>
      <Big text={`#${kab.rankKalimantan}`}>#<CountUp value={kab.rankKalimantan} duration={1.2} start /></Big>
      <Lead>dari {kabs.length} kabupaten/kota. Peringkat ke-{provRank} dari {inProv.length} di {kab.provinceName}.</Lead>
      <motion.ol variants={item} className="mt-[8cqw] grid gap-[2.2cqw]">
        {ladder.map(k => {
          const me = k.slug === kab.slug
          return (
            <li key={k.slug} className={`flex items-baseline justify-between gap-[3cqw] border-l-[0.8cqw] pl-[3.2cqw] text-[4.4cqw] leading-tight ${me ? 'border-ember font-bold text-fg' : 'border-fg-3/30 text-fg-2'}`}>
              <span><span className="num inline-block w-[9cqw] text-fg-3">{k.rankKalimantan}</span>{k.name}</span>
              <span className="num">{fmt(k.total2026)}</span>
            </li>
          )
        })}
      </motion.ol>
    </SlideShell>
  )
}

/* 6. Rangkuman. Dipakai juga sebagai kartu bagikan 1080x1920 (variant export). */
export function SummaryCard({ kab, kabs, meta, variant = 'story' }: SlideCtx & { variant?: 'story' | 'export' }) {
  const d = pct(kab.total2026, kab.total2025)
  const fields = kab.burnedHa === null ? null : Math.round(kab.burnedHa / HA_PER_FIELD)
  const top = kab.isRegion ? provinceTotals(kabs, meta)[0] : null
  const exp = variant === 'export'
  const stat = (label: string, value: string, sub?: string) => (
    <div className="border-t border-fg/15 pt-[3cqw]">
      <dt className="text-[3.4cqw] text-fg-3">{label}</dt>
      <dd className="mt-[1cqw] text-[7.2cqw] font-extrabold leading-none tracking-tight text-fg num">{value}</dd>
      {sub && <dd className="mt-[1cqw] text-[3.2cqw] leading-snug text-fg-2">{sub}</dd>}
    </div>
  )
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      <div aria-hidden className="glow-ember absolute inset-0 opacity-90" />
      <div className={`relative flex size-full flex-col px-[8cqw] ${exp ? 'pt-[6cqw] pb-[6cqw]' : 'pt-[28cqw] pb-[50cqw]'}`}>
        {meta.isSample && exp && <div className="-mx-[8cqw] mb-[5cqw] bg-ember py-[2cqw] text-center text-[3.6cqw] font-bold tracking-wide text-ink">DATA CONTOH. Angka bersifat fiktif dan hanya untuk pengujian tampilan.</div>}
        <p className="text-[4.4cqw] font-semibold text-fg-2">Karhutla Wrapped 2026</p>
        <h2 style={fit(kab.name, 15)} className="mt-[2cqw] font-extrabold leading-[0.95] tracking-tighter text-fg">{kab.name}<span className="text-ember">.</span></h2>
        <p className="mt-[1.5cqw] text-[4.2cqw] text-fg-2">{kab.provinceName}</p>
        <div className={`${exp ? 'mt-[7cqw]' : 'mt-[6cqw]'}`}>
          <p className="text-[3.6cqw] text-fg-3">Titik panas sejak 1 Januari 2026</p>
          <p style={fit(fmt(kab.total2026), exp ? 21 : 24)} className="mt-[1cqw] font-extrabold leading-[0.95] tracking-tighter text-fg num">{fmt(kab.total2026)}<span className="text-ember">.</span></p>
        </div>
        <dl className={`grid grid-cols-2 gap-x-[6cqw] ${exp ? 'mt-[7cqw] gap-y-[5cqw]' : 'mt-[5cqw] gap-y-[3.5cqw]'}`}>
          {stat('Dibandingkan 2025', d === null ? 'Belum tersedia' : `${d >= 0 ? '+' : '-'}${fmt(Math.abs(d))}%`, d === null ? undefined : `${fmt(kab.total2025!)} titik pada periode yang sama`)}
          {top
            ? stat('Provinsi tertinggi', top.short, `${top.name}, ${fmt(top.total)} titik`)
            : stat('Peringkat di Kalimantan', `#${kab.rankKalimantan}`, `dari ${kabs.length} kabupaten/kota`)}
          {stat('Bulan puncak', MONTHS[kab.peakMonth], `${fmt(kab.monthly[kab.peakMonth])} titik`)}
          {stat('Luas lahan terbakar', fields === null ? 'Belum tersedia' : fmt(fields), fields === null ? undefined : `lapangan sepak bola, ${fmt(kab.burnedHa!)} ha`)}
        </dl>
        <div className="mt-auto pt-[4cqw] text-[3.1cqw] leading-snug text-fg-2">
          {exp && <p className="mb-[2cqw] text-[4.4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span> <span className="font-normal text-fg-2">{siteHost()}</span></p>}
          <p>Data per {fmtDate(meta.dataDate)}. Sumber: NASA FIRMS, SiPongi Kemenhut. Batas wilayah: geoBoundaries.{meta.isSample ? ' DATA CONTOH.' : ''}</p>
        </div>
      </div>
    </div>
  )
}
