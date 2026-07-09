type RefTaggerApi = {
  settings?: {
    bibleVersion?: string
    tagChapters?: boolean
    [key: string]: unknown
  }
  tag?: () => void
}

declare global {
  interface Window {
    refTagger?: RefTaggerApi
  }
}

export {}
