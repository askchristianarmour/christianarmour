const GUEST_ID_KEY = 'christian-armour-guest-id'
const GUEST_LIKES_KEY = 'christian-armour-guest-likes'

type GuestLikesPayload = {
  guestId: string
  postIds: string[]
}

function canUseStorage() {
  return typeof window !== 'undefined'
}

function readPayload(): GuestLikesPayload {
  if (!canUseStorage()) {
    return {
      guestId: 'server',
      postIds: [],
    }
  }

  const existingGuestId = window.localStorage.getItem(GUEST_ID_KEY)
  const guestId = existingGuestId ?? crypto.randomUUID()

  if (!existingGuestId) {
    window.localStorage.setItem(GUEST_ID_KEY, guestId)
  }

  const raw = window.localStorage.getItem(GUEST_LIKES_KEY)
  if (!raw) {
    return { guestId, postIds: [] }
  }

  try {
    const parsed = JSON.parse(raw) as Partial<GuestLikesPayload>
    return {
      guestId,
      postIds: Array.isArray(parsed.postIds) ? parsed.postIds : [],
    }
  } catch {
    return { guestId, postIds: [] }
  }
}

function writePayload(payload: GuestLikesPayload) {
  if (!canUseStorage()) return
  window.localStorage.setItem(GUEST_LIKES_KEY, JSON.stringify(payload))
}

export function ensureGuestLikeIdentity() {
  return readPayload().guestId
}

export function hasGuestLiked(postId: string) {
  return readPayload().postIds.includes(postId)
}

export function toggleGuestLike(postId: string) {
  const payload = readPayload()
  const nextPostIds = payload.postIds.includes(postId)
    ? payload.postIds.filter((id) => id !== postId)
    : [...payload.postIds, postId]

  writePayload({
    guestId: payload.guestId,
    postIds: nextPostIds,
  })

  return nextPostIds.includes(postId)
}
