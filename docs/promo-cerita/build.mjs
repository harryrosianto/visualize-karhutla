// Membangun 3 slide Instagram Story (1080x1920) untuk promosi fitur menulis Cerita karhutla: node docs/promo-cerita/build.mjs
// Lalu tangkap layar slides.html (jendela 1080 x 5760) dan potong per 1920 px menjadi slide-1.png ... slide-3.png.
import fs from 'node:fs'

const css = `
:root{--ink:#0c0a09;--ink2:#1a1512;--fg:#f5f1ec;--fg2:#cfc6bd;--fg3:#968c82;--ember:#ff6a1f;--line:#3a312b}
*{box-sizing:border-box;margin:0}html,body{background:#000}
body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:var(--fg);-webkit-print-color-adjust:exact}
.slide{position:relative;width:1080px;height:1920px;overflow:hidden;background:radial-gradient(1200px 900px at 50% 105%,rgba(255,106,31,.32),rgba(255,106,31,0) 70%),var(--ink)}
.wm{position:absolute;left:84px;top:130px;font-size:34px;font-weight:800;letter-spacing:-.01em}.wm i{color:var(--ember);font-style:normal}
.k{position:absolute;left:84px;top:230px;font-size:28px;letter-spacing:.1em;text-transform:uppercase;color:var(--ember);font-weight:700}
h1{position:absolute;left:84px;right:84px;top:285px;font-size:92px;line-height:1;font-weight:800;letter-spacing:-.03em}h1 i{color:var(--ember);font-style:normal}
.sub{position:absolute;left:84px;right:84px;font-size:38px;line-height:1.35;color:var(--fg2)}
.phone{position:absolute;border:4px solid #2e2520;border-radius:52px;overflow:hidden;background:#000;box-shadow:0 30px 90px rgba(0,0,0,.65)}.phone img{display:block;width:100%}
.cap{position:absolute;font-size:30px;line-height:1.3;color:var(--fg2);text-align:center}.cap b{color:var(--fg)}
.note{position:absolute;left:0;right:0;text-align:center;font-size:24px;color:var(--fg3)}
.pill{position:absolute;left:50%;transform:translateX(-50%);background:var(--ember);color:var(--ink);font-weight:800;font-size:44px;border-radius:99px;padding:26px 64px;white-space:nowrap}
.tag{position:absolute;left:0;right:0;text-align:center;font-size:34px;font-weight:800;color:var(--ember)}
.step{position:absolute;display:grid;place-items:center;width:64px;height:64px;border-radius:50%;background:var(--ember);color:var(--ink);font-weight:800;font-size:34px}
`
const S = []
// 1: menulis
S.push(`<section class="slide"><div class="wm">Visualize Karhutla<i>.</i></div>
<div class="k">New feature</div>
<h1>Write your<br>karhutla story<i>.</i></h1>
<p class="sub" style="top:600px">A simple editor, right on the site. No account needed.</p>
<div class="phone" style="left:325px;top:740px;width:430px"><img src="img/p-editor.png" alt=""></div>
<p class="cap" style="left:84px;right:84px;top:1735px"><b>Photos, headings, quotes.</b> Drafts save automatically.</p>
</section>`)
// 2: proses
S.push(`<section class="slide"><div class="wm">Visualize Karhutla<i>.</i></div>
<div class="k">How it works</div>
<h1>Pick topics.<br>Make it yours<i>.</i></h1>
<div class="phone" style="left:84px;top:640px;width:430px"><img src="img/p-form-topik.png" alt=""></div>
<div class="phone" style="left:566px;top:640px;width:430px"><img src="img/p-form-penulis.png" alt=""></div>
<p class="cap" style="left:84px;width:430px;top:1580px"><b>Choose or create topics</b> to label your story.</p>
<p class="cap" style="left:566px;width:430px;top:1580px"><b>Add your link and photo</b> (optional). Skip it and get a random animal avatar.</p>
</section>`)
// 3: terbit
S.push(`<section class="slide"><div class="wm">Visualize Karhutla<i>.</i></div>
<div class="k">Then what?</div>
<h1>We review it.<br>Then it goes live<i>.</i></h1>
<div class="phone" style="left:120px;top:540px;width:400px"><img src="img/p-list.png" alt=""></div>
<div class="phone" style="left:560px;top:590px;width:400px"><img src="img/p-reader.png" alt=""></div>
<p class="cap" style="left:120px;width:400px;top:1425px">Your story joins the <b>Cerita karhutla</b> feed.</p>
<p class="cap" style="left:560px;width:400px;top:1475px">Read like an article, with <b>your name and photo</b>.</p>
<div class="pill" style="top:1590px">Write yours</div>
<p class="note" style="top:1715px">Example story shown for illustration.</p>
</section>`)
fs.writeFileSync('docs/promo-cerita/slides.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Cerita karhutla: promo story</title><style>${css}</style></head><body>${S.join('')}</body></html>`)
console.log('slides.html ditulis')
