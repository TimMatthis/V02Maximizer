import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { SHAPValueItem } from '../types'

type Props = { base: number; items: SHAPValueItem[] }

export default function SHAPForceplot({ items }: Props) {
  const data = items.map((s) => ({ name: s.factorName, value: s.shapValue }))
  return (
    <div style={{ width: '100%', height: 260 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 8, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" domain={["dataMin - 2", "dataMax + 2"]} />
          <YAxis type="category" dataKey="name" width={120} />
          <Tooltip />
          <Bar dataKey="value" name="Impact">
            {/* Color via callback would be nicer; Recharts simple demo keeps default */}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

