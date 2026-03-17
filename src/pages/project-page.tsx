import { useState } from 'react'
import { useParams, NavLink, Routes, Route, Navigate } from 'react-router-dom'
import { KanbanSquare, PenTool, Users, BarChart3, Plus, Trash2, Settings } from 'lucide-react'
import { useProjects, useDeleteProject, useAddProjectMember, useWorkspaceMembers } from '@/hooks'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { getInitials, getAvatarColor } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { ProjectRole } from '@/types'
import KanbanBoardPage from '@/pages/kanban-board'
import WhiteboardPage from '@/pages/whiteboard'
import AnalyticsPage from '@/pages/analytics'
import CreateIssueModal from '@/components/issue/create-issue-modal'

function ProjectMembersTab() {
  const { projectId = '' } = useParams()
  const { activeWorkspaceId } = useUIStore()
  const { data: members = [] } = useWorkspaceMembers(activeWorkspaceId || '')
  const addMember = useAddProjectMember()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<ProjectRole>('MEMBER')

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    addMember.mutate({ projectId, email, role }, { onSuccess: () => setEmail('') })
  }

  return (
    <div className="max-w-2xl mx-auto px-6 py-6">
      <h3 className="text-sm font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Project Members</h3>

      {/* Add member */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input className="input flex-1" placeholder="Email address" value={email} onChange={e => setEmail(e.target.value)} type="email" />
        <select className="input w-28" value={role} onChange={e => setRole(e.target.value as ProjectRole)}>
          <option value="MEMBER">Member</option>
          <option value="ADMIN">Admin</option>
        </select>
        <button type="submit" disabled={addMember.isPending} className="btn btn-primary">
          <Plus size={13} /> Add
        </button>
      </form>

      {/* Member list from workspace members */}
      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Workspace Role</th>
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm" style={{ backgroundColor: getAvatarColor(m.user?.name || '') }}>{getInitials(m.user?.name)}</div>
                    <span className="text-sm font-medium">{m.user?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.user?.email}</span></td>
                <td><span className="badge status-todo">{m.role}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default function ProjectPage() {
  const { projectId = '', workspaceId = '' } = useParams()
  const { data: projects = [] } = useProjects(workspaceId)
  const project = projects.find(p => p.id === projectId)
  const deleteProject = useDeleteProject()
  const { user } = useAuthStore()
  const [showCreateIssue, setShowCreateIssue] = useState(false)

  const tabs = [
    { path: 'board', icon: KanbanSquare, label: 'Board' },
    { path: 'whiteboard', icon: PenTool, label: 'Whiteboard' },
    { path: 'members', icon: Users, label: 'Members' },
    { path: 'analytics', icon: BarChart3, label: 'Analytics' },
  ]

  const basePath = `/workspace/${workspaceId}/project/${projectId}`

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Project header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 24px',
        borderBottom: '1px solid var(--border-0)',
        background: 'var(--surface-0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: 'var(--accent)', color: '#fff',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 800,
          }}>
            {project?.key?.slice(0,2) || '??'}
          </div>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-0)', margin: 0 }}>{project?.name || 'Project'}</h2>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.02em' }}>{project?.key}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowCreateIssue(true)} className="btn btn-primary btn-sm"><Plus size={13} /> New Issue</button>
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        display: 'flex', gap: 4,
        padding: '0 24px',
        borderBottom: '1px solid var(--border-0)',
        background: 'var(--surface-0)',
      }}>
        {tabs.map(t => (
          <NavLink key={t.path} to={`${basePath}/${t.path}`}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            style={({ isActive }) => ({
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '12px 16px',
              fontSize: 14, fontWeight: 600,
              color: isActive ? 'var(--text-0)' : 'var(--text-3)',
              borderBottom: isActive ? '2px solid var(--accent)' : '2px solid transparent',
              textDecoration: 'none',
              transition: 'all 0.15s ease',
            })}
          >
            <t.icon size={16} /> {t.label}
          </NavLink>
        ))}
      </div>

      {/* Tab content */}
      <Routes>
        <Route index element={<Navigate to="board" replace />} />
        <Route path="board" element={<KanbanBoardPage />} />
        <Route path="whiteboard" element={<WhiteboardPage />} />
        <Route path="members" element={<ProjectMembersTab />} />
        <Route path="analytics" element={<AnalyticsPage />} />
      </Routes>

      {showCreateIssue && <CreateIssueModal projectId={projectId} onClose={() => setShowCreateIssue(false)} />}
    </div>
  )
}
