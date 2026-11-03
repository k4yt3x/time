import type { ComponentChildren } from 'preact'
import { useCallback, useLayoutEffect, useRef } from 'preact/hooks'

/**
 * Text as large as fits its box: as wide as the box, and as tall as its max-height where it
 * has one, else as the box itself. The box takes its width from the layout around it, never
 * from the text. `fitKey` changes whenever the text may change width: the digits are all one
 * width, so the time itself changing does not.
 */
export function FitText({
  children,
  fitKey,
  class: className,
}: {
  children: ComponentChildren
  fitKey: string
  class?: string
}) {
  const box = useRef<HTMLDivElement>(null)
  const text = useRef<HTMLSpanElement>(null)

  const fit = useCallback(() => {
    if (!box.current || !text.current) return
    const available = box.current.getBoundingClientRect()
    const maxHeight = Number.parseFloat(getComputedStyle(box.current).maxHeight)
    const height = Number.isFinite(maxHeight) ? maxHeight : available.height
    const used = text.current.getBoundingClientRect()
    if (used.width === 0 || used.height === 0) return
    const size = Number.parseFloat(text.current.style.fontSize) || 16
    const scale = Math.min(available.width / used.width, height / used.height)
    const next = Math.max(8, Math.floor(size * scale * 0.98))
    if (Math.abs(next - size) >= 1) text.current.style.fontSize = `${next}px`
  }, [])

  useLayoutEffect(fit, [fitKey])
  useLayoutEffect(() => {
    if (!box.current) return
    const observer = new ResizeObserver(fit)
    observer.observe(box.current)
    // A max-height in viewport units changes with the window's height, which need not resize
    // the box.
    window.addEventListener('resize', fit)
    // The web font changes the text's width once it arrives.
    void document.fonts.ready.then(fit)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', fit)
    }
  }, [fit])

  return (
    <div class={className ? `fit ${className}` : 'fit'} ref={box}>
      <span class="fit-text" ref={text}>
        {children}
      </span>
    </div>
  )
}
