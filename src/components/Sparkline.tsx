import { curveMonotoneX } from '@visx/curve'
import { scaleLinear } from '@visx/scale'
import { AreaClosed, LinePath } from '@visx/shape'
import { MONTHS, MONTHS_SHORT, fmt } from '../lib/data'

interface Props { values: number[]; peak: number; width?: number; height?: number; label?: string }

/** Tren bulanan Jan-Okt. Area memudar ke bawah, titik pada bulan puncak. */
export function Sparkline({ values, peak, width = 320, height = 84, label }: Props) {
  const pad = { l: 6, r: 6, t: 10, b: 4 }
  const x = scaleLinear({ domain: [0, values.length - 1], range: [pad.l, width - pad.r] })
  const max = Math.max(1, ...values)
  const y = scaleLinear({ domain: [0, max], range: [height - pad.b, pad.t] })
  const pts = values.map((v, i) => ({ i, v }))
  const desc = label ?? `Titik panas per bulan, puncak ${MONTHS[peak]} dengan ${fmt(values[peak])} titik.`
  return (
    <figure className="m-0">
      <svg viewBox={`0 0 ${width} ${height}`} className="block h-auto w-full" role="img" aria-label={desc}>
        <defs>
          <linearGradient id="spark-fill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="#F97316" stopOpacity="0.45" />
            <stop offset="1" stopColor="#F97316" stopOpacity="0" />
          </linearGradient>
        </defs>
        <AreaClosed data={pts} x={d => x(d.i)} y={d => y(d.v)} yScale={y} curve={curveMonotoneX} fill="url(#spark-fill)" />
        <LinePath data={pts} x={d => x(d.i)} y={d => y(d.v)} curve={curveMonotoneX} stroke="#F97316" strokeWidth={2} strokeLinecap="round" />
        <circle cx={x(peak)} cy={y(values[peak])} r={4.5} fill="#0C0A09" stroke="#F97316" strokeWidth={2} />
      </svg>
      <figcaption className="mt-1 flex justify-between text-xs text-fg-3" aria-hidden>
        <span>{MONTHS_SHORT[0]}</span><span>{MONTHS_SHORT[values.length - 1]}</span>
      </figcaption>
    </figure>
  )
}
