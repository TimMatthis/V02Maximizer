import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SHAPValueItem, ModelType } from '../types'

type Props = { base: number; items: SHAPValueItem[]; modelType?: ModelType }

export default function SHAPWaterfall({ base, items, modelType = 'VO2' }: Props) {
  // Build cumulative series
  let cumulative = base
  const data = [
    { name: 'Base', start: base, end: base, delta: 0, color: '#6B7280' },
    ...items.map((s) => {
      const start = cumulative
      cumulative = cumulative + s.shapValue
      return {
        name: s.factorName,
        start,
        end: cumulative,
        delta: s.shapValue,
        color: s.shapValue >= 0 ? '#10B981' : '#EF4444',
      }
    }),
    { name: 'Predicted', start: cumulative, end: cumulative, delta: 0, color: '#1E40AF' },
  ]

  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} />
          <Tooltip />
          <Bar dataKey="delta" name="Contribution">
            <LabelList dataKey="delta" position="top" formatter={(v: any) => Number(v).toFixed(2)} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
