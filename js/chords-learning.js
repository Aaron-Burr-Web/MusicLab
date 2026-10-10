/* 音程与和弦章节的试听与练习交互。 */
(() => {
  'use strict';

  const audio = window.MusicLabAudio;
  if (!audio) return;

  const isIntervalLesson = document.body?.dataset.lesson === 'chords-intervals';
  const sampleFiles = {
    C4: 'source-piano-C4.wav',
    Db4: 'source-piano-Db4.wav', D4: 'source-piano-D4.wav', Eb4: 'source-piano-Eb4.wav',
    E4: 'source-piano-E4.wav', F4: 'source-piano-F4.wav', Gb4: 'source-piano-Gb4.wav',
    G4: 'source-piano-G4.wav', Ab4: 'source-piano-Ab4.wav', A4: 'source-piano-A4.wav',
    Bb4: 'source-piano-Bb4.wav', B4: 'source-piano-B4.wav'
  };
  const source = (note) => {
    const match = String(note).match(/^([A-G](?:b)?)(\d)$/);
    if (!match) return '';
    if (isIntervalLesson) return `../audio/piano/sources/source-piano-${note}.wav`;
    if (Number(match[2]) <= 3) return `../audio/piano/sources/source-piano-${note}.wav`;
    const file = sampleFiles[`${match[1]}4`];
    return file ? `../audio/piano/sources/${file}` : '';
  };
  const playNotes = (notes, options = {}) => {
    const { delay = 0, gain = 0.72, controls = [] } = options;
    return audio.playAudition(notes.map(source), { offsets: notes.map((_, index) => index ? delay : 0), gain, controls, playbackRate: isIntervalLesson ? 1 : 0.5 });
  };

  let intervalMode = 'melody';
  const intervalModeSwitch = document.querySelector('[data-interval-mode-switch]');
  if (intervalModeSwitch) {
    intervalModeSwitch.addEventListener('click', (event) => {
      const button = event.target.closest('[data-interval-mode]');
      if (!button) return;
      intervalMode = button.dataset.intervalMode;
      intervalModeSwitch.querySelectorAll('[data-interval-mode]').forEach((item) => {
        const isActive = item === button;
        item.classList.toggle('is-active', isActive);
        item.setAttribute('aria-pressed', String(isActive));
      });
    });
  }

  document.querySelectorAll('[data-chord-audition]').forEach((button) => {
    const notes = button.dataset.chordAudition.split(',').filter(Boolean);
    audio.load(notes.map(source));
    button.addEventListener('click', () => {
      playNotes(notes, { delay: isIntervalLesson && intervalMode === 'melody' ? 0.3 : 0, controls: document.querySelectorAll('.chord-audition, [data-interval-keyboard] [data-note]') });
      button.classList.remove('is-playing');
      void button.offsetWidth;
      button.classList.add('is-playing');
      window.setTimeout(() => button.classList.remove('is-playing'), 420);
    });
  });

  const intervalKeyboard = document.querySelector('[data-interval-keyboard]');
  if (intervalKeyboard) {
    const readout = document.querySelector('[data-interval-readout]');
    intervalKeyboard.addEventListener('click', (event) => {
      const target = event.target.closest('button[data-note]');
      if (!target) return;
      playNotes(['C3', target.dataset.note], { delay: 0.3, controls: intervalKeyboard.querySelectorAll('button, .chord-audition') });
      intervalKeyboard.querySelectorAll('button').forEach((button) => button.classList.toggle('is-selected', button === target));
      readout.innerHTML = `<b>C 到 ${target.textContent}</b>：${target.dataset.name}，${target.dataset.degree}，相差 ${target.dataset.semitones} 个半音。`;
    });
  }

  const triadBuilder = document.querySelector('[data-triad-builder]');
  if (triadBuilder) {
    const triads = {
      major: { title: 'C 大三和弦', notes: ['C3', 'E3', 'G3'], structure: '根音 C、三度音 E、五度音 G。听起来通常明亮、稳定。' },
      minor: { title: 'C 小三和弦', notes: ['C3', 'Eb3', 'G3'], structure: '根音 C、三度音 E♭、五度音 G。听起来通常柔和、偏暗。' },
      augmented: { title: 'C 增三和弦', notes: ['C3', 'E3', 'Ab3'], structure: '根音 C、三度音 E、增五度 A♭。听起来悬浮、不安定。' },
      diminished: { title: 'C 减三和弦', notes: ['C3', 'Eb3', 'Gb3'], structure: '根音 C、三度音 E♭、减五度 G♭。听起来紧张、不稳定。' }
    };
    const readout = document.querySelector('[data-triad-readout]');
    triadBuilder.addEventListener('click', (event) => {
      const button = event.target.closest('[data-triad]');
      if (!button) return;
      const triad = triads[button.dataset.triad];
      playNotes(triad.notes, { controls: triadBuilder.querySelectorAll('button') });
      triadBuilder.querySelectorAll('button').forEach((item) => item.classList.toggle('is-selected', item === button));
      readout.innerHTML = `<b>${triad.title}</b><span>${triad.structure}</span>`;
    });
  }

  const trackLab = document.querySelector('[data-chord-track-lab]');
  if (trackLab) {
    const trackMode = trackLab.dataset.chordTrackLab;
    const isChords32Track = trackMode === 'chords-32';
    const STEPS = trackMode === 'octave' ? 4 : isChords32Track ? 32 : 16;
    const dividerSteps = new Set(STEPS === 4 ? [1, 2, 3] : Array.from({ length: STEPS / 4 - 1 }, (_, index) => (index + 1) * 4));
    const isOctaveTrack = trackMode === 'octave';
    const isProgressionTrack = trackMode === 'progression';
    const isChordsOnlyTrack = trackMode === 'chords-only';
    const isTonesScaleTrack = trackMode === 'tones-scales';
    const isModesScaleTrack = trackMode === 'modes-scales';
    const isBassExampleTrack = trackMode === 'bass-example';
    const isBassSuiteTrack = trackMode === 'bass-suite';
    const sharedTransport = isChordsOnlyTrack || isBassExampleTrack || isBassSuiteTrack
      ? { clock: null, bpm: 96, key: 'C', mode: 'Ionian', states: [], listeners: [], bpmListeners: [], modeListeners: [], setMode(key, mode) { this.key = key || this.key; this.mode = mode || this.mode; this.modeListeners.forEach((listener) => listener(this.key, this.mode)); } } : null;
    const octaveRows = trackLab.dataset.chordTrackRange === 'g4-c3'
      ? ['G4', 'Gb4', 'F4', 'E4', 'Eb4', 'D4', 'Db4', 'C4', 'B3', 'Bb3', 'A3', 'Ab3', 'G3', 'Gb3', 'F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3']
      : ['C4', 'B3', 'Bb3', 'A3', 'Ab3', 'G3', 'Gb3', 'F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3'];
    const scaleNotes = isTonesScaleTrack
      ? ['B4', 'Bb4', 'A4', 'Ab4', 'G4', 'Gb4', 'F4', 'E4', 'Eb4', 'D4', 'Db4', 'C4', 'B3', 'Bb3', 'A3', 'Ab3', 'G3', 'Gb3', 'F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3']
      : isModesScaleTrack
        ? ['B3', 'Bb3', 'A3', 'Ab3', 'G3', 'Gb3', 'F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3', 'B2', 'Bb2', 'A2', 'Ab2', 'G2', 'Gb2', 'F2', 'E2', 'Eb2', 'D2', 'Db2', 'C2', 'B1', 'Bb1', 'A1', 'Ab1', 'G1', 'Gb1', 'F1', 'E1', 'Eb1', 'D1', 'Db1', 'C1']
      : isChordsOnlyTrack || isChords32Track
      ? ['C5', 'B4', 'Bb4', 'A4', 'Ab4', 'G4', 'Gb4', 'F4', 'E4', 'Eb4', 'D4', 'Db4', 'C4', 'B3', 'Bb3', 'A3', 'Ab3', 'G3', 'Gb3', 'F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3']
      : isProgressionTrack
        ? ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3']
      : (isOctaveTrack ? octaveRows : ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3']);
    const scaleRows = scaleNotes
      .map((note) => [note, [note]]);
    const bassRows = ['B3', 'Bb3', 'A3', 'Ab3', 'G3', 'Gb3', 'F3', 'E3', 'Eb3', 'D3', 'Db3', 'C3', 'B2', 'Bb2', 'A2', 'Ab2', 'G2', 'Gb2', 'F2', 'E2', 'Eb2', 'D2', 'Db2', 'C2', 'B1', 'Bb1', 'A1', 'Ab1', 'G1', 'Gb1', 'F1', 'E1', 'Eb1', 'D1', 'Db1', 'C1']
      .map((note) => [note, [note]]);
    const modeIntervals = {
      Ionian: [0, 2, 4, 5, 7, 9, 11], Dorian: [0, 2, 3, 5, 7, 9, 10],
      Phrygian: [0, 1, 3, 5, 7, 8, 10], Lydian: [0, 2, 4, 6, 7, 9, 11],
      Mixolydian: [0, 2, 4, 5, 7, 9, 10], Aeolian: [0, 2, 3, 5, 7, 8, 10],
      Locrian: [0, 1, 3, 5, 6, 8, 10]
    };
    const modePitchClasses = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const modeLetters = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
    const modeFlats = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
    const modeRowsFor = (key, mode, baseOctave = 4) => {
      const intervals = modeIntervals[mode];
      const root = 12 * (baseOctave + 1) + modePitchClasses[key];
      return Array.from({ length: 15 }, (_, index) => {
        const degree = index % 7;
        const midi = root + intervals[degree] + 12 * Math.floor(index / 7);
        const label = modeFlats[midi % 12] + (Math.floor(midi / 12) - 1);
        return [label, [label]];
      }).reverse();
    };

    const createTrack = ({ title, theme, rows, gain, isChord = false, defaultBpm = 96, modeSelectable = false }) => {
      let trackRows = modeSelectable ? modeRowsFor(sharedTransport.key, sharedTransport.mode, theme === 'is-bass' ? 1 : 4) : rows;
      const state = { bpm: defaultBpm, pattern: Array.from({ length: trackRows.length }, () => new Set()), blocks: new Map(), clock: null, playing: false, render: null };
      if (sharedTransport) {
        state.bpm = sharedTransport.bpm;
        sharedTransport.states.push(state);
      }
      const panel = document.createElement('section');
      panel.className = `chord-sequencer-panel ${theme}${STEPS === 4 ? ' is-four-step' : ''}${STEPS === 16 ? ' is-16-step' : ''}${STEPS === 32 ? ' is-32-step' : ''}`;
      audio.load(trackRows.flatMap(([, notes]) => notes.map(source)));
      const chordGain = (count) => isChord ? gain / Math.sqrt(Math.max(1, count)) : gain;
      const noteDuration = (length = 1) => theme === 'is-bass' ? Math.max(0.06, (15 / state.bpm) * length) : (15 / state.bpm) * length;
      const activeCountAt = (step) => state.pattern.reduce((count, row) => count + (row.has(step) ? 1 : 0), 0);

      const blockKey = (row, start) => `${row}:${start}`;
      const blockAt = (row, step) => {
        for (const [key, length] of state.blocks) {
          const [blockRow, start] = key.split(':').map(Number);
          if (blockRow === row && step >= start && step < start + length) return { row, start, length };
        }
        return null;
      };
      const fillBlocks = (blocks) => {
        state.blocks.clear();
        state.pattern.forEach((row) => row.clear());
        blocks.forEach(({ row, start, length }) => paintBlock(Number(row), start, length));
        render();
      };
      const updateCell = (row, step) => {
        const cell = panel.querySelector(`.chord-sequencer-cell[data-row="${row}"][data-step="${step}"]`);
        if (!cell) return;
        const block = blockAt(row, step);
        cell.classList.toggle('is-active', state.pattern[row].has(step));
        cell.classList.toggle('is-merged', Boolean(block));
        cell.classList.toggle('is-merged-start', block?.start === step);
        cell.classList.toggle('is-merged-end', block?.start + block?.length - 1 === step);
        cell.setAttribute('aria-pressed', String(state.pattern[row].has(step)));
      };
      const removeBlock = ({ row, start, length }) => {
        for (let step = start; step < start + length; step += 1) {
          state.pattern[row].delete(step);
          updateCell(row, step);
        }
        state.blocks.delete(blockKey(row, start));
        for (let step = start; step < start + length; step += 1) updateCell(row, step);
      };
      const paintBlock = (row, start, length) => {
        const end = Math.min(STEPS - 1, start + length - 1);
        const overlaps = new Map();
        for (let step = start; step <= end; step += 1) {
          const block = blockAt(row, step);
          if (block) overlaps.set(blockKey(block.row, block.start), block);
        }
        overlaps.forEach(removeBlock);
        state.blocks.set(blockKey(row, start), end - start + 1);
        for (let step = start; step <= end; step += 1) {
          state.pattern[row].add(step);
          updateCell(row, step);
        }
      };
      let cellDrag = null;
      let skipCellClickUntil = 0;
      const stepAtPointer = (row, clientX) => {
        const cells = [...panel.querySelectorAll(`.chord-sequencer-cell[data-row="${row}"]`)];
        return cells.reduce((nearest, cell, step) => {
          const rect = cell.getBoundingClientRect();
          const distance = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0;
          return distance < nearest.distance ? { step, distance } : nearest;
        }, { step: 0, distance: Infinity }).step;
      };
      const beginCellDrag = (event) => {
        if (event.button !== 0 && event.pointerType === 'mouse') return;
        const cell = event.currentTarget;
        cellDrag = { pointerId: event.pointerId, row: Number(cell.dataset.row), start: Number(cell.dataset.step), moved: false, startedAt: performance.now(), startX: event.clientX, startY: event.clientY };
        try { cell.setPointerCapture?.(event.pointerId); } catch (_) { /* 合成指针事件没有活动指针时可忽略 */ }
      };
      const updateCellDrag = (event) => {
        if (!cellDrag || cellDrag.pointerId !== event.pointerId || performance.now() - cellDrag.startedAt < 220) return;
        const cells = panel.querySelectorAll(`.chord-sequencer-cell[data-row="${cellDrag.row}"]`);
        const rowRect = cells[0]?.parentElement?.getBoundingClientRect();
        if (!rowRect || event.clientY < rowRect.top || event.clientY > rowRect.bottom) return;
        const end = stepAtPointer(cellDrag.row, event.clientX);
        const movedPixels = Math.hypot(event.clientX - cellDrag.startX, event.clientY - cellDrag.startY);
        if (end === cellDrag.start && movedPixels < 4) return;
        cellDrag.moved = true;
        cellDrag.end = end;
        paintBlock(cellDrag.row, Math.min(cellDrag.start, end), Math.abs(end - cellDrag.start) + 1);
      };
      const finishCellDrag = (event) => {
        if (!cellDrag || cellDrag.pointerId !== event.pointerId) return;
        if (cellDrag.moved) {
          paintBlock(cellDrag.row, Math.min(cellDrag.start, cellDrag.end), Math.abs(cellDrag.end - cellDrag.start) + 1);
          skipCellClickUntil = performance.now() + 100;
          event.preventDefault();
        }
        cellDrag = null;
      };

      const render = () => {
        const modeControls = modeSelectable ? `<div class="suite-mode-controls"><div><span>Key</span>${Object.keys(modePitchClasses).map((key) => `<button type="button" class="mode-track-button${sharedTransport.key === key ? ' active' : ''}" data-suite-key="${key}">${key}</button>`).join('')}</div><div><span>Mode</span>${Object.keys(modeIntervals).map((mode) => `<button type="button" class="mode-track-button${sharedTransport.mode === mode ? ' active' : ''}" data-suite-mode="${mode}">${mode}</button>`).join('')}</div></div>` : '';
        panel.innerHTML = `<div class="chord-sequencer-title-row"><h3>${title}</h3>${modeControls}</div><div class="chord-sequencer-header"><div class="chord-transport-group"><button class="chord-transport-button" type="button" data-play aria-label="播放或暂停${title}">${state.playing ? '❚❚' : '▶'}</button><button class="chord-stop-button" type="button" data-stop aria-label="停止${title}并回到开头">■</button><label class="chord-bpm-wrap"><span>BPM</span><output>${state.bpm}</output><input type="range" min="40" max="240" step="1" value="${state.bpm}" data-bpm aria-label="${title} BPM 调节器"></label></div><button class="chord-clear-button" type="button" data-clear>Clear</button></div><div class="chord-sequencer-shell"><div class="chord-sequencer-track"><div class="chord-sequencer-ruler"><span>拍</span>${Array.from({ length: STEPS }, (_, step) => `<button type="button" data-seek="${step}" class="${step % 4 === 0 ? 'is-beat' : ''}" aria-label="跳到第 ${step + 1} 格">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}</div><div class="chord-sequencer-grid">${trackRows.map(([label], rowIndex) => `<div class="chord-sequencer-row"><b>${label}</b>${Array.from({ length: STEPS }, (_, step) => { const block = blockAt(rowIndex, step); return `<button type="button" class="chord-sequencer-cell ${dividerSteps.has(step) ? 'is-divider' : ''} ${state.pattern[rowIndex].has(step) ? 'is-active' : ''} ${block ? 'is-merged' : ''} ${block?.start === step ? 'is-merged-start' : ''} ${block?.start + block?.length - 1 === step ? 'is-merged-end' : ''}" data-row="${rowIndex}" data-step="${step}" aria-label="${title} ${label} 第 ${step + 1} 格" aria-pressed="${state.pattern[rowIndex].has(step)}"></button>`; }).join('')}</div>`).join('')}<i class="chord-playhead" aria-hidden="true"></i></div></div></div><p class="chord-sequencer-hint">长按同一行并横向拖动可合并长音；点击已点亮片段可取消，同一行可建立多个片段。</p>`;
        bind();
      };

      const paint = (position) => {
        const cells = panel.querySelectorAll('.chord-sequencer-row:first-of-type .chord-sequencer-cell');
        const head = panel.querySelector('.chord-playhead');
        const track = panel.querySelector('.chord-sequencer-track');
        const first = cells[0];
        if (!first || !head || !track) return;
        const trackRect = track.getBoundingClientRect();
        const firstRect = first.getBoundingClientRect();
        const lastRect = cells[cells.length - 1].getBoundingClientRect();
        const travel = lastRect.right - firstRect.left;
        head.style.display = 'block';
        head.style.left = `${firstRect.left - trackRect.left}px`;
        head.style.transform = `translateX(${Math.min(Math.max(position, 0), STEPS - 0.001) / STEPS * travel}px)`;
        panel.querySelectorAll('.chord-sequencer-ruler button').forEach((button) => button.classList.toggle('is-current', Number(button.dataset.seek) === Math.floor(position)));
      };

      const stop = () => {
        if (sharedTransport) {
          if (sharedTransport.clock) sharedTransport.clock.stop();
          sharedTransport.clock = null;
          sharedTransport.states.forEach((item) => { item.clock = null; item.playing = false; item.render?.(); });
          sharedTransport.listeners.forEach((listener) => listener('stop'));
          render();
          return;
        }
        if (state.clock) state.clock.stop();
        state.clock = null;
        state.playing = false;
        render();
      };

      const playTrackStep = (step, at) => {
        if (step === 'stop' || step === 'end') return;
        trackRows.forEach(([, notes], rowIndex) => {
          const block = blockAt(rowIndex, step);
          if (block && block.start !== step) return;
          if (state.pattern[rowIndex].has(step)) notes.forEach((note) => audio.play(source(note), { at, gain: chordGain(activeCountAt(step)), duration: noteDuration(block?.length || 1), synth: true }));
        });
        paint(step);
      };

      const start = () => {
        if (state.playing) return;
        if (sharedTransport) {
          if (sharedTransport.clock) return;
          if (!sharedTransport.listeners.includes(playTrackStep)) sharedTransport.listeners.push(playTrackStep);
          sharedTransport.clock = audio.createClock({ bpm: sharedTransport.bpm, steps: STEPS, loop: true, onEnd: () => {
            sharedTransport.clock = null;
            sharedTransport.states.forEach((item) => { item.clock = null; item.playing = false; item.render?.(); });
            sharedTransport.listeners.forEach((listener) => listener('end'));
            render();
          }, onStep: (step, at) => sharedTransport.listeners.forEach((listener) => listener(step, at)) });
          sharedTransport.states.forEach((item) => { item.clock = sharedTransport.clock; item.playing = true; item.render?.(); });
          sharedTransport.clock.start();
          render();
          return;
        }
        state.clock = audio.createClock({ bpm: state.bpm, steps: STEPS, loop: !isOctaveTrack && !isTonesScaleTrack && !isModesScaleTrack, onEnd: () => {
          state.clock = null;
          state.playing = false;
          render();
        }, onStep: playTrackStep });
        state.clock.start();
        state.playing = true;
        render();
      };

      const bind = () => {
        panel.querySelector('[data-play]').addEventListener('click', () => state.playing ? stop() : start());
        panel.querySelector('[data-stop]').addEventListener('click', stop);
        if (modeSelectable) {
          panel.querySelectorAll('[data-suite-key]').forEach((button) => button.addEventListener('click', () => sharedTransport.setMode(button.dataset.suiteKey, sharedTransport.mode)));
          panel.querySelectorAll('[data-suite-mode]').forEach((button) => button.addEventListener('click', () => sharedTransport.setMode(sharedTransport.key, button.dataset.suiteMode)));
        }
        panel.querySelector('[data-bpm]').addEventListener('input', (event) => {
          state.bpm = Number(event.target.value);
          if (sharedTransport) {
            sharedTransport.bpm = state.bpm;
            sharedTransport.states.forEach((item) => { item.bpm = state.bpm; });
            if (sharedTransport.clock) sharedTransport.clock.setBpm(state.bpm);
            sharedTransport.bpmListeners.forEach((listener) => listener(state.bpm));
          } else if (state.clock) state.clock.setBpm(state.bpm);
          panel.querySelector('output').textContent = state.bpm;
        });
        panel.querySelector('[data-clear]').addEventListener('click', () => { state.blocks.clear(); state.pattern.forEach((row) => row.clear()); render(); });
        panel.querySelectorAll('.chord-sequencer-cell').forEach((cell) => cell.addEventListener('click', () => {
          if (skipCellClickUntil > performance.now()) return;
          const row = state.pattern[Number(cell.dataset.row)];
          const step = Number(cell.dataset.step);
          const rowIndex = Number(cell.dataset.row);
          const block = blockAt(rowIndex, step);
          if (block) {
            audio.unlock();
            trackRows[rowIndex][1].forEach((note) => audio.play(source(note), { gain: chordGain(activeCountAt(step)), duration: noteDuration(), synth: true }));
            removeBlock(block);
            return;
          }
          row.has(step) ? row.delete(step) : row.add(step);
          updateCell(rowIndex, step);
          if (!state.playing && row.has(step)) {
            audio.unlock();
            trackRows[rowIndex][1].forEach((note) => audio.play(source(note), { gain: chordGain(activeCountAt(step)), duration: noteDuration(), synth: true }));
          }
        }));
        panel.querySelectorAll('.chord-sequencer-cell').forEach((cell) => {
          cell.addEventListener('pointerdown', beginCellDrag);
          cell.addEventListener('pointermove', updateCellDrag);
          cell.addEventListener('pointerup', finishCellDrag);
          cell.addEventListener('pointercancel', () => { cellDrag = null; });
        });
        panel.querySelectorAll('[data-seek]').forEach((button) => button.addEventListener('click', () => {
          const step = Number(button.dataset.seek);
          if (state.clock) state.clock.seek(step);
          paint(step);
        }));
      };

      if (modeSelectable) {
        sharedTransport.modeListeners.push((key, mode) => {
          trackRows = modeRowsFor(key, mode, theme === 'is-bass' ? 1 : 4);
          audio.load(trackRows.flatMap(([, notes]) => notes.map(source)));
          render();
        });
      }

      const fillProgression = (groups, button) => {
        state.blocks.clear();
        state.pattern.forEach((row) => row.clear());
        const finalLength = Number(button?.dataset?.chordFinalLength || 0);
        const mergeLast = Number(button?.dataset?.chordMergeLast || 0);
        const groupsToFill = finalLength && groups.length
          ? groups
          : mergeLast && groups.length >= 2
          ? [...groups.slice(0, -2), [...new Set(groups.at(-2).concat(groups.at(-1)))]]
          : groups;
        groupsToFill.forEach((group, groupIndex) => {
          const start = groupIndex * 4;
          const length = groupIndex === groupsToFill.length - 1 && (finalLength || mergeLast)
            ? finalLength || mergeLast
            : 4;
          group.forEach((note) => {
            const rowIndex = trackRows.findIndex(([label]) => label === note);
            if (rowIndex >= 0) paintBlock(rowIndex, start, length);
          });
        });
        render();
      };

      state.render = render;
      render();
      trackLab.appendChild(panel);
      return { fillProgression, fillBlocks, panel, start, stop, setBpm: (bpm) => {
        const slider = panel.querySelector('[data-bpm]');
        if (!slider) return;
        slider.value = String(bpm);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      } };
    };

    let progressionTrack = null;
    let chordTrack = null;
    if (isOctaveTrack) {
      createTrack({ title: '尝试', theme: 'is-chords', rows: scaleRows, gain: 0.5, isChord: true });
    } else if (isProgressionTrack) {
      progressionTrack = createTrack({ title: 'C 大调和弦音轨 · C3–C5 · 16 steps', theme: 'is-chords', rows: scaleRows, gain: 0.5, isChord: true, defaultBpm: 40 });
    } else if (isTonesScaleTrack || isModesScaleTrack) {
      chordTrack = createTrack({ title: isModesScaleTrack ? '七种常见调式编写 · C3-B4 · 16 steps' : '自然大小调编写 · C3-B4 · 16 steps', theme: 'is-chords', rows: scaleRows, gain: 0.5, isChord: true, defaultBpm: 72 });
    } else if (isChordsOnlyTrack || isChords32Track) {
      chordTrack = createTrack({ title: isChords32Track ? '和弦连接 · C3-C5 · 32 steps' : '和弦', theme: 'is-chords', rows: scaleRows, gain: 0.5, isChord: true, defaultBpm: isChords32Track ? 40 : 96 });
    } else if (isBassExampleTrack) {
      chordTrack = createTrack({ title: '贝斯', theme: 'is-bass', rows: bassRows, gain: 0.78, defaultBpm: 80 });
    } else if (isBassSuiteTrack) {
      chordTrack = createTrack({ title: '和弦', theme: 'is-chords', rows: scaleRows, gain: 0.5, isChord: true, modeSelectable: true });
      createTrack({ title: '贝斯', theme: 'is-bass', rows: bassRows, gain: 0.78, modeSelectable: true });
    } else {
      createTrack({ title: 'Chords 音轨', theme: 'is-chords', rows: scaleRows, gain: 0.5, isChord: true });
      createTrack({ title: 'Basslines 音轨', theme: 'is-bass', rows: scaleRows, gain: 0.78 });
    }

    if (progressionTrack || (isChords32Track && chordTrack)) {
      const exampleTrack = progressionTrack || chordTrack;
      document.querySelectorAll('[data-chord-progression]').forEach((button) => {
        button.addEventListener('click', () => {
          const groups = button.dataset.chordProgression.split('|').map((group) => group.split(',').filter(Boolean));
          exampleTrack.fillProgression(groups, button);
        });
      });
    }

    if (isBassExampleTrack && chordTrack) {
      document.querySelector('[data-bass-example-fill]')?.addEventListener('click', () => {
        chordTrack.fillProgression([['C3'], ['C3'], ['G3'], ['A3']], null);
      });
    }

    if (isTonesScaleTrack && chordTrack) {
      window.MusicLabScaleTrack = chordTrack;
    }
    if (isModesScaleTrack && chordTrack) {
      window.MusicLabModesTrack = chordTrack;
    }

    if (chordTrack && sharedTransport) {
      window.MusicLabChordTransport = {
        start: chordTrack.start,
        stop: chordTrack.stop,
        setBpm: chordTrack.setBpm,
        subscribe: (listener) => sharedTransport.listeners.push(listener),
        subscribeBpm: (listener) => sharedTransport.bpmListeners.push(listener)
      };
    }

    const practice = document.querySelector('[data-interval-track-practice]');
    if (practice && isOctaveTrack) {
      const panel = trackLab.querySelector('.chord-sequencer-panel');
      const startButton = practice.querySelector('[data-interval-practice-start]');
      const question = practice.querySelector('[data-interval-practice-question]');
      const feedback = practice.querySelector('[data-interval-practice-feedback]');
      const intervalNames = ['纯一度', '小二度', '大二度', '小三度', '大三度', '纯四度', '增四度', '纯五度', '小六度', '大六度', '小七度', '大七度', '纯八度'];
      const noteNames = scaleRows.map(([note]) => note);
      const noteLabel = (note) => note.replace('b', '♭').slice(0, -1);
      const candidates = noteNames.flatMap((root, rootRow) => Array.from({ length: rootRow + 1 }, (_, semitones) => ({ root, rootRow, semitones, target: noteNames[rootRow - semitones], label: intervalNames[semitones] }))).filter(({ semitones }) => semitones > 0);
      let questions = [];
      let questionIndex = -1;
      let current = null;
      let nextTimer = null;

      const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);
      const setFeedback = (text, type = '') => {
        feedback.textContent = text;
        feedback.className = `interval-practice-feedback${type ? ` is-${type}` : ''}`;
      };
      const nextQuestion = () => {
        if (nextTimer) { window.clearTimeout(nextTimer); nextTimer = null; }
        questionIndex += 1;
        if (questionIndex >= 8) {
          current = null;
          question.textContent = '八题完成！按下“重新开始”再来一轮。';
          startButton.textContent = '重新开始';
          setFeedback('');
          return;
        }
        current = questions[questionIndex];
        panel.querySelector('[data-clear]')?.click();
        question.textContent = `第 ${questionIndex + 1} / 8 题：写出${noteLabel(current.root)}为根音的${current.label}音程。`;
        setFeedback('');
      };
      const getPattern = () => {
        const pattern = [];
        panel.querySelectorAll('.chord-sequencer-row').forEach((row, rowIndex) => {
          const cells = [...row.querySelectorAll('.chord-sequencer-cell')];
          const active = cells.filter((cell) => cell.classList.contains('is-active'));
          const starts = cells.filter((cell) => cell.classList.contains('is-merged-start'));
          const ends = cells.filter((cell) => cell.classList.contains('is-merged-end'));
          if (active.length || starts.length || ends.length) pattern.push({ rowIndex, active, starts, ends });
        });
        return pattern;
      };
      const isCorrect = () => {
        if (!current) return false;
        const pattern = getPattern();
        if (pattern.length !== 2) return false;
        const expectedRows = [current.rootRow, current.rootRow - current.semitones].sort((a, b) => a - b);
        const actualRows = pattern.map(({ rowIndex }) => rowIndex).sort((a, b) => a - b);
        if (expectedRows.some((row, index) => row !== actualRows[index])) return false;
        return pattern.every(({ active, starts, ends }) => active.length === 4 && starts.length === 1 && ends.length === 1 && starts[0].dataset.step === '0' && ends[0].dataset.step === '3');
      };

      startButton.addEventListener('click', () => {
        questions = shuffle(candidates).slice(0, 8);
        questionIndex = -1;
        current = null;
        startButton.textContent = '重新开始';
        nextQuestion();
      });
      panel.addEventListener('click', (event) => {
        const playButton = event.target.closest('[data-play]');
        if (!playButton || !current) return;
        if (!isCorrect()) {
          event.stopImmediatePropagation();
          setFeedback('不对，再试试吧！', 'wrong');
          return;
        }
        setFeedback('正确！', 'correct');
        nextTimer = window.setTimeout(nextQuestion, 760);
      }, true);
    }

    const chordPractice = document.querySelector('[data-chord-track-practice]');
    if (chordPractice && isOctaveTrack) {
      const panel = trackLab.querySelector('.chord-sequencer-panel');
      let practiceMode = null;
      const startButton = chordPractice.querySelector('[data-chord-practice-start]');
      const question = chordPractice.querySelector('[data-chord-practice-question]');
      const feedback = chordPractice.querySelector('[data-chord-practice-feedback]');
      const chordTypes = [
        { name: '大三和弦', offsets: [0, 4, 7] },
        { name: '小三和弦', offsets: [0, 3, 7] },
        { name: '增三和弦', offsets: [0, 4, 8] },
        { name: '减三和弦', offsets: [0, 3, 6] }
      ];
      const noteNames = scaleRows.map(([note]) => note);
      const noteLabel = (note) => note.replace('b', '♭');
      const candidates = noteNames.flatMap((root, rootRow) => chordTypes
        .filter(({ offsets }) => Math.max(...offsets) <= rootRow)
        .map((type) => ({ root, rootRow, ...type })));
      let questions = [];
      let questionIndex = -1;
      let current = null;
      let nextTimer = null;
      const shuffle = (items) => {
        const result = [...items];
        for (let index = result.length - 1; index > 0; index -= 1) {
          const swapIndex = Math.floor(Math.random() * (index + 1));
          [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
        }
        return result;
      };
      const selectQuestionsFrom = (items) => {
        const groups = [...new Set(items.map(({ rootRow }) => rootRow))]
          .map((rootRow) => shuffle(items.filter((candidate) => candidate.rootRow === rootRow)));
        const selected = [];
        while (selected.length < 8 && groups.some((group) => group.length)) {
          shuffle(groups.filter((group) => group.length)).forEach((group) => {
            if (selected.length < 8 && group.length) selected.push(group.pop());
          });
        }
        return shuffle(selected);
      };
      const selectQuestions = () => selectQuestionsFrom(candidates);
      const setFeedback = (text, type = '') => {
        feedback.textContent = text;
        feedback.className = `interval-practice-feedback${type ? ` is-${type}` : ''}`;
      };
      const getPattern = () => [...panel.querySelectorAll('.chord-sequencer-row')].reduce((result, row, rowIndex) => {
        const cells = [...row.querySelectorAll('.chord-sequencer-cell')];
        const active = cells.filter((cell) => cell.classList.contains('is-active'));
        const starts = cells.filter((cell) => cell.classList.contains('is-merged-start'));
        const ends = cells.filter((cell) => cell.classList.contains('is-merged-end'));
        if (active.length || starts.length || ends.length) result.push({ rowIndex, active, starts, ends });
        return result;
      }, []);
      const isCorrect = () => {
        if (!current) return false;
        const pattern = getPattern();
        if (pattern.length !== 3) return false;
        const expectedRows = [current.rootRow, ...current.offsets.slice(1).map((offset) => current.rootRow - offset)].sort((a, b) => a - b);
        const actualRows = pattern.map(({ rowIndex }) => rowIndex).sort((a, b) => a - b);
        if (expectedRows.some((row, index) => row !== actualRows[index])) return false;
        return pattern.every(({ active, starts, ends }) => active.length === 4 && starts.length === 1 && ends.length === 1 && starts[0].dataset.step === '0' && ends[0].dataset.step === '3');
      };
      const nextQuestion = () => {
        if (nextTimer) { window.clearTimeout(nextTimer); nextTimer = null; }
        questionIndex += 1;
        if (questionIndex >= 8) {
          current = null;
          question.textContent = '八题完成！按下“重新开始”再来一轮。';
          startButton.textContent = '重新开始';
          setFeedback('');
          return;
        }
        current = questions[questionIndex];
        panel.querySelector('[data-clear]')?.click();
        question.textContent = `第 ${questionIndex + 1} / 8 题：写出${noteLabel(current.root)}${current.name}。`;
        setFeedback('');
      };
      startButton.addEventListener('click', () => {
        practiceMode = 'triad';
        questions = selectQuestions();
        questionIndex = -1;
        current = null;
        startButton.textContent = '重新开始';
        nextQuestion();
      });
      panel.addEventListener('click', (event) => {
        const playButton = event.target.closest('[data-play]');
        if (!playButton || practiceMode !== 'triad' || !current) return;
        if (!isCorrect()) {
          event.stopImmediatePropagation();
          setFeedback('不对，再试试吧！', 'wrong');
          return;
        }
        setFeedback('正确！', 'correct');
        nextTimer = window.setTimeout(nextQuestion, 760);
      }, true);

      const seventhPractice = document.querySelector('[data-seventh-track-practice]');
      if (seventhPractice) {
        const seventhStart = seventhPractice.querySelector('[data-seventh-practice-start]');
        const seventhQuestion = seventhPractice.querySelector('[data-seventh-practice-question]');
        const seventhFeedback = seventhPractice.querySelector('[data-seventh-practice-feedback]');
        const seventhTypes = [
          { name: '大七和弦', offsets: [0, 4, 7, 11] },
          { name: '属七和弦', offsets: [0, 4, 7, 10] },
          { name: '小七和弦', offsets: [0, 3, 7, 10] },
          { name: '半减七和弦', offsets: [0, 3, 6, 10] },
          { name: '减七和弦', offsets: [0, 3, 6, 9] }
        ];
        const seventhCandidates = noteNames.flatMap((root, rootRow) => seventhTypes
          .filter(({ offsets }) => Math.max(...offsets) <= rootRow)
          .map((type) => ({ root, rootRow, ...type })));
        let seventhQuestions = [];
        let seventhIndex = -1;
        let seventhCurrent = null;
        let seventhTimer = null;
        const seventhFeedbackSet = (text, type = '') => {
          seventhFeedback.textContent = text;
          seventhFeedback.className = `interval-practice-feedback${type ? ` is-${type}` : ''}`;
        };
        const seventhNext = () => {
          if (seventhTimer) { window.clearTimeout(seventhTimer); seventhTimer = null; }
          seventhIndex += 1;
          if (seventhIndex >= 8) {
            seventhCurrent = null;
            seventhQuestion.textContent = '八题完成！按下“重新开始”再来一轮。';
            seventhStart.textContent = '重新开始';
            seventhFeedbackSet('');
            return;
          }
          seventhCurrent = seventhQuestions[seventhIndex];
          panel.querySelector('[data-clear]')?.click();
          seventhQuestion.textContent = `第 ${seventhIndex + 1} / 8 题：写出${noteLabel(seventhCurrent.root)}${seventhCurrent.name}。`;
          seventhFeedbackSet('');
        };
        const seventhCorrect = () => {
          if (!seventhCurrent) return false;
          const pattern = getPattern();
          if (pattern.length !== 4) return false;
          const expectedRows = [seventhCurrent.rootRow, ...seventhCurrent.offsets.slice(1).map((offset) => seventhCurrent.rootRow - offset)].sort((a, b) => a - b);
          const actualRows = pattern.map(({ rowIndex }) => rowIndex).sort((a, b) => a - b);
          if (expectedRows.some((row, index) => row !== actualRows[index])) return false;
          return pattern.every(({ active, starts, ends }) => active.length === 4 && starts.length === 1 && ends.length === 1 && starts[0].dataset.step === '0' && ends[0].dataset.step === '3');
        };
        seventhStart.addEventListener('click', () => {
          practiceMode = 'seventh';
          seventhQuestions = selectQuestionsFrom(seventhCandidates);
          seventhIndex = -1;
          seventhCurrent = null;
          seventhStart.textContent = '重新开始';
          seventhNext();
        });
        panel.addEventListener('click', (event) => {
          const playButton = event.target.closest('[data-play]');
          if (!playButton || practiceMode !== 'seventh' || !seventhCurrent) return;
          if (!seventhCorrect()) {
            event.stopImmediatePropagation();
            seventhFeedbackSet('不对，再试试吧！', 'wrong');
            return;
          }
          seventhFeedbackSet('正确！', 'correct');
          seventhTimer = window.setTimeout(seventhNext, 760);
        }, true);
      }
    }
  }

  window.MusicLabChords = { playNotes, source };
})();