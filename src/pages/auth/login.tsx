import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useLogin } from '@/hooks'

export default function LoginPage() {
  const login = useLogin()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPw, setShowPw] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    login.mutate(form)
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="logo-mark"><img src="/logo.svg" alt="Relay" style={{ width: 28, height: 28 }} /></div>
        <h1>Welcome back</h1>
        <p className="subtitle">Sign in to your Relay account</p>

        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input
            type="email"
            className="input"
            placeholder="you@company.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            required
            autoFocus
          />
          <label>Password</label>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <input
              type={showPw ? 'text' : 'password'}
              className="input"
              placeholder="••••••••"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              required
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

          <button type="submit" disabled={login.isPending} className="btn btn-primary">
            {login.isPending ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <div className="auth-footer">
          Don&apos;t have an account? <Link to="/register">Create one</Link>
        </div>
      </div>
    </div>
  )
}
