import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useRegister } from '@/hooks'

export default function RegisterPage() {
  const register = useRegister()
  const [form, setForm] = useState({ name: '', username: '', email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    register.mutate(form)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-mark"><img src="/logo.svg" alt="Relay" style={{ width: 28, height: 28 }} /></div>
        <h1>Create your account</h1>
        <p className="subtitle">Get started with Relay</p>

        <form onSubmit={handleSubmit}>
          <label>Full Name</label>
          <input className="input" placeholder="Jane Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required autoFocus />

          <label>Username</label>
          <input className="input" placeholder="janedoe" value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} required />

          <label>Email</label>
          <input type="email" className="input" placeholder="you@company.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />

          <label>Password</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
              minLength={6}
              style={{ marginBottom: 0, paddingRight: 40 }}
            />
            <button
              type="button"
              onClick={() => setShowPw(v => !v)}
              style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}
            >
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          <button type="submit" disabled={register.isPending} className="btn btn-primary">
            {register.isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <div className="auth-footer">
          Already have an account? <Link to="/login">Sign in</Link>
        </div>
      </div>
    </div>
  )
}
