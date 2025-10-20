import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import { POPULATION_WEIGHTS_VO2, POPULATION_WEIGHTS_POWER } from '../utils/personas'
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
    const popWeights = state.activeModel === 'VO2' ? POPULATION_WEIGHTS_VO2 : POPULATION_WEIGHTS_POWER
    for (const k of Object.keys(popWeights)) {
      const arr = history.map((d) => (d as any)[k] as number)
      means[k] = arr.reduce((a, b) => a + b, 0) / arr.length
    }
    return means as FeatureWeights
  }, [history, state.activeModel])

  const baselineValue = useMemo(() => 
    state.activeModel === 'VO2' ? persona.profile.baselineVO2Max : persona.profile.baselinePower,
    [state.activeModel, persona.profile]
  )

  const personalWeights = useMemo(() => 
    state.activeModel === 'VO2' ? persona.personalWeightsVO2 : persona.personalWeightsPower,
    [state.activeModel, persona]
  )

  const populationWeights = useMemo(() => 
    state.activeModel === 'VO2' ? persona.populationWeightsVO2 : persona.populationWeightsPower,
    [state.activeModel, persona]
  )

  const shapForCurrent = useMemo(() => {
    const featHist: Record<string, number[]> = {}
    const popWeights = state.activeModel === 'VO2' ? POPULATION_WEIGHTS_VO2 : POPULATION_WEIGHTS_POWER
    for (const k of Object.keys(popWeights)) featHist[k] = history.map((d) => (d as any)[k] as number)
    const calc = new SimplifiedTreeSHAP(baselineValue, featHist, personalWeights)
    return calc.calculateShapValues(currentFeatures, backgroundMean)
  }, [history, currentFeatures, backgroundMean, baselineValue, personalWeights, state.activeModel])

  const predictedNow = useMemo(() => baselineValue + Object.values(shapForCurrent.features).reduce((s, f) => s + f.shapValue, 0), [shapForCurrent, baselineValue])

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
          <div className="mb-4">
            <div className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm">👤</div>
              Athlete Profile
            </div>
            <div className="mb-4 space-y-2">
              {state.personas.map((p, i) => (
                <button
                  key={p.profile.id}
                  onClick={() => dispatch({ type: 'setPersona', index: i })}
                  className={`w-full text-left rounded-lg border p-3 transition-all duration-200 ${
                    state.activePersonaIndex === i
                      ? 'border-green-600 bg-green-600 text-white shadow-md'
                      : 'border-gray-200 hover:bg-gray-100 text-gray-900'
                  }`}
                >
                  <div className={`font-semibold text-sm ${state.activePersonaIndex === i ? 'text-white' : 'text-gray-900'}`}>{p.profile.name}</div>
                  <div className={`text-xs mt-0.5 ${state.activePersonaIndex === i ? 'text-green-50' : 'text-gray-600'}`}>
                    {i === 0 && 'High-performance athlete, training-focused'}
                    {i === 1 && 'Recreational athlete, recovery-focused'}
                    {i === 2 && 'Developing talent, balanced approach'}
                  </div>
                </button>
              ))}
            </div>
            <div className="border-t border-gray-200 my-4"></div>
            <div className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-sm">⚙️</div>
              Controls
            </div>
            <div className="flex items-center gap-2 text-sm mb-3">
              <span className="text-gray-600 font-medium">Model:</span>
              <div className="inline-flex items-center rounded-lg border border-gray-300 overflow-hidden shadow-sm">
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${state.activeModel === 'VO2' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                  onClick={() => dispatch({ type: 'setModel', model: 'VO2' })}
                >
                  VO2max
                </button>
                <button
                  type="button"
                  className={`px-3 py-1.5 text-sm font-semibold transition-all duration-200 ${state.activeModel === 'Power' ? 'bg-green-600 text-white shadow-md' : 'bg-white text-gray-900 hover:bg-gray-100'}`}
                  onClick={() => dispatch({ type: 'setModel', model: 'Power' })}
                >
                  Power
                </button>
              </div>
            </div>
          </div>
          <AdvancedFactorControls
            history={history}
            dayIndex={state.activeIndex}
            population={populationWeights}
            personal={personalWeights}
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
          <PredictionDisplay predicted={predictedNow} baseline={baselineValue} modelType={state.activeModel} />

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
              <SHAPWaterfall base={baselineValue} items={Object.entries(shapForCurrent.features).map(([k, v]) => ({ factorName: k, baseValue: baselineValue, shapValue: v.shapValue, currentValue: v.value, normalizedImportance: v.percentageContribution }))} modelType={state.activeModel} />
            )}
            {activeTab === 'force' && (
              <ForcePlot items={Object.entries(shapForCurrent.features).map(([k, v]) => ({ name: k, value: v.shapValue }))} />
            )}
            {activeTab === 'importance' && (
              <ImportanceRanking population={populationWeights} personal={personalWeights} />
            )}
            {activeTab === 'dependency' && (
              <DependencyPlots history={history} factors={Object.keys(populationWeights).slice(0, 4)} />
            )}
          </div>
        </section>

        <aside className="col-span-3 flex flex-col gap-4 max-lg:col-span-12">
          <WeightEvolution history={history} />
          <PerformanceMetrics history={history} />
          <Insights personal={personalWeights} population={populationWeights} modelType={state.activeModel} />
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
                <SHAPWaterfall base={baselineValue} items={Object.entries(shapForCurrent.features).map(([k, v]) => ({ factorName: k, baseValue: baselineValue, shapValue: v.shapValue, currentValue: v.value, normalizedImportance: v.percentageContribution }))} modelType={state.activeModel} />
              </div>
              <div>
                <div className="mb-2 text-sm font-medium">{state.savedScenarios[0].name}</div>
                {(() => {
                  const featHist: Record<string, number[]> = {}
                  const popWeights = state.activeModel === 'VO2' ? POPULATION_WEIGHTS_VO2 : POPULATION_WEIGHTS_POWER
                  for (const k of Object.keys(popWeights)) featHist[k] = history.map((d) => (d as any)[k] as number)
                  const calc = new SimplifiedTreeSHAP(baselineValue, featHist, personalWeights)
                  const sv = calc.calculateShapValues(state.savedScenarios[0].features as FeatureWeights, backgroundMean)
                  return (
                    <SHAPWaterfall base={baselineValue} items={Object.entries(sv.features).map(([k, v]) => ({ factorName: k, baseValue: baselineValue, shapValue: v.shapValue, currentValue: v.value, normalizedImportance: v.percentageContribution }))} modelType={state.activeModel} />
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
