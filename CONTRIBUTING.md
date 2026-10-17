# Panduan kontribusi

> **English:** a step-by-step slide guide with screenshots is in [`docs/how-to-contribute/how-to-contribute.pdf`](docs/how-to-contribute/how-to-contribute.pdf) (editable source: `deck.html` in the same folder).

Terima kasih telah membantu mengembangkan Visualize Karhutla.

## Tanpa menulis kode

Gunakan formulir pada tab **Issues** repositori: kirim artikel, sumbang data, laporkan koreksi, atau usulkan fitur. Kiriman bersifat publik dan ditinjau sebelum dimuat. Jangan mencantumkan data pribadi.

- **Artikel**: dari media bereputasi, lembaga pemerintah, lembaga riset, atau organisasi lingkungan. Setelah ditinjau, artikel ditambahkan ke `src/content/articles.json`.
- **Data**: harus disertai sumber yang dapat diperiksa, periode, dan satuan. Data luas lahan terbakar tingkat provinsi/kabupaten ditambahkan ke `data/sipongi.json`.
- **Karya visual**: ilustrator, fotografer, dan desainer dapat mengunggah gambar (ukuran bebas) lewat formulir "Kirim templat", atau mengirim lewat DM Threads @harrierosss bagi yang tidak memakai GitHub (karya dari DM ditambahkan manual oleh pemelihara). Setelah ditinjau, pemelihara memasang label `setujui-templat`; alur `.github/workflows/approve-template.yml` lalu mengoptimalkan gambar, menambahkannya ke `src/assets/community/` dan `src/content/communityTemplates.json`, serta memicu deploy. Persiapan satu kali: buat label `setujui-templat` dan `templat` pada repositori.
- **Karya visual lewat situs**: setelah Worker dan Turnstile dipasang (lihat `worker/README.md`), pengunjung dapat mengirim karya tanpa akun GitHub; isu `templat` dibuat otomatis atas nama pemelihara dan tetap melalui persetujuan label `setujui-templat`.
- **Cerita karhutla**: tulisan (artikel ilmiah, cerita warga, opini) dikirim lewat formulir isu "Kirim cerita karhutla" atau DM Threads; pemelihara menambahkannya sebagai berkas Markdown (format di `docs/CERITA.md`).

## Mengirim perbaikan kode

1. Fork repositori, lalu buat cabang baru.
2. Jalankan `npm install` dan `npm run dev`.
3. Pastikan `npm run build` berhasil sebelum membuka pull request.
4. Bahasa antarmuka memakai ragam formal baku (tanpa "kamu", "cek", "bisa"; gunakan "Anda", "periksa", "dapat").
5. Setiap angka pada antarmuka harus menampilkan sumber dan tanggal data. Jangan mengarang angka; kosongkan bila belum tersedia.

Panduan lengkap menjalankan, mengganti data, dan deploy ada di `README.md` dan `docs/DEPLOY.md`.
