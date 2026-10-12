import { Link, NavLink } from 'react-router-dom'

const link = ({ isActive }: { isActive: boolean }) =>
  `inline-flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors ${isActive ? 'text-fg' : 'text-fg-2 hover:text-fg'}`

export function SiteNav() {
  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav aria-label="Utama" className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link to="/" translate="no" className="flex min-h-[44px] items-center font-brand whitespace-nowrap text-xl font-normal tracking-wide text-fg sm:text-2xl">
          Visualize Karhutla<span className="text-ember">.</span>
        </Link>
        <div className="flex items-center">
          <NavLink to="/peta" className={link}>Peta</NavLink>
          <NavLink to="/wrapped" className={(s) => `${link(s)} max-sm:hidden`}>Wrapped</NavLink>
          <NavLink to="/kontribusi" className={link}>Kontribusi</NavLink>
          <NavLink to="/tentang" className={(s) => `${link(s)} max-sm:hidden`}>Tentang</NavLink>
        </div>
      </nav>
    </header>
  )
}
