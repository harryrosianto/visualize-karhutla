// Membangun 4 gambar carousel (1080x1350) untuk thread ajakan ilustrator: node docs/outreach/build.mjs
// Lalu: lihat docs/outreach/README.md untuk perintah tangkapan layar.
import fs from 'node:fs'
const css = `
:root{--ink:#0c0a09;--ink2:#1a1512;--fg:#f5f1ec;--fg2:#cfc6bd;--fg3:#968c82;--ember:#ff6a1f;--line:#3a312b}
*{box-sizing:border-box;margin:0}html,body{background:#000}
body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:var(--fg);-webkit-print-color-adjust:exact}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:var(--ink);padding:90px 84px;display:flex;flex-direction:column}
.k{font-size:26px;letter-spacing:.1em;text-transform:uppercase;color:var(--ember);font-weight:700;margin-bottom:22px}
h1{font-size:104px;line-height:.97;font-weight:800;letter-spacing:-.03em}h2{font-size:74px;line-height:1.02;font-weight:800;letter-spacing:-.025em}
i{color:var(--ember);font-style:normal}
p,li{font-size:34px;line-height:1.38;color:var(--fg2)}b{color:var(--fg)}
.wm{position:absolute;left:84px;bottom:56px;font-size:26px;font-weight:800;color:var(--fg3)}.wm i{color:var(--ember)}
.pg{position:absolute;right:84px;bottom:56px;font-size:26px;color:var(--fg3)}
.shot{border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.6)}.shot img{display:block;width:100%}
.steps{list-style:none;padding:0;counter-reset:s;display:grid;gap:30px;margin-top:50px}
.steps li{counter-increment:s;position:relative;padding-left:84px}
.steps li::before{content:counter(s);position:absolute;left:0;top:-2px;width:56px;height:56px;border-radius:50%;background:var(--ember);color:var(--ink);font-weight:800;font-size:30px;text-align:center;line-height:56px}
.form{background:#fff;color:#1f2328;border-radius:16px;padding:34px 38px;font-size:26px;margin-top:44px}
.form .t{font-weight:700;font-size:30px;margin-bottom:18px}.form label{display:block;font-weight:600;margin:16px 0 6px;font-size:24px}.form label b{color:#cf222e}
.form .f{border:1px solid #d0d7de;border-radius:8px;padding:12px 16px;color:#6e7781;background:#f6f8fa;font-size:24px}
.form .drop{border:3px dashed #8c959f;border-radius:10px;padding:40px 10px;text-align:center;color:#57606a;background:#f6f8fa;font-size:26px}
.form .c{display:flex;gap:12px;font-size:22px;margin-top:12px;color:#1f2328;align-items:flex-start}.form .c span{flex:none;width:24px;height:24px;border-radius:5px;background:#0969da;color:#fff;font-size:17px;text-align:center;line-height:24px;margin-top:3px}
.cap{font-size:22px;color:var(--fg3);margin-top:16px}
.rules{display:grid;gap:22px;margin-top:40px}.rules div{background:var(--ink2);border:1px solid var(--line);border-radius:18px;padding:24px 28px}
.rules b{display:block;font-size:34px;margin-bottom:6px}.rules p{font-size:28px}
.flow{display:grid;gap:18px;margin-top:44px}.flow div{display:grid;grid-template-columns:70px 1fr;gap:18px;align-items:center;background:var(--ink2);border:1px solid var(--line);border-radius:18px;padding:22px 26px}
.flow em{font-style:normal;font-weight:800;color:var(--ember);font-size:40px}.flow p{font-size:29px}
.url{font-size:38px;font-weight:800;color:var(--ember);border-left:8px solid var(--ember);padding-left:24px;margin-top:34px}
`
const S = []
S.push(`<section class="slide"><div class="k">Open call</div><h1>Illustrators,<br>photographers,<br>designers<i>.</i></h1>
<p style="margin-top:34px">The fires in Kalimantan are not over. Send us your artwork, photos or designs for the karhutla awareness campaign. Your work goes on the site with your name.</p>
<div class="shot" style="margin-top:auto;margin-bottom:70px"><img src="img/templates-grid.jpg" alt=""></div>
<div class="wm">Visualize Karhutla<i>.</i></div><div class="pg">1 / 4</div></section>`)
S.push(`<section class="slide"><div class="k">Langkah 1</div><h2>Buka halaman<br>Kontribusi<i>.</i></h2>
<ol class="steps"><li>Buka <b>harryrosianto.github.io/visualize-karhutla/kontribusi</b></li><li>Cari <b>"Sumbang templat visual"</b>, lalu tekan <b>Kirim templat</b>.</li></ol>
<div class="shot" style="margin-top:auto;margin-bottom:70px"><img src="img/ways-template.jpg" alt=""></div>
<div class="wm">Visualize Karhutla<i>.</i></div><div class="pg">2 / 4</div></section>`)
S.push(`<section class="slide"><div class="k">Langkah 2</div><h2>Isi formulir,<br>seret gambarmu<i>.</i></h2>
<div class="form"><div class="t">[Templat] Judul karyamu</div>
<label>Judul templat <b>*</b></label><div class="f">Hutan Kita</div>
<label>Nama kreator <b>*</b></label><div class="f">Nama atau nama penamu (tampil sebagai kredit)</div>
<label>Tautan portofolio</label><div class="f">https://  (opsional)</div>
<label>Gambar <b>*</b></label><div class="drop">Seret gambarmu ke sini</div>
<div class="c"><span>&#10003;</span>Karya ini buatan saya sendiri.</div><div class="c"><span>&#10003;</span>Boleh dipakai gratis untuk kampanye karhutla dengan kredit.</div></div>
<p class="cap">Ilustrasi kolom formulir (bukan tangkapan layar asli). Perlu akun GitHub gratis.</p>
<div class="wm">Visualize Karhutla<i>.</i></div><div class="pg">3 / 4</div></section>`)
S.push(`<section class="slide"><div class="k">Ketentuan dan alur</div><h2>Bebas ukuran,<br>ditinjau dulu<i>.</i></h2>
<div class="rules"><div><b>Ilustrasi, foto, atau desain</b><p>Ukuran dan rasio bebas: Story 9:16, lanskap desktop, atau lainnya. PNG, JPG, WebP, GIF; maksimal 12 MB.</p></div></div>
<div class="flow"><div><em>1</em><p><b>Kirim</b> formulirmu di GitHub.</p></div><div><em>2</em><p><b>Ditinjau</b> pemelihara sebelum tayang.</p></div><div><em>3</em><p><b>Tayang</b> di halaman Templat Story dengan namamu.</p></div></div>
<div class="url">harryrosianto.github.io/visualize-karhutla/templat</div>
<div class="wm">#visualizekarhutla</div><div class="pg">4 / 4</div></section>`)
fs.writeFileSync('docs/outreach/slides.html', `<!doctype html><html lang="id"><head><meta charset="utf-8"><title>Open call ilustrator</title><style>${css}</style></head><body>${S.join('')}</body></html>`)
console.log('slides.html ditulis')
