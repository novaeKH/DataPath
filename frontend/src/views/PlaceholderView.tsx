import { motion } from 'framer-motion'

/**
 * Заглушка разделов (Today, Focus, Studio).
 * Реализация — в следующих фазах; интерфейсы описаны в docs/architecture.md.
 */
export function PlaceholderView({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="rounded-xl border border-dashed border-slate-300 bg-white/50 p-12 text-center dark:border-slate-700 dark:bg-slate-900/40"
      >
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-200">{title}</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          {description}
        </p>
        <span className="mt-6 inline-block rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          Раздел будет реализован в следующих фазах
        </span>
      </motion.div>
    </div>
  )
}
