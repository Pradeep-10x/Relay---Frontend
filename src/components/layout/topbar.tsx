import { useState } from 'react'
import { Menu, Search, Plus, X, Sun, Moon } from 'lucide-react'
import { useUIStore } from '@/store/ui-store'
import NotificationDropdown from '@/components/layout/notification-dropdown'

export function Topbar() {
  const { toggleSidebar, theme, toggleTheme } = useUIStore()
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <div className="topbar">
      <button onClick={toggleSidebar} className="btn btn-ghost btn-icon"><Menu size={16} /></button>

      <div style={{ flex: 1 }} />

      {/* Search */}
      <button onClick={() => setSearchOpen(true)}
        className="btn btn-secondary btn-sm" style={{ minWidth: 180, justifyContent: 'flex-start' }}
      >
        <Search size={12} />
        <span style={{ flex: 1, textAlign: 'left', color: 'var(--text-tertiary)' }}>Search…</span>
        <kbd style={{ fontSize: 10, background: 'var(--surface-0)', padding: '1px 5px', borderRadius: 3, border: '1px solid var(--border-1)', color: 'var(--text-3)' }}>⌘K</kbd>
      </button>

      {/* Theme Toggle */}
      <button onClick={toggleTheme} className="btn btn-ghost btn-icon" title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}>
        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
      </button>

      <NotificationDropdown />

      {/* Search modal */}
      {searchOpen && (
        <div className="modal-overlay" onClick={() => setSearchOpen(false)} style={{ alignItems: 'flex-start', paddingTop: '15vh' }}>
          <div className="modal w-full max-w-xl mx-4" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderBottom: '1px solid var(--border-0)' }}>
              <Search size={15} style={{ color: 'var(--text-3)' }} />
              <input className="input" style={{ border: 'none', padding: 0, boxShadow: 'none' }} placeholder="Search issues, projects…" autoFocus />
              <button onClick={() => setSearchOpen(false)} className="btn btn-ghost btn-icon"><X size={14} /></button>
            </div>
            <div style={{ padding: 32, textAlign: 'center' }}>
              <p className="text-sm" style={{ color: 'var(--text-3)' }}>Start typing to search</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return <div className="app-shell">{children}</div>
}
