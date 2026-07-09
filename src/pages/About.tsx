import { Link } from 'react-router-dom'
import { SiteFooter } from '../components/SiteFooter'
import { ARTICLE_TAGS } from '../lib/tags'

const BELIEFS = [
  {
    title: 'Scripture is authoritative',
    body: 'We hold that the Bible is the inspired, trustworthy Word of God — the final authority for faith, doctrine, and Christian living.',
  },
  {
    title: 'Christ is central',
    body: 'Every article, study, and reply on this site is oriented toward Jesus Christ: his person, his work, and his lordship over all of life.',
  },
  {
    title: 'Truth deserves careful work',
    body: 'We believe good theology is not rushed. It grows from close reading, historical awareness, and honest engagement with hard questions.',
  },
  {
    title: 'The church needs equipped readers',
    body: 'Christian Armour exists to help ordinary believers read Scripture with greater clarity — and to carry that clarity into everyday faith.',
  },
] as const

const APPROACH = [
  {
    step: '01',
    title: 'Read the text closely',
    body: 'We begin with the passage itself — context, language, structure, and the author\'s intent — before drawing wider conclusions.',
  },
  {
    step: '02',
    title: 'Situate it in history',
    body: 'Biblical books were written in real times and places. We account for culture, genre, and the world behind the text.',
  },
  {
    step: '03',
    title: 'Connect it to the whole counsel of God',
    body: 'Individual passages belong to a larger biblical story. We trace themes across Scripture rather than isolating verses.',
  },
  {
    step: '04',
    title: 'Apply it faithfully',
    body: 'Sound interpretation must land somewhere. We aim for application that is biblical, pastoral, and honest about what the text actually says.',
  },
] as const

export function About() {
  return (
    <div className="relative left-1/2 w-screen -translate-x-1/2 bg-[#fcfaf7]">
      <div className="mx-auto max-w-[1240px] px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        {/* Hero */}
        <section className="overflow-hidden rounded-[32px] border border-slate-200 bg-white shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
          <div className="grid items-center gap-0 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="px-8 py-10 sm:px-12 lg:px-14 lg:py-14">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">About</p>
              <h1 className="mt-4 font-serif text-5xl leading-tight text-slate-900 sm:text-6xl">
                Christian Armour
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-slate-600">
                A place for serious Bible study in plain language — exegesis, theology, history, and
                life, written for readers who want to understand Scripture deeply and live it
                faithfully.
              </p>
              <p className="mt-4 max-w-xl text-base leading-8 text-slate-600">
                The name comes from Ephesians 6: standing firm in the truth of God&apos;s Word. We
                publish articles that equip believers to think carefully, question honestly, and hold
                fast to what Scripture teaches.
              </p>
            </div>

            <div className="relative flex min-h-[280px] items-center justify-center bg-[#faf8f4] px-8 py-12 lg:min-h-full">
              <div className="absolute inset-0 bg-[url('/home/background.svg')] bg-cover bg-center opacity-30" />
              <div className="relative flex flex-col items-center text-center">
                <img
                  src="/signin/headerlogowithcompname.svg"
                  alt="Christian Armour"
                  className="h-16 w-auto sm:h-20 lg:h-24"
                />
                <p className="mt-6 font-serif text-2xl text-[#1f2f3d]">
                  &ldquo;Stand firm then&hellip; with the belt of truth&rdquo;
                </p>
                <p className="mt-2 text-sm font-medium uppercase tracking-[0.16em] text-[#c6a14d]">
                  Ephesians 6:14
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Mission */}
        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">Our mission</p>
          <h2 className="mt-3 max-w-3xl font-serif text-4xl leading-tight text-slate-900 sm:text-5xl">
            Help believers read the Bible with clarity, courage, and care
          </h2>
          <div className="mt-8 grid gap-6 lg:grid-cols-3">
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c6a14d]">For readers</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Browse articles by topic or book, follow keyword links across related studies, and
                ask questions when a passage or doctrine needs a closer look.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c6a14d]">For students</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                Go beyond surface-level summaries. Our writers work through context, original
                meaning, and theological significance — without losing accessibility.
              </p>
            </div>
            <div className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold uppercase tracking-[0.14em] text-[#c6a14d]">For the church</p>
              <p className="mt-3 text-sm leading-7 text-slate-600">
                We want Christian Armour to serve pastors, small groups, and families who need
                trustworthy resources rooted in Scripture and attentive to history.
              </p>
            </div>
          </div>
        </section>

        {/* Four pillars */}
        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">What we cover</p>
          <h2 className="mt-3 font-serif text-4xl text-slate-900">Four ways we study Scripture</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Every article on Christian Armour is tagged into one of four categories — so you can
            browse by the kind of study you need.
          </p>

          <div className="mt-8 grid gap-5 sm:grid-cols-2">
            {ARTICLE_TAGS.map((tag) => (
              <Link
                key={tag.slug}
                to={`/articles?tag=${tag.slug}`}
                className="group flex items-start gap-5 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)] transition-all hover:border-[#c6a14d]/40 hover:shadow-[0_10px_28px_rgba(198,161,77,0.12)]"
              >
                <img src={tag.icon} alt="" className="h-14 w-14 shrink-0" aria-hidden />
                <div>
                  <h3 className="font-serif text-2xl text-slate-900 group-hover:text-[#1f2f3d]">
                    {tag.title}
                  </h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{tag.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-[#c6a14d]">
                    Browse {tag.title.toLowerCase()} articles
                    <img
                      src="/home/noverticalhorizontalarrowiconyellow.svg"
                      alt=""
                      className="h-4 w-4"
                    />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Beliefs */}
        <section id="beliefs" className="mt-14 rounded-[32px] bg-[#1f2f3d] px-8 py-12 text-white sm:px-12 lg:px-16 lg:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">What we believe</p>
          <h2 className="mt-3 max-w-2xl font-serif text-4xl leading-tight sm:text-5xl">
            Convictions that shape every article we publish
          </h2>

          <div className="mt-10 grid gap-6 sm:grid-cols-2">
            {BELIEFS.map((belief) => (
              <div
                key={belief.title}
                className="rounded-[20px] border border-white/10 bg-white/5 p-6 backdrop-blur-sm"
              >
                <h3 className="font-serif text-2xl text-white">{belief.title}</h3>
                <p className="mt-3 text-sm leading-7 text-white/70">{belief.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Approach */}
        <section className="mt-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#c6a14d]">How we write</p>
          <h2 className="mt-3 font-serif text-4xl text-slate-900">Our approach to Bible study</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Whether the topic is a single verse, a doctrine, or a moment in church history, we follow
            the same disciplined process.
          </p>

          <div className="mt-8 space-y-4">
            {APPROACH.map((item) => (
              <div
                key={item.step}
                className="flex flex-col gap-4 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.05)] sm:flex-row sm:items-start sm:gap-8"
              >
                <span className="font-serif text-4xl text-[#c6a14d]/60">{item.step}</span>
                <div>
                  <h3 className="font-serif text-2xl text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-slate-600">{item.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-14 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="grid items-center gap-8 px-8 py-10 sm:px-12 lg:grid-cols-[1fr_auto] lg:py-12">
            <div>
              <h2 className="font-serif text-4xl text-slate-900">Have a question we haven&apos;t answered?</h2>
              <p className="mt-4 max-w-xl text-sm leading-7 text-slate-600">
                Submit a theological question about a passage, doctrine, or historical detail. Our
                team reviews every submission — and your question may shape a future article.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/ask"
                className="inline-flex items-center gap-2 rounded-xl bg-[#1f2f3d] px-6 py-3.5 text-sm font-semibold text-white transition-colors hover:bg-[#182633]"
              >
                Ask a question
                <img src="/home/Arrow.svg" alt="" className="h-4 w-4" />
              </Link>
              <Link
                to="/articles"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-6 py-3.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Browse articles
              </Link>
            </div>
          </div>
        </section>

        <SiteFooter />
      </div>
    </div>
  )
}
