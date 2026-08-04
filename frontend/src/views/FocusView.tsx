import { PlaceholderView } from './PlaceholderView'

export function FocusView() {
  return (
    <PlaceholderView
      title="Focus"
      description="Уроки и повторение: сцены hook, content, interactive, retrieval, reflection. Сценарии уроков будет загружать из backend (GET /api/content/lessons/{id})."
    />
  )
}
