/* 音符与记谱章节：音高试听、听音找键与短句视唱。 */
(() => {
  'use strict';

  const engine = window.MusicLabAudio;
  if (!engine) return;

  const srcFor = (note) => `../audio/piano/piano-${note}.wav`;
  const notes = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5'];
  const keyboardNotes = ['C3', 'Db3', 'D3', 'Eb3', 'E3', 'F3', 'Gb3', 'G3', 'Ab3', 'A3', 'Bb3', 'B3',
    'C4', 'Db4', 'D4', 'Eb4', 'E4', 'F4', 'Gb4', 'G4', 'Ab4', 'A4', 'Bb4', 'B4'];
  const play = (note, delay = 0) => {
    engine.unlock();
    engine.play(srcFor(note), { at: delay ? engine.now() + delay : undefined, gain: 0.85 });
  };

  engine.load(keyboardNotes.concat('C5').map(srcFor));

  document.querySelectorAll('.pitch-audition').forEach((button) => {
    button.addEventListener('click', () => {
      play(button.dataset.note);
      button.classList.remove('is-playing');
      void button.offsetWidth;
      button.classList.add('is-playing');
      window.setTimeout(() => button.classList.remove('is-playing'), 360);
    });
  });

  const earTraining = document.querySelector('[data-pitch-ear-training]');
  if (earTraining) {
    const targetButton = earTraining.querySelector('.pitch-play-target');
    const feedback = earTraining.querySelector('.pitch-practice-feedback');
    let target = null;
    let attempts = 0;

    targetButton.addEventListener('click', () => {
      target = notes[Math.floor(Math.random() * 7)];
      attempts = 0;
      play(target);
      targetButton.textContent = '↻ 再听一次';
      feedback.className = 'pitch-practice-feedback';
      feedback.textContent = '仔细听，选择一个音名。';
      earTraining.querySelectorAll('[data-answer]').forEach((button) => button.disabled = false);
    });

    earTraining.querySelector('.pitch-answer-keys').addEventListener('click', (event) => {
      const answer = event.target.closest('[data-answer]');
      if (!answer || !target) return;
      attempts += 1;
      const isCorrect = target.startsWith(answer.dataset.answer);
      feedback.className = `pitch-practice-feedback ${isCorrect ? 'is-correct' : 'is-wrong'}`;
      feedback.textContent = isCorrect
        ? `答对了，刚才是 ${target.slice(0, -1)}。再来一题吧。`
        : `还不是 ${answer.dataset.answer}，再听一次。`;
      if (isCorrect) {
        earTraining.querySelectorAll('[data-answer]').forEach((button) => button.disabled = true);
        targetButton.textContent = '▶ 下一题';
        target = null;
      } else if (attempts >= 2) {
        feedback.textContent = `提示：它是 ${target.slice(0, -1)}。现在再听一次。`;
      }
    });
  }

  const sightSinging = document.querySelector('[data-sight-singing]');
  if (sightSinging) {
    const melody = [...sightSinging.querySelectorAll('.pitch-melody-note')];
    const feedback = sightSinging.querySelector('.pitch-practice-feedback');
    let timers = [];

    const stopHighlight = () => {
      timers.forEach(window.clearTimeout);
      timers = [];
      melody.forEach((note) => note.classList.remove('is-playing'));
    };

    melody.forEach((button) => button.addEventListener('click', () => {
      stopHighlight();
      play(button.dataset.note);
      button.classList.add('is-playing');
      timers.push(window.setTimeout(() => button.classList.remove('is-playing'), 360));
      feedback.textContent = `这是 ${button.dataset.note.slice(0, -1)}。`;
    }));

    sightSinging.querySelector('.pitch-play-melody').addEventListener('click', () => {
      stopHighlight();
      feedback.textContent = '跟着亮起的音符听一遍。';
      melody.forEach((button, index) => {
        const delay = index * 0.48;
        play(button.dataset.note, delay);
        timers.push(window.setTimeout(() => button.classList.add('is-playing'), delay * 1000));
        timers.push(window.setTimeout(() => button.classList.remove('is-playing'), (delay + 0.4) * 1000));
      });
    });
  }
})();