# ✦ AURA — Universal Windows Mini Media Player

<div align="center">

![AURA Banner](https://img.shields.io/badge/AURA-v1.0.0-f59e0b?style=for-the-badge&logo=windows&logoColor=white)
![Tauri 2](https://img.shields.io/badge/Tauri-2.12-24c8db?style=for-the-badge&logo=tauri&logoColor=white)
![Rust](https://img.shields.io/badge/Rust-1.99-black?style=for-the-badge&logo=rust&logoColor=white)
![React 19](https://img.shields.io/badge/React-19.0-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Platform](https://img.shields.io/badge/Platform-Windows_10%20%7C%2011-0078d4?style=for-the-badge&logo=windows&logoColor=white)
![RAM Footprint](https://img.shields.io/badge/Memory-~45_MB-10b981?style=for-the-badge)

**A lightweight, intelligent, universal Now Playing companion for Windows 10 & 11.**  
Seamlessly detecting media playing across desktop applications and browsers, wrapped in a dark translucent glassmorphism aesthetic inspired by Apple Dynamic Island, iOS Now Playing, and luxury audio interfaces.

[Features](#-features) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Browser Extension](#-browser-companion-extension) • [Building From Source](#-building-from-source) • [Configuration](#-configuration)

---

</div>

## 🌟 Highlights

- **Universal Media Detection**: Native Windows **GSMTC** (Global System Media Transport Controls) WinRT integration captures media sessions from Spotify Desktop, Chromium browsers (Brave, Chrome, Edge), VLC, iTunes, and web media sessions automatically.
- **Micro Footprint**: Consumes only **~45 MB of RAM** and near-zero idle CPU — **5x lighter than Electron-based media widgets**.
- **Faithful Compact Design**: Exact layout inspired by high-end floating controllers: square album artwork on the left, track title and artist in the center-left, distinctive amber/yellow transport controls, and an animated glow equalizer waveform on the right.
- **Multiple Adaptive Modes**:
  - **Dynamic Island Mode (Default, 252px → 376px)**: Floating Apple Dynamic Island with context-aware hover expansion, native window dragging, and zero rectangular borders.
  - **Taskbar Docked Mode (280 × 42 px)**: Docks flush against the Windows taskbar next to the system tray clock with one-click undock to desktop.
  - **Expanded Player (360 × 270 px)**: High-res artwork, interactive timeline seek scrubber with timestamps, and multi-session source switcher.
  - **Dedicated Settings Window (420 × 480 px)**: 4-tab panel for appearance, behavior, media sessions, and diagnostics.
- **Authentic Windows Translucency**: Native acrylic/blur backdrop vibrancy with layered glass reflections and dynamic glow shadows.
- **Adaptive Dynamic Accent**: Automatically samples dominant colors from the current album art to tint control buttons and equalizer waveforms in real-time.
- **Seamless Browser Bridge**: Companion Manifest V3 browser extension provides deep DOM audio extraction for YouTube, Spotify Web, and HTML5 players with bidirectional playback controls.
- **Always on Top & Smart Snapping**: Effortlessly snaps to the Bottom-Right, Bottom-Left, Top-Right, Top-Left, or Center of the screen, with automatic screen-boundary overflow avoidance.

---

## 🚀 Quick Start

### Standalone Executable (No Installation Required)

1. Navigate to the `release-binary` directory or extract `AURA-v1.0.0-windows-x64.zip`.
2. Double-click **`AURA.exe`** (or launch via **`Run-AURA.bat`**).
3. Play any audio or video in Spotify, YouTube, Brave, Edge, or Chrome.
4. AURA will float above your taskbar in the bottom-right corner and immediately sync with the active media.

### System Requirements
- Windows 10 (version 1809 or higher) or Windows 11 (x64)
- Microsoft Edge WebView2 Runtime (pre-installed by default on Windows 10 and 11)

---

## 🎨 Design & Player Modes

### 1. Compact Player (`360 × 74 px`)
The default mode faithful to the reference layout:
- **Left**: Square album artwork with subtle rounded corners and fallback vinyl icon.
- **Center-Left**: Truncated track title, artist name, and source indicator badge (e.g., `Brave`, `Spotify`).
- **Center-Right**: Previous track, **warm amber rounded-square Play/Pause button with neon glow**, and Next track.
- **Right**: 13-band reactive equalizer waveform animation.
- **Hover**: Subtle shortcuts appear to expand or open settings.

### 2. Expanded Player (`360 × 260 px`)
- High-resolution album artwork view.
- Interactive seek scrubber bar with elapsed and remaining timestamps.
- Multi-session chip switcher (e.g. switch between Spotify and YouTube with one click).
- Island mode shortcut.

### 3. Dynamic Island Mode (`220 × 48 px`)
- Inspired by Apple Dynamic Island: an ultra-compact rounded pill.
- Animated rotating vinyl disc on playback.
- Click to expand back to the Compact or Expanded view.

### 4. Customization & Themes
- **Themes**: *Dark Glass* (smoky obsidian), *Light Frost* (translucent crystal), and *Midnight* (deep OLED black).
- **Accents**: *Warm Amber* (default), *Cyan*, *Purple*, *Emerald*, or *Artwork Dynamic* (color-thief extracted).
- **Glass Opacity**: Configurable from 50% to 100%.
- **Screen Snapping**: One-click alignment to any corner or center.

---

## ⌨ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Space` | Toggle Play / Pause |
| `Ctrl` + `Right Arrow` | Skip to Next Track |
| `Ctrl` + `Left Arrow` | Skip to Previous Track |
| `Escape` | Collapse Expanded / Settings mode back to Compact |
| `Click + Drag Window` | Freely position the floating glass window anywhere |

---

## 🧩 Browser Companion Extension

For web-based players (YouTube, YouTube Music, Spotify Web, SoundCloud) that may not fully publish timeline scrub data to Windows GSMTC:

1. Open your browser's extension manager:
   - **Chrome**: `chrome://extensions`
   - **Brave**: `brave://extensions`
   - **Edge**: `edge://extensions`
2. Enable **Developer Mode** (toggle in the top-right corner).
3. Click **Load unpacked**.
4. Select the `browser-extension` folder located inside the AURA repository.
5. The extension will automatically connect to AURA's local WebSocket server (`ws://127.0.0.1:48123`) and display an `ON` badge.

---

## 🏗 Architecture

```
AURA
├── src-tauri/                     # Rust 1.99 + Tauri 2.12 Native Backend
│   ├── src/
│   │   ├── media/
│   │   │   ├── gsmtc.rs          # Windows WinRT GSMTC Session Manager & Thumbnail Streamer
│   │   │   ├── browser_server.rs # Local WebSocket Bridge (ws://127.0.0.1:48123)
│   │   │   └── manager.rs        # Unified Media Provider & Deterministic Arbiter
│   │   ├── commands.rs           # Tauri IPC commands (seek, toggle, snap, mode resize)
│   │   ├── config.rs             # Safe JSON config persistence (%APPDATA%\AURA\config.json)
│   │   ├── tray.rs               # Windows System Notification Area (Tray) menu
│   │   ├── types.rs              # Strongly-typed data models
│   │   └── lib.rs                # Windows Vibrancy, Event Loop & Application Lifecycle
│   ├── Cargo.toml
│   └── tauri.conf.json
│
├── src/                           # React 19 + TypeScript + Tailwind CSS v4 Frontend
│   ├── components/
│   │   ├── CompactPlayer.tsx     # 360x74px Compact Player (Reference layout)
│   │   ├── ExpandedPlayer.tsx    # 360x260px Expanded View with seek bar & session chips
│   │   ├── IslandPlayer.tsx      # 220x48px Apple Dynamic Island pill
│   │   ├── SettingsModal.tsx     # Settings, Themes, Opacity, and Alignment panel
│   │   ├── Equalizer.tsx         # Responsive equalizer waveform visualization
│   │   └── GlassContainer.tsx    # Window-drag region & multi-layer glassmorphism
│   ├── hooks/
│   │   ├── useMediaState.ts      # Real-time state synchronization with backend
│   │   └── useSettings.ts        # Dynamic config mutations
│   ├── utils/
│   │   └── colors.ts             # Artwork dominant color extraction
│   └── App.tsx
│
├── browser-extension/             # Chromium Manifest V3 Companion Extension
│   ├── manifest.json
│   ├── background.js             # Service worker managing WebSocket bridge
│   ├── content.js                # HTML5 MediaElement & MediaSession API observer
│   └── popup.html / popup.js     # Extension status inspector
│
└── release-binary/                # Packaged Standalone Windows Distribution
    ├── AURA.exe                  # Optimized Standalone Binary (24.5 MB)
    ├── WebView2Loader.dll        # Microsoft Edge WebView2 Loader
    ├── Run-AURA.bat              # One-click desktop launcher
    └── README.txt
```

---

## 🛠 Building From Source

### Prerequisites

1. **Node.js** (v18 or newer)
2. **Rust & Cargo** (v1.80 or newer)
3. **C++ Toolchain**: Either MSVC (Visual Studio Build Tools) or MinGW-w64 (GCC 14+).

### Step-by-Step Build & Verification

```powershell
# 1. Clone or navigate to the repository
cd C:\Users\<Username>\Desktop\AURA

# 2. Install frontend dependencies
npm install

# 3. Run frontend unit tests
npm test

# 4. Build frontend production assets
npm run build

# 5. Build the Rust release executable
cd src-tauri
cargo build --release

# 6. Run automated backend regression suite
target\release\aura.exe --run-tests
```

The optimized binary will be created at:  
`src-tauri/target/release/aura.exe` (copied to `release-binary/AURA.exe`).

*(Note for MinGW environments: Ensure GNU Binutils and MinGW `x86_64-w64-mingw32` are in your `PATH` before invoking `cargo build`).*

---

## 🛡 Performance & Privacy

- **Zero Telemetry**: AURA runs entirely on your local machine. No listening data or personal information is ever transmitted to external servers.
- **Local WebSocket Security**: The browser bridge communicates strictly on `127.0.0.1:48123` with structured JSON payloads containing only track title, artist, duration, and playback state.
- **Graceful Fault Tolerance**: If a media app terminates, sleep/wake cycles occur, or the browser extension disconnects, AURA automatically retains the last state gracefully without crashing or throwing unhandled errors.

---

## 📜 License

MIT License © 2026 AURA Desktop Contributors.
