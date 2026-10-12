// Subset Burned.otf ke Latin dasar (U+0020-007E) dan ubah ke woff2: node scripts/subset-font.mjs
import fs from 'node:fs'
import subsetFont from 'subset-font'
const text = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('')
const out = await subsetFont(fs.readFileSync('assets-src/Burned.otf'), text, { targetFormat: 'woff2' })
fs.writeFileSync('src/assets/fonts/burned-latin.woff2', out)
console.log('burned-latin.woff2', out.length, 'bytes')
