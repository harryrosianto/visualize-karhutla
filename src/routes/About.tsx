import type { ReactNode } from 'react'
import { useData } from '../lib/DataContext'
import { fmtDate } from '../lib/data'
import credits from '../assets/images/credits.json'

const toc = [
  ['metodologi', 'Metodologi'],
  ['sumber', 'Sumber data'],
  ['keterbatasan', 'Keterbatasan data'],
  ['kredit', 'Kredit aset visual'],
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
      <h1 className="max-w-[16ch] text-5xl font-extrabold leading-[0.98] tracking-tighter text-fg md:text-7xl">Metode dan sumber data<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[56ch] text-lg leading-relaxed text-fg-2">
        Seluruh angka pada situs ini bersumber dari data satelit dan data pemerintah yang terbuka. Halaman ini menguraikan metode penghitungan serta batasan dalam menafsirkan angka tersebut.
      </p>

      {meta && (
        <div className={`mt-10 max-w-3xl rounded-panel border p-5 ${meta.isSample ? 'border-ember bg-ember/10' : 'border-line bg-ink-2'}`}>
          <p className="text-lg font-bold text-fg">{meta.isSample ? 'Situs ini sedang menggunakan DATA CONTOH' : 'Status data'}</p>
          <p className="mt-2 text-fg-2">
            {meta.isSample
              ? 'Jumlah titik panas, luas lahan terbakar, dan data pembanding tahun 2025 pada situs ini bersifat fiktif dan hanya digunakan untuk pengujian tampilan. Hanya batas wilayah yang asli. Angka tersebut tidak boleh dikutip sebagai fakta.'
              : `Data titik panas bersumber dari ${meta.sources.hotspot}.`}
          </p>
          <p className="mt-2 text-sm text-fg-3">Data per {fmtDate(meta.dataDate)}. Luas lahan terbakar: {meta.sources.burnedArea}.</p>
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
            <p>Data titik panas diperoleh dari NASA FIRMS (Fire Information for Resource Management System) yang dihasilkan sensor VIIRS dengan resolusi spasial sekitar 375 meter. Satu titik panas merepresentasikan piksel yang memiliki suhu lebih tinggi daripada piksel di sekitarnya pada saat satelit melintas.</p>
            <p>Titik panas disaring pada lima provinsi di Kalimantan, yaitu Kalimantan Barat, Kalimantan Tengah, Kalimantan Selatan, Kalimantan Timur, dan Kalimantan Utara. Suatu titik dihitung sebagai bagian dari kabupaten/kota apabila koordinatnya berada di dalam batas wilayah administratif tingkat ADM2 dari geoBoundaries. Titik dengan tingkat kepercayaan rendah dikeluarkan dari perhitungan (MODIS di bawah 30 dan VIIRS berlabel rendah).</p>
            <p>Data diagregasi menurut kabupaten/kota dan hari. Tanggal yang digunakan adalah tanggal akuisisi FIRMS dalam waktu UTC, sehingga dapat berbeda satu hari dari tanggal menurut WIB. Data pembanding tahun 2025 dihitung pada periode yang sama, yaitu 1 Januari hingga tanggal data terakhir.</p>
            <p>Luas lahan terbakar tidak diturunkan dari titik panas. Angka tersebut bersumber dari SiPongi Kemenhut dan dimasukkan secara manual. Padanan "lapangan sepak bola" menggunakan luas 0,714 hektare per lapangan. Peringkat disusun berdasarkan jumlah titik panas, bukan berdasarkan luas lahan terbakar.</p>
            <p>Ringkasan untuk seluruh Kalimantan merupakan penjumlahan dari 56 kabupaten/kota. Data pembanding dan luas lahan terbakar pada ringkasan tersebut hanya ditampilkan apabila tersedia untuk seluruh kabupaten/kota.</p>
          </Section>

          <Section id="sumber" title="Sumber data">
            <ul className="grid gap-3">
              <li><A href="https://firms.modaps.eosdis.nasa.gov/">NASA FIRMS</A>: titik panas VIIRS, tahun 2025 dan 2026.</li>
              <li><A href="https://sipongi.menlhk.go.id/">SiPongi Kemenhut</A>: luas lahan terbakar per wilayah, dimasukkan secara manual dengan mencantumkan periode dan tanggal pengambilan data pada berkas data.</li>
              <li><A href="https://www.geoboundaries.org/">geoBoundaries</A>: batas provinsi dan kabupaten/kota Indonesia (ADM1 dan ADM2).</li>
            </ul>
            <p>Setiap angka pada situs ini disertai keterangan sumber dan tanggal data. Keterangan tersebut turut dicantumkan pada kartu yang dibagikan.</p>
          </Section>

          <Section id="keterbatasan" title="Keterbatasan data">
            <ul className="grid list-disc gap-3 pl-5 marker:text-ember">
              <li>Titik panas bukan api yang telah terkonfirmasi dan bukan ukuran luas lahan terbakar. Satu titik dapat merepresentasikan beberapa api kecil, dan sebaliknya.</li>
              <li>Satelit hanya melintas beberapa kali dalam sehari. Api yang padam sebelum atau menyala setelah lintasan tidak terekam.</li>
              <li>Awan dan asap tebal dapat menutupi api, sehingga jumlah titik pada hari berasap cenderung lebih rendah daripada kondisi sebenarnya.</li>
              <li>Piksel bersuhu tinggi juga dapat berasal dari sumber lain, misalnya pembakaran terencana pada lahan industri.</li>
              <li>Pengolahan hanya memakai satu satelit pada satu waktu. Data dari satelit lain tidak digabungkan agar tidak terjadi perhitungan ganda pada kejadian yang sama.</li>
              <li>Batas kabupaten/kota memakai data dengan tahun representasi 2020. Wilayah yang dimekarkan setelah tahun tersebut mungkin belum tergambar. Provinsi sebagian kabupaten dikoreksi secara manual karena batas provinsi pada sumber data lebih lama.</li>
              <li>Situs ini bukan publikasi resmi pemerintah. Untuk keperluan kebijakan, rujuklah sumber data aslinya.</li>
            </ul>
          </Section>

          <Section id="kredit" title="Kredit aset visual">
            <p>Foto dan ilustrasi pada situs ini berfungsi sebagai ilustrasi suasana dan bukan dokumentasi lokasi tertentu di Kalimantan.</p>
            <ul className="grid gap-5">
              {credits.map(c => (
                <li key={c.file} className="border-l-2 border-ember pl-4">
                  <p className="font-semibold text-fg">{c.title}</p>
                  <p>Pencipta: {c.creator || 'belum diketahui'}{c.source ? `; sumber: ${c.source}` : ''}.{' '}
                    {c.license ? `Lisensi: ${c.license}.` : 'Lisensi: belum diverifikasi.'}
                    {c.sourceUrl && <> <A href={c.sourceUrl}>Halaman sumber</A></>}
                  </p>
                  <p className="text-sm text-fg-3">Digunakan pada: {c.usedIn}.</p>
                </li>
              ))}
            </ul>
          </Section>

          <Section id="kredit-data" title="Kredit data">
            <p>Data: NASA FIRMS, SiPongi Kemenhut. Batas wilayah: geoBoundaries.</p>
            <p>Situs ini menggunakan data dari Fire Information for Resource Management System (FIRMS) milik NASA, yang didukung oleh NASA Earth Science Data and Information System (ESDIS).</p>
            <p>Batas wilayah: Runfola, D. dkk. (2020), geoBoundaries: A global database of political administrative boundaries, PLoS ONE 15(4): e0231866. Data ADM2 Indonesia bersumber dari BPS dengan lisensi CC BY 3.0 IGO.</p>
            <p>Peta dasar: CARTO Dark Matter, dengan data peta &copy; kontributor OpenStreetMap.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
