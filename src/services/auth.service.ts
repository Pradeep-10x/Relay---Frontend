import { apiClient } from '@/lib/api-client'
import type { User } from '@/types'

interface LoginPayload { email: string; password: string }
interface RegisterPayload { email: string; password: string; name: string; username: string }

export const authService = {
  async login(data: LoginPayload): Promise<{ user: User; token: string }> {
    const res = await apiClient.post('/auth/login', data)
    const token = res.data.accessToken
    localStorage.setItem('relay-token', token)
    // Fetch full user profile — /auth/me returns { user: {...} }
    const meRes = await apiClient.get('/auth/me')
    const me = meRes.data.user ?? meRes.data
    const user: User = { id: me.id, name: me.name, email: me.email, username: me.username || '', avatar: me.avatar || null, createdAt: me.createdAt || '' }
    return { user, token }
  },

  async register(data: RegisterPayload): Promise<{ user: User; token: string }> {
    const res = await apiClient.post('/auth/register', data)
    const { user, accessToken } = res.data
    localStorage.setItem('relay-token', accessToken)
    return { user, token: accessToken }
  },

  async me(): Promise<User> {
    const { data } = await apiClient.get('/auth/me')
    const u = data.user ?? data
    return { id: u.id, name: u.name, email: u.email, username: u.username || '', avatar: u.avatar || null, createdAt: u.createdAt || '' }
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout')
    localStorage.removeItem('relay-token')
  },
}
