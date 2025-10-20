import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import { POPULATION_WEIGHTS } from '../utils/personas'
import AdvancedFactorControls from '../components/AdvancedFactorControls'
import DualTimeline from '../components/DualTimeline'
import PredictionDisplay from '../components/PredictionDisplay'
import SHAPWaterfall from '../components/SHAPWaterfall'
import ForcePlot from '../components/d3/ForcePlot'
import ImportanceRanking from '../components/ImportanceRanking'
import WeightEvolution from '../components/WeightEvolution'
import PerformanceMetrics from '../components/PerformanceMetrics'
import Insights from '../components/Insights'
import DependencyPlots from '../components/DependencyPlots'
import type { FeatureWeights } from '../types'
import { SimplifiedTreeSHAP } from '../utils/shapSimplified'
import PriorityPanel from '../components/PriorityPanel'
import ThresholdWarningBanner from '../components/ThresholdWarningBanner'
import { thresholdChecks } from '../utils/thresholds'

export default function DashboardView() {
  const { state, dispatch } = useAppState()
  const persona = state.personas[state.activePersonaIndex]
  const history = persona.history
  const day = history[state.activeIndex]

  const currentFeatures: FeatureWeights = useMemo(() => ({
    trainingLoad: state.factorOverrides.trainingLoad ?? day.trainingLoad,
    sleepScore: state.factorOverrides.sleepScore ?? day.sleepScore,
    hrv: state.factorOverrides.hrv ?? day.hrv,
    weeklyVolume: state.factorOverrides.weeklyVolume ?? day.weeklyVolume,
    restingHeartRate: state.factorOverrides.restingHeartRate ?? day.restingHeartRate,
    readinessScore: state.factorOverrides.readinessScore ?? day.readinessScore,
    workoutIntensity: state.factorOverrides.workoutIntensity ?? day.workoutIntensity,
    deepSleepMinutes: state.factorOverrides.deepSleepMinutes ?? day.deepSleepMinutes,
    recoveryTime: state.factorOverrides.recoveryTime ?? day.recoveryTime,
    bodyTemperature: state.factorOverrides.bodyTemperature ?? day.bodyTemperature,
  }), [state.factorOverrides, day])

  const backgroundMean = useMemo(() => {
    const means: any = {}
    for (const k of Object.keys(POPULATION_WEIGHTS)) {
      const arr = history.map((d) => (d as any)[k] as number)
      means[k] = arr.reduce((a, b) => a + b, 0) / arr.length
    }
    return means as FeatureWeights
  }, [history])

  const shapForCurrent = useMemo(() => {
    const featHist: Record<string, number[]> = {}
    for (const k of Object.keys(POPULATION_WEIGHTS)) featHist[k] = history.map((d) => (d as any)[k] as number)
    const weights = persona.personalWeights
    const calc = new SimplifiedTreeSHAP(persona.profile.baselineVO2Max, featHist, weights)
    return calc.calculateShapValues(currentFeatures, backgroundMean)
  }, [history, persona, currentFeatures, backgroundMean])

  const predictedNow = useMemo(() => persona.profile.baselineVO2Max + Object.values(shapForCurrent.features).reduce((s, f) => s + f.shapValue, 0), [shapForCurrent, persona.profile.baselineVO2Max])

  const personalizationPct = Math.min(1, persona.profile.daysOfData / 30)
  const personalizationLabel = persona.profile.daysOfData < 14 ? 'Using general model – personalization begins after ~2 weeks' : persona.profile.daysOfData < 30 ? `Model is ${(personalizationPct * 100).toFixed(0)}% personalized` : 'Fully personalized model'

  const [activeTab, setActiveTab] = useState<'waterfall' | 'force' | 'importance' | 'dependency'>('waterfall')
  const warnings = thresholdChecks(currentFeatures, history)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <ThresholdWarningBanner warnings={warnings} />
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 font-medium border border-primary-200">
            {personalizationLabel}
          </div>
        </div>
      </div>
      <main className="mx-auto grid max-w-7xl grid-cols-12 gap-6 px-6 pb-8">
        <aside className="col-span-3 rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-4 max-lg:col-span-12 sticky top-24 self-start">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm">⚙️</div>
              Factors
            </div>
            <select aria-label="Select user" className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium hover:border-primary-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-all" value={state.activePersonaIndex} onChange={(e) => dispatch({ type: 'setPersona', index: parseInt(e.target.value) })}>
              {state.personas.map((p, i) => (
                <option key={p.profile.id} value={i}>{p.profile.name}</option>
              ))}
            </select>
          </div>
          <AdvancedFactorControls
            history={history}
            dayIndex={state.activeIndex}
            population={persona.populationWeights as FeatureWeights}
            personal={persona.personalWeights as FeatureWeights}
            overrides={state.factorOverrides}
            shap={shapForCurrent}
            onChange={(k, v) => dispatch({ type: 'setFactor', key: k, value: v })}
            onResetAll={() => dispatch({ type: 'resetFactors' })}
            onOptimize={() => {
              const next: Partial<FeatureWeights> = {}
              for (const [k, f] of Object.entries(shapForCurrent.features)) {
                next[k as keyof FeatureWeights] = (f.shapValue >= 0 ? history.reduce((a, d) => Math.max(a, (d as any)[k] as number), -Infinity) : history.reduce((a, d) => Math.min(a, (d as any)[k] as number), Infinity)) as number
              }
              for (const [k, v] of Object.entries(next)) dispatch({ type: 'setFactor', key: k as keyof FeatureWeights, value: v as number })
            }}
            onSaveScenario={() => dispatch({ type: 'saveScenario', name: 'Scenario ' + (state.savedScenarios.length + 1) })}
          />
        </aside>

        <section className="col-span-6 flex flex-col gap-6 max-lg:col-span-12">
          {/* Priority hierarchy panel */}
          <PriorityPanel current={currentFeatures} shap={shapForCurrent} history={history} onAdjust={() => { /* handled via sliders */ }} />
          <PredictionDisplay predicted={predictedNow} baseline={persona.profile.baselineVO2Max} />

          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-5">
            <div className="mb-4 flex items-center justify-between gap-2">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-primary-600">📈</span>
                Timeline & SHAP Evolution
              </h2>
              <input type="range" min={0} max={history.length - 1} value={state.activeIndex} onChange={(e) => dispatch({ type: 'setActiveIndex', index: parseInt(e.target.value) })} className="w-64 accent-primary-500" />
            </div>
            <DualTimeline history={history} activeIndex={state.activeIndex} showFactors={state.showSHAPFactors} />
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-5">
            <div className="mb-4 flex gap-2 text-sm">
              {(['waterfall', 'force', 'importance', 'dependency'] as const).map((t) => (
                <button key={t} className={`rounded-lg px-4 py-2 font-medium transition-all duration-200 capitalize ${activeTab === t ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`} onClick={() => setActiveTab(t)}>
                  {t}
                </button>
              ))}
            </div>
            {activeTab === 'waterfall' && (
              <SHAPWaterfall base={persona.profile.baselineVO2Max} items={Object.entries(shapForCurrent.features).map(([k, v]) => ({ factorName: k, baseValue: persona.profile.baselineVO2Max, shapValue: v.shapValue, currentValue: v.value, normalizedImportance: v.percentageContribution }))} />
            )}
            {activeTab === 'force' && (
              <ForcePlot items={Object.entries(shapForCurrent.features).map(([k, v]) => ({ name: k, value: v.shapValue }))} />
            )}
            {activeTab === 'importance' && (
              <ImportanceRanking population={persona.populationWeights} personal={persona.personalWeights} />
            )}
            {activeTab === 'dependency' && (
              <DependencyPlots history={history} factors={Object.keys(POPULATION_WEIGHTS).slice(0, 4)} />
            )}
          </div>
        </section>

        <aside className="col-span-3 flex flex-col gap-4 max-lg:col-span-12">
          <WeightEvolution history={history} />
          <PerformanceMetrics history={history} />
          <Insights personal={persona.personalWeights} population={persona.populationWeights} />
        </aside>
      </main>

      <section className="mx-auto max-w-7xl px-6 pb-8">
        {state.savedScenarios.length > 0 && (
          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <span className="text-primary-600">🔬</span>
                Scenario Comparison
              </h2>
              <div className="text-xs text-neutral">Comparing current vs {state.savedScenarios[0].name}</div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
              <div>
                <div className="mb-2 text-sm font-medium">Current</div>
                <SHAPWaterfall base={persona.profile.baselineVO2Max} items={Object.entries(shapForCurrent.features).map(([k, v]) => ({ factorName: k, baseValue: persona.profile.baselineVO2Max, shapValue: v.shapValue, currentValue: v.value, normalizedImportance: v.percentageContribution }))} />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">{state.savedScenarios[0].name}</div>
                {(() => {
                  const featHist: Record<string, number[]> = {}
                  for (const k of Object.keys(POPULATION_WEIGHTS)) featHist[k] = history.map((d) => (d as any)[k] as number)
                  const calc = new SimplifiedTreeSHAP(persona.profile.baselineVO2Max, featHist, persona.personalWeights)
                  const sv = calc.calculateShapValues(state.savedScenarios[0].features as FeatureWeights, backgroundMean)
                  return (
                    <SHAPWaterfall base={persona.profile.baselineVO2Max} items={Object.entries(sv.features).map(([k, v]) => ({ factorName: k, baseValue: persona.profile.baselineVO2Max, shapValue: v.shapValue, currentValue: v.value, normalizedImportance: v.percentageContribution }))} />
                  )
                })()}
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}
