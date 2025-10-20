import { Link, NavLink } from 'react-router-dom'

export default function Header() {
  return (
    <header className="border-b-2 border-gray-200 bg-gradient-to-b from-gray-50 to-white sticky top-0 z-50 shadow-lg">
      <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="h-12 w-12 rounded-xl !bg-gradient-to-br !from-green-500 !via-green-600 !to-green-700 flex items-center justify-center !text-white font-bold text-base shadow-lg transition-all duration-300 group-hover:scale-105 group-hover:shadow-xl">
            <span>VO<sub className="text-[0.65rem] -ml-0.5">2</sub></span>
          </div>
          <div className="flex flex-col leading-tight">
            <div className="text-2xl font-extrabold tracking-tight !text-green-700">
              VO2 Maximizer
            </div>
            <div className="!text-gray-800 text-xs font-semibold tracking-wide">
              A Rolls Data / AI in Australia collaboration
            </div>
          </div>
        </Link>
        <nav className="flex items-center gap-2 text-sm font-semibold">
          <NavLink to="/" className={({isActive}) => navClass(isActive)}>Home</NavLink>
          <NavLink to="/dashboard" className={({isActive}) => navClass(isActive)}>Dashboard</NavLink>
          <NavLink to="/goals" className={({isActive}) => navClass(isActive)}>Goals</NavLink>
          <NavLink to="/data" className={({isActive}) => navClass(isActive)}>Data</NavLink>
        </nav>
      </div>
      <div className="h-1 bg-gradient-to-r from-primary-400 via-primary-500 to-primary-600"></div>
    </header>
  )
}

function navClass(isActive: boolean) {
  const base = 'px-4 py-2.5 rounded-lg transition-all duration-200 font-semibold'
  return base + (isActive 
    ? ' !bg-green-600 !text-white shadow-md' 
    : ' text-gray-900 hover:bg-gray-200')
}
