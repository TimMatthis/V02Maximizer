import type { DailyMetrics, FeatureWeights, PersonalizationLevel, ShapContributions, UserProfile } from '../types'
import { OnlineLearningSimulator } from './onlineLearning'
import { SimplifiedTreeSHAP } from './shapSimplified'
import { clamp } from './util'

export const POPULATION_WEIGHTS_VO2: FeatureWeights = {
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

export const POPULATION_WEIGHTS_POWER: FeatureWeights = {
  trainingLoad: 0.22,
  weeklyVolume: 0.20,
  workoutIntensity: 0.16,
  recoveryTime: 0.12,
  readinessScore: 0.10,
  sleepScore: 0.08,
  restingHeartRate: 0.05,
  hrv: 0.04,
  deepSleepMinutes: 0.02,
  bodyTemperature: 0.01,
}

// Legacy export for backwards compatibility
export const POPULATION_WEIGHTS = POPULATION_WEIGHTS_VO2

function normalizeWeights(w: FeatureWeights): FeatureWeights {
  const sum = Object.values(w).reduce((a, b) => a + b, 0)
  const out: any = {}
  for (const [k, v] of Object.entries(w)) out[k] = v / sum
  return out as FeatureWeights
}

function buildPersona(name: string, days: number, baselineVO2: number, baselinePower: number, emphasisVO2: Partial<FeatureWeights>, emphasisPower: Partial<FeatureWeights>) {
  const id = name.toLowerCase().replace(/\s+/g, '-')
  const weightsVO2 = normalizeWeights({ ...POPULATION_WEIGHTS_VO2, ...emphasisVO2 })
  const weightsPower = normalizeWeights({ ...POPULATION_WEIGHTS_POWER, ...emphasisPower })
  const profile: UserProfile = {
    id,
    name,
    personalizationLevel: (days < 14 ? 'population' : days < 30 ? 'personalizing' : 'personalized') as PersonalizationLevel,
    daysOfData: days,
    modelWeightsVO2: weightsVO2,
    modelWeightsPower: weightsPower,
    baselineVO2Max: baselineVO2,
    baselinePower: baselinePower,
  }
  return { profile, weightsVO2, weightsPower }
}

export type PersonaBundle = { 
  profile: UserProfile; 
  history: DailyMetrics[]; 
  populationWeightsVO2: FeatureWeights; 
  personalWeightsVO2: FeatureWeights;
  populationWeightsPower: FeatureWeights; 
  personalWeightsPower: FeatureWeights;
}

export function generatePersonas(): PersonaBundle[] {
  const personas = [
    // Existing Elites - High baseline, training load dominant
    buildPersona(
      'Existing Elite', 90, 58, 340,
      { trainingLoad: 0.40, weeklyVolume: 0.16, workoutIntensity: 0.10 }, // VO2 emphasis - training matters most
      { trainingLoad: 0.45, weeklyVolume: 0.25, workoutIntensity: 0.18 } // Power emphasis - volume critical
    ),
    // Gen Pop / Active Weekenders - Moderate baseline, recovery/sleep important
    buildPersona(
      'Active Weekender', 90, 45, 260,
      { sleepScore: 0.28, hrv: 0.20, readinessScore: 0.15, recoveryTime: 0.08 }, // VO2 emphasis - recovery matters
      { sleepScore: 0.15, readinessScore: 0.18, recoveryTime: 0.15, weeklyVolume: 0.18 } // Power emphasis
    ),
    // Early Elite - Talent Scouting - Young/developing, balanced response
    buildPersona(
      'Early Elite (Talent)', 60, 52, 290,
      { trainingLoad: 0.22, weeklyVolume: 0.18, sleepScore: 0.18, hrv: 0.15 }, // VO2 emphasis - balanced development
      { trainingLoad: 0.25, weeklyVolume: 0.22, workoutIntensity: 0.15, recoveryTime: 0.12 } // Power emphasis
    ),
  ]

  return personas.map(({ profile, weightsVO2, weightsPower }) => {
    const days = profile.daysOfData
    const history: DailyMetrics[] = []
    const baseWeightsVO2 = normalizeWeights(POPULATION_WEIGHTS_VO2)
    const baseWeightsPower = normalizeWeights(POPULATION_WEIGHTS_POWER)
    
    // Start from population and evolve to personal for VO2
    const weekSteps = Math.max(1, Math.floor(days / 7))
    const weightSnapshotsVO2: FeatureWeights[] = []
    const weightSnapshotsPower: FeatureWeights[] = []
    
    for (let w = 0; w < weekSteps; w++) {
      const t = Math.min(1, w / (weekSteps - 1 || 1))
      
      // VO2 model evolution
      const snapVO2: any = {}
      for (const k of Object.keys(baseWeightsVO2) as (keyof FeatureWeights)[]) {
        snapVO2[k] = baseWeightsVO2[k] * (1 - t) + (weightsVO2 as any)[k] * t
      }
      weightSnapshotsVO2.push(normalizeWeights(snapVO2 as FeatureWeights))
      
      // Power model evolution
      const snapPower: any = {}
      for (const k of Object.keys(baseWeightsPower) as (keyof FeatureWeights)[]) {
        snapPower[k] = baseWeightsPower[k] * (1 - t) + (weightsPower as any)[k] * t
      }
      weightSnapshotsPower.push(normalizeWeights(snapPower as FeatureWeights))
    }

    // Feature history containers for SHAP
    const featHist: Record<string, number[]> = {}
    for (const k of Object.keys(baseWeightsVO2)) featHist[k] = []

    // Generate daily data with correlations
    let vo2 = profile.baselineVO2Max
    let power = profile.baselinePower
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
      // Power scales similarly to VO2 but with different baseline
      power = clamp(
        profile.baselinePower + (cumulativeLoad / 1000) * 3 - ((30 - 30) * 0.5) + (Math.random() - 0.5) * 1.5,
        150,
        450,
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
        actualPower: i % 30 === 0 ? power + (Math.random() - 0.5) * 5 : undefined,
        predictedPower: power,
        shapValues: { baseValue: vo2, features: {} } as ShapContributions,
        shapValuesPower: { baseValue: power, features: {} } as ShapContributions,
      })
    }

    // Build SHAP and personalization via online learning - SEPARATE MODELS
    const backgroundMean = Object.fromEntries(Object.keys(baseWeightsVO2).map((k) => [k, featHist[k].reduce((a, b) => a + b, 0) / featHist[k].length])) as unknown as FeatureWeights
    
    const olsVO2 = new OnlineLearningSimulator(baseWeightsVO2, backgroundMean)
    const olsPower = new OnlineLearningSimulator(baseWeightsPower, backgroundMean)

    for (let i = 0; i < history.length; i++) {
      const weekIndex = Math.floor(i / 7)
      const instance = featuresFromDaily(history[i])
      
      // VO2 Model - interpolate weights weekly
      const currentWeightsVO2 = weightSnapshotsVO2[Math.min(weekIndex, weightSnapshotsVO2.length - 1)]
      const shapVO2 = new SimplifiedTreeSHAP(profile.baselineVO2Max, featHist, currentWeightsVO2)
      const shapValsVO2 = shapVO2.calculateShapValues(instance, backgroundMean)
      const predVO2 = profile.baselineVO2Max + Object.values(shapValsVO2.features).reduce((s, f) => s + f.shapValue, 0)
      history[i].predictedVO2Max = predVO2
      history[i].shapValues = shapValsVO2

      // Power Model - interpolate weights weekly (DIFFERENT WEIGHTS)
      const currentWeightsPower = weightSnapshotsPower[Math.min(weekIndex, weightSnapshotsPower.length - 1)]
      const shapPower = new SimplifiedTreeSHAP(profile.baselinePower, featHist, currentWeightsPower)
      const shapValsPower = shapPower.calculateShapValues(instance, backgroundMean)
      const predPower = profile.baselinePower + Object.values(shapValsPower.features).reduce((s, f) => s + f.shapValue, 0)
      history[i].predictedPower = predPower
      history[i].shapValuesPower = shapValsPower

      // Update online learning when we have ground truth - SEPARATE MODELS
      if (history[i].actualVO2Max != null) {
        olsVO2.updateWeights(instance, history[i].actualVO2Max!, predVO2)
      }
      if (history[i].actualPower != null) {
        olsPower.updateWeights(instance, history[i].actualPower!, predPower)
      }
    }

    const personalWeightsVO2 = olsVO2.getWeights()
    const personalWeightsPower = olsPower.getWeights()

    return {
      profile,
      history,
      populationWeightsVO2: baseWeightsVO2,
      personalWeightsVO2,
      populationWeightsPower: baseWeightsPower,
      personalWeightsPower,
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
