import { PlaceholderView } from './PlaceholderView'

export function AtlasView() {
  return (
    <PlaceholderView
      title="Atlas"
      description="Интерактивная карта знаний с zoom/pan, состояниями узлов и связями prerequisites. Данные узлов будет отдавать backend (GET /api/content/atlas)."
    />
  )
}
