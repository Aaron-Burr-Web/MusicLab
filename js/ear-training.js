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
  const chordSampleFiles = {
    C4: 'source-piano-C4.wav',
    Db4: 'source-piano-Db4.wav', D4: 'source-piano-D4.wav', Eb4: 'source-piano-Eb4.wav',
    E4: 'source-piano-E4.wav', F4: 'source-piano-F4.wav', Gb4: 'source-piano-Gb4.wav',
    G4: 'source-piano-G4.wav', Ab4: 'source-piano-Ab4.wav', A4: 'source-piano-A4.wav',
    Bb4: 'source-piano-Bb4.wav', B4: 'source-piano-B4.wav'
  };
  const chordSrcOf = (midi) => {
    const file = chordSampleFiles[`${FLAT_NAMES[((midi % 12) + 12) % 12]}4`];
    return file ? new URL(file, pianoAudioRoot).href : null;
  };
  const srcOf = (midi) => {
    const name = midiToName(midi);
    return SAMPLES.has(name) ? new URL(`source-piano-${name}.wav`, pianoAudioRoot).href : null;
  };

  const fallbackPool = {};
  let playbackTimer = null;
  let playbackUntil = 0;
  const playbackDurations = { note: 3200, 'note-advanced': 3200, interval: 3100, chord: 2200, mode: 5000 };
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
  const playSrc = (src, delaySec = 0, gain = 0.9, durationSec = 1.2, playbackRate = 1) => {
    if (!src) return;
    if (AUDIO) {
      AUDIO.unlock();
      AUDIO.play(src, { at: delaySec ? AUDIO.now() + delaySec : undefined, gain, duration: durationSec, playbackRate });
      return;
    }
    const fire = () => {
      if (!fallbackPool[src]) fallbackPool[src] = Array.from({ length: 3 }, () => { const a = new Audio(src); a.preload = 'auto'; return a; });
      const pool = fallbackPool[src];
      const voice = pool.shift();
      pool.push(voice);
      voice.volume = gain;
      voice.playbackRate = playbackRate;
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
    { semitones: 1, label: '小二度' }, { semitones: 2, label: '大二度' }, { semitones: 3, label: '小三度' },
    { semitones: 4, label: '大三度' }, { semitones: 5, label: '纯四度' }, { semitones: 6, label: '增四度' },
    { semitones: 7, label: '纯五度' }, { semitones: 9, label: '大六度' }, { semitones: 10, label: '小七度' },
    { semitones: 11, label: '大七度' }, { semitones: 12, label: '纯八度' }
  ];
  const CHORDS = [
    { offsets: [0, 4, 7], label: '大三和弦', hint: '明亮、稳定' },
    { offsets: [0, 3, 7], label: '小三和弦', hint: '柔和、偏暗' },
    { offsets: [0, 3, 6], label: '减三和弦', hint: '紧张、不稳定' },
    { offsets: [0, 4, 8], label: '增三和弦', hint: '悬浮、发飘' },
    { offsets: [0, 4, 7, 10], label: '属七和弦', hint: '想要解决到主和弦' }
  ];
  const MODE_SCALES = [
    { label: '自然大调', hint: '明亮、稳定', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
    { label: '多利亚', hint: '小调色彩中带有明亮的六级音', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
    { label: '弗里几亚', hint: '低二级带来紧张、异域的色彩', intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
    { label: '利底亚', hint: '升四级带来开阔、悬浮的色彩', intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
    { label: '混合利底亚', hint: '低七级削弱终止感', intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
    { label: '自然小调', hint: '柔和、内省', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
    { label: '洛克里亚', hint: '低二级和减五级带来不稳定感', intervals: [0, 1, 3, 5, 6, 8, 10, 12] }
  ];

  const pick = (list) => list[Math.floor(Math.random() * list.length)];
  const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

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
      lastQuestionKey: '',
      make() {
        const availableIntervals = INTERVALS.filter((item) => item.semitones !== this.lastQuestionKey);
        const interval = pick(availableIntervals.length ? availableIntervals : INTERVALS);
        const root = C3 + Math.floor(Math.random() * 12);
        this.lastQuestionKey = interval.semitones;
        return {
          play: () => { playSrc(srcOf(root)); playSrc(srcOf(root + interval.semitones), 0.9); },
          options: shuffle(INTERVALS.map((i) => i.label)),
          answer: interval.label,
          explain: `两个音相差 ${interval.semitones} 个半音，是${interval.label}。`
        };
      },
      preload: () => preload(Array.from({ length: 24 }, (_, i) => C3 + i))
    },
    chord: {
      title: '和弦听辨',
      intro: '三到四个音同时响起，判断它属于哪种和弦。',
      make() {
        const chord = pick(CHORDS);
        const root = C3 + pick([0, 2, 4, 5, 7]);
        return {
          play: () => chord.offsets.forEach((o) => playSrc(chordSrcOf(root + o), 0, 0.6, 1.2, 0.5)),
          options: CHORDS.map((c) => c.label),
          answer: chord.label,
          explain: `这是${chord.label}（${chord.hint}），音程结构为 ${chord.offsets.join('-')} 个半音。`
        };
      },
      preload: () => preload(Array.from({ length: 25 }, (_, i) => C3 + i))
    },
    mode: {
      title: '调式听辨',
      intro: '听一条以 C 为主音的八度音阶，判断它属于哪种常见调式。',
      make() {
        const mode = pick(MODE_SCALES);
        const scale = mode.intervals.map((interval) => C3 + interval);
        return {
          play: () => scale.forEach((midi, index) => playSrc(srcOf(midi), index * 0.58, 0.86, 0.7)),
          options: MODE_SCALES.map((item) => item.label),
          answer: mode.label,
          explain: `这是${mode.label}音阶，${mode.hint}。音程关系为 ${mode.intervals.join('-')} 个半音。`
        };
      },
      preload: () => preload(MODE_SCALES.flatMap((mode) => mode.intervals.map((interval) => C3 + interval)))
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
