// All sound in Nebula Harvest is synthesised with WebAudio: no audio
// files, no network. Short oscillator envelopes for the bright sounds
// (collect, prism, level up) and filtered noise for the physical ones
// (dash whoosh, pulse thump, hull hit). Audio starts on the first user
// gesture, as browsers require, and M toggles mute.

export function createSound() {
  let context = null;
  let master = null;
  let muted = false;

  function ensure() {
    if (context) {
      if (context.state === 'suspended') context.resume();
      return true;
    }
    const AudioCtor = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtor) return false;
    context = new AudioCtor();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(context.destination);
    return true;
  }

  function tone(freqFrom, freqTo, seconds, type, volume, delay = 0) {
    if (!ensure()) return;
    const start = context.currentTime + delay;
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freqFrom, start);
    osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), start + seconds);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    osc.connect(gain).connect(master);
    osc.start(start);
    osc.stop(start + seconds + 0.05);
  }

  function noise(seconds, volume, freqFrom, freqTo, delay = 0) {
    if (!ensure()) return;
    const start = context.currentTime + delay;
    const length = Math.max(1, Math.floor(context.sampleRate * seconds));
    const buffer = context.createBuffer(1, length, context.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) data[i] = Math.random() * 2 - 1;
    const source = context.createBufferSource();
    source.buffer = buffer;
    const filter = context.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.1;
    filter.frequency.setValueAtTime(freqFrom, start);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, freqTo), start + seconds);
    const gain = context.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.001, start + seconds);
    source.connect(filter).connect(gain).connect(master);
    source.start(start);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() { return muted; },
    click() { tone(660, 880, 0.08, 'triangle', 0.25); },
    collect(combo) {
      const base = 520 * Math.pow(1.12, Math.min(combo, 8));
      tone(base, base * 1.5, 0.12, 'sine', 0.35);
      tone(base * 2, base * 2.4, 0.1, 'sine', 0.12, 0.03);
    },
    prism() {
      tone(880, 1320, 0.14, 'triangle', 0.3);
      tone(1174, 1760, 0.16, 'triangle', 0.25, 0.07);
      tone(1568, 2093, 0.2, 'sine', 0.2, 0.14);
    },
    heal() {
      tone(392, 523, 0.16, 'sine', 0.3);
      tone(523, 784, 0.2, 'sine', 0.28, 0.09);
    },
    dash() { noise(0.18, 0.3, 500, 2600); },
    pulse() {
      tone(160, 55, 0.28, 'sine', 0.5);
      noise(0.22, 0.18, 900, 200);
    },
    strike() {
      tone(300, 90, 0.12, 'square', 0.22);
      noise(0.1, 0.2, 1800, 500);
    },
    hit() {
      tone(220, 60, 0.3, 'sawtooth', 0.4);
      noise(0.25, 0.3, 700, 120);
    },
    levelUp() {
      tone(523, 523, 0.12, 'triangle', 0.3);
      tone(659, 659, 0.12, 'triangle', 0.3, 0.1);
      tone(784, 784, 0.14, 'triangle', 0.3, 0.2);
      tone(1046, 1046, 0.26, 'triangle', 0.32, 0.3);
    },
    win() {
      const notes = [523, 659, 784, 1046, 784, 1046, 1318];
      notes.forEach((note, i) => tone(note, note, 0.22, 'triangle', 0.3, i * 0.11));
    },
    lose() {
      const notes = [392, 370, 349, 311];
      notes.forEach((note, i) => tone(note, note * 0.94, 0.3, 'sawtooth', 0.2, i * 0.16));
    },
  };
}
