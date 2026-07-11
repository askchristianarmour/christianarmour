export const ARTICLE_TAGS = [
  {
    slug: 'exegesis',
    title: 'Exegesis',
    description: 'Verse-by-verse studies and interpretation of Scripture.',
    icon: '/home/exegesisicon.svg',
  },
  {
    slug: 'theology',
    title: 'Theology',
    description: 'Biblical doctrines and systematic theological studies.',
    icon: '/home/Theologyicon.svg',
  },
  {
    slug: 'history',
    title: 'History',
    description: 'Church history and historical events from biblical times.',
    icon: '/home/historyicon.svg',
  },
  {
    slug: 'life',
    title: 'Apologetics',
    description: 'Defending christianity through scripture, reason and history.',
    icon: '/home/Lifeicon.svg',
  },
] as const

export type ArticleTagSlug = (typeof ARTICLE_TAGS)[number]['slug']

export function getTagBySlug(slug: string | null | undefined) {
  if (!slug) return undefined
  return ARTICLE_TAGS.find((tag) => tag.slug === slug)
}

export function isArticleTagSlug(slug: string): slug is ArticleTagSlug {
  return ARTICLE_TAGS.some((tag) => tag.slug === slug)
}
