import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Eye, EyeOff, MessageSquareReply } from 'lucide-react'
import { useEffect, useState } from 'react'
import { CrossLoader, CrossSpinner } from './CrossLoader'
import { useToast } from '../contexts/ToastContext'
import {
  fetchPosterQuestions,
  markNotificationsRead,
  replyToQuestion,
  setQuestionPublicVisibility,
} from '../lib/questions'
import { supabase } from '../lib/supabase'
import type { QuestionWithReplies } from '../types/database'

type Props = {
  userId: string
  isAdmin?: boolean
}

function QuestionReplyCard({
  question,
  userId,
  isAdmin = false,
  onReplied,
}: {
  question: QuestionWithReplies
  userId: string
  isAdmin?: boolean
  onReplied: () => void
}) {
  const { success: toastSuccess, error: toastError } = useToast()
  const queryClient = useQueryClient()
  const [replyText, setReplyText] = useState('')
  const existingReply = question.replies[0]

  const replyMutation = useMutation({
    mutationFn: async () => {
      await replyToQuestion(question.id, userId, replyText)
      await markNotificationsRead(userId, question.id)
    },
    onSuccess: () => {
      toastSuccess('Reply published successfully')
      setReplyText('')
      onReplied()
      queryClient.invalidateQueries({ queryKey: ['notification-count'] })
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['answered-questions'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to publish reply')
    },
  })

  const visibilityMutation = useMutation({
    mutationFn: async (isPublic: boolean) => {
      await setQuestionPublicVisibility(question.id, isPublic)
    },
    onSuccess: (_data, isPublic) => {
      toastSuccess(
        isPublic
          ? 'This Q&A is now listed in Previously Asked Doubts on the Ask page.'
          : 'This Q&A was removed from Previously Asked Doubts.'
      )
      onReplied()
      queryClient.invalidateQueries({ queryKey: ['answered-questions'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to update visibility')
    },
  })

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="rounded-full bg-[#faf5e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#c6a14d]">
          {question.category}
        </span>
        <div className="flex flex-wrap items-center gap-2">
          {question.status === 'answered' && isAdmin && (
            <button
              type="button"
              onClick={() => visibilityMutation.mutate(!(question.is_public ?? false))}
              disabled={visibilityMutation.isPending}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${
                question.is_public
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {visibilityMutation.isPending ? (
                <CrossSpinner size="xs" />
              ) : question.is_public ? (
                <Eye size={14} />
              ) : (
                <EyeOff size={14} />
              )}
              {(question.is_public ?? false) ? 'Listed publicly' : 'List publicly'}
            </button>
          )}
          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${
              question.status === 'pending'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-emerald-50 text-emerald-700'
            }`}
          >
            {question.status === 'pending' ? 'Pending reply' : 'Answered'}
          </span>
        </div>
      </div>

      <p className="mt-4 text-sm font-semibold text-slate-700">
        From {question.asker_name}
        {question.wants_credit ? '' : ' (anonymous credit off)'}
      </p>
      <p className="mt-2 text-sm leading-7 text-slate-800">{question.body}</p>
      <time className="mt-3 block text-xs text-slate-400">
        Asked{' '}
        {new Date(question.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </time>

      {existingReply ? (
        <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Your reply
          </p>
          <p className="mt-2 text-sm leading-7 text-slate-700">{existingReply.body}</p>
          {isAdmin && question.status === 'answered' && (
            <p className="mt-3 text-xs text-slate-500">
              {question.is_public ?? false
                ? 'Listed in Previously Asked Doubts on the Ask page.'
                : 'Not listed publicly yet. Click “List publicly” to show it in Previously Asked Doubts.'}
            </p>
          )}
          {!isAdmin && question.status === 'answered' && (
            <p className="mt-3 text-xs text-slate-500">
              Replies stay private until an admin lists them in Previously Asked Doubts.
            </p>
          )}
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!replyText.trim()) return
            replyMutation.mutate()
          }}
          className="mt-5 space-y-3"
        >
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            rows={4}
            placeholder="Write your reply to this question..."
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#c6a14d]/50"
          />
          <button
            type="submit"
            disabled={replyMutation.isPending || !replyText.trim()}
            className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#182633] disabled:opacity-50"
          >
            {replyMutation.isPending ? (
              <>
                <CrossSpinner size="xs" />
                Publishing...
              </>
            ) : (
              <>
                <MessageSquareReply size={16} />
                Publish reply
              </>
            )}
          </button>
        </form>
      )}
    </article>
  )
}

export function AskedQuestionsPanel({ userId, isAdmin = false }: Props) {
  const queryClient = useQueryClient()
  const { error: toastError } = useToast()

  const { data: questions = [], isLoading, error } = useQuery({
    queryKey: ['poster-questions'],
    queryFn: fetchPosterQuestions,
  })

  useEffect(() => {
    const channel = supabase
      .channel('realtime-poster-questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['poster-questions'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
        queryClient.invalidateQueries({ queryKey: ['question-notifications', userId] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, userId])

  useEffect(() => {
    if (error) {
      toastError('Could not load asked questions')
    }
  }, [error, toastError])

  const pendingCount = questions.filter((q) => q.status === 'pending').length

  const handleReplied = () => {
    queryClient.invalidateQueries({ queryKey: ['poster-questions'] })
    queryClient.invalidateQueries({ queryKey: ['answered-questions'] })
    queryClient.invalidateQueries({ queryKey: ['question-notifications', userId] })
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center rounded-2xl border border-slate-200 bg-white">
        <CrossLoader size="md" label="Loading questions..." />
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Could not load asked questions. Run migration{' '}
        <code className="rounded bg-red-100 px-1">009_questions.sql</code>.
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Asked Questions</h2>
          <p className="mt-1 text-sm text-slate-500">
            Questions from readers are delivered here in real time via Supabase.
          </p>
        </div>
        {pendingCount > 0 && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-700">
            {pendingCount} pending
          </span>
        )}
      </div>

      {questions.length === 0 ? (
        <p className="mt-6 text-sm text-slate-500">No questions have been submitted yet.</p>
      ) : (
        <div className="mt-6 space-y-4">
          {questions.map((question) => (
            <QuestionReplyCard
              key={question.id}
              question={question}
              userId={userId}
              isAdmin={isAdmin}
              onReplied={handleReplied}
            />
          ))}
        </div>
      )}
    </div>
  )
}
