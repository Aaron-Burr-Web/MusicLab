(() => {
  const modalId = 'musiclab-qa-modal';

  const ensureStyles = () => {
    if (document.getElementById('musiclab-qa-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'musiclab-qa-modal-styles';
    style.textContent = `
      .musiclab-modal-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(12, 14, 22, 0.62);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.22s ease, visibility 0.22s ease;
        z-index: 2000;
      }

      .musiclab-modal-overlay.is-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .musiclab-modal {
        position: relative;
        width: min(520px, calc(100vw - 32px));
        background: rgba(20, 22, 30, 0.96);
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 22px;
        box-shadow: 0 24px 60px rgba(0,0,0,0.4), 0 0 24px rgba(101, 128, 255, 0.18);
        color: #edf4ff;
        transform: translateY(16px) scale(0.96);
        opacity: 0;
        transition: transform 0.22s ease, opacity 0.22s ease;
        overflow: hidden;
      }

      .musiclab-modal-overlay.is-open .musiclab-modal {
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      .musiclab-modal-close {
        position: absolute;
        right: 16px;
        top: 12px;
        width: 36px;
        height: 36px;
        border: none;
        border-radius: 50%;
        background: rgba(255,255,255,0.06);
        color: #edf4ff;
        font-size: 22px;
        line-height: 1;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .musiclab-modal-close:hover {
        background: rgba(117, 139, 255, 0.18);
        transform: rotate(90deg);
      }

      .musiclab-modal-header {
        padding: 28px 56px 12px 28px;
        border-bottom: 1px solid rgba(255,255,255,0.08);
      }

      .musiclab-modal-header h2 {
        margin: 0;
        font-size: clamp(24px, 2vw, 30px);
        font-weight: 700;
      }

      .musiclab-modal-body {
        padding: 22px 28px 14px;
      }

      .musiclab-modal-body p {
        margin: 0 0 18px;
        color: rgba(237,244,255,0.8);
        line-height: 1.7;
      }

      .musiclab-modal-form {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }

      .musiclab-field {
        display: flex;
        flex-direction: column;
        gap: 8px;
        font-size: 14px;
        color: rgba(237, 244, 255, 0.9);
      }

      .musiclab-field input,
      .musiclab-field textarea,
      .musiclab-field select {
        width: 100%;
        box-sizing: border-box;
        border: 1px solid rgba(255,255,255,0.12);
        border-radius: 10px;
        background: rgba(255,255,255,0.03);
        color: #edf4ff;
        padding: 10px 12px;
        outline: none;
        transition: border-color 0.2s ease, box-shadow 0.2s ease;
      }

      .musiclab-field input:focus,
      .musiclab-field textarea:focus,
      .musiclab-field select:focus {
        border-color: rgba(118, 142, 255, 0.9);
        box-shadow: 0 0 0 3px rgba(118, 142, 255, 0.18);
      }

      .musiclab-field textarea {
        min-height: 100px;
        resize: vertical;
      }

      .musiclab-modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 10px;
        padding: 10px 28px 24px;
      }

      .musiclab-btn {
        border: none;
        border-radius: 10px;
        padding: 10px 18px;
        font-size: 15px;
        font-weight: 600;
        cursor: pointer;
        transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
      }

      .musiclab-btn:hover {
        transform: translateY(-1px);
      }

      .musiclab-btn:active {
        transform: translateY(0);
      }

      .musiclab-btn-cancel {
        background: rgba(255,255,255,0.06);
        color: #edf4ff;
      }

      .musiclab-btn-confirm {
        background: linear-gradient(135deg, #4d63ff, #7a7cff);
        color: white;
        box-shadow: 0 12px 24px rgba(78, 92, 255, 0.3);
      }

      .musiclab-btn-confirm:hover {
        filter: brightness(1.08);
        box-shadow: 0 0 18px rgba(110, 128, 255, 0.4), 0 12px 24px rgba(78, 92, 255, 0.35);
      }
    `;
    document.head.appendChild(style);
  };

  const buildModal = () => {
    const overlay = document.getElementById(modalId);
    if (overlay) return overlay;

    const wrapper = document.createElement('div');
    wrapper.id = modalId;
    wrapper.className = 'musiclab-modal-overlay';
    wrapper.setAttribute('aria-hidden', 'true');

    wrapper.innerHTML = `
      <div class="musiclab-modal" role="dialog" aria-modal="true" aria-labelledby="musiclab-modal-title">
        <button class="musiclab-modal-close" type="button" aria-label="关闭">×</button>
        <div class="musiclab-modal-header">
          <h2 id="musiclab-modal-title">Q & A</h2>
        </div>
        <div class="musiclab-modal-body">
          <p>请填写你的问题，我们会尽快为你匹配合适的学习建议。</p>
          <form class="musiclab-modal-form">
            <label class="musiclab-field">
              <span>你的姓名</span>
              <input type="text" name="name" placeholder="请输入你的名字">
            </label>
            <label class="musiclab-field">
              <span>问题类型</span>
              <select name="type">
                <option value="基础学习">基础学习</option>
                <option value="乐理">乐理</option>
                <option value="创作">创作</option>
                <option value="其他">其他</option>
              </select>
            </label>
            <label class="musiclab-field">
              <span>描述你的问题</span>
              <textarea name="message" placeholder="例如：我想学习和弦基础，但不知道从哪里开始..."></textarea>
            </label>
          </form>
        </div>
        <div class="musiclab-modal-footer">
          <button class="musiclab-btn musiclab-btn-cancel" type="button">取消</button>
          <button class="musiclab-btn musiclab-btn-confirm" type="button">提交</button>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    const closeBtn = wrapper.querySelector('.musiclab-modal-close');
    const cancelBtn = wrapper.querySelector('.musiclab-btn-cancel');
    const confirmBtn = wrapper.querySelector('.musiclab-btn-confirm');

    const closeModal = () => {
      wrapper.classList.remove('is-open');
      wrapper.setAttribute('aria-hidden', 'true');
    };

    const openModal = () => {
      wrapper.classList.add('is-open');
      wrapper.setAttribute('aria-hidden', 'false');
    };

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    wrapper.addEventListener('click', (event) => {
      if (event.target === wrapper) closeModal();
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && wrapper.classList.contains('is-open')) {
        closeModal();
      }
    });

    confirmBtn.addEventListener('click', () => {
      const form = wrapper.querySelector('.musiclab-modal-form');
      const data = new FormData(form);
      const name = data.get('name') || '朋友';
      alert(`感谢你，${name}！你的问题已提交。`);
      closeModal();
    });

    window.musiclabQAOpen = openModal;
    window.musiclabQAClose = closeModal;

    return wrapper;
  };

  ensureStyles();
  const modal = buildModal();

  const bindTriggers = () => {
    const triggers = document.querySelectorAll('[data-qa-modal], [data-open-qa]');
    triggers.forEach((button) => {
      button.addEventListener('click', () => {
        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
      });
    });
  };

  bindTriggers();

  window.openQA = () => {
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
  };

  window.closeQA = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
  };
})();
