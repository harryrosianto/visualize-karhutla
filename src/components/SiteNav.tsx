import { CaretDown, List, X } from '@phosphor-icons/react'
import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'

const cls = (active: boolean) =>
  `inline-flex min-h-[44px] items-center px-3 text-sm font-medium transition-colors ${active ? 'text-fg' : 'text-fg-2 hover:text-fg'}`
const mcls = (active: boolean) =>
  `flex min-h-12 items-center rounded-panel px-3 text-lg font-semibold ${active ? 'bg-ink-3 text-fg' : 'text-fg-2'}`

/** Urutan menu: Galeri warga, Wrapped (termasuk Templat Story), Peta, Cerita karhutla, lalu Tentang (berisi Tentang proyek dan Kontribusi). */
const MAIN: { to: string; label: string; also?: string }[] = [
  { to: '/galeri', label: 'Galeri warga' },
  { to: '/wrapped', label: 'Wrapped', also: '/templat' },
  { to: '/peta', label: 'Peta' },
  { to: '/cerita', label: 'Cerita karhutla' },
]
const ABOUT = [
  { to: '/tentang', label: 'Tentang proyek' },
  { to: '/kontribusi', label: 'Kontribusi' },
] as const

export function SiteNav() {
  const { pathname } = useLocation()
  const [menu, setMenu] = useState(false)
  const [about, setAbout] = useState(false)
  const aboutRef = useRef<HTMLDivElement>(null)
  const aboutActive = ABOUT.some(a => pathname.startsWith(a.to))

  useEffect(() => { setMenu(false); setAbout(false) }, [pathname])
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') { setMenu(false); setAbout(false) } }
    const click = (e: MouseEvent) => { if (aboutRef.current && !aboutRef.current.contains(e.target as Node)) setAbout(false) }
    document.addEventListener('keydown', key)
    document.addEventListener('mousedown', click)
    return () => { document.removeEventListener('keydown', key); document.removeEventListener('mousedown', click) }
  }, [])

  return (
    <header className="absolute inset-x-0 top-0 z-30">
      <nav aria-label="Utama" className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link to="/" translate="no" className="flex min-h-[44px] items-center font-brand whitespace-nowrap text-xl font-normal tracking-wide text-fg sm:text-2xl">
          Visualize Karhutla<span className="text-ember">.</span>
        </Link>

        {/* desktop */}
        <div className="hidden items-center lg:flex">
          {MAIN.map(m => <NavLink key={m.to} to={m.to} className={({ isActive }) => cls(isActive || (!!m.also && pathname.startsWith(m.also)))}>{m.label}</NavLink>)}
          <div ref={aboutRef} className="relative">
            <button type="button" aria-expanded={about} aria-haspopup="menu" onClick={() => setAbout(v => !v)}
              className={`inline-flex min-h-[44px] items-center gap-1 px-3 text-sm font-medium transition-colors ${aboutActive || about ? 'text-fg' : 'text-fg-2 hover:text-fg'}`}>
              Tentang<CaretDown size={14} weight="bold" aria-hidden className={`transition-transform ${about ? 'rotate-180' : ''}`} />
            </button>
            {about && (
              <div role="menu" className="absolute right-0 top-full mt-1 w-48 rounded-panel border border-line bg-ink-2 p-2 shadow-2xl">
                {ABOUT.map(a => <NavLink key={a.to} to={a.to} role="menuitem" className={({ isActive }) => `flex min-h-11 items-center rounded-lg px-3 text-sm font-medium ${isActive ? 'bg-ink-3 text-fg' : 'text-fg-2 hover:bg-ink-3 hover:text-fg'}`}>{a.label}</NavLink>)}
              </div>
            )}
          </div>
        </div>

        {/* ponsel dan tablet */}
        <button type="button" aria-expanded={menu} aria-controls="menu-ponsel" aria-label={menu ? 'Tutup menu' : 'Buka menu'} onClick={() => setMenu(v => !v)}
          className="grid size-11 place-items-center rounded-full text-fg hover:bg-fg/10 lg:hidden">
          {menu ? <X size={24} weight="bold" aria-hidden /> : <List size={24} weight="bold" aria-hidden />}
        </button>
      </nav>

      {menu && (
        <div id="menu-ponsel" className="absolute inset-x-0 top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto border-y border-line bg-ink/95 px-4 py-4 backdrop-blur lg:hidden">
          <div className="mx-auto grid max-w-[1400px] gap-1">
            {MAIN.map(m => <NavLink key={m.to} to={m.to} className={({ isActive }) => mcls(isActive || (!!m.also && pathname.startsWith(m.also)))}>{m.label}</NavLink>)}
            <p className="mt-3 px-3 text-xs font-semibold uppercase tracking-wide text-fg-3">Tentang</p>
            {ABOUT.map(a => <NavLink key={a.to} to={a.to} className={({ isActive }) => mcls(isActive)}>{a.label}</NavLink>)}
          </div>
        </div>
      )}
    </header>
  )
}
