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
