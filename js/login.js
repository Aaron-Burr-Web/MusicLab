(() => {
  const root = document.documentElement;
  const loginStateKey = 'musiclab_login_state';
  const clientNameKey = 'musiclab_client_name';
  const navLoginLink = document.querySelector('#nav4 a');

  const updateActiveNav = () => {
    const path = decodeURIComponent(window.location.pathname || '');
    const sectionId = path.match(/\/introduction\//i) ? 'nav2'
      : path.match(/\/The Playground\//i) ? 'nav3'
      : path.match(/\/Start Learning\//i) ? 'nav6'
      : path.match(/\/settings\//i) ? 'nav5'
      : path.match(/\/login\//i) ? 'nav4'
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
    const path = decodeURIComponent(window.location.pathname || '');
    const isInsideLoginFolder = /\/login\//i.test(path);
    const isInsideSubFolder = /(\/introduction\/|\/Start Learning\/|\/The Playground\/|\/settings\/)/i.test(path);

    if (isInsideLoginFolder) return 'login.html';
    if (isInsideSubFolder) return '../login/login.html';
    return 'login/login.html';
  };

  const getClientName = () => {
    const name = localStorage.getItem(clientNameKey);
    return name ? name.trim() : '用户';
  };

  const updateMouseGlow = (event) => {
    const x = (event.clientX / window.innerWidth) * 100;
    const y = (event.clientY / window.innerHeight) * 100;
    root.style.setProperty('--mx', x + '%');
    root.style.setProperty('--my', y + '%');
  };

  const updateLoginNav = () => {
    if (!navLoginLink) return;

    const isLoggedIn = localStorage.getItem(loginStateKey) === 'true';

    if (isLoggedIn) {
      const clientName = getClientName();
      navLoginLink.textContent = '欢迎您，' + clientName;
      navLoginLink.setAttribute('href', '#');
      navLoginLink.setAttribute('aria-label', '已登录');
      navLoginLink.style.cursor = 'default';
      navLoginLink.removeEventListener('click', preventDefaultLoginClick);
      navLoginLink.addEventListener('click', preventDefaultLoginClick);
    } else {
      navLoginLink.textContent = ' 登录  |  注册 ';
      navLoginLink.setAttribute('href', getLoginPageHref());
      navLoginLink.style.cursor = 'pointer';
      navLoginLink.removeEventListener('click', preventDefaultLoginClick);
    }
  };

  const preventDefaultLoginClick = (event) => {
    event.preventDefault();
  };

  window.addEventListener('pointermove', updateMouseGlow);
  window.addEventListener('load', () => {
    root.style.setProperty('--mx', '50%');
    root.style.setProperty('--my', '50%');
    updateLoginNav();
    updateActiveNav();
  });
  window.addEventListener('storage', updateLoginNav);

  updateLoginNav();
  updateActiveNav();
})();