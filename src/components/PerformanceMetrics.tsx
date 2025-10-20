import type { DailyMetrics } from '../types'

function mae(actuals: number[], preds: number[]) {
  let s = 0
  let n = 0
  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] != null) {
      s += Math.abs(actuals[i] - preds[i])
      n++
    }
  }
  return n ? s / n : 0
}

function r2(actuals: number[], preds: number[]) {
  const valid: number[] = []
  const p: number[] = []
  for (let i = 0; i < actuals.length; i++) {
    if (actuals[i] != null) {
      valid.push(actuals[i])
      p.push(preds[i])
    }
  }
  const mean = valid.reduce((a, b) => a + b, 0) / (valid.length || 1)
  const ssTot = valid.reduce((s, v) => s + (v - mean) ** 2, 0)
  const ssRes = valid.reduce((s, v, i) => s + (v - p[i]) ** 2, 0)
  return ssTot ? 1 - ssRes / ssTot : 0
}

type Props = { history: DailyMetrics[] }

export default function PerformanceMetrics({ history }: Props) {
  const actuals = history.map((d) => d.actualVO2Max ?? null) as any as number[]
  const preds = history.map((d) => d.predictedVO2Max)

  const acc = 1 - mae(actuals, preds) / 10 // rough scale
  const metrics = {
    predictionAccuracy: Math.max(0, Math.min(1, acc)),
    mae: mae(actuals, preds),
    r2: r2(actuals, preds),
    dataPoints: history.filter((d) => d.actualVO2Max != null).length,
    updates: Math.max(1, Math.floor(history.length / 7)),
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-primary-600 text-lg">📈</span>
        <h3 className="text-lg font-bold text-gray-900">Performance Metrics</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-gradient-to-br from-primary-50 to-primary-100/50 p-3 border border-primary-200">
          <div className="text-xs font-medium text-neutral mb-1">Prediction Accuracy</div>
          <div className="text-2xl font-bold text-primary-700">{(metrics.predictionAccuracy * 100).toFixed(1)}%</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-gray-50 to-gray-100/50 p-3 border border-gray-200">
          <div className="text-xs font-medium text-neutral mb-1">Mean Abs Error</div>
          <div className="text-2xl font-bold text-gray-700">{metrics.mae.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-athletic-blue/10 to-athletic-cyan/10 p-3 border border-athletic-cyan/30">
          <div className="text-xs font-medium text-neutral mb-1">R² Score</div>
          <div className="text-2xl font-bold text-athletic-cyan">{metrics.r2.toFixed(2)}</div>
        </div>
        <div className="rounded-lg bg-gradient-to-br from-athletic-orange/10 to-athletic-amber/10 p-3 border border-athletic-orange/30">
          <div className="text-xs font-medium text-neutral mb-1">Data Points</div>
          <div className="text-2xl font-bold text-athletic-orange">{metrics.dataPoints}</div>
        </div>
      </div>
    </div>
  )
}

