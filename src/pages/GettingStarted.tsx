import { Link } from 'react-router-dom'

export default function GettingStarted() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Performance Maximizer</h1>
        <p className="text-gray-600 mb-6">Follow these steps to get value in minutes. No account required for the demo.</p>

        <ol className="list-decimal pl-6 space-y-4">
          <li>
            <div className="font-semibold text-gray-900">Explore the Dashboard</div>
            <p className="text-gray-700 text-sm">Pick a sample persona, scrub the timeline, and see which factors influence performance (SHAP).</p>
            <Link to="/dashboard" className="inline-block mt-2 text-primary-700 underline">Open Dashboard</Link>
          </li>
          <li>
            <div className="font-semibold text-gray-900">Upload a CSV to see a Weighted Graph</div>
            <p className="text-gray-700 text-sm">Use the Graph Demo to map factors → performance. Start with our sample files.</p>
            <div className="flex gap-3 mt-2">
              <Link to="/graph-demo" className="text-primary-700 underline">Open Graph Demo</Link>
              <a href="/sample-data/talent_scout_demo.csv" className="text-primary-700 underline" download>Download sample CSV</a>
            </div>
          </li>
          <li>
            <div className="font-semibold text-gray-900">Set a Goal and Review Priorities</div>
            <p className="text-gray-700 text-sm">Create a simple goal in Goals & Plans; use priorities to focus which factor to adjust first.</p>
            <Link to="/goals" className="inline-block mt-2 text-primary-700 underline">Go to Goals & Plans</Link>
          </li>
        </ol>

        <div className="mt-10 rounded-xl border border-gray-200 bg-white p-5">
          <div className="font-semibold text-gray-900 mb-2">Tips</div>
          <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
            <li>Green edges in the Graph Demo mean positive influence; red mean negative.</li>
            <li>“Update (RL)” nudges weights toward the most recent data (EMA).</li>
            <li>Use the factor controls on the dashboard to test what-if changes.</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

