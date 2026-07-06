import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Seo } from './Seo'
import { DEFAULT_TITLE, ROUTE_SEO, SITE_URL, resolveCanonicalPath } from '../lib/seo'

export function AppSeo() {
  const { pathname, search } = useLocation()

  const canonicalPath = resolveCanonicalPath(pathname, search)
  const routeSeo = ROUTE_SEO[pathname] ?? ROUTE_SEO['/']

  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'Organization',
          '@id': `${SITE_URL}/#organization`,
          name: 'Christian Armour',
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.svg`,
          description:
            'Serious Bible study in plain language — exegesis, theology, church history, and Christian living.',
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: 'Christian Armour',
          publisher: { '@id': `${SITE_URL}/#organization` },
          potentialAction: {
            '@type': 'SearchAction',
            target: {
              '@type': 'EntryPoint',
              urlTemplate: `${SITE_URL}/articles?search={search_term_string}`,
            },
            'query-input': 'required name=search_term_string',
          },
        },
        ...(pathname === '/'
          ? [
              {
                '@type': 'WebPage',
                '@id': `${SITE_URL}/#webpage`,
                url: SITE_URL,
                name: DEFAULT_TITLE,
                isPartOf: { '@id': `${SITE_URL}/#website` },
              },
            ]
          : []),
      ],
    }),
    [pathname]
  )

  if (/^\/articles\/[^/]+$/.test(pathname)) {
    return null
  }

  return (
    <Seo
      title={routeSeo.title}
      description={routeSeo.description}
      canonicalPath={canonicalPath}
      noIndex={routeSeo.noIndex}
      jsonLd={jsonLd}
    />
  )
}
