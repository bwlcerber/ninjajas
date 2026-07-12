/** PAGE: Reports */
'use strict';

const PAGE_REPORTS = (() => {

  const CATEGORIES = [
    { id: 'all', label: 'All Files' },
    { id: 'performance-marketing', label: 'Performance Marketing' },
    { id: 'influencer-marketing', label: 'Influencer Marketing' },
    { id: 'seo-geo', label: 'SEO/GEO' },
    { id: 'ppc-media-plans', label: 'PPC Media Plans' },
    { id: 'smm-profiles', label: 'SMM Profiles' },
    { id: 'gtms', label: 'GTMs' },
    { id: 'pr-demos', label: 'PR Demos' },
    { id: 'other-files', label: 'Other files' },
    { id: 'client-docs', label: 'Client Docs' }
  ];

  let _activeCategory = 'all';
  let _sortBy = 'recent';
  let _query = '';
  const _selectedVerticals = new Set();
  const _selectedServices = new Set();
  const _selectedGeos = new Set();
  let _editReportId = null;

  function render(container) {
    const allReports = STORE.getMaterials().filter(m => !['case', 'creative', 'video', 'image'].includes(m.asset_type));
    const services = window.PORTAL_DATA.SERVICES;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Performance reports, media plans, strategy decks, and case-study documents.</div>
          ${window.CAN_MANAGE ? `<button class="btn btn-primary" onclick="PAGE_REPORTS.openUploadModal()">
            ${ICONS.plus} Add Files
          </button>` : ''}
        </div>

        <!-- Multi-select Filter Rows -->
        <div style="margin-top:12px; margin-bottom:12px; display:flex; flex-direction:column; gap:10px;">
          <!-- Industries -->
          <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; flex-shrink:0; text-transform:uppercase">Industries</span>
            ${window.PORTAL_DATA.VERTICALS.map(v => {
              const active = _selectedVerticals.has(v);
              return `<button class="filter-chip ${active ? 'active' : ''}" style="flex-shrink:0" onclick="PAGE_REPORTS._toggleFilter('verticals', '${v}')">${getVerticalEmoji(v)} ${v}</button>`;
            }).join('')}
          </div>
          <!-- Services -->
          <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; flex-shrink:0; text-transform:uppercase">Services</span>
            ${window.PORTAL_DATA.SERVICES.map(s => {
              const active = _selectedServices.has(s);
              return `<button class="filter-chip ${active ? 'active' : ''}" style="flex-shrink:0" onclick="PAGE_REPORTS._toggleFilter('services', '${s}')">${s}</button>`;
            }).join('')}
          </div>
          <!-- Geos -->
          <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; flex-shrink:0; text-transform:uppercase">Geos</span>
            ${window.PORTAL_DATA.GEOS.map(g => {
              const active = _selectedGeos.has(g);
              return `<button class="filter-chip ${active ? 'active' : ''}" style="flex-shrink:0" onclick="PAGE_REPORTS._toggleFilter('geos', '${g}')">${g}</button>`;
            }).join('')}
          </div>
        </div>

        <!-- Search -->
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div class="search-bar" style="flex:1;min-width:240px">
            ${ICONS.search}
            <input id="reports-search" type="text" placeholder="Search client docs…" value="${_query}" autocomplete="off">
          </div>
        </div>

        <!-- Category tabs, Sort Dropdown, and Active Filter Chips -->
        <div style="display:flex; flex-direction:column; gap:8px; margin-top:16px; margin-bottom:0">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div class="tabs" style="margin:0;">
              ${CATEGORIES.map(c => {
                const isClientDocs = c.id === 'client-docs';
                return `
                  ${isClientDocs ? `<div style="width:2px; height:18px; background:var(--border-subtle); margin:0 4px; border-radius:1px;"></div>` : ''}
                  <div class="tab ${_activeCategory === c.id ? 'active' : ''}" data-cat="${c.id}">${c.label}</div>
                `;
              }).join('')}
            </div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span style="font-size:11px; font-weight:600; color:var(--text-tertiary); text-transform:uppercase;">Sort By:</span>
              <select class="select" id="reports-sort-by" style="font-size:12px; height:32px; padding:0 8px; width:140px;" onchange="PAGE_REPORTS._changeSort(this.value)">
                <option value="recent" ${_sortBy === 'recent' ? 'selected' : ''}>Recently Added</option>
                <option value="alphabetical" ${_sortBy === 'alphabetical' ? 'selected' : ''}>Alphabetical</option>
              </select>
            </div>
          </div>
          <!-- Active filter chips -->
          <div id="reports-active-filters" class="active-filters" style="display:none;"></div>
        </div>
      </div>

      <div style="margin-top:24px;">
        <div id="reports-list" class="reports-list"></div>
      </div>
    `;

    // Events
    container.querySelector('#reports-search').addEventListener('input', (e) => {
      _query = e.target.value;
      renderList(container);
    });

    container.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', () => {
        _activeCategory = tab.dataset.cat;
        container.querySelectorAll('.tab').forEach(t => t.classList.toggle('active', t.dataset.cat === _activeCategory));
        renderList(container);
      });
    });

    renderList(container);
    renderActiveFilters(container);
  }

  function _changeSort(val) {
    _sortBy = val;
    const container = document.getElementById('page-container');
    if (container) renderList(container);
  }

  function _toggleFilter(type, val) {
    if (type === 'verticals') {
      if (_selectedVerticals.has(val)) _selectedVerticals.delete(val);
      else _selectedVerticals.add(val);
    } else if (type === 'services') {
      if (_selectedServices.has(val)) _selectedServices.delete(val);
      else _selectedServices.add(val);
    } else if (type === 'geos') {
      if (_selectedGeos.has(val)) _selectedGeos.delete(val);
      else _selectedGeos.add(val);
    }
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function clearAllTags() {
    _selectedVerticals.clear();
    _selectedServices.clear();
    _selectedGeos.clear();
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function renderActiveFilters(container) {
    const wrap = container.querySelector('#reports-active-filters');
    if (!wrap) return;
    const allActive = [
      ...[..._selectedVerticals].map(v => ({ label: v, type: 'verticals', val: v })),
      ...[..._selectedServices].map(s => ({ label: s, type: 'services', val: s })),
      ...[..._selectedGeos].map(g => ({ label: g, type: 'geos', val: g }))
    ];
    if (allActive.length === 0) {
      wrap.style.display = 'none';
      return;
    }
    wrap.style.display = 'flex';
    wrap.innerHTML = `
      <span style="font-size:11px; color:var(--text-tertiary); font-family:var(--font-mono); margin-right:4px; flex-shrink:0;">Active filters:</span>
      ${allActive.map(f => `
        <span class="filter-badge">
          ${f.label}
          <span class="filter-badge-remove" onclick="PAGE_REPORTS._toggleFilter('${f.type}','${f.val}')">✕</span>
        </span>
      `).join('')}
      <a style="font-size:11px; color:var(--danger); cursor:pointer; margin-left:8px; font-family:var(--font-mono); flex-shrink:0;" onclick="PAGE_REPORTS.clearAllTags()">Clear All</a>
    `;
  }

  function renderList(container) {
    let items = STORE.getMaterials().filter(m => m.visibility_status !== 'internal-only');

    if (_activeCategory === 'client-docs') {
      // Only show internal client-safe docs
      items = items.filter(m => m.client_name === 'Internal');
    } else {
      // Hide internal docs from all other standard categories
      items = items.filter(m => m.client_name !== 'Internal');
      
      if (_activeCategory !== 'all') {
        items = items.filter(m => m.asset_type === _activeCategory || (m.tags && m.tags.includes(_activeCategory)));
      } else {
        // Hide creatives and visual assets in 'all' view to prevent clutter
        items = items.filter(m => !['case', 'branding', 'creatives', 'creative', 'video', 'image'].includes(m.asset_type));
      }
    }

    // Helper for OR logic within a category
    const checkCategory = (item, set, checkFn) => {
      if (set.size === 0) return true;
      for (const val of set) {
        if (checkFn(item, val)) return true;
      }
      return false;
    };

    items = items.filter(m => {
      const matchVertical = checkCategory(m, _selectedVerticals, (m, v) => m.vertical === v || (m.verticals && m.verticals.includes(v)));
      const matchService = checkCategory(m, _selectedServices, (m, s) => (m.services_provided && m.services_provided.includes(s)));
      const matchGeo = checkCategory(m, _selectedGeos, (m, g) => m.geo === g || (!m.geo && g === 'Global'));
      
      return matchVertical && matchService && matchGeo;
    });

    // Filter by query
    if (_query.trim()) {
      const q = _query.toLowerCase();
      items = items.filter(m => [
        m.title, m.client_name, m.description, m.vertical, m.geo,
        ...(m.tags || []), ...(m.services_provided || [])
      ].join(' ').toLowerCase().includes(q));
    }

    // Sort by pinned first, then by selected sort option
    items.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned; // pinned first (1 > 0)
      
      if (_sortBy === 'recent') {
        const dateA = new Date(a.created_at || '1970-01-01');
        const dateB = new Date(b.created_at || '1970-01-01');
        return dateB - dateA;
      } else {
        return (a.title || '').localeCompare(b.title || '');
      }
    });

    const list = container.querySelector('#reports-list');

    if (items.length === 0) {
      list.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.reports}</div>
          <div class="empty-title">No client docs found</div>
          <div class="empty-sub">Try adjusting your filters or search query.</div>
        </div>`;
      return;
    }

    list.innerHTML = items.map(m => renderReportRow(m)).join('');
  }

  function renderReportRow(mat) {
    const profile = STORE.getProfileForClient(mat.client_name);
    const ref = STORE.getClientRefs().find(r => r.client_name.toLowerCase() === mat.client_name.toLowerCase());
    const clientLink = ref ? ref.website_url : '';
    const isChecked = window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.has(mat.id);

    // Interactive clickable tags
    const matVerts = mat.verticals && mat.verticals.length ? mat.verticals : [mat.vertical || 'Other'];
    const verticalTags = matVerts.map(v => `<span class="tag ${getVerticalClass(v)} tag-interactive ${_selectedVerticals.has(v) ? 'active' : ''}" onclick="event.stopPropagation(); PAGE_REPORTS._toggleFilter('verticals', '${v}')">${v}</span>`).join('');
    const assetTag = `<span class="tag tag-default">${assetTypeLabel(mat.asset_type)}</span>`;
    const serviceTags = (mat.services_provided || []).map(s => {
      const active = _selectedServices.has(s);
      return `<span class="tag tag-info tag-interactive ${active ? 'active' : ''}" onclick="event.stopPropagation(); PAGE_REPORTS._toggleFilter('services', '${s}')">${s}</span>`;
    }).join('');

    return `
      <div class="material-row animate-fade ${mat.pinned ? 'pinned' : ''}" data-id="${mat.id}" onclick="openMaterial(STORE.getMaterialById('${mat.id}'))">
        <div class="material-row-checkbox" onclick="event.stopPropagation()">
          <label class="item-select-wrap">
            <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
            <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
          </label>
        </div>
        <div class="material-row-icon" style="overflow:hidden; display:flex; align-items:center; justify-content:center;">
          ${(mat.file_type === 'image' || mat.file_type === 'video') 
            ? `<img src="${mat.thumbnail_url || mat.file_url}" style="width:100%; height:100%; object-fit:cover; border-radius:4px;">` 
            : (mat.asset_type === 'influencer-marketing' ? getFileIcon('doc-link') : getFileIcon(mat.file_type))
          }
        </div>
        <div class="material-row-info">
          <div class="material-row-title">${mat.title}</div>
          <div class="material-row-sub">
            ${clientLink 
              ? `<a href="${clientLink}" target="_blank" onclick="event.stopPropagation();" style="color:var(--accent); text-decoration:underline; font-weight:normal;">${mat.client_name}</a>` 
              : mat.client_name
            } · ${assetTypeLabel(mat.asset_type)} · ${formatDate(mat.created_at)}
          </div>
        </div>
        <div class="material-row-tags" style="display:flex;gap:6px;align-items:center;flex-shrink:0; flex-wrap:wrap;">
          ${verticalTags}
          ${serviceTags}
        </div>
        <div style="display:flex;gap:4px">
          <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();PAGE_REPORTS.togglePin('${mat.id}')" title="${mat.pinned ? 'Unpin' : 'Pin'}" style="color:${mat.pinned ? '#ef4444' : 'var(--accent)'}; padding:4px;">
            ${mat.pinned ? ICONS.pinSolidDiag || '📌' : ICONS.pinSolidDiag || '📌'}
          </button>
          <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openMaterial(STORE.getMaterialById('${mat.id}'))" title="Open preview inside dashboard">
            ${ICONS.eye} Preview
          </button>
          <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();copyToClipboard('${mat.file_url}','Link')" title="Copy link to clipboard">
            ${ICONS.copy}
          </button>
          ${profile ? `
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();ROUTER.navigate('miniprofiles','${profile.id}')" title="View company profile">
              📂 Company Profile
            </button>
          ` : ''}
          ${window.CAN_MANAGE ? `
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); PAGE_REPORTS.openEditModal('${mat.id}')" title="Edit Metadata" style="color:var(--accent); display:inline-flex; align-items:center; justify-content:center; padding:4px;">
              ${ICONS.edit}
            </button>
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); checkSuperAdminAction(() => { if (confirm('Are you sure you want to delete this material? This action cannot be undone.')) { STORE.deleteMaterial('${mat.id}'); showToast('Material moved to Recycle Bin', 'success'); ROUTER.render(); } })" title="Delete Material" style="color:var(--danger); display:inline-flex; align-items:center; justify-content:center; padding:4px;">
              ${ICONS.trash}
            </button>
          ` : ''}
        </div>
      </div>`;
  }

  function togglePin(matId) {
    const mat = STORE.getMaterialById(matId);
    if (!mat) return;
    STORE.updateMaterial(matId, { pinned: !mat.pinned });
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  let _uploadedReportFiles = [];

  function openUploadModal() {
    _uploadedReportFiles = [];
    const verticals = window.PORTAL_DATA.VERTICALS;
    const services = window.PORTAL_DATA.SERVICES;

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <!-- Toggle Upload Type -->
        <div style="display:flex; gap:10px; border-bottom:1px solid var(--border-subtle); padding-bottom:10px;">
          <button class="btn btn-sm btn-primary" id="btn-tab-files" onclick="PAGE_REPORTS.setUploadTab('files')">Local File Upload</button>
          <button class="btn btn-sm btn-secondary" id="btn-tab-links" onclick="PAGE_REPORTS.setUploadTab('links')">External Link (e.g. Google Drive)</button>
        </div>

        <!-- Tab 1: Files -->
        <div id="upload-tab-files-content" style="display:flex; flex-direction:column; gap:12px;">
          <div id="report-dropzone" style="border: 2px dashed var(--border-default); border-radius: var(--r-lg); padding: 32px; text-align: center; cursor: pointer; transition: background 0.2s;" ondragover="event.preventDefault(); this.style.background='var(--bg-3)';" ondragleave="this.style.background='';" ondrop="event.preventDefault(); this.style.background=''; PAGE_REPORTS.handleFilesDrop(event);">
            <div style="font-size: 28px; margin-bottom: 8px;">📁</div>
            <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Drag & drop files here or click to browse</div>
            <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">Supports PDF, Docx, Sheets, PPTX</div>
            <input type="file" id="report-files-input" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx" style="display:none;" onchange="PAGE_REPORTS.handleFilesSelect(event);">
          </div>
          <div id="report-upload-previews" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; max-height: 120px; overflow-y: auto;"></div>
        </div>

        <!-- Tab 2: Links -->
        <div id="upload-tab-links-content" style="display:none; flex-direction:column; gap:12px;">
          <div style="font-size:11.5px; color:var(--text-secondary); margin-bottom:-4px;">Paste one or more links (separated by commas or new lines):</div>
          <textarea class="input" id="report-link-url" placeholder="https://drive.google.com/link1&#10;https://drive.google.com/link2" style="width:100%; height:60px; font-size:12px; font-family:var(--font-mono); resize:none;"></textarea>
          <div style="display:flex; gap:8px; align-items:center;">
            <input class="input" type="text" id="report-link-title" placeholder="Document Title / Prefix (Optional)" style="flex:1; height:36px; font-size:12px;">
            <button class="btn btn-primary btn-sm" onclick="PAGE_REPORTS.addReportLinkItem()" style="height:36px;">Add Link(s)</button>
          </div>
          <div id="report-links-list" style="display:flex; flex-direction:column; gap:6px; max-height: 120px; overflow-y: auto;"></div>
        </div>

        <!-- Universal properties -->
        <div style="background: var(--bg-3); padding: 14px; border-radius: var(--r-md); border: 1px solid var(--border-subtle); display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px; font-weight:500; color:var(--accent); font-family:var(--font-ui)">🏷️ METADATA PROPERTIES</div>
          
          <div class="input-group">
            <span class="input-label" style="font-size:11px;">Asset Type *</span>
            <select class="select" id="upload-report-assettype" style="height:34px; font-size:12px;">
              ${window.PORTAL_DATA.ASSET_TYPES.map(type => `<option value="${type}">${assetTypeLabel(type)}</option>`).join('')}
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <span class="input-label" style="font-size:11px; margin-bottom: 2px;">Industry * (Select multiple)</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="upload-report-verticals">
              ${(() => {
                const sorted = [...verticals].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                if (verticals.includes('Other')) sorted.push('Other');
                return sorted.map(v => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${v}" style="accent-color:var(--accent);"> ${v}
                  </label>
                `).join('');
              })()}
            </div>
          </div>
          


          <div class="input-group">
            <span class="input-label" style="font-size:11px;">Services Provided *</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="upload-report-services">
              ${[...services].sort().map(s => `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${s}" style="accent-color:var(--accent);"> ${s}
                </label>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="input-group" id="client-name-group">
                <span class="input-label" style="font-size:11px;">Client Name *</span>
                <input class="input" type="text" id="upload-report-client" placeholder="e.g. BankFlow" value="Internal" style="height:34px; font-size:12px;">
              </div>
              <div class="input-group">
                <span class="input-label" style="font-size:11px;">Client Website URL</span>
                <input class="input" type="text" id="upload-report-website" placeholder="https://example.com" style="height:34px; font-size:12px;">
              </div>
            </div>
            
            <div class="input-group" style="margin-top: 4px;">
              <span class="input-label" style="font-size:11px;">Geo * (Select multiple)</span>
              <div style="display:flex; flex-wrap:wrap; gap:8px;" id="upload-report-geo">
                ${window.PORTAL_DATA.GEOS.map(g => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${g}" style="accent-color:var(--accent);"> ${g}
                  </label>
                `).join('')}
              </div>
            </div>
            <label style="display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
              <input type="checkbox" id="upload-report-no-client" onchange="PAGE_REPORTS.toggleClientNameField(this)"> Client Name Not Available
            </label>
          </div>
        </div>
      </div>
    `;

    const modalFooter = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_REPORTS.saveBatchUpload()" id="save-report-batch-btn" disabled>Batch Save (0)</button>
    `;

    openModal({
      title: 'Upload Client Docs',
      body: modalBody,
      footer: modalFooter,
      size: 'medium'
    });

    document.getElementById('report-dropzone').addEventListener('click', () => {
      document.getElementById('report-files-input').click();
    });
  }

  let _activeUploadTab = 'files';
  function setUploadTab(tab) {
    _activeUploadTab = tab;
    document.getElementById('btn-tab-files').className = tab === 'files' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
    document.getElementById('btn-tab-links').className = tab === 'links' ? 'btn btn-sm btn-primary' : 'btn btn-sm btn-secondary';
    document.getElementById('upload-tab-files-content').style.display = tab === 'files' ? 'flex' : 'none';
    document.getElementById('upload-tab-links-content').style.display = tab === 'links' ? 'flex' : 'none';
    updateBatchUI();
  }

  function toggleClientNameField(chk) {
    const input = document.getElementById('upload-report-client');
    if (chk.checked) {
      input.value = 'Client Name Not Available';
      input.disabled = true;
    } else {
      input.value = 'Internal';
      input.disabled = false;
    }
  }

  function handleFilesDrop(e) {
    const files = Array.from(e.dataTransfer.files);
    addFilesToBatch(files);
  }

  function handleFilesSelect(e) {
    const files = Array.from(e.target.files);
    addFilesToBatch(files);
  }

  function addFilesToBatch(files) {
    files.forEach(f => {
      if (!_uploadedReportFiles.some(existing => existing.name === f.name && existing.size === f.size)) {
        _uploadedReportFiles.push({
          name: f.name,
          type: 'file',
          rawFile: f
        });
      }
    });
    updateBatchUI();
  }

  function addReportLinkItem() {
    const urlInput = document.getElementById('report-link-url');
    const titleInput = document.getElementById('report-link-title');
    const rawVal = urlInput.value.trim();
    const titlePrefix = titleInput.value.trim();

    if (!rawVal) {
      showToast('Please enter at least one URL', 'error');
      return;
    }

    // Split by newlines or commas
    const lines = rawVal.split(/[\n,]+/).map(line => line.trim()).filter(Boolean);
    let addedCount = 0;

    lines.forEach((url, i) => {
      let cleanUrl = url;
      if (!/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      
      let displayName = '';
      if (titlePrefix) {
        displayName = lines.length > 1 ? `${titlePrefix} (Part ${i + 1})` : titlePrefix;
      } else {
        const clientInput = document.getElementById('upload-report-client');
        const clientVal = clientInput ? clientInput.value.trim() : '';
        if (clientVal && clientVal !== 'Internal' && clientVal !== 'Client Name Not Available') {
          displayName = clientVal + ' ' + assetTypeLabel(document.getElementById('upload-report-assettype').value);
          if (lines.length > 1) displayName += ` (Part ${i + 1})`;
        } else {
          try {
            const parsed = new URL(cleanUrl);
            displayName = parsed.hostname.replace('www.', '') + ' File';
          } catch (e) {
            displayName = 'Link ' + (i + 1);
          }
        }
      }

      _uploadedReportFiles.push({
        name: displayName,
        url: cleanUrl,
        type: 'link'
      });
      addedCount++;
    });

    urlInput.value = '';
    titleInput.value = '';
    updateBatchUI();
    showToast(`Added ${addedCount} link(s) to the batch`, 'success');
  }

  function removeFileFromBatch(idx) {
    _uploadedReportFiles.splice(idx, 1);
    updateBatchUI();
  }

  function updateBatchUI() {
    const previews = document.getElementById('report-upload-previews');
    const linksList = document.getElementById('report-links-list');
    const saveBtn = document.getElementById('save-report-batch-btn');
    if (!saveBtn) return;

    if (_uploadedReportFiles.length === 0) {
      if (previews) previews.innerHTML = '';
      if (linksList) linksList.innerHTML = '';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Batch Save (0)';
      return;
    }

    saveBtn.disabled = false;
    saveBtn.textContent = `Batch Save (${_uploadedReportFiles.length})`;

    if (_activeUploadTab === 'files') {
      if (previews) {
        previews.innerHTML = _uploadedReportFiles.filter(x => x.type === 'file').map((file, idx) => `
          <div style="position:relative; width:80px; height:80px; background:var(--bg-4); border:1px solid var(--border-default); border-radius:var(--r-md); overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px;">
            <div style="font-size:20px;">📄</div>
            <div style="font-size:8px; color:var(--text-secondary); text-align:center; word-break:break-all; max-height:24px; overflow:hidden; margin-top:4px;">${file.name}</div>
            <button onclick="PAGE_REPORTS.removeFileFromBatch(${idx}); event.stopPropagation();" style="position:absolute; top:2px; right:2px; background:var(--danger-dim); border:none; color:var(--danger); width:16px; height:16px; border-radius:50%; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
          </div>
        `).join('');
      }
    } else {
      if (linksList) {
        linksList.innerHTML = _uploadedReportFiles.filter(x => x.type === 'link').map((file, idx) => `
          <div style="display:flex; justify-content:space-between; align-items:center; padding:6px 10px; background:var(--bg-4); border:1px solid var(--border-subtle); border-radius:var(--r-sm); font-size:12px;">
            <span style="color:var(--text-primary); text-overflow:ellipsis; overflow:hidden; white-space:nowrap; max-width:80%">${file.name}</span>
            <button onclick="PAGE_REPORTS.removeFileFromBatch(${idx})" style="background:transparent; border:none; color:var(--danger); cursor:pointer;">✕</button>
          </div>
        `).join('');
      }
    }
  }

  async function saveBatchUpload() {
    if (_uploadedReportFiles.length === 0) return;

    const checkedVerts = document.querySelectorAll('#upload-report-verticals input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedVerts).map(cb => cb.value);
    const vertical = selectedVerticals[0] || 'Other';
    const assetType = document.getElementById('upload-report-assettype').value;
    const checkedBoxes = document.querySelectorAll('#upload-report-services input[type="checkbox"]:checked');
    const services = Array.from(checkedBoxes).map(cb => cb.value);
    let clientName = document.getElementById('upload-report-client').value.trim() || 'Internal';
    const clientWebsite = document.getElementById('upload-report-website').value.trim() || '';
    const checkedGeos = document.querySelectorAll('#upload-report-geo input[type="checkbox"]:checked');
    const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
    const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';

    if (selectedVerticals.length === 0) {
      showToast('Please select at least one industry', 'error');
      return;
    }
    if (parsedGeos.length === 0) {
      showToast('Please select at least one GEO', 'error');
      return;
    }

    const saveBtn = document.getElementById('save-report-batch-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Uploading...';
    }

    // Auto-create client reference/profile if name is custom and doesn't exist yet
    if (clientName !== 'Internal' && clientName !== 'Client Name Not Available') {
      const existingRef = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === clientName.toLowerCase());
      if (existingRef) {
        clientName = existingRef.client_name;
      } else {
        STORE.addClientRef({
          client_name: clientName,
          website_url: clientWebsite || 'https://ninjapromo.io',
          vertical: vertical,
          geo: 'Global',
          ai_summary: `Newly registered client profile for ${clientName}.`,
          services_provided: services.length ? services : ['SEO'],
          thumbnail_url: ''
        });
        STORE.addClientProfile({
          client_name: clientName,
          vertical: vertical,
          geo: 'Global',
          website_url: clientWebsite || 'https://ninjapromo.io',
          services_provided: services.length ? services : ['SEO'],
          notes: `Added automatically during document upload.`,
          budget_range: '$10k-$25k',
          contacts: []
        });
        showToast(`Auto-created Client Reference and Profile for "${clientName}"`, 'info');
      }
    }

    let successCount = 0;

    for (let i = 0; i < _uploadedReportFiles.length; i++) {
      const file = _uploadedReportFiles[i];
      let fileUrl = file.type === 'file' ? `uploads/reports/${file.name}` : file.url;

      if (file.type === 'file' && file.rawFile) {
        try {
          const formData = new FormData();
          formData.append('file', file.rawFile);
          formData.append('type', 'reports');

          const response = await fetch('upload.php', {
            method: 'POST',
            body: formData
          });
          const resData = await response.json();
          if (resData.success) {
            fileUrl = resData.url;
          }
        } catch (err) {
          console.warn('Server upload failed for report file, using default path:', err);
        }
      }

      let finalTitle = file.name;
      if (file.type === 'link') {
        const isGeneric = /drive\.google/i.test(file.name) || 
                          file.name.toLowerCase().includes('google.com') ||
                          file.name.toLowerCase().includes('file') || 
                          file.name.toLowerCase().startsWith('link') ||
                          file.name.toLowerCase() === 'drive';
        if (isGeneric && clientName && clientName !== 'Internal' && clientName !== 'Client Name Not Available') {
          finalTitle = clientName;
        }
      }

      let cleanTitle = finalTitle;
      if (cleanTitle.includes('.')) {
        const parts = cleanTitle.split('.');
        if (parts.length > 1 && parts[parts.length - 1].length <= 4) {
          parts.pop();
          cleanTitle = parts.join('.');
        }
      }
      cleanTitle = cleanTitle.replace(/[-_]/g, ' ').trim();
      if ((cleanTitle.toLowerCase() === 'drive' || !cleanTitle) && clientName && clientName !== 'Internal' && clientName !== 'Client Name Not Available') {
        cleanTitle = clientName;
      }

      const item = {
        id: 'mat-' + Date.now() + Math.random().toString(36).slice(2, 6),
        title: cleanTitle,
        client_name: clientName,
        geo: geoStr,
        geos: parsedGeos,
        vertical: vertical,
        verticals: selectedVerticals,
        services_provided: services.length ? services : ['SEO'],
        asset_type: assetType,
        visibility_status: 'client-safe',
        description: `Uploaded ${assetType} document.`,
        file_type: file.type === 'file' ? 'pdf' : 'doc-link',
        file_url: fileUrl,
        thumbnail_url: '',
        tags: [...selectedVerticals, assetType, ...services],
        related_assets: [],
        created_at: new Date().toISOString().split('T')[0]
      };

      STORE.addMaterial(item);
      successCount++;
    }

    STORE.syncClientGeo(clientName, geoStr);

    closeModal();
    showToast(`Successfully uploaded ${successCount} client docs`, 'success');
    _uploadedReportFiles = [];

    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function setEditReport(id) {
    _editReportId = id;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function closeEditReport() {
    _editReportId = null;
    if (typeof closeModal === 'function') closeModal();
    const container = document.getElementById('page-container');
    if (container) render(container);
    if (window.location.hash.startsWith('#client-references') && window.PAGE_CLIENTREFS) {
      window.PAGE_CLIENTREFS.render();
    } else if (window.location.hash.startsWith('#miniprofiles') && window.PAGE_MINIPROFILES) {
      window.PAGE_MINIPROFILES.render();
    }
  }

  function openEditModal(matId) {
    const mat = STORE.getMaterialById(matId);
    if (!mat) return;
    
    openModal({
      title: 'Edit Metadata',
      body: `<div id="global-edit-report-wrap">${renderInlineEditForm(mat)}</div>`,
      footer: '',
      size: 'medium'
    });
    
    setTimeout(() => {
      const wrap = document.getElementById('global-edit-report-wrap');
      if (wrap) {
        bindInlineEditForm(wrap, mat);
      }
    }, 0);
  }

  function renderInlineEditForm(data) {
    if (!data) return '';
    return `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="margin:0; font-size:15px; font-weight:700; color:var(--text-primary);">Edit Metadata</h3>
        <button class="btn btn-ghost" style="padding:4px;" onclick="PAGE_REPORTS.closeEditReport()">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <div style="display:flex; flex-direction:column; gap:12px;">
        
        <!-- ROW 1 -->
        <div class="input-group">
          <label class="input-label" style="font-size:11px; font-weight:700;">DOCUMENT TITLE *</label>
          <input class="input" id="report-edit-title" type="text" value="${data.title || ''}" style="font-size:13px; padding:10px;">
        </div>

        <!-- ROW 2 -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="input-group">
            <label class="input-label" style="font-size:11px; font-weight:700;">CLIENT / BRAND *</label>
            <input class="input" id="report-edit-client" type="text" value="${data.client_name || ''}" placeholder="Internal" style="font-size:13px; padding:10px;">
          </div>
          <div class="input-group">
            <label class="input-label" style="font-size:11px; font-weight:700;">VISIBILITY STATUS *</label>
            <select class="select" id="report-edit-vis" style="font-size:13px; padding:10px;">
              <option value="internal" ${data.visibility_status === 'internal' ? 'selected' : ''}>Internal Only (Ninjajas)</option>
              <option value="public" ${data.visibility_status === 'public' ? 'selected' : ''}>Public (Clients & Ninjajas)</option>
            </select>
          </div>
        </div>
        
        <!-- ROW 3 -->
        <div class="input-group">
          <label class="input-label" style="font-size:11px; font-weight:700;">ASSET TYPE *</label>
          <select class="select" id="report-edit-type" style="font-size:13px; padding:10px;">
            ${window.PORTAL_DATA.ASSET_TYPES.map(type => `<option value="${type}" ${data.asset_type === type ? 'selected' : ''}>${assetTypeLabel(type)}</option>`).join('')}
          </select>
        </div>

        <!-- ROW 4 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">GEO *</label>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;" id="report-edit-geos">
            ${window.PORTAL_DATA.GEOS.map(g => {
              const isChecked = (data.geos || []).includes(g) || data.geo === g;
              return `
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
              </label>
              `
            }).join('')}
          </div>
        </div>

        <!-- ROW 5 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">VERTICALS / INDUSTRIES *</label>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;" id="report-edit-verticals">
            ${window.PORTAL_DATA.VERTICALS.map(v => `
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${(data.verticals || []).includes(v) || data.vertical === v ? 'checked' : ''}> ${v}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- ROW 6 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">SERVICES PROVIDED *</label>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;" id="report-edit-services">
            ${window.PORTAL_DATA.SERVICES.map(s => `
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${(data.services_provided || []).includes(s) ? 'checked' : ''}> ${s}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- ROW 7 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700;">FILE URL / LINK *</label>
          <input class="input" id="report-edit-url" type="url" placeholder="https://…" value="${data.file_url || ''}" style="font-size:13px; padding:10px;">
        </div>

        <!-- ROW 8 -->
        <div class="input-group">
          <label class="input-label" style="font-size:11px; font-weight:700;">DESCRIPTION</label>
          <textarea class="input" id="report-edit-desc" rows="3" placeholder="Short description…" style="font-size:13px; padding:10px; line-height:1.4;">${data.description || ''}</textarea>
        </div>

        <div style="display:flex; justify-content:center; margin-top:20px;">
          <button class="btn btn-primary" id="report-edit-save-btn" style="width:100%; display:flex; align-items:center; justify-content:center; padding:12px; font-size:14px; font-weight:600; border-radius:6px; letter-spacing:0.3px;">
            Save Changes
          </button>
        </div>
        <div id="report-edit-error" class="login-error" style="margin-top:10px; display:none; text-align:center;"></div>
      </div>
    `;
  }

  function bindInlineEditForm(wrap, originalData) {
    const btn = wrap.querySelector('#report-edit-save-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const title = wrap.querySelector('#report-edit-title').value.trim();
      const url = wrap.querySelector('#report-edit-url').value.trim();
      const err = wrap.querySelector('#report-edit-error');

      if (!title || !url) {
        err.style.display = 'block';
        err.textContent = 'Title and File URL are required.';
        return;
      }
      err.style.display = 'none';

      const checkedVerts = wrap.querySelectorAll('#report-edit-verticals input[type="checkbox"]:checked');
      const parsedVerticals = Array.from(checkedVerts).map(cb => cb.value);
      const firstVertical = parsedVerticals[0] || 'Other';

      const checkedServices = wrap.querySelectorAll('#report-edit-services input[type="checkbox"]:checked');
      const services = Array.from(checkedServices).map(cb => cb.value);
      
      const checkedGeos = wrap.querySelectorAll('#report-edit-geos input[type="checkbox"]:checked');
      const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
      const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';

      const assetType = wrap.querySelector('#report-edit-type').value || 'other';

      let fileType = originalData.file_type || 'pdf';
      const urlLower = url.toLowerCase();
      if (urlLower.includes('docs.google.com/document') || urlLower.includes('drive.google.com/file')) fileType = 'doc-link';
      else if (urlLower.includes('docs.google.com/spreadsheets') || urlLower.includes('docs.google.com/sheet')) fileType = 'spreadsheet-link';
      
      const record = {
        title,
        client_name: wrap.querySelector('#report-edit-client').value.trim() || 'Internal',
        geo: geoStr,
        geos: parsedGeos,
        vertical: firstVertical,
        verticals: parsedVerticals.length ? parsedVerticals : [firstVertical],
        asset_type: assetType,
        visibility_status: wrap.querySelector('#report-edit-vis').value,
        file_type: fileType,
        file_url: url,
        thumbnail_url: originalData.thumbnail_url || '',
        description: wrap.querySelector('#report-edit-desc').value.trim(),
        tags: [...parsedVerticals, assetType, ...services],
        services_provided: services,
        related_assets: originalData.related_assets || []
      };

      STORE.updateMaterial(originalData.id, record);
      STORE.syncClientGeo(record.client_name, geoStr);
      showToast('Metadata updated successfully', 'success');
      
      closeEditReport();
    });
  }



  return { 
    render, 
    _changeSort,
    _toggleFilter, 
    clearAllTags,
    openUploadModal,
    setUploadTab,
    toggleClientNameField,
    handleFilesDrop,
    handleFilesSelect,
    addReportLinkItem,
    removeFileFromBatch,
    saveBatchUpload,
    togglePin,
    setEditReport,
    openEditModal,
    closeEditReport
  };
})();

window.PAGE_REPORTS = PAGE_REPORTS;

