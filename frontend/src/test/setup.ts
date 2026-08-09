import '@testing-library/jest-dom/vitest'
import { beforeEach } from 'vitest'

// Read-cache and local-first state are intentionally persistent in the product,
// but every unit test starts from an isolated user profile.
beforeEach(() => {
  const data = new Map<string, string>()
  const storage: Storage = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
    key: (index) => [...data.keys()][index] ?? null,
    get length() {
      return data.size
    },
  }
  Object.defineProperty(window, 'localStorage', { configurable: true, value: storage })
})
