/* 教学页与游乐园共用的音轨脚本。当前先迁移 Melodies 音轨，后续继续合并其他音轨模块。 */
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
  const blocks = new Map();
  let cellDrag = null;
  let skipCellClickUntil = 0;

  engine.load(notes.map(src));

  const stepDuration = () => (60000 / state.bpm) / 4;
  const setStatus = (text, playing = false) => { status.textContent = text; status.className = `status-badge ${playing ? 'online' : 'offline'}`; };
  const render = () => {
    ruler.innerHTML = `<span class="melody-ruler-label">拍</span>${Array.from({ length: steps }, (_, step) => `<button class="melody-ruler-cell${step % 4 === 0 ? ' is-beat' : ''}" type="button" data-step="${step}" aria-label="跳到第 ${step + 1} 格">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}`;
    rulerCells = [...ruler.querySelectorAll('.melody-ruler-cell')];
    grid.innerHTML = notes.map((note, row) => `<div class="melody-row"><span class="melody-pitch-label">${note.slice(0, -1)}</span>${Array.from({ length: steps }, (_, step) => `<button class="melody-cell${step % 4 === 0 ? ' is-divider' : ''}" type="button" data-row="${row}" data-step="${step}" aria-label="${note} 第 ${step + 1} 拍" aria-pressed="false"></button>`).join('')}</div>`).join('');
    cells = [...grid.querySelectorAll('.melody-row')].map((row) => [...row.querySelectorAll('.melody-cell')]);
    active = cells.map((row) => row.map(() => false));
    cells.forEach((row, rowIndex) => row.forEach((cell, step) => {
      cell.addEventListener('click', () => {
        if (skipCellClickUntil > performance.now()) return;
        const block = blockAt(rowIndex, step);
        if (block) {
          removeBlock(block);
          return;
        }
        const isActive = !active[rowIndex][step];
        setCell(rowIndex, step, isActive);
        if (isActive && !state.playing) playNote(notes[rowIndex]);
      });
      cell.addEventListener('pointerdown', beginCellDrag);
      cell.addEventListener('pointermove', updateCellDrag);
      cell.addEventListener('pointerup', finishCellDrag);
      cell.addEventListener('pointercancel', cancelCellDrag);
    }));
  };

  const blockKey = (rowIndex, startStep) => `${rowIndex}:${startStep}`;
  const setCell = (rowIndex, step, isActive) => {
    const cell = cells[rowIndex]?.[step];
    if (!cell) return;
    active[rowIndex][step] = isActive;
    cell.classList.toggle('active', isActive);
    cell.setAttribute('aria-pressed', String(isActive));
  };
  const blockAt = (rowIndex, step) => {
    for (const [key, length] of blocks) {
      const [row, start] = key.split(':').map(Number);
      if (row === rowIndex && step >= start && step < start + length) return { row, start, length };
    }
    return null;
  };
  const removeBlock = ({ row, start, length }) => {
    for (let step = start; step < start + length; step += 1) {
      const cell = cells[row]?.[step];
      if (!cell) continue;
      setCell(row, step, false);
      cell.classList.remove('is-merged', 'is-merged-start', 'is-merged-end');
    }
    blocks.delete(blockKey(row, start));
  };
  const paintBlock = (row, start, length) => {
    const end = Math.min(steps - 1, start + length - 1);
    for (let step = start; step <= end; step += 1) {
      const existing = blockAt(row, step);
      if (existing) removeBlock(existing);
      setCell(row, step, true);
      const cell = cells[row][step];
      cell.classList.add('is-merged');
      cell.classList.toggle('is-merged-start', step === start);
      cell.classList.toggle('is-merged-end', step === end);
    }
    blocks.set(blockKey(row, start), end - start + 1);
  };
  const stepAtPointer = (rowIndex, clientX) => {
    const row = cells[rowIndex] || [];
    return row.reduce((nearest, cell, step) => {
      const rect = cell.getBoundingClientRect();
      const distance = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0;
      return distance < nearest.distance ? { step, distance } : nearest;
    }, { step: 0, distance: Infinity }).step;
  };
  const beginCellDrag = (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    const cell = event.currentTarget;
    cellDrag = { pointerId: event.pointerId, row: Number(cell.dataset.row), start: Number(cell.dataset.step), moved: false, startedAt: performance.now() };
    try { cell.setPointerCapture?.(event.pointerId); } catch (_) { /* 合成指针事件没有活动指针时可忽略 */ }
  };
  const updateCellDrag = (event) => {
    if (!cellDrag || cellDrag.pointerId !== event.pointerId || performance.now() - cellDrag.startedAt < 220) return;
    const row = cells[cellDrag.row] || [];
    const rowRect = row[0]?.parentElement?.getBoundingClientRect();
    if (!rowRect || event.clientY < rowRect.top || event.clientY > rowRect.bottom) return;
    const end = stepAtPointer(cellDrag.row, event.clientX);
    if (end === cellDrag.start) return;
    cellDrag.moved = true;
    cellDrag.end = end;
    paintBlock(cellDrag.row, Math.min(cellDrag.start, end), Math.abs(end - cellDrag.start) + 1);
  };
  const finishCellDrag = (event) => {
    if (!cellDrag || cellDrag.pointerId !== event.pointerId) return;
    if (cellDrag.moved) {
      const start = Math.min(cellDrag.start, cellDrag.end);
      paintBlock(cellDrag.row, start, Math.abs(cellDrag.end - cellDrag.start) + 1);
      skipCellClickUntil = performance.now() + 100;
      event.preventDefault();
    }
    cellDrag = null;
  };
  const cancelCellDrag = () => { cellDrag = null; };

  const playNote = (note, at, length = 1) => {
    engine.unlock();
    engine.play(src(note), { at: Number.isFinite(at) ? at : undefined, gain: 0.78, duration: (15 / state.bpm) * length, synth: true });
  };
  const playStep = (step, at) => active.forEach((row, rowIndex) => {
    const block = blockAt(rowIndex, step);
    if (block && block.start !== step) return;
    if (row[step]) playNote(notes[rowIndex], at, block?.length || 1);
  });
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
  clearButton.addEventListener('click', () => { blocks.clear(); cells.flat().forEach((cell) => { cell.classList.remove('active', 'is-merged', 'is-merged-start', 'is-merged-end'); cell.setAttribute('aria-pressed', 'false'); }); active = cells.map((row) => row.map(() => false)); setStatus('已清空'); });
  bpmInput.addEventListener('input', () => { state.bpm = Number(bpmInput.value); bpmValue.textContent = String(state.bpm); state.accumulator = 0; state.lastFrame = state.playing ? performance.now() : 0; updatePlayhead(); });
  ruler.addEventListener('pointerdown', (event) => { if (event.button !== 0 && event.pointerType === 'mouse') return; state.scrubbing = true; ruler.setPointerCapture?.(event.pointerId); seek(stepFromPointer(event.clientX)); });
  ruler.addEventListener('pointermove', (event) => { if (state.scrubbing) seek(stepFromPointer(event.clientX)); });
  ruler.addEventListener('pointerup', () => { state.scrubbing = false; });
  ruler.addEventListener('pointercancel', () => { state.scrubbing = false; });
  window.addEventListener('resize', updatePlayhead);
  render(); updatePlayhead();
})();

/* 游乐园也通过统一入口接入四轨音序器。旧实现暂作为兼容模块加载，避免迁移期间重复定义。 */
(() => {
  if (!document.querySelector('.box') || document.querySelector('script[data-playground-track]')) return;
  const script = document.createElement('script');
  script.src = '../js/playground-sequencer.js';
  script.dataset.playgroundTrack = 'true';
  document.body.appendChild(script);
})();
