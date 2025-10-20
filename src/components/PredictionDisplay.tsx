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

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow flex items-center justify-between p-5">
      <div>
        <div className="text-sm text-neutral">Predicted VO2max</div>
        <div className="text-5xl font-extrabold bg-gradient-to-r from-blue-700 to-sky-500 bg-clip-text text-transparent tracking-tight">{predicted.toFixed(2)}</div>
      </div>
      <div className="text-right">
        <div className={`text-2xl font-semibold ${color}`}>{delta >= 0 ? '▲ +' : '▼ '}{delta.toFixed(2)}</div>
        <div className="text-sm text-neutral">vs baseline {baseline.toFixed(2)}</div>
        <div className="mt-1 text-sm font-medium">{classifyVO2(predicted)} fitness</div>
      </div>
    </div>
  )
}
