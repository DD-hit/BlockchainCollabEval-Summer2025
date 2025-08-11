"use client"

import React, { createContext, useCallback, useContext, useMemo, useState, Suspense } from "react"

// Lazy import existing ScoreModal to avoid immediate coupling on props
const LazyScoreModal = React.lazy(() => import("../Score/ScoreModal"))

const ScoreContext = createContext(null)

export const useScore = () => {
  const ctx = useContext(ScoreContext)
  if (!ctx) throw new Error("useScore must be used within ScoreProvider")
  return ctx
}

/**
 * openScore({
 *   file,                  // optional file info to display in modal
 *   projectId, subtaskId,  // id context
 *   onScored,              // callback when score submitted
 *   ...any                 // any extra props modal might accept
 * })
 */
export function ScoreProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [payload, setPayload] = useState({})

  const openScore = useCallback((data = {}) => {
    setPayload(data)
    setOpen(true)
  }, [])

  const closeScore = useCallback(() => {
    setOpen(false)
    setPayload({})
  }, [])

  const value = useMemo(() => ({ openScore, closeScore }), [openScore, closeScore])

  return (
    <ScoreContext.Provider value={value}>
      {children}
      {open ? (
        <Suspense fallback={null}>
          <LazyScoreModal
            // pass both open and isOpen to maximize compatibility
            open={open}
            isOpen={open}
            onClose={closeScore}
            onScored={payload.onScored}
            file={payload.file}
            projectId={payload.projectId}
            subtaskId={payload.subtaskId}
            {...payload}
          />
        </Suspense>
      ) : null}
    </ScoreContext.Provider>
  )
}
