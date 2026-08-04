import { AnimatePresence, motion } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { useUiStore } from './stores/ui'
import { SystemStatusView } from './views/SystemStatusView'
import { TodayView } from './views/TodayView'
import { AtlasView } from './views/AtlasView'
import { FocusView } from './views/FocusView'
import { StudioView } from './views/StudioView'

function ActiveView() {
  const activeSection = useUiStore((s) => s.activeSection)

  switch (activeSection) {
    case 'today':
      return <TodayView />
    case 'atlas':
      return <AtlasView />
    case 'focus':
      return <FocusView />
    case 'studio':
      return <StudioView />
    case 'system':
    default:
      return <SystemStatusView />
  }
}

export default function App() {
  const activeSection = useUiStore((s) => s.activeSection)

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-8 py-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeSection}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
          >
            <ActiveView />
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  )
}
