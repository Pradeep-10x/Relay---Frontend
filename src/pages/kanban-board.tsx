import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, GripVertical, Flag } from 'lucide-react'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent, DragOverlay, DragStartEvent } from '@dnd-kit/core'
import { useKanbanBoard, useUpdateIssueState, useCreateIssue } from '@/hooks'
import { useUIStore } from '@/store/ui-store'
import type { Issue, KanbanBoard, IssuePriority } from '@/types'
import CreateIssueModal from '@/components/issue/create-issue-modal'
import IssueDetailPanel from '@/pages/issue-detail'

const STATE_COLORS: Record<string, string> = {
  TODO: 'var(--status-todo)',
  IN_PROGRESS: 'var(--status-inprogress)',
  IN_REVIEW: 'var(--status-inreview)',
  REVIEW: 'var(--status-inreview)',
  DONE: 'var(--status-done)',
  CANCELLED: 'var(--status-cancelled)',
  BACKLOG: 'var(--status-backlog)',
}

export default function KanbanBoardPage() {
  const { projectId = '', workspaceId = '' } = useParams()
  const { data: kanbanData, isLoading } = useKanbanBoard(projectId)
  const board = kanbanData?.board
  const boardStates = kanbanData?.states ?? []
  const updateState = useUpdateIssueState(projectId)

  const [draggedIssue, setDraggedIssue] = useState<Issue | null>(null)
  const [showCreate, setShowCreate] = useState(false)
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)

  // Keep selectedIssue in sync with latest board data after mutations
  useEffect(() => {
    if (selectedIssue && board) {
      const allIssues = Object.values(board).flat() as Issue[]
      const fresh = allIssues.find(i => i.id === selectedIssue.id)
      if (fresh) setSelectedIssue(fresh)
    }
  }, [board])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  // Map state names to state IDs from the board data
  const stateIdMap = new Map<string, string>()
  if (board) {
    Object.entries(board).forEach(([stateName, issues]) => {
      if (Array.isArray(issues) && issues.length > 0) {
        stateIdMap.set(stateName, issues[0].stateId)
      }
    })
  }

  const findIssueById = (id: string): Issue | undefined => {
    if (!board) return
    for (const issues of Object.values(board)) {
      const found = (issues as Issue[]).find(i => i.id === id)
      if (found) return found
    }
  }

  const handleDragStart = (e: DragStartEvent) => {
    const issue = findIssueById(e.active.id as string)
    if (issue) setDraggedIssue(issue)
  }

  const handleDragEnd = (e: DragEndEvent) => {
    setDraggedIssue(null)
    const { active, over } = e
    if (!over) return
    const targetState = over.id as string
    const issueId = active.id as string
    const stateId = stateIdMap.get(targetState)
    if (stateId) updateState.mutate({ issueId, stateId })
  }

  const openIssue = (issue: Issue) => {
    setSelectedIssue(issue)
  }

  if (isLoading) {
    return (
      <div className="kanban-board">
        {[1,2,3,4].map(i => <div key={i} className="kanban-column skeleton" style={{ height: '60vh' }} />)}
      </div>
    )
  }

  const columns = board ? Object.entries(board as KanbanBoard) : []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {columns.length === 0 ? (
        <div className="empty-state" style={{ flex: 1 }}>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>No issues yet</p>
          <button onClick={() => setShowCreate(true)} className="btn btn-primary btn-sm"><Plus size={13} /> Create your first issue</button>
        </div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="kanban-board">
            {columns.map(([stateName, issues]) => {
              const color = STATE_COLORS[stateName] || 'var(--status-todo)'
              const issueList = issues as Issue[]
              return (
                <div key={stateName} id={stateName} className="kanban-column">
                  <div className="kanban-column-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: color }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-primary)' }}>{stateName.replace(/_/g, ' ')}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-tertiary)' }}>{issueList.length}</span>
                  </div>
                  <div className="kanban-cards" onDragOver={e => e.preventDefault()}>
                    {issueList.map(issue => (
                      <div key={issue.id} id={issue.id} draggable
                        onClick={() => openIssue(issue)}
                        className="issue-card"
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: 10, fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>{issue.key}</span>
                          <GripVertical size={12} style={{ color: 'var(--text-disabled)', opacity: 0 }} className="group-hover:opacity-100" />
                        </div>
                        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)', lineHeight: 1.4, marginBottom: 8 }}>{issue.title}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Flag size={11} className={issue.priority === 'HIGH' ? 'priority-high' : issue.priority === 'MEDIUM' ? 'priority-medium' : 'priority-low'} />
                          {issue.assignee && (
                            <div className="avatar avatar-sm" style={{ marginLeft: 'auto', fontSize: 8 }}>{issue.assignee.name?.[0]?.toUpperCase() || '?'}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
          <DragOverlay>
            {draggedIssue && (
              <div className="issue-card" style={{ width: 280, boxShadow: 'var(--shadow-xl)', border: '2px solid var(--accent-primary)' }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>{draggedIssue.title}</p>
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {showCreate && <CreateIssueModal projectId={projectId} onClose={() => setShowCreate(false)} />}

      {selectedIssue && (
        <IssueDetailPanel
          issue={selectedIssue}
          projectId={projectId}
          workspaceId={workspaceId}
          allIssues={board ? (Object.values(board).flat() as Issue[]) : []}
          boardStates={boardStates}
          onClose={() => setSelectedIssue(null)}
        />
      )}
    </div>
  )
}
