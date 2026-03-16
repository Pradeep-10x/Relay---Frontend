import { apiClient } from '@/lib/api-client'
import type { Notification } from '@/types'

export const notificationService = {
  async getAll(): Promise<Notification[]> {
    const { data } = await apiClient.get('/notifications/')
    return data
  },

  async markAsRead(id: string): Promise<void> {
    await apiClient.patch(`/notifications/${id}/read`)
  },
}
