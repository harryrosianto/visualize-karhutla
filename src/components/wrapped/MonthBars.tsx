import { scaleBand, scaleLinear } from '@visx/scale'
import { motion } from 'motion/react'
import { useStaticMotion } from '../ExportContext'
import { MONTHS, MONTHS_SHORT, fmt } from '../../lib/data'

/** Bar chart bulanan Jan-Okt dengan bulan puncak disorot. Tanpa trek latar. */
export function MonthBars({ values, peak }: { values: number[]; peak: number }) {
  const reduce = useStaticMotion()
  const W = 300, H = 170, top = 26, bottom = 22
  const x = scaleBand<number>({ domain: values.map((_, i) => i), range: [0, W], padding: 0.28 })
  const y = scaleLinear({ domain: [0, Math.max(1, ...values)], range: [H - bottom, top] })
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img"
      aria-label={`Titik panas per bulan. Puncak ${MONTHS[peak]} dengan ${fmt(values[peak])} titik.`}>
      {values.map((v, i) => {
        const h = Math.max(2, H - bottom - y(v))
        const on = i === peak
        return (
          <g key={i}>
            <motion.rect
              x={x(i)} width={x.bandwidth()} rx={3} fill={on ? '#F97316' : '#F5F5F4'} fillOpacity={on ? 1 : 0.38}
              initial={reduce ? false : { y: H - bottom, height: 0 }}
              animate={{ y: H - bottom - h, height: h }}
              transition={{ duration: 0.8, delay: 0.25 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            />
            <text x={(x(i) ?? 0) + x.bandwidth() / 2} y={H - 6} textAnchor="middle" fontSize={10} fill={on ? '#F5F5F4' : '#A8A29E'} fontWeight={on ? 700 : 500}>{MONTHS_SHORT[i]}</text>
            {on && <text x={(x(i) ?? 0) + x.bandwidth() / 2} y={y(v) - 8} textAnchor="middle" fontSize={12} fontWeight={700} fill="#F5F5F4">{fmt(v)}</text>}
          </g>
        )
      })}
    </svg>
  )
}
