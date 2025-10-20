import { Scatter, ScatterChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import type { DailyMetrics } from '../types'

type Props = { history: DailyMetrics[]; factors: string[] }

export default function DependencyPlots({ history, factors }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
      {factors.map((k) => {
        const data = history.map((d) => ({
          x: (d as any)[k] as number,
          y: d.shapValues.features[k]?.shapValue ?? 0,
        }))
        return (
          <div key={k} className="rounded-lg border border-gray-200 bg-white shadow-sm p-2">
            <div className="mb-1 text-sm font-medium capitalize">{k}</div>
            <div style={{ width: '100%', height: 220 }}>
              <ResponsiveContainer>
                <ScatterChart margin={{ left: 8, right: 8, top: 8, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" dataKey="x" name={k} tick={{ fontSize: 10 }} />
                  <YAxis type="number" dataKey="y" name="SHAP" tick={{ fontSize: 10 }} />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} formatter={(v: any) => Number(v).toFixed(2)} />
                  <Scatter data={data} fill="#0EA5E9" />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>
        )
      })}
    </div>
  )
}

