import { apiClient } from '@/lib/api-client'
import type { Project, ProjectRole } from '@/types'

export const projectService = {
  async getByWorkspace(wsId: string): Promise<Project[]> {
    const { data } = await apiClient.get(`/project/${wsId}`)
    return data
  },

  async create(wsId: string, name: string, key: string): Promise<Project> {
    const { data } = await apiClient.post(`/project/${wsId}/create`, { name, key })
    return data
  },

  async remove(projectId: string): Promise<void> {
    await apiClient.delete(`/project/${projectId}/delete`)
  },

  async addMember(projectId: string, email: string, role: ProjectRole = 'MEMBER'): Promise<void> {
    await apiClient.post(`/project/${projectId}/add-member`, { email, role })
  },
}
