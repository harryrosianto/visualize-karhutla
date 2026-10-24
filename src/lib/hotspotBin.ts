// Format biner titik panas per provinsi (little-endian), dipakai skrip pemrosesan (menulis) dan peta (membaca).
// Titik diurutkan menurut hari, sehingga indeks hari per titik tidak disimpan, cukup jumlah titik per hari.
//
//   0   'HSB1'             4 byte
//   4   n                  Uint32   jumlah titik
//   8   nDays              Uint16   jumlah hari (indeks 0 = 1 Januari)
//   10  cadangan           Uint16
//   12  barat, selatan, timur, utara   4 x Float32 (kotak pembatas titik)
//   28  jumlah per hari    Uint32[nDays]
//   ..  lon                Uint16[n]  (0..65535 pada rentang barat..timur), disimpan sebagai selisih dari titik sebelumnya (modulo 65536); titik diurutkan per hari lalu per bujur sehingga selisihnya kecil dan mudah dikompres
//   ..  lat                Uint16[n]  (0..65535 pada rentang selatan..utara)
//   ..  frp                Uint8[n]   (FRP x 2, dipotong pada 255; hanya dipakai untuk persentil intensitas)

export interface HotspotData {
  n: number
  lon: Float32Array
  lat: Float32Array
  /** indeks hari sejak 1 Januari */
  day: Uint16Array
  frp: Float32Array
}

const MAGIC = 0x31425348 // 'HSB1' (little-endian)
const HEADER = 28

export function encodeHotspots(src: { lon: number[]; lat: number[]; day: number[]; frp: number[] }, nDays: number): Uint8Array {
  const n = src.lon.length
  const order = Array.from({ length: n }, (_, i) => i).sort((a, b) => src.day[a] - src.day[b] || src.lon[a] - src.lon[b])
  let w = Infinity, s = Infinity, e = -Infinity, nn = -Infinity
  for (let i = 0; i < n; i++) {
    w = Math.min(w, src.lon[i]); e = Math.max(e, src.lon[i]); s = Math.min(s, src.lat[i]); nn = Math.max(nn, src.lat[i])
  }
  if (!n) { w = s = 0; e = nn = 0 }
  // Float32 pada header harus persis sama saat menyandi dan membaca
  const f = new Float32Array([w, s, e, nn])
  const spanX = f[2] - f[0] || 1, spanY = f[3] - f[1] || 1
  const buf = new ArrayBuffer(HEADER + nDays * 4 + n * 5)
  const dv = new DataView(buf)
  dv.setUint32(0, MAGIC, true); dv.setUint32(4, n, true); dv.setUint16(8, nDays, true)
  for (let k = 0; k < 4; k++) dv.setFloat32(12 + k * 4, f[k], true)
  const counts = new Uint32Array(buf, HEADER, nDays)
  const lon = new Uint16Array(buf, HEADER + nDays * 4, n)
  const lat = new Uint16Array(buf, HEADER + nDays * 4 + n * 2, n)
  const frp = new Uint8Array(buf, HEADER + nDays * 4 + n * 4, n)
  let prev = 0
  order.forEach((i, j) => {
    counts[src.day[i]]++
    const x = Math.round(((src.lon[i] - f[0]) / spanX) * 65535)
    lon[j] = (x - prev) & 0xffff
    prev = x
    lat[j] = Math.round(((src.lat[i] - f[1]) / spanY) * 65535)
    frp[j] = Math.min(255, Math.round((src.frp[i] || 0) * 2))
  })
  return new Uint8Array(buf)
}

export function decodeHotspots(input: ArrayBuffer): HotspotData {
  const dv = new DataView(input)
  if (dv.byteLength < HEADER || dv.getUint32(0, true) !== MAGIC) throw new Error('Berkas titik panas tidak dikenali')
  const n = dv.getUint32(4, true), nDays = dv.getUint16(8, true)
  const west = dv.getFloat32(12, true), south = dv.getFloat32(16, true), east = dv.getFloat32(20, true), north = dv.getFloat32(24, true)
  const spanX = (east - west) / 65535, spanY = (north - south) / 65535
  const counts = new Uint32Array(input, HEADER, nDays)
  const q = new Uint16Array(input, HEADER + nDays * 4, n * 2)
  const q8 = new Uint8Array(input, HEADER + nDays * 4 + n * 4, n)
  const lon = new Float32Array(n), lat = new Float32Array(n), day = new Uint16Array(n), frp = new Float32Array(n)
  let x = 0
  for (let i = 0; i < n; i++) {
    x = (x + q[i]) & 0xffff
    lon[i] = west + x * spanX
    lat[i] = south + q[n + i] * spanY
    frp[i] = q8[i] / 2
  }
  let o = 0
  for (let d = 0; d < nDays; d++) for (let c = counts[d]; c > 0; c--) day[o++] = d
  return { n, lon, lat, day, frp }
}
