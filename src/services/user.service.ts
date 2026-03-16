import { apiClient } from '@/lib/api-client'
import type { User } from '@/types'

export const userService = {
  async getProfile(): Promise<User> {
    const { data } = await apiClient.get('/user/me')
    return data.user ?? data
  },

  async updateProfile(payload: { name?: string; username?: string }): Promise<User> {
    const { data } = await apiClient.post('/user/edit-profile', payload)
    return data
  },

  async changePassword(data: { oldPassword: string; newPassword: string }): Promise<void> {
    await apiClient.post('/user/change-password', { oldPassword: data.oldPassword, newPassword: data.newPassword })
  },

  async getAvatarUploadUrl(): Promise<{ uploadUrl: string; fileUrl: string }> {
    const { data } = await apiClient.post('/user/avatar/upload-url')
    return data
  },

  async updateAvatar(avatar: string): Promise<void> {
    await apiClient.patch('/user/avatar', { avatar })
  },
}
