// 코드로 만든 효과음 3개 (탄생 종·고르기 딸깍·죽음 종). 첫 손짓 뒤에만 소리가 난다
export function createSound(enabled) {
  let ac = null;
  const ctx = () => {
    const ua = globalThis.navigator && navigator.userActivation;   // 손짓 전에는 만들지 않는다 (브라우저 경고 방지)
    if (ua && !ua.hasBeenActive) return null;
    if (!ac) { const A = globalThis.AudioContext || globalThis.webkitAudioContext; if (!A) return null; ac = new A(); }
    if (ac.state === 'suspended') ac.resume();
    return ac;
  };
  function tone(freq, dur, gain, type = 'sine', when = 0) {
    if (!enabled()) return;
    const a = ctx(); if (!a) return;
    const t0 = a.currentTime + when, o = a.createOscillator(), g = a.createGain();
    o.type = type; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(gain, t0 + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g).connect(a.destination); o.start(t0); o.stop(t0 + dur + 0.05);
  }
  return {
    chime() { tone(784, 1.6, 0.12); tone(1175, 1.8, 0.08, 'sine', 0.18); },
    tick() { tone(1400, 0.08, 0.05, 'triangle'); },
    bell() { tone(220, 3.2, 0.14); tone(330, 2.6, 0.05, 'sine', 0.02); },
  };
}
