import { useEffect, useMemo, useState } from 'react'

export default function DataManager() {
  const serverUrl = useMemo(() => (import.meta as any).env?.VITE_SERVER_URL || 'http://localhost:8080', [])
  const [ouraStatus, setOuraStatus] = useState<{ connected: boolean; savedAt?: string | null }>({ connected: false })

  useEffect(() => {
    fetch(`${serverUrl}/api/oura/status`).then(r => r.json()).then(setOuraStatus).catch(() => setOuraStatus({ connected: false }))
  }, [serverUrl])
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight flex items-center gap-3">
            <span className="text-primary-600">🔗</span>
            Data Pipeline & Management
          </h1>
          <p className="text-lg text-gray-600">Connect your fitness data sources and manage your training pipeline. <a href="/start" className="text-primary-700 underline">New? See Getting Started</a></p>
        </div>

        <section className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
            <div className="text-xl font-bold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-md">
                📊
              </div>
              How Your Data Is Used
            </div>
            <ol className="list-decimal pl-5 space-y-3 text-sm text-gray-700">
              <li>
                Ingest from Oura (sleep, readiness, HRV, RHR, temperature) <span className="text-xs text-gray-500">(not yet built)</span>
              </li>
              <li>
                Ingest from Garmin (training load/TSS, weekly volume, workout intensity, avg HR, pace) <span className="text-xs text-gray-500">(not yet built)</span>
              </li>
              <li>
                Augment with Graphio Graph data (knowledge graph of routines, environments, activity relations) <span className="text-xs text-gray-500">(theoretical, not yet built)</span>
              </li>
              <li>
                Feature engineering: align timestamps, resample daily, fill gaps, normalize vs personal baselines
              </li>
              <li>
                Explainability: compute SHAP-like contributions to show factor push/pull on VO2max (simplified in prototype)
              </li>
              <li>
                Personalization: adapt weights over time; RL layer proposes plans/policies from predicted gains <span className="text-xs text-gray-500">(RL policy not yet built)</span>
              </li>
            </ol>
            <div className="mt-5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200 p-4 text-xs text-gray-700">
              <div className="font-bold mb-3 text-sm text-gray-900">Data Flow (end state)</div>
              <div className="grid grid-cols-3 gap-3 max-md:grid-cols-1">
                <div>
                  <div className="text-gray-900 font-medium">Sources</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Oura API <span className="text-gray-500">(not yet built)</span></li>
                    <li>Garmin API <span className="text-gray-500">(not yet built)</span></li>
                    <li>Graphio Graph <span className="text-gray-500">(theoretical)</span></li>
                  </ul>
                </div>
                <div>
                  <div className="text-gray-900 font-medium">Processing</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>ETL + daily alignment</li>
                    <li>Feature normalization</li>
                    <li>Quality checks & thresholds</li>
                  </ul>
                </div>
                <div>
                  <div className="text-gray-900 font-medium">Modeling</div>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Personalized model weights</li>
                    <li>SHAP contributions</li>
                    <li>RL policy suggestions <span className="text-gray-500">(not yet built)</span></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
            <div className="text-xl font-bold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-athletic-cyan to-athletic-teal flex items-center justify-center text-white shadow-md">
                🔌
              </div>
              Connect & Sync
            </div>
            <p className="text-sm text-gray-600 mb-5">Connect providers, manage permissions, and review sync. Some API connectors are ready to use!</p>
            <div className="flex flex-col gap-3 mb-4">
              <button className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-400 cursor-not-allowed flex items-center justify-between" disabled>
                <span className="flex items-center gap-2">
                  <span className="text-lg">⌚</span>
                  Connect Garmin
                </span>
                <span className="text-xs">(coming soon)</span>
              </button>
              <a href={`${serverUrl}/auth/oura`} className="w-full rounded-xl border-2 border-primary-300 bg-gradient-to-r from-primary-50 to-primary-100 hover:from-primary-100 hover:to-primary-200 px-5 py-3 text-sm font-semibold text-primary-700 transition-all flex items-center justify-between shadow-sm hover:shadow">
                <span className="flex items-center gap-2">
                  <span className="text-lg">💍</span>
                  {ouraStatus.connected ? 'Re-connect Oura Ring' : 'Connect Oura Ring'}
                </span>
                <span className="text-xs">{ouraStatus.connected ? '✓ Connected' : '→'}</span>
              </a>
              {ouraStatus.connected && (
                <button onClick={() => { fetch(`${serverUrl}/api/oura/token`, { method: 'DELETE' }).then(() => setOuraStatus({ connected: false })) }} className="w-full rounded-xl border-2 border-red-200 bg-red-50 hover:bg-red-100 px-5 py-3 text-sm font-medium text-red-700 transition-all flex items-center justify-center gap-2">
                  <span>Disconnect Oura</span>
                </button>
              )}
              <button className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-400 cursor-not-allowed flex items-center justify-between" disabled>
                <span className="flex items-center gap-2">
                  <span className="text-lg">🌐</span>
                  Connect Graphio Graph
                </span>
                <span className="text-xs">(coming soon)</span>
              </button>
              <button className="w-full rounded-xl border-2 border-gray-200 bg-gray-50 px-5 py-3 text-sm font-medium text-gray-400 cursor-not-allowed flex items-center justify-between" disabled>
                <span className="flex items-center gap-2">
                  <span className="text-lg">📁</span>
                  Import CSV
                </span>
                <span className="text-xs">(coming soon)</span>
              </button>
            </div>
            {ouraStatus.connected && ouraStatus.savedAt && (
              <div className="px-4 py-2 rounded-lg bg-primary-50 text-xs text-primary-700 border border-primary-200">
                <strong>Status:</strong> Connected at {new Date(ouraStatus.savedAt).toLocaleString()}
              </div>
            )}
          </div>
        </section>

        <section className="mt-6 grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
            <div className="text-xl font-bold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-athletic-orange to-athletic-amber flex items-center justify-center text-white shadow-md">
                👥
              </div>
              Personas (prototype data)
            </div>
            <p className="text-sm text-gray-600 mb-3">Switch between sample personas to see different patterns. Real profiles will reflect your synced data.</p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Elite Runner — training load dominant</li>
              <li>Busy Professional — sleep/HRV dominant</li>
              <li>New User — population model</li>
            </ul>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 p-6">
            <div className="text-xl font-bold mb-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white shadow-md">
                🎯
              </div>
              End State (what you'll experience)
            </div>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-2">
              <li>Automatic daily sync from Oura + Garmin with consented scopes <span className="text-xs text-gray-500">(not yet built)</span></li>
              <li>Optional Graphio Graph augmentation to detect context and routines <span className="text-xs text-gray-500">(theoretical)</span></li>
              <li>Personalized model retrains weekly; SHAP updates explain day-to-day changes</li>
              <li>VO2max goals drive a plan; RL policy proposes phase-specific training & recovery <span className="text-xs text-gray-500">(not yet built)</span></li>
              <li>Threshold alerts (fatigue/overtraining/sleep) and scenario comparisons</li>
              <li>Local-first storage option and clear privacy controls <span className="text-xs text-gray-500">(not yet built)</span></li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
