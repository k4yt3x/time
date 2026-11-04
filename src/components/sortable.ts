/**
 * Rearranging a list by dragging its items by a handle, with a mouse, a finger or a pen, or by
 * the arrow keys on the handle. The list is the ul the hook's ref is given to; each of its items
 * names its token in data-token, and its handle carries data-handle.
 *
 * While an item is dragged, the others make way for it at once, sliding to their new places, and
 * every change of place goes to `reorder`: the order shown is always the one it was given.
 */

import { useLayoutEffect, useRef, useState } from 'preact/hooks'
import { keyedMove, moveItem } from '../app/reorder.ts'

/** The item moved last, and the place it went to. */
export interface Moved {
  token: string
  index: number
}

interface Drag {
  token: string
  pointerId: number
  item: HTMLElement
  handle: HTMLElement
  /** Where the pointer holds the item, from its top left corner. */
  grabX: number
  grabY: number
  clientX: number
  clientY: number
  /** The order before the drag, to go back to if it is cancelled, and the order asked for since. */
  from: readonly string[]
  order: readonly string[]
  /** The next frame of scrolling at the window's edge, if one is due. */
  frame: number
  /** Stops listening to the pointer and the keys. */
  stop: () => void
}

/** How long the items take to slide to their new places. */
const slideTime = 200
/** How near the window's top or bottom edge a dragged item scrolls the page, at most. */
const scrollEdge = 80
/** How far the page scrolls in a frame, at most, with the pointer at the window's edge. */
const scrollSpeed = 20

const itemsOf = (list: HTMLElement) => [...list.children] as HTMLElement[]
const orderOf = (list: HTMLElement) => itemsOf(list).map((item) => item.dataset.token ?? '')
const sameOrder = (a: readonly string[], b: readonly string[]) => a.join(',') === b.join(',')

/** Where each item is drawn now, sliding or not. */
function positions(list: HTMLElement): Map<string, DOMRect> {
  return new Map(
    itemsOf(list).map((item) => [item.dataset.token ?? '', item.getBoundingClientRect()]),
  )
}

/**
 * Slides the items from where they were drawn to where they are now, but `held`, which follows
 * the pointer. An item put down stays above the others until it has slid into place.
 */
function slide(list: HTMLElement, from: Map<string, DOMRect>, held: HTMLElement | null): void {
  const still = matchMedia('(prefers-reduced-motion: reduce)').matches
  for (const item of itemsOf(list)) {
    if (item === held) continue
    const was = from.get(item.dataset.token ?? '')
    if (!was) continue
    for (const animation of item.getAnimations()) animation.cancel()
    const is = item.getBoundingClientRect()
    const dx = was.left - is.left
    const dy = was.top - is.top
    const putDown = () => item.classList.remove('lifted')
    if (still || (Math.abs(dx) < 1 && Math.abs(dy) < 1)) {
      putDown()
      continue
    }
    const animation = item.animate(
      [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }],
      { duration: slideTime, easing: 'cubic-bezier(0.2, 0, 0, 1)' },
    )
    if (item.classList.contains('lifted')) animation.finished.then(putDown, () => {})
  }
}

export function useSortable(reorder: (tokens: string[]) => void) {
  const list = useRef<HTMLUListElement>(null)
  const drag = useRef<Drag | null>(null)
  /** Where the items were drawn before a change of order not yet rendered. */
  const before = useRef<Map<string, DOMRect> | null>(null)
  /** The item whose handle had the focus when the arrow keys moved it, to give it back. */
  const refocus = useRef<string | null>(null)
  const [moved, setMoved] = useState<Moved | null>(null)

  /** Asks for a new order, the items to slide to it once it is rendered. */
  function rearrange(order: string[]): void {
    const element = list.current
    if (!element) return
    before.current = positions(element)
    if (drag.current) drag.current.order = order
    reorder(order)
  }

  /** Keeps the dragged item under the pointer, and makes way for it where the pointer is. */
  function follow(): void {
    const state = drag.current
    const element = list.current
    if (!state || !element) return
    const box = element.getBoundingClientRect()
    const x = state.clientX - box.left
    const y = state.clientY - box.top
    const { item } = state
    // Until a change of order is rendered, the items are not yet where it puts them.
    if (before.current === null) {
      const items = itemsOf(element)
      const over = items.findIndex(
        (other) =>
          other !== item &&
          x >= other.offsetLeft &&
          x < other.offsetLeft + other.offsetWidth &&
          y >= other.offsetTop &&
          y < other.offsetTop + other.offsetHeight,
      )
      if (over !== -1) rearrange(moveItem(orderOf(element), items.indexOf(item), over))
    }
    item.style.translate = `${x - state.grabX - item.offsetLeft}px ${y - state.grabY - item.offsetTop}px`
  }

  /** Scrolls the page while the pointer is near the window's top or bottom edge. */
  function scrollAtEdge(): void {
    const state = drag.current
    if (!state) return
    state.frame = 0
    const edge = Math.min(scrollEdge, innerHeight / 6)
    const y = state.clientY
    const nearness =
      y < edge ? (y - edge) / edge : y > innerHeight - edge ? (y - innerHeight + edge) / edge : 0
    if (nearness === 0) return
    const top = scrollY
    scrollBy(0, Math.round(Math.max(-1, Math.min(1, nearness)) * scrollSpeed))
    if (scrollY === top) return
    follow()
    state.frame = requestAnimationFrame(scrollAtEdge)
  }

  /** Puts the dragged item down, where it is or, if cancelled, where it was. */
  function drop(cancelled: boolean): void {
    const state = drag.current
    const element = list.current
    if (!state) return
    state.stop()
    drag.current = null
    document.documentElement.classList.remove('dragging')
    const { item, token } = state
    if (!element?.contains(item)) {
      item.classList.remove('lifted')
      return
    }
    const held = item.getBoundingClientRect()
    item.style.translate = ''
    if (cancelled && !sameOrder(state.order, state.from)) {
      rearrange([...state.from])
    } else if (!cancelled && !sameOrder(state.order, state.from)) {
      setMoved({ token, index: state.order.indexOf(token) })
    }
    if (before.current) {
      // A change of order is yet to be rendered; the item slides with the others then.
      before.current.set(token, held)
    } else {
      slide(element, new Map([[token, held]]), null)
    }
  }

  function onPointerDown(token: string, event: PointerEvent): void {
    const element = list.current
    if (!element || drag.current || !event.isPrimary) return
    const handle = event.currentTarget as HTMLElement
    const item = itemsOf(element).find((each) => each.dataset.token === token)
    if (!item) return
    if (event.pointerType === 'mouse' && event.button !== 0) return
    for (const animation of item.getAnimations()) animation.cancel()
    const box = item.getBoundingClientRect()
    const order = orderOf(element)
    const state: Drag = {
      token,
      pointerId: event.pointerId,
      item,
      handle,
      grabX: event.clientX - box.left,
      grabY: event.clientY - box.top,
      clientX: event.clientX,
      clientY: event.clientY,
      from: order,
      order,
      frame: 0,
      stop: () => {},
    }
    const own = (pointer: PointerEvent) => pointer.pointerId === state.pointerId
    const onMove = (pointer: PointerEvent) => {
      if (!own(pointer)) return
      state.clientX = pointer.clientX
      state.clientY = pointer.clientY
      follow()
      if (state.frame === 0) state.frame = requestAnimationFrame(scrollAtEdge)
    }
    const onUp = (pointer: PointerEvent) => own(pointer) && drop(false)
    const onCancel = (pointer: PointerEvent) => own(pointer) && drop(true)
    const onKey = (key: KeyboardEvent) => {
      if (key.key !== 'Escape') return
      key.preventDefault()
      key.stopPropagation()
      drop(true)
    }
    const onScroll = () => follow()
    // What is under the point the drag began at changes as the item moves, and the browser may
    // take it for the start of dragging that, such as a link, cancelling the pointer's events.
    const onNativeDrag = (event: DragEvent) => event.preventDefault()
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    document.addEventListener('pointercancel', onCancel)
    document.addEventListener('keydown', onKey, true)
    window.addEventListener('scroll', onScroll, { passive: true })
    document.addEventListener('dragstart', onNativeDrag)
    state.stop = () => {
      document.removeEventListener('dragstart', onNativeDrag)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.removeEventListener('pointercancel', onCancel)
      document.removeEventListener('keydown', onKey, true)
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(state.frame)
    }
    capture(state)
    item.classList.add('lifted')
    document.documentElement.classList.add('dragging')
    drag.current = state
  }

  function onKeyDown(token: string, event: KeyboardEvent): void {
    const element = list.current
    if (!element || drag.current) return
    if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return
    const order = orderOf(element)
    const index = order.indexOf(token)
    const rtl = getComputedStyle(element).direction === 'rtl'
    const to = keyedMove(event.key, index, order.length, rtl)
    if (to === null) return
    event.preventDefault()
    if (to === index || before.current) return
    refocus.current = token
    rearrange(moveItem(order, index, to))
    setMoved({ token, index: to })
  }

  useLayoutEffect(() => {
    const element = list.current
    if (!element) return
    const state = drag.current
    if (state && !element.contains(state.item)) drop(true)
    const token = refocus.current
    refocus.current = null
    if (token !== null) {
      const item = itemsOf(element).find((each) => each.dataset.token === token)
      const handle = item?.querySelector<HTMLElement>('[data-handle]')
      if (handle && document.activeElement !== handle) handle.focus()
    }
    const from = before.current
    before.current = null
    if (from) slide(element, from, drag.current?.item ?? null)
    if (drag.current) {
      // Moving an element in the document can end its capture of the pointer.
      capture(drag.current)
      follow()
    }
  })

  // Lets go of a drag still going on when the list goes, as when one clock is left.
  useLayoutEffect(
    () => () => {
      drag.current?.stop()
      drag.current = null
      document.documentElement.classList.remove('dragging')
    },
    [],
  )

  return { list, moved, onPointerDown, onKeyDown }
}

/** Sends the pointer's events to the handle, wherever the pointer goes, even out of the window. */
function capture({ handle, pointerId }: Drag): void {
  try {
    if (!handle.hasPointerCapture(pointerId)) handle.setPointerCapture(pointerId)
  } catch {
    // The pointer is no longer down; its pointerup is on its way.
  }
}
