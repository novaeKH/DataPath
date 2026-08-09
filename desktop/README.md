# DataPath desktop shell

Tauri 2 shell переиспользует production build из `frontend/`. Backend запускается отдельно и
задаётся через `VITE_API_BASE_URL=http://127.0.0.1:8000`.

Требования: Rust stable, системные Tauri prerequisites и Tauri CLI 2.

```bash
make dev-backend
cd desktop/src-tauri
cargo tauri dev
```

Production installer:

```bash
cd desktop/src-tauri
cargo tauri build
```

В текущем окружении Rust/Cargo отсутствуют, поэтому scaffold проверяется как конфигурация, но
native macOS/Windows installers не заявлены собранными.
