/* 音程与和弦章节的试听与练习交互。 */
(() => {
  'use strict';

  const audio = window.MusicLabAudio;
  if (!audio) return;

  const source = (note) => `../audio/piano/piano-${note}.wav`;
  const playNotes = (notes, options = {}) => {
    const { delay = 0, gain = 0.72 } = options;
    audio.unlock();
    const startAt = delay ? audio.now() + delay : undefined;
    notes.forEach((note) => audio.play(source(note), { at: startAt, gain }));
  };

  document.querySelectorAll('[data-chord-audition]').forEach((button) => {
    const notes = button.dataset.chordAudition.split(',').filter(Boolean);
    audio.load(notes.map(source));
    button.addEventListener('click', () => {
      playNotes(notes);
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
      playNotes(['C3', target.dataset.note], { delay: 0.72 });
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
      playNotes(triad.notes);
      triadBuilder.querySelectorAll('button').forEach((item) => item.classList.toggle('is-selected', item === button));
      readout.innerHTML = `<b>${triad.title}</b><span>${triad.structure}</span>`;
    });
  }

  const trackLab = document.querySelector('[data-chord-track-lab]');
  if (trackLab) {
    const STEPS = 16;
    const dividerSteps = new Set([4, 8, 12]);
    // 两个工作台都使用 C 大调自然音阶：从底部 C3 向上到 C5，共两个八度、15 个单音。
    const scaleRows = ['C5', 'B4', 'A4', 'G4', 'F4', 'E4', 'D4', 'C4', 'B3', 'A3', 'G3', 'F3', 'E3', 'D3', 'C3']
      .map((note) => [note, [note]]);

    const createTrack = ({ title, theme, rows, gain }) => {
      const state = { bpm: 96, pattern: Array.from({ length: 15 }, () => new Set()), clock: null, playing: false };
      const panel = document.createElement('section');
      panel.className = `chord-sequencer-panel ${theme}`;
      audio.load(rows.flatMap(([, notes]) => notes.map(source)));

      const render = () => {
        panel.innerHTML = `<div class="chord-sequencer-title-row"><h3>${title}</h3></div><div class="chord-sequencer-header"><div class="chord-transport-group"><button class="chord-transport-button" type="button" data-play aria-label="播放或暂停${title}">${state.playing ? '❚❚' : '▶'}</button><button class="chord-stop-button" type="button" data-stop aria-label="停止${title}并回到开头">■</button><label class="chord-bpm-wrap"><span>BPM</span><output>${state.bpm}</output><input type="range" min="40" max="240" step="1" value="${state.bpm}" data-bpm aria-label="${title} BPM 调节器"></label></div><button class="chord-clear-button" type="button" data-clear>Clear</button></div><div class="chord-sequencer-shell"><div class="chord-sequencer-track"><div class="chord-sequencer-ruler"><span>拍</span>${Array.from({ length: STEPS }, (_, step) => `<button type="button" data-seek="${step}" class="${step % 4 === 0 ? 'is-beat' : ''}" aria-label="跳到第 ${step + 1} 格">${step % 4 === 0 ? step / 4 + 1 : '·'}</button>`).join('')}</div><div class="chord-sequencer-grid">${rows.map(([label], rowIndex) => `<div class="chord-sequencer-row"><b>${label}</b>${Array.from({ length: STEPS }, (_, step) => `<button type="button" class="chord-sequencer-cell ${dividerSteps.has(step) ? 'is-divider' : ''} ${state.pattern[rowIndex].has(step) ? 'is-active' : ''}" data-row="${rowIndex}" data-step="${step}" aria-label="${title} ${label} 第 ${step + 1} 格" aria-pressed="${state.pattern[rowIndex].has(step)}"></button>`).join('')}</div>`).join('')}<i class="chord-playhead" aria-hidden="true"></i></div></div></div><p class="chord-sequencer-hint">每四格是一拍。点击标尺可移动播放头，播放时仍可编辑方格。</p>`;
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
        if (state.clock) state.clock.stop();
        state.clock = null;
        state.playing = false;
        render();
      };

      const start = () => {
        if (state.playing) return;
        state.clock = audio.createClock({ bpm: state.bpm, steps: STEPS, onStep: (step, at) => {
          rows.forEach(([, notes], rowIndex) => {
            if (state.pattern[rowIndex].has(step)) notes.forEach((note) => audio.play(source(note), { at, gain }));
          });
          paint(step);
        } });
        state.clock.start();
        state.playing = true;
        render();
      };

      const bind = () => {
        panel.querySelector('[data-play]').addEventListener('click', () => state.playing ? stop() : start());
        panel.querySelector('[data-stop]').addEventListener('click', stop);
        panel.querySelector('[data-bpm]').addEventListener('input', (event) => {
          state.bpm = Number(event.target.value);
          if (state.clock) state.clock.setBpm(state.bpm);
          panel.querySelector('output').textContent = state.bpm;
        });
        panel.querySelector('[data-clear]').addEventListener('click', () => { state.pattern.forEach((row) => row.clear()); render(); });
        panel.querySelectorAll('.chord-sequencer-cell').forEach((cell) => cell.addEventListener('click', () => {
          const row = state.pattern[Number(cell.dataset.row)];
          const step = Number(cell.dataset.step);
          row.has(step) ? row.delete(step) : row.add(step);
          cell.classList.toggle('is-active', row.has(step));
          cell.setAttribute('aria-pressed', String(row.has(step)));
          if (!state.playing && row.has(step)) rows[Number(cell.dataset.row)][1].forEach((note) => audio.play(source(note), { gain }));
        }));
        panel.querySelectorAll('[data-seek]').forEach((button) => button.addEventListener('click', () => {
          const step = Number(button.dataset.seek);
          if (state.clock) state.clock.seek(step);
          paint(step);
        }));
      };

      render();
      trackLab.appendChild(panel);
    };

    createTrack({ title: 'Chords 音轨', theme: 'is-chords', rows: scaleRows, gain: 0.5 });
    createTrack({ title: 'Basslines 音轨', theme: 'is-bass', rows: scaleRows, gain: 0.78 });
  }

  window.MusicLabChords = { playNotes, source };
})();