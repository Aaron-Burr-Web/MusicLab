/* 练习区键盘：点击后播放对应钢琴采样并更新五线谱位置。 */
(() => {
  'use strict';

  const keyboard = document.querySelector('[data-practice-keyboard]');
  if (!keyboard) return;
  const AUDIO = window.MusicLabAudio || null;
  const audioRoot = new URL('../audio/piano/', document.baseURI);
  const sampleNames = { 'C#': 'Db', 'D#': 'Eb', 'F#': 'Gb', 'G#': 'Ab', 'A#': 'Bb' };
  const sampleSource = (note) => {
    const sampleNote = note.replace(/^([A-G]#)/, (name) => sampleNames[name]);
    return new URL(`piano-${sampleNote}.wav`, audioRoot).href;
  };
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

  keyboard.innerHTML = `<div class="practice-keyboard-keys" style="--white-count:${whiteNotes.length}">${whiteNotes.map((note) => `<button class="practice-white-key ${note.startsWith('C') ? 'is-c' : ''}" type="button" data-note="${note}" aria-pressed="${note === 'C3'}">${note.startsWith('C') ? note : ''}</button>`).join('')}${blackNotes.map(({ note, position }) => `<button class="practice-black-key" type="button" data-note="${note}" style="--black-position:${position}" aria-label="${note}" aria-pressed="false"></button>`).join('')}</div>`;

  const name = document.querySelector('[data-practice-note-name]');
  const detail = document.querySelector('[data-practice-note-detail]');
  const staffNote = document.querySelector('[data-practice-staff-note]');
  const staffAccidental = document.querySelector('[data-practice-staff-accidental]');
  const ledgerLines = document.querySelector('[data-practice-ledger-lines]');
  const staffLabel = document.querySelector('[data-practice-staff-label]');
  const staffBottom = 192;
  const halfSpace = 8;
  const ledgerLine = (y) => `<line x1="258" y1="${y}" x2="298" y2="${y}"></line>`;

  const drawLedgerLines = (staffStep) => {
    if (!ledgerLines) return;
    const lines = [];
    if (staffStep < 0) {
      for (let step = -2; step >= staffStep; step -= 2) lines.push(ledgerLine(staffBottom - step * halfSpace));
    } else if (staffStep > 8) {
      for (let step = 10; step <= staffStep; step += 2) lines.push(ledgerLine(staffBottom - step * halfSpace));
    }
    ledgerLines.innerHTML = lines.join('');
  };

  const update = (note) => {
    const match = note.match(/^([A-G])#?(\d)$/);
    if (!match) return;
    const [, letter, octaveText] = match;
    const octave = Number(octaveText);
    const naturalIndex = (octave - 2) * naturalNotes.length + naturalNotes.indexOf(letter);
    // With C3 as middle C, E3 is the bottom line of this treble staff.
    const staffStep = naturalIndex - 9;
    const noteY = staffBottom - staffStep * halfSpace;
    const stemDown = staffStep >= 6;
    const isBlackKey = note.includes('#');
    name.textContent = note;
    detail.textContent = note === 'C3' ? '中央 C' : `${letter} 音 · 第 ${octave} 八度`;
    if (staffAccidental) staffAccidental.textContent = isBlackKey ? '♭' : '';
    staffNote.setAttribute('transform', `translate(278 ${noteY})`);
    staffNote.querySelector('.practice-staff-stem').setAttribute('x1', stemDown ? '-10' : '10');
    staffNote.querySelector('.practice-staff-stem').setAttribute('x2', stemDown ? '-10' : '10');
    staffNote.querySelector('.practice-staff-stem').setAttribute('y2', stemDown ? '58' : '-58');
    drawLedgerLines(staffStep);
    staffLabel.textContent = `五线谱标识：高音谱表 · ${note}`;
    keyboard.querySelectorAll('[data-note]').forEach((key) => key.setAttribute('aria-pressed', String(key.dataset.note === note)));
  };

  keyboard.addEventListener('click', (event) => {
    const key = event.target.closest('[data-note]');
    if (!key) return;
    const note = key.dataset.note;
    update(note);
    if (AUDIO) {
      AUDIO.unlock();
      AUDIO.load(sampleSource(note));
      AUDIO.play(sampleSource(note), { gain: 0.85, duration: 1.2 });
    } else {
      const voice = new Audio(sampleSource(note));
      voice.volume = 0.85;
      voice.play().catch(() => {});
    }
  });

  update('C3');
})();