export interface ModelInfo {
  path: string;
  name: string;
  relPath: string;
  ext: "glb" | "gltf";
  sizeBytes: number;
  meshes: number;
  materials: number;
  nodes: number;
  animations: number;
  hasSkins: boolean;
  error: string | null;
}

export interface FolderScan {
  root: string;
  models: ModelInfo[];
}
