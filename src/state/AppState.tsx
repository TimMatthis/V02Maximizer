import { createContext, useContext, useMemo, useReducer } from 'react'
import type { DailyMetrics, FeatureWeights, ModelType } from '../types'
import { generatePersonas, POPULATION_WEIGHTS_VO2 } from '../utils/personas'

type Scenario = { id: string; name: string; features: FeatureWeights }

type AppModel = {
  personas: ReturnType<typeof generatePersonas>
  activePersonaIndex: number
  activeIndex: number
  dateRange: '1M' | '3M' | '6M' | 'ALL'
  factorOverrides: Partial<FeatureWeights>
  savedScenarios: Scenario[]
  showSHAPFactors: Record<string, boolean>
  activeModel: ModelType
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
  }
  const [state, dispatch] = useReducer(reducer, initial)
  return <AppStateContext.Provider value={{ state, dispatch }}>{children}</AppStateContext.Provider>
}

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used within AppStateProvider')
  return ctx
}
