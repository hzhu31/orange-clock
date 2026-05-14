# Time Elapsed Feature Design

**Date:** 2026-05-14
**Project:** Orange Digital Clock (Electron)

## Overview

Add a stopwatch and a countdown timer to the existing orange clock app. Both tools appear in a side-by-side panel that expands the window when activated via icon buttons on the clock card.

---

## Architecture

Four files are touched (one new):

| File | Change |
|---|---|
| `preload.js` | New. Exposes `window.electronAPI.resizeWindow(w, h)` via `contextBridge` |
| `main.js` | Register preload in `webPreferences`; add `ipcMain.on('resize-window')` handler calling `win.setSize(w, h)` |
| `index.html` | Add two icon buttons (⏱ ⏲) to clock card; add right-panel div with stopwatch and timer markup; CSS for expanded side-by-side layout |
| `renderer.js` | Add stopwatch logic, countdown logic, mode-switching, Web Audio beep |

`contextIsolation` remains `true`. The renderer only uses `window.electronAPI` — no direct Node access.

---

## UI Layout

**Default state:** 500×180px — clock only, unchanged from today.

**Expanded state:** 920×180px — two panels side by side inside a single card:
- Left panel (~440px): existing clock display, unmodified
- Center: thin vertical orange divider
- Right panel (~400px): active tool (stopwatch or timer), same orange glow aesthetic

**Mode toggle buttons:** two small icon buttons added to the bottom-right of the clock card.
- ⏱ — expand/show stopwatch; click again to collapse
- ⏲ — expand/show timer; click again to collapse
- Switching between tools swaps right-panel content without collapsing the window

---

## Stopwatch

**Display:** `MM:SS.cs` (centiseconds), e.g. `01:23.45`

**Controls:** Start/Stop (toggle button), Reset

**Logic:**
- Tracks elapsed time using `Date.now()` delta, not an interval counter, for accuracy
- `startTime` stores the epoch ms adjusted for any already-elapsed time
- Display updates every ~50ms via `setInterval`
- Reset while running stops and resets to `00:00.00`

---

## Countdown Timer

**Display:** `MM:SS` while counting; input fields for MM and SS when stopped

**Controls:** Start/Stop (toggle), Reset

**Logic:**
- Stores `endTime = Date.now() + durationMs` on start
- Input fields are disabled while running; re-enabled on stop or reset
- Editing inputs while stopped immediately updates the display
- At zero: display clamps to `00:00`, fires sound alert, stops — does not go negative

**Sound alert:** Web Audio API — a 880Hz sine wave tone for ~0.6s, no external audio files needed.

---

## Window Resize

- On expand: renderer calls `window.electronAPI.resizeWindow(920, 180)`
- On collapse: renderer calls `window.electronAPI.resizeWindow(500, 180)`
- Main process handles `resize-window` IPC: `win.setSize(width, height)`
- Window remains non-resizable by the user (`resizable: false` unchanged)

---

## Background State

While the app is running (not across restarts):
- Stopwatch and timer continue running when their panel is not visible
- Collapsing the panel does **not** stop or reset either tool
- Closing the app resets everything (no persistence to disk)

---

## Out of Scope

- Lap times / split tracking
- Multiple simultaneous timers
- Persistence across app restarts
- Alarm sounds other than the single beep
