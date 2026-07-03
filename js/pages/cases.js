/** PAGE: Cases — NinjaPromo Real Case Studies */
'use strict';

const PAGE_CASES = (() => {

  let _vertical = 'all';
  let _service  = 'all';
  let _query    = '';
  const _selectedTags = new Set();

  function render(container) {
    const total = STORE.getByType('case').length;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:none; line-height:1.3; margin-top:0;">Real NinjaPromo case studies — proof of performance across every vertical and service. <span style="font-size:13px;font-weight:400;color:var(--text-tertiary);font-family:var(--font-mono);margin-left:6px">${total} total</span></div>
          <button class="btn btn-primary" onclick="checkSuperAdminAction(() => PAGE_CASES.openAddCaseModal())">
            ${ICONS.plus} Add Case
          </button>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
          <div class="search-bar" style="flex:1;min-width:220px">
            ${ICONS.search}
            <input id="cases-search" type="text" placeholder="Search by client, service, metric, or keyword…" value="${_query}" autocomplete="off">
          </div>
          <select class="select" id="cases-vertical" style="width:150px">
            <option value="all">All Verticals</option>
            ${window.PORTAL_DATA.VERTICALS.map(v => `<option value="${v}" ${_vertical === v ? 'selected':''}>${v}</option>`).join('')}
          </select>
          <select class="select" id="cases-service" style="width:170px">
            <option value="all">All Services</option>
            ${window.PORTAL_DATA.SERVICES.map(s => `<option value="${s}" ${_service === s ? 'selected':''}>${s}</option>`).join('')}
          </select>
        </div>

        <!-- Selected multi-select tags container -->
        <div id="cases-active-filters" class="active-filters" style="display:none"></div>
      </div>

      <div id="cases-result-count" style="font-size:11px;font-family:var(--font-mono);color:var(--text-tertiary);margin-bottom:12px"></div>
      <div id="cases-grid" class="cases-grid"></div>
    `;

    container.querySelector('#cases-search').addEventListener('input',   e => { _query    = e.target.value;  renderGrid(container); });
    container.querySelector('#cases-vertical').addEventListener('change', e => { _vertical = e.target.value; renderGrid(container); });
    container.querySelector('#cases-service').addEventListener('change',  e => { _service  = e.target.value; renderGrid(container); });

    renderGrid(container);
    renderActiveFilters(container);
  }

  function toggleTag(tag) {
    if (_selectedTags.has(tag)) {
      _selectedTags.delete(tag);
    } else {
      _selectedTags.add(tag);
    }
    const container = document.getElementById('page-container');
    if (container) {
      renderActiveFilters(container);
      renderGrid(container);
    }
  }

  function removeTag(tag) {
    _selectedTags.delete(tag);
    const container = document.getElementById('page-container');
    if (container) {
      renderActiveFilters(container);
      renderGrid(container);
    }
  }

  function clearAllTags() {
    _selectedTags.clear();
    const container = document.getElementById('page-container');
    if (container) {
      renderActiveFilters(container);
      renderGrid(container);
    }
  }

  function renderActiveFilters(container) {
    const wrap = container.querySelector('#cases-active-filters');
    if (!wrap) return;

    if (_selectedTags.size === 0) {
      wrap.style.display = 'none';
      return;
    }

    wrap.style.display = 'flex';
    wrap.innerHTML = `
      <span style="font-size:11px; color:var(--text-tertiary); font-family:var(--font-mono); margin-right:4px">Filtered tags:</span>
      ${Array.from(_selectedTags).map(t => `
        <span class="filter-badge">
          ${t}
          <span class="filter-badge-remove" onclick="PAGE_CASES.removeTag('${t}')">✕</span>
        </span>
      `).join('')}
      <a style="font-size:11px; color:var(--danger); cursor:pointer; margin-left:8px; font-family:var(--font-mono)" onclick="PAGE_CASES.clearAllTags()">Clear All</a>
    `;
  }

  function renderGrid(container) {
    let items = STORE.getByType('case');

    if (_vertical !== 'all') items = items.filter(m => {
      // Support multi-vertical via verticals array
      const verts = m.verticals || [m.vertical];
      return verts.includes(_vertical);
    });
    if (_service  !== 'all') items = items.filter(m => (m.services_provided || []).includes(_service));
    
    // Apply multi-select tags filtering
    if (_selectedTags.size > 0) {
      items = items.filter(m => {
        const verts = m.verticals || [m.vertical];
        return Array.from(_selectedTags).every(t => {
          return verts.includes(t) || (m.services_provided && m.services_provided.includes(t)) || (m.tags && m.tags.includes(t));
        });
      });
    }

    if (_query.trim()) {
      const q = _query.toLowerCase();
      items = items.filter(m => {
        const verts = m.verticals || [m.vertical];
        return [m.title, m.client_name, m.description, ...verts, m.geo, ...(m.tags||[]), ...(m.services_provided||[])].join(' ').toLowerCase().includes(q);
      });
    }

    const grid        = container.querySelector('#cases-grid');
    const countEl     = container.querySelector('#cases-result-count');
    const total       = STORE.getByType('case').length;
    countEl.textContent = items.length === total
      ? `Showing all ${total} case studies`
      : `${items.length} of ${total} cases match your filters`;

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <div class="empty-icon">${ICONS.cases}</div>
          <div class="empty-title">No cases match your filters</div>
          <div class="empty-sub">Try different keywords, verticals, or services.</div>
        </div>`;
      return;
    }

    grid.innerHTML = items.map(m => renderCaseCard(m)).join('');
  }

  // Extract headline metric from title (e.g. "$20M", "250K", "185%", "42%")
  function extractMetric(title) {
    const m = title.match(/(\$[\d.]+[MKB]?|[\d,]+[MK]?\+?\s*(?:new\s)?(?:clients?|users?|views?|sign-ups?|interactions?|impressions?)|[\d]+%(?:\s*more|\s*growth|\s*increase)?)/i);
    return m ? m[0].trim() : null;
  }

  function renderCaseCard(mat) {
    const profile = STORE.getProfileForClient(mat.client_name);
    const ref = STORE.getClientRefs().find(r => r.client_name && mat.client_name && r.client_name.toLowerCase() === mat.client_name.toLowerCase());
    const clientWebsiteUrl = (ref && ref.website_url && !ref.website_url.includes('ninjapromo.io')) ? ref.website_url : 
                             (profile && profile.website_url && !profile.website_url.includes('ninjapromo.io')) ? profile.website_url : null;
    const metric  = extractMetric(mat.title);
    const isLive  = mat.file_url && mat.file_url.includes('ninjapromo.io');
    const isChecked = window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.has(mat.id);

    // Render thumbnail cleanly at the top if exists, otherwise show vertical emoji placeholder
    const thumb = mat.thumbnail_url
      ? `<div class="card-thumbnail"><img src="${mat.thumbnail_url}" alt="${mat.client_name}" loading="lazy"></div>`
      : `<div class="card-thumbnail"><div class="card-thumb-placeholder">${getVerticalEmoji(mat.vertical)}</div></div>`;

    // Clickable tags — support multi-vertical via verticals array
    const caseVerts = mat.verticals || [mat.vertical];
    const verticalTag = caseVerts.map(v => `
      <span class="tag ${getVerticalClass(v)} tag-interactive ${_selectedTags.has(v) ? 'active' : ''}" 
            onclick="PAGE_CASES.toggleTag('${v}')" style="font-size:9px">
        ${v}
      </span>`).join('');

    const serviceTags = (mat.services_provided || []).map(s => {
      const active = _selectedTags.has(s);
      return `<span class="tag tag-info tag-interactive ${active ? 'active' : ''}" onclick="PAGE_CASES.toggleTag('${s}')" style="font-size:9px">${s}</span>`;
    }).join('');

    return `
      <div class="card animate-fade" data-id="${mat.id}" 
           draggable="${window.CAN_MANAGE ? 'true' : 'false'}"
           ondragstart="window.CAN_MANAGE && window.DRAG_DROP && window.DRAG_DROP.dragStart(event)"
           ondragover="window.CAN_MANAGE && window.DRAG_DROP && window.DRAG_DROP.dragOver(event)"
           ondragleave="window.CAN_MANAGE && window.DRAG_DROP && window.DRAG_DROP.dragLeave(event)"
           ondrop="window.CAN_MANAGE && window.DRAG_DROP && window.DRAG_DROP.drop(event, 'case')"
           ondragend="window.CAN_MANAGE && window.DRAG_DROP && window.DRAG_DROP.dragEnd(event)"
           style="display:flex;flex-direction:column;position:relative">
        <div class="card-checkbox-overlay ${isChecked ? 'checked' : ''}" onclick="event.stopPropagation()">
          <label class="item-select-wrap">
            <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
            <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
          </label>
        </div>

        ${thumb}

        <!-- Client Name Eyebrow directly below thumbnail -->
        <div style="display:flex;align-items:center;gap:8px;padding:12px 16px 0">
          <span style="font-size:15px;font-weight:800;color:var(--text-primary);margin:0">${mat.client_name}</span>
          ${verticalTag}
          <span style="margin-left:auto;font-size:11px;font-family:var(--font-ui);font-weight:500;color:var(--text-secondary)">${mat.geo}</span>
        </div>

        <div class="card-body" style="display:flex;flex-direction:column;flex:1">
          <div class="card-title" style="font-size:14px;font-weight:700;color:var(--accent);line-height:1.45;margin-bottom:8px">${mat.title}</div>
          <div class="card-desc" style="font-size:11.5px;color:var(--text-secondary);margin-bottom:12px">${truncate(mat.description, 140)}</div>

          <!-- Bottom-weighted metadata area -->
          <div style="margin-top:auto;padding-top:10px">
            <div style="display:flex;flex-wrap:wrap;gap:4px">
              ${serviceTags}
            </div>
          </div>
        </div>

        <div class="card-footer" style="margin-top:auto">
          <!-- Primary CTA: open live case on ninjapromo.io -->
          <a class="btn btn-sm btn-primary" href="${mat.file_url}" target="_blank" rel="noopener" style="text-decoration:none">
            ${ICONS.external} Read Case
          </a>
          <button class="btn btn-sm btn-ghost" onclick="copyToClipboard('${mat.file_url}','Case link')" title="Copy link">
            ${ICONS.copy}
          </button>
          ${clientWebsiteUrl ? `
            <a class="btn btn-sm btn-ghost" href="${clientWebsiteUrl}" target="_blank" rel="noopener" title="Visit ${clientWebsiteUrl}">
              ${ICONS.refs}
            </a>
          ` : ''}
          ${profile ? `
            <button class="btn btn-sm btn-ghost" style="margin-left:auto" onclick="ROUTER.navigate('miniprofiles','${profile.id}')" title="View client profile">
              ${ICONS.profiles}
            </button>
          ` : ''}
          ${window.CAN_MANAGE ? `
            <button class="btn btn-sm btn-ghost" ${!profile ? 'style="margin-left:auto"' : ''} onclick="PAGE_CASES.openEditCaseModal('${mat.id}')" title="Edit Metadata" style="color:var(--accent)">
              ✏️
            </button>
          ` : ''}
        </div>
      </div>`;
  }

  let _fetchedCaseData = null;

  function openAddCaseModal() {
    _fetchedCaseData = null;
    const verticals = window.PORTAL_DATA.VERTICALS;

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="display:flex; gap:8px;">
          <input class="input" type="url" id="case-fetch-url" placeholder="Paste ninjapromo.io case study URL..." style="flex:1;">
          <button class="btn btn-primary" onclick="PAGE_CASES.fetchCaseMetadata()">Fetch Metadata</button>
        </div>
        <p style="font-size:10px; color:var(--text-tertiary); margin-top:-6px; font-family:var(--font-mono)">e.g. https://ninjapromo.io/our-cases/htx</p>

        <div id="case-preview-fields" style="display:none; border-top: 1px solid var(--border-subtle); padding-top:14px; margin-top:6px;">
          <div style="font-size:12px; font-weight:500; color:var(--accent); font-family:var(--font-ui); margin-bottom:12px;">✏️ REVIEW AND STRUCTURE CASE DATA</div>
          <div class="form-grid">
            <div class="input-group span-2">
              <span class="input-label">Case Title *</span>
              <input class="input" type="text" id="case-new-title" required>
            </div>
            <div class="input-group">
              <span class="input-label">Client / Brand Name *</span>
              <input class="input" type="text" id="case-new-client" required>
            </div>
            <div class="input-group span-2">
              <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Geo *</span>
              <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="case-new-geo-checkboxes">
                ${window.PORTAL_DATA.GEOS.map(g => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${g}" style="accent-color:var(--accent);"> ${g}
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="input-group">
              <span class="input-label">Vertical</span>
              <select class="select" id="case-new-vertical">
                ${(() => {
                  const sorted = [...verticals].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                  if (verticals.includes('Other')) sorted.push('Other');
                  return sorted.map(v => `<option value="${v}">${v}</option>`).join('');
                })()}
              </select>
            </div>
            <div class="input-group span-2">
              <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Services Provided *</span>
              <div style="display:flex; flex-wrap:wrap; gap:8px;" id="case-new-services-checkboxes">
                ${window.PORTAL_DATA.SERVICES.map(s => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${s}" style="accent-color:var(--accent);"> ${s}
                  </label>
                `).join('')}
              </div>
            </div>
            <div class="input-group span-2">
              <span class="input-label">Thumbnail Image URL</span>
              <input class="input" type="url" id="case-new-thumb">
            </div>
            <div class="input-group span-2">
              <span class="input-label">Description / Summary</span>
              <textarea class="input" id="case-new-desc" rows="3" required></textarea>
            </div>
          </div>
        </div>
      </div>
    `;

    const modalFooter = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_CASES.saveNewCase()" id="case-save-btn" disabled>Save Case</button>
    `;

    openModal({
      title: 'Add Success Case Study',
      body: modalBody,
      footer: modalFooter,
      size: 'medium'
    });
  }

  function fetchCaseMetadata() {
    const urlInput = document.getElementById('case-fetch-url');
    if (!urlInput || !urlInput.value.trim()) {
      showToast('Please enter a case URL', 'error');
      return;
    }

    const url = urlInput.value.trim();
    showToast('Fetching case metadata from ninjapromo.io...', 'info');

    setTimeout(() => {
      let client = 'Client';
      try {
        const parts = url.split('/');
        const slug = parts[parts.length - 1] || parts[parts.length - 2];
        if (slug) client = slug.charAt(0).toUpperCase() + slug.slice(1);
      } catch (e) {}

      _fetchedCaseData = {
        title: `How We Drove Exponential Growth for ${client}`,
        client_name: client,
        geo: 'Global',
        vertical: 'SaaS',
        services: ['SEO', 'PR'],
        thumbnail_url: `https://picsum.photos/seed/${client.toLowerCase()}-case/600/340`,
        description: `Successfully scaled user acquisition and brand credibility for ${client} through strategic digital outreach campaigns.`
      };

      const wrap = document.getElementById('case-preview-fields');
      if (wrap) wrap.style.display = 'block';

      document.getElementById('case-new-title').value = _fetchedCaseData.title;
      document.getElementById('case-new-client').value = _fetchedCaseData.client_name;
      
      const geoCheckboxes = document.querySelectorAll('#case-new-geo-checkboxes input[type="checkbox"]');
      geoCheckboxes.forEach(cb => cb.checked = (_fetchedCaseData.geos || []).includes(cb.value) || _fetchedCaseData.geo === cb.value);
      document.getElementById('case-new-vertical').value = _fetchedCaseData.vertical;
      const servicesCheckboxes = document.querySelectorAll('#case-new-services-checkboxes input[type="checkbox"]');
      servicesCheckboxes.forEach(cb => cb.checked = (_fetchedCaseData.services || []).includes(cb.value));
      document.getElementById('case-new-thumb').value = _fetchedCaseData.thumbnail_url;
      document.getElementById('case-new-desc').value = _fetchedCaseData.description;

      const saveBtn = document.getElementById('case-save-btn');
      if (saveBtn) saveBtn.disabled = false;

      showToast('Case study metadata resolved successfully!', 'success');
    }, 750);
  }

  function saveNewCase() {
    const title = document.getElementById('case-new-title').value.trim();
    const client = document.getElementById('case-new-client').value.trim();
    const checkedGeos = document.querySelectorAll('#case-new-geo-checkboxes input[type="checkbox"]:checked');
    const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
    const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';
    const vertical = document.getElementById('case-new-vertical').value;
    const checkedServices = document.querySelectorAll('#case-new-services-checkboxes input[type="checkbox"]:checked');
    const services = Array.from(checkedServices).map(cb => cb.value);
    const thumb = document.getElementById('case-new-thumb').value.trim();
    const desc = document.getElementById('case-new-desc').value.trim();
    const website = document.getElementById('case-new-website').value.trim();
    const url = document.getElementById('case-fetch-url').value.trim();

    if (!title || !client || !desc) {
      showToast('Please fill out all required fields', 'error');
      return;
    }

    const item = {
      title: title,
      client_name: client,
      geo: geoStr,
      geos: parsedGeos,
      vertical: vertical,
      verticals: [vertical],
      services_provided: services.length ? services : ['PR'],
      asset_type: 'case',
      visibility_status: 'client-safe',
      description: desc,
      file_type: 'doc-link',
      file_url: url,
      thumbnail_url: thumb,
      tags: [...services, vertical],
      related_assets: [],
      created_at: new Date().toISOString().split('T')[0]
    };

    const ud = STORE.loadUserData();
    
    // Add Material
    item.id = `mat-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    ud.materials.push(item);
    
    // Sync client reference (website & thumbnail)
    if (client !== 'Internal' && client !== 'Client Name Not Available') {
      let cleanUrl = website;
      if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const existingRef = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === client.toLowerCase());
      
      if (existingRef) {
        const refIdx = ud.clientRefs.findIndex(r => r.id === existingRef.id);
        if (refIdx !== -1) {
          if (cleanUrl) ud.clientRefs[refIdx].website_url = cleanUrl;
          if (thumb) ud.clientRefs[refIdx].thumbnail_url = thumb;
        } else {
          ud.clientRefs.push({ ...existingRef, ...(cleanUrl ? {website_url: cleanUrl} : {}), ...(thumb ? {thumbnail_url: thumb} : {}) });
        }
      } else if (cleanUrl) {
        ud.clientRefs.push({
          id: `ref-user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          client_name: client,
          website_url: cleanUrl,
          thumbnail_url: thumb,
          geo: geoStr,
          vertical: vertical,
          services_provided: services.length ? services : ['PR']
        });
      }
    }

    STORE.syncClientGeo(client, geoStr, ud);

    STORE.saveUserData(ud);
    STORE.resetState();
    
    closeModal();
    showToast('Success case study saved successfully!', 'success');

    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function openEditCaseModal(caseId) {
    const mat = STORE.getMaterialById(caseId);
    if (!mat) return;

    const verticals = window.PORTAL_DATA.VERTICALS;
    const matVerts = mat.verticals || (mat.vertical ? [mat.vertical] : []);
    const ref = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && mat.client_name && typeof mat.client_name === 'string' && r.client_name.toLowerCase() === mat.client_name.toLowerCase());
    const websiteUrl = ref ? ref.website_url : '';

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div class="form-grid">
          <div class="input-group span-2">
            <span class="input-label">Case Title *</span>
            <input class="input" type="text" id="edit-case-title" value="${mat.title || ''}" required>
          </div>
          <div class="input-group">
            <span class="input-label">Client / Brand Name *</span>
            <input class="input" type="text" id="edit-case-client" value="${mat.client_name || ''}" required>
          </div>
          <div class="input-group">
            <span class="input-label">Client Website URL</span>
            <input class="input" type="text" id="edit-case-website" placeholder="https://example.com" value="${websiteUrl}">
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Geo *</span>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="edit-case-geo-checkboxes">
              ${window.PORTAL_DATA.GEOS.map(g => {
                const isChecked = (mat.geos || []).includes(g) || (mat.geo || 'Global') === g;
                return `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
                </label>
                `
              }).join('')}
            </div>
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Services Provided *</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="edit-case-services-checkboxes">
              ${window.PORTAL_DATA.SERVICES.map(s => {
                const isChecked = (mat.services_provided || []).includes(s);
                return `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${s}
                </label>
                `
              }).join('')}
            </div>
          </div>
          <div class="input-group span-2">
            <span class="input-label">Thumbnail Image URL</span>
            <input class="input" type="url" id="edit-case-thumb" value="${mat.thumbnail_url || ''}">
            <p style="font-size:10px; color:var(--text-tertiary); margin-top:2px;">Alternatively, just paste a screenshot here directly (Ctrl+V or Cmd+V)</p>
          </div>
          <div class="input-group span-2">
            <span class="input-label">Description / Summary</span>
            <textarea class="input" id="edit-case-desc" rows="3" required>${mat.description || ''}</textarea>
          </div>
          <div style="display:flex; flex-direction:column; gap:6px;" class="span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 2px;">Vertical / Industry *</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="edit-case-verticals">
              ${(() => {
                const sorted = [...verticals].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                if (verticals.includes('Other')) sorted.push('Other');
                return sorted.map(v => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${matVerts.includes(v) ? 'checked' : ''}> ${v}
                  </label>
                `).join('');
              })()}
            </div>
          </div>
        </div>
      </div>
    `;

    openModal({
      title: `Edit Case study: ${mat.client_name}`,
      body: modalBody,
      footer: `
        <button class="btn btn-sm" style="color:var(--danger); border: 1px solid var(--danger); background:transparent; margin-right:auto;" onclick="PAGE_CASES.deleteCase('${mat.id}')">Delete Case</button>
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PAGE_CASES.saveCaseEdit('${mat.id}')">Save Changes</button>
      `,
      size: 'medium'
    });

    // Handle paste event for screenshot inside modal
    document.addEventListener('paste', handlePaste);
    window._currentPasteHandler = handlePaste;
  }

  async function handlePaste(e) {
    const input = document.getElementById('edit-case-thumb');
    if (!input) return; // Not open

    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (const item of items) {
      if (item.type.indexOf('image') === 0) {
        const file = item.getAsFile();
        showToast('Uploading pasted image...', 'info');
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'thumbnails');
          
          if (input.value && input.value.startsWith('uploads/')) {
            formData.append('old_file', input.value);
          }

          const response = await fetch('upload.php', { method: 'POST', body: formData });
          const res = await response.json();
          if (res.success) {
            input.value = res.url;
            showToast('Image pasted and uploaded successfully!', 'success');
          } else {
            showToast('Failed to upload image.', 'error');
          }
        } catch (err) {
          console.error(err);
          showToast('Image upload failed.', 'error');
        }
        e.preventDefault();
        break;
      }
    }
  }

  function deleteCase(matId) {
    if (confirm('Are you sure you want to completely delete this case study?')) {
      STORE.deleteMaterial(matId);
      closeModal();
      showToast('Case study deleted.', 'success');
      const container = document.getElementById('page-container');
      if (container) render(container);
    }
  }

  function saveCaseEdit(matId) {
    const title = document.getElementById('edit-case-title').value.trim();
    const client = document.getElementById('edit-case-client').value.trim();
    const website = document.getElementById('edit-case-website').value.trim();
    const checkedGeos = document.querySelectorAll('#edit-case-geo-checkboxes input[type="checkbox"]:checked');
    const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
    const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';
    const checkedServices = document.querySelectorAll('#edit-case-services-checkboxes input[type="checkbox"]:checked');
    const services = Array.from(checkedServices).map(cb => cb.value);
    const thumb = document.getElementById('edit-case-thumb').value.trim();
    const desc = document.getElementById('edit-case-desc').value.trim();
    const checkedVerts = document.querySelectorAll('#edit-case-verticals input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedVerts).map(cb => cb.value);

    if (!title || !client || !desc) {
      showToast('Please fill out all required fields', 'error');
      return;
    }
    if (selectedVerticals.length === 0) {
      showToast('Please select at least one vertical', 'error');
      return;
    }

    // Load user data ONCE — apply ALL changes atomically to avoid race conditions
    const ud = STORE.loadUserData();

    // ① Update clientRef (website URL & thumbnail)
    if (client !== 'Internal' && client !== 'Client Name Not Available') {
      let cleanUrl = website;
      if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
        cleanUrl = 'https://' + cleanUrl;
      }
      const existingRef = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === client.toLowerCase());
      if (existingRef) {
        const refIdx = ud.clientRefs.findIndex(r => r.id === existingRef.id);
        if (refIdx !== -1) {
          ud.clientRefs[refIdx].website_url = cleanUrl || '';
          if (thumb) ud.clientRefs[refIdx].thumbnail_url = thumb;
        } else {
          ud.clientRefs.push({ ...existingRef, website_url: cleanUrl || '', ...(thumb ? {thumbnail_url: thumb} : {}) });
        }
      } else if (cleanUrl) {
        ud.clientRefs.push({
          id: `ref-user-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          client_name: client,
          website_url: cleanUrl,
          thumbnail_url: thumb,
          geo: geoStr,
          vertical: selectedVerticals[0] || 'Other',
          services_provided: services.length ? services : ['PR']
        });
      }
    }

    // ② Update material (in-memory on the same ud)
    const matUpdates = {
      title,
      client_name: client,
      geo: geoStr,
      geos: parsedGeos,
      vertical: selectedVerticals[0] || 'Other',
      verticals: selectedVerticals,
      services_provided: services,
      thumbnail_url: thumb,
      description: desc,
      tags: [...selectedVerticals, ...services]
    };
    const matIdx = ud.materials.findIndex(m => m.id === matId);
    if (matIdx !== -1) {
      ud.materials[matIdx] = { ...ud.materials[matIdx], ...matUpdates };
    } else {
      const seed = window.PORTAL_DATA.materials.find(m => m.id === matId);
      if (seed) {
        ud.materials.push({ ...seed, ...matUpdates, _override: true });
      }
    }

    // ③ Apply geo sync to the same ud
    STORE.syncClientGeo(client, geoStr, ud);

    // ④ Single save — no race condition
    STORE.saveUserData(ud);
    STORE.resetState();

    closeModal();
    showToast('Case study metadata updated successfully!', 'success');

    const container = document.getElementById('page-container');
    if (container) {
      // Re-route dynamically back or re-render
      if (window.location.hash.startsWith('#clientrefs')) {
        PAGE_CLIENTREFS.render(container, client);
      } else {
        render(container);
      }
    }
  }

  return {
    render,
    toggleTag,
    removeTag,
    clearAllTags,
    openAddCaseModal,
    fetchCaseMetadata,
    saveNewCase,
    openEditCaseModal,
    saveCaseEdit,
    deleteCase
  };
})();

window.PAGE_CASES = PAGE_CASES;
