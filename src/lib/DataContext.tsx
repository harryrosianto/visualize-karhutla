import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { buildRegion, loadKab, loadMeta, type Kab, type Meta } from './data'

interface Ctx { meta: Meta | null; kabs: Kab[]; region: Kab | null; error: string | null }
const DataCtx = createContext<Ctx>({ meta: null, kabs: [], region: null, error: null })

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Ctx>({ meta: null, kabs: [], region: null, error: null })
  useEffect(() => {
    let alive = true
    Promise.all([loadMeta(), loadKab()])
      .then(([meta, kabs]) => alive && setState({ meta, kabs, region: buildRegion(kabs), error: null }))
      .catch(e => alive && setState({ meta: null, kabs: [], region: null, error: String(e.message ?? e) }))
    return () => { alive = false }
  }, [])
  return <DataCtx.Provider value={state}>{children}</DataCtx.Provider>
}

export const useData = () => useContext(DataCtx)
