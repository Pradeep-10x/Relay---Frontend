import { useState } from 'react'
import { X, Flag, MessageSquare, Activity, Send, Link, Trash2, User as UserIcon } from 'lucide-react'
import { useComments, useCreateComment, useIssueActivity, useUpdateIssue, useWorkspaceMembers } from '@/hooks'
import { useUIStore } from '@/store/ui-store'
import { formatRelative } from '@/lib/utils'
import type { Issue, IssuePriority } from '@/types'

interface Props {
  issue: Issue
  projectId: string
  onClose: () => void
}

export default function IssueDetailPanel({ issue, projectId, onClose }: Props) {
  const { activeWorkspaceId } = useUIStore()
  const { data: comments = [] } = useComments(issue.id)
  const { data: activity = [] } = useIssueActivity(issue.id)
  const createComment = useCreateComment(issue.id)
  const updateIssue = useUpdateIssue(projectId)
  const { data: members = [] } = useWorkspaceMembers(activeWorkspaceId || '')

  const [tab, setTab] = useState<'comments' | 'activity'>('comments')
  const [commentText, setCommentText] = useState('')

  const handleComment = (e: React.FormEvent) => {
    e.preventDefault()
    if (!commentText.trim()) return
    createComment.mutate(commentText, { onSuccess: () => setCommentText('') })
  }

  const handlePriority = (p: IssuePriority) => {
    updateIssue.mutate({ id: issue.id, priority: p })
  }

  const handleAssignee = (assigneeId: string | null) => {
    updateIssue.mutate({ id: issue.id, assigneeId })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-lg bg-[#0e1017] border-l border-[#1e2028] shadow-2xl overflow-y-auto animate-in slide-in-from-right duration-200" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="sticky top-0 bg-[#0e1017]/95 backdrop-blur-md border-b border-[#1e2028] px-5 py-3 flex items-center justify-between z-10">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">{issue.key}</span>
          </div>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-300 transition"><X size={16} /></button>
        </div>

        <div className="p-5">
          {/* Title */}
          <h2 className="text-lg font-semibold text-white mb-1">{issue.title}</h2>
          {issue.description && <p className="text-sm text-zinc-400 mb-4 leading-relaxed">{issue.description}</p>}

          {/* Meta */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Priority */}
            <div>
              <p className="text-[11px] font-medium text-zinc-500 mb-1.5">Priority</p>
              <div className="flex gap-1.5">
                {(['HIGH', 'MEDIUM', 'LOW'] as IssuePriority[]).map((p) => (
                  <button key={p} onClick={() => handlePriority(p)}
                    className={`h-7 px-2 rounded text-[11px] font-medium transition ${issue.priority === p
                      ? p === 'HIGH' ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : p === 'MEDIUM' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-zinc-500/20 text-zinc-400 border border-zinc-500/30'
                      : 'bg-[#1a1c24] text-zinc-500 border border-transparent hover:border-[#2a2d38]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Assignee */}
            <div>
              <p className="text-[11px] font-medium text-zinc-500 mb-1.5">Assignee</p>
              <select
                value={issue.assigneeId || ''}
                onChange={(e) => handleAssignee(e.target.value || null)}
                className="h-7 px-2 rounded bg-[#1a1c24] border border-[#1e2028] text-[11px] text-zinc-300 focus:outline-none w-full"
              >
                <option value="">Unassigned</option>
                {members.map((m) => (
                  <option key={m.userId} value={m.userId}>{m.user?.name || m.userId}</option>
                ))}
              </select>
            </div>

            {/* State */}
            <div>
              <p className="text-[11px] font-medium text-zinc-500 mb-1.5">State</p>
              <span className="text-[11px] text-zinc-300 bg-[#1a1c24] px-2 py-1 rounded">{issue.state?.name || '—'}</span>
            </div>

            {/* Reporter */}
            <div>
              <p className="text-[11px] font-medium text-zinc-500 mb-1.5">Reporter</p>
              <span className="text-[11px] text-zinc-300">{issue.reporter?.name || '—'}</span>
            </div>
          </div>

          <div className="border-t border-[#1e2028] my-4" />

          {/* Tabs */}
          <div className="flex gap-4 mb-4">
            {[
              { key: 'comments' as const, icon: MessageSquare, label: 'Comments' },
              { key: 'activity' as const, icon: Activity, label: 'Activity' },
            ].map(({ key, icon: Icon, label }) => (
              <button key={key} onClick={() => setTab(key)}
                className={`flex items-center gap-1.5 text-[12px] font-medium pb-1 border-b-2 transition ${tab === key ? 'text-cyan-400 border-cyan-400' : 'text-zinc-500 border-transparent hover:text-zinc-300'}`}
              >
                <Icon size={13} /> {label}
              </button>
            ))}
          </div>

          {tab === 'comments' && (
            <>
              <div className="space-y-3 mb-4 max-h-[300px] overflow-y-auto">
                {comments.length === 0 ? (
                  <p className="text-xs text-zinc-600 text-center py-4">No comments yet</p>
                ) : (
                  comments.map((c) => (
                    <div key={c.id} className="bg-[#12141a] border border-[#1e2028] rounded-lg p-3">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-semibold text-zinc-300">{c.user?.name || 'Unknown'}</span>
                        <span className="text-[10px] text-zinc-600">{formatRelative(c.createdAt)}</span>
                      </div>
                      <p className="text-[13px] text-zinc-400 leading-relaxed">{c.content}</p>
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  className="flex-1 h-9 px-3 rounded-lg bg-[#12141a] border border-[#1e2028] text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-cyan-500/30 transition"
                  placeholder="Add a comment… Use @username to mention"
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                />
                <button type="submit" disabled={createComment.isPending || !commentText.trim()} className="w-9 h-9 rounded-lg bg-cyan-600 flex items-center justify-center text-white disabled:opacity-40 transition">
                  <Send size={14} />
                </button>
              </form>
            </>
          )}

          {tab === 'activity' && (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {activity.length === 0 ? (
                <p className="text-xs text-zinc-600 text-center py-4">No activity yet</p>
              ) : (
                activity.map((a) => (
                  <div key={a.id} className="flex gap-3 py-2">
                    <div className="w-1 rounded-full bg-[#1e2028] flex-shrink-0" />
                    <div>
                      <p className="text-xs text-zinc-400">
                        <span className="font-medium text-zinc-300">{a.user?.name || 'System'}</span>
                        {' changed '}
                        <span className="font-mono text-zinc-500">{a.field}</span>
                        {a.fromValue && <> from <span className="text-zinc-500">{a.fromValue}</span></>}
                        {a.toValue && <> to <span className="text-cyan-400">{a.toValue}</span></>}
                      </p>
                      <p className="text-[10px] text-zinc-600 mt-0.5">{formatRelative(a.createdAt)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
