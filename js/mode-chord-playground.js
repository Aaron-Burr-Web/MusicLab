/* 可切换主音和调式的教学页单轨版。 */
(() => {
  'use strict';

  const audio = window.MusicLabAudio;
  const mount = document.querySelector('[data-mode-chord-track]');
  if (!audio || !mount) return;

  const STEPS = Number(mount.dataset.steps) || 16;
  const practiceEnabled = mount.hasAttribute('data-practice');
  const panelAccent = mount.dataset.color === 'blue' ? '#2563eb' : '#f2d24f';
  const panelAccentStrong = mount.dataset.color === 'blue' ? '#60a5fa' : '#f9c74f';
  const ROW_COUNT = 15;
  const modes = {
    Ionian: [0, 2, 4, 5, 7, 9, 11], Dorian: [0, 2, 3, 5, 7, 9, 10],
    Phrygian: [0, 1, 3, 5, 7, 8, 10], Lydian: [0, 2, 4, 6, 7, 9, 11],
    Mixolydian: [0, 2, 4, 5, 7, 9, 10], Aeolian: [0, 2, 3, 5, 7, 8, 10],
    Locrian: [0, 1, 3, 5, 6, 8, 10]
  };
  const pitchClasses = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const letters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const sampleNames = new Set(['A3', 'A4', 'Ab3', 'Ab4', 'B3', 'B4', 'Bb3', 'Bb4', 'C3', 'C4', 'C5', 'D3', 'D4', 'Db3', 'Db4', 'E3', 'E4', 'Eb3', 'Eb4', 'F3', 'F4', 'G3', 'G4', 'Gb3', 'Gb4']);
  const flats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const state = { key: 'C', mode: 'Ionian', bpm: 60, cells: Array.from({ length: ROW_COUNT }, () => new Set()), clock: null, playing: false };
  const exampleNotes = [[15, 1], [15, 5], [15, 9], [15, 16], [15, 17], [15, 19], [13, 21], [15, 23], [12, 24], [12, 31], [13, 32]];
  const sharedTransport = window.MusicLabBassTransport || {
    bpm: state.bpm,
    clock: null,
    listeners: [],
    bpmListeners: [],
    start() {
      if (this.clock) return;
      audio.unlock();
      this.clock = audio.createClock({
        bpm: this.bpm,
        steps: STEPS,
        loop: true,
        onStep: (step, at) => this.listeners.forEach((listener) => listener(step, at)),
        onEnd: () => this.stop()
      });
      this.clock.start();
    },
    stop() {
      if (this.clock) this.clock.stop();
      this.clock = null;
      this.listeners.forEach((listener) => listener(null));
    },
    setBpm(value) {
      this.bpm = Number(value);
      if (this.clock) this.clock.setBpm(this.bpm);
      this.bpmListeners.forEach((listener) => listener(this.bpm));
    },
    subscribe(listener) { this.listeners.push(listener); },
    subscribeBpm(listener) { this.bpmListeners.push(listener); }
  };
  window.MusicLabBassTransport = sharedTransport;

  const midiFor = (name, octave) => 12 * (octave + 1) + (pitchClasses[name] || 0);
  const sampleForMidi = (midi) => {
    let value = midi;
    while (value > 72) value -= 12;
    while (value < 48) value += 12;
    const name = `${flats[((value % 12) + 12) % 12]}${Math.floor(value / 12) - 1}`;
    return sampleNames.has(name) ? `../audio/piano_sources/source-piano-${name}-iowa-mf.wav` : null;
  };
  const scaleNotes = () => {
    const intervals = modes[state.mode];
    return intervals.map((interval, degree) => {
      const letter = letters[(letters.indexOf(state.key) + degree) % letters.length];
      const target = (pitchClasses[state.key] + interval) % 12;
      const natural = pitchClasses[letter];
      const difference = (target - natural + 12) % 12;
      return `${letter}${difference === 1 ? '#' : difference === 11 ? 'b' : ''}`;
    });
  };
  const rows = () => {
    const scale = scaleNotes();
    const intervals = modes[state.mode];
    const root = midiFor(state.key, 3);
    return Array.from({ length: 15 }, (_, index) => {
      const degree = index % 7;
      const midi = root + intervals[degree] + 12 * Math.floor(index / 7);
      return { label: scale[degree], src: sampleForMidi(midi) };
    }).reverse();
  };

  const addStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
      .mode-chord-playground { --panel-accent: ${panelAccent}; --panel-accent-strong: ${panelAccentStrong}; --panel-shell: rgba(235,240,250,.9); width: min(1200px, calc(100% - 30px)); margin: 0 auto 24px; padding: 22px 20px 18px; border-radius: 24px; background: linear-gradient(145deg, #fff 0%, #f0f4ff 38%, #f6f9ff 100%); box-shadow: 14px 18px 28px rgba(39,49,75,.08); }
      .mode-chord-playground .sequencer-title-row, .mode-chord-playground .sequencer-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
      .mode-chord-playground .sequencer-title { margin: 0 6px 16px; color: #263247; font-size: 28px; }
      .mode-chord-playground .sequencer-header { padding: 0 6px 18px; }
      .mode-chord-playground .transport-group, .mode-chord-playground .bpm-wrap, .mode-chord-playground .header-actions, .mode-chord-playground .selector-cluster, .mode-chord-playground .mode-switcher { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
      .mode-chord-playground button { font: inherit; cursor: pointer; }
      .mode-chord-playground .transport-button, .mode-chord-playground .stop-button { width: 50px; height: 50px; border: 0; border-radius: 0; font-size: 20px; font-weight: 700; }
      .mode-chord-playground .transport-button { background: linear-gradient(135deg, var(--panel-accent), var(--panel-accent-strong)); }
      .mode-chord-playground .stop-button, .mode-chord-playground .clear-button { border: 1px solid rgba(107,114,128,.3); background: rgba(255,255,255,.7); color: #3f475c; padding: 9px 12px; }
      .mode-chord-playground .bpm-wrap { min-height: 50px; padding: 0 10px; border: 1px solid rgba(37,99,235,.22); background: rgba(255,255,255,.72); color: #263247; }
      .mode-chord-playground .bpm-wrap b { color: #263247; font-size: 12px; letter-spacing: .08em; }
      .mode-chord-playground .bpm-value { display: inline-flex; align-items: center; justify-content: center; min-width: 42px; color: var(--panel-accent); font-size: 20px; font-weight: 800; font-variant-numeric: tabular-nums; }
      .mode-chord-playground .bpm-slider { width: 180px; height: 6px; accent-color: var(--panel-accent-strong); }
      .mode-chord-playground .selector-cluster { align-items: flex-start; }
      .mode-chord-playground .selector-column { display: flex; flex-direction: column; gap: 6px; }
      .mode-chord-playground .selector-label { font-size: 10px; font-weight: 700; letter-spacing: .14em; color: #58657a; }
      .mode-chord-playground .mode-button { padding: 7px 10px; border: 1px solid rgba(17,24,39,.08); border-radius: 0; background: rgba(148,163,184,.08); color: #3c465d; font-size: 11px; font-weight: 700; }
      .mode-chord-playground .mode-button.active { background: linear-gradient(135deg, var(--panel-accent), var(--panel-accent-strong)); color: #1d1c1d; }
      .mode-chord-playground .status-pill { padding: 8px 12px; border: 1px solid rgba(92,104,128,.2); border-radius: 12px; background: rgba(255,255,255,.8); font-size: 11px; font-weight: 800; }
      .mode-chord-playground .sequencer-shell { overflow-x: auto; padding: 18px 14px; border-radius: 20px; background: var(--panel-shell); }
      .mode-chord-playground .sequencer-track { min-width: ${Math.max(540, STEPS * 30)}px; position: relative; }
      .mode-chord-playground .sequencer-ruler, .mode-chord-playground .sequencer-row { display: grid; grid-template-columns: 64px repeat(${STEPS}, minmax(14px, 1fr)); gap: 4px; align-items: center; }
      .mode-chord-playground .sequencer-ruler { margin-bottom: 6px; }
      .mode-chord-playground .ruler-label { color: #6b7280; font-size: 10px; text-align: center; }
      .mode-chord-playground .ruler-cell { height: 16px; border: 0; border-radius: 3px 3px 0 0; background: rgba(255,255,255,.55); color: #6b7280; font-size: 10px; }
      .mode-chord-playground .ruler-cell.is-beat { font-weight: 700; color: #5e4f0a; background: rgba(255,255,255,.85); }
      .mode-chord-playground .ruler-cell.is-current { background: var(--panel-accent-strong); color: #fff; }
      .mode-chord-playground .sequencer-grid { display: grid; gap: 4px; position: relative; }
      .mode-chord-playground .pitch-label { color: #4e586d; font-size: 11px; font-weight: 700; text-align: center; }
      .mode-chord-playground .sequencer-cell { width: 100%; height: 18px; border: 0; border-left: 1px solid transparent; border-radius: 0; background: #dfe4eb; touch-action: none; }
      .mode-chord-playground .sequencer-cell.is-divider { border-left-color: rgba(89,99,116,.75); }
      .mode-chord-playground .sequencer-cell.active { background: var(--panel-accent); }
      .mode-chord-playground .sequencer-cell.is-merged:not(.is-merged-end) { margin-right: -4px; width: calc(100% + 4px); }
      .mode-chord-playground .sequencer-cell.is-merged:not(.is-merged-start) { border-left-color: transparent; }
      .mode-chord-playground .playhead-line { position: absolute; top: 10px; bottom: 10px; width: 2px; background: var(--panel-accent); pointer-events: none; display: none; }
      .mode-chord-playground .practice-actions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin: 14px 6px 0; }
      .mode-chord-playground .example-button, .mode-chord-playground .check-button { border: 1px solid var(--panel-accent); border-radius: 4px; padding: 9px 14px; color: #fff; background: var(--panel-accent); font: inherit; font-size: 13px; font-weight: 700; }
      .mode-chord-playground .example-button:hover, .mode-chord-playground .check-button:hover { background: var(--panel-accent-strong); }
      .mode-chord-playground .practice-feedback { flex: 1 1 240px; margin: 0; color: #4e586d; font-size: 13px; }
      .mode-chord-playground .sequencer-hint { margin: 10px 6px 0; color: #6b7280; font-size: 12px; }
      @media (max-width: 720px) { .mode-chord-playground { width: calc(100% - 4px); padding: 16px 10px 14px; } .mode-chord-playground .sequencer-header { align-items: flex-start; } }
    `;
    document.head.appendChild(style);
  };

  addStyles();
  mount.className = 'mode-chord-playground';
  mount.innerHTML = `<div class="sequencer-title-row"><h2 class="sequencer-title">${mount.dataset.title || '和弦'}</h2><span class="status-pill">C / Ionian</span></div><div class="sequencer-header"><div class="transport-group"><button class="transport-button" type="button" aria-label="播放或暂停">▶</button><button class="stop-button" type="button" aria-label="停止">■</button><div class="bpm-wrap"><b>BPM</b><output class="bpm-value">60</output><input class="bpm-slider" type="range" min="40" max="240" value="60" aria-label="BPM 调节"></div></div><div class="header-actions"><div class="selector-cluster"><div class="selector-column"><span class="selector-label">Key</span><div class="mode-switcher key-switcher"></div></div><div class="selector-column"><span class="selector-label">Mode</span><div class="mode-switcher mode-switcher-buttons"></div></div></div><button class="clear-button" type="button">Clear</button></div></div><div class="sequencer-shell"><div class="sequencer-track"><div class="sequencer-ruler"></div><div class="sequencer-grid"></div><div class="playhead-line"></div></div></div>${practiceEnabled ? '<div class="practice-actions"><button class="example-button" type="button">填充示例</button><button class="check-button" type="button">检测填写</button><p class="practice-feedback" aria-live="polite">请先在音轨中填写内容，再点击检测。</p></div>' : ''}<p class="sequencer-hint">提示：点击 / 拖动方格可试听和编辑音符；32 steps 音轨可在横向滚动区域内完整查看。</p>`;

  const grid = mount.querySelector('.sequencer-grid');
  const ruler = mount.querySelector('.sequencer-ruler');
  const playhead = mount.querySelector('.playhead-line');
  const transport = mount.querySelector('.transport-button');
  const exampleButton = mount.querySelector('.example-button');
  const checkButton = mount.querySelector('.check-button');
  const feedback = mount.querySelector('.practice-feedback');
  const bpm = mount.querySelector('.bpm-slider');
  const bpmValue = mount.querySelector('.bpm-value');
  const status = mount.querySelector('.status-pill');
  let currentRows = [];
  let cells = [];
  const blocks = new Map();
  let cellDrag = null;
  let skipCellClickUntil = 0;
  let currentStep = 0;

  const refreshStatus = () => { status.textContent = `${state.key} / ${state.mode}`; };
  const matchesExample = () => {
    const expected = new Set(exampleNotes.map(([displayRow, step]) => `${displayRow - 1}:${step - 1}`));
    const actual = new Set();
    state.cells.forEach((row, rowIndex) => row.forEach((step) => actual.add(`${rowIndex}:${step}`)));
    return expected.size === actual.size && [...expected].every((cell) => actual.has(cell)) && [...blocks.values()].every((length) => length === 1);
  };
  const updatePracticeFeedback = () => {
    if (!practiceEnabled || !feedback) return;
    if (state.key !== 'F' || state.mode !== 'Aeolian') {
      feedback.textContent = '第一个音是低音F，请先调至正确的调式';
    } else if (!matchesExample()) {
      feedback.textContent = '没错！暂定所有的音都是单格音，现在来填充乐句吧！';
    } else if (state.bpm !== 105) {
      feedback.textContent = '尝试着调到正确的BPM！';
    } else {
      feedback.textContent = '没错，就是这样！';
    }
  };
  const blockKey = (row, start) => `${row}:${start}`;
  const blockAt = (row, step) => {
    for (const [key, length] of blocks) {
      const [blockRow, start] = key.split(':').map(Number);
      if (blockRow === row && step >= start && step < start + length) return { row, start, length };
    }
    return null;
  };
  const removeBlock = ({ row, start, length }) => {
    for (let step = start; step < start + length; step += 1) state.cells[row].delete(step);
    blocks.delete(blockKey(row, start));
    updateBlockClasses();
  };
  const paintBlock = (row, start, length) => {
    const end = Math.min(STEPS - 1, start + length - 1);
    for (let step = start; step <= end; step += 1) {
      const existing = blockAt(row, step);
      if (existing) removeBlock(existing);
      state.cells[row].add(step);
    }
    blocks.set(blockKey(row, start), end - start + 1);
  };
  const stepAtPointer = (row, clientX) => {
    const rowCells = [...grid.querySelectorAll(`.sequencer-cell[data-row="${row}"]`)];
    return rowCells.reduce((nearest, cell, step) => {
      const rect = cell.getBoundingClientRect();
      const distance = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0;
      return distance < nearest.distance ? { step, distance } : nearest;
    }, { step: 0, distance: Infinity }).step;
  };
  const updateBlockClasses = () => cells.forEach((cell) => {
    const block = blockAt(Number(cell.dataset.row), Number(cell.dataset.step));
    cell.classList.toggle('active', state.cells[Number(cell.dataset.row)].has(Number(cell.dataset.step)));
    cell.setAttribute('aria-pressed', String(state.cells[Number(cell.dataset.row)].has(Number(cell.dataset.step))));
    cell.classList.toggle('is-merged', Boolean(block));
    cell.classList.toggle('is-merged-start', Boolean(block && block.start === Number(cell.dataset.step)));
    cell.classList.toggle('is-merged-end', Boolean(block && block.start + block.length - 1 === Number(cell.dataset.step)));
  });
  const beginCellDrag = (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const cell = event.currentTarget;
    const row = Number(cell.dataset.row);
    cellDrag = {
      pointerId: event.pointerId,
      row,
      start: Number(cell.dataset.step),
      moved: false,
      startedAt: performance.now(),
      startX: event.clientX,
      startY: event.clientY,
      baseBlocks: [...blocks].filter(([key]) => Number(key.split(':')[0]) === row),
      baseActive: [...state.cells[row]]
    };
    try { cell.setPointerCapture?.(event.pointerId); } catch (_) { /* 合成指针事件可忽略 */ }
  };
  const restoreDragBase = () => {
    if (!cellDrag) return;
    for (const key of [...blocks.keys()]) {
      if (Number(key.split(':')[0]) === cellDrag.row) blocks.delete(key);
    }
    state.cells[cellDrag.row].clear();
    cellDrag.baseActive.forEach((step) => state.cells[cellDrag.row].add(step));
    cellDrag.baseBlocks.forEach(([key, length]) => blocks.set(key, length));
    updateBlockClasses();
  };
  const updateCellDrag = (event) => {
    if (!cellDrag || cellDrag.pointerId !== event.pointerId || performance.now() - cellDrag.startedAt < 220) return;
    const rowCells = [...grid.querySelectorAll(`.sequencer-cell[data-row="${cellDrag.row}"]`)];
    const rowRect = rowCells[0]?.parentElement?.getBoundingClientRect();
    if (!rowRect || event.clientY < rowRect.top || event.clientY > rowRect.bottom) return;
    const end = stepAtPointer(cellDrag.row, event.clientX);
    const movedPixels = Math.hypot(event.clientX - cellDrag.startX, event.clientY - cellDrag.startY);
    if (end === cellDrag.start && movedPixels < 4) return;
    cellDrag.moved = true;
    cellDrag.end = end;
    restoreDragBase();
    paintBlock(cellDrag.row, Math.min(cellDrag.start, end), Math.abs(end - cellDrag.start) + 1);
    updateBlockClasses();
  };
  const finishCellDrag = (event) => {
    if (!cellDrag || cellDrag.pointerId !== event.pointerId) return;
    if (cellDrag.moved) {
      paintBlock(cellDrag.row, Math.min(cellDrag.start, cellDrag.end), Math.abs(cellDrag.end - cellDrag.start) + 1);
      skipCellClickUntil = performance.now() + 100;
      event.preventDefault();
      updateBlockClasses();
      updatePracticeFeedback();
    }
    cellDrag = null;
  };
  const cancelCellDrag = () => {
    if (cellDrag?.moved) restoreDragBase();
    cellDrag = null;
  };
  const paintPlayhead = (step) => {
    const first = cells[0];
    const second = cells[1];
    const track = grid.parentElement;
    if (!first || !second || !track) return;
    const firstRect = first.getBoundingClientRect();
    const secondRect = second.getBoundingClientRect();
    const trackRect = track.getBoundingClientRect();
    const cellWidth = secondRect.left - firstRect.left;
    playhead.style.left = `${firstRect.left - trackRect.left}px`;
    playhead.style.transform = `translate3d(${step * cellWidth}px, 0, 0)`;
  };
  const render = (keepCells = true) => {
    const active = keepCells ? state.cells.map((row) => new Set(row)) : Array.from({ length: ROW_COUNT }, () => new Set());
    currentRows = rows();
    audio.load(currentRows.map((row) => row.src).filter(Boolean));
    ruler.innerHTML = `<div class="ruler-label">拍</div>${Array.from({ length: STEPS }, (_, step) => `<button class="ruler-cell${step % 4 === 0 ? ' is-beat' : ''}" type="button" data-seek="${step}">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}`;
    ruler.querySelectorAll('[data-seek]').forEach((button) => button.addEventListener('click', () => {
      currentStep = Number(button.dataset.seek);
      paintPlayhead(currentStep);
      trackLabRuler();
      if (!state.playing) playhead.style.display = 'block';
    }));
    grid.innerHTML = currentRows.map((row, rowIndex) => `<div class="sequencer-row"><div class="pitch-label">${row.label}</div>${Array.from({ length: STEPS }, (_, step) => `<button class="sequencer-cell${step % 4 === 0 ? ' is-divider' : ''}${active[rowIndex]?.has(step) ? ' active' : ''}" type="button" data-row="${rowIndex}" data-step="${step}" aria-label="${row.label} 第 ${step + 1} 格" aria-pressed="${active[rowIndex]?.has(step) || false}"></button>`).join('')}</div>`).join('');
    state.cells = active;
    cells = [...grid.querySelectorAll('.sequencer-cell')];
    updateBlockClasses();
    cells.forEach((cell) => cell.addEventListener('click', () => {
      if (skipCellClickUntil > performance.now()) return;
      const row = Number(cell.dataset.row); const step = Number(cell.dataset.step);
      const block = blockAt(row, step);
      if (block) removeBlock(block);
      else state.cells[row].has(step) ? state.cells[row].delete(step) : state.cells[row].add(step);
      updateBlockClasses();
      if (!state.playing && state.cells[row].has(step) && currentRows[row].src) { audio.unlock(); audio.play(currentRows[row].src, { gain: 0.55, duration: 15 / state.bpm, synth: true }); }
      updatePracticeFeedback();
    }));
    cells.forEach((cell) => {
      cell.addEventListener('pointerdown', beginCellDrag);
      cell.addEventListener('pointermove', updateCellDrag);
      cell.addEventListener('pointerup', finishCellDrag);
      cell.addEventListener('pointercancel', cancelCellDrag);
    });
    trackLabRuler();
    refreshStatus();
    updatePracticeFeedback();
  };
  const trackLabRuler = () => mount.querySelectorAll('.ruler-cell').forEach((cell) => {
    cell.classList.toggle('is-current', Number(cell.dataset.seek) === currentStep);
  });
  const stop = () => { sharedTransport.stop(); };
  const start = () => {
    sharedTransport.start();
  };
  sharedTransport.subscribe((step, at) => {
    if (typeof step !== 'number') {
      state.clock = null;
      state.playing = false;
      transport.textContent = '▶';
      playhead.style.display = 'none';
      return;
    }
    state.clock = sharedTransport.clock;
    state.playing = true;
    transport.textContent = '❚❚';
    currentStep = step;
    currentRows.forEach((row, index) => {
      const block = blockAt(index, step);
      const isStart = block ? block.start === step : state.cells[index].has(step);
      if (isStart && row.src) audio.play(row.src, { at, gain: 0.55, duration: (15 / state.bpm) * (block?.length || 1), synth: true });
    });
    cells.forEach((cell) => cell.classList.toggle('is-current', Number(cell.dataset.step) === step));
    paintPlayhead(step);
    trackLabRuler();
    playhead.style.display = 'block';
  });
  sharedTransport.subscribeBpm((value) => {
    state.bpm = value;
    bpm.value = String(value);
    bpmValue.textContent = String(value);
    updatePracticeFeedback();
  });
  const fillExample = () => {
    state.key = 'F';
    state.mode = 'Aeolian';
    state.bpm = 80;
    blocks.clear();
    state.cells.forEach((row) => row.clear());
    exampleNotes.forEach(([displayRow, start]) => {
      const row = displayRow - 1;
      const firstStep = start - 1;
      state.cells[row].add(firstStep);
      blocks.set(blockKey(row, firstStep), 1);
    });
    mount.querySelectorAll('[data-key]').forEach((button) => button.classList.toggle('active', button.dataset.key === state.key));
    mount.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === state.mode));
    bpm.value = String(state.bpm);
    bpmValue.textContent = String(state.bpm);
  };
  const checkPattern = () => {
    updatePracticeFeedback();
  };
  transport.addEventListener('click', () => sharedTransport.clock ? stop() : start());
  mount.querySelector('.stop-button').addEventListener('click', stop);
  mount.querySelector('.clear-button').addEventListener('click', () => { state.cells.forEach((row) => row.clear()); blocks.clear(); render(false); });
  if (practiceEnabled) {
    exampleButton.addEventListener('click', () => { fillExample(); render(true); });
    checkButton.addEventListener('click', checkPattern);
  }
  bpm.addEventListener('input', () => { sharedTransport.setBpm(Number(bpm.value)); });
  mount.querySelector('.key-switcher').innerHTML = Object.keys(pitchClasses).map((key) => `<button class="mode-button${key === state.key ? ' active' : ''}" type="button" data-key="${key}">${key}</button>`).join('');
  mount.querySelector('.mode-switcher-buttons').innerHTML = Object.keys(modes).map((mode) => `<button class="mode-button${mode === state.mode ? ' active' : ''}" type="button" data-mode="${mode}">${mode}</button>`).join('');
  mount.addEventListener('click', (event) => {
    const key = event.target.closest('[data-key]')?.dataset.key; const mode = event.target.closest('[data-mode]')?.dataset.mode;
    if (!key && !mode) return;
    if (key) state.key = key; if (mode) state.mode = mode;
    mount.querySelectorAll('[data-key]').forEach((button) => button.classList.toggle('active', button.dataset.key === state.key));
    mount.querySelectorAll('[data-mode]').forEach((button) => button.classList.toggle('active', button.dataset.mode === state.mode));
    render(true);
  });
  render(false);
})();
