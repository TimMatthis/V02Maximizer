import type { DailyMetrics, FeatureWeights, PersonalizationLevel, ShapContributions, UserProfile } from '../types'
import { OnlineLearningSimulator } from './onlineLearning'
import { SimplifiedTreeSHAP } from './shapSimplified'
import { clamp } from './util'

export const POPULATION_WEIGHTS: FeatureWeights = {
  trainingLoad: 0.18,
  sleepScore: 0.16,
  hrv: 0.14,
  weeklyVolume: 0.14,
  restingHeartRate: 0.10,
  readinessScore: 0.09,
  workoutIntensity: 0.07,
  deepSleepMinutes: 0.05,
  recoveryTime: 0.04,
  bodyTemperature: 0.03,
}

function normalizeWeights(w: FeatureWeights): FeatureWeights {
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  const out: any = {}
  for (const [k, v] of Object.entries(w)) out[k] = v / sum
  return out as FeatureWeights
}

function buildPersona(name: string, days: number, baselineVO2: number, emphasis: Partial<FeatureWeights>) {
  const id = name.toLowerCase().replace(/\s+/g, '-')
  const weights = normalizeWeights({ ...POPULATION_WEIGHTS, ...emphasis })
  const profile: UserProfile = {
    id,
    name,
    personalizationLevel: (days < 14 ? 'population' : days < 30 ? 'personalizing' : 'personalized') as PersonalizationLevel,
    daysOfData: days,
    modelWeights: weights,
    baselineVO2Max: baselineVO2,
  }
  return { profile, weights }
}

export type PersonaBundle = { profile: UserProfile; history: DailyMetrics[]; populationWeights: FeatureWeights; personalWeights: FeatureWeights }

export function generatePersonas(): PersonaBundle[] {
  const personas = [
    buildPersona('Elite Runner', 90, 58, { trainingLoad: 0.4, sleepScore: 0.08 }),
    buildPersona('Busy Professional', 90, 42, { sleepScore: 0.35, hrv: 0.25 }),
    buildPersona('New User', 10, 48, {}),
  ]

  return personas.map(({ profile, weights }) => {
    const days = profile.daysOfData
    const history: DailyMetrics[] = []
    const baseWeights = normalizeWeights(POPULATION_WEIGHTS)
    // Start from population and evolve to personal
    const weekSteps = Math.max(1, Math.floor(days / 7))
    const weightSnapshots: FeatureWeights[] = []
    for (let w = 0; w < weekSteps; w++) {
      const t = Math.min(1, w / (weekSteps - 1 || 1))
      const snap: any = {}
      for (const k of Object.keys(baseWeights) as (keyof FeatureWeights)[]) {
        snap[k] = baseWeights[k] * (1 - t) + (weights as any)[k] * t
      }
      weightSnapshots.push(normalizeWeights(snap as FeatureWeights))
    }

    // Feature history containers for SHAP
    const featHist: Record<string, number[]> = {}
    for (const k of Object.keys(baseWeights)) featHist[k] = []

    // Generate daily data with correlations
    let vo2 = profile.baselineVO2Max
    let cumulativeLoad = 0
    let lastSleep = 80
    let lastTraining = 400
    let readiness = 75

    for (let i = 0; i < days; i++) {
      const date = new Date()
      date.setDate(date.getDate() - (days - 1 - i))

      const trainingLoad = clamp(lastTraining + (Math.random() - 0.45) * 50, 200, 900)
      const weeklyVolume = clamp(30 + (trainingLoad - 400) / 18 + (Math.random() - 0.5) * 5, 10, 120)
      const workoutIntensity = clamp(5 + (trainingLoad - 400) / 250 + (Math.random() - 0.5), 1, 10)

      const sleepScore = clamp(75 + (Math.random() - 0.5) * 20, 50, 98)
      const deepSleepMinutes = clamp(80 + (sleepScore - 75) * 1.8 + (Math.random() - 0.5) * 25, 40, 180)
      const recoveryTime = clamp(24 + (trainingLoad - 400) / 40 + (Math.random() - 0.5) * 6, 6, 72)
      const hrv = clamp(55 + (lastSleep - 80) * 0.3 + (Math.random() - 0.5) * 5, 25, 95)
      const restingHeartRate = clamp(55 + (lastTraining - 400) * 0.02 - (sleepScore - 80) * 0.1 + (Math.random() - 0.5) * 2, 40, 75)
      readiness = clamp(70 - (recoveryTime - 24) * 2 + (sleepScore - 75) * 0.5 + (Math.random() - 0.5) * 6, 40, 100)
      const bodyTemperature = clamp(36.6 + (Math.random() - 0.5) * 0.6 + (readiness < 55 ? 0.3 : 0), 35.8, 37.9)

      cumulativeLoad += trainingLoad
      vo2 = clamp(
        profile.baselineVO2Max + (cumulativeLoad / 1000) * 0.5 - ((30 - 30) * 0.1) + (Math.random() - 0.5) * 0.2,
        38,
        70,
      )

      // Store feature history
      const features: FeatureWeights = {
        trainingLoad,
        sleepScore,
        hrv,
        weeklyVolume,
        restingHeartRate,
        readinessScore: readiness,
        workoutIntensity,
        deepSleepMinutes,
        recoveryTime,
        bodyTemperature,
      }
      for (const [k, v] of Object.entries(features)) featHist[k].push(v)

      lastSleep = sleepScore
      lastTraining = trainingLoad

      history.push({
        date: date.toISOString().slice(0, 10),
        ...features,
        actualVO2Max: i % 30 === 0 ? vo2 + (Math.random() - 0.5) * 0.8 : undefined, // monthly ground truth
        predictedVO2Max: vo2,
        shapValues: { baseValue: vo2, features: {} } as ShapContributions,
      })
    }

    // Build SHAP and personalization via online learning
    const ols = new OnlineLearningSimulator(baseWeights, Object.fromEntries(Object.keys(baseWeights).map((k) => [k, featHist[k].reduce((a, b) => a + b, 0) / featHist[k].length])) as unknown as FeatureWeights)

    let currentWeights = { ...baseWeights }
    for (let i = 0; i < history.length; i++) {
      // Interpolate weights weekly toward persona weights
      const weekIndex = Math.floor(i / 7)
      const snap = weightSnapshots[Math.min(weekIndex, weightSnapshots.length - 1)]
      currentWeights = { ...snap }

      const baseValue = profile.baselineVO2Max
      const shap = new SimplifiedTreeSHAP(baseValue, featHist, currentWeights)
      const instance = featuresFromDaily(history[i])
      const backgroundMean = Object.fromEntries(Object.keys(instance).map((k) => [k, featHist[k].reduce((a, b) => a + b, 0) / featHist[k].length])) as unknown as FeatureWeights
      const shapVals = shap.calculateShapValues(instance, backgroundMean)

      const pred = baseValue + Object.values(shapVals.features).reduce((s, f) => s + f.shapValue, 0)
      history[i].predictedVO2Max = pred
      history[i].shapValues = shapVals

      // Update online learning when we have ground truth
      if (history[i].actualVO2Max != null) {
        ols.updateWeights(instance, history[i].actualVO2Max!, pred)
      }
    }

    const personalWeights = ols.getWeights()

    return {
      profile,
      history,
      populationWeights: baseWeights,
      personalWeights,
    }
  })
}

function featuresFromDaily(d: DailyMetrics): FeatureWeights {
  return {
    trainingLoad: d.trainingLoad,
    sleepScore: d.sleepScore,
    hrv: d.hrv,
    weeklyVolume: d.weeklyVolume,
    restingHeartRate: d.restingHeartRate,
    readinessScore: d.readinessScore,
    workoutIntensity: d.workoutIntensity,
    deepSleepMinutes: d.deepSleepMinutes,
    recoveryTime: d.recoveryTime,
    bodyTemperature: d.bodyTemperature,
  }
}
