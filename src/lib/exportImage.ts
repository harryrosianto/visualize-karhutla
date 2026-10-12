import { toBlob } from 'html-to-image'

/** Render elemen ke PNG berukuran tetap, setelah font dan gambar siap. */
export async function renderPng(el: HTMLElement, width: number, height: number): Promise<Blob> {
  await document.fonts.ready
  await Promise.all(Array.from(el.querySelectorAll('img')).map(i => (i.complete && i.naturalWidth ? null : i.decode().catch(() => null))))
  await new Promise(r => setTimeout(r, 150))
  const blob = await toBlob(el, { width, height, pixelRatio: 1, cacheBust: true, backgroundColor: '#0C0A09' })
  if (!blob) throw new Error('gagal membuat gambar')
  return blob
}

export type ShareResult = 'dibagikan' | 'diunduh' | 'batal'

export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = fileName
  document.body.appendChild(a); a.click(); a.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 4000)
}

/** Bagikan lewat lembar bagikan perangkat bila mendukung berkas; jika tidak (atau ditolak), unduh. */
export async function shareOrDownload(blob: Blob, fileName: string, data: { title: string; text: string }): Promise<ShareResult> {
  const file = new File([blob], fileName, { type: 'image/png' })
  if (navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({ files: [file], ...data })
      return 'dibagikan'
    } catch (e: any) {
      if (e?.name === 'AbortError') return 'batal'
      // NotAllowedError (mis. iOS: izin gestur kedaluwarsa): jatuh ke unduhan
    }
  }
  downloadBlob(blob, fileName)
  return 'diunduh'
}
