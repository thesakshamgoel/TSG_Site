import { useState } from 'react'

/**
 * Two-stage image fallback: try `primary`, then `fallback` on error, then give
 * up ("broken") so the caller can render a text placeholder (e.g. the
 * project's title) instead of a dead <img> or a browser's broken-image icon.
 *
 * Pass `resetKey` (e.g. the item's id) when the same component instance is
 * reused across different images without remounting — such as a slideshow —
 * so the fallback state starts fresh for each new image instead of carrying
 * over a previous slide's "broken" state.
 */
export function useImgFallback(primary, fallback, resetKey) {
  const initialStage = primary ? 0 : fallback ? 1 : 2
  const [state, setState] = useState({ key: resetKey, stage: initialStage })

  // React's documented pattern for resetting state when a prop changes,
  // without requiring the caller to remount via a `key`.
  if (state.key !== resetKey) {
    setState({ key: resetKey, stage: initialStage })
  }

  const stage = state.key === resetKey ? state.stage : initialStage
  const src = stage === 0 ? primary : stage === 1 ? fallback : null
  const onError = () =>
    setState((s) => ({ key: resetKey, stage: s.stage === 0 && fallback ? 1 : 2 }))

  return { src, broken: stage === 2 || !src, onError }
}
