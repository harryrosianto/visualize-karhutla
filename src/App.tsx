import { Component, Suspense, lazy, type ComponentType, type ReactNode } from 'react'
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { DataBanner } from './components/DataBanner'
import { Footer } from './components/Footer'
import { SiteNav } from './components/SiteNav'
import { DataProvider } from './lib/DataContext'
import Landing from './routes/Landing'

/** Muat modul rute; bila gagal (umumnya setelah situs diperbarui dan berkas lama sudah tidak ada), muat ulang halaman sekali. */
function lazyRoute<T extends ComponentType<any>>(load: () => Promise<{ default: T }>) {
  return lazy(() => load().catch(err => {
    const key = 'muat-ulang-rute'
    try {
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, '1')
        window.location.reload()
        return new Promise<never>(() => {})
      }
    } catch { /* penyimpanan tidak tersedia */ }
    throw err
  }))
}

const MapPage = lazyRoute(() => import('./routes/MapPage'))
const WrappedPicker = lazyRoute(() => import('./routes/WrappedPicker'))
const WrappedPage = lazyRoute(() => import('./routes/WrappedPage'))
const Templates = lazyRoute(() => import('./routes/Templates'))
const Galeri = lazyRoute(() => import('./routes/Galeri'))
const Cerita = lazyRoute(() => import('./routes/Cerita'))
const CeritaTulis = lazyRoute(() => import('./routes/CeritaTulis'))
const CeritaDetail = lazyRoute(() => import('./routes/CeritaDetail'))
const About = lazyRoute(() => import('./routes/About'))
const Contribute = lazyRoute(() => import('./routes/Contribute'))
const NotFound = lazyRoute(() => import('./routes/NotFound'))

/** Mencegah layar hitam kosong bila terjadi galat: tampilkan pesan dan tombol muat ulang. */
class Guard extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() {
    if (!this.state.failed) return this.props.children
    return (
      <div role="alert" className="grid min-h-dvh place-items-center bg-ink px-4 text-center">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tighter text-fg">Halaman belum dapat dimuat<span className="text-ember">.</span></h1>
          <p className="mt-3 text-fg-2">Situs mungkin baru diperbarui. Silakan muat ulang halaman.</p>
          <button type="button" onClick={() => { try { sessionStorage.removeItem('muat-ulang-rute') } catch { /* abaikan */ } window.location.reload() }} className="btn btn-primary mt-8">Muat ulang</button>
        </div>
      </div>
    )
  }
}

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => {
    if (!hash) { window.scrollTo(0, 0); return }
    // halaman dimuat malas: tunggu elemen tujuan muncul, lalu gulir
    let tries = 0
    const t = window.setInterval(() => {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)))
      if (el) { el.scrollIntoView(); window.clearInterval(t) } else if (++tries > 30) window.clearInterval(t)
    }, 100)
    return () => window.clearInterval(t)
  }, [pathname, hash])
  return null
}

function Shell({ footer = true }: { footer?: boolean }) {
  return (
    <>
      <a href="#konten" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-ember focus:px-4 focus:py-2 focus:text-ink">Lewati ke konten</a>
      <DataBanner />
      <div className="relative">
        <SiteNav />
        <main id="konten"><Outlet /></main>
      </div>
      {footer && <Footer />}
    </>
  )
}

const Fallback = () => <div className="grid min-h-[60dvh] place-items-center text-fg-3" role="status">Memuat halaman...</div>

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL.replace(/\/$/, '')}>
      <Guard><DataProvider>
        <ScrollTop />
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Landing />} />
              <Route path="wrapped" element={<WrappedPicker />} />
              <Route path="templat" element={<Templates />} />
              <Route path="galeri" element={<Galeri />} />
              <Route path="cerita" element={<Cerita />} />
              <Route path="cerita/:slug" element={<CeritaDetail />} />
              <Route path="tentang" element={<About />} />
              <Route path="kontribusi" element={<Contribute />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<Shell footer={false} />}>
              <Route path="peta" element={<MapPage />} />
              <Route path="cerita/tulis" element={<CeritaTulis />} />
            </Route>
            <Route path="wrapped/:slug" element={<WrappedPage />} />
          </Routes>
        </Suspense>
      </DataProvider></Guard>
    </BrowserRouter>
  )
}
