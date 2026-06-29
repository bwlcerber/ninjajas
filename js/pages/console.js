/** PAGE: Call Console — The real sales workspace */
'use strict';

const PAGE_CONSOLE = (() => {

  let _vertical = 'all';
  let _service = 'all';
  let _query = '';
  let _activeView = 'all'; // 'all', 'reports', 'creatives', 'cases', 'docs'

  function render(container) {
    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Internal Dashboard</div>
          <div id="console-share-status"></div>
        </div>

        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-top:16px">
          <!-- Search input -->
          <div class="search-bar" style="flex:1;min-width:240px">
            ${ICONS.search}
            <input id="console-search" type="text" placeholder="Quick search assets..." value="${_query}" autocomplete="off">
          </div>

          <!-- Vertical select -->
          <select class="select" id="console-vertical" style="width:160px">
            <option value="all">All Verticals</option>
            ${window.PORTAL_DATA.VERTICALS.map(v => `<option value="${v}" ${_vertical === v ? 'selected':''}>${v}</option>`).join('')}
          </select>

          <!-- Service select -->
          <select class="select" id="console-service" style="width:160px">
            <option value="all">All Services</option>
            ${window.PORTAL_DATA.SERVICES.map(s => `<option value="${s}" ${_service === s ? 'selected':''}>${s}</option>`).join('')}
          </select>
        </div>

        <!-- Section Switcher tabs for small screens or focused view -->
        <div class="tabs" style="margin-top:16px;margin-bottom:0">
          <div class="tab ${_activeView === 'all' ? 'active' : ''}" data-view="all">Show All Layout</div>
          <div class="tab ${_activeView === 'reports' ? 'active' : ''}" data-view="reports">📊 Reports Only</div>
          <div class="tab ${_activeView === 'creatives' ? 'active' : ''}" data-view="creatives">🎨 Creatives Only</div>
          <div class="tab ${_activeView === 'cases' ? 'active' : ''}" data-view="cases">🏆 Success Cases Only</div>
          <div class="tab ${_activeView === 'docs' ? 'active' : ''}" data-view="docs">📁 Internal Docs Only</div>
        </div>
      </div>

      <div id="console-workspace" class="console-grid"></div>
    `;

    // Setup event listeners
    container.querySelector('#console-search').addEventListener('input', e => {
      _query = e.target.value;
      renderGrid(container);
    });

    container.querySelector('#console-vertical').addEventListener('change', e => {
      _vertical = e.target.value;
      renderGrid(container);
    });

    container.querySelector('#console-service').addEventListener('change', e => {
      _service = e.target.value;
      renderGrid(container);
    });

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _activeView = tab.dataset.view;
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === _activeView));
        renderGrid(container);
      });
    });

    updateShareStatus();
    renderGrid(container);
  }

  function updateShareStatus() {
    const el = document.getElementById('console-share-status');
    if (!el) return;
    if (window.SCREEN_SHARE_ACTIVE) {
      el.innerHTML = `
        <div class="screen-share-badge">
          <span></span> CLIENT SCREEN SHARE MODE ACTIVE (INTERNAL DOCUMENTS HIDDEN)
        </div>
      `;
    } else {
      el.innerHTML = '';
    }
  }

  function renderGrid(container) {
    const workspace = container.querySelector('#console-workspace');
    if (!workspace) return;

    // Fetch all materials from unified store
    let materials = STORE.getMaterials();

    // 1. Filter by vertical
    if (_vertical !== 'all') {
      materials = materials.filter(m => m.vertical === _vertical);
    }

    // 2. Filter by service
    if (_service !== 'all') {
      materials = materials.filter(m => m.services_provided && m.services_provided.includes(_service));
    }

    // 3. Filter by search query
    if (_query.trim()) {
      const q = _query.toLowerCase();
      materials = materials.filter(m =>
        [m.title, m.description, m.client_name, m.vertical, ...(m.tags || [])].join(' ').toLowerCase().includes(q)
      );
    }

    // Split materials into lists
    const reports = materials.filter(m => ['report', 'media-plan', 'deck'].includes(m.asset_type));
    const creatives = materials.filter(m => ['creative', 'video', 'image'].includes(m.asset_type));
    const cases = materials.filter(m => m.asset_type === 'case');
    const docs = materials.filter(m => ['contract', 'template', 'process-doc', 'training'].includes(m.asset_type));

    // Reset grid styling for single views vs all grid
    if (_activeView === 'all') {
      workspace.className = 'console-grid';
      workspace.innerHTML = `
        <!-- Quadrant 1: Reports -->
        <div class="console-card">
          <div class="console-card-header">
            <span class="console-card-title">📊 Reports & Plans (${reports.length})</span>
          </div>
          <div class="console-card-body">
            ${reports.length ? reports.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-title">No reports</div></div>'}
          </div>
        </div>

        <!-- Quadrant 2: Creatives -->
        <div class="console-card">
          <div class="console-card-header">
            <span class="console-card-title">🎨 Visual Creatives (${creatives.length})</span>
          </div>
          <div class="console-card-body">
            ${creatives.length ? creatives.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-title">No creatives</div></div>'}
          </div>
        </div>

        <!-- Quadrant 3: Success Cases -->
        <div class="console-card">
          <div class="console-card-header">
            <span class="console-card-title">🏆 Case Studies (${cases.length})</span>
          </div>
          <div class="console-card-body">
            ${cases.length ? cases.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-title">No cases</div></div>'}
          </div>
        </div>

        <!-- Quadrant 4: Docs -->
        <div class="console-card">
          <div class="console-card-header">
            <span class="console-card-title">📁 Internal Docs & NDAs (${docs.length})</span>
          </div>
          <div class="console-card-body">
            ${docs.length ? docs.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state" style="padding:20px"><div class="empty-title">No documentation</div></div>'}
          </div>
        </div>
      `;
    } else {
      workspace.className = '';
      let targetList = [];
      let icon = '';
      let title = '';

      if (_activeView === 'reports') { targetList = reports; title = 'Reports & Plans'; icon = '📊'; }
      if (_activeView === 'creatives') { targetList = creatives; title = 'Visual Creatives'; icon = '🎨'; }
      if (_activeView === 'cases') { targetList = cases; title = 'Success Case Studies'; icon = '🏆'; }
      if (_activeView === 'docs') { targetList = docs; title = 'Internal Docs & NDAs'; icon = '📁'; }

      workspace.innerHTML = `
        <div class="console-card" style="height:auto;min-height:400px">
          <div class="console-card-header">
            <span class="console-card-title">${icon} ${title} (${targetList.length})</span>
          </div>
          <div class="console-card-body" style="padding:16px">
            ${targetList.length ? targetList.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state"><div class="empty-title">No assets found matching filters.</div></div>'}
          </div>
        </div>
      `;
    }
  }

  return { render, updateShareStatus };
})();

window.PAGE_CONSOLE = PAGE_CONSOLE;
