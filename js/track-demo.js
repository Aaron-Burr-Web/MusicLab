/*
 * 教程首页「四轨示例」播放器（js/track-demo.js）
 * 用项目里已有的鼓采样（audio/*.wav）和钢琴采样（audio/piano/*.wav）实时演奏
 * 4 种节奏 / 4 条贝斯 / 4 组和弦 / 4 段旋律。每列最多选一个，所有列共用一个节拍器，
 * 因此任意组合都能对齐——这正是课文里“尝试着把它们组合起来”的用意。
 * 全部素材都是 C 大调、16 步（4 拍）、100 BPM 循环。
 */
(() => {
  'use strict';

  const grid = document.querySelector('.audio-demo-grid');
  if (!grid) return;

  const BPM = 100;
  const STEPS = 16;
  const DRUM = {
    kick: '../audio/kick.wav',
    snare: '../audio/snare.wav',
    hat: '../audio/closed-hat.wav',
    open: '../audio/open-hat.wav',
    clap: '../audio/clap.wav',
    ride: '../audio/ride.wav'
  };
  const piano = (note) => `../audio/piano/piano-${note}.wav`;

  // 每一步要触发的采样（数组下标 = 步序 0..15）
  const drums = (map) => Array.from({ length: STEPS }, (_, i) =>
    Object.entries(map).filter(([, steps]) => steps.includes(i)).map(([name]) => DRUM[name]));
  const notes = (map) => Array.from({ length: STEPS }, (_, i) =>
    (map[i] || []).map(piano));
  const chordSeq = (hits) => {
    // hits: [[step, [notes]], ...]
    const map = {};
    hits.forEach(([step, chord]) => { map[step] = chord; });
    return notes(map);
  };

  const C = ['C4', 'E4', 'G4'], G = ['B3', 'D4', 'G4'], Am = ['A3', 'C4', 'E4'], F = ['A3', 'C4', 'F4'];

  const PATTERNS = {
    rhythm: [
      { name: '基础摇滚', steps: drums({ kick: [0, 8], snare: [4, 12], hat: [0, 2, 4, 6, 8, 10, 12, 14] }) },
      { name: '四四踩点', steps: drums({ kick: [0, 4, 8, 12], clap: [4, 12], hat: [2, 6, 10], open: [14] }) },
      { name: '嘻哈律动', steps: drums({ kick: [0, 3, 6, 10], snare: [4, 12], hat: [0, 2, 4, 6, 7, 8, 10, 12, 14, 15] }) },
      { name: '轻爵士', steps: drums({ kick: [0, 3, 8, 11], ride: [0, 2, 4, 6, 8, 10, 12, 14], clap: [6, 14] }) }
    ],
    bass: [
      { name: '根音长音', steps: notes({ 0: ['C3'], 4: ['G3'], 8: ['A3'], 12: ['F3'] }) },
      { name: '行走低音', steps: notes({ 0: ['C3'], 2: ['C3'], 4: ['E3'], 6: ['G3'], 8: ['A3'], 10: ['A3'], 12: ['F3'], 14: ['G3'] }) },
      { name: '切分低音', steps: notes({ 0: ['C3'], 3: ['C3'], 6: ['C3'], 8: ['A3'], 11: ['A3'], 12: ['F3'], 14: ['G3'] }) },
      { name: '八度跳跃', steps: notes({ 0: ['C3'], 2: ['G3'], 4: ['A3'], 6: ['E3'], 8: ['F3'], 10: ['C3'], 12: ['D3'], 14: ['G3'] }) }
    ],
    chords: [
      { name: 'I–V–vi–IV 长音', steps: chordSeq([[0, C], [4, G], [8, Am], [12, F]]) },
      { name: 'I–V–vi–IV 扫弦', steps: chordSeq([[0, C], [2, C], [4, G], [6, G], [8, Am], [10, Am], [12, F], [14, F]]) },
      { name: 'I–IV–V–I', steps: chordSeq([[0, C], [4, F], [8, G], [12, C]]) },
      { name: 'vi–IV–I–V 切分', steps: chordSeq([[0, Am], [3, Am], [4, F], [7, F], [8, C], [11, C], [12, G], [15, G]]) }
    ],
    melody: [
      { name: '平稳级进', steps: notes({ 0: ['E4'], 2: ['G4'], 4: ['A4'], 6: ['G4'], 8: ['E4'], 10: ['D4'], 12: ['C4'] }) },
      { name: '下行再上行', steps: notes({ 0: ['C5'], 2: ['B4'], 4: ['A4'], 6: ['G4'], 8: ['A4'], 10: ['B4'], 12: ['C5'] }) },
      { name: '重复动机', steps: notes({ 0: ['G4'], 1: ['G4'], 2: ['A4'], 4: ['G4'], 6: ['E4'], 8: ['C4'], 10: ['D4'], 12: ['E4'] }) },
      { name: '跳进旋律', steps: notes({ 0: ['E4'], 1: ['F4'], 2: ['G4'], 4: ['C5'], 6: ['B4'], 8: ['A4'], 10: ['G4'], 12: ['F4'], 14: ['E4'] }) }
    ]
  };
  const TRACK_LABEL = { rhythm: '节奏', bass: '贝斯', chords: '和弦', melody: '旋律' };

  /* ---------------- 采样池：同一采样可以叠加播放 ---------------- */
  const pools = {};
  const POOL_SIZE = 4;
  const getVoice = (src) => {
    if (!pools[src]) {
      pools[src] = { index: 0, voices: Array.from({ length: POOL_SIZE }, () => {
        const audio = new Audio(src);
        audio.preload = 'auto';
        return audio;
      }) };
    }
    const pool = pools[src];
    const voice = pool.voices[pool.index];
    pool.index = (pool.index + 1) % POOL_SIZE;
    return voice;
  };
  const trigger = (src, volume = 1) => {
    const voice = getVoice(src);
    voice.volume = volume;
    voice.currentTime = 0;
    const request = voice.play();
    if (request) request.catch(() => { /* 用户尚未与页面交互时会被浏览器拦下，忽略 */ });
  };
  // 预热：把所有会用到的采样都建好池子，首次播放不掉拍
  Object.values(PATTERNS).flat().forEach((p) => p.steps.flat().forEach((src) => getVoice(src)));
  const VOLUME = { rhythm: 1, bass: 0.9, chords: 0.55, melody: 0.8 };

  /* ---------------- 状态 ---------------- */
  const selection = { rhythm: null, bass: null, chords: null, melody: null }; // 每列选中的变体下标
  const state = { playing: false, step: 0, acc: 0, last: 0, raf: null };
  const stepMs = () => (60000 / BPM) / 4;

  const buttons = [...grid.querySelectorAll('.audio-demo-button')];
  buttons.forEach((button) => {
    // 兼容旧标记：从 class / aria-label 推断音轨与序号
    if (!button.dataset.track) button.dataset.track = ['rhythm', 'bass', 'chords', 'melody'].find((t) => button.classList.contains(t)) || 'rhythm';
    if (!button.dataset.variant) button.dataset.variant = String((parseInt(button.textContent, 10) || 1) - 1);
    const pattern = PATTERNS[button.dataset.track][Number(button.dataset.variant)];
    button.title = `${TRACK_LABEL[button.dataset.track]} ${Number(button.dataset.variant) + 1}：${pattern.name}`;
    button.setAttribute('aria-pressed', 'false');
    button.removeAttribute('data-audio');
  });

  /* ---------------- 控制条 ---------------- */
  const panel = grid.closest('.audio-demo-panel');
  const bar = document.createElement('div');
  bar.className = 'audio-demo-bar';
  bar.innerHTML = `
    <span class="audio-demo-status" id="audioDemoStatus" aria-live="polite">点一个按钮开始试听，每列可以各选一个进行组合</span>
    <button type="button" class="ml-btn small secondary" id="audioDemoStop" hidden>■ 全部停止</button>`;
  panel.appendChild(bar);
  const statusEl = bar.querySelector('#audioDemoStatus');
  const stopButton = bar.querySelector('#audioDemoStop');

  const describe = () => {
    const parts = Object.entries(selection)
      .filter(([, v]) => v !== null)
      .map(([track, v]) => `${TRACK_LABEL[track]} ${v + 1}（${PATTERNS[track][v].name}）`);
    if (!parts.length) {
      statusEl.textContent = '点一个按钮开始试听，每列可以各选一个进行组合';
      stopButton.hidden = true;
      return;
    }
    statusEl.textContent = `正在播放：${parts.join(' + ')}　·　${BPM} BPM`;
    stopButton.hidden = false;
  };

  /* ---------------- 播放循环 ---------------- */
  const playStep = (step) => {
    Object.entries(selection).forEach(([track, variant]) => {
      if (variant === null) return;
      PATTERNS[track][variant].steps[step].forEach((src) => trigger(src, VOLUME[track]));
    });
    buttons.forEach((b) => b.classList.toggle('is-beat', b.classList.contains('is-active') && step % 4 === 0));
  };

  const tick = (now) => {
    if (!state.playing) return;
    if (!state.last) state.last = now;
    state.acc += now - state.last;
    state.last = now;
    const duration = stepMs();
    while (state.acc >= duration) {
      state.acc -= duration;
      state.step = (state.step + 1) % STEPS;
      playStep(state.step);
    }
    state.raf = requestAnimationFrame(tick);
  };

  const start = () => {
    if (state.playing) return;
    state.playing = true;
    state.step = 0;
    state.acc = 0;
    state.last = 0;
    panel.classList.add('is-playing');
    playStep(0);
    state.raf = requestAnimationFrame(tick);
  };

  const stop = () => {
    state.playing = false;
    if (state.raf) cancelAnimationFrame(state.raf);
    state.raf = null;
    panel.classList.remove('is-playing');
    buttons.forEach((b) => b.classList.remove('is-beat'));
  };

  const hasSelection = () => Object.values(selection).some((v) => v !== null);

  const select = (track, variant) => {
    // 再点一次同一个按钮 = 关掉这一列
    selection[track] = selection[track] === variant ? null : variant;
    buttons.forEach((b) => {
      const on = selection[b.dataset.track] === Number(b.dataset.variant);
      b.classList.toggle('is-active', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (hasSelection()) {
      if (!state.playing) start();
    } else {
      stop();
    }
    describe();
  };

  buttons.forEach((button) => {
    button.addEventListener('click', () => select(button.dataset.track, Number(button.dataset.variant)));
  });

  stopButton.addEventListener('click', () => {
    Object.keys(selection).forEach((k) => { selection[k] = null; });
    buttons.forEach((b) => { b.classList.remove('is-active'); b.setAttribute('aria-pressed', 'false'); });
    stop();
    describe();
  });

  // 切到别的标签页时暂停，回来接着播，避免后台堆积的定时器一次性“连发”
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { if (state.playing) { stop(); state.resume = true; } }
    else if (state.resume && hasSelection()) { state.resume = false; start(); }
  });
})();
