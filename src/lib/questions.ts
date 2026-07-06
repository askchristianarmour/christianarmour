import { supabase } from './supabase'
import type { Question, QuestionReply, QuestionWithReplies } from '../types/database'

export async function submitQuestion(payload: {
  askerName: string
  category: string
  body: string
  userId?: string | null
  wantsCredit?: boolean
}) {
  const { data, error } = await supabase
    .from('questions')
    .insert({
      asker_name: payload.askerName.trim(),
      category: payload.category,
      body: payload.body.trim(),
      user_id: payload.userId ?? null,
      wants_credit: payload.wantsCredit ?? false,
    })
    .select('*')
    .single()

  if (error) throw error
  return data as Question
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

export async function fetchAnsweredQuestions(): Promise<QuestionWithReplies[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('status', 'answered')
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
