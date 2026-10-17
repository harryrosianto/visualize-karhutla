import { Marked } from 'marked'

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
/** Tautan yang diizinkan: http(s), mailto, anchor, dan berkas milik situs di bawah cerita/ (diberi awalan base path). */
export function resolveUrl(u: string): string {
  const t = u.trim()
  if (/^(https?:|mailto:|#)/i.test(t)) return t
  if (/^cerita\/[\w./-]+$/.test(t) && !t.includes('..')) return import.meta.env.BASE_URL + t
  return ''
}
const safeUrl = resolveUrl

/** Penerjemah Markdown untuk cerita. HTML mentah di dalam isi tidak dirender (di-escape), dan tautan serta gambar dibatasi pada http(s). */
const md = new Marked({ gfm: true })
md.use({
  renderer: {
    html({ text }) { return esc(text) },
    link({ href, title, tokens }) {
      const url = safeUrl(href)
      const inner = this.parser.parseInline(tokens)
      if (!url) return inner
      const external = /^https?:/i.test(url)
      return `<a href="${esc(url)}"${title ? ` title="${esc(title)}"` : ''}${external ? ' target="_blank" rel="noopener noreferrer nofollow"' : ''}>${inner}</a>`
    },
    image({ href, title, text }) {
      const url = safeUrl(href)
      if (!url) return esc(text)
      return `<img src="${esc(url)}" alt="${esc(text)}"${title ? ` title="${esc(title)}"` : ''} loading="lazy" decoding="async">`
    },
  },
})

export function renderMarkdown(src: string): string {
  return md.parse(src, { async: false }) as string
}
