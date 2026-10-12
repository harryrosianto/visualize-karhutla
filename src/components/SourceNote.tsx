import { useData } from '../lib/DataContext'
import { sourceLine } from '../lib/data'

export function SourceNote({ kind = 'hotspot', className = '' }: { kind?: 'hotspot' | 'burnedArea'; className?: string }) {
  const { meta } = useData()
  if (!meta) return null
  return <p className={`text-xs leading-relaxed text-fg-3 ${className}`}>{sourceLine(meta, kind)}</p>
}
