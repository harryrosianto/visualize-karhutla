import { Picture } from '../Picture'
import { SlideContribute } from './slides'
import { fmt } from '../../lib/data'
import { HASHTAG, type StoryTemplateDef } from '../../content/storyTemplates'

/** Satu templat story 9:16. Ukuran memakai cqw sehingga markup sama untuk pratinjau kecil dan ekspor 1080x1920. */
export function StoryTemplate({ t, total }: { t: StoryTemplateDef; total: number | null }) {
  const headline = t.stat ? (total ? `${fmt(total)} ${t.headline}` : 'Every ember is a warning.') : t.headline
  const sub = t.stat && !total ? 'Kalimantan, 2026.' : t.sub
  const long = headline.length > 26
  const text = (
    <div lang="en" translate="no">
      <h3 className={`font-extrabold leading-[0.95] tracking-tighter text-fg ${long ? 'text-[11.5cqw]' : 'text-[14cqw]'}`}>{headline}</h3>
      <p className="mt-[4cqw] max-w-[26ch] text-[4.8cqw] leading-snug text-fg-2">{sub}</p>
      <p className="mt-[7cqw] text-[3.6cqw] font-semibold tracking-wide text-ember">{HASHTAG}</p>
    </div>
  )
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      {t.layout === 'full' ? (
        <>
          <Picture name={t.image} sizes="(min-width: 768px) 25vw, 45vw" className="absolute inset-0 size-full object-cover" position={t.position} />
          <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgb(12 10 9 / 0.55) 0%, rgb(12 10 9 / 0.15) 30%, rgb(12 10 9 / 0.55) 62%, rgb(12 10 9 / 0.95) 100%)' }} />
        </>
      ) : (
        <>
          <div className="absolute inset-x-0 top-0 h-[62%]">
            <Picture name={t.image} sizes="(min-width: 768px) 25vw, 45vw" className="size-full object-cover" position={t.position} />
            <div aria-hidden className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgb(12 10 9 / 0.5) 0%, rgb(12 10 9 / 0) 28%, rgb(12 10 9 / 0) 60%, rgb(12 10 9) 100%)' }} />
          </div>
          <div aria-hidden className="glow-ember absolute inset-x-0 bottom-0 h-[40%] opacity-50" />
        </>
      )}
      <p translate="no" className="absolute left-[8cqw] top-[9cqw] text-[4.4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span></p>
      <div className="absolute inset-x-[8cqw] bottom-[10cqw]">{text}</div>
    </div>
  )
}

/** Templat "Add Yours": slide penutup Wrapped dengan ruang kosong untuk ditimpa stiker Add Yours di Instagram. */
export function AddYoursTemplate() {
  return (
    <div className="relative size-full overflow-hidden bg-ink">
      <SlideContribute compact />
      <p translate="no" className="absolute left-[8cqw] top-[9cqw] text-[4.4cqw] font-extrabold tracking-tight text-fg">Visualize Karhutla<span className="text-ember">.</span></p>
    </div>
  )
}
