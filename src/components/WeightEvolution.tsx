import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyMetrics, FeatureWeights } from '../types'

type Props = { history: DailyMetrics[]; snapshots?: FeatureWeights[] }

export default function WeightEvolution({ history }: Props) {
  // Approximate weekly snapshots by averaging SHAP percentageContribution per factor each week
  const byWeek: any[] = []
  const weeks = Math.ceil(history.length / 7)
  const keys = Object.keys(history[0].shapValues.features)
  for (let w = 0; w < weeks; w++) {
    const slice = history.slice(w * 7, w * 7 + 7)
    const obj: any = { week: `W${w + 1}` }
    for (const k of keys) {
      const avg = slice.reduce((s, d) => s + (d.shapValues.features[k]?.percentageContribution ?? 0), 0) / (slice.length || 1)
      obj[k] = avg
    }
    byWeek.push(obj)
  }

  const colors = ['#22c55e', '#0ea5e9', '#14b8a6', '#8b5cf6', '#f59e0b', '#ef4444', '#64748b', '#059669', '#dc2626', '#111827']

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-primary-600 text-lg">📊</span>
        <h3 className="text-lg font-bold text-gray-900">Weight Evolution</h3>
      </div>
      <div style={{ width: '100%', height: 250 }}>
        <ResponsiveContainer>
          <LineChart data={byWeek} margin={{ left: 0, right: 0, top: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} tick={{ fontSize: 12 }} />
            <Tooltip formatter={(v: any) => `${(Number(v) * 100).toFixed(1)}%`} contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }} />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            {keys.slice(0, 6).map((k, i) => (
              <Line key={k} type="monotone" dataKey={k} name={k} stroke={colors[i % colors.length]} strokeWidth={2} dot={false} />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

