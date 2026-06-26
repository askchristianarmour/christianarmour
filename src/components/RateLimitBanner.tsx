type Props = {
  message: string | null
  retryAfterSeconds: number
}

export function RateLimitBanner({ message, retryAfterSeconds }: Props) {
  if (!message) return null

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
      {message}
      {retryAfterSeconds > 0 && (
        <span className="mt-1 block font-medium">Try again in {retryAfterSeconds}s</span>
      )}
    </div>
  )
}
