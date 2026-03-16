import { apiClient } from '@/lib/api-client'
import type { KanbanBoard, ProjectBoard, ProjectAnalytics } from '@/types'

export const boardService = {
  // Kanban board (issues grouped by state) + workflow states
  async getKanban(projectId: string): Promise<{ board: KanbanBoard; states: { id: string; name: string }[] }> {
    const { data } = await apiClient.get(`/projects/${projectId}/kanban`)
    // Handle both old shape (just board) and new shape ({ board, states })
    if (data.board) return data
    return { board: data, states: [] }
  },

  // Whiteboard (strokes)
  async getWhiteboard(projectId: string): Promise<ProjectBoard | null> {
    const { data } = await apiClient.get(`/projects/${projectId}/board`)
    return data.board
  },

  // Analytics
  async getAnalytics(projectId: string): Promise<ProjectAnalytics> {
    const { data } = await apiClient.get(`/projects/${projectId}/analytics`)
    return data
  },
}
