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
      overflow: hidden;
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
      .sequencer-header {
        flex-direction: column;
        align-items: flex-start;
      }

      .mode-switcher {
        width: 100%;
        justify-content: flex-start;
      }

      .sequencer-grid {
        grid-template-columns: 58px repeat(32, minmax(12px, 1fr));
        gap: 6px;
      }

      .pitch-label {
        font-size: 12px;
      }
    }
  `;
  document.head.appendChild(styles);

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

  const getModePitchNames = (keyName = 'C', modeName = 'Ionian') => {
    const scale = getScaleNotes(keyName, modeName);
    const displayScale = [...scale, ...scale, scale[0]];
    return displayScale.slice(0, 15).reverse();
  };

  const createTrackPanel = ({ allowScaleControls = true, theme = 'yellow', title = '' } = {}) => {
    const panel = document.createElement('section');
    panel.className = `sequencer-panel${theme === 'yellow' ? '' : ` ${theme}-panel`}`;
    panel.innerHTML = `
      <h1 class="sequencer-title">${title}</h1>
      <div class="sequencer-header">
        <div class="transport-group">
          <button class="transport-button" type="button" aria-label="播放/暂停">▶</button>
          <div class="bpm-wrap">
            <span class="bpm-label">BPM</span>
            <span class="bpm-value">60</span>
            <input class="bpm-slider" type="range" min="40" max="240" step="1" value="60" aria-label="BPM调节器" />
          </div>
        </div>
        <div class="header-actions">
          ${allowScaleControls ? `
            <div class="selector-cluster">
              <div class="selector-column">
                <div class="selector-label">Key</div>
                <div class="mode-switcher" aria-label="音名调切换">
                  <button class="mode-button active" type="button" data-key="C">C</button>
                  <button class="mode-button" type="button" data-key="D">D</button>
                  <button class="mode-button" type="button" data-key="E">E</button>
                  <button class="mode-button" type="button" data-key="F">F</button>
                  <button class="mode-button" type="button" data-key="G">G</button>
                  <button class="mode-button" type="button" data-key="A">A</button>
                  <button class="mode-button" type="button" data-key="B">B</button>
                </div>
              </div>
              <div class="selector-column">
                <div class="selector-label">Mode</div>
                <div class="mode-switcher" aria-label="自然调式切换">
                  <button class="mode-button active" type="button" data-mode="Ionian">Ionian</button>
                  <button class="mode-button" type="button" data-mode="Dorian">Dorian</button>
                  <button class="mode-button" type="button" data-mode="Phrygian">Phrygian</button>
                  <button class="mode-button" type="button" data-mode="Lydian">Lydian</button>
                  <button class="mode-button" type="button" data-mode="Mixolydian">Mixolydian</button>
                  <button class="mode-button" type="button" data-mode="Aeolian">Aeolian</button>
                  <button class="mode-button" type="button" data-mode="Locrian">Locrian</button>
                </div>
              </div>
              <div class="status-pill">C / Ionian</div>
            </div>
          ` : ''}
          <button class="clear-button" type="button" aria-label="清空全部交互块">Clear</button>
        </div>
      </div>

      <div class="sequencer-shell">
        <div class="sequencer-grid"></div>
        <div class="playhead-line"></div>
      </div>
    `;

    const grid = panel.querySelector('.sequencer-grid');
    const playheadLine = panel.querySelector('.playhead-line');
    const bpmDisplay = panel.querySelector('.bpm-value');
    const bpmSlider = panel.querySelector('.bpm-slider');
    const transportButton = panel.querySelector('.transport-button');
    const clearButton = panel.querySelector('.clear-button');
    const statusPill = panel.querySelector('.status-pill');
    const keyButtons = [...panel.querySelectorAll('[data-key]')];
    const modeButtons = [...panel.querySelectorAll('[data-mode]')];

    const state = {
      bpm: 60,
      currentStep: 0,
      playing: false,
      animationFrameId: null,
      playheadRefreshFrame: null,
      lastFrameTime: 0,
      key: 'C',
      mode: 'Ionian',
      playheadPosition: 0,
      playheadStartX: 0,
      playheadTravelWidth: 1,
      lastTriggeredStep: null
    };

    const cellMatrix = [];
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
    const rowCount = theme === 'red' ? drumTracks.length : 15;
    const drumLabels = drumTracks.map(([label]) => label);
    const drumAudio = theme === 'red'
      ? drumTracks.map(([, source]) => {
        const audio = new Audio(source);
        audio.preload = 'auto';
        audio.volume = 1;
        return audio;
      })
      : [];

    const updateStatus = () => {
      if (statusPill) {
        statusPill.textContent = `${state.key} / ${state.mode}`;
      }
    };

    const renderGrid = () => {
      grid.innerHTML = '';
      cellMatrix.length = 0;

      const pitchNames = allowScaleControls
        ? getModePitchNames(state.key, state.mode)
        : drumLabels;

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
          if (dividerStepIndexes.has(step)) {
            cell.classList.add('is-divider');
          }
          cell.setAttribute('aria-label', `${pitchNames[rowIndex]} step ${step + 1}`);
          cell.addEventListener('click', () => {
            const isActive = cell.classList.toggle('active');
            cell.setAttribute('aria-pressed', String(isActive));
            if (isActive && theme === 'red' && !state.playing) {
              playDrumAtStep(rowIndex, step);
            }
          });
          rowButtons.push(cell);
          row.appendChild(cell);
        }

        grid.appendChild(row);
        cellMatrix.push(rowButtons);
      }
    };

    const clearInteractionCells = () => {
      for (let rowIndex = 0; rowIndex < cellMatrix.length; rowIndex += 1) {
        for (let step = 0; step < cellMatrix[rowIndex].length; step += 1) {
          cellMatrix[rowIndex][step].classList.remove('active');
        }
      }
      state.currentStep = 0;
      state.playheadPosition = 0;
      state.lastTriggeredStep = null;
      updatePlayheadPosition();
    };

    const playDrumAtStep = (rowIndex, step) => {
      const cell = cellMatrix[rowIndex]?.[step];
      const audio = drumAudio[rowIndex];
      if (theme !== 'red' || !cell?.classList.contains('active') || !audio) return;

      audio.currentTime = 0;
      audio.play().catch((error) => {
        console.error(`${drumLabels[rowIndex]} 音频播放失败:`, error);
      });
    };

    const playDrumsAtStep = (step) => {
      drumAudio.forEach((_, rowIndex) => playDrumAtStep(rowIndex, step));
    };

    const measureGridGeometry = () => {
      const shellRect = panel.querySelector('.sequencer-shell').getBoundingClientRect();
      const firstRow = grid.querySelector('.sequencer-row');
      const cells = firstRow ? firstRow.querySelectorAll('.sequencer-cell') : [];
      const firstCell = cells[0];
      const lastCell = cells[steps - 1];

      if (!firstCell || !lastCell) {
        state.playheadStartX = 0;
        state.playheadTravelWidth = 1;
        return;
      }

      state.playheadStartX = firstCell.getBoundingClientRect().left - shellRect.left;
      state.playheadTravelWidth = Math.max(
        lastCell.getBoundingClientRect().right - shellRect.left - state.playheadStartX,
        1
      );
    };

    const updatePlayheadPosition = () => {
      const position = Number.isFinite(state.playheadPosition) ? state.playheadPosition : state.currentStep;
      const clamped = Math.min(Math.max(position, 0), steps - 0.0001);
      const x = (clamped / steps) * state.playheadTravelWidth;

      playheadLine.style.left = `${state.playheadStartX}px`;
      playheadLine.style.transform = `translate3d(${x}px, 0, 0)`;
    };

    const stopPlayback = () => {
      if (state.animationFrameId) {
        window.cancelAnimationFrame(state.animationFrameId);
        state.animationFrameId = null;
      }
      transportButton.classList.remove('is-playing');
      transportButton.textContent = '▶';
      state.playing = false;
      state.lastFrameTime = 0;
      state.playheadPosition = state.currentStep;
      state.lastTriggeredStep = null;
      playheadLine.style.display = 'none';
    };

    const getStepDurationMs = () => (60000 / state.bpm) / 4;

    const animatePlayback = (timestamp) => {
      if (!state.playing) return;

      if (!state.lastFrameTime) {
        state.lastFrameTime = timestamp;
      }

      const stepDuration = getStepDurationMs();
      const elapsed = timestamp - state.lastFrameTime;
      state.lastFrameTime = timestamp;

      state.playheadPosition += elapsed / stepDuration;
      while (state.playheadPosition >= steps) {
        state.playheadPosition -= steps;
      }

      const nextStep = Math.floor(state.playheadPosition) % steps;
      if (theme === 'red' && state.lastTriggeredStep !== nextStep) {
        state.lastTriggeredStep = nextStep;
        playDrumsAtStep(nextStep);
      }
      state.currentStep = nextStep;
      updatePlayheadPosition();
      state.animationFrameId = window.requestAnimationFrame(animatePlayback);
    };

    const startPlayback = () => {
      if (state.playing) return;
      state.playing = true;
      state.lastFrameTime = performance.now();
      state.playheadPosition = Number.isFinite(state.playheadPosition) ? state.playheadPosition : state.currentStep;
      measureGridGeometry();
      transportButton.classList.add('is-playing');
      transportButton.textContent = '❚❚';
      playheadLine.style.display = 'block';
      updatePlayheadPosition();
      if (theme === 'red') {
        state.lastTriggeredStep = state.currentStep;
        playDrumsAtStep(state.currentStep);
      }
      state.animationFrameId = window.requestAnimationFrame(animatePlayback);
    };

    transportButton.addEventListener('click', () => {
      if (state.playing) {
        stopPlayback();
      } else {
        startPlayback();
      }
    });

    bpmSlider.addEventListener('input', (event) => {
      state.bpm = Number(event.target.value);
      bpmDisplay.textContent = String(state.bpm);
      if (state.playing) {
        state.lastFrameTime = performance.now();
      }
    });

    clearButton.addEventListener('click', () => {
      clearInteractionCells();
      if (state.playing) {
        stopPlayback();
      }
    });

    if (allowScaleControls) {
      keyButtons.forEach((button) => {
        button.addEventListener('click', () => {
          keyButtons.forEach((item) => item.classList.toggle('active', item === button));
          state.key = button.dataset.key || 'C';
          renderGrid();
          clearInteractionCells();
          updateStatus();
          updatePlayheadPosition();
        });
      });

      modeButtons.forEach((button) => {
        button.addEventListener('click', () => {
          modeButtons.forEach((item) => item.classList.toggle('active', item === button));
          state.mode = button.dataset.mode || 'Ionian';
          renderGrid();
          clearInteractionCells();
          updateStatus();
          updatePlayheadPosition();
        });
      });
    }

    renderGrid();
    clearInteractionCells();
    updateStatus();
    bpmDisplay.textContent = String(state.bpm);
    measureGridGeometry();
    updatePlayheadPosition();
    window.addEventListener('resize', () => {
      measureGridGeometry();
      updatePlayheadPosition();
    });

    return panel;
  };

  box.appendChild(createTrackPanel({ allowScaleControls: false, theme: 'red', title: '节奏' }));
  box.appendChild(createTrackPanel({ allowScaleControls: true, theme: 'yellow', title: '和弦' }));
  box.appendChild(createTrackPanel({ allowScaleControls: true, theme: 'light-green', title: '贝斯' }));
  box.appendChild(createTrackPanel({ allowScaleControls: true, theme: 'blue', title: '旋律' }));
})();
