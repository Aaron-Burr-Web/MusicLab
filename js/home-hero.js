(() => {
  'use strict';

  const slides = [...document.querySelectorAll('.hero-bg')];
  if (slides.length < 2) return;

  let current = 0;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  if (reducedMotion.matches) return;

  window.setInterval(() => {
    slides[current].classList.remove('is-active');
    current = (current + 1) % slides.length;
    slides[current].classList.add('is-active');
  }, 4500);
})();