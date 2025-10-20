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
    <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral">Prediction Accuracy</div>
        <div className="text-3xl font-semibold">{(metrics.predictionAccuracy * 100).toFixed(1)}%</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral">Mean Absolute Error</div>
        <div className="text-3xl font-semibold">{metrics.mae.toFixed(2)} ml/kg/min</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral">R²</div>
        <div className="text-3xl font-semibold">{metrics.r2.toFixed(2)}</div>
      </div>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
        <div className="text-sm text-neutral">Data Points Used</div>
        <div className="text-3xl font-semibold">{metrics.dataPoints}</div>
      </div>
    </div>
  )
}

