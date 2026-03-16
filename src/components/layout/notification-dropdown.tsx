import { useState, useRef, useEffect } from 'react'
import { Bell, Check, MessageSquare, UserPlus, X } from 'lucide-react'
import { useNotifications, useMarkNotificationRead } from '@/hooks'
import { formatRelative } from '@/lib/utils'

export default function NotificationDropdown() {
  const { data: notifications = [] } = useNotifications()
  const markRead = useMarkNotificationRead()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const unreadCount = notifications.filter(n => !n.read).length

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className="btn btn-ghost btn-icon relative">
        <Bell size={16} />
        {unreadCount > 0 && <span className="notif-dot" />}
      </button>

      {open && (
        <div className="dropdown absolute right-0 top-full mt-2 w-[360px] max-h-[480px] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-3 py-2.5 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <span className="text-xs font-semibold" style={{ color: 'var(--text-primary)' }}>Notifications</span>
            {unreadCount > 0 && (
              <span className="badge" style={{ background: 'var(--accent-subtle)', color: 'var(--accent-primary)' }}>{unreadCount} new</span>
            )}
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="empty-state py-8">
                <Bell size={20} />
                <p className="text-xs">No notifications</p>
              </div>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div
                  key={n.id}
                  onClick={() => { if (!n.read) markRead.mutate(n.id) }}
                  className="flex items-start gap-3 px-3.5 py-3 border-b cursor-pointer transition-colors"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    background: n.read ? 'transparent' : 'var(--accent-subtle)',
                  }}
                >
                  <div className="avatar avatar-sm mt-0.5">
                    {n.type === 'MENTION' ? <MessageSquare size={10} /> : <UserPlus size={10} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs" style={{ color: 'var(--text-primary)' }}>
                      {n.type === 'MENTION' ? 'You were mentioned' : 'Issue assigned to you'}
                      {n.issue && <span className="font-mono ml-1" style={{ color: 'var(--accent-primary)' }}>{n.issue.key}</span>}
                    </p>
                    <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-tertiary)' }}>{formatRelative(n.createdAt)}</p>
                  </div>
                  {!n.read && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-primary)', marginTop: 6, flexShrink: 0 }} />}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
