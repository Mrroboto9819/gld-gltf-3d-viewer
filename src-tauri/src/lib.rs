mod models;

use tauri_plugin_dialog::DialogExt;

use models::{scan_folder, FolderScan};

#[derive(Debug, thiserror::Error)]
pub enum CmdError {
    #[error("io error: {0}")]
    Io(#[from] std::io::Error),
    #[error("{0}")]
    Other(String),
}

impl serde::Serialize for CmdError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

#[tauri::command]
async fn pick_and_scan_folder(app: tauri::AppHandle) -> Result<Option<FolderScan>, CmdError> {
    let (tx, rx) = std::sync::mpsc::channel();
    app.dialog()
        .file()
        .set_title("Select a folder of .glb / .gltf models")
        .pick_folder(move |path| {
            let _ = tx.send(path);
        });

    let picked = tauri::async_runtime::spawn_blocking(move || rx.recv().ok().flatten())
        .await
        .map_err(|e| CmdError::Other(format!("dialog task: {e}")))?;

    let Some(path) = picked else {
        return Ok(None);
    };

    let root = path
        .as_path()
        .ok_or_else(|| CmdError::Other("invalid folder path".into()))?
        .to_path_buf();

    let scan = tauri::async_runtime::spawn_blocking(move || scan_folder(&root))
        .await
        .map_err(|e| CmdError::Other(format!("scan task: {e}")))?
        .map_err(CmdError::from)?;

    Ok(Some(scan))
}

#[tauri::command]
async fn scan_folder_at(path: String) -> Result<FolderScan, CmdError> {
    let root = std::path::PathBuf::from(path);
    let scan = tauri::async_runtime::spawn_blocking(move || scan_folder(&root))
        .await
        .map_err(|e| CmdError::Other(format!("scan task: {e}")))?
        .map_err(CmdError::from)?;
    Ok(scan)
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_dialog::init())
        .setup(|_app| Ok(()))
        .invoke_handler(tauri::generate_handler![
            pick_and_scan_folder,
            scan_folder_at
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
