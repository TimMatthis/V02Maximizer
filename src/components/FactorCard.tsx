import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SHAPValueItem, UserMetrics } from '../types'

type Meta = { min: number; max: number; mean: number; std: number; r2: number }

type Props = {
  metricKey: string
  meta: Meta
  value: number
  shap: SHAPValueItem
  history: UserMetrics[]
}

export default function FactorCard({ metricKey, meta, value, shap, history }: Props) {
  const color = shap.shapValue >= 0 ? '#10B981' : '#EF4444'
  return (
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-3">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-medium capitalize">{metricKey}</div>
        <div className="text-xs text-neutral">R² {(shap.normalizedImportance * 100).toFixed(0)}%</div>
      </div>
      <div className="mb-2 text-sm">
        <span className="font-mono mr-2">{value.toFixed(2)}</span>
        <span className={shap.shapValue >= 0 ? 'text-positive' : 'text-negative'}>
          SHAP {shap.shapValue >= 0 ? '+' : ''}{shap.shapValue.toFixed(2)}
        </span>
      </div>
      <div className="mb-2 text-xs text-neutral">Optimal around {meta.mean.toFixed(1)} within {meta.min.toFixed(0)}–{meta.max.toFixed(0)}</div>
      <div style={{ width: '100%', height: 80 }}>
        <ResponsiveContainer>
          <AreaChart data={history.map((d) => ({ date: d.date, value: (d as any)[metricKey] }))}>
            <XAxis dataKey="date" hide />
            <YAxis hide domain={[meta.min, meta.max]} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke={color} fill={color + '33'} strokeWidth={1.5} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="text-xs text-neutral">Keep within optimal range for best VO2 outcome.</div>
    </div>
  )
}
