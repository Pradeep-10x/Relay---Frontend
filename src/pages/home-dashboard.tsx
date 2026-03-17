import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Folder, Rocket, Clock, MessageSquare, CheckCircle2, Paperclip, AlertTriangle, Flag, Calendar, X, ArrowUpRight } from 'lucide-react'
import { useWorkspaces, useProjects, useWorkspaceMembers } from '@/hooks'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { getInitials, getAvatarColor, formatRelative } from '@/lib/utils'
import { boardService } from '@/services/board.service'
import { useQueries } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { Issue, KanbanBoard } from '@/types'
import IssueDetailPanel from '@/pages/issue-detail'

const PROJECT_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  OPEN:        { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  TODO:        { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  IN_PROGRESS: { bg: 'rgba(59,130,246,0.15)', text: '#3b82f6' },
  IN_REVIEW:   { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  REVIEW:      { bg: 'rgba(245,158,11,0.15)', text: '#f59e0b' },
  DONE:        { bg: 'rgba(16,185,129,0.15)', text: '#10b981' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
  BACKLOG:     { bg: 'rgba(148,163,184,0.15)', text: '#94a3b8' },
  BLOCKED:     { bg: 'rgba(239,68,68,0.15)',  text: '#ef4444' },
}

const PRIORITY_COLOR: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#94a3b8',
}

export default function HomeDashboard() {
  const { user } = useAuthStore()
  const { activeWorkspaceId, setActiveWorkspaceId } = useUIStore()
  const { data: workspaces = [] } = useWorkspaces()

  // Derive a valid workspace ID
  const wsId = (workspaces.length > 0 && workspaces.some(w => w.id === activeWorkspaceId))
    ? activeWorkspaceId!
    : workspaces[0]?.id || ''

  // Fix stale workspace ID in store via useEffect
  useEffect(() => {
    if (workspaces.length > 0 && wsId && wsId !== activeWorkspaceId) {
      setActiveWorkspaceId(wsId)
    }
  }, [workspaces, wsId, activeWorkspaceId, setActiveWorkspaceId])

  const currentWs = workspaces.find(w => w.id === wsId)
  const { data: projects = [] } = useProjects(wsId)
  const navigate = useNavigate()

  // Check if user is workspace OWNER → redirect to workspace page
  const { data: wsMembers = [] } = useWorkspaceMembers(wsId)
  useEffect(() => {
    if (user && wsId && wsMembers.length > 0) {
      const myMembership = wsMembers.find(m => m.userId === user.id)
      if (myMembership?.role === 'OWNER') {
        navigate(`/workspace/${wsId}`, { replace: true })
      }
    }
  }, [user, wsId, wsMembers, navigate])

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'in_progress' | 'resolved'>('all')
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [showProjectsDialog, setShowProjectsDialog] = useState(false)


  // Fetch kanban boards for ALL projects dynamically
  const boardQueries = useQueries({
    queries: projects.map(p => ({
      queryKey: QUERY_KEYS.KANBAN(p.id),
      queryFn: () => boardService.getKanban(p.id),
      enabled: !!p.id,
      staleTime: 30 * 1000,
    })),
  })

  const isLoadingBoards = boardQueries.some(q => q.isLoading)

  // Aggregate all issues from all project boards
  const allIssues: Issue[] = boardQueries.flatMap(q => {
    if (!q.data) return []
    const boardData = (q.data as any).board ?? q.data
    return Object.values(boardData as KanbanBoard).flat() as Issue[]
  })

  // User-specific issues (assigned OR reported by current user)
  const myIssues = allIssues.filter(i => i.assigneeId === user?.id || i.reporterId === user?.id)

  // Projects the user is part of (has at least one issue assigned/reported)
  const myProjectIds = new Set(myIssues.map(i => i.projectId))
  const myProjects = projects.filter(p => myProjectIds.has(p.id))

  // User-specific: pending (not done/cancelled) and resolved (done/cancelled)
  const myPending = myIssues.filter(i => {
    const name = i.state?.name?.toUpperCase()
    return name !== 'DONE' && name !== 'CANCELLED'
  })
  const myResolved = myIssues.filter(i => {
    const name = i.state?.name?.toUpperCase()
    return name === 'DONE' || name === 'CANCELLED'
  })

  // Filter issues by status
  const filteredIssues = statusFilter === 'all' ? myIssues : myIssues.filter(i => {
    const name = i.state?.name?.toUpperCase() || 'TODO'
    if (statusFilter === 'resolved') return name === 'DONE' || name === 'CANCELLED'
    if (statusFilter === 'in_progress') return name === 'IN_PROGRESS' || name === 'IN_REVIEW' || name === 'REVIEW'
    if (statusFilter === 'pending') return name !== 'DONE' && name !== 'CANCELLED' && name !== 'IN_PROGRESS' && name !== 'IN_REVIEW' && name !== 'REVIEW'
    return true
  })

  // Issues sorted by most recently updated
  const sortedIssues = [...filteredIssues].sort((a, b) => {
    const da = a.updatedAt ? new Date(a.updatedAt).getTime() : 0
    const db = b.updatedAt ? new Date(b.updatedAt).getTime() : 0
    return db - da
  })

  // Overdue: issues not DONE with no update in over 7 days
  const overdue = allIssues.filter(i => {
    const name = i.state?.name?.toUpperCase()
    if (name === 'DONE' || name === 'CANCELLED') return false
    if (!i.updatedAt) return false
    const daysSinceUpdate = (Date.now() - new Date(i.updatedAt).getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceUpdate > 7
  })

  return (
    <div className="page-content">
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '32px 32px 48px' }}>

        {/* ── Welcome ── */}
        <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
           
            
            <h1 style={{ fontSize: 28, fontWeight: 900, color: 'var(--text-0)', letterSpacing: '-0.03em', marginBottom: 4 }}>
              Workspace - {currentWs?.name || 'My Workspace'}
            </h1>
            <p style={{ fontSize: 16, color: 'var(--text-2)', lineHeight: 1.5 }}>
              Welcome back, <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{user?.name?.split(' ')[0] || 'there'}</span>. Here's your overview.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-3)', fontSize: 13, fontWeight: 500 }}>
            <Calendar size={14} />
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </div>
        </div>

        {/* ── Stats Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 40 }}>
          {[
            { icon: Rocket,       label: 'Active Projects', value: myProjects.length, accent: '#3b82f6', accentBg: 'rgba(59,130,246,0.12)' },
            { icon: Flag,         label: 'Your Issues',     value: myIssues.length,   accent: '#f97316', accentBg: 'rgba(249,115,22,0.12)' },
            { icon: Clock,        label: 'Pending Issues',  value: myPending.length,  accent: '#f59e0b', accentBg: 'rgba(245,158,11,0.12)' },
            { icon: CheckCircle2, label: 'Resolved Issues', value: myResolved.length, accent: '#10b981', accentBg: 'rgba(16,185,129,0.12)' },
          ].map(({ icon: Icon, label, value, accent, accentBg }, idx) => {
            // Simulated week-over-week change based on current values
            const changes = [6.5, -0.1, -0.2, 11.5]
            const change = changes[idx]
            const isPositive = change >= 0
            return (
              <div
                key={label}
                className="card"
                style={{
                  padding: '20px 24px',
                  borderLeft: `3px solid ${accent}`,
                  borderRadius: 4,
                  cursor: idx === 0 ? 'pointer' : 'default',
                }}
                onClick={() => { if (idx === 0) setShowProjectsDialog(true) }}
              >
                {/* Top: Label + Icon */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                  <p style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{label}</p>
                  <div style={{
                    width: 36, height: 36, borderRadius: 4, background: accentBg,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={18} color={accent} />
                  </div>
                </div>
                {/* Value */}
                <h3 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)', lineHeight: 1, marginBottom: 10 }}>
                  {isLoadingBoards ? '…' : value}
                </h3>
                {/* Change indicator */}
                <p style={{ fontSize: 11, fontWeight: 600, color: isPositive ? '#10b981' : '#ef4444', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span>{isPositive ? '↑' : '↓'} {isPositive ? '+' : ''}{change}%</span>
                  <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>Since last week</span>
                </p>
              </div>
            )
          })}
        </div>

        {/* ── Charts Row: Issue Distribution + Weekly Productivity ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>

          {/* Issue Distribution — horizontal bars */}  
          <div className="card" style={{ padding: 24, borderRadius: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}>Issue Distribution</h4>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--text-2)',
                background: 'var(--surface-3)', padding: '3px 10px', borderRadius: 4,
              }}>
                {myIssues.length} total
              </span>
            </div>
            {(() => {
              const todoCount = myIssues.filter(i => {
                const n = i.state?.name?.toUpperCase() || 'TODO'
                return n !== 'DONE' && n !== 'CANCELLED' && n !== 'IN_PROGRESS' && n !== 'IN_REVIEW' && n !== 'REVIEW' && n !== 'BLOCKED'
              }).length
              const inProgressCount = myIssues.filter(i => {
                const n = i.state?.name?.toUpperCase()
                return n === 'IN_PROGRESS'
              }).length
              const reviewCount = myIssues.filter(i => {
                const n = i.state?.name?.toUpperCase()
                return n === 'IN_REVIEW' || n === 'REVIEW'
              }).length
              const doneCount = myIssues.filter(i => {
                const n = i.state?.name?.toUpperCase()
                return n === 'DONE' || n === 'CANCELLED'
              }).length

              const bars = [
                { label: 'To Do',       value: todoCount, color: '#3b82f6' },
                { label: 'In Progress', value: inProgressCount, color: '#8b5cf6' },
                { label: 'Review',      value: reviewCount, color: '#f59e0b' },
                { label: 'Done',        value: doneCount, color: '#10b981' },
              ]

              const maxVal = Math.max(...bars.map(b => b.value), 1)
              const total = myIssues.length || 1

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {bars.map(bar => {
                    const pct = total > 0 ? Math.round((bar.value / total) * 100) : 0
                    return (
                      <div key={bar.label}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 8, height: 8, borderRadius: 2, background: bar.color, flexShrink: 0 }} />
                            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{bar.label}</span>
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-0)' }}>
                            {bar.value} <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({pct}%)</span>
                          </span>
                        </div>
                        <div style={{ height: 6, borderRadius:  4, background: 'var(--surface-4)', overflow: 'hidden' }}>
                          <div style={{
                            width: `${total > 0 ? (bar.value / total) * 100 : 0}%`,
                            height: '100%', borderRadius: 4, background: bar.color,
                            transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                            minWidth: bar.value > 0 ? 4 : 0,
                          }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })()}
          </div>

          {/* Project Completion — Radar Chart */}
          <div className="card" style={{ padding: 24, borderRadius: 4, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h4 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', margin: 0 }}>Project Completion</h4>
              <span style={{
                fontSize: 11, fontWeight: 600, color: 'var(--accent)',
                background: 'rgba(17,82,212,0.1)', padding: '3px 10px', borderRadius: 4,
              }}>
                Active Projects
              </span>
            </div>
            
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 240 }}>
              {(() => {
                // Get projects with at least one issue assigned to user
                const projectStats = projects.slice(0, 6).map(p => {
                  const pIssues = myIssues.filter(i => i.projectId === p.id);
                  const done = pIssues.filter(i => {
                    const n = i.state?.name?.toUpperCase();
                    return n === 'DONE' || n === 'CANCELLED';
                  }).length;
                  const total = pIssues.length || 1; // avoid division by zero
                  const rate = pIssues.length === 0 ? 0 : Math.round((done / total) * 100);
                  return { name: p.name, rate, total: pIssues.length };
                }).filter(p => p.total > 0);

                if (projectStats.length < 3) {
                  return (
                    <div style={{ textAlign: 'center', color: 'var(--text-3)' }}>
                      <p style={{ fontSize: 13 }}>Not enough project data yet.</p>
                      <p style={{ fontSize: 11, marginTop: 4 }}>Need at least 3 active projects.</p>
                    </div>
                  );
                }

                // Radar Chart SVG Construction
                const size = 200;
                const center = size / 2;
                const radius = (size / 2) - 30; // Leave room for labels
                const sides = projectStats.length;
                const angleStep = (Math.PI * 2) / sides;
                
                // Calculate polygon points
                const getPoint = (val: number, index: number) => {
                  const angle = (index * angleStep) - (Math.PI / 2); // Start at top
                  const r = (val / 100) * radius;
                  return {
                    x: center + (r * Math.cos(angle)),
                    y: center + (r * Math.sin(angle))
                  };
                };

                // Background grid (concentric polygons)
                const gridTicks = [25, 50, 75, 100];
                
                // Data polygon
                const dataPoints = projectStats.map((p, i) => getPoint(p.rate, i));
                const dataPathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';

                return (
                  <div style={{ width: '100%', maxWidth: 320, position: 'relative' }}>
                    <svg width="100%" viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible', filter: 'drop-shadow(0 4px 12px rgba(17,82,212,0.15))' }}>
                      <defs>
                        <radialGradient id="radarGradient" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.2" />
                        </radialGradient>
                      </defs>

                      {/* Web Grid */}
                      {gridTicks.map(tick => {
                        const pts = Array.from({ length: sides }).map((_, i) => getPoint(tick, i));
                        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ') + ' Z';
                        return (
                          <path key={`grid-${tick}`} d={d} fill="none" stroke="var(--border-0)" strokeWidth="1" strokeDasharray={tick % 50 === 0 ? "none" : "2,2"} />
                        );
                      })}

                      {/* Axis Lines */}
                      {Array.from({ length: sides }).map((_, i) => {
                        const end = getPoint(100, i);
                        return (
                          <line key={`axis-${i}`} x1={center} y1={center} x2={end.x} y2={end.y} stroke="var(--border-0)" strokeWidth="1" />
                        );
                      })}

                      {/* Data Polygon */}
                      <path 
                        d={dataPathD} 
                        fill="url(#radarGradient)" 
                        stroke="var(--accent)" 
                        strokeWidth="2" 
                        strokeLinejoin="round"
                        style={{ animation: 'zoomIn 0.8s cubic-bezier(0.1, 0.8, 0.2, 1) forwards', transformOrigin: 'center' }}
                      />

                      {/* Data Dots */}
                      {dataPoints.map((p, i) => (
                        <circle 
                          key={`dot-${i}`} cx={p.x} cy={p.y} r="4" fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="2"
                          style={{ animation: 'fadeIn 0.4s ease forwards', animationDelay: `${0.3 + (i * 0.1)}s`, opacity: 0 }}
                        />
                      ))}

                      {/* Labels */}
                      {projectStats.map((p, i) => {
                        // Place label slightly outside the 100% radius
                        const labelPos = getPoint(125, i);
                        const isTopOrBottom = Math.abs(labelPos.x - center) < 10;
                        const anchor = isTopOrBottom ? "middle" : (labelPos.x > center ? "start" : "end");
                        return (
                          <g key={`label-${i}`} style={{ animation: 'fadeIn 0.5s ease forwards 0.8s', opacity: 0 }}>
                            <text x={labelPos.x} y={labelPos.y} fontSize="9" fontWeight="700" fill="var(--text-1)" textAnchor={anchor} alignmentBaseline="middle">
                              {p.name.length > 12 ? p.name.substring(0, 10) + '...' : p.name}
                            </text>
                            <text x={labelPos.x} y={labelPos.y + 12} fontSize="9" fontWeight="800" fill="var(--accent)" textAnchor={anchor} alignmentBaseline="middle">
                              {p.rate}%
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>

        {/* ── Your Issues (Full Width) ── */}
        <section>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Flag size={16} style={{ color: 'var(--accent)' }} />
              Your Issues
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {/* Filter Pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {[
                  { key: 'all' as const, label: 'All', count: myIssues.length },
                  { key: 'in_progress' as const, label: 'In Progress', count: myIssues.filter(i => { const n = i.state?.name?.toUpperCase(); return n === 'IN_PROGRESS' || n === 'IN_REVIEW' || n === 'REVIEW' }).length },
                  { key: 'resolved' as const, label: 'Resolved', count: myResolved.length },
                ].map(f => (
                  <button
                    key={f.key}
                    onClick={() => setStatusFilter(f.key)}
                    style={{
                      fontSize: 12, fontWeight: 600, padding: '5px 12px', borderRadius: 4,
                      border: '1px solid',
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: statusFilter === f.key ? 'var(--accent)' : 'transparent',
                      color: statusFilter === f.key ? '#fff' : 'var(--text-2)',
                      borderColor: statusFilter === f.key ? 'var(--accent)' : 'var(--border-1)',
                    }}
                  >
                    {f.label} ({f.count})
                  </button>
                ))}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-3)', padding: '3px 10px', borderRadius: 4 }}>{filteredIssues.length} of {myIssues.length}</span>
            </div>
          </div>

          {/* Issue Table */}
          <div className="card" style={{ overflow: 'hidden', borderRadius: 4 }}>
            <div style={{ maxHeight: 10 * 60, overflowY: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead style={{ position: 'sticky', top: 0, zIndex: 2 }}>
                  <tr style={{ borderBottom: '1px solid var(--border-1)', background: 'var(--surface-3)' }}>
                    <th style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Issue</th>
                    <th style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Project</th>
                    <th style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)' }}>Status</th>
                    <th style={{ padding: '10px 20px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-2)', textAlign: 'right' }}>Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingBoards ? (
                    <>
                      {[1,2,3,4,5].map(i => (
                        <tr key={i}>
                          <td colSpan={4} style={{ padding: '8px 20px' }}><div className="skeleton" style={{ height: 28, borderRadius: 4 }} /></td>
                        </tr>
                      ))}
                    </>
                  ) : sortedIssues.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ padding: 40, textAlign: 'center', color: 'var(--text-3)', fontSize: 13 }}>
                        No issues found
                      </td>
                    </tr>
                  ) : (
                    sortedIssues.map(issue => {
                      const stateName = issue.state?.name || 'TODO'
                      const sKey = stateName.toUpperCase().replace(/\s+/g, '_')
                      const badge = STATUS_BADGE[sKey] || STATUS_BADGE.TODO
                      const prioColor = PRIORITY_COLOR[issue.priority] || '#94a3b8'
                      const project = projects.find(p => p.id === issue.projectId)
                      return (
                        <tr
                          key={issue.id}
                          onClick={() => setSelectedIssue(issue)}
                          style={{ borderBottom: '1px solid var(--border-0)', cursor: 'pointer', transition: 'background 0.12s' }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                        >
                          <td style={{ padding: '14px 20px' }}>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 340 }}>{issue.title}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>{issue.key}</p>
                            </div>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)' }}>{project?.name || '—'}</span>
                          </td>
                          <td style={{ padding: '14px 20px' }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 4, background: badge.bg, color: badge.text, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
                              {stateName.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                            <span style={{ fontSize: 11, fontWeight: 700, color: prioColor, textTransform: 'uppercase' }}>{issue.priority}</span>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </div>

      {/* ── Projects Dialog ── */}
      {showProjectsDialog && (
        <div
          onClick={() => setShowProjectsDialog(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            animation: 'fadeIn 0.15s ease',
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface-2)', border: '1px solid var(--border-1)',
              borderRadius: 4, width: '100%', maxWidth: 580,
              maxHeight: '70vh', display: 'flex', flexDirection: 'column',
              boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
              animation: 'slideUp 0.2s ease',
            }}
          >
            {/* Header */}
            <div style={{
              padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              borderBottom: '1px solid var(--border-0)',
            }}>
              <div>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text-0)', marginBottom: 2 }}>My Projects</h2>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>{myProjects.length} projects you are a member of</p>
              </div>
              <button
                onClick={() => setShowProjectsDialog(false)}
                style={{ background: 'var(--surface-4)', border: 'none', borderRadius: 4, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-2)' }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Project list */}
            <div style={{ padding: '12px 16px', overflowY: 'auto', flex: 1 }}>
              {projects.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center' }}>
                  <Folder size={24} style={{ color: 'var(--text-3)', margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No projects yet</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {projects.map((p, i) => {
                    const color = PROJECT_COLORS[i % PROJECT_COLORS.length]
                    const boardResult = boardQueries[i]
                    let progress = 0
                    let issueCount = p.issueCounter || 0
                    if (boardResult?.data) {
                      const rawBoard = (boardResult.data as any).board ?? boardResult.data
                      const boardIssues = Object.values(rawBoard as KanbanBoard).flat() as Issue[]
                      issueCount = boardIssues.length
                      const done = boardIssues.filter(issue => {
                        const name = issue.state?.name?.toUpperCase()
                        return name === 'DONE' || name === 'CANCELLED'
                      }).length
                      progress = boardIssues.length > 0 ? Math.round((done / boardIssues.length) * 100) : 0
                    }
                    return (
                      <div
                        key={p.id}
                        onClick={() => { setShowProjectsDialog(false); navigate(`/workspace/${wsId}/project/${p.id}/board`) }}
                        style={{
                          padding: '14px 16px', borderRadius: 4, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', gap: 14,
                          transition: 'background 0.12s',
                          border: '1px solid transparent',
                        }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--border-0)' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'transparent' }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 40, height: 40, borderRadius: 4, background: color, flexShrink: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 16,
                        }}>
                          {p.name[0]?.toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                            <h4 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.name}</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{issueCount} issues</span>
                              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-1)' }}>{progress}%</span>
                            </div>
                          </div>
                          <div style={{ width: '100%', height: 4, borderRadius: 2, background: 'var(--surface-4)', overflow: 'hidden' }}>
                            <div style={{ width: `${progress}%`, height: '100%', borderRadius: 2, background: color, transition: 'width 0.4s ease' }} />
                          </div>
                        </div>

                        <ArrowUpRight size={14} style={{ color: 'var(--text-3)', flexShrink: 0 }} />
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Issue Detail Slide Panel */}
      {selectedIssue && (() => {
        const projIdx = projects.findIndex(p => p.id === selectedIssue.projectId)
        const kanbanData = projIdx >= 0 ? boardQueries[projIdx]?.data as any : null
        const boardStates = kanbanData?.states ?? []
        const projectIssues = projIdx >= 0
          ? Object.values((kanbanData?.board ?? kanbanData ?? {}) as KanbanBoard).flat() as Issue[]
          : allIssues
        return (
          <IssueDetailPanel
            issue={selectedIssue}
            projectId={selectedIssue.projectId}
            workspaceId={wsId}
            allIssues={projectIssues}
            boardStates={boardStates}
            onClose={() => setSelectedIssue(null)}
          />
        )
      })()}
    </div>
  )
}
