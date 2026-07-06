import { useQuery } from '@tanstack/react-query'
import { useEffect } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { PageLoader } from '../components/CrossLoader'
import { SiteFooter } from '../components/SiteFooter'
import { useAuth } from '../hooks/useAuth'
import { fetchQuestionById, markNotificationsRead } from '../lib/questions'

export function QuestionAnswerDetail() {
  const { questionId = '' } = useParams()
  const { user } = useAuth()

  const { data: question, isLoading, error } = useQuery({
    queryKey: ['question-answer', questionId],
    queryFn: () => fetchQuestionById(questionId),
    enabled: !!questionId,
  })

  useEffect(() => {
    if (!user?.id || !questionId) return

    markNotificationsRead(user.id, questionId).catch(() => {
      // Non-blocking if notifications table is unavailable
    })
  }, [user?.id, questionId])

  if (isLoading) {
    return (
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f3f1ec]">
        <div className="mx-auto max-w-[900px] px-4 py-12 sm:px-6 lg:px-8">
          <PageLoader label="Loading answer..." />
        </div>
      </div>
    )
  }

  if (error || !question) {
    return (
      <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f3f1ec]">
        <div className="mx-auto max-w-[900px] px-4 py-12 text-center sm:px-6 lg:px-8">
          <p className="text-slate-600">This answer could not be found.</p>
          <Link to="/ask" className="mt-4 inline-block text-sm font-medium text-[#1c2b3a] underline">
            Back to Ask
          </Link>
        </div>
      </div>
    )
  }

  const reply = question.replies[0]

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f3f1ec]">
      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Link
          to="/ask"
          className="inline-flex items-center gap-1 text-sm font-medium text-slate-500 transition-colors hover:text-slate-900"
        >
          <ChevronLeft size={16} />
          Back to Ask
        </Link>

        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">
          Your answer
        </p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-slate-900 sm:text-5xl">
          Question reply
        </h1>

        <article className="mt-8 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
          <div className="border-b border-slate-100 bg-[#faf8f4] px-6 py-6 sm:px-8">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="rounded-full bg-[#faf5e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c6a14d]">
                {question.category}
              </span>
              <time className="text-xs text-slate-400">
                Asked{' '}
                {new Date(question.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {question.wants_credit ? question.asker_name : 'You'} asked:
            </p>
            <p className="mt-2 text-base leading-7 text-slate-800">{question.body}</p>
          </div>

          {reply ? (
            <div className="px-6 py-6 sm:px-8">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f2f3d]">
                Reply from Christian Armour
              </p>
              <p className="mt-4 text-sm leading-7 text-slate-600">{reply.body}</p>
              <time className="mt-4 block text-xs text-slate-400">
                Answered{' '}
                {new Date(reply.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </time>
            </div>
          ) : (
            <div className="px-6 py-10 text-center text-sm text-slate-500 sm:px-8">
              A reply has not been published yet.
            </div>
          )}
        </article>

        <SiteFooter />
      </div>
    </div>
  )
}
