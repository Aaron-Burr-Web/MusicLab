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
 *   play(src, { duration, synth: true }) // 延展稳定音段，生成带自然尾音的短音
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
  const sustainRegions = new Map(); // src -> 可循环的高能量采样区间
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

  const sustainRegion = (src, buffer) => {
    if (sustainRegions.has(src)) return sustainRegions.get(src);
    const data = buffer.getChannelData(0);
    const windowSize = Math.max(128, Math.floor(buffer.sampleRate * 0.012));
    let peak = 0;
    for (let index = 0; index < data.length; index += windowSize) {
      let energy = 0;
      for (let offset = 0; offset < windowSize && index + offset < data.length; offset += 1) energy += Math.abs(data[index + offset]);
      peak = Math.max(peak, energy / windowSize);
    }
    const threshold = peak * 0.42;
    let start = 0;
    let end = data.length - 1;
    for (let index = 0; index < data.length; index += windowSize) {
      let energy = 0;
      for (let offset = 0; offset < windowSize && index + offset < data.length; offset += 1) energy += Math.abs(data[index + offset]);
      if (energy / windowSize >= threshold) { start = index; break; }
    }
    for (let index = data.length - 1; index >= 0; index -= windowSize) {
      let energy = 0;
      for (let offset = 0; offset < windowSize && index - offset >= 0; offset += 1) energy += Math.abs(data[index - offset]);
      if (energy / windowSize >= threshold) { end = Math.min(data.length - 1, index + windowSize); break; }
    }
    const minRegion = Math.floor(buffer.sampleRate * 0.06);
    if (end - start < minRegion) {
      start = Math.min(start, Math.max(0, data.length - minRegion));
      end = Math.min(data.length - 1, start + minRegion);
    }
    const region = { start: start / buffer.sampleRate, end: end / buffer.sampleRate };
    sustainRegions.set(src, region);
    return region;
  };

  const levelAt = (buffer, seconds, windowSeconds = 0.008) => {
    const data = buffer.getChannelData(0);
    const center = Math.max(0, Math.min(data.length - 1, Math.floor(seconds * buffer.sampleRate)));
    const radius = Math.max(1, Math.floor(windowSeconds * buffer.sampleRate * 0.5));
    let peak = 0;
    for (let index = Math.max(0, center - radius); index <= Math.min(data.length - 1, center + radius); index += 1) {
      peak = Math.max(peak, Math.abs(data[index]));
    }
    return peak;
  };

  const findDecayEnd = (buffer, startSeconds, threshold) => {
    const windowSeconds = 0.012;
    const requiredQuietWindows = 2;
    let quietWindows = 0;
    for (let seconds = startSeconds; seconds < buffer.duration; seconds += windowSeconds) {
      if (levelAt(buffer, seconds, windowSeconds) <= threshold) quietWindows += 1;
      else quietWindows = 0;
      if (quietWindows >= requiredQuietWindows) return seconds - (requiredQuietWindows - 1) * windowSeconds;
    }
    return buffer.duration;
  };

  const connectGain = (source, gain) => {
    const node = ctx.createGain();
    source.connect(node).connect(masterGain);
    node.gain.value = gain;
    return node;
  };

  const playSynth = (src, buffer, startAt, gain, duration) => {
    const minimumDuration = 0.6;
    const requestedDuration = Number.isFinite(duration) ? duration : 0;
    const total = Math.max(minimumDuration, requestedDuration + 0.01);
    const region = sustainRegion(src, buffer);
    const mainThreshold = 0.04;
    const allowMainCompression = requestedDuration > minimumDuration;
    const mainEndLevel = allowMainCompression ? levelAt(buffer, region.end) : 0;
    const mainNaturalEnd = mainEndLevel > mainThreshold ? findDecayEnd(buffer, region.end, mainThreshold) : region.end;
    const mainLength = Math.max(0.02, region.end - region.start);
    const mainPlaybackRate = allowMainCompression ? Math.max(1, (mainNaturalEnd - region.start) / mainLength) : 1;
    // 最后几十毫秒是唯一的收尾区，所有声部都必须在片段边界同时停止。
    const tailLength = Math.min(0.13, Math.max(0.05, total * 0.2));
    const bodyEnd = Math.max(0.025, total - tailLength);

    // 原始起音保留乐器触键质感；高能量段循环延展以填满片段主体。
    const attack = ctx.createBufferSource();
    attack.buffer = buffer;
    const attackGain = connectGain(attack, gain);
    const attackLength = Math.min(region.start + 0.035, 0.12, bodyEnd);
    attackGain.gain.setValueAtTime(gain, startAt);
    attackGain.gain.linearRampToValueAtTime(0.001, startAt + attackLength);
    attack.start(startAt);
    attack.stop(Math.min(startAt + attackLength, startAt + total));

    const body = ctx.createBufferSource();
    body.buffer = buffer;
    body.loop = true;
    body.loopStart = region.start;
    body.loopEnd = Math.max(region.start + 0.02, mainNaturalEnd);
    body.playbackRate.value = mainPlaybackRate;
    const bodyGain = connectGain(body, gain);
    bodyGain.gain.setValueAtTime(0.001, startAt);
    bodyGain.gain.linearRampToValueAtTime(gain, startAt + Math.min(0.025, bodyEnd * 0.35));
    bodyGain.gain.setValueAtTime(gain, startAt + Math.max(0.026, bodyEnd - 0.02));
    bodyGain.gain.linearRampToValueAtTime(0.001, startAt + bodyEnd);
    body.start(startAt, region.start);
    body.stop(startAt + bodyEnd);

    // 尾音保持采样原速，只做增益衰减，保留真实乐器的自然衰减。
    const tail = ctx.createBufferSource();
    tail.buffer = buffer;
    const tailOffset = Math.min(region.end, Math.max(0, buffer.duration - tailLength - 0.01));
    tail.playbackRate.value = 1;
    const tailGain = connectGain(tail, gain * 0.7);
    const tailFadeIn = Math.min(0.025, tailLength * 0.25);
    const tailStart = Math.max(startAt, startAt + bodyEnd - tailFadeIn);
    tailGain.gain.setValueAtTime(0.001, tailStart);
    tailGain.gain.linearRampToValueAtTime(gain * 0.7, startAt + bodyEnd);
    tailGain.gain.setTargetAtTime(0.0001, startAt + bodyEnd, Math.max(0.018, tailLength / 6));
    tail.start(tailStart, tailOffset);
    tail.stop(startAt + total);
  };

  engine.play = (src, { at, gain = 1, duration, synth = false } = {}) => {
    const shortSynth = synth && Number.isFinite(duration) && duration > 0 && duration < 0.8;
    const playbackDuration = shortSynth ? 0.8 : duration;
    const useSynth = synth && !shortSynth;
    const buffer = buffers.get(src);
    if (buffer && ctx) {
      const startAt = Math.max(at || 0, ctx.currentTime);
      if (useSynth && Number.isFinite(playbackDuration) && playbackDuration > 0) {
        playSynth(src, buffer, startAt, gain, duration);
        return;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      connectGain(source, gain);
      source.start(startAt);
      if (Number.isFinite(playbackDuration) && playbackDuration > 0) source.stop(startAt + playbackDuration);
      return;
    }
    // HTMLAudio 回退：按延迟排队
    const fire = () => {
      const voice = htmlVoice(src);
      const playToken = {};
      voice.__musicLabPlayToken = playToken;
      voice.volume = Math.min(1, Math.max(0, gain));
      voice.currentTime = 0;
      const request = voice.play();
      if (request) request.catch(() => { /* 尚无用户手势时被拦截，忽略 */ });
      if (Number.isFinite(playbackDuration) && playbackDuration > 0) {
        setTimeout(() => {
          if (voice.__musicLabPlayToken !== playToken) return;
          voice.pause();
          voice.currentTime = 0;
        }, playbackDuration * 1000);
      }
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
