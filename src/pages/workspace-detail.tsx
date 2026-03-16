import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Trash2, Download } from 'lucide-react'
import { useProjects, useWorkspaces, useWorkspaceMembers, useDeleteWorkspace } from '@/hooks'
import { useQueries } from '@tanstack/react-query'
import { boardService } from '@/services/board.service'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { getInitials, getAvatarColor, formatRelative } from '@/lib/utils'
import type { Issue, KanbanBoard } from '@/types'
import InviteMemberModal from '@/components/workspace/invite-modal'
import CreateProjectModal from '@/components/workspace/create-project-modal'

const PROJECT_COLORS = ['#1152d4', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6', '#ec4899', '#06b6d4']

export default function WorkspaceDetailPage() {
  const { activeWorkspaceId, setActiveWorkspaceId } = useUIStore()
  const { user } = useAuthStore()
  const { data: workspaces = [] } = useWorkspaces()

  // Validate activeWorkspaceId — fall back if stale (e.g. after DB re-seed)
  const validWsId = workspaces.find(w => w.id === activeWorkspaceId) ? activeWorkspaceId : null
  const wsId = validWsId || workspaces[0]?.id || ''
  if (wsId && wsId !== activeWorkspaceId && workspaces.length > 0) {
    setActiveWorkspaceId(wsId)
  }

  const currentWs = workspaces.find(w => w.id === wsId)
  const { data: projects = [], isLoading: projLoading } = useProjects(wsId)
  const { data: members = [], isLoading: memLoading } = useWorkspaceMembers(wsId)
  const deleteWs = useDeleteWorkspace()
  const navigate = useNavigate()

  const [showInvite, setShowInvite] = useState(false)
  const [showCreateProject, setShowCreateProject] = useState(false)

  const myRole = Array.isArray(members) ? members.find((m: any) => m.userId === user?.id)?.role : undefined
  const isOwner = myRole === 'OWNER'
  const isAdmin = myRole === 'ADMIN' || isOwner

  // Fetch board data for all projects to compute progress
  const boardQueries = useQueries({
    queries: projects.map(p => ({
      queryKey: ['kanban', p.id],
      queryFn: () => boardService.getKanban(p.id),
      enabled: !!p.id,
      staleTime: 60_000,
    })),
  })

  // Aggregate stats
  const allIssues: Issue[] = boardQueries.flatMap(q => {
    if (!q.data) return []
    const boardData = (q.data as any).board ?? q.data
    return Object.values(boardData as KanbanBoard).flat() as Issue[]
  })
  const doneIssues = allIssues.filter(i => {
    const n = i.state?.name?.toUpperCase()
    return n === 'DONE' || n === 'CANCELLED'
  })
  const memberCount = Array.isArray(members) ? members.length : 0

  return (
    <div className="page-content" style={{ background: 'var(--surface-0)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 32px' }}>

        {/* ═══════════ Header ═══════════ */}
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, marginBottom: 28 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'var(--text-0)', letterSpacing: '-0.03em', lineHeight: 1.2 }}>
              Workspace Overview
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginTop: 4 }}>
              Global control center for {currentWs?.name || 'your workspace'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            {isAdmin && (
              <button onClick={() => setShowInvite(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-lg)',
                background: 'var(--surface-1)', border: '1px solid var(--border-0)', fontSize: 13, fontWeight: 600,
                color: 'var(--text-0)', cursor: 'pointer',
              }}>
                <UserPlus size={15} /> Invite
              </button>
            )}
            <button onClick={() => setShowCreateProject(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 'var(--radius-lg)',
              background: 'var(--accent)', color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(17,82,212,0.2)',
            }}>
              <Plus size={15} /> Create Project
            </button>
          </div>
        </div>

        {/* ═══════════ Stat Cards ═══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 32 }}>
          {/* Total Projects */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Total Projects</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-lg)', background: 'rgba(17,82,212,0.1)', color: 'var(--accent)' }}>
                {projects.length > 0 ? `${projects.length}` : '0'}
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)' }}>{projects.length}</p>
            <div style={{ height: 5, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(projects.length * 10, 100)}%`, background: 'var(--accent)', borderRadius: 100 }} />
            </div>
          </div>

          {/* Active Members */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Active Members</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)' }}>{memberCount}</p>
            <div style={{ display: 'flex' }}>
              {Array.isArray(members) && members.slice(0, 4).map((m: any, i: number) => (
                <div key={m.id} style={{
                  width: 24, height: 24, borderRadius: '50%', marginLeft: i > 0 ? -6 : 0,
                  background: getAvatarColor(m.user?.name || ''), border: '2px solid var(--surface-1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 8, fontWeight: 700,
                }}>
                  {getInitials(m.user?.name)}
                </div>
              ))}
              {memberCount > 4 && (
                <div style={{
                  width: 24, height: 24, borderRadius: '50%', marginLeft: -6,
                  background: 'var(--surface-3)', border: '2px solid var(--surface-1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: 'var(--text-2)',
                }}>
                  +{memberCount - 4}
                </div>
              )}
            </div>
          </div>

          {/* Issues Resolved */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Issues Resolved</span>
              <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 'var(--radius-lg)', background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                {allIssues.length > 0 ? `${Math.round(doneIssues.length / allIssues.length * 100)}%` : '0%'}
              </span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)' }}>{doneIssues.length}</p>
            <p style={{ fontSize: 11, color: 'var(--text-3)' }}>out of {allIssues.length} total issues</p>
          </div>

          {/* Completion Rate */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Completion Rate</span>
            </div>
            <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text-0)' }}>
              {allIssues.length > 0 ? `${Math.round(doneIssues.length / allIssues.length * 100)}%` : '—'}
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Across all projects</span>
            </div>
          </div>
        </div>

        {/* ═══════════ Recent Projects ═══════════ */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-0)', display: 'flex', alignItems: 'center', gap: 8 }}>
              Recent Projects
              <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 100, background: 'var(--surface-3)', color: 'var(--text-2)' }}>
                {projects.length} Active
              </span>
            </h2>
          </div>

          {projLoading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 180, borderRadius: 'var(--radius-xl)' }} />)}
            </div>
          ) : projects.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '48px 0', background: 'var(--surface-1)', border: '1px solid var(--border-0)',
              borderRadius: 'var(--radius-xl)',
            }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 8 }}>No projects yet</p>
              <button onClick={() => setShowCreateProject(true)} style={{
                fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--accent)', border: 'none',
                padding: '8px 18px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
              }}>
                <Plus size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Create Project
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
              {projects.map((p, idx) => {
                const color = PROJECT_COLORS[idx % PROJECT_COLORS.length]
                const boardResult = boardQueries[idx]
                let progress = 0
                let issueCount = p.issueCounter || 0
                if (boardResult?.data) {
                  const rawBoard = (boardResult.data as any).board ?? boardResult.data
                  const boardIssues = Object.values(rawBoard as KanbanBoard).flat() as Issue[]
                  issueCount = boardIssues.length
                  const done = boardIssues.filter(i => {
                    const n = i.state?.name?.toUpperCase()
                    return n === 'DONE' || n === 'CANCELLED'
                  }).length
                  progress = issueCount > 0 ? Math.round((done / issueCount) * 100) : 0
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => navigate(`/workspace/${wsId}/project/${p.id}/board`)}
                    style={{
                      background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
                      overflow: 'hidden', cursor: 'pointer', transition: 'border-color 0.15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = `${color}66`)}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-0)')}
                  >
                    {/* Color bar */}
                    <div style={{ height: 4, background: color }} />

                    <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                      {/* Title & Status */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div>
                          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)', marginBottom: 2 }}>{p.name}</h3>
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontFamily: 'var(--font-mono)' }}>{p.key}</span>
                        </div>
                        <span style={{
                          fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                          padding: '3px 8px', borderRadius: 4,
                          background: progress >= 80 ? 'rgba(16,185,129,0.1)' : progress >= 30 ? 'rgba(245,158,11,0.1)' : 'var(--surface-3)',
                          color: progress >= 80 ? '#10b981' : progress >= 30 ? '#f59e0b' : 'var(--text-2)',
                        }}>
                          {progress >= 80 ? 'Active' : progress >= 30 ? 'In Progress' : 'Planning'}
                        </span>
                      </div>

                      {/* Progress */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontWeight: 600, marginBottom: 4 }}>
                          <span style={{ color: 'var(--text-2)' }}>Progress</span>
                          <span style={{ color: 'var(--text-0)' }}>{progress}%</span>
                        </div>
                        <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 100, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${progress}%`, background: color, borderRadius: 100, transition: 'width 0.3s' }} />
                        </div>
                      </div>

                      {/* Footer */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 10, borderTop: '1px solid var(--border-0)' }}>
                        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{issueCount} issues</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* ═══════════ Bottom Grid: Members + Activity ═══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 24 }}>

          {/* ── Workspace Members ── */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}>Workspace Members</h2>
              {isAdmin && (
                <button onClick={() => setShowInvite(true)} style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Invite New
                </button>
              )}
            </div>
            <div style={{ padding: 8 }}>
              {memLoading ? (
                <div style={{ padding: 20 }}>{[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />)}</div>
              ) : (
                <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr>
                      {['Member', 'Role', 'Action'].map(h => (
                        <th key={h} style={{ padding: '10px 12px', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.08em', borderBottom: '1px solid var(--border-0)' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Array.isArray(members) && members.map((m: any) => (
                      <tr key={m.id} style={{ borderBottom: '1px solid var(--border-0)' }}>
                        <td style={{ padding: '12px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{
                              width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                              background: getAvatarColor(m.user?.name || ''),
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              color: '#fff', fontSize: 10, fontWeight: 700,
                            }}>
                              {getInitials(m.user?.name)}
                            </div>
                            <div>
                              <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>{m.user?.name || 'Unknown'}</p>
                              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{m.user?.email}</p>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            fontSize: 11, fontWeight: 600, padding: '3px 10px', borderRadius: 'var(--radius-md)',
                            background: 'var(--surface-3)', color: 'var(--text-1)',
                          }}>
                            {m.role}
                          </span>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'right' }}>
                          {isAdmin && m.role !== 'OWNER' && m.userId !== user?.id && (
                            <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
                              <Trash2 size={14} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── Workspace Activity (placeholder) ── */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}>Workspace Activity</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Show recent issues as activity */}
              {allIssues.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '32px 0' }}>No recent activity</p>
              ) : (
                allIssues.slice(0, 5).map((issue, i) => (
                  <div key={issue.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                    {/* Timeline connector */}
                    {i < Math.min(allIssues.length, 5) - 1 && (
                      <div style={{ position: 'absolute', left: 15, top: 32, bottom: -20, width: 2, background: 'var(--border-0)' }} />
                    )}
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0, zIndex: 1,
                      background: issue.state?.name === 'DONE' ? 'rgba(16,185,129,0.12)' : issue.state?.name === 'IN_PROGRESS' ? 'rgba(59,130,246,0.12)' : 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: issue.state?.name === 'DONE' ? '#10b981' : issue.state?.name === 'IN_PROGRESS' ? '#3b82f6' : 'var(--text-2)',
                      fontSize: 14,
                    }}>
                      {issue.state?.name === 'DONE' ? '✓' : issue.state?.name === 'IN_PROGRESS' ? '▶' : '○'}
                    </div>
                    <div>
                      <p style={{ fontSize: 13, color: 'var(--text-0)', lineHeight: 1.5 }}>
                        <span style={{ fontWeight: 700 }}>{issue.assignee?.name || issue.reporter?.name || 'Someone'}</span>
                        {' '}
                        {issue.state?.name === 'DONE' ? 'resolved' : issue.state?.name === 'IN_PROGRESS' ? 'is working on' : 'created'}
                        {' '}
                        <span style={{ fontWeight: 600, color: 'var(--accent)' }}>{issue.key} {issue.title}</span>
                      </p>
                      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        {issue.updatedAt ? formatRelative(issue.updatedAt) : '—'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* ═══════════ Danger Zone ═══════════ */}
        {isOwner && (
          <div style={{ marginTop: 48, paddingTop: 24, borderTop: '1px solid var(--border-0)' }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Danger Zone</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 12 }}>Deleting this workspace will permanently remove all projects, issues, and data.</p>
            <button
              onClick={() => { if (confirm('Are you sure? This cannot be undone.')) deleteWs.mutate(wsId, { onSuccess: () => navigate('/onboarding') }) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 700,
                color: '#fff', background: '#ef4444', border: 'none', padding: '7px 16px',
                borderRadius: 'var(--radius-md)', cursor: 'pointer',
              }}
            >
              <Trash2 size={13} /> Delete Workspace
            </button>
          </div>
        )}
      </div>

      {showInvite && <InviteMemberModal wsId={wsId} onClose={() => setShowInvite(false)} />}
      {showCreateProject && <CreateProjectModal wsId={wsId} onClose={() => setShowCreateProject(false)} />}
    </div>
  )
}
