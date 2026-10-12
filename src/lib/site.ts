/** Repositori sumber: tujuan formulir kontribusi (GitHub Issues). */
export const REPO_URL = 'https://github.com/harryrosianto/visualize-karhutla'
export const issueUrl = (template: string) => `${REPO_URL}/issues/new?template=${template}`

/** Alamat publik GitHub Pages, ditampilkan pada slide ajakan berkontribusi. */
export const PUBLIC_URL = 'https://harryrosianto.github.io/visualize-karhutla'
export const PUBLIC_HOST_PATH = PUBLIC_URL.replace(/^https?:\/\//, '')
