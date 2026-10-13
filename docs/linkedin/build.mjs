// Membangun carousel LinkedIn (HTML 1080x1350) dari data situs, agar angka tidak diketik manual.
// Jalankan: node docs/linkedin/build.mjs  ->  docs/linkedin/carousel.html
// Lalu cetak ke PDF dengan Chrome (lihat docs/linkedin/README.md).
import fs from 'node:fs'

const kab = JSON.parse(fs.readFileSync('public/data/kabupaten.json', 'utf8'))
const meta = JSON.parse(fs.readFileSync('public/data/meta.json', 'utf8'))
const sip = JSON.parse(fs.readFileSync('data/sipongi.json', 'utf8'))
const n = v => Math.round(v).toLocaleString('en-US')
const ha = v => v.toLocaleString('en-US', { maximumFractionDigits: 1 })

const total = kab.reduce((a, k) => a + k.total2026, 0)
const total25 = kab.reduce((a, k) => a + (k.total2025 ?? 0), 0)
const monthly = Array(10).fill(0)
for (const k of kab) k.monthly.forEach((v, i) => (monthly[i] += v))
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct']
const peakIdx = monthly.indexOf(Math.max(...monthly))
const augOct = monthly.slice(7).reduce((a, b) => a + b, 0)
const provs = {}
for (const k of kab) provs[k.provinceName] = (provs[k.provinceName] ?? 0) + k.total2026
const provList = Object.entries(provs).sort((a, b) => b[1] - a[1])
const top5 = kab.slice().sort((a, b) => b.total2026 - a.total2026).slice(0, 5)
const burned = sip.provinces.map(p => ({ id: p.provinceId, ha: p.burnedHa })).sort((a, b) => b.ha - a.ha)
const PNAME = { kalbar: 'West Kalimantan', kalteng: 'Central Kalimantan', kalsel: 'South Kalimantan', kaltim: 'East Kalimantan', kaltara: 'North Kalimantan' }
const EN = { 'Kalimantan Barat': 'West Kalimantan', 'Kalimantan Tengah': 'Central Kalimantan', 'Kalimantan Selatan': 'South Kalimantan', 'Kalimantan Timur': 'East Kalimantan', 'Kalimantan Utara': 'North Kalimantan' }
const burnedTotal = burned.reduce((a, b) => a + b.ha, 0)
const asOf = new Date(meta.dataDate + 'T00:00:00Z').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' })
const mult = (total / total25).toFixed(1)
const pct = (a, b) => Math.round((a / b) * 100)

const src = `Source: NASA FIRMS (VIIRS NOAA-20), data as of ${asOf}`
const bar = (label, value, max, text, hot) => `
  <div class="row"><div class="lab">${label}</div><div class="track"><div class="fill${hot ? ' hot' : ''}" style="width:${Math.max(2, (value / max) * 100)}%"></div></div><div class="val">${text}</div></div>`
const foot = (i, extra = src) => `<div class="foot"><span>${extra}</span><span>${i} / 10</span></div>`

const slides = []
// 1
slides.push(`<section class="slide photo" style="background-image:linear-gradient(180deg,rgba(12,10,9,.25) 0%,rgba(12,10,9,.55) 45%,rgba(12,10,9,.96) 100%),url(img/orangutan-tree.jpg)">
  <div class="wm">Visualize Karhutla<i>.</i></div>
  <div class="bottom">
    <div class="kicker">Kalimantan, 1 January to ${asOf.replace(/ \d{4}$/, '')} 2026</div>
    <div class="huge">${n(total)}</div>
    <h1>fire hotspots<i>.</i></h1>
    <p class="lead">Behind every dot on the map: forest, peat, wildlife, and the air that millions of people breathe.</p>
  </div>
  <div class="swipe">Swipe &rarr;</div>
</section>`)
// 2
slides.push(`<section class="slide">
  <div class="kicker">The scale</div>
  <h2>${mult}&times; more than the same period last year<i>.</i></h2>
  <div class="cmp">
    ${bar('2025', total25, total, n(total25))}
    ${bar('2026', total, total, n(total), true)}
  </div>
  <p class="lead">Same area, same window (1 January to ${asOf.replace(/ \d{4}$/, '')}), same satellite sensor. 2026 is not a normal fire year.</p>
  ${foot(2, src + '. 2025 = same period.')}
</section>`)
// 3
slides.push(`<section class="slide">
  <div class="kicker">The timing</div>
  <h2>${pct(augOct, total)}% of hotspots came between August and ${asOf.split(' ')[0]} October<i>.</i></h2>
  <div class="months">
    ${monthly.map((v, i) => `<div class="col"><div class="v">${i >= 7 ? n(v / 1000) + 'k' : ''}</div><div class="b${i === peakIdx ? ' hot' : ''}" style="height:${Math.max(3, (v / Math.max(...monthly)) * 430)}px"></div><div class="m">${MONTHS[i]}</div></div>`).join('')}
  </div>
  <p class="lead">${MONTHS[peakIdx]} alone had ${n(monthly[peakIdx])} hotspots (${pct(monthly[peakIdx], total)}% of the year so far). October covers only 1&ndash;${asOf.split(' ')[0]} so far.</p>
  ${foot(3)}
</section>`)
// 4
const pmax = provList[0][1]
slides.push(`<section class="slide">
  <div class="kicker">The places</div>
  <h2>Central Kalimantan holds about half<i>.</i></h2>
  <div class="bars">
    ${provList.map(([name, v], i) => bar(EN[name], v, pmax, `${n(v)} <small>${pct(v, total)}%</small>`, i === 0)).join('')}
  </div>
  <p class="lead">Hotspots per province, 1 January to ${asOf.replace(/ \d{4}$/, '')} 2026.</p>
  ${foot(4)}
</section>`)
// 5
const tmax = top5[0].total2026
slides.push(`<section class="slide">
  <div class="kicker">The hardest hit</div>
  <h2>Five regencies, one burning landscape<i>.</i></h2>
  <div class="bars">
    ${top5.map((k, i) => bar(`${k.name}<small>${EN[k.provinceName]}</small>`, k.total2026, tmax, n(k.total2026), i === 0)).join('')}
  </div>
  <p class="lead">${n(top5.reduce((a, k) => a + k.total2026, 0))} hotspots in just these five &mdash; ${pct(top5.reduce((a, k) => a + k.total2026, 0), total)}% of the Kalimantan total.</p>
  ${foot(5)}
</section>`)
// 6
const bmax = burned[0].ha
slides.push(`<section class="slide">
  <div class="kicker">From dots to damage</div>
  <h2>About ${n(Math.round(burnedTotal / 100) * 100)} hectares reported burned<i>.</i></h2>
  <div class="bars">
    ${burned.map((b, i) => bar(PNAME[b.id], b.ha, bmax, `${ha(b.ha)} ha`, i === 0)).join('')}
  </div>
  <p class="lead">That is larger than the land area of Jakarta (roughly 66,000 ha). Figures are provincial totals reported by BNPB through the press, 1 January to 14 September 2026. North Kalimantan was not reported.</p>
  ${foot(6, 'Source: BNPB via CNBC Indonesia and Katadata')}
</section>`)
// 7
slides.push(`<section class="slide split">
  <div class="img" style="background-image:url(img/rescue.jpg)"></div>
  <div class="txt">
    <div class="kicker">Why it matters</div>
    <h2>This is not only a statistic<i>.</i></h2>
    <ul>
      <li><b>Peat.</b> Kalimantan's peatlands store huge amounts of carbon. When they burn, they smoulder for weeks and release it.</li>
      <li><b>Air.</b> Smoke drifts over towns and across borders, and harms the health of those who breathe it.</li>
      <li><b>Wildlife.</b> Fire destroys the habitat of species such as the Bornean orangutan, already critically endangered.</li>
    </ul>
  </div>
</section>`)
// 8
slides.push(`<section class="slide">
  <div class="kicker">Honest data</div>
  <h2>What these numbers can and cannot say<i>.</i></h2>
  <ul class="plain">
    <li><b>A hotspot is not a fire.</b> Satellites detect heat. One fire can produce several hotspots, and some are missed under cloud or smoke.</li>
    <li><b>Hotspots are not burned area.</b> Hectares come from a separate source (BNPB, reported by the press) at province level only.</li>
    <li><b>Low-confidence detections are removed,</b> then hotspots are matched to regency boundaries.</li>
    <li><b>Nothing is invented.</b> Where data is missing, the site says so.</li>
  </ul>
  ${foot(8, 'Method: NASA FIRMS VIIRS NOAA-20, geoBoundaries ADM2')}
</section>`)
// 9
slides.push(`<section class="slide">
  <div class="kicker">What you can do</div>
  <h2>Help keep it in the conversation<i>.</i></h2>
  <ol class="steps">
    <li><b>Look up your regency.</b> Every regency in Kalimantan has its own story, built from this data.</li>
    <li><b>Share it.</b> Download Instagram Story templates and post them with #visualizekarhutla.</li>
    <li><b>Contribute.</b> Send an article, data, a correction, or your own artwork. It is all open source.</li>
  </ol>
  <div class="url">harryrosianto.github.io/visualize-karhutla</div>
  ${foot(9, 'Open source &middot; free to use &middot; credit the data sources')}
</section>`)
// 10
slides.push(`<section class="slide photo" style="background-image:linear-gradient(180deg,rgba(12,10,9,.7) 0%,rgba(12,10,9,.8) 100%),url(img/embers.jpg)">
  <div class="wm">Visualize Karhutla<i>.</i></div>
  <div class="center">
    <h1 style="font-size:110px">The fires are not over<i>.</i></h1>
    <p class="lead" style="margin-top:34px;color:#f5f1ec">Tell someone today.</p>
    <div class="url" style="margin-top:50px">harryrosianto.github.io/visualize-karhutla</div>
    <p class="tag">#visualizekarhutla</p>
  </div>
  <div class="foot"><span>Data: NASA FIRMS (VIIRS NOAA-20), BNPB via CNBC Indonesia and Katadata. Boundaries: geoBoundaries (CC BY 3.0 IGO).</span><span>10 / 10</span></div>
</section>`)

const css = `
@page { size: 1080px 1350px; margin: 0 }
:root { --ink:#0c0a09; --ink2:#1a1512; --fg:#f5f1ec; --fg2:#cfc6bd; --fg3:#968c82; --ember:#ff6a1f; --line:#3a312b }
* { box-sizing: border-box; margin: 0 }
html, body { background: #000 }
body { font-family: "Segoe UI","Helvetica Neue",Arial,sans-serif; color: var(--fg); -webkit-print-color-adjust: exact; print-color-adjust: exact }
.slide { position: relative; width: 1080px; height: 1350px; overflow: hidden; background: var(--ink); padding: 96px 84px 110px; break-after: page; page-break-after: always; margin: 0 auto; display: flex; flex-direction: column }
@media screen { .slide { margin: 20px auto } }
.kicker { font-size: 26px; letter-spacing: .1em; text-transform: uppercase; color: var(--ember); font-weight: 700; margin-bottom: 22px }
h1 { font-size: 120px; line-height: .95; font-weight: 800; letter-spacing: -.03em }
h2 { font-size: 78px; line-height: 1.02; font-weight: 800; letter-spacing: -.025em }
h1 i, h2 i { color: var(--ember); font-style: normal }
.lead { font-size: 34px; line-height: 1.38; color: var(--fg2); margin-top: auto; padding-top: 30px }
.huge { font-size: 230px; line-height: .95; font-weight: 800; letter-spacing: -.04em; color: var(--fg) }
.photo { background-size: cover; background-position: center; justify-content: flex-start }
.photo .bottom { margin-top: auto }
.photo .lead { margin-top: 28px; padding: 0; max-width: 840px; color: #e8e0d8 }
.wm { font-size: 30px; font-weight: 800; letter-spacing: -.01em }
.wm i { color: var(--ember); font-style: normal }
.swipe { position: absolute; right: 84px; bottom: 56px; font-size: 26px; color: var(--fg3) }
.center { margin: auto 0; text-align: center }
.center h1 { letter-spacing: -.02em }
.url { font-size: 40px; font-weight: 800; color: var(--ember); border-left: 8px solid var(--ember); padding-left: 24px; text-align: left; display: inline-block }
.center .url { border: none; padding: 0 }
.tag { margin-top: 24px; font-size: 34px; font-weight: 700; color: var(--fg) }
.foot span:last-child { white-space: nowrap }
.foot { position: absolute; left: 84px; right: 84px; bottom: 44px; display: flex; justify-content: space-between; gap: 30px; font-size: 21px; color: var(--fg3) }
.row { display: grid; grid-template-columns: 300px 1fr 210px; align-items: center; gap: 18px }
.lab { font-size: 32px; font-weight: 700; color: var(--fg); line-height: 1.15 }
.lab small { display: block; font-size: 22px; font-weight: 400; color: var(--fg3); margin-top: 4px }
.track { height: 60px; background: var(--ink2); border-radius: 12px; overflow: hidden }
.fill { height: 100%; background: #6d625a; border-radius: 12px }
.fill.hot { background: var(--ember) }
.val { font-size: 34px; font-weight: 800; text-align: right; color: var(--fg) }
.val small { font-size: 22px; font-weight: 600; color: var(--fg3); margin-left: 4px }
.bars { display: grid; gap: 52px; margin-top: 90px }
.cmp { display: grid; gap: 50px; margin-top: 130px }
.cmp .row { grid-template-columns: 130px 1fr 220px }
.cmp .track { height: 130px }
.cmp .val { font-size: 40px }
.months { display: flex; align-items: flex-end; gap: 16px; margin-top: 50px; height: 540px }
.months .col { flex: 1; display: flex; flex-direction: column; justify-content: flex-end; align-items: center; gap: 10px }
.months .b { width: 100%; background: #6d625a; border-radius: 10px 10px 0 0 }
.months .b.hot { background: var(--ember) }
.months .m { font-size: 26px; color: var(--fg2); font-weight: 600 }
.months .v { font-size: 22px; color: var(--fg); font-weight: 700; height: 28px }
ul.plain, .steps { list-style: none; padding: 0; display: grid; gap: 34px; margin-top: 60px }
ul.plain li, .steps li { font-size: 34px; line-height: 1.35; color: var(--fg2); padding-left: 36px; position: relative }
ul.plain li::before { content: ""; position: absolute; left: 0; top: 16px; width: 14px; height: 14px; border-radius: 50%; background: var(--ember) }
ul.plain b, .steps b { color: var(--fg) }
.steps { counter-reset: s }
.steps li { counter-increment: s; padding-left: 84px }
.steps li::before { content: counter(s); position: absolute; left: 0; top: -2px; width: 56px; height: 56px; border-radius: 50%; background: var(--ember); color: var(--ink); font-weight: 800; font-size: 30px; text-align: center; line-height: 56px }
.steps + .url { margin-top: auto; margin-bottom: 40px }
.split { padding: 0; flex-direction: column }
.split .img { height: 560px; background-size: cover; background-position: center }
.split .txt { padding: 56px 84px 0 }
.split h2 { font-size: 66px }
.split ul { list-style: none; padding: 0; display: grid; gap: 22px; margin-top: 34px }
.split li { font-size: 31px; line-height: 1.34; color: var(--fg2) }
.split li b { color: var(--fg) }
`
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>The fires are not over | Visualize Karhutla</title><style>${css}</style></head><body>
${slides.join('\n')}
</body></html>`
fs.writeFileSync('docs/linkedin/carousel.html', html)
console.log('carousel.html ditulis', { total, total25, mult, augOct, burnedTotal, peak: MONTHS[peakIdx] })
