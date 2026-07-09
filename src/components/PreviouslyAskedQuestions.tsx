import { Clock, MessageCircle } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CrossLoader } from './CrossLoader'
import type { QuestionWithReplies } from '../types/database'

type Props = {
  questions: QuestionWithReplies[]
  isLoading?: boolean
  userQuestions?: QuestionWithReplies[]
  userQuestionsLoading?: boolean
}

function QuestionStatusBadge({ status }: { status: QuestionWithReplies['status'] }) {
  if (status === 'answered') {
    return (
      <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
        Answered
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-amber-700">
      <Clock size={12} />
      Awaiting reply
    </span>
  )
}

function QuestionCard({ question, showViewLink = true }: { question: QuestionWithReplies; showViewLink?: boolean }) {
  const reply = question.replies[0]

  return (
    <article className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.05)]">
      <div className="border-b border-slate-100 bg-[#faf8f4] px-6 py-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="rounded-full bg-[#faf5e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c6a14d]">
            {question.category}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <QuestionStatusBadge status={question.status} />
            <time className="text-xs text-slate-400">
              {new Date(question.created_at).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
          </div>
        </div>
        <p className="mt-3 text-sm font-semibold text-slate-700">
          {question.wants_credit ? question.asker_name : 'Anonymous reader'} asked:
        </p>
        <p className="mt-2 text-base leading-7 text-slate-800">{question.body}</p>
      </div>

      {reply ? (
        <div className="px-6 py-5">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f2f3d]">
            Reply from Christian Armour
          </p>
          <p className="mt-3 line-clamp-4 text-sm leading-7 text-slate-600">{reply.body}</p>
          <time className="mt-3 block text-xs text-slate-400">
            Answered{' '}
            {new Date(reply.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </time>
        </div>
      ) : (
        <div className="px-6 py-5">
          <p className="text-sm text-slate-500">
            Our team typically replies within 48 hours. You will be notified when an answer is ready.
          </p>
        </div>
      )}

      {showViewLink && question.status === 'answered' && reply && (
        <div className="border-t border-slate-100 px-6 py-4">
          <Link
            to={`/ask/answers/${question.id}`}
            className="text-sm font-semibold text-[#c6a14d] transition-colors hover:text-[#a8863d]"
          >
            Read full answer &rarr;
          </Link>
        </div>
      )}
    </article>
  )
}

export function PreviouslyAskedQuestions({
  questions,
  isLoading,
  userQuestions = [],
  userQuestionsLoading = false,
}: Props) {
  const pendingUserQuestions = userQuestions.filter((question) => question.status === 'pending')
  const answeredUserQuestions = userQuestions.filter((question) => question.status === 'answered')

  return (
    <section className="mt-12">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">
        Doubt clearance
      </p>
      <h2 className="mt-2 font-serif text-4xl text-slate-900">Previously Asked Doubts</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        Browse past questions and replies from the Christian Armour team.
      </p>

      {(userQuestionsLoading || userQuestions.length > 0) && (
        <div className="mt-10">
          <h3 className="font-serif text-2xl text-slate-900">Your questions</h3>
          <p className="mt-2 text-sm text-slate-500">
            Track questions you have submitted. Replies usually arrive within 48 hours.
          </p>

          {userQuestionsLoading ? (
            <div className="mt-6 flex justify-center py-10">
              <CrossLoader size="md" label="Loading your questions..." />
            </div>
          ) : (
            <div className="mt-6 space-y-5">
              {pendingUserQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} showViewLink={false} />
              ))}
              {answeredUserQuestions.map((question) => (
                <QuestionCard key={question.id} question={question} />
              ))}
            </div>
          )}
        </div>
      )}

      <div className="mt-10">
        <h3 className="font-serif text-2xl text-slate-900">Community answers</h3>
        <p className="mt-2 text-sm text-slate-500">
          Only answers an admin chooses to list appear here for everyone to learn from.
        </p>

        {isLoading ? (
          <div className="mt-6 flex justify-center py-16">
            <CrossLoader size="lg" label="Loading answered questions..." />
          </div>
        ) : questions.length === 0 ? (
          <div className="mt-6 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
            <MessageCircle className="mx-auto text-[#c6a14d]" size={32} />
            <p className="mt-4 font-serif text-3xl text-slate-800">No public answers yet</p>
            <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
              Answered doubts are private by default. An admin can list selected answers here for
              the community.
            </p>
          </div>
        ) : (
          <div className="mt-6 space-y-5">
            {questions.map((question) => (
              <QuestionCard key={question.id} question={question} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
