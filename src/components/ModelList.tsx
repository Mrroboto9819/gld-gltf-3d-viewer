import { useMemo, type KeyboardEvent } from "react";
import { Box, FileWarning } from "lucide-react";
import { useAppStore } from "../store";
import type { ModelInfo } from "../types";
import { CopyButton } from "./CopyButton";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function ModelItem({
  model,
  active,
  onSelect,
}: {
  model: ModelInfo;
  active: boolean;
  onSelect: () => void;
}) {
  function onKey(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect();
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      className={`model-item ${active ? "active" : ""} ${
        model.error ? "error" : ""
      }`}
      onClick={onSelect}
      onKeyDown={onKey}
      title={model.path}
    >
      <div className="model-name">
        {model.error ? (
          <FileWarning size={14} className="model-name-icon" />
        ) : (
          <Box size={14} className="model-name-icon" />
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {model.name}
        </span>
      </div>
      <div className="model-path-row">
        <div className="model-path">{model.relPath}</div>
        <CopyButton
          value={model.path}
          title="Copy full path to clipboard"
          stopPropagation
        />
      </div>
      <div className="model-meta">
        <span className="chip chip-strong">{model.ext.toUpperCase()}</span>
        <span className="chip">{formatSize(model.sizeBytes)}</span>
        {model.error ? (
          <span className="chip">error</span>
        ) : (
          <>
            <span className="chip">{model.meshes} meshes</span>
            <span className="chip">{model.materials} mats</span>
            {model.animations > 0 && (
              <span className="chip">{model.animations} anim</span>
            )}
            {model.hasSkins && <span className="chip">rigged</span>}
          </>
        )}
      </div>
    </div>
  );
}

export function ModelList() {
  const { folder, selected, search, selectModel } = useAppStore();

  const filtered = useMemo(() => {
    if (!folder) return [];
    if (!search.trim()) return folder.models;
    const q = search.toLowerCase();
    return folder.models.filter(
      (m) =>
        m.name.toLowerCase().includes(q) ||
        m.relPath.toLowerCase().includes(q)
    );
  }, [folder, search]);

  if (!folder) {
    return (
      <div className="empty-state">
        Open a folder to list .glb / .gltf models.
      </div>
    );
  }

  if (folder.models.length === 0) {
    return <div className="empty-state">No .glb or .gltf files found.</div>;
  }

  if (filtered.length === 0) {
    return (
      <div className="empty-state">
        No models match “{search}”.
      </div>
    );
  }

  return (
    <div className="model-list">
      {filtered.map((m) => (
        <ModelItem
          key={m.path}
          model={m}
          active={selected?.path === m.path}
          onSelect={() => selectModel(m)}
        />
      ))}
    </div>
  );
}
