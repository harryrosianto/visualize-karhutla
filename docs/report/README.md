# Improvement report (carousel 4:5)

- `slides/slide-1.png` ... `slide-10.png`: 10 gambar 1080 x 1350 (rasio 4:5, ukuran feed) siap unggah.
- `build.mjs`: membangun `slides.html` dari data situs (angka tidak diketik manual).
- `img/`: tangkapan layar yang dipakai pada slide.

Bangun ulang setelah data atau tampilan berubah:

```bash
node docs/report/build.mjs
```

Lalu tangkap layar `slides.html` dengan Chrome (jendela 1080 x 10800, tanpa scrollbar) dan potong per 1350 px.
