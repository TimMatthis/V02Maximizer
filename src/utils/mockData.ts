import type { UserMetrics } from '../types'

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n))
}

export function generateMockMetrics(days = 90): UserMetrics[] {
  const out: UserMetrics[] = []

  // Seeds
  let vo2 = 48 + Math.random() * 6 // 48-54
  let readiness = 75
  let hrv = 55
  let restingHR = 55
  let trainingLoad = 400
  let weeklyVolume = 35

  const start = new Date()
  start.setDate(start.getDate() - (days - 1))

  for (let i = 0; i < days; i++) {
    const d = new Date(start)
    d.setDate(start.getDate() + i)

    // Daily variations and correlations
    const sleepScore = clamp(70 + (Math.random() - 0.5) * 20, 60, 95)
    readiness = clamp(65 + (sleepScore - 70) * 0.6 + (Math.random() - 0.5) * 6, 50, 95)

    // Training dynamics
    const loadDelta = (Math.random() - 0.45) * 40
    trainingLoad = clamp(trainingLoad + loadDelta, 200, 800)
    weeklyVolume = clamp(weeklyVolume + loadDelta / 20, 15, 90)
    const workoutIntensity = clamp(4 + (trainingLoad - 400) / 200 + (Math.random() - 0.5) * 1.2, 1, 10)

    // Physiological response
    hrv = clamp(hrv + (80 - trainingLoad / 10) * 0.02 + (sleepScore - 70) * 0.05 + (Math.random() - 0.5) * 2, 30, 85)
    restingHR = clamp(restingHR + (trainingLoad - 400) * 0.01 - (sleepScore - 70) * 0.03 + (Math.random() - 0.5) * 1.2, 42, 70)

    // Performance trend (consistent training improves VO2)
    vo2 = clamp(vo2 + (weeklyVolume - 35) * 0.01 + (readiness - 70) * 0.005 + (Math.random() - 0.5) * 0.2, 45, 60)

    // Other metrics
    const avgHeartRate = clamp(120 + (Math.random() - 0.5) * 10 - (hrv - 55) * 0.3, 100, 150)
    const runningPace = clamp(5.2 - (vo2 - 48) * 0.05 + (Math.random() - 0.5) * 0.2, 4.2, 6.5) // min/km
    const deepSleepMinutes = clamp(80 + (sleepScore - 70) * 1.5 + (Math.random() - 0.5) * 20, 30, 140)
    const bodyTemperature = clamp(36.6 + (Math.random() - 0.5) * 0.6 + (readiness < 60 ? 0.3 : 0), 35.8, 37.8)

    // Environment (seasonality)
    const temperature = clamp(12 + Math.sin(i / 10) * 8 + (Math.random() - 0.5) * 2, -5, 35)
    const altitude = clamp(100 + Math.sin(i / 30) * 40 + (Math.random() - 0.5) * 20, 0, 800)

    out.push({
      date: d.toISOString().slice(0, 10),
      vo2max: parseFloat(vo2.toFixed(2)),
      trainingLoad: Math.round(trainingLoad),
      avgHeartRate: Math.round(avgHeartRate),
      runningPace: parseFloat(runningPace.toFixed(2)),
      weeklyVolume: parseFloat(weeklyVolume.toFixed(1)),
      workoutIntensity: parseFloat(workoutIntensity.toFixed(1)),
      sleepScore: Math.round(sleepScore),
      readinessScore: Math.round(readiness),
      hrv: Math.round(hrv),
      restingHeartRate: Math.round(restingHR),
      deepSleepMinutes: Math.round(deepSleepMinutes),
      bodyTemperature: parseFloat(bodyTemperature.toFixed(1)),
      temperature: Math.round(temperature),
      altitude: Math.round(altitude),
    })
  }

  return out
}

