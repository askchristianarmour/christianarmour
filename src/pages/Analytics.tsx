import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'
import { useQuery } from '@tanstack/react-query'
import { PageLoader } from '../components/CrossLoader'
import { useToast } from '../contexts/ToastContext'
import { BarChart3, Users, BookOpen, Clock, ShieldAlert, ArrowLeft, ArrowUpRight, Search } from 'lucide-react'

interface AnalyticsView {
  id: string
  visitor_id: string
  user_id: string | null
  email: string | null
  post_id: string | null
  post_title: string | null
  action: 'visit' | 'read'
  created_at: string
}

export function Analytics() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const { error: toastError } = useToast()
  const [searchTerm, setSearchTerm] = useState('')

  // 1. Fetch current user permissions to check for Admin status
  const { data: userPermission, isLoading: permLoading } = useQuery({
    queryKey: ['user-permissions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      if (!user?.id) return null
      const { data, error } = await supabase
        .from('user_permissions')
        .select('*')
        .eq('email', user.email)
        .single()

      if (error) {
        return {
          email: user.email,
          can_post: user.email === 'ask@christianarmour.com',
          is_admin: user.email === 'ask@christianarmour.com',
        }
      }
      return data
    },
  })

  const isAdmin = user?.email === 'ask@christianarmour.com' || !!userPermission?.is_admin

  // 2. Fetch all analytics views
  const { data: views = [], error } = useQuery<AnalyticsView[]>({
    queryKey: ['analytics-views'],
    enabled: !!user?.id && isAdmin,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_views')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
  })

  // Redirect non-admins or load state
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/signin')
    }
  }, [user, authLoading, navigate])

  useEffect(() => {
    if (error) {
      toastError('Failed to load analytics data')
    }
  }, [error, toastError])

  if (authLoading || permLoading) {
    return <PageLoader label="Loading analytics..." minHeightClassName="min-h-[40vh]" />
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-red-200 bg-red-50 p-8 text-center shadow-sm">
        <ShieldAlert size={48} className="mx-auto text-red-600 mb-4 animate-bounce" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="mt-2 text-slate-600 text-sm">
          You do not have the required administrator privileges to view this page.
        </p>
        <button
          onClick={() => navigate('/')}
          className="mt-6 inline-flex items-center gap-1.5 justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <ArrowLeft size={16} />
          Back to Home
        </button>
      </div>
    )
  }

  // --- ANALYTICS CALCULATIONS ---
  const totalViews = views.length
  const visitsCount = views.filter((v) => v.action === 'visit').length
  const readsCount = views.filter((v) => v.action === 'read').length

  // Unique Visitors (based on visitor_id)
  const uniqueVisitors = new Set(views.map((v) => v.visitor_id)).size

  // Group views by visitor_id to make Visitor Profiles
  interface VisitorProfile {
    visitorId: string
    email: string | null
    totalVisits: number
    totalReads: number
    lastActive: string
    activities: { action: string; postTitle: string | null; time: string }[]
  }

  const profilesMap: Record<string, VisitorProfile> = {}
  views.forEach((v) => {
    if (!profilesMap[v.visitor_id]) {
      profilesMap[v.visitor_id] = {
        visitorId: v.visitor_id,
        email: v.email,
        totalVisits: 0,
        totalReads: 0,
        lastActive: v.created_at,
        activities: [],
      }
    }

    const p = profilesMap[v.visitor_id]
    // If we find an email for a visitor, update it (sometimes they start anon then log in)
    if (v.email && !p.email) {
      p.email = v.email
    }

    if (v.action === 'visit') p.totalVisits++
    if (v.action === 'read') p.totalReads++

    // Activities list
    p.activities.push({
      action: v.action,
      postTitle: v.post_title,
      time: v.created_at,
    })

    // Update last active if this view is newer
    if (new Date(v.created_at) > new Date(p.lastActive)) {
      p.lastActive = v.created_at
    }
  })

  const visitorProfiles = Object.values(profilesMap).sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  )

  // Filter profiles based on search term
  const filteredProfiles = visitorProfiles.filter(
    (p) =>
      p.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.visitorId.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Popular posts stats
  const postStats: Record<string, { title: string; count: number }> = {}
  views.forEach((v) => {
    if (v.action === 'read' && v.post_id && v.post_title) {
      if (!postStats[v.post_id]) {
        postStats[v.post_id] = { title: v.post_title, count: 0 }
      }
      postStats[v.post_id].count++
    }
  })
  const popularPosts = Object.values(postStats).sort((a, b) => b.count - a.count).slice(0, 5)

  // Daily Stats for the Graph (last 7 days)
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(d.getDate() - i)
    return d.toISOString().split('T')[0]
  }).reverse()

  const dailyStats = last7Days.map((dateStr) => {
    const dayViews = views.filter((v) => v.created_at.split('T')[0] === dateStr)
    return {
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      visits: dayViews.filter((v) => v.action === 'visit').length,
      reads: dayViews.filter((v) => v.action === 'read').length,
    }
  })

  // Find max value in dailyStats for graph scaling
  const maxVal = Math.max(...dailyStats.map((d) => Math.max(d.visits, d.reads)), 10)

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <BarChart3 className="text-amber-600" size={32} />
            Analytics Dashboard
          </h1>
          <p className="mt-1.5 text-slate-500 text-sm">
            Monitor real-time engagement, track user reads, and analyze visitor demographics.
          </p>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          Failed to fetch analytics: {error.message}
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 shrink-0">
            <BarChart3 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Views</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{totalViews}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shrink-0">
            <Users size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Unique Visitors</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{uniqueVisitors}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 shrink-0">
            <BookOpen size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Posts Read</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{readsCount}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 shrink-0">
            <Clock size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Site Visits</p>
            <p className="mt-1 text-2xl font-bold text-slate-800">{visitsCount}</p>
          </div>
        </div>
      </div>

      {/* Analytics Graph & Popular Posts */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* SVG Graph (2 cols) */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs md:col-span-2">
          <h3 className="font-bold text-slate-900 flex items-center gap-1.5">
            Engagement Trend (Last 7 Days)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">Visual representation of daily visits vs. article reads.</p>
          
          <div className="mt-6 h-60 w-full relative">
            <svg className="w-full h-full" viewBox="0 0 500 200" preserveAspectRatio="none">
              <defs>
                <linearGradient id="visitsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0"/>
                </linearGradient>
                <linearGradient id="readsGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.2"/>
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0.0"/>
                </linearGradient>
              </defs>

              {/* Gridlines */}
              <line x1="0" y1="50" x2="500" y2="50" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="100" x2="500" y2="100" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="0" y1="150" x2="500" y2="150" stroke="#f1f5f9" strokeWidth="1" />

              {/* Area Chart: Visits */}
              <path
                d={`M 0 180 ${dailyStats
                  .map((d, i) => `L ${(i * 500) / 6} ${180 - (d.visits / maxVal) * 150}`)
                  .join(' ')} L 500 180 Z`}
                fill="url(#visitsGrad)"
              />
              {/* Line: Visits */}
              <path
                d={dailyStats
                  .map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i * 500) / 6} ${180 - (d.visits / maxVal) * 150}`)
                  .join(' ')}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Area Chart: Reads */}
              <path
                d={`M 0 180 ${dailyStats
                  .map((d, i) => `L ${(i * 500) / 6} ${180 - (d.reads / maxVal) * 150}`)
                  .join(' ')} L 500 180 Z`}
                fill="url(#readsGrad)"
              />
              {/* Line: Reads */}
              <path
                d={dailyStats
                  .map((d, i) => `${i === 0 ? 'M' : 'L'} ${(i * 500) / 6} ${180 - (d.reads / maxVal) * 150}`)
                  .join(' ')}
                fill="none"
                stroke="#10b981"
                strokeWidth="2.5"
                strokeLinecap="round"
              />

              {/* Data Points */}
              {dailyStats.map((d, i) => (
                <g key={i}>
                  <circle
                    cx={(i * 500) / 6}
                    cy={180 - (d.visits / maxVal) * 150}
                    r="4"
                    fill="#3b82f6"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={(i * 500) / 6}
                    cy={180 - (d.reads / maxVal) * 150}
                    r="4"
                    fill="#10b981"
                    stroke="#ffffff"
                    strokeWidth="1.5"
                  />
                </g>
              ))}
            </svg>

            {/* X-Axis labels */}
            <div className="flex justify-between mt-2 px-1 text-[10px] font-semibold text-slate-400">
              {dailyStats.map((d, i) => (
                <div key={i} className="text-center w-12">
                  {d.date}
                </div>
              ))}
            </div>
          </div>

          {/* Legend */}
          <div className="flex gap-4 mt-6 justify-center">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span className="h-2 w-4 rounded-full bg-blue-500 inline-block" />
              Visits ({visitsCount})
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-600">
              <span className="h-2 w-4 rounded-full bg-emerald-500 inline-block" />
              Reads ({readsCount})
            </span>
          </div>
        </div>

        {/* Popular Posts Breakdown */}
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-900">Popular Reads</h3>
            <p className="text-xs text-slate-500 mt-0.5">Top performing articles by total reads.</p>
            
            <div className="mt-5 space-y-4">
              {popularPosts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-8">No reads tracked yet.</p>
              ) : (
                popularPosts.map((post, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs font-semibold text-slate-700">
                      <span className="truncate max-w-[80%]" title={post.title}>
                        {idx + 1}. {post.title}
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded px-1.5 py-0.5 shrink-0">
                        {post.count} reads
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${(post.count / Math.max(...popularPosts.map((p) => p.count))) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4 mt-6 text-center text-xs text-slate-400 font-medium">
            Stats auto-update in real-time
          </div>
        </div>
      </div>

      {/* Visitor Profiles */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Visitor Profiles & Timeline</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Detailed tracking of individual visitors, including anonymous (unknown) guests.
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search email or visitor ID…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 w-full text-sm rounded-lg border border-slate-200 bg-white outline-none focus:border-slate-400 placeholder:text-slate-400"
            />
          </div>
        </div>

        {filteredProfiles.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm font-semibold">
            No visitor profiles found matching your search.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto">
            {filteredProfiles.map((p) => (
              <details key={p.visitorId} className="group outline-none">
                <summary className="p-5 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors list-none outline-none select-none">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 border border-slate-200">
                      {p.email ? (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-600 text-xs font-bold text-white uppercase">
                          {p.email[0]}
                        </div>
                      ) : (
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-400 text-xs font-bold text-white">
                          ?
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-800 truncate">
                        {p.email ? p.email : `Anonymous (ID: ${p.visitorId.slice(0, 8)})`}
                      </p>
                      <p className="text-[10px] font-semibold text-slate-400 uppercase mt-0.5 tracking-wider">
                        Last Active: {new Date(p.lastActive).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex gap-2 text-[11px] font-semibold">
                      <span className="bg-blue-50 text-blue-700 border border-blue-100 rounded-full px-2.5 py-0.5">
                        {p.totalVisits} visits
                      </span>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-full px-2.5 py-0.5">
                        {p.totalReads} reads
                      </span>
                    </div>
                    <ArrowUpRight size={16} className="text-slate-400 group-open:rotate-45 transition-transform" />
                  </div>
                </summary>

                <div className="px-6 pb-6 pt-2 bg-slate-50/50 border-t border-slate-100/50">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                    Activity Timeline
                  </h4>
                  <ul className="space-y-3.5 border-l border-slate-200 pl-4 ml-2">
                    {p.activities.map((act, idx) => (
                      <li key={idx} className="relative group/item">
                        <div className="absolute -left-[20.5px] top-1.5 h-2 w-2 rounded-full border border-white bg-slate-300 group-hover/item:bg-slate-500 transition-colors shadow-xs" />
                        <div className="flex justify-between items-start text-xs">
                          <div>
                            {act.action === 'visit' ? (
                              <span className="text-slate-600 font-semibold">Visited the website</span>
                            ) : (
                              <span className="text-slate-700 font-semibold">
                                Read post: <span className="text-slate-900 font-extrabold">{act.postTitle}</span>
                              </span>
                            )}
                          </div>
                          <span className="text-slate-400 shrink-0 font-medium">
                            {new Date(act.time).toLocaleString()}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
