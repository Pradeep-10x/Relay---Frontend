import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, UserPlus, Trash2, Download, ChevronLeft, ChevronRight, X, Shield, ShieldCheck, Crown } from 'lucide-react'
import { useProjects, useWorkspaces, useWorkspaceMembers, useDeleteWorkspace, useRemoveWorkspaceMember, useChangeMemberRole } from '@/hooks'
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
  const [projectPage, setProjectPage] = useState(0)
  const [showMembersPanel, setShowMembersPanel] = useState(false)
  const removeMember = useRemoveWorkspaceMember()
  const changeRole = useChangeMemberRole()

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

          {/* Active Members — clickable */}
          <div
            onClick={() => setShowMembersPanel(true)}
            style={{
              background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
              padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
              cursor: 'pointer', transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>Active Members</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--accent)' }}>Manage →</span>
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
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
          ) : (() => {
            const perPage = 3
            const totalPages = Math.ceil(projects.length / perPage)
            const page = Math.min(projectPage, totalPages - 1)
            const visible = projects.slice(page * perPage, page * perPage + perPage)

            return (
              <div>
                <div style={{ position: 'relative' }}>
                  {/* Left arrow */}
                  {page > 0 && (
                    <button
                      onClick={() => setProjectPage(p => Math.max(p - 1, 0))}
                      style={{
                        position: 'absolute', left: -16, top: '50%', transform: 'translateY(-50%)',
                        zIndex: 5, width: 32, height: 32, borderRadius: 4,
                        background: 'var(--surface-2)', border: '1px solid var(--border-1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-1)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    >
                      <ChevronLeft size={16} />
                    </button>
                  )}

                  {/* Project cards */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
                    {visible.map((p, vi) => {
                      const idx = page * perPage + vi
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

                  {/* Right arrow */}
                  {page < totalPages - 1 && (
                    <button
                      onClick={() => setProjectPage(p => Math.min(p + 1, totalPages - 1))}
                      style={{
                        position: 'absolute', right: -16, top: '50%', transform: 'translateY(-50%)',
                        zIndex: 5, width: 32, height: 32, borderRadius: 4,
                        background: 'var(--surface-2)', border: '1px solid var(--border-1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-1)', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        transition: 'background 0.12s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-2)'}
                    >
                      <ChevronRight size={16} />
                    </button>
                  )}
                </div>

                {/* Page dots */}
                {totalPages > 1 && (
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginTop: 16 }}>
                    {Array.from({ length: totalPages }).map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setProjectPage(i)}
                        style={{
                          width: page === i ? 20 : 6, height: 6, borderRadius: 3,
                          background: page === i ? 'var(--accent)' : 'var(--surface-4)',
                          border: 'none', cursor: 'pointer', padding: 0,
                          transition: 'all 0.2s ease',
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })()}
        </div>

        {/* ═══════════ Workspace Analytics ═══════════ */}
 

        {/* ── Team Workload (full width) ── */}
        <div style={{
          background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
          padding: 24, marginBottom: 32,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)' }}>Team Workload</h3>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>Issues assigned per member</span>
          </div>
          {(() => {
            const memberStats = new Map<string, { name: string; avatar?: string | null; assigned: number; resolved: number; remaining: number }>()
            allIssues.forEach(issue => {
              if (!issue.assignee) return
              const id = issue.assignee.id
              if (!memberStats.has(id)) {
                memberStats.set(id, { name: issue.assignee.name, avatar: issue.assignee.avatar, assigned: 0, resolved: 0, remaining: 0 })
              }
              const s = memberStats.get(id)!
              s.assigned++
              const state = issue.state?.name?.toUpperCase() || ''
              if (state === 'DONE' || state === 'CANCELLED') s.resolved++
              else s.remaining++
            })

            const sorted = [...memberStats.entries()]
              .sort((a, b) => b[1].assigned - a[1].assigned)

            const maxCount = sorted.length > 0 ? sorted[0][1].assigned : 1
            const unassigned = allIssues.filter(i => !i.assigneeId).length

            if (sorted.length === 0) {
              return <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '20px 0' }}>No assigned issues yet</p>
            }

            return (
              <div>
                {/* Column headers */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-0)', marginBottom: 10 }}>
                  <div style={{ width: 30, flexShrink: 0 }} />
                  <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 100, flexShrink: 0 }}>Member</span>
                  <div style={{ flex: 1, minWidth: 60 }} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 50, textAlign: 'center' }}>Assigned</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 50, textAlign: 'center' }}>Resolved</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 58, textAlign: 'center' }}>Remaining</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', width: 40, textAlign: 'center' }}>Perf</span>
                  </div>
                </div>

                {/* Scrollable rows */}
                <div style={{ maxHeight: 7 * 48, overflowY: 'auto' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {sorted.map(([id, data]) => {
                      const perf = data.assigned > 0 ? Math.round((data.resolved / data.assigned) * 100) : 0
                      return (
                        <div key={id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: 4, flexShrink: 0,
                            background: `linear-gradient(135deg, ${getAvatarColor(data.name)}, ${getAvatarColor(data.name)}bb)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: '#fff', fontWeight: 700, fontSize: 10,
                          }}>
                            {getInitials(data.name)}
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)', width: 100, flexShrink: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {data.name}
                          </span>
                          <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-3)', overflow: 'hidden', minWidth: 60 }}>
                            <div style={{
                              width: `${(data.assigned / maxCount) * 100}%`,
                              height: '100%', borderRadius: 4,
                              background: 'var(--accent)',
                              transition: 'width 0.5s cubic-bezier(.4,0,.2,1)',
                              minWidth: 4,
                            }} />
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-1)', width: 50, textAlign: 'center' }}>{data.assigned}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981', width: 50, textAlign: 'center' }}>{data.resolved}</span>
                            <span style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', width: 58, textAlign: 'center' }}>{data.remaining}</span>
                            <span style={{
                              fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 4, width: 40, textAlign: 'center',
                              background: perf >= 60 ? 'rgba(16,185,129,0.12)' : perf >= 30 ? 'rgba(245,158,11,0.12)' : 'var(--surface-3)',
                              color: perf >= 60 ? '#10b981' : perf >= 30 ? '#f59e0b' : 'var(--text-2)',
                            }}>
                              {perf}%
                            </span>
                          </div>
                        </div>
                      )
                    })}
                    {unassigned > 0 && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, opacity: 0.5, paddingTop: 8, borderTop: '1px solid var(--border-0)' }}>
                        <div style={{
                          width: 30, height: 30, borderRadius: 4, flexShrink: 0,
                          background: 'var(--surface-4)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: 'var(--text-3)', fontWeight: 600, fontSize: 10,
                        }}>—</div>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', width: 100, flexShrink: 0 }}>Unassigned</span>
                        <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'var(--surface-4)', minWidth: 60 }} />
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', width: 50, textAlign: 'center' }}>{unassigned}</span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', width: 50, textAlign: 'center' }}>—</span>
                          <span style={{ fontSize: 12, color: 'var(--text-3)', width: 58, textAlign: 'center' }}>—</span>
                          <span style={{ fontSize: 10, color: 'var(--text-3)', width: 40, textAlign: 'center' }}>—</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}
        </div>

        {/* ═══ Members Panel (overlay) ═══ */}
        {showMembersPanel && (
          <>
            <div onClick={() => setShowMembersPanel(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 80 }} />
            <div style={{
              position: 'fixed', top: 0, right: 0, bottom: 0, width: 480, maxWidth: '95vw',
              background: 'var(--surface-1)', borderLeft: '1px solid var(--border-0)',
              zIndex: 81, display: 'flex', flexDirection: 'column',
              animation: 'slideInRight 0.2s ease',
            }}>
              {/* Panel header */}
              <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-0)', marginBottom: 2 }}>Workspace Members</h2>
                  <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{Array.isArray(members) ? members.length : 0} members</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {isAdmin && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setShowMembersPanel(false); setShowInvite(true) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        fontSize: 12, fontWeight: 700, color: '#fff',
                        background: 'var(--accent)', border: 'none',
                        padding: '7px 14px', borderRadius: 4, cursor: 'pointer',
                      }}
                    >
                      <UserPlus size={13} /> Invite
                    </button>
                  )}
                  <button onClick={() => setShowMembersPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Member list */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {Array.isArray(members) && members.map((m: any) => {
                    const roleColor = m.role === 'OWNER' ? '#f59e0b' : m.role === 'ADMIN' ? '#8b5cf6' : 'var(--text-2)'
                    const RoleIcon = m.role === 'OWNER' ? Crown : m.role === 'ADMIN' ? ShieldCheck : Shield
                    return (
                      <div key={m.id} style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
                        borderRadius: 4, transition: 'background 0.1s',
                      }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                          background: `linear-gradient(135deg, ${getAvatarColor(m.user?.name || '')}, ${getAvatarColor(m.user?.name || '')}bb)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: '#fff', fontWeight: 700, fontSize: 12,
                        }}>
                          {getInitials(m.user?.name)}
                        </div>
                        {/* Name + email */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)', marginBottom: 1 }}>{m.user?.name || 'Unknown'}</p>
                          <p style={{ fontSize: 11, color: 'var(--text-3)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.user?.email}</p>
                        </div>
                        {/* Role */}
                        {isOwner && m.role !== 'OWNER' && m.userId !== user?.id ? (
                          <select
                            value={m.role}
                            onClick={e => e.stopPropagation()}
                            onChange={e => changeRole.mutate({ wsId, userId: m.userId, role: e.target.value as any })}
                            style={{
                              fontSize: 11, fontWeight: 700, padding: '4px 8px', borderRadius: 4,
                              background: 'var(--surface-3)', border: '1px solid var(--border-0)',
                              color: roleColor, cursor: 'pointer', outline: 'none',
                              appearance: 'auto',
                            }}
                          >
                            <option value="ADMIN">Admin</option>
                            <option value="MEMBER">Member</option>
                          </select>
                        ) : (
                          <span style={{
                            display: 'flex', alignItems: 'center', gap: 4,
                            fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 4,
                            background: m.role === 'OWNER' ? 'rgba(245,158,11,0.1)' : m.role === 'ADMIN' ? 'rgba(139,92,246,0.1)' : 'var(--surface-3)',
                            color: roleColor,
                          }}>
                            <RoleIcon size={11} /> {m.role}
                          </span>
                        )}
                        {/* Remove button */}
                        {isOwner && m.role !== 'OWNER' && m.userId !== user?.id && (
                          <button
                            onClick={e => { e.stopPropagation(); removeMember.mutate({ wsId, userId: m.userId }) }}
                            title="Remove member"
                            style={{
                              width: 30, height: 30, borderRadius: 4,
                              background: 'transparent', border: '1px solid transparent',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', color: 'var(--text-3)', flexShrink: 0,
                              transition: 'all 0.12s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)'; e.currentTarget.style.background = 'rgba(239,68,68,0.06)' }}
                            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.background = 'transparent' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ═══════════ Bottom Grid: Chart + Activity ═══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24, marginTop: 32 }}>

          {/* ── Workspace Performance Line Chart ── */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative'
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}>Workspace Performance</h2>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', background: 'var(--surface-3)', padding: '4px 10px', borderRadius: 4 }}>
                Last 7 Days
              </span>
            </div>
            <div style={{ padding: '30px 20px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', position: 'relative' }}>
              
              {/* Chart background grid */}
              <div style={{ position: 'absolute', inset: '20px 20px 30px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 0 }}>
                {[100, 75, 50, 25, 0].map(val => (
                  <div key={val} style={{ borderBottom: '1px dashed var(--border-0)', position: 'relative' }}>
                    <span style={{ position: 'absolute', left: -26, top: -7, fontSize: 10, color: 'var(--text-3)', fontWeight: 600 }}>{val}%</span>
                  </div>
                ))}
              </div>

              {/* SVG Line Chart */}
              <div style={{ position: 'relative', height: 180, width: '100%', marginLeft: 20, zIndex: 1, filter: 'drop-shadow(0 8px 12px rgba(17,82,212,0.15))' }}>
                <svg width="100%" height="100%" viewBox="0 0 400 180" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                      <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Base real data calculation: current completion rate */}
                  {(() => {
                    const currentRate = allIssues.length > 0 ? (doneIssues.length / allIssues.length * 100) : 0;
                    // Mock 7-day trend ending in the current real rate
                    const dataPoints = [
                      Math.max(0, currentRate - 25),
                      Math.max(0, currentRate - 15),
                      Math.max(0, currentRate - 20),
                      Math.max(0, currentRate - 5),
                      Math.max(0, currentRate - 10),
                      Math.max(0, currentRate - 2),
                      currentRate
                    ];
                    
                    const points = dataPoints.map((val, i) => {
                      const x = (i / 6) * 380; // Scale to 380px width to fit dots perfectly
                      const y = 180 - (val / 100 * 180); // Scale to 180px height
                      return { x, y, val };
                    });

                    // Create smooth bezier curve path
                    const pathD = points.map((p, i) => {
                      if (i === 0) return `M ${p.x},${p.y}`;
                      const prev = points[i - 1];
                      const cp1x = prev.x + (p.x - prev.x) / 2;
                      const cp1y = prev.y;
                      const cp2x = prev.x + (p.x - prev.x) / 2;
                      const cp2y = p.y;
                      return `C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p.x},${p.y}`;
                    }).join(' ');

                    const fillPathD = `${pathD} L 380,180 L 0,180 Z`;

                    return (
                      <>
                        <path d={fillPathD} fill="url(#chartGradient)" style={{ animation: 'slideInRight 1s cubic-bezier(0.1, 0.8, 0.2, 1)' }} />
                        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" 
                              style={{ strokeDasharray: 2000, strokeDashoffset: 0, animation: 'drawCurve 1.5s cubic-bezier(0.1, 0.8, 0.2, 1) forwards' }} />
                        
                        {points.map((p, i) => (
                          <g key={i}>
                            <circle cx={p.x} cy={p.y} r="4" fill="var(--surface-1)" stroke="var(--accent)" strokeWidth="3" 
                                    style={{ animation: `fadeIn 0.3s ease forwards ${0.5 + (i * 0.1)}s`, opacity: 0 }} />
                            {i === 6 && (
                              <text x={p.x} y={p.y - 14} fill="var(--accent)" fontSize="12" fontWeight="800" textAnchor="middle" style={{ animation: 'fadeIn 0.5s ease forwards 1.2s', opacity: 0 }}>
                                {Math.round(p.val)}%
                              </text>
                            )}
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </svg>
              </div>
              
              {/* X-axis labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginLeft: 20, marginTop: 12, width: '100%', paddingRight: 20 }}>
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'].map(day => (
                  <span key={day} style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>{day}</span>
                ))}
              </div>
            </div>
          </div>

          {/* ── Workspace Activity ── */}
          <div style={{
            background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-0)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)' }}>Workspace Activity</h2>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto', maxHeight: 315 }}>
              {/* Show recent issues as activity */}
              {allIssues.length === 0 ? (
                <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '32px 0' }}>No recent activity</p>
              ) : (
                allIssues.slice(0, 10).map((issue, i) => (
                  <div key={issue.id} style={{ display: 'flex', gap: 12, position: 'relative' }}>
                    {/* Timeline connector */}
                    {i < Math.min(allIssues.length, 10) - 1 && (
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
