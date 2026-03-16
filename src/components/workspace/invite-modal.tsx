import { useState } from 'react'
import { Plus, UserPlus } from 'lucide-react'
import { useAddWorkspaceMember, useGenerateInvite } from '@/hooks'
import { copyToClipboard } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { WorkspaceRole } from '@/types'

interface Props { wsId: string; onClose: () => void }

export default function InviteMemberModal({ wsId, onClose }: Props) {
  const addMember = useAddWorkspaceMember()
  const generateInvite = useGenerateInvite()
  const [mode, setMode] = useState<'email' | 'link'>('email')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<WorkspaceRole>('MEMBER')
  const [inviteLink, setInviteLink] = useState('')

  const handleInviteByEmail = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    addMember.mutate({ wsId, email, role }, { onSuccess: () => { setEmail(''); onClose() } })
  }

  const handleGenerateLink = () => {
    generateInvite.mutate({ wsId, role }, {
      onSuccess: (data) => {
        const link = `${window.location.origin}/join/${data.token}`
        setInviteLink(link)
        copyToClipboard(link)
        toast.success('Invite link copied to clipboard!')
      },
    })
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Invite Member</h2>
        </div>

        {/* Mode toggle */}
        <div className="flex gap-1 mx-5 mt-4 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)' }}>
          <button onClick={() => setMode('email')} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${mode === 'email' ? 'bg-white shadow-sm' : ''}`} style={{ color: mode === 'email' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>By Email</button>
          <button onClick={() => setMode('link')} className={`flex-1 text-xs font-medium py-1.5 rounded-md transition ${mode === 'link' ? 'bg-white shadow-sm' : ''}`} style={{ color: mode === 'link' ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>Invite Link</button>
        </div>

        <div className="p-5">
          {/* Role selector */}
          <div className="mb-4">
            <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Role</label>
            <div className="flex gap-2">
              {(['ADMIN', 'MEMBER'] as WorkspaceRole[]).map(r => (
                <button key={r} onClick={() => setRole(r)}
                  className="flex-1 text-xs font-medium py-2 rounded-lg border transition"
                  style={{
                    borderColor: role === r ? 'var(--accent-primary)' : 'var(--border-default)',
                    background: role === r ? 'var(--accent-subtle)' : 'var(--bg-primary)',
                    color: role === r ? 'var(--accent-primary)' : 'var(--text-secondary)',
                  }}
                >{r}</button>
              ))}
            </div>
          </div>

          {mode === 'email' ? (
            <form onSubmit={handleInviteByEmail}>
              <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email Address</label>
              <input className="input mb-4" placeholder="colleague@company.com" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoFocus />
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                <button type="submit" disabled={addMember.isPending} className="btn btn-primary">
                  <UserPlus size={13} /> {addMember.isPending ? 'Inviting…' : 'Send Invite'}
                </button>
              </div>
            </form>
          ) : (
            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--text-tertiary)' }}>Generate a one-time invite link that anyone can use to join this workspace.</p>
              {inviteLink ? (
                <div className="flex items-center gap-2 p-2 rounded-lg mb-4" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
                  <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{inviteLink}</span>
                  <button onClick={() => { copyToClipboard(inviteLink); toast.success('Copied!') }} className="btn btn-ghost btn-sm">Copy</button>
                </div>
              ) : null}
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={onClose} className="btn btn-secondary">Cancel</button>
                <button onClick={handleGenerateLink} disabled={generateInvite.isPending} className="btn btn-primary">
                  {generateInvite.isPending ? 'Generating…' : 'Generate Link'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
