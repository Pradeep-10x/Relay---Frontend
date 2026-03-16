import { Bell, Check, MessageSquare, UserPlus } from 'lucide-react'
import { useNotifications, useMarkNotificationRead } from '@/hooks'
import { formatRelative } from '@/lib/utils'

export default function NotificationsPage() {
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()

  const unread = notifications.filter((n) => !n.read)
  const read = notifications.filter((n) => n.read)

  if (isLoading) {
    return <div className="flex-1 p-6 space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-[#12141a] rounded-xl animate-pulse" />)}</div>
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-lg font-bold text-white mb-6 tracking-tight">Notifications</h2>

      {notifications.length === 0 ? (
        <div className="bg-[#12141a] border border-[#1e2028] rounded-xl p-10 text-center">
          <Bell size={24} className="text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-zinc-400">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-6">
          {unread.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Unread ({unread.length})</h3>
              <div className="space-y-2">
                {unread.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => markRead.mutate(n.id)}
                    className="flex items-start gap-3 p-3.5 bg-[#12141a] border border-cyan-500/20 rounded-xl cursor-pointer hover:bg-[#1a1c24] transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {n.type === 'MENTION' ? <MessageSquare size={14} className="text-cyan-400" /> : <UserPlus size={14} className="text-cyan-400" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-200">
                        {n.type === 'MENTION' ? 'You were mentioned' : 'You were assigned'}
                        {n.issue && <span className="font-mono text-cyan-400 ml-1">{n.issue.key}</span>}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{formatRelative(n.createdAt)}</p>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-cyan-400 mt-2 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {read.length > 0 && (
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Earlier</h3>
              <div className="space-y-2">
                {read.map((n) => (
                  <div key={n.id} className="flex items-start gap-3 p-3.5 bg-[#12141a] border border-[#1e2028] rounded-xl">
                    <div className="w-8 h-8 rounded-full bg-[#1a1c24] flex items-center justify-center flex-shrink-0 mt-0.5">
                      {n.type === 'MENTION' ? <MessageSquare size={14} className="text-zinc-500" /> : <UserPlus size={14} className="text-zinc-500" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-zinc-400">
                        {n.type === 'MENTION' ? 'You were mentioned' : 'You were assigned'}
                        {n.issue && <span className="font-mono text-zinc-500 ml-1">{n.issue.key}</span>}
                      </p>
                      <p className="text-[11px] text-zinc-600 mt-0.5">{formatRelative(n.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
