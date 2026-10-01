/* 谱与音符（二）：五线谱设置、四分音符试听与单音小练习。 */
(() => {
  'use strict';
  const engine = window.MusicLabAudio;
  const lab = document.querySelector('.notation-lab');
  if (!engine || !lab) return;
  const src = (note) => `../audio/piano/piano-${note}.wav`;
  const notes = ['C3', 'D3', 'E3', 'F3', 'G3'];
  const play = (note, delay = 0) => { engine.unlock(); engine.play(src(note), { at: delay ? engine.now() + delay : undefined, gain: 0.85 }); };
  engine.load(notes.map(src));
  const status = lab.querySelector('[data-notation-status]');
  const setStatus = (text) => { status.textContent = text; status.className = 'status-badge online'; };
  const clefCopy = { treble: ['𝄞', '高音谱号', '高音谱号让第二线成为 G，适合旋律的中高音区。'], bass: ['𝄢', '低音谱号', '低音谱号让第四线成为 F，适合低声部与贝斯。'] };
  const naturalNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
  const staffBottom = 168;
  const halfSpace = 8;
  const clefBase = { treble: 23, bass: 18 };
  let currentClef = 'treble';
  const diatonicIndex = (note) => {
    const match = note.match(/^([A-G])#?(\d)$/);
    return Number(match[2]) * naturalNotes.length + naturalNotes.indexOf(match[1]);
  };
  const renderNotes = () => {
    lab.querySelectorAll('.notation-note').forEach((note) => {
      const staffStep = diatonicIndex(note.dataset.note) - clefBase[currentClef];
      const noteY = staffBottom - staffStep * halfSpace;
      const stemDown = staffStep >= 6;
      const ledgerLines = [];
      if (staffStep < 0) {
        for (let step = -2; step >= staffStep; step -= 2) ledgerLines.push(`<line x1="-20" y1="${(staffStep - step) * halfSpace}" x2="20" y2="${(staffStep - step) * halfSpace}"></line>`);
      } else if (staffStep > 8) {
        for (let step = 10; step <= staffStep; step += 2) ledgerLines.push(`<line x1="-20" y1="${(staffStep - step) * halfSpace}" x2="20" y2="${(staffStep - step) * halfSpace}"></line>`);
      }
      note.setAttribute('transform', `translate(${note.dataset.noteX} ${noteY})`);
      note.querySelector('.notation-note-stem').setAttribute('x1', stemDown ? '-10' : '10');
      note.querySelector('.notation-note-stem').setAttribute('x2', stemDown ? '-10' : '10');
      note.querySelector('.notation-note-stem').setAttribute('y2', stemDown ? '58' : '-58');
      note.querySelector('[data-note-ledgers]').innerHTML = ledgerLines.join('');
    });
  };
  renderNotes();
  lab.querySelectorAll('[data-clef]').forEach((button) => button.addEventListener('click', () => {
    const [symbol, label, guide] = clefCopy[button.dataset.clef];
    lab.querySelectorAll('[data-clef]').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    currentClef = button.dataset.clef;
    lab.querySelector('[data-clef-symbol]').textContent = symbol; lab.querySelector('[data-clef-label]').textContent = label; lab.querySelector('[data-guide-clef]').textContent = guide; renderNotes(); setStatus(`已切换${label}`);
  }));
  lab.querySelectorAll('[data-meter]').forEach((button) => button.addEventListener('click', () => {
    const meter = button.dataset.meter;
    lab.querySelectorAll('[data-meter]').forEach((item) => { const active = item === button; item.classList.toggle('active', active); item.setAttribute('aria-pressed', String(active)); });
    const [top, bottom] = meter.split('/');
    lab.querySelector('[data-meter-top]').textContent = top; lab.querySelector('[data-meter-bottom]').textContent = bottom; lab.querySelector('[data-meter-label]').textContent = meter.replace('/', ' / '); lab.querySelector('[data-guide-meter]').textContent = `${meter} 表示每小节有 ${meter[0]} 拍，四分音符占一拍。`; setStatus(`已切换 ${meter} 拍`);
  }));
  const tempo = lab.querySelector('[data-tempo]');
  tempo.addEventListener('input', () => { const value = tempo.value; lab.querySelector('[data-tempo-value]').textContent = value; lab.querySelector('[data-tempo-label]').textContent = `Andante · ${value} BPM`; lab.querySelector('[data-guide-tempo]').textContent = `${value} BPM 表示每分钟 ${value} 拍。`; });
  lab.querySelectorAll('.notation-note').forEach((button) => {
    const audition = () => { play(button.dataset.note); button.classList.add('is-playing'); setStatus(`正在试听 ${button.dataset.note.slice(0, -1)}`); setTimeout(() => button.classList.remove('is-playing'), 330); };
    button.addEventListener('click', audition);
    button.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        audition();
      }
    });
  });
  lab.querySelector('.notation-play').addEventListener('click', () => { lab.querySelectorAll('.notation-note').forEach((button, index) => { play(button.dataset.note, index * 0.52); setTimeout(() => button.classList.add('is-playing'), index * 520); setTimeout(() => button.classList.remove('is-playing'), index * 520 + 410); }); setStatus('正在播放一小节'); });
  const practice = document.querySelector('.notation-check');
  if (!practice) return;
  let target = null;
  practice.querySelector('.notation-question-play').addEventListener('click', () => { target = notes[Math.floor(Math.random() * notes.length)]; play(target); practice.querySelector('[data-notation-feedback]').textContent = '选择你听到的音名。'; });
  practice.addEventListener('click', (event) => { const answer = event.target.closest('[data-notation-answer]'); if (!answer || !target) return; const correct = target.startsWith(answer.dataset.notationAnswer); const feedback = practice.querySelector('[data-notation-feedback]'); feedback.className = `pitch-practice-feedback ${correct ? 'is-correct' : 'is-wrong'}`; feedback.textContent = correct ? `正确，这是 ${target.slice(0, -1)}。` : '再听一次，注意它在音阶中的位置。'; if (correct) target = null; });
})();