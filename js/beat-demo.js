/*
 * 节奏基础章节共用脚本（beat.html / beat-instruments.html / beat-track.html）
 *  - 乐器试听块（.beat-instrument-button[data-audio]）
 *  - 节奏型预设（[data-rhythm]）
 *  - Beat 音轨演示（.beat-demo-wrapper），含可控制的播放线：
 *      ▶ / ❚❚ 暂停后保留位置，■ 停止回到开头，
 *      点击 / 拖动顶部步进标尺可把播放线直接移到任意一拍（播放中也可以）。
 * 页面上没有对应元素时，相应功能会自动跳过。
 */
(() => {
  'use strict';

  const AUDIO_SOURCES = {
    kick: '../audio/beats/kick.wav',
    snare: '../audio/beats/snare.wav',
    'open-hat': '../audio/beats/open-hat.wav',
    'closed-hat': '../audio/beats/closed-hat.wav',
    tom: '../audio/beats/Tom.wav',
    crash: '../audio/beats/crash.wav',
    ride: '../audio/beats/ride.wav',
    clap: '../audio/beats/clap.wav'
  };

  const audioCache = {};
  const getAudio = (src) => {
    if (!audioCache[src]) {
      const audio = new Audio(src);
      audio.preload = 'auto';
      audio.volume = 1;
      audioCache[src] = audio;
    }
    return audioCache[src];
  };

  const playSource = (src, label = '') => {
    const audio = getAudio(src);
    audio.currentTime = 0;
    const request = audio.play();
    if (request) request.catch((error) => console.error(`${label} 音频播放失败:`, error));
  };

  const flash = (button) => {
    button.classList.remove('is-flashing');
    void button.offsetWidth;
    button.classList.add('is-flashing');
    window.setTimeout(() => button.classList.remove('is-flashing'), 180);
  };

  /* ---------------- 乐器试听 ---------------- */
  document.querySelectorAll('.beat-instrument-button[data-audio]').forEach((button) => {
    getAudio(button.dataset.audio);
    button.addEventListener('click', () => {
      flash(button);
      playSource(button.dataset.audio, button.textContent);
    });
  });

  /* ---------------- Beat 音轨演示 ---------------- */
  const wrappers = [...document.querySelectorAll('.beat-demo-wrapper')];
  if (!wrappers.length) return;
  wrappers.forEach((wrapper) => {

  const beatPlayButton = wrapper.querySelector('.beat-demo-play');
  const beatStopButton = wrapper.querySelector('.beat-demo-stop');
  const beatBpmSlider = wrapper.querySelector('.beat-demo-slider');
  const beatBpmValue = wrapper.querySelector('.beat-demo-value');
  const beatClearButton = wrapper.querySelector('.beat-demo-clear');
  const beatMeterButtons = [...wrapper.querySelectorAll('.beat-demo-meter-button')];
  const rhythmButtons = [...document.querySelectorAll('[data-rhythm]')];
  const beatShell = wrapper.querySelector('.beat-demo-shell');
  const beatGrid = wrapper.querySelector('.beat-demo-grid');
  const beatPlayhead = wrapper.querySelector('.beat-demo-playhead');
  const beatCheck = wrapper.querySelector('.beat-demo-check');

  let beatSteps = wrapper.dataset.demoVariant === 'meter-basics' ? 8 : wrapper.dataset.demoVariant === 'bass-rhythm' ? 32 : 16;
  let beatCells = [];
  let beatActive = [];
  let rulerCells = [];

  const beatTracks = wrapper.dataset.demoVariant === 'bass-rhythm' ? [
    ['Kick', AUDIO_SOURCES.kick],
    ['Snare', AUDIO_SOURCES.snare]
  ] : wrapper.dataset.demoVariant === 'meter-basics' ? [
    ['Tom', AUDIO_SOURCES.tom],
    ['Snare', AUDIO_SOURCES.snare],
    ['Closed-Hat', AUDIO_SOURCES['closed-hat']]
  ] : ['song-example', 'twinkle-example'].includes(wrapper.dataset.demoVariant) ? [
    ['Kick', AUDIO_SOURCES.kick],
    ['Snare', AUDIO_SOURCES.snare],
    ['Clap', AUDIO_SOURCES.clap]
  ] : [
    ['Kick', AUDIO_SOURCES.kick],
    ['Snare', AUDIO_SOURCES.snare],
    ['Open-Hat', AUDIO_SOURCES['open-hat']],
    ['Closed-Hat', AUDIO_SOURCES['closed-hat']],
    ['Tom', AUDIO_SOURCES.tom],
    ['Crash', AUDIO_SOURCES.crash],
    ['Ride', AUDIO_SOURCES.ride],
    ['Clap', AUDIO_SOURCES.clap]
  ];
  beatTracks.forEach(([, src]) => getAudio(src));

  const rhythmPatterns = {
    'bass-example': { steps: 32, bpm: 80, pattern: { 0: [1, 9, 17, 25], 1: [5, 13, 21, 29] } },
    basic: { steps: 16, bpm: 80, pattern: { 0: [1, 9], 1: [5, 13], 3: [3, 7, 11, 15] } },
    'meter-2-4': { steps: 4, bpm: 80, pattern: { 0: [1], 2: [3] } },
    'meter-3-4': { steps: 6, bpm: 80, pattern: { 0: [1], 2: [3, 5] } },
    'meter-4-4': { steps: 8, bpm: 80, pattern: { 0: [1], 1: [5], 2: [3, 7] } },
    'we-will-rock-you': { steps: 16, bpm: 80, pattern: { 0: [1, 3, 9, 11], 1: [5 , 13], 2: [5, 13] } },
    jazz: { steps: 24, bpm: 80, pattern: { 0: [1, 6, 7, 12, 13, 18, 19, 24], 1: [4, 10, 16, 22], 2: [23], 3: [3, 9, 15, 21], 6: [11], 7: [4, 10, 16, 22] } },
    samba: { steps: 16, bpm: 130, pattern: { 0: [1, 5, 9, 13], 1: [4, 7, 12, 15], 2: [10], 3: [3, 8, 11, 16], 4: [6], 7: [4, 12] } },
    tango: { steps: 16, bpm: 65, pattern: { 0: [1, 7, 9, 14, 16], 1: [5, 13], 2: [6, 14], 3: [2, 7, 10, 15], 4: [4, 8, 12] } },
    waltz: { steps: 24, bpm: 140, pattern: { 0: [1], 1: [5, 9, 17, 21], 2: [13], 3: [4, 12, 20], 6: [13] } },
    funk: { steps: 16, bpm: 95, pattern: { 0: [1, 6, 10, 12, 14], 1: [3, 7, 11, 15], 2: [5, 13], 3: [2, 4, 6, 8, 10, 12, 14, 16] } },
    rock: { steps: 16, bpm: 110, pattern: { 0: [1, 9], 1: [5, 13], 2: [5, 13], 3: [2, 3, 4, 6, 7, 8, 10, 11, 12, 14, 15, 16], 5: [5, 13] } }
  };

  const updateBeatCheck = () => {
    if (!beatCheck || wrapper.dataset.demoVariant !== 'song-example') return;
    const preset = rhythmPatterns['we-will-rock-you'];
    const patternMatches = beatSteps === preset.steps && beatTracks.every(([,], rowIndex) => {
      const expected = new Set((preset.pattern[rowIndex] || []).map((step) => step - 1));
      return beatActive[rowIndex].every((active, step) => active === expected.has(step));
    });
    beatCheck.textContent = patternMatches
      ? beatState.bpm === 80 ? '没错！就是这样！' : '没错！就是这样。现在调节至合适的BPM吧！'
      : '';
    beatCheck.classList.toggle('is-visible', patternMatches);
  };

  const beatState = {
    bpm: Number(beatBpmSlider.value),
    currentStep: 0,
    playing: false,
    animationFrameId: null,
    lastFrameTime: 0,
    stepAccumulator: 0,
    playheadStartX: 0,
    playheadStepWidth: 1,
    scrubbing: false
  };

  // .beat-demo-track：横向滚动的内容区（标尺 + 网格 + 播放线），小屏时不再把格子挤变形
  let beatTrack = beatShell.querySelector('.beat-demo-track');
  if (!beatTrack) {
    beatTrack = document.createElement('div');
    beatTrack.className = 'beat-demo-track';
    while (beatShell.firstChild) beatTrack.appendChild(beatShell.firstChild);
    beatShell.appendChild(beatTrack);
  }

  // 步进标尺：每一格对应一拍，点击 / 拖动可以定位播放线
  let ruler = wrapper.querySelector('.beat-demo-ruler');
  if (!ruler) {
    ruler = document.createElement('div');
    ruler.className = 'beat-demo-ruler';
    ruler.setAttribute('aria-label', '播放位置标尺：点击或拖动可移动播放线');
    beatTrack.insertBefore(ruler, beatGrid);
  }

  const renderRuler = () => {
    beatTrack.style.setProperty('--beat-step-count', String(beatSteps));
    ruler.style.setProperty('--beat-step-count', String(beatSteps));
    ruler.innerHTML = `<div class="beat-demo-ruler-label">拍</div>${Array.from({ length: beatSteps }, (_, index) =>
      `<button class="beat-demo-ruler-cell${index % 4 === 0 ? ' is-beat' : ''}" type="button" data-step="${index}" aria-label="跳到第 ${index + 1} 格">${index % 4 === 0 ? index / 4 + 1 : '·'}</button>`
    ).join('')}`;
    rulerCells = [...ruler.querySelectorAll('.beat-demo-ruler-cell')];
  };

  const renderBeatGrid = () => {
    beatGrid.style.setProperty('--beat-step-count', String(beatSteps));
    beatGrid.innerHTML = beatTracks.map(([name]) => `
      <div class="beat-demo-row">
        <div class="beat-demo-label-cell">${name}</div>
        ${Array.from({ length: beatSteps }, (_, index) =>
          `<button class="beat-demo-cell" type="button" aria-pressed="false" aria-label="${name} 第 ${index + 1} 拍"></button>`
        ).join('')}
      </div>`).join('');
    [4, 8, 12, ...(beatSteps === 24 ? [16, 20] : [])].forEach((boundary) => {
      const divider = document.createElement('div');
      divider.className = 'beat-demo-divider';
      divider.dataset.boundary = String(boundary);
      beatGrid.appendChild(divider);
    });
    beatCells = [...beatGrid.querySelectorAll('.beat-demo-row')].map((row) => [...row.querySelectorAll('.beat-demo-cell')]);
    beatActive = beatCells.map((row) => row.map(() => false));
    renderRuler();
  };

  const updateBeatDividers = () => {
    const gridRect = beatGrid.getBoundingClientRect();
    const firstRowCells = beatCells[0];
    beatGrid.querySelectorAll('.beat-demo-divider').forEach((divider) => {
      const boundary = Number(divider.dataset.boundary);
      const leftCell = firstRowCells[boundary - 1];
      const rightCell = firstRowCells[boundary];
      if (!leftCell || !rightCell) return;
      divider.style.left = `${((leftCell.getBoundingClientRect().right + rightCell.getBoundingClientRect().left) / 2) - gridRect.left}px`;
    });
  };

  const measureBeatPlayhead = () => {
    const shellRect = beatTrack.getBoundingClientRect();
    const firstCell = beatCells[0]?.[0];
    const secondCell = beatCells[0]?.[1];
    if (!firstCell || !secondCell) return;
    beatState.playheadStartX = firstCell.getBoundingClientRect().left - shellRect.left;
    beatState.playheadStepWidth = secondCell.getBoundingClientRect().left - firstCell.getBoundingClientRect().left;
    beatPlayhead.style.left = `${beatState.playheadStartX}px`;
  };

  const stepDurationMs = () => (60000 / beatState.bpm) / 4;

  const updateBeatPlayhead = () => {
    const stepProgress = Math.min(beatState.stepAccumulator / stepDurationMs(), 0.999);
    const position = (beatState.currentStep + stepProgress) % beatSteps;
    beatPlayhead.style.transform = `translate3d(${position * beatState.playheadStepWidth}px, 0, 0)`;
    rulerCells.forEach((cell, index) => cell.classList.toggle('is-current', index === beatState.currentStep));
  };

  const playInstrumentAtStep = (rowIndex, step) => {
    const [name, src] = beatTracks[rowIndex] || [];
    if (!src || !beatActive[rowIndex]?.[step]) return;
    playSource(src, name);
  };

  const playSoundsAtStep = (step) => beatTracks.forEach((_, rowIndex) => playInstrumentAtStep(rowIndex, step));

  const setPlayButton = () => { beatPlayButton.textContent = beatState.playing ? '❚❚' : '▶'; };

  // 暂停：停在当前位置，播放线保持可见
  const pauseBeatPlayback = () => {
    if (beatState.animationFrameId) {
      window.cancelAnimationFrame(beatState.animationFrameId);
      beatState.animationFrameId = null;
    }
    beatState.playing = false;
    beatState.lastFrameTime = 0;
    setPlayButton();
  };

  // 停止：回到第一拍并隐藏播放线
  const stopBeatPlayback = () => {
    pauseBeatPlayback();
    beatState.currentStep = 0;
    beatState.stepAccumulator = 0;
    beatPlayhead.style.display = 'none';
    updateBeatPlayhead();
  };

  const animateBeatPlayback = (timestamp) => {
    if (!beatState.playing) return;
    if (!beatState.lastFrameTime) beatState.lastFrameTime = timestamp;

    const duration = stepDurationMs();
    beatState.stepAccumulator += timestamp - beatState.lastFrameTime;
    beatState.lastFrameTime = timestamp;

    while (beatState.stepAccumulator >= duration) {
      beatState.stepAccumulator -= duration;
      beatState.currentStep = (beatState.currentStep + 1) % beatSteps;
      playSoundsAtStep(beatState.currentStep);
    }
    updateBeatPlayhead();
    beatState.animationFrameId = window.requestAnimationFrame(animateBeatPlayback);
  };

  // 从当前位置继续播放（首次播放即第一拍）
  const startBeatPlayback = () => {
    if (beatState.playing) return;
    beatState.playing = true;
    beatState.lastFrameTime = performance.now();
    setPlayButton();
    measureBeatPlayhead();
    beatPlayhead.style.display = 'block';
    updateBeatPlayhead();
    if (beatState.stepAccumulator === 0) playSoundsAtStep(beatState.currentStep);
    beatState.animationFrameId = window.requestAnimationFrame(animateBeatPlayback);
  };

  // 把播放线移到指定格；播放中会从这一格继续
  const seekToStep = (step) => {
    const target = ((Math.round(step) % beatSteps) + beatSteps) % beatSteps;
    beatState.currentStep = target;
    beatState.stepAccumulator = 0;
    beatState.lastFrameTime = beatState.playing ? performance.now() : 0;
    measureBeatPlayhead();
    beatPlayhead.style.display = 'block';
    updateBeatPlayhead();
    if (beatState.playing) playSoundsAtStep(target);
  };

  const stepFromPointer = (clientX) => {
    const firstRect = rulerCells[0]?.getBoundingClientRect();
    const lastRect = rulerCells[rulerCells.length - 1]?.getBoundingClientRect();
    if (!firstRect || !lastRect) return 0;
    const ratio = (clientX - firstRect.left) / Math.max(lastRect.right - firstRect.left, 1);
    return Math.min(beatSteps - 1, Math.max(0, Math.floor(ratio * beatSteps)));
  };

  ruler.addEventListener('pointerdown', (event) => {
    if (event.button !== 0 && event.pointerType === 'mouse') return;
    beatState.scrubbing = true;
    try { ruler.setPointerCapture(event.pointerId); } catch (_) { /* 非标准指针（如自动化测试）忽略 */ }
    seekToStep(stepFromPointer(event.clientX));
  });
  ruler.addEventListener('pointermove', (event) => {
    if (!beatState.scrubbing) return;
    const step = stepFromPointer(event.clientX);
    if (step !== beatState.currentStep) seekToStep(step);
  });
  const endScrub = () => { beatState.scrubbing = false; };
  ruler.addEventListener('pointerup', endScrub);
  ruler.addEventListener('pointercancel', endScrub);
  ruler.addEventListener('keydown', (event) => {
    if (!event.target.matches('.beat-demo-ruler-cell')) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); seekToStep(beatState.currentStep + 1); rulerCells[beatState.currentStep]?.focus(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); seekToStep(beatState.currentStep - 1); rulerCells[beatState.currentStep]?.focus(); }
  });

  const bindBeatCellEvents = () => {
    beatCells.forEach((row, rowIndex) => {
      row.forEach((cell, step) => {
        cell.addEventListener('click', () => {
          const isActive = cell.classList.toggle('active');
          beatActive[rowIndex][step] = isActive;
          cell.setAttribute('aria-pressed', String(isActive));
          updateBeatCheck();
          if (isActive && !beatState.playing) playInstrumentAtStep(rowIndex, step);
        });
      });
    });
  };

  const rebuildGrid = (nextSteps, keepActive) => {
    const previous = keepActive ? beatActive.map((row) => [...row]) : null;
    beatSteps = nextSteps;
    renderBeatGrid();
    if (previous) {
      beatCells.forEach((row, rowIndex) => row.forEach((cell, step) => {
        const isActive = previous[rowIndex]?.[step] || false;
        beatActive[rowIndex][step] = isActive;
        cell.classList.toggle('active', isActive);
        cell.setAttribute('aria-pressed', String(isActive));
      }));
    }
    bindBeatCellEvents();
    beatMeterButtons.forEach((item) => item.classList.toggle('active', Number(item.dataset.steps) === beatSteps));
    updateBeatDividers();
    measureBeatPlayhead();
    updateBeatPlayhead();
  };

  const applyRhythmPattern = (patternName, shouldPlay = true) => {
    const preset = rhythmPatterns[patternName];
    if (!preset) return;

    stopBeatPlayback();
    if (preset.steps !== beatSteps) rebuildGrid(preset.steps, false);
    if (!['song-example', 'chords-sync'].includes(wrapper.dataset.demoVariant)) {
      beatState.bpm = preset.bpm;
      beatBpmSlider.value = String(preset.bpm);
      beatBpmValue.textContent = String(preset.bpm);
      if (syncTransport) syncTransport.setBpm(preset.bpm);
    }
    beatCells.flat().forEach((cell) => { cell.classList.remove('active'); cell.setAttribute('aria-pressed', 'false'); });
    beatActive = beatCells.map((row) => row.map(() => false));

    Object.entries(preset.pattern).forEach(([rowIndex, stepsList]) => {
      stepsList.forEach((oneBasedStep) => {
        const cell = beatCells[Number(rowIndex)]?.[oneBasedStep - 1];
        if (cell) {
          beatActive[Number(rowIndex)][oneBasedStep - 1] = true;
          cell.classList.add('active');
          cell.setAttribute('aria-pressed', 'true');
        }
      });
    });
    rhythmButtons.forEach((button) => button.classList.toggle('is-flashing', button.dataset.rhythm === patternName));
    window.setTimeout(() => rhythmButtons.forEach((button) => button.classList.remove('is-flashing')), 180);
    updateBeatCheck();
    wrapper.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    if (shouldPlay) startBeatPlayback();
  };

  rhythmButtons.forEach((button) => {
    if (!button.matches('.beat-demo-meter-button')) {
      button.addEventListener('click', () => applyRhythmPattern(button.dataset.rhythm));
    }
  });

  beatMeterButtons.forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.rhythm) {
        applyRhythmPattern(button.dataset.rhythm);
        return;
      }
      const nextSteps = Number(button.dataset.steps);
      if (nextSteps === beatSteps) return;
      const wasPlaying = beatState.playing;
      pauseBeatPlayback();
      beatState.currentStep = Math.min(beatState.currentStep, nextSteps - 1);
      rebuildGrid(nextSteps, true);
      if (wasPlaying) startBeatPlayback();
    });
  });

  const syncTransport = wrapper.dataset.syncClock === 'true' ? (window.MusicLabBassTransport || window.MusicLabChordTransport) : null;
  if (syncTransport) {
    window.MusicLabAudio?.load(beatTracks.map(([, src]) => src));
    syncTransport.subscribe((step, at) => {
      if (typeof step !== 'number') {
        beatState.playing = false;
        beatState.currentStep = 0;
        beatState.stepAccumulator = 0;
        beatPlayhead.style.display = 'none';
        setPlayButton();
        updateBeatPlayhead();
        return;
      }
      beatState.playing = true;
      beatState.currentStep = step;
      beatState.stepAccumulator = 0;
      beatState.lastFrameTime = 0;
      beatPlayhead.style.display = 'block';
      beatTracks.forEach(([, src], rowIndex) => {
        if (beatActive[rowIndex]?.[step]) window.MusicLabAudio?.play(src, { at, gain: 0.8 });
      });
      measureBeatPlayhead();
      updateBeatPlayhead();
      setPlayButton();
    });
    syncTransport.subscribeBpm((bpm) => {
      beatState.bpm = bpm;
      beatBpmSlider.value = String(bpm);
      beatBpmValue.textContent = String(bpm);
      updateBeatPlayhead();
    });
    beatPlayButton.addEventListener('click', () => (beatState.playing ? syncTransport.stop() : syncTransport.start()));
    if (beatStopButton) beatStopButton.addEventListener('click', () => syncTransport.stop());
    beatBpmSlider.addEventListener('input', (event) => syncTransport.setBpm(Number(event.target.value)));
  } else {
    beatPlayButton.addEventListener('click', () => (beatState.playing ? pauseBeatPlayback() : startBeatPlayback()));
    if (beatStopButton) beatStopButton.addEventListener('click', stopBeatPlayback);

    beatBpmSlider.addEventListener('input', (event) => {
      beatState.bpm = Number(event.target.value);
      beatBpmValue.textContent = String(beatState.bpm);
      beatState.lastFrameTime = beatState.playing ? performance.now() : 0;
      beatState.stepAccumulator = 0;
      updateBeatPlayhead();
      updateBeatCheck();
    });
  }

  beatClearButton.addEventListener('click', () => {
    beatCells.flat().forEach((cell) => { cell.classList.remove('active'); cell.setAttribute('aria-pressed', 'false'); });
    beatActive = beatCells.map((row) => row.map(() => false));
    updateBeatCheck();
  });

  renderBeatGrid();
  bindBeatCellEvents();
  if (wrapper.dataset.demoPreset) applyRhythmPattern(wrapper.dataset.demoPreset, false);
  updateBeatCheck();
  updateBeatDividers();
  measureBeatPlayhead();
  updateBeatPlayhead();
  window.addEventListener('resize', () => { updateBeatDividers(); measureBeatPlayhead(); updateBeatPlayhead(); });
  });
})();
