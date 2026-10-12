import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <section className="mx-auto max-w-[1400px] px-4 pb-32 pt-40 md:px-8">
      <h1 className="text-5xl font-extrabold tracking-tighter text-fg">Halaman tidak ditemukan<span className="text-ember">.</span></h1>
      <p className="mt-4 text-fg-2">Alamat yang kamu buka tidak ada.</p>
      <Link to="/" className="btn btn-primary mt-8">Ke beranda</Link>
    </section>
  )
}
