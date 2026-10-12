import { Link, NavLink } from 'react-router-dom'

const link = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors ${isActive ? 'text-fg' : 'text-fg-2 hover:text-fg'}`

export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav aria-label="Utama" className="mx-auto flex max-w-[1400px] flex-col items-start px-4 pt-1 sm:h-16 sm:flex-row sm:items-center sm:justify-between sm:pt-0 md:px-8">
        <Link to="/" translate="no" className="flex min-h-[44px] items-center font-brand whitespace-nowrap text-xl font-normal tracking-wide text-fg sm:text-2xl">
          Visualize Karhutla<span className="text-ember">.</span>
        </Link>
        <div className="-ml-3 flex items-center sm:ml-0">
          <NavLink to="/peta" className={link}>Peta</NavLink>
          <NavLink to="/wrapped" className={link}>Wrapped</NavLink>
          <NavLink to="/kontribusi" className={link}>Kontribusi</NavLink>
          <NavLink to="/tentang" className={link}>Tentang</NavLink>
        </div>
      </nav>
    </header>
  )
}
