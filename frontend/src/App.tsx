import { Navigate, Route, Routes } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { SystemStatusView } from './views/SystemStatusView'
import { TodayView } from './views/TodayView'
import { AtlasView } from './views/AtlasView'
import { FocusView } from './views/FocusView'
import { StudioView } from './views/StudioView'

const ROUTES = [
  { path: '/today', element: <TodayView /> },
  { path: '/atlas', element: <AtlasView /> },
  { path: '/focus', element: <FocusView /> },
  { path: '/studio', element: <StudioView /> },
  { path: '/system', element: <SystemStatusView /> },
]

export default function App() {
  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <Routes>
          <Route path="/" element={<Navigate to="/today" replace />} />
          {ROUTES.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={<RouteTransition>{route.element}</RouteTransition>}
            />
          ))}
          <Route path="*" element={<Navigate to="/today" replace />} />
        </Routes>
      </main>
    </div>
  )
}

function RouteTransition({ children }: { children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
