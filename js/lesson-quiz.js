/*
 * 章节小测（js/lesson-quiz.js）
 * 每个教程页面末尾的 <section data-lesson-quiz> 会渲染 3 道选择题。
 * 只有全部答对，MusicLab.progress.markCompleted() 才会把该章节计入学习进度，
 * 仅打开页面不再算作“已学习”。题目按 body[data-lesson] 选取。
 */
(() => {
  'use strict';

  const QUIZZES = {
    index: [
      { q: '教程首页展示的四个示例音轨不包括下面哪一个？', options: ['节奏', '贝斯', '人声', '旋律'], answer: 2 },
      { q: 'MusicLab 的两大核心功能是？', options: ['视频剪辑与配音', '乐理学习与 DAW 创作', '歌词写作与投稿', '演出购票'], answer: 1 },
      { q: '在「游乐园」里你可以做什么？', options: ['只能试听示例', '自己点亮音轨方块进行创作', '上传照片', '购买乐器'], answer: 1 }
    ],
    pitches: [
      { q: '唱名 do 对应的音名是？', options: ['C', 'D', 'E', 'G'], answer: 0 },
      { q: '音名 G 对应的唱名是？', options: ['la', 'mi', 'sol', 'fa'], answer: 2 },
      { q: '阅读五线谱时，通常应该先确认什么？', options: ['歌词', '拍号和速度', '作者', '封面'], answer: 1 }
    ],
    beat: [
      { q: '华尔兹最常使用的拍子是？', options: ['4/4', '2/4', '3/4', '7/8'], answer: 2 },
      { q: '流行、摇滚和古典作品中最常见的基础节拍是？', options: ['4/4', '3/4', '5/4', '6/8'], answer: 0 },
      { q: '课文把「强拍」形容为什么？', options: ['音乐最安静的部分', '音乐的落脚点', '只在结尾出现的拍子', '可以忽略的拍子'], answer: 1 }
    ],
    'beat-instruments': [
      { q: '鼓组中声音最厚重低沉、负责强调重拍的是？', options: ['Snare', 'Kick', 'Ride', 'Clap'], answer: 1 },
      { q: 'Open-Hat 和 Closed-Hat 属于哪一类乐器？', options: ['鼓类', '弦乐', '镲类', '键盘'], answer: 2 },
      { q: '下面哪一个不是 Beat 音轨用到的 8 种乐器之一？', options: ['Tom', 'Crash', '小提琴', 'Snare'], answer: 2 }
    ],
    'beat-track': [
      { q: '在 Beat 音轨演示里，几个方格算作一拍？', options: ['1 格', '2 格', '4 格', '8 格'], answer: 2 },
      { q: '舒缓的音乐没有强烈的鼓点，这说明什么？', options: ['这类音乐没有节奏', '节奏仍然存在，只是不那么明显', '节奏由歌词决定', '速度不重要'], answer: 1 },
      { q: '想让播放线直接跳到某一拍，正确的做法是？', options: ['等它播完这一轮', '刷新页面', '点击或拖动顶部的标尺', '把 BPM 调到最大'], answer: 2 }
    ],
    chords: [
      { q: '「音程」指的是什么？', options: ['一个音的响度', '两个音之间的距离', '乐曲的长度', '乐器的数量'], answer: 1 },
      { q: '多个音同时发声组成的是？', options: ['音阶', '节拍', '和弦', '音名'], answer: 2 },
      { q: '连接低音与和弦、为音乐提供律动和重心的是哪条音轨？', options: ['Melodies 音轨', 'Chords 音轨', 'Basslines 音轨', '人声音轨'], answer: 2 }
    ],
    tones: [
      { q: '下面哪一项不属于课文列出的四种基础调式？', options: ['大调', '自然小调', '多利亚调式', '和声小调'], answer: 2 },
      { q: '民族调式的特点是？', options: ['只能用钢琴演奏', '拥有独特的音阶结构，能表现地域文化色彩', '没有固定音高', '必须是 4/4 拍'], answer: 1 },
      { q: '多利亚、弗里几亚、利底亚属于？', options: ['拍号', '更多调式（教会调式）', '打击乐器', '唱名'], answer: 1 }
    ],
    others: [
      { q: '课文建议在基础乐理之后继续学习哪些内容？', options: ['配器、录音、混音和编曲', '摄影与剪辑', '舞台灯光', '乐器维修'], answer: 0 },
      { q: '进一步了解曲式、调性、复节奏和音色设计，有助于？', options: ['降低音量', '建立更完整的音乐创作方法', '缩短乐曲', '取消节奏'], answer: 1 },
      { q: '学完全部基础章节后，网站推荐你去哪里实践？', options: ['设置页', '开发组介绍', '游乐园进行创作', '登录页'], answer: 2 }
    ]
  };

  const ML = window.MusicLab;
  const mount = document.querySelector('[data-lesson-quiz]');
  if (!ML || !mount) return;

  const key = mount.dataset.lessonQuiz || document.body.dataset.lesson || ML.progress.currentKey();
  const questions = QUIZZES[key];
  if (!questions) { mount.remove(); return; }

  const lessonIndex = ML.progress.lessons.findIndex((l) => l.key === key);
  const nextLesson = ML.progress.lessons[lessonIndex + 1] || null;
  const esc = ML.escapeHTML;

  // 折叠面板：默认收起，不把页面撑长；通过 #lessonQuiz 锚点进入时自动展开
  mount.id = mount.id || 'lessonQuiz';
  const ui = { open: window.location.hash === `#${mount.id}` };

  const setOpen = (open, { focus = false } = {}) => {
    ui.open = open;
    mount.classList.toggle('is-open', open);
    const toggle = mount.querySelector('.lesson-quiz-toggle');
    const body = mount.querySelector('.lesson-quiz-body');
    if (toggle) toggle.setAttribute('aria-expanded', String(open));
    if (body) body.setAttribute('aria-hidden', String(!open));
    if (open && focus) {
      const first = mount.querySelector('.lesson-quiz-form input');
      if (first) setTimeout(() => first.focus({ preventScroll: true }), 320);
    }
  };

  const render = () => {
    const record = ML.progress.completed()[key];
    const badgeText = record ? '已完成' : ML.progress.owner() ? '未完成' : '未登录';
    mount.innerHTML = `
      <button type="button" class="lesson-quiz-toggle" aria-expanded="${ui.open}" aria-controls="lessonQuizBody">
        <span class="lesson-quiz-toggle-main">
          <h2 id="lessonQuizTitle">章节小测</h2>
          <span class="status-badge ${record ? 'online' : 'offline'}" id="lessonQuizBadge">${badgeText}</span>
        </span>
        <span class="lesson-quiz-toggle-side">
          <span class="lesson-quiz-toggle-hint">${questions.length} 道选择题 · ${record ? '可重做' : '答对全部即完成本章'}</span>
          <svg class="lesson-quiz-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>
        </span>
      </button>
      <div class="lesson-quiz-body" id="lessonQuizBody" aria-hidden="${!ui.open}">
      <div class="lesson-quiz-body-inner">
      <p class="settings-note lesson-quiz-intro">答对全部 ${questions.length} 题即可完成本章并计入学习进度。答错可以立刻重试。${ML.progress.owner() ? '' : `当前未登录：可以先做题，<a href="${ML.url('login/login.html')}">登录</a>后自动计入。`}</p>
      <form class="lesson-quiz-form" id="lessonQuizForm" novalidate>
        ${questions.map((item, qi) => `
          <fieldset class="quiz-question" data-question="${qi}">
            <legend><span class="quiz-index">${qi + 1}</span>${esc(item.q)}</legend>
            <div class="quiz-options">
              ${item.options.map((option, oi) => `
                <label class="quiz-option">
                  <input type="radio" name="q${qi}" value="${oi}" required>
                  <span>${esc(option)}</span>
                </label>`).join('')}
            </div>
            <p class="quiz-feedback" aria-live="polite"></p>
          </fieldset>`).join('')}
        <div class="form-actions">
          <button type="submit" class="ml-btn" id="lessonQuizSubmit">提交答案</button>
          <button type="button" class="ml-btn secondary" id="lessonQuizReset">重做</button>
          ${record && nextLesson ? `<a class="ml-btn secondary" href="${nextLesson.file}">下一章：${esc(nextLesson.title)} →</a>` : ''}
          <span class="form-status" id="lessonQuizStatus" aria-live="polite">${record ? `上次通过：${new Date(record.at).toLocaleString('zh-CN')}` : ''}</span>
        </div>
      </form>
      </div>
      </div>`;

    mount.classList.toggle('is-open', ui.open);
    mount.querySelector('.lesson-quiz-toggle').addEventListener('click', () => setOpen(!ui.open, { focus: true }));

    const form = mount.querySelector('#lessonQuizForm');
    const status = mount.querySelector('#lessonQuizStatus');
    const badge = mount.querySelector('#lessonQuizBadge');

    const clearMarks = () => {
      mount.querySelectorAll('.quiz-question').forEach((fs) => {
        fs.classList.remove('is-correct', 'is-wrong');
        fs.querySelector('.quiz-feedback').textContent = '';
      });
    };

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!ui.open) setOpen(true);
      clearMarks();
      let answered = 0;
      let correct = 0;
      let firstUnanswered = null;

      questions.forEach((item, qi) => {
        const fs = mount.querySelector(`[data-question="${qi}"]`);
        const picked = form.querySelector(`input[name="q${qi}"]:checked`);
        const feedback = fs.querySelector('.quiz-feedback');
        if (!picked) {
          if (!firstUnanswered) firstUnanswered = fs;
          feedback.textContent = '还没有作答';
          fs.classList.add('is-wrong');
          return;
        }
        answered += 1;
        if (Number(picked.value) === item.answer) {
          correct += 1;
          fs.classList.add('is-correct');
          feedback.textContent = '✓ 正确';
        } else {
          fs.classList.add('is-wrong');
          feedback.textContent = '✗ 再想想，可以回到上面的课文找找答案';
        }
      });

      if (answered < questions.length) {
        status.className = 'form-status error';
        status.textContent = `还有 ${questions.length - answered} 题未作答`;
        firstUnanswered.scrollIntoView({ behavior: 'smooth', block: 'center' });
        ML.toast('请先完成所有题目', { type: 'warning' });
        return;
      }

      if (correct === questions.length) {
        const isNew = ML.progress.markCompleted(key, { score: correct, total: questions.length });
        status.className = 'form-status success';
        badge.className = 'status-badge online';
        if (ML.progress.owner()) {
          status.textContent = `全部答对！本章已计入学习进度（${ML.progress.percent()}%）`;
          badge.textContent = '已完成';
          ML.toast(isNew ? '章节完成！学习进度已更新' : '再次全部答对，本章已是完成状态', { type: 'success' });
        } else {
          status.innerHTML = `全部答对！<a href="${ML.url('login/login.html')}">登录</a>后本章会自动计入你的学习进度`;
          badge.textContent = '已通过（未登录）';
          ML.toast('全部答对！登录后会自动计入进度', { type: 'success' });
        }
        // 通过后把「下一章」按钮补上
        if (nextLesson && !form.querySelector('a.ml-btn')) {
          const link = document.createElement('a');
          link.className = 'ml-btn secondary';
          link.href = nextLesson.file;
          link.textContent = `下一章：${nextLesson.title} →`;
          form.querySelector('.form-actions').insertBefore(link, status);
        }
      } else {
        status.className = 'form-status error';
        status.textContent = `答对 ${correct} / ${questions.length} 题，修改错误的题目后再次提交即可`;
        ML.toast(`答对 ${correct} / ${questions.length}，再试一次！`, { type: 'info' });
      }
    });

    mount.querySelector('#lessonQuizReset').addEventListener('click', () => {
      form.reset();
      clearMarks();
      status.className = 'form-status';
      status.textContent = '';
    });
  };

  mount.setAttribute('aria-labelledby', 'lessonQuizTitle');
  render();
  window.addEventListener('hashchange', () => {
    if (window.location.hash === `#${mount.id}`) setOpen(true, { focus: true });
  });
  // 进度与账号绑定：登录 / 退出 / 重置后按当前账号的记录重新渲染
  window.addEventListener('musiclab:progress', (event) => {
    if (event.detail && event.detail.key === key) return;
    render();
  });
})();
