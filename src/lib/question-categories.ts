export const QUESTION_CATEGORIES = [
  'Exegesis — Old Testament',
  'Exegesis — New Testament',
  'Theology',
  'History',
  'Apologetics',
  'General',
] as const

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]
