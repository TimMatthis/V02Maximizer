import { Link, NavLink, useLocation } from 'react-router-dom'

export default function Header() {
  const { pathname } = useLocation()
  const isLanding = pathname === '/'
  return (
    <header className={`border-b ${isLanding ? 'bg-gradient-to-r from-blue-700 to-sky-500 text-white' : 'bg-white text-gray-900'} `}>
      <div className={`mx-auto max-w-7xl px-4 py-3 flex items-center justify-between` }>
        <Link to="/" className="flex items-center gap-2 group">
          <div className={`h-9 w-9 rounded-md ${isLanding ? 'bg-white/20' : 'bg-blue-700'} flex items-center justify-center text-white font-bold transition-transform duration-200 group-hover:scale-105`}>VO2</div>
          <div className="flex flex-col leading-tight">
            <div className={`text-xl font-semibold tracking-wide ${isLanding ? 'text-white' : 'text-blue-700'}`}>V02 maximier</div>
            <div className={`${isLanding ? 'text-white/80' : 'text-gray-600'} text-xs`}>A Rolls Data and AI in Australia collaboration</div>
          </div>
        </Link>
        <nav className="flex items-center gap-1 text-sm">
          <NavLink to="/" className={({isActive}) => navClass(isActive, isLanding)}>Home</NavLink>
          <NavLink to="/data" className={({isActive}) => navClass(isActive, isLanding)}>Manage Data</NavLink>
          <NavLink to="/dashboard" className={({isActive}) => navClass(isActive, isLanding)}>Dashboard</NavLink>
          <NavLink to="/goals" className={({isActive}) => navClass(isActive, isLanding)}>Goals & Plans</NavLink>
        </nav>
      </div>
      <div className={`${isLanding ? 'opacity-80' : 'opacity-100'} h-1 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-600`}></div>
    </header>
  )
}

function navClass(isActive: boolean, landing: boolean) {
  const base = 'px-3 py-1 rounded-md transition-colors duration-200'
  if (landing) return base + (isActive ? ' bg-white/20' : ' hover:bg-white/10')
  return base + (isActive ? ' bg-gray-100 text-gray-900' : ' text-gray-600 hover:bg-gray-50')
}
