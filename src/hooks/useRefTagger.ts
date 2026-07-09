import { useEffect } from 'react'

const TOOLTIP_SELECTORS = ['.rtTooltip', '#rtTooltip', '[id*="rtTooltip"]', '[class*="rtTooltip"]']

function findTooltip(): HTMLElement | null {
  for (const selector of TOOLTIP_SELECTORS) {
    const el = document.querySelector(selector)
    if (el instanceof HTMLElement && el.offsetParent !== null) return el
  }
  return null
}

function placeTooltipNear(anchor: HTMLElement) {
  const tooltip = findTooltip()
  if (!tooltip) return

  const rect = anchor.getBoundingClientRect()
  const tipWidth = tooltip.offsetWidth || 320
  const tipHeight = tooltip.offsetHeight || 180
  const gap = 10
  const padding = 12

  let left = rect.left + window.scrollX
  let top = rect.bottom + window.scrollY + gap

  // Keep within viewport horizontally
  const maxLeft = window.scrollX + window.innerWidth - tipWidth - padding
  left = Math.max(window.scrollX + padding, Math.min(left, maxLeft))

  // If it would go below the fold, place above the reference
  if (rect.bottom + tipHeight + gap > window.innerHeight - padding) {
    top = rect.top + window.scrollY - tipHeight - gap
  }

  tooltip.style.setProperty('position', 'absolute', 'important')
  tooltip.style.setProperty('left', `${Math.round(left)}px`, 'important')
  tooltip.style.setProperty('top', `${Math.round(top)}px`, 'important')
  tooltip.style.setProperty('right', 'auto', 'important')
  tooltip.style.setProperty('transform', 'none', 'important')
  tooltip.style.setProperty('z-index', '99999', 'important')
}

/**
 * Re-runs Logos Reftagger after SPA content changes, and repositions the
 * tooltip next to the hovered Bible reference (avoids transform/layout bugs).
 */
export function useRefTagger(deps: unknown[] = []) {
  useEffect(() => {
    let cancelled = false
    let attempts = 0
    let placeTimer: number | undefined

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

    const handlePointerOver = (event: Event) => {
      const target = event.target
      if (!(target instanceof Element)) return
      const anchor = target.closest('.rtBibleRef')
      if (!(anchor instanceof HTMLElement)) return

      window.clearTimeout(placeTimer)
      // Reftagger sets its own position first; override shortly after.
      placeTimer = window.setTimeout(() => placeTooltipNear(anchor), 30)
      placeTimer = window.setTimeout(() => placeTooltipNear(anchor), 120)
    }

    document.addEventListener('mouseover', handlePointerOver, true)
    document.addEventListener('focusin', handlePointerOver, true)

    const timer = window.setTimeout(tag, 50)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
      window.clearTimeout(placeTimer)
      document.removeEventListener('mouseover', handlePointerOver, true)
      document.removeEventListener('focusin', handlePointerOver, true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
}
