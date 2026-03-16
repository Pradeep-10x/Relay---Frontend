import { useState } from 'react'
import { Plus, Flag } from 'lucide-react'
import { useCreateIssue, useWorkspaceMembers } from '@/hooks'
import { useUIStore } from '@/store/ui-store'
import type { IssuePriority } from '@/types'

interface Props { projectId: string; onClose: () => void }

export default function CreateIssueModal({ projectId, onClose }: Props) {
  const createIssue = useCreateIssue(projectId)
  const { activeWorkspaceId } = useUIStore()
  const { data: members = [] } = useWorkspaceMembers(activeWorkspaceId || '')

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<IssuePriority>('MEDIUM')
  const [assigneeId, setAssigneeId] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    createIssue.mutate(
      { title, description: description || undefined, priority, assigneeId: assigneeId || undefined },
      { onSuccess: () => onClose() },
    )
  }

  const priorities: { value: IssuePriority; label: string; cls: string }[] = [
    { value: 'HIGH', label: 'High', cls: 'priority-high' },
    { value: 'MEDIUM', label: 'Medium', cls: 'priority-medium' },
    { value: 'LOW', label: 'Low', cls: 'priority-low' },
  ]

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal w-full max-w-lg mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Create Issue</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Title</label>
            <input className="input" placeholder="Issue title" value={title} onChange={e => setTitle(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Description</label>
            <textarea className="input" rows={3} placeholder="Describe the issue…" value={description} onChange={e => setDescription(e.target.value)} style={{ resize: 'vertical' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Priority</label>
              <div className="flex gap-1.5">
                {priorities.map(p => (
                  <button key={p.value} type="button" onClick={() => setPriority(p.value)}
                    className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-md border transition"
                    style={{
                      borderColor: priority === p.value ? 'var(--accent-primary)' : 'var(--border-default)',
                      background: priority === p.value ? 'var(--accent-subtle)' : 'transparent',
                    }}
                  >
                    <Flag size={11} className={p.cls} /> {p.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Assignee</label>
              <select className="input" value={assigneeId} onChange={e => setAssigneeId(e.target.value)}>
                <option value="">Unassigned</option>
                {members.map(m => (
                  <option key={m.userId} value={m.userId}>{m.user?.name || m.userId}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-2">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={createIssue.isPending} className="btn btn-primary">
              <Plus size={13} /> {createIssue.isPending ? 'Creating…' : 'Create Issue'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
