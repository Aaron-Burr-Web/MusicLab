/*
 * 听音练习（js/ear-training.js）
 *
 * 用法：在教程页面里放一个容器，脚本会把整个练习渲染进去：
 *   <div data-ear-training="note"     data-title="听音找键" data-rounds="8"></div>
 *   <div data-ear-training="note-advanced" data-title="单音听辨（进阶版）" data-rounds="8"></div>
 *   <div data-ear-training="interval" ...></div>
 *   <div data-ear-training="chord"    ...></div>
 *
 * 三种模式：
 *   note     —— 先给一个基准音（C3），再放一个音，选出它的音名
 *   interval —— 放两个音，选出它们的音程（度数）
 *   chord    —— 同时放三个音，选出和弦性质（大三 / 小三 / 减 / 增 / 属七）
 *
 * 音源使用 sources 中的钢琴采样；有 MusicLabAudio 时走它（调度更准），
 * 没有则回退到 <audio>。每轮结束给出正确率，可以立即再来一轮。
 */
(() => {
  'use strict';

  const mounts = document.querySelectorAll('[data-ear-training]');
  if (!mounts.length) return;

  const ML = window.MusicLab;
  const AUDIO = window.MusicLabAudio || null;
  const esc = (ML && ML.escapeHTML) || ((v) => String(v));
  const scriptUrl = [...document.scripts].find((script) => script.src.endsWith('/ear-training.js'))?.src || document.baseURI;
  const pianoAudioRoot = new URL('../audio/piano/sources/', scriptUrl);

  /* ---------------- 音源 ---------------- */
  // 采样覆盖 C2–C5，且黑键以降号命名
  const SAMPLES = new Set(['C2', 'Db2', 'D2', 'Eb2', 'E2', 'F2', 'Gb2', 'G2', 'Ab2', 'A2', 'Bb2', 'B2',
    'C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3',
    'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4', 'C5']);
  const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];
  const midiToName = (midi) => `${FLAT_NAMES[((midi % 12) + 12) % 12]}${Math.floor(midi / 12) - 1}`;
  const srcOf = (midi) => {
    const name = midiToName(midi);
    return SAMPLES.has(name) ? new URL(`source-piano-${name}.wav`, pianoAudioRoot).href : null;
  };

  const fallbackPool = {};
  let playbackTimer = null;
  let playbackUntil = 0;
  const playbackDurations = { note: 3200, 'note-advanced': 3200, interval: 3100, chord: 2200, mode: 4100 };
  const setPlaybackButtons = (disabled) => {
    mounts.forEach((mount) => {
      mount.classList.toggle('is-audio-playing', disabled);
      mount.querySelectorAll('[data-ear-play], [data-ear-replay]').forEach((button) => {
        button.disabled = disabled;
        button.setAttribute('aria-disabled', String(disabled));
      });
    });
  };
  const beginPlayback = (type) => {
    const remaining = playbackUntil - performance.now();
    if (remaining > 0) return false;
    clearTimeout(playbackTimer);
    playbackUntil = performance.now() + (playbackDurations[type] || 6200);
    setPlaybackButtons(true);
    playbackTimer = window.setTimeout(() => {
      playbackUntil = 0;
      setPlaybackButtons(false);
    }, playbackUntil - performance.now());
    return true;
  };
  const playSrc = (src, delaySec = 0, gain = 0.9, durationSec = 2) => {
    if (!src) return;
    if (AUDIO) {
      AUDIO.unlock();
      AUDIO.play(src, { at: delaySec ? AUDIO.now() + delaySec : undefined, gain, duration: durationSec });
      return;
    }
    const fire = () => {
      if (!fallbackPool[src]) fallbackPool[src] = Array.from({ length: 3 }, () => { const a = new Audio(src); a.preload = 'auto'; return a; });
      const pool = fallbackPool[src];
      const voice = pool.shift();
      pool.push(voice);
      voice.volume = gain;
      voice.currentTime = 0;
      const req = voice.play();
      if (req) req.catch(() => {});
      window.setTimeout(() => {
        voice.pause();
        voice.currentTime = 0;
      }, durationSec * 1000);
    };
    if (delaySec > 0) setTimeout(fire, delaySec * 1000); else fire();
  };
  const preload = (midis) => {
    const srcs = midis.map(srcOf).filter(Boolean);
    if (AUDIO) AUDIO.load(srcs);
    else srcs.forEach((s) => { if (!fallbackPool[s]) fallbackPool[s] = Array.from({ length: 3 }, () => { const a = new Audio(s); a.preload = 'auto'; return a; }); });
  };

  /* ---------------- 题库 ---------------- */
  const C3 = 48;                                   // 中央 C
  const NOTE_RANGE = [0, 2, 4, 5, 7, 9, 11, 12].map((offset) => C3 + offset); // C3-C4 的八个白键音
  const ADVANCED_NOTE_RANGE = Array.from({ length: 13 }, (_, index) => C3 + index); // C3-C4 的全部半音
  const INTERVALS = [
    { semitones: 2, label: '大二度' }, { semitones: 4, label: '大三度' }, { semitones: 5, label: '纯四度' },
    { semitones: 7, label: '纯五度' }, { semitones: 9, label: '大六度' }, { semitones: 12, label: '纯八度' },
    { semitones: 3, label: '小三度' }
  ];
  const CHORDS = [
    { offsets: [0, 4, 7], label: '大三和弦', hint: '明亮、稳定' },
    { offsets: [0, 3, 7], label: '小三和弦', hint: '柔和、偏暗' },
    { offsets: [0, 3, 6], label: '减三和弦', hint: '紧张、不稳定' },
    { offsets: [0, 4, 8], label: '增三和弦', hint: '悬浮、发飘' },
    { offsets: [0, 4, 7, 10], label: '属七和弦', hint: '想要解决到主和弦' }
  ];
  const MODE_PATTERNS = [
    { label: '自然大调', hint: '明亮、稳定', chords: [[48, 52, 55], [53, 57, 60], [55, 59, 62], [48, 52, 55]] },
    { label: '自然小调', hint: '柔和、内敛', chords: [[48, 51, 55], [53, 56, 60], [55, 58, 62], [48, 51, 55]] },
    { label: '和声小调', hint: '带有更强的解决倾向', chords: [[48, 51, 55], [53, 56, 60], [55, 59, 62], [48, 51, 55]] }
  ];

  const pick = (list) => list[Math.floor(Math.random() * list.length)];

  const makeSingleNoteMode = (title, noteRange) => ({
    title,
    intro: '先听到基准音 C3，再听到一个音。它是哪一个音？',
    make() {
      const midi = pick(noteRange);
      const answer = midiToName(midi);
      return {
        play: () => { playSrc(srcOf(C3), 0, 0.7); playSrc(srcOf(midi), 1.0); },
        options: noteRange.map(midiToName),
        answer,
        explain: `这个音是 ${answer}，与基准音 C3 相差 ${midi - C3} 个半音。`
      };
    },
    preload: () => preload(noteRange)
  });

  const MODES = {
    note: makeSingleNoteMode('听音找键', NOTE_RANGE),
    'note-advanced': makeSingleNoteMode('单音听辨（进阶版）', ADVANCED_NOTE_RANGE),
    interval: {
      title: '音程听辨',
      intro: '连续听到两个音，它们之间是什么音程？',
      make() {
        const interval = pick(INTERVALS);
        const root = C3 + pick([0, 2, 4, 5, 7]);
        return {
          play: () => { playSrc(srcOf(root)); playSrc(srcOf(root + interval.semitones), 0.9); },
          options: INTERVALS.map((i) => i.label),
          answer: interval.label,
          explain: `两个音相差 ${interval.semitones} 个半音，是${interval.label}。`
        };
      },
      preload: () => preload(Array.from({ length: 25 }, (_, i) => C3 + i - 12))
    },
    chord: {
      title: '和弦听辨',
      intro: '三到四个音同时响起，判断它属于哪种和弦。',
      make() {
        const chord = pick(CHORDS);
        const root = C3 + pick([0, 2, 4, 5, 7]);
        return {
          play: () => chord.offsets.forEach((o) => playSrc(srcOf(root + o), 0, 0.6)),
          options: CHORDS.map((c) => c.label),
          answer: chord.label,
          explain: `这是${chord.label}（${chord.hint}），音程结构为 ${chord.offsets.join('-')} 个半音。`
        };
      },
      preload: () => preload(Array.from({ length: 25 }, (_, i) => C3 + i))
    },
    mode: {
      title: '调式听辨',
      intro: '听一组简短的和弦进行，判断它更接近哪种调式色彩。',
      make() {
        const mode = pick(MODE_PATTERNS);
        return {
          play: () => mode.chords.forEach((chord, index) => chord.forEach((midi) => playSrc(srcOf(midi), index * 0.62, 0.52))),
          options: MODE_PATTERNS.map((item) => item.label),
          answer: mode.label,
          explain: `这是${mode.label}，整体听感通常${mode.hint}。`
        };
      },
      preload: () => preload(MODE_PATTERNS.flatMap((mode) => mode.chords.flat()))
    }
  };

  /* ---------------- 渲染 ---------------- */
  const build = (mount) => {
    const mode = MODES[mount.dataset.earTraining] || MODES.note;
    const rounds = Math.max(3, Number(mount.dataset.rounds) || 8);
    const title = mount.dataset.title || mode.title;

    const state = { index: 0, correct: 0, question: null, answered: false, started: false };

    mount.classList.add('ear-training');
    mount.innerHTML = `
      <div class="ear-head">
        <div>
          <h3>${esc(title)}</h3>
          <p class="settings-note">${esc(mode.intro)}共 ${rounds} 题，答错会告诉你正确答案，可以反复重听。</p>
        </div>
        <span class="status-badge offline" data-ear-score>0 / ${rounds}</span>
      </div>
      <div class="ear-body">
        <div class="ear-controls">
          <button type="button" class="ml-btn" data-ear-play>▶ 播放题目</button>
          <button type="button" class="ml-btn secondary" data-ear-replay disabled>↻ 再听一次</button>
          <span class="ear-progress" data-ear-progress>点「播放题目」开始</span>
        </div>
        <div class="ear-options" data-ear-options hidden></div>
        <p class="ear-feedback" data-ear-feedback aria-live="polite"></p>
      </div>`;

    const playBtn = mount.querySelector('[data-ear-play]');
    const replayBtn = mount.querySelector('[data-ear-replay]');
    const optionsBox = mount.querySelector('[data-ear-options]');
    const feedback = mount.querySelector('[data-ear-feedback]');
    const progressEl = mount.querySelector('[data-ear-progress]');
    const scoreEl = mount.querySelector('[data-ear-score]');

    const renderOptions = () => {
      optionsBox.hidden = false;
      optionsBox.innerHTML = state.question.options
        .map((option) => `<button type="button" class="ear-option" data-value="${esc(option)}">${esc(option)}</button>`)
        .join('');
    };

    const playQuestion = () => {
      if (!state.question) return false;
      if (!beginPlayback(mount.dataset.earTraining)) {
        window.setTimeout(playQuestion, Math.max(50, playbackUntil - performance.now() + 20));
        return false;
      }
      state.question.play(state.started);
      return true;
    };

    const nextQuestion = () => {
      state.question = mode.make();
      state.answered = false;
      feedback.textContent = '';
      feedback.className = 'ear-feedback';
      progressEl.textContent = `第 ${state.index + 1} / ${rounds} 题`;
      playBtn.textContent = '▶ 播放题目';
      replayBtn.disabled = false;
      renderOptions();
      playQuestion();
    };

    const finishRound = () => {
      const rate = Math.round((state.correct / rounds) * 100);
      optionsBox.hidden = true;
      replayBtn.disabled = true;
      progressEl.textContent = `本轮结束：答对 ${state.correct} / ${rounds}（${rate}%）`;
      feedback.className = `ear-feedback ${rate >= 80 ? 'is-correct' : ''}`;
      feedback.textContent = rate >= 80 ? '耳朵很灵！可以挑战下一个练习了。' : '多练几轮，先记住几个好分辨的音，再慢慢加难度。';
      playBtn.textContent = '↻ 再来一轮';
      state.started = false;
      if (ML && ML.toast) ML.toast(`听音练习结束：${state.correct} / ${rounds}`, { type: rate >= 80 ? 'success' : 'info' });
    };

    const answer = (value) => {
      if (state.answered) return;
      state.answered = true;
      const right = value === state.question.answer;
      if (right) state.correct += 1;
      scoreEl.textContent = `${state.correct} / ${rounds}`;
      scoreEl.className = `status-badge ${state.correct ? 'online' : 'offline'}`;
      optionsBox.querySelectorAll('.ear-option').forEach((btn) => {
        if (btn.dataset.value === state.question.answer) btn.classList.add('is-correct');
        else if (btn.dataset.value === value) btn.classList.add('is-wrong');
        btn.disabled = true;
      });
      feedback.className = `ear-feedback ${right ? 'is-correct' : 'is-wrong'}`;
      feedback.textContent = `${right ? '✓ 答对了！' : `✗ 正确答案是「${state.question.answer}」。`} ${state.question.explain}`;

      state.index += 1;
      setTimeout(() => { if (state.index >= rounds) finishRound(); else nextQuestion(); }, right ? 900 : 1800);
    };

    optionsBox.addEventListener('click', (event) => {
      const btn = event.target.closest('.ear-option');
      if (btn) answer(btn.dataset.value);
    });

    playBtn.addEventListener('click', () => {
      if (!state.started) {
        mode.preload();
        state.started = true;
        state.index = 0;
        state.correct = 0;
        scoreEl.textContent = `0 / ${rounds}`;
        scoreEl.className = 'status-badge offline';
        nextQuestion();
      } else if (state.question) playQuestion();
    });

    replayBtn.addEventListener('click', () => { if (state.question) playQuestion(); });
  };

  mounts.forEach(build);
})();
