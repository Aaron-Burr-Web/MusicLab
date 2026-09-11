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
      transition: transform 0.18s ease, box-shadow 0.18s ease;
    }

    .transport-button:hover {
      transform: translateY(-1px);
      box-shadow: 0 14px 22px rgba(249, 199, 79, 0.3);
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
      accent-color: #f4c84f;
      cursor: pointer;
    }

    .mode-switcher {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      flex-wrap: wrap;
      gap: 8px;
      margin-left: auto;
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
      transition: all 0.18s ease;
    }

    .mode-button:hover {
      background: rgba(244, 200, 79, 0.12);
      border-color: rgba(244, 200, 79, 0.38);
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
      gap: 8px;
      align-items: center;
      min-height: 230px;
      z-index: 1;
    }

    .sequencer-row {
      display: grid;
      grid-template-columns: 64px repeat(16, minmax(16px, 1fr));
      gap: 5px;
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
      border: none;
      border-radius: 0;
      background: #dfe4eb;
      box-shadow: none;
      cursor: pointer;
      transition: transform 0.15s ease, background 0.15s ease, box-shadow 0.15s ease;
    }

    .sequencer-cell:hover {
      transform: translateY(-1px);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.5), 0 8px 12px rgba(0, 0, 0, 0.04);
    }

    .sequencer-cell.active {
      background: linear-gradient(180deg, #fde96a 0%, #f4c84e 100%);
      box-shadow: inset 0 0 0 1px rgba(255,255,255,0.45), 0 10px 18px rgba(243, 195, 70, 0.2);
    }

    .playhead-line {
      position: absolute;
      top: 10px;
      bottom: 10px;
      width: 3px;
      border-radius: 999px;
      background: linear-gradient(180deg, rgba(255, 210, 62, 0.9), rgba(255, 169, 46, 0.9));
      box-shadow: 0 0 0 1px rgba(255,255,255,0.4), 0 0 14px rgba(255, 191, 74, 0.42);
      pointer-events: none;
      z-index: 2;
      display: none;
    }

    .audio-placeholder {
      margin-top: 18px;
      min-height: 120px;
      padding: 18px 20px;
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(241,243,247,0.65), rgba(230,234,241,0.76));
      border: 1px dashed rgba(96, 108, 135, 0.3);
      color: #58657a;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 6px;
      text-align: left;
    }

    .audio-placeholder strong {
      font-size: 16px;
      color: #363d4d;
    }

    .audio-placeholder span {
      font-size: 12px;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: rgba(88, 101, 122, 0.9);
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
        grid-template-columns: 58px repeat(16, minmax(22px, 1fr));
        gap: 6px;
      }

      .pitch-label {
        font-size: 12px;
      }
    }
  `;
  document.head.appendChild(styles);

  const steps = 16;
  const modeNoteOrder = {
    Ionian: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    Dorian: ['D', 'E', 'F', 'G', 'A', 'B', 'C'],
    Phrygian: ['E', 'F', 'G', 'A', 'B', 'C', 'D'],
    Lydian: ['F', 'G', 'A', 'B', 'C', 'D', 'E'],
    Mixolydian: ['G', 'A', 'B', 'C', 'D', 'E', 'F'],
    Aeolian: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    Locrian: ['B', 'C', 'D', 'E', 'F', 'G', 'A']
  };

  const getModePitchNames = (mode = 'Ionian') => {
    const rotation = modeNoteOrder[mode] || modeNoteOrder.Ionian;
    const labels = [];
    for (let octave = 2; octave <= 4; octave += 1) {
      rotation.forEach((note) => labels.push(`${note}${octave}`));
    }
    return labels;
  };

  const pitchNames = getModePitchNames();
  const initialPattern = Array.from({ length: pitchNames.length }, (_, rowIndex) => {
    return Array.from({ length: steps }, (_, stepIndex) => Number(((stepIndex + rowIndex) % 4 === 0) || ((stepIndex + rowIndex) % 8 === 3)));
  });

  const state = {
    bpm: 120,
    currentStep: 0,
    playing: false,
    intervalId: null,
    audioContext: null,
    mode: 'Ionian'
  };

  const panel = document.createElement('section');
  panel.className = 'sequencer-panel';
  panel.innerHTML = `
    <div class="sequencer-header">
      <div class="transport-group">
        <button class="transport-button" type="button" aria-label="播放/暂停">▶</button>
        <div class="bpm-wrap">
          <span class="bpm-label">BPM</span>
          <span class="bpm-value" id="bpmDisplay">120</span>
          <input class="bpm-slider" id="bpmSlider" type="range" min="40" max="240" step="1" value="120" aria-label="BPM调节器" />
        </div>
      </div>
      <div class="mode-switcher" aria-label="调式切换">
        <button class="mode-button active" type="button" data-mode="Ionian">Ionian</button>
        <button class="mode-button" type="button" data-mode="Dorian">Dorian</button>
        <button class="mode-button" type="button" data-mode="Phrygian">Phrygian</button>
        <button class="mode-button" type="button" data-mode="Lydian">Lydian</button>
        <button class="mode-button" type="button" data-mode="Mixolydian">Mixolydian</button>
        <button class="mode-button" type="button" data-mode="Aeolian">Aeolian</button>
        <button class="mode-button" type="button" data-mode="Locrian">Locrian</button>
      </div>
    </div>

    <div class="sequencer-shell">
      <div class="sequencer-grid" id="sequencerGrid"></div>
      <div class="playhead-line" id="playheadLine"></div>
    </div>

    <div class="audio-placeholder" aria-label="音频区占位">
      <strong>Audio Track Placeholder</strong>
      <span>Import audio later</span>
      <small>此处预留音频区域，之后可替换为实际音轨文件。</small>
    </div>
  `;

  box.appendChild(panel);

  const grid = panel.querySelector('#sequencerGrid');
  const playheadLine = panel.querySelector('#playheadLine');
  const bpmDisplay = panel.querySelector('#bpmDisplay');
  const bpmSlider = panel.querySelector('#bpmSlider');
  const transportButton = panel.querySelector('.transport-button');
  const modeButtons = [...panel.querySelectorAll('.mode-button')];

  const cellMatrix = [];
  const renderGrid = () => {
    grid.innerHTML = '';
    cellMatrix.length = 0;

    const currentPitchNames = getModePitchNames(state.mode);
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

  const fillPreset = () => {
    const currentPitchNames = getModePitchNames(state.mode);
    for (let rowIndex = 0; rowIndex < currentPitchNames.length; rowIndex += 1) {
      for (let step = 0; step < steps; step += 1) {
        const isActive = Boolean(initialPattern[rowIndex][step]);
        if (cellMatrix[rowIndex] && cellMatrix[rowIndex][step]) {
          cellMatrix[rowIndex][step].classList.toggle('active', isActive);
        }
      }
    }
  };

  const getAudioContext = () => {
    if (!state.audioContext) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return null;
      state.audioContext = new Ctx();
    }

    if (state.audioContext.state === 'suspended') {
      state.audioContext.resume();
    }

    return state.audioContext;
  };

  const noteToFrequency = (noteLabel) => {
    const match = /^([A-G])([0-9])$/.exec(noteLabel);
    if (!match) return 440;

    const [, noteName, octaveText] = match;
    const semitoneMap = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
    const midi = (Number(octaveText) + 1) * 12 + semitoneMap[noteName];
    return 440 * Math.pow(2, (midi - 69) / 12);
  };

  const triggerStepAudio = (stepIndex) => {
    const audioContext = getAudioContext();
    if (!audioContext) return;

    const activeRows = cellMatrix
      .map((row, rowIndex) => ({ rowIndex, active: row[stepIndex].classList.contains('active') }))
      .filter((item) => item.active)
      .map((item) => item.rowIndex);

    if (!activeRows.length) return;

    activeRows.forEach((rowIndex) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const noteLabel = getModePitchNames(state.mode)[rowIndex];
      const frequency = noteToFrequency(noteLabel);

      oscillator.type = 'triangle';
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.0001;
      gain.gain.exponentialRampToValueAtTime(0.045, audioContext.currentTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + 0.12);

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.14);
    });
  };

  const updatePlayheadPosition = () => {
    const shellRect = panel.querySelector('.sequencer-shell').getBoundingClientRect();
    const gridRect = grid.getBoundingClientRect();
    const gap = 8;
    const usableWidth = gridRect.width - ((steps - 1) * gap);
    const cellWidth = usableWidth / steps;
    const left = gridRect.left - shellRect.left + (state.currentStep + 0.5) * (cellWidth + gap);
    playheadLine.style.left = `${left}px`;
  };

  const stopPlayback = () => {
    if (state.intervalId) {
      window.clearInterval(state.intervalId);
      state.intervalId = null;
    }
    transportButton.classList.remove('is-playing');
    transportButton.textContent = '▶';
    state.playing = false;
    playheadLine.style.display = 'none';
  };

  const startPlayback = () => {
    if (state.playing) return;

    getAudioContext();
    state.playing = true;
    transportButton.classList.add('is-playing');
    transportButton.textContent = '❚❚';
    playheadLine.style.display = 'block';
    updatePlayheadPosition();

    const stepInterval = Math.round((60000 / state.bpm) / 4);
    state.intervalId = window.setInterval(() => {
      state.currentStep = (state.currentStep + 1) % steps;
      updatePlayheadPosition();
      triggerStepAudio(state.currentStep);
    }, stepInterval);
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
      stopPlayback();
      startPlayback();
    }
  });

  modeButtons.forEach((button) => {
    button.addEventListener('click', () => {
      modeButtons.forEach((item) => item.classList.toggle('active', item === button));
      state.mode = button.dataset.mode || 'Ionian';
      renderGrid();
      updatePlayheadPosition();
    });
  });

  renderGrid();
  bpmDisplay.textContent = String(state.bpm);
  updatePlayheadPosition();
  window.addEventListener('resize', updatePlayheadPosition);
})();
