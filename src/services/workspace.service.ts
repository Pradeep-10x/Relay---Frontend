import { apiClient } from '@/lib/api-client'
import type { Workspace, WorkspaceMember, WorkspaceInvite, WorkspaceRole } from '@/types'

export const workspaceService = {
  async getAll(): Promise<Workspace[]> {
    const { data } = await apiClient.get('/workspace/')
    return data.workspaces
  },

  async create(name: string): Promise<Workspace> {
    const { data } = await apiClient.post('/workspace/create', { name })
    return data
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/workspace/${id}/delete`)
  },

  async getMembers(wsId: string): Promise<WorkspaceMember[]> {
    const { data } = await apiClient.get(`/workspace/${wsId}/members`)
    return data.members ?? data.data ?? data
  },

  async addMember(wsId: string, email: string, role: WorkspaceRole = 'MEMBER'): Promise<void> {
    await apiClient.post(`/workspace/${wsId}/add`, { email, role })
  },

  async removeMember(wsId: string, userId: string): Promise<void> {
    await apiClient.delete(`/workspace/${wsId}/remove-member`, { data: { userId } })
  },

  async changeMemberRole(wsId: string, userId: string, role: WorkspaceRole): Promise<void> {
    await apiClient.patch(`/workspace/${wsId}/change-role`, { userId, role })
  },

  async generateInvite(wsId: string, role: WorkspaceRole = 'MEMBER'): Promise<WorkspaceInvite> {
    const { data } = await apiClient.post(`/workspace/${wsId}/invite`, { role })
    return data
  },

  async joinByInvite(inviteCode: string): Promise<void> {
    await apiClient.post(`/workspace/${inviteCode}/join`)
  },
}
