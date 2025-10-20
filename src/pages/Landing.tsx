import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-700 to-sky-500 text-white">
        <div className="absolute inset-0 opacity-30 pointer-events-none" style={{backgroundImage:'radial-gradient(800px 200px at 10% 10%, rgba(255,255,255,0.25), transparent), radial-gradient(600px 200px at 90% 0%, rgba(255,255,255,0.15), transparent)'}}></div>
        <div className="mx-auto max-w-7xl px-6 py-20 relative">
          <h1 className="text-5xl font-extrabold tracking-tight mb-3">Personalized VO2max Intelligence</h1>
          <p className="text-white/90 text-lg max-w-2xl">
            Explore how training, recovery, and lifestyle factors shape your VO2max. Real‑time SHAP insights and adaptive personalization reveal what matters most for you.
          </p>
          <div className="mt-10 flex flex-wrap gap-3">
            <Link to="/dashboard" className="rounded-full bg-white text-blue-700 px-6 py-3 text-sm font-semibold shadow hover:shadow-md transition-all">See Dashboard</Link>
            <Link to="/data" className="rounded-full bg-white/10 text-white px-6 py-3 text-sm font-semibold ring-1 ring-white/30 hover:bg-white/15 transition-colors">Manage Data</Link>
            <Link to="/goals" className="rounded-full bg-white/10 text-white px-6 py-3 text-sm font-semibold ring-1 ring-white/30 hover:bg-white/15 transition-colors">Manage Goals & Plans</Link>
          </div>
        </div>
      </div>

      <section className="mx-auto max-w-7xl px-6 py-12 grid grid-cols-3 gap-6 max-lg:grid-cols-1">
        <Card title="Explainability" body="Dynamic SHAP highlights which factors push VO2max up or down in real time." />
        <Card title="Personalization" body="Weights adapt to your physiology via simulated online learning over time." />
        <Card title="Scenario Modeling" body="Adjust factors, save scenarios, and compare outcomes side‑by‑side." />
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-2">Quick Start</h2>
          <ol className="list-decimal pl-5 space-y-2 text-sm text-gray-700">
            <li>Open the Dashboard to view personas and factor influences.</li>
            <li>Use the left panel sliders to explore what‑if scenarios.</li>
            <li>Save a scenario and compare against your current state.</li>
          </ol>
        </div>
      </section>
    </div>
  )
}

function Card({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="text-lg font-semibold mb-1 flex items-center gap-2">
        <span className="inline-block h-2 w-8 rounded-full bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600"></span>
        <span>{title}</span>
      </div>
      <p className="text-sm text-gray-600">{body}</p>
    </div>
  )
}
