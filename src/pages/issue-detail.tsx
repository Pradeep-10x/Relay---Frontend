import { useState } from 'react'
import { X, Flag, ChevronDown, Plus, Unlink } from 'lucide-react'
import { useComments, useCreateComment, useEditComment, useDeleteComment, useIssueActivity, useUpdateIssue, useUpdateIssueState, useWorkspaceMembers } from '@/hooks'
import { useAuthStore } from '@/store/auth-store'
import { formatRelative, getInitials, getAvatarColor } from '@/lib/utils'
import { issueService } from '@/services/issue.service'
import toast from 'react-hot-toast'
import type { Issue, IssuePriority, Comment } from '@/types'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { QUERY_KEYS } from '@/lib/query-keys'
import React from 'react'

interface Props {
  issue: Issue
  projectId: string
  workspaceId: string
  allIssues: Issue[]
  boardStates: { id: string; name: string }[]
  onClose: () => void
}

/* ── Priority helpers ── */
const PRIORITY_STYLE: Record<string, { bg: string; color: string; icon: string }> = {
  HIGH:   { bg: 'rgba(239,68,68,0.08)',  color: '#ef4444', icon: '⬆⬆' },
  MEDIUM: { bg: 'rgba(245,158,11,0.08)', color: '#f59e0b', icon: '⬆' },
  LOW:    { bg: 'rgba(34,197,94,0.08)',   color: '#22c55e', icon: '⬇' },
}

const STATUS_STYLE: Record<string, { bg: string; color: string; dot: string }> = {
  TODO:        { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', dot: '#94a3b8' },
  IN_PROGRESS: { bg: 'rgba(59,130,246,0.12)',  color: '#3b82f6', dot: '#3b82f6' },
  IN_REVIEW:   { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', dot: '#f59e0b' },
  REVIEW:      { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', dot: '#f59e0b' },
  DONE:        { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', dot: '#10b981' },
  CANCELLED:   { bg: 'rgba(239,68,68,0.12)',   color: '#ef4444', dot: '#ef4444' },
  BACKLOG:     { bg: 'rgba(148,163,184,0.12)', color: '#94a3b8', dot: '#94a3b8' },
}

/** Error boundary to prevent blank crash */
class PanelErrorBoundary extends React.Component<{ children: React.ReactNode; onClose: () => void }, { hasError: boolean }> {
  state = { hasError: false }
  static getDerivedStateFromError() { return { hasError: true } }
  render() {
    if (this.state.hasError) {
      return (
        <>
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 79 }} onClick={this.props.onClose} />
          <div className="right-panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--text-0)', fontSize: 14, fontWeight: 600, marginBottom: 8 }}>Something went wrong</p>
              <button onClick={this.props.onClose} className="btn btn-secondary">Close</button>
            </div>
          </div>
        </>
      )
    }
    return this.props.children
  }
}

function PanelContent({ issue, projectId, workspaceId, allIssues, boardStates, onClose }: Props) {
  const commentsQuery = useComments(issue.id)
  const activityQuery = useIssueActivity(issue.id)
  const membersQuery = useWorkspaceMembers(workspaceId)
  const comments = commentsQuery.data ?? []
  const activity = activityQuery.data ?? []
  const members = membersQuery.data ?? []

  const createComment = useCreateComment(issue.id)
  const editComment = useEditComment(issue.id)
  const deleteComment = useDeleteComment(issue.id)
  const updateIssue = useUpdateIssue(projectId)
  const updateState = useUpdateIssueState(projectId)
  const { user } = useAuthStore()

  const [localPriority, setLocalPriority] = useState(issue.priority)
  const qc = useQueryClient()

  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [commentText, setCommentText] = useState('')
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null)
  const [editingText, setEditingText] = useState('')
  const [showDependencyInput, setShowDependencyInput] = useState(false)
  const [depBlockerId, setDepBlockerId] = useState('')

  const addDep = useMutation({
    mutationFn: (blockerId: string) => issueService.addDependency(issue.id, blockerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.KANBAN(projectId) }); toast.success('Dependency added'); setShowDependencyInput(false) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })

  const removeDep = useMutation({
    mutationFn: (blockerId: string) => issueService.removeDependency(issue.id, blockerId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.KANBAN(projectId) }); toast.success('Dependency removed') },
  })

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    createComment.mutate(commentText, { onSuccess: () => setCommentText('') })
  }

  const handleEditSave = (commentId: string) => {
    if (!editingText.trim()) return
    editComment.mutate({ commentId, content: editingText }, { onSuccess: () => setEditingCommentId(null) })
  }

  const isLoading = commentsQuery.isLoading || activityQuery.isLoading

  /* ── Current state style ── */
  const stateName = issue.state?.name || 'TODO'
  const stateKey = stateName.toUpperCase().replace(/\s+/g, '_')
  const ss = STATUS_STYLE[stateKey] || STATUS_STYLE.TODO
  const ps = PRIORITY_STYLE[localPriority] || PRIORITY_STYLE.MEDIUM

  return (
    <>
      {/* Backdrop */}
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 79 }} onClick={onClose} />

      {/* Panel */}
      <div className="right-panel" style={{ width: 820, maxWidth: '95vw' }}>
        {/* Slim header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 24px', borderBottom: '1px solid var(--border-0)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent)', fontFamily: 'var(--font-mono)' }}>{issue.key}</span>
          <button onClick={onClose} className="btn btn-ghost btn-icon"><X size={16} /></button>
        </div>

        {/* Body — scrollable */}
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
          <div style={{ display: 'flex', gap: 32 }}>

            {/* ═══════════════ LEFT: Main content ═══════════════ */}
            <div style={{ flex: 1, minWidth: 0 }}>

              {/* Title */}
              <h1 style={{ fontSize: 22, fontWeight: 900, color: 'var(--text-0)', letterSpacing: '-0.03em', lineHeight: 1.3, marginBottom: 20 }}>
                {issue.title}
              </h1>

              {/* Description */}
              {issue.description && (
                <section style={{ marginBottom: 28 }}>
                  <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)', marginBottom: 8 }}>Description</h3>
                  <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.75 }}>{issue.description}</p>
                </section>
              )}

              {/* ── Tabs: Comments | Activity ── */}
              <section style={{ borderTop: '1px solid var(--border-0)', paddingTop: 20 }}>
                <div style={{ display: 'flex', borderBottom: '1px solid var(--border-0)', marginBottom: 20, gap: 0 }}>
                  {(['comments', 'activity'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      style={{
                        padding: '10px 20px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        background: 'none', border: 'none',
                        borderBottom: `2px solid ${tab === t ? 'var(--accent)' : 'transparent'}`,
                        color: tab === t ? 'var(--accent)' : 'var(--text-2)',
                        textTransform: 'capitalize',
                      }}
                    >
                      {t} {t === 'comments' ? `(${comments.length})` : `(${activity.length})`}
                    </button>
                  ))}
                </div>

                {/* Comment Input — always visible in comments tab */}
                {tab === 'comments' && (
                  <div style={{ display: 'flex', gap: 12, marginBottom: 24 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', background: 'var(--accent)', flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 12,
                    }}>
                      {getInitials(user?.name)}
                    </div>
                    <div style={{ flex: 1 }}>
                      <textarea
                        className="input"
                        style={{ width: '100%', fontSize: 13, minHeight: 72, resize: 'vertical', lineHeight: 1.6 }}
                        placeholder="Add a comment..."
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 8 }}>
                        <button onClick={() => setCommentText('')} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer', padding: '6px 14px' }}>Cancel</button>
                        <button
                          onClick={handleComment as any}
                          disabled={createComment.isPending || !commentText.trim()}
                          style={{
                            fontSize: 13, fontWeight: 700, color: '#fff', background: 'var(--accent)', border: 'none', cursor: 'pointer',
                            padding: '6px 16px', borderRadius: 'var(--radius-lg)', opacity: !commentText.trim() ? 0.5 : 1,
                          }}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Content */}
                {isLoading ? (
                  <div style={{ padding: '16px 0' }}>
                    {[1,2,3].map(i => <div key={i} className="skeleton" style={{ height: 56, marginBottom: 12, borderRadius: 'var(--radius-md)' }} />)}
                  </div>
                ) : (
                  <>
                    {/* ── Comments Tab ── */}
                    {tab === 'comments' && (
                      <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                        {comments.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '28px 0' }}>No comments yet. Be the first!</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                            {comments.map((c: Comment) => (
                              <div key={c.id} style={{ display: 'flex', gap: 12 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                  background: getAvatarColor(c.user?.name || ''),
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: '#fff', fontWeight: 700, fontSize: 11,
                                }}>
                                  {getInitials(c.user?.name)}
                                </div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>{c.user?.name || 'Unknown'}</span>
                                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{formatRelative(c.createdAt)}</span>
                                  </div>
                                  {editingCommentId === c.id ? (
                                    <div>
                                      <textarea
                                        className="input"
                                        style={{ width: '100%', fontSize: 13, minHeight: 60 }}
                                        value={editingText}
                                        onChange={e => setEditingText(e.target.value)}
                                        autoFocus
                                      />
                                      <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                                        <button onClick={() => handleEditSave(c.id)} style={{ fontSize: 11, fontWeight: 700, color: '#fff', background: 'var(--accent)', border: 'none', padding: '4px 12px', borderRadius: 'var(--radius-md)', cursor: 'pointer' }}>Save</button>
                                        <button onClick={() => setEditingCommentId(null)} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <>
                                      <div style={{
                                        background: 'var(--surface-3)', padding: '10px 14px', borderRadius: 'var(--radius-lg)',
                                        fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6,
                                      }}>
                                        {c.deleted ? <em style={{ color: 'var(--text-3)' }}>[deleted]</em> : c.content}
                                      </div>
                                      {c.userId === user?.id && !c.deleted && (
                                        <div style={{ display: 'flex', gap: 12, marginTop: 6 }}>
                                          <button onClick={() => { setEditingCommentId(c.id); setEditingText(c.content) }} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', background: 'none', border: 'none', cursor: 'pointer' }}>Edit</button>
                                          <button onClick={() => deleteComment.mutate(c.id)} style={{ fontSize: 11, fontWeight: 700, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer' }}>Delete</button>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ── Activity Tab ── */}
                    {tab === 'activity' && (
                      <div style={{ maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
                        {activity.length === 0 ? (
                          <p style={{ fontSize: 13, color: 'var(--text-3)', textAlign: 'center', padding: '28px 0' }}>No activity yet</p>
                        ) : (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                            {activity.map((a: any) => (
                              <div key={a.id} style={{ display: 'flex', gap: 12 }}>
                                <div style={{
                                  width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                                  background: 'var(--surface-3)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  color: 'var(--text-2)', fontSize: 16,
                                }}>
                                  {a.user?.name ? getInitials(a.user.name) : '⚙'}
                                </div>
                                <div style={{ flex: 1, paddingTop: 2 }}>
                                  <p style={{ fontSize: 13, color: 'var(--text-1)', lineHeight: 1.6 }}>
                                    <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>{a.user?.name || 'System'}</span>
                                    {' changed '}
                                    <span style={{ fontWeight: 600, color: 'var(--text-1)' }}>{a.field}</span>
                                    {a.fromValue && (
                                      <>
                                        {' from '}
                                        <span style={{
                                          display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                          background: 'var(--surface-3)', color: 'var(--text-1)',
                                        }}>
                                          {a.fromValue}
                                        </span>
                                      </>
                                    )}
                                    {a.toValue && (
                                      <>
                                        {' to '}
                                        <span style={{
                                          display: 'inline-block', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 700,
                                          background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
                                        }}>
                                          {a.toValue}
                                        </span>
                                      </>
                                    )}
                                  </p>
                                  <p style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>{formatRelative(a.createdAt)}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* ═══════════════ RIGHT: Details Sidebar ═══════════════ */}
            <aside style={{
              width: 260, flexShrink: 0,
              background: 'var(--surface-1)', border: '1px solid var(--border-0)', borderRadius: 'var(--radius-xl)',
              padding: 20, alignSelf: 'flex-start',
            }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 20 }}>Details</h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

                {/* Status */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Status</label>
                  {boardStates.length > 0 ? (
                    <div style={{ position: 'relative' }}>
                      <select
                        className="input"
                        style={{
                          fontSize: 13, fontWeight: 700, width: '100%', appearance: 'none',
                          background: ss.bg, color: ss.color, border: 'none',
                          borderRadius: 'var(--radius-lg)', padding: '8px 32px 8px 28px', cursor: 'pointer',
                        }}
                        value={issue.state?.id || ''}
                        onChange={e => {
                          if (e.target.value && e.target.value !== issue.state?.id) {
                            updateState.mutate({ issueId: issue.id, stateId: e.target.value })
                          }
                        }}
                      >
                        {!issue.state?.id && <option value="">—</option>}
                        {boardStates.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                      <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', width: 7, height: 7, borderRadius: '50%', background: ss.dot }} />
                      <ChevronDown size={14} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: ss.color, pointerEvents: 'none' }} />
                    </div>
                  ) : (
                    <span style={{ fontSize: 13, fontWeight: 700, color: ss.color }}>{stateName}</span>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>Priority</label>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {(['HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]).map(p => {
                      const pst = PRIORITY_STYLE[p] || PRIORITY_STYLE.MEDIUM
                      const active = localPriority === p
                      return (
                        <button
                          key={p}
                          onClick={() => { setLocalPriority(p); updateIssue.mutate({ id: issue.id, priority: p }) }}
                          style={{
                            fontSize: 11, fontWeight: 700, padding: '6px 10px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
                            border: active ? `1.5px solid ${pst.color}` : '1.5px solid var(--border-0)',
                            background: active ? pst.bg : 'transparent',
                            color: active ? pst.color : 'var(--text-2)',
                            transition: 'all 0.12s',
                          }}
                        >
                          {pst.icon} {p}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-0)' }} />

                {/* Assignee */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Assignee</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: issue.assignee?.name ? getAvatarColor(issue.assignee.name) : 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                    }}>
                      {issue.assignee?.name ? getInitials(issue.assignee.name) : '?'}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <select
                        className="input"
                        style={{ fontSize: 12, fontWeight: 600, border: 'none', background: 'transparent', padding: 0, width: '100%', cursor: 'pointer' }}
                        value={issue.assigneeId || ''}
                        onChange={e => {
                          const val = e.target.value
                          updateIssue.mutate({ id: issue.id, assigneeId: val === '' ? null : val })
                        }}
                      >
                        <option value="">Unassigned</option>
                        {Array.isArray(members) && members.map(m => <option key={m.userId} value={m.userId}>{m.user?.name || m.userId}</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Reporter */}
                <div>
                  <label style={{ display: 'block', fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Reporter</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                      background: issue.reporter?.name ? getAvatarColor(issue.reporter.name) : 'var(--surface-3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: '#fff', fontSize: 10, fontWeight: 700,
                    }}>
                      {issue.reporter?.name ? getInitials(issue.reporter.name) : '?'}
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>{issue.reporter?.name || '—'}</span>
                  </div>
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-0)' }} />

                {/* Dependencies */}
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                    <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Dependencies</label>
                    <button onClick={() => setShowDependencyInput(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--accent)', padding: 2 }}><Plus size={14} /></button>
                  </div>

                  {showDependencyInput && (
                    <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                      <select className="input" style={{ flex: 1, fontSize: 11 }} value={depBlockerId} onChange={e => setDepBlockerId(e.target.value)}>
                        <option value="">Select issue…</option>
                        {allIssues.filter(i => i.id !== issue.id).map(i => <option key={i.id} value={i.id}>{i.key} — {i.title}</option>)}
                      </select>
                      <button onClick={() => depBlockerId && addDep.mutate(depBlockerId)} disabled={!depBlockerId} style={{ fontSize: 11, fontWeight: 700, background: 'var(--accent)', color: '#fff', border: 'none', borderRadius: 'var(--radius-md)', padding: '4px 10px', cursor: 'pointer' }}>Add</button>
                    </div>
                  )}

                  {issue.blockedBy && issue.blockedBy.length > 0 && (
                    <div style={{ marginBottom: 6 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', marginBottom: 4 }}>Blocked by:</p>
                      {issue.blockedBy.map(d => (
                        <div key={d.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '3px 0' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{d.blocker?.key || d.blockerId}</span>
                          <button onClick={() => removeDep.mutate(d.blockerId)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}><Unlink size={11} /></button>
                        </div>
                      ))}
                    </div>
                  )}

                  {issue.blocking && issue.blocking.length > 0 && (
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>Blocking:</p>
                      {issue.blocking.map(d => (
                        <div key={d.id} style={{ padding: '3px 0' }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-1)', fontFamily: 'var(--font-mono)' }}>{d.blocked?.key || d.blockedId}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {(!issue.blockedBy || issue.blockedBy.length === 0) && (!issue.blocking || issue.blocking.length === 0) && !showDependencyInput && (
                    <p style={{ fontSize: 11, color: 'var(--text-3)' }}>No dependencies</p>
                  )}
                </div>

                {/* Divider */}
                <div style={{ height: 1, background: 'var(--border-0)' }} />

                {/* Timestamps */}
                <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.8 }}>
                  <p>Created {issue.createdAt ? formatRelative(issue.createdAt) : '—'}</p>
                  <p>Updated {issue.updatedAt ? formatRelative(issue.updatedAt) : '—'}</p>
                </div>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </>
  )
}

export default function IssueDetailPanel(props: Props) {
  return (
    <PanelErrorBoundary onClose={props.onClose}>
      <PanelContent {...props} />
    </PanelErrorBoundary>
  )
}
