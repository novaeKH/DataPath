import { PlaceholderView } from './PlaceholderView'

export function TodayView() {
  return (
    <PlaceholderView
      title="Today"
      description="Экран «Сегодня»: главная задача, очередь повторения и слабые темы. Будет получать данные от backend (GET /api/review/today, GET /api/progress/skills)."
    />
  )
}
