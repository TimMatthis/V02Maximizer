import { Link } from 'react-router-dom'

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        {/* Animated background elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-96 h-96 bg-primary-500 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-athletic-cyan rounded-full blur-3xl"></div>
        </div>
        
        <div className="mx-auto max-w-7xl px-6 py-24 relative">
          <div className="max-w-3xl">
            <div className="inline-block mb-4">
              <span className="px-4 py-1.5 rounded-full bg-primary-500/20 text-primary-300 text-xs font-semibold tracking-wide border border-primary-500/30">
                Explainable Performance Analytics
              </span>
            </div>
            <h1 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Turn Training Data
              <span className="block !bg-gradient-to-r !from-emerald-400 !via-green-300 !to-lime-400 bg-clip-text !text-transparent">
                Into Performance Gains
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl">
              See what drives today’s VO2max and power, why it changed, and what to do next. Transparent SHAP‑style insights, goal‑aware priorities, and fast what‑if planning.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link 
                to="/dashboard" 
                className="group px-8 py-4 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white font-semibold shadow-xl shadow-primary-500/30 hover:shadow-2xl hover:shadow-primary-500/40 hover:-translate-y-0.5 transition-all duration-300 flex items-center gap-2"
              >
                View Dashboard
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link 
                to="/goals" 
                className="px-8 py-4 rounded-xl bg-white/5 text-white font-semibold border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
              >
                Set Goals
              </Link>
              <Link
                to="/graph-demo"
                className="px-8 py-4 rounded-xl bg-white/5 text-white font-semibold border border-white/10 hover:bg-white/10 hover:border-white/20 backdrop-blur-sm transition-all duration-300"
              >
                Try Graph Demo
              </Link>
            </div>
          </div>
        </div>

        {/* Wave separator */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg className="w-full h-16 text-gray-50" viewBox="0 0 1200 120" preserveAspectRatio="none">
            <path d="M0,60 C300,100 900,20 1200,60 L1200,120 L0,120 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Feature Cards */}
      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Make Better Training Decisions</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Clear, explainable analytics—no black boxes. Know which factors matter and how to act.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon="📊"
            title="Explainable Insights" 
            body="See each factor’s push/pull on performance with transparent SHAP-style contributions—understand the ‘why’, not just the score."
            gradient="from-primary-500 to-primary-600"
          />
          <FeatureCard 
            icon="🎯"
            title="Adaptive To You" 
            body="Models learn your physiology over time, so guidance reflects how your body actually responds."
            gradient="from-athletic-cyan to-athletic-teal"
          />
          <FeatureCard 
            icon="🔬"
            title="What‑If Planning" 
            body="Change sleep, load, or intensity and instantly preview predicted impact—commit with confidence."
            gradient="from-athletic-orange to-athletic-amber"
          />
        </div>
      </section>

      

      {/* Getting Started Guide (combined from Start) */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 rounded-2xl border border-gray-200 bg-white shadow-card p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-3">Get Started In Minutes</h2>
            <p className="text-gray-600 mb-4">No account required for the demo.</p>
            <ol className="list-decimal pl-6 space-y-4 text-sm text-gray-800">
              <li>
                <div className="font-semibold text-gray-900">Explore the Dashboard</div>
                <p>Pick a persona, scrub the timeline, and see which factors move your numbers (SHAP).</p>
                <Link to="/dashboard" className="inline-block mt-2 text-primary-700 underline">Open Dashboard</Link>
              </li>
              <li>
                <div className="font-semibold text-gray-900">Map Factors → Performance</div>
                <p>Use the Graph Demo to visualize a weighted factor graph and seed initial weights. Start with our sample file.</p>
                <div className="flex gap-3 mt-2">
                  <Link to="/graph-demo" className="text-primary-700 underline">Open Graph Demo</Link>
                  <a href="/sample-data/talent_scout_demo.csv" className="text-primary-700 underline" download>Download sample CSV</a>
                </div>
              </li>
              <li>
                <div className="font-semibold text-gray-900">Set A Goal, Act With Focus</div>
                <p>Create a goal in Goals & Plans; use priorities to choose the next best adjustment.</p>
                <Link to="/goals" className="inline-block mt-2 text-primary-700 underline">Go to Goals & Plans</Link>
              </li>
            </ol>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-white shadow-card p-6">
            <div className="font-semibold text-gray-900 mb-2">Tips</div>
            <ul className="list-disc pl-5 text-sm text-gray-700 space-y-2">
              <li>Green edges in Graph Demo mean positive influence; red mean negative; edge width = strength.</li>
              <li>“Update Weights” nudges edges toward recent data (EMA). Turn on goal‑aware updates to emphasize progress.</li>
              <li>Use factor controls on the Dashboard to test what‑ifs and see SHAP re‑balance instantly.</li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  )
}

function FeatureCard({ icon, title, body, gradient }: { icon: string; title: string; body: string; gradient: string }) {
  return (
    <div className="group relative rounded-2xl border border-gray-200 bg-white shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`}></div>
      <div className="p-6">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 mb-3">{title}</h3>
        <p className="text-gray-600 leading-relaxed">{body}</p>
      </div>
    </div>
  )
}

// Step component removed after consolidating the getting started sections
