import { writeFileSync, mkdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const distDir = join(__dirname, '..', 'dist')

const siteUrl = (process.env.VITE_SITE_URL || 'https://christianarmour.vercel.app').replace(/\/$/, '')

const publicRoutes = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.8' },
  { path: '/articles', changefreq: 'daily', priority: '0.9' },
  { path: '/articles?tag=exegesis', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles?tag=theology', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles?tag=history', changefreq: 'weekly', priority: '0.8' },
  { path: '/articles?tag=life', changefreq: 'weekly', priority: '0.8' },
  { path: '/ask', changefreq: 'weekly', priority: '0.7' },
]

const lastmod = new Date().toISOString().slice(0, 10)

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${publicRoutes
  .map(
    (route) => `  <url>
    <loc>${siteUrl}${route.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join('\n')}
</urlset>
`

const robots = `User-agent: *
Allow: /

Disallow: /signin
Disallow: /signup
Disallow: /forgot-password
Disallow: /reset-password
Disallow: /profile
Disallow: /activity
Disallow: /analytics
Disallow: /add-post

Sitemap: ${siteUrl}/sitemap.xml
`

mkdirSync(distDir, { recursive: true })
writeFileSync(join(distDir, 'sitemap.xml'), sitemap, 'utf8')
writeFileSync(join(distDir, 'robots.txt'), robots, 'utf8')

console.log(`SEO files generated for ${siteUrl}`)
