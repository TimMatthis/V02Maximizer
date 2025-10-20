import type { FactorResponseCurve } from '../types'

export type FactorParams = {
  optimalRange: [number, number]
  thresholdPoint: number
  criticalPoint: number
  curveType: 'linear' | 'inverted-u' | 'exponential' | 'logarithmic'
}

export const factorParameters: Record<string, FactorParams> = {
  trainingLoad: { optimalRange: [450, 600], thresholdPoint: 700, criticalPoint: 850, curveType: 'inverted-u' },
  sleepScore: { optimalRange: [80, 90], thresholdPoint: 60, criticalPoint: 50, curveType: 'exponential' },
  hrv: { optimalRange: [60, 80], thresholdPoint: 45, criticalPoint: 35, curveType: 'logarithmic' },
  weeklyVolume: { optimalRange: [40, 70], thresholdPoint: 90, criticalPoint: 110, curveType: 'inverted-u' },
  restingHeartRate: { optimalRange: [45, 55], thresholdPoint: 60, criticalPoint: 65, curveType: 'exponential' },
  readinessScore: { optimalRange: [75, 90], thresholdPoint: 60, criticalPoint: 50, curveType: 'linear' },
  workoutIntensity: { optimalRange: [5, 7.5], thresholdPoint: 8.5, criticalPoint: 9.5, curveType: 'inverted-u' },
  deepSleepMinutes: { optimalRange: [90, 130], thresholdPoint: 60, criticalPoint: 40, curveType: 'logarithmic' },
  recoveryTime: { optimalRange: [24, 36], thresholdPoint: 48, criticalPoint: 60, curveType: 'inverted-u' },
  bodyTemperature: { optimalRange: [36.3, 36.8], thresholdPoint: 37.2, criticalPoint: 37.6, curveType: 'exponential' },
}

// Non-linear response functions: returns impact in approx ml/kg/min units
export const factorResponseFunctions: Record<string, (value: number, baseline?: number) => number> = {
  trainingLoad: (tss: number) => {
    const optimal = 520
    const threshold = 700
    const critical = 850
    if (tss < optimal) return (tss / optimal) * 2.5
    if (tss < threshold) {
      const ratio = (tss - optimal) / (threshold - optimal)
      return 2.5 - ratio * 0.8
    }
    if (tss < critical) {
      const ratio = (tss - threshold) / (critical - threshold)
      return 1.7 - ratio * 3.0
    }
    return -1.3 - ((tss - critical) / 100) * 0.5
  },
  sleepScore: (score: number) => {
    if (score < 60) return -2.0 * Math.exp((60 - score) / 20)
    if (score < 75) return (score - 60) * 0.1
    if (score < 90) return 1.5 + (score - 75) * 0.08
    return 2.7
  },
  hrv: (value: number, baseline = 60) => {
    const pct = ((value - baseline) / baseline) * 100
    if (pct < -20) return -2.5
    if (pct < -10) return -0.5 - Math.abs(pct + 10) * 0.15
    if (pct < 10) return pct * 0.05
    return 0.5 + Math.log(pct - 9) * 0.2
  },
  weeklyVolume: (v: number) => {
    const [low, high] = factorParameters.weeklyVolume.optimalRange
    if (v < low) return (v / low) * 1.6
    if (v <= high) return 1.6 + ((v - low) / (high - low)) * 0.6
    if (v <= 100) return 2.2 - ((v - high) / 30) * 1.2
    return -0.2
  },
  restingHeartRate: (rhr: number) => {
    if (rhr < 50) return 0.6
    if (rhr < 55) return 0.2
    if (rhr < 60) return -0.2
    if (rhr < 65) return -0.6
    return -1.0
  },
  readinessScore: (r: number) => (r - 70) * 0.05,
  workoutIntensity: (i: number) => (i <= 8 ? (i - 5) * 0.4 : 1.2 - (i - 8) * 0.8),
  deepSleepMinutes: (m: number) => (m < 60 ? -0.8 + (m - 60) * 0.01 : Math.min(1.2, (m - 90) * 0.02)),
  recoveryTime: (h: number) => (h < 24 ? -0.4 : h <= 36 ? 0.4 : h <= 48 ? -0.4 : -1.0),
  bodyTemperature: (t: number) => (t <= 36.8 ? 0.1 : -0.5 - (t - 36.8) * 0.6),
}

export function buildCurveData(key: string, min: number, max: number, baseline?: number): FactorResponseCurve {
  const params = factorParameters[key] || { optimalRange: [min, max] as [number, number], thresholdPoint: max, criticalPoint: max, curveType: 'linear' as const }
  const step = (max - min) / 24
  const dataPoints = [] as { value: number; impact: number }[]
  for (let v = min; v <= max; v += step) {
    const fn = factorResponseFunctions[key] || ((x: number) => ((x - (min + max) / 2) / (max - min)) * 1.0)
    dataPoints.push({ value: v, impact: fn(v, baseline) })
  }
  return {
    factor: key,
    currentValue: min,
    optimalRange: params.optimalRange,
    thresholdPoint: params.thresholdPoint,
    criticalPoint: params.criticalPoint,
    curveType: params.curveType,
    dataPoints,
  }
}

export function normalizeValue(val: number, min: number, max: number, width = 100) {
  return ((val - min) / (max - min)) * width
}

export function scaleImpact(impact: number, minImp: number, maxImp: number, height = 30) {
  if (maxImp === minImp) return height / 2
  const norm = (impact - minImp) / (maxImp - minImp)
  // flip y (SVG origin top-left)
  return height - norm * height
}
