import type { ReactNode } from 'react'
import { useData } from '../lib/DataContext'
import { fmtDate } from '../lib/data'
import credits from '../assets/images/credits.json'

const toc = [
  ['metodologi', 'Metodologi'],
  ['sumber', 'Sumber data'],
  ['keterbatasan', 'Keterbatasan data'],
  ['kredit', 'Kredit gambar'],
  ['kredit-data', 'Kredit data'],
] as const

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24 border-t border-line py-12 first:border-t-0 first:pt-0">
      <h2 className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">{title}<span className="text-ember">.</span></h2>
      <div className="mt-6 grid max-w-[65ch] gap-4 text-base leading-relaxed text-fg-2">{children}</div>
    </section>
  )
}
const A = ({ href, children }: { href: string; children: ReactNode }) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="text-fg underline decoration-ember underline-offset-4 hover:text-ember">{children}</a>
)

export default function About() {
  const { meta } = useData()
  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-24 pt-32 md:px-8 md:pt-40">
      <h1 className="max-w-[16ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">Dari mana angkanya datang<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-fg-2">
        Semua angka di situs ini berasal dari data satelit dan data pemerintah yang terbuka. Halaman ini menjelaskan cara menghitungnya dan apa yang belum bisa dikatakan oleh angka itu.
      </p>

      {meta && (
        <div className={`mt-10 max-w-3xl rounded-panel border p-5 ${meta.isSample ? 'border-ember bg-ember/10' : 'border-line bg-ink-2'}`}>
          <p className="text-lg font-bold text-fg">{meta.isSample ? 'Saat ini memakai DATA CONTOH' : 'Status data'}</p>
          <p className="mt-2 text-fg-2">
            {meta.isSample
              ? 'Titik panas, luas terbakar, dan pembanding 2025 di situs ini adalah angka fiktif untuk menguji tampilan. Hanya batas wilayah yang asli. Jangan dikutip sebagai fakta.'
              : `Titik panas berasal dari ${meta.sources.hotspot}.`}
          </p>
          <p className="mt-2 text-sm text-fg-3">Data per {fmtDate(meta.dataDate)}. Luas terbakar: {meta.sources.burnedArea}.</p>
        </div>
      )}

      <div className="mt-16 grid gap-12 md:grid-cols-[220px_1fr] md:gap-16">
        <nav aria-label="Isi halaman" className="md:sticky md:top-24 md:self-start">
          <ul className="grid gap-1 text-sm">
            {toc.map(([id, t]) => (
              <li key={id}><a href={`#${id}`} className="inline-flex min-h-[44px] items-center text-fg-2 hover:text-fg">{t}</a></li>
            ))}
          </ul>
        </nav>

        <div>
          <Section id="metodologi" title="Metodologi">
            <p>Titik panas diambil dari NASA FIRMS, gabungan sensor VIIRS (resolusi sekitar 375 meter) dan MODIS (sekitar 1 kilometer). Setiap titik adalah piksel yang terlihat lebih panas daripada sekitarnya saat satelit melintas.</p>
            <p>Titik disaring ke lima provinsi Kalimantan: Kalimantan Barat, Tengah, Selatan, Timur, dan Utara. Sebuah titik dihitung milik kabupaten atau kota jika koordinatnya berada di dalam batas wilayah tingkat ADM2 dari geoBoundaries. Titik berkepercayaan rendah dibuang (MODIS di bawah 30, VIIRS berlabel "l").</p>
            <p>Hasilnya dijumlahkan per kabupaten per hari. Tanggal memakai tanggal akuisisi FIRMS dalam UTC, jadi bisa berbeda satu hari dari tanggal WIB. Pembanding 2025 memakai periode yang sama, yaitu 1 Januari sampai tanggal data terakhir.</p>
            <p>Luas terbakar tidak dihitung dari titik panas. Angka itu dari SiPongi Kemenhut dan diisi manual. Padanan "lapangan sepak bola" memakai 0,714 hektare per lapangan. Peringkat diurutkan dari jumlah titik panas, bukan dari luas.</p>
          </Section>

          <Section id="sumber" title="Sumber data">
            <ul className="grid gap-3">
              <li><A href="https://firms.modaps.eosdis.nasa.gov/">NASA FIRMS</A>: titik panas VIIRS dan MODIS, 2025 dan 2026.</li>
              <li><A href="https://sipongi.menlhk.go.id/">SiPongi Kemenhut</A>: luas area terbakar per wilayah, diisi manual dengan periode dan tanggal pengambilan yang tercatat di berkas data.</li>
              <li><A href="https://www.geoboundaries.org/">geoBoundaries</A>: batas provinsi dan kabupaten/kota Indonesia (ADM1 dan ADM2).</li>
            </ul>
            <p>Setiap angka di situs ini diberi keterangan sumber dan tanggal data. Pada kartu yang dibagikan, keterangan itu ikut tercetak.</p>
          </Section>

          <Section id="keterbatasan" title="Keterbatasan data">
            <ul className="grid list-disc gap-3 pl-5 marker:text-ember">
              <li>Titik panas bukan api yang terkonfirmasi dan bukan luas lahan terbakar. Satu titik bisa mewakili beberapa api kecil, dan sebaliknya.</li>
              <li>Satelit hanya lewat beberapa kali sehari. Api yang padam sebelum atau menyala setelah lintasan tidak tercatat.</li>
              <li>Awan dan asap tebal bisa menutupi api, sehingga jumlah titik di hari berasap cenderung terlalu rendah.</li>
              <li>Piksel panas juga muncul dari sumber lain, misalnya pembakaran terencana di lahan industri.</li>
              <li>Batas kabupaten memakai data tahun representasi 2020. Wilayah yang dimekarkan setelah itu mungkin belum tergambar. Provinsi sebagian kabupaten dikoreksi manual karena batas provinsi sumbernya lebih lama.</li>
              <li>Situs ini bukan publikasi resmi pemerintah. Untuk keperluan kebijakan, rujuk langsung ke sumber aslinya.</li>
            </ul>
          </Section>

          <Section id="kredit" title="Kredit gambar">
            <p>Foto di situs ini berfungsi sebagai ilustrasi suasana dan bukan dokumentasi lokasi di Kalimantan.</p>
            <ul className="grid gap-5">
              {credits.map(c => (
                <li key={c.file} className="border-l-2 border-ember pl-4">
                  <p className="font-semibold text-fg">{c.title}</p>
                  <p>Oleh {c.creator || 'belum diketahui'}{c.source ? `, ${c.source}` : ''}.{' '}
                    {c.license ? `Lisensi: ${c.license}.` : 'Lisensi: belum diverifikasi.'}
                    {c.sourceUrl && <> <A href={c.sourceUrl}>Halaman sumber</A></>}
                  </p>
                  <p className="text-sm text-fg-3">Dipakai di: {c.usedIn}.</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="kredit-data" title="Kredit data">
            <p>Data: NASA FIRMS, SiPongi Kemenhut. Batas wilayah: geoBoundaries.</p>
            <p>Kami memakai data dari Fire Information for Resource Management System (FIRMS) milik NASA, yang didukung oleh NASA Earth Science Data and Information System (ESDIS).</p>
            <p>Batas wilayah: Runfola, D. dan kolega (2020), geoBoundaries: A global database of political administrative boundaries, PLoS ONE 15(4): e0231866. Data ADM2 Indonesia bersumber dari BPS, lisensi CC BY 3.0 IGO.</p>
            <p>Peta dasar: CARTO Dark Matter, data peta &copy; kontributor OpenStreetMap.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
