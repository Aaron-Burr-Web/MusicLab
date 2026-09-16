/*
 * Navigation state shared by every page:
 *  - highlights the current section in the top nav
 *  - swaps the "登录 | 注册" item for a welcome link once signed in
 *  - drives the pointer glow background
 * Auth storage itself lives in js/musiclab-ui.js (window.MusicLab.auth).
 */
(() => {
  const root = document.documentElement;
  const loginStateKey = 'musiclab_login_state';
  const clientNameKey = 'musiclab_client_name';
  const navLoginLink = document.querySelector('#nav4 a');

  const getPath = () => decodeURIComponent(window.location.pathname || '');

  const isInsideSubFolder = () =>
    /(\/introduction\/|\/Start Learning\/|\/The Playground\/|\/settings\/|\/login\/|\/contact\/)/i.test(getPath());

  const updateActiveNav = () => {
    const path = getPath();
    const sectionId = path.match(/\/introduction\//i) ? 'nav2'
      : path.match(/\/The Playground\//i) ? 'nav3'
      : path.match(/\/Start Learning\//i) ? 'nav6'
      : path.match(/\/settings\//i) ? 'nav5'
      : path.match(/\/login\//i) ? 'nav4'
      : path.match(/\/contact\//i) ? null
      : 'nav1';

    document.querySelectorAll('.nav li').forEach((item) => {
      const isActive = item.id === sectionId;
      const link = item.querySelector('a');

      item.classList.toggle('active', isActive);
      link?.classList.toggle('active', isActive);
      if (isActive) link?.setAttribute('aria-current', 'page');
      else link?.removeAttribute('aria-current');
    });
  };

  const getLoginPageHref = () => {
    const path = getPath();
    if (/\/login\//i.test(path)) return 'login.html';
    if (isInsideSubFolder()) return '../login/login.html';
    return 'login/login.html';
  };

  const getSettingsPageHref = () => {
    const path = getPath();
    if (/\/settings\//i.test(path)) return 'settings.html';
    if (isInsideSubFolder()) return '../settings/settings.html';
    return 'settings/settings.html';
  };

  const isLoggedIn = () => (window.MusicLab
    ? window.MusicLab.auth.isLoggedIn()
    : localStorage.getItem(loginStateKey) === 'true');

  const getClientName = () => {
    const name = window.MusicLab
      ? window.MusicLab.auth.currentUser()
      : localStorage.getItem(clientNameKey);
    return name ? String(name).trim() : '用户';
  };

  const updateMouseGlow = (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    root.style.setProperty('--mx', x + '%');
    root.style.setProperty('--my', y + '%');
  };

  const updateLoginNav = () => {
    if (!navLoginLink) return;

    if (isLoggedIn()) {
      const clientName = getClientName();
      navLoginLink.textContent = '欢迎您，' + clientName;
      navLoginLink.setAttribute('href', getSettingsPageHref());
      navLoginLink.setAttribute('aria-label', '已登录：' + clientName + '，前往账户设置');
      navLoginLink.setAttribute('title', '前往账户设置');
    } else {
      navLoginLink.textContent = ' 登录  |  注册 ';
      navLoginLink.setAttribute('href', getLoginPageHref());
      navLoginLink.removeAttribute('aria-label');
      navLoginLink.removeAttribute('title');
    }
  };

  window.addEventListener('pointermove', updateMouseGlow, { passive: true });
  window.addEventListener('load', () => {
    root.style.setProperty('--mx', '50%');
    root.style.setProperty('--my', '50%');
    updateLoginNav();
    updateActiveNav();
  });
  window.addEventListener('storage', updateLoginNav);
  window.addEventListener('musiclab:auth', updateLoginNav);

  updateLoginNav();
  updateActiveNav();
})();
