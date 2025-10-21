import { useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import { POPULATION_WEIGHTS_VO2, POPULATION_WEIGHTS_POWER } from '../utils/personas'
import SingleFactorControl from '../components/SingleFactorControl'
import DualTimeline from '../components/DualTimeline'
import PredictionDisplay from '../components/PredictionDisplay'
import SHAPWaterfall from '../components/SHAPWaterfall'
import ForcePlot from '../components/d3/ForcePlot'
import ImportanceRanking from '../components/ImportanceRanking'
import WeightEvolution from '../components/WeightEvolution'
import { calculatePriorities } from '../utils/priority'
import PerformanceMetrics from '../components/PerformanceMetrics'
import Insights from '../components/Insights'
import DependencyPlots from '../components/DependencyPlots'
import type { FeatureWeights } from '../types'
import { SimplifiedTreeSHAP } from '../utils/shapSimplified'
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

  const priorities = useMemo(() => (
    calculatePriorities(currentFeatures, shapForCurrent, history)
  ), [currentFeatures, shapForCurrent, history])

  const topPriorityFactors = useMemo(() => (
    priorities.slice(0, 5).map((p) => p.factor)
  ), [priorities])

  const allFactors = useMemo(() => (
    Object.keys(populationWeights)
  ), [populationWeights])

  const otherFactors = useMemo(() => (
    allFactors.filter((f) => !topPriorityFactors.includes(f))
  ), [allFactors, topPriorityFactors])

  const personalizationPct = Math.min(1, persona.profile.daysOfData / 30)
  const personalizationLabel = persona.profile.daysOfData < 14 ? 'Using general model – personalization begins after ~2 weeks' : persona.profile.daysOfData < 30 ? `Model is ${(personalizationPct * 100).toFixed(0)}% personalized` : 'Fully personalized model'

  const [activeTab, setActiveTab] = useState<'waterfall' | 'force' | 'importance' | 'dependency'>('waterfall')
  const warnings = thresholdChecks(currentFeatures, history)
  const [showGuide, setShowGuide] = useState(() => {
    try { return localStorage.getItem('dash_guide_dismissed') !== '1' } catch { return true }
  })

return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white text-gray-900">
      <ThresholdWarningBanner warnings={warnings} />
      <div className="mx-auto max-w-7xl px-6 py-3">
        <div className="flex items-center gap-2 text-xs">
          <div className="px-3 py-1.5 rounded-full bg-primary-50 text-primary-700 font-medium border border-primary-200">
            {personalizationLabel}
          </div>
        </div>
        {showGuide && (
          <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900 p-4 text-sm flex items-start gap-3">
            <div className="font-bold">Welcome</div>
            <div className="flex-1">
              <div>How to use this dashboard:</div>
              <ol className="list-decimal pl-5 mt-1 space-y-1">
                <li>Select a persona and scrub the timeline.</li>
                <li>Review SHAP to see which factors influence performance.</li>
                <li>Adjust factor sliders to test what‑if scenarios.</li>
                <li>Use Priorities and set a goal in Goals & Plans.</li>
              </ol>
              <div className="mt-2">
                <a href="/graph-demo" className="underline">Try Graph Demo</a>
                <span className="mx-2">·</span>
                <a href="/data" className="underline">Connect Data</a>
              </div>
            </div>
            <button
              onClick={() => { try { localStorage.setItem('dash_guide_dismissed','1') } catch {} ; setShowGuide(false) }}
              className="ml-auto text-xs border px-2 py-1 rounded bg-white hover:bg-gray-50"
            >
              Dismiss
            </button>
          </div>
        )}
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
          {/* Controls are integrated with priority cards below to avoid duplication */}
        </aside>

        <section className="col-span-9 flex flex-col gap-6 max-xl:col-span-8 max-lg:col-span-12">
          {/* Priority hierarchy panel */}
          {/* Expanded single-card rows: Priority + integrated control */}
          <div className="grid grid-cols-12 gap-4 max-lg:grid-cols-1">
            {priorities.slice(0, 5).map((p) => (
              <div key={p.factor} className="contents max-lg:block">
                <div className={`col-span-12 rounded-2xl border shadow-card hover:shadow-card-hover transition-all duration-300 p-4 ${
                  p.severity === 'critical' ? 'bg-red-100 border-red-300' :
                  p.severity === 'high' ? 'bg-amber-100 border-amber-300' :
                  p.severity === 'moderate' ? 'bg-blue-100 border-blue-300' :
                  p.severity === 'low' ? 'bg-gray-100 border-gray-300' :
                  'bg-emerald-100 border-emerald-300'
                }`}>
                  <div className="grid grid-cols-12 gap-4 max-lg:grid-cols-1">
                    <div className="col-span-5 max-lg:col-span-12">
                      <div className="text-sm font-semibold text-gray-800 mb-2">🎯 Priority {p.rank}: <span className="capitalize">{p.factor}</span></div>
                      <div className="text-xs opacity-90 mb-2">Current: {p.currentValue.toFixed(1)} | Optimal: {p.optimalRange[0]}–{p.optimalRange[1]} | Impact: {p.currentImpact.toFixed(1)}</div>
                      <div className="text-sm">{p.recommendation}</div>
                      <div className="mt-2">
                        <a href="/goals" className="rounded-full border px-3 py-1 text-xs hover:bg-white/40 inline-flex items-center">Set Goal</a>
                      </div>
                    </div>
                    <div className="col-span-7 max-lg:col-span-12">
                      <SingleFactorControl
                        history={history}
                        dayIndex={state.activeIndex}
                        factorKey={p.factor}
                        overrides={state.factorOverrides}
                        shap={shapForCurrent}
                        personal={personalWeights}
                        population={populationWeights}
                        onChange={(k, v) => dispatch({ type: 'setFactor', key: k, value: v })}
                        unit={state.activeModel === 'VO2' ? 'ml/kg/min' : 'W'}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          {/* Render non-priority controls below as simple control cards */}
          {otherFactors.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              <div className="mb-2 text-sm font-semibold text-gray-700">Other factors</div>
              <div className="grid grid-cols-12 gap-4 max-lg:grid-cols-1">
                {otherFactors.map((factor) => (
                  <div key={factor} className="col-span-6 max-lg:col-span-12">
                    <div className="rounded-2xl border border-gray-200 bg-white p-4">
                      <div className="text-sm font-semibold text-gray-800 mb-2 capitalize">{factor}</div>
                      <SingleFactorControl
                        history={history}
                        dayIndex={state.activeIndex}
                        factorKey={factor}
                        overrides={state.factorOverrides}
                        shap={shapForCurrent}
                        personal={personalWeights}
                        population={populationWeights}
                        onChange={(k, v) => dispatch({ type: 'setFactor', key: k, value: v })}
                        unit={state.activeModel === 'VO2' ? 'ml/kg/min' : 'W'}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Personalized Insights below controls */}
          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-5">
            <Insights personal={personalWeights} population={populationWeights} modelType={state.activeModel} />
          </div>
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

          {/* Place weight evolution and performance metrics inline below the charts */}
          <div className="grid grid-cols-12 gap-4 max-lg:grid-cols-1">
            <div className="col-span-6 max-lg:col-span-12">
              <WeightEvolution history={history} />
            </div>
            <div className="col-span-6 max-lg:col-span-12">
              <PerformanceMetrics history={history} />
            </div>
          </div>
        </section>

        {/* Right aside removed — insights moved below controls */}
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
