import { useEffect } from 'react'
import {
  DEFAULT_DESCRIPTION,
  DEFAULT_KEYWORDS,
  DEFAULT_OG_IMAGE,
  DEFAULT_TITLE,
  SITE_NAME,
  absoluteUrl,
} from '../lib/seo'

type SeoProps = {
  title?: string
  description?: string
  canonicalPath?: string
  image?: string
  type?: 'website' | 'article'
  noIndex?: boolean
  jsonLd?: Record<string, unknown> | Record<string, unknown>[]
}

function upsertMeta(attribute: 'name' | 'property', key: string, content: string) {
  const selector = `meta[${attribute}="${key}"]`
  let element = document.querySelector(selector) as HTMLMetaElement | null

  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }

  element.content = content
}

function upsertLink(rel: string, href: string) {
  const selector = `link[rel="${rel}"]`
  let element = document.querySelector(selector) as HTMLLinkElement | null

  if (!element) {
    element = document.createElement('link')
    element.rel = rel
    document.head.appendChild(element)
  }

  element.href = href
}

function upsertJsonLd(id: string, data: Record<string, unknown> | Record<string, unknown>[]) {
  const selector = `script[data-seo-jsonld="${id}"]`
  let element = document.querySelector(selector) as HTMLScriptElement | null

  if (!element) {
    element = document.createElement('script')
    element.type = 'application/ld+json'
    element.setAttribute('data-seo-jsonld', id)
    document.head.appendChild(element)
  }

  element.textContent = JSON.stringify(data)
}

export function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  canonicalPath = '/',
  image = DEFAULT_OG_IMAGE,
  type = 'website',
  noIndex = false,
  jsonLd,
}: SeoProps) {
  useEffect(() => {
    const canonicalUrl = absoluteUrl(canonicalPath)
    const robotsContent = noIndex ? 'noindex, nofollow' : 'index, follow'

    document.title = title

    upsertMeta('name', 'description', description)
    upsertMeta('name', 'keywords', DEFAULT_KEYWORDS)
    upsertMeta('name', 'robots', robotsContent)
    upsertMeta('name', 'author', SITE_NAME)

    upsertMeta('property', 'og:site_name', SITE_NAME)
    upsertMeta('property', 'og:title', title)
    upsertMeta('property', 'og:description', description)
    upsertMeta('property', 'og:type', type)
    upsertMeta('property', 'og:url', canonicalUrl)
    upsertMeta('property', 'og:image', image)
    upsertMeta('property', 'og:locale', 'en_US')

    upsertMeta('name', 'twitter:card', 'summary_large_image')
    upsertMeta('name', 'twitter:title', title)
    upsertMeta('name', 'twitter:description', description)
    upsertMeta('name', 'twitter:image', image)

    upsertLink('canonical', canonicalUrl)

    if (jsonLd) {
      upsertJsonLd('page', jsonLd)
    }
  }, [title, description, canonicalPath, image, type, noIndex, jsonLd])

  return null
}
