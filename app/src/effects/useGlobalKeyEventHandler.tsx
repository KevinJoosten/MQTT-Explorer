import { useEffect, useRef, useMemo } from 'react'
import { KeyCodes } from '../utils/KeyCodes'

export function useGlobalKeyEventHandler(
  key: KeyCodes | undefined,
  callback: (event: KeyboardEvent) => void,
  dependencies?: Array<any>
) {
  // Store callback in ref to avoid adding it to dependencies
  const callbackRef = useRef(callback)
  callbackRef.current = callback

  // Build dependency array once per render
  const deps = useMemo(() => {
    const base = [key]
    return dependencies ? base.concat(dependencies) : base
  }, [key, dependencies])

  useEffect(() => {
    function handleKeyEvent(event: KeyboardEvent) {
      if (key === undefined) {
        callbackRef.current(event)
      } else if (event.keyCode === key) {
        callbackRef.current(event)
        event.preventDefault()
      }
    }

    document.addEventListener('keydown', handleKeyEvent, false)
    return function cleanup() {
      document.removeEventListener('keydown', handleKeyEvent, false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
