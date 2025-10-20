import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend, ReferenceDot, ResponsiveContainer } from 'recharts'
import type { UserMetrics } from '../types'

type Props = {
  data: UserMetrics[]
  overlays?: string[]
  activeIndex?: number
}

export default function HistoricalChart({ data, overlays = [], activeIndex }: Props) {
  const colors = ['#1E40AF', '#10B981', '#EF4444', '#6B7280']
  const active = activeIndex ?? data.length - 1
  const activePoint = data[active]
  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer>
        <LineChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" hide minTickGap={24} />
          <YAxis yAxisId="left" tick={{ fontSize: 12 }} domain={['dataMin - 2', 'dataMax + 2']} />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="vo2max" name="VO2max" stroke={colors[0]} dot={false} strokeWidth={2} yAxisId="left" />
          {overlays.map((k, i) => (
            <Line key={k} type="monotone" dataKey={k} name={k} stroke={colors[(i + 1) % colors.length]} dot={false} strokeWidth={1.5} yAxisId="left" />
          ))}
          {activePoint && (
            <ReferenceDot x={activePoint.date} y={(activePoint as any)['vo2max']} r={4} fill="#1E40AF" stroke="white" />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

