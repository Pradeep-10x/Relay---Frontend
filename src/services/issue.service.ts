import { apiClient } from '@/lib/api-client'
import type { Issue, CreateIssuePayload, UpdateIssuePayload, IssueActivity } from '@/types'

export const issueService = {
  async create(projectId: string, payload: CreateIssuePayload): Promise<Issue> {
    const { data } = await apiClient.post(`/projects/${projectId}/issues`, payload)
    return data
  },

  async update(issueId: string, payload: UpdateIssuePayload): Promise<Issue> {
    const { data } = await apiClient.patch(`/issues/${issueId}`, payload)
    return data.isssue ?? data.issue ?? data
  },

  async updateState(issueId: string, stateId: string): Promise<void> {
    await apiClient.patch(`/issues/${issueId}/state`, { targetStateId: stateId })
  },

  async addDependency(issueId: string, blockerId: string): Promise<void> {
    await apiClient.post(`/issues/${issueId}/dependencies`, { blockerId })
  },

  async removeDependency(issueId: string, blockerId: string): Promise<void> {
    await apiClient.delete(`/issues/${issueId}/dependencies/${blockerId}`)
  },

  async getActivity(issueId: string): Promise<IssueActivity[]> {
    const { data } = await apiClient.get(`/issues/${issueId}/activity`)
    return data.data ?? data
  },
}
