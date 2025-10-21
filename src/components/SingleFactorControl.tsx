import { useMemo } from 'react'
import type { DailyMetrics, FeatureWeights, ShapContributions } from '../types'
import { debounce } from 'lodash'
import FactorMiniCurve from './FactorMiniCurve'
import { buildCurveData } from '../utils/responseCurves'

type Props = {
  history: DailyMetrics[]
  dayIndex: number
  factorKey: keyof FeatureWeights | string
  overrides: Partial<FeatureWeights>
  shap: ShapContributions
  personal: FeatureWeights
  population: FeatureWeights
  onChange: (k: keyof FeatureWeights, v: number) => void
  unit?: string
}

export default function SingleFactorControl({ history, dayIndex, factorKey, overrides, shap, personal, population, onChange, unit = 'ml/kg/min' }: Props) {
  const current = history[dayIndex]
  const k = factorKey as keyof FeatureWeights

  const range = useMemo(() => {
    const arr = history.map((d) => (d as any)[k] as number)
    return { min: Math.min(...arr), max: Math.max(...arr) }
  }, [history, k])

  const base = (current as any)[k] as number
  const value = (overrides[k] as number | undefined) ?? base
  const s = shap.features[k as string]
  const debounced = useMemo(() => debounce((val: number) => onChange(k as keyof FeatureWeights, val), 300), [onChange, k])

  return (
    <div className="rounded-lg border border-gray-200 p-3 hover:shadow-sm transition-shadow">
      <div className="mb-1 flex items-center justify-between">
        <div className="font-medium capitalize flex items-center gap-2">
          <span className="inline-block h-1.5 w-6 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>
          {String(k)}
        </div>
        <div className="text-xs text-neutral rounded-full px-2 py-0.5 bg-gray-50">Personal {(personal as any)[k] ? ((personal as any)[k] * 100).toFixed(0) : 0}% | Pop {(population as any)[k] ? ((population as any)[k] * 100).toFixed(0) : 0}%</div>
      </div>
      <div className="mb-2 text-xs text-neutral">{range.min.toFixed(1)} – {range.max.toFixed(1)}</div>
      <input
        aria-label={`Adjust ${String(k)}`}
        type="range"
        min={range.min}
        max={range.max}
        step={(range.max - range.min) / 100}
        defaultValue={value}
        onChange={(e) => debounced(parseFloat(e.target.value))}
        className="w-full accent-sky-500"
      />
      <div className="mt-1 flex items-center justify-between text-sm">
        <div className="font-mono">{value.toFixed(2)}</div>
        {s && (
          <div className={`text-xs rounded-full px-2 py-0.5 ${s.shapValue >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {s.shapValue >= 0 ? '▲ +' : '▼ '}{s.shapValue.toFixed(2)} {unit}
          </div>
        )}
      </div>
      <FactorMiniCurve curve={buildCurveData(k as string, range.min, range.max, undefined)} min={range.min} max={range.max} current={value} />
      <div className="mt-2 flex gap-2 text-xs">
        <button className="rounded-md border px-2 py-1 hover:bg-gray-50 transition-colors" onClick={() => onChange(k, base)}>Reset</button>
      </div>
    </div>
  )
}



