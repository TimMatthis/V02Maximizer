import type { DailyMetrics, FeatureWeights, PriorityAction, ShapContributions } from '../types'
import { Link } from 'react-router-dom'
import { calculatePriorities, severityStyles } from '../utils/priority'

type Props = {
  current: FeatureWeights
  shap: ShapContributions
  history: DailyMetrics[]
  onAdjust?: (factor: string) => void
}

export default function PriorityPanel({ current, shap, history, onAdjust }: Props) {
  const priorities = calculatePriorities(current, shap, history)
  if (!priorities.length) return null
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-4">
      <div className="text-sm font-semibold text-gray-800 mb-3">🎯 Your Priority Actions</div>
      <div className="grid grid-cols-1 gap-3">
        {priorities.slice(0, 5).map((p) => (
          <PriorityItem key={p.factor} p={p} onAdjust={onAdjust} />
        ))}
      </div>
    </div>
  )
}

function PriorityItem({ p }: { p: PriorityAction; onAdjust?: (factor: string) => void }) {
  const badge = p.rank === 1 ? '🔴' : p.rank === 2 ? '🟡' : p.rank === 3 ? '🟢' : p.rank === 4 ? '🔵' : '⚪'
  return (
    <div className={`rounded-lg border ${severityStyles[p.severity]} p-3`}> 
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold">{badge} Priority {p.rank}: <span className="capitalize">{p.factor}</span></div>
          <div className="text-xs opacity-90">Current: {p.currentValue.toFixed(1)} | Optimal: {p.optimalRange[0]}–{p.optimalRange[1]} | Impact: {p.currentImpact.toFixed(1)}</div>
        </div>
        <div className="text-xs opacity-80">{p.timeToImpact}</div>
      </div>
      <div className="text-sm mt-2">{p.recommendation}</div>
      <div className="mt-2 flex gap-2">
        <Link to="/goals" className="rounded-full border px-3 py-1 text-xs hover:bg-white/40 inline-flex items-center">Set Goal</Link>
      </div>
    </div>
  )
}

