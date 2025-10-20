export type ModelType = 'VO2' | 'Power'

export interface UserMetrics {
  date: string
  vo2max: number
  power?: number

  // Garmin metrics
  trainingLoad: number
  avgHeartRate: number
  runningPace: number
  weeklyVolume: number
  workoutIntensity: number

  // Oura metrics
  sleepScore: number
  readinessScore: number
  hrv: number
  restingHeartRate: number
  deepSleepMinutes: number
  bodyTemperature: number

  // Environmental
  temperature: number
  altitude: number
}

export interface SHAPValueItem {
  factorName: string
  baseValue: number
  shapValue: number
  currentValue: number
  normalizedImportance: number
}

// Expanded domain types for advanced wireframe
export type PersonalizationLevel = 'population' | 'personalizing' | 'personalized'

export interface FeatureWeights {
  trainingLoad: number
  sleepScore: number
  hrv: number
  weeklyVolume: number
  restingHeartRate: number
  readinessScore: number
  workoutIntensity: number
  deepSleepMinutes: number
  recoveryTime: number
  bodyTemperature: number
}

export interface UserProfile {
  id: string
  name: string
  personalizationLevel: PersonalizationLevel
  daysOfData: number
  modelWeightsVO2: FeatureWeights
  modelWeightsPower: FeatureWeights
  baselineVO2Max: number
  baselinePower: number
}

export interface ShapContributions {
  baseValue: number
  features: {
    [key: string]: {
      value: number
      shapValue: number
      percentageContribution: number
    }
  }
}

export interface DailyMetrics extends FeatureWeights {
  date: string
  actualVO2Max?: number
  predictedVO2Max: number
  actualPower?: number
  predictedPower: number
  shapValues: ShapContributions
  shapValuesPower: ShapContributions
}

// Non-linear response curve types
export interface FactorResponseCurve {
  factor: keyof FeatureWeights | string
  currentValue: number
  optimalRange: [number, number]
  thresholdPoint: number
  criticalPoint: number
  curveType: 'linear' | 'inverted-u' | 'exponential' | 'logarithmic'
  dataPoints: Array<{ value: number; impact: number }>
}

export interface PriorityAction {
  rank: number
  factor: string
  severity: 'critical' | 'high' | 'moderate' | 'low' | 'maintain'
  currentValue: number
  optimalRange: [number, number]
  currentImpact: number
  potentialGain: number
  distanceFromOptimal: number
  actionText: string
  urgencyScore: number
  recommendation: string
  timeToImpact: string
}

export interface ThresholdWarning {
  type: 'info' | 'warning' | 'critical'
  factor: string
  message: string
  currentValue: number
  thresholdValue: number
  recommendation: string
  learnMoreUrl?: string
}
