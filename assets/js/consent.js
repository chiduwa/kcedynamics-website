/* ===================================================
   KCE Dynamics Limited — Cookie Consent v1
   GDPR / ePrivacy banner. Talks to Google Consent
   Mode v2 (gtag) so GTM-TJ47BQFK and gtag.js respect
   the visitor's choice. Consent defaults are set
   separately, inline in <head>, before any tag loads.
   =================================================== */

(() => {
  const STORAGE_KEY = 'kce_cookie_consent';
  const POLICY_VERSION = 1;

  const getSavedConsent = () => {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === POLICY_VERSION) return saved;
    } catch (e) {}
    return null;
  };

  const saveConsent = (analytics, marketing) => {
    const record = {
      version: POLICY_VERSION,
      analytics,
      marketing,
      timestamp: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(record));
    return record;
  };

  const updateGtagConsent = record => {
    if (typeof window.gtag !== 'function') return;
    window.gtag('consent', 'update', {
      analytics_storage:  record.analytics ? 'granted' : 'denied',
      ad_storage:          record.marketing ? 'granted' : 'denied',
      ad_user_data:        record.marketing ? 'granted' : 'denied',
      ad_personalization:  record.marketing ? 'granted' : 'denied'
    });
  };

  const buildBanner = () => {
    const wrap = document.createElement('div');
    wrap.id = 'cookie-consent';
    wrap.className = 'cookie-consent';
    wrap.setAttribute('role', 'dialog');
    wrap.setAttribute('aria-live', 'polite');
    wrap.setAttribute('aria-label', 'Cookie consent');
    wrap.innerHTML = `
      <div class="cookie-consent__bar">
        <p class="cookie-consent__text">
          We use cookies to run this site and, with your permission, to understand how it is used.
          See our <a href="cookie-policy.html">Cookie Policy</a> for details.
        </p>
        <div class="cookie-consent__actions">
          <button type="button" class="btn-cc btn-cc--ghost" data-cc="customize">Customize</button>
          <button type="button" class="btn-cc btn-cc--outline" data-cc="reject">Reject Non-Essential</button>
          <button type="button" class="btn-cc btn-cc--solid" data-cc="accept">Accept All</button>
        </div>
      </div>
      <div class="cookie-consent__panel" hidden>
        <h2 class="cookie-consent__panel-title">Cookie Preferences</h2>
        <div class="cookie-consent__category">
          <div class="cookie-consent__category-head">
            <span>Necessary</span>
            <label class="cookie-consent__switch cookie-consent__switch--disabled">
              <input type="checkbox" checked disabled />
              <span class="cookie-consent__slider"></span>
            </label>
          </div>
          <p>Required for the site to run (security, navigation). Always on.</p>
        </div>
        <div class="cookie-consent__category">
          <div class="cookie-consent__category-head">
            <span>Analytics</span>
            <label class="cookie-consent__switch">
              <input type="checkbox" id="cc-analytics" />
              <span class="cookie-consent__slider"></span>
            </label>
          </div>
          <p>Helps us understand how visitors use the site (Google Analytics, via Google Tag Manager).</p>
        </div>
        <div class="cookie-consent__category">
          <div class="cookie-consent__category-head">
            <span>Marketing</span>
            <label class="cookie-consent__switch">
              <input type="checkbox" id="cc-marketing" />
              <span class="cookie-consent__slider"></span>
            </label>
          </div>
          <p>Used to measure ad performance if/when we run campaigns.</p>
        </div>
        <div class="cookie-consent__panel-actions">
          <button type="button" class="btn-cc btn-cc--outline" data-cc="reject">Reject Non-Essential</button>
          <button type="button" class="btn-cc btn-cc--solid" data-cc="save">Save Preferences</button>
        </div>
      </div>`;
    return wrap;
  };

  const init = () => {
    const banner = buildBanner();
    document.body.appendChild(banner);

    const bar   = banner.querySelector('.cookie-consent__bar');
    const panel = banner.querySelector('.cookie-consent__panel');
    const chkA  = banner.querySelector('#cc-analytics');
    const chkM  = banner.querySelector('#cc-marketing');

    const showBar   = () => { bar.hidden = false; panel.hidden = true; banner.classList.add('is-visible'); };
    const showPanel = () => { bar.hidden = true; panel.hidden = false; banner.classList.add('is-visible'); };
    const hideAll   = () => banner.classList.remove('is-visible');

    const applyAndClose = (analytics, marketing) => {
      const record = saveConsent(analytics, marketing);
      updateGtagConsent(record);
      hideAll();
    };

    banner.addEventListener('click', e => {
      const action = e.target.getAttribute('data-cc');
      if (!action) return;
      if (action === 'accept')    applyAndClose(true, true);
      if (action === 'reject')    applyAndClose(false, false);
      if (action === 'customize') showPanel();
      if (action === 'save')      applyAndClose(!!chkA.checked, !!chkM.checked);
    });

    const existing = getSavedConsent();
    if (existing) {
      chkA.checked = !!existing.analytics;
      chkM.checked = !!existing.marketing;
    } else {
      showBar();
    }

    document.querySelectorAll('[data-cookie-settings]').forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        const current = getSavedConsent() || { analytics: false, marketing: false };
        chkA.checked = !!current.analytics;
        chkM.checked = !!current.marketing;
        showPanel();
      });
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
