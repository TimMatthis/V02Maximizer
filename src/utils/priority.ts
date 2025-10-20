import type { DailyMetrics, FeatureWeights, PriorityAction, ShapContributions } from '../types'
import { factorParameters, factorResponseFunctions } from './responseCurves'

function distanceFromOptimal(value: number, range: [number, number]) {
  if (value >= range[0] && value <= range[1]) return 0.5
  if (value < range[0]) return (range[0] - value) / (range[1] - range[0] || 1) + 0.5
  return (value - range[1]) / (range[1] - range[0] || 1) + 0.5
}

function rateOfChange(key: string, history: DailyMetrics[]) {
  const n = Math.min(7, history.length)
  if (n < 2) return 1
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0
  for (let i = 0; i < n; i++) {
    const x = i
    const y = (history[history.length - n + i] as any)[key] as number
    sumX += x; sumY += y; sumXY += x * y; sumX2 += x * x
  }
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1)
  return Math.max(0.5, Math.min(2, Math.abs(slope) / (Math.abs(sumY / n) || 1) + 0.5))
}

function severityFrom(urgency: number, impact: number): PriorityAction['severity'] {
  const absImp = Math.abs(impact)
  if (urgency > 2.5 || absImp > 2.5) return 'critical'
  if (urgency > 1.8 || absImp > 1.5) return 'high'
  if (urgency > 1.2 || absImp > 0.8) return 'moderate'
  return impact >= 0 ? 'maintain' : 'low'
}

function timeToImpactFrom(factor: string, distance: number): string {
  if (factor === 'sleepScore' || factor === 'hrv') return distance > 1 ? '1-2 weeks' : 'few days'
  if (factor === 'trainingLoad' || factor === 'weeklyVolume') return distance > 1 ? '2-4 weeks' : '1-2 weeks'
  return '2-4 weeks'
}

function actionTextFor(factor: string, value: number, range: [number, number]) {
  const mid = (range[0] + range[1]) / 2
  if (value < range[0]) return `Increase ${factor} toward ~${mid.toFixed(0)}`
  if (value > range[1]) return `Reduce ${factor} toward ~${mid.toFixed(0)}`
  return `Maintain ${factor} within ${range[0]}–${range[1]}`
}

export function calculatePriorities(current: FeatureWeights, shap: ShapContributions, history: DailyMetrics[]): PriorityAction[] {
  const out: PriorityAction[] = []
  for (const [factor, v] of Object.entries(current)) {
    const params = factorParameters[factor] || { optimalRange: [v, v] as [number, number], thresholdPoint: v, criticalPoint: v, curveType: 'linear' as const }
    const dist = distanceFromOptimal(v as number, params.optimalRange)
    const roc = rateOfChange(factor, history)
    const shapImpact = shap.features[factor]?.shapValue ?? 0
    const importance = 1 // could weight by model weights if available
    const urgencyScore = Math.abs(shapImpact) * dist * roc * importance

    const mid = (params.optimalRange[0] + params.optimalRange[1]) / 2
    const fn = factorResponseFunctions[factor] || (() => 0)
    const potentialGain = fn(mid, (history.length ? (history as any)[factor] : undefined) as any) - fn(v as number)

    out.push({
      rank: 0,
      factor,
      severity: severityFrom(urgencyScore, shapImpact),
      currentValue: v as number,
      optimalRange: params.optimalRange,
      currentImpact: shapImpact,
      potentialGain,
      distanceFromOptimal: dist,
      actionText: actionTextFor(factor, v as number, params.optimalRange),
      urgencyScore,
      recommendation: `${potentialGain >= 0 ? 'Improve' : 'Stabilize'} ${factor} toward ${params.optimalRange[0]}–${params.optimalRange[1]} to gain ~${Math.abs(potentialGain).toFixed(1)} ml/kg/min`,
      timeToImpact: timeToImpactFrom(factor, dist),
    })
  }

  return out
    .sort((a, b) => b.urgencyScore - a.urgencyScore)
    .map((p, i) => ({ ...p, rank: i + 1 }))
    .slice(0, 5)
}

export const severityStyles: Record<PriorityAction['severity'], string> = {
  critical: 'bg-red-50 border-red-500 text-red-900',
  high: 'bg-orange-50 border-orange-500 text-orange-900',
  moderate: 'bg-yellow-50 border-yellow-500 text-yellow-900',
  low: 'bg-blue-50 border-blue-500 text-blue-900',
  maintain: 'bg-green-50 border-green-500 text-green-900',
}
