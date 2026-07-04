/** PAGE: Admin */
'use strict';

const PAGE_ADMIN = (() => {

  let _tab = 'materials';
  let _editId = null;
  let _editRefId = null;
  let _editProfileId = null;
  let _isUnlocked = false;

  // Search & Sort state for Materials list
  let _materialsQuery = '';
  let _materialsSort = 'newest';

  // Search & Sort state for Client References list
  let _refsQuery = '';
  let _refsSort = 'az';

  // Ingestion temp state inside Admin for Client Ref
  let _adminFetchedData = null;
  let _adminIsFetching = false;

  function render(container, targetTab = null) {
    if (targetTab) {
      _tab = targetTab;
    }
    if (!AUTH.canAccessAdmin()) {
      container.innerHTML = `
        <div style="max-width:400px;margin:80px auto 0">
          <div class="card" style="padding:32px;text-align:center">
            <div style="width:48px;height:48px;background:var(--danger-dim);border-radius:var(--r-xl);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:var(--danger)">${ICONS.lock}</div>
            <div class="page-title" style="font-size:18px;margin-bottom:8px">Access Restricted</div>
            <p class="page-subtitle" style="font-size:12px;margin-bottom:20px">The Admin panel is only available to Super Admin accounts. Your current role is <strong>View Only</strong>.</p>
            <button class="btn btn-secondary" style="margin:0 auto" onclick="ROUTER.navigate('dashboard')">← Back to Dashboard</button>
          </div>
        </div>`;
      return;
    }

    _isUnlocked = AUTH.isAdminUnlocked();

    if (!_isUnlocked) {
      renderLock(container);
      return;
    }

    renderAdmin(container);
  }

  function renderLock(container) {
    container.innerHTML = `
      <div style="max-width:400px;margin:80px auto 0">
        <div class="card" style="padding:32px">
          <div style="text-align:center;margin-bottom:24px">
            <div style="width:48px;height:48px;background:var(--accent-dim);border-radius:var(--r-xl);display:flex;align-items:center;justify-content:center;margin:0 auto 12px;color:var(--accent)">${ICONS.lock}</div>
            <div class="page-title" style="font-size:18px">Admin Access</div>
            <p class="page-subtitle" style="margin-top:6px;font-size:12px">Re-enter your password to access the Admin panel.</p>
          </div>
          <div class="input-group" style="margin-bottom:16px">
            <label class="input-label">Password</label>
            <input type="password" id="admin-unlock-pwd" class="input" placeholder="Enter password…" autocomplete="current-password">
          </div>
          <div id="admin-unlock-error" class="login-error"></div>
          <button class="btn btn-primary w-full" style="justify-content:center;margin-top:12px" id="admin-unlock-btn">
            ${ICONS.shield} Unlock Admin
          </button>
        </div>
      </div>`;

    const input = container.querySelector('#admin-unlock-pwd');
    const btn = container.querySelector('#admin-unlock-btn');
    const err = container.querySelector('#admin-unlock-error');

    const attempt = () => {
      if (AUTH.unlockAdmin(input.value)) {
        _isUnlocked = true;
        renderAdmin(container);
      } else {
        err.style.display = 'block';
        err.textContent = 'Incorrect password.';
        input.value = '';
        input.focus();
      }
    };

    btn.addEventListener('click', attempt);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') attempt(); });
    input.focus();
  }

  function renderAdmin(container) {
    const stats = STORE.getStats();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Manage portal content: Materials, Success Stories, and Client References.</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center">
            <span class="tag tag-danger">${ICONS.lock} Internal Console</span>
          </div>
        </div>
      </div>

      <!-- Tab switcher -->
      <div class="admin-tabs">
        <div class="admin-tab ${_tab === 'materials' ? 'active' : ''}" data-tab="materials">
          Materials <span class="count-pill" style="margin-left:4px">${stats.totalMaterials}</span>
        </div>
        <div class="admin-tab ${_tab === 'refs' ? 'active' : ''}" data-tab="refs">
          Client References <span class="count-pill" style="margin-left:4px">${stats.totalRefs}</span>
        </div>
        <div class="admin-tab ${_tab === 'team' ? 'active' : ''}" data-tab="team">
          Team Settings
        </div>
        <div class="admin-tab ${_tab === 'bin' ? 'active' : ''}" data-tab="bin">
          Recycle Bin
        </div>
      </div>

      <!-- Tab content -->
      <div id="admin-tab-content"></div>
    `;

    container.querySelectorAll('.admin-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _tab = tab.dataset.tab;
        _editId = null;
        _editRefId = null;
        _editProfileId = null;
        _adminFetchedData = null;
        container.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === _tab));
        renderTabContent(container);
      });
    });

    renderTabContent(container);
  }

  function renderTabContent(container) {
    const wrap = container.querySelector('#admin-tab-content');
    if (_tab === 'materials') renderMaterialsTab(wrap);
    else if (_tab === 'refs') renderRefsTab(wrap);
    else if (_tab === 'team') renderTeamTab(wrap);
    else if (_tab === 'bin') renderRecycleBinTab(wrap);
  }

  // ── Materials tab ──
  function renderMaterialsTab(wrap) {
    let items = STORE.getMaterials();

    // Filter
    if (_materialsQuery.trim()) {
      const q = _materialsQuery.toLowerCase();
      items = items.filter(m => 
        m.title.toLowerCase().includes(q) || 
        m.client_name.toLowerCase().includes(q)
      );
    }

    // Sort by date added (created_at) or alphabetically
    if (_materialsSort === 'newest') {
      items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (_materialsSort === 'oldest') {
      items.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    } else if (_materialsSort === 'az') {
      items.sort((a, b) => a.title.localeCompare(b.title));
    }

    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 420px;gap:24px;align-items:start">
        <div>
          <div class="section-header" style="margin-bottom:12px">
            <span class="section-title">All Seeded & User Materials</span>
            <span class="section-count">${items.length}</span>
          </div>

          <!-- Search & Sort Controls -->
          <div style="display:flex; gap:10px; margin-bottom:16px; align-items:center;">
            <div class="search-bar" style="flex:1; min-height:36px; padding:0 10px;">
              ${ICONS.search}
              <input id="admin-materials-search" type="text" placeholder="Search by name or client…" value="${_materialsQuery}" style="font-size:12px" autocomplete="off">
            </div>
            <select class="select" id="admin-materials-sort" style="width:160px; height:34px; font-size:12px;">
              <option value="newest" ${_materialsSort === 'newest' ? 'selected' : ''}>Date Added (Newest)</option>
              <option value="oldest" ${_materialsSort === 'oldest' ? 'selected' : ''}>Date Added (Oldest)</option>
              <option value="az" ${_materialsSort === 'az' ? 'selected' : ''}>Name (A-Z)</option>
            </select>
          </div>

          <div class="admin-content-list">
            ${items.map(m => adminMaterialRow(m)).join('')}
          </div>
        </div>
        <div id="admin-form-wrap" style="position: sticky; top: 20px; align-self: start;">
          ${renderMaterialForm(_editId ? STORE.getMaterialById(_editId) : {})}
        </div>
      </div>`;

    bindMaterialForm(wrap);

    // Event listeners
    const searchInput = wrap.querySelector('#admin-materials-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        _materialsQuery = e.target.value;
        renderMaterialsTab(wrap);
      });
      // Keep focus at the end of the input text
      searchInput.focus();
      const val = searchInput.value;
      searchInput.value = '';
      searchInput.value = val;
    }

    const sortSelect = wrap.querySelector('#admin-materials-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        _materialsSort = e.target.value;
        renderMaterialsTab(wrap);
      });
    }
  }

  function adminMaterialRow(m) {
    const isImage = ['image', 'png', 'jpg', 'jpeg', 'gif', 'webp'].includes(m.file_type) || ['creative', 'image'].includes(m.asset_type);
    const isVideo = ['video', 'mp4', 'mov', 'avi', 'webm'].includes(m.file_type) || m.asset_type === 'video';
    
    let previewEl = `<div style="color:var(--text-secondary);flex-shrink:0;width:36px;height:36px;display:flex;align-items:center;justify-content:center;">${getFileIcon(m.file_type)}</div>`;
    if (isVideo && m.file_url) {
      previewEl = `<video src="${m.file_url}" style="width:36px; height:36px; object-fit:cover; border-radius:var(--r-sm); background:#000; flex-shrink:0;" muted playsinline></video>`;
    } else if (isImage && (m.thumbnail_url || m.file_url)) {
      previewEl = `<img src="${m.thumbnail_url || m.file_url}" style="width:36px; height:36px; object-fit:cover; border-radius:var(--r-sm); flex-shrink:0;">`;
    }

    return `
      <div class="admin-list-item">
        ${previewEl}
        <div class="admin-item-info">
          <div class="admin-item-title">${truncate(m.title, 48)}</div>
          <div class="admin-item-meta">${m.client_name} · ${m.vertical} · ${assetTypeLabel(m.asset_type)}</div>
        </div>
        ${visibilityTag(m.visibility_status)}
        <div class="admin-item-actions">
          <button class="btn btn-sm btn-ghost" onclick="PAGE_ADMIN._editMaterial('${m.id}')" title="Edit">${ICONS.edit}</button>
          <button class="btn btn-sm btn-danger" onclick="PAGE_ADMIN._deleteMaterial('${m.id}')" title="Delete">${ICONS.trash}</button>
        </div>
      </div>`;
  }

  function renderMaterialForm(data = {}) {
    const { VERTICALS, SERVICES, ASSET_TYPES } = window.PORTAL_DATA;
    return `
      <div class="admin-form">
        <div class="admin-form-title">${data.id ? '✏️ Edit Material' : '+ Create Material'}</div>
        
        <div class="form-grid" style="margin-bottom:8px">
          <div class="input-group span-2">
            <label class="input-label">Title *</label>
            <input class="input" id="mat-title" type="text" placeholder="Report, deck or case title" value="${data.title || ''}">
          </div>
          <div class="input-group">
            <label class="input-label">Client Name</label>
            <input class="input" id="mat-client" type="text" placeholder="e.g. HTX" value="${data.client_name || ''}">
          </div>
          <div class="input-group span-2">
            <label class="input-label" style="font-size:11px; margin-bottom: 4px;">Geo *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:6px;" id="mat-geos-checkboxes">
              ${window.PORTAL_DATA.GEOS.map(g => {
                const isChecked = (data.geos || []).includes(g) || (data.geo || 'Global') === g;
                return `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
                </label>
                `
              }).join('')}
            </div>
          </div>
        </div>

        <div class="form-grid" style="margin-bottom:8px">
          <div class="input-group span-2">
            <label class="input-label" style="font-size:11px; margin-bottom: 4px;">Verticals / Industries *</label>
            <div style="display:flex; flex-wrap:wrap; gap:6px; row-gap:8px;" id="mat-verticals-checkboxes">
              ${(() => {
                const matVerts = data.verticals || (data.vertical ? [data.vertical] : []);
                const sorted = [...VERTICALS].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                if (VERTICALS.includes('Other')) sorted.push('Other');
                return sorted.map(v => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${matVerts.includes(v) ? 'checked' : ''}> ${v}
                  </label>
                `).join('');
              })()}
            </div>
          </div>
          
          <div class="input-group">
            <label class="input-label">Asset Type</label>
            <select class="select" id="mat-type">
              <option value="">Select type</option>
              ${ASSET_TYPES.map(t => `<option value="${t}" ${data.asset_type === t ? 'selected':''}>${assetTypeLabel(t)}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Visibility</label>
            <select class="select" id="mat-vis">
              <option value="internal-only" ${data.visibility_status === 'internal-only' || !data.visibility_status ? 'selected':''}>Internal Only</option>
              <option value="client-safe" ${data.visibility_status === 'client-safe' ? 'selected':''}>Client Safe</option>
            </select>
          </div>
        </div>

        <div class="form-grid">
          <div class="input-group span-2">
            <label class="input-label">File URL / Link *</label>
            <input class="input" id="mat-url" type="url" placeholder="https://…" value="${data.file_url || ''}">
          </div>
          <div class="input-group span-2">
            <label class="input-label">Thumbnail URL</label>
            <input class="input" id="mat-thumb" type="url" placeholder="https://… (optional)" value="${data.thumbnail_url || ''}">
          </div>
          <div class="input-group span-2">
            <label class="input-label">Description</label>
            <textarea class="input" id="mat-desc" rows="2" placeholder="Short description…">${data.description || ''}</textarea>
          </div>
          
          <div class="input-group span-2" style="margin-top:2px">
            <label class="input-label" style="font-size:11px; margin-bottom:4px;">Services Provided *</label>
            <div style="display:flex; flex-wrap:wrap; gap:6px; row-gap:8px;" id="mat-services-checkboxes">
              ${[...SERVICES].sort().map(s => {
                const matServices = data.services_provided || [];
                return `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${matServices.includes(s) ? 'checked' : ''}> ${s}
                  </label>
                `;
              }).join('')}
            </div>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-top:20px">
          <button class="btn btn-primary btn-sm" id="mat-save-btn">${data.id ? 'Update Material' : 'Save Material'}</button>
          ${data.id ? `<button class="btn btn-ghost btn-sm" onclick="PAGE_ADMIN._cancelEdit()">Cancel</button>` : ''}
        </div>
        <div id="mat-form-error" class="login-error" style="margin-top:10px"></div>
      </div>`;
  }

  function bindMaterialForm(wrap) {
    const btn = wrap.querySelector('#mat-save-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const title = wrap.querySelector('#mat-title').value.trim();
      const url = wrap.querySelector('#mat-url').value.trim();
      const err = wrap.querySelector('#mat-form-error');

      if (!title || !url) {
        err.style.display = 'block';
        err.textContent = 'Title and File URL are required.';
        return;
      }

      err.style.display = 'none';

      // Gather from checklists
      const checkedVerts = wrap.querySelectorAll('#mat-verticals-checkboxes input[type="checkbox"]:checked');
      const parsedVerticals = Array.from(checkedVerts).map(cb => cb.value);
      const firstVertical = parsedVerticals[0] || 'Other';

      const checkedServices = wrap.querySelectorAll('#mat-services-checkboxes input[type="checkbox"]:checked');
      const services = Array.from(checkedServices).map(cb => cb.value);

      const assetType = wrap.querySelector('#mat-type').value || 'report';

      // Auto-detect file type
      let fileType = 'pdf';
      const urlLower = url.toLowerCase();
      if (urlLower.includes('docs.google.com/document') || urlLower.includes('drive.google.com/file')) {
        fileType = 'doc-link';
      } else if (urlLower.includes('docs.google.com/spreadsheets') || urlLower.includes('docs.google.com/sheet')) {
        fileType = 'spreadsheet-link';
      } else if (urlLower.match(/\.(mp4|mov|avi|webm)$/)) {
        fileType = 'video';
      } else if (urlLower.match(/\.(png|jpg|jpeg|gif|webp)$/)) {
        fileType = 'image';
      }

      // Auto-generate tags based on verticals, services, and asset type
      const autoTags = [...parsedVerticals, assetType, ...services];

      const checkedGeos = wrap.querySelectorAll('#mat-geos-checkboxes input[type="checkbox"]:checked');
      const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
      const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';

      const record = {
        title,
        client_name: wrap.querySelector('#mat-client').value.trim() || 'Internal',
        geo: geoStr,
        geos: parsedGeos,
        vertical: firstVertical,
        verticals: parsedVerticals.length ? parsedVerticals : [firstVertical],
        asset_type: assetType,
        visibility_status: wrap.querySelector('#mat-vis').value,
        file_type: fileType,
        file_url: url,
        thumbnail_url: wrap.querySelector('#mat-thumb').value.trim(),
        description: wrap.querySelector('#mat-desc').value.trim(),
        tags: autoTags,
        services_provided: services,
        related_assets: []
      };

      if (_editId) {
        record.id = _editId;
        STORE.updateMaterial(_editId, record);
        STORE.syncClientGeo(record.client_name, record.geo);
        showToast('Material updated');
        _editId = null;
      } else {
        STORE.addMaterial(record);
        STORE.syncClientGeo(record.client_name, record.geo);
        showToast('Material saved');
      }

      const container = document.querySelector('.page-content');
      if (container) renderAdmin(container);
    });
  }

  // ── Refs tab ──
  function renderRefsTab(wrap) {
    let items = STORE.getClientRefs();

    // Filter by search query
    if (_refsQuery.trim()) {
      const q = _refsQuery.toLowerCase();
      items = items.filter(r => 
        (r.client_name || '').toLowerCase().includes(q) || 
        (r.website_url || '').toLowerCase().includes(q) || 
        (r.vertical || '').toLowerCase().includes(q) || 
        (r.geo || '').toLowerCase().includes(q)
      );
    }

    // Sort by name or date added
    if (_refsSort === 'az') {
      items.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
    } else if (_refsSort === 'za') {
      items.sort((a, b) => (b.client_name || '').localeCompare(a.client_name || ''));
    } else if (_refsSort === 'newest') {
      items.sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
    } else if (_refsSort === 'oldest') {
      items.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0));
    }

    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 420px;gap:24px;align-items:start">
        <div>
          <div class="section-header" style="margin-bottom:12px">
            <span class="section-title">Client References</span>
            <span class="section-count">${items.length}</span>
          </div>

          <!-- Search & Sort Controls -->
          <div style="display:flex; gap:10px; margin-bottom:16px; align-items:center;">
            <div class="search-bar" style="flex:1; min-height:36px; padding:0 10px;">
              ${ICONS.search}
              <input id="admin-refs-search" type="text" placeholder="Search references by name, vertical, geo or website…" value="${_refsQuery}" style="font-size:12px" autocomplete="off">
            </div>
            <select class="select" id="admin-refs-sort" style="width:160px; height:34px; font-size:12px;">
              <option value="az" ${_refsSort === 'az' ? 'selected' : ''}>Name (A-Z)</option>
              <option value="za" ${_refsSort === 'za' ? 'selected' : ''}>Name (Z-A)</option>
              <option value="newest" ${_refsSort === 'newest' ? 'selected' : ''}>Date Added (Newest)</option>
              <option value="oldest" ${_refsSort === 'oldest' ? 'selected' : ''}>Date Added (Oldest)</option>
            </select>
          </div>

          <div class="admin-content-list">
            ${items.map(r => adminRefRow(r)).join('')}
          </div>
        </div>
        <div id="admin-ref-form-wrap" style="position: sticky; top: 20px; align-self: start;">
          ${renderRefForm(_editRefId ? STORE.getById(_editRefId) : {})}
        </div>
      </div>`;

    bindRefForm(wrap);

    // Event listeners
    const searchInput = wrap.querySelector('#admin-refs-search');
    if (searchInput) {
      searchInput.addEventListener('input', e => {
        _refsQuery = e.target.value;
        renderRefsTab(wrap);
      });
      searchInput.focus();
      const val = searchInput.value;
      searchInput.value = '';
      searchInput.value = val;
    }

    const sortSelect = wrap.querySelector('#admin-refs-sort');
    if (sortSelect) {
      sortSelect.addEventListener('change', e => {
        _refsSort = e.target.value;
        renderRefsTab(wrap);
      });
    }
  }

  function adminRefRow(r) {
    return `
      <div class="admin-list-item">
        <div style="width:32px;height:32px;border-radius:var(--r-sm);background:var(--bg-4);display:flex;align-items:center;justify-content:center;font-size:13px;flex-shrink:0">${getVerticalEmoji(r.vertical)}</div>
        <div class="admin-item-info">
          <div class="admin-item-title">${r.client_name}</div>
          <div class="admin-item-meta">${r.vertical} · ${r.geo} · ${r.website_url}</div>
        </div>
        <div class="admin-item-actions">
          <button class="btn btn-sm btn-ghost" onclick="PAGE_ADMIN._editRef('${r.id}')" title="Edit">${ICONS.edit}</button>
          <button class="btn btn-sm btn-danger" onclick="PAGE_ADMIN._deleteRef('${r.id}')" title="Delete">${ICONS.trash}</button>
        </div>
      </div>`;
  }

  function renderRefForm(data = {}) {
    const { VERTICALS } = window.PORTAL_DATA;

    let ingestionFormArea = '';
    if (_adminIsFetching) {
      ingestionFormArea = `
        <div style="text-align:center; padding:12px; border: 1px dashed var(--border-default); border-radius:var(--r-md); margin-bottom:12px">
          <div class="loader" style="margin:0 auto 8px"></div>
          <span style="font-size:11px; color:var(--text-secondary)">Fetching domain headers...</span>
        </div>`;
    } else {
      ingestionFormArea = `
        <div style="display:flex; gap:8px; margin-bottom:12px">
          <input class="input" type="url" id="ref-ingest-url" placeholder="Paste live URL to auto-fill..." style="font-size:12px; padding:6px 10px">
          <button class="btn btn-outline btn-sm" onclick="PAGE_ADMIN._fetchRefMeta()">Ingest</button>
        </div>`;
    }

    return `
      <div class="admin-form">
        <div class="admin-form-title">${data.id ? '✏️ Edit Client Reference' : '+ Create Client Reference'}</div>
        
        <div style="margin-bottom:8px; font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary)">Ingest reference:</div>
        ${ingestionFormArea}

        <div style="margin-bottom:12px; font-size:12px; font-weight:500; color:var(--accent); font-family:var(--font-ui)">📋 BASIC REFERENCE DETAILS</div>
        <div class="form-grid">
          <div class="input-group span-2">
            <label class="input-label">Client Name *</label>
            <input class="input" id="ref-name" type="text" placeholder="Company name" value="${data.client_name || ''}">
          </div>
          <div class="input-group span-2">
            <label class="input-label">Website URL *</label>
            <input class="input" id="ref-url" type="url" placeholder="https://…" value="${data.website_url || ''}">
          </div>
          <div class="input-group span-2">
            <label class="input-label" style="font-size:11px; margin-bottom: 4px;">Geo</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="ref-geos-checkboxes">
              ${window.PORTAL_DATA.GEOS.map(g => {
                const isChecked = (data.geo || '').includes(g);
                return `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
                </label>
                `
              }).join('')}
            </div>
          </div>
          <div class="input-group">
            <label class="input-label">Vertical</label>
            <select class="select" id="ref-vertical">
              <option value="">Select</option>
              ${VERTICALS.map(v => `<option value="${v}" ${data.vertical === v ? 'selected':''}>${v}</option>`).join('')}
            </select>
          </div>
          <div class="input-group span-2">
            <label class="input-label">AI Pitch Notes / Summary (1-2 sentences)</label>
            <textarea class="input" id="ref-summary" rows="3" placeholder="Notes for sales reps…">${data.ai_summary || ''}</textarea>
          </div>
          <div class="input-group span-2">
            <label class="input-label">Services Provided (comma separated)</label>
            <input class="input" id="ref-services" type="text" placeholder="SEO, PPC, PR" value="${(data.services_provided || []).join(', ')}">
          </div>
          <div class="input-group span-2" style="background:var(--bg-3); padding:12px; border-radius:var(--r-md); border:1px solid var(--border-subtle)">
            <label class="input-label" style="font-weight:700; color:var(--text-primary)">Thumbnail Image Selector</label>
            
            <!-- Link Paste Input -->
            <div style="margin-bottom:8px">
              <span style="font-size:10px; color:var(--text-secondary); display:block; margin-bottom:4px">Option 1: Paste Link</span>
              <input class="input" id="ref-thumb" type="url" placeholder="https://..." value="${data.thumbnail_url || ''}" oninput="PAGE_ADMIN.updateThumbPreview(this.value)" style="font-size:12px; padding:6px 10px">
            </div>

            <!-- Drag & Drop or File Upload / Paste Zone -->
            <div style="display:grid; grid-template-columns:1fr 100px; gap:12px; align-items:center;">
              <div id="ref-thumb-zone" 
                   style="border:1.5px dashed var(--border-default); border-radius:var(--r-md); padding:16px; text-align:center; cursor:pointer; font-size:11px; color:var(--text-secondary); transition:background 0.2s" 
                   onclick="document.getElementById('ref-thumb-file').click()"
                   onpaste="PAGE_ADMIN.handleThumbPaste(event)"
                   ondragover="event.preventDefault(); this.style.background='var(--bg-4)';"
                   ondragleave="this.style.background='';"
                   ondrop="event.preventDefault(); this.style.background=''; PAGE_ADMIN.handleThumbDrop(event);">
                <span>Option 2: Drag file here, <a style="color:var(--accent); font-weight:600">Browse</a>, or <kbd style="font-family:var(--font-mono); background:var(--bg-4); border:1px solid var(--border-default); padding:1px 3px; border-radius:3px">Ctrl+V</kbd> to paste logo/image</span>
                <input type="file" id="ref-thumb-file" accept="image/*" style="display:none" onchange="PAGE_ADMIN.handleThumbSelect(event)">
              </div>
              <div id="ref-thumb-preview-wrap" style="width:100px; height:60px; background:var(--bg-4); border:1px solid var(--border-subtle); border-radius:4px; overflow:hidden; display:flex; align-items:center; justify-content:center">
                ${data.thumbnail_url 
                  ? `<img id="ref-thumb-preview-img" src="${data.thumbnail_url}" style="width:100%; height:100%; object-fit:cover">`
                  : `<span style="font-size:9px; color:var(--text-tertiary)">No Image</span>`
                }
              </div>
            </div>
          </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:8px">
          <button class="btn btn-primary btn-sm" id="ref-save-btn">${data.id ? 'Update Reference' : 'Save Reference'}</button>
          ${data.id ? `<button class="btn btn-ghost btn-sm" onclick="PAGE_ADMIN._cancelEdit()">Cancel</button>` : ''}
        </div>
        <div id="ref-form-error" class="login-error" style="margin-top:10px"></div>
      </div>`;
  }

  function _fetchRefMeta() {
    const input = document.getElementById('ref-ingest-url');
    if (!input || !input.value.trim()) {
      showToast('Please paste a URL first', 'error');
      return;
    }

    _adminIsFetching = true;
    const wrap = document.getElementById('admin-ref-form-wrap');
    if (wrap) wrap.innerHTML = renderRefForm(_editRefId ? STORE.getById(_editRefId) : {});

    setTimeout(() => {
      const url = input.value.trim();
      let clientName = 'Client';
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace('www.', '');
        clientName = host.split('.')[0].charAt(0).toUpperCase() + host.split('.')[0].slice(1);
      } catch (e) {}

      _adminIsFetching = false;
      const refData = {
        id: _editRefId || null,
        client_name: clientName,
        website_url: url,
        geo: 'Global',
        vertical: 'SaaS',
        ai_summary: `Enriched sales reference showcasing ${clientName}'s digital growth campaigns and modern web funnel.`,
        services_provided: ['SEO', 'Design'],
        thumbnail_url: `https://picsum.photos/seed/${clientName.toLowerCase()}-ref/600/340`
      };

      if (wrap) {
        wrap.innerHTML = renderRefForm(refData);
        bindRefForm(document.querySelector('#admin-tab-content'));
      }
      showToast('Enriched preview populated!', 'success');
    }, 700);
  }

  function bindRefForm(wrap) {
    const btn = wrap.querySelector('#ref-save-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const name = wrap.querySelector('#ref-name').value.trim();
      const url = wrap.querySelector('#ref-url').value.trim();
      const err = wrap.querySelector('#ref-form-error');

      if (!name || !url) {
        err.style.display = 'block';
        err.textContent = 'Client name and URL are required.';
        return;
      }

      err.style.display = 'none';

      const checkedGeos = document.querySelectorAll('#ref-geos-checkboxes input[type="checkbox"]:checked');
      const geoStr = Array.from(checkedGeos).map(cb => cb.value).join(', ') || 'Global';

      const payload = {
        client_name: name,
        website_url: url,
        geo: geoStr,
        vertical: wrap.querySelector('#ref-vertical').value || 'Other',
        ai_summary: wrap.querySelector('#ref-summary').value.trim(),
        services_provided: wrap.querySelector('#ref-services').value.split(',').map(s => s.trim()).filter(Boolean),
        thumbnail_url: wrap.querySelector('#ref-thumb').value.trim()
      };

      if (_editRefId) {
        // Simple clientRef updates through localState
        const ud = STORE._getUserData ? STORE._getUserData() : null;
        if (ud) {
          const idx = ud.clientRefs.findIndex(r => r.id === _editRefId);
          if (idx !== -1) {
            ud.clientRefs[idx] = { ...ud.clientRefs[idx], ...payload };
            localStorage.setItem('np_portal_content', JSON.stringify(ud));
          } else {
            // override seed
            const seedRef = window.PORTAL_DATA.clientRefs.find(r => r.id === _editRefId);
            if (seedRef) {
              ud.clientRefs.push({ ...seedRef, ...payload, id: _editRefId });
              localStorage.setItem('np_portal_content', JSON.stringify(ud));
            }
          }
          STORE.resetState ? STORE.resetState() : null;
        }
        showToast('Reference updated');
        _editRefId = null;
      } else {
        STORE.addClientRef(payload);
        showToast('Reference saved');
      }

      const container = document.querySelector('.page-content');
      if (container) renderAdmin(container);
    });
  }

  // Public mutation methods ──
  function _editMaterial(id) {
    _editId = id;
    const mat = STORE.getMaterialById(id);
    if (!mat) return;

    const wrap = document.querySelector('#admin-form-wrap');
    if (wrap) {
      wrap.innerHTML = renderMaterialForm(mat);
      bindMaterialForm(document.querySelector('#admin-tab-content'));
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function _editRef(id) {
    _editRefId = id;
    const ref = STORE.getById(id);
    if (!ref) return;

    const wrap = document.querySelector('#admin-ref-form-wrap');
    if (wrap) {
      wrap.innerHTML = renderRefForm(ref);
      bindRefForm(document.querySelector('#admin-tab-content'));
      wrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  function _cancelEdit() {
    _editId = null;
    _editRefId = null;
    _editProfileId = null;
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function _deleteMaterial(id) {
    if (!confirm('Delete this material? This cannot be undone.')) return;
    STORE.deleteMaterial(id);
    showToast('Material deleted');
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function _deleteRef(id) {
    if (!confirm('Delete this client reference?')) return;
    STORE.deleteClientRef(id);
    showToast('Reference deleted');
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  // ── Team Settings Tab Renderers ──
  let _editUserId = null;

  function renderTeamTab(wrap) {
    const users = AUTH.getUsers();
    wrap.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 420px;gap:24px;align-items:start">
        <div>
          <div class="section-header" style="display:flex; align-items:center; gap:8px">
            <span class="section-title">My Team Members</span>
            <span class="section-count">${users.length}</span>
            <button class="btn btn-primary btn-sm" onclick="PAGE_ADMIN.newUser()" style="margin-left:auto">${ICONS.plus} Add Member</button>
          </div>
          <div class="admin-content-list">
            ${users.map(u => `
              <div class="admin-list-item" style="border-left: 6px solid ${u.glowColor || '#2563eb'} !important; padding-left: 14px;">
                <div class="admin-item-info">
                  <div class="admin-item-title" style="font-weight:700">${u.displayName}</div>
                  <div class="admin-item-meta">Login: <span style="font-family:var(--font-mono); color:var(--accent)">${u.username}</span> · Role: ${u.role === 'superadmin' ? 'Super Admin' : 'Sales Team'}</div>
                </div>
                <div class="admin-item-actions">
                  <button class="btn btn-sm btn-ghost" onclick="PAGE_ADMIN.editUser('${u.username}')" title="Edit">${ICONS.edit}</button>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
        <div id="admin-user-form-wrap">
          ${renderUserForm(_editUserId === 'new' ? { isNew: true, displayName: '', username: '', password: '', role: 'admin', glowColor: '#3b82f6' } : (_editUserId ? users.find(u => u.username === _editUserId) : null))}
        </div>
      </div>`;
  }

  function renderUserForm(user) {
    if (!user) {
      return `
        <div class="admin-form" style="text-align:center; padding:32px 20px">
          <div style="font-size:24px; margin-bottom:12px">👥</div>
          <div style="font-size:13px; font-weight:600; color:var(--text-primary)">Select a team member to manage their settings</div>
        </div>`;
    }
    
    const colors = [
      { name: 'Blue', value: '#3b82f6' },
      { name: 'Purple', value: '#8b5cf6' },
      { name: 'Red', value: '#ec4899' },
      { name: 'Orange', value: '#f97316' },
      { name: 'Brown', value: '#78350f' },
      { name: 'Black', value: '#000000' },
      { name: 'Gold', value: '#eab308' },
      { name: 'Cyan', value: '#06b6d4' }
    ];

    return `
      <div class="admin-form">
        <div class="admin-form-title">${user.isNew ? '✨ Add New Team Member' : `✏️ Edit Team Member: ${user.displayName}`}</div>
        <div class="form-grid">
          <div class="input-group span-2" style="${user.isNew ? '' : 'display:none;'}">
            <label class="input-label">Full Name *</label>
            <input class="input" id="user-edit-name" type="text" value="${user.displayName}" placeholder="e.g. John Doe">
          </div>
          <div class="input-group span-2">
            <label class="input-label">Login Username * (Max 7 symbols)</label>
            <input class="input" id="user-edit-username" type="text" value="${user.username}" placeholder="e.g. john_np">
          </div>
          <div class="input-group span-2">
            <label class="input-label">Password *</label>
            <input class="input" id="user-edit-pwd" type="text" value="${user.password}">
          </div>
          <div class="input-group">
            <label class="input-label">Role</label>
            <select class="select" id="user-edit-role">
              <option value="admin" ${user.role === 'admin' ? 'selected':''}>Sales Team (Admin)</option>
              <option value="superadmin" ${user.role === 'superadmin' ? 'selected':''}>Super Admin</option>
            </select>
          </div>
          <div class="input-group">
            <label class="input-label">Glowing Animation Color</label>
            <select class="select" id="user-edit-glow">
              ${colors.map(c => `<option value="${c.value}" ${user.glowColor === c.value ? 'selected':''}>${c.name}</option>`).join('')}
            </select>
          </div>
        </div>
        <div style="margin-top:16px; display:flex; gap:8px">
          <button class="btn btn-primary btn-sm" onclick="PAGE_ADMIN.saveUser('${user.isNew ? 'new' : user.username}')">${user.isNew ? 'Create Member' : 'Update Member Settings'}</button>
          <button class="btn btn-ghost btn-sm" onclick="PAGE_ADMIN.cancelUserEdit()">Cancel</button>
          ${!user.isNew ? `<button class="btn btn-danger btn-sm" style="margin-left:auto" onclick="PAGE_ADMIN.deleteUser('${user.username}')">${ICONS.trash} Delete Member</button>` : ''}
        </div>
        <div id="user-form-error" class="login-error" style="margin-top:10px; display:none"></div>
      </div>`;
  }

  function newUser() {
    _editUserId = 'new';
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function deleteUser(username) {
    if (username === 'super admin') {
      alert("Cannot delete the primary super admin account.");
      return;
    }
    if (!confirm(`Are you sure you want to delete the team member "${username}"?`)) return;
    
    const users = AUTH.getUsers();
    const filtered = users.filter(u => u.username !== username);
    AUTH.saveUsers(filtered);
    
    _editUserId = null;
    showToast('Team member deleted successfully!', 'success');
    
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function editUser(username) {
    _editUserId = username;
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function cancelUserEdit() {
    _editUserId = null;
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function saveUser(oldUsername) {
    const container = document.querySelector('.page-content');
    const isNew = oldUsername === 'new';
    
    let newName = '';
    if (isNew) {
      newName = document.getElementById('user-edit-name').value.trim();
      if (!newName) {
        document.getElementById('user-form-error').style.display = 'block';
        document.getElementById('user-form-error').textContent = 'Full Name is required.';
        return;
      }
    }
    
    const newUsername = document.getElementById('user-edit-username').value.trim().toLowerCase();
    const newPwd = document.getElementById('user-edit-pwd').value.trim();
    const newRole = document.getElementById('user-edit-role').value;
    const newGlow = document.getElementById('user-edit-glow').value;
    const errEl = document.getElementById('user-form-error');

    if (!newUsername || !newPwd) {
      errEl.style.display = 'block';
      errEl.textContent = 'Username and password are required.';
      return;
    }

    const users = AUTH.getUsers();
    
    let userIndex = -1;
    let namePrefix = '';
    
    if (isNew) {
      namePrefix = newName.toLowerCase().slice(0, 3);
    } else {
      userIndex = users.findIndex(u => u.username === oldUsername);
      if (userIndex === -1) return;
      namePrefix = users[userIndex].displayName.toLowerCase().slice(0, 3);
    }

    if (newUsername.length > 7) {
      errEl.style.display = 'block';
      errEl.textContent = 'Username cannot be longer than 7 characters.';
      return;
    }

    // Check uniqueness
    const exists = users.some((u, idx) => u.username === newUsername && idx !== userIndex);
    if (exists) {
      errEl.style.display = 'block';
      errEl.textContent = 'Username is already taken by another user.';
      return;
    }

    // Save changes
    if (isNew) {
      users.push({
        displayName: newName,
        username: newUsername,
        password: newPwd,
        role: newRole,
        glowColor: newGlow
      });
    } else {
      const user = users[userIndex];
      user.username = newUsername;
      user.password = newPwd;
      user.role = newRole;
      user.glowColor = newGlow;
    }

    AUTH.saveUsers(users);
    _editUserId = null;
    showToast('Team member settings updated successfully!', 'success');

    // Update UI session if super admin changed their own username
    const currentSession = AUTH.getSession();
    if (currentSession && currentSession.username === oldUsername) {
      currentSession.username = newUsername;
      sessionStorage.setItem('np_portal_session', JSON.stringify(currentSession));
    }

    // Re-render
    if (container) renderAdmin(container);
    // Refresh sidebar styling immediately
    const userContainer = document.querySelector('.sidebar-user');
    if (userContainer) {
      userContainer.style.setProperty('--glow-color', newGlow);
      const nameEl = document.getElementById('sidebar-username');
      if (nameEl && currentSession && currentSession.username === newUsername) {
        nameEl.textContent = user.displayName;
      }
    }
  }

  // ── Thumbnail Editor Widget Helper Handlers ──
  function updateThumbPreview(url) {
    const previewWrap = document.getElementById('ref-thumb-preview-wrap');
    if (!previewWrap) return;
    if (url.trim()) {
      previewWrap.innerHTML = `<img id="ref-thumb-preview-img" src="${url}" style="width:100%; height:100%; object-fit:cover">`;
    } else {
      previewWrap.innerHTML = `<span style="font-size:9px; color:var(--text-tertiary)">No Image</span>`;
    }
  }

  async function handleThumbFile(file) {
    if (!file) return;
    showToast('Uploading image to server...', 'info');

    let imageUrl = '';
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'thumbnails');

      const response = await fetch('upload.php', {
        method: 'POST',
        body: formData
      });
      const resData = await response.json();
      if (resData.success) {
        imageUrl = resData.url;
      }
    } catch (err) {
      console.warn('Server image upload failed, using Base64:', err);
    }

    if (!imageUrl) {
      const reader = new FileReader();
      reader.onload = function(e) {
        const base64 = e.target.result;
        const input = document.getElementById('ref-thumb');
        if (input) input.value = base64;
        const previewWrap = document.getElementById('ref-thumb-preview-wrap');
        if (previewWrap) {
          previewWrap.innerHTML = `<img id="ref-thumb-preview-img" src="${base64}" style="width:100%; height:100%; object-fit:cover">`;
        }
      };
      reader.readAsDataURL(file);
    } else {
      const input = document.getElementById('ref-thumb');
      if (input) input.value = imageUrl;
      const previewWrap = document.getElementById('ref-thumb-preview-wrap');
      if (previewWrap) {
        previewWrap.innerHTML = `<img id="ref-thumb-preview-img" src="${imageUrl}" style="width:100%; height:100%; object-fit:cover">`;
      }
      showToast('Image uploaded successfully!', 'success');
    }
  }

  function handleThumbSelect(e) {
    if (e.target.files && e.target.files[0]) {
      handleThumbFile(e.target.files[0]);
    }
  }

  function handleThumbDrop(e) {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleThumbFile(e.dataTransfer.files[0]);
    }
  }

  function handleThumbPaste(e) {
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let item of items) {
      if (item.kind === 'file' && item.type.startsWith('image/')) {
        const blob = item.getAsFile();
        handleThumbFile(blob);
        e.preventDefault();
        return;
      }
    }
    const pastedText = e.clipboardData.getData('text').trim();
    if (pastedText.startsWith('http://') || pastedText.startsWith('https://')) {
      const input = document.getElementById('ref-thumb');
      if (input) {
        input.value = pastedText;
        updateThumbPreview(pastedText);
      }
    }
  }

  function renderRecycleBinTab(wrap) {
    const bin = STORE.getRecycleBin();
    const totalCount = (bin.materials || []).length + (bin.clientRefs || []).length + (bin.clientProfiles || []).length;

    let html = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div class="section-header">
          <span class="section-title">🗑️ Recycle Bin (Super Admin)</span>
          <span class="section-count">${totalCount}</span>
        </div>
        <p style="font-size:12.5px; color:var(--text-secondary); margin-bottom:8px;">Deleted assets and references are stored here. You can restore them to the portal or purge them permanently.</p>
    `;

    if (totalCount === 0) {
      html += `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.trash}</div>
          <div class="empty-title">Recycle Bin is empty</div>
          <div class="empty-sub">Deleted items will appear here for recovery.</div>
        </div>
      `;
    } else {
      html += `<div class="admin-content-list" style="display:flex; flex-direction:column; gap:8px;">`;

      // 1. Materials
      (bin.materials || []).forEach(m => {
        html += `
          <div class="admin-list-item" style="border-left: 4px solid var(--accent); padding-left:14px;">
            <div class="admin-item-info">
              <div class="admin-item-title">${m.title} <span class="tag tag-default" style="font-size:8px; padding:1px 4px; margin-left:6px">Material</span></div>
              <div class="admin-item-meta">${m.client_name} · ${m.vertical} · Deleted: ${new Date(m.deleted_at_time || Date.now()).toLocaleString()}</div>
            </div>
            <div class="admin-item-actions">
              <button class="btn btn-sm btn-ghost" onclick="PAGE_ADMIN.restoreItem('${m.id}', 'material')" title="Restore">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="PAGE_ADMIN.purgeItem('${m.id}', 'material')" title="Delete Permanently">Purge</button>
            </div>
          </div>
        `;
      });

      // 2. Client References
      (bin.clientRefs || []).forEach(r => {
        html += `
          <div class="admin-list-item" style="border-left: 4px solid var(--accent); padding-left:14px;">
            <div class="admin-item-info">
              <div class="admin-item-title">${r.client_name} <span class="tag tag-warning" style="font-size:8px; padding:1px 4px; margin-left:6px">Reference</span></div>
              <div class="admin-item-meta">${r.vertical} · ${r.geo} · Deleted: ${new Date(r.deleted_at_time || Date.now()).toLocaleString()}</div>
            </div>
            <div class="admin-item-actions">
              <button class="btn btn-sm btn-ghost" onclick="PAGE_ADMIN.restoreItem('${r.id}', 'clientRef')" title="Restore">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="PAGE_ADMIN.purgeItem('${r.id}', 'clientRef')" title="Delete Permanently">Purge</button>
            </div>
          </div>
        `;
      });

      // 3. Client Profiles
      (bin.clientProfiles || []).forEach(p => {
        html += `
          <div class="admin-list-item" style="border-left: 4px solid var(--accent); padding-left:14px;">
            <div class="admin-item-info">
              <div class="admin-item-title">${p.client_name} <span class="tag tag-info" style="font-size:8px; padding:1px 4px; margin-left:6px">Profile</span></div>
              <div class="admin-item-meta">${p.vertical} · ${p.geo} · Deleted: ${new Date(p.deleted_at_time || Date.now()).toLocaleString()}</div>
            </div>
            <div class="admin-item-actions">
              <button class="btn btn-sm btn-ghost" onclick="PAGE_ADMIN.restoreItem('${p.id}', 'clientProfile')" title="Restore">Restore</button>
              <button class="btn btn-sm btn-danger" onclick="PAGE_ADMIN.purgeItem('${p.id}', 'clientProfile')" title="Delete Permanently">Purge</button>
            </div>
          </div>
        `;
      });

      html += `</div>`;
    }

    html += `</div>`;
    wrap.innerHTML = html;
  }

  function restoreItem(id, type) {
    STORE.restoreRecord(id, type);
    showToast('Item restored successfully', 'success');
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  function purgeItem(id, type) {
    if (!confirm('Are you sure you want to permanently delete this item? This action cannot be undone.')) return;
    STORE.purgeRecord(id, type);
    showToast('Item purged permanently');
    const container = document.querySelector('.page-content');
    if (container) renderAdmin(container);
  }

  return { 
    render, 
    _editMaterial, 
    _editRef, 
    _cancelEdit, 
    _deleteMaterial, 
    _deleteRef, 
    _fetchRefMeta,
    updateThumbPreview,
    handleThumbSelect,
    handleThumbDrop,
    handleThumbPaste,
    newUser,
    editUser,
    cancelUserEdit,
    saveUser,
    deleteUser,
    restoreItem,
    purgeItem
  };
})();

window.PAGE_ADMIN = PAGE_ADMIN;

