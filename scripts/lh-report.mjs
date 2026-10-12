// Ringkas laporan Lighthouse JSON: node scripts/lh-report.mjs <berkas.json>
import fs from 'node:fs'
const r = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'))
console.log(r.finalDisplayedUrl, Object.entries(r.categories).map(([k, v]) => `${k}:${Math.round(v.score * 100)}`).join(' '))
const a = r.audits
for (const k of ['first-contentful-paint', 'largest-contentful-paint', 'cumulative-layout-shift', 'total-blocking-time', 'speed-index']) console.log(' ', k, a[k].displayValue)
for (const cat of Object.values(r.categories))
  for (const ref of cat.auditRefs) { const v = a[ref.id]; if (v.score !== null && v.score < 0.9 && ref.weight > 0) console.log(' !', cat.id, ref.id, '|', v.title, '|', v.displayValue ?? '') }
