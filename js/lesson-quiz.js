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
      { q: '钢琴键盘上，观察哪种黑键组合最容易找到 C？', options: ['一颗黑键', '两颗黑键', '三颗黑键', '没有黑键'], answer: 1 }
    ],
    'pitches-melodies': [
      { q: 'Melodies 音轨最常承担什么任务？', options: ['表达主要音乐动机', '只控制速度', '只播放鼓点', '记录歌词'], answer: 0 },
      { q: '让旋律更容易被记住的常用方法是？', options: ['不断加入更多音', '重复短动机并小幅变化', '每个音都随机变化', '只使用休止'], answer: 1 },
      { q: '旋律中的休止通常有什么作用？', options: ['让音乐完全停止', '制造呼吸和空间', '改变乐器名称', '让 BPM 翻倍'], answer: 1 }
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
    'beat-we-will-rock-you': [
      { q: '示例中的经典节奏可以简化为哪一种？', options: ['咚、咚、啪', '啪、啪、咚', '咚、啪、啪、啪', '只有连续拍手'], answer: 0 },
      { q: '示例中前两个重击主要起到什么作用？', options: ['模拟脚步感', '演奏旋律', '改变音高', '替代 BPM'], answer: 0 },
      { q: '调整 BPM 会改变什么？', options: ['乐器名称', '节奏播放速度', '网格行数', '歌曲标题'], answer: 1 }
    ],
    chords: [
      { q: '「音程」指的是什么？', options: ['一个音的响度', '两个音之间的距离', '乐曲的长度', '乐器的数量'], answer: 1 },
      { q: '多个音同时发声组成的是？', options: ['音阶', '节拍', '和弦', '音名'], answer: 2 },
      { q: '连接低音与和弦、为音乐提供律动和重心的是哪条音轨？', options: ['Melodies 音轨', 'Chords 音轨', 'Basslines 音轨', '人声音轨'], answer: 2 }
    ],
    'chords-intervals': [
      { q: '「音程」指的是什么？', options: ['一个音的响度', '两个音之间的距离', '乐曲的长度', '乐器的数量'], answer: 1 },
      { q: '两个半音组成的是？', options: ['一个全音', '一个八度', '一个拍子', '一个和弦'], answer: 0 },
      { q: '单音听辨练习主要训练什么？', options: ['音符位置和音程大小的判断', '演奏速度', '歌词记忆', '乐器维修'], answer: 0 }
    ],
    'chords-chords': [
      { q: '多个音同时发声组成的是？', options: ['音阶', '节拍', '和弦', '音名'], answer: 2 },
      { q: '三和弦由根音、三度音和什么组成？', options: ['四度音', '五度音', '七度音', '八度音'], answer: 1 },
      { q: 'C 小三和弦的简化标记是？', options: ['C', 'Cm', 'Caug', 'Cdim'], answer: 1 }
    ],
    'tones-intro': [
      { q: '调式主要组织的是什么？', options: ['音高关系', '歌词长度', '演奏姿势', '音响设备'], answer: 0 },
      { q: '判断一段音乐的归属感时，应特别留意哪个音？', options: ['主音', '噪音', '最高音', '最后一个鼓点'], answer: 0 },
      { q: '调式基础之后的学习顺序首先进入哪一部分？', options: ['贝斯音色', '自然大调与小调', '混音压缩', '舞台灯光'], answer: 1 }
    ],
    'tones-major-minor': [
      { q: 'C 大调使用哪些音？', options: ['C、D、E、F、G、A、B', 'A、B、C、D、E、F、G#', 'C、D、F、G、A、Bb、B', 'C、Eb、F、G、Bb、C、D'], answer: 0 },
      { q: 'A 自然小调与 C 大调的关系是？', options: ['使用相同音符但主音不同', '完全没有共同音', '只差一个节拍', '必须使用黑键'], answer: 0 },
      { q: '和声小调通常升高哪个音级？', options: ['第二级', '第三级', '第六级', '第七级'], answer: 3 }
    ],
    'tones-common-modes': [
      { q: 'Dorian 多利亚调式的典型特征是什么？', options: ['小调第三音与明亮的第六音', '没有主音', '只有五个音', '必须使用升高的第四音'], answer: 0 },
      { q: 'Lydian 利底亚调式的特征音是？', options: ['降低的第二音', '升高的第四音', '降低的第七音', '升高的第七音'], answer: 1 },
      { q: '切换调式音轨时，最适合先比较什么？', options: ['主音和特征音的听感', '页面背景颜色', '文件名长度', '按钮数量'], answer: 0 }
    ],
    'tones-chord-connection': [
      { q: '罗马数字和弦标记的主要作用是什么？', options: ['表示和弦在调内的级数', '表示乐器音量', '表示节拍速度', '表示采样文件名'], answer: 0 },
      { q: '哪个功能通常提供回到主和弦的张力？', options: ['属功能', '装饰音', '休止符', '拍号'], answer: 0 },
      { q: '让声部连接更平滑的常用方法是？', options: ['保留共同音并减少跳跃', '每个声部都随机跳跃', '只改变 BPM', '删除所有低音'], answer: 0 }
    ],
    'tones-chord-color': [
      { q: '同主音转换保留了什么？', options: ['主音', '所有和弦质量', '所有旋律音', '拍号'], answer: 0 },
      { q: '从平行调式中借来和弦，主要用于什么？', options: ['制造新的色彩', '固定鼓点速度', '增加页面内容', '替代主音'], answer: 0 },
      { q: '拼接两个色彩段落时，什么可以帮助建立连续感？', options: ['共同音或共同和弦', '完全随机的低音', '突然删除节奏', '只提高音量'], answer: 0 }
    ],
    melodies: [
      { q: '连续级进通常会给旋律带来什么听感？', options: ['更平滑的歌唱性', '完全没有方向', '固定的鼓点', '更大的音量'], answer: 0 },
      { q: '歌曲创作中，动机最适合先发展成什么？', options: ['短小的节奏或音程材料', '整张专辑的封面', '混音预设', '舞台灯光'], answer: 0 },
      { q: '副歌在常见歌曲结构中的主要作用是什么？', options: ['集中主题与记忆点', '只提供背景噪声', '替代所有主歌', '固定乐器音色'], answer: 0 }
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
