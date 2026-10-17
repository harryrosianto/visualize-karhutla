/** Repositori sumber: tujuan formulir kontribusi (GitHub Issues). */
export const REPO_URL = 'https://github.com/harryrosianto/visualize-karhutla'
export const issueUrl = (template: string) => `${REPO_URL}/issues/new?template=${template}`

/** Alamat publik GitHub Pages, ditampilkan pada slide ajakan berkontribusi. */
export const PUBLIC_URL = 'https://harryrosianto.github.io/visualize-karhutla'
export const PUBLIC_HOST_PATH = PUBLIC_URL.replace(/^https?:\/\//, '')

/** Story sorotan Instagram berisi stiker Add Yours; pengunjung dapat ikut dari sini. */
export const ADD_YOURS_URL = 'https://www.instagram.com/s/aGlnaGxpZ2h0OjE4MTEzMDMzMTE3MTM1Nzc0?story_media_id=4006837623154725768_4000644639&srtk=MXQyMzQ2M2l3ZHJsMQ==' as const

/** Akun Threads pemelihara, jalur alternatif mengirim karya tanpa GitHub (lewat DM). */
export const THREADS_URL = 'https://www.threads.com/@harrierosss' as const

/** Akun Instagram pengembang. */
export const INSTAGRAM_URL = 'https://www.instagram.com/worldofhahadaily/' as const

/** Alamat API kiriman karya (Worker Cloudflare). Dapat diganti lewat VITE_SUBMIT_URL. */
export const SUBMIT_URL: string = import.meta.env.VITE_SUBMIT_URL || 'https://visualize-karhutla.harry-prasetyo.workers.dev/api/submit'
/** Kunci situs Cloudflare Turnstile (publik). Bila kosong, formulir unggah langsung disembunyikan. */
export const TURNSTILE_SITEKEY: string = import.meta.env.VITE_TURNSTILE_SITEKEY || ''
