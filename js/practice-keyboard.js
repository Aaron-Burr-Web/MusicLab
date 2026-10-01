/* 练习区键盘：只显示选中音名与五线谱位置，不播放音频。 */
(() => {
  'use strict';

  const keyboard = document.querySelector('[data-practice-keyboard]');
  if (!keyboard) return;

  const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const sharpAfter = { C: 'C#', D: 'D#', F: 'F#', G: 'G#', A: 'A#' };
  const whiteNotes = [];
  const blackNotes = [];
  for (let octave = 2; octave <= 4; octave += 1) {
    naturalNotes.forEach((letter) => {
      whiteNotes.push(`${letter}${octave}`);
      if (sharpAfter[letter]) blackNotes.push({ note: `${sharpAfter[letter]}${octave}`, position: whiteNotes.length });
    });
  }
  whiteNotes.push('C5');

  keyboard.innerHTML = `<div class="practice-keyboard-keys" style="--white-count:${whiteNotes.length}">${whiteNotes.map((note) => `<button class="practice-white-key ${note.startsWith('C') ? 'is-c' : ''}" type="button" data-note="${note}" aria-pressed="${note === 'C4'}">${note.startsWith('C') ? note : ''}</button>`).join('')}${blackNotes.map(({ note, position }) => `<button class="practice-black-key" type="button" data-note="${note}" style="--black-position:${position}" aria-label="${note}" aria-pressed="false"></button>`).join('')}</div>`;

  const name = document.querySelector('[data-practice-note-name]');
  const detail = document.querySelector('[data-practice-note-detail]');
  const staffNote = document.querySelector('[data-practice-staff-note]');
  const staffLabel = document.querySelector('[data-practice-staff-label]');
  const update = (note) => {
    const match = note.match(/^([A-G])#?(\d)$/);
    if (!match) return;
    const [, letter, octaveText] = match;
    const octave = Number(octaveText);
    const naturalIndex = (octave - 2) * naturalNotes.length + naturalNotes.indexOf(letter);
    name.textContent = note;
    detail.textContent = note === 'C4' ? '中央 C' : `${letter} 音 · 第 ${octave} 八度`;
    staffNote.style.setProperty('--staff-index', String(naturalIndex));
    staffLabel.textContent = `五线谱标识：高音谱表 · ${note}`;
    keyboard.querySelectorAll('[data-note]').forEach((key) => key.setAttribute('aria-pressed', String(key.dataset.note === note)));
  };

  keyboard.addEventListener('click', (event) => {
    const key = event.target.closest('[data-note]');
    if (key) update(key.dataset.note);
  });
})();