========================================================================
                      AURA - Universal Windows Mini Media Player
========================================================================

A lightweight, premium Now Playing companion for Windows 10/11.
Built with Tauri 2, Rust, React 19, Tailwind CSS v4, and native WinRT GSMTC.

QUICK START:
1. Double-click "AURA.exe" (or "Run-AURA.bat") to start the mini-player.
2. AURA will float in the bottom-right corner of your screen above the taskbar.
3. Play music in Spotify, YouTube, Brave, Chrome, Edge, or VLC.
   AURA will instantly detect the session and display album art, track title,
   artist, and playback controls.

PLAYER MODES:
- Compact Player (Default): 360x74px faithful recreation of reference design.
- Expanded Player: Click album art or maximize button to see seek bar,
  timestamps, and active session switcher.
- Dynamic Island Mode: Ultra-minimal 220x48px pill with spinning disc.
- Settings: Click the gear icon to customize themes, accents, and snapping.

SHORTCUTS:
- Spacebar: Play / Pause
- Ctrl + Right Arrow: Next Track
- Ctrl + Left Arrow: Previous Track
- Escape: Collapse Expanded/Settings back to Compact Player
- Click and drag anywhere on the glass background to move the window.

BROWSER EXTENSION (OPTIONAL ENHANCEMENT):
To bridge HTML5 web media from Chrome, Edge, or Brave:
1. Open chrome://extensions (or brave://extensions / edge://extensions).
2. Enable "Developer mode" in the top-right corner.
3. Click "Load unpacked" and select the "browser-extension" folder in the AURA project.
4. Play any media on YouTube or Spotify Web.

System Requirements:
- Windows 10 (version 1809+) or Windows 11
- Microsoft Edge WebView2 (pre-installed on Windows 10/11)
========================================================================
