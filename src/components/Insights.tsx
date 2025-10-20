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
    <div className="rounded-lg border border-gray-200 bg-white shadow-sm p-4">
      <div className="text-lg font-semibold mb-2">Personalization Insights</div>
      <ul className="list-disc pl-5 space-y-2 text-sm">
        {top && (
          <li>
            Your VO2max is more sensitive to <span className="font-medium">{top.key}</span> than the population average by {(top.delta * 100).toFixed(0)}%.
          </li>
        )}
        <li>
          Consider focusing on your top 2 factors to maximize gains this month.
        </li>
        <li>
          If sleep quality drops, expect HRV to decrease the next day; plan recovery accordingly.
        </li>
      </ul>
    </div>
  )
}

