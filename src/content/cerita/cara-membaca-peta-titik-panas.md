---
judul: Cara Membaca Peta Titik Panas dan Menggunakannya dengan Bijak
topik: Teknologi dan data, Pendidikan, Pencegahan
penulis: harrie
tautan: https://www.threads.com/@harrierosss
foto: cerita/cara-membaca-peta-titik-panas/penulis.webp
tanggal: 2026-10-18
wilayah: Kalimantan, Sumatra, dan Papua
ringkasan: Titik oranye di peta bukan berarti kebakaran. Panduan singkat membaca peta titik panas Kalimantan, Sumatra, dan Papua: apa yang ditunjukkan, apa yang tidak, dan bagaimana memakainya tanpa menyesatkan orang lain.
gambar: cerita/cara-membaca-peta-titik-panas/1.webp
sumber: https://firms.modaps.eosdis.nasa.gov/
rujukan: NASA FIRMS (Fire Information for Resource Management System). Data titik panas aktif VIIRS NOAA-20, 375 m.
---
Setiap musim kemarau, peta berwarna oranye selalu beredar di lini masa. Banyak orang langsung menyimpulkan bahwa seluruh area oranye itu sedang terbakar. Kesimpulan itu tidak sepenuhnya tepat, dan salah membaca peta bisa membuat kita panik tanpa alasan, atau sebaliknya, meremehkan keadaan yang sebenarnya serius. Tulisan ini menjelaskan cara membaca peta titik panas di situs ini, lalu cara menggunakannya dengan bijak.

## Apa itu titik panas

Satelit VIIRS NOAA-20 milik NASA memotret permukaan bumi dan mencari piksel yang suhunya jauh lebih tinggi daripada sekitarnya. Satu piksel mencakup sekitar 375 meter. Jika suhunya mencurigakan, piksel itu ditandai sebagai **titik panas**. Data ini kami ambil dari NASA FIRMS, mulai 1 Januari 2025, lalu menghitung setiap titik ke kabupaten/kota yang batas wilayahnya memuat koordinat titik tersebut. Titik berkepercayaan rendah tidak disertakan.

Jadi, titik panas adalah petunjuk adanya panas, bukan bukti adanya kebakaran, dan bukan ukuran luas lahan yang terbakar.

## Membaca tampilan awal

![Peta titik panas Kalimantan, Sumatra, dan Papua pada 17 Oktober 2026, dengan filter pulau, garis waktu, dan legenda.](cerita/cara-membaca-peta-titik-panas/1.webp)

Saat dibuka, peta menampilkan seluruh wilayah terpantau: Kalimantan, Sumatra, dan Papua. Titik **oranye** adalah titik panas biasa. Titik **merah** adalah titik dengan intensitas tertinggi, yaitu sekitar 5 persen teratas menurut daya radiasi api (FRP). Merah tidak berarti bencana yang lebih besar; ia hanya menandai pembacaan panas yang paling kuat di antara titik lainnya.

Ketika banyak titik menumpuk, area terlihat penuh oranye. Itu menunjukkan kerapatan titik, bukan luas api.

## Memfilter menurut pulau dan provinsi

![Filter Sumatra dan provinsi Sumatra Selatan aktif; peta menyorot titik panas di Sumatra Selatan.](cerita/cara-membaca-peta-titik-panas/2.webp)

Baris pertama tombol memilih pulau, baris kedua memilih provinsi di pulau tersebut. Angka kumulatif pada garis waktu ikut menyesuaikan dengan pilihan Anda. Contohnya, pada gambar di atas, Sumatra Selatan tercatat 45.515 titik panas sejak 1 Januari 2026 hingga 17 Oktober 2026.

Tampilan ini juga tersimpan di tautan. Tombol "Salin tautan tampilan" menyalin alamat yang membuka peta dengan filter, tanggal, dan kabupaten yang sama.

## Memakai garis waktu

![Garis waktu peta pada 20 Agustus 2026 menunjukkan jumlah titik panas hari itu dan jumlah kumulatif sejak 1 Januari.](cerita/cara-membaca-peta-titik-panas/3.webp)

Geser penggeser untuk memilih tanggal, atau tekan tombol putar untuk melihat penyebarannya dari hari ke hari. Dua angka di sebelah tanggal berbeda artinya:

- **Titik panas pada hari tersebut** adalah jumlah titik yang terdeteksi pada tanggal yang dipilih.
- **Kumulatif sejak 1 Januari** adalah jumlah seluruh titik dari awal tahun hingga tanggal tersebut.

Di peta, titik yang lebih lama memudar, sedangkan titik dalam lima hari terakhir menyala. Jadi titik yang redup bukan berarti apinya padam; ia hanya terdeteksi beberapa hari sebelum tanggal yang dipilih. Waktu yang dipakai adalah waktu akuisisi FIRMS dalam UTC, sehingga bisa berbeda satu hari dari tanggal menurut WIB.

## Mode kepadatan 3D

![Mode Kepadatan 3D di Kalimantan: kolom tinggi dan terang menandakan wilayah dengan titik panas yang padat.](cerita/cara-membaca-peta-titik-panas/4.webp)

Mode "Kepadatan 3D" mengelompokkan titik ke dalam sel segi enam. Semakin tinggi dan terang kolomnya, semakin padat titik panas di sel tersebut. Mode ini berguna untuk melihat pusat-pusat kepadatan ketika titik-titik terlalu menumpuk untuk dibedakan satu per satu. Ingatlah bahwa tinggi kolom adalah jumlah titik, bukan ketinggian asap atau tingkat keparahan kebakaran.

## Membuka satu kabupaten

![Panel Merauke menunjukkan total titik panas, perbandingan dengan 2025, bulan puncak, dan peringkat.](cerita/cara-membaca-peta-titik-panas/5.webp)

Klik atau ketuk satu kabupaten/kota untuk melihat ringkasannya: total titik panas sejak 1 Januari, perbandingan dengan periode yang sama tahun 2025, grafik per bulan, bulan puncak, dan peringkat di antara seluruh kabupaten/kota yang terpantau. Dari sini Anda juga dapat membuka Karhutla Wrapped untuk kabupaten tersebut.

Beberapa hal perlu dibaca dengan hati-hati:

- **Persentase kenaikan bisa menyesatkan.** Jika angka tahun lalu sangat kecil, kenaikan sedikit saja tampak sebagai ribuan persen. Lihat angka aslinya, bukan hanya persentasenya.
- **Peringkat bergantung pada luas wilayah.** Kabupaten yang luas cenderung memiliki lebih banyak titik. Peringkat ini tidak menunjukkan kabupaten mana yang paling lalai atau paling berbahaya.
- **Titik panas tidak sama dengan luas lahan terbakar.** Angka luas hanya tersedia untuk provinsi di Kalimantan, bersumber dari pemberitaan yang mengutip BNPB dan SiPongi, dan tidak dicampur dengan data titik panas.

## Keterbatasan yang perlu diingat

- **Awan dan asap tebal** dapat menutupi api sehingga tidak terdeteksi.
- **Satelit hanya melintas beberapa kali sehari.** Api yang menyala dan padam di antara dua lintasan tidak tercatat.
- **Satu kebakaran besar dapat menghasilkan banyak titik**, sedangkan api kecil bisa luput. Kondisi sebenarnya bisa lebih ringan atau lebih parah daripada yang tampak.
- **Batas wilayah berasal dari data 2017.** Kabupaten di Papua dikelompokkan ke provinsi hasil pemekaran 2022 menurut nama, sehingga batas di tepi wilayah tidak selalu persis.

## Menggunakan peta dengan bijak

1. **Gunakan untuk melihat pola, bukan untuk menghitung kerugian.** Peta ini membantu menjawab kapan dan di mana panas terdeteksi, bukan berapa hektare yang hangus.
2. **Padukan dengan sumber lain.** Periksa laporan resmi BNPB, SiPongi, dan BPBD setempat, kualitas udara di daerah Anda, serta laporan warga.
3. **Jangan menuding.** Titik panas tidak menunjukkan siapa penyebabnya, apakah lahan itu milik perusahaan, warga, atau pihak lain. Penentuan penyebab menjadi tugas aparat dan pemeriksaan di lapangan.
4. **Sertakan konteks saat membagikan.** Cantumkan tanggal data, sumber, dan keterangan bahwa titik panas belum tentu kebakaran. Tangkapan layar tanpa konteks mudah disalahartikan.
5. **Waspada, bukan panik.** Jika asap sudah masuk ke daerah Anda, ikuti anjuran kesehatan setempat, gunakan masker yang sesuai, dan laporkan api yang Anda lihat kepada pihak berwenang.

## Warga menjaga warga

Satelit melihat dari atas, sedangkan warga melihat dari tanah. Kabar singkat tentang kondisi di daerah masing-masing, misalnya ada asap tebal, ada api di dekat permukiman, atau udara mulai tidak sehat, sangat membantu orang lain bersiap. Peta ini akan lebih berguna bila dipadukan dengan kabar dari warga. Jika Anda melihat sesuatu di sekitar Anda, sampaikan kepada tetangga dan pihak berwenang.
