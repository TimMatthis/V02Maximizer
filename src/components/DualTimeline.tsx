import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyMetrics } from '../types'

type Props = {
  history: DailyMetrics[]
  activeIndex: number
  showFactors: Record<string, boolean>
}

export default function DualTimeline({ history, activeIndex, showFactors }: Props) {
  const colors = ['#10B981', '#0EA5E9', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280', '#059669', '#DC2626', '#1E40AF', '#111827']

  // Transform SHAP features into stacked values per day
  const data = history.map((d) => {
    const row: any = { date: d.date, predicted: d.predictedVO2Max, actual: d.actualVO2Max }
    for (const [k, v] of Object.entries(d.shapValues.features)) {
      if (showFactors[k]) row[k] = v.shapValue
    }
    return row
  })

  const factorKeys = Object.keys(history[0].shapValues.features).filter((k) => showFactors[k])

  return (
    <div style={{ width: '100%', height: 360 }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={24} />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Tooltip />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="predicted" name="Predicted VO2max" stroke="#1E40AF" dot={false} strokeWidth={2} />
          <Line yAxisId="left" type="monotone" dataKey="actual" name="Actual VO2max" stroke="#111827" dot={false} strokeDasharray="4 4" />
          {factorKeys.map((k, i) => (
            <Area key={k} yAxisId="right" type="monotone" dataKey={k} name={k} stackId="1" stroke={colors[i % colors.length]} fill={colors[i % colors.length] + '33'} />
          ))}
          <ReferenceLine x={history[activeIndex]?.date} stroke="#6B7280" strokeDasharray="3 3" />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}

