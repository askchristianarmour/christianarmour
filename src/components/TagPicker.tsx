import { ARTICLE_TAGS, type ArticleTagSlug } from '../lib/tags'

type Props = {
  value: ArticleTagSlug | null
  onChange: (tag: ArticleTagSlug | null) => void
}

export function TagPicker({ value, onChange }: Props) {
  return (
    <div>
      <p className="text-sm font-semibold text-slate-700">Article tag (optional)</p>
      <p className="mt-1 text-xs text-slate-500">
        Choose a category to list this article under Exegesis, Theology, History, or Life. Leave
        unselected to publish without a tag.
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        {ARTICLE_TAGS.map((tag) => {
          const selected = value === tag.slug

          return (
            <button
              key={tag.slug}
              type="button"
              onClick={() => onChange(selected ? null : tag.slug)}
              className={`rounded-2xl border p-4 text-left transition-all ${
                selected
                  ? 'border-[#c6a14d] bg-[#faf5e8] shadow-[0_6px_18px_rgba(198,161,77,0.15)]'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-sm'
              }`}
            >
              <div className="flex items-start gap-3">
                <img src={tag.icon} alt="" className="h-10 w-10 shrink-0" />
                <div>
                  <p className="font-serif text-xl text-slate-900">{tag.title}</p>
                  <p className="mt-1 text-xs leading-5 text-slate-500">{tag.description}</p>
                </div>
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
