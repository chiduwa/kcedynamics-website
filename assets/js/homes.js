'use strict';
(() => {
  const buttons = document.querySelectorAll('[data-filter]');
  const cards = [...document.querySelectorAll('.home-design')];
  const count = document.getElementById('design-count');
  buttons.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    cards.forEach(card => { card.hidden = category !== 'all' && card.dataset.category !== category; });
    const shown = cards.filter(card => !card.hidden).length;
    count.textContent = `${shown} reference images. ${category === 'storey' ? 'Two-storey designs require a bespoke quotation.' : 'Images are inspiration; package areas and finishes are agreed separately.'}`;
  }));
})();
