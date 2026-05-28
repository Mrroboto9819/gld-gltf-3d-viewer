# GLB Viewer

A native desktop viewer for `.glb` / `.gltf` (glTF 2.0) 3D models.
Built with [Tauri 2](https://tauri.app/) — Rust handles disk I/O and metadata, the WebView renders the model with [Three.js](https://threejs.org) via [react-three-fiber](https://github.com/pmndrs/react-three-fiber). Single ~15 MB native binary on Windows, macOS, and Linux.

## Features

- **Native desktop app** — no browser tab, no Electron, no Docker. Real OS window with a real taskbar icon.
- **Recursive folder scan** — point at a folder and every `.glb` / `.gltf` underneath it shows up in the sidebar list, with file size, mesh / material / animation counts, and a "rigged" badge for skinned meshes (extracted in Rust via the [`gltf`](https://crates.io/crates/gltf) crate, no rendering needed).
- **Search filter** — instant case-insensitive substring filter against name and relative path. Esc clears.
- **Three.js viewport** — orbit, pan, zoom with damping. Auto-fit on selection; one-click recenter button. IBL via `@react-three/drei`'s `Environment`, infinite reference grid.
- **Copy-to-clipboard** — copy any model's full path from the sidebar, or the rendered model's filename from the viewport overlay.
- **Collapsible sidebar** — hide the list to give the model the full window.
- **Dark UI** following the Framer design system documented in [`DESIGN.md`](DESIGN.md): pure black canvas, surface-lift hierarchy, white pill CTAs, blue (`#0099ff`) reserved for focus / selection rings only.
- **Fully offline** after install — no telemetry, no cloud, no calls home.

## Acknowledgments

GLD Viewer stands on a stack of open-source projects without which it would not exist:

- **[Three.js](https://threejs.org)** + **[react-three-fiber](https://github.com/pmndrs/react-three-fiber)** + **[@react-three/drei](https://github.com/pmndrs/drei)** — the rendering engine and React bindings.
- **[`gltf`](https://crates.io/crates/gltf)** crate — Rust-side glTF / GLB parsing for the metadata sidebar.
- **[`walkdir`](https://crates.io/crates/walkdir)** — recursive folder scanning.
- **[Tauri 2](https://tauri.app)** + **[`tauri-plugin-dialog`](https://crates.io/crates/tauri-plugin-dialog)** — the desktop shell and native folder picker.
- **[Lucide](https://lucide.dev)** — UI icons.
- **[Inter](https://rsms.me/inter)** — body typeface.
- **[Vite](https://vitejs.dev)** + **[zustand](https://github.com/pmndrs/zustand)** — build tooling and state.

License terms for each of the above apply to their respective components and are reproduced in their sources.

---

## Prerequisites

| Platform | Required |
|---|---|
| **Windows** | [Rust](https://rustup.rs/) · [Bun](https://bun.sh/) · MSVC Build Tools (VS 2022, "Desktop development with C++") · WebView2 (preinstalled on Win11) |
| **macOS** | [Rust](https://rustup.rs/) · [Bun](https://bun.sh/) · Xcode Command Line Tools (`xcode-select --install`) |
| **Linux** | [Rust](https://rustup.rs/) · [Bun](https://bun.sh/) · `webkit2gtk-4.1`, `librsvg`, `libayatana-appindicator3` (see [Tauri prerequisites](https://tauri.app/start/prerequisites/#linux)) |

Then install the Tauri CLI once:

```bash
cargo install tauri-cli --version "^2.0"
```

## Develop

```bash
bun install
bun run tauri dev
```

The first `tauri dev` build takes ~2–4 minutes (Rust compiles all dependencies from scratch). Subsequent runs reuse the build cache and start in seconds with hot-reload for the frontend.

## Build a release binary

```bash
bun run tauri build
```

Output lands in `src-tauri/target/release/bundle/`. Each platform produces its native installer:

- Windows → `.msi` and `.exe`
- macOS → `.dmg` and `.app`
- Linux → `.deb`, `.rpm`, AppImage

> Tauri builds for the host OS only — to produce all three artifacts, build on each OS (or use the included GitHub Actions workflow at [`.github/workflows/release.yml`](.github/workflows/release.yml), which builds and publishes a tagged release for all four targets — Windows, Linux, macOS arm64, macOS x86_64 — whenever the version in `package.json` is bumped on `main`).

## How it works

1. **Frontend** ([src/App.tsx](src/App.tsx)) — calls the `pick_and_scan_folder` Tauri command on click; renders the returned model list and a `<Canvas>` viewport.
2. **`pick_and_scan_folder` command** ([src-tauri/src/lib.rs](src-tauri/src/lib.rs)) — opens the native folder picker via `tauri-plugin-dialog`, then defers the disk walk to a blocking thread so the UI stays responsive.
3. **`scan_folder`** ([src-tauri/src/models.rs](src-tauri/src/models.rs)) — recursively walks the chosen directory with `walkdir`, filters for `.glb` / `.gltf`, and extracts metadata (mesh / material / node / animation counts, skin presence) using `gltf::Gltf::open` — only the JSON manifest is parsed, not the mesh buffers, so even folders with hundreds of models scan in milliseconds.
4. **Rendering** ([src/components/ModelViewer.tsx](src/components/ModelViewer.tsx)) — when a model is clicked, the absolute path is converted to a webview-readable URL via Tauri's asset protocol (`convertFileSrc`), then handed to drei's `useGLTF`. `<Bounds>` auto-fits the camera to the loaded scene; `OrbitControls` provides orbit / pan / zoom.

The Rust backend never sends mesh bytes through the IPC bridge — only file paths and small JSON metadata. Pixel-pushing happens entirely in the WebView's WebGL context, so frame rate is bound by the GPU, not by IPC throughput.

## Project layout

```
.
├── index.html              # Vite entry, mounts React into #root
├── package.json            # frontend deps + scripts (React + R3F + Tauri)
├── vite.config.ts
├── public/
│   └── icon.png            # served at /icon.png for the sidebar brand mark
├── icon.png                # source icon for `tauri icon` regeneration
├── src/                    # frontend (React 18 + TS)
│   ├── main.tsx
│   ├── App.tsx             # layout, sidebar, search, folder picker
│   ├── store.ts            # zustand store (folder / selected / search / sidebar)
│   ├── types.ts
│   ├── styles.css          # Framer dark-canvas design system
│   └── components/
│       ├── ModelList.tsx
│       ├── ModelViewer.tsx
│       └── CopyButton.tsx
├── src-tauri/              # Rust backend
│   ├── Cargo.toml
│   ├── tauri.conf.json
│   ├── capabilities/
│   ├── icons/              # generated by `tauri icon`
│   └── src/
│       ├── main.rs
│       ├── lib.rs          # Tauri commands
│       └── models.rs       # folder scan + glTF metadata
├── .github/
│   └── workflows/
│       └── release.yml     # version-gated cross-platform release build
└── DESIGN.md               # Framer dark-canvas design-system reference
```

## Icons

The full icon set is regenerated from a single source PNG at the repo root:

```bash
bun run tauri icon icon.png
```

That populates `src-tauri/icons/` with `icon.ico` (Windows), `icon.icns` (macOS), the canonical PNG sizes (Linux + bundle), and the iOS / Android sets for future mobile builds. Replace [`icon.png`](icon.png) at the repo root and re-run the command to refresh everything.

## Roadmap

Likely additions, roughly in priority order:

- **Drag-and-drop** a folder or single file onto the window as an alternative to the picker.
- **Recent folders** persisted between launches.
- **Animation playback** controls when a model has clips (currently only the count is shown).
- **Material variant switcher** for files using the `KHR_materials_variants` glTF extension.
- **Wireframe / normals / UV preview** modes in the viewport.
- **Thumbnail rendering** so the sidebar shows a small preview per model (pre-rendered offscreen on selection).
- **Embedded-font Inter** so the brand renders identically when offline (currently fetched from rsms.me on first load).

## License

[MIT](LICENSE) — free to use, modify, and redistribute, including for commercial purposes. The only requirement is that the copyright notice in [`LICENSE`](LICENSE) stays included in copies / substantial portions.
