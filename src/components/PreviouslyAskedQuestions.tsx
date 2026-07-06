import { MessageCircle } from 'lucide-react'
import { CrossLoader } from './CrossLoader'
import type { QuestionWithReplies } from '../types/database'

type Props = {
  questions: QuestionWithReplies[]
  isLoading?: boolean
}

export function PreviouslyAskedQuestions({ questions, isLoading }: Props) {
  if (isLoading) {
    return (
      <div className="mt-12 flex justify-center py-16">
        <CrossLoader size="lg" label="Loading answered questions..." />
      </div>
    )
  }

  if (questions.length === 0) {
    return (
      <div className="mt-12 rounded-[28px] border border-dashed border-slate-200 bg-white px-6 py-14 text-center">
        <MessageCircle className="mx-auto text-[#c6a14d]" size={32} />
        <p className="mt-4 font-serif text-3xl text-slate-800">No answered questions yet</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
          Once questions are answered, they will appear here for everyone to read.
        </p>
      </div>
    )
  }

  return (
    <section className="mt-12">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">
        Doubt clearance
      </p>
      <h2 className="mt-2 font-serif text-4xl text-slate-900">Previously Asked Questions</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
        Browse past questions and replies from the Christian Armour team.
      </p>

      <div className="mt-8 space-y-5">
        {questions.map((question) => {
          const reply = question.replies[0]

          return (
            <article
              key={question.id}
              className="overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-[0_6px_20px_rgba(15,23,42,0.05)]"
            >
              <div className="border-b border-slate-100 bg-[#faf8f4] px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="rounded-full bg-[#faf5e8] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#c6a14d]">
                    {question.category}
                  </span>
                  <time className="text-xs text-slate-400">
                    {new Date(question.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-700">
                  {question.wants_credit ? question.asker_name : 'Anonymous reader'} asked:
                </p>
                <p className="mt-2 text-base leading-7 text-slate-800">{question.body}</p>
              </div>

              {reply && (
                <div className="px-6 py-5">
                  <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#1f2f3d]">
                    Reply from Christian Armour
                  </p>
                  <p className="mt-3 text-sm leading-7 text-slate-600">{reply.body}</p>
                  <time className="mt-3 block text-xs text-slate-400">
                    Answered{' '}
                    {new Date(reply.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
