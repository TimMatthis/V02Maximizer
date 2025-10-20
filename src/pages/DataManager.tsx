export default function DataManager() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight">Manage Data</h1>
        <div className="grid grid-cols-2 gap-6 max-lg:grid-cols-1">
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="text-lg font-semibold mb-2 flex items-center gap-2"><span className="inline-block h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>Personas</div>
            <p className="text-sm text-gray-600 mb-4">Switch between sample personas to see different patterns. In production, connect real sources.</p>
            <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
              <li>Elite Runner — Training load dominant</li>
              <li>Busy Professional — Sleep/HRV dominant</li>
              <li>New User — Population model</li>
            </ul>
          </div>
          <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow p-6">
            <div className="text-lg font-semibold mb-2 flex items-center gap-2"><span className="inline-block h-2 w-6 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>Import & Sync</div>
            <p className="text-sm text-gray-600">No external APIs in this wireframe. In production, connect Garmin and Oura here, manage permissions, and review sync status.</p>
            <div className="mt-4 flex gap-3">
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Import CSV</button>
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Connect Garmin</button>
              <button className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50 transition-colors">Connect Oura</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
