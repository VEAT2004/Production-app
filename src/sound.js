// New-order chime (Web Audio, no external asset) + browser notification.
let ctx = null;
function audioCtx() {
  if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch { ctx = null; } }
  if (ctx && ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function playChime(kind = 'order') {
  const ac = audioCtx();
  if (!ac) return;
  const now = ac.currentTime;
  // Two-tone for orders, three-tone for service calls.
  const notes = kind === 'call' ? [880, 1174, 1568] : [660, 990];
  notes.forEach((f, i) => {
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.value = f;
    const t0 = now + i * 0.16;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(0.28, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.28);
    o.connect(g); g.connect(ac.destination);
    o.start(t0); o.stop(t0 + 0.3);
  });
}

export function ensureNotifyPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

export function notify(title, body) {
  if ('Notification' in window && Notification.permission === 'granted') {
    try { new Notification(title, { body, icon: '/favicon.ico' }); } catch { /* ignore */ }
  }
}
