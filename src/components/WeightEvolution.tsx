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

  const colors = ['#1E40AF', '#0EA5E9', '#10B981', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280', '#059669', '#DC2626', '#111827']

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <LineChart data={byWeek} margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="week" />
          <YAxis tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
          <Tooltip formatter={(v: any) => `${(Number(v) * 100).toFixed(1)}%`} />
          <Legend />
          {keys.slice(0, 6).map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} name={k} stroke={colors[i % colors.length]} dot={false} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

