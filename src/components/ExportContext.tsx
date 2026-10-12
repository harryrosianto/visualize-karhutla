import { MotionConfig } from 'motion/react'
import { createContext, forwardRef, useContext, type ReactNode } from 'react'

/** true saat komponen dirender untuk diekspor ke PNG: gambar memakai <img> biasa dan animasi dimatikan. */
export const ExportCtx = createContext(false)
export const useExporting = () => useContext(ExportCtx)

/** Panggung tersembunyi di luar layar berukuran tetap (piksel) untuk html-to-image. */
export const ExportStage = forwardRef<HTMLDivElement, { width: number; height: number; children: ReactNode }>(function ExportStage({ width, height, children }, ref) {
  return (
    <ExportCtx.Provider value>
      <MotionConfig reducedMotion="always">
        <div aria-hidden className="pointer-events-none fixed left-[-14000px] top-0" style={{ width, height }}>
          <div ref={ref} className="export-static relative bg-ink [container-type:inline-size]" style={{ width, height }}>{children}</div>
        </div>
      </MotionConfig>
    </ExportCtx.Provider>
  )
})
