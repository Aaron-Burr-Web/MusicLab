/*
 * 《用户服务条款》（js/terms.js）
 * 条款正文只在这里维护一份：
 *   - 登录 / 注册页勾选框里的链接 → 以弹窗形式打开（不跳走，不丢失已填内容）
 *   - login/terms.html → 直接把同一份正文渲染成整页，便于分享与打印
 * 用法：给链接加 data-terms 属性即可，例如 <a href="terms.html" data-terms>《用户服务条款》</a>
 */
(() => {
  'use strict';

  const UPDATED = '2026 年 9 月 17 日';

  const TERMS_HTML = `
    <p class="settings-note">最后更新：${UPDATED} · 适用于 MusicLab 网站及其全部功能</p>

    <h3>1. 关于 MusicLab</h3>
    <p>MusicLab 是由北京理工大学软件工程专业「联创小组」开发的音乐学习与创作网站，面向零基础及初学者提供乐理教程、章节小测、听音练习与 DAW 式音轨创作（游乐园）。本网站为学生课程项目，不收取任何费用。</p>

    <h3>2. 账号</h3>
    <ul>
      <li>注册时你只需提供一个用户名和密码，我们不要求手机号、邮箱或真实姓名。</li>
      <li>当前版本为纯前端实现：账号信息（用户名、密码摘要）、学习进度、问卷结果、创作存档与反馈记录<strong>仅保存在你自己浏览器的本地存储中</strong>，不会上传到任何服务器；更换设备或清除浏览器数据后将无法找回。</li>
      <li>请勿使用他人的名字、侮辱性或违法的词语作为用户名。</li>
      <li>后续如引入服务器端账号系统，我们会更新本条款并在登录时提示。</li>
    </ul>

    <h3>3. 你的数据与隐私</h3>
    <ul>
      <li>我们不追踪、不出售、不与第三方共享你的任何数据。</li>
      <li>网站不使用第三方统计或广告脚本。</li>
      <li>「联系 / 反馈」表单目前同样只保存在本地；如你选择通过邮件发送，内容才会到达开发组邮箱，且仅用于改进产品。</li>
      <li>你可以随时在「设置」中退出登录、重置学习进度，或清除浏览器数据以删除全部本地信息。</li>
    </ul>

    <h3>4. 内容与版权</h3>
    <ul>
      <li>教程文字、界面设计与代码由 MusicLab 开发组创作，版权归开发组所有；仅供个人学习使用，未经许可请勿商用或转载。</li>
      <li>网站内置的鼓与钢琴采样仅用于教学演示。</li>
      <li>你在游乐园中创作的节奏与旋律属于你自己，可以自由使用。</li>
    </ul>

    <h3>5. 使用规范</h3>
    <p>请勿尝试破坏网站功能、批量抓取内容，或利用本网站从事任何违反法律法规的活动。</p>

    <h3>6. 免责声明</h3>
    <p>MusicLab 按「现状」提供，作为课程项目仍在持续开发中，可能存在错误或功能变动。我们不对因使用本网站造成的任何直接或间接损失承担责任，但会尽力及时修复问题。</p>

    <h3>7. 条款变更</h3>
    <p>我们可能不时更新本条款，更新后会修改顶部的「最后更新」日期。继续使用本网站即视为接受更新后的条款。</p>

    <h3>8. 联系我们</h3>
    <p>对条款有任何疑问，请通过「联系 / 反馈」页面告诉我们。</p>
  `;

  /* ---------------- 弹窗 ---------------- */
  let overlay = null;
  let lastFocused = null;

  const close = () => {
    if (!overlay) return;
    overlay.classList.remove('is-open');
    document.body.classList.remove('ml-confirm-open');
    document.removeEventListener('keydown', onKey);
    setTimeout(() => { if (overlay) { overlay.remove(); overlay = null; } }, 200);
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  };

  const onKey = (event) => { if (event.key === 'Escape') { event.preventDefault(); close(); } };

  const open = () => {
    if (overlay) return;
    lastFocused = document.activeElement;
    overlay = document.createElement('div');
    overlay.className = 'ml-confirm-overlay terms-overlay';
    overlay.innerHTML = `
      <div class="ml-confirm terms-modal" role="dialog" aria-modal="true" aria-labelledby="termsModalTitle">
        <div class="terms-modal-head">
          <h2 id="termsModalTitle">用户服务条款</h2>
          <button type="button" class="ml-toast-close" data-terms-close aria-label="关闭">×</button>
        </div>
        <div class="terms-modal-body">${TERMS_HTML}</div>
        <div class="form-actions terms-modal-foot">
          <button type="button" class="ml-btn" data-terms-close>我已阅读</button>
        </div>
      </div>`;
    document.body.appendChild(overlay);
    document.body.classList.add('ml-confirm-open');
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay || event.target.closest('[data-terms-close]')) close();
    });
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => {
      overlay.classList.add('is-open');
      overlay.querySelector('[data-terms-close]').focus();
    });
  };

  // 带 data-terms 的链接一律改为弹窗打开
  document.addEventListener('click', (event) => {
    const link = event.target.closest('[data-terms]');
    if (!link) return;
    event.preventDefault();
    open();
  });

  // 整页版本（login/terms.html）用同一份正文渲染
  const page = document.querySelector('[data-terms-page]');
  if (page) page.innerHTML = `<h1>用户服务条款</h1>${TERMS_HTML}`;

  window.MusicLabTerms = { open, close, html: TERMS_HTML };
})();
