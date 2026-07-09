import { supabase } from './supabase'
import type { AppNotification, Question, QuestionReply, QuestionWithReplies } from '../types/database'

export async function submitQuestion(payload: {
  askerName: string
  category: string
  body: string
  userId?: string | null
  wantsCredit?: boolean
}) {
  const { error } = await supabase.from('questions').insert({
    asker_name: payload.askerName.trim(),
    category: payload.category,
    body: payload.body.trim(),
    user_id: payload.userId ?? null,
    wants_credit: payload.wantsCredit ?? false,
    is_public: false,
  })

  if (error) throw error
}

async function attachReplies(questions: Question[]): Promise<QuestionWithReplies[]> {
  if (questions.length === 0) return []

  const questionIds = questions.map((q) => q.id)
  const { data: replies, error } = await supabase
    .from('question_replies')
    .select('*')
    .in('question_id', questionIds)
    .order('created_at', { ascending: true })

  if (error) throw error

  return questions.map((question) => ({
    ...question,
    replies: (replies ?? []).filter((reply) => reply.question_id === question.id) as QuestionReply[],
  }))
}

export async function fetchUserQuestions(userId: string): Promise<QuestionWithReplies[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachReplies((data ?? []) as Question[])
}

export async function fetchAnsweredQuestions(): Promise<QuestionWithReplies[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'answered')
    .eq('is_public', true)
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachReplies((data ?? []) as Question[])
}

export async function fetchPosterQuestions(): Promise<QuestionWithReplies[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return attachReplies((data ?? []) as Question[])
}

export async function setQuestionPublicVisibility(questionId: string, isPublic: boolean) {
  const { error } = await supabase.rpc('set_question_public_visibility', {
    p_question_id: questionId,
    p_is_public: isPublic,
  })

  if (error) throw error
}

export async function replyToQuestion(questionId: string, authorId: string, body: string) {
  const { data, error } = await supabase
    .from('question_replies')
    .insert({
      question_id: questionId,
      author_id: authorId,
      body: body.trim(),
    })
    .select('*')
    .single()

  if (error) throw error
  return data as QuestionReply
}

export async function fetchQuestionById(questionId: string): Promise<QuestionWithReplies | null> {
  const { data, error } = await supabase.from('questions').select('*').eq('id', questionId).single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  const [question] = await attachReplies([data as Question])
  return question ?? null
}

export async function fetchUserNotifications(userId: string, limit = 30) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return (data ?? []) as AppNotification[]
}

export function getNotificationHref(notification: AppNotification, canPost = false) {
  if (notification.type === 'question_answered' && notification.question_id) {
    return `/ask/answers/${notification.question_id}`
  }

  if (notification.type === 'new_question') {
    return canPost ? '/profile?tab=asked-questions' : '/ask'
  }

  return '/ask'
}

export async function markNotificationRead(notificationId: string, userId: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('user_id', userId)

  if (error) throw error
}

export async function fetchUnreadNotificationCount(userId: string) {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('read_at', null)

  if (error) throw error
  return count ?? 0
}

export async function markNotificationsRead(userId: string, questionId?: string) {
  let query = supabase
    .from('notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('user_id', userId)
    .is('read_at', null)

  if (questionId) {
    query = query.eq('question_id', questionId)
  }

  const { error } = await query
  if (error) throw error
}
