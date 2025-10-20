import { useEffect, useMemo, useState } from 'react'
import { useAppState } from '../state/AppState'
import type { FeatureWeights } from '../types'
import { SimplifiedTreeSHAP } from '../utils/shapSimplified'
import { calculatePriorities, severityStyles } from '../utils/priority'
import { factorParameters, factorResponseFunctions } from '../utils/responseCurves'

export default function GoalsPlans() {
  const { state, dispatch } = useAppState()
  const persona = state.personas[state.activePersonaIndex]
  const history = persona.history
  const day = history[state.activeIndex]

  const [vo2Targeted, setVo2Targeted] = useState(true)

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
    for (const k of Object.keys(currentFeatures)) {
      const arr = history.map((d) => (d as any)[k] as number)
      means[k] = arr.reduce((a, b) => a + b, 0) / arr.length
    }
    return means as FeatureWeights
  }, [history, currentFeatures])

  const shapForCurrent = useMemo(() => {
    const featHist: Record<string, number[]> = {}
    for (const k of Object.keys(currentFeatures)) featHist[k] = history.map((d) => (d as any)[k] as number)
    const weights = persona.personalWeights
    const calc = new SimplifiedTreeSHAP(persona.profile.baselineVO2Max, featHist, weights)
    return calc.calculateShapValues(currentFeatures, backgroundMean)
  }, [history, persona, currentFeatures, backgroundMean])

  const predictedNow = useMemo(
    () => persona.profile.baselineVO2Max + Object.values(shapForCurrent.features).reduce((s, f) => s + f.shapValue, 0),
    [shapForCurrent, persona.profile.baselineVO2Max],
  )

  const [targetVO2, setTargetVO2] = useState<number | null>(null)
  useEffect(() => {
    if (targetVO2 == null) setTargetVO2(Number((predictedNow + 2).toFixed(1)))
  }, [predictedNow])

  const topFactors = useMemo(() => {
    const entries = Object.entries(shapForCurrent.features)
    return entries
      .sort((a, b) => b[1].percentageContribution - a[1].percentageContribution)
      .slice(0, 5)
  }, [shapForCurrent])

  const priorities = useMemo(() => calculatePriorities(currentFeatures, shapForCurrent, history), [currentFeatures, shapForCurrent, history])
  const topPlan = priorities.slice(0, 3)

  function applySuggestedTargets() {
    for (const p of topPlan) {
      const mid = (p.optimalRange[0] + p.optimalRange[1]) / 2
      dispatch({ type: 'setFactor', key: p.factor as keyof FeatureWeights, value: mid })
    }
    dispatch({ type: 'saveScenario', name: 'VO2 Plan' })
  }

  function clearOverrides() {
    dispatch({ type: 'resetFactors' })
  }

  const CATEGORY_MAP: Record<'Training' | 'Sleep' | 'Recovery', (keyof FeatureWeights | string)[]> = {
    Training: ['trainingLoad', 'weeklyVolume', 'workoutIntensity'],
    Sleep: ['sleepScore', 'deepSleepMinutes', 'hrv'],
    Recovery: ['readinessScore', 'recoveryTime', 'restingHeartRate', 'bodyTemperature'],
  }

  const baselineFor = {
    hrv: backgroundMean.hrv,
  } as Partial<Record<keyof FeatureWeights, number>>

  type PlanItem = { factor: string; current: number; target: number; gain: number; note: string }
  type PlanByCategory = Record<string, PlanItem[]>

  const scenarioPlan = useMemo(() => {
    if (targetVO2 == null) return { byCategory: {} as PlanByCategory, totalGain: 0, meets: false }
    const delta = targetVO2 - predictedNow

    const currentImpact = (k: string, v: number) => {
      const fn = factorResponseFunctions[k] || ((_v: number) => 0)
      // @ts-ignore baseline optional for HRV
      return fn(v, baselineFor[k as keyof FeatureWeights])
    }

    const proposals: PlanByCategory = { Training: [], Sleep: [], Recovery: [] }
    let gains: PlanItem[] = []

    for (const [cat, keys] of Object.entries(CATEGORY_MAP)) {
      for (const k of keys) {
        const cur = (currentFeatures as any)[k] as number
        const rng = (factorParameters as any)[k]?.optimalRange as [number, number] | undefined
        const mid = rng ? (rng[0] + rng[1]) / 2 : cur
        const gain = currentImpact(k, mid) - currentImpact(k, cur)
        const note = !rng
          ? 'Maintain'
          : cur < rng[0]
            ? `Increase toward ~${mid.toFixed(0)}`
            : cur > rng[1]
              ? `Reduce toward ~${mid.toFixed(0)}`
              : 'Maintain near optimal'
        gains.push({ factor: k, current: cur, target: mid, gain, note })
      }
      // sort within category by gain desc and keep top 2
      const top = gains
        .filter((g) => keys.includes(g.factor as any))
        .sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain))
        .slice(0, 2)
      proposals[cat] = top
    }

    // build combined top by absolute gain to estimate total
    const combinedTop = Object.values(proposals).flat().sort((a, b) => Math.abs(b.gain) - Math.abs(a.gain))
    const topLimited = combinedTop.slice(0, 5)
    const totalGain = topLimited.reduce((s, p) => s + Math.max(0, p.gain), 0)
    return { byCategory: proposals, totalGain, meets: totalGain >= delta - 0.2 }
  }, [targetVO2, predictedNow, currentFeatures, backgroundMean])

  function applyScenarioPlan() {
    const items = Object.values(scenarioPlan.byCategory).flat()
    for (const p of items) {
      if (Number.isFinite(p.target)) {
        dispatch({ type: 'setFactor', key: p.factor as keyof FeatureWeights, value: p.target })
      }
    }
    dispatch({ type: 'saveScenario', name: `VO2 to ${targetVO2?.toFixed(1)}` })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-2 text-xs text-gray-600">Active user: {persona.profile.name}</div>
        <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Goals & Plans</h1>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>
            <div className="text-lg font-semibold">Target VO2max</div>
            <div className="text-sm text-gray-600">Current prediction: {predictedNow.toFixed(1)} ml/kg/min</div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={vo2Targeted} onChange={(e) => setVo2Targeted(e.target.checked)} />
            <span>Focus plan on VO2</span>
          </label>
        </div>

        {vo2Targeted && (
          <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="text-lg font-semibold mb-3">Top Factors For Your VO2</div>
              <div className="space-y-3">
                {topFactors.map(([k, v]) => {
                  const pct = Math.round(v.percentageContribution * 100)
                  const range = factorParameters[k] ? (factorParameters as any)[k].optimalRange as [number, number] : [v.value, v.value]
                  const mid = (range[0] + range[1]) / 2
                  let tip = 'Maintain near optimal'
                  if (v.value < range[0]) tip = `Increase ${k} toward ~${mid.toFixed(0)}`
                  else if (v.value > range[1]) tip = `Reduce ${k} toward ~${mid.toFixed(0)}`
                  return (
                    <div key={k} className="">
                      <div className="flex items-center justify-between text-sm">
                        <div className="capitalize font-medium">{k}</div>
                        <div className="text-xs text-gray-600">{pct}% influence</div>
                      </div>
                      <div className="h-2 w-full bg-gray-100 rounded mt-1">
                        <div className="h-2 bg-sky-500 rounded" style={{ width: `${Math.max(8, pct)}%` }} />
                      </div>
                      <div className="mt-1 text-xs text-gray-700">Current: {Number(v.value).toFixed(1)} • {tip}</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="text-lg font-semibold mb-3">Simple Plan (Targets What Matters)</div>
              <div className="space-y-3">
                {topPlan.map((p) => (
                  <div key={p.factor} className={`rounded-lg border p-3 ${severityStyles[p.severity]}`}>
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-semibold capitalize">{p.factor}</div>
                      <div className="text-xs opacity-80">{p.timeToImpact}</div>
                    </div>
                    <div className="text-xs opacity-90">Current: {p.currentValue.toFixed(1)} • Optimal: {p.optimalRange[0]}–{p.optimalRange[1]} • Impact: {p.currentImpact.toFixed(1)}</div>
                    <div className="text-sm mt-1">{p.actionText}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={applySuggestedTargets} className="rounded-full bg-blue-600 text-white px-4 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors">Apply Suggestions</button>
                <button onClick={clearOverrides} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">Clear Overrides</button>
              </div>
            </div>
          </div>
        )}

        {vo2Targeted && targetVO2 != null && (
          <div className="mt-6 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 col-span-3">
              <div className="flex items-center justify-between">
                <div className="text-lg font-semibold">Scenario Planner</div>
                <div className="text-sm text-gray-700">Current: {predictedNow.toFixed(1)} • Target: 
                  <input type="number" step={0.5} className="ml-2 w-24 rounded-md border px-2 py-1" value={targetVO2} onChange={(e) => setTargetVO2(parseFloat(e.target.value))} /> ml/kg/min
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">Estimated gain from plan: {scenarioPlan.totalGain.toFixed(1)} ml/kg/min {scenarioPlan.meets ? '• Meets target' : '• May need more time/consistency'}</div>
            </div>

            {(['Sleep','Recovery','Training'] as const).map((cat) => (
              <div key={cat} className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
                <div className="text-lg font-semibold mb-3">{cat} Plan</div>
                <div className="space-y-3">
                  {scenarioPlan.byCategory[cat]?.map((p) => (
                    <div key={p.factor} className="rounded-lg border bg-gray-50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="capitalize font-medium">{p.factor}</div>
                        <div className="text-xs text-gray-700">+{Math.max(0, p.gain).toFixed(1)} ml/kg/min</div>
                      </div>
                      <div className="text-xs text-gray-700 mt-1">{p.note}</div>
                      <div className="text-xs text-gray-600">Current {p.current.toFixed(1)} → Target {p.target.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            <div className="col-span-3 flex gap-2">
              <button onClick={applyScenarioPlan} className="rounded-full bg-blue-600 text-white px-5 py-2 text-sm font-semibold hover:bg-blue-700 transition-colors">Apply Scenario & Save</button>
              <button onClick={clearOverrides} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">Reset</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
