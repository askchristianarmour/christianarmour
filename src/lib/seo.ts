export const SITE_NAME = 'Christian Armour'

export const SITE_URL = (
  import.meta.env.VITE_SITE_URL as string | undefined
)?.replace(/\/$/, '') || 'https://christianarmour.vercel.app'

export const DEFAULT_TITLE = 'Christian Armour | Bible Study, Theology & Exegesis'

export const DEFAULT_DESCRIPTION =
  'Christian Armour publishes serious Bible study in plain language — exegesis, theology, church history, and Christian living. Read articles, explore Scripture, and ask theological questions.'

export const DEFAULT_KEYWORDS =
  'Christian Armour, Bible study, exegesis, theology, church history, Scripture, Christian living, biblical articles, theological questions'

export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.svg`

export const PUBLIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/articles', changefreq: 'daily', priority: '0.9' },
  { path: '/articles?tag=exegesis', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles?tag=theology', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles?tag=history', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles?tag=life', changefreq: 'weekly', priority: '0.8' },
  { path: '/ask', changefreq: 'weekly', priority: '0.7' },
] as const

export type RouteSeo = {
  title: string
  description: string
  noIndex?: boolean
}

export const ROUTE_SEO: Record<string, RouteSeo> = {
  '/': {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  '/about': {
    title: 'About Christian Armour | Our Mission & Beliefs',
    description:
      'Learn about Christian Armour — our mission to help believers read Scripture with clarity, our approach to Bible study, and the convictions behind every article we publish.',
  },
  '/articles': {
    title: 'Articles | Christian Armour',
    description:
      'Browse biblically faithful articles on exegesis, theology, church history, and Christian life. Filter by topic, keyword, or reading time.',
  },
  '/ask': {
    title: 'Ask a Question | Christian Armour',
    description:
      'Submit a theological question about a passage, doctrine, or historical detail. Browse previously answered questions from the Christian Armour team.',
  },
  '/signin': {
    title: 'Sign In | Christian Armour',
    description: 'Sign in to your Christian Armour account.',
    noIndex: true,
  },
  '/signup': {
    title: 'Sign Up | Christian Armour',
    description: 'Create a Christian Armour account.',
    noIndex: true,
  },
  '/forgot-password': {
    title: 'Forgot Password | Christian Armour',
    description: 'Reset your Christian Armour account password.',
    noIndex: true,
  },
  '/reset-password': {
    title: 'Reset Password | Christian Armour',
    description: 'Set a new password for your Christian Armour account.',
    noIndex: true,
  },
  '/profile': {
    title: 'Profile | Christian Armour',
    description: 'Manage your Christian Armour profile and settings.',
    noIndex: true,
  },
  '/activity': {
    title: 'Activity | Christian Armour',
    description: 'Your activity history on Christian Armour.',
    noIndex: true,
  },
  '/analytics': {
    title: 'Analytics | Christian Armour',
    description: 'Christian Armour site analytics.',
    noIndex: true,
  },
  '/add-post': {
    title: 'Write Article | Christian Armour',
    description: 'Publish a new article on Christian Armour.',
    noIndex: true,
  },
}

export function resolveCanonicalPath(pathname: string, search: string) {
  if (pathname === '/articles' && search) {
    const params = new URLSearchParams(search)
    const tag = params.get('tag')
    const querySearch = params.get('search')
    if (tag) return `/articles?tag=${tag}`
    if (querySearch) return `/articles?search=${encodeURIComponent(querySearch)}`
  }
  return pathname
}

export function absoluteUrl(path: string) {
  if (path.startsWith('http')) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}
