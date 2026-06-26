export type Post = {
  id: string
  title: string
  content: string
  created_at: string
}

export type Comment = {
  id: string
  post_id: string
  user_id: string
  body: string
  created_at: string
}

export type Like = {
  id: string
  post_id: string
  user_id: string
}

export type LockStatus = {
  locked: boolean
  remaining?: number
  locked_until?: string
  message?: string
}
