type Props = { predicted: number; baseline: number }

function classifyVO2(vo2: number) {
  if (vo2 >= 55) return 'Excellent'
  if (vo2 >= 50) return 'Good'
  if (vo2 >= 45) return 'Average'
  return 'Below Average'
}

export default function PredictionDisplay({ predicted, baseline }: Props) {
  const delta = predicted - baseline
  const color = delta >= 0 ? 'text-positive' : 'text-negative'
  const bgColor = delta >= 0 ? 'from-primary-500 to-primary-600' : 'from-red-500 to-red-600'
  const classification = classifyVO2(predicted)

  return (
    <div className="relative rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${bgColor}`}></div>
      <div className="flex items-center justify-between p-6">
        <div className="flex-1">
          <div className="text-sm font-medium text-neutral mb-2 flex items-center gap-2">
            <span className="text-lg">💪</span>
            Predicted VO2max
          </div>
          <div className="text-6xl font-extrabold bg-gradient-to-r from-primary-600 to-primary-700 bg-clip-text text-transparent tracking-tight mb-2">
            {predicted.toFixed(1)}
          </div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
            {classification} fitness
          </div>
        </div>
        <div className="text-right">
          <div className={`flex items-center gap-2 text-3xl font-bold ${color} mb-2`}>
            {delta >= 0 ? '↗' : '↘'}
            <span>{delta >= 0 ? '+' : ''}{delta.toFixed(2)}</span>
          </div>
          <div className="text-sm text-neutral">
            vs baseline <span className="font-semibold text-gray-700">{baseline.toFixed(1)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
