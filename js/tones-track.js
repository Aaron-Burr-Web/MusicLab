/* 调式章节末尾的调式音轨：调名、调式和节奏共享同一拍点。 */
(() => {
  'use strict';

  const audio = window.MusicLabAudio;
  const trackLab = document.querySelector('[data-mode-track]');
  if (!audio || !trackLab) return;

  const STEPS = 16;
  const modes = {
    Ionian: [0, 2, 4, 5, 7, 9, 11],
    Dorian: [0, 2, 3, 5, 7, 9, 10],
    Phrygian: [0, 1, 3, 5, 7, 8, 10],
    Lydian: [0, 2, 4, 6, 7, 9, 11],
    Mixolydian: [0, 2, 4, 5, 7, 9, 10],
    Aeolian: [0, 2, 3, 5, 7, 8, 10],
    Locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  const pitchClasses = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const sampleNames = new Set(['A3', 'A4', 'Ab3', 'Ab4', 'B3', 'B4', 'Bb3', 'Bb4', 'C3', 'C4', 'C5', 'D3', 'D4', 'Db3', 'Db4', 'E3', 'E4', 'Eb3', 'Eb4', 'F3', 'F4', 'G3', 'G4', 'Gb3', 'Gb4']);
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const state = { key: 'C', mode: 'Ionian', bpm: 96, pattern: Array.from({ length: 15 }, () => new Set()), playing: false };
  const transport = { clock: null, listeners: [], bpmListeners: [] };

  const noteToMidi = (name, octave) => 12 * (octave + 1) + (pitchClasses[name] ?? 0);
  const sampleForMidi = (midi) => {
    let value = midi;
    while (value > 72) value -= 12;
    while (value < 48) value += 12;
    const name = `${flatNames[value % 12]}${Math.floor(value / 12) - 1}`;
    return sampleNames.has(name) ? `../audio/piano/sources/source-piano-${name}.wav` : null;
  };
  const scaleNotes = () => {
    const root = pitchClasses[state.key];
    const intervals = modes[state.mode];
    return Array.from({ length: 7 }, (_, degree) => {
      const target = (root + intervals[degree]) % 12;
      const letter = letters[(letters.indexOf(state.key) + degree) % letters.length];
      const natural = pitchClasses[letter];
      const difference = (target - natural + 12) % 12;
      const accidental = difference === 1 ? '#' : difference === 11 ? 'b' : '';
      return `${letter}${accidental}`;
    });
  };
  const rows = () => {
    const scale = scaleNotes();
    const intervals = modes[state.mode];
    const rootMidi = noteToMidi(state.key, 3);
    return Array.from({ length: 15 }, (_, index) => {
      const degree = index % 7;
      const midi = rootMidi + intervals[degree] + 12 * Math.floor(index / 7);
      return { label: scale[degree], src: sampleForMidi(midi) };
    }).reverse();
  };

  const render = () => {
    const currentRows = rows();
    audio.load(currentRows.map((row) => row.src).filter(Boolean));
    trackLab.innerHTML = `<section class="chord-sequencer-panel is-chords"><div class="chord-sequencer-title-row"><h3>调式音轨 · ${state.key} ${state.mode}</h3></div><div class="chord-sequencer-header"><div class="chord-transport-group"><button class="chord-transport-button" type="button" data-mode-play aria-label="播放或暂停调式音轨">${state.playing ? '❚❚' : '▶'}</button><button class="chord-stop-button" type="button" data-mode-stop aria-label="停止调式音轨">■</button><label class="chord-bpm-wrap"><span>BPM</span><output>${state.bpm}</output><input type="range" min="40" max="240" value="${state.bpm}" data-mode-bpm aria-label="调式音轨 BPM"></label></div><button class="chord-clear-button" type="button" data-mode-clear>Clear</button></div><div class="chord-sequencer-shell"><div class="chord-sequencer-track"><div class="chord-sequencer-ruler"><span>拍</span>${Array.from({ length: STEPS }, (_, step) => `<button type="button" data-mode-seek="${step}" class="${step % 4 === 0 ? 'is-beat' : ''}">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}</div><div class="chord-sequencer-grid">${currentRows.map((row, rowIndex) => `<div class="chord-sequencer-row"><b>${row.label}</b>${Array.from({ length: STEPS }, (_, step) => `<button type="button" class="chord-sequencer-cell ${state.pattern[rowIndex].has(step) ? 'is-active' : ''}" data-mode-row="${rowIndex}" data-mode-step="${step}" aria-label="${row.label} 第 ${step + 1} 格" aria-pressed="${state.pattern[rowIndex].has(step)}"></button>`).join('')}</div>`).join('')}<i class="chord-playhead" aria-hidden="true"></i></div></div></div></section>`;
    bind(currentRows);
  };

  const paint = (step) => trackLab.querySelectorAll('[data-mode-step]').forEach((cell) => cell.classList.toggle('is-current', Number(cell.dataset.modeStep) === step));
  const bind = (currentRows) => {
    trackLab.querySelectorAll('[data-mode-row]').forEach((cell) => cell.addEventListener('click', () => {
      const row = Number(cell.dataset.modeRow);
      const step = Number(cell.dataset.modeStep);
      state.pattern[row].has(step) ? state.pattern[row].delete(step) : state.pattern[row].add(step);
      cell.classList.toggle('is-active', state.pattern[row].has(step));
      cell.setAttribute('aria-pressed', String(state.pattern[row].has(step)));
      if (!transport.clock && state.pattern[row].has(step) && currentRows[row].src) audio.play(currentRows[row].src, { gain: 0.7 });
    }));
    trackLab.querySelector('[data-mode-play]').addEventListener('click', () => transport.clock ? stop() : start());
    trackLab.querySelector('[data-mode-stop]').addEventListener('click', stop);
    trackLab.querySelector('[data-mode-clear]').addEventListener('click', () => { state.pattern.forEach((row) => row.clear()); render(); });
    trackLab.querySelector('[data-mode-bpm]').addEventListener('input', (event) => setBpm(Number(event.target.value)));
  };
  const setBpm = (bpm) => {
    state.bpm = bpm;
    if (transport.clock) transport.clock.setBpm(bpm);
    transport.bpmListeners.forEach((listener) => listener(bpm));
    render();
  };
  const stop = () => {
    if (transport.clock) transport.clock.stop();
    transport.clock = null;
    state.playing = false;
    transport.listeners.forEach((listener) => listener('stop'));
    render();
  };
  const start = () => {
    if (transport.clock) return;
    transport.clock = audio.createClock({ bpm: state.bpm, steps: STEPS, loop: true, onStep: (step, at) => {
      state.playing = true;
      const currentRows = rows();
      currentRows.forEach((row, rowIndex) => {
        if (state.pattern[rowIndex].has(step) && row.src) audio.play(row.src, { at, gain: 0.7, duration: 15 / state.bpm, synth: true });
      });
      paint(step);
      transport.listeners.forEach((listener) => listener(step, at));
    }, onEnd: () => stop() });
    state.playing = true;
    transport.clock.start();
    render();
  };

  document.querySelectorAll('[data-mode-keys], [data-mode-modes]').forEach((container) => {
    const isKey = container.hasAttribute('data-mode-keys');
    container.innerHTML = (isKey ? Object.keys(pitchClasses) : Object.keys(modes)).map((value) => `<button type="button" class="mode-track-button${(isKey ? state.key : state.mode) === value ? ' active' : ''}" data-mode-value="${value}">${value}</button>`).join('');
    container.addEventListener('click', (event) => {
      const button = event.target.closest('[data-mode-value]');
      if (!button) return;
      if (isKey) state.key = button.dataset.modeValue; else state.mode = button.dataset.modeValue;
      container.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button));
      render();
    });
  });

  window.MusicLabChordTransport = {
    start, stop, setBpm, subscribe: (listener) => transport.listeners.push(listener), subscribeBpm: (listener) => transport.bpmListeners.push(listener)
  };
  render();
})();
(() => {
  'use strict';

  const audio = window.MusicLabAudio;
  const trackLab = document.querySelector('[data-mode-track]');
  if (!audio || !trackLab) return;

  const STEPS = 16;
  const keys = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const modes = {
    Ionian: [0, 2, 4, 5, 7, 9, 11],
    Dorian: [0, 2, 3, 5, 7, 9, 10],
    Phrygian: [0, 1, 3, 5, 7, 8, 10],
    Lydian: [0, 2, 4, 6, 7, 9, 11],
    Mixolydian: [0, 2, 4, 5, 7, 9, 10],
    Aeolian: [0, 2, 3, 5, 7, 8, 10],
    Locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  const pitchClass = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const flatNames = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const sampleNames = new Set(['A3', 'A4', 'Ab3', 'Ab4', 'B3', 'B4', 'Bb3', 'Bb4', 'C3', 'C4', 'C5', 'D3', 'D4', 'Db3', 'Db4', 'E3', 'E4', 'Eb3', 'Eb4', 'F3', 'F4', 'G3', 'G4', 'Gb3', 'Gb4']);
  const shared = { clock: null, bpm: 96, listeners: [], bpmListeners: [] };
  const state = { key: 'C', mode: 'Ionian', pattern: Array.from({ length: 15 }, () => new Set()), bpm: 96, playing: false };

  const midiFor = (key, octave, interval) => 12 * (octave + 1) + pitchClass[key] + interval;
  const sampleForMidi = (midi) => {
    let value = midi;
    while (value > 72) value -= 12;
    while (value < 48) value += 12;
    const name = `${flatNames[((value % 12) + 12) % 12]}${Math.floor(value / 12) - 1}`;
    return sampleNames.has(name) ? `../audio/piano/sources/source-piano-${name}.wav` : null;
  };
  const rowsForState = () => {
    const intervals = modes[state.mode];
    const rows = [];
    for (let index = 14; index >= 0; index -= 1) {
      const degree = index % 7;
      const octave = 3 + Math.floor(index / 7);
      const midi = midiFor(state.key, octave, intervals[degree]);
      const letter = keys[(keys.indexOf(state.key) + degree) % keys.length];
      rows.push({ label: `${letter}${Math.floor(midi / 12) - 1}`, src: sampleForMidi(midi) });
    }
    return rows;
  };

  const controls = document.querySelector('[data-mode-track-controls]');
  const keyButtons = controls.querySelector('[data-mode-keys]');
  const modeButtons = controls.querySelector('[data-mode-modes]');
  keyButtons.innerHTML = keys.map((key) => `<button class="mode-button${key === state.key ? ' active' : ''}" type="button" data-key="${key}">${key}</button>`).join('');
  modeButtons.innerHTML = Object.keys(modes).map((mode) => `<button class="mode-button${mode === state.mode ? ' active' : ''}" type="button" data-mode="${mode}">${mode}</button>`).join('');

  const getPanel = () => trackLab.querySelector('.chord-sequencer-panel');
  const updateCell = (row, step) => {
    const cell = getPanel()?.querySelector(`.chord-sequencer-cell[data-row="${row}"][data-step="${step}"]`);
    if (cell) {
      cell.classList.toggle('is-active', state.pattern[row].has(step));
      cell.setAttribute('aria-pressed', String(state.pattern[row].has(step)));
    }
  };
  const paint = (step) => {
    getPanel()?.querySelectorAll('.chord-sequencer-cell').forEach((cell) => cell.classList.toggle('is-current', Number(cell.dataset.step) === step));
  };

  const render = () => {
    const rows = rowsForState();
    audio.load(rows.map((row) => row.src).filter(Boolean));
    trackLab.innerHTML = `<section class="chord-sequencer-panel is-chords"><div class="chord-sequencer-title-row"><h3>调式音轨 · ${state.key} ${state.mode}</h3></div><div class="chord-sequencer-header"><div class="chord-transport-group"><button class="chord-transport-button" type="button" data-play>${state.playing ? '❚❚' : '▶'}</button><button class="chord-stop-button" type="button" data-stop>■</button><label class="chord-bpm-wrap"><span>BPM</span><output>${shared.bpm}</output><input type="range" min="40" max="240" value="${shared.bpm}" data-bpm></label></div><button class="chord-clear-button" type="button" data-clear>Clear</button></div><div class="chord-sequencer-shell"><div class="chord-sequencer-track"><div class="chord-sequencer-ruler"><span>拍</span>${Array.from({ length: STEPS }, (_, step) => `<button type="button" data-seek="${step}" class="${step % 4 === 0 ? 'is-beat' : ''}">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}</div><div class="chord-sequencer-grid">${rows.map((row, rowIndex) => `<div class="chord-sequencer-row"><b>${row.label}</b>${Array.from({ length: STEPS }, (_, step) => `<button type="button" class="chord-sequencer-cell ${state.pattern[rowIndex].has(step) ? 'is-active' : ''}" data-row="${rowIndex}" data-step="${step}" aria-label="${row.label} 第 ${step + 1} 格" aria-pressed="${state.pattern[rowIndex].has(step)}"></button>`).join('')}</div>`).join('')}<i class="chord-playhead" aria-hidden="true"></i></div></div></div><p class="chord-sequencer-hint">切换调名或调式后，已点亮的格子会保留并映射到新的音阶。</p></section>`;
    const panel = getPanel();
    panel.querySelectorAll('.chord-sequencer-cell').forEach((cell) => cell.addEventListener('click', () => {
      const row = Number(cell.dataset.row);
      const step = Number(cell.dataset.step);
      state.pattern[row].has(step) ? state.pattern[row].delete(step) : state.pattern[row].add(step);
      updateCell(row, step);
      if (!state.playing && state.pattern[row].has(step) && rows[row].src) audio.play(rows[row].src, { gain: 0.7 });
    }));
    panel.querySelector('[data-play]').addEventListener('click', () => shared.clock ? stop() : start());
    panel.querySelector('[data-stop]').addEventListener('click', stop);
    panel.querySelector('[data-clear]').addEventListener('click', () => { state.pattern.forEach((row) => row.clear()); render(); });
    panel.querySelector('[data-bpm]').addEventListener('input', (event) => setBpm(Number(event.target.value)));
  };

  const playStep = (step, at) => {
    const rows = rowsForState();
    rows.forEach((row, index) => {
      if (row.src && state.pattern[index].has(step)) audio.play(row.src, { at, gain: 0.7 });
    });
    paint(step);
  };
  const start = () => {
    if (shared.clock) return;
    shared.clock = audio.createClock({ bpm: shared.bpm, steps: STEPS, loop: true, onStep: (step, at) => shared.listeners.forEach((listener) => listener(step, at)), onEnd: () => stop() });
    state.playing = true;
    shared.clock.start();
    render();
  };
  const stop = () => {
    if (shared.clock) shared.clock.stop();
    shared.clock = null;
    state.playing = false;
    shared.listeners.forEach((listener) => listener('stop'));
    render();
  };
  const setBpm = (bpm) => {
    shared.bpm = bpm;
    state.bpm = bpm;
    if (shared.clock) shared.clock.setBpm(bpm);
    shared.bpmListeners.forEach((listener) => listener(bpm));
    render();
  };

  shared.listeners.push((step, at) => {
    if (typeof step === 'number') playStep(step, at);
    else { state.playing = false; render(); }
  });
  shared.bpmListeners.push(() => {});
  window.MusicLabChordTransport = { start, stop, setBpm, subscribe: (listener) => shared.listeners.push(listener), subscribeBpm: (listener) => shared.bpmListeners.push(listener) };
  keyButtons.addEventListener('click', (event) => { const button = event.target.closest('[data-key]'); if (!button) return; state.key = button.dataset.key; keyButtons.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button)); render(); });
  modeButtons.addEventListener('click', (event) => { const button = event.target.closest('[data-mode]'); if (!button) return; state.mode = button.dataset.mode; modeButtons.querySelectorAll('button').forEach((item) => item.classList.toggle('active', item === button)); render(); });
  render();
})();
