import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layers, Plus, Link2, LogOut, Users, ChevronRight, Sparkles } from 'lucide-react'
import { useWorkspaces, useLogout, useJoinWorkspace, useCreateWorkspace } from '@/hooks'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import toast from 'react-hot-toast'

export default function OnboardingPage() {
  const { user } = useAuthStore()
  const { setActiveWorkspaceId } = useUIStore()
  const { data: workspaces = [], isLoading } = useWorkspaces()
  const logout = useLogout()
  const joinWorkspace = useJoinWorkspace()
  const createWorkspace = useCreateWorkspace()
  const navigate = useNavigate()

  const [showJoin, setShowJoin] = useState(false)
  const [joinLink, setJoinLink] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [wsName, setWsName] = useState('')

  const handleSelect = (id: string) => {
    setActiveWorkspaceId(id)
    navigate('/dashboard')
  }

  const handleJoin = () => {
    if (!joinLink.trim()) return
    let code = joinLink.trim()
    const m = code.match(/\/join\/([a-zA-Z0-9-]+)/)
    if (m) code = m[1]
    joinWorkspace.mutate(code)
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    if (!wsName.trim()) return
    createWorkspace.mutate(wsName, {
      onSuccess: () => { setWsName(''); setShowCreate(false) },
    })
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Workspace initial colors — intentional palette
  const WS_COLORS = ['var(--accent)', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444']

  return (
    <div className="onboarding-page">
      {/* Top bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 24px', borderBottom: '1px solid var(--border-0)', background: 'var(--surface-1)', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="logo-mark" style={{ width: 30, height: 30, background: 'var(--accent)', borderRadius: 'var(--radius-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: 0 }}>
            <Layers size={14} color="#fff" />
          </div>
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '-0.02em' }}>Relay</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{user?.name}</span>
          <button onClick={() => logout.mutate()} className="btn btn-ghost btn-icon" title="Sign out"><LogOut size={14} /></button>
        </div>
      </div>

      {/* Content */}
      <div style={{ width: '100%', maxWidth: 520, paddingTop: 16 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <h1>{greeting}, {user?.name?.split(' ')[0]} 👋</h1>
          <p className="subtitle">Select a workspace to continue, or create a new one.</p>
        </div>

        {/* Workspace list card */}
        <div className="card" style={{ overflow: 'hidden', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid var(--border-0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Users size={13} style={{ color: 'var(--text-3)' }} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Workspaces</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{workspaces.length}</span>
          </div>

          <div style={{ maxHeight: 300, overflowY: 'auto' }}>
            {isLoading ? (
              <div style={{ padding: 20 }}>
                {[1, 2].map(i => <div key={i} className="skeleton" style={{ height: 48, marginBottom: 8, borderRadius: 'var(--radius-md)' }} />)}
              </div>
            ) : workspaces.length === 0 ? (
              <div className="empty-state" style={{ padding: 48 }}>
                <Sparkles size={24} />
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)' }}>No workspaces yet</p>
                <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Create one or join with an invite link.</p>
              </div>
            ) : (
              workspaces.map((ws, i) => (
                <div
                  key={ws.id}
                  onClick={() => handleSelect(ws.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', cursor: 'pointer', borderBottom: '1px solid var(--border-0)', transition: 'background 0.12s' }}
                  className="group"
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface-3)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 'var(--radius-md)', background: WS_COLORS[i % WS_COLORS.length], display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 700, fontSize: 15, flexShrink: 0 }}>
                    {ws.name[0]?.toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-0)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ws.name}</p>
                    <span style={{
                      display: 'inline-block',
                      marginTop: 3,
                      fontSize: 10,
                      fontWeight: 600,
                      padding: '1px 6px',
                      borderRadius: 'var(--radius-full)',
                      background: ws.members?.[0]?.role === 'OWNER' ? 'var(--purple-subtle)' : ws.members?.[0]?.role === 'ADMIN' ? 'var(--accent-subtle)' : 'var(--surface-4)',
                      color: ws.members?.[0]?.role === 'OWNER' ? 'var(--purple)' : ws.members?.[0]?.role === 'ADMIN' ? 'var(--accent)' : 'var(--text-2)',
                    }}>
                      {ws.members?.[0]?.role ? ws.members[0].role.charAt(0) + ws.members[0].role.slice(1).toLowerCase() : 'Member'}
                    </span>
                  </div>
                  <ChevronRight size={14} style={{ color: 'var(--text-3)' }} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary" style={{ flex: 1, padding: '10px 16px', fontSize: 13 }}>
            <Plus size={14} /> Create Workspace
          </button>
          <button onClick={() => setShowJoin(v => !v)} className="btn btn-secondary" style={{ padding: '10px 16px', fontSize: 13 }}>
            <Link2 size={14} /> Join
          </button>
        </div>

        {/* Join input */}
        {showJoin && (
          <div className="card animate-in" style={{ display: 'flex', gap: 8, padding: 12, marginTop: 8 }}>
            <input className="input" placeholder="Paste invite link or code…" value={joinLink} onChange={e => setJoinLink(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleJoin()} autoFocus style={{ flex: 1 }} />
            <button onClick={handleJoin} disabled={joinWorkspace.isPending || !joinLink.trim()} className="btn btn-primary btn-sm">
              {joinWorkspace.isPending ? '…' : 'Join'}
            </button>
          </div>
        )}

        {/* Create workspace modal */}
        {showCreate && (
          <div className="modal-overlay" onClick={() => setShowCreate(false)}>
            <div className="modal w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
              <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border-0)' }}>
                <h2 style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-0)' }}>Create Workspace</h2>
              </div>
              <form onSubmit={handleCreate} style={{ padding: 20 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--text-2)', marginBottom: 6 }}>Workspace Name</label>
                <input className="input" placeholder="e.g. Engineering Team" value={wsName} onChange={e => setWsName(e.target.value)} autoFocus required style={{ marginBottom: 16 }} />
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" onClick={() => setShowCreate(false)} className="btn btn-secondary">Cancel</button>
                  <button type="submit" disabled={createWorkspace.isPending || !wsName.trim()} className="btn btn-primary">
                    {createWorkspace.isPending ? 'Creating…' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
