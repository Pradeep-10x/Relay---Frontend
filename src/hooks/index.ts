import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { authService } from '@/services/auth.service'
import { workspaceService } from '@/services/workspace.service'
import { projectService } from '@/services/project.service'
import { issueService } from '@/services/issue.service'
import { commentService } from '@/services/comment.service'
import { notificationService } from '@/services/notification.service'
import { userService } from '@/services/user.service'
import { boardService } from '@/services/board.service'
import { useAuthStore } from '@/store/auth-store'
import { QUERY_KEYS } from '@/lib/query-keys'
import type { CreateIssuePayload, IssuePriority, WorkspaceRole, ProjectRole } from '@/types'

// ── Auth ─────────────────────────────────────────────────

export function useLogin() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; password: string }) => authService.login(data),
    onSuccess: ({ user, token }) => { setAuth(user, token); toast.success('Welcome back!'); navigate('/onboarding') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Invalid credentials'),
  })
}

export function useRegister() {
  const { setAuth } = useAuthStore()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (data: { email: string; password: string; name: string; username: string }) => authService.register(data),
    onSuccess: ({ user, token }) => { setAuth(user, token); toast.success('Account created!'); navigate('/onboarding') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Registration failed'),
  })
}

export function useLogout() {
  const { clearAuth } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => { clearAuth(); qc.clear(); navigate('/login') },
  })
}

export function useMe() {
  return useQuery({
    queryKey: QUERY_KEYS.ME,
    queryFn: () => authService.me(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })
}

// ── Workspaces ───────────────────────────────────────────

export function useWorkspaces() {
  return useQuery({
    queryKey: QUERY_KEYS.WORKSPACES,
    queryFn: () => workspaceService.getAll(),
    staleTime: 60 * 1000,
  })
}

export function useCreateWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (name: string) => workspaceService.create(name),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES }); toast.success('Workspace created!') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useDeleteWorkspace() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (wsId: string) => workspaceService.remove(wsId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES }); toast.success('Workspace deleted') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useWorkspaceMembers(wsId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.WORKSPACE_MEMBERS(wsId),
    queryFn: () => workspaceService.getMembers(wsId),
    enabled: !!wsId,
    staleTime: 60 * 1000,
  })
}

export function useAddWorkspaceMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { wsId: string; email: string; role: WorkspaceRole }) => workspaceService.addMember(data.wsId, data.email, data.role),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE_MEMBERS(v.wsId) }); toast.success('Member added!') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useRemoveWorkspaceMember() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { wsId: string; userId: string }) => workspaceService.removeMember(data.wsId, data.userId),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACE_MEMBERS(v.wsId) }); toast.success('Member removed') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useGenerateInvite() {
  return useMutation({
    mutationFn: (data: { wsId: string; role?: WorkspaceRole }) => workspaceService.generateInvite(data.wsId, data.role),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useJoinWorkspace() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  return useMutation({
    mutationFn: (code: string) => workspaceService.joinByInvite(code),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.WORKSPACES }); toast.success('Joined workspace!'); navigate('/onboarding') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed to join'),
  })
}

// ── Projects ─────────────────────────────────────────────

export function useProjects(wsId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.PROJECTS(wsId),
    queryFn: () => projectService.getByWorkspace(wsId),
    enabled: !!wsId,
    staleTime: 60 * 1000,
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { wsId: string; name: string; key: string }) => projectService.create(data.wsId, data.name, data.key),
    onSuccess: (_d, v) => { qc.invalidateQueries({ queryKey: QUERY_KEYS.PROJECTS(v.wsId) }); toast.success('Project created!') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (projectId: string) => projectService.remove(projectId),
    onSuccess: () => { qc.invalidateQueries(); toast.success('Project deleted') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useAddProjectMember() {
  return useMutation({
    mutationFn: (data: { projectId: string; email: string; role: ProjectRole }) => projectService.addMember(data.projectId, data.email),
    onSuccess: () => toast.success('Member added to project!'),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

// ── Issues ───────────────────────────────────────────────

export function useCreateIssue(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: CreateIssuePayload) => issueService.create(projectId, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.KANBAN(projectId) }); toast.success('Issue created!') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useUpdateIssue(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { id: string; title?: string; description?: string; priority?: IssuePriority; assigneeId?: string | null }) => { const { id, ...rest } = data; return issueService.update(id, rest as any) },
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.KANBAN(projectId) }); toast.success('Issue updated') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useUpdateIssueState(projectId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { issueId: string; stateId: string }) => issueService.updateState(data.issueId, data.stateId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.KANBAN(projectId) }); toast.success('State updated') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useIssueActivity(issueId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.ISSUE_ACTIVITY(issueId),
    queryFn: () => issueService.getActivity(issueId),
    enabled: !!issueId,
    staleTime: 30 * 1000,
  })
}

// ── Comments ─────────────────────────────────────────────

export function useComments(issueId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.COMMENTS(issueId),
    queryFn: () => commentService.getByIssue(issueId),
    enabled: !!issueId,
    staleTime: 30 * 1000,
  })
}

export function useCreateComment(issueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (content: string) => commentService.create(issueId, content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) }); toast.success('Comment added') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useEditComment(issueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (data: { commentId: string; content: string }) => commentService.edit(data.commentId, data.content),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) }) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useDeleteComment(issueId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (commentId: string) => commentService.remove(commentId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: QUERY_KEYS.COMMENTS(issueId) }) },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

// ── Notifications ────────────────────────────────────────

export function useNotifications() {
  return useQuery({
    queryKey: QUERY_KEYS.NOTIFICATIONS,
    queryFn: () => notificationService.getAll(),
    staleTime: 20 * 1000,
    refetchInterval: 30 * 1000,
  })
}

export function useMarkNotificationRead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => notificationService.markAsRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEYS.NOTIFICATIONS }),
  })
}

// ── User Profile ─────────────────────────────────────────

export function useUpdateProfile() {
  const { setUser, user } = useAuthStore()
  return useMutation({
    mutationFn: (data: { name: string; username: string }) => userService.updateProfile(data),
    onSuccess: (_d, v) => { if (user) setUser({ ...user, name: v.name, username: v.username }); toast.success('Profile updated') },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

export function useChangePassword() {
  return useMutation({
    mutationFn: (data: { oldPassword: string; newPassword: string }) => userService.changePassword(data),
    onSuccess: () => toast.success('Password changed'),
    onError: (err: any) => toast.error(err.response?.data?.message || 'Failed'),
  })
}

// ── Board / Analytics ────────────────────────────────────

export function useKanbanBoard(projectId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.KANBAN(projectId),
    queryFn: () => boardService.getKanban(projectId),
    enabled: !!projectId,
    staleTime: 30 * 1000,
  })
}

export function useWhiteboard(projectId: string) {
  return useQuery({
    queryKey: ['whiteboard', projectId],
    queryFn: () => boardService.getWhiteboard(projectId),
    enabled: !!projectId,
  })
}

export function useProjectAnalytics(projectId: string) {
  return useQuery({
    queryKey: ['analytics', projectId],
    queryFn: () => boardService.getAnalytics(projectId),
    enabled: !!projectId,
    staleTime: 60 * 1000,
  })
}
