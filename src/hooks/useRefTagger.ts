import { useEffect } from 'react'

const TOOLTIP_SELECTORS = ['.rtTooltip', '#rtTooltip', '[id*="rtTooltip"]', '[class*="rtTooltip"]']

function findTooltip(): HTMLElement | null {
  for (const selector of TOOLTIP_SELECTORS) {
    const el = document.querySelector(selector)
    if (el instanceof HTMLElement) return el
  }
  return null
}

function placeTooltipNear(anchor: HTMLElement) {
  const tooltip = findTooltip()
  if (!tooltip) return

  // Escape transformed ancestors (e.g. home full-bleed wrapper) so fixed coords work.
  if (tooltip.parentElement !== document.body) {
    document.body.appendChild(tooltip)
  }

  const rect = anchor.getBoundingClientRect()
  const tipWidth = tooltip.offsetWidth || 320
  const tipHeight = tooltip.offsetHeight || 180
  const gap = 10
  const padding = 12

  // Viewport coordinates + position:fixed (not document/absolute — breaks under CSS transforms)
  let left = rect.left
  let top = rect.bottom + gap

  const maxLeft = window.innerWidth - tipWidth - padding
  left = Math.max(padding, Math.min(left, maxLeft))

  if (rect.bottom + tipHeight + gap > window.innerHeight - padding) {
    top = rect.top - tipHeight - gap
  }
  top = Math.max(padding, top)

  tooltip.style.setProperty('position', 'fixed', 'important')
  tooltip.style.setProperty('left', `${Math.round(left)}px`, 'important')
  tooltip.style.setProperty('top', `${Math.round(top)}px`, 'important')
  tooltip.style.setProperty('right', 'auto', 'important')
  tooltip.style.setProperty('bottom', 'auto', 'important')
  tooltip.style.setProperty('transform', 'none', 'important')
  tooltip.style.setProperty('margin', '0', 'important')
  tooltip.style.setProperty('z-index', '99999', 'important')
}

/**
 * Re-runs Logos Reftagger after SPA content changes, and repositions the
 * tooltip next to the hovered/clicked Bible reference (avoids transform/layout bugs).
 */
export function useRefTagger(deps: unknown[] = []) {
  useEffect(() => {
    let cancelled = false
    let attempts = 0
    const placeTimers: number[] = []

    const tag = () => {
      if (cancelled) return
      const api = window.refTagger
      if (api?.tag) {
        api.tag()
        return
      }

      attempts += 1
      if (attempts < 20) {
        window.setTimeout(tag, 150)
      }
    }

    const clearPlaceTimers = () => {
      placeTimers.splice(0).forEach((id) => window.clearTimeout(id))
    }

    const schedulePlace = (anchor: HTMLElement) => {
      clearPlaceTimers()
      // Reftagger sets its own position first; override shortly after (and again once sized).
      placeTooltipNear(anchor)
      ;[30, 120, 280].forEach((delay) => {
        placeTimers.push(window.setTimeout(() => placeTooltipNear(anchor), delay))
      })
    }

    const handlePointerOver = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('.rtBibleRef')
      if (!(anchor instanceof HTMLElement)) return
      schedulePlace(anchor)
    }

    document.addEventListener('mouseover', handlePointerOver, true)
    document.addEventListener('focusin', handlePointerOver, true)
    document.addEventListener('click', handlePointerOver, true)

    const timer = window.setTimeout(tag, 50)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      clearPlaceTimers()
      document.removeEventListener('mouseover', handlePointerOver, true)
      document.removeEventListener('focusin', handlePointerOver, true)
      document.removeEventListener('click', handlePointerOver, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
