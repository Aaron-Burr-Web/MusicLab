/*
 * MusicLab shared UI layer (js/musiclab-ui.js)
 *
 * Loaded in <head> on every page so the saved theme is applied before the
 * first paint. Everything that touches the DOM waits for DOMContentLoaded.
 *
 * Exposes window.MusicLab = {
 *   root, storage, toast, toastAfterReload,
 *   theme:    { get, set, toggle, resolved }
 *   auth:     { isLoggedIn, currentUser, register, login, logout }
 *   progress: { lessons, markCompleted, completed, percent, reset, currentKey }
 *   directory: { render }
 *   search:   { index, query }
 * }
 */
(() => {
  'use strict';

  const root = document.documentElement;

  const STORAGE = {
    theme: 'musiclab_theme',
    loginState: 'musiclab_login_state',
    clientName: 'musiclab_client_name',
    users: 'musiclab_users',
    progress: 'musiclab_progress_v2',   // 前缀；每个账号一份：`${progress}::user:<name>`。未登录不记录、不显示进度
    pendingPass: 'musiclab_pending_pass', // 访客通过的小测（sessionStorage），登录后自动计入
    lastLesson: 'musiclab_last_lesson',   // 每个账号最近访问的章节：`${lastLesson}::user:<name>`
    justLoggedIn: 'musiclab_just_logged_in', // sessionStorage：刚登录 / 注册，用于首页欢迎体验
    feedback: 'musiclab_feedback',
    pendingToast: 'musiclab_pending_toast'
  };

  /* ------------------------------------------------------------------ */
  /* helpers                                                             */
  /* ------------------------------------------------------------------ */
  const readJSON = (store, key, fallback) => {
    try {
      const raw = store.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  };

  const writeJSON = (store, key, value) => {
    try {
      store.setItem(key, JSON.stringify(value));
    } catch (_) { /* storage may be unavailable (private mode) */ }
  };

  const pagePath = decodeURIComponent(window.location.pathname || '');
  const SUB_FOLDERS = /\/(introduction|Start Learning|The Playground|settings|login|contact)\//i;
  // Relative prefix that leads back to the project root from the current page.
  const ROOT = SUB_FOLDERS.test(pagePath) ? '../' : '';
  const url = (relative) => ROOT + relative;

  const escapeHTML = (value) => String(value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  const onReady = (fn) => {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn, { once: true });
    else fn();
  };

  /* ------------------------------------------------------------------ */
  /* theme (system-aware, persisted)                                     */
  /* ------------------------------------------------------------------ */
  const systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  const theme = {
    // 'light' | 'dark' | 'system'
    get() {
      const saved = localStorage.getItem(STORAGE.theme);
      return saved === 'light' || saved === 'dark' ? saved : 'system';
    },
    resolved() {
      const pref = theme.get();
      if (pref !== 'system') return pref;
      return systemDark && systemDark.matches ? 'dark' : 'light';
    },
    apply() {
      const resolved = theme.resolved();
      root.setAttribute('data-theme', resolved);
      root.style.colorScheme = resolved;
      swapLogos(resolved);
      document.querySelectorAll('[data-theme-option]').forEach((btn) => {
        btn.setAttribute('aria-pressed', String(btn.dataset.themeOption === theme.get()));
      });
      window.dispatchEvent(new CustomEvent('musiclab:theme', { detail: { theme: resolved, preference: theme.get() } }));
      return resolved;
    },
    set(pref) {
      if (pref === 'system') localStorage.removeItem(STORAGE.theme);
      else localStorage.setItem(STORAGE.theme, pref === 'dark' ? 'dark' : 'light');
      return theme.apply();
    },
    toggle() {
      return theme.set(theme.resolved() === 'dark' ? 'light' : 'dark');
    }
  };

  const swapLogos = (resolved) => {
    if (!document.body) return;
    document.querySelectorAll('.Logo img, .site-footer-brand img').forEach((img) => {
      const src = img.getAttribute('src') || '';
      const target = resolved === 'dark' ? 'MusicLabWhiteLogo.png' : 'MusicLabBlackLogo.png';
      if (/MusicLab(Black|White)Logo\.png$/.test(src) && !src.endsWith(target)) {
        img.setAttribute('src', src.replace(/MusicLab(Black|White)Logo\.png$/, target));
      }
    });
  };

  // Apply as early as possible (before body exists) to avoid a flash.
  theme.apply();
  if (systemDark) {
    const onSystemChange = () => { if (theme.get() === 'system') theme.apply(); };
    if (systemDark.addEventListener) systemDark.addEventListener('change', onSystemChange);
    else if (systemDark.addListener) systemDark.addListener(onSystemChange);
  }

  /* ------------------------------------------------------------------ */
  /* toast notifications                                                 */
  /* ------------------------------------------------------------------ */
  let toastRegion = null;

  const ensureToastRegion = () => {
    if (toastRegion && document.body.contains(toastRegion)) return toastRegion;
    toastRegion = document.createElement('div');
    toastRegion.className = 'ml-toast-region';
    toastRegion.setAttribute('role', 'status');
    toastRegion.setAttribute('aria-live', 'polite');
    document.body.appendChild(toastRegion);
    return toastRegion;
  };

  const TOAST_ICONS = { success: '✓', error: '!', warning: '!', info: 'i' };

  const toast = (message, options = {}) => {
    const { type = 'info', duration = 3600 } = options;
    const region = ensureToastRegion();
    const node = document.createElement('div');
    node.className = `ml-toast ${type}`;
    node.innerHTML = `
      <span class="ml-toast-icon" aria-hidden="true">${TOAST_ICONS[type] || TOAST_ICONS.info}</span>
      <div class="ml-toast-body">${escapeHTML(message)}</div>
      <button type="button" class="ml-toast-close" aria-label="关闭提示">×</button>`;

    let timer = null;
    const dismiss = () => {
      clearTimeout(timer);
      node.classList.add('is-leaving');
      setTimeout(() => node.remove(), 260);
    };
    node.querySelector('.ml-toast-close').addEventListener('click', dismiss);
    node.addEventListener('mouseenter', () => clearTimeout(timer));
    node.addEventListener('mouseleave', () => { timer = setTimeout(dismiss, 1500); });
    region.appendChild(node);
    if (duration > 0) timer = setTimeout(dismiss, duration);
    return dismiss;
  };

  // Queue a toast to be shown on the next page (used around redirects).
  /* ------------------------------------------------------------------ */
  /* 确认对话框：MusicLab.confirm(message, options) -> Promise<boolean>    */
  /* ------------------------------------------------------------------ */
  const confirmDialog = (message, options = {}) => {
    const { title = '请确认', confirmText = '确定', cancelText = '取消', danger = false } = options;
    return new Promise((resolve) => {
      const previouslyFocused = document.activeElement;
      const overlay = document.createElement('div');
      overlay.className = 'ml-confirm-overlay';
      overlay.innerHTML = `
        <div class="ml-confirm" role="alertdialog" aria-modal="true" aria-labelledby="mlConfirmTitle" aria-describedby="mlConfirmMessage">
          <h3 id="mlConfirmTitle">${escapeHTML(title)}</h3>
          <p id="mlConfirmMessage">${escapeHTML(message)}</p>
          <div class="form-actions ml-confirm-actions">
            <button type="button" class="ml-btn secondary" data-confirm="no">${escapeHTML(cancelText)}</button>
            <button type="button" class="ml-btn${danger ? ' danger' : ''}" data-confirm="yes">${escapeHTML(confirmText)}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      document.body.classList.add('ml-confirm-open');

      const finish = (result) => {
        overlay.classList.add('is-leaving');
        document.body.classList.remove('ml-confirm-open');
        document.removeEventListener('keydown', onKey);
        setTimeout(() => overlay.remove(), 200);
        if (previouslyFocused && previouslyFocused.focus) previouslyFocused.focus();
        resolve(result);
      };
      const onKey = (event) => {
        if (event.key === 'Escape') { event.preventDefault(); finish(false); }
        if (event.key === 'Tab') {
          // 焦点留在对话框内
          const buttons = [...overlay.querySelectorAll('button')];
          const index = buttons.indexOf(document.activeElement);
          const next = event.shiftKey ? (index <= 0 ? buttons.length - 1 : index - 1) : (index === buttons.length - 1 ? 0 : index + 1);
          event.preventDefault();
          buttons[next].focus();
        }
      };
      overlay.addEventListener('click', (event) => {
        const action = event.target.closest('[data-confirm]');
        if (action) finish(action.dataset.confirm === 'yes');
        else if (event.target === overlay) finish(false);
      });
      document.addEventListener('keydown', onKey);
      requestAnimationFrame(() => {
        overlay.classList.add('is-open');
        overlay.querySelector('[data-confirm="no"]').focus();
      });
    });
  };

  const toastAfterReload = (message, type = 'info') => {
    writeJSON(sessionStorage, STORAGE.pendingToast, { message, type });
  };

  const flushPendingToast = () => {
    const pending = readJSON(sessionStorage, STORAGE.pendingToast, null);
    if (!pending) return;
    sessionStorage.removeItem(STORAGE.pendingToast);
    toast(pending.message, { type: pending.type });
  };

  /* ------------------------------------------------------------------ */
  /* auth (front-end only, localStorage backed)                          */
  /* ------------------------------------------------------------------ */
  const hashPassword = async (password) => {
    if (window.crypto && crypto.subtle && window.TextEncoder) {
      try {
        const data = new TextEncoder().encode(`musiclab::${password}`);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(digest)).map((b) => b.toString(16).padStart(2, '0')).join('');
      } catch (_) { /* fall through */ }
    }
    // Fallback for non-secure contexts: not cryptographic, only obfuscation.
    let h = 0;
    for (let i = 0; i < password.length; i += 1) h = (Math.imul(31, h) + password.charCodeAt(i)) | 0;
    return `plain:${h}`;
  };

  const auth = {
    isLoggedIn: () => localStorage.getItem(STORAGE.loginState) === 'true',
    currentUser: () => {
      if (!auth.isLoggedIn()) return null;
      const name = (localStorage.getItem(STORAGE.clientName) || '').trim();
      return name || '用户';
    },
    users: () => readJSON(localStorage, STORAGE.users, {}),
    async register(username, password) {
      const name = String(username || '').trim();
      if (!name) return { ok: false, message: '请输入用户名' };
      if (!String(password || '')) return { ok: false, message: '请输入密码' };
      const users = auth.users();
      if (users[name.toLowerCase()]) return { ok: false, message: '该用户名已被注册，请直接登录' };
      users[name.toLowerCase()] = { name, hash: await hashPassword(password), createdAt: new Date().toISOString() };
      writeJSON(localStorage, STORAGE.users, users);
      auth.setSession(name, { isNew: true });
      return { ok: true, name };
    },
    async login(username, password) {
      const name = String(username || '').trim();
      const record = auth.users()[name.toLowerCase()];
      if (!record) return { ok: false, field: 'username', message: '用户不存在，请先注册' };
      if (record.hash !== await hashPassword(password)) return { ok: false, field: 'password', message: '密码不正确' };
      auth.setSession(record.name);
      return { ok: true, name: record.name };
    },
    setSession(name, { isNew = false } = {}) {
      localStorage.setItem(STORAGE.clientName, name);
      localStorage.setItem(STORAGE.loginState, 'true');
      // 访客期间通过的小测，登录后补记到账号里
      const pending = readJSON(sessionStorage, STORAGE.pendingPass, []);
      let credited = 0;
      pending.forEach((item) => { if (progress.markCompleted(item.key, item, { silent: true })) credited += 1; });
      sessionStorage.removeItem(STORAGE.pendingPass);
      writeJSON(sessionStorage, STORAGE.justLoggedIn, { name, isNew, credited, at: Date.now() });
      window.dispatchEvent(new CustomEvent('musiclab:auth', { detail: { loggedIn: true, name, isNew, credited } }));
      window.dispatchEvent(new CustomEvent('musiclab:progress', { detail: { reason: 'auth' } }));
    },
    logout() {
      localStorage.removeItem(STORAGE.loginState);
      localStorage.removeItem(STORAGE.clientName);
      window.dispatchEvent(new CustomEvent('musiclab:auth', { detail: { loggedIn: false } }));
      window.dispatchEvent(new CustomEvent('musiclab:progress', { detail: { reason: 'auth' } }));
    }
  };

  /* ------------------------------------------------------------------ */
  /* course outline + learning progress                                  */
  /* ------------------------------------------------------------------ */
  // 单一数据源：左侧目录、进度卡片、搜索索引都从这里生成
  const LESSONS = [
    { key: 'index', title: '开始音乐之旅', file: 'index.html', group: '开始音乐之旅',
      sections: [{ title: '引入', hash: 'learningSubtitle' }] },
    { key: 'pitches', title: '音符与记谱', file: 'pitches.html', group: '音符与记谱',
      sections: [
        { title: '音符与记谱', hash: 'pitch-basics' }, { title: '音名与唱名', hash: 'note-names' },
        { title: '钢琴键盘', hash: 'piano-keyboard' }, { title: '谱与音符', hash: 'notation' }
      ] },
    { key: 'beat', title: '节拍和拍子', file: 'beat.html', group: '节奏基础',
      sections: [{ title: '节拍和拍子', hash: 'rhythm-basics' }, { title: '小试一下', hash: 'try-it' }] },
    { key: 'beat-instruments', title: '乐器介绍', file: 'beat-instruments.html', group: '节奏基础',
      sections: [{ title: '乐器介绍', hash: 'instrument-introductions' }] },
    { key: 'beat-track', title: 'Beat 音轨', file: 'beat-track.html', group: '节奏基础',
      sections: [{ title: '在乐曲中', hash: 'in-song' }, { title: 'Beat 音轨', hash: 'beat-track' }] },
    { key: 'chords', title: '音程与和弦', file: 'chords.html', group: '音程与和弦',
      sections: [
        { title: '音程与和弦', hash: 'chord-basics' }, { title: '小试一下', hash: 'chord-practice' },
        { title: '乐器介绍', hash: 'chord-instruments' }, { title: '音程', hash: 'intervals' }, { title: '和弦', hash: 'chords' },
        { title: '音轨', hash: 'chord-tracks' }, { title: 'Chords 音轨', hash: 'chords-track' },
        { title: 'Basslines 音轨', hash: 'basslines-track' }, { title: 'Melodies 音轨', hash: 'melodies-track' },
        { title: '合奏', hash: 'ensemble' }, { title: '单音听辨测试', hash: 'pitch-test' }
      ] },
    { key: 'tones', title: '调式基础', file: 'tones.html', group: '调式基础',
      sections: [
        { title: '调式与音阶', hash: 'mode-basics' }, { title: '小试一下', hash: 'mode-practice' },
        { title: '常见调式', hash: 'common-modes' }, { title: '民族调式', hash: 'folk-modes' },
        { title: '更多调式', hash: 'more-modes' }, { title: '多音和弦听辨测试', hash: 'chord-test' }
      ] },
    { key: 'others', title: '拓展与其他', file: 'others.html', group: '拓展与其他',
      sections: [
        { title: '拓展学习', hash: 'extension-basics' }, { title: '扩展内容', hash: 'extension-content' },
        { title: '更多乐理知识', hash: 'more-theory' }
      ] }
  ];

  const lessonURL = (lesson) => url(`Start Learning/${lesson.file}`);

  // 进度只属于账号：未登录时没有进度（不记录也不显示），登录后读回该账号的记录
  const progressKey = () => {
    const user = auth.currentUser();
    return user ? `${STORAGE.progress}::user:${user.toLowerCase()}` : null;
  };

  const progress = {
    lessons: LESSONS,
    owner: () => auth.currentUser() || null,   // null = 未登录
    // { [key]: { at: ISO, score: n, total: n } } —— 只有通过章节小测才会写入
    completed: () => (progressKey() ? readJSON(localStorage, progressKey(), {}) : {}),
    isCompleted: (key) => Boolean(progress.completed()[key]),
    currentKey() {
      const fromBody = document.body && document.body.dataset.lesson;
      if (fromBody) return fromBody;
      if (!/\/Start Learning\//i.test(pagePath)) return null;
      const file = pagePath.split('/').pop() || 'index.html';
      const lesson = LESSONS.find((l) => l.file === file);
      return lesson ? lesson.key : null;
    },
    markCompleted(key, detail = {}, { silent = false } = {}) {
      if (!LESSONS.some((l) => l.key === key)) return false;
      if (!progressKey()) {
        // 未登录：先暂存在本次会话里，登录后由 setSession 补记
        const pending = readJSON(sessionStorage, STORAGE.pendingPass, []).filter((item) => item.key !== key);
        pending.push({ key, ...detail, at: new Date().toISOString() });
        writeJSON(sessionStorage, STORAGE.pendingPass, pending);
        return false;
      }
      const completed = progress.completed();
      const isNew = !completed[key];
      const { at, ...rest } = detail;
      completed[key] = { at: at || new Date().toISOString(), ...rest };
      writeJSON(localStorage, progressKey(), completed);
      if (!silent) window.dispatchEvent(new CustomEvent('musiclab:progress', { detail: { key, isNew } }));
      return isNew;
    },
    pendingCount: () => readJSON(sessionStorage, STORAGE.pendingPass, []).length,
    // 最近访问的章节（用于“继续学习”）
    lastLesson() {
      const user = auth.currentUser();
      if (!user) return null;
      const key = localStorage.getItem(`${STORAGE.lastLesson}::user:${user.toLowerCase()}`);
      return LESSONS.find((l) => l.key === key) || null;
    },
    rememberLesson(key) {
      const user = auth.currentUser();
      if (user && LESSONS.some((l) => l.key === key)) localStorage.setItem(`${STORAGE.lastLesson}::user:${user.toLowerCase()}`, key);
    },
    // 推荐下一步：优先未完成的“上次章节”，否则第一个未完成章节
    recommended() {
      const last = progress.lastLesson();
      if (last && !progress.isCompleted(last.key)) return last;
      return progress.nextLesson();
    },
    completedCount: () => LESSONS.filter((l) => progress.completed()[l.key]).length,
    percent: () => Math.round((progress.completedCount() / LESSONS.length) * 100),
    nextLesson: () => LESSONS.find((l) => !progress.completed()[l.key]) || null,
    reset() {
      if (progressKey()) localStorage.removeItem(progressKey());
      window.dispatchEvent(new CustomEvent('musiclab:progress', { detail: { reset: true } }));
    }
  };

  const renderLockedProgressCard = (container) => {
    const pending = progress.pendingCount();
    container.innerHTML = `
      <div class="progress-owner">
        <h2>学习进度</h2>
        <span class="status-badge offline">未登录</span>
      </div>
      <div class="progress-locked">
        <div class="progress-locked-icon" aria-hidden="true">🔒</div>
        <div>
          <p class="settings-note">登录后才能查看和记录学习进度。你的进度与账号绑定，换台设备或重新登录都能找回。</p>
          ${pending ? `<p class="settings-note progress-pending">本次会话你已通过 ${pending} 个章节的小测，登录后会自动计入。</p>` : ''}
          <div class="form-actions">
            <a class="ml-btn small" href="${url('login/login.html')}">登录</a>
            <a class="ml-btn small secondary" href="${url('login/registration.html')}">注册账号</a>
            <a class="ml-btn small secondary" href="${url('Start Learning/index.html')}">先逛逛教程</a>
          </div>
        </div>
      </div>`;
  };

  const renderProgressCard = (container) => {
    if (!progress.owner()) { renderLockedProgressCard(container); return; }
    const completed = progress.completed();
    const done = progress.completedCount();
    const next = progress.nextLesson();
    const items = LESSONS.map((lesson) => {
      const record = completed[lesson.key];
      const isCurrent = next && next.key === lesson.key;
      const scoreText = record && record.total ? `${record.score}/${record.total}` : '';
      return `<li><a class="progress-milestone${record ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}" href="${lessonURL(lesson)}" title="${record ? `已通过小测 ${scoreText}` : '尚未通过小测'}">
        <span class="dot" aria-hidden="true">${record ? '✓' : ''}</span>
        <span>${escapeHTML(lesson.title)}</span>
        <span class="sr-only">${record ? '（已完成）' : isCurrent ? '（下一步）' : '（未完成）'}</span>
      </a></li>`;
    }).join('');

    const owner = progress.owner();
    container.innerHTML = `
      <div class="progress-owner">
        <h2>学习进度</h2>
        <span class="status-badge online" title="进度已与该账号绑定">账号：${escapeHTML(owner)}</span>
      </div>
      <p class="settings-note">${done === 0
        ? '每个章节末尾都有一个小测，答对全部题目即视为完成该章节。仅仅打开页面不会计入进度。'
        : done === LESSONS.length
          ? '恭喜！你已经通过全部章节的小测，去游乐园创作属于你的第一首曲子吧。'
          : `已完成 ${done} / ${LESSONS.length} 个章节（以通过章节小测为准），继续保持！`}</p>
      <div class="progress-summary">
        <span>总体进度</span>
        <strong aria-live="polite">${progress.percent()}%</strong>
      </div>
      <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent()}" aria-label="学习进度">
        <div class="progress-bar-fill" style="width:${progress.percent()}%"></div>
      </div>
      <ul class="progress-milestones">${items}</ul>
      <div class="progress-actions">
        <a class="ml-btn small" href="${progress.recommended() ? lessonURL(progress.recommended()) : url('The Playground/index.html')}">${progress.recommended() ? `继续学习：${escapeHTML(progress.recommended().title)}` : '前往游乐园'}</a>
        ${done > 0 ? '<button type="button" class="ml-btn small secondary" data-progress-reset>重置进度</button>' : ''}
      </div>`;

    const resetButton = container.querySelector('[data-progress-reset]');
    if (resetButton) {
      resetButton.addEventListener('click', async () => {
        const ok = await confirmDialog('这会清空当前账号的全部章节完成记录，且无法恢复。', { title: '重置学习进度？', confirmText: '重置', danger: true });
        if (!ok) return;
        progress.reset();
        renderProgressCard(container);
        toast('学习进度已重置', { type: 'info' });
      });
    }
  };

  // 左侧课程目录（所有教程页共用，数据来自 LESSONS）
  const directory = {
    render(tree) {
      const currentKey = progress.currentKey();
      const currentHash = (window.location.hash || '').replace('#', '');
      const completed = progress.completed();
      const groups = [];
      LESSONS.forEach((lesson) => {
        let group = groups.find((g) => g.title === lesson.group);
        if (!group) { group = { title: lesson.group, lessons: [] }; groups.push(group); }
        group.lessons.push(lesson);
      });

      tree.innerHTML = groups.map((group) => {
        const isOpen = group.lessons.some((l) => l.key === currentKey);
        const groupDone = group.lessons.every((l) => completed[l.key]);
        const multi = group.lessons.length > 1;
        const links = group.lessons.map((lesson) => {
          const isCurrentLesson = lesson.key === currentKey;
          const isDone = Boolean(completed[lesson.key]);
          const lessonLink = multi
            ? `<a href="${lessonURL(lesson)}" class="directory-lesson${isCurrentLesson ? ' is-current' : ''}${isDone ? ' is-done' : ''}"${isCurrentLesson ? ' aria-current="page"' : ''}><h3>${escapeHTML(lesson.title)}</h3></a>`
            : '';
          const sections = lesson.sections.map((section, index) => {
            const isCurrent = isCurrentLesson && (currentHash ? currentHash === section.hash : (!multi && index === 0));
            return `<a href="${lessonURL(lesson)}#${section.hash}" class="directory-section${multi ? ' is-nested' : ''}${isCurrent ? ' is-current' : ''}${!multi && isDone && index === 0 ? ' is-done' : ''}"><h3>${escapeHTML(section.title)}</h3></a>`;
          }).join('');
          return lessonLink + sections;
        }).join('');
        return `<details class="directory-group${isOpen ? ' is-active' : ''}"${isOpen ? ' open' : ''}>
          <summary><h3>${escapeHTML(group.title)}${groupDone ? ' <span class="directory-done" aria-label="已完成">✓</span>' : ''}</h3></summary>
          <div class="directory-links">${links}</div>
        </details>`;
      }).join('');
    }
  };

  const setupDirectory = () => {
    const tree = document.querySelector('.directory-tree');
    if (!tree) return;
    directory.render(tree);
    window.addEventListener('hashchange', () => directory.render(tree));
    window.addEventListener('musiclab:progress', () => directory.render(tree));

    // 触屏 / 键盘：点击目录图标可以固定展开，点空白处或 Esc 收起
    const sidebar = tree.closest('.sidebar');
    const header = sidebar && sidebar.querySelector('.directory-header');
    if (!sidebar || !header) return;
    const setOpen = (open) => {
      sidebar.classList.toggle('is-open', open);
      header.setAttribute('aria-expanded', String(open));
    };
    header.setAttribute('aria-expanded', 'false');
    header.addEventListener('click', () => setOpen(!sidebar.classList.contains('is-open')));
    header.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setOpen(!sidebar.classList.contains('is-open')); }
    });
    document.addEventListener('click', (event) => {
      if (sidebar.classList.contains('is-open') && !sidebar.contains(event.target)) setOpen(false);
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') setOpen(false); });
  };

  const setupProgress = () => {
    const renderCards = () => document.querySelectorAll('[data-progress-card]').forEach(renderProgressCard);
    renderCards();
    window.addEventListener('musiclab:progress', renderCards);

    const panel = document.querySelector('.learning-content-panel');
    const currentKey = progress.currentKey();
    if (!panel || !currentKey) return;

    progress.rememberLesson(currentKey);
    window.addEventListener('musiclab:auth', () => progress.rememberLesson(currentKey));

    const strip = document.createElement('div');
    strip.className = 'learning-progress-strip';
    const renderStrip = () => {
      const index = LESSONS.findIndex((l) => l.key === currentKey);
      if (!progress.owner()) {
        strip.innerHTML = `
          <span>章节 ${index + 1} / ${LESSONS.length}</span>
          <span class="status-badge offline">未登录，进度不会保存</span>
          <a class="ml-btn small" href="${url('login/login.html')}">登录以记录进度</a>`;
        return;
      }
      const done = progress.isCompleted(currentKey);
      strip.innerHTML = `
        <span>章节 ${index + 1} / ${LESSONS.length}</span>
        <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent()}" aria-label="学习进度">
          <div class="progress-bar-fill" style="width:${progress.percent()}%"></div>
        </div>
        <span class="status-badge ${done ? 'online' : 'offline'}">${done ? '本章已完成' : '完成小测后计入进度'}</span>`;
    };
    renderStrip();
    panel.insertBefore(strip, panel.firstChild);
    window.addEventListener('musiclab:progress', renderStrip);
  };

  /* ------------------------------------------------------------------ */
  /* site search (static index, instant filtering)                        */
  /* ------------------------------------------------------------------ */
  const SEARCH_INDEX = [
    { title: '主页', section: '网站', href: 'index.html', keywords: 'home 首页 musiclab 音乐 学习 创作' },
    { title: '学习进度', section: '主页', href: 'index.html#learningProgress', keywords: 'progress 进度 里程碑 dashboard' },
    { title: '开发组介绍', section: '关于', href: 'introduction/intro.html', keywords: 'team 团队 联创 北京理工大学 成员' },
    { title: '郑雨杭', section: '开发组成员', href: 'introduction/Aaron.html', keywords: 'aaron 项目负责人' },
    { title: '何岚 | HEAK LEANGHAKK', section: '开发组成员', href: 'introduction/Heak.html', keywords: 'heak' },
    { title: '李思齐 | ABDULKADIR', section: '开发组成员', href: 'introduction/Abdulkadir.html', keywords: 'lisiqi abdulkadir' },
    { title: '奥马尔 | MOHAMED OMAR A.', section: '开发组成员', href: 'introduction/Omar.html', keywords: 'omar' },
    { title: '游乐园（DAW 音轨创作）', section: '创作', href: 'The Playground/index.html', keywords: 'playground daw sequencer 音序器 节奏 和弦 贝斯 旋律 创作 diy' },
    { title: '初学者教程', section: '教程', href: 'Start Learning/index.html', keywords: 'start learning 开始音乐之旅 引入 教程 入门' },
    { title: '音符与记谱', section: '教程 · 第 1 章', href: 'Start Learning/pitches.html#pitch-basics', keywords: 'pitch 音高 记谱 音符' },
    { title: '音名与唱名', section: '教程 · 音符与记谱', href: 'Start Learning/pitches.html#note-names', keywords: 'do re mi C D E 音名 唱名' },
    { title: '钢琴键盘', section: '教程 · 音符与记谱', href: 'Start Learning/pitches.html#piano-keyboard', keywords: 'piano keyboard 白键 黑键 半音' },
    { title: '谱与音符', section: '教程 · 音符与记谱', href: 'Start Learning/pitches.html#notation', keywords: '五线谱 谱号 拍号 notation' },
    { title: '节奏基础 · 节拍和拍子', section: '教程 · 第 2 章', href: 'Start Learning/beat.html#rhythm-basics', keywords: 'beat rhythm 节拍 拍子 2/4 3/4 4/4 强拍 弱拍' },
    { title: '节奏 · 小试一下', section: '教程 · 节奏基础', href: 'Start Learning/beat.html#try-it', keywords: 'kick snare hat tom crash ride clap 试听 鼓' },
    { title: '节奏 · 乐器介绍', section: '教程 · 节奏基础', href: 'Start Learning/beat-instruments.html#instrument-introductions', keywords: '底鼓 军鼓 踩镲 通鼓 吊镲 叮叮镲 拍手 乐器' },
    { title: '节奏 · 在乐曲中', section: '教程 · 节奏基础', href: 'Start Learning/beat-track.html#in-song', keywords: '乐曲 律动 groove' },
    { title: 'Beat 音轨', section: '教程 · 节奏基础', href: 'Start Learning/beat-track.html#beat-track', keywords: 'beat track 音轨 鼓机 sequencer' },
    { title: '音程与和弦', section: '教程 · 第 3 章', href: 'Start Learning/chords.html#chord-basics', keywords: 'chord interval 和声' },
    { title: '音程', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#intervals', keywords: 'interval 度数 半音数' },
    { title: '和弦', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#chords', keywords: 'chord 大三和弦 小三和弦 七和弦' },
    { title: 'Chords 音轨', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#chords-track', keywords: 'chords track 和声支撑' },
    { title: 'Basslines 音轨', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#basslines-track', keywords: 'bass 贝斯 低音 律动' },
    { title: 'Melodies 音轨', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#melodies-track', keywords: 'melody 旋律 动机' },
    { title: '合奏', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#ensemble', keywords: 'ensemble 声部 配合' },
    { title: '单音听辨测试', section: '教程 · 音程与和弦', href: 'Start Learning/chords.html#pitch-test', keywords: '听辨 ear training 测试' },
    { title: '调式基础', section: '教程 · 第 4 章', href: 'Start Learning/tones.html#mode-basics', keywords: 'mode scale 音阶 调式 大调 小调' },
    { title: '常见调式', section: '教程 · 调式基础', href: 'Start Learning/tones.html#common-modes', keywords: '大调 自然小调 和声小调 旋律小调' },
    { title: '民族调式', section: '教程 · 调式基础', href: 'Start Learning/tones.html#folk-modes', keywords: '五声 民族 宫商角徵羽' },
    { title: '更多调式', section: '教程 · 调式基础', href: 'Start Learning/tones.html#more-modes', keywords: '多利亚 弗里几亚 利底亚 dorian phrygian lydian' },
    { title: '多音和弦听辨测试', section: '教程 · 调式基础', href: 'Start Learning/tones.html#chord-test', keywords: '听辨 和弦性质 测试' },
    { title: '拓展与其他', section: '教程 · 第 5 章', href: 'Start Learning/others.html#extension-basics', keywords: '配器 录音 混音 编曲 曲式 复节奏 音色' },
    { title: '设置', section: '账户', href: 'settings/settings.html', keywords: 'settings 偏好 账户 主题 深色模式 dark mode' },
    { title: '外观 / 深色模式', section: '设置', href: 'settings/settings.html#appearance', keywords: 'dark mode 深色 浅色 主题 theme 外观' },
    { title: '登录', section: '账户', href: 'login/login.html', keywords: 'login sign in 登录' },
    { title: '注册', section: '账户', href: 'login/registration.html', keywords: 'register sign up 注册 创建账号' },
    { title: '联系我们 / 反馈', section: '帮助', href: 'contact/contact.html', keywords: 'contact feedback 联系 反馈 建议 bug 问题' },
    { title: 'Q & A 问卷', section: '主页', href: 'index.html#OpenQA', keywords: '问卷 questionnaire 个性化' }
  ];

  const normalise = (text) => String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();

  const search = {
    index: SEARCH_INDEX,
    query(raw, limit = 8) {
      const q = normalise(raw);
      if (!q) return [];
      const terms = q.split(' ').filter(Boolean);
      return SEARCH_INDEX
        .map((entry) => {
          const title = normalise(entry.title);
          const haystack = `${title} ${normalise(entry.section)} ${normalise(entry.keywords)}`;
          let score = 0;
          for (const term of terms) {
            if (title === term) score += 12;
            else if (title.startsWith(term)) score += 8;
            else if (title.includes(term)) score += 5;
            else if (haystack.includes(term)) score += 2;
            else return null;
          }
          return { entry, score };
        })
        .filter(Boolean)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.entry);
    }
  };

  const highlight = (text, raw) => {
    const terms = normalise(raw).split(' ').filter(Boolean);
    let html = escapeHTML(text);
    for (const term of terms) {
      const safe = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      html = html.replace(new RegExp(`(${safe})`, 'ig'), '<mark>$1</mark>');
    }
    return html;
  };

  /* ------------------------------------------------------------------ */
  /* header tools: search + theme toggle + mobile nav                     */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    search: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    sun: '<svg class="icon-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon: '<svg class="icon-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z"/></svg>',
    menu: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>'
  };

  const setupHeader = () => {
    const top = document.querySelector('.top');
    if (!top || top.querySelector('.header-tools')) return;
    const nav = top.querySelector('.nav');

    const tools = document.createElement('div');
    tools.className = 'header-tools';
    tools.innerHTML = `
      <form class="site-search" role="search" autocomplete="off">
        <label class="sr-only" for="siteSearchInput">搜索站内内容</label>
        <input type="search" id="siteSearchInput" name="q" placeholder="搜索教程、功能…" aria-label="搜索站内内容"
               aria-controls="siteSearchResults" aria-expanded="false" aria-autocomplete="list">
        <button type="button" class="icon-button search-toggle" aria-label="打开搜索" title="搜索">${ICONS.search}</button>
        <ul class="search-results" id="siteSearchResults" role="listbox" aria-label="搜索结果"></ul>
      </form>
      <button type="button" class="icon-button theme-toggle" aria-label="切换深色模式" title="切换深色 / 浅色模式">${ICONS.sun}${ICONS.moon}</button>
      <button type="button" class="icon-button nav-toggle" aria-label="打开菜单" aria-expanded="false" aria-controls="primaryNav">${ICONS.menu}</button>`;
    top.appendChild(tools);

    // Theme toggle
    tools.querySelector('.theme-toggle').addEventListener('click', () => {
      const resolved = theme.toggle();
      toast(resolved === 'dark' ? '已切换到深色模式' : '已切换到浅色模式', { type: 'info', duration: 1800 });
    });

    // Mobile nav
    const navToggle = tools.querySelector('.nav-toggle');
    if (nav) {
      nav.id = nav.id || 'primaryNav';
      const setOpen = (open) => {
        top.classList.toggle('nav-open', open);
        navToggle.setAttribute('aria-expanded', String(open));
        navToggle.setAttribute('aria-label', open ? '关闭菜单' : '打开菜单');
      };
      navToggle.addEventListener('click', () => setOpen(!top.classList.contains('nav-open')));
      document.addEventListener('click', (event) => {
        if (top.classList.contains('nav-open') && !top.contains(event.target)) setOpen(false);
      });
      window.addEventListener('resize', () => { if (window.innerWidth > 900) setOpen(false); });
    } else {
      navToggle.remove();
    }

    // Search
    const form = tools.querySelector('.site-search');
    const input = form.querySelector('input');
    const results = form.querySelector('.search-results');
    const searchToggle = form.querySelector('.search-toggle');
    let activeIndex = -1;
    let currentEntries = [];

    const closeResults = () => {
      results.classList.remove('is-visible');
      results.innerHTML = '';
      input.setAttribute('aria-expanded', 'false');
      activeIndex = -1;
      currentEntries = [];
    };

    const render = () => {
      const raw = input.value;
      currentEntries = search.query(raw);
      activeIndex = -1;
      if (!normalise(raw)) { closeResults(); return; }
      if (!currentEntries.length) {
        results.innerHTML = '<li class="search-empty" role="option" aria-selected="false">没有找到相关内容，试试其他关键词</li>';
      } else {
        results.innerHTML = currentEntries.map((entry, i) => `
          <li role="option" aria-selected="false" data-index="${i}">
            <a href="${url(entry.href)}">
              <span class="search-title">${highlight(entry.title, raw)}</span>
              <span class="search-meta">${escapeHTML(entry.section)}</span>
            </a>
          </li>`).join('');
      }
      results.classList.add('is-visible');
      input.setAttribute('aria-expanded', 'true');
    };

    const setActive = (index) => {
      const items = Array.from(results.querySelectorAll('li[data-index]'));
      if (!items.length) return;
      activeIndex = (index + items.length) % items.length;
      items.forEach((li, i) => {
        li.classList.toggle('is-active', i === activeIndex);
        li.setAttribute('aria-selected', String(i === activeIndex));
      });
      items[activeIndex].scrollIntoView({ block: 'nearest' });
    };

    input.addEventListener('input', render);
    input.addEventListener('focus', () => { form.classList.add('is-open'); if (input.value) render(); });
    input.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowDown') { event.preventDefault(); setActive(activeIndex + 1); }
      else if (event.key === 'ArrowUp') { event.preventDefault(); setActive(activeIndex - 1); }
      else if (event.key === 'Escape') { closeResults(); input.blur(); form.classList.remove('is-open'); }
    });
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      const target = currentEntries[activeIndex >= 0 ? activeIndex : 0];
      if (target) window.location.href = url(target.href);
      else if (normalise(input.value)) toast('没有找到相关内容', { type: 'warning', duration: 2000 });
    });
    searchToggle.addEventListener('click', () => {
      if (form.classList.contains('is-open') && document.activeElement !== input) {
        form.classList.remove('is-open');
        closeResults();
      } else {
        form.classList.add('is-open');
        input.focus();
      }
    });
    document.addEventListener('click', (event) => {
      if (!form.contains(event.target)) {
        closeResults();
        if (!input.value) form.classList.remove('is-open');
      }
    });
    // Keyboard shortcut: "/" focuses search when not typing elsewhere.
    document.addEventListener('keydown', (event) => {
      const tag = (event.target.tagName || '').toLowerCase();
      if (event.key === '/' && !['input', 'textarea', 'select'].includes(tag) && !event.target.isContentEditable) {
        event.preventDefault();
        form.classList.add('is-open');
        input.focus();
      }
    });
  };

  /* ------------------------------------------------------------------ */
  /* footer                                                              */
  /* ------------------------------------------------------------------ */
  const setupFooter = () => {
    if (document.querySelector('.site-footer') || document.body.dataset.noFooter !== undefined) return;
    const mount = document.querySelector('.box, .box_with_side');
    if (!mount) return;

    const footer = document.createElement('footer');
    footer.className = 'site-footer';
    footer.setAttribute('role', 'contentinfo');
    const logo = theme.resolved() === 'dark' ? 'MusicLabWhiteLogo.png' : 'MusicLabBlackLogo.png';
    footer.innerHTML = `
      <div class="site-footer-grid">
        <div class="site-footer-brand">
          <img src="${url(`images/${logo}`)}" alt="MusicLab">
          <p>一个为你量身定做的音乐学习与创作网站：乐理教程、实操上手、个人 DIY 式 DAW 创作。</p>
        </div>
        <div>
          <h4>学习</h4>
          <ul>
            <li><a href="${url('Start Learning/index.html')}">初学者教程</a></li>
            <li><a href="${url('Start Learning/pitches.html')}">音符与记谱</a></li>
            <li><a href="${url('Start Learning/beat.html')}">节奏基础</a></li>
            <li><a href="${url('Start Learning/chords.html')}">音程与和弦</a></li>
          </ul>
        </div>
        <div>
          <h4>创作</h4>
          <ul>
            <li><a href="${url('The Playground/index.html')}">游乐园</a></li>
            <li><a href="${url('index.html#learningProgress')}">学习进度</a></li>
            <li><a href="${url('index.html#OpenQA')}">Q &amp; A 问卷</a></li>
          </ul>
        </div>
        <div>
          <h4>关于</h4>
          <ul>
            <li><a href="${url('introduction/intro.html')}">开发组介绍</a></li>
            <li><a href="${url('contact/contact.html')}">联系我们 / 反馈</a></li>
            <li><a href="${url('settings/settings.html')}">设置</a></li>
          </ul>
        </div>
      </div>
      <div class="site-footer-bottom">
        <span>© ${new Date().getFullYear()} BIT 软工联创 MusicLab · 版权所有</span>
        <span>北京理工大学 · 软件工程</span>
      </div>`;

    // `.box_with_side` is offset for the sidebar; place the footer after it.
    mount.insertAdjacentElement('afterend', footer);
  };

  /* ------------------------------------------------------------------ */
  /* 登录后的欢迎体验（首页）                                              */
  /* ------------------------------------------------------------------ */
  const setupWelcome = () => {
    const mount = document.querySelector('[data-welcome]');
    if (!mount) return;

    const render = () => {
      const name = auth.currentUser();
      if (!name) { mount.hidden = true; mount.innerHTML = ''; return; }

      const flag = readJSON(sessionStorage, STORAGE.justLoggedIn, null);
      const justNow = flag && flag.name === name && Date.now() - flag.at < 10 * 60 * 1000;
      const done = progress.completedCount();
      const total = LESSONS.length;
      const rec = progress.recommended();
      const last = progress.lastLesson();
      const hour = new Date().getHours();
      const greeting = hour < 6 ? '夜深了' : hour < 12 ? '早上好' : hour < 14 ? '中午好' : hour < 18 ? '下午好' : '晚上好';

      let headline;
      let lead;
      if (justNow && flag.isNew) {
        headline = `欢迎加入 MusicLab，${name}！`;
        lead = flag.credited
          ? `你刚才通过的 ${flag.credited} 个章节小测已经记到你的账号里了。接下来从「${rec ? rec.title : '游乐园'}」继续吧。`
          : '这是一条为你准备的学习路线：先从「开始音乐之旅」了解四个音轨，再一章一章通关小测，最后到游乐园做出自己的曲子。';
      } else if (justNow) {
        headline = `欢迎回来，${name}！`;
        lead = done === 0
          ? '你还没有完成任何章节，现在就从第一章开始吧。'
          : done === total
            ? '你已经通关全部章节，去游乐园创作吧！'
            : `上次学到「${last ? last.title : rec.title}」，已完成 ${done} / ${total} 个章节，继续保持！`;
        if (flag.credited) lead += ` 另外，刚才作为访客通过的 ${flag.credited} 个小测也已计入。`;
      } else {
        headline = `${greeting}，${name}`;
        lead = done === total ? '全部章节已完成，去游乐园创作吧！' : `已完成 ${done} / ${total} 个章节${rec ? `，下一步：「${rec.title}」` : ''}。`;
      }

      const steps = [
        { title: '继续学习', desc: rec ? rec.title : '全部完成', href: rec ? lessonURL(rec) : url('Start Learning/index.html'), icon: '📖' },
        { title: '游乐园创作', desc: '节奏 · 和弦 · 贝斯 · 旋律', href: url('The Playground/index.html'), icon: '🎛️' },
        { title: '个性化问卷', desc: '告诉我们你的基础', href: '#OpenQA', icon: '📝', qa: true },
        { title: '账户与外观', desc: '深色模式 · 进度管理', href: url('settings/settings.html'), icon: '⚙️' }
      ];

      mount.hidden = false;
      mount.innerHTML = `
        <div class="welcome-head">
          <span class="avatar-circle" aria-hidden="true">${escapeHTML(name.charAt(0).toUpperCase())}</span>
          <div>
            <h2>${escapeHTML(headline)}</h2>
            <p>${escapeHTML(lead)}</p>
          </div>
          ${justNow ? '<button type="button" class="ml-toast-close welcome-close" aria-label="收起欢迎信息">×</button>' : ''}
        </div>
        <div class="welcome-progress">
          <div class="progress-bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress.percent()}" aria-label="学习进度"><div class="progress-bar-fill" style="width:${progress.percent()}%"></div></div>
          <span>${progress.percent()}%</span>
        </div>
        <div class="welcome-steps">
          ${steps.map((step) => `<a class="welcome-step" href="${step.href}"${step.qa ? ' data-open-qa' : ''}>
            <span class="welcome-step-icon" aria-hidden="true">${step.icon}</span>
            <span class="welcome-step-title">${escapeHTML(step.title)}</span>
            <span class="welcome-step-desc">${escapeHTML(step.desc)}</span>
          </a>`).join('')}
        </div>`;

      const close = mount.querySelector('.welcome-close');
      if (close) close.addEventListener('click', () => { sessionStorage.removeItem(STORAGE.justLoggedIn); render(); });
      const qa = mount.querySelector('[data-open-qa]');
      if (qa) qa.addEventListener('click', (event) => {
        const trigger = document.getElementById('OpenQA');
        if (trigger) { event.preventDefault(); trigger.click(); }
      });
      if (justNow && !mount.dataset.greeted) {
        mount.dataset.greeted = '1';
        mount.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    };

    render();
    window.addEventListener('musiclab:auth', render);
    window.addEventListener('musiclab:progress', render);
  };

  /* ------------------------------------------------------------------ */
  /* boot                                                                */
  /* ------------------------------------------------------------------ */
  onReady(() => {
    swapLogos(theme.resolved());
    setupHeader();
    setupFooter();
    setupDirectory();
    setupProgress();
    setupWelcome();
    flushPendingToast();
    window.addEventListener('musiclab:theme', (event) => swapLogos(event.detail.theme));
    window.addEventListener('storage', (event) => {
      if (!event.key || event.key === STORAGE.loginState || event.key === STORAGE.clientName || event.key.startsWith(STORAGE.progress)) {
        window.dispatchEvent(new CustomEvent('musiclab:progress', { detail: { reason: 'storage' } }));
      }
    });
  });

  window.MusicLab = {
    root,
    storage: STORAGE,
    url,
    escapeHTML,
    toast,
    toastAfterReload,
    confirm: confirmDialog,
    theme,
    auth,
    progress,
    renderProgressCard,
    directory,
    search
  };
})();
