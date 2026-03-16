import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useCreateProject } from '@/hooks'

interface Props { wsId: string; onClose: () => void }

export default function CreateProjectModal({ wsId, onClose }: Props) {
  const createProject = useCreateProject()
  const [name, setName] = useState('')
  const [key, setKey] = useState('')

  const autoKey = (n: string) => {
    setName(n)
    setKey(n.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase())
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !key.trim()) return
    createProject.mutate({ wsId, name, key: key.toUpperCase() }, { onSuccess: () => onClose() })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Create Project</h2>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Project Name</label>
            <input className="input" placeholder="e.g. Mobile App" value={name} onChange={e => autoKey(e.target.value)} autoFocus required />
          </div>
          <div>
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Project Key</label>
            <input className="input font-mono uppercase" placeholder="MOB" value={key} onChange={e => setKey(e.target.value.toUpperCase())} required maxLength={6} />
            <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>Used as prefix for issue IDs (e.g. MOB-1)</p>
          </div>
          <div className="flex gap-2 justify-end">
            <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
            <button type="submit" disabled={createProject.isPending} className="btn btn-primary">
              <Plus size={13} /> {createProject.isPending ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
