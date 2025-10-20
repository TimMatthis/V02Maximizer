import type { FactorResponseCurve } from '../types'
import { normalizeValue, scaleImpact } from '../utils/responseCurves'

type Props = {
  curve: FactorResponseCurve
  min: number
  max: number
  current: number
}

export default function FactorMiniCurve({ curve, min, max, current }: Props) {
  const width = 100
  const height = 30
  const impacts = curve.dataPoints.map((d) => d.impact)
  const minImp = Math.min(...impacts)
  const maxImp = Math.max(...impacts)

  const path = curve.dataPoints
    .map((d, i) => {
      const x = normalizeValue(d.value, min, max, width)
      const y = scaleImpact(d.impact, minImp, maxImp, height)
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')

  const optStart = normalizeValue(curve.optimalRange[0], min, max, width)
  const optEnd = normalizeValue(curve.optimalRange[1], min, max, width)
  const threshX = normalizeValue(curve.thresholdPoint, min, max, width)
  const critX = normalizeValue(curve.criticalPoint, min, max, width)
  const currX = normalizeValue(current, min, max, width)

  return (
    <div className="h-16 w-full mt-2">
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full">
        {/* Zones */}
        <rect x={0} y={0} width={optStart} height={height} fill="#10B981" opacity={0.08} />
        <rect x={optStart} y={0} width={optEnd - optStart} height={height} fill="#10B981" opacity={0.12} />
        <rect x={optEnd} y={0} width={Math.max(threshX - optEnd, 0)} height={height} fill="#F59E0B" opacity={0.12} />
        <rect x={threshX} y={0} width={Math.max(critX - threshX, 0)} height={height} fill="#EF4444" opacity={0.10} />
        <rect x={critX} y={0} width={Math.max(width - critX, 0)} height={height} fill="#EF4444" opacity={0.16} />

        {/* Curve */}
        <path d={path} stroke="#0EA5E9" strokeWidth={1.5} fill="none" />

        {/* Current position marker */}
        <line x1={currX} x2={currX} y1={0} y2={height} stroke="#1E40AF" strokeDasharray="2 2" />
        <circle cx={currX} cy={height - 2} r={1.5} fill="#1E40AF" />
      </svg>
    </div>
  )
}
