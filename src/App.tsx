import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from 'react-hot-toast'
import { ProtectedRoute, PublicRoute } from '@/components/auth/protected-route'
import Sidebar from '@/components/layout/sidebar'
import { Topbar, AppShell } from '@/components/layout/topbar'
import { useRealtimeEvents } from '@/lib/socket-events'
import { useAuthStore } from '@/store/auth-store'
import { authService } from '@/services/auth.service'
import { useEffect } from 'react'
import LoginPage from '@/pages/auth/login'
import RegisterPage from '@/pages/auth/register'
import OnboardingPage from '@/pages/onboarding'
import JoinPage from '@/pages/join'
import HomeDashboard from '@/pages/home-dashboard'
import WorkspaceDetailPage from '@/pages/workspace-detail'
import ProjectPage from '@/pages/project-page'
import NotificationsPage from '@/pages/notifications'
import SettingsPage from '@/pages/settings'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { refetchOnWindowFocus: false, retry: 1, staleTime: 30 * 1000 },
  },
})

/** Auto-fetch user profile when token exists but user is null */
function useAutoFetchUser() {
  const { user, setUser } = useAuthStore()
  useEffect(() => {
    const token = localStorage.getItem('relay-token')
    // Check user?.id — a corrupted user object { id: undefined } is truthy but useless
    if (token && !user?.id) {
      authService.me().then(u => {
        if (u?.id) setUser(u)
      }).catch(() => {
        // Token invalid — will be handled by 401 interceptor
      })
    }
  }, [user, setUser])
}

/** Shell layout wrapping all authenticated routes */
function ShellLayout() {
  // Auto-fetch user if missing
  useAutoFetchUser()
  // Activate real-time socket event listeners
  useRealtimeEvents()

  return (
    <AppShell>
      <Sidebar />
      <div className="main-content">
        <Topbar />
        <Routes>
          {/* Dashboard */}
          <Route index element={<HomeDashboard />} />
          <Route path="dashboard" element={<HomeDashboard />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="settings" element={<SettingsPage />} />

          {/* Workspace */}
          <Route path="workspace/:workspaceId" element={<WorkspaceDetailPage />} />

          {/* Project with tabs (Board, Whiteboard, Members, Analytics) */}
          <Route path="workspace/:workspaceId/project/:projectId/*" element={<ProjectPage />} />
        </Routes>
      </div>
    </AppShell>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public auth pages */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Protected: onboarding (workspace selection) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
          </Route>

          {/* Protected: join workspace */}
          <Route element={<ProtectedRoute />}>
            <Route path="/join/:inviteCode" element={<JoinPage />} />
          </Route>

          {/* Protected: main app shell */}
          <Route element={<ProtectedRoute />}>
            <Route path="/*" element={<ShellLayout />} />
          </Route>

          {/* Defaults */}
          <Route path="/" element={<Navigate to="/onboarding" replace />} />
        </Routes>
      </BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: 'var(--bg-elevated)',
            color: 'var(--text-primary)',
            border: '1px solid var(--border-default)',
            fontSize: 13,
            borderRadius: 10,
            boxShadow: 'var(--shadow-lg)',
          },
        }}
      />
    </QueryClientProvider>
  )
}
