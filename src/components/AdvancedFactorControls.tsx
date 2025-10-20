import { useMemo } from 'react'
import type { DailyMetrics, FeatureWeights, ShapContributions } from '../types'
import FactorMiniCurve from './FactorMiniCurve'
import { buildCurveData } from '../utils/responseCurves'
import { debounce } from 'lodash'

type Props = {
  history: DailyMetrics[]
  dayIndex: number
  population: FeatureWeights
  personal: FeatureWeights
  overrides: Partial<FeatureWeights>
  shap: ShapContributions
  onChange: (k: keyof FeatureWeights, v: number) => void
  onResetAll: () => void
  onOptimize: () => void
  onSaveScenario: () => void
}

export default function AdvancedFactorControls({ history, dayIndex, population, personal, overrides, shap, onChange, onResetAll, onOptimize, onSaveScenario }: Props) {
  const current = history[dayIndex]
  const keys = Object.keys(population) as (keyof FeatureWeights)[]

  const ranges = useMemo(() => {
    const r: Record<string, { min: number; max: number }> = {}
    for (const k of keys) {
      const arr = history.map((d) => (d as any)[k] as number)
      r[k] = { min: Math.min(...arr), max: Math.max(...arr) }
    }
    return r
  }, [history])

  const debounced = useMemo(() => debounce((k: keyof FeatureWeights, v: number) => onChange(k, v), 300), [onChange])

  return (
    <div className="flex flex-col gap-3">
      {keys.map((k) => {
        const base = (current as any)[k] as number
        const value = (overrides[k] as number | undefined) ?? base
        const r = ranges[k]
        const s = shap.features[k]
        return (
          <div key={k as string} className="rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
            <div className="mb-1 flex items-center justify-between">
              <div className="font-medium capitalize flex items-center gap-2">
                <span className="inline-block h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>
                {String(k)}
              </div>
              <div className="text-xs text-neutral rounded-full px-2 py-0.5 bg-gray-50">Personal {(personal as any)[k] ? ((personal as any)[k] * 100).toFixed(0) : 0}% | Pop {(population as any)[k] ? ((population as any)[k] * 100).toFixed(0) : 0}%</div>
            </div>
            <div className="mb-2 text-xs text-neutral">{r.min.toFixed(1)} – {r.max.toFixed(1)}</div>
            <input
              aria-label={`Adjust ${String(k)}`}
              type="range"
              min={r.min}
              max={r.max}
              step={(r.max - r.min) / 100}
              defaultValue={value}
              onChange={(e) => debounced(k, parseFloat(e.target.value))}
              className="w-full accent-sky-500"
            />
            <div className="mt-1 flex items-center justify-between text-sm">
              <div className="font-mono">{value.toFixed(2)}</div>
              {s && (
                <div className={`text-xs rounded-full px-2 py-0.5 ${s.shapValue >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                  {s.shapValue >= 0 ? '▲ +' : '▼ '}{s.shapValue.toFixed(2)} ml/kg/min
                </div>
              )}
            </div>
            {/* Mini response curve */}
            <FactorMiniCurve curve={buildCurveData(k as string, r.min, r.max, undefined)} min={r.min} max={r.max} current={value} />
            <div className="mt-2 flex gap-2 text-xs">
              <button className="rounded-md border px-2 py-1 hover:bg-gray-50 transition-colors" onClick={() => onChange(k, base)}>Reset</button>
            </div>
          </div>
        )
      })}
      <div className="mt-1 grid grid-cols-2 gap-2">
        <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 transition-colors" onClick={onResetAll}>Reset All</button>
        <button className="rounded-md border px-3 py-2 text-sm hover:bg-gray-50 transition-colors" onClick={onOptimize}>Optimize All</button>
      </div>
      <button className="rounded-full bg-sky-500 text-white px-4 py-2 text-sm font-semibold hover:bg-sky-600 transition-colors" onClick={onSaveScenario}>Save Scenario</button>
    </div>
  )
}
