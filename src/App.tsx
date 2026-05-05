import { invoke } from "@tauri-apps/api/core";
import {
  FolderOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Loader2,
  Search,
  X,
} from "lucide-react";
import { useAppStore } from "./store";
import { ModelList } from "./components/ModelList";
import { ModelViewer } from "./components/ModelViewer";
import type { FolderScan } from "./types";

export default function App() {
  const {
    folder,
    scanning,
    error,
    sidebarCollapsed,
    search,
    setFolder,
    setScanning,
    setError,
    toggleSidebar,
    setSearch,
  } = useAppStore();

  async function openFolder() {
    setScanning(true);
    setError(null);
    try {
      const scan = await invoke<FolderScan | null>("pick_and_scan_folder");
      if (scan) setFolder(scan);
    } catch (e) {
      setError(String(e));
    } finally {
      setScanning(false);
    }
  }

  const filteredCount = folder
    ? search
      ? folder.models.filter((m) => {
          const q = search.toLowerCase();
          return (
            m.name.toLowerCase().includes(q) ||
            m.relPath.toLowerCase().includes(q)
          );
        }).length
      : folder.models.length
    : 0;

  return (
    <div className={`app ${sidebarCollapsed ? "sidebar-hidden" : ""}`}>
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-header-row">
            <div className="brand">
              <img src="/icon.png" alt="" className="brand-icon" />
              <h1>GLD Viewer</h1>
            </div>
            <button
              className="icon-btn"
              onClick={toggleSidebar}
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <PanelLeftClose size={16} strokeWidth={2} />
            </button>
          </div>
          <button className="btn-primary" onClick={openFolder} disabled={scanning}>
            {scanning ? (
              <>
                <Loader2 size={16} strokeWidth={2.5} className="spin" />
                Scanning…
              </>
            ) : (
              <>
                <FolderOpen size={16} strokeWidth={2.5} />
                Open folder
              </>
            )}
          </button>
          {folder && (
            <>
              <div className="folder-meta">
                <div className="folder-path">{folder.root}</div>
                <div className="folder-count">
                  {search
                    ? `${filteredCount} of ${folder.models.length} models`
                    : `${folder.models.length} model${
                        folder.models.length === 1 ? "" : "s"
                      }`}
                </div>
              </div>
              <div className="search-input">
                <Search size={14} className="search-input-icon" />
                <input
                  type="text"
                  placeholder="Search models…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      e.preventDefault();
                      setSearch("");
                    }
                  }}
                />
                {search && (
                  <button
                    className="search-input-clear"
                    onClick={() => setSearch("")}
                    title="Clear search"
                    aria-label="Clear search"
                  >
                    <X size={12} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
        {error && <div className="error-banner">{error}</div>}
        <ModelList />
        <footer className="sidebar-footer">
          gld-viewer v{__APP_VERSION__}
        </footer>
      </aside>
      <main className="viewport">
        {sidebarCollapsed && (
          <button
            className="viewport-action sidebar-expand-btn"
            onClick={toggleSidebar}
            title="Expand sidebar"
            aria-label="Expand sidebar"
          >
            <PanelLeftOpen size={16} strokeWidth={2} />
          </button>
        )}
        <ModelViewer />
      </main>
    </div>
  );
}
