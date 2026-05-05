use std::path::Path;

use serde::Serialize;
use walkdir::WalkDir;

#[derive(Serialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ModelInfo {
    pub path: String,
    pub name: String,
    pub rel_path: String,
    pub ext: String,
    pub size_bytes: u64,
    pub meshes: usize,
    pub materials: usize,
    pub nodes: usize,
    pub animations: usize,
    pub has_skins: bool,
    pub error: Option<String>,
}

#[derive(Serialize, Debug, Clone)]
pub struct FolderScan {
    pub root: String,
    pub models: Vec<ModelInfo>,
}

pub fn scan_folder(root: &Path) -> std::io::Result<FolderScan> {
    let mut models = Vec::new();

    for entry in WalkDir::new(root).follow_links(false).into_iter().flatten() {
        if !entry.file_type().is_file() {
            continue;
        }
        let path = entry.path();
        let ext = match path.extension().and_then(|s| s.to_str()) {
            Some(e) => e.to_ascii_lowercase(),
            None => continue,
        };
        if ext != "glb" && ext != "gltf" {
            continue;
        }
        models.push(inspect(path, root, &ext));
    }

    models.sort_by(|a, b| a.rel_path.to_lowercase().cmp(&b.rel_path.to_lowercase()));

    Ok(FolderScan {
        root: root.to_string_lossy().to_string(),
        models,
    })
}

fn inspect(path: &Path, root: &Path, ext: &str) -> ModelInfo {
    let size_bytes = std::fs::metadata(path).map(|m| m.len()).unwrap_or(0);
    let name = path
        .file_name()
        .map(|s| s.to_string_lossy().to_string())
        .unwrap_or_default();
    let rel_path = path
        .strip_prefix(root)
        .unwrap_or(path)
        .to_string_lossy()
        .to_string();

    let abs_path = path.to_string_lossy().to_string();

    match read_metadata(path) {
        Ok(meta) => ModelInfo {
            path: abs_path,
            name,
            rel_path,
            ext: ext.to_string(),
            size_bytes,
            meshes: meta.meshes,
            materials: meta.materials,
            nodes: meta.nodes,
            animations: meta.animations,
            has_skins: meta.has_skins,
            error: None,
        },
        Err(e) => ModelInfo {
            path: abs_path,
            name,
            rel_path,
            ext: ext.to_string(),
            size_bytes,
            meshes: 0,
            materials: 0,
            nodes: 0,
            animations: 0,
            has_skins: false,
            error: Some(e),
        },
    }
}

struct Metadata {
    meshes: usize,
    materials: usize,
    nodes: usize,
    animations: usize,
    has_skins: bool,
}

fn read_metadata(path: &Path) -> Result<Metadata, String> {
    let gltf = gltf::Gltf::open(path).map_err(|e| e.to_string())?;
    let doc = gltf.document;
    Ok(Metadata {
        meshes: doc.meshes().len(),
        materials: doc.materials().len(),
        nodes: doc.nodes().len(),
        animations: doc.animations().len(),
        has_skins: doc.skins().len() > 0,
    })
}
