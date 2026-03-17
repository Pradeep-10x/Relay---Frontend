import { useState, useEffect, useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { Plus, Flag, Search, X, Users } from 'lucide-react'
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

const PRIORITY_COLORS: Record<string, string> = {
  HIGH: '#ef4444',
  MEDIUM: '#f59e0b',
  LOW: '#6b7280',
  NONE: '#6b7280',
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
  const [filterAssigneeId, setFilterAssigneeId] = useState<string | null>(null)

  useEffect(() => {
    if (selectedIssue && board) {
      const allIssues = Object.values(board).flat() as Issue[]
      const fresh = allIssues.find(i => i.id === selectedIssue.id)
      if (fresh) setSelectedIssue(fresh)
    }
  }, [board])

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const stateIdMap = new Map<string, string>()
  if (board) {
    Object.entries(board).forEach(([stateName, issues]) => {
      if (Array.isArray(issues) && issues.length > 0) {
        stateIdMap.set(stateName, issues[0].stateId)
      }
    })
  }

  // Extract unique assignees for filter
  const uniqueAssignees = useMemo(() => {
    if (!board) return []
    const map = new Map<string, { id: string; name: string }>()
    Object.values(board).forEach(issues => {
      ;(issues as Issue[]).forEach(issue => {
        if (issue.assignee) {
          map.set(issue.assignee.id, { id: issue.assignee.id, name: issue.assignee.name })
        }
      })
    })
    return Array.from(map.values())
  }, [board])

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
      
      {/* ── Filter Toolbar ── */}
      <div style={{
        padding: '10px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'var(--surface-0)',
        flexShrink: 0,
      }}>
        <Users size={15} style={{ color: 'var(--text-3)' }} />
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>Assignee</span>
        <select
          value={filterAssigneeId || ''}
          onChange={e => setFilterAssigneeId(e.target.value || null)}
          style={{
            padding: '6px 32px 6px 12px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            border: '1px solid var(--border-0)',
            background: 'var(--surface-1)',
            color: 'var(--text-0)',
            outline: 'none',
            appearance: 'none',
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 10px center',
            transition: 'border-color 0.15s ease',
            minWidth: 160,
          }}
          onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
          onBlur={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
        >
          <option value="">All Assignees</option>
          {uniqueAssignees.map(a => (
            <option key={a.id} value={a.id}>{a.name}</option>
          ))}
        </select>
        {filterAssigneeId && (
          <button onClick={() => setFilterAssigneeId(null)} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: 'var(--text-3)', display: 'flex', alignItems: 'center',
          }}>
            <X size={14} />
          </button>
        )}
      </div>

      {/* ── Board ── */}
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
              const allIssues = issues as Issue[]
              const filteredIssues = filterAssigneeId
                ? allIssues.filter(i => i.assignee?.id === filterAssigneeId)
                : allIssues

              return (
                <div key={stateName} id={stateName} className="kanban-column">
                  {/* Column Header */}
                  <div className="kanban-column-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{
                        width: 8, height: 8, borderRadius: '50%', background: color,
                        boxShadow: `0 0 6px ${color}`,
                      }} />
                      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)' }}>
                        {stateName.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: 'var(--text-3)',
                      background: 'var(--surface-3)', padding: '2px 8px', borderRadius: 10,
                    }}>
                      {filteredIssues.length}
                    </span>
                  </div>

                  {/* Cards */}
                  <div className="kanban-cards" onDragOver={e => e.preventDefault()}>
                    {filteredIssues.map(issue => {
                      const prColor = PRIORITY_COLORS[issue.priority || 'NONE']
                      return (
                        <div key={issue.id} id={issue.id} draggable
                          onClick={() => openIssue(issue)}
                          className="issue-card"
                          style={{ borderLeftColor: prColor }}
                        >
                          {/* Title */}
                          <p style={{
                            fontSize: 13, fontWeight: 500, color: 'var(--text-0)',
                            lineHeight: 1.5, margin: '0 0 12px',
                          }}>
                            {issue.title}
                          </p>

                          {/* Footer: Key + Priority + Assignee */}
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{
                                fontSize: 10, fontWeight: 700, color: 'var(--text-3)',
                                background: 'var(--surface-2)', padding: '2px 6px',
                                borderRadius: 4, letterSpacing: '0.02em',
                              }}>
                                {issue.key}
                              </span>
                              <Flag size={12} style={{ color: prColor }} />
                            </div>
                            {issue.assignee ? (
                              <div title={issue.assignee.name} style={{
                                width: 22, height: 22, borderRadius: '50%',
                                background: 'var(--accent)', color: '#fff',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 9, fontWeight: 800,
                              }}>
                                {issue.assignee.name?.[0]?.toUpperCase()}
                              </div>
                            ) : (
                              <div style={{
                                width: 22, height: 22, borderRadius: '50%',
                                border: '1px dashed var(--border-1)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                fontSize: 10, color: 'var(--text-3)',
                              }}>
                                +
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>

          <DragOverlay>
            {draggedIssue && (
              <div style={{
                width: 320,
                background: 'var(--surface-1)',
                border: '1px solid var(--accent)',
                borderLeft: '3px solid var(--accent)',
                borderRadius: 'var(--radius-lg)',
                padding: '14px 16px',
                boxShadow: '0 16px 32px rgba(0,0,0,0.15)',
                transform: 'rotate(2deg)',
              }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-0)', lineHeight: 1.5, margin: 0 }}>
                  {draggedIssue.title}
                </p>
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
