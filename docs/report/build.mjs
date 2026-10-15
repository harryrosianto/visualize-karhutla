// Membangun carousel "improvement report" (1080x1350, 4:5) dari data situs: node docs/report/build.mjs
// Lalu tangkap layar (lihat docs/report/README.md) dan potong per 1350 px menjadi slide-1.png ... slide-8.png.
import fs from 'node:fs'
const kab = JSON.parse(fs.readFileSync('public/data/kabupaten.json', 'utf8'))
const meta = JSON.parse(fs.readFileSync('public/data/meta.json', 'utf8'))
const comm = JSON.parse(fs.readFileSync('src/content/communityTemplates.json', 'utf8'))
const n = v => Math.round(v).toLocaleString('en-US')
const total = kab.reduce((a, k) => a + k.total2026, 0)
const total25 = kab.reduce((a, k) => a + (k.total2025 ?? 0), 0)
const mult = (total / total25).toFixed(1)
const asOf = new Date(meta.dataDate + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const creators = new Set(comm.map(c => c.creator)).size
const works = comm.length

const css = `
:root{--ink:#0c0a09;--ink2:#1a1512;--fg:#f5f1ec;--fg2:#cfc6bd;--fg3:#968c82;--ember:#ff6a1f;--line:#3a312b}
*{box-sizing:border-box;margin:0}html,body{background:#000}
body{font-family:"Segoe UI","Helvetica Neue",Arial,sans-serif;color:var(--fg);-webkit-print-color-adjust:exact}
.slide{position:relative;width:1080px;height:1350px;overflow:hidden;background:var(--ink);padding:90px 84px 110px;display:flex;flex-direction:column}
.k{font-size:26px;letter-spacing:.1em;text-transform:uppercase;color:var(--ember);font-weight:700;margin-bottom:22px}
h1{font-size:112px;line-height:.96;font-weight:800;letter-spacing:-.03em}h2{font-size:76px;line-height:1.02;font-weight:800;letter-spacing:-.025em}
i{color:var(--ember);font-style:normal}
p,li{font-size:33px;line-height:1.38;color:var(--fg2)}b{color:var(--fg)}
.foot{position:absolute;left:84px;right:84px;bottom:50px;display:flex;justify-content:space-between;font-size:22px;color:var(--fg3)}
.foot b{color:var(--fg3);font-weight:800}.foot i{color:var(--ember)}
.shot{border:1px solid var(--line);border-radius:22px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6);background:#000}.shot img{display:block;width:100%}
.phone{border:3px solid #2e2520;border-radius:44px;overflow:hidden;box-shadow:0 24px 70px rgba(0,0,0,.6);background:#000}.phone img{display:block;width:100%}
.tick{list-style:none;padding:0;display:grid;gap:22px;margin-top:46px}
.tick li{position:relative;padding-left:44px}.tick li::before{content:"";position:absolute;left:0;top:16px;width:16px;height:16px;border-radius:50%;background:var(--ember)}
.tick b{color:var(--fg)}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:20px;margin-top:46px}
.stat{background:var(--ink2);border:1px solid var(--line);border-radius:22px;padding:28px 26px}.stat b{display:block;font-size:64px;line-height:1;letter-spacing:-.03em;color:var(--fg)}.stat span{display:block;margin-top:10px;font-size:25px;color:var(--fg2);line-height:1.25}
.big{font-size:210px;line-height:.95;font-weight:800;letter-spacing:-.045em;color:var(--fg);margin-top:30px}
.row{display:flex;gap:26px;align-items:flex-start}
.chips{display:flex;flex-wrap:wrap;gap:14px;margin-top:32px}.chips span{font-size:26px;font-weight:700;color:var(--ink);background:var(--ember);border-radius:99px;padding:8px 22px}
.g4{display:grid;grid-template-columns:1fr 1fr;gap:22px 24px;margin-top:40px}.g4 figure,.g4m figure{margin:0}.g4 figcaption,.g4m figcaption{margin-top:10px;font-size:23px;color:var(--fg3);font-weight:600}.g4m{display:grid;grid-template-columns:repeat(4,1fr);gap:18px;margin-top:40px}.g4m .phone{border-radius:30px}
.todo{display:grid;gap:16px;margin-top:34px}.todo div{background:var(--ink2);border:1px solid var(--line);border-radius:18px;padding:20px 26px;display:grid;grid-template-columns:54px 1fr;gap:18px;align-items:center}
.todo em{font-style:normal;font-weight:800;color:var(--ember);font-size:34px}.todo p{font-size:28px;line-height:1.28}.todo b{color:var(--fg)}
.need{margin-top:auto;background:var(--ember);border-radius:26px;padding:34px 38px}.need h3{font-size:46px;line-height:1.05;color:var(--ink);letter-spacing:-.02em}.need p{font-size:28px;color:#2a1306;margin-top:12px;line-height:1.3}.need b{color:var(--ink)}
.need .url{margin-top:16px;font-size:30px;font-weight:800;color:var(--ink)}
`
const brand = (i, extra = '') => `<div class="foot"><span><b>Visualize Karhutla</b><i>.</i> ${extra}</span><span>${i} / 10</span></div>`
const S = []
// 1 sampul
S.push(`<section class="slide"><div class="k">Improvement report &middot; October 2026</div><h1>What we<br>shipped,<br>what&rsquo;s<br>next<i>.</i></h1>
<p style="margin-top:34px;max-width:500px">A progress report on Visualize Karhutla, the open project that maps Kalimantan&rsquo;s 2026 forest and land fires.</p>
<div class="phone" style="position:absolute;right:84px;top:300px;width:340px"><img src="img/hero-mobile.png" alt=""></div>
${brand(1)}</section>`)
// 2 data
S.push(`<section class="slide"><div class="k">Data</div><h2>Real satellite data, clearly sourced<i>.</i></h2>
<div class="big">${n(total)}</div><p style="margin-top:8px;color:var(--fg)">fire hotspots detected in Kalimantan, 1 January to ${asOf}.</p>
<div class="stats"><div class="stat"><b>${kab.length}</b><span>regencies and cities mapped</span></div><div class="stat"><b>${mult}&times;</b><span>vs the same period in 2025</span></div><div class="stat"><b>5</b><span>provinces covered</span></div></div>
<ul class="tick"><li>NASA FIRMS (VIIRS NOAA-20), low-confidence detections removed.</li><li>Burned area from BNPB reports (province level), caveats stated.</li><li>Downloadable CSV, citation and a methods page.</li></ul>
${brand(2, 'Source: NASA FIRMS')}</section>`)
// 3 peta
S.push(`<section class="slide"><div class="k">Interactive map</div><h2>Explore every day of the fire season<i>.</i></h2>
<div class="row" style="margin-top:46px"><div class="shot" style="width:600px;flex:none"><img src="img/map-desktop.png" alt=""></div><div class="phone" style="width:250px;flex:none;margin-top:30px"><img src="img/map-mobile.png" alt=""></div></div>
<ul class="tick" style="margin-top:50px"><li><b>Timeline player</b> from 1 January to the latest day.</li><li><b>Hotspots and 3D density</b> views, filter by province.</li><li><b>Shareable map links</b>, regency labels and tooltips.</li></ul>
${brand(3)}</section>`)
// 4 wrapped
S.push(`<section class="slide"><div class="k">Karhutla Wrapped</div><h2>Every regency gets its own story<i>.</i></h2>
<div class="row" style="margin-top:44px;gap:30px"><div class="phone" style="width:300px;flex:none"><img src="img/ketapang-total.png" alt=""></div><div class="phone" style="width:300px;flex:none;margin-top:60px"><img src="img/ketapang-rank.png" alt=""></div>
<div style="padding-top:20px"><p style="font-size:29px"><b>8 screens</b> per regency, plus one for all of Kalimantan.</p><p style="font-size:29px;margin-top:20px">Share any screen as a <b>1080&times;1920</b> image, or a <b>landscape</b> summary for X and Threads.</p></div></div>
<p style="margin-top:26px;font-size:26px;color:var(--fg3)">Example: Ketapang, West Kalimantan &mdash; the regency with the most hotspots in Kalimantan.</p>
<div class="chips" style="margin-top:22px"><span>Per regency</span><span>Kalimantan-wide</span><span>Share to Story</span></div>
${brand(4)}</section>`)
// 5 kesadaran
S.push(`<section class="slide"><div class="k">Awareness tools</div><h2>Ready-made visuals to spread the word<i>.</i></h2>
<div class="shot" style="margin-top:44px"><img src="img/templates-grid.jpg" alt=""></div>
<ul class="tick" style="margin-top:44px"><li><b>8 Instagram Story templates</b> with campaign lines and fire photos, plus an Add Yours template.</li><li>Download or share straight from your phone.</li></ul>
${brand(5)}</section>`)
// 6 komunitas
S.push(`<section class="slide"><div class="k">Community</div><h2>Built with contributions from residents<i>.</i></h2>
<div class="shot" style="margin-top:44px"><img src="img/collage.jpg" alt=""></div>
<div class="stats" style="grid-template-columns:repeat(2,1fr)"><div class="stat"><b>${works}</b><span>artworks in the Galeri warga (citizens&rsquo; gallery)</span></div><div class="stat"><b>${creators}</b><span>contributors credited by name</span></div></div>
<p style="margin-top:30px;font-size:29px">Submit via a GitHub form or DM. Every entry is reviewed, then published automatically. The gallery can be shared as a mosaic image or a scrolling Story video.</p>
${brand(6)}</section>`)
// 7 UI/UX tampilan web
S.push(`<section class="slide"><div class="k">UI/UX &middot; web view</div><h2>One consistent look across every page<i>.</i></h2>
<div class="g4">
<figure><div class="shot"><img src="img/desk-home.png" alt=""></div><figcaption>Home</figcaption></figure>
<figure><div class="shot"><img src="img/map-desktop.png" alt=""></div><figcaption>Map</figcaption></figure>
<figure><div class="shot"><img src="img/desk-wrapped.png" alt=""></div><figcaption>Wrapped</figcaption></figure>
<figure><div class="shot"><img src="img/desk-templat.png" alt=""></div><figcaption>Templates and gallery</figcaption></figure>
</div>
<ul class="tick" style="margin-top:38px;gap:16px"><li style="font-size:29px"><b>Dark ember theme</b>, one clear primary action per section.</li><li style="font-size:29px"><b>Parallax hero</b> with a smooth fade into the data.</li><li style="font-size:29px"><b>Map-first navigation:</b> Map, Wrapped, Contribute, About.</li></ul>
${brand(7)}</section>`)
// 8 UI/UX tampilan mobile
S.push(`<section class="slide"><div class="k">UI/UX &middot; mobile view</div><h2>Designed for the phone first<i>.</i></h2>
<div class="g4m">
<figure><div class="phone"><img src="img/hero-mobile.png" alt=""></div><figcaption>Poster-style hero</figcaption></figure>
<figure><div class="phone"><img src="img/map-mobile.png" alt=""></div><figcaption>Map with bottom controls</figcaption></figure>
<figure><div class="phone"><img src="img/mob-wrapped.png" alt=""></div><figcaption>Wrapped picker</figcaption></figure>
<figure><div class="phone"><img src="img/mob-templat.png" alt=""></div><figcaption>Story templates</figcaption></figure>
</div>
<ul class="tick" style="margin-top:34px;gap:16px"><li style="font-size:29px"><b>Thumb-friendly</b> controls, collapsed search and legend on the map.</li><li style="font-size:29px"><b>Story-style player</b> for Wrapped: tap, hold and swipe.</li><li style="font-size:29px"><b>Share from the phone</b> straight to Instagram Story.</li></ul>
${brand(8)}</section>`)
// 9 kualitas
S.push(`<section class="slide"><div class="k">Quality</div><h2>Smoother, sturdier, easier to share<i>.</i></h2>
<ul class="tick" style="gap:26px"><li><b>Mobile-first redesign.</b> Poster-style hero, readable on small screens.</li><li><b>Share images show the final state</b>, not a mid-animation frame.</li><li><b>Link previews</b> for every Wrapped page, so links look right in chats.</li><li><b>Resilient updates.</b> The site recovers by itself after a new release.</li><li><b>Accessible by default.</b> Keyboard control and reduced-motion support.</li><li><b>Open source.</b> Contribution guide, issue forms and a how-to deck.</li></ul>
${brand(9)}</section>`)
// 8 apa yang perlu ditingkatkan + ajakan
S.push(`<section class="slide" style="padding-top:80px"><div class="k">What to improve</div><h2 style="font-size:68px">There is still a lot to do<i>.</i></h2>
<div class="todo">
<div><em>1</em><p><b>Daily automatic data refresh</b> so the map never goes stale.</p></div>
<div><em>2</em><p><b>Burned area per regency</b> (today: province level, from news reports).</p></div>
<div><em>3</em><p><b>More years of history</b> for context beyond 2025.</p></div>
<div><em>4</em><p><b>A faster map</b> on slow phones (lighter hotspot data).</p></div>
<div><em>5</em><p><b>Other affected regions</b> coming soon: fetch data for Sumatra, Papua and beyond.</p></div>
<div><em>6</em><p><b>Automated tests</b> for pages and share images, and an English version.</p></div>
</div>
<div class="need"><h3>We need your contribution.</h3><p><b>Data:</b> burned-area figures, local reports, corrections. <b>Assets:</b> illustrations, photos, designs. <b>Also:</b> articles, code, translation.</p><div class="url">harryrosianto.github.io/visualize-karhutla/kontribusi</div></div>
${brand(10, '#visualizekarhutla')}</section>`)
fs.writeFileSync('docs/report/slides.html', `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Visualize Karhutla improvement report</title><style>${css}</style></head><body>${S.join('')}</body></html>`)
console.log('slides.html ditulis', { total, total25, mult, works, creators })
