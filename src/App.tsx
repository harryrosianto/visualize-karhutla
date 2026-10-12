import { Suspense, lazy } from 'react'
import { BrowserRouter, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import { DataBanner } from './components/DataBanner'
import { Footer } from './components/Footer'
import { SiteNav } from './components/SiteNav'
import { DataProvider } from './lib/DataContext'
import Landing from './routes/Landing'

const MapPage = lazy(() => import('./routes/MapPage'))
const WrappedPicker = lazy(() => import('./routes/WrappedPicker'))
const WrappedPage = lazy(() => import('./routes/WrappedPage'))
const About = lazy(() => import('./routes/About'))
const NotFound = lazy(() => import('./routes/NotFound'))

function ScrollTop() {
  const { pathname, hash } = useLocation()
  useEffect(() => { if (!hash) window.scrollTo(0, 0) }, [pathname, hash])
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
      <DataProvider>
        <ScrollTop />
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route element={<Shell />}>
              <Route index element={<Landing />} />
              <Route path="wrapped" element={<WrappedPicker />} />
              <Route path="tentang" element={<About />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route element={<Shell footer={false} />}>
              <Route path="peta" element={<MapPage />} />
            </Route>
            <Route path="wrapped/:slug" element={<WrappedPage />} />
          </Routes>
        </Suspense>
      </DataProvider>
    </BrowserRouter>
  )
}
