import { apiClient } from '@/lib/api-client'
import type { Comment } from '@/types'

export const commentService = {
  async getByIssue(issueId: string): Promise<Comment[]> {
    const { data } = await apiClient.get(`/issues/${issueId}/comments`)
    return data.data ?? data
  },

  async create(issueId: string, content: string): Promise<Comment> {
    const { data } = await apiClient.post(`/issues/${issueId}/comment`, { issueId, content })
    return data.data ?? data
  },

  async edit(commentId: string, content: string): Promise<Comment> {
    const { data } = await apiClient.patch(`/comments/${commentId}`, { content })
    return data.data ?? data
  },

  async remove(commentId: string): Promise<void> {
    await apiClient.delete(`/comments/${commentId}`)
  },
}
