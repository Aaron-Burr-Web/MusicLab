(() => {
  const modalId = 'musiclab-qa-modal';
  const questions = [
    {
      question: '您的音乐基础如何？',
      options: ['完全没有基础', '经历过一段时间的学习，有一定基础', '已经过大量时间的学习，基础扎实']
    },
    {
      question: '您对音乐拥有的兴趣程度如何？',
      options: ['完全没有兴趣', '有一些兴趣', '兴趣浓厚', '非常感兴趣']
    },
    {
      question: '您希望通过本网站获取什么能力？',
      options: ['乐理知识', '识谱技巧', '音乐制作能力']
    }
  ];

  const firstQuestionResultMessages = [
    '已为您选择个性化的方案，让我们从基础开始。',
    '我们将跳过简单的基础学习，直接开始实操与学习结合环节。',
    '您已经有了雄厚的乐理基础，推荐您直接到游乐园界面开始DAW制作！'
  ];

  const ensureStyles = () => {
    if (document.getElementById('musiclab-qa-modal-styles')) return;

    const style = document.createElement('style');
    style.id = 'musiclab-qa-modal-styles';
    style.textContent = `
      .musiclab-qa-overlay {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        background: rgba(10, 12, 18, 0.34);
        backdrop-filter: blur(2px);
        -webkit-backdrop-filter: blur(2px);
        opacity: 0;
        visibility: hidden;
        pointer-events: none;
        transition: opacity 0.22s ease, visibility 0.22s ease;
        z-index: 2000;
      }

      .musiclab-qa-overlay.is-open {
        opacity: 1;
        visibility: visible;
        pointer-events: auto;
      }

      .musiclab-qa-modal {
        position: relative;
        width: min(500px, calc(100vw - 32px));
        background: aliceblue;
        border: 1px solid #d8d8df;
        border-radius: 12px;
        box-shadow: 0 18px 45px rgba(0, 0, 0, 0.25);
        color: #111111;
        transform: translateY(12px) scale(0.98);
        opacity: 0;
        transition: transform 0.22s ease, opacity 0.22s ease;
        overflow: hidden;
      }

      .musiclab-qa-overlay.is-open .musiclab-qa-modal {
        transform: translateY(0) scale(1);
        opacity: 1;
      }

      .musiclab-qa-close {
        position: absolute;
        top: 14px;
        right: 14px;
        width: 32px;
        height: 32px;
        border: none;
        border-radius: 50%;
        background: rgba(65, 65, 243, 0.08);
        color: #111111;
        font-size: 22px;
        cursor: pointer;
        transition: background 0.2s ease, transform 0.2s ease;
      }

      .musiclab-qa-close:hover {
        background: rgba(65, 65, 243, 0.14);
        transform: rotate(90deg);
      }

      .musiclab-qa-header {
        padding: 28px 48px 12px 24px;
        border-bottom: 1px solid rgba(17, 17, 17, 0.08);
      }

      .musiclab-qa-header h2 {
        margin: 0;
        font-size: 30px;
        text-align: center;
      }

      .musiclab-qa-body {
        padding: 20px 24px 18px;
      }

      .musiclab-qa-progress {
        margin: 0 0 16px;
        font-size: 14px;
        color: #4a4a57;
        text-align: center;
      }

      .musiclab-qa-question {
        margin: 0 0 18px;
        font-size: 22px;
        line-height: 1.5;
        text-align: center;
        color: #111111;
      }

      .musiclab-qa-options {
        display: grid;
        gap: 12px;
      }

      .musiclab-qa-option {
        width: 100%;
        padding: 12px 14px;
        border: 1px solid #c8c8d2;
        border-radius: 8px;
        background: #ffffff;
        color: #111111;
        font-size: 15px;
        text-align: left;
        cursor: pointer;
        transition: border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;
      }

      .musiclab-qa-option:hover {
        border-color: rgb(65, 65, 243);
        box-shadow: 0 0 0 3px rgba(65, 65, 243, 0.12);
        transform: translateX(2px);
      }

      .musiclab-qa-result {
        display: none;
        margin: 0 0 16px;
        padding: 12px 14px;
        border-radius: 8px;
        background: rgba(65, 65, 243, 0.06);
        border: 1px solid rgba(65, 65, 243, 0.14);
        color: #1b1d3a;
        font-size: 14px;
        line-height: 1.6;
        text-align: center;
      }

      .musiclab-qa-footer {
        display: flex;
        justify-content: center;
        padding: 0 24px 24px;
      }

      .musiclab-qa-start {
        display: inline-block;
        padding: 12px 30px;
        background: rgb(65, 65, 243);
        color: #fff;
        border: none;
        border-radius: 8px;
        text-decoration: none;
        font-size: 16px;
        cursor: pointer;
        box-shadow: 0 10px 18px rgba(49, 78, 255, 0.35), 0 0 18px rgba(76, 94, 255, 0.18);
        transition: transform 180ms ease, box-shadow 180ms ease, background-color 180ms ease, filter 180ms ease;
      }

      .musiclab-qa-start:hover {
        background: rgb(82, 82, 255);
        box-shadow: 0 0 0 1px rgba(154, 168, 255, 0.35), 0 12px 24px rgba(64, 97, 255, 0.45), 0 0 18px rgba(124, 142, 255, 0.7), 0 0 36px rgba(124, 142, 255, 0.42);
        filter: brightness(1.08);
        transform: translateY(-2px);
      }
    `;
    document.head.appendChild(style);
  };

  const openModal = () => {
    const wrapper = document.getElementById(modalId);
    if (!wrapper) return;
    wrapper.classList.add('is-open');
    wrapper.setAttribute('aria-hidden', 'false');
  };

  const closeModal = () => {
    const wrapper = document.getElementById(modalId);
    if (!wrapper) return;
    wrapper.classList.remove('is-open');
    wrapper.setAttribute('aria-hidden', 'true');
  };

  const buildModal = () => {
    const existing = document.getElementById(modalId);
    if (existing) return existing;

    const wrapper = document.createElement('div');
    wrapper.id = modalId;
    wrapper.className = 'musiclab-qa-overlay';
    wrapper.setAttribute('aria-hidden', 'true');

    wrapper.innerHTML = `
      <div class="musiclab-qa-modal" role="dialog" aria-modal="true" aria-labelledby="musiclab-qa-title">
        <button class="musiclab-qa-close" type="button" aria-label="关闭">×</button>
        <div class="musiclab-qa-header">
          <h2 id="musiclab-qa-title">Q & A</h2>
        </div>
        <div class="musiclab-qa-body">
          <p class="musiclab-qa-progress">1 / 3</p>
          <p class="musiclab-qa-question">请输入文字</p>
          <div class="musiclab-qa-options"></div>
        </div>
        <div class="musiclab-qa-footer" style="display:none; flex-direction:column; align-items:center;">
          <p class="musiclab-qa-result"></p>
          <a class="musiclab-qa-start" href="Start Learning/index.html">开始</a>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    const closeBtn = wrapper.querySelector('.musiclab-qa-close');
    const foot = wrapper.querySelector('.musiclab-qa-footer');
    const resultNode = wrapper.querySelector('.musiclab-qa-result');
    const progressNode = wrapper.querySelector('.musiclab-qa-progress');
    const questionNode = wrapper.querySelector('.musiclab-qa-question');
    const optionsNode = wrapper.querySelector('.musiclab-qa-options');

    let currentIndex = 0;
    let firstQuestionChoice = null;

    const resetQuizState = () => {
      currentIndex = 0;
      firstQuestionChoice = null;
      foot.style.display = 'none';
      resultNode.style.display = 'none';
      resultNode.textContent = '';
      renderQuestion();
    };

    const renderQuestion = () => {
      const question = questions[currentIndex];
      progressNode.textContent = `${currentIndex + 1} / ${questions.length}`;
      questionNode.textContent = question.question;
      optionsNode.innerHTML = '';

      question.options.forEach((optionText, optionIndex) => {
        const optionBtn = document.createElement('button');
        optionBtn.type = 'button';
        optionBtn.className = 'musiclab-qa-option';
        optionBtn.textContent = optionText;
        optionBtn.addEventListener('click', () => {
          if (currentIndex === 0) {
            firstQuestionChoice = optionIndex;
          }

          if (currentIndex < questions.length - 1) {
            currentIndex += 1;
            renderQuestion();
          } else {
            resultNode.textContent = firstQuestionResultMessages[firstQuestionChoice] || firstQuestionResultMessages[0];
            resultNode.style.display = 'block';
            foot.style.display = 'flex';
            optionsNode.innerHTML = '';
            progressNode.textContent = '3 / 3';
          }
        });
        optionsNode.appendChild(optionBtn);
      });

      if (currentIndex === questions.length - 1) {
        foot.style.display = 'none';
      }
    };

    closeBtn.addEventListener('click', () => {
      closeModal();
      resetQuizState();
    });

    wrapper.addEventListener('click', (event) => {
      if (event.target === wrapper) {
        closeModal();
        resetQuizState();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && wrapper.classList.contains('is-open')) {
        closeModal();
        resetQuizState();
      }
    });

    renderQuestion();
    return wrapper;
  };

  ensureStyles();
  buildModal();

  const trigger = document.getElementById('OpenQA');
  if (trigger) {
    trigger.addEventListener('click', openModal);
  }

  window.openQA = openModal;
  window.closeQA = closeModal;
})();
