import { Link } from 'react-router-dom'
import { useData } from '../lib/DataContext'
import { fmtDate } from '../lib/data'

function Col({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="flex items-center gap-2 text-sm font-bold text-fg">
        <span aria-hidden className="size-1.5 rounded-full bg-ember" />
        {title}
      </h2>
      <ul className="mt-5 grid gap-3 text-sm text-fg-2">{children}</ul>
    </div>
  )
}
const a = 'inline-flex min-h-[32px] items-center hover:text-fg'

/** Footer bergaya referensi: wordmark raksasa samar, wordmark utama dengan titik, tagline serif miring, kolom bertitik. */
export function Footer() {
  const { meta } = useData()
  return (
    <footer className="relative isolate overflow-hidden border-t border-line bg-ink">
      <div aria-hidden className="glow-ember pointer-events-none absolute inset-y-0 right-0 -z-10 w-full md:w-3/5" />
      <div aria-hidden className="pointer-events-none absolute -bottom-6 left-0 -z-10 select-none whitespace-nowrap font-brand text-[34vw] font-normal leading-none tracking-normal text-fg/[0.035] md:text-[20vw]">
        KARHUTLA
      </div>
      <div className="mx-auto grid max-w-[1400px] gap-14 px-4 py-20 md:grid-cols-[1.3fr_1fr] md:px-8 md:py-28">
        <div>
          <p className="font-brand text-6xl font-normal leading-none tracking-[0.05em] text-fg md:text-7xl">
            Visualize Karhutla<span className="text-ember">.</span>
          </p>
          <p className="mt-3 font-serif text-2xl leading-[1.15] text-ember pb-1">Karhutla Kalimantan 2026.</p>
          <p className="mt-6 max-w-[40ch] text-base leading-relaxed text-fg-2">
            Peta dan ringkasan data titik panas karhutla di lima provinsi Kalimantan yang dapat diakses dan dibagikan oleh masyarakat.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
          <Col title="Jelajah">
            <li><Link className={a} to="/peta">Peta titik panas</Link></li>
            <li><Link className={a} to="/wrapped">Karhutla Wrapped</Link></li>
          </Col>
          <Col title="Tentang">
            <li><Link className={a} to="/tentang">Metodologi</Link></li>
            <li><Link className={a} to="/tentang#sumber">Sumber data</Link></li>
            <li><Link className={a} to="/tentang#kredit">Kredit gambar</Link></li>
          </Col>
          <Col title="Data">
            <li><a className={a} href="https://firms.modaps.eosdis.nasa.gov/" rel="noreferrer" target="_blank">NASA FIRMS</a></li>
            <li><a className={a} href="https://sipongi.menlhk.go.id/" rel="noreferrer" target="_blank">SiPongi Kemenhut</a></li>
            <li><a className={a} href="https://www.geoboundaries.org/" rel="noreferrer" target="_blank">geoBoundaries</a></li>
          </Col>
        </div>
      </div>
      <div className="border-t border-line/70">
        <p className="mx-auto max-w-[1400px] px-4 py-6 text-xs leading-relaxed text-fg-3 md:px-8">
          Data: NASA FIRMS, SiPongi Kemenhut. Batas wilayah: geoBoundaries.
          {meta ? ` Data per ${fmtDate(meta.dataDate)}.` : ''}
          {meta?.isSample ? ' Saat ini memakai DATA CONTOH.' : ''}
        </p>
      </div>
    </footer>
  )
}
