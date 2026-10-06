// Minimal Tauri shell — the app itself is the Vite/React frontend in
// ../src, this just gives it a native window. The backend (../../server)
// runs as a separate Node process; see README.md for how the two are
// meant to be started together (and for a sidecar-based approach if you
// want Tauri to launch the backend for you automatically).
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("error while running FST Buddy");
}
