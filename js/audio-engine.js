/*
 * MusicLab 音频引擎（js/audio-engine.js）
 *
 * 统一的采样播放 + 节拍时钟，供游乐园 / Beat 音轨 / 四轨示例共用。
 *  - 优先使用 Web Audio API：采样解码进内存，按 AudioContext 时间精确调度，
 *    多轨叠加无延迟，切到后台也不会掉拍（提前 1.5s 排队）。
 *  - 直接双击 HTML 打开（file://）时浏览器禁止 fetch 本地文件，自动回退到
 *    HTMLAudioElement 池；调度改用 setTimeout，精度略低但行为一致。
 *
 * window.MusicLabAudio = {
 *   mode: 'webaudio' | 'html',
 *   load(srcs),                       // 预加载（返回 Promise）
 *   play(src, { at, gain }),          // at: 引擎时间（秒），缺省立即
 *   now(),                            // 引擎时间（秒）
 *   unlock(),                         // 在用户手势里调用，解除自动播放限制
 *   createClock({ bpm, steps, onStep, lookahead })
 * }
 */
(() => {
  'use strict';

  const AC = window.AudioContext || window.webkitAudioContext;
  const canFetch = window.location.protocol !== 'file:';
  let ctx = null;
  const buffers = new Map();     // src -> AudioBuffer
  const pending = new Map();     // src -> Promise
  const htmlPools = new Map();   // src -> { voices: HTMLAudioElement[], index }
  const POOL_SIZE = 6;
  let masterGain = null;

  const engine = {
    mode: AC && canFetch ? 'webaudio' : 'html'
  };

  const getContext = () => {
    if (!ctx && engine.mode === 'webaudio') {
      ctx = new AC({ latencyHint: 'interactive' });
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.9;
      masterGain.connect(ctx.destination);
    }
    return ctx;
  };

  const htmlVoice = (src) => {
    let pool = htmlPools.get(src);
    if (!pool) {
      pool = { index: 0, voices: Array.from({ length: POOL_SIZE }, () => { const a = new Audio(src); a.preload = 'auto'; return a; }) };
      htmlPools.set(src, pool);
    }
    const voice = pool.voices[pool.index];
    pool.index = (pool.index + 1) % POOL_SIZE;
    return voice;
  };

  const loadOne = (src) => {
    if (engine.mode !== 'webaudio') { htmlVoice(src); return Promise.resolve(null); }
    if (buffers.has(src)) return Promise.resolve(buffers.get(src));
    if (pending.has(src)) return pending.get(src);
    const context = getContext();
    const task = fetch(src)
      .then((res) => { if (!res.ok) throw new Error(`${res.status} ${src}`); return res.arrayBuffer(); })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => { buffers.set(src, buffer); pending.delete(src); return buffer; })
      .catch((error) => {
        // 单个文件失败就退回 HTMLAudio 播放这个采样，不影响其他
        console.warn('[MusicLabAudio] 解码失败，改用 <audio>：', src, error.message);
        pending.delete(src);
        htmlVoice(src);
        return null;
      });
    pending.set(src, task);
    return task;
  };

  engine.load = (srcs) => Promise.all([].concat(srcs).map(loadOne));

  engine.now = () => {
    const context = engine.mode === 'webaudio' ? getContext() : null;
    return context ? context.currentTime : performance.now() / 1000;
  };

  engine.unlock = () => {
    const context = engine.mode === 'webaudio' ? getContext() : null;
    if (context && context.state === 'suspended') context.resume().catch(() => {});
  };

  engine.play = (src, { at, gain = 1 } = {}) => {
    const buffer = buffers.get(src);
    if (buffer && ctx) {
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const g = ctx.createGain();
      g.gain.value = gain;
      source.connect(g).connect(masterGain);
      source.start(Math.max(at || 0, ctx.currentTime));
      return;
    }
    // HTMLAudio 回退：按延迟排队
    const fire = () => {
      const voice = htmlVoice(src);
      voice.volume = Math.min(1, Math.max(0, gain));
      voice.currentTime = 0;
      const request = voice.play();
      if (request) request.catch(() => { /* 尚无用户手势时被拦截，忽略 */ });
    };
    const delay = at ? (at - engine.now()) * 1000 : 0;
    if (delay > 4) setTimeout(fire, delay); else fire();
  };

  /*
   * 节拍时钟：lookahead 调度（参考 Chris Wilson “A Tale of Two Clocks”）。
   * onStep(step, time) 在每一步到点前被调用，time 是该步的引擎时间，用于 play({ at: time })。
   * position() 返回当前小数步位（0 ≤ p < steps），用于画播放线。
   */
  engine.createClock = ({ bpm = 100, steps = 16, onStep = () => {}, lookahead = 0.12, interval = 25 } = {}) => {
    const clock = { bpm, steps, playing: false };
    let timer = null;
    let nextStep = 0;        // 下一个要调度的步
    let nextTime = 0;        // 它的引擎时间
    let anchorStep = 0;      // 暂停 / 定位时记住的位置
    let lastScheduled = { step: 0, time: 0 };

    const stepSeconds = () => (60 / clock.bpm) / 4;

    const schedule = () => {
      const horizon = engine.now() + (document.hidden ? 1.5 : lookahead);
      while (nextTime < horizon) {
        onStep(nextStep, nextTime);
        lastScheduled = { step: nextStep, time: nextTime };
        nextTime += stepSeconds();
        nextStep = (nextStep + 1) % clock.steps;
      }
    };

    clock.start = (fromStep) => {
      if (clock.playing) return;
      engine.unlock();
      clock.playing = true;
      nextStep = typeof fromStep === 'number' ? fromStep : anchorStep;
      nextTime = engine.now() + 0.03;
      schedule();
      timer = setInterval(schedule, interval);
    };

    clock.pause = () => {
      if (!clock.playing) return;
      clock.playing = false;
      clearInterval(timer);
      timer = null;
      anchorStep = Math.floor(clock.position());
    };

    clock.stop = () => {
      clock.pause();
      anchorStep = 0;
      lastScheduled = { step: 0, time: 0 };
    };

    clock.seek = (step) => {
      const target = ((Math.round(step) % clock.steps) + clock.steps) % clock.steps;
      anchorStep = target;
      if (clock.playing) {
        nextStep = target;
        nextTime = engine.now() + 0.02;
        lastScheduled = { step: target, time: nextTime };
      } else {
        lastScheduled = { step: target, time: 0 };
      }
    };

    clock.setBpm = (value) => {
      const bpmValue = Math.max(20, Math.min(300, Number(value) || clock.bpm));
      if (bpmValue === clock.bpm) return;
      if (clock.playing) {
        // 以当前位置为基准重新计时，避免跳拍
        const pos = clock.position();
        clock.bpm = bpmValue;
        nextStep = (Math.floor(pos) + 1) % clock.steps;
        nextTime = engine.now() + (1 - (pos % 1)) * stepSeconds();
      } else {
        clock.bpm = bpmValue;
      }
    };

    clock.setSteps = (value) => {
      clock.steps = value;
      anchorStep = anchorStep % value;
      if (clock.playing) nextStep = nextStep % value;
    };

    clock.position = () => {
      if (!clock.playing) return anchorStep;
      const elapsed = engine.now() - lastScheduled.time;
      const frac = Math.min(Math.max(elapsed / stepSeconds(), 0), 0.999);
      return (lastScheduled.step + frac) % clock.steps;
    };

    clock.currentStep = () => Math.floor(clock.position());

    return clock;
  };

  window.MusicLabAudio = engine;
})();
