# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install   # Install dependencies (first time only)
npm start     # Launch the Electron app
```

There are no build, lint, or test scripts configured.

## Architecture

This is a minimal three-file Electron app:

- **`main.js`** — Electron main process. Creates a single frameless, transparent, non-resizable `BrowserWindow` (500×180) and loads `index.html`. Quits when the window closes.
- **`index.html`** — Renderer UI. Defines the layout (time row, divider, date) and all CSS (glowing orange theme, blinking colons, drag region). Loads `renderer.js` as a plain script tag — no bundler.
- **`renderer.js`** — Clock logic running in the renderer process. Calls `tick()` every second via `setInterval` to update the hours, minutes, seconds, AM/PM, and date DOM elements directly.

`contextIsolation: true` is set but there is no `preload` script, so `renderer.js` runs in the renderer context with no Node.js access.

The window uses `-webkit-app-region: drag` on the body (making the whole window draggable) with `-webkit-app-region: no-drag` overrides on the clock card (`#app`) and close button.
