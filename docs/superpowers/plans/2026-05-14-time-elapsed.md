# Time Elapsed Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a stopwatch and countdown timer that expand the clock window to 920×180 in a side-by-side layout when activated by icon buttons on the clock card.

**Architecture:** A new `preload.js` exposes `window.electronAPI.resizeWindow(w, h)` via Electron's `contextBridge`. `main.js` handles the IPC resize event. `index.html` is restructured so the clock lives in `#clock-panel` (left) and a hidden `#right-panel` (right) holds the stopwatch and timer. `renderer.js` gains mode-switching, stopwatch, countdown, and Web Audio beep logic.

**Tech Stack:** Electron (existing), Web Audio API (built-in browser API, no install needed), vanilla JS/HTML/CSS

---

### Task 1: IPC bridge — `preload.js` + `main.js`

**Files:**
- Create: `preload.js`
- Modify: `main.js`

- [ ] **Step 1: Create `preload.js`**

  Full file content:

  ```javascript
  const { contextBridge, ipcRenderer } = require('electron');

  contextBridge.exposeInMainWorld('electronAPI', {
    resizeWindow: (width, height) => ipcRenderer.send('resize-window', { width, height }),
  });
  ```

- [ ] **Step 2: Update `main.js`**

  Replace the entire file:

  ```javascript
  const { app, BrowserWindow, ipcMain } = require('electron');
  const path = require('path');

  let win;

  function createWindow() {
    win = new BrowserWindow({
      width: 500,
      height: 180,
      resizable: false,
      frame: false,
      transparent: true,
      webPreferences: {
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js'),
      },
    });

    win.loadFile('index.html');
  }

  app.whenReady().then(() => {
    createWindow();
    ipcMain.on('resize-window', (e, { width, height }) => {
      if (win) win.setSize(width, height);
    });
  });

  app.on('window-all-closed', () => {
    app.quit();
  });
  ```

- [ ] **Step 3: Launch and verify the IPC bridge**

  Run: `npm start`

  In the Electron window, open DevTools (right-click → Inspect Element) and run in the Console:
  ```javascript
  window.electronAPI.resizeWindow(920, 180);
  ```
  Expected: window widens to 920px.

  Run again:
  ```javascript
  window.electronAPI.resizeWindow(500, 180);
  ```
  Expected: window returns to 500px.

  Close DevTools. Quit the app.

- [ ] **Step 4: Commit**

  ```bash
  git add preload.js main.js
  git commit -m "feat: add IPC bridge for window resize via preload contextBridge"
  ```

---

### Task 2: HTML restructure + CSS

**Files:**
- Modify: `index.html`

- [ ] **Step 1: Replace `index.html` entirely**

  ```html
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8" />
    <title>Orange Clock</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }

      body {
        background: transparent;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 100vh;
        overflow: hidden;
        -webkit-app-region: drag;
        font-family: 'Consolas', 'Courier New', monospace;
      }

      #app {
        display: flex;
        flex-direction: row;
        align-items: stretch;
        background: linear-gradient(145deg, #1a0800, #0d0400);
        border: 2px solid #ff6600;
        border-radius: 14px;
        box-shadow:
          0 0 24px rgba(255, 100, 0, 0.4),
          0 0 60px rgba(255, 60, 0, 0.15),
          inset 0 0 30px rgba(255, 50, 0, 0.05);
        -webkit-app-region: no-drag;
        user-select: none;
      }

      /* ── Clock panel ── */
      #clock-panel {
        width: 460px;
        padding: 22px 32px 18px;
        flex-shrink: 0;
      }

      #time-row {
        display: flex;
        align-items: baseline;
        justify-content: center;
        gap: 4px;
        line-height: 1;
      }

      #time {
        font-size: 72px;
        font-weight: bold;
        letter-spacing: 4px;
        color: #ff8800;
        text-shadow:
          0 0 8px #ff6600,
          0 0 20px rgba(255, 100, 0, 0.7),
          0 0 40px rgba(255, 60, 0, 0.3);
      }

      .colon { animation: blink 1s step-start infinite; }

      @keyframes blink { 50% { opacity: 0.2; } }

      #ampm {
        font-size: 22px;
        font-weight: bold;
        color: #ff6600;
        text-shadow: 0 0 8px #ff4400;
        margin-left: 8px;
        letter-spacing: 1px;
        align-self: flex-end;
        padding-bottom: 10px;
      }

      #divider {
        width: 100%;
        height: 1px;
        background: linear-gradient(to right, transparent, rgba(255, 100, 0, 0.5), transparent);
        margin: 10px 0 8px;
      }

      #bottom-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
      }

      #date {
        font-size: 15px;
        letter-spacing: 2px;
        color: #ffaa55;
        text-shadow: 0 0 6px rgba(255, 100, 0, 0.6);
        text-transform: uppercase;
      }

      #mode-buttons {
        display: flex;
        gap: 6px;
        -webkit-app-region: no-drag;
      }

      .mode-btn {
        background: none;
        border: 1px solid rgba(255, 100, 0, 0.3);
        border-radius: 6px;
        color: rgba(255, 130, 0, 0.5);
        font-size: 15px;
        cursor: pointer;
        padding: 2px 6px;
        -webkit-app-region: no-drag;
        transition: color 0.2s, border-color 0.2s;
        line-height: 1.4;
      }

      .mode-btn:hover, .mode-btn.active {
        color: #ff8800;
        border-color: rgba(255, 100, 0, 0.7);
      }

      /* ── Panel divider ── */
      #panel-divider {
        width: 1px;
        background: linear-gradient(to bottom, transparent, rgba(255, 100, 0, 0.5), transparent);
        margin: 16px 0;
        flex-shrink: 0;
      }

      #panel-divider.hidden,
      #right-panel.hidden {
        display: none;
      }

      /* ── Right panel ── */
      #right-panel {
        width: 400px;
        padding: 22px 28px 18px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 10px;
        flex-shrink: 0;
      }

      .tool-display {
        font-size: 52px;
        font-weight: bold;
        color: #ff8800;
        letter-spacing: 3px;
        text-shadow:
          0 0 8px #ff6600,
          0 0 20px rgba(255, 100, 0, 0.7);
      }

      .tool-controls {
        display: flex;
        gap: 10px;
        margin-top: 6px;
      }

      .ctrl-btn {
        background: none;
        border: 1px solid rgba(255, 100, 0, 0.4);
        border-radius: 8px;
        color: #ff8800;
        font-size: 13px;
        cursor: pointer;
        padding: 5px 16px;
        font-family: 'Consolas', 'Courier New', monospace;
        letter-spacing: 1px;
        -webkit-app-region: no-drag;
        transition: color 0.2s, border-color 0.2s, text-shadow 0.2s;
      }

      .ctrl-btn:hover {
        color: #ffaa44;
        border-color: rgba(255, 100, 0, 0.8);
        text-shadow: 0 0 8px rgba(255, 100, 0, 0.5);
      }

      /* ── Timer inputs ── */
      #tm-inputs {
        display: flex;
        align-items: center;
        gap: 4px;
        color: rgba(255, 100, 0, 0.6);
        font-size: 14px;
        letter-spacing: 1px;
      }

      #tm-min, #tm-sec {
        width: 40px;
        background: rgba(255, 100, 0, 0.08);
        border: 1px solid rgba(255, 100, 0, 0.3);
        border-radius: 4px;
        color: #ff8800;
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 14px;
        text-align: center;
        padding: 3px 2px;
        -webkit-app-region: no-drag;
        outline: none;
      }

      #tm-min:focus, #tm-sec:focus {
        border-color: rgba(255, 100, 0, 0.7);
      }

      #tm-min:disabled, #tm-sec:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }

      #tm-panel.hidden,
      #sw-panel.hidden {
        display: none;
      }

      /* ── Close button ── */
      #close-btn {
        position: fixed;
        top: 10px;
        right: 18px;
        background: none;
        border: none;
        cursor: pointer;
        font-size: 15px;
        color: rgba(255, 100, 0, 0.5);
        -webkit-app-region: no-drag;
        transition: color 0.2s;
        line-height: 1;
      }

      #close-btn:hover { color: #ff4400; }
    </style>
  </head>
  <body>
    <button id="close-btn" onclick="window.close()">✕</button>
    <div id="app">

      <div id="clock-panel">
        <div id="time-row">
          <span id="time">
            <span id="hours">12</span><span class="colon">:</span><span id="minutes">00</span><span class="colon">:</span><span id="seconds">00</span>
          </span>
          <span id="ampm">AM</span>
        </div>
        <div id="divider"></div>
        <div id="bottom-row">
          <div id="date">Tuesday, May 13, 2026</div>
          <div id="mode-buttons">
            <button id="btn-stopwatch" class="mode-btn" title="Stopwatch">⏱</button>
            <button id="btn-timer" class="mode-btn" title="Timer">⏲</button>
          </div>
        </div>
      </div>

      <div id="panel-divider" class="hidden"></div>

      <div id="right-panel" class="hidden">
        <div id="sw-panel">
          <div id="sw-display" class="tool-display">00:00.00</div>
          <div class="tool-controls">
            <button id="sw-toggle" class="ctrl-btn">Start</button>
            <button id="sw-reset" class="ctrl-btn">Reset</button>
          </div>
        </div>
        <div id="tm-panel" class="hidden">
          <div id="tm-inputs">
            <input id="tm-min" type="number" min="0" max="99" value="5">
            <span>:</span>
            <input id="tm-sec" type="number" min="0" max="59" value="0">
          </div>
          <div id="tm-display" class="tool-display">05:00</div>
          <div class="tool-controls">
            <button id="tm-toggle" class="ctrl-btn">Start</button>
            <button id="tm-reset" class="ctrl-btn">Reset</button>
          </div>
        </div>
      </div>

    </div>
    <script src="renderer.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Launch and verify static layout**

  Run: `npm start`

  Check:
  - Clock still looks identical to before (time, date, divider, glow)
  - Two small icon buttons (⏱ ⏲) are visible at the bottom-right of the card, dimly orange
  - Buttons glow brighter on hover
  - ✕ close button still works

  (Clicking the icons does nothing yet — `renderer.js` wires them up in Task 3.)

  Quit the app.

- [ ] **Step 3: Commit**

  ```bash
  git add index.html
  git commit -m "feat: restructure HTML for side-by-side panel layout"
  ```

---

### Task 3: `renderer.js` — mode switching, stopwatch, timer, beep

**Files:**
- Modify: `renderer.js`

- [ ] **Step 1: Replace `renderer.js` entirely**

  ```javascript
  // ── Clock ──────────────────────────────────────────────────────────────────
  const hoursEl   = document.getElementById('hours');
  const minutesEl = document.getElementById('minutes');
  const secondsEl = document.getElementById('seconds');
  const ampmEl    = document.getElementById('ampm');
  const dateEl    = document.getElementById('date');

  const DAYS   = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function tick() {
    const now     = new Date();
    const h24     = now.getHours();
    const minutes = now.getMinutes();
    const seconds = now.getSeconds();
    const ampm    = h24 >= 12 ? 'PM' : 'AM';
    const h12     = h24 % 12 || 12;

    hoursEl.textContent   = pad(h12);
    minutesEl.textContent = pad(minutes);
    secondsEl.textContent = pad(seconds);
    ampmEl.textContent    = ampm;

    dateEl.textContent = `${DAYS[now.getDay()]}, ${MONTHS[now.getMonth()]} ${now.getDate()}, ${now.getFullYear()}`;
  }

  tick();
  setInterval(tick, 1000);

  // ── Mode switching ─────────────────────────────────────────────────────────
  const btnStopwatch = document.getElementById('btn-stopwatch');
  const btnTimer     = document.getElementById('btn-timer');
  const rightPanel   = document.getElementById('right-panel');
  const panelDivider = document.getElementById('panel-divider');
  const swPanel      = document.getElementById('sw-panel');
  const tmPanel      = document.getElementById('tm-panel');

  let activeMode = null; // 'stopwatch' | 'timer' | null

  function setMode(mode) {
    if (activeMode === mode) {
      activeMode = null;
      rightPanel.classList.add('hidden');
      panelDivider.classList.add('hidden');
      btnStopwatch.classList.remove('active');
      btnTimer.classList.remove('active');
      window.electronAPI.resizeWindow(500, 180);
      return;
    }
    activeMode = mode;
    rightPanel.classList.remove('hidden');
    panelDivider.classList.remove('hidden');
    window.electronAPI.resizeWindow(920, 180);
    if (mode === 'stopwatch') {
      swPanel.classList.remove('hidden');
      tmPanel.classList.add('hidden');
      btnStopwatch.classList.add('active');
      btnTimer.classList.remove('active');
    } else {
      tmPanel.classList.remove('hidden');
      swPanel.classList.add('hidden');
      btnTimer.classList.add('active');
      btnStopwatch.classList.remove('active');
    }
  }

  btnStopwatch.addEventListener('click', () => setMode('stopwatch'));
  btnTimer.addEventListener('click', () => setMode('timer'));

  // ── Stopwatch ──────────────────────────────────────────────────────────────
  const swDisplay  = document.getElementById('sw-display');
  const swToggle   = document.getElementById('sw-toggle');
  const swResetBtn = document.getElementById('sw-reset');

  let swRunning   = false;
  let swElapsed   = 0;     // ms accumulated before last pause
  let swStartTime = null;  // Date.now() at last resume
  let swInterval  = null;

  function formatSw(ms) {
    const cs      = Math.floor(ms / 10) % 100;
    const totalS  = Math.floor(ms / 1000);
    const minutes = Math.floor(totalS / 60);
    const seconds = totalS % 60;
    return `${pad(minutes)}:${pad(seconds)}.${pad(cs)}`;
  }

  function swTick() {
    swDisplay.textContent = formatSw(swElapsed + (Date.now() - swStartTime));
  }

  swToggle.addEventListener('click', () => {
    if (swRunning) {
      swElapsed += Date.now() - swStartTime;
      clearInterval(swInterval);
      swRunning = false;
      swToggle.textContent = 'Start';
    } else {
      swStartTime = Date.now();
      swInterval  = setInterval(swTick, 50);
      swRunning   = true;
      swToggle.textContent = 'Stop';
    }
  });

  swResetBtn.addEventListener('click', () => {
    clearInterval(swInterval);
    swRunning             = false;
    swElapsed             = 0;
    swStartTime           = null;
    swToggle.textContent  = 'Start';
    swDisplay.textContent = '00:00.00';
  });

  // ── Countdown timer ────────────────────────────────────────────────────────
  const tmDisplay  = document.getElementById('tm-display');
  const tmToggle   = document.getElementById('tm-toggle');
  const tmResetBtn = document.getElementById('tm-reset');
  const tmMinInput = document.getElementById('tm-min');
  const tmSecInput = document.getElementById('tm-sec');

  let tmRunning  = false;
  let tmEndTime  = null;
  let tmInterval = null;

  function getTmDurationMs() {
    const min = Math.max(0, parseInt(tmMinInput.value, 10) || 0);
    const sec = Math.max(0, Math.min(59, parseInt(tmSecInput.value, 10) || 0));
    return (min * 60 + sec) * 1000;
  }

  function formatTm(ms) {
    const totalS  = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalS / 60);
    const seconds = totalS % 60;
    return `${pad(minutes)}:${pad(seconds)}`;
  }

  function updateTmDisplay() {
    tmDisplay.textContent = formatTm(getTmDurationMs());
  }

  tmMinInput.addEventListener('input', updateTmDisplay);
  tmSecInput.addEventListener('input', updateTmDisplay);

  function tmTick() {
    const remaining = tmEndTime - Date.now();
    if (remaining <= 0) {
      tmDisplay.textContent = '00:00';
      clearInterval(tmInterval);
      tmRunning            = false;
      tmToggle.textContent = 'Start';
      tmMinInput.disabled  = false;
      tmSecInput.disabled  = false;
      playBeep();
      return;
    }
    tmDisplay.textContent = formatTm(remaining);
  }

  tmToggle.addEventListener('click', () => {
    if (tmRunning) {
      clearInterval(tmInterval);
      tmRunning            = false;
      tmToggle.textContent = 'Start';
      tmMinInput.disabled  = false;
      tmSecInput.disabled  = false;
    } else {
      const dur = getTmDurationMs();
      if (dur === 0) return;
      tmEndTime            = Date.now() + dur;
      tmMinInput.disabled  = true;
      tmSecInput.disabled  = true;
      tmInterval           = setInterval(tmTick, 100);
      tmRunning            = true;
      tmToggle.textContent = 'Stop';
    }
  });

  tmResetBtn.addEventListener('click', () => {
    clearInterval(tmInterval);
    tmRunning            = false;
    tmToggle.textContent = 'Start';
    tmMinInput.disabled  = false;
    tmSecInput.disabled  = false;
    updateTmDisplay();
  });

  updateTmDisplay();

  // ── Beep ───────────────────────────────────────────────────────────────────
  function playBeep() {
    const ctx  = new AudioContext();
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type            = 'sine';
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  }
  ```

- [ ] **Step 2: Launch and verify — mode switching**

  Run: `npm start`

  - Click ⏱: window widens to ~920px, stopwatch panel appears on the right showing `00:00.00`, ⏱ button glows orange
  - Click ⏲: right panel switches to timer showing `05:00` with MM:SS inputs, ⏲ button glows, ⏱ dims
  - Click ⏲ again: window collapses to 500px, right panel hidden, both buttons dim

- [ ] **Step 3: Verify — stopwatch**

  Click ⏱ to expand. Then:
  - Click **Start**: centiseconds tick up (e.g. `00:00.12`, `00:01.34`)
  - Click **Stop**: display freezes at current time, button returns to "Start"
  - Click **Start** again: resumes from where it stopped (does not reset)
  - Click **Reset**: returns to `00:00.00`, stops if running

- [ ] **Step 4: Verify — countdown timer**

  Click ⏲ to switch to timer. Then:
  - Change MM input to `0`, SS input to `5` — display immediately updates to `00:05`
  - Click **Start**: counts down `00:05 → 00:04 → ... → 00:00`, then plays a short beep; inputs re-enable
  - Click **Reset**: display returns to `00:05`, button shows "Start"
  - Set `0:0` and click **Start**: nothing happens (zero duration guard)
  - While counting, try editing an input: fields are disabled

- [ ] **Step 5: Verify — background state**

  - Click ⏱, start the stopwatch, click ⏲ (switches panel without collapsing): stopwatch is still running in the background
  - Click ⏱: stopwatch has advanced while you were on the timer panel

- [ ] **Step 6: Commit**

  ```bash
  git add renderer.js
  git commit -m "feat: add stopwatch, countdown timer, and mode switching"
  ```
