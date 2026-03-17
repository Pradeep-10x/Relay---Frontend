import { useParams } from 'react-router-dom'
import { useProjectAnalytics, useKanbanBoard } from '@/hooks'
import { BarChart3, CheckCircle, AlertCircle, Target, TrendingUp } from 'lucide-react'
import type { Issue } from '@/types'

export default function AnalyticsPage() {
  const { projectId = '' } = useParams()
  const { data, isLoading } = useProjectAnalytics(projectId)
  const { data: kanbanData } = useKanbanBoard(projectId)

  // Build lookup maps from kanban data for resolving UUIDs
  const stateNameMap = new Map<string, string>()
  const userNameMap = new Map<string, string>()

  if (kanbanData?.states) {
    kanbanData.states.forEach(s => stateNameMap.set(s.id, s.name))
  }
  if (kanbanData?.board) {
    Object.values(kanbanData.board).forEach(issues => {
      ;(issues as Issue[]).forEach(issue => {
        if (issue.assignee) userNameMap.set(issue.assignee.id, issue.assignee.name)
      })
    })
  }

  if (isLoading) {
    return (
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div className="skeleton" style={{ width: 180, height: 28, borderRadius: 8, marginBottom: 32 }} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[1,2,3,4].map(i => <div key={i} className="skeleton" style={{ height: 120, borderRadius: 'var(--radius-xl)' }} />)}
          </div>
        </div>
      </div>
    )
  }

  if (!data) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ fontSize: 13, color: 'var(--text-3)' }}>No analytics data available</p>
      </div>
    )
  }

  const maxState = Math.max(...data.issuesPerState.map(s => s._count), 1)
  const maxUser = Math.max(...(data.tasksPerUser || []).map(u => u._count), 1)
  const pending = data.totalIssues - data.completedIssues

  const kpis = [
    { icon: Target, label: 'Total Issues', value: data.totalIssues, color: '#3b82f6', bg: 'rgba(59,130,246,0.08)' },
    { icon: CheckCircle, label: 'Completed', value: data.completedIssues, color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { icon: TrendingUp, label: 'Completion Rate', value: `${Math.round(data.completionRate)}%`, color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)' },
    { icon: AlertCircle, label: 'Pending', value: pending, color: '#f59e0b', bg: 'rgba(245,158,11,0.08)' },
  ]

  const stateColors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6b7280', '#ec4899']

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <div style={{ maxWidth: 960, margin: '0 auto' }}>

        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '-0.02em', marginBottom: 32 }}>
          Project Analytics
        </h1>

        {/* ── KPI Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
          {kpis.map(({ icon: Icon, label, value, color, bg }) => (
            <div key={label} style={{
              background: 'var(--surface-1)', border: '1px solid var(--border-0)',
              borderRadius: 'var(--radius-xl)', padding: '24px 20px',
              transition: 'all 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: 8, background: bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Icon size={16} color={color} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>{label}</span>
              </div>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)', letterSpacing: '-0.03em', margin: 0 }}>{value}</p>
            </div>
          ))}
        </div>

        {/* ── Overall Progress ── */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border-0)',
          borderRadius: 'var(--radius-xl)', padding: 28, marginBottom: 28,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', margin: 0 }}>Overall Progress</h3>
            <span style={{
              fontSize: 13, fontWeight: 800, color: data.completionRate >= 50 ? '#10b981' : '#f59e0b',
            }}>
              {Math.round(data.completionRate)}%
            </span>
          </div>
          <div style={{ height: 12, borderRadius: 6, background: 'var(--surface-3)', overflow: 'hidden', marginBottom: 10 }}>
            <div style={{
              width: `${data.completionRate}%`, height: '100%', borderRadius: 6,
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              transition: 'width 0.8s cubic-bezier(.4,0,.2,1)',
              minWidth: data.completionRate > 0 ? 4 : 0,
            }} />
          </div>
          <p style={{ fontSize: 12, color: 'var(--text-3)', margin: 0 }}>
            {data.completedIssues} of {data.totalIssues} issues completed
          </p>
        </div>

        {/* ── Two Column Charts ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Issues by State */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)',
            borderRadius: 'var(--radius-xl)', padding: 28,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', margin: '0 0 24px' }}>Issues by State</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              {data.issuesPerState.map((s, i) => {
                const stateName = stateNameMap.get(s.stateId) || s.stateId
                const barColor = stateColors[i % stateColors.length]
                const pct = data.totalIssues > 0 ? Math.round((s._count / data.totalIssues) * 100) : 0
                return (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: barColor, flexShrink: 0 }} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>
                          {stateName.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-0)' }}>
                        {s._count} <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({pct}%)</span>
                      </span>
                    </div>
                    <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                      <div style={{
                        width: `${(s._count / maxState) * 100}%`, height: '100%', borderRadius: 4,
                        background: barColor,
                        transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                        minWidth: s._count > 0 ? 4 : 0,
                      }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Issues by Assignee */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)',
            borderRadius: 'var(--radius-xl)', padding: 28,
          }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', margin: '0 0 24px' }}>Issues by Assignee</h3>
            {(!data.tasksPerUser || data.tasksPerUser.length === 0) ? (
              <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '32px 0' }}>No assignment data</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {data.tasksPerUser.map((u, i) => {
                  const userName = userNameMap.get(u.assigneeId) || (u.assigneeId ? 'Unknown' : 'Unassigned')
                  const initial = userName[0]?.toUpperCase() || '?'
                  const pct = data.totalIssues > 0 ? Math.round((u._count / data.totalIssues) * 100) : 0
                  return (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 24, height: 24, borderRadius: '50%',
                            background: 'var(--accent)', color: '#fff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 10, fontWeight: 800, flexShrink: 0,
                          }}>
                            {initial}
                          </div>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)' }}>{userName}</span>
                        </div>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-0)' }}>
                          {u._count} <span style={{ color: 'var(--text-3)', fontWeight: 500 }}>({pct}%)</span>
                        </span>
                      </div>
                      <div style={{ height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${(u._count / maxUser) * 100}%`, height: '100%', borderRadius: 4,
                          background: 'var(--accent)',
                          transition: 'width 0.6s cubic-bezier(.4,0,.2,1)',
                          minWidth: u._count > 0 ? 4 : 0,
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
