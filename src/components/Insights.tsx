import type { FeatureWeights } from '../types'

type Props = { personal: FeatureWeights; population: FeatureWeights }

export default function Insights({ personal, population }: Props) {
  const entries = Object.keys(population).map((k) => ({
    key: k,
    delta: (personal as any)[k] - (population as any)[k],
    personal: (personal as any)[k],
    population: (population as any)[k],
  }))
  const top = [...entries].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]

  return (
    <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-primary-50/30 shadow-card hover:shadow-card-hover transition-all duration-300 p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-primary-600 text-lg">💡</span>
        <h3 className="text-lg font-bold text-gray-900">Personalization Insights</h3>
      </div>
      <ul className="space-y-3 text-sm text-gray-700">
        {top && (
          <li className="flex items-start gap-2">
            <span className="text-primary-600 mt-0.5">→</span>
            <span>
              Your VO2max is more sensitive to <span className="font-semibold text-primary-700">{top.key}</span> than average by <span className="font-semibold">{Math.abs(top.delta * 100).toFixed(0)}%</span>.
            </span>
          </li>
        )}
        <li className="flex items-start gap-2">
          <span className="text-primary-600 mt-0.5">→</span>
          <span>Focus on your top 2 factors to maximize gains this month.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="text-primary-600 mt-0.5">→</span>
          <span>Sleep quality impacts HRV the next day; plan recovery accordingly.</span>
        </li>
      </ul>
    </div>
  )
}

