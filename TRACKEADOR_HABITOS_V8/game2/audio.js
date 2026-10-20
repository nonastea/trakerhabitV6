/* ============================================================================
   audio.js — MG.audio · música y sonidos de «MILO · EL GRAN NOQUEO»
   Todo sintetizado con Web Audio (sin archivos). Big band / ragtime / swing de los años 30.
   API: unlock() music(id|null) sfx(name) stop() duck(bool) setMuted(bool) muted
   Pruebas: MG.audio._renderOffline(id | 'sfx:nombre', seg, startBar) → Promise (mismo código, OfflineAudioContext)
   ========================================================================== */
(function () {
  'use strict';
  const MG = window.MG = window.MG || {};
  const AC = window.AudioContext || window.webkitAudioContext;
  const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
  const R = Math.random;
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const MUSIC_G = 0.3, SFX_G = 0.85, AHEAD = 0.1, TICK_MS = 25, XFADE = 0.6;

  /* ------------------------------------------------------------------ teoría */
  const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const QUAL = { '': [0, 4, 7], m: [0, 3, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], maj7: [0, 4, 7, 11], dim: [0, 3, 6, 9], m6: [0, 3, 7, 9] };
  const chordCache = {};
  function chord(s) {
    if (chordCache[s]) return chordCache[s];
    const m = /^([A-G])([b#]?)(.*)$/.exec(s);
    if (!m || !QUAL[m[3]]) throw new Error('acorde inválido: ' + s);
    const c = { root: (PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + 12) % 12, iv: QUAL[m[3]] };
    return (chordCache[s] = c);
  }
  function noteMidi(s) {
    const m = /^([A-G])([b#]?)(-?\d)$/.exec(s);
    if (!m) throw new Error('nota inválida: ' + s);
    return PC[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (parseInt(m[3], 10) + 1) * 12;
  }
  // "E5:1 G5:2 r:1" → [{s:paso, m:midi|null, d:corcheas}]
  function parseBar(str) {
    const out = []; let s = 0;
    str.trim().split(/\s+/).forEach(tok => {
      const [n, d] = tok.split(':'); const dd = parseInt(d, 10);
      out.push({ s, m: n === 'r' ? null : noteMidi(n), d: dd }); s += dd;
    });
    out.total = s; return out;
  }
  const fold = (m, lo, hi) => { while (m > hi) m -= 12; while (m < lo) m += 12; return m; };
  const nearest = (pc, ref) => ref + (((pc - ref) % 12) + 12) % 12;

  /* ------------------------------------------------------------------ canciones */
  const SONGS = {
    title: {
      bpm: 150, sw: .64, meter: 4, lead: 'trumpet', alt: 'clarinet', bass: 'walk', comp: 'stride', drums: 'swing', crash: true,
      intro: {
        mel: ['G4:1 G4:1 C5:2 E5:2 G5:2', 'A5:3 G5:1 E5:2 C5:2', 'D5:1 D5:1 F5:2 A5:2 B5:2', 'C6:6 r:2'],
        ch: ['C', 'F', 'G7', 'C']
      },
      mel: ['E5:1 G5:1 C6:2 G5:1 E5:1 C5:2', 'A4:1 C#5:1 E5:2 A5:2 G5:1 E5:1', 'F5:2 A5:1 F5:1 D5:2 r:2', 'B4:1 D5:1 F5:2 G5:2 r:2',
        'E5:1 G5:1 C6:2 B5:1 G5:1 E5:2', 'C#6:2 A5:1 E5:1 C#5:2 A4:2', 'D5:1 F5:1 A5:2 C6:2 A5:2', 'G5:3 F5:1 D5:2 B4:2',
        'G#4:1 B4:1 E5:2 G#5:2 B5:2', 'A5:2 E5:2 C#5:2 E5:2', 'F#5:1 A5:1 D6:2 C6:2 A5:2', 'B5:2 G5:2 D5:2 F5:2',
        'E5:2 E5:1 G5:1 C6:2 r:2', 'A5:1 C6:1 A5:2 F5:2 C5:2', 'E5:2 G5:2 D5:2 B4:2', 'C5:3 r:1 E5:1 G5:1 C6:2'],
      ch: ['C', 'A7', 'Dm7', 'G7', 'C', 'A7', 'Dm7', 'G7', 'E7', 'A7', 'D7', 'G7', 'C', 'F', 'C G7', 'C']
    },
    map: {
      bpm: 110, sw: .66, meter: 4, lead: 'clarinet', alt: 'trumpet', altVel: .7, bass: 'walk', comp: 'rag', drums: 'swing', dv: .8,
      mel: ['A4:1 C5:2 A4:1 F5:2 C5:2', 'A4:1 D5:2 F#5:1 A5:2 F#5:2', 'G5:1 Bb5:2 G5:1 D5:2 Bb4:2', 'C5:1 E5:2 G5:1 Bb5:2 r:2',
        'A5:1 C6:2 A5:1 F5:2 A5:2', 'D6:2 C6:1 A5:1 F#5:2 D5:2', 'Bb5:1 G5:1 D5:2 E5:1 G5:1 Bb5:2', 'A5:2 F5:1 C5:1 F5:4',
        'D5:1 F5:2 Bb5:1 D6:2 Bb5:2', 'C6:1 Bb5:1 A5:1 Bb5:1 D6:4', 'C6:2 A5:1 F5:1 A5:2 C6:2', 'A5:1 F#5:1 D5:2 F#5:2 A5:2',
        'Bb5:2 G5:1 D5:1 G5:2 Bb5:2', 'G5:1 E5:1 C5:2 E5:1 G5:1 Bb5:2', 'A5:2 F5:2 F#5:2 A5:2', 'G5:1 A5:1 Bb5:2 G5:2 E5:2'],
      ch: ['F', 'D7', 'Gm7', 'C7', 'F', 'D7', 'Gm7 C7', 'F', 'Bb', 'Bb', 'F', 'D7', 'Gm7', 'C7', 'F D7', 'C7']
    },
    shop: {
      bpm: 95, sw: .62, meter: 3, lead: 'clarinet', alt: 'vibes', bass: 'waltz', comp: 'waltz', drums: 'waltz', lv: .8, dv: .8,
      mel: ['B4:2 D5:1 G5:2 F#5:1', 'E5:3 D5:1 B4:2', 'C5:2 E5:1 A5:2 G5:1', 'F#5:3 A5:1 D5:2',
        'G5:2 B5:1 D6:2 B5:1', 'G#5:3 B5:1 E5:2', 'C6:2 A5:1 E5:2 C5:1', 'D5:2 F#5:1 A5:2 C6:1',
        'E5:2 G5:1 C6:2 B5:1', 'Eb6:2 C6:1 G5:2 Eb5:1', 'D5:2 G5:1 B5:2 D6:1', 'B5:2 G#5:1 E5:3',
        'A5:2 C6:1 E6:2 C6:1', 'A5:2 F#5:1 D5:2 F#5:1', 'G5:3 B5:1 D6:2', 'C6:2 A5:1 F#5:2 A5:1'],
      ch: ['G', 'Em7', 'Am7', 'D7', 'G', 'E7', 'Am7', 'D7', 'C', 'Cm', 'G', 'E7', 'Am7', 'D7', 'G', 'D7']
    },
    // el pueblo (Los encargos de Milo): paseo tranquilo con tuba, para marcar hábitos sin apuro
    pueblo: {
      bpm: 104, sw: .62, meter: 4, lead: 'clarinet', alt: 'vibes', altVel: .6, bass: 'tuba', comp: 'rag', drums: 'swing', lv: .85, dv: .55, cv: .8,
      mel: ['E5:2 G5:1 E5:1 C5:2 E5:2', 'D5:2 F5:1 D5:1 B4:2 G4:2', 'C5:1 E5:1 G5:2 A5:2 G5:2', 'E5:4 r:2 G4:2',
        'A5:2 C6:1 A5:1 F5:2 A5:2', 'G5:2 E5:1 C5:1 E5:2 G5:2', 'F#5:2 A5:1 F#5:1 D5:2 C5:2', 'B4:2 D5:2 G5:3 r:1',
        'E5:2 G5:1 E5:1 C5:2 E5:2', 'C#5:2 E5:1 G5:1 A5:2 G5:2', 'F5:2 A5:1 F5:1 D5:2 F5:2', 'B4:1 D5:1 F5:2 G5:2 r:2',
        'A5:2 F5:1 A5:1 C6:2 A5:2', 'G5:2 E5:2 C5:2 E5:2', 'D5:2 F5:2 G5:2 B4:2', 'C5:4 r:4'],
      ch: ['C', 'G7', 'C', 'C', 'F', 'C', 'D7', 'G7', 'C', 'A7', 'Dm7', 'G7', 'F', 'C', 'Dm7 G7', 'C']
    },
    results: {
      bpm: 160, sw: .64, meter: 4, lead: 'trumpet', alt: 'clarinet', bass: 'walk', comp: 'stride', drums: 'swing', crash: true,
      intro: { mel: ['D5:1 D5:1 G5:2 B5:2 D6:2', 'B5:3 A5:1 G5:4'], ch: ['G', 'G'] },
      mel: ['G5:1 B5:1 D6:2 B5:1 G5:1 D5:2', 'E5:1 G#5:1 B5:2 E6:2 D6:1 B5:1', 'C6:2 A5:1 E5:1 A5:2 C6:2', 'D6:1 C6:1 A5:2 F#5:2 A5:2',
        'B5:1 D6:1 G6:2 F#6:1 D6:1 B5:2', 'E6:2 C6:1 G5:1 E5:2 G5:2', 'D6:2 B5:2 C6:1 A5:1 F#5:2', 'G5:3 r:1 G5:1 B5:1 D6:2'],
      ch: ['G', 'E7', 'Am7', 'D7', 'G', 'C', 'G D7', 'G']
    },
    rasquina: {
      bpm: 190, sw: .6, meter: 4, lead: 'muted', alt: 'trumpet', altVel: .8, bass: 'walk', comp: 'stride', drums: 'hot', cv: 1.05,
      mel: ['D5:1 F5:1 A5:1 D6:1 C6:1 A5:1 F5:1 A5:1', 'D5:1 D5:1 F5:2 E5:1 F5:1 A5:2', 'G5:1 Bb5:1 D6:1 Bb5:1 G5:1 F5:1 D5:2', 'E5:1 G5:1 A5:1 C#6:1 E6:2 C#6:2',
        'D6:1 D6:1 C6:1 A5:1 F5:1 A5:1 D5:2', 'Bb5:1 D6:1 F6:1 D6:1 Bb5:1 Ab5:1 F5:2', 'E5:1 G5:1 C#6:1 E6:1 C#6:1 A5:1 G5:2', 'A5:1 F5:1 D5:2 r:2 A4:1 D5:1',
        'F5:1 A5:1 C6:2 A5:1 F5:1 C5:2', 'D5:1 F#5:1 A5:1 C6:1 D6:2 C6:2', 'Bb5:2 G5:1 D5:1 G5:1 Bb5:1 D6:2', 'C6:1 Bb5:1 G5:1 E5:1 C5:2 E5:2',
        'A5:1 C6:1 F6:2 E6:1 C6:1 A5:2', 'D6:2 Bb5:1 F5:1 D5:2 F5:2', 'G5:1 Bb5:1 D6:2 C#6:1 E6:1 A5:2', 'E6:1 D6:1 C#6:1 A5:1 G5:1 E5:1 r:2'],
      ch: ['Dm', 'Dm', 'Gm7', 'A7', 'Dm', 'Bb7', 'A7', 'Dm', 'F', 'D7', 'Gm7', 'C7', 'F', 'Bb', 'Gm7 A7', 'A7']
    },
    pantallon: {
      bpm: 140, sw: .64, meter: 4, lead: 'vibes', alt: 'clarinet', altVel: .55, bass: 'sparse', comp: 'noir', drums: 'noir', lv: 1,
      mel: ['E5:3 r:1 G5:2 B5:2', 'D#5:2 E5:2 r:4', 'C5:2 E5:2 A5:3 G5:1', 'E5:6 r:2',
        'G5:2 B5:2 E6:3 r:1', 'D6:2 C6:2 Bb5:2 G5:2', 'F#5:3 D#5:1 B4:4', 'A5:2 F#5:2 D#5:2 r:2',
        'E5:3 r:1 G5:2 F#5:2', 'E5:2 G5:2 B5:3 r:1', 'A5:3 G5:1 E5:2 C5:2', 'F#5:2 A5:2 C6:3 r:1',
        'B5:4 G5:2 E5:2', 'C6:2 Bb5:2 G5:4', 'D#6:3 B5:1 F#5:2 r:2', 'A5:1 F#5:1 D#5:2 B4:4'],
      ch: ['Em', 'Em', 'Am7', 'Am7', 'Em', 'C7', 'B7', 'B7', 'Em', 'C', 'Am7', 'D7', 'Em', 'C7', 'B7', 'B7']
    },
    gaston: {
      bpm: 200, sw: .58, meter: 4, lead: 'trumpet', alt: 'trombone', bass: 'tuba', comp: 'charles', drums: 'charles', lv: 1.05,
      mel: ['Bb4:1 D5:1 F5:3 F5:1 Bb5:2', 'G5:3 F5:1 D5:2 B4:2', 'Eb5:3 G5:1 Bb5:2 G5:2', 'A5:3 C6:1 A5:2 F5:2',
        'Bb5:3 Bb5:1 D6:2 Bb5:2', 'D6:3 B5:1 G5:2 B5:2', 'Eb6:2 C6:2 A5:2 F5:2', 'Bb5:3 r:1 Bb4:1 D5:1 F5:2',
        'G5:3 Bb5:1 Eb6:4', 'Gb5:3 Bb5:1 Eb6:2 Bb5:2', 'D6:3 F6:1 D6:2 Bb5:2', 'B5:3 D6:1 G6:2 D6:2',
        'Eb6:3 D6:1 C6:2 G5:2', 'A5:3 C6:1 Eb6:2 C6:2', 'D6:2 Bb5:2 B5:2 D6:2', 'C6:3 A5:1 F5:2 r:2'],
      ch: ['Bb', 'G7', 'Cm7', 'F7', 'Bb', 'G7', 'Cm7 F7', 'Bb', 'Eb', 'Ebm', 'Bb', 'G7', 'Cm7', 'F7', 'Bb G7', 'F7']
    },
    flojera: {
      bpm: 90, bpmStep: 6, sw: .68, meter: 4, lead: 'trombone', alt: 'clarinet', altVel: .8, bass: 'walk', comp: 'blues', drums: 'blues', lv: 1,
      mel: ['D5:3 r:1 Bb4:1 B4:1 D5:2', 'E5:2 G5:2 Bb5:3 r:1', 'D5:3 B4:1 G4:4', 'r:2 G4:1 Bb4:1 B4:1 D5:1 F5:2',
        'E5:3 G5:1 E5:2 C5:2', 'Bb4:2 C5:2 E5:4', 'D5:2 B4:2 G4:2 B4:2', 'G#4:3 B4:1 D5:4',
        'C5:2 E5:2 G5:3 r:1', 'F#5:3 A5:1 C6:4', 'B5:2 G5:2 D5:4', 'A5:3 F#5:1 D5:2 r:2',
        'G5:2 G5:2 Bb5:2 C6:2', 'E6:3 C6:1 Bb5:4', 'A5:1 A5:1 C6:2 D6:2 C6:2', 'F#5:2 A5:2 C6:2 D6:2'],
      ch: ['G7', 'C7', 'G7', 'G7', 'C7', 'C7', 'G7', 'E7', 'Am7', 'D7', 'G7', 'D7', 'C7', 'C7', 'D7', 'D7']
    }
  };
  const THEME_IDS = Object.keys(SONGS);

  // pre-parseo (una vez)
  function prep(S) {
    if (S.pm) return S;
    const pc = a => a.map(s => s.trim().split(/\s+/));
    S.pm = { form: S.mel.map(parseBar), intro: S.intro ? S.intro.mel.map(parseBar) : [] };
    S.pc = { form: pc(S.ch), intro: S.intro ? pc(S.intro.ch) : [] };
    return S;
  }
  function getBar(S, n) {
    const il = S.pm.intro.length;
    if (n < il) return { mel: S.pm.intro[n], ch: S.pc.intro[n], intro: true, loop: -1, bi: n };
    const b = n - il, L = S.pm.form.length;
    return { mel: S.pm.form[b % L], ch: S.pc.form[b % L], intro: false, loop: Math.floor(b / L), bi: b % L };
  }
  function validate() {
    const errs = [];
    THEME_IDS.forEach(id => {
      const S = SONGS[id];
      try {
        prep(S); const per = S.meter * 2;
        S.pm.form.forEach((b, i) => { if (b.total !== per) errs.push(id + ' compás ' + (i + 1) + ': ' + b.total + ' corcheas (esperadas ' + per + ')'); });
        S.pm.intro.forEach((b, i) => { if (b.total !== per) errs.push(id + ' intro ' + (i + 1) + ': ' + b.total); });
        if (S.pm.form.length !== S.pc.form.length) errs.push(id + ': melodía y acordes de distinto largo');
        S.pc.form.concat(S.pc.intro).forEach(cs => cs.forEach(chord));
      } catch (e) { errs.push(id + ': ' + e.message); }
    });
    return errs;
  }

  /* ------------------------------------------------------------------ motor */
  function createEngine(ctx, offline) {
    const E = { ctx, offline, themes: [], voices: [], lastShoot: -1, popCursor: 0, muted: false, ducked: false };
    const sr = ctx.sampleRate;
    // ruido blanco compartido (2 s)
    const nb = ctx.createBuffer(1, sr * 2, sr), nd = nb.getChannelData(0);
    for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    E.noise = nb;
    // impulso de sala (≈1,1 s, oscuro)
    const irLen = Math.floor(sr * 1.1), ir = ctx.createBuffer(2, irLen, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = ir.getChannelData(ch); let lp = 0;
      for (let i = 0; i < irLen; i++) {
        const x = (Math.random() * 2 - 1) * Math.pow(1 - i / irLen, 2.6);
        lp += (x - lp) * 0.45; d[i] = lp;
      }
    }
    const G = (v) => { const g = ctx.createGain(); g.gain.value = v; return g; };
    // cadena maestra
    const masterIn = G(1);
    const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 60; hp.Q.value = 0.7;       // iPhone: sin subgraves
    const lpMaster = ctx.createBiquadFilter(); lpMaster.type = 'lowpass'; lpMaster.frequency.value = 14000;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 12; comp.ratio.value = 3.5; comp.attack.value = 0.004; comp.release.value = 0.16;
    const shaper = ctx.createWaveShaper();
    const curve = new Float32Array(2049);
    for (let i = 0; i < curve.length; i++) { const x = i / 1024 - 1; curve[i] = 1.25 * Math.tanh(x); }   // tope blando: |y| ≤ 0,95
    shaper.curve = curve; try { shaper.oversample = '2x'; } catch (e) {}
    const master = G(1);
    masterIn.connect(hp); hp.connect(lpMaster); lpMaster.connect(comp); comp.connect(shaper); shaper.connect(master); master.connect(ctx.destination);
    E.master = master;
    // reverb de sala
    const conv = ctx.createConvolver(); conv.buffer = ir;
    const revIn = G(1), revOut = G(0.55);
    revIn.connect(conv); conv.connect(revOut); revOut.connect(masterIn);
    E.revIn = revIn;
    // bus de música (con filtro para la pausa) y de sfx
    const musicBus = G(MUSIC_G), musicFilt = ctx.createBiquadFilter(); musicFilt.type = 'lowpass'; musicFilt.frequency.value = 20000; musicFilt.Q.value = 0.5;
    musicBus.connect(musicFilt); musicFilt.connect(masterIn);
    const mSend = G(0.2); musicFilt.connect(mSend); mSend.connect(revIn);
    E.musicBus = musicBus; E.musicFilt = musicFilt;
    const sfxBus = G(SFX_G); sfxBus.connect(masterIn);
    const sSend = G(0.14); sfxBus.connect(sSend); sSend.connect(revIn);
    E.sfxBus = sfxBus;
    // crujido de disco: hiss constante muy bajo + chasquidos (se agendan en pumpPops)
    const hs = ctx.createBufferSource(); hs.buffer = nb; hs.loop = true;
    const hsHp = ctx.createBiquadFilter(); hsHp.type = 'highpass'; hsHp.frequency.value = 1200;
    const hsLp = ctx.createBiquadFilter(); hsLp.type = 'lowpass'; hsLp.frequency.value = 5500;
    const crk = G(0); hs.connect(hsHp); hsHp.connect(hsLp); hsLp.connect(crk); crk.connect(musicBus); hs.start(0, R());
    E.crk = crk;
    // analizador (solo para pruebas en vivo)
    E.an = ctx.createAnalyser(); E.an.fftSize = 1024; master.connect(E.an);
    return E;
  }

  /* ----- primitivas ----- */
  function noiseSrc(E, t, dur) {
    const s = E.ctx.createBufferSource(); s.buffer = E.noise; s.loop = true;
    s.start(t, R() * 1.5); s.stop(t + dur + 0.03); return s;
  }
  // envolvente A-D-S-R exponencial (sin clics). Devuelve el instante final.
  function env(g, t, dur, peak, a, d, sus, rel) {
    const p = g.gain; peak = Math.max(peak, 0.0002);
    p.setValueAtTime(0.0001, t);
    p.exponentialRampToValueAtTime(peak, t + a);
    const sl = Math.max(peak * sus, 0.0001);
    p.exponentialRampToValueAtTime(sl, t + a + d);
    const tr = Math.max(t + a + d, t + dur - rel);
    p.setValueAtTime(sl, tr);
    p.exponentialRampToValueAtTime(0.0001, tr + rel);
    return tr + rel;
  }
  // tono simple con caída exponencial. o: type f f2 fd t dur peak a det
  function tone(E, dest, o) {
    const c = E.ctx, osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine'; osc.frequency.setValueAtTime(o.f, o.t);
    if (o.f2) osc.frequency.exponentialRampToValueAtTime(o.f2, o.t + (o.fd || o.dur));
    if (o.det) osc.detune.value = o.det;
    const a = o.a || 0.004;
    g.gain.setValueAtTime(0.0001, o.t); g.gain.exponentialRampToValueAtTime(Math.max(o.peak, 0.0002), o.t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    osc.connect(g); g.connect(dest); osc.start(o.t); osc.stop(o.t + o.dur + 0.03);
    return osc;
  }
  // ráfaga de ruido filtrada. o: t dur type f f2 fd q peak a
  function nz(E, dest, o) {
    const c = E.ctx, s = noiseSrc(E, o.t, o.dur), f = c.createBiquadFilter(), g = c.createGain();
    f.type = o.type || 'bandpass'; f.Q.value = o.q || 1; f.frequency.setValueAtTime(o.f, o.t);
    if (o.f2) f.frequency.exponentialRampToValueAtTime(o.f2, o.t + (o.fd || o.dur));
    const a = o.a || 0.002;
    g.gain.setValueAtTime(0.0001, o.t); g.gain.exponentialRampToValueAtTime(Math.max(o.peak, 0.0002), o.t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, o.t + o.dur);
    s.connect(f); f.connect(g); g.connect(dest);
  }
  function vibrato(E, oscs, t, dur, cents, rate) {
    if (dur < 0.3) return;
    const c = E.ctx, l = c.createOscillator(), lg = c.createGain();
    l.frequency.value = rate; lg.gain.setValueAtTime(0, t);
    lg.gain.linearRampToValueAtTime(cents, t + Math.min(0.3, dur * 0.7));
    l.connect(lg); oscs.forEach(o => lg.connect(o.detune)); l.start(t); l.stop(t + dur + 0.05);
  }

  /* ----- vientos ----- */
  const KINDS = {
    trumpet: { w: [['sawtooth', 0, 1], ['sawtooth', 7, .8]], ft: 'lowpass', f: [600, 3400, 2300], q: 1.2, pk: .14, a: .02, d: .07, s: .78, r: .05, vib: [5.5, 10], pt: .05 },
    clarinet: { w: [['square', 0, .55], ['triangle', 4, .9]], ft: 'lowpass', f: [900, 2200, 1700], q: .6, pk: .16, a: .04, d: .05, s: .85, r: .07, vib: [5, 6], pt: .06 },
    muted: { w: [['sawtooth', 0, 1], ['square', 5, .4]], ft: 'bandpass', f: [700, 1900, 1100], q: 3.2, pk: .3, a: .015, d: .05, s: .8, r: .04, vib: [6.2, 8], wah: true },
    trombone: { w: [['sawtooth', 0, 1], ['sawtooth', -8, .7]], ft: 'lowpass', f: [450, 1500, 900], q: 1, pk: .17, a: .06, d: .08, s: .8, r: .08, vib: [5, 12], pt: .1, scoop: 1.5 }
  };
  function wind(E, dest, kind, midi, t, dur, vel, o) {
    const K = KINDS[kind], c = E.ctx, f = mtof(midi); o = o || {};
    dur = Math.max(dur, 0.06);
    const eg = c.createGain(), flt = c.createBiquadFilter(), oscs = [];
    flt.type = K.ft; flt.Q.value = K.q;
    const pt = K.wah ? dur * 0.35 : Math.min(K.pt, dur * 0.5);
    flt.frequency.setValueAtTime(K.f[0], t);
    flt.frequency.exponentialRampToValueAtTime(K.f[1], t + Math.max(pt, 0.02));
    flt.frequency.exponentialRampToValueAtTime(K.f[2], t + Math.max(dur, pt + 0.03));
    K.w.forEach(w => {
      const os = c.createOscillator(); os.type = w[0]; os.detune.value = w[1];
      const sc = o.scoop != null ? o.scoop : K.scoop;
      if (sc) { os.frequency.setValueAtTime(f * Math.pow(2, -sc / 12), t); os.frequency.exponentialRampToValueAtTime(f, t + 0.08); }
      else os.frequency.setValueAtTime(f, t);
      const gm = c.createGain(); gm.gain.value = w[2];
      os.connect(gm); gm.connect(flt); os.start(t); oscs.push(os);
    });
    flt.connect(eg); eg.connect(dest);
    const end = env(eg, t, dur, K.pk * vel, K.a, K.d, K.s, K.r);
    vibrato(E, oscs, t, dur, K.vib[1], K.vib[0]);
    oscs.forEach(os => os.stop(end + 0.03));
    return end;
  }
  // vibráfono: seno + armónico 4×, caída larga; tremolo común en el bus
  function vibe(E, bus, midi, t, dur, vel) {
    const f = mtof(midi), len = Math.max(0.9, dur * 1.6);
    tone(E, bus, { type: 'sine', f, t, dur: len, peak: .3 * vel, a: .004 });
    tone(E, bus, { type: 'sine', f: f * 4, t, dur: len * .35, peak: .07 * vel, a: .003 });
    tone(E, bus, { type: 'sine', f: f * 2.01, t, dur: len * .5, peak: .05 * vel, a: .003 });
  }

  /* ----- sección rítmica ----- */
  function pianoNote(E, dest, f, t, dur, vel) {
    const c = E.ctx, g = c.createGain(), lp = c.createBiquadFilter();
    lp.type = 'lowpass'; lp.frequency.value = 2600; lp.Q.value = 0.4;
    const o1 = c.createOscillator(), o2 = c.createOscillator(), g2 = c.createGain();
    o1.type = 'triangle'; o1.frequency.value = f; o2.type = 'square'; o2.frequency.value = f; o2.detune.value = 7; g2.gain.value = 0.22;
    o1.connect(lp); o2.connect(g2); g2.connect(lp); lp.connect(g); g.connect(dest);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(Math.max(.1 * vel, .0002), t + 0.004);
    g.gain.exponentialRampToValueAtTime(Math.max(.1 * vel * .25, .0002), t + Math.min(0.12, dur * .5));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o1.start(t); o2.start(t); o1.stop(t + dur + .03); o2.stop(t + dur + .03);
  }
  function voicing(ch) {
    const c = chord(ch), iv = c.iv;
    return [iv[1], iv[2], iv[3] != null ? iv[3] : 0].map(i => nearest((c.root + i) % 12, 57));
  }
  function bassNote(E, dest, midi, t, dur, vel, kind) {
    const f = mtof(midi), c = E.ctx;
    if (kind === 'tuba') {
      const o = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
      o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 520; lp.Q.value = 1.4;
      o.connect(lp); lp.connect(g); g.connect(dest);
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(.3 * vel, t + .015);
      g.gain.exponentialRampToValueAtTime(.12 * vel, t + dur * .6); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.start(t); o.stop(t + dur + .03);
      tone(E, dest, { type: 'sine', f: f * 2, t, dur, peak: .12 * vel, a: .01 });
      return;
    }
    // contrabajo: seno + triángulo octava arriba (audible en parlante chico) + golpe de dedo
    tone(E, dest, { type: 'sine', f: f * 1.05, f2: f, fd: .03, t, dur, peak: .42 * vel, a: .006 });
    tone(E, dest, { type: 'triangle', f: f * 2, t, dur: dur * .8, peak: .16 * vel, a: .005 });
    nz(E, dest, { t, dur: .025, type: 'lowpass', f: 900, q: .7, peak: .09 * vel, a: .001 });
  }
  const D = {
    ride(E, t, v) { nz(E, E.drumBus, { t, dur: .14, type: 'highpass', f: 6500, q: .5, peak: .09 * v, a: .001 }); },
    chick(E, t, v) { nz(E, E.drumBus, { t, dur: .05, type: 'bandpass', f: 3800, q: 1.4, peak: .12 * v, a: .001 }); },
    swish(E, t, v) { nz(E, E.drumBus, { t, dur: .17, type: 'bandpass', f: 2800, q: .8, peak: .06 * v, a: .025 }); },
    snare(E, t, v) {
      nz(E, E.drumBus, { t, dur: .12, type: 'bandpass', f: 2000, q: .9, peak: .15 * v, a: .001 });
      tone(E, E.drumBus, { type: 'triangle', f: 200, f2: 150, t, dur: .08, peak: .09 * v, a: .001 });
    },
    kick(E, t, v) {
      tone(E, E.drumBus, { type: 'sine', f: 125, f2: 68, fd: .1, t, dur: .22, peak: .38 * v, a: .002 });
      nz(E, E.drumBus, { t, dur: .015, type: 'lowpass', f: 1200, q: .5, peak: .08 * v, a: .001 });
    },
    wood(E, t, hi, v) {
      const f = hi ? 1900 : 1350;
      tone(E, E.drumBus, { type: 'sine', f, f2: f * .94, fd: .03, t, dur: .05, peak: .26 * v, a: .001 });
      nz(E, E.drumBus, { t, dur: .02, type: 'bandpass', f: f * 1.2, q: 5, peak: .14 * v, a: .001 });
    },
    crash(E, t, v) { nz(E, E.drumBus, { t, dur: 1.3, type: 'highpass', f: 4200, q: .5, peak: .16 * v, a: .003 }); }
  };

  /* ----- un paso (corchea) de un tema ----- */
  function stepTick(E, T) {
    const S = T.S, ctx = E.ctx, per = S.meter * 2, bar = Math.floor(T.n / per), st = T.n % per, beat = st >> 1;
    const B = getBar(S, bar), t0 = T.t, dest = T.g;
    if (st === 0) {
      // energía (puente que sube): flojera sube cada pasada de 16 compases, ida y vuelta
      T.energy = S.bpmStep ? [0, 1, 2, 3, 2, 1][Math.max(B.loop, 0) % 6] : 0;
      T.spb = 60 / (S.bpm + (S.bpmStep || 0) * T.energy);
      T.cur = B;
    }
    const spb = T.spb, sw = S.sw, en = T.energy;
    const stepDur = k => ((k & 1) === 0 ? sw : 1 - sw) * spb;
    const lenOf = (s0, d) => { let x = 0; for (let i = 0; i < d; i++) x += stepDur(s0 + i); return x; };
    const odd = B.loop >= 0 && B.loop % 2 === 1;
    const chAt = bt => (B.ch.length === 1 || S.meter === 3) ? B.ch[0] : (bt < 2 ? B.ch[0] : B.ch[1]);
    const tH = t0 + (R() - 0.5) * 0.008;   // humanización mínima

    /* melodía */
    B.mel.forEach(n => {
      if (n.s !== st || n.m == null) return;
      const dur = lenOf(st, n.d);
      let kind = S.lead, vel = S.lv || 1;
      if (odd) { kind = S.alt || S.lead; vel *= (S.altVel || 1); }
      if (B.intro) vel *= 1.1;
      const accent = (st % 2 === 0) ? 1 : 0.88;
      const legato = kind === 'vibes' ? 1 : (S.bpm > 170 ? 0.82 : 0.92);
      if (kind === 'vibes') {
        if (!T.vbus) { // bus con trémolo (seno 5,2 Hz)
          const c = ctx, tb = c.createGain(); tb.gain.value = .7; const l = c.createOscillator(), lg = c.createGain();
          l.frequency.value = 5.2; lg.gain.value = .3; l.connect(lg); lg.connect(tb.gain); l.start(t0); tb.connect(T.g); T.vbus = tb; T.lfo = l;
        }
        vibe(E, T.vbus, n.m, tH, dur, vel * accent);
      } else {
        if (odd && n.d >= 2 && st % 2 === 0 && (B.bi + st) % 3 === 0 && tH - 0.055 > ctx.currentTime) wind(E, dest, kind, n.m - 1, tH - 0.055, 0.055, vel * .6, { scoop: 0 });
        wind(E, dest, kind, n.m, tH, dur * legato, vel * accent);
      }
    });

    /* bajo */
    if (st % 2 === 0) {
      const ch = chAt(beat), c = chord(ch), rootM = 36 + c.root;
      const half = (B.ch.length === 2 && S.meter === 4);
      const j = half ? (beat % 2) : beat;
      const nextCh = half ? (beat < 2 ? B.ch[1] : null) : null;
      let nextRoot;
      if (nextCh) nextRoot = 36 + chord(nextCh).root;
      else { const nb = getBar(S, bar + 1); nextRoot = 36 + chord(nb.ch[0]).root; }
      const bl = (S.bass === 'walk' ? 0.92 : 0.8) * 2 * spb * (S.bass === 'tuba' ? 0.6 : 1) / 2;
      let m = null, v = 0.9;
      if (S.bass === 'tuba') {
        m = (beat % 2 === 0) ? rootM : rootM + 7; v = (beat % 2 === 0) ? 1 : .8;
        bassNote(E, dest, fold(m, 34, 50), tH, spb * .55, v, 'tuba'); m = null;
      } else if (S.bass === 'waltz') {
        if (beat === 0) m = rootM; else if (beat === 1) m = rootM + c.iv[2]; else m = nextRoot + (bar % 2 ? 1 : -1);
        if (beat === 2) v = .7;
      } else if (S.bass === 'sparse') {
        if (beat === 0) m = rootM; else if (beat === 2) m = rootM + 7; else if (beat === 3 && (bar % 2)) m = nextRoot - 1;
        v = .75;
      } else { // walking
        const len = half ? 2 : 4;
        if (j === 0) m = rootM;
        else if (j === len - 1) m = nextRoot + ((bar + beat) % 2 ? 1 : -1);
        else if (j === 1) m = rootM + c.iv[(bar % 2) ? 2 : 1];
        else m = rootM + c.iv[2];
        if (S.bass === 'walk' && S.drums === 'blues') v = .85;
      }
      if (m != null) bassNote(E, dest, fold(m, 33, 51), tH + (S.drums === 'blues' ? 0.012 : 0), spb * .9, v, 'bass');
    }

    /* acompañamiento (piano / metales) */
    const cv = S.cv || 1;
    const pchord = (chs, dur, vel, extra) => {
      voicing(chs).forEach((m, i) => { pianoNote(E, dest, mtof(m), tH + i * .006, dur, vel * cv); if (extra) wind(E, dest, 'trumpet', m + 12, tH, dur, vel * .7, { scoop: 0 }); });
    };
    const pbass = (chs, five, vel) => {
      const c = chord(chs); pianoNote(E, dest, mtof(nearest((c.root + (five ? 7 : 0)) % 12, 43)), tH, spb * .8, vel * cv);
    };
    const cs = chAt(beat);
    const style = B.intro ? 'stab' : S.comp;
    switch (style) {
      case 'stab': if (st === 0 || st === 4 || st === 5) pchord(cs, st === 0 ? spb * 1.4 : spb * .5, 1.1, true); break;
      case 'stride': case 'rag':
        if (st === 0) pbass(cs, false, .9); else if (st === 4) pbass(chAt(2), true, .9);
        else if (st === 2 || st === 6) pchord(cs, spb * .55, S.comp === 'rag' ? .75 : .95);
        if (S.comp === 'rag' && st === 7) pchord(cs, spb * .35, .4);
        if (S.comp === 'stride' && st === 5 && odd) pchord(cs, spb * .3, .5);
        break;
      case 'waltz':
        if (st === 0) pbass(cs, false, .9); else if (st === 2 || st === 4) pchord(cs, spb * .6, .8); break;
      case 'charles':
        if (st === 0 || st === 3 || st === 4 || st === 7) pchord(chAt(beat), (st === 0 || st === 4) ? spb * 1.1 : spb * .45, st === 0 ? 1.05 : .95);
        break;
      case 'noir':
        if (st === 3 && bar % 2 === 0) pchord(cs, spb * 2.2, .55);
        if (st === 6 && bar % 4 === 3) pchord(cs, spb * 1.2, .4);
        break;
      case 'blues':
        if (st === 2 || st === 6) pchord(cs, spb * (1 + en * .1), .75);
        if (en >= 1 && (st === 3 || st === 7)) pchord(cs, spb * .4, .5);
        if (en >= 2 && st === 0) pbass(cs, false, .8);
        break;
    }

    /* batería */
    E.drumBus = T.drum;
    const dv = (S.dv || 1);
    const nbar = bar;
    switch (S.drums) {
      case 'swing': case 'hot': {
        const hot = S.drums === 'hot';
        if ([0, 2, 3, 4, 6, 7].includes(st)) D.ride(E, tH, (st % 2 ? .7 : 1) * dv);
        if (st === 2 || st === 6) D.chick(E, tH, dv);
        if (st % 2 === 0) D.swish(E, tH, (hot ? 1.3 : 1) * dv);
        if (st === 0 || st === 4) D.kick(E, tH, (hot ? .8 : .7) * dv);
        if (hot && (st === 2 || st === 6)) D.kick(E, tH, .4);
        if (st === 2 || st === 6) D.snare(E, tH, (hot ? 1 : .55) * dv);
        if (hot && st === 3 && nbar % 2) D.snare(E, tH, .35);
        if (hot && nbar % 4 === 3 && st >= 5) D.snare(E, tH, .5 + (st - 5) * .15);       // redoble de cierre
        if (S.crash && st === 0 && B.bi === 0 && B.loop <= 0) D.crash(E, tH, 1);
        if (B.intro && B.bi === S.pm.intro.length - 1 && st >= 4) D.snare(E, tH, .45 + (st - 4) * .12);
        break;
      }
      case 'waltz':
        if ([0, 2, 3, 4].includes(st)) D.ride(E, tH, (st === 3 ? .6 : .9) * dv);
        if (st === 0) D.kick(E, tH, .6 * dv);
        if (st === 2 || st === 4) D.chick(E, tH, .8 * dv);
        if (st % 2 === 0) D.swish(E, tH, .9);
        if (st === 4 && nbar % 2) D.snare(E, tH, .3);
        break;
      case 'noir':
        if (st % 2 === 0) D.wood(E, tH, beat % 2 === 0, 1);          // tic-tac
        if (st === 2 || st === 6) D.swish(E, tH, 1.1);
        if (st === 0 && nbar % 2 === 0) D.kick(E, tH, .5);
        if (st === 4) D.chick(E, tH, .6);
        if (st === 7 && nbar % 4 === 3) D.snare(E, tH, .3);
        break;
      case 'charles':
        if (st === 0 || st === 4) D.kick(E, tH, .85);
        if (st === 2 || st === 6) D.snare(E, tH, 1);
        if ([0, 3, 4, 7].includes(st)) D.ride(E, tH, .9);
        if (st === 2 || st === 6) D.chick(E, tH, .7);
        if (nbar % 4 === 3 && st >= 5) D.snare(E, tH, .45 + (st - 5) * .15);
        if (st === 0 && B.bi === 0 && B.loop >= 0) D.crash(E, tH, .6);
        break;
      case 'blues':
        if ([0, 2, 3, 4, 6, 7].includes(st)) D.ride(E, tH, (st % 2 ? .55 : .8) * (1 + en * .1));
        if (st % 2 === 0) D.swish(E, tH, 1.3);
        if (st === 0) D.kick(E, tH, .7);
        if (st === 4 && en >= 2) D.kick(E, tH, .6);
        if (st === 2 || st === 6) D.snare(E, tH, .5 + en * .25);
        if (en >= 1 && (st === 2 || st === 6)) D.chick(E, tH, .8);
        if (en >= 3 && nbar % 4 === 3 && st >= 5) D.snare(E, tH, .6);
        break;
    }

    // avanzar
    T.t += stepDur(st);
    T.n++;
  }

  function newTheme(E, id, t0, startBar) {
    const S = prep(SONGS[id]), c = E.ctx;
    const g = c.createGain(); g.gain.value = 1; g.connect(E.musicBus);
    const drum = c.createGain(); drum.gain.value = 1; drum.connect(g);
    return { id, S, g, drum, n: (startBar || 0) * S.meter * 2, t: t0, spb: 60 / S.bpm, energy: 0, vbus: null, lfo: null, dead: false };
  }
  function pump(E, T, until) {
    let guard = 0;
    while (T.t < until && guard++ < 64) stepTick(E, T);
  }
  // chasquidos de disco entre dos instantes
  function pumpPops(E, from, until) {
    if (E.popCursor < from) E.popCursor = from;
    let guard = 0;
    while (E.popCursor < until && guard++ < 16) {
      const t = E.popCursor; E.popCursor += -Math.log(1 - R()) * 0.38 + 0.03;
      const a = 0.015 + Math.pow(R(), 3) * 0.1;
      nz(E, E.musicBus, { t, dur: .004 + R() * .006, type: 'highpass', f: 1500 + R() * 1500, q: .6, peak: a, a: .0005 });
      if (R() < .12) nz(E, E.musicBus, { t: t + .012, dur: .006, type: 'highpass', f: 2500, q: .6, peak: a * .6, a: .0005 });
    }
  }

  /* ------------------------------------------------------------------ SFX */
  function bell(E, dest, t, f, peak, decay) {
    [[1, 1], [2.76, .55], [5.4, .3], [8.93, .15]].forEach(p => tone(E, dest, { type: 'sine', f: f * p[0], t, dur: decay / (1 + p[0] * .15), peak: peak * p[1], a: .002 }));
  }
  function tbn(E, dest, f0, f1, t, dur, peak, wahs) {
    const c = E.ctx, o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
    o1.type = o2.type = 'sawtooth'; o2.detune.value = -9;
    o1.frequency.setValueAtTime(f0, t); o2.frequency.setValueAtTime(f0, t);
    if (f1) { o1.frequency.exponentialRampToValueAtTime(f1, t + dur); o2.frequency.exponentialRampToValueAtTime(f1, t + dur); }
    lp.type = 'lowpass'; lp.Q.value = 1.6;
    lp.frequency.setValueAtTime(380, t); lp.frequency.exponentialRampToValueAtTime(1700, t + dur * .35); lp.frequency.exponentialRampToValueAtTime(420, t + dur);
    o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(dest);
    const end = env(g, t, dur, peak, .03, .05, .85, Math.min(.08, dur * .3));
    if (wahs) vibrato(E, [o1, o2], t, dur, 25, 5.5);
    o1.start(t); o2.start(t); o1.stop(end + .03); o2.stop(end + .03);
  }
  const SFX = {
    shoot(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'sine', f: 620 * v, f2: 210 * v, fd: .06, t, dur: .09, peak: .42, a: .003 });
      nz(E, B, { t, dur: .03, type: 'bandpass', f: 2400 * v, q: 1, peak: .14, a: .001 }); return .1; },
    hit(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'triangle', f: 340 * v, f2: 110 * v, fd: .05, t, dur: .09, peak: .55, a: .002 });
      nz(E, B, { t, dur: .045, type: 'bandpass', f: 1400 * v, q: 1, peak: .3, a: .001 }); return .1; },
    parry(E, t, v) { const B = E.sfxBus;
      [[0, 1], [.13, .5], [.27, .22]].forEach(p => {
        const tt = t + p[0], g = p[1];
        tone(E, B, { type: 'sine', f: 1760 * v, t: tt, dur: .55, peak: .32 * g, a: .002 });
        tone(E, B, { type: 'sine', f: 2637 * v, t: tt, dur: .35, peak: .14 * g, a: .002 });
        tone(E, B, { type: 'sine', f: 3520 * v, t: tt, dur: .15, peak: .08 * g, a: .002 });
      }); return .85; },
    hurt(E, t, v) { const B = E.sfxBus, c = E.ctx;
      const honk = (tt, f0, f1, dur) => {
        const o1 = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
        o1.type = 'square'; o2.type = 'square'; o2.detune.value = 22;
        o1.frequency.setValueAtTime(f0, tt); o1.frequency.exponentialRampToValueAtTime(f1, tt + dur);
        o2.frequency.setValueAtTime(f0 * 1.005, tt); o2.frequency.exponentialRampToValueAtTime(f1 * 1.005, tt + dur);
        lp.type = 'lowpass'; lp.frequency.value = 1700; lp.Q.value = 2;
        o1.connect(lp); o2.connect(lp); lp.connect(g); g.connect(B);
        const end = env(g, tt, dur, .16, .012, .04, .8, .05); o1.start(tt); o2.start(tt); o1.stop(end + .03); o2.stop(end + .03);
      };
      honk(t, 360 * v, 340 * v, .11); honk(t + .13, 310 * v, 135 * v, .32); return .5; },
    death(E, t, v) { const B = E.sfxBus;
      tbn(E, B, 233 * v, 0, t, .26, .3, false); tbn(E, B, 220 * v, 0, t + .3, .26, .3, false); tbn(E, B, 208 * v, 0, t + .6, .26, .3, false);
      tbn(E, B, 196 * v, 138 * v, t + .9, .95, .34, true); return 1.9; },
    knockout(E, t, v) { const B = E.sfxBus;
      [0, .26, .52].forEach((d, i) => bell(E, B, t + d, 880 * v, .26 * (1 - i * .2), .9));
      nz(E, B, { t, dur: 1.4, type: 'highpass', f: 4500, q: .5, peak: .22, a: .004 });
      [[72, .55, .12], [76, .7, .12], [79, .85, .12], [84, 1.0, .85]].forEach(n => wind(E, B, 'trumpet', n[0], t + n[1], n[2], 1));
      wind(E, B, 'trombone', 60, t + 1.0, .85, .9);
      tone(E, B, { type: 'sine', f: 150, f2: 80, fd: .3, t: t + 1.0, dur: .8, peak: .35, a: .003 }); return 2.0; },
    announcer(E, t, v) { const B = E.sfxBus;
      [67, 72, 76].forEach(m => wind(E, B, 'trumpet', m + (v > 1 ? 0 : 0), t, .12, .9));
      [60, 64, 67, 72, 76].forEach(m => wind(E, B, 'trumpet', m, t + .17, .8, 1));
      wind(E, B, 'trombone', 48, t + .17, .8, 1); wind(E, B, 'trombone', 55, t + .17, .8, .8);
      nz(E, B, { t: t + .17, dur: .5, type: 'highpass', f: 5000, q: .5, peak: .08, a: .003 }); return 1.05; },
    phase(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'sine', f: 150 * v, f2: 78 * v, fd: .35, t, dur: 1.1, peak: .6, a: .003 });
      nz(E, B, { t, dur: .18, type: 'lowpass', f: 320, q: .6, peak: .5, a: .002 });
      [180, 284, 372, 509, 731].forEach((f, i) => tone(E, B, { type: 'sine', f: f * v, t, dur: 1.7 - i * .15, peak: .09 / (1 + i * .3), a: .004 }));
      return 1.8; },
    jump(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'sine', f: 420 * v, f2: 1500 * v, fd: .17, t, dur: .2, peak: .3, a: .01 });
      tone(E, B, { type: 'triangle', f: 840 * v, f2: 3000 * v, fd: .17, t, dur: .18, peak: .05, a: .01 }); return .22; },
    dash(E, t, v) { const B = E.sfxBus;
      nz(E, B, { t, dur: .28, type: 'bandpass', f: 500 * v, f2: 3200 * v, fd: .2, q: 1.3, peak: .5, a: .05 });
      nz(E, B, { t, dur: .22, type: 'highpass', f: 5000, q: .5, peak: .1, a: .04 }); return .3; },
    ex(E, t, v) { const B = E.sfxBus, c = E.ctx;
      const o = c.createOscillator(), o2 = c.createOscillator(), lp = c.createBiquadFilter(), g = c.createGain();
      o.type = o2.type = 'sawtooth'; o2.detune.value = 8; o.frequency.setValueAtTime(180, t); o.frequency.exponentialRampToValueAtTime(720, t + .5);
      o2.frequency.setValueAtTime(180, t); o2.frequency.exponentialRampToValueAtTime(720, t + .5);
      lp.type = 'lowpass'; lp.Q.value = 2; lp.frequency.setValueAtTime(400, t); lp.frequency.exponentialRampToValueAtTime(3200, t + .5);
      o.connect(lp); o2.connect(lp); lp.connect(g); g.connect(B);
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.32, t + .5); g.gain.exponentialRampToValueAtTime(.0001, t + .56);
      o.start(t); o2.start(t); o.stop(t + .6); o2.stop(t + .6);
      nz(E, B, { t, dur: .55, type: 'bandpass', f: 800, f2: 4500, fd: .5, q: 1, peak: .22, a: .4 });
      const tb = t + .5;
      [60, 64, 67, 72, 76].forEach(m => wind(E, B, 'trumpet', m, tb, .6, 1.1));
      wind(E, B, 'trombone', 48, tb, .6, 1); wind(E, B, 'trombone', 55, tb, .6, .9);
      nz(E, B, { t: tb, dur: .9, type: 'highpass', f: 3500, q: .5, peak: .3, a: .003 });
      tone(E, B, { type: 'sine', f: 140, f2: 72, fd: .25, t: tb, dur: .6, peak: .5, a: .003 }); return 1.3; },
    tick(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'sine', f: 1500 * v, f2: 1100 * v, fd: .02, t, dur: .045, peak: .34, a: .001 });
      nz(E, B, { t, dur: .018, type: 'bandpass', f: 3000, q: 3, peak: .22, a: .001 }); return .06; },
    select(E, t, v) { const B = E.sfxBus;
      [[0, 1568], [.07, 2093]].forEach(p => {
        tone(E, B, { type: 'sine', f: p[1] * v, t: t + p[0], dur: .38, peak: .24, a: .002 });
        tone(E, B, { type: 'sine', f: p[1] * 2 * v, t: t + p[0], dur: .18, peak: .06, a: .002 });
      }); return .5; },
    buy(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'sine', f: 170, f2: 95, fd: .09, t, dur: .12, peak: .3, a: .002 });
      nz(E, B, { t, dur: .07, type: 'bandpass', f: 3500, q: 2, peak: .28, a: .001 });
      const c0 = t + .09;
      tone(E, B, { type: 'sine', f: 2637 * v, t: c0, dur: .75, peak: .24, a: .002 });
      tone(E, B, { type: 'sine', f: 3951 * v, t: c0, dur: .5, peak: .12, a: .002 });
      tone(E, B, { type: 'sine', f: 1318 * v, t: c0, dur: .4, peak: .1, a: .002 });
      nz(E, B, { t: c0, dur: .04, type: 'highpass', f: 6000, q: .5, peak: .12, a: .001 }); return .95; },
    iris(E, t, v) { const B = E.sfxBus;
      for (let i = 0; i < 7; i++) {
        const tt = t + i * .038;
        tone(E, B, { type: 'sine', f: 160 * v, f2: 110 * v, fd: .05, t: tt, dur: .09, peak: .1 + .035 * i, a: .002 });
        nz(E, B, { t: tt, dur: .05, type: 'lowpass', f: 600, q: .6, peak: .08 + .02 * i, a: .001 });
      }
      tone(E, B, { type: 'sine', f: 130 * v, f2: 72 * v, fd: .2, t: t + .3, dur: .4, peak: .5, a: .003 });
      nz(E, B, { t: t + .3, dur: .12, type: 'lowpass', f: 400, q: .6, peak: .35, a: .002 }); return .75; },
    coin(E, t, v) { const B = E.sfxBus;
      tone(E, B, { type: 'triangle', f: 988 * v, t, dur: .1, peak: .3, a: .002 });
      tone(E, B, { type: 'triangle', f: 1319 * v, t: t + .07, dur: .38, peak: .3, a: .002 });
      tone(E, B, { type: 'sine', f: 2637 * v, t: t + .07, dur: .22, peak: .09, a: .002 }); return .5; }
  };
  const SFX_NAMES = Object.keys(SFX);
  const LOW_PRIO = { shoot: 1, tick: 1, hit: 1, jump: 1, dash: 1 };

  function playSfx(E, name, t) {
    const fn = SFX[name]; if (!fn) return 0;
    return fn(E, t, 1 + (R() - 0.5) * 0.08);
  }

  /* ------------------------------------------------------------------ vida en vivo */
  const L = { ctx: null, E: null, timer: null, cur: null, curId: null, fading: [], muted: false, ducked: false, unlockedHooks: false };
  try { L.muted = window.localStorage.getItem('mg-muted') === '1'; } catch (e) {}

  function ensure() {
    if (L.E) return L.E;
    if (!AC) return null;
    try {
      const ctx = new AC({ latencyHint: 'interactive' });
      L.ctx = ctx; L.E = createEngine(ctx, false);
      L.E.master.gain.value = L.muted ? 0 : 1;
      return L.E;
    } catch (e) { L.ctx = null; L.E = null; return null; }
  }
  function running() { return L.ctx && L.ctx.state === 'running'; }

  function tick() {
    try {
      const E = L.E; if (!E || !running()) return;
      const now = E.ctx.currentTime;
      if (L.cur) {
        const T = L.cur;
        if (T.started !== true) { T.t = now + 0.06; T.started = true; E.popCursor = now; }
        else if (T.t < now - 0.25) T.t = now + 0.05;              // pestaña dormida: no recuperar el atraso
        pump(E, T, now + AHEAD);
        pumpPops(E, now, now + AHEAD);
      }
    } catch (e) { /* el audio nunca debe tirar el juego */ }
  }
  function startTimer() { if (!L.timer) L.timer = setInterval(tick, TICK_MS); }
  function stopTimer() { if (L.timer && !L.cur) { clearInterval(L.timer); L.timer = null; } }

  function resume() {
    try {
      const ctx = L.ctx; if (!ctx) return;
      if (ctx.state !== 'running' && ctx.resume) {
        const p = ctx.resume(); if (p && p.catch) p.catch(() => {});
      }
      if (!L.primed) { // reproducir un buffer vacío: exigencia de iOS
        const b = ctx.createBuffer(1, 1, 22050), s = ctx.createBufferSource(); s.buffer = b; s.connect(ctx.destination); s.start(0); L.primed = true;
      }
    } catch (e) {}
  }
  function hookGestures() {
    if (L.unlockedHooks) return; L.unlockedHooks = true;
    const h = () => { if (!L.ctx) ensure(); resume(); };
    ['pointerdown', 'touchend', 'mousedown', 'keydown'].forEach(ev => window.addEventListener(ev, h, { capture: true, passive: true }));
    document.addEventListener('visibilitychange', () => { if (!document.hidden) resume(); });
  }

  function fadeOut(T, E, secs) {
    const t = E.ctx.currentTime;
    try { T.g.gain.cancelScheduledValues(t); T.g.gain.setValueAtTime(Math.max(T.g.gain.value, 0.0002), t); T.g.gain.exponentialRampToValueAtTime(0.0001, t + secs); } catch (e) {}
    T.dead = true; L.fading.push(T);
    setTimeout(() => { try { T.g.disconnect(); if (T.lfo) T.lfo.stop(); } catch (e) {} const i = L.fading.indexOf(T); if (i >= 0) L.fading.splice(i, 1); }, (secs + 0.35) * 1000);
  }

  const API = {
    unlock() { hookGestures(); ensure(); resume(); },
    music(id) {
      try {
        hookGestures();
        const E = ensure(); if (!E) return;
        if ((id || null) === L.curId) return;
        const old = L.cur; L.cur = null; L.curId = id || null;
        const now = E.ctx.currentTime;
        if (old) fadeOut(old, E, XFADE);
        const crkTarget = id ? 0.012 : 0.0001;
        try { E.crk.gain.cancelScheduledValues(now); E.crk.gain.setTargetAtTime(crkTarget, now, 0.3); } catch (e) {}
        if (id && SONGS[id]) {
          const T = newTheme(E, id, now + 0.06, 0);
          T.g.gain.setValueAtTime(0.0001, now); T.g.gain.exponentialRampToValueAtTime(1, now + XFADE);
          T.started = false; L.cur = T; startTimer(); resume(); tick();
        } else { L.curId = null; setTimeout(stopTimer, (XFADE + 0.4) * 1000); }
      } catch (e) {}
    },
    sfx(name) {
      try {
        const E = L.E || ensure(); if (!E || !running()) return;
        const now = E.ctx.currentTime;
        E.voices = E.voices.filter(v => v.end > now);
        const low = !!LOW_PRIO[name];
        if (name === 'shoot') {
          if (now - E.lastShoot < 0.045) return;
          if (E.voices.filter(v => v.name === 'shoot').length >= 3) return;
          E.lastShoot = now;
        }
        if (E.voices.length >= 8 && low) return;
        if (E.voices.length >= 10) return;
        const d = playSfx(E, name, now + 0.005);
        if (d) E.voices.push({ name, end: now + d });
      } catch (e) {}
    },
    // fade: segundos del fundido de salida (por defecto 0,25)
    stop(fade) {
      try {
        const E = L.E; if (!E) return;
        const f = Math.max(0.05, +fade || 0.25);
        if (L.cur) { fadeOut(L.cur, E, f); L.cur = null; L.curId = null; }
        try { const now = E.ctx.currentTime; E.crk.gain.cancelScheduledValues(now); E.crk.gain.setTargetAtTime(0.0001, now, f / 2.5); } catch (e) {}
        setTimeout(stopTimer, (f + 0.35) * 1000);
      } catch (e) {}
    },
    duck(on) {
      try {
        L.ducked = !!on; const E = L.E; if (!E) return; const now = E.ctx.currentTime;
        E.musicBus.gain.cancelScheduledValues(now); E.musicBus.gain.setTargetAtTime(on ? MUSIC_G * 0.25 : MUSIC_G, now, 0.08);
        E.musicFilt.frequency.cancelScheduledValues(now); E.musicFilt.frequency.setTargetAtTime(on ? 900 : 20000, now, 0.08);
      } catch (e) {}
    },
    setMuted(m) {
      L.muted = !!m;
      try { window.localStorage.setItem('mg-muted', L.muted ? '1' : '0'); } catch (e) {}
      try { const E = L.E; if (E) { const now = E.ctx.currentTime; E.master.gain.cancelScheduledValues(now); E.master.gain.setTargetAtTime(L.muted ? 0 : 1, now, 0.04); } } catch (e) {}
    },
    get muted() { return L.muted; },
    themes: THEME_IDS, sfxNames: SFX_NAMES,

    /* ---- hooks de prueba ---- */
    _validate: validate,
    _state() { return { ctx: L.ctx ? L.ctx.state : null, theme: L.curId, muted: L.muted, fading: L.fading.length, timer: !!L.timer }; },
    _peek() { // RMS actual de la salida (solo en vivo)
      const E = L.E; if (!E) return -1; const a = new Float32Array(E.an.fftSize); E.an.getFloatTimeDomainData(a);
      let s = 0; for (let i = 0; i < a.length; i++) s += a[i] * a[i]; return Math.sqrt(s / a.length);
    },
    // Renderiza con el MISMO código contra un OfflineAudioContext. id = tema o 'sfx:nombre'.
    _renderOffline(id, seg, startBar) {
      if (!OAC) return Promise.reject(new Error('sin OfflineAudioContext'));
      seg = seg || 6; const sr = 44100;
      const ctx = new OAC(2, Math.ceil(sr * seg), sr), E = createEngine(ctx, true);
      E.crk.gain.value = 0.012;
      let active = seg;
      if (id.indexOf('sfx:') === 0) active = playSfx(E, id.slice(4), 0.01) + 0.01;
      else {
        const T = newTheme(E, id, 0.02, startBar || 0);
        pump(E, T, seg + 0.5); pumpPops(E, 0, seg);
      }
      return ctx.startRendering().then(buf => {
        const d = buf.getChannelData(0), n = Math.min(d.length, Math.ceil(active * sr)), d1 = buf.getChannelData(1);
        let s = 0, pk = 0, nan = 0, sa = 0;
        for (let i = 0; i < d.length; i++) {
          const x = d[i], y = d1[i];
          if (x !== x || y !== y || !isFinite(x) || !isFinite(y)) { nan++; continue; }
          const ax = Math.max(Math.abs(x), Math.abs(y)); if (ax > pk) pk = ax;
          s += x * x; if (i < n) sa += x * x;
        }
        return { sr, seconds: seg, active, rmsAll: Math.sqrt(s / d.length), rmsActive: Math.sqrt(sa / Math.max(n, 1)), peak: pk, nan, samples: d };
      });
    }
  };
  MG.audio = API;

  /* tecla M (solo con el juego abierto) */
  window.addEventListener('keydown', e => {
    if (!MG.isOpen || e.repeat) return;
    if (e.key !== 'm' && e.key !== 'M') return;
    const tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA') return;
    if (MG.toggleSound) MG.toggleSound();          // mismo interruptor que el pueblo y el botón ♪
    else { API.setMuted(!L.muted); if (!L.muted) API.sfx('select'); }
  });
  hookGestures();
})();
