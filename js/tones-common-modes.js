/* 七种常见调式八度音阶编写练习。 */
(() => {
  'use strict';

  const practice = document.querySelector('[data-common-modes-practice]');
  const panel = document.querySelector('[data-chord-track-lab="modes-scales"] .chord-sequencer-panel');
  if (!practice || !panel) return;

  const STEPS = 16;
  const modes = [
    { modeType: 'ionian', name: '自然大调', intervals: [0, 2, 4, 5, 7, 9, 11, 12] },
    { modeType: 'dorian', name: '多利亚', intervals: [0, 2, 3, 5, 7, 9, 10, 12] },
    { modeType: 'phrygian', name: '弗里几亚', intervals: [0, 1, 3, 5, 7, 8, 10, 12] },
    { modeType: 'lydian', name: '利底亚', intervals: [0, 2, 4, 6, 7, 9, 11, 12] },
    { modeType: 'mixolydian', name: '混合利底亚', intervals: [0, 2, 4, 5, 7, 9, 10, 12] },
    { modeType: 'aeolian', name: '自然小调', intervals: [0, 2, 3, 5, 7, 8, 10, 12] },
    { modeType: 'locrian', name: '洛克里亚', intervals: [0, 1, 3, 5, 6, 8, 10, 12] }
  ];
  const directions = [{ directionName: '上行', sign: 1 }, { directionName: '下行', sign: -1 }];
  const roots = [['C', 0], ['D', 2], ['E', 4], ['F', 5], ['G', 7], ['A', 9], ['B', 11]];
  const startButton = practice.querySelector('[data-common-modes-practice-start]');
  const exampleButton = practice.querySelector('[data-common-modes-practice-example]');
  const question = practice.querySelector('[data-common-modes-practice-question]');
  const feedback = practice.querySelector('[data-common-modes-practice-feedback]');
  const cells = () => [...panel.querySelectorAll('.chord-sequencer-cell')];
  const rowForMidi = (midi) => {
    const targetName = `${['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'][midi % 12]}${Math.floor(midi / 12) - 1}`;
    return cells().find((cell) => cell.closest('.chord-sequencer-row')?.querySelector('b')?.textContent === targetName)?.dataset.row;
  };
  const shuffle = (items) => {
    const result = [...items];
    for (let index = result.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [result[index], result[swap]] = [result[swap], result[index]];
    }
    return result;
  };
  const candidates = roots.flatMap(([root, pitch]) => modes.flatMap((mode) => directions.map((direction) => ({ root, pitch, ...mode, ...direction }))));
  let questions = [];
  let questionIndex = -1;
  let current = null;
  let nextTimer = null;

  const setFeedback = (text, type = '') => {
    feedback.textContent = text;
    feedback.className = `interval-practice-feedback${type ? ` is-${type}` : ''}`;
  };
  const clearTrack = () => panel.querySelector('[data-clear]')?.click();
  const expectedMidis = ({ pitch, intervals, sign }) => {
    const ascending = intervals.map((interval) => 48 + pitch + interval);
    return sign === 1 ? ascending : ascending.reverse();
  };
  const isCorrect = () => {
    if (!current) return false;
    const expectedBlocks = expectedMidis(current).map((midi, index) => {
      const row = rowForMidi(midi);
      return row === undefined ? null : `${row}:${index * 2}`;
    });
    if (expectedBlocks.includes(null)) return false;
    const activeCells = cells().filter((cell) => cell.classList.contains('is-active'))
      .map((cell) => `${cell.dataset.row}:${cell.dataset.step}`);
    const expectedCells = expectedBlocks.flatMap((key) => {
      const [row, start] = key.split(':');
      return [`${row}:${start}`, `${row}:${Number(start) + 1}`];
    });
    const actualBlocks = cells().filter((cell) => cell.classList.contains('is-merged-start'))
      .map((cell) => {
        const row = cell.dataset.row;
        const start = Number(cell.dataset.step);
        const end = cells().find((item) => item.dataset.row === row && Number(item.dataset.step) === start + 1);
        return end?.classList.contains('is-merged-end') ? `${row}:${start}` : null;
      }).filter(Boolean);
    return activeCells.length === expectedCells.length
      && activeCells.every((key) => expectedCells.includes(key))
      && actualBlocks.length === expectedBlocks.length
      && actualBlocks.every((key) => expectedBlocks.includes(key));
  };
  const nextQuestion = () => {
    if (nextTimer) { window.clearTimeout(nextTimer); nextTimer = null; }
    questionIndex += 1;
    if (questionIndex >= questions.length) {
      current = null;
      question.textContent = '八题完成！按下“重新开始”再来一轮。';
      startButton.textContent = '重新开始';
      setFeedback('');
      return;
    }
    current = questions[questionIndex];
    clearTrack();
    question.textContent = `第 ${questionIndex + 1} / 8 题：写出${current.root}${current.name}${current.directionName}音阶。`;
    setFeedback('');
  };

  startButton.addEventListener('click', () => {
    questions = shuffle(candidates).slice(0, 8);
    questionIndex = -1;
    current = null;
    startButton.textContent = '重新开始';
    nextQuestion();
  });

  exampleButton.addEventListener('click', () => {
    if (!current) startButton.click();
    const expected = expectedMidis(current);
    window.MusicLabModesTrack?.fillBlocks(expected.map((midi, index) => ({
      row: rowForMidi(midi),
      start: index * 2,
      length: 2
    })));
    setFeedback('示例已填充，可以点击播放试听。', 'correct');
  });

  panel.addEventListener('click', (event) => {
    const playButton = event.target.closest('[data-play]');
    if (!playButton || !current) return;
    if (!isCorrect()) {
      setFeedback('调式、顺序或音符不对，再试试吧！', 'wrong');
      return;
    }
    setFeedback('正确！', 'correct');
    const bpm = Number(panel.querySelector('[data-bpm]')?.value || 72);
    nextTimer = window.setTimeout(nextQuestion, (STEPS * 60000) / (bpm * 4) + 400);
  }, true);
})();
