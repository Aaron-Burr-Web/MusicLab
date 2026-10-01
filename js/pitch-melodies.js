/* Melodies 音轨（三）：固定 C 大调、16 步 x 8 行的旋律音序器。 */
(() => {
  'use strict';
  const engine = window.MusicLabAudio;
  const grid = document.querySelector('[data-melody-grid]');
  if (!engine || !grid) return;

  const src = (note) => `../audio/piano/sources/source-piano-${note}.wav`;
  const notes = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4'];
  const steps = 16;
  const state = { bpm: 96, currentStep: 0, playing: false, frame: null, lastFrame: 0, accumulator: 0, scrubbing: false };
  const ruler = document.querySelector('[data-melody-ruler]');
  const transport = document.querySelector('.melody-transport');
  const clearButton = document.querySelector('.melody-clear');
  const bpmInput = document.querySelector('[data-melody-bpm]');
  const bpmValue = document.querySelector('[data-melody-bpm-value]');
  const status = document.querySelector('[data-melody-status]');
  const playhead = document.querySelector('.melody-playhead');
  let cells = [];
  let active = [];
  let rulerCells = [];

  engine.load(notes.map(src));

  const stepDuration = () => (60000 / state.bpm) / 4;
  const setStatus = (text, playing = false) => { status.textContent = text; status.className = `status-badge ${playing ? 'online' : 'offline'}`; };
  const render = () => {
    ruler.innerHTML = `<span class="melody-ruler-label">拍</span>${Array.from({ length: steps }, (_, step) => `<button class="melody-ruler-cell${step % 4 === 0 ? ' is-beat' : ''}" type="button" data-step="${step}" aria-label="跳到第 ${step + 1} 格">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}`;
    rulerCells = [...ruler.querySelectorAll('.melody-ruler-cell')];
    grid.innerHTML = notes.map((note, row) => `<div class="melody-row"><span class="melody-pitch-label">${note.slice(0, -1)}</span>${Array.from({ length: steps }, (_, step) => `<button class="melody-cell${step % 4 === 0 ? ' is-divider' : ''}" type="button" data-row="${row}" data-step="${step}" aria-label="${note} 第 ${step + 1} 格" aria-pressed="false"></button>`).join('')}</div>`).join('');
    cells = [...grid.querySelectorAll('.melody-row')].map((row) => [...row.querySelectorAll('.melody-cell')]);
    active = cells.map((row) => row.map(() => false));
    cells.forEach((row, rowIndex) => row.forEach((cell, step) => cell.addEventListener('click', () => {
      const isActive = cell.classList.toggle('active');
      active[rowIndex][step] = isActive;
      cell.setAttribute('aria-pressed', String(isActive));
      if (isActive && !state.playing) playNote(notes[rowIndex]);
    })));
  };

  const playNote = (note, at = 0) => { engine.unlock(); engine.play(src(note), { at: at || undefined, gain: 0.78 }); };
  const playStep = (step, at = 0) => active.forEach((row, rowIndex) => { if (row[step]) playNote(notes[rowIndex], at); });
  const updatePlayhead = () => {
    const first = cells[0]?.[0];
    const second = cells[0]?.[1];
    if (!first || !second) return;
    const trackRect = grid.parentElement.getBoundingClientRect();
    const start = first.getBoundingClientRect().left - trackRect.left;
    const width = second.getBoundingClientRect().left - first.getBoundingClientRect().left;
    const progress = Math.min(state.accumulator / stepDuration(), 0.999);
    playhead.style.left = `${start}px`;
    playhead.style.transform = `translate3d(${(state.currentStep + progress) * width}px, 0, 0)`;
    rulerCells.forEach((cell, index) => cell.classList.toggle('is-current', index === state.currentStep));
  };
  const pause = () => {
    if (state.frame) cancelAnimationFrame(state.frame);
    state.frame = null; state.playing = false; state.lastFrame = 0;
    transport.textContent = '▶'; setStatus(`已暂停在第 ${state.currentStep + 1} 格`); updatePlayhead();
  };
  const animate = (time) => {
    if (!state.playing) return;
    if (!state.lastFrame) state.lastFrame = time;
    state.accumulator += time - state.lastFrame;
    state.lastFrame = time;
    while (state.accumulator >= stepDuration()) {
      state.accumulator -= stepDuration();
      state.currentStep = (state.currentStep + 1) % steps;
      playStep(state.currentStep);
    }
    updatePlayhead();
    state.frame = requestAnimationFrame(animate);
  };
  const start = () => {
    state.playing = true; state.lastFrame = performance.now();
    playhead.style.display = 'block'; transport.textContent = '❚❚'; setStatus('播放中', true);
    updatePlayhead();
    if (state.accumulator === 0) playStep(state.currentStep);
    state.frame = requestAnimationFrame(animate);
  };
  const seek = (step) => {
    state.currentStep = Math.max(0, Math.min(steps - 1, Math.round(step)));
    state.accumulator = 0; playhead.style.display = 'block'; updatePlayhead();
    if (state.playing) playStep(state.currentStep);
  };
  const stepFromPointer = (x) => {
    const first = rulerCells[0]?.getBoundingClientRect(); const last = rulerCells[rulerCells.length - 1]?.getBoundingClientRect();
    if (!first || !last) return 0;
    return Math.floor(Math.max(0, Math.min(0.999, (x - first.left) / Math.max(1, last.right - first.left))) * steps);
  };

  transport.addEventListener('click', () => (state.playing ? pause() : start()));
  clearButton.addEventListener('click', () => { cells.flat().forEach((cell) => { cell.classList.remove('active'); cell.setAttribute('aria-pressed', 'false'); }); active = cells.map((row) => row.map(() => false)); setStatus('已清空'); });
  bpmInput.addEventListener('input', () => { state.bpm = Number(bpmInput.value); bpmValue.textContent = String(state.bpm); state.accumulator = 0; state.lastFrame = state.playing ? performance.now() : 0; updatePlayhead(); });
  ruler.addEventListener('pointerdown', (event) => { if (event.button !== 0 && event.pointerType === 'mouse') return; state.scrubbing = true; ruler.setPointerCapture?.(event.pointerId); seek(stepFromPointer(event.clientX)); });
  ruler.addEventListener('pointermove', (event) => { if (state.scrubbing) seek(stepFromPointer(event.clientX)); });
  ruler.addEventListener('pointerup', () => { state.scrubbing = false; });
  ruler.addEventListener('pointercancel', () => { state.scrubbing = false; });
  window.addEventListener('resize', updatePlayhead);
  render(); updatePlayhead();
})();