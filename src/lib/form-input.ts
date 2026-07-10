import type { ChangeEvent, ChangeEventHandler } from 'react'

/** Strip leading whitespace from the input as the user types. */
export function withTrimStart(
  onChange: ChangeEventHandler<HTMLInputElement>
): ChangeEventHandler<HTMLInputElement> {
  return (event: ChangeEvent<HTMLInputElement>) => {
    const trimmed = event.target.value.trimStart()
    if (trimmed !== event.target.value) {
      event.target.value = trimmed
    }
    onChange(event)
  }
}
