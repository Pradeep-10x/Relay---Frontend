import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Layers } from 'lucide-react'
import { useJoinWorkspace } from '@/hooks'

export default function JoinPage() {
  const { inviteCode = '' } = useParams()
  const join = useJoinWorkspace()
  const navigate = useNavigate()

  useEffect(() => {
    if (inviteCode) join.mutate(inviteCode)
  }, [inviteCode])

  if (join.isPending) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center' }}>
          <div className="logo-mark" style={{ width: 48, height: 48, margin: '0 auto 16px', fontSize: 20, animation: 'pulse 1.5s ease infinite' }}>
            <Layers size={22} />
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-2)' }}>Joining workspace…</p>
        </div>
      </div>
    )
  }

  if (join.isError) {
    return (
      <div className="auth-page">
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--danger)', marginBottom: 8 }}>Failed to join workspace</p>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>The invite link may be invalid or expired.</p>
          <button onClick={() => navigate('/onboarding')} className="btn btn-primary">Go to Dashboard</button>
        </div>
      </div>
    )
  }

  return null
}
