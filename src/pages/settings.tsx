import { useState } from 'react'
import { Camera, Lock, Edit3, AlertTriangle } from 'lucide-react'
import { useUpdateProfile, useChangePassword } from '@/hooks'
import { useAuthStore } from '@/store/auth-store'
import { getInitials, getAvatarColor } from '@/lib/utils'
import { userService } from '@/services/user.service'
import toast from 'react-hot-toast'

type Tab = 'profile' | 'password' | 'danger'

export default function SettingsPage() {
  const { user } = useAuthStore()
  const [tab, setTab] = useState<Tab>('profile')

  const tabs: { key: Tab; label: string; icon: React.ElementType; danger?: boolean }[] = [
    { key: 'profile', label: 'Profile', icon: Edit3 },
    { key: 'password', label: 'Password', icon: Lock },
    { key: 'danger', label: 'Delete Account', icon: AlertTriangle, danger: true },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: 32 }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>

        {/* Header */}
        <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--text-0)', letterSpacing: '-0.02em', marginBottom: 24 }}>
          Settings
        </h1>

        {/* Tab bar */}
        <div style={{
          display: 'flex', gap: 2, marginBottom: 28,
          background: 'var(--surface-2)', padding: 3, borderRadius: 4,
          border: '1px solid var(--border-0)',
        }}>
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                flex: 1, padding: '8px 0', fontSize: 12, fontWeight: 600,
                borderRadius: 3, border: 'none', cursor: 'pointer',
                background: tab === t.key ? 'var(--surface-1)' : 'transparent',
                color: tab === t.key ? (t.danger ? '#ef4444' : 'var(--text-0)') : 'var(--text-3)',
                boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
                transition: 'all 0.15s',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              <t.icon size={13} /> {t.label}
            </button>
          ))}
        </div>

        {tab === 'profile' && <ProfileTab />}
        {tab === 'password' && <PasswordTab />}
        {tab === 'danger' && <DangerTab />}
      </div>
    </div>
  )
}

/* ─── Input styling helper ─── */
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', fontSize: 13, fontWeight: 500,
  background: 'var(--surface-2)', border: '1px solid var(--border-0)',
  borderRadius: 4, color: 'var(--text-0)', outline: 'none',
  transition: 'border-color 0.15s',
  fontFamily: 'var(--font-body)',
}

const labelStyle: React.CSSProperties = {
  fontSize: 12, fontWeight: 600, color: 'var(--text-2)',
  marginBottom: 6, display: 'block',
}

const btnPrimaryStyle: React.CSSProperties = {
  padding: '10px 24px', fontSize: 13, fontWeight: 700,
  background: 'var(--accent)', color: '#fff', border: 'none',
  borderRadius: 4, cursor: 'pointer', transition: 'opacity 0.12s',
}

/* ═══════════ Profile Tab ═══════════ */
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
      const { uploadUrl, fileUrl } = await userService.getAvatarUploadUrl()
      await fetch(uploadUrl, { method: 'PUT', body: file, headers: { 'Content-Type': file.type } })
      await userService.updateAvatar(fileUrl)
      if (user) setUser({ ...user, avatar: fileUrl })
      toast.success('Avatar updated!')
    } catch {
      toast.error('Failed to upload avatar')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      borderRadius: 'var(--radius-xl)', padding: 28,
    }}>
      {/* Avatar section */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28, paddingBottom: 24, borderBottom: '1px solid var(--border-0)' }}>
        <div style={{ position: 'relative' }}>
          {user?.avatar ? (
            <img src={user.avatar} alt="avatar" style={{ width: 64, height: 64, borderRadius: 4, objectFit: 'cover', border: '2px solid var(--border-0)' }} />
          ) : (
            <div style={{
              width: 64, height: 64, borderRadius: 4,
              background: `linear-gradient(135deg, ${getAvatarColor(user?.name || '')}, ${getAvatarColor(user?.name || '')}bb)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontWeight: 700, fontSize: 20,
            }}>
              {getInitials(user?.name)}
            </div>
          )}
          <label style={{
            position: 'absolute', bottom: -4, right: -4, cursor: 'pointer',
            width: 24, height: 24, borderRadius: 4,
            background: 'var(--surface-2)', border: '1px solid var(--border-1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-2)',
          }}>
            {uploading ? <span style={{ fontSize: 8 }}>…</span> : <Camera size={11} />}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: 'none' }} />
          </label>
        </div>
        <div>
          <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text-0)', marginBottom: 2 }}>{user?.name}</p>
          <p style={{ fontSize: 11, color: 'var(--text-3)' }}>{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Name</label>
          <input
            style={inputStyle}
            value={name}
            onChange={e => setName(e.target.value)}
            required
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Username</label>
          <input
            style={inputStyle}
            value={username}
            onChange={e => setUsername(e.target.value)}
            required
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          />
        </div>
        <div>
          <label style={labelStyle}>Email</label>
          <input
            style={{ ...inputStyle, color: 'var(--text-3)', cursor: 'not-allowed' }}
            value={user?.email || ''}
            disabled
          />
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Email cannot be changed</p>
        </div>
        <div style={{ paddingTop: 4 }}>
          <button type="submit" disabled={updateProfile.isPending} style={{ ...btnPrimaryStyle, opacity: updateProfile.isPending ? 0.6 : 1 }}>
            {updateProfile.isPending ? 'Saving…' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ═══════════ Password Tab ═══════════ */
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
    <div style={{
      background: 'var(--surface-1)', border: '1px solid var(--border-0)',
      borderRadius: 'var(--radius-xl)', padding: 28,
    }}>
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-0)', marginBottom: 4 }}>Change Password</h3>
        <p style={{ fontSize: 12, color: 'var(--text-3)' }}>Update your password to keep your account secure</p>
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        <div>
          <label style={labelStyle}>Current Password</label>
          <input
            type="password"
            style={inputStyle}
            value={form.oldPassword}
            onChange={e => setForm(f => ({ ...f, oldPassword: e.target.value }))}
            required
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          />
        </div>
        <div>
          <label style={labelStyle}>New Password</label>
          <input
            type="password"
            style={inputStyle}
            value={form.newPassword}
            onChange={e => setForm(f => ({ ...f, newPassword: e.target.value }))}
            required
            minLength={6}
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          />
          <p style={{ fontSize: 10, color: 'var(--text-3)', marginTop: 4 }}>Minimum 6 characters</p>
        </div>
        <div>
          <label style={labelStyle}>Confirm New Password</label>
          <input
            type="password"
            style={inputStyle}
            value={form.confirm}
            onChange={e => setForm(f => ({ ...f, confirm: e.target.value }))}
            required
            onFocus={e => e.currentTarget.style.borderColor = 'var(--accent)'}
            onBlur={e => e.currentTarget.style.borderColor = 'var(--border-0)'}
          />
        </div>
        <div style={{ paddingTop: 4 }}>
          <button type="submit" disabled={changePassword.isPending} style={{ ...btnPrimaryStyle, opacity: changePassword.isPending ? 0.6 : 1 }}>
            {changePassword.isPending ? 'Changing…' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}

/* ═══════════ Danger / Delete Account Tab ═══════════ */
function DangerTab() {
  const { user } = useAuthStore()
  const [confirmText, setConfirmText] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)

  const expectedText = user?.email || 'DELETE'
  const canDelete = confirmText === expectedText

  const handleDelete = () => {
    if (!canDelete) return
    // No backend endpoint yet — show intent toast
    toast.error('Account deletion is not yet available. Contact support.', { duration: 5000 })
    setShowConfirm(false)
    setConfirmText('')
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Warning card */}
      <div style={{
        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)',
        borderRadius: 'var(--radius-xl)', padding: 24,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 4, flexShrink: 0,
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={18} color="#ef4444" />
          </div>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#ef4444', marginBottom: 6 }}>Delete Account</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: 4 }}>
              Once you delete your account, there is no going back. This action is permanent and will:
            </p>
            <ul style={{ fontSize: 12, color: 'var(--text-2)', lineHeight: 1.8, paddingLeft: 18, margin: '8px 0 0' }}>
              <li>Remove all your personal data</li>
              <li>Remove you from all workspaces</li>
              <li>Delete all issues reported by you</li>
              <li>Cancel any active sessions</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Account info */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border-0)',
        borderRadius: 'var(--radius-xl)', padding: 24,
      }}>
        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-0)', marginBottom: 16 }}>Account Information</h4>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Name</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{user?.name}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-0)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Email</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>{user?.email}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-0)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Username</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>@{user?.username}</span>
          </div>
          <div style={{ height: 1, background: 'var(--border-0)' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>Member since</span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-1)' }}>
              {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
            </span>
          </div>
        </div>
      </div>

      {/* Delete action */}
      <div style={{
        background: 'var(--surface-1)', border: '1px solid var(--border-0)',
        borderRadius: 'var(--radius-xl)', padding: 24,
      }}>
        {!showConfirm ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', marginBottom: 2 }}>Permanently delete this account</p>
              <p style={{ fontSize: 11, color: 'var(--text-3)' }}>This cannot be undone</p>
            </div>
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                padding: '8px 18px', fontSize: 12, fontWeight: 700,
                background: 'rgba(239,68,68,0.1)', color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)', borderRadius: 4,
                cursor: 'pointer', transition: 'all 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#ef4444'; e.currentTarget.style.color = '#fff' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; e.currentTarget.style.color = '#ef4444' }}
            >
              Delete Account
            </button>
          </div>
        ) : (
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: '#ef4444', marginBottom: 12 }}>
              Type your email to confirm: <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-1)' }}>{expectedText}</span>
            </p>
            <input
              style={{ ...inputStyle, borderColor: 'rgba(239,68,68,0.3)', marginBottom: 14 }}
              value={confirmText}
              onChange={e => setConfirmText(e.target.value)}
              placeholder={expectedText}
              onFocus={e => e.currentTarget.style.borderColor = '#ef4444'}
              onBlur={e => e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'}
            />
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleDelete}
                disabled={!canDelete}
                style={{
                  padding: '9px 20px', fontSize: 12, fontWeight: 700,
                  background: canDelete ? '#ef4444' : 'var(--surface-3)',
                  color: canDelete ? '#fff' : 'var(--text-3)',
                  border: 'none', borderRadius: 4,
                  cursor: canDelete ? 'pointer' : 'not-allowed',
                  transition: 'all 0.12s',
                }}
              >
                Permanently Delete
              </button>
              <button
                onClick={() => { setShowConfirm(false); setConfirmText('') }}
                style={{
                  padding: '9px 20px', fontSize: 12, fontWeight: 600,
                  background: 'var(--surface-2)', color: 'var(--text-2)',
                  border: '1px solid var(--border-0)', borderRadius: 4,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
