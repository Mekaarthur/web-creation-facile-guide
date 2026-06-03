/**
 * Joue un court signal sonore pour alerter sur une nouvelle anomalie critique.
 * Utilise WebAudio (pas de fichier asset requis).
 */
let lastPlayed = 0;

export const playCriticalAlertSound = () => {
  // Anti-spam : 1 son toutes les 5s max
  const now = Date.now();
  if (now - lastPlayed < 5000) return;
  lastPlayed = now;

  try {
    const Ctx =
      (window as any).AudioContext || (window as any).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, ctx.currentTime + start);
      gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + start + 0.02);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + start);
      osc.stop(ctx.currentTime + start + duration);
    };

    // 2 bips (alerte type "ding-ding")
    playTone(880, 0, 0.18);
    playTone(1175, 0.22, 0.22);

    setTimeout(() => ctx.close().catch(() => {}), 800);
  } catch {
    /* silencieux */
  }
};
