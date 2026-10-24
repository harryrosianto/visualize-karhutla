import { InstagramLogo, ThreadsLogo } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import { useData } from '../lib/DataContext'
import { fmtDate } from '../lib/data'
import { Picture } from '../components/Picture'
import { siteUrl } from '../lib/share'
import { INSTAGRAM_URL, THREADS_URL } from '../lib/site'
import { useState } from 'react'
import credits from '../assets/images/credits.json'

/** Foto pengembang yang berbalik menjadi ilustrasi saat disorot kursor (perangkat dengan kursor) atau diketuk atau ditekan Enter. */
function FlipPhoto() {
  const [flipped, setFlipped] = useState(false)
  return (
    <button type="button" className="flip size-32 shrink-0 cursor-pointer rounded-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ember md:size-40" data-flipped={flipped}
      aria-pressed={flipped} aria-label={flipped ? 'Tampilkan foto pengembang' : 'Tampilkan ilustrasi pengembang'} onClick={() => setFlipped(v => !v)}>
      <span className="flip-inner">
        <span className="flip-face"><Picture name="developer" decorative={false} sizes="160px" className="size-full object-cover" /></span>
        <span className="flip-face flip-back"><Picture name="developer-art" decorative={false} sizes="160px" className="size-full object-cover" /></span>
      </span>
    </button>
  )
}

const toc = [
  ['metodologi', 'Metodologi'],
  ['sumber', 'Sumber data'],
  ['keterbatasan', 'Keterbatasan data'],
  ['unduh', 'Unduh data'],
  ['kutip', 'Cara mengutip'],
  ['pengembang', 'Pengembang'],
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

function Citation({ isSample, dataDate }: { isSample: boolean; dataDate: string }) {
  const [copied, setCopied] = useState(false)
  const text = `Visualize Karhutla. (2026). Titik panas kebakaran hutan dan lahan di wilayah terpantau menurut kabupaten/kota, 1 Januari sampai ${fmtDate(dataDate)} 2026 [Set data]. Diolah dari NASA FIRMS (VIIRS NOAA-20) dan geoBoundaries. ${siteUrl()}/tentang#unduh. Diakses ${fmtDate(new Date().toISOString().slice(0, 10))}.`
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); setCopied(true); window.setTimeout(() => setCopied(false), 2500) } catch { /* abaikan */ }
  }
  return (
    <>
      {isSample && <p className="rounded-panel border border-ember bg-ember/10 p-4 text-fg">Data saat ini adalah DATA CONTOH. Jangan dikutip sebagai fakta.</p>}
      <blockquote translate="no" className="border-l-2 border-ember pl-4 text-fg">{text}</blockquote>
      <div className="flex items-center gap-4">
        <button type="button" onClick={copy} className="btn btn-ghost">Salin sitasi</button>
        <span role="status" aria-live="polite" className="text-sm text-fg">{copied ? 'Sitasi disalin.' : ''}</span>
      </div>
    </>
  )
}

export default function About() {
  const { meta } = useData()
  const pre = meta?.isSample ? 'CONTOH-' : ''
  const files = [
    [`${pre}titik-panas-kabupaten-2026.csv`, 'Ringkasan per kabupaten/kota: total 2026, pembanding 2025 pada periode yang sama, jumlah per bulan, bulan puncak, peringkat, luas lahan terbakar.'],
    [`${pre}titik-panas-harian-2026.csv`, 'Jumlah titik panas per kabupaten/kota per hari (hanya hari dengan titik panas).'],
    [`${pre}metadata.json`, 'Metadata: sumber, tanggal data, status data, dan catatan metode.'],
  ]
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
            <p>Titik panas disaring pada 38 provinsi di seluruh Indonesia, dikelompokkan menjadi tujuh wilayah: Kalimantan (5 provinsi), Sumatra (10 provinsi, termasuk Kepulauan Riau dan Kepulauan Bangka Belitung), Papua (6 provinsi, termasuk pemekaran 2022), Jawa (6 provinsi), Bali dan Nusa Tenggara (3 provinsi), Sulawesi (6 provinsi), dan Maluku (2 provinsi). Karena batas administratif geoBoundaries berasal dari data 2017, kabupaten/kota Papua dikelompokkan ke provinsi hasil pemekaran menurut nama, dan beberapa kabupaten di perbatasan provinsi dikoreksi secara manual. Suatu titik dihitung sebagai bagian dari kabupaten/kota apabila koordinatnya berada di dalam batas wilayah administratif tingkat ADM2 dari geoBoundaries. Titik dengan tingkat kepercayaan rendah dikeluarkan dari perhitungan (MODIS di bawah 30 dan VIIRS berlabel rendah).</p>
            <p>Data diagregasi menurut kabupaten/kota dan hari. Tanggal yang digunakan adalah tanggal akuisisi FIRMS dalam waktu UTC, sehingga dapat berbeda satu hari dari tanggal menurut WIB. Data pembanding tahun 2025 dihitung pada periode yang sama, yaitu 1 Januari hingga tanggal data terakhir.</p>
            <p>Luas lahan terbakar tidak diturunkan dari titik panas. Data per kabupaten/kota belum tersedia, sehingga situs ini memakai angka tingkat provinsi yang dilaporkan BNPB melalui pemberitaan: gabungan data SiPongi Kemenhut hingga 31 Juli 2026 dan hasil pengukuran lapangan tim gabungan BNPB hingga 14 September 2026. Angka tersebut hanya tersedia untuk provinsi di Kalimantan; angka Kalimantan Utara tidak dilaporkan, dan angka untuk pulau lain belum dimuat. Periode angka ini lebih pendek daripada periode titik panas. Padanan "lapangan sepak bola" menggunakan luas 0,714 hektare per lapangan. Peringkat disusun berdasarkan jumlah titik panas, bukan berdasarkan luas lahan terbakar.</p>
            <p>Ringkasan seluruh wilayah merupakan penjumlahan dari seluruh kabupaten/kota yang terpantau. Data pembanding tahun 2025 pada ringkasan tersebut hanya ditampilkan apabila tersedia untuk seluruh kabupaten/kota, sedangkan luas lahan terbakar merupakan jumlah provinsi yang datanya tersedia.</p>
          </Section>

          <Section id="sumber" title="Sumber data">
            <ul className="grid gap-3">
              <li><A href="https://firms.modaps.eosdis.nasa.gov/">NASA FIRMS</A>: titik panas VIIRS, tahun 2025 dan 2026.</li>
              <li><A href="https://sipongi.menlhk.go.id/">SiPongi Kemenhut</A> dan BNPB: sumber primer luas lahan terbakar. Situs ini belum mengakses SiPongi secara langsung; angka dikutip dari pemberitaan yang tercantum pada bagian referensi di bawah.</li>
              <li><A href="https://www.geoboundaries.org/">geoBoundaries</A>: batas provinsi dan kabupaten/kota Indonesia (ADM1 dan ADM2).</li>
              <li><A href="https://open-meteo.com/en/docs/air-quality-api">Open-Meteo</A> (data model CAMS, Copernicus): perkiraan kualitas udara saat ini pada panel kabupaten/kota. Skala US AQI, berupa perkiraan model, bukan pengukuran stasiun.</li>
            </ul>
            <p>Setiap angka pada situs ini disertai keterangan sumber dan tanggal data. Keterangan tersebut turut dicantumkan pada kartu yang dibagikan.</p>
            {meta?.burnedArea && (
              <>
                <p>Referensi angka luas lahan terbakar (diakses {fmtDate(meta.burnedArea.retrievedAt)}):</p>
                <ul className="grid gap-3">
                  {meta.burnedArea.references.map(r => (
                    <li key={r.url}>{r.publisher} ({fmtDate(r.date)}). <A href={r.url}>{r.title}</A>.</li>
                  ))}
                </ul>
              </>
            )}
          </Section>

          <Section id="keterbatasan" title="Keterbatasan data">
            <ul className="grid list-disc gap-3 pl-5 marker:text-ember">
              <li>Titik panas bukan api yang telah terkonfirmasi dan bukan ukuran luas lahan terbakar. Satu titik dapat merepresentasikan beberapa api kecil, dan sebaliknya.</li>
              <li>Satelit hanya melintas beberapa kali dalam sehari. Api yang padam sebelum atau menyala setelah lintasan tidak terekam.</li>
              <li>Awan dan asap tebal dapat menutupi api, sehingga jumlah titik pada hari berasap cenderung lebih rendah daripada kondisi sebenarnya.</li>
              <li>Angka luas lahan terbakar bersumber dari pemberitaan, bukan dari unduhan langsung SiPongi, sehingga belum diverifikasi terhadap sumber primer. Angka antarlembaga berbeda menurut metode dan periode; misalnya Walhi mencatat 33.837 ha untuk seluruh Kalimantan pada Januari hingga Juli 2026 (Mongabay Indonesia, 6 Agustus 2026), sedangkan BNPB mencatat sekitar 90 ribu ha hingga 14 September 2026. Angka-angka tersebut tidak dicampur pada situs ini.</li>
              <li>Periode luas lahan terbakar (hingga 14 September 2026) berbeda dari periode titik panas (hingga tanggal data terakhir), sehingga keduanya tidak boleh dibandingkan langsung.</li>
              <li>Piksel bersuhu tinggi juga dapat berasal dari sumber lain, misalnya pembakaran terencana pada lahan industri.</li>
              <li>Pengolahan hanya memakai satu satelit pada satu waktu. Data dari satelit lain tidak digabungkan agar tidak terjadi perhitungan ganda pada kejadian yang sama.</li>
              <li>Batas kabupaten/kota memakai data dengan tahun representasi 2020. Wilayah yang dimekarkan setelah tahun tersebut mungkin belum tergambar. Provinsi sebagian kabupaten dikoreksi secara manual karena batas provinsi pada sumber data lebih lama.</li>
              <li>Situs ini bukan publikasi resmi pemerintah. Untuk keperluan kebijakan, rujuklah sumber data aslinya.</li>
            </ul>
          </Section>

          <Section id="unduh" title="Unduh data">
            <p>Data teragregasi yang menjadi dasar seluruh angka pada situs ini tersedia untuk diunduh dalam format CSV (pemisah koma, pengodean UTF-8).</p>
            <ul className="grid gap-3">
              {files.map(([f, d]) => (
                <li key={f}><a href={`${import.meta.env.BASE_URL}unduh/${f}`} download className="text-fg underline decoration-ember underline-offset-4 hover:text-ember">{f}</a>
                  <span className="block text-sm text-fg-3">{d}</span></li>
              ))}
            </ul>
            <p>Berkas ini merupakan data turunan. Untuk keperluan penelitian, rujuklah juga sumber aslinya (NASA FIRMS dan SiPongi Kemenhut) beserta ketentuan penggunaannya.</p>
          </Section>

          <Section id="kutip" title="Cara mengutip">
            <p>Contoh sitasi untuk set data turunan pada situs ini (gaya APA yang disesuaikan):</p>
            {meta && <Citation isSample={meta.isSample} dataDate={meta.dataDate} />}
            <p>Sitasi atas data primer sebaiknya mencantumkan NASA FIRMS dan SiPongi Kemenhut secara terpisah.</p>
          </Section>

          <Section id="pengembang" title="Pengembang">
            <div className="flex items-center gap-5">
              <FlipPhoto />
              <div>
                <p className="text-2xl font-bold text-fg">harrie ros</p>
                <p className="mt-1 text-fg-2">Pengembang situs <span translate="no">Visualize Karhutla</span>.</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <a href={INSTAGRAM_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost min-h-11 gap-2 px-4 text-sm"><InstagramLogo size={18} weight="bold" aria-hidden /><span translate="no">@worldofhahadaily</span></a>
              <a href={THREADS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost min-h-11 gap-2 px-4 text-sm"><ThreadsLogo size={18} weight="bold" aria-hidden /><span translate="no">@harrierosss</span></a>
            </div>
          </Section>

          <Section id="kredit" title="Kredit aset visual">
            <p>Foto dan ilustrasi pada situs ini berfungsi sebagai ilustrasi suasana dan bukan dokumentasi lokasi tertentu di wilayah terpantau. Seluruh aset visual berasal dari sumber bebas royalti dan digunakan untuk keperluan nonkomersial.</p>
            <p>Foto yang dapat dikreditkan:</p>
            <ul className="grid gap-5">
              {credits.map(c => (
                <li key={c.file} className="border-l-2 border-ember pl-4">
                  <p className="font-semibold text-fg">{c.title}</p>
                  <p>Pencipta: {c.creator}; sumber: {c.source}. Lisensi: {c.license}.</p>
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
            <p>Kualitas udara: Open-Meteo.com (CC BY 4.0), memuat data Copernicus Atmosphere Monitoring Service (CAMS). Koordinat titik pusat kabupaten/kota dikirim ke layanan ini saat panel dibuka; lokasi pengunjung tidak dikirim.</p>
          </Section>
        </div>
      </div>
    </div>
  )
}
