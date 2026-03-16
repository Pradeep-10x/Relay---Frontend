import { useState } from 'react'
import { Camera, Copy, Link2, Trash2, User as UserIcon, Lock, Edit3, Upload } from 'lucide-react'
import { useUpdateProfile, useChangePassword, useWorkspaceMembers, useRemoveWorkspaceMember, useAddWorkspaceMember, useGenerateInvite } from '@/hooks'
import { useAuthStore } from '@/store/auth-store'
import { useUIStore } from '@/store/ui-store'
import { copyToClipboard, getInitials, getAvatarColor } from '@/lib/utils'
import { userService } from '@/services/user.service'
import toast from 'react-hot-toast'
import type { WorkspaceRole } from '@/types'

type Tab = 'profile' | 'password' | 'members'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const { activeWorkspaceId } = useUIStore()
  const [tab, setTab] = useState<Tab>('profile')

  return (
    <div className="page-content">
      <div className="max-w-2xl mx-auto px-6 py-8">
        <h2 className="text-lg font-bold mb-6" style={{ color: 'var(--text-primary)' }}>Settings</h2>

        {/* Tab bar */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: 'var(--bg-tertiary)', width: 'fit-content' }}>
          {([
            { key: 'profile' as Tab, icon: Edit3, label: 'Profile' },
            { key: 'password' as Tab, icon: Lock, label: 'Password' },
            { key: 'members' as Tab, icon: UserIcon, label: 'Members' },
          ]).map(({ key, icon: Icon, label }) => (
            <button key={key} onClick={() => setTab(key)}
              className={`nav-item text-xs ${tab === key ? 'active' : ''}`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'password' && <PasswordTab />}
        {tab === 'members' && activeWorkspaceId && <MembersTab wsId={activeWorkspaceId} />}
      </div>
    </div>
  )
}

function ProfileTab() {
  const { user, setUser } = useAuthStore()
  const updateProfile = useUpdateProfile()
  const [name, setName] = useState(user?.name || '')
  const [username, setUsername] = useState(user?.username || '')
  const [uploading, setUploading] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({ name, username })
  }

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      // 1. Get presigned URL from backend
      const { uploadUrl, fileUrl } = await userService.getAvatarUploadUrl()
      // 2. Upload file directly to R2
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      // 3. Update avatar URL in backend
      await userService.updateAvatar(fileUrl)
      // 4. Update local state
      if (user) setUser({ ...user, avatar: fileUrl })
      toast.success('Avatar updated!')
    } catch (err) {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="max-w-md">
      {/* Avatar */}
      <div className="flex items-center gap-4 mb-6">
        <div style={{ position: 'relative' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--border-default)' }} />
          ) : (
            <div className="avatar avatar-xl" style={{ backgroundColor: getAvatarColor(user?.name || ''), width: 64, height: 64, fontSize: 20 }}>
              {getInitials(user?.name)}
            </div>
          )}
          <label style={{ position: 'absolute', bottom: -2, right: -2, cursor: 'pointer' }}>
            <div className="btn btn-secondary btn-icon btn-sm" style={{ borderRadius: '50%', width: 24, height: 24, padding: 0 }}>
              {uploading ? <span className="text-[8px]">…</span> : <Camera size={10} />}
            </div>
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{user?.name}</p>
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>Click the camera icon to upload</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Name</label>
          <input className="input" value={name} onChange={e => setName(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Username</label>
          <input className="input" value={username} onChange={e => setUsername(e.target.value)} required />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Email</label>
          <input className="input" value={user?.email || ''} disabled style={{ color: 'var(--text-disabled)' }} />
        </div>
        <button type="submit" disabled={updateProfile.isPending} className="btn btn-primary">
          {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}

function PasswordTab() {
  const changePassword = useChangePassword()
  const [form, setForm] = useState({ oldPassword: '', newPassword: '', confirm: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (form.newPassword !== form.confirm) return toast.error("Passwords don't match")
    if (form.newPassword.length < 6) return toast.error('Password must be at least 6 characters')
    changePassword.mutate({ oldPassword: form.oldPassword, newPassword: form.newPassword }, {
      onSuccess: () => setForm({ oldPassword: '', newPassword: '', confirm: '' }),
    })
  }

  return (
    <div className="max-w-md">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Current Password</label>
          <input type="password" className="input" value={form.oldPassword} onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))} required />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>New Password</label>
          <input type="password" className="input" value={form.newPassword} onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))} required minLength={6} />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block" style={{ color: 'var(--text-secondary)' }}>Confirm Password</label>
          <input type="password" className="input" value={form.confirm} onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))} required />
        </div>
        <button type="submit" disabled={changePassword.isPending} className="btn btn-primary">
          {changePassword.isPending ? 'Changing…' : 'Change Password'}
        </button>
      </form>
    </div>
  )
}

function MembersTab({ wsId }: { wsId: string }) {
  const { data: members = [], isLoading } = useWorkspaceMembers(wsId)
  const removeMember = useRemoveWorkspaceMember()
  const addMember = useAddWorkspaceMember()
  const generateInvite = useGenerateInvite()
  const { user } = useAuthStore()

  const [addEmail, setAddEmail] = useState('')
  const [inviteLink, setInviteLink] = useState('')

  const myRole = members.find(m => m.userId === user?.id)?.role
  const isAdmin = myRole === 'OWNER' || myRole === 'ADMIN'

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault()
    if (!addEmail.trim()) return
    addMember.mutate({ wsId, email: addEmail, role: 'MEMBER' as WorkspaceRole }, {
      onSuccess: () => setAddEmail(''),
    })
  }

  const handleInvite = () => {
    generateInvite.mutate({ wsId }, {
      onSuccess: (data) => {
        const link = `${window.location.origin}/join/${data.token}`
        setInviteLink(link)
        copyToClipboard(link)
        toast.success('Invite link copied!')
      },
    })
  }

  return (
    <div className="max-w-lg">
      {isAdmin && (
        <>
          <form onSubmit={handleAdd} className="flex gap-2 mb-4">
            <input className="input flex-1" placeholder="Add by email" value={addEmail} onChange={e => setAddEmail(e.target.value)} />
            <button type="submit" disabled={addMember.isPending} className="btn btn-primary">Add</button>
          </form>
          <div className="flex items-center gap-2 mb-6">
            <button onClick={handleInvite} disabled={generateInvite.isPending} className="btn btn-secondary btn-sm">
              <Link2 size={13} /> Generate Invite Link
            </button>
            {inviteLink && (
              <div className="flex-1 flex items-center gap-2 p-2 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-default)' }}>
                <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{inviteLink}</span>
                <button onClick={() => { copyToClipboard(inviteLink); toast.success('Copied!') }} className="btn btn-ghost btn-sm btn-icon"><Copy size={12} /></button>
              </div>
            )}
          </div>
        </>
      )}

      <div className="card overflow-hidden">
        <table className="data-table">
          <thead>
            <tr>
              <th>Member</th>
              <th>Email</th>
              <th>Role</th>
              {isAdmin && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {members.map(m => (
              <tr key={m.id}>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="avatar avatar-sm" style={{ backgroundColor: getAvatarColor(m.user?.name || '') }}>{getInitials(m.user?.name)}</div>
                    <span className="font-medium text-sm">{m.user?.name || 'Unknown'}</span>
                  </div>
                </td>
                <td><span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{m.user?.email}</span></td>
                <td>
                  <span className={`badge ${m.role === 'OWNER' ? 'status-inreview' : m.role === 'ADMIN' ? 'status-backlog' : 'status-todo'}`}>{m.role}</span>
                </td>
                {isAdmin && (
                  <td>
                    {m.role !== 'OWNER' && m.userId !== user?.id && (
                      <button onClick={() => removeMember.mutate({ wsId, userId: m.userId })} className="btn btn-ghost btn-sm" style={{ color: 'var(--priority-urgent)' }}>
                        <Trash2 size={13} />
                      </button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
