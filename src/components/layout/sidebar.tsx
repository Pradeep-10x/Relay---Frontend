import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { LayoutDashboard, KanbanSquare, BarChart3, Bell, Settings, ChevronDown, ChevronRight, LogOut, PenTool, Users, Home } from 'lucide-react'
import { useProjects, useWorkspaces, useLogout } from '@/hooks'
import { useUIStore } from '@/store/ui-store'
import { useAuthStore } from '@/store/auth-store'
import { getInitials, getAvatarColor } from '@/lib/utils'

export default function Sidebar() {
  const { sidebarCollapsed, activeWorkspaceId, setActiveWorkspaceId } = useUIStore()
  const { user } = useAuthStore()
  const { data: workspaces = [] } = useWorkspaces()
  const wsId = activeWorkspaceId || workspaces[0]?.id || ''
  const { data: projects = [] } = useProjects(wsId)
  const logout = useLogout()

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) setActiveWorkspaceId(workspaces[0].id)
  }, [workspaces, activeWorkspaceId, setActiveWorkspaceId])

  const toggleProject = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  if (sidebarCollapsed) {
    return (
      <div className="sidebar collapsed" style={{ display: 'flex', alignItems: 'center', flexDirection: 'column', paddingTop: 16, gap: 8 }}>
        <div style={{
          width: 30, height: 30, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          overflow: 'hidden',
        }}>
          <img src="/logo.svg" alt="Relay" style={{ width: 30, height: 30, objectFit: 'cover' }} />
        </div>
      </div>
    )
  }

  return (
    <div className="sidebar">
      {/* ── Brand ── */}
      <div style={{
        padding: '18px 16px 14px',
        borderBottom: '1px solid var(--border-0)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 30, height: 30, borderRadius: 4,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            overflow: 'hidden', flexShrink: 0,
          }}>
            <img src="/logo.svg" alt="Relay" style={{ width: 30, height: 30, objectFit: 'cover' }} />
          </div>
          <span style={{
            fontSize: 16, fontWeight: 800, color: 'var(--text-0)',
            letterSpacing: '-0.03em', fontFamily: 'var(--font-display)',
          }}>
            Relay
          </span>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px', display: 'flex', flexDirection: 'column', gap: 1 }}>
        {/* Section: General */}
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 10px 6px', color: 'var(--text-3)' }}>General</p>

        <NavLink to="/dashboard" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Home size={15} /> Dashboard
        </NavLink>
        <NavLink to={`/workspace/${wsId}`} end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <LayoutDashboard size={15} /> Workspace
        </NavLink>
        <NavLink to="/notifications" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Bell size={15} /> Notifications
        </NavLink>
        <NavLink to="/settings" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
          <Settings size={15} /> Settings
        </NavLink>

        {/* Divider */}
        <div style={{ height: 1, background: 'var(--border-0)', margin: '8px 10px' }} />

        {/* Section: Projects */}
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', padding: '8px 10px 6px', color: 'var(--text-3)' }}>Projects</p>

        {projects.map((project, i) => {
          const isExpanded = expanded.has(project.id)
          const basePath = `/workspace/${wsId}/project/${project.id}`
          const accentColors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899']
          const dotColor = accentColors[i % accentColors.length]

          return (
            <div key={project.id}>
              <div
                onClick={() => toggleProject(project.id)}
                className="nav-item"
                style={{ cursor: 'pointer', gap: 6 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', width: 14, justifyContent: 'center', flexShrink: 0 }}>
                  {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </span>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: dotColor, flexShrink: 0 }} />
                <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 13 }}>{project.name}</span>
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-3)', flexShrink: 0 }}>{project.key}</span>
              </div>

              {isExpanded && (
                <div style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 1, marginTop: 1, marginBottom: 2 }}>
                  <NavLink to={`${basePath}/board`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: 12, padding: '5px 10px' }}>
                    <KanbanSquare size={13} /> Board
                  </NavLink>
                  <NavLink to={`${basePath}/whiteboard`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: 12, padding: '5px 10px' }}>
                    <PenTool size={13} /> Whiteboard
                  </NavLink>
                  <NavLink to={`${basePath}/members`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: 12, padding: '5px 10px' }}>
                    <Users size={13} /> Members
                  </NavLink>
                  <NavLink to={`${basePath}/analytics`} className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`} style={{ fontSize: 12, padding: '5px 10px' }}>
                    <BarChart3 size={13} /> Analytics
                  </NavLink>
                </div>
              )}
            </div>
          )
        })}

        {projects.length === 0 && (
          <p style={{ fontSize: 11, color: 'var(--text-3)', padding: '4px 10px', fontStyle: 'italic' }}>No projects yet</p>
        )}
      </nav>

      {/* ── User Footer ── */}
      <div style={{
        padding: '10px 12px', borderTop: '1px solid var(--border-0)',
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '6px 6px', borderRadius: 4,
          transition: 'background 0.1s',
        }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="" style={{ width: 30, height: 30, borderRadius: 4, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{
              width: 30, height: 30, borderRadius: 4, flexShrink: 0,
              background: `linear-gradient(135deg, ${getAvatarColor(user?.name || '')}, ${getAvatarColor(user?.name || '')}dd)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 600, fontSize: 11,
            }}>
              {getInitials(user?.name)}
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{
              fontSize: 13, fontWeight: 600, color: 'var(--text-0)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.3,
            }}>{user?.name}</p>
            <p style={{
              fontSize: 11, color: 'var(--text-3)',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', lineHeight: 1.2,
            }}>{user?.email}</p>
          </div>
          <button
            onClick={() => logout.mutate()}
            title="Sign out"
            style={{
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)',
              padding: 6, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'color 0.12s, background 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-subtle)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.background = 'none' }}
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}
