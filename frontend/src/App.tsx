import { lazy, Suspense, useEffect } from 'react'
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingBlock } from './components/ui/PageState'
import { PwaStatus } from './components/PwaStatus'

/**
 * Маршруты загружаются лениво (route-level code splitting).
 * Today остаётся в основном бандле — это точка входа по умолчанию.
 */
const TodayView = lazy(() =>
  import('./views/TodayView').then((module) => ({ default: module.TodayView })),
)
const AtlasView = lazy(() =>
  import('./views/AtlasView').then((module) => ({ default: module.AtlasView })),
)
const RoadmapView = lazy(() =>
  import('./views/RoadmapView').then((module) => ({ default: module.RoadmapView })),
)
const LearnView = lazy(() =>
  import('./views/LearnView').then((module) => ({ default: module.LearnView })),
)
const FocusView = lazy(() =>
  import('./views/FocusView').then((module) => ({ default: module.FocusView })),
)
const ReviewView = lazy(() =>
  import('./views/ReviewView').then((module) => ({ default: module.ReviewView })),
)
const StudioView = lazy(() =>
  import('./views/StudioView').then((module) => ({ default: module.StudioView })),
)
const SqlPracticeView = lazy(() =>
  import('./views/SqlPracticeView').then((module) => ({ default: module.SqlPracticeView })),
)
const AlgorithmPracticeView = lazy(() =>
  import('./views/AlgorithmPracticeView').then((module) => ({
    default: module.AlgorithmPracticeView,
  })),
)
const SystemStatusView = lazy(() =>
  import('./views/SystemStatusView').then((module) => ({ default: module.SystemStatusView })),
)

const ROUTES = [
  { path: '/today', element: <TodayView />, label: 'Загрузка Today…' },
  { path: '/learn', element: <LearnView />, label: 'Загрузка направлений…' },
  { path: '/roadmap', element: <RoadmapView />, label: 'Загрузка маршрута…' },
  { path: '/atlas', element: <AtlasView />, label: 'Загрузка Atlas…' },
  { path: '/focus', element: <FocusView />, label: 'Загрузка Focus…' },
  { path: '/focus/:lessonId', element: <FocusView />, label: 'Загрузка урока…' },
  { path: '/review', element: <ReviewView />, label: 'Загрузка повторений…' },
  { path: '/studio', element: <StudioView />, label: 'Загрузка Studio…' },
  {
    path: '/studio/sql',
    element: <SqlPracticeView />,
    label: 'Загрузка SQL Praktikum…',
  },
  {
    path: '/studio/sql/:taskId',
    element: <SqlPracticeView />,
    label: 'Загрузка SQL-задачи…',
  },
  {
    path: '/studio/algorithms',
    element: <AlgorithmPracticeView />,
    label: 'Загрузка AlgoPath…',
  },
  {
    path: '/studio/algorithms/:problemSlug',
    element: <AlgorithmPracticeView />,
    label: 'Загрузка Python-задачи…',
  },
  { path: '/system', element: <SystemStatusView />, label: 'Загрузка статуса…' },
]

function AppShortcuts() {
  const navigate = useNavigate()
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!event.metaKey) return
      if (event.key === ',') {
        event.preventDefault()
        navigate('/system')
      } else if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        window.location.reload()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [navigate])
  return null
}

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <AppShortcuts />
        <div className="dp-app-shell flex h-dvh overflow-hidden">
          <Sidebar />
          <main className="dp-app-main flex-1 overflow-y-auto px-4 sm:px-6 md:px-8 md:pb-16 md:pt-10 xl:px-14">
            <PwaStatus />
            <Routes>
              <Route path="/" element={<Navigate to="/today" replace />} />
              {ROUTES.map((route) => (
                <Route
                  key={route.path}
                  path={route.path}
                  element={
                    <Suspense
                      fallback={
                        <div className="mx-auto w-full max-w-[1200px] mt-4">
                          <LoadingBlock label={route.label} rows={3} />
                        </div>
                      }
                    >
                      {route.element}
                    </Suspense>
                  }
                />
              ))}
              <Route path="*" element={<Navigate to="/today" replace />} />
            </Routes>
          </main>
        </div>
      </MotionConfig>
    </ErrorBoundary>
  )
}
