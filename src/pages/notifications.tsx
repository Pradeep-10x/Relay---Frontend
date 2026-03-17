import { useState } from 'react'
import { Bell, Check, CheckCheck, MessageSquare, UserPlus } from 'lucide-react'
import { useNotifications, useMarkNotificationRead } from '@/hooks'
import { formatRelative } from '@/lib/utils'

import type { Notification } from '@/types'

type FilterTab = 'all' | 'unread' | 'mentions' | 'assigned'

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const [filter, setFilter] = useState<FilterTab>('all')

  const unreadCount = notifications.filter(n => !n.read).length

  const filtered = notifications.filter(n => {
    if (filter === 'unread') return !n.read
    if (filter === 'mentions') return n.type === 'MENTION'
    if (filter === 'assigned') return n.type === 'ISSUE_ASSIGNED'
    return true
  })

  const handleClick = (n: Notification) => {
    if (!n.read) markRead.mutate(n.id)
    if (n.issue) {
      // Navigate to the issue if possible
    }
  }

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: 'all', label: 'All', count: notifications.length },
    { key: 'unread', label: 'Unread', count: unreadCount },
    { key: 'mentions', label: 'Mentions' },
    { key: 'assigned', label: 'Assigned' },
  ]

  const getIcon = (type: string, isRead: boolean) => {
    const color = isRead ? 'var(--text-3)' : type === 'MENTION' ? '#3b82f6' : '#8b5cf6'
    const bg = isRead ? 'var(--surface-3)' : type === 'MENTION' ? 'rgba(59,130,246,0.1)' : 'rgba(139,92,246,0.1)'
    const Icon = type === 'MENTION' ? MessageSquare : UserPlus
    return (
      <div style={{
        width: 36, height: 36, borderRadius: 4, flexShrink: 0,
        background: bg,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={color} />
      </div>
    )
  }

  const getMessage = (n: Notification) => {
    if (n.type === 'MENTION') {
      return (
        <span>
          You were <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>mentioned</span>
          {n.issue && (
            <> in <span style={{ fontFamily: 'var(--font-mono)', color: '#3b82f6', fontWeight: 600 }}>{n.issue.key}</span></>
          )}
          {n.issue?.title && (
            <span style={{ color: 'var(--text-2)' }}> — {n.issue.title}</span>
          )}
        </span>
      )
    }
    return (
      <span>
        You were <span style={{ fontWeight: 700, color: 'var(--text-0)' }}>assigned</span>
        {n.issue && (
          <> to <span style={{ fontFamily: 'var(--font-mono)', color: '#8b5cf6', fontWeight: 600 }}>{n.issue.key}</span></>
        )}
        {n.issue?.title && (
          <span style={{ color: 'var(--text-2)' }}> — {n.issue.title}</span>
        )}
      </span>
    )
  }

  // Loading state
  if (isLoading) {
    return (
      <div style={{ flex: 1, padding: 32 }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          <div className="skeleton" style={{ width: 200, height: 28, borderRadius: 4, marginBottom: 24 }} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[1,2,3,4,5].map(i => (
              <div key={i} className="skeleton" style={{ height: 72, borderRadius: 'var(--radius-xl)' }} />
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '-0.02em' }}>
              Notifications
            </h1>
            {unreadCount > 0 && (
              <span style={{
                fontSize: 11, fontWeight: 700, padding: '2px 10px', borderRadius: 4,
                background: 'rgba(59,130,246,0.12)', color: '#3b82f6',
              }}>
                {unreadCount} new
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => {
                notifications.filter(n => !n.read).forEach(n => markRead.mutate(n.id))
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
                background: 'var(--surface-2)', border: '1px solid var(--border-0)',
                padding: '6px 14px', borderRadius: 4, cursor: 'pointer',
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface-3)'; e.currentTarget.style.color = 'var(--text-0)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--surface-2)'; e.currentTarget.style.color = 'var(--text-2)' }}
            >
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div style={{
          display: 'flex', gap: 2, marginBottom: 20,
          background: 'var(--surface-2)', padding: 3, borderRadius: 4,
          border: '1px solid var(--border-0)',
        }}>
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              style={{
                flex: 1, padding: '7px 0', fontSize: 12, fontWeight: 600,
                borderRadius: 3, border: 'none', cursor: 'pointer',
                background: filter === tab.key ? 'var(--surface-1)' : 'transparent',
                color: filter === tab.key ? 'var(--text-0)' : 'var(--text-3)',
                boxShadow: filter === tab.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
              }}
            >
              {tab.label}
              {tab.count !== undefined && tab.count > 0 && (
                <span style={{
                  fontSize: 10, fontWeight: 700,
                  padding: '1px 6px', borderRadius: 3,
                  background: filter === tab.key ? 'var(--surface-3)' : 'transparent',
                  color: filter === tab.key ? 'var(--text-1)' : 'var(--text-3)',
                }}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Notification list */}
        {filtered.length === 0 ? (
          <div style={{
            textAlign: 'center', padding: '60px 0',
            background: 'var(--surface-1)', border: '1px solid var(--border-0)',
            borderRadius: 'var(--radius-xl)',
          }}>
            <div style={{
              width: 48, height: 48, borderRadius: 4, margin: '0 auto 14px',
              background: 'var(--surface-3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Bell size={20} color="var(--text-3)" />
            </div>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', marginBottom: 4 }}>
              {filter === 'all' ? 'No notifications yet' : `No ${filter} notifications`}
            </p>
            <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {filter === 'all' ? "You're all caught up!" : 'Try a different filter'}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filtered.map(n => (
              <div
                key={n.id}
                onClick={() => handleClick(n)}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 14, padding: '14px 16px',
                  background: n.read ? 'var(--surface-1)' : 'var(--surface-2)',
                  border: `1px solid ${n.read ? 'var(--border-0)' : 'rgba(59,130,246,0.15)'}`,
                  borderRadius: 'var(--radius-xl)',
                  cursor: n.read ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  if (!n.read) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.3)'
                }}
                onMouseLeave={e => {
                  if (!n.read) e.currentTarget.style.borderColor = 'rgba(59,130,246,0.15)'
                }}
              >
                {/* Unread indicator */}
                {!n.read && (
                  <div style={{
                    position: 'absolute', top: 8, right: 8,
                    width: 7, height: 7, borderRadius: '50%',
                    background: '#3b82f6',
                  }} />
                )}

                {/* Icon */}
                {getIcon(n.type, n.read)}

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontSize: 13, color: n.read ? 'var(--text-2)' : 'var(--text-1)',
                    lineHeight: 1.5, marginBottom: 4,
                  }}>
                    {getMessage(n)}
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, color: 'var(--text-3)' }}>
                      {formatRelative(n.createdAt)}
                    </span>
                    {n.issue && (
                      <>
                        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'var(--text-3)' }} />
                        <span style={{
                          fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                          color: n.type === 'MENTION' ? '#3b82f6' : '#8b5cf6',
                          opacity: n.read ? 0.6 : 1,
                        }}>
                          {n.type === 'MENTION' ? 'Mention' : 'Assignment'}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Mark read action */}
                {!n.read && (
                  <button
                    onClick={(e) => { e.stopPropagation(); markRead.mutate(n.id) }}
                    title="Mark as read"
                    style={{
                      width: 28, height: 28, borderRadius: 4, border: '1px solid var(--border-1)',
                      background: 'var(--surface-1)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: 'var(--text-3)', flexShrink: 0, marginTop: 2,
                      transition: 'all 0.12s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#10b981'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.3)' }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-3)'; e.currentTarget.style.borderColor = 'var(--border-1)' }}
                  >
                    <Check size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
