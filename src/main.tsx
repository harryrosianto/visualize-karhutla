import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import './styles/index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// setelah halaman berjalan normal, izinkan muat ulang otomatis lagi pada pembaruan berikutnya
window.setTimeout(() => { try { sessionStorage.removeItem('muat-ulang-rute') } catch { /* abaikan */ } }, 8000)
// berkas bagian (chunk) lama hilang setelah situs diperbarui: muat ulang sekali
window.addEventListener('vite:preloadError', () => {
  try {
    if (sessionStorage.getItem('muat-ulang-rute')) return
    sessionStorage.setItem('muat-ulang-rute', '1')
  } catch { return }
  window.location.reload()
})
