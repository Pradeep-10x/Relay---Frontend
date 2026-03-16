// ── Auth ─────────────────────────────────────────────────
export interface User {
  id: string
  name: string
  username: string
  email: string
  avatar?: string | null
  createdAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
}

// ── Workspace ────────────────────────────────────────────
export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Workspace {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  members?: { role: WorkspaceRole }[]
}

export interface WorkspaceMember {
  id: string
  userId: string
  workspaceId: string
  role: WorkspaceRole
  createdAt: string
  user: Pick<User, 'id' | 'email' | 'name' | 'avatar'>
}

export interface WorkspaceInvite {
  id: string
  workspaceId: string
  role: WorkspaceRole
  token: string
  createdBy: string
  createdAt: string
  expiresAt: string
}

// ── Project ──────────────────────────────────────────────
export type ProjectRole = 'OWNER' | 'ADMIN' | 'MEMBER'

export interface Project {
  id: string
  name: string
  key: string
  issueCounter: number
  workspaceId: string
  createdAt: string
  updatedAt: string
}

export interface ProjectMember {
  userId: string
  projectId: string
  role: ProjectRole
  joinedAt: string
  user?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
}

// ── Workflow ─────────────────────────────────────────────
export interface WorkflowState {
  id: string
  name: string
  projectId: string
  order: number
}

// ── Issue ────────────────────────────────────────────────
export type IssuePriority = 'LOW' | 'MEDIUM' | 'HIGH'

export interface Issue {
  id: string
  key: string
  title: string
  description?: string | null
  priority: IssuePriority
  version: number
  projectId: string
  reporterId: string
  assigneeId?: string | null
  stateId: string
  isDeleted: boolean
  createdAt: string
  updatedAt: string
  // included relations from board / detail endpoints
  assignee?: Pick<User, 'id' | 'name' | 'avatar'> | null
  reporter?: Pick<User, 'id' | 'name' | 'avatar'>
  state?: WorkflowState
  blockedBy?: { id: string; blockerId: string; blockedId: string; blocker?: Pick<Issue, 'id' | 'key' | 'title'> }[]
  blocking?: { id: string; blockerId: string; blockedId: string; blocked?: Pick<Issue, 'id' | 'key' | 'title'> }[]
}

export interface CreateIssuePayload {
  title: string
  description?: string
  priority: IssuePriority
  assigneeId?: string
}

export interface UpdateIssuePayload {
  id: string
  title?: string
  description?: string
  priority?: IssuePriority
  assigneeId?: string | null
}

// ── Comment ──────────────────────────────────────────────
export interface Comment {
  id: string
  issueId: string
  userId: string
  content: string
  edited: boolean
  deleted: boolean
  createdAt: string
  updatedAt: string
  user: Pick<User, 'id' | 'name' | 'email' | 'avatar'>
}

// ── Issue Activity ───────────────────────────────────────
export interface IssueActivity {
  id: string
  issueId: string
  userId: string
  field: string
  fromValue?: string | null
  toValue?: string | null
  createdAt: string
  user: Pick<User, 'id' | 'username' | 'name' | 'email' | 'avatar'>
}

// ── Notification ─────────────────────────────────────────
export type NotificationType = 'MENTION' | 'ISSUE_ASSIGNED'

export interface Notification {
  id: string
  userId: string
  type: string
  issueId?: string | null
  commentId?: string | null
  read: boolean
  createdAt: string
  issue?: { id: string; key: string; title: string } | null
  comment?: Comment | null
}

// ── Analytics ────────────────────────────────────────────
export interface ProjectAnalytics {
  totalIssues: number
  completedIssues: number
  completionRate: number
  issuesPerState: { stateId: string; _count: number }[]
  tasksPerUser: { assigneeId: string; _count: number }[]
}

// ── Kanban Board ─────────────────────────────────────────
// The backend returns { board: { "OPEN": Issue[], "In_Progress": Issue[], ... } }
export type KanbanBoard = Record<string, Issue[]>

// ── Drawing board ─────────────────────────────────────────
export interface ProjectBoard {
  id: string
  projectId: string
  strokes: Stroke[]
  updatedAt: string
}

// ── Stroke (whiteboard) ───────────────────────────────────
export interface Stroke {
  points: { x: number; y: number }[]
  color: string
  width: number
  tool: 'pen' | 'eraser'
}

// ── Filter / sort ─────────────────────────────────────────
export interface IssueFilters {
  priority?: IssuePriority[]
  assignee?: string[]
  search?: string
}
