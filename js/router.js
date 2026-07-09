/**
 * ROUTER.JS — Hash-based SPA navigation
 */

'use strict';

const ROUTER = (() => {

  const PAGES = {
    'client-dashboard': 'Client Dashboard',
    'client-search': 'Client Search',
    'internal-dashboard': 'Internal Dashboard',
    'internal-search': 'Internal Search',
    reports: 'Reports',
    creatives: 'Creatives',
    docs: 'Docs',
    cases: 'Cases',
    clientrefs: 'Client References',
    admin: 'Admin',
    'branding': 'Design & Branding',
    'call-library': 'Call Library',
    'call-library-0': 'Call Library V0',
    'enablement-tracker': 'Team Tracker'
  };

  let _currentPage = null;
  let _currentParam = null;

  function parseHash() {
    let hash = window.location.hash.replace('#', '') || 'client-dashboard';
    let [page, param] = hash.split('/');
    if (page === 'console' || page === 'dashboard') {
      page = 'client-dashboard';
      window.location.hash = '#client-dashboard';
    }
    if (page === 'search') {
      page = 'client-search';
      window.location.hash = '#client-search';
    }
    if (page === 'miniprofiles') {
      let targetParam = param;
      if (param && param.startsWith('profile-')) {
        const prof = STORE.getClientProfiles().find(p => p.id === param);
        if (prof) targetParam = encodeURIComponent(prof.client_name);
      }
      page = 'clientrefs';
      window.location.hash = targetParam ? `#clientrefs/${targetParam}` : '#clientrefs';
      // Re-read hash because we changed it
      hash = window.location.hash.replace('#', '');
      [page, param] = hash.split('/');
    }
    return { page: page || 'client-dashboard', param: param || null };
  }

  function navigate(page, param = null) {
    const hash = param ? `#${page}/${param}` : `#${page}`;
    window.location.hash = hash;
  }

  function getPageTitle(page) {
    return PAGES[page] || page;
  }

  function render() {
    const { page, param } = parseHash();
    _currentPage = page;
    _currentParam = param;

    // Update nav active state
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === page);
    });

    // Update topbar title
    const topTitle = document.getElementById('topbar-title');
    if (topTitle) {
      if (page === 'creatives') {
        topTitle.textContent = '';
      } else {
        topTitle.textContent = PAGES[page] || page;
      }
    }

    // Update topbar tag
    const topTag = document.getElementById('topbar-tag');
    if (topTag) {
      const tagMap = {
        'client-dashboard': 'Client Portal Overview',
        'client-search': 'Client-Safe Search',
        'internal-dashboard': 'Internal Enablement Overview',
        'internal-search': 'Internal Full Search',
        reports: 'Reports',
        creatives: 'Visual Assets',
        docs: 'Internal',
        cases: 'Proof Materials',
        clientrefs: 'Live Examples',
        admin: 'Admin',
        branding: 'Design & Branding'
      };
      topTag.textContent = tagMap[page] || '';
    }

    // Render page
    const container = document.getElementById('page-container');
    if (!container) return;

    // Cleanup video elements to free memory and prevent lag before unmounting
    const videos = container.querySelectorAll('video');
    videos.forEach(v => {
      v.pause();
      v.removeAttribute('src');
      v.load();
    });

    container.innerHTML = '';
    container.className = 'page-content animate-fade';

    const pageRenderers = {
      'client-dashboard': () => PAGE_DASHBOARD.render(container, { mode: 'client' }),
      'client-search': () => PAGE_SEARCH.render(container, { mode: 'client' }),
      'internal-dashboard': () => PAGE_DASHBOARD.render(container, { mode: 'internal' }),
      'internal-search': () => PAGE_SEARCH.render(container, { mode: 'internal' }),
      reports: () => PAGE_REPORTS.render(container),
      creatives: () => PAGE_CREATIVES.render(container),
      docs: () => PAGE_DOCS.render(container),
      cases: () => PAGE_CASES.render(container),
      clientrefs: () => PAGE_CLIENTREFS.render(container, param),
      admin: () => PAGE_ADMIN.render(container, param),
      'branding': () => PAGE_BRANDING.render(container),
      'call-library': () => PAGE_CALLLIBRARY.render(container),

      'enablement-tracker': () => PAGE_ENABLEMENT.render(container)
    };

    const fn = pageRenderers[page];
    if (fn) fn();
    else container.innerHTML = `<div class="empty-state"><div class="empty-title">Page not found</div></div>`;
  }

  function init() {
    window.addEventListener('hashchange', render);
    render();
  }

  return { init, navigate, parseHash, getPageTitle, render };
})();

window.ROUTER = ROUTER;
