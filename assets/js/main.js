/* ===================================================
   KCE Dynamics Limited — Main JS v2
   Includes: Nav, FAQ, Animations, Stats Counter,
             WhatsApp Widget, Project Starter Widget
   =================================================== */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════
     MOBILE NAV
  ══════════════════════════════════════════ */
  const hamburger = document.querySelector('.nav__hamburger');
  const navMenu   = document.querySelector('.nav__menu');

  if (hamburger && navMenu) {
    hamburger.addEventListener('click', () => {
      const isOpen = navMenu.classList.toggle('mobile-open');
      hamburger.classList.toggle('open', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen);
      document.body.style.overflow = isOpen ? 'hidden' : '';
    });
    document.addEventListener('click', e => {
      if (!e.target.closest('.nav') && navMenu.classList.contains('mobile-open')) {
        hamburger.classList.remove('open');
        navMenu.classList.remove('mobile-open');
        document.body.style.overflow = '';
      }
    });
    navMenu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        navMenu.classList.remove('mobile-open');
        document.body.style.overflow = '';
      });
    });
  }

  /* Active nav link */
  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPath || (currentPath === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* ══════════════════════════════════════════
     FAQ ACCORDION
  ══════════════════════════════════════════ */
  document.querySelectorAll('.faq-question').forEach(q => {
    q.addEventListener('click', () => {
      const item  = q.closest('.faq-item');
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item').forEach(i => {
        i.classList.remove('open');
        i.querySelector('.faq-question')?.setAttribute('aria-expanded', 'false');
      });
      if (!isOpen) {
        item.classList.add('open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
    q.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); q.click(); }
    });
  });

  /* ══════════════════════════════════════════
     INTERSECTION OBSERVER — FADE IN
  ══════════════════════════════════════════ */
  const fadeObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        fadeObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('.fade-in').forEach(el => fadeObserver.observe(el));

  /* ══════════════════════════════════════════
     STAT COUNTER ANIMATION
  ══════════════════════════════════════════ */
  function animateCount(el, target, suffix) {
    let start = 0;
    const dur = 1600, step = target / (dur / 16);
    const t = setInterval(() => {
      start += step;
      if (start >= target) { start = target; clearInterval(t); }
      el.textContent = Math.floor(start) + suffix;
    }, 16);
  }
  const counterObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el     = entry.target;
        const target = parseInt(el.dataset.target, 10);
        const suffix = el.dataset.suffix || '';
        animateCount(el, target, suffix);
        counterObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('.stat__number[data-target]').forEach(el => counterObserver.observe(el));

  /* ══════════════════════════════════════════
     CONTACT FORM (submits to Formsubmit.co — see
     hidden _subject/_next fields on the <form>)
  ══════════════════════════════════════════ */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', () => {
      // UX only — the native POST + redirect to Formsubmit.co still proceeds.
      const btn = contactForm.querySelector('button[type="submit"]');
      if (btn) {
        btn.textContent = 'Sending…';
        btn.disabled = true;
      }
    });
  }

  /* Success message — show after Formsubmit redirect with ?sent=1,
     and fire the conversion event for GTM/GA4 (see trigger
     "Contact Form Submitted" -> tag "GA4 Event - contact_form_submitted"). */
  if (window.location.search.includes('sent=1')) {
    const form    = document.getElementById('contactForm');
    const success = document.getElementById('contactSuccess');
    if (form)    form.style.display    = 'none';
    if (success) success.style.display = 'block';
    if (success) setTimeout(() => success.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'contact_form_submitted', form_name: 'contact_enquiry' });
  }

  /* ══════════════════════════════════════════
     CAREERS PAGE — file upload label + success
  ══════════════════════════════════════════ */

  /* File upload — update label text when a file is chosen */
  const cvInput = document.getElementById('cf_resume');
  if (cvInput) {
    cvInput.addEventListener('change', () => {
      const fileNameEl = document.getElementById('cvFileName');
      const uploadArea = cvInput.closest('.cv-upload');
      if (cvInput.files && cvInput.files[0]) {
        const name = cvInput.files[0].name;
        if (fileNameEl) fileNameEl.textContent = name;
        if (uploadArea) uploadArea.classList.add('has-file');
      } else {
        if (fileNameEl) fileNameEl.textContent = 'PDF, DOC, or DOCX — max 5 MB';
        if (uploadArea) uploadArea.classList.remove('has-file');
      }
    });
  }

  /* Success message — show after Formsubmit redirect with ?applied=1 */
  if (window.location.search.includes('applied=1')) {
    const form    = document.getElementById('careerForm');
    const success = document.getElementById('careersSuccess');
    if (form)    form.style.display    = 'none';
    if (success) success.style.display = 'block';
    /* Scroll gently to the success panel */
    if (success) setTimeout(() => success.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ event: 'career_application_submitted', form_name: 'careers' });
  }

  /* Smooth anchor scroll */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const t = document.querySelector(a.getAttribute('href'));
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: 'smooth' }); }
    });
  });

  /* ══════════════════════════════════════════
     WHATSAPP WIDGET — inject into page
  ══════════════════════════════════════════ */
  const waHTML = `
  <div class="wa-widget" role="complementary" aria-label="WhatsApp chat">
    <div class="wa-tooltip">Chat with us on WhatsApp</div>
    <a href="https://wa.me/233209970207?text=Hello%2C%20I%27d%20like%20to%20discuss%20a%20project%20with%20KCE%20Dynamics."
       target="_blank" rel="noopener noreferrer"
       class="wa-btn" aria-label="Open WhatsApp chat with KCE Dynamics">
      <span class="wa-pulse"></span>
      <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
        <path d="M12 0C5.373 0 0 5.373 0 12c0 2.1.548 4.107 1.502 5.852L0 24l6.335-1.652A11.954 11.954 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.007-1.372l-.36-.213-3.727.975 1.003-3.617-.234-.373A9.818 9.818 0 1112 21.818z"/>
      </svg>
    </a>
  </div>`;
  document.body.insertAdjacentHTML('beforeend', waHTML);

  /* ══════════════════════════════════════════
     PROJECT STARTER — Interactive Widget
  ══════════════════════════════════════════ */

  /* Widget data */
  const psSteps = [
    {
      question: 'What are you building?',
      options: [
        { icon: '🏠', label: 'Residential Building', value: 'residential' },
        { icon: '🌊', label: 'Drainage System',       value: 'drainage' },
        { icon: '🏗️', label: 'Retaining Structure',   value: 'retaining' },
        { icon: '📋', label: 'Other / Not Sure',       value: 'other' },
      ]
    },
    {
      question: 'Which region in Ghana?',
      options: [
        { icon: '📍', label: 'Bono Region',             value: 'bono' },
        { icon: '📍', label: 'Ahafo Region',            value: 'ahafo' },
        { icon: '📍', label: 'Other Ghana Region',      value: 'other-ghana' },
        { icon: '🌍', label: 'Diaspora / International', value: 'diaspora' },
      ]
    }
  ];

  const psResults = {
    residential: {
      title: 'Design & Development',
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
      text: 'We handle structural design, engineering calculations, and supervised construction for residential buildings in Ghana.'
    },
    drainage: {
      title: 'Civil & Drainage Engineering',
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M2 12h20"/></svg>`,
      text: 'From hydrological analysis to completed drainage infrastructure — we design and build storm-water systems that last.'
    },
    retaining: {
      title: 'Structural Engineering',
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>`,
      text: 'Retaining structures engineered with geotechnical analysis for long-term slope stability under Ghana\'s local conditions.'
    },
    other: {
      title: 'Consultation & Analysis',
      icon: `<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
      text: 'Not sure where to start? We begin every engagement with a site visit and data review — no obligation to proceed.'
    }
  };

  const psHTML = `
  <div class="ps-widget" id="psWidget" role="complementary" aria-label="Project starter">
    <button class="ps-trigger" id="psTrigger" aria-expanded="false" aria-controls="psPanel">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
        <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.38 2 2 0 0 1 3.6 1.22h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.91a16 16 0 0 0 6 6l.91-.91a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7a2 2 0 0 1 1.72 2.02z"/>
      </svg>
      Start a Project
    </button>

    <div class="ps-panel" id="psPanel" aria-hidden="true">
      <div class="ps-panel-header">
        <h4>KCE Project Starter</h4>
        <button class="ps-close-btn" id="psClose" aria-label="Close">×</button>
      </div>
      <div class="ps-body">
        <div class="ps-step-indicator" id="psIndicator">
          <span class="ps-dot active"></span>
          <span class="ps-dot"></span>
          <span class="ps-dot"></span>
        </div>
        <div id="psContent"></div>
      </div>
    </div>
  </div>`;

  document.body.insertAdjacentHTML('beforeend', psHTML);

  /* Widget logic */
  const psTrigger   = document.getElementById('psTrigger');
  const psPanel     = document.getElementById('psPanel');
  const psClose     = document.getElementById('psClose');
  const psContent   = document.getElementById('psContent');
  const psIndicator = document.getElementById('psIndicator');

  let psStep    = 0;
  let psAnswers = {};

  function updateIndicator(step) {
    const dots = psIndicator.querySelectorAll('.ps-dot');
    dots.forEach((d, i) => {
      d.classList.toggle('active', i === step);
      d.classList.toggle('done',   i < step);
    });
  }

  function renderStep(stepIndex) {
    updateIndicator(stepIndex);
    const step = psSteps[stepIndex];
    let html = `<p class="ps-question">${step.question}</p><div class="ps-options">`;
    step.options.forEach(opt => {
      html += `<button class="ps-option" data-value="${opt.value}">
        <span style="font-size:1.1em">${opt.icon}</span> ${opt.label}
      </button>`;
    });
    html += `</div>`;
    psContent.innerHTML = html;
    psContent.querySelectorAll('.ps-option').forEach(btn => {
      btn.addEventListener('click', () => handleAnswer(stepIndex, btn.dataset.value, btn));
    });
  }

  function handleAnswer(stepIndex, value, btn) {
    btn.classList.add('selected');
    psAnswers[stepIndex] = value;
    setTimeout(() => {
      if (stepIndex + 1 < psSteps.length) {
        psStep = stepIndex + 1;
        renderStep(psStep);
      } else {
        showResult();
      }
    }, 260);
  }

  function showResult() {
    updateIndicator(2);
    const projType = psAnswers[0] || 'other';
    const result   = psResults[projType];
    psContent.innerHTML = `
      <div class="ps-result">
        <div class="ps-result-icon">${result.icon}</div>
        <h4>${result.title}</h4>
        <p>${result.text}</p>
        <a href="contact.html" class="btn btn--primary ps-result-cta">
          Discuss Your Project →
        </a>
        <button class="ps-restart-btn">Start over</button>
      </div>`;
    psContent.querySelector('.ps-restart-btn').addEventListener('click', () => {
      psStep = 0;
      psAnswers = {};
      renderStep(0);
    });
  }

  function openPanel() {
    psPanel.classList.add('open');
    psTrigger.setAttribute('aria-expanded', 'true');
    psPanel.setAttribute('aria-hidden', 'false');
    if (psStep === 0 && !psAnswers[0]) renderStep(0);
  }
  function closePanel() {
    psPanel.classList.remove('open');
    psTrigger.setAttribute('aria-expanded', 'false');
    psPanel.setAttribute('aria-hidden', 'true');
  }

  psTrigger.addEventListener('click', () => {
    psPanel.classList.contains('open') ? closePanel() : openPanel();
  });
  psClose.addEventListener('click', closePanel);

  document.addEventListener('click', e => {
    const widget = document.getElementById('psWidget');
    if (widget && !widget.contains(e.target) && psPanel.classList.contains('open')) {
      closePanel();
    }
  });

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && psPanel.classList.contains('open')) closePanel();
  });

  /* ══════════════════════════════════════════
     LAZY-LOAD OFFSCREEN VIDEOS
     Below-the-fold background videos (e.g. the renovation
     clip on the homepage project grid + projects.html) only
     start fetching once they're about to scroll into view —
     keeps them from competing with the hero video for
     bandwidth on initial page load.
  ══════════════════════════════════════════ */
  const lazyVideos = document.querySelectorAll('video.lazy-video');
  if (lazyVideos.length) {
    const videoObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        const video = entry.target;
        video.querySelectorAll('source[data-src]').forEach(source => {
          source.src = source.dataset.src;
        });
        video.load();
        video.play().catch(() => {});
        observer.unobserve(video);
      });
    }, { rootMargin: '200px' });
    lazyVideos.forEach(video => videoObserver.observe(video));
  }

});

// ════════════════════════════════════════════════════════
// BUILDING WIDGET — click through 5 construction stages
// ════════════════════════════════════════════════════════
(function () {

  var bwStages = [
    {
      label: 'The Blueprint',
      svg: '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg"><rect width="140" height="110" fill="#1B3A5C"/><line x1="20" y1="0" x2="20" y2="110" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="40" y1="0" x2="40" y2="110" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="60" y1="0" x2="60" y2="110" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="80" y1="0" x2="80" y2="110" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="100" y1="0" x2="100" y2="110" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="120" y1="0" x2="120" y2="110" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="0" y1="20" x2="140" y2="20" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="0" y1="40" x2="140" y2="40" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="0" y1="60" x2="140" y2="60" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="0" y1="80" x2="140" y2="80" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><line x1="0" y1="100" x2="140" y2="100" stroke="rgba(100,180,255,.14)" stroke-width=".6"/><polyline points="23,34 70,13 117,34" fill="none" stroke="#64B4FF" stroke-width="1.5" stroke-dasharray="5,3"/><rect x="28" y="32" width="84" height="68" fill="none" stroke="#64B4FF" stroke-width="1.5" stroke-dasharray="5,3"/><rect x="22" y="100" width="96" height="6" fill="none" stroke="rgba(100,180,255,.6)" stroke-width="1" stroke-dasharray="3,2"/><rect x="36" y="46" width="20" height="16" fill="none" stroke="rgba(100,180,255,.5)" stroke-width="1" stroke-dasharray="3,2"/><rect x="84" y="46" width="20" height="16" fill="none" stroke="rgba(100,180,255,.5)" stroke-width="1" stroke-dasharray="3,2"/><rect x="60" y="74" width="20" height="26" fill="none" stroke="rgba(100,180,255,.5)" stroke-width="1" stroke-dasharray="3,2"/><text x="70" y="8" font-size="4.5" fill="rgba(100,180,255,.55)" text-anchor="middle" font-family="monospace">ELEVATION — KCE DYNAMICS</text></svg>',
      btn: 'Break Ground →'
    },
    {
      label: 'The Foundation',
      svg: '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg"><rect width="140" height="110" fill="#EEE9E2"/><rect x="0" y="104" width="140" height="6" fill="#8B7355"/><rect x="22" y="96" width="96" height="10" fill="#A0A0A0" stroke="#7A7A7A" stroke-width="1"/><line x1="36" y1="97" x2="36" y2="106" stroke="#757575" stroke-width="1.2"/><line x1="55" y1="97" x2="55" y2="106" stroke="#757575" stroke-width="1.2"/><line x1="74" y1="97" x2="74" y2="106" stroke="#757575" stroke-width="1.2"/><line x1="93" y1="97" x2="93" y2="106" stroke="#757575" stroke-width="1.2"/><line x1="112" y1="97" x2="112" y2="106" stroke="#757575" stroke-width="1.2"/><line x1="22" y1="101" x2="118" y2="101" stroke="#757575" stroke-width=".8"/><text x="70" y="88" font-size="6" fill="rgba(0,0,0,.25)" text-anchor="middle" font-family="sans-serif">Foundation slab</text></svg>',
      btn: 'Raise the Frame →'
    },
    {
      label: 'Steel Frame',
      svg: '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg"><rect width="140" height="110" fill="#EEE9E2"/><rect x="0" y="104" width="140" height="6" fill="#8B7355"/><rect x="22" y="96" width="96" height="10" fill="#A0A0A0" stroke="#7A7A7A" stroke-width="1"/><rect x="26" y="34" width="5" height="62" fill="#7A5C30"/><rect x="109" y="34" width="5" height="62" fill="#7A5C30"/><rect x="66" y="34" width="4" height="62" fill="#7A5C30" opacity=".65"/><rect x="26" y="63" width="88" height="4" fill="#7A5C30"/><rect x="26" y="33" width="88" height="4" fill="#7A5C30"/><polyline points="22,35 70,12 118,35" fill="none" stroke="#7A5C30" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><line x1="48" y1="23" x2="48" y2="35" stroke="#7A5C30" stroke-width="2.5"/><line x1="92" y1="23" x2="92" y2="35" stroke="#7A5C30" stroke-width="2.5"/></svg>',
      btn: 'Build the Walls →'
    },
    {
      label: 'Walls Rising',
      svg: '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg"><rect width="140" height="110" fill="#EEE9E2"/><rect x="0" y="104" width="140" height="6" fill="#8B7355"/><rect x="22" y="96" width="96" height="10" fill="#A0A0A0" stroke="#7A7A7A" stroke-width="1"/><rect x="28" y="60" width="84" height="36" fill="#D4C5A9" stroke="#BFB09A" stroke-width="1"/><line x1="28" y1="77" x2="112" y2="77" stroke="rgba(100,80,40,.3)" stroke-width=".8" stroke-dasharray="4,3"/><rect x="28" y="54" width="18" height="7" fill="#C8B89A" stroke="#BFB09A" stroke-width=".8"/><rect x="48" y="54" width="18" height="7" fill="#BBAA8E" stroke="#BFB09A" stroke-width=".8"/><rect x="68" y="56" width="18" height="5" fill="#C8B89A" stroke="#BFB09A" stroke-width=".8"/><rect x="88" y="57" width="14" height="4" fill="#C8B89A" stroke="#BFB09A" stroke-width=".8"/><polyline points="22,35 70,12 118,35" fill="none" stroke="#7A5C30" stroke-width="4.5" stroke-linejoin="round" stroke-linecap="round"/><line x1="28" y1="35" x2="28" y2="60" stroke="#7A5C30" stroke-width="3"/><line x1="112" y1="35" x2="112" y2="60" stroke="#7A5C30" stroke-width="3"/></svg>',
      btn: 'Finish the Build →'
    },
    {
      label: 'Complete!',
      svg: '<svg viewBox="0 0 140 110" xmlns="http://www.w3.org/2000/svg"><rect width="140" height="110" fill="#EEE9E2"/><rect x="0" y="103" width="140" height="7" fill="#5A8035"/><rect x="22" y="99" width="96" height="6" fill="#9E9E9E"/><rect x="28" y="32" width="84" height="68" fill="#E8DCC8" stroke="#C8B89A" stroke-width="1"/><polygon points="22,34 70,12 118,34" fill="#C8911A" stroke="#A67510" stroke-width="1.5"/><rect x="88" y="15" width="11" height="18" fill="#D4C5A9" stroke="#BFB09A" stroke-width="1"/><rect x="36" y="46" width="20" height="16" fill="#AED6F1" stroke="#7A5C30" stroke-width="1.5" rx="1"/><line x1="46" y1="46" x2="46" y2="62" stroke="#7A5C30" stroke-width="1"/><line x1="36" y1="54" x2="56" y2="54" stroke="#7A5C30" stroke-width="1"/><rect x="84" y="46" width="20" height="16" fill="#AED6F1" stroke="#7A5C30" stroke-width="1.5" rx="1"/><line x1="94" y1="46" x2="94" y2="62" stroke="#7A5C30" stroke-width="1"/><line x1="84" y1="54" x2="104" y2="54" stroke="#7A5C30" stroke-width="1"/><rect x="60" y="72" width="20" height="28" fill="#7A5C30" stroke="#5C3D18" stroke-width="1.5" rx="2"/><circle cx="77" cy="86" r="2" fill="#C8911A"/><rect x="56" y="98" width="28" height="3" fill="#A0A0A0"/></svg>',
      btn: null
    }
  ];

  var bwStage = 0;

  var bwHTML = '<div id="bwWidget" class="bw-widget" role="complementary" aria-label="Build-a-House">' +
    '<span class="bw-tooltip">Build it!</span>' +
    '<button class="bw-trigger" id="bwTrigger" aria-label="Build-a-House widget" aria-expanded="false">' +
      '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>' +
      '<span class="bw-badge" id="bwBadge">1</span>' +
    '</button>' +
    '<div class="bw-panel" id="bwPanel" aria-hidden="true">' +
      '<div class="bw-panel-header">' +
        '<span>Build&#8209;a&#8209;House</span>' +
        '<button class="bw-close" id="bwClose" aria-label="Close">&times;</button>' +
      '</div>' +
      '<div id="bwBody"></div>' +
    '</div>' +
  '</div>';

  document.body.insertAdjacentHTML('beforeend', bwHTML);

  var bwTrigger = document.getElementById('bwTrigger');
  var bwPanel   = document.getElementById('bwPanel');
  var bwClose   = document.getElementById('bwClose');
  var bwBody    = document.getElementById('bwBody');
  var bwBadge   = document.getElementById('bwBadge');

  function renderBwStage() {
    var s = bwStages[bwStage];
    if (bwStage < bwStages.length - 1) {
      bwBody.innerHTML =
        '<div class="bw-stage-area">' +
          '<div class="bw-stage-label">' + s.label + '</div>' +
          '<div class="bw-svg-frame">' + s.svg + '</div>' +
          '<div class="bw-stage-counter">Stage ' + (bwStage + 1) + ' of ' + bwStages.length + '</div>' +
        '</div>' +
        '<button class="bw-build-btn" id="bwBuildBtn">' + s.btn + '</button>';
      document.getElementById('bwBuildBtn').addEventListener('click', function () {
        bwStage++;
        bwBadge.textContent = bwStage + 1 > bwStages.length ? bwStages.length : bwStage + 1;
        renderBwStage();
      });
    } else {
      bwBadge.style.background = '#6B8E3B';
      bwBadge.textContent = '✓';
      bwBody.innerHTML =
        '<div class="bw-complete">' +
          '<div class="bw-complete-icon">' +
            '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>' +
          '</div>' +
          '<div class="bw-svg-frame" style="width:100%;height:90px;">' + s.svg + '</div>' +
          '<h4 style="margin-top:10px;">Project Complete!</h4>' +
          '<p>Built in Ghana.<br>Proven on site.</p>' +
          '<button class="bw-rebuild-btn" id="bwRebuildBtn">Build Again</button>' +
        '</div>';
      document.getElementById('bwRebuildBtn').addEventListener('click', function () {
        bwStage = 0;
        bwBadge.textContent = '1';
        bwBadge.style.background = '';
        renderBwStage();
      });
    }
  }

  function openBwPanel() {
    bwPanel.classList.add('open');
    bwTrigger.setAttribute('aria-expanded', 'true');
    bwPanel.setAttribute('aria-hidden', 'false');
    renderBwStage();
  }
  function closeBwPanel() {
    bwPanel.classList.remove('open');
    bwTrigger.setAttribute('aria-expanded', 'false');
    bwPanel.setAttribute('aria-hidden', 'true');
  }

  bwTrigger.addEventListener('click', function () {
    bwPanel.classList.contains('open') ? closeBwPanel() : openBwPanel();
  });
  bwClose.addEventListener('click', closeBwPanel);

  document.addEventListener('click', function (e) {
    var widget = document.getElementById('bwWidget');
    if (widget && !widget.contains(e.target) && bwPanel.classList.contains('open')) {
      closeBwPanel();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && bwPanel.classList.contains('open')) closeBwPanel();
  });

}());
