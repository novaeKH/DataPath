import { motion } from 'framer-motion'

/**
 * Заглушка будущих разделов (Today, Atlas, Focus, Studio).
 * Реализация — в Фазе 2+, интерфейсы разделов описаны в docs/architecture.md.
 */
export function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-dashed border-slate-700 bg-slate-900/40 p-12 text-center"
      >
        <h1 className="text-2xl font-bold text-slate-200">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-400">
          {description}
        </p>
        <span className="mt-6 inline-block rounded-full bg-slate-800 px-3 py-1 text-xs font-medium text-slate-400">
          Раздел появится в Фазе 2
        </span>
      </motion.div>
    </div>
  )
}
