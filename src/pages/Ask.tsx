import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { CrossSpinner } from '../components/CrossLoader'
import { PreviouslyAskedQuestions } from '../components/PreviouslyAskedQuestions'
import { SiteFooter } from '../components/SiteFooter'
import { useToast } from '../contexts/ToastContext'
import { useAuth } from '../hooks/useAuth'
import { QUESTION_CATEGORIES } from '../lib/question-categories'
import { fetchAnsweredQuestions, fetchUserQuestions, submitQuestion } from '../lib/questions'
import { supabase } from '../lib/supabase'

export function Ask() {
  const { user } = useAuth()
  const { success: toastSuccess, error: toastError, info: toastInfo } = useToast()
  const queryClient = useQueryClient()

  const [askerName, setAskerName] = useState(user?.user_metadata?.display_name ?? '')
  const [category, setCategory] = useState<string>(QUESTION_CATEGORIES[0])
  const [questionBody, setQuestionBody] = useState('')
  const [wantsCredit, setWantsCredit] = useState(true)

  const { data: userQuestions = [], isLoading: userQuestionsLoading } = useQuery({
    queryKey: ['user-questions', user?.id],
    queryFn: () => fetchUserQuestions(user!.id),
    enabled: !!user?.id,
  })

  const { data: answeredQuestions = [], isLoading: answeredLoading } = useQuery({
    queryKey: ['answered-questions'],
    queryFn: fetchAnsweredQuestions,
  })

  useEffect(() => {
    const channel = supabase
      .channel('realtime-answered-questions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'questions' }, () => {
        queryClient.invalidateQueries({ queryKey: ['answered-questions'] })
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'question_replies' }, () => {
        queryClient.invalidateQueries({ queryKey: ['answered-questions'] })
        queryClient.invalidateQueries({ queryKey: ['user-questions'] })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  const submitMutation = useMutation({
    mutationFn: async () => {
      return submitQuestion({
        askerName,
        category,
        body: questionBody,
        userId: user?.id ?? null,
        wantsCredit,
      })
    },
    onSuccess: () => {
      toastSuccess('Your question was submitted successfully.')
      toastInfo(
        'Our team typically replies within 48 hours. You will get a notification when your question is answered.'
      )
      setQuestionBody('')
      queryClient.invalidateQueries({ queryKey: ['poster-questions'] })
      queryClient.invalidateQueries({ queryKey: ['question-notifications'] })
      queryClient.invalidateQueries({ queryKey: ['user-questions'] })
    },
    onError: (err: Error) => {
      toastError(err.message || 'Failed to submit your question')
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!askerName.trim() || !questionBody.trim()) {
      toastError('Please enter your name and question')
      return
    }
    submitMutation.mutate()
  }

  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#f3f1ec]">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,480px)_minmax(0,1fr)] lg:gap-10">
          <div className="max-w-[480px]">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">Ask</p>
            <h1 className="mt-3 font-serif text-5xl leading-tight text-slate-900 sm:text-6xl">
              Ask a question
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-600 sm:text-base">
              About a passage, a doctrine, or a historical detail — ask anything. Questions either
              get a direct reply or shape a future article, tagged back to you if you&apos;d like
              credit.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-8 rounded-[24px] border border-slate-200 bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)] sm:p-6"
            >
              <div>
                <label htmlFor="askerName" className="text-sm font-semibold text-slate-700">
                  Your Name
                </label>
                <input
                  id="askerName"
                  type="text"
                  value={askerName}
                  onChange={(e) => setAskerName(e.target.value)}
                  placeholder="Enter your name"
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-colors focus:border-[#c6a14d]/50"
                  required
                />
              </div>

              <div className="mt-5">
                <label htmlFor="category" className="text-sm font-semibold text-slate-700">
                  Where does this question relate to?
                </label>
                <select
                  id="category"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-[#c6a14d]/50"
                >
                  {QUESTION_CATEGORIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mt-5">
                <label htmlFor="questionBody" className="text-sm font-semibold text-slate-700">
                  Your Question
                </label>
                <textarea
                  id="questionBody"
                  value={questionBody}
                  onChange={(e) => setQuestionBody(e.target.value)}
                  rows={5}
                  placeholder="Write your question here..."
                  className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm leading-7 outline-none transition-colors focus:border-[#c6a14d]/50"
                  required
                />
              </div>

              <label className="mt-5 flex items-center gap-2.5 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={wantsCredit}
                  onChange={(e) => setWantsCredit(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#1f2f3d] focus:ring-[#c6a14d]"
                />
                Tag my name when this question is answered publicly
              </label>

              <button
                type="submit"
                disabled={submitMutation.isPending}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-[#1f2f3d] px-5 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#182633] disabled:opacity-50"
              >
                {submitMutation.isPending ? (
                  <>
                    <CrossSpinner size="xs" />
                    Submitting...
                  </>
                ) : (
                  'Continue'
                )}
              </button>
            </form>
          </div>

          <div className="lg:sticky lg:top-24 lg:self-stretch">
            <div className="h-full min-h-[320px] overflow-hidden rounded-[24px] shadow-[0_10px_30px_rgba(15,23,42,0.08)] sm:min-h-[420px] lg:min-h-[640px]">
              <img
                src="/ask/asktabimage.svg"
                alt="Open Bible with John 14:6"
                loading="lazy"
                decoding="async"
                className="h-full min-h-[320px] w-full object-cover sm:min-h-[420px] lg:min-h-[640px]"
              />
            </div>
          </div>
        </div>

        <PreviouslyAskedQuestions
          questions={answeredQuestions}
          isLoading={answeredLoading}
          userQuestions={userQuestions}
          userQuestionsLoading={userQuestionsLoading}
        />

        <SiteFooter />
      </div>
    </div>
  )
}
