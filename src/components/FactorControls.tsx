import { useMemo } from 'react'
import type { SHAPValueItem } from '../types'

type Meta = { min: number; max: number; mean: number; std: number; r2: number }

type Props = {
  meta: Record<string, Meta>
  values: Record<string, number>
  shapValues: SHAPValueItem[]
  onChange: (key: string, value: number) => void
  onResetAll: () => void
}

export default function FactorControls({ meta, values, shapValues, onChange, onResetAll }: Props) {
  const shapMap = useMemo(() => Object.fromEntries(shapValues.map((s) => [s.factorName, s])), [shapValues])

  return (
    <div className="flex flex-col gap-3">
      {Object.keys(meta).map((k) => {
        const m = meta[k]
        const v = values[k]
        const sv = shapMap[k]
        return (
          <div key={k} className="rounded-md border border-gray-200 p-3">
            <div className="mb-1 flex items-center justify-between">
              <div className="font-medium capitalize">{k}</div>
              <button className="text-xs text-primary underline" onClick={() => onChange(k, m.mean)}>
                Reset
              </button>
            </div>
            <div className="mb-2 text-xs text-neutral">{m.min.toFixed(1)} – {m.max.toFixed(1)}</div>
            <input
              type="range"
              min={m.min}
              max={m.max}
              step={(m.max - m.min) / 100}
              value={v}
              onChange={(e) => onChange(k, parseFloat(e.target.value))}
              className="w-full"
            />
            <div className="mt-1 flex items-center justify-between text-sm">
              <div className="font-mono">{v.toFixed(2)}</div>
              {sv && (
                <div className="flex gap-3 text-xs">
                  <span className={sv.shapValue >= 0 ? 'text-positive' : 'text-negative'}>
                    SHAP: {sv.shapValue >= 0 ? '+' : ''}{sv.shapValue.toFixed(2)}
                  </span>
                  <span className="text-neutral">R²: {(sv.normalizedImportance * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        )
      })}
      <button className="mt-1 rounded-md bg-gray-100 px-3 py-2 text-sm hover:bg-gray-200" onClick={onResetAll}>
        Reset All
      </button>
    </div>
  )
}

