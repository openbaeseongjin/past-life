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
    // 한지 두루마리 펼침음 (부드러운 화이트 노이즈 밴드패스 스위프)
    scroll() {
      if (!enabled()) return;
      const a = ctx(); if (!a) return;
      try {
        const t0 = a.currentTime;
        const len = Math.floor(a.sampleRate * 0.18);
        const buf = a.createBuffer(1, len, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (len * 0.35));
        const src = a.createBufferSource();
        src.buffer = buf;
        const f = a.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.setValueAtTime(1100, t0);
        f.frequency.exponentialRampToValueAtTime(1900, t0 + 0.15);
        f.Q.value = 2.2;
        const g = a.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.07, t0 + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.18);
        src.connect(f).connect(g).connect(a.destination);
        src.start(t0);
      } catch (e) {}
    },
    // 상평통보/은화 엽전 짤랑거림 (고주파 금속 배음 합성)
    coin() {
      if (!enabled()) return;
      const a = ctx(); if (!a) return;
      try {
        const ring = (freq, off, vol) => {
          const t0 = a.currentTime + off;
          const o = a.createOscillator(), g = a.createGain();
          o.type = 'sine'; o.frequency.value = freq;
          g.gain.setValueAtTime(vol, t0);
          g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.12);
          o.connect(g).connect(a.destination);
          o.start(t0); o.stop(t0 + 0.13);
        };
        ring(2450, 0, 0.06);
        ring(3880, 0, 0.04);
        ring(5150, 0, 0.02);
        ring(2820, 0.05, 0.05);
        ring(4300, 0.05, 0.03);
      } catch (e) {}
    },
    // 먹물 붓글씨 획 (화폭에 스며드는 차분한 붓소리)
    brush() {
      if (!enabled()) return;
      const a = ctx(); if (!a) return;
      try {
        const t0 = a.currentTime;
        const len = Math.floor(a.sampleRate * 0.22);
        const buf = a.createBuffer(1, len, a.sampleRate);
        const d = buf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.sin((i / len) * Math.PI);
        const src = a.createBufferSource();
        src.buffer = buf;
        const f = a.createBiquadFilter();
        f.type = 'lowpass';
        f.frequency.setValueAtTime(450, t0);
        f.frequency.linearRampToValueAtTime(950, t0 + 0.1);
        f.frequency.exponentialRampToValueAtTime(250, t0 + 0.22);
        const g = a.createGain();
        g.gain.setValueAtTime(0.0001, t0);
        g.gain.linearRampToValueAtTime(0.07, t0 + 0.05);
        g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.22);
        src.connect(f).connect(g).connect(a.destination);
        src.start(t0);
      } catch (e) {}
    },
  };
}
