import { supabase } from './supabase'

// Get or generate a persistent visitor ID
export function getVisitorId(): string {
  let visitorId = localStorage.getItem('ca_visitor_id')
  if (!visitorId) {
    visitorId = crypto.randomUUID()
    localStorage.setItem('ca_visitor_id', visitorId)
  }
  return visitorId
}

// Log a site visit or post read
export async function logView({
  action,
  postId,
  postTitle,
}: {
  action: 'visit' | 'read'
  postId?: string
  postTitle?: string
}) {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    const user = session?.user || null
    const visitorId = getVisitorId()

    await supabase.from('analytics_views').insert({
      visitor_id: visitorId,
      user_id: user?.id || null,
      email: user?.email || null,
      post_id: postId || null,
      post_title: postTitle || null,
      action,
    })
  } catch (error) {
    console.error('Error logging analytics:', error)
  }
}
