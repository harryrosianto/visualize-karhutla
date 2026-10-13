import { ArrowSquareOut, GithubLogo, ShareNetwork } from '@phosphor-icons/react'
import { useState, type ReactNode } from 'react'
import articles from '../content/articles.json'
import { fmtDate } from '../lib/data'
import { ADD_YOURS_URL, REPO_URL, issueUrl } from '../lib/site'
import { siteUrl } from '../lib/share'

function Way({ title, children, action }: { title: string; children: ReactNode; action: ReactNode }) {
  return (
    <li className="border-l-2 border-ember pl-5">
      <h3 className="text-xl font-bold text-fg md:text-2xl">{title}</h3>
      <p className="mt-2 max-w-[60ch] text-fg-2">{children}</p>
      <div className="mt-4">{action}</div>
    </li>
  )
}

const ext = (href: string, label: string, icon?: ReactNode) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">{icon}{label}<ArrowSquareOut size={16} weight="bold" aria-hidden /></a>
)

export default function Contribute() {
  const [note, setNote] = useState('')
  const share = async () => {
    const url = siteUrl() + '/'
    const text = 'Visualize Karhutla: peta titik panas dan ringkasan tahunan karhutla per kabupaten/kota di Kalimantan.'
    try {
      if (navigator.share) { await navigator.share({ title: 'Visualize Karhutla', text, url }); return }
      await navigator.clipboard.writeText(url)
      setNote('Tautan situs disalin.')
    } catch (e: any) {
      if (e?.name !== 'AbortError') setNote('Tautan belum dapat disalin. Salin dari bilah alamat browser.')
    }
    window.setTimeout(() => setNote(''), 2600)
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 pb-28 pt-32 md:px-8 md:pt-40">
      <h1 className="max-w-[16ch] text-4xl font-extrabold leading-[1] tracking-tighter text-fg sm:text-5xl md:text-7xl">Ikut mengembangkan proyek ini<span className="text-ember">.</span></h1>
      <p className="mt-6 max-w-[58ch] text-lg leading-relaxed text-fg-2">
        Visualize Karhutla bersifat terbuka dan berkembang melalui sumbangan pembaca. Artikel, data, koreksi, maupun gagasan Anda dapat membuat proyek ini lebih akurat dan bermanfaat.
      </p>

      <figure className="mt-10 max-w-3xl">
        <img src={`${import.meta.env.BASE_URL}media/pratinjau-beranda.jpg`} width={800} height={455} loading="lazy" decoding="async"
          alt="Tangkapan layar halaman beranda Visualize Karhutla: judul besar di atas siluet hutan terbakar, dengan tombol Telusuri wilayah dan Lihat peta." className="w-full rounded-panel border border-line" />
        <figcaption className="mt-3 text-sm text-fg-3">Tampilan halaman beranda Visualize Karhutla.</figcaption>
      </figure>

      <section aria-labelledby="cara" className="mt-16">
        <h2 id="cara" className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">Cara berkontribusi<span className="text-ember">.</span></h2>
        <ul className="mt-10 grid gap-10">
          <Way title="Kirim artikel" action={ext(issueUrl('artikel.yml'), 'Kirim artikel', <GithubLogo size={18} weight="bold" aria-hidden />)}>
            Kirimkan artikel tentang kebakaran hutan dan lahan dari media bereputasi, lembaga pemerintah, lembaga riset, atau organisasi lingkungan. Artikel yang lolos tinjauan dimuat pada daftar bacaan di bawah.
          </Way>
          <Way title="Sumbang data" action={ext(issueUrl('data.yml'), 'Sumbang data', <GithubLogo size={18} weight="bold" aria-hidden />)}>
            Sumbangkan data luas lahan terbakar per kabupaten/kota (misalnya dari SiPongi, BPBD, atau laporan resmi) beserta tautan sumber dan periodenya. Data per kabupaten/kota saat ini belum tersedia, sehingga setiap sumbangan sangat membantu.
          </Way>
          <Way title="Laporkan koreksi" action={ext(issueUrl('koreksi.yml'), 'Laporkan koreksi', <GithubLogo size={18} weight="bold" aria-hidden />)}>
            Menemukan angka, keterangan, atau istilah yang keliru? Sampaikan bagian yang perlu dikoreksi beserta rujukannya.
          </Way>
          <Way title="Usulkan fitur atau perbaikan bahasa" action={ext(issueUrl('usulan.yml'), 'Kirim usulan', <GithubLogo size={18} weight="bold" aria-hidden />)}>
            Usulkan fitur baru, perbaikan aksesibilitas, atau terjemahan dan penyuntingan bahasa.
          </Way>
          <Way title="Sumbang templat visual" action={ext(issueUrl('templat.yml'), 'Kirim templat', <GithubLogo size={18} weight="bold" aria-hidden />)}>
            Ilustrator dan desainer dapat mengunggah templat (ukuran dan rasio bebas, misalnya Story atau lanskap desktop) untuk kampanye kesadaran. Karya yang disetujui tampil pada halaman Templat Story lengkap dengan nama kreator.
          </Way>
          <Way title="Kembangkan bersama" action={ext(REPO_URL, 'Lihat repositori', <GithubLogo size={18} weight="bold" aria-hidden />)}>
            Kode sumber tersedia terbuka. Pengembang dapat mengirim perbaikan melalui pull request; panduannya ada pada berkas CONTRIBUTING di repositori.
          </Way>
          <Way title="Sebarkan" action={
            <div className="flex flex-wrap items-center gap-4">
              <button type="button" onClick={share} className="btn btn-primary"><ShareNetwork size={18} weight="bold" aria-hidden />Bagikan situs ini</button>
              <a href={ADD_YOURS_URL} target="_blank" rel="noopener noreferrer" className="btn btn-ghost">Ikut Add Yours di Instagram<ArrowSquareOut size={16} weight="bold" aria-hidden /></a>
              <span role="status" aria-live="polite" className="text-sm text-fg">{note}</span>
            </div>}>
            Karhutla belum berakhir. Bantu ingatkan orang-orang di sekitar Anda dengan membagikan situs ini atau ringkasan wilayah Anda.
          </Way>
        </ul>
        <p className="mt-10 max-w-[64ch] text-sm leading-relaxed text-fg-3">
          Pengiriman memakai GitHub Issues sehingga memerlukan akun GitHub (gratis). Seluruh kiriman bersifat publik dan ditinjau terlebih dahulu sebelum dimuat. Jangan mencantumkan data pribadi pada kiriman.
        </p>
      </section>

      <section aria-labelledby="bacaan" className="mt-24 border-t border-line pt-14">
        <h2 id="bacaan" className="text-3xl font-extrabold tracking-tight text-fg md:text-4xl">Daftar bacaan<span className="text-ember">.</span></h2>
        <p className="mt-4 max-w-[60ch] text-fg-2">Artikel terpilih tentang karhutla di Kalimantan, termasuk rujukan angka yang dipakai pada situs ini.</p>
        {articles.length === 0 ? (
          <p className="mt-8 text-fg-3">Belum ada artikel. Jadilah pengirim pertama.</p>
        ) : (
          <ul className="mt-8 grid max-w-3xl gap-8">
            {articles.map(a => (
              <li key={a.url}>
                <p className="text-sm text-fg-3">{a.publisher}, {fmtDate(a.date)}</p>
                <a href={a.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-lg font-semibold text-fg underline decoration-ember underline-offset-4 hover:text-ember">{a.title}</a>
                {a.note && <p className="mt-1 text-fg-2">{a.note}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
