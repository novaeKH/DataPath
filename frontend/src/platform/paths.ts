/** Resolve bundled public assets in root, GitHub Pages subpath and native shells. */
export function bundledBaseUrl(): URL {
  return new URL(import.meta.env.BASE_URL, window.location.href)
}

export function bundledAssetUrl(relativePath: string): string {
  return new URL(relativePath.replace(/^\/+/, ''), bundledBaseUrl()).toString()
}
