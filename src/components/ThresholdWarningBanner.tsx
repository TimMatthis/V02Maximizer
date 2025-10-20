import type { ThresholdWarning } from '../types'

export default function ThresholdWarningBanner({ warnings }: { warnings: ThresholdWarning[] }) {
  if (!warnings.length) return null
  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-md">
      {warnings.map((w, i) => (
        <div key={i} className={`p-4 rounded-lg shadow-lg border-l-4 animate-slide-in ${w.type === 'critical' ? 'bg-red-50 border-red-500' : w.type === 'warning' ? 'bg-yellow-50 border-yellow-500' : 'bg-blue-50 border-blue-500'}`}>
          <div className="font-semibold mb-1">{w.message}</div>
          <div className="text-sm mb-1">Current: {w.currentValue} | Threshold: {w.thresholdValue}</div>
          <div className="text-sm">{w.recommendation}</div>
          <button className="mt-2 text-xs underline">Learn more</button>
        </div>
      ))}
    </div>
  )
}

