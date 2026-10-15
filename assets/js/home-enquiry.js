'use strict';
(() => {
  const form = document.getElementById('contactForm');
  if (!form) return;
  const params = new URLSearchParams(window.location.search);
  const service = document.getElementById('service');
  const requested = params.get('service');
  if ([...service.options].some(option => option.value === requested)) service.value = requested;
  const packages = {
    'one-bedroom': 'One-bedroom bungalow / 55 m² (approx. 592 sq ft) / indicative main-building budget GH₵298,000–360,000',
    'two-bedroom': 'Two-bedroom bungalow / 85 m² (approx. 915 sq ft) / indicative main-building budget GH₵461,000–555,000',
    'three-bedroom': 'Three-bedroom bungalow / 110 m² (approx. 1,184 sq ft) / indicative main-building budget GH₵596,000–715,000'
  };
  const lines = [];
  if (packages[params.get('package')]) lines.push('Package of interest: ' + packages[params.get('package')]);
  const design = params.get('design');
  if (design && /^D\d{2} — /.test(design)) lines.push('Design reference: ' + design.slice(0,160));
  if (requested === 'diaspora') lines.push('I would like information about bank options and KCE project support.');
  if (requested === 'home-build' || lines.length) lines.push('My proposed location, timeline and budget: ');
  const message = document.getElementById('message');
  if (lines.length && !message.value) message.value = lines.join('\n\n');
})();
