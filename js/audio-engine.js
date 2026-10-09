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
 *   load(srcs),                       // 预热并预加载（返回 Promise）
 *   warmup(srcs),                     // load 的语义化别名
  *   play(src, { at, gain }),          // at: 引擎时间（秒），缺省立即
  *   playAudition(srcs, { controls, offsets, gain, duration }), // 短试听并锁定控件
 *   play(src, { duration, synth: true }) // 延展稳定音段，生成带自然尾音的短音
 *   now(),                            // 引擎时间（秒）
 *   unlock(),                         // 在用户手势里调用，解除自动播放限制
 *   createClock({ bpm, steps, onStep, lookahead })
 * }
 */
(() => {
  'use strict';

  const FADE_IN_SECONDS = 0.008;
  const FADE_OUT_SECONDS = 0.1;
  const FADE_FLOOR = 0.0001;
  const FADE_SETTLE_SECONDS = 0.004;

  const AC = window.AudioContext || window.webkitAudioContext;
  const canFetch = window.location.protocol !== 'file:';
  let ctx = null;
  const buffers = new Map();     // src -> AudioBuffer
  const pending = new Map();     // src -> Promise
  const sustainRegions = new Map(); // src -> 可循环的高能量采样区间
  const htmlPools = new Map();   // src -> { voices: HTMLAudioElement[], index }
  const activeSources = new Set();
  const POOL_SIZE = 6;
  const BUFFER_PREWARM_COUNT = 40;
  const bufferPrewarmed = new Set();
  const synthPrewarmed = new Set();
  let masterGain = null;
  let keepAliveSource = null;
  let keepAliveGain = null;
  let warmupGestureInstalled = false;
  let silentWarmupDone = false;
  let auditionBusyUntil = 0;
  let playbackGeneration = 0;

  const engine = {
    mode: AC && canFetch ? 'webaudio' : 'html'
  };

  const getContext = () => {
    if (!ctx && engine.mode === 'webaudio') {
      ctx = new AC({ latencyHint: 'interactive' });
      masterGain = ctx.createGain();
      masterGain.gain.value = 1;
      const outputLimiter = ctx.createDynamicsCompressor();
      outputLimiter.threshold.value = -6;
      outputLimiter.knee.value = 12;
      outputLimiter.ratio.value = 3;
      outputLimiter.attack.value = 0.005;
      outputLimiter.release.value = 0.12;
      masterGain.connect(outputLimiter).connect(ctx.destination);
    }
    return ctx;
  };

  const htmlVoice = (src) => {
    let pool = htmlPools.get(src);
    if (!pool) {
      pool = { index: 0, voices: Array.from({ length: POOL_SIZE }, () => { const a = new Audio(src); a.preload = 'auto'; a.load(); return a; }) };
      htmlPools.set(src, pool);
    }
    const voice = pool.voices[pool.index];
    pool.index = (pool.index + 1) % POOL_SIZE;
    return voice;
  };

  const trackSource = (source) => {
    activeSources.add(source);
    source.addEventListener('ended', () => activeSources.delete(source), { once: true });
    return source;
  };

  const prewarmBuffer = (src, buffer) => {
    if (bufferPrewarmed.has(src) || engine.mode !== 'webaudio') return Promise.resolve();
    const context = getContext();
    if (!context || !masterGain) return Promise.resolve();
    bufferPrewarmed.add(src);
    const onset = sustainRegion(src, buffer).start;
    const runLength = Math.min(0.12, Math.max(0.02, buffer.duration - onset));
    const gain = context.createGain();
    gain.gain.value = 0;
    gain.connect(masterGain);
    for (let index = 0; index < BUFFER_PREWARM_COUNT; index += 1) {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.connect(gain);
      const startAt = context.currentTime + index * 0.02;
      source.start(startAt, onset);
      source.stop(startAt + runLength);
    }
    const prewarmDuration = (BUFFER_PREWARM_COUNT * 20) + (runLength * 1000) + 50;
    return new Promise((resolve) => setTimeout(() => {
      gain.disconnect();
      resolve();
    }, prewarmDuration));
  };

  const loadOne = (src) => {
    if (engine.mode !== 'webaudio') { htmlVoice(src); return Promise.resolve(null); }
    if (buffers.has(src)) return Promise.resolve(buffers.get(src));
    if (pending.has(src)) return pending.get(src);
    const context = getContext();
    const task = fetch(src)
      .then((res) => { if (!res.ok) throw new Error(`${res.status} ${src}`); return res.arrayBuffer(); })
      .then((data) => context.decodeAudioData(data))
      .then((buffer) => {
        buffers.set(src, buffer);
        return Promise.all([prewarmBuffer(src, buffer), prewarmSynthBuffer(src, buffer)])
          .then(() => { pending.delete(src); return buffer; });
      })
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

  const silentWarmup = () => {
    if (silentWarmupDone || engine.mode !== 'webaudio') return;
    const context = getContext();
    if (!context || context.state !== 'running') return;
    const buffer = context.createBuffer(1, Math.max(1, Math.floor(context.sampleRate * 0.02)), context.sampleRate);
    const source = context.createBufferSource();
    const gain = context.createGain();
    source.buffer = buffer;
    gain.gain.value = 0;
    source.connect(gain).connect(masterGain);
    source.start();
    source.stop(context.currentTime + 0.02);
    silentWarmupDone = true;
  };

  const stopKeepAlive = () => {
    if (!keepAliveSource) return;
    try { keepAliveSource.stop(); } catch (_) { /* 已停止的节点可以忽略 */ }
    keepAliveSource.disconnect();
    keepAliveGain.disconnect();
    keepAliveSource = null;
    keepAliveGain = null;
  };

  const startKeepAlive = () => {
    if (keepAliveSource || engine.mode !== 'webaudio' || document.hidden) return;
    const context = getContext();
    if (!context || context.state !== 'running' || !masterGain) return;
    keepAliveSource = context.createOscillator();
    keepAliveGain = context.createGain();
    keepAliveSource.type = 'sine';
    keepAliveSource.frequency.value = 20;
    keepAliveGain.gain.value = 0.000001;
    keepAliveSource.connect(keepAliveGain).connect(masterGain);
    keepAliveSource.start();
  };

  const installWarmupGesture = () => {
    if (warmupGestureInstalled || typeof document === 'undefined') return;
    warmupGestureInstalled = true;
    const warmupOnGesture = () => {
      engine.unlock();
      silentWarmup();
      document.removeEventListener('pointerdown', warmupOnGesture, true);
      document.removeEventListener('keydown', warmupOnGesture, true);
      document.removeEventListener('touchstart', warmupOnGesture, true);
    };
    document.addEventListener('pointerdown', warmupOnGesture, true, { once: true });
    document.addEventListener('keydown', warmupOnGesture, true, { once: true });
    document.addEventListener('touchstart', warmupOnGesture, true, { once: true });
  };

  engine.load = (srcs) => {
    installWarmupGesture();
    return Promise.all([].concat(srcs).filter(Boolean).map(loadOne));
  };
  engine.warmup = (srcs) => engine.load(srcs);

  engine.now = () => {
    const context = engine.mode === 'webaudio' ? getContext() : null;
    return context ? context.currentTime : performance.now() / 1000;
  };

  engine.unlock = () => {
    const context = engine.mode === 'webaudio' ? getContext() : null;
    if (!context) return Promise.resolve();
    if (context.state === 'suspended') {
      return context.resume().then(() => { silentWarmup(); startKeepAlive(); }).catch(() => {});
    }
    silentWarmup();
    startKeepAlive();
    return Promise.resolve();
  };

  engine.stopAll = () => {
    activeSources.forEach((source) => {
      try { source.stop(); } catch (_) { /* 已停止的节点可以忽略 */ }
    });
    activeSources.clear();
    htmlPools.forEach((pool) => pool.voices.forEach((voice) => {
      voice.pause();
      voice.currentTime = 0;
    }));
    auditionBusyUntil = 0;
  };

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopKeepAlive();
      else engine.unlock();
    });
  }

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
    start = alignToZeroCrossing(data, start, buffer.sampleRate);
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

  const alignToZeroCrossing = (data, index, sampleRate) => {
    const searchRadius = Math.max(1, Math.floor(sampleRate * 0.012));
    const start = Math.max(1, index);
    const end = Math.min(data.length - 1, index + searchRadius);
    let bestIndex = index;
    let bestDistance = Infinity;
    for (let candidate = start; candidate <= end; candidate += 1) {
      const crossed = (data[candidate - 1] <= 0 && data[candidate] >= 0)
        || (data[candidate - 1] >= 0 && data[candidate] <= 0);
      if (!crossed) continue;
      const distance = Math.abs(candidate - index);
      if (distance < bestDistance) {
        bestIndex = candidate;
        bestDistance = distance;
      }
    }
    return bestIndex;
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

  const scheduleFade = (gainNode, startAt, endAt, gain) => {
    const fadeInEnd = Math.min(endAt, startAt + FADE_IN_SECONDS);
    const fadeOutStart = Math.max(fadeInEnd, endAt - FADE_OUT_SECONDS);
    if (FADE_IN_SECONDS > 0) {
      gainNode.gain.setValueAtTime(0.001, startAt);
      gainNode.gain.linearRampToValueAtTime(gain, fadeInEnd);
    } else {
      gainNode.gain.setValueAtTime(gain, startAt);
    }
    if (fadeOutStart > fadeInEnd) {
      gainNode.gain.setValueAtTime(gain, fadeOutStart);
      const settleAt = Math.max(fadeOutStart, endAt - FADE_SETTLE_SECONDS);
      if (gain > FADE_FLOOR) gainNode.gain.exponentialRampToValueAtTime(FADE_FLOOR, settleAt);
      gainNode.gain.linearRampToValueAtTime(0, endAt);
    }
  };

  const scheduleExponentialFade = (gainNode, gain, startAt, endAt) => {
    if (endAt <= startAt) return;
    gainNode.gain.setValueAtTime(Math.max(FADE_FLOOR, gain), startAt);
    const settleAt = Math.max(startAt, endAt - FADE_SETTLE_SECONDS);
    if (gain > FADE_FLOOR) gainNode.gain.exponentialRampToValueAtTime(FADE_FLOOR, settleAt);
    gainNode.gain.linearRampToValueAtTime(0, endAt);
  };

  const playSynth = (src, buffer, startAt, gain, duration) => {
    const minimumDuration = 0.5;
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
    const tailLength = Math.min(0.13, Math.max(FADE_OUT_SECONDS, total * 0.2));
    const bodyEnd = Math.max(0.025, total - tailLength);

    // 跳过采样头的低能量噪声，从有效起音处保留触键质感。
    const attack = trackSource(ctx.createBufferSource());
    attack.buffer = buffer;
    const attackGain = connectGain(attack, gain);
    const attackLength = Math.min(0.12, bodyEnd);
    attackGain.gain.setValueAtTime(gain, startAt);
    attackGain.gain.linearRampToValueAtTime(0.001, startAt + attackLength);
    attack.start(startAt, region.start);
    attack.stop(Math.min(startAt + attackLength, startAt + total));

    const body = trackSource(ctx.createBufferSource());
    body.buffer = buffer;
    body.loop = true;
    body.loopStart = region.start;
    body.loopEnd = Math.max(region.start + 0.02, mainNaturalEnd);
    body.playbackRate.value = mainPlaybackRate;
    const bodyGain = connectGain(body, gain);
    bodyGain.gain.setValueAtTime(0.001, startAt);
    bodyGain.gain.linearRampToValueAtTime(gain, Math.min(startAt + attackLength, startAt + bodyEnd));
    if (startAt + bodyEnd - FADE_OUT_SECONDS > startAt + attackLength) {
      bodyGain.gain.setValueAtTime(gain, startAt + bodyEnd - FADE_OUT_SECONDS);
      scheduleExponentialFade(bodyGain, gain, startAt + bodyEnd - FADE_OUT_SECONDS, startAt + bodyEnd);
    }
    body.start(startAt, region.start);
    body.stop(startAt + bodyEnd);

    // 尾音保持采样原速，只做增益衰减，保留真实乐器的自然衰减。
    const tail = trackSource(ctx.createBufferSource());
    tail.buffer = buffer;
    const tailOffset = Math.min(region.end, Math.max(0, buffer.duration - tailLength - 0.01));
    tail.playbackRate.value = 1;
    const tailGain = connectGain(tail, gain * 0.7);
    const tailFadeIn = Math.min(FADE_IN_SECONDS, tailLength * 0.25);
    const tailStart = Math.max(startAt, startAt + bodyEnd - tailFadeIn);
    tailGain.gain.setValueAtTime(gain * 0.7, tailStart);
    scheduleExponentialFade(tailGain, gain * 0.7, tailStart, startAt + total);
    tail.start(tailStart, tailOffset);
    tail.stop(startAt + total);
  };

  const prewarmSynthBuffer = (src, buffer) => {
    if (synthPrewarmed.has(src) || engine.mode !== 'webaudio') return Promise.resolve();
    const context = getContext();
    if (!context || !masterGain) return Promise.resolve();
    synthPrewarmed.add(src);
    for (let index = 0; index < BUFFER_PREWARM_COUNT; index += 1) {
      playSynth(src, buffer, context.currentTime + index * 0.2, 0, 1);
    }
    const prewarmDuration = ((BUFFER_PREWARM_COUNT - 1) * 200) + 1100;
    return new Promise((resolve) => setTimeout(resolve, prewarmDuration));
  };

  engine.play = (src, { at, gain = 1, duration, synth = false, playbackRate = 1, skipPending = false } = {}) => {
    const generation = playbackGeneration;
    const shortSynth = synth && Number.isFinite(duration) && duration > 0 && duration < 0.8;
    const playbackDuration = shortSynth ? 0.8 : duration;
    const useSynth = synth && !shortSynth;
    const buffer = buffers.get(src);
    const pendingLoad = pending.get(src);
    if (!buffer && pendingLoad && !skipPending) {
      pendingLoad.then(() => {
        if (generation === playbackGeneration) engine.play(src, { at, gain, duration, synth, playbackRate, skipPending: true });
      });
      return;
    }
    if (buffer && ctx) {
      const startAt = Math.max(at || 0, ctx.currentTime);
      if (useSynth && Number.isFinite(playbackDuration) && playbackDuration > 0) {
        playSynth(src, buffer, startAt, gain, duration);
        return;
      }
      const source = trackSource(ctx.createBufferSource());
      source.buffer = buffer;
      source.playbackRate.value = playbackRate;
      const gainNode = connectGain(source, gain);
      const onset = sustainRegion(src, buffer).start;
      const sourceDuration = Math.max(0.02, buffer.duration - onset);
      const endAt = startAt + (Number.isFinite(playbackDuration) && playbackDuration > 0 ? playbackDuration : sourceDuration);
      scheduleFade(gainNode, startAt, endAt, gain);
      source.start(startAt, onset);
      source.stop(endAt);
      return;
    }
    // HTMLAudio 回退：按延迟排队
    const fire = () => {
      if (generation !== playbackGeneration) return;
      const voice = htmlVoice(src);
      const playToken = {};
      voice.__musicLabPlayToken = playToken;
      const targetVolume = Math.min(1, Math.max(0, gain * 1.08));
      const fadeStart = performance.now();
      const fadeDuration = Number.isFinite(playbackDuration) && playbackDuration > 0 ? playbackDuration * 1000 : null;
      const updateVolume = () => {
        if (voice.__musicLabPlayToken !== playToken) return;
        const elapsed = performance.now() - fadeStart;
        const fadeIn = FADE_IN_SECONDS > 0 ? Math.min(1, elapsed / (FADE_IN_SECONDS * 1000)) : 1;
        const naturalDuration = Number.isFinite(voice.duration) && voice.duration > 0 ? voice.duration * 1000 : null;
        const endDuration = fadeDuration || naturalDuration;
        const fadeProgress = endDuration === null ? 0 : (elapsed - (endDuration - FADE_OUT_SECONDS * 1000)) / (FADE_OUT_SECONDS * 1000);
        const fadeOut = endDuration === null ? 1 : fadeProgress >= 1 ? 0 : Math.max(FADE_FLOOR, Math.pow(FADE_FLOOR, Math.max(0, fadeProgress)));
        voice.volume = targetVolume * Math.min(fadeIn, fadeOut);
        if (!voice.ended && (endDuration === null || elapsed < endDuration + FADE_SETTLE_SECONDS * 1000)) requestAnimationFrame(updateVolume);
      };
      voice.volume = 0;
      voice.playbackRate = playbackRate;
      voice.currentTime = 0;
      const request = voice.play();
      if (request) request.catch(() => { /* 尚无用户手势时被拦截，忽略 */ });
      requestAnimationFrame(updateVolume);
      if (Number.isFinite(playbackDuration) && playbackDuration > 0) {
        setTimeout(() => {
          if (voice.__musicLabPlayToken !== playToken) return;
          voice.pause();
          voice.currentTime = 0;
        }, playbackDuration * 1000 + FADE_SETTLE_SECONDS * 1000);
      }
    };
    const delay = at ? (at - engine.now()) * 1000 : 0;
    if (delay > 4) setTimeout(fire, delay); else fire();
  };

  engine.playAudition = (srcs, { controls = [], offsets = [], at, gain = 0.85, duration = 1.2, playbackRate = 1 } = {}) => {
    const sources = [].concat(srcs).filter(Boolean);
    const now = engine.now();
    const controlList = [...controls].filter(Boolean);
    if (!sources.length || controlList.some((control) => control.disabled) || auditionBusyUntil > performance.now()) return false;
    const changedControls = controlList.filter((control) => !control.disabled);
    changedControls.forEach((control) => {
      control.disabled = true;
      control.setAttribute('aria-disabled', 'true');
    });
    const startAt = Number.isFinite(at) ? at : now;
    const sourceOffsets = sources.map((_, index) => Math.max(0, Number(offsets[index]) || 0));
    const overlapCounts = sourceOffsets.map((offset) => sourceOffsets.reduce((count, otherOffset) => (
      otherOffset <= offset && otherOffset + duration > offset ? count + 1 : count
    ), 0));
    const latestOffset = sources.reduce((latest, _, index) => Math.max(latest, Number(offsets[index]) || 0), 0);
    auditionBusyUntil = performance.now() + (Math.max(0, startAt - now) + latestOffset + duration) * 1000;
    sources.forEach((src, index) => engine.play(src, {
      at: startAt + (Number(offsets[index]) || 0),
      gain: gain / Math.sqrt(Math.max(1, overlapCounts[index])),
      duration,
      playbackRate
    }));
    if (changedControls.length) {
      const release = () => {
        if (performance.now() < auditionBusyUntil) {
          window.setTimeout(release, auditionBusyUntil - performance.now());
          return;
        }
        changedControls.forEach((control) => {
          control.disabled = false;
          control.removeAttribute('aria-disabled');
        });
        auditionBusyUntil = 0;
      };
      window.setTimeout(release, Math.max(0, auditionBusyUntil - performance.now()));
    }
    return true;
  };

  /*
   * 节拍时钟：lookahead 调度（参考 Chris Wilson “A Tale of Two Clocks”）。
   * onStep(step, time) 在每一步到点前被调用，time 是该步的引擎时间，用于 play({ at: time })。
   * position() 返回当前小数步位（0 ≤ p < steps），用于画播放线。
   */
  engine.createClock = ({ bpm = 100, steps = 16, onStep = () => {}, onEnd = () => {}, loop = true, lookahead = 0.12, interval = 25 } = {}) => {
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
        if (!loop && nextStep >= clock.steps) {
          clock.playing = false;
          clearInterval(timer);
          timer = null;
          anchorStep = 0;
          onEnd();
          return;
        }
        onStep(nextStep, nextTime);
        lastScheduled = { step: nextStep, time: nextTime };
        nextTime += stepSeconds();
        nextStep = loop ? (nextStep + 1) % clock.steps : nextStep + 1;
      }
    };

    clock.start = (fromStep) => {
      if (clock.playing) return;
      engine.unlock();
      clock.playing = true;
      nextStep = typeof fromStep === 'number' ? fromStep : anchorStep;
      nextTime = engine.now() + 0.03;
      schedule();
      if (clock.playing) timer = setInterval(schedule, interval);
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
