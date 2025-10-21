import { createContext, useContext, useEffect, useMemo, useReducer } from 'react'
import type { DailyMetrics, FeatureWeights, ModelType } from '../types'
import { generatePersonas, POPULATION_WEIGHTS_VO2 } from '../utils/personas'

type Scenario = { id: string; name: string; features: FeatureWeights }
export type Goal = {
  id: string
  personaId: string
  metric: ModelType // 'VO2' or 'Power'
  createdAt: string
  baselineAtCreation: number
  target: number
  horizonWeeks: number
  assumptions: { factor: keyof FeatureWeights; target: number }[]
  planHistory?: Array<{
    ts: string
    assumptions: { factor: keyof FeatureWeights; target: number }[]
    predictedAtSave: number
  }>
  status?: {
    lastEvaluatedAt: string
    current: number
    delta: number
    weeksElapsed: number
    weeklyProgress: number
    requiredWeeklyGain: number
    onTrack: boolean
    suggestedAdjustment?: number
  }
}

type AppModel = {
  personas: ReturnType<typeof generatePersonas>
  activePersonaIndex: number
  activeIndex: number
  dateRange: '1M' | '3M' | '6M' | 'ALL'
  factorOverrides: Partial<FeatureWeights>
  savedScenarios: Scenario[]
  showSHAPFactors: Record<string, boolean>
  activeModel: ModelType
  savedGoals: Goal[]
  calibration: { VO2: boolean; Power: boolean }
}

type Action =
  | { type: 'setPersona'; index: number }
  | { type: 'setActiveIndex'; index: number }
  | { type: 'setDateRange'; range: AppModel['dateRange'] }
  | { type: 'setFactor'; key: keyof FeatureWeights; value: number }
  | { type: 'resetFactors' }
  | { type: 'saveScenario'; name: string }
  | { type: 'toggleFactor'; key: keyof FeatureWeights; on?: boolean }
  | { type: 'setModel'; model: ModelType }
  | { type: 'saveGoal'; goal: Goal }
  | { type: 'updateGoalStatus'; id: string; status: NonNullable<Goal['status']> }
  | { type: 'applyOnlineCalibration'; model: ModelType; features: FeatureWeights; measured: number; predicted: number }
  | { type: 'appendPlanSnapshot'; id: string; snapshot: NonNullable<Goal['planHistory']>[number] }
  | { type: 'setCalibration'; model: ModelType; enabled: boolean }

function reducer(state: AppModel, action: Action): AppModel {
  switch (action.type) {
    case 'setPersona':
      return { ...state, activePersonaIndex: action.index, activeIndex: state.personas[action.index].history.length - 1, factorOverrides: {} }
    case 'setActiveIndex':
      return { ...state, activeIndex: action.index, factorOverrides: {} }
    case 'setDateRange':
      return { ...state, dateRange: action.range }
    case 'setFactor':
      return { ...state, factorOverrides: { ...state.factorOverrides, [action.key]: action.value } }
    case 'resetFactors':
      return { ...state, factorOverrides: {} }
    case 'saveScenario': {
      const persona = state.personas[state.activePersonaIndex]
      const day = persona.history[state.activeIndex]
      const features = { ...pickFeatures(day), ...state.factorOverrides }
      const id = `${Date.now()}`
      const scenario: Scenario = { id, name: action.name, features }
      return { ...state, savedScenarios: [...state.savedScenarios, scenario] }
    }
    case 'toggleFactor':
      return { ...state, showSHAPFactors: { ...state.showSHAPFactors, [action.key]: action.on ?? !state.showSHAPFactors[action.key as string] } }
    case 'setModel':
      return { ...state, activeModel: action.model, factorOverrides: {} }
    case 'saveGoal': {
      return { ...state, savedGoals: [...state.savedGoals, action.goal] }
    }
    case 'updateGoalStatus': {
      return {
        ...state,
        savedGoals: state.savedGoals.map(g => g.id === action.id ? { ...g, status: action.status } : g)
      }
    }
    case 'appendPlanSnapshot': {
      return {
        ...state,
        savedGoals: state.savedGoals.map(g => g.id === action.id ? { ...g, planHistory: [...(g.planHistory ?? []), action.snapshot] } : g)
      }
    }
    case 'setCalibration': {
      const next = { ...state.calibration }
      next[action.model] = action.enabled
      return { ...state, calibration: next }
    }
    case 'applyOnlineCalibration': {
      const lr = 0.01
      const idx = state.activePersonaIndex
      const persona = state.personas[idx]
      // compute simple background mean from history
      const hist = persona.history
      const keys = Object.keys((hist[0] ?? {})).filter(k => (k in (persona.personalWeightsVO2 as any))) as (keyof FeatureWeights)[]
      const means: any = {}
      keys.forEach(k => { means[k] = hist.reduce((s, d) => s + ((d as any)[k] as number), 0) / (hist.length || 1) })
      const err = action.measured - action.predicted
      const update = (w: FeatureWeights) => {
        const out: any = { ...w }
        for (const k of keys) {
          const contrib = Math.abs((action.features[k] as number) - (means[k] as number))
          out[k] = (out[k] as number) + lr * err * contrib
        }
        // normalize to sum 1 and clamp >= 0
        let sum = 0
        for (const k of keys) { out[k] = Math.max(0, out[k] as number); sum += out[k] as number }
        if (sum > 0) for (const k of keys) out[k] = (out[k] as number) / sum
        return out as FeatureWeights
      }
      const updated = { ...state.personas }
      if (action.model === 'VO2') {
        (updated as any)[idx] = { ...persona, personalWeightsVO2: update(persona.personalWeightsVO2) }
      } else {
        (updated as any)[idx] = { ...persona, personalWeightsPower: update(persona.personalWeightsPower) }
      }
      const personasNext = (Object.values(updated) as any) as AppModel['personas']
      return { ...state, personas: personasNext }
    }
    default:
      return state
  }
}

function pickFeatures(d: DailyMetrics): FeatureWeights {
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

const AppStateContext = createContext<{ state: AppModel; dispatch: React.Dispatch<Action> } | null>(null)

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const personas = useMemo(() => generatePersonas(), [])
  const initial: AppModel = {
    personas,
    activePersonaIndex: 0,
    activeIndex: personas[0].history.length - 1,
    dateRange: '3M',
    factorOverrides: {},
    savedScenarios: [],
    showSHAPFactors: Object.fromEntries(Object.keys(POPULATION_WEIGHTS_VO2).map((k) => [k, true])) as Record<string, boolean>,
    activeModel: 'VO2',
    savedGoals: [],
    calibration: { VO2: true, Power: true },
  }
  // Initialize from localStorage if present
  const boot = useMemo(() => {
    try {
      const raw = localStorage.getItem('saved_goals')
      if (raw) {
        const parsed = JSON.parse(raw)
        if (Array.isArray(parsed)) initial.savedGoals = parsed
      }
    } catch {}
    return initial
  }, [])

  const [state, dispatch] = useReducer(reducer, boot)

  // Persist goals to localStorage on change
  useEffect(() => {
    try { localStorage.setItem('saved_goals', JSON.stringify(state.savedGoals)) } catch {}
  }, [state.savedGoals])
  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
