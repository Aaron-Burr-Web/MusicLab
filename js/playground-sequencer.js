(() => {
  const box = document.querySelector('.box');
  if (!box) return;

  const styles = document.createElement('style');
  styles.textContent = `
    .sequencer-panel {
      --panel-accent: #f2d24f;
      --panel-accent-strong: #f9c74f;
      --panel-accent-soft: #f6d864;
      --panel-accent-deep: rgba(56, 42, 8, 0.9);
      --panel-shell: rgba(235, 240, 250, 0.9);
      position: relative;
      width: min(1200px, calc(100% - 30px));
      margin: 0 auto 24px;
      padding: 22px 20px 18px;
      border-radius: 24px;
      background: linear-gradient(145deg, rgba(255,255,255,0.96) 0%, rgba(240,244,255,0.98) 38%, rgba(246,249,255,0.98) 100%);
      box-shadow:
        inset 1px 1px 0 rgba(255,255,255,0.9),
        inset -1px -1px 0 rgba(176,182,201,0.16),
        14px 18px 28px rgba(39, 49, 75, 0.08),
        -4px -4px 10px rgba(255,255,255,0.7);
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }

    .sequencer-panel.red-panel {
      --panel-accent: #e53935;
      --panel-accent-strong: #d32f2f;
      --panel-accent-soft: #fca5a5;
      --panel-accent-deep: rgba(76, 0, 0, 0.9);
      --panel-shell: rgba(255, 236, 236, 0.92);
      background: linear-gradient(145deg, rgba(255,245,245,0.97) 0%, rgba(255,233,233,0.98) 38%, rgba(255,246,247,0.98) 100%);
      box-shadow:
        inset 1px 1px 0 rgba(255,255,255,0.9),
        inset -1px -1px 0 rgba(176,182,201,0.16),
        12px 16px 24px rgba(94, 30, 30, 0.08),
        -3px -4px 8px rgba(255,255,255,0.7);
    }

    .sequencer-panel.blue-panel {
      --panel-accent: #3b82f6;
      --panel-accent-strong: #2563eb;
      --panel-accent-soft: #93c5fd;
      --panel-accent-deep: rgba(20, 61, 130, 0.9);
      --panel-shell: rgba(232, 242, 255, 0.92);
      background: linear-gradient(145deg, rgba(245,250,255,0.98) 0%, rgba(228,240,255,0.98) 38%, rgba(242,248,255,0.98) 100%);
      box-shadow:
        inset 1px 1px 0 rgba(255,255,255,0.9),
        inset -1px -1px 0 rgba(176,182,201,0.16),
        12px 16px 24px rgba(30, 64, 120, 0.08),
        -3px -4px 8px rgba(255,255,255,0.7);
    }

    .sequencer-panel.light-green-panel {
      --panel-accent: #72c98b;
      --panel-accent-strong: #4caf70;
      --panel-accent-soft: #b7e7c3;
      --panel-accent-deep: rgba(30, 91, 50, 0.9);
      --panel-shell: rgba(235, 250, 239, 0.92);
      background: linear-gradient(145deg, rgba(248,255,249,0.98) 0%, rgba(229,247,233,0.98) 38%, rgba(243,253,245,0.98) 100%);
      box-shadow:
        inset 1px 1px 0 rgba(255,255,255,0.9),
        inset -1px -1px 0 rgba(176,182,201,0.16),
        12px 16px 24px rgba(37, 99, 57, 0.08),
        -3px -4px 8px rgba(255,255,255,0.7);
    }

    .sequencer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 0 6px 18px;
      margin-bottom: 4px;
    }

    .sequencer-title {
      margin: 0 6px 16px;
      color: #263247;
      font-size: 28px;
      line-height: 1.2;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-left: auto;
    }

    .clear-button {
      border: 1px solid rgba(107, 114, 128, 0.24);
      background: rgba(255, 255, 255, 0.7);
      color: #3f475c;
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 9px 12px;
      cursor: pointer;
      transition: none;
    }

    .transport-group {
      display: flex;
      align-items: center;
      gap: 18px;
      min-width: 0;
    }

    .transport-button {
      width: 50px;
      height: 50px;
      border: none;
      border-radius: 0;
      background: linear-gradient(135deg, var(--panel-accent) 0%, var(--panel-accent-strong) 100%);
      color: #1f1b15;
      font-size: 22px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: none;
      transition: none;
    }

    .transport-button.is-playing {
      background: linear-gradient(135deg, var(--panel-accent) 0%, var(--panel-accent-strong) 100%);
    }

    .bpm-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
      min-width: 0;
    }

    .bpm-label {
      color: #484a59;
      font-size: 13px;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
    }

    .bpm-value {
      min-width: 52px;
      color: #111827;
      font-size: 15px;
      font-weight: 700;
      text-align: right;
    }

    .bpm-slider {
      width: min(220px, 45vw);
      height: 12px;
      appearance: none;
      -webkit-appearance: none;
      background: linear-gradient(90deg, var(--panel-accent-soft) 0%, var(--panel-accent) 100%);
      border-radius: 999px;
      cursor: pointer;
      outline: none;
    }

    .bpm-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--panel-accent-deep);
      background: var(--panel-accent);
      box-shadow: none;
      cursor: pointer;
    }

    .bpm-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid var(--panel-accent-deep);
      background: var(--panel-accent);
      box-shadow: none;
      cursor: pointer;
    }

    .selector-cluster {
      display: flex;
      align-items: flex-start;
      gap: 14px;
      margin-left: auto;
    }

    .selector-column {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .selector-label {
      padding-left: 2px;
      font-size: 10px;
      line-height: 1;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      color: #58657a;
      font-weight: 700;
    }

    .status-pill {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 38px;
      padding: 8px 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.8);
      border: 1px solid rgba(92, 104, 128, 0.2);
      color: #303a4f;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      white-space: nowrap;
    }

    .mode-switcher {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
    }

    .mode-button {
      padding: 7px 10px;
      border-radius: 0;
      border: 1px solid rgba(17, 24, 39, 0.08);
      background: rgba(148, 163, 184, 0.08);
      color: #3c465d;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.04em;
      cursor: pointer;
      transition: none;
    }

    .mode-button.active {
      background: linear-gradient(135deg, var(--panel-accent) 0%, var(--panel-accent-strong) 100%);
      border-color: transparent;
      color: #1d1c1d;
      box-shadow: none;
    }

    .sequencer-shell {
      position: relative;
      padding: 18px 14px 18px;
      border-radius: 20px;
      background: var(--panel-shell);
      /* 小屏时横向滚动，而不是把 32 格挤变形 */
      overflow-x: auto;
      overflow-y: hidden;
      -webkit-overflow-scrolling: touch;
      scrollbar-width: thin;
    }

    .sequencer-track {
      position: relative;
      min-width: 640px;
    }

    .sequencer-grid {
      position: relative;
      display: grid;
      gap: 4px;
      align-items: center;
      min-height: 230px;
      z-index: 1;
    }

    .sequencer-row {
      display: grid;
      grid-template-columns: 64px repeat(32, minmax(10px, 1fr));
      gap: 4px;
      align-items: center;
      min-height: 18px;
    }

    .pitch-label {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 18px;
      font-size: 11px;
      font-weight: 700;
      color: #4e586d;
      border-radius: 0;
      background: transparent;
      letter-spacing: 0.05em;
    }

    .sequencer-cell {
      width: 100%;
      height: 18px;
      border: 0;
      border-left: 1px solid transparent;
      border-radius: 0;
      background: #dfe4eb;
      box-shadow: none;
      cursor: pointer;
      transition: none;
      position: relative;
      touch-action: none;
    }

    .sequencer-cell.is-divider {
      background: #dfe4eb;
      border-left: 1px solid rgba(89, 99, 116, 0.75);
      box-shadow: none;
    }

    .sequencer-cell.active {
      background: var(--panel-accent);
      box-shadow: none;
    }

    .sequencer-cell.is-divider.active {
      background: var(--panel-accent);
      border-left: 1px solid rgba(89, 99, 116, 0.75);
      box-shadow: none;
    }

    .sequencer-cell.is-merged {
      filter: saturate(1.12) brightness(0.96);
      margin-right: -4px;
      width: calc(100% + 4px);
      z-index: 1;
    }

    .sequencer-cell.is-merged-start {
      border-radius: 4px 0 0 4px;
    }

    .sequencer-cell.is-merged-end {
      border-radius: 0 4px 4px 0;
    }

    .stop-button {
      width: 50px;
      height: 50px;
      border: 1px solid rgba(107, 114, 128, 0.3);
      border-radius: 0;
      background: rgba(255, 255, 255, 0.7);
      color: var(--panel-accent-deep);
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      flex-shrink: 0;
    }

    .stop-button:hover { filter: brightness(1.05); }

    /* 步进标尺：点击 / 拖动可以把播放线移到任意一格 */
    .sequencer-ruler {
      display: grid;
      grid-template-columns: 64px repeat(32, minmax(10px, 1fr));
      gap: 4px;
      align-items: center;
      margin-bottom: 6px;
      user-select: none;
      touch-action: none;
    }

    .ruler-label {
      font-size: 10px;
      font-weight: 700;
      color: #6b7280;
      text-align: center;
      letter-spacing: 0.05em;
    }

    .ruler-cell {
      height: 16px;
      border: 0;
      border-radius: 3px 3px 0 0;
      padding: 0;
      background: rgba(255, 255, 255, 0.55);
      color: #6b7280;
      font-size: 10px;
      line-height: 16px;
      text-align: center;
      cursor: pointer;
    }

    .ruler-cell.is-beat {
      font-weight: 700;
      color: var(--panel-accent-deep);
      background: rgba(255, 255, 255, 0.85);
    }

    .ruler-cell:hover,
    .ruler-cell.is-current {
      background: var(--panel-accent-strong);
      color: #fff;
    }

    .sequencer-hint {
      margin: 10px 6px 0;
      font-size: 12px;
      color: #6b7280;
    }

    :root[data-theme="dark"] .ruler-cell { background: rgba(255, 255, 255, 0.06); color: #8b92a6; }
    :root[data-theme="dark"] .ruler-cell.is-beat { background: rgba(255, 255, 255, 0.12); color: #e8eaf2; }
    :root[data-theme="dark"] .ruler-cell:hover,
    :root[data-theme="dark"] .ruler-cell.is-current { background: var(--panel-accent-strong); color: #fff; }
    :root[data-theme="dark"] .stop-button { background: rgba(255, 255, 255, 0.08); color: var(--panel-accent-soft); }
    :root[data-theme="dark"] .sequencer-hint,
    :root[data-theme="dark"] .ruler-label { color: #8b92a6; }

    @media (max-width: 720px) {
      /* 小屏：控制栏换行，网格区横向滚动 */
      .sequencer-panel { width: min(1200px, calc(100% - 4px)); padding: 16px 10px 14px; }
      .sequencer-header { flex-wrap: wrap; row-gap: 10px; }
      .transport-group { flex-wrap: wrap; }
      .header-actions { flex-wrap: wrap; margin-left: 0; width: 100%; }
      .selector-cluster { flex-wrap: wrap; }
      .bpm-slider { width: min(220px, 55vw); }
    }

    .sequencer-title-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin: 0 6px 16px; flex-wrap: wrap; }
    .sequencer-title-row .sequencer-title { margin: 0; }
    .track-state { font-size: 12px; color: #6b7280; padding: 4px 10px; border-radius: 999px; background: rgba(255, 255, 255, 0.6); border: 1px solid rgba(107, 114, 128, 0.18); }
    .sequencer-panel.is-armed .track-state { color: #1f9d55; border-color: rgba(31, 157, 85, 0.35); background: rgba(31, 157, 85, 0.1); }
    .sequencer-panel.is-idle-while-playing .track-state { color: #b45309; border-color: rgba(217, 119, 6, 0.35); background: rgba(217, 119, 6, 0.1); }
    .sequencer-panel.is-idle-while-playing .transport-button { animation: trackNudge 1.2s ease-in-out infinite; }
    @keyframes trackNudge { 0%, 100% { transform: none; } 50% { transform: scale(1.06); } }
    .master-state { font-size: 13px; color: #58657a; }
    .master-state.is-playing { color: #1f9d55; font-weight: 700; }
    .sequencer-panel.is-armed { box-shadow: inset 0 0 0 2px rgba(31, 157, 85, 0.35), 14px 18px 28px rgba(39, 49, 75, 0.08); }
    :root[data-theme="dark"] .track-state { background: rgba(255, 255, 255, 0.06); color: #8b92a6; border-color: rgba(255, 255, 255, 0.12); }
    :root[data-theme="dark"] .master-state { color: #8b92a6; }

    /* 顶部总控 */
    .master-bar {
      --panel-accent: #4141f3;
      --panel-accent-strong: #5252ff;
      --panel-accent-soft: #b9c2ff;
      --panel-accent-deep: rgba(24, 24, 96, 0.9);
      width: min(1200px, calc(100% - 30px));
      margin: 0 auto 8px;
      padding: 20px 22px;
      border-radius: 22px;
      border: 1px solid rgba(65, 65, 243, 0.16);
      background: linear-gradient(135deg, rgba(65, 65, 243, 0.07), rgba(124, 198, 255, 0.08) 60%, rgba(255,255,255,0) 100%), rgba(255, 255, 255, 0.9);
      box-shadow: 0 12px 30px rgba(36, 43, 58, 0.08);
      color: #263247;
      opacity: 1 !important;
      transform: none !important;
      animation: none !important;
    }
    .master-title h1 { margin: 0 0 4px; font-size: 28px; }
    .master-title p { margin: 0 0 14px; font-size: 14px; color: #58657a; }
    .master-controls { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .master-button {
      min-height: 42px;
      padding: 0 18px;
      border: none;
      border-radius: 10px;
      background: #4141f3;
      color: #fff;
      font: inherit;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 10px 18px rgba(65, 65, 243, 0.25);
      transition: transform 0.15s ease, filter 0.15s ease;
    }
    .master-button:hover { transform: translateY(-1px); filter: brightness(1.06); }
    .master-button.is-playing { background: #1f9d55; box-shadow: 0 10px 18px rgba(31, 157, 85, 0.25); }
    .master-button.secondary { background: rgba(255, 255, 255, 0.8); color: #3f475c; border: 1px solid rgba(107, 114, 128, 0.28); box-shadow: none; }
    .master-bpm { display: flex; align-items: center; gap: 10px; }
    .master-saved { margin-left: auto; font-size: 12px; color: #6b7280; }
    :root[data-theme="dark"] .master-bar { background: linear-gradient(145deg, #1c2133 0%, #181c2c 60%, #161a29 100%); border-color: rgba(124, 140, 255, 0.3); color: #e8eaf2; }
    :root[data-theme="dark"] .master-title p, :root[data-theme="dark"] .master-saved { color: #8b92a6; }
    :root[data-theme="dark"] .master-button.secondary { background: rgba(255, 255, 255, 0.08); color: #b6bccd; border-color: rgba(255, 255, 255, 0.16); }
    @media (max-width: 720px) { .master-saved { margin-left: 0; width: 100%; } }

    .playhead-line {
      position: absolute;
      top: 10px;
      bottom: 10px;
      width: 2px;
      border-radius: 10px;
      background: var(--panel-accent);
      box-shadow: none;
      pointer-events: none;
      z-index: 2;
      display: none;
      will-change: transform;
      transform: translate3d(0, 0, 0);
    }

    @media (max-width: 720px) {
      .mode-switcher {
        width: 100%;
        justify-content: flex-start;
      }

      /* 原来误写在 .sequencer-grid 上，会把所有行压成一行；列定义属于每一行 */
      .sequencer-row,
      .sequencer-ruler {
        grid-template-columns: 58px repeat(32, minmax(12px, 1fr));
        gap: 6px;
      }

      .pitch-label {
        font-size: 10px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  `;
  document.head.appendChild(styles);

  /* ====================================================================
   * 逻辑部分
   *  - 四个音轨共用一个主时钟（js/audio-engine.js），同一 BPM、同一播放线，
   *    任一面板按 ▶ 就加入正在播放的时钟，可随时单独退出；顶部总控可一键全部播放。
   *  - 节奏轨用鼓采样，和弦 / 贝斯 / 旋律轨用钢琴采样（audio/piano），
   *    升号音用等音的降号采样，缺少的高八度自动降一个八度。
   *  - 创作内容按账号（未登录按访客）自动保存到 localStorage，刷新后恢复。
   * ==================================================================== */
  const AUDIO = window.MusicLabAudio;
  const ML = window.MusicLab;
  const steps = 32;
  const dividerStepIndexes = new Set([8, 16, 24]);
  const modeIntervals = {
    Ionian: [0, 2, 4, 5, 7, 9, 11],
    Dorian: [0, 2, 3, 5, 7, 9, 10],
    Phrygian: [0, 1, 3, 5, 7, 8, 10],
    Lydian: [0, 2, 4, 6, 7, 9, 11],
    Mixolydian: [0, 2, 4, 5, 7, 9, 10],
    Aeolian: [0, 2, 3, 5, 7, 8, 10],
    Locrian: [0, 1, 3, 5, 6, 8, 10]
  };

  const pitchClasses = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const letterSequence = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];

  const getScaleNotes = (keyName = 'C', modeName = 'Ionian') => {
    const rootPitch = pitchClasses[keyName] ?? pitchClasses.C;
    const intervals = modeIntervals[modeName] || modeIntervals.Ionian;
    const scale = [];

    for (let degree = 0; degree < 7; degree += 1) {
      const targetPitchClass = (rootPitch + intervals[degree]) % 12;
      const letter = letterSequence[(letterSequence.indexOf(keyName) + degree) % letterSequence.length];
      const naturalPitch = pitchClasses[letter] ?? 0;
      const diff = ((targetPitchClass - naturalPitch) % 12 + 12) % 12;

      let accidental = '';
      if (diff === 1) accidental = '#';
      if (diff === 11) accidental = 'b';
      if (diff === 2) accidental = '##';
      if (diff === 10) accidental = 'bb';

      scale.push(`${letter}${accidental}`);
    }

    return scale;
  };

  // 显示用：从高到低 15 行 = 两个八度 + 根音
  const getModePitchNames = (keyName = 'C', modeName = 'Ionian') => {
    const scale = getScaleNotes(keyName, modeName);
    const displayScale = [...scale, ...scale, scale[0]];
    return displayScale.slice(0, 15).reverse();
  };

  /* ---------- 音名 → 钢琴采样（audio/piano 只有 C3–C5，且升号以降号命名） ---------- */
  const SAMPLE_NAMES = new Set(['A3', 'A4', 'Ab3', 'Ab4', 'B3', 'B4', 'Bb3', 'Bb4', 'C3', 'C4', 'C5', 'D3', 'D4', 'Db3', 'Db4', 'E3', 'E4', 'Eb3', 'Eb4', 'F3', 'F4', 'G3', 'G4', 'Gb3', 'Gb4']);
  const NOTE_NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const noteToMidi = (name, octave) => {
    const letter = name[0];
    const acc = name.slice(1);
    let pc = pitchClasses[letter];
    if (acc === '#') pc += 1; else if (acc === '##') pc += 2; else if (acc === 'b') pc -= 1; else if (acc === 'bb') pc -= 2;
    return 12 * (octave + 1) + pc;
  };
  const midiToSample = (midi) => {
    let m = midi;
    // 超出采样范围时按八度折回
    while (m > 72) m -= 12;   // C5 = 72
    while (m < 48) m += 12;   // C3 = 48
    const name = `${NOTE_NAMES_FLAT[m % 12]}${Math.floor(m / 12) - 1}`;
    return SAMPLE_NAMES.has(name) ? `../audio/piano/piano-${name}.wav` : null;
  };
  // 每一行对应的采样：行 0 在最上面（最高音）。baseOctave 是最底行根音的八度。
  const rowSamples = (keyName, modeName, baseOctave) => {
    const scale = getScaleNotes(keyName, modeName);
    const rootMidi = noteToMidi(keyName, baseOctave);
    const intervals = modeIntervals[modeName] || modeIntervals.Ionian;
    const ascending = [];
    for (let i = 0; i < 15; i += 1) {
      const degree = i % 7;
      const octaveShift = Math.floor(i / 7);
      const midi = rootMidi + intervals[degree] + 12 * octaveShift;
      ascending.push(midiToSample(midi));
    }
    void scale;
    return ascending.reverse();
  };

  const drumTracks = [
    ['Kick', '../audio/kick.wav'],
    ['Snare', '../audio/snare.wav'],
    ['Open-Hat', '../audio/open-hat.wav'],
    ['Closed-Hat', '../audio/closed-hat.wav'],
    ['Tom', '../audio/Tom.wav'],
    ['Crash', '../audio/crash.wav'],
    ['Ride', '../audio/ride.wav'],
    ['Clap', '../audio/clap.wav']
  ];

  /* ---------- 持久化 ---------- */
  const STORE_KEY = 'musiclab_playground';
  const storeKey = () => {
    const user = ML && ML.auth.currentUser();
    return user ? `${STORE_KEY}::user:${user.toLowerCase()}` : STORE_KEY;
  };
  const readStore = () => { try { return JSON.parse(localStorage.getItem(storeKey()) || 'null'); } catch (_) { return null; } };
  let saveTimer = null;
  const panels = [];
  const master = { bpm: 60, clock: null };
  const saveNow = () => {
    clearTimeout(saveTimer);
    saveTimer = null;
    const data = { bpm: master.bpm, savedAt: new Date().toISOString(), panels: {} };
    panels.forEach((p) => { data.panels[p.id] = p.serialize(); });
    try { localStorage.setItem(storeKey(), JSON.stringify(data)); } catch (_) { /* ignore */ }
    const badge = document.getElementById('masterSaved');
    if (badge) badge.textContent = `已自动保存 ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`;
  };
  const saveSoon = () => { clearTimeout(saveTimer); saveTimer = setTimeout(saveNow, 400); };

  /* ---------- 主时钟 ---------- */
  master.clock = AUDIO.createClock({
    bpm: master.bpm,
    steps,
    onStep: (step, time) => panels.forEach((p) => p.onStep(step, time))
  });

  const anyArmed = () => panels.some((p) => p.armed);
  const syncMaster = () => {
    if (anyArmed()) { if (!master.clock.playing) master.clock.start(); }
    else if (master.clock.playing) master.clock.pause();
    updateMasterBar();
  };
  const setMasterBpm = (value) => {
    master.bpm = Math.max(40, Math.min(240, Number(value) || 60));
    master.clock.setBpm(master.bpm);
    panels.forEach((p) => p.reflectBpm());
    const slider = document.getElementById('masterBpm');
    const label = document.getElementById('masterBpmValue');
    if (slider && Number(slider.value) !== master.bpm) slider.value = String(master.bpm);
    if (label) label.textContent = String(master.bpm);
    saveSoon();
  };

  // 播放线：一个 rAF 驱动所有面板（只在播放中运行）
  let rafId = null;
  const paint = () => {
    if (!master.clock.playing) { rafId = null; return; }
    const pos = master.clock.position();
    // 只有正在播的音轨才更新播放线，暂停的轨停在它自己暂停时的位置
    panels.forEach((p) => { if (p.armed) p.paint(pos); });
    rafId = requestAnimationFrame(paint);
  };
  const ensurePaint = () => { if (!rafId && master.clock.playing) rafId = requestAnimationFrame(paint); };

  /* ---------- 顶部总控 ---------- */
  const buildMasterBar = () => {
    const bar = document.createElement('section');
    bar.className = 'master-bar';
    bar.setAttribute('aria-label', '总控');
    bar.innerHTML = `
      <div class="master-title">
        <h1>游乐园</h1>
        <p>每个音轨各自用面板上的 ▶ 播放 / 暂停；同时播放的音轨共用一个节拍器，始终对齐不会跑偏。</p>
      </div>
      <div class="master-controls">
        <button type="button" class="master-button secondary" id="masterStop" aria-label="全部停止并回到开头">■ 回到开头</button>
        <span class="master-state" id="masterState" aria-live="polite">未播放</span>
        <div class="master-bpm">
          <span class="bpm-label">BPM</span>
          <span class="bpm-value" id="masterBpmValue">60</span>
          <input class="bpm-slider" id="masterBpm" type="range" min="40" max="240" step="1" value="60" aria-label="总 BPM">
        </div>
        <button type="button" class="master-button secondary" id="masterClear">清空全部</button>
        <span class="master-saved" id="masterSaved" aria-live="polite"></span>
      </div>`;
    box.appendChild(bar);

    bar.querySelector('#masterStop').addEventListener('click', () => {
      panels.forEach((p) => { p.setArmed(false); p.resetPosition(); });
      master.clock.stop();
      panels.forEach((p) => p.paint(0, true));
      updateMasterBar();
    });
    bar.querySelector('#masterBpm').addEventListener('input', (e) => setMasterBpm(e.target.value));
    bar.querySelector('#masterClear').addEventListener('click', async () => {
      const ok = ML && ML.confirm ? await ML.confirm('会清空四个音轨里所有点亮的方块。', { title: '清空全部？', confirmText: '清空', danger: true }) : window.confirm('清空全部？');
      if (!ok) return;
      panels.forEach((p) => p.clear());
      saveSoon();
    });
  };

  const updateMasterBar = () => {
    const stateEl = document.getElementById('masterState');
    const playing = master.clock.playing;
    const armedCount = panels.filter((p) => p.armed).length;
    if (stateEl) {
      const names = panels.filter((p) => p.armed).map((p) => p.title).join(' + ');
      stateEl.textContent = playing
        ? `播放中：${names}（${armedCount} / ${panels.length} 轨同步）`
        : (master.clock.currentStep() > 0 ? `已暂停在第 ${master.clock.currentStep() + 1} 格` : '未播放 · 在任意音轨按 ▶ 开始');
      stateEl.classList.toggle('is-playing', playing);
    }
    panels.forEach((p) => p.reflectState());
    ensurePaint();
  };

  /* ---------- 面板 ---------- */
  const createTrackPanel = ({ allowScaleControls = true, theme = 'yellow', title = '', id, baseOctave = 3 } = {}) => {
    const panel = document.createElement('section');
    panel.className = `sequencer-panel${theme === 'yellow' ? '' : ` ${theme}-panel`}`;
    panel.innerHTML = `
      <div class="sequencer-title-row">
        <h1 class="sequencer-title">${title}</h1>
        <span class="track-state" aria-live="polite">未播放</span>
      </div>
      <div class="sequencer-header">
        <div class="transport-group">
          <button class="transport-button" type="button" aria-label="播放 / 暂停本轨" title="播放 / 暂停本轨（与其他轨同步）">▶</button>
          <button class="stop-button" type="button" aria-label="停止本轨并让全部回到开头" title="停止本轨，并把播放位置回到开头">■</button>
          <div class="bpm-wrap">
            <span class="bpm-label">BPM</span>
            <span class="bpm-value">60</span>
            <input class="bpm-slider" type="range" min="40" max="240" step="1" value="60" aria-label="BPM调节器（四轨同步）" />
          </div>
        </div>
        <div class="header-actions">
          ${allowScaleControls ? `
            <div class="selector-cluster">
              <div class="selector-column">
                <div class="selector-label">Key</div>
                <div class="mode-switcher" aria-label="音名调切换">
                  ${['C', 'D', 'E', 'F', 'G', 'A', 'B'].map((k) => `<button class="mode-button${k === 'C' ? ' active' : ''}" type="button" data-key="${k}">${k}</button>`).join('')}
                </div>
              </div>
              <div class="selector-column">
                <div class="selector-label">Mode</div>
                <div class="mode-switcher" aria-label="自然调式切换">
                  ${Object.keys(modeIntervals).map((m) => `<button class="mode-button${m === 'Ionian' ? ' active' : ''}" type="button" data-mode="${m}">${m}</button>`).join('')}
                </div>
              </div>
              <div class="status-pill">C / Ionian</div>
            </div>
          ` : ''}
          <button class="clear-button" type="button" aria-label="清空全部交互块">Clear</button>
        </div>
      </div>

      <div class="sequencer-shell">
        <!-- .sequencer-track 是横向滚动的内容区，播放线随它一起滚动 -->
        <div class="sequencer-track">
          <div class="sequencer-ruler" aria-label="播放位置标尺：点击或拖动可移动播放线"></div>
          <div class="sequencer-grid"></div>
          <div class="playhead-line"></div>
        </div>
      </div>
      <p class="sequencer-hint">提示：❚❚ 暂停会停在原地，■ 回到开头；点击 / 拖动上方标尺可把播放线移到任意一格，播放中也可以随时增删方块。和弦轨长按同一行拖动，可合并连续网格。</p>
    `;

    const grid = panel.querySelector('.sequencer-grid');
    const playheadLine = panel.querySelector('.playhead-line');
    const bpmDisplay = panel.querySelector('.bpm-value');
    const bpmSlider = panel.querySelector('.bpm-slider');
    const transportButton = panel.querySelector('.transport-button');
    const trackState = panel.querySelector('.track-state');
    const stopButton = panel.querySelector('.stop-button');
    const ruler = panel.querySelector('.sequencer-ruler');
    const clearButton = panel.querySelector('.clear-button');
    const statusPill = panel.querySelector('.status-pill');
    const keyButtons = [...panel.querySelectorAll('[data-key]')];
    const modeButtons = [...panel.querySelectorAll('[data-mode]')];

    const state = {
      key: 'C',
      mode: 'Ionian',
      playheadStartX: 0,
      playheadTravelWidth: 1,
      lastPaintedStep: -1,
      pausedStep: 0        // 本轨暂停时停在哪一格（各轨独立）
    };

    const cellMatrix = [];
    const rowCount = theme === 'red' ? drumTracks.length : 15;
    const canMergeCells = id === 'chords';
    const blockLengths = new Map();
    const drumLabels = drumTracks.map(([label]) => label);
    let samples = theme === 'red' ? drumTracks.map(([, src]) => src) : rowSamples(state.key, state.mode, baseOctave);
    AUDIO.load(samples.filter(Boolean));
    const gain = theme === 'red' ? 1 : theme === 'yellow' ? 0.55 : theme === 'light-green' ? 0.9 : 0.8;

    const api = { id, armed: false };

    const updateStatus = () => { if (statusPill) statusPill.textContent = `${state.key} / ${state.mode}`; };

    const blockKey = (rowIndex, step) => `${rowIndex}:${step}`;
    const clearRowBlocks = (rowIndex) => {
      [...blockLengths].forEach(([key, length]) => {
        if (!key.startsWith(`${rowIndex}:`)) return;
        const startStep = Number(key.split(':')[1]);
        for (let step = startStep; step < startStep + length; step += 1) {
          const cell = cellMatrix[rowIndex]?.[step];
          if (cell) {
            cell.classList.remove('active');
            cell.setAttribute('aria-pressed', 'false');
          }
        }
        blockLengths.delete(key);
      });
      cellMatrix[rowIndex]?.forEach((cell) => cell.classList.remove('is-merged', 'is-merged-start', 'is-merged-end'));
    };
    const paintBlock = (rowIndex, startStep, length) => {
      const endStep = Math.min(steps - 1, startStep + length - 1);
      blockLengths.set(blockKey(rowIndex, startStep), endStep - startStep + 1);
      for (let step = startStep; step <= endStep; step += 1) {
        const cell = cellMatrix[rowIndex]?.[step];
        if (!cell) continue;
        cell.classList.add('active', 'is-merged');
        cell.setAttribute('aria-pressed', 'true');
        cell.classList.toggle('is-merged-start', step === startStep);
        cell.classList.toggle('is-merged-end', step === endStep);
      }
    };
    const applyBlocks = (blocks) => {
      (blocks || []).forEach(([rowIndex, startStep, length]) => {
        if (canMergeCells && Number.isInteger(length) && length > 1) paintBlock(rowIndex, startStep, length);
      });
    };

    const renderGrid = (keepActive = false) => {
      const previous = keepActive ? api.serialize() : null;
      grid.innerHTML = '';
      cellMatrix.length = 0;
      const pitchNames = allowScaleControls ? getModePitchNames(state.key, state.mode) : drumLabels;

      for (let rowIndex = 0; rowIndex < Math.min(rowCount, pitchNames.length); rowIndex += 1) {
        const rowButtons = [];
        const row = document.createElement('div');
        row.className = 'sequencer-row';
        const label = document.createElement('div');
        label.className = 'pitch-label';
        label.textContent = pitchNames[rowIndex];
        row.appendChild(label);

        for (let step = 0; step < steps; step += 1) {
          const cell = document.createElement('button');
          cell.type = 'button';
          cell.className = 'sequencer-cell';
          if (dividerStepIndexes.has(step)) cell.classList.add('is-divider');
          cell.dataset.row = String(rowIndex);
          cell.dataset.step = String(step);
          cell.setAttribute('aria-label', `${pitchNames[rowIndex]} step ${step + 1}`);
          cell.setAttribute('aria-pressed', 'false');
          cell.addEventListener('click', () => {
            if (skipCellClickUntil > performance.now()) return;
            clearRowBlocks(rowIndex);
            const isActive = cell.classList.toggle('active');
            cell.setAttribute('aria-pressed', String(isActive));
            if (isActive && !api.armed) previewRow(rowIndex);
            saveSoon();
          });
          if (canMergeCells) {
            cell.addEventListener('pointerdown', beginCellDrag);
            cell.addEventListener('pointermove', updateCellDrag);
            cell.addEventListener('pointerup', finishCellDrag);
            cell.addEventListener('pointercancel', cancelCellDrag);
          }
          rowButtons.push(cell);
          row.appendChild(cell);
        }
        grid.appendChild(row);
        cellMatrix.push(rowButtons);
      }
      if (previous) { applyCells(previous.cells); applyBlocks(previous.blocks); }
    };

    const applyCells = (cells) => {
      (cells || []).forEach(([r, s]) => {
        const cell = cellMatrix[r]?.[s];
        if (cell) { cell.classList.add('active'); cell.setAttribute('aria-pressed', 'true'); }
      });
    };

    let skipCellClickUntil = 0;
    let cellDrag = null;
    const beginCellDrag = (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      const cell = event.currentTarget;
      cellDrag = { pointerId: event.pointerId, rowIndex: Number(cell.dataset.row), startStep: Number(cell.dataset.step), endStep: Number(cell.dataset.step), startedAt: performance.now(), moved: false };
      try { cell.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
    };
    const stepAtPointer = (rowIndex, clientX) => {
      const row = cellMatrix[rowIndex] || [];
      let nearestStep = 0;
      let nearestDistance = Infinity;
      row.forEach((cell, step) => {
        const rect = cell.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
          nearestStep = step;
          nearestDistance = 0;
          return;
        }
        const distance = clientX < rect.left ? rect.left - clientX : clientX - rect.right;
        if (distance < nearestDistance) {
          nearestStep = step;
          nearestDistance = distance;
        }
      });
      return nearestStep;
    };
    const updateCellDrag = (event) => {
      if (!cellDrag || cellDrag.pointerId !== event.pointerId) return;
      const rowIndex = cellDrag.rowIndex;
      const row = cellMatrix[rowIndex] || [];
      const rowRect = row[0]?.parentElement?.getBoundingClientRect();
      if (!rowRect || event.clientY < rowRect.top || event.clientY > rowRect.bottom) return;
      const step = stepAtPointer(rowIndex, event.clientX);
      if (step === cellDrag.startStep || performance.now() - cellDrag.startedAt < 220) return;
      cellDrag.moved = true;
      cellDrag.endStep = step;
      const startStep = Math.min(cellDrag.startStep, step);
      const length = Math.abs(cellDrag.startStep - step) + 1;
      clearRowBlocks(rowIndex);
      paintBlock(rowIndex, startStep, length);
    };
    const finishCellDrag = (event) => {
      if (!cellDrag || cellDrag.pointerId !== event.pointerId) return;
      if (cellDrag.moved) {
        skipCellClickUntil = performance.now() + 100;
        saveSoon();
        event.preventDefault();
      }
      cellDrag = null;
    };
    const cancelCellDrag = () => { cellDrag = null; };

    const blockAt = (rowIndex, step) => {
      for (const [key, length] of blockLengths) {
        const [blockRow, blockStart] = key.split(':').map(Number);
        if (blockRow === rowIndex && step >= blockStart && step < blockStart + length) return { start: blockStart, length };
      }
      return null;
    };

    const previewRow = (rowIndex) => {
      AUDIO.unlock();
      const src = samples[rowIndex];
      if (src) AUDIO.play(src, { gain, ...(theme === 'red' ? {} : { duration: 15 / master.bpm }) });
    };

    api.onStep = (step, time) => {
      if (!api.armed) return;
      cellMatrix.forEach((row, rowIndex) => {
        const block = blockAt(rowIndex, step);
        if (block && block.start !== step) return;
        if (row[step]?.classList.contains('active') && samples[rowIndex]) {
          const duration = theme === 'red' ? undefined : (block?.length || 1) * (15 / master.bpm);
          AUDIO.play(samples[rowIndex], { at: time, gain, ...(duration ? { duration } : {}) });
        }
      });
    };

    const rulerCells = [];
    const renderRuler = () => {
      ruler.innerHTML = '';
      rulerCells.length = 0;
      const label = document.createElement('div');
      label.className = 'ruler-label';
      label.textContent = '拍';
      ruler.appendChild(label);
      for (let step = 0; step < steps; step += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = `ruler-cell${step % 4 === 0 ? ' is-beat' : ''}`;
        cell.dataset.step = String(step);
        cell.textContent = step % 4 === 0 ? String(step / 4 + 1) : '·';
        cell.setAttribute('aria-label', `跳到第 ${step + 1} 格`);
        ruler.appendChild(cell);
        rulerCells.push(cell);
      }
    };

    const measureGridGeometry = () => {
      const trackRect = panel.querySelector('.sequencer-track').getBoundingClientRect();
      const firstRow = grid.querySelector('.sequencer-row');
      const cells = firstRow ? firstRow.querySelectorAll('.sequencer-cell') : [];
      const firstCell = cells[0];
      const lastCell = cells[steps - 1];
      if (!firstCell || !lastCell) { state.playheadStartX = 0; state.playheadTravelWidth = 1; return; }
      state.playheadStartX = firstCell.getBoundingClientRect().left - trackRect.left;
      state.playheadTravelWidth = Math.max(lastCell.getBoundingClientRect().right - trackRect.left - state.playheadStartX, 1);
    };

    // 画播放线；force 用于停止后归零
    api.paint = (position, force = false) => {
      if (force) playheadLine.style.display = master.clock.playing || anyArmed() ? 'block' : 'none';
      const clamped = Math.min(Math.max(position, 0), steps - 0.0001);
      playheadLine.style.left = `${state.playheadStartX}px`;
      playheadLine.style.transform = `translate3d(${(clamped / steps) * state.playheadTravelWidth}px, 0, 0)`;
      const step = Math.floor(clamped);
      if (step !== state.lastPaintedStep) {
        state.lastPaintedStep = step;
        rulerCells.forEach((cell, index) => cell.classList.toggle('is-current', index === step));
      }
    };

    const seekToStep = (step) => {
      master.clock.seek(step);
      panels.forEach((p) => p.paint(master.clock.position()));
      panels.forEach((p) => { p.showPlayhead(); });
    };
    api.showPlayhead = () => { playheadLine.style.display = 'block'; };

    const stepFromPointer = (clientX) => {
      const first = rulerCells[0]?.getBoundingClientRect();
      const last = rulerCells[rulerCells.length - 1]?.getBoundingClientRect();
      if (!first || !last) return 0;
      const ratio = (clientX - first.left) / Math.max(last.right - first.left, 1);
      return Math.min(steps - 1, Math.max(0, Math.floor(ratio * steps)));
    };
    let scrubbing = false;
    ruler.addEventListener('pointerdown', (event) => {
      if (event.button !== 0 && event.pointerType === 'mouse') return;
      scrubbing = true;
      try { ruler.setPointerCapture(event.pointerId); } catch (_) { /* ignore */ }
      seekToStep(stepFromPointer(event.clientX));
    });
    ruler.addEventListener('pointermove', (event) => {
      if (!scrubbing) return;
      const step = stepFromPointer(event.clientX);
      if (step !== master.clock.currentStep()) seekToStep(step);
    });
    const endScrub = () => { scrubbing = false; };
    ruler.addEventListener('pointerup', endScrub);
    ruler.addEventListener('pointercancel', endScrub);
    ruler.addEventListener('keydown', (event) => {
      if (!event.target.matches('.ruler-cell')) return;
      if (event.key === 'ArrowRight') { event.preventDefault(); seekToStep(master.clock.currentStep() + 1); rulerCells[master.clock.currentStep()]?.focus(); }
      if (event.key === 'ArrowLeft') { event.preventDefault(); seekToStep(master.clock.currentStep() - 1); rulerCells[master.clock.currentStep()]?.focus(); }
    });

    api.setArmed = (on) => {
      if (api.armed === on) { api.reflectState(); return; }
      api.armed = on;
      transportButton.classList.toggle('is-playing', on);
      transportButton.textContent = on ? '❚❚' : '▶';
      if (on) {
        // 加入正在走的节拍器：从共享位置继续，立刻和其他轨对齐
        measureGridGeometry();
        playheadLine.style.display = 'block';
        api.paint(master.clock.playing ? master.clock.position() : state.pausedStep);
      } else {
        // 暂停只停这一轨：记下自己的位置，播放线停在原地
        state.pausedStep = master.clock.playing ? Math.floor(master.clock.position()) : state.pausedStep;
        api.paint(state.pausedStep);
      }
    };

    // 面板上的状态文字：本轨是否在播、其他轨是否在播
    api.reflectState = () => {
      const othersPlaying = master.clock.playing && !api.armed;
      panel.classList.toggle('is-armed', api.armed);
      panel.classList.toggle('is-idle-while-playing', othersPlaying);
      transportButton.setAttribute('title', api.armed ? `暂停「${title}」（其他音轨不受影响）` : `播放「${title}」`);
      trackState.textContent = api.armed ? '● 播放中'
        : othersPlaying ? '已暂停 · 其他轨仍在播，按 ▶ 可同步加入'
        : state.pausedStep > 0 ? `已暂停在第 ${state.pausedStep + 1} 格` : '未播放';
    };

    // ▶ / ❚❚ 只影响本轨：加入 / 退出正在走的共享节拍器，其他轨照常播放
    transportButton.addEventListener('click', () => { api.setArmed(!api.armed); syncMaster(); });
    // ■ 停止本轨并把它的播放线归零；其他轨不受影响
    stopButton.addEventListener('click', () => {
      api.setArmed(false);
      state.pausedStep = 0;
      api.paint(0, !anyArmed());
      syncMaster();
    });

    api.reflectBpm = () => { bpmDisplay.textContent = String(master.bpm); if (Number(bpmSlider.value) !== master.bpm) bpmSlider.value = String(master.bpm); };
    bpmSlider.addEventListener('input', (event) => setMasterBpm(event.target.value));

    api.resetPosition = () => { state.pausedStep = 0; };

    api.clear = () => {
      blockLengths.clear();
      cellMatrix.forEach((row) => row.forEach((cell) => { cell.classList.remove('active'); cell.setAttribute('aria-pressed', 'false'); }));
      cellMatrix.forEach((row) => row.forEach((cell) => cell.classList.remove('is-merged', 'is-merged-start', 'is-merged-end')));
    };
    clearButton.addEventListener('click', () => { api.clear(); saveSoon(); });

    const setScale = (key, mode) => {
      state.key = key || state.key;
      state.mode = mode || state.mode;
      keyButtons.forEach((b) => b.classList.toggle('active', b.dataset.key === state.key));
      modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
      samples = rowSamples(state.key, state.mode, baseOctave);
      AUDIO.load(samples.filter(Boolean));
      renderGrid(true);   // 换调式时保留已点亮的位置（音高随行变化）
      updateStatus();
      measureGridGeometry();
      saveSoon();
    };
    keyButtons.forEach((b) => b.addEventListener('click', () => setScale(b.dataset.key, null)));
    modeButtons.forEach((b) => b.addEventListener('click', () => setScale(null, b.dataset.mode)));

    api.serialize = () => {
      const cells = [];
      cellMatrix.forEach((row, r) => row.forEach((cell, s) => { if (cell.classList.contains('active')) cells.push([r, s]); }));
      const blocks = [...blockLengths].map(([key, length]) => { const [row, start] = key.split(':').map(Number); return [row, start, length]; });
      return { key: state.key, mode: state.mode, cells, blocks };
    };
    api.restore = (data) => {
      if (!data) return;
      if (allowScaleControls && (data.key || data.mode)) {
        state.key = data.key || 'C';
        state.mode = data.mode || 'Ionian';
        keyButtons.forEach((b) => b.classList.toggle('active', b.dataset.key === state.key));
        modeButtons.forEach((b) => b.classList.toggle('active', b.dataset.mode === state.mode));
        samples = rowSamples(state.key, state.mode, baseOctave);
        AUDIO.load(samples.filter(Boolean));
        renderGrid(false);
        updateStatus();
      }
      applyCells(data.cells);
      applyBlocks(data.blocks);
    };

    renderRuler();
    renderGrid();
    updateStatus();
    api.reflectBpm();
    measureGridGeometry();
    // 窗口尺寸变化时重新测量；暂停的轨要停在自己的位置，不能跟到共享位置上去
    window.addEventListener('resize', () => {
      measureGridGeometry();
      api.paint(api.armed && master.clock.playing ? master.clock.position() : state.pausedStep);
    });

    api.element = panel;
    api.title = title;
    return api;
  };

  /* ---------- 组装 ---------- */
  buildMasterBar();
  [
    { id: 'rhythm', allowScaleControls: false, theme: 'red', title: '节奏' },
    { id: 'chords', allowScaleControls: true, theme: 'yellow', title: '和弦', baseOctave: 3 },
    { id: 'bass', allowScaleControls: true, theme: 'light-green', title: '贝斯', baseOctave: 3 },
    { id: 'melody', allowScaleControls: true, theme: 'blue', title: '旋律', baseOctave: 3 }
  ].forEach((cfg) => {
    const p = createTrackPanel(cfg);
    panels.push(p);
    box.appendChild(p.element);
  });
  panels.forEach((p) => p.paint(0, true));

  // 恢复上次的创作
  const restoreAll = () => {
    const saved = readStore();
    if (!saved) return false;
    if (saved.bpm) setMasterBpm(saved.bpm);
    panels.forEach((p) => p.restore(saved.panels && saved.panels[p.id]));
    panels.forEach((p) => p.paint(0, true));
    return true;
  };
  if (restoreAll() && ML && ML.toast) {
    ML.toast('已恢复你上次的创作', { type: 'info', duration: 2500 });
  }
  // 登录 / 退出后切换到对应账号的存档；账号没有存档时把当前内容带过去
  window.addEventListener('musiclab:auth', () => {
    if (!readStore()) { saveSoon(); return; }
    panels.forEach((p) => p.setArmed(false));
    master.clock.stop();
    panels.forEach((p) => { p.clear(); });
    restoreAll();
    updateMasterBar();
  });
  window.addEventListener('beforeunload', () => { if (saveTimer) saveNow(); });
})();
