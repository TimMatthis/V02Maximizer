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

  const [platform, setPlatform] = useState<'VO2' | 'Power'>('VO2')
  const [planReady, setPlanReady] = useState(false)

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
  const measuredNow = day.actualVO2Max ?? null

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
    dispatch({ type: 'saveScenario', name: `${platform} Plan` })
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
    dispatch({ type: 'saveScenario', name: `${platform} to ${targetVO2?.toFixed(1)}` })
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight flex items-center gap-3">
            <span className="text-primary-600">??</span>
            Goals & Training Plans
          </h1>
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-sm text-gray-600">Active user: <span className="font-semibold text-gray-900">{persona.profile.name}</span></span>
            <div className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-primary-50 to-primary-100 text-primary-800 border border-primary-300 px-4 py-2 shadow-sm">
              <span className="text-sm font-medium">Current {platform}</span>
              <span className="rounded-lg bg-white px-3 py-1 text-primary-900 border border-primary-400 font-bold text-lg">
                {predictedNow.toFixed(1)}
              </span>
              <span className="text-xs">{platform === 'VO2' ? 'ml/kg/min' : 'W'}</span>
              {platform === 'VO2' && measuredNow != null && (
                <span className="text-xs text-primary-700">(Measured: {measuredNow.toFixed(1)})</span>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="inline-block h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>
            <div className="text-lg font-semibold">Target {platform === 'VO2' ? 'VO2max' : 'Power'}</div>
            <div className="text-sm text-gray-600">Current prediction: {predictedNow.toFixed(1)} {platform === 'VO2' ? 'ml/kg/min' : 'W'}</div>
          </div>
          <div className="flex items-center text-sm rounded-full border overflow-hidden">
            <button
              type="button"
              className={`px-3 py-1.5 ${platform === 'VO2' ? 'bg-primary-600 text-white' : 'bg-white'}`}
              onClick={() => setPlatform('VO2')}
            >
              VO2
            </button>
            <button
              type="button"
              className={`px-3 py-1.5 ${platform === 'Power' ? 'bg-primary-600 text-white' : 'bg-white'}`}
              onClick={() => setPlatform('Power')}
            >
              Power
            </button>
          </div>
        </div>

        (
          <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-primary-600">??</span>
                Top Factors For Your VO2
              </div>
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
                      <div className="mt-1 text-xs text-gray-700">Current: {Number(v.value).toFixed(1)} - {tip}</div>
                      <div className="text-xs text-gray-600">Impact: {v.shapValue >= 0 ? '+' : ''}{v.shapValue.toFixed(2)} ml/kg/min</div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
              <div className="text-xl font-bold mb-4 flex items-center gap-2">
                <span className="text-primary-600">??</span>
                Simple Plan (Targets What Matters)
              </div>
              <div className="space-y-3">
                {topPlan.map((p) => (
                  <div key={p.factor} className={`rounded-lg border p-3 ${severityStyles[p.severity]}`}>
                    <div className="flex items-start justify-between">
                      <div className="text-sm font-semibold capitalize">{p.factor}</div>
                      <div className="text-xs opacity-80">{p.timeToImpact}</div>
                    </div>
                    <div className="text-xs opacity-90">Current: {p.currentValue.toFixed(1)} - Optimal: {p.optimalRange[0]}-{p.optimalRange[1]} - Impact: {p.currentImpact.toFixed(1)}</div>
                    <div className="text-sm mt-1">{p.actionText}</div>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={applySuggestedTargets} className="rounded-full bg-emerald-600 text-white px-4 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors">Apply Suggestions</button>
                <button onClick={clearOverrides} className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50">Clear Overrides</button>
              </div>
            </div>
          </div>
        )}

        (
          <div className="mt-6 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
            <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 col-span-3">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="text-lg font-semibold">Scenario Planner</div>
                <div className="text-sm text-gray-700 flex items-center gap-2">Current: {predictedNow.toFixed(1)} - Target:
                  <div className="inline-flex items-center gap-1 ml-2">
                    <button type="button" aria-label="Decrease target" className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => { const step = 0.5; const minGoal = Number((predictedNow + 0.1).toFixed(1)); const base = targetVO2 ?? Number((predictedNow + step).toFixed(1)); const next = Math.max(minGoal, Number((base - step).toFixed(1))); setTargetVO2(next) }}>-</button>
                    <input type="number" step={0.5} className="w-24 text-center rounded-md border px-2 py-1 appearance-none" value={targetVO2 ?? ''} onChange={(e) => { const val = parseFloat(e.target.value); if (Number.isNaN(val)) { setTargetVO2(null); return } const minGoal = Number((predictedNow + 0.1).toFixed(1)); setTargetVO2(Math.max(val, minGoal)) }} />
                    <button type="button" aria-label="Increase target" className="rounded-md border px-2 py-1 text-sm hover:bg-gray-50" onClick={() => { const step = 0.5; const base = targetVO2 ?? Number((predictedNow + step).toFixed(1)); const next = Number((base + step).toFixed(1)); setTargetVO2(next) }}>+</button>
                    <span>ml/kg/min</span>
                  </div>
                  <button
                    type="button"
                    className="ml-3 rounded-full bg-emerald-600 text-white px-4 py-1.5 text-sm font-semibold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    onClick={() => setPlanReady(true)}
                    disabled={targetVO2 == null}
                  >
                    Generate Plan
                  </button>
                </div>
                {planReady && (
                  <div className="text-sm text-gray-600 mt-1">Estimated gain from plan: {scenarioPlan.totalGain.toFixed(1)} ml/kg/min {scenarioPlan.meets ? "Meets target" : "May need more time/consistency"}</div>
                )}
              </div>
            </div>

            {planReady && (['Sleep','Recovery','Training'] as const).map((cat) => (
              <div key={cat} className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
                <div className="text-xl font-bold mb-4 flex items-center gap-2">
                  <span className="text-primary-600">{cat === 'Training' ? '??' : cat === 'Sleep' ? '??' : '??'}</span>
                  {cat} Plan
                </div>
                <div className="space-y-3">
                  {scenarioPlan.byCategory[cat]?.map((p) => (
                    <div key={p.factor} className="rounded-lg border bg-gray-50 p-3">
                      <div className="flex items-center justify-between text-sm">
                        <div className="capitalize font-medium">{p.factor}</div>
                        <div className="text-xs text-gray-700">+{Math.max(0, p.gain).toFixed(1)} ml/kg/min</div>
                      </div>
                      <div className="text-xs text-gray-700 mt-1">{p.note}</div>
                      <div className="text-xs text-gray-600">Current {p.current.toFixed(1)} {'->'} Target {p.target.toFixed(1)}</div>
                    </div>
                  ))}
                </div>
                {cat === 'Training' && (() => {
                  const items = Object.fromEntries((scenarioPlan.byCategory['Training'] || []).map((i) => [i.factor, i])) as any
                  const curVol = currentFeatures.weeklyVolume
                  const tgtVol = (items.weeklyVolume?.target ?? curVol) as number
                  const tgtInt = (items.workoutIntensity?.target ?? currentFeatures.workoutIntensity) as number
                  const sessions = Math.min(7, Math.max(3, Math.round(tgtVol / 12)))
                  const easyPct = 0.7
                  const modPct = tgtInt >= 7.5 ? 0.15 : 0.2
                  const hardPct = 1 - easyPct - modPct
                  const easyVol = Math.round(tgtVol * easyPct)
                  const modVol = Math.round(tgtVol * modPct)
                  const hardVol = Math.round(tgtVol * hardPct)
                  const restDays = Math.max(1, 7 - sessions)
                  return (
                    <div className="mt-4 rounded-lg border p-4">
                      <div className="text-sm font-semibold mb-2">Training Composition</div>
                      <div className="text-xs text-gray-700 mb-2">Weekly volume: {curVol.toFixed(0)} {'->'} {tgtVol.toFixed(0)} (delta {Math.max(0, tgtVol - curVol).toFixed(0)})</div>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                        <li>{sessions} sessions/week, {restDays} rest day(s)</li>
                        <li>Easy: ~{Math.round(easyPct*100)}% (~{easyVol}) · {Math.max(2, Math.round(sessions*easyPct))} easy sessions</li>
                        <li>Moderate: ~{Math.round(modPct*100)}% (~{modVol}) · {Math.max(1, Math.round(sessions*modPct))} tempo/steady sessions</li>
                        <li>Hard: ~{Math.round(hardPct*100)}% (~{hardVol}) · {Math.max(1, Math.round(sessions*hardPct))} interval/hill session</li>
                        <li>Target intensity index ~= {tgtInt.toFixed(1)} (keep hard days hard, easy days easy)</li>
                      </ul>
                    </div>
                  )
                })()}
                {cat === 'Sleep' && (() => {
                  const items = Object.fromEntries((scenarioPlan.byCategory['Sleep'] || []).map((i) => [i.factor, i])) as any
                  const tgtSleep = (items.sleepScore?.target ?? currentFeatures.sleepScore) as number
                  const tgtDeep = (items.deepSleepMinutes?.target ?? currentFeatures.deepSleepMinutes) as number
                  const tgtHRV = (items.hrv?.target ?? currentFeatures.hrv) as number
                  return (
                    <div className="mt-4 rounded-lg border p-4">
                      <div className="text-sm font-semibold mb-2">Sleep Actions</div>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                        <li>Bedtime routine: 60-90 min wind-down, dim lights</li>
                        <li>Target sleep score {'>='} {Math.round(tgtSleep)}</li>
                        <li>Deep sleep: {Math.round(tgtDeep)} min (cool room, consistent schedule)</li>
                        <li>HRV support: 5-10 min breathwork before bed (aim {Math.round(tgtHRV)} ms)</li>
                      </ul>
                    </div>
                  )
                })()}
                {cat === 'Recovery' && (() => {
                  const items = Object.fromEntries((scenarioPlan.byCategory['Recovery'] || []).map((i) => [i.factor, i])) as any
                  const tgtReady = (items.readinessScore?.target ?? currentFeatures.readinessScore) as number
                  const tgtRhr = (items.restingHeartRate?.target ?? currentFeatures.restingHeartRate) as number
                  const tgtRecH = (items.recoveryTime?.target ?? currentFeatures.recoveryTime) as number
                  return (
                    <div className="mt-4 rounded-lg border p-4">
                      <div className="text-sm font-semibold mb-2">Recovery Actions</div>
                      <ul className="text-sm text-gray-700 space-y-1 list-disc pl-5">
                        <li>Respect rest: {Math.max(1, 7 - Math.min(7, Math.max(3, Math.round(((items.weeklyVolume?.target ?? currentFeatures.weeklyVolume) as number) / 12))))} rest day(s)/week</li>
                        <li>Readiness: aim {'>='} {Math.round(tgtReady)}; back off intensity when low</li>
                        <li>Recovery window: ~{Math.round(tgtRecH)}h; keep active recovery if needed</li>
                        <li>RHR: trend toward {Math.round(tgtRhr)} bpm via easy days, hydration, and sleep</li>
                      </ul>
                    </div>
                  )
                })()}
              </div>
            ))}

            {planReady && (
              <div className="col-span-3 flex gap-2">
                <button onClick={applyScenarioPlan} className="rounded-full bg-emerald-600 text-white px-5 py-2 text-sm font-semibold hover:bg-emerald-700 transition-colors">Apply Scenario & Save</button>
                <button onClick={clearOverrides} className="rounded-full border px-5 py-2 text-sm hover:bg-gray-50">Reset</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}










