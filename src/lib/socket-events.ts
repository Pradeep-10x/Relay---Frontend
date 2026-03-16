import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket, connectSocket } from '@/lib/socket'
import { QUERY_KEYS } from '@/lib/query-keys'

/**
 * Hook to set up real-time Socket.IO event listeners.
 * Call this in the app layout so events are active while logged in.
 */
export function useRealtimeEvents(projectId?: string) {
  const qc = useQueryClient()

  useEffect(() => {
    connectSocket()
    const socket = getSocket()

    // Issue was updated by another user
    const onIssueUpdated = (data: { projectId: string }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.KANBAN(data.projectId) })
    }

    // New comment added
    const onNewComment = (data: { issueId: string }) => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(data.issueId) })
    }

    // New notification
    const onNotification = () => {
      qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS })
    }

    socket.on('issueUpdated', onIssueUpdated)
    socket.on('newComment', onNewComment)
    socket.on('notification', onNotification)

    return () => {
      socket.off('issueUpdated', onIssueUpdated)
      socket.off('newComment', onNewComment)
      socket.off('notification', onNotification)
    }
  }, [qc])
}
