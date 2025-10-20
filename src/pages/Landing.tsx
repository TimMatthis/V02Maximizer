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
                AI-POWERED PERFORMANCE ANALYTICS
              </span>
            </div>
            <h1 className="text-6xl font-extrabold tracking-tight mb-6 leading-tight">
              Maximize Your
              <span className="block !bg-gradient-to-r !from-emerald-400 !via-green-300 !to-lime-400 bg-clip-text !text-transparent">
                Performance Potential
              </span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8 max-w-2xl">
              Discover how training, recovery, and lifestyle factors impact your VO2max and power output. Get real-time SHAP insights and personalized recommendations to optimize your performance.
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
          <h2 className="text-3xl font-bold text-gray-900 mb-3">Intelligent Performance Optimization</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Advanced machine learning meets sports science to unlock your peak performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard 
            icon="📊"
            title="Explainability" 
            body="Dynamic SHAP analysis shows exactly which factors are boosting or limiting your performance in real-time."
            gradient="from-primary-500 to-primary-600"
          />
          <FeatureCard 
            icon="🎯"
            title="Personalization" 
            body="Machine learning adapts to your unique physiology, creating a model that reflects how your body responds."
            gradient="from-athletic-cyan to-athletic-teal"
          />
          <FeatureCard 
            icon="🔬"
            title="Scenario Modeling" 
            body="Test different training approaches, adjust variables, and compare outcomes before committing to changes."
            gradient="from-athletic-orange to-athletic-amber"
          />
        </div>
      </section>

      {/* Quick Start */}
      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="rounded-2xl border border-gray-200 bg-gradient-to-br from-white to-gray-50 shadow-lg p-8">
          <div className="flex items-start gap-6 max-md:flex-col">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center text-white text-2xl shadow-lg">
                🚀
              </div>
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Get Started in 3 Steps</h2>
              <div className="space-y-3">
                <Step number={1} text="View your dashboard to explore personas and understand factor influences" />
                <Step number={2} text="Use the control panel to adjust factors and explore what-if scenarios" />
                <Step number={3} text="Save scenarios and compare them side-by-side to find your optimal approach" />
              </div>
            </div>
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

function Step({ number, text }: { number: number; text: string }) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
        {number}
      </div>
      <p className="text-gray-700 pt-0.5">{text}</p>
    </div>
  )
}
