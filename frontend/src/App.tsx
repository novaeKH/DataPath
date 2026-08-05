import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { MotionConfig } from 'framer-motion'
import { Sidebar } from './components/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import { LoadingBlock } from './components/ui/PageState'

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
const FocusView = lazy(() =>
  import('./views/FocusView').then((module) => ({ default: module.FocusView })),
)
const ReviewView = lazy(() =>
  import('./views/ReviewView').then((module) => ({ default: module.ReviewView })),
)
const StudioView = lazy(() =>
  import('./views/StudioView').then((module) => ({ default: module.StudioView })),
)
const SystemStatusView = lazy(() =>
  import('./views/SystemStatusView').then((module) => ({ default: module.SystemStatusView })),
)

const ROUTES = [
  { path: '/today', element: <TodayView />, label: 'Загрузка Today…' },
  { path: '/atlas', element: <AtlasView />, label: 'Загрузка Atlas…' },
  { path: '/focus', element: <FocusView />, label: 'Загрузка Focus…' },
  { path: '/focus/:lessonId', element: <FocusView />, label: 'Загрузка урока…' },
  { path: '/review', element: <ReviewView />, label: 'Загрузка повторений…' },
  { path: '/studio', element: <StudioView />, label: 'Загрузка Studio…' },
  { path: '/system', element: <SystemStatusView />, label: 'Загрузка статуса…' },
]

export default function App() {
  return (
    <ErrorBoundary>
      <MotionConfig reducedMotion="user">
        <div className="flex h-dvh overflow-hidden">
          <Sidebar />
          <main
            className="flex-1 overflow-y-auto pb-20 pt-14 md:pb-8 md:pt-8"
            style={{ paddingLeft: '1.5rem', paddingRight: '1.5rem' }}
          >
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
