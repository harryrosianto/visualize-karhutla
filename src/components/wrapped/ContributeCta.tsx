import { ArrowRight, GithubLogo } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import { REPO_URL } from '../../lib/site'

/** Tombol pada layar penutup Wrapped: menuju halaman kontribusi dan repositori. */
export function ContributeCta() {
  return (
    <div className="pointer-events-auto grid gap-2">
      <Link to="/kontribusi" className="btn btn-primary w-full">Buka halaman kontribusi <ArrowRight size={18} weight="bold" aria-hidden /></Link>
      <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost min-h-12 w-full"><GithubLogo size={18} weight="bold" aria-hidden />Lihat di GitHub</a>
    </div>
  )
}
