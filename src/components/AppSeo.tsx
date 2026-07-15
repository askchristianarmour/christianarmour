import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { Seo } from './Seo'
import { BRAND_NAME_VARIATIONS } from '../lib/keywords'
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
          alternateName: [...BRAND_NAME_VARIATIONS].filter(
            (name) => name.toLowerCase() !== 'christian armour'
          ),
          url: SITE_URL,
          logo: `${SITE_URL}/favicon.svg`,
          description:
            'Serious Bible study in plain language — exegesis, theology, church history, and apologetics.',
        },
        {
          '@type': 'WebSite',
          '@id': `${SITE_URL}/#website`,
          url: SITE_URL,
          name: 'Christian Armour',
          alternateName: ['Christian Armor', 'christianarmour', 'christianarmour.com'],
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
