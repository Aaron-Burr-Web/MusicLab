(() => {
  const box = document.querySelector('.box');
  if (!box) return;

  const styles = document.createElement('style');
  styles.textContent = `
    .sequencer-panel {
      position: relative;
      width: min(1200px, calc(100% - 30px));
      margin: 0 auto;
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

    .sequencer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 0 6px 18px;
      margin-bottom: 4px;
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
      background: linear-gradient(135deg, #ffde59 0%, #f9c74f 100%);
      color: #1f1b15;
      font-size: 22px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: none;
      transition: none;
    }

    .transport-button.is-playing {
      background: linear-gradient(135deg, #ffd166 0%, #ffc857 100%);
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
      background: linear-gradient(90deg, #f6d864 0%, #f2c335 100%);
      border-radius: 999px;
      cursor: pointer;
      outline: none;
    }

    .bpm-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid rgba(56, 42, 8, 0.9);
      background: #f9d642;
      box-shadow: none;
      cursor: pointer;
    }

    .bpm-slider::-moz-range-thumb {
      width: 18px;
      height: 18px;
      border-radius: 50%;
      border: 2px solid rgba(56, 42, 8, 0.9);
      background: #f9d642;
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
      background: linear-gradient(135deg, #ffde59 0%, #f8c84b 100%);
      border-color: transparent;
      color: #1d1c1d;
      box-shadow: none;
    }

    .sequencer-shell {
      position: relative;
      padding: 18px 14px 18px;
      border-radius: 20px;
      background: rgba(235, 240, 250, 0.9);
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
      background: #f2d24f;
      box-shadow: none;
    }

    .sequencer-cell.is-divider.active {
      background: #f2d24f;
      border-left: 1px solid rgba(89, 99, 116, 0.75);
      box-shadow: none;
    }

    .playhead-line {
      position: absolute;
      top: 10px;
      bottom: 10px;
      width: 2px;
      border-radius: 10px;
      background: #f4c84f;
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

  // 外源音频导入位置：
  // 1. 把音频文件放到项目目录下的 /audio/ 文件夹；例如：/audio/demo-track.mp3
  // 2. 或放到 /assets/audio/；例如：/assets/audio/demo-track.mp3
  // 3. 在这里替换成对应的外部音源地址，并把本页面的合成音频逻辑关闭。
  // 例如：const externalAudioSrc = '../audio/demo-track.mp3';

  const panel = document.createElement('section');
  panel.className = 'sequencer-panel';
  panel.innerHTML = `
    <div class="sequencer-header">
      <div class="transport-group">
        <button class="transport-button" type="button" aria-label="播放/暂停">▶</button>
        <div class="bpm-wrap">
          <span class="bpm-label">BPM</span>
          <span class="bpm-value" id="bpmDisplay">60</span>
          <input class="bpm-slider" id="bpmSlider" type="range" min="40" max="240" step="1" value="60" aria-label="BPM调节器" />
        </div>
      </div>
      <div class="header-actions">
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
          <div class="status-pill" id="scaleStatus">C / Ionian</div>
        </div>
        <button class="clear-button" type="button" aria-label="清空全部交互块">Clear</button>
      </div>
    </div>

    <div class="sequencer-shell">
      <div class="sequencer-grid" id="sequencerGrid"></div>
      <div class="playhead-line" id="playheadLine"></div>
    </div>

  `;

  box.appendChild(panel);

  const grid = panel.querySelector('#sequencerGrid');
  const playheadLine = panel.querySelector('#playheadLine');
  const bpmDisplay = panel.querySelector('#bpmDisplay');
  const bpmSlider = panel.querySelector('#bpmSlider');
  const transportButton = panel.querySelector('.transport-button');
  const clearButton = panel.querySelector('.clear-button');
  const scaleStatus = panel.querySelector('#scaleStatus');
  const keyButtons = [...panel.querySelectorAll('[data-key]')];
  const modeButtons = [...panel.querySelectorAll('[data-mode]')];

  const state = {
    bpm: 60,
    currentStep: 0,
    playing: false,
    intervalId: null,
    animationFrameId: null,
    playheadRefreshFrame: null,
    lastFrameTime: 0,
    key: 'C',
    mode: 'Ionian',
    stepProgress: 0,
    playheadPosition: 0,
    playheadStartX: 0,
    playheadTravelWidth: 1
  };

  const metrics = {
    gap: 4,
    cellWidth: 0
  };

  const cellMatrix = [];
  const updateScaleStatus = () => {
    scaleStatus.textContent = `${state.key} / ${state.mode}`;
  };

  const fillPreset = () => {
    for (let rowIndex = 0; rowIndex < cellMatrix.length; rowIndex += 1) {
      for (let step = 0; step < cellMatrix[rowIndex].length; step += 1) {
        cellMatrix[rowIndex][step].classList.remove('active');
      }
    }
  };

  const renderGrid = () => {
    grid.innerHTML = '';
    cellMatrix.length = 0;

    const currentPitchNames = getModePitchNames(state.key, state.mode);
    for (let rowIndex = 0; rowIndex < currentPitchNames.length; rowIndex += 1) {
      const rowButtons = [];
      const row = document.createElement('div');
      row.className = 'sequencer-row';

      const label = document.createElement('div');
      label.className = 'pitch-label';
      label.textContent = currentPitchNames[rowIndex];
      row.appendChild(label);

      for (let step = 0; step < steps; step += 1) {
        const cell = document.createElement('button');
        cell.type = 'button';
        cell.className = 'sequencer-cell';
        if (dividerStepIndexes.has(step)) {
          cell.classList.add('is-divider');
        }
        cell.setAttribute('aria-label', `${currentPitchNames[rowIndex]} step ${step + 1}`);
        cell.dataset.rowIndex = String(rowIndex);
        cell.dataset.step = String(step);
        cell.addEventListener('click', () => {
          const currentValue = cell.classList.contains('active');
          cell.classList.toggle('active', !currentValue);
        });
        rowButtons.push(cell);
        row.appendChild(cell);
      }

      grid.appendChild(row);
      cellMatrix.push(rowButtons);
    }

    fillPreset();
  };

  const clearInteractionCells = () => {
    const currentPitchNames = getModePitchNames(state.key, state.mode);
    for (let rowIndex = 0; rowIndex < currentPitchNames.length; rowIndex += 1) {
      for (let step = 0; step < steps; step += 1) {
        if (cellMatrix[rowIndex] && cellMatrix[rowIndex][step]) {
          cellMatrix[rowIndex][step].classList.remove('active');
        }
      }
    }

    state.currentStep = 0;
    state.stepProgress = 0;
    state.playheadPosition = 0;
    updatePlayheadPosition();
  };

  const measureGridGeometry = () => {
    const shellRect = panel.querySelector('.sequencer-shell').getBoundingClientRect();
    const firstRow = grid.querySelector('.sequencer-row');
    const cells = firstRow ? firstRow.querySelectorAll('.sequencer-cell') : [];
    const firstCell = cells[0] || null;
    const lastCell = cells[steps - 1] || null;

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

  const schedulePlayheadRefresh = () => {
    if (state.playheadRefreshFrame !== null) return;
    state.playheadRefreshFrame = window.requestAnimationFrame(() => {
      state.playheadRefreshFrame = null;
      measureGridGeometry();
      updatePlayheadPosition();
    });
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
    state.stepProgress = 0;
    state.playheadPosition = state.currentStep;
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

    state.currentStep = Math.floor(state.playheadPosition) % steps;
    state.stepProgress = state.playheadPosition - state.currentStep;
    updatePlayheadPosition();

    // 外部音轨入口：
    // 把真正的音频文件放到 /audio/ 或 /assets/audio/ 后，
    // 在此处替换为 new Audio('../audio/demo-track.mp3') 或相应的 src。

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
    state.animationFrameId = window.requestAnimationFrame(animatePlayback);
  };

  transportButton.addEventListener('click', () => {
    if (state.playing) {
      stopPlayback();
      return;
    }
    startPlayback();
  });

  bpmSlider.addEventListener('input', (event) => {
    state.bpm = Number(event.target.value);
    bpmDisplay.textContent = String(state.bpm);

    if (state.playing) {
      state.lastFrameTime = performance.now();
    }
    schedulePlayheadRefresh();
  });

  clearButton.addEventListener('click', () => {
    clearInteractionCells();
    if (state.playing) {
      stopPlayback();
    }
  });

  keyButtons.forEach((button) => {
    button.addEventListener('click', () => {
      keyButtons.forEach((item) => item.classList.toggle('active', item === button));
      state.key = button.dataset.key || 'C';
      renderGrid();
      clearInteractionCells();
      updateScaleStatus();
      updatePlayheadPosition();
    });
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      modeButtons.forEach((item) => item.classList.toggle('active', item === button));
      state.mode = button.dataset.mode || 'Ionian';
      renderGrid();
      clearInteractionCells();
      updateScaleStatus();
      updatePlayheadPosition();
    });
  });

  renderGrid();
  clearInteractionCells();
  updateScaleStatus();
  bpmDisplay.textContent = String(state.bpm);
  measureGridGeometry();
  updatePlayheadPosition();
  window.addEventListener('resize', () => {
    measureGridGeometry();
    updatePlayheadPosition();
  });
})();
