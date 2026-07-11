export type Post = {
  id: string
  title: string
  content: string
  created_at: string
  image_url?: string | null
  comments_enabled: boolean
  tag?: string | null
  /** Normalized search terms mapped on create/edit */
  keywords?: string[] | null
  author_id?: string | null
  status?: 'pending' | 'approved' | 'rejected' | null
  reviewed_at?: string | null
  rejection_reason?: string | null
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

export type UserBan = {
  email: string
  reason: string | null
  banned_by: string | null
  banned_at: string
  active: boolean
}

export type Question = {
  id: string
  asker_name: string
  category: string
  body: string
  user_id?: string | null
  wants_credit: boolean
  status: 'pending' | 'answered'
  is_public?: boolean
  created_at: string
}

export type QuestionReply = {
  id: string
  question_id: string
  author_id: string
  body: string
  created_at: string
}

export type QuestionWithReplies = Question & {
  replies: QuestionReply[]
}

export type AppNotification = {
  id: string
  user_id: string
  type: string
  title: string
  body: string
  question_id?: string | null
  read_at?: string | null
  created_at: string
}
