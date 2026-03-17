import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Menu, Sun, Moon, ChevronDown, Check } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import { useWorkspaces } from '@/hooks'
import NotificationDropdown from '@/components/layout/notification-dropdown'

export function Topbar() {
  const { toggleSidebar, theme, toggleTheme, activeWorkspaceId, setActiveWorkspaceId } = useUIStore()
  const { data: workspaces = [] } = useWorkspaces()
  const navigate = useNavigate()
  const [wsOpen, setWsOpen] = useState(false)

  const wsId = activeWorkspaceId || workspaces[0]?.id || ''
  const currentWs = workspaces.find((w) => w.id === wsId)

  useEffect(() => {
    if (workspaces.length > 0 && !activeWorkspaceId) setActiveWorkspaceId(workspaces[0].id)
  }, [workspaces, activeWorkspaceId, setActiveWorkspaceId])

  return (
    <div className="topbar">
      <button onClick={toggleSidebar} className="btn btn-ghost btn-icon"><Menu size={16} /></button>
      <div style={{ flex: 1 }} />

      {/* Theme Toggle */}
      <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <NotificationDropdown />

      {/* Workspace Switcher */}
      <div style={{ position: 'relative', marginLeft: 6 }}>
        <button
          onClick={() => setWsOpen(v => !v)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '6px 12px 6px 8px', borderRadius: 4, border: '1px solid var(--border-1)',
            background: wsOpen ? 'var(--surface-3)' : 'var(--surface-2)', cursor: 'pointer',
            transition: 'all 0.15s ease',
            color: 'var(--text-1)', fontSize: 13, fontWeight: 500,
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.borderColor = 'var(--border-2)' }}
          onMouseLeave={e => { if (!wsOpen) { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.borderColor = 'var(--border-1)' } }}
        >
          <div style={{
            width: 22, height: 22, borderRadius: 4,
            background: 'linear-gradient(135deg, var(--accent), var(--accent-hover))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fff', fontWeight: 700, fontSize: 10, flexShrink: 0,
          }}>
            {currentWs?.name?.[0]?.toUpperCase() || 'W'}
          </div>
          <span style={{ maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {currentWs?.name || 'Workspace'}
          </span>
          <ChevronDown size={12} style={{
            color: 'var(--text-3)', flexShrink: 0,
            transform: wsOpen ? 'rotate(180deg)' : 'rotate(0)',
            transition: 'transform 0.15s ease',
          }} />
        </button>

        {wsOpen && (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 50 }} onClick={() => setWsOpen(false)} />
            <div style={{
              position: 'absolute', right: 0, top: 'calc(100% + 6px)', zIndex: 60,
              minWidth: 240,
              background: 'var(--surface-2)', border: '1px solid var(--border-1)',
              borderRadius: 4, boxShadow: 'var(--shadow-xl)', padding: 6,
              animation: 'slideUp 0.12s ease',
            }}>
              <p style={{
                fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                padding: '6px 10px 6px', color: 'var(--text-3)',
              }}>
                Switch workspace
              </p>
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  onClick={() => { setActiveWorkspaceId(ws.id); setWsOpen(false); navigate(`/workspace/${ws.id}`) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                    borderRadius: 4, cursor: 'pointer', transition: 'background 0.1s',
                    background: ws.id === wsId ? 'var(--accent-subtle)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (ws.id !== wsId) e.currentTarget.style.background = 'var(--surface-3)' }}
                  onMouseLeave={e => { if (ws.id !== wsId) e.currentTarget.style.background = 'transparent' }}
                >
                  <div style={{
                    width: 24, height: 24, borderRadius: 4,
                    background: ws.id === wsId ? 'linear-gradient(135deg, var(--accent), var(--accent-hover))' : 'var(--surface-4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: ws.id === wsId ? '#fff' : 'var(--text-2)',
                    fontWeight: 700, fontSize: 10, flexShrink: 0,
                  }}>
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{
                      fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      color: ws.id === wsId ? 'var(--accent-strong)' : 'var(--text-1)',
                    }}>
                      {ws.name}
                    </p>
                  </div>
                  {ws.id === wsId && <Check size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">{children}</div>
}
