import { AppStateProvider } from './state/AppState'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import Header from './components/Header'
import Landing from './pages/Landing'
import DataManager from './pages/DataManager'
import GoalsPlans from './pages/GoalsPlans'
import DashboardView from './views/DashboardView'
import GraphDemoV2 from './pages/GraphDemoV2'

export default function App() {
  return (
    <BrowserRouter>
      <Header />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/data" element={<DataManager />} />
        <Route path="/graph-demo" element={<GraphDemoV2 />} />
        <Route
          path="/goals"
          element={
            <AppStateProvider>
              <GoalsPlans />
            </AppStateProvider>
          }
        />
        <Route
          path="/dashboard"
          element={
            <AppStateProvider>
              <DashboardView />
            </AppStateProvider>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}
