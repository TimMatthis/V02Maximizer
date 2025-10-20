import type { SHAPValueItem, UserMetrics } from '../types'

export const defaultWeights: Record<string, number> = {
  trainingLoad: 0.25,
  sleepScore: 0.2,
  hrv: 0.15,
  weeklyVolume: 0.15,
  restingHeartRate: 0.1,
  readinessScore: 0.08,
  workoutIntensity: 0.07,
}

export const factorKeys = Object.keys(defaultWeights)

export function factorMetaFromHistory(history: UserMetrics[]) {
  const meta: Record<string, { min: number; max: number; mean: number; std: number; r2: number }> = {}
  for (const k of factorKeys) {
    const arr = history.map((d) => (d as any)[k] as number)
    const min = Math.min(...arr)
    const max = Math.max(...arr)
    const mean = arr.reduce((a, b) => a + b, 0) / arr.length
    const std = Math.sqrt(arr.reduce((s, v) => s + (v - mean) ** 2, 0) / arr.length)
    const r2 = defaultWeights[k] / Object.values(defaultWeights).reduce((a, b) => a + b, 0)
    meta[k] = { min, max, mean, std: std || 1, r2 }
  }
  return meta
}

export function calculateRSquared(weights: Record<string, number>) {
  const sum = Object.values(weights).reduce((a, b) => a + b, 0)
  const out: Record<string, number> = {}
  for (const [k, w] of Object.entries(weights)) out[k] = w / sum
  return out
}

export function calculateSHAP(
  factors: Record<string, number>,
  baseVO2Max: number,
  history: UserMetrics[],
) {
  const meta = factorMetaFromHistory(history)
  const shapValues: Record<string, number> = {}
  let totalContribution = 0

  for (const [factor, value] of Object.entries(factors)) {
    const m = meta[factor]
    const normalized = (value - m.mean) / (m.std || 1)
    const shap = normalized * (defaultWeights[factor] ?? 0) * 5 // scale to VO2 units
    shapValues[factor] = shap
    totalContribution += shap
  }

  const predictedVO2Max = baseVO2Max + totalContribution
  const r2 = calculateRSquared(defaultWeights)

  const shapArray: SHAPValueItem[] = Object.keys(shapValues)
    .map((k) => ({
      factorName: k,
      baseValue: baseVO2Max,
      shapValue: shapValues[k],
      currentValue: factors[k],
      normalizedImportance: r2[k],
    }))
    .sort((a, b) => Math.abs(b.shapValue) - Math.abs(a.shapValue))

  return { predictedVO2Max, shapValues, rSquaredContributions: r2, shapArray, meta }
}

