/** PAGE: Dashboard (merged with Call Console) */
'use strict';

const PAGE_DASHBOARD = (() => {

  let _vertical = 'all';
  let _service = 'all';
  let _query = '';
  let _activeView = 'all'; // 'all', 'reports', 'creatives', 'cases', 'refs', 'docs'

  function render(container) {
    const stats = STORE.getStats();

    const extractTime = (item) => {
      if (item.updated_at) return new Date(item.updated_at).getTime();
      if (item.created_at) return new Date(item.created_at).getTime();
      if (item.id) {
        const match = String(item.id).match(/\d{10,13}/);
        if (match) return parseInt(match[0], 10);
      }
      return 0;
    };

    // Exclude internal-only from the dashboard overview for a cleaner sales view
    let allClientSafe = STORE.getMaterials().filter(m => m.visibility_status === 'client-safe');
    allClientSafe.sort((a, b) => extractTime(b) - extractTime(a));
    
    let allRefs = STORE.getClientRefs().slice();
    allRefs.sort((a, b) => extractTime(b) - extractTime(a));

    // 5 Materials (excluding creatives)
    const recentMaterials = allClientSafe.filter(m => !['creative', 'video', 'image'].includes(m.asset_type)).slice(0, 5);
    
    // 5 Client References
    const recentRefs = allRefs.slice(0, 5);
    
    // 5 Creatives
    const recentCreatives = allClientSafe.filter(m => ['creative', 'video', 'image'].includes(m.asset_type)).slice(0, 5);

    container.innerHTML = `
      <div class="page-header" style="margin-bottom: 24px;">
        <div class="page-header-row" style="align-items: center;">
          <div>
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); margin-top:0; margin-bottom:0;">Client Dashboard</div>
          </div>
          <button class="btn btn-primary" onclick="checkSuperAdminAction(() => ROUTER.navigate('admin'))">
            ${ICONS.plus} Content Center
          </button>
        </div>
      </div>

      <!-- KPI Stats -->
      <div class="dashboard-grid" style="margin-bottom: 24px; grid-template-columns: repeat(3, 1fr); gap: 14px;">
        ${statCard('68 SUCCESS CASES', stats.totalCases, 'Seeded Case Studies', 'rgba(57,144,224,0.12)', `<div style="color:var(--accent); width:28px; height:28px;">${ICONS.cases}</div>`)}
        ${statCard('18 VISUAL CREATIVES', stats.totalCreatives, 'Gallery Media Assets', 'rgba(130,80,224,0.12)', `<div style="color:var(--accent); width:28px; height:28px;">${ICONS.creatives}</div>`)}
        ${statCard('12 CLIENT REFERENCES', stats.totalRefs, 'Live Showcase Sites', 'rgba(224,164,57,0.12)', `<div style="color:var(--accent); width:28px; height:28px;">${ICONS.refs}</div>`)}
      </div>

      <!-- Recent Materials, References & Creatives Columns -->
      <div class="dashboard-recent" style="margin-bottom: 32px;">
        <!-- Call Prep Library Column -->
        <div class="dashboard-panel">
          <div class="dashboard-panel-header">
            <span class="dashboard-panel-title" style="font-size: 13px; font-weight: 700; color: var(--accent); display:flex; align-items:center; gap:6px;">
              <span style="display:inline-block; width:13px; height:13px; color:var(--accent);">${ICONS.star}</span> Call Prep Library
            </span>
            ${window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.size ? `
              <button class="btn btn-sm btn-ghost" onclick="clearCallPrep(); ROUTER.render();" style="color: var(--danger);">Clear</button>
            ` : ''}
          </div>
          <div class="dashboard-panel-body">
            ${(() => {
              // 24 Hour expiration check & render
              const now = Date.now();
              const expireMs = 24 * 60 * 60 * 1000;
              window._callPrepTimestamps = window._callPrepTimestamps || {};
              
              // Load from storage if available
              try {
                const storedTimestamps = localStorage.getItem('np_call_prep_timestamps');
                if (storedTimestamps) {
                  window._callPrepTimestamps = { ...JSON.parse(storedTimestamps), ...window._callPrepTimestamps };
                }
              } catch(e){}

              // Initialize timestamps for items that don't have one
              let modifiedTimestamps = false;
              if (window.CALL_PREP_BASKET) {
                Array.from(window.CALL_PREP_BASKET).forEach(id => {
                  if (!window._callPrepTimestamps[id]) {
                    window._callPrepTimestamps[id] = now;
                    modifiedTimestamps = true;
                  }
                });

                // Check and evict items older than 24 hours
                Array.from(window.CALL_PREP_BASKET).forEach(id => {
                  const addedTime = window._callPrepTimestamps[id];
                  if (addedTime && (now - addedTime > expireMs)) {
                    window.CALL_PREP_BASKET.delete(id);
                    delete window._callPrepTimestamps[id];
                    modifiedTimestamps = true;
                  }
                });
              }

              if (modifiedTimestamps) {
                try {
                  localStorage.setItem('np_call_prep_timestamps', JSON.stringify(window._callPrepTimestamps));
                  localStorage.setItem('np_call_prep_basket', JSON.stringify(Array.from(window.CALL_PREP_BASKET)));
                } catch(e){}
              }

              const prepIds = window.CALL_PREP_BASKET ? Array.from(window.CALL_PREP_BASKET) : [];
              const prepItems = prepIds.map(id => STORE.getById(id)).filter(Boolean);

              if (!prepItems.length) {
                return '<div class="empty-state" style="padding:16px"><div class="empty-title" style="font-size: 11px;">Star items in reports, cases, or client pages to stage them here.</div></div>';
              }

              return prepItems.map(m => {
                const isClientRef = m.website_url && !m.asset_type;
                const isImage = ['image', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(m.file_type) || ['creative', 'image'].includes(m.asset_type);
                const isVideo = ['video', 'mp4', 'mov', 'avi', 'webm'].includes(m.file_type) || m.asset_type === 'video';
                
                let previewEl = '';
                if (isClientRef) {
                  previewEl = `<div style="color:var(--accent);width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${ICONS.refs}</div>`;
                } else if (isVideo && m.file_url) {
                  previewEl = `<video src="${m.file_url}" style="width:32px; height:32px; object-fit:cover; border-radius:var(--r-sm); background:#000; flex-shrink:0;" muted playsinline></video>`;
                } else if (isImage && (m.thumbnail_url || m.file_url)) {
                  previewEl = `<img src="${m.thumbnail_url || m.file_url}" style="width:32px; height:32px; object-fit:cover; border-radius:var(--r-sm); flex-shrink:0;">`;
                } else {
                  previewEl = `<div style="color:var(--text-secondary);flex-shrink:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-radius:var(--r-sm);">${getFileIcon(m.file_type)}</div>`;
                }

                const clickAction = isClientRef 
                  ? `ROUTER.navigate('clientrefs','${encodeURIComponent(m.client_name)}')`
                  : `openMaterial(STORE.getMaterialById('${m.id}'))`;

                return `
                  <div class="dashboard-item animate-fade" onclick="${clickAction}" style="gap:12px; align-items:center; position:relative; transition: all 0.2s ease;">
                    ${previewEl}
                    <div class="dashboard-item-text" style="flex:1; min-width:0;">
                      <div class="dashboard-item-title" style="font-size:13px; font-weight:600;">${truncate(m.title || m.client_name, 26)}</div>
                      <div class="dashboard-item-sub" style="font-size:10px; color:var(--text-tertiary);">${isClientRef ? 'Client Reference' : assetTypeLabel(m.asset_type)} · ${m.geo || 'Global'}</div>
                    </div>
                    <button class="btn btn-ghost" onclick="event.stopPropagation(); const row = this.closest('.dashboard-item'); row.style.opacity = '0'; row.style.transform = 'scale(0.95)'; setTimeout(() => { toggleCallPrepItem('${m.id}'); ROUTER.render(); }, 200);" style="padding:4px; margin-left:auto; display:flex; align-items:center; justify-content:center; color:var(--accent);" title="Remove from Favorites">
                      ${ICONS.star}
                    </button>
                  </div>
                `;
              }).join('');
            })()}
          </div>
        </div>

        <!-- Materials Column -->
        <div class="dashboard-panel">
          <div class="dashboard-panel-header">
            <span class="dashboard-panel-title" style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Latest Materials</span>
            <button class="btn btn-sm btn-ghost" onclick="ROUTER.navigate('reports')">View All ${ICONS.external}</button>
          </div>
          <div class="dashboard-panel-body">
            ${recentMaterials.length ? recentMaterials.map(m => {
              const isImage = ['image', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(m.file_type) || ['creative', 'image'].includes(m.asset_type);
              const isVideo = ['video', 'mp4', 'mov', 'avi', 'webm'].includes(m.file_type) || m.asset_type === 'video';
              
              let previewEl = `<div style="color:var(--text-secondary);flex-shrink:0;width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:var(--bg-3);border-radius:var(--r-sm);">${getFileIcon(m.file_type)}</div>`;
              if (isVideo && m.file_url) {
                previewEl = `<video src="${m.file_url}" style="width:32px; height:32px; object-fit:cover; border-radius:var(--r-sm); background:#000; flex-shrink:0;" muted playsinline></video>`;
              } else if (isImage && (m.thumbnail_url || m.file_url)) {
                previewEl = `<img src="${m.thumbnail_url || m.file_url}" style="width:32px; height:32px; object-fit:cover; border-radius:var(--r-sm); flex-shrink:0;">`;
              }
              const displayClient = m.client_name && m.client_name !== 'Internal' && m.client_name !== m.title ? m.client_name : '';

              return `
                <div class="dashboard-item" onclick="openMaterial(STORE.getMaterialById('${m.id}'))" style="gap:12px; align-items:center;">
                  ${previewEl}
                  <div class="dashboard-item-text">
                    <div class="dashboard-item-title" style="font-size:13px; font-weight:600;">${truncate(m.title, 34)}</div>
                    <div class="dashboard-item-sub" style="font-size:11px;">${displayClient ? displayClient + ' · ' : ''}Asset: ${assetTypeLabel(m.asset_type)} · Region: ${m.geo || 'Global'}</div>
                  </div>
                  <span class="tag ${getVerticalClass(m.vertical)}" style="flex-shrink:0">${m.vertical}</span>
                </div>
              `;
            }).join('') : '<div class="empty-state" style="padding:16px"><div class="empty-title">No client-safe materials</div></div>'}
          </div>
        </div>

        <!-- Client References Column -->
        <div class="dashboard-panel">
          <div class="dashboard-panel-header">
            <span class="dashboard-panel-title" style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Latest Client References</span>
            <button class="btn btn-sm btn-ghost" onclick="ROUTER.navigate('clientrefs')">View All ${ICONS.external}</button>
          </div>
          <div class="dashboard-panel-body">
            ${recentRefs.length ? recentRefs.map(r => {
              const urlClean = r.website_url.replace('https://','').replace('http://','').replace('www.','').split('/')[0];
              return `
                <div class="dashboard-item" onclick="ROUTER.navigate('clientrefs','${encodeURIComponent(r.client_name)}')" style="gap:12px; align-items:center;">
                  <div class="dashboard-item-icon" style="color:var(--accent);width:32px;height:32px;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    ${ICONS.refs}
                  </div>
                  <div class="dashboard-item-text">
                    <div class="dashboard-item-title" style="font-size:13px; font-weight:600;">${r.client_name}</div>
                    <div class="dashboard-item-sub" style="font-size:11px;">Region: ${r.geo || 'Global'} · URL: ${urlClean}</div>
                  </div>
                  <span class="tag ${getVerticalClass(r.vertical)}" style="flex-shrink:0">${r.vertical}</span>
                </div>
              `;
            }).join('') : '<div class="empty-state" style="padding:16px"><div class="empty-title">No client references</div></div>'}
          </div>
        </div>

        <!-- Creatives Column -->
        <div class="dashboard-panel">
          <div class="dashboard-panel-header">
            <span class="dashboard-panel-title" style="font-size: 15px; font-weight: 700; color: var(--text-primary);">Latest Creatives</span>
            <button class="btn btn-sm btn-ghost" onclick="ROUTER.navigate('creatives')">View All ${ICONS.external}</button>
          </div>
          <div class="dashboard-panel-body">
            ${recentCreatives.length ? recentCreatives.map(m => {
              const isVideo = m.file_type === 'video' || m.asset_type === 'video';
              let previewEl = '';
              if (isVideo && m.file_url) {
                previewEl = `<video src="${m.file_url}" style="width:32px; height:32px; object-fit:cover; border-radius:var(--r-sm); background:#000; flex-shrink:0;" muted playsinline></video>`;
              } else if (m.thumbnail_url || m.file_url) {
                previewEl = `<img src="${m.thumbnail_url || m.file_url}" style="width:32px; height:32px; object-fit:cover; border-radius:var(--r-sm); flex-shrink:0;">`;
              }
              const displayClient = m.client_name && m.client_name !== 'Internal' && m.client_name !== m.title ? m.client_name : '';

              return `
                <div class="dashboard-item" onclick="openMaterial(STORE.getMaterialById('${m.id}'))" style="gap:12px; align-items:center;">
                  ${previewEl}
                  <div class="dashboard-item-text">
                    <div class="dashboard-item-title" style="font-size:13px; font-weight:600;">${truncate(m.title, 34)}</div>
                    <div class="dashboard-item-sub" style="font-size:11px;">${displayClient ? displayClient + ' · ' : ''}Format: ${m.file_type.toUpperCase()}</div>
                  </div>
                  <span class="tag ${getVerticalClass(m.vertical)}" style="flex-shrink:0">${m.vertical}</span>
                </div>
              `;
            }).join('') : '<div class="empty-state" style="padding:16px"><div class="empty-title">No client-safe creatives</div></div>'}
          </div>
        </div>
      </div>

      <!-- ── CALL CONSOLE WORKSPACE AREA ── -->
      <div class="creative-gallery-area" style="background: transparent; border: none; padding: 0; box-shadow: none; margin-top: 32px;">
        <div class="creative-gallery-eyebrow" style="font-size: 15px; font-weight: 700; color: var(--text-primary); text-transform: none; font-family: var(--font-ui); letter-spacing: normal; margin-bottom: 16px;">Workspace</div>

        <!-- Interactive Control Bar -->
        <div style="display:flex;gap:12px;align-items:center;flex-wrap:wrap;margin-bottom: 20px;">
          <div class="search-bar" style="flex:1;min-width:240px">
            ${ICONS.search}
            <input id="db-console-search" type="text" placeholder="Filter call assets by client, title, tag..." value="${_query}" autocomplete="off">
          </div>

          <select class="select" id="db-console-vertical" style="width:160px">
            <option value="all">All Verticals</option>
            ${window.PORTAL_DATA.VERTICALS.map(v => `<option value="${v}" ${_vertical === v ? 'selected':''}>${v}</option>`).join('')}
          </select>

          <select class="select" id="db-console-service" style="width:160px">
            <option value="all">All Services</option>
            ${window.PORTAL_DATA.SERVICES.map(s => `<option value="${s}" ${_service === s ? 'selected':''}>${s}</option>`).join('')}
          </select>
        </div>

        <!-- Layout Selector Tabs -->
        <div class="tabs" style="margin-bottom:20px; border-bottom:1px solid var(--border-subtle)">
          <div class="tab ${_activeView === 'all' ? 'active' : ''}" data-view="all">All Layout</div>
          <div class="tab ${_activeView === 'reports' ? 'active' : ''}" data-view="reports"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle; display:inline-block;"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>Client Files</div>
          <div class="tab ${_activeView === 'refs' ? 'active' : ''}" data-view="refs"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0c97a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle; display:inline-block;"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>Client References</div>
          <div class="tab ${_activeView === 'creatives' ? 'active' : ''}" data-view="creatives"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3de892" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle; display:inline-block;"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1.2" fill="currentColor"></circle></svg>Visuals and Creatives</div>
          <div class="tab ${_activeView === 'cases' ? 'active' : ''}" data-view="cases"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ff7f50" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle; display:inline-block;"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a4 4 0 0 0-4 4v5c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V6a4 4 0 0 0-4-4Z"></path></svg>Case Studies</div>
        </div>

        <div id="db-console-workspace"></div>
      </div>
    `;

    // Hook listeners
    container.querySelector('#db-console-search').addEventListener('input', e => {
      _query = e.target.value;
      renderConsoleWorkspace(container);
    });

    container.querySelector('#db-console-vertical').addEventListener('change', e => {
      _vertical = e.target.value;
      renderConsoleWorkspace(container);
    });

    container.querySelector('#db-console-service').addEventListener('change', e => {
      _service = e.target.value;
      renderConsoleWorkspace(container);
    });

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _activeView = tab.dataset.view;
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.view === _activeView));
        renderConsoleWorkspace(container);
      });
    });

    renderConsoleWorkspace(container);
  }

  function statCard(label, value, sub, bg, icon) {
    const textLabel = label.replace(/^\d+\s+/, ''); // Extract e.g. "TOTAL MATERIALS"
    return `
      <div class="stat-card">
        <div class="stat-icon">${icon}</div>
        <div class="stat-info" style="display:flex; flex-direction:column; gap:2px;">
          <div class="stat-card-title">${value} ${textLabel}</div>
          <div class="stat-sub" style="margin-top:0">${sub}</div>
        </div>
      </div>`;
  }

  function renderConsoleWorkspace(container) {
    const workspace = container.querySelector('#db-console-workspace');
    if (!workspace) return;

    // Filter store materials
    let materials = STORE.getMaterials();
    let refs = STORE.getClientRefs();

    // 1. Filter by vertical
    if (_vertical !== 'all') {
      materials = materials.filter(m => {
        if (m.verticals && Array.isArray(m.verticals)) {
          return m.verticals.includes(_vertical);
        }
        return m.vertical === _vertical;
      });
      refs = refs.filter(r => r.vertical === _vertical);
    }

    // 2. Filter by service
    if (_service !== 'all') {
      materials = materials.filter(m => m.services_provided && m.services_provided.includes(_service));
      refs = refs.filter(r => r.services_provided && r.services_provided.includes(_service));
    }

    // 3. Filter by query
    if (_query.trim()) {
      const q = _query.toLowerCase();
      materials = materials.filter(m =>
        [m.title, m.description, m.client_name, m.vertical, ...(m.tags || [])].join(' ').toLowerCase().includes(q)
      );
      refs = refs.filter(r =>
        [r.client_name, r.ai_summary, r.vertical, ...(r.services_provided || [])].join(' ').toLowerCase().includes(q)
      );
    }

    const extractTime = (item) => {
      if (item.updated_at) return new Date(item.updated_at).getTime();
      if (item.created_at) return new Date(item.created_at).getTime();
      if (item.id) {
        const match = String(item.id).match(/\d{10,13}/);
        if (match) return parseInt(match[0], 10);
      }
      return 0;
    };
    materials.sort((a, b) => extractTime(b) - extractTime(a));
    refs.sort((a, b) => extractTime(b) - extractTime(a));

    // Separate groups
    // 1. Client Files: anything not case/creative/video/image
    const reports = materials.filter(m => !['case', 'creative', 'video', 'image'].includes(m.asset_type));
    // 2. Creatives: video, image, creative asset
    const creatives = materials.filter(m => ['creative', 'video', 'image'].includes(m.asset_type));
    // 3. Success Cases Only: case studies
    const cases = materials.filter(m => m.asset_type === 'case');

    // Keep track of collapsed states
    window._collapsedConsoleSections = window._collapsedConsoleSections || {
      reports: true,
      cases: true,
      refs: true,
      creatives: true
    };

    window.toggleConsoleSection = function(sectionKey) {
      window._collapsedConsoleSections[sectionKey] = !window._collapsedConsoleSections[sectionKey];
      const container = document.getElementById('page-container');
      if (container) renderConsoleWorkspace(container);
    };

    if (_activeView === 'all') {
      const isReportsCollapsed = window._collapsedConsoleSections.reports;
      const isCasesCollapsed = window._collapsedConsoleSections.cases;
      const isRefsCollapsed = window._collapsedConsoleSections.refs;
      const isCreativesCollapsed = window._collapsedConsoleSections.creatives;

      workspace.innerHTML = `
        <div class="console-grid">
          <!-- Client Files -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div onclick="window.toggleConsoleSection('reports')" style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>
                Client Files (${reports.length})
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center;">
                ${isReportsCollapsed ? 'Expand ▾' : 'Collapse ▴'}
              </span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${isReportsCollapsed ? '' : (reports.length ? reports.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state" style="padding:16px"><div class="empty-title">No client files found</div></div>')}
            </div>
          </div>

          <!-- Client References -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div onclick="window.toggleConsoleSection('refs')" style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0c97a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
                Client References (${refs.length})
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center;">
                ${isRefsCollapsed ? 'Expand ▾' : 'Collapse ▴'}
              </span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${isRefsCollapsed ? '' : (refs.length ? refs.map(r => renderRefConsoleRow(r)).join('') : '<div class="empty-state" style="padding:16px"><div class="empty-title">No references found</div></div>')}
            </div>
          </div>

          <!-- Case Studies -->
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div onclick="window.toggleConsoleSection('cases')" style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; justify-content: space-between; cursor: pointer; user-select: none;">
              <span style="display: flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7f50" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a4 4 0 0 0-4 4v5c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V6a4 4 0 0 0-4-4Z"></path></svg>
                Case Studies (${cases.length})
              </span>
              <span style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center;">
                ${isCasesCollapsed ? 'Expand ▾' : 'Collapse ▴'}
              </span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px;">
              ${isCasesCollapsed ? '' : (cases.length ? cases.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state" style="padding:16px"><div class="empty-title">No cases found</div></div>')}
            </div>
          </div>
        </div>

        <!-- Creatives Row at bottom of All View -->
        <div style="margin-top: 24px;">
          <div onclick="window.toggleConsoleSection('creatives')" class="creative-row-title" style="cursor: pointer; user-select: none; display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <span style="display: flex; align-items: center; gap: 6px;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#3de892" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle; display:inline-block;"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1.2" fill="currentColor"></circle></svg>
              Visuals and Creatives (${creatives.length})
            </span>
            <span style="font-size: 11px; color: var(--text-tertiary); display: flex; align-items: center;">
              ${isCreativesCollapsed ? 'Expand ▾' : 'Collapse ▴'}
            </span>
          </div>
          ${isCreativesCollapsed ? '' : renderCreativesGallery(creatives)}
        </div>
      `;
    } else {
      let content = '';
      if (_activeView === 'reports') {
        content = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>Client Files (${reports.length})</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">${reports.length ? reports.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state"><div class="empty-title">No client files matching filters</div></div>'}</div>
          </div>`;
      } else if (_activeView === 'cases') {
        content = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ff7f50" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"></path><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"></path><path d="M4 22h16"></path><path d="M10 14.66V17c0 .55-.45 1-1 1H4v2h16v-2h-5c-.55 0-1-.45-1-1v-2.34"></path><path d="M12 2a4 4 0 0 0-4 4v5c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V6a4 4 0 0 0-4-4Z"></path></svg>Case Studies (${cases.length})</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">${cases.length ? cases.map(m => renderMaterialRow(m)).join('') : '<div class="empty-state"><div class="empty-title">No case studies matching filters</div></div>'}</div>
          </div>`;
      } else if (_activeView === 'refs') {
        content = `
          <div style="display: flex; flex-direction: column; gap: 8px;">
            <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); margin-bottom: 4px; display: flex; align-items: center; gap: 6px;"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f0c97a" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>Client References (${refs.length})</div>
            <div style="display: flex; flex-direction: column; gap: 8px;">${refs.length ? refs.map(r => renderRefConsoleRow(r)).join('') : '<div class="empty-state"><div class="empty-title">No references matching filters</div></div>'}</div>
          </div>`;
      } else if (_activeView === 'creatives') {
        content = `
          <div>
            <div class="creative-row-title"><span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#3de892" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:6px; vertical-align:middle; display:inline-block;"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z"></path><circle cx="7.5" cy="10.5" r="1.2" fill="currentColor"></circle><circle cx="11.5" cy="7.5" r="1.2" fill="currentColor"></circle></svg>Visuals and Creatives (${creatives.length})</span></div>
            ${renderCreativesGallery(creatives)}
          </div>`;
      }
      workspace.innerHTML = content;
    }

    // Attach play/pause JS logic for video element hover states inside creatives
    workspace.querySelectorAll('.creative-card-item video').forEach(v => {
      v.addEventListener('mouseenter', () => {
        v.play().catch(err => console.log('Video autoplay blocked or interrupted:', err));
      });
      v.addEventListener('mouseleave', () => {
        v.pause();
        v.currentTime = 0;
      });
    });
  }

  function renderRefConsoleRow(ref) {
    const profile = STORE.getProfileForClient(ref.client_name);
    return `
      <div class="material-row animate-fade" onclick="ROUTER.navigate('clientrefs','${encodeURIComponent(ref.client_name)}')">
        <div class="material-row-icon">${ICONS.profiles}</div>
        <div class="material-row-info">
          <div class="material-row-title">${ref.client_name}</div>
          <div class="material-row-sub">${ref.vertical} · ${ref.geo} · ${ref.ai_summary}</div>
        </div>
        <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
          <span class="tag tag-safe" onclick="event.stopPropagation(); window.open('${ref.website_url}','_blank')">${ICONS.shield} Live Site</span>
          ${profile ? `
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();ROUTER.navigate('clientrefs','${encodeURIComponent(ref.client_name)}')" title="View profile">
              ${ICONS.profiles}
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }

  function renderCreativesGallery(items) {
    if (!items.length) {
      return `
        <div class="empty-state" style="padding: 24px; background: #111116; border-radius: 12px; border: 1px dashed var(--border-default)">
          <div class="empty-title">No creative assets found</div>
        </div>`;
    }

    const rows = [];
    const chunkSize = 8;
    for (let i = 0; i < items.length; i += chunkSize) {
      rows.push(items.slice(i, i + chunkSize));
    }

    return rows.map((chunk, rowIdx) => `
      <div class="creative-row-wrapper">
        <div class="creative-cards-row">
          ${chunk.map(mat => {
            const isVideo = mat.file_type === 'video';
            const isChecked = window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.has(mat.id);
            const badgeType = isVideo ? 'MP4' : 'PNG';

            return `
              <div class="creative-card-item animate-fade" onclick="openMaterial(STORE.getMaterialById('${mat.id}'))">
                <!-- Checkbox overlay -->
                <div class="creative-card-checkbox ${isChecked ? 'checked' : ''}" onclick="event.stopPropagation()">
                  <label class="item-select-wrap">
                    <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
                    <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
                  </label>
                </div>
                
                <!-- Media -->
                ${isVideo 
                  ? `<div class="static-video-wrapper" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: #000;">
                       <video class="creative-card-media" src="${mat.file_url}" muted playsinline preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover;"></video>
                       <div class="video-play-button">
                         <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                       </div>
                     </div>`
                  : `<img class="creative-card-media" src="${mat.thumbnail_url || mat.file_url}" alt="${mat.title}" loading="lazy">`
                }
                
                <!-- Vignette & Overlays -->
                <div class="creative-card-vignette"></div>
                <div class="creative-card-overlay"></div>
                
                <!-- Badge -->
                <div class="creative-card-badge">${badgeType}</div>
                
                <!-- Info -->
                <div class="creative-card-info">
                  <div class="creative-card-title">${mat.title}</div>
                  <div class="creative-card-client">${mat.client_name} · ${mat.vertical}</div>
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `).join('');
  }

  return { render };
})();

window.PAGE_DASHBOARD = PAGE_DASHBOARD;
