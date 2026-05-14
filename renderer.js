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
  const utter = new SpeechSynthesisUtterance('time is up');
  utter.pitch = 1.4;
  utter.rate  = 0.65;
  const voices = speechSynthesis.getVoices();
  const lady = voices.find(v => /zira|hazel|susan|eva|female|woman/i.test(v.name));
  if (lady) utter.voice = lady;
  speechSynthesis.speak(utter);
}
