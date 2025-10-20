import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { FeatureWeights } from '../types'

type Props = { population: FeatureWeights; personal: FeatureWeights }

export default function ImportanceRanking({ population, personal }: Props) {
  const factors = Object.keys(population)
  const data = factors
    .map((k) => ({ name: k, population: (population as any)[k], personal: (personal as any)[k] }))
    .sort((a, b) => b.personal - a.personal)

  return (
    <div style={{ width: '100%', height: 300 }}>
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 16, right: 16, top: 8, bottom: 8 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis type="number" tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} domain={[0, 'dataMax + 0.05']} />
          <YAxis dataKey="name" type="category" width={140} />
          <Tooltip formatter={(v: any) => `${(Number(v) * 100).toFixed(1)}%`} />
          <Legend />
          <Bar dataKey="population" name="Population" fill="#6B7280" />
          <Bar dataKey="personal" name="Personal" fill="#1E40AF" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

