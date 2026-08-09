# Changelog

All notable changes to DataPath are documented here.

## [1.0.0] — 2026-08-10

### Added

- Local-first release runtime shared by Web/PWA, Tauri macOS, and Capacitor iOS.
- A three-pass Roadmap, daily Today session, focused lesson reader, mixed-format Review, block-map
  Atlas, and Studio practice workspace.
- 86 route lessons across nine areas, 57 interactive visual demo contracts, 15 exercises, and
  9 mini-cases.
- Real in-browser SQLite exercises, versioned learning state, notes, resume position, and validated
  backup import/export.
- GitHub Actions CI and GitHub Pages deployment workflows.

### Changed

- Replaced the dense graph Atlas with course and module blocks driven by real mastery state.
- Production web builds now work under a repository subpath and use hash routing.
- Objective quizzes and self-assessment use distinct scoring and feedback semantics.

### Fixed

- Removed text-only visualization fallbacks from published lessons and validate every visual ID.
- Preserved practice `demo_id` through the API and local snapshot adapters.
- Made PWA cache URLs, manifest paths, release data, and SQLite WASM base-path aware.
- Protected local learning data during migrations and rejected damaged or newer backup formats.

### Known limitations

- Non-SQL coding exercises validate solution structure but do not execute arbitrary Python.
- The macOS bundle is unsigned and not notarized.
- Native iOS device/simulator verification requires a full Xcode installation and Apple signing.
- Focus is intentionally lazy-loaded but remains the largest frontend chunk.
