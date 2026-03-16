import { useParams } from 'react-router-dom'
import { useProjectAnalytics } from '@/hooks'
import { BarChart3, CheckCircle, AlertCircle, Target } from 'lucide-react'

export default function AnalyticsPage() {
  const { projectId = '' } = useParams()
  const { data, isLoading } = useProjectAnalytics(projectId)

  if (isLoading) {
    return <div className="flex-1 p-6"><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <div key={i} className="h-28 bg-[#12141a] rounded-xl animate-pulse" />)}</div></div>
  }

  if (!data) {
    return <div className="flex-1 flex items-center justify-center"><p className="text-sm text-zinc-500">No analytics data available</p></div>
  }

  const maxState = Math.max(...data.issuesPerState.map(s => s._count), 1)
  const maxUser = Math.max(...(data.tasksPerUser || []).map(u => u._count), 1)

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <h2 className="text-lg font-bold text-white mb-6 tracking-tight">Analytics</h2>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        {[
          { icon: Target, label: 'Total Issues', value: data.totalIssues, color: 'text-cyan-400' },
          { icon: CheckCircle, label: 'Completed', value: data.completedIssues, color: 'text-emerald-400' },
          { icon: BarChart3, label: 'Completion Rate', value: `${Math.round(data.completionRate)}%`, color: 'text-violet-400' },
          { icon: AlertCircle, label: 'Pending', value: data.totalIssues - data.completedIssues, color: 'text-amber-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="bg-[#12141a] border border-[#1e2028] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Icon size={14} className={color} />
              <span className="text-xs text-zinc-500">{label}</span>
            </div>
            <p className="text-2xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Completion progress */}
      <div className="bg-[#12141a] border border-[#1e2028] rounded-xl p-5 mb-8">
        <h3 className="text-sm font-semibold text-zinc-300 mb-3">Progress</h3>
        <div className="w-full h-3 bg-[#1a1c24] rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-cyan-500 to-emerald-500 rounded-full transition-all" style={{ width: `${data.completionRate}%` }} />
        </div>
        <p className="text-xs text-zinc-500 mt-2">{data.completedIssues} of {data.totalIssues} issues completed</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* By State */}
        <div className="bg-[#12141a] border border-[#1e2028] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Issues by State</h3>
          <div className="space-y-3">
            {data.issuesPerState.map((s, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{s.stateId}</span>
                  <span className="text-zinc-500">{s._count}</span>
                </div>
                <div className="w-full h-2 bg-[#1a1c24] rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${(s._count / maxState) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* By Assignee */}
        <div className="bg-[#12141a] border border-[#1e2028] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">Issues by Assignee</h3>
          <div className="space-y-3">
            {(data.tasksPerUser || []).map((u, i) => (
              <div key={i}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-400">{u.assigneeId || 'Unassigned'}</span>
                  <span className="text-zinc-500">{u._count}</span>
                </div>
                <div className="w-full h-2 bg-[#1a1c24] rounded-full overflow-hidden">
                  <div className="h-full bg-violet-500/60 rounded-full" style={{ width: `${(u._count / maxUser) * 100}%` }} />
                </div>
              </div>
            ))}
            {(!data.tasksPerUser || data.tasksPerUser.length === 0) && <p className="text-xs text-zinc-600">No data</p>}
          </div>
        </div>
      </div>
    </div>
  )
}
