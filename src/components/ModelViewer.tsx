import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import {
  Bounds,
  Environment,
  Grid,
  OrbitControls,
  useBounds,
  useGLTF,
} from "@react-three/drei";
import { convertFileSrc } from "@tauri-apps/api/core";
import {
  Crosshair,
  Hand,
  MousePointer2,
  Move,
  ScrollText,
  ZoomIn,
} from "lucide-react";
import * as THREE from "three";
import { useAppStore } from "../store";
import type { ModelInfo } from "../types";
import { CopyButton } from "./CopyButton";

function GltfModel({ url }: { url: string }) {
  const { scene } = useGLTF(url);
  const cloned = useMemo(() => scene.clone(true), [scene]);

  useEffect(() => {
    return () => {
      useGLTF.clear(url);
    };
  }, [url]);

  return <primitive object={cloned} />;
}

function AutoFit({ epoch }: { epoch: number }) {
  const bounds = useBounds();
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      bounds.refresh().clip().fit();
    });
    return () => cancelAnimationFrame(id);
  }, [epoch, bounds]);
  return null;
}

function Scene({ model, epoch }: { model: ModelInfo; epoch: number }) {
  const url = convertFileSrc(model.path);

  return (
    <>
      <color attach="background" args={["#090909"]} />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.8} />
      <Suspense fallback={null}>
        <Environment preset="city" />
        <Bounds fit clip observe margin={1.2}>
          <GltfModel url={url} />
          <AutoFit epoch={epoch} />
        </Bounds>
      </Suspense>
      <Grid
        args={[20, 20]}
        cellSize={0.5}
        cellThickness={0.5}
        cellColor="#262626"
        sectionSize={2}
        sectionThickness={1}
        sectionColor="#3a3a3a"
        fadeDistance={25}
        infiniteGrid
        position={[0, -0.001, 0]}
      />
      <OrbitControls makeDefault enableDamping dampingFactor={0.08} />
    </>
  );
}

function ControlsLegend() {
  const rows: Array<{ icon: ReactNode; key: string; action: string }> = [
    {
      icon: <MousePointer2 size={12} />,
      key: "Left drag",
      action: "Orbit",
    },
    {
      icon: <Hand size={12} />,
      key: "Right drag",
      action: "Pan",
    },
    {
      icon: <ZoomIn size={12} />,
      key: "Scroll",
      action: "Zoom",
    },
    {
      icon: <Move size={12} />,
      key: "Middle drag",
      action: "Pan",
    },
  ];
  return (
    <div className="controls-legend">
      <div className="controls-legend-title">
        <ScrollText
          size={12}
          style={{ verticalAlign: "-2px", marginRight: 6 }}
        />
        Controls
      </div>
      {rows.map((r) => (
        <div className="controls-row" key={r.key}>
          <span className="controls-key">
            {r.icon}
            {r.key}
          </span>
          <span className="controls-action">{r.action}</span>
        </div>
      ))}
    </div>
  );
}

export function ModelViewer() {
  const selected = useAppStore((s) => s.selected);
  const epoch = useAppStore((s) => s.recenterEpoch);
  const recenter = useAppStore((s) => s.recenter);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  if (!selected) {
    return (
      <div className="viewport-empty">
        <div>
          <p className="empty-title">No model selected</p>
          <p style={{ fontSize: 13 }}>
            Open a folder with <code>.glb</code> or <code>.gltf</code> files
            from the sidebar.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Canvas
        ref={canvasRef}
        camera={{ position: [3, 2, 3], fov: 45 }}
        gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping }}
        dpr={[1, 2]}
      >
        <Scene model={selected} epoch={epoch} key={selected.path} />
      </Canvas>
      <div className="viewport-overlay">
        <div className="overlay-row">
          <strong>{selected.name}</strong>
          <CopyButton
            value={selected.name}
            title="Copy model name to clipboard"
            className="overlay-copy"
          />
        </div>
        <div className="overlay-sub">{selected.relPath}</div>
      </div>
      <button
        className="viewport-action recenter-btn"
        onClick={recenter}
        title="Recenter model in view"
      >
        <Crosshair size={14} strokeWidth={2.2} />
        Recenter
      </button>
      <ControlsLegend />
    </>
  );
}
