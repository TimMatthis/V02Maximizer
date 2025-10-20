import type { DailyMetrics, FeatureWeights, ThresholdWarning } from '../types'

function hrvBaseline(history: DailyMetrics[]) {
  const arr = history.slice(-30).map((d) => d.hrv)
  if (!arr.length) return 60
  return arr.reduce((a, b) => a + b, 0) / arr.length
}

function consecutiveBelow(history: DailyMetrics[], key: keyof DailyMetrics, threshold: number, days: number) {
  const recent = history.slice(-days)
  if (recent.length < days) return false
  return recent.every((d) => (d as any)[key] < threshold)
}

export function thresholdChecks(factors: FeatureWeights, history: DailyMetrics[]): ThresholdWarning[] {
  const warnings: ThresholdWarning[] = []

  if (factors.trainingLoad > 700 && factors.sleepScore < 70) {
    warnings.push({
      type: 'critical',
      factor: 'trainingLoad',
      message: '⚠️ OVERTRAINING RISK: High training load with poor sleep',
      currentValue: factors.trainingLoad,
      thresholdValue: 700,
      recommendation: 'Reduce training load by 20% and prioritize sleep. Model predicts VO2max could drop if this persists.',
    })
  }

  if (factors.trainingLoad > 800) {
    warnings.push({
      type: 'critical',
      factor: 'trainingLoad',
      message: '🛑 CRITICAL: Training load exceeded optimal threshold',
      currentValue: factors.trainingLoad,
      thresholdValue: 800,
      recommendation: 'Returns are negative. Take 2–3 rest days immediately.',
    })
  }

  const baseHRV = hrvBaseline(history)
  const pct = ((factors.hrv - baseHRV) / baseHRV) * 100
  if (pct < -20) {
    warnings.push({
      type: 'critical',
      factor: 'hrv',
      message: '🛑 CRITICAL: HRV is 20%+ below baseline',
      currentValue: factors.hrv,
      thresholdValue: Math.round(baseHRV * 0.8),
      recommendation: 'Strong indicator of overtraining. Skip next 2 workouts and focus on sleep and nutrition.',
    })
  }

  const sleepLow3 = consecutiveBelow(history, 'sleepScore' as any, 60, 3)
  if (factors.sleepScore < 60 && sleepLow3) {
    warnings.push({
      type: 'warning',
      factor: 'sleepScore',
      message: '⚠️ WARNING: Sleep score below 60 for 3+ days',
      currentValue: factors.sleepScore,
      thresholdValue: 60,
      recommendation: 'Reduce training intensity by 30% until sleep improves to 70+. Consider earlier bedtime and wind-down routine.',
    })
  }

  return warnings
}

