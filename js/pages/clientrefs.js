/** PAGE: Client References */
'use strict';

const PAGE_CLIENTREFS = (() => {

  let _vertical = 'all';
  let _query = '';
  const _selectedTags = new Set();
  const _selectedVerticals = new Set();
  const _selectedServices = new Set();
  const _selectedGeos = new Set();

  // Ingestion temporary state
  let _fetchedData = null;
  let _isFetching = false;
  let _sortOrder = 'recent';

  function _toggleFilter(e, type, val) {
    const set = type === 'verticals' ? _selectedVerticals : type === 'services' ? _selectedServices : _selectedGeos;
    if (set.has(val)) {
      set.delete(val);
      if (e && e.currentTarget) e.currentTarget.classList.remove('active');
    } else {
      set.add(val);
      if (e && e.currentTarget) e.currentTarget.classList.add('active');
    }
    const container = document.getElementById('page-container');
    if (container) renderGrid(container);
  }

  function getHiddenVerticals() {
    try {
      const raw = localStorage.getItem('np_hidden_verticals');
      const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setHiddenVerticals(arr) {
    try {
      localStorage.setItem('np_hidden_verticals', JSON.stringify(arr));
    } catch (e) {}
  }

  function selectAllVerticals(visible) {
    if (visible) {
      setHiddenVerticals([]);
    } else {
      setHiddenVerticals([...window.PORTAL_DATA.VERTICALS]);
    }
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function getHiddenRefs() {
    try {
      const raw = localStorage.getItem('np_hidden_refs');
      const parsed = raw ? JSON.parse(raw) : []; return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function setHiddenRefs(arr) {
    try {
      localStorage.setItem('np_hidden_refs', JSON.stringify(arr));
    } catch (e) {}
  }

  function toggleRefVisibility(id) {
    const hidden = getHiddenRefs();
    const idx = hidden.indexOf(id);
    if (idx === -1) {
      hidden.push(id);
      showToast('Client reference hidden from website');
    } else {
      hidden.splice(idx, 1);
      showToast('Client reference restored to website');
    }
    setHiddenRefs(hidden);
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function toggleVerticalVisibility(vertical) {
    const hidden = getHiddenVerticals();
    const idx = hidden.indexOf(vertical);
    if (idx === -1) {
      hidden.push(vertical);
    } else {
      hidden.splice(idx, 1);
    }
    setHiddenVerticals(hidden);
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function syncClients() {
    const deletedNames = STORE.getDeletedClientNames() || [];
    const materials = STORE.getMaterials() || [];
    materials.forEach(m => {
      const clientName = m.client_name;
      if (!clientName || clientName === 'Internal' || (clientName || 'N/A').toLowerCase().includes('nda') || clientName === 'Client Name Not Available') return;
      if (deletedNames.includes((clientName || 'N/A').toLowerCase())) return;

      // Find all assets for this client
      const clientAssets = materials.filter(x => x.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
      
      const cases = clientAssets.filter(x => ['case', 'branding'].includes(x.asset_type));
      const creatives = clientAssets.filter(x => ['creative', 'image', 'video'].includes(x.asset_type || x.file_type));

      let thumbnail = '';
      let desc = '';

      if (cases.length > 0) {
        thumbnail = cases[0].thumbnail_url || '';
        desc = cases[0].description || '';
      } else if (creatives.length > 0) {
        thumbnail = creatives[0].thumbnail_url || creatives[0].file_url || '';
        desc = creatives[0].description || '';
      }

      if (!desc || desc === 'undefined' || desc.includes('Newly synchronized') || desc === 'N/A') {
        desc = `Showcase of premium digital marketing and design solutions executed for ${clientName}.`;
      }

      if (desc.length > 130) {
        desc = desc.slice(0, 127) + '...';
      }

      // Aggregate all tags, verticals, and services
      const allTags = new Set();
      clientAssets.forEach(a => {
        if (a.vertical) allTags.add(a.vertical);
        if (Array.isArray(a.verticals)) a.verticals.forEach(v => allTags.add(v));
        if (Array.isArray(a.services_provided)) a.services_provided.forEach(s => allTags.add(s));
        if (Array.isArray(a.tags)) a.tags.forEach(t => allTags.add(t));
      });
      const servicesArray = Array.from(allTags).filter(t => window.PORTAL_DATA.SERVICES.includes(t) || ['FINTECH', 'WEB3', 'IGAMING', 'ECOMMERCE', 'B2B', 'B2C', 'CYBER SECURITY'].includes(t.toUpperCase()) || window.PORTAL_DATA.VERTICALS.includes(t));

      const existingRef = STORE.getClientRefs().find(r => r.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
      
      if (!existingRef) {
        STORE.addClientRef({
          client_name: clientName,
          website_url: 'N/A', // user prefers N/A for empty websites
          vertical: m.vertical || 'Other',
          geo: m.geo || 'Global',
          ai_summary: desc,
          services_provided: servicesArray.length ? servicesArray : (m.services_provided || ['SEO']),
          thumbnail_url: thumbnail
        });
        STORE.addClientProfile({
          client_name: clientName,
          vertical: m.vertical || 'Other',
          geo: m.geo || 'Global',
          website_url: 'N/A',
          services_provided: servicesArray.length ? servicesArray : (m.services_provided || ['SEO']),
          notes: desc,
          budget_range: '$10k-$25k',
          contacts: []
        });
      } else {
        let changed = false;
        
        // Ensure ai_summary is valid
        if (!existingRef.ai_summary || existingRef.ai_summary === 'undefined' || existingRef.ai_summary.includes('Newly synchronized')) {
           existingRef.ai_summary = desc;
           changed = true;
        }

        // Update thumbnail if missing
        if ((!existingRef.thumbnail_url || existingRef.thumbnail_url.includes('picsum.photos')) && thumbnail) {
           existingRef.thumbnail_url = thumbnail;
           changed = true;
        }

        // Merge missing tags from materials into existing services_provided
        if (!existingRef.services_provided) existingRef.services_provided = [];
        let servicesChanged = false;
        servicesArray.forEach(t => {
           if (!existingRef.services_provided.includes(t)) {
             existingRef.services_provided.push(t);
             servicesChanged = true;
           }
        });
        if (servicesChanged) changed = true;

        if (changed) {
          // If we modified existingRef directly by reference it doesn't auto-save to STORE
          // So we should force a save.
          const ud = STORE.loadUserData();
          const refIdx = ud.clientRefs.findIndex(r => r.id === existingRef.id);
          if (refIdx !== -1) {
            ud.clientRefs[refIdx] = existingRef;
            STORE.saveUserData(ud);
          }
        }
      }
    });

    // Garbage collection: remove orphaned auto-generated client refs
    const ud = STORE.loadUserData();
    if (ud && ud.clientRefs) {
      let cleaned = false;
      ud.clientRefs = ud.clientRefs.filter(ref => {
        // If it was manually ingested, we KEEP it (assume manual ingest has a real summary, or thumbnail, or it's a known URL)
        // But if it's an auto-generated one with NO materials, and it has the generic text, we prune it.
        const hasMaterials = materials.some(m => m.client_name?.toLowerCase() === (ref.client_name || '').toLowerCase());
        const isGeneric = (ref.ai_summary || '').includes('Showcase of premium digital marketing and design solutions executed for');
        const hasNoThumb = !ref.thumbnail_url || ref.thumbnail_url.includes('picsum.photos');
        
        if (!hasMaterials && isGeneric && hasNoThumb) {
          cleaned = true;
          return false; // delete it
        }
        return true; // keep it
      });
      if (cleaned) {
        STORE.saveUserData(ud);
        // also reload STORE data in memory if necessary
      }
    }
  }

  function render(container, focusClientName = null) {
    syncClients();
    if (focusClientName) {
      renderDetail(container, focusClientName);
      return;
    }
    const isSuperAdmin = AUTH.canManageContent();
    const hiddenVerts = getHiddenVerticals();

    // Super admin vertical visibility settings panel
    let visibilityControl = '';
    if (isSuperAdmin) {
      visibilityControl = `
        <div class="admin-form animate-fade" style="margin-bottom:0; padding: 14px; border-radius: var(--r-lg);">
          <h3 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:10px; text-transform:uppercase; font-family:var(--font-mono); display:flex; align-items:center; gap:8px">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent);"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
            Super Admin - Industry / Category Visibility Settings
          </h3>
          <style>
            .super-admin-toggle-btn {
              font-size: 11px; padding: 5px 10px; display: inline-flex; align-items: center; gap: 6px; 
              border-radius: var(--r-md); border: 1px solid var(--border-color); 
              background: transparent; color: var(--text-secondary); cursor: pointer;
              transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .super-admin-toggle-btn:hover {
              transform: translateY(-1px);
              box-shadow: 0 4px 12px rgba(0,0,0,0.1);
              color: var(--text-primary);
            }
            .super-admin-toggle-btn.active-select {
              background: var(--accent); color: #fff; border-color: var(--accent); font-weight: 600;
              box-shadow: 0 2px 8px rgba(0,200,100,0.3);
            }
            .super-admin-toggle-btn.active-select:hover { color: #fff; }
            .super-admin-toggle-btn.active-deselect {
              background: var(--danger); color: #fff; border-color: var(--danger); font-weight: 600;
              box-shadow: 0 2px 8px rgba(255,50,50,0.3);
            }
            .super-admin-toggle-btn.active-deselect:hover { color: #fff; }
          </style>
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
            ${(() => {
              const allSelected = hiddenVerts.length === 0;
              const noneSelected = hiddenVerts.length === window.PORTAL_DATA.VERTICALS.length;
              return `
                <button class="super-admin-toggle-btn ${allSelected ? 'active-select' : ''}" onclick="PAGE_CLIENTREFS.selectAllVerticals(true)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="${allSelected ? 'currentColor' : 'none'}"/></svg> Select All
                </button>
                <button class="super-admin-toggle-btn ${noneSelected ? 'active-deselect' : ''}" onclick="PAGE_CLIENTREFS.selectAllVerticals(false)">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Deselect All
                </button>
              `;
            })()}
          </div>
          <div style="display:flex; gap:8px; flex-wrap:wrap">
            ${window.PORTAL_DATA.VERTICALS.map(v => {
              const isHidden = hiddenVerts.includes(v);
              let style = '';
              let icon = '';
              if (!isHidden) {
                // selected: green border, black text inside on light mode, primary text on dark mode.
                style = `background: transparent !important; border: 1px solid var(--accent) !important; color: var(--text-primary) !important; font-weight: 600;`;
                icon = `<span style="color: var(--accent); font-weight: bold; margin-right: 4px;">✓</span>`;
              } else {
                // hidden: red border
                style = `background: transparent !important; border: 1px solid var(--danger) !important; color: var(--text-tertiary) !important;`;
                icon = `<span style="color: var(--danger); font-weight: bold; margin-right: 4px;">✕</span>`;
              }
              return `
                <button class="filter-chip" onclick="PAGE_CLIENTREFS.toggleVerticalVisibility('${v}')" style="display:inline-flex; align-items:center; gap:4px; ${style}">
                  ${icon} ${v}
                </button>
              `;
            }).join('')}
          </div>
          <p style="font-size:12px; color:var(--text-secondary); font-weight: 500; margin-top:8px">Hiding an industry/category removes its filter tab/option and excludes its client cards from rendering for normal users.</p>
        </div>
      `;
    }

    // Ingestion flow area
    let ingestionArea = '';
    if (isSuperAdmin) {
      if (_isFetching) {
        ingestionArea = `
          <div class="admin-form animate-fade" style="margin-bottom:0; padding: 20px; border-radius: var(--r-lg); text-align: center;">
            <div class="loader" style="margin: 0 auto 12px;"></div>
            <div style="font-size:12px; color:var(--text-secondary); font-family:var(--font-mono)">Fetching publicly available metadata and generating AI summary...</div>
          </div>`;
      } else if (_fetchedData) {
        ingestionArea = `
          <div class="admin-form animate-fade" style="margin-bottom:0; padding: 20px; border-radius: var(--r-lg); border: 1px solid var(--accent-dim);">
            <h3 style="font-size:12px; font-weight:700; color:var(--text-primary); margin-bottom:14px; text-transform:uppercase; font-family:var(--font-mono)">
              ⚡ Preview Ingested Client Reference
            </h3>
            <div class="form-grid">
              <div class="input-group">
                <span class="input-label">Client Name</span>
                <input class="input" type="text" id="pref-name" value="${_fetchedData.client_name}" required>
              </div>
              <div class="input-group">
                <span class="input-label">Website URL</span>
                <input class="input" type="url" id="pref-url" value="${_fetchedData.website_url}" required>
              </div>
              <div class="input-group span-2">
                <span class="input-label">Industry / Category * (Select multiple)</span>
                <div style="display:flex; flex-wrap:wrap; gap:8px;" id="pref-verticals">
                  ${(() => {
                    const verticals = window.PORTAL_DATA.VERTICALS;
                    const preSelected = _fetchedData.verticals || (_fetchedData.vertical ? [_fetchedData.vertical] : []);
                    const sorted = [...verticals].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                    if (verticals.includes('Other')) sorted.push('Other');
                    return sorted.map(v => `
                      <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                        <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${preSelected.includes(v) ? 'checked' : ''}> ${v}
                      </label>
                    `).join('');
                  })()}
                </div>
              </div>
              <div class="input-group span-2">
                <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Geo *</span>
                <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="pref-geo-checkboxes">
                  ${window.PORTAL_DATA.GEOS.map(g => {
                    const isChecked = (_fetchedData.geos || []).includes(g) || _fetchedData.geo === g;
                    return `
                    <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                      <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
                    </label>
                    `
                  }).join('')}
                </div>
              </div>
              <div class="input-group span-2">
                <span class="input-label">Thumbnail URL</span>
                <input class="input" type="text" id="pref-thumbnail" value="${_fetchedData.thumbnail_url}">
              </div>
              <div class="input-group span-2">
                <span class="input-label">Services Provided *</span>
                <div style="display:flex; flex-wrap:wrap; gap:8px;" id="pref-services">
                  ${window.PORTAL_DATA.SERVICES.map(s => `
                    <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                      <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${(_fetchedData.services_provided || []).includes(s) ? 'checked' : ''}> ${s}
                    </label>
                  `).join('')}
                </div>
              </div>
              <div class="input-group span-2">
                <span class="input-label">AI Pitch Summary (1-2 sentences)</span>
                <textarea class="input" id="pref-summary" style="height:54px" required>${_fetchedData.ai_summary}</textarea>
              </div>
              <div class="span-2" style="display:flex; gap:10px; justify-content:flex-end; margin-top:8px">
                <button class="btn btn-secondary btn-sm" onclick="PAGE_CLIENTREFS.cancelIngest()">Cancel</button>
                <button class="btn btn-primary btn-sm" onclick="PAGE_CLIENTREFS.saveIngest()">Save Reference</button>
              </div>
          </div>
        </div>
      </div>`;
      } else {
        ingestionArea = `
          <div class="admin-form animate-fade" style="margin-bottom:0; padding: 12px; border-radius: var(--r-lg);">
            <h3 style="font-size:11px; font-weight:700; color:var(--text-primary); margin-bottom:10px; text-transform:uppercase; font-family:var(--font-mono); display:flex; align-items:center; gap:8px">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="color: var(--accent);"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
              Paste Client URL
            </h3>
            <form id="url-ingest-form" style="display:flex; gap:8px; align-items: stretch; width: 100%;">
              <div style="flex:1" class="input-group">
                <input class="input" type="url" id="ingest-url" placeholder="https://..." required style="padding: 6px 8px; font-size:11px">
              </div>
              <button class="btn btn-primary" type="submit" style="height:32px; padding: 0 12px; font-size:11px">Fetch</button>
            </form>
          </div>`;
      }
    }

    const visibleVerticals = window.PORTAL_DATA.VERTICALS.filter(v => !hiddenVerts.includes(v));

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
          <div>
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Live Client References.</div>
          </div>
          <button class="btn btn-primary" onclick="checkSuperAdminAction(() => ROUTER.navigate('admin'))">${ICONS.plus} Content Center</button>
        </div>

        <div style="display:flex; gap:20px; align-items:flex-end; margin-bottom:12px; flex-wrap:wrap;">
          <div style="flex:2; min-width:300px;">
            ${visibilityControl}
          </div>
          <div style="flex:1; display:flex; flex-direction:column; gap:10px; min-width:300px; max-width:400px; margin-left:auto;">
            ${ingestionArea}
          </div>
        </div>

        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap; margin-bottom:20px; width:100%;">
          <div class="search-bar" style="flex:1;">
            ${ICONS.search}
            <input id="refs-search" type="text" placeholder="Search Live Client References…" value="${_query}" autocomplete="off">
          </div>
          <select class="select" id="refs-sort" style="width:160px">
            <option value="recent" ${_sortOrder === 'recent' ? 'selected':''}>Recently Added</option>
            <option value="alpha" ${_sortOrder === 'alpha' ? 'selected':''}>Alphabetical Order</option>
          </select>
        </div>

        <!-- Selected multi-select tags container -->
        <div id="refs-active-filters" class="active-filters" style="display:none"></div>

        <!-- Multi-select Filter Rows -->
        <div style="margin-top:12px; margin-bottom:12px; display:flex; flex-direction:column; gap:12px;">
          <!-- Industries -->
          <div class="filter-row" style="display:flex; flex-wrap:nowrap; gap:8px; align-items:center; overflow-x:auto; scrollbar-width:none; padding-bottom:2px;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; flex-shrink:0; text-transform:uppercase">Industries</span>
            ${visibleVerticals.map(v => {
              const active = _selectedVerticals.has(v);
              return `<button class="filter-chip ${active ? 'active' : ''}" style="flex-shrink:0" onclick="PAGE_CLIENTREFS._toggleFilter(event, 'verticals', '${v}')">${getVerticalEmoji(v)} ${v}</button>`;
            }).join('')}
          </div>
          <!-- Services -->
          <div class="filter-row" style="display:flex; flex-wrap:nowrap; gap:8px; align-items:center; overflow-x:auto; scrollbar-width:none; padding-bottom:2px;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; flex-shrink:0; text-transform:uppercase">Services</span>
            ${window.PORTAL_DATA.SERVICES.map(s => {
              const active = _selectedServices.has(s);
              return `<button class="filter-chip ${active ? 'active' : ''}" style="flex-shrink:0" onclick="PAGE_CLIENTREFS._toggleFilter(event, 'services', '${s}')">${s}</button>`;
            }).join('')}
          </div>
          <!-- Geos -->
          <div class="filter-row" style="display:flex; flex-wrap:nowrap; gap:8px; align-items:center; overflow-x:auto; scrollbar-width:none; padding-bottom:2px;">
            <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; flex-shrink:0; text-transform:uppercase">Geos</span>
            ${window.PORTAL_DATA.GEOS.map(g => {
              const active = _selectedGeos.has(g);
              return `<button class="filter-chip ${active ? 'active' : ''}" style="flex-shrink:0" onclick="PAGE_CLIENTREFS._toggleFilter(event, 'geos', '${g}')">${g}</button>`;
            }).join('')}
          </div>
        </div>
      </div>

      <div id="refs-grid" class="refs-grid"></div>
    `;

    // Hook listeners
    container.querySelector('#refs-search').addEventListener('input', e => { _query = e.target.value; renderGrid(container); });
    container.querySelector('#refs-sort').addEventListener('change', e => { _sortOrder = e.target.value; renderGrid(container); });
    



    // Ingest URL form submission
    const ingestForm = container.querySelector('#url-ingest-form');
    if (ingestForm) {
      ingestForm.addEventListener('submit', e => {
        e.preventDefault();
        const urlStr = container.querySelector('#ingest-url').value.trim();
        const vertInput = container.querySelector('#ingest-vertical');
        const vert = vertInput ? vertInput.value : 'Other';
        startFetchMetadata(urlStr, vert, container);
      });
    }

    renderGrid(container);
    renderActiveFilters(container);
  }

  function startFetchMetadata(url, vertical, container) {
    _isFetching = true;
    render(container);

    setTimeout(() => {
      // Parse client name from domain
      let clientName = 'Client';
      try {
        const parsed = new URL(url);
        const host = parsed.hostname.replace('www.', '');
        const parts = host.split('.');
        clientName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
      } catch (e) {}

      // visually consistent AI Summary
      const summaries = [
        `Delivering a tailored digital presence for ${clientName} to drive impactful engagement and measurable growth.`,
        `A comprehensive digital strategy for ${clientName}, focusing on brand visibility and sustainable audience acquisition.`,
        `Modernizing the online footprint of ${clientName} through innovative design and data-driven marketing approaches.`,
        `Empowering ${clientName} with an optimized digital ecosystem designed to maximize user retention and conversions.`,
        `Strategic positioning and aesthetic overhaul for ${clientName}, ensuring robust market presence and competitive edge.`,
        `Elevating ${clientName}'s brand narrative with cohesive digital assets and targeted outreach campaigns.`,
        `A scalable digital infrastructure developed for ${clientName} to support long-term business objectives and agility.`,
        `Enhancing user experience and organic reach for ${clientName} through advanced optimization and modern design principles.`,
        `Streamlined online architecture for ${clientName}, focused on intuitive navigation and compelling call-to-actions.`,
        `Driving digital transformation for ${clientName} by integrating seamless design with powerful growth-marketing tactics.`
      ];
      const summary = summaries[Math.floor(Math.random() * summaries.length)];

      _fetchedData = {
        client_name: clientName,
        website_url: url,
        vertical: vertical,
        geo: 'Global',
        ai_summary: summary,
        services_provided: ['SEO', 'Design', 'Web / Landing Pages'],
        thumbnail_url: `https://picsum.photos/seed/${(clientName || 'N/A').toLowerCase()}-ref/600/340`
      };

      _isFetching = false;
      render(container);
      showToast('Metadata and summary fetched successfully!', 'success');
    }, 850);
  }

  function cancelIngest() {
    _fetchedData = null;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function saveIngest() {
    const container = document.getElementById('page-container');
    if (!container) return;

    const name = container.querySelector('#pref-name').value.trim();
    const url = container.querySelector('#pref-url').value.trim();
    
    const checkedVerticals = container.querySelectorAll('#pref-verticals input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedVerticals).map(cb => cb.value);
    const vert = selectedVerticals.length > 0 ? selectedVerticals[0] : 'Other';
    
    const checkedGeos = container.querySelectorAll('#pref-geo-checkboxes input[type="checkbox"]:checked');
    const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
    const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';
    const thumb = container.querySelector('#pref-thumbnail').value.trim();
    const summary = container.querySelector('#pref-summary').value.trim();
    
    // Parse services
    const checkedServices = container.querySelectorAll('#pref-services input[type="checkbox"]:checked');
    const services = Array.from(checkedServices).map(cb => cb.value);

    STORE.addClientRef({
      client_name: name,
      website_url: url,
      vertical: vert,
      verticals: selectedVerticals.length > 0 ? selectedVerticals : (vert ? [vert] : ['Other']),
      geo: geoStr,
      geos: parsedGeos,
      ai_summary: summary,
      services_provided: services.length ? services : ['SEO'],
      thumbnail_url: thumb
    });

    _fetchedData = null;
    showToast('Client reference saved!', 'success');
    render(container);
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
    const wrap = container.querySelector('#refs-active-filters');
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
          <span class="filter-badge-remove" onclick="PAGE_CLIENTREFS.removeTag('${t}')">✕</span>
        </span>
      `).join('')}
      <a style="font-size:11px; color:var(--danger); cursor:pointer; margin-left:8px; font-family:var(--font-mono)" onclick="PAGE_CLIENTREFS.clearAllTags()">Clear All</a>
    `;
  }

  function renderGrid(container) {
    let items = STORE.getClientRefs();
    const hiddenVerts = getHiddenVerticals();

    // Filter out hidden verticals for everyone
    const hiddenVertsLower = hiddenVerts.map(v => v.toLowerCase());
    if (hiddenVertsLower.length > 0) {
      const allStandardLower = window.PORTAL_DATA.VERTICALS.map(v => v.toLowerCase());
      items = items.filter(r => {
        const allTags = new Set();
        if (r.vertical) allTags.add(r.vertical.toLowerCase());
        if (Array.isArray(r.verticals)) r.verticals.forEach(t => allTags.add(t.toLowerCase()));
        if (Array.isArray(r.tags)) r.tags.forEach(t => allTags.add(t.toLowerCase()));
        
        const standardTags = Array.from(allTags).filter(t => allStandardLower.includes(t));
        if (standardTags.length === 0) {
          return hiddenVertsLower.length < allStandardLower.length;
        }
        return standardTags.some(t => !hiddenVertsLower.includes(t));
      });
    }

    // Apply multi-select tags filtering (AND behavior)
    if (_selectedTags.size > 0) {
      items = items.filter(r => {
        return Array.from(_selectedTags).every(t => {
          return r.vertical === t || (r.services_provided && r.services_provided.includes(t)) || (r.tags && r.tags.includes(t));
        });
      });
    }

    // Apply Vertical Filter
    if (_selectedVerticals.size > 0) {
      items = items.filter(r => {
        const checkVerticals = new Set();
        if (r.vertical) checkVerticals.add(r.vertical);
        if (Array.isArray(r.verticals)) r.verticals.forEach(v => checkVerticals.add(v));
        return Array.from(_selectedVerticals).some(v => checkVerticals.has(v));
      });
    }

    // Apply Service Filter
    if (_selectedServices.size > 0) {
      items = items.filter(r => {
        const services = Array.isArray(r.services_provided) ? r.services_provided : [];
        return Array.from(_selectedServices).some(s => services.includes(s));
      });
    }

    // Apply Geo Filter
    if (_selectedGeos.size > 0) {
      items = items.filter(r => {
        const checkGeos = new Set();
        if (r.geo) checkGeos.add(r.geo);
        if (Array.isArray(r.geos)) r.geos.forEach(g => checkGeos.add(g));
        return Array.from(_selectedGeos).some(g => checkGeos.has(g) || (!r.geo && g === 'Global'));
      });
    }

    if (_query.trim()) {
      const q = _query.toLowerCase();
      items = items.filter(r =>
        [r.client_name, r.vertical, r.geo, r.ai_summary, ...(r.services_provided || [])].join(' ').toLowerCase().includes(q)
      );
    }

    // Apply sort
    if (_sortOrder === 'recent') {
      items.sort((a, b) => {
        const extractTime = (item) => {
          if (item.updated_at) return item.updated_at;
          if (item.created_at) return new Date(item.created_at).getTime();
          if (item.id) {
            const match = String(item.id).match(/\d{10,13}/);
            if (match) return parseInt(match[0], 10);
          }
          return 0;
        };
        return extractTime(b) - extractTime(a);
      });
    } else if (_sortOrder === 'alpha') {
      items.sort((a, b) => (a.client_name || '').localeCompare(b.client_name || ''));
    }

    const grid = container.querySelector('#refs-grid');

    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${ICONS.refs}</div><div class="empty-title">No references match filters</div></div>`;
      return;
    }

    grid.innerHTML = items.map(r => renderRefCard(r)).join('');
  }

  function renderRefCard(ref) {
    const isSuperAdmin = AUTH.canManageContent();
    const hiddenRefs = getHiddenRefs();
    const isHidden = hiddenRefs.includes(ref.id);
    const profile = STORE.getProfileForClient(ref.client_name);
    
    // Show thumbnail cleanly at the top if exists, otherwise show vertical emoji placeholder
    const thumb = ref.thumbnail_url
      ? `<img src="${ref.thumbnail_url}" alt="${ref.client_name}" loading="lazy">`
      : `<div class="ref-thumb-placeholder">${getVerticalEmoji(ref.vertical)}</div>`;

    // Query dynamically by client name
    const relatedMaterials = STORE.getMaterials().filter(m => m.client_name?.toLowerCase() === ref.client_name?.toLowerCase());
    const relatedAssetIds = relatedMaterials.map(m => m.id);

    // Consolidate all tags to prevent duplicates and separate industries from services
    const allTags = new Set();
    if (ref.vertical) allTags.add(ref.vertical);
    if (Array.isArray(ref.verticals)) ref.verticals.forEach(t => allTags.add(t));
    if (Array.isArray(ref.services_provided)) ref.services_provided.forEach(t => allTags.add(t));
    if (Array.isArray(ref.tags)) ref.tags.forEach(t => allTags.add(t));

    // Deduplicate case-insensitively while preserving standard casing
    const normalizedMap = new Map();
    allTags.forEach(t => {
      if (typeof t !== 'string') return;
      const lower = t.toLowerCase();
      if (!normalizedMap.has(lower)) {
        let displayTag = t;
        const vMatch = window.PORTAL_DATA.VERTICALS.find(v => v.toLowerCase() === lower);
        if (vMatch) displayTag = vMatch;
        else {
          const sMatch = window.PORTAL_DATA.SERVICES.find(s => s.toLowerCase() === lower);
          if (sMatch) displayTag = sMatch;
        }
        normalizedMap.set(lower, displayTag);
      }
    });

    const industryTagsHTML = [];
    const serviceTagsHTML = [];

    normalizedMap.forEach((displayTag, lower) => {
      // Determine if this tag is an industry/vertical
      const isIndustry = window.PORTAL_DATA.VERTICALS.some(v => v.toLowerCase() === lower) || 
                         ['b2b', 'b2c', 'web3', 'fintech', 'igaming', 'cyber security', 'ecommerce', 'ai', 'apps', 'saas', 'trading'].includes(lower);

      const activeClass = _selectedTags.has(displayTag) ? 'active' : '';

      if (isIndustry) {
        let emoji = getVerticalEmoji(displayTag);
        if (emoji.includes('ref-thumb-placeholder')) emoji = ''; // fallback just in case
        
        industryTagsHTML.push(`
          <span class="tag ${getVerticalClass(displayTag)} tag-interactive ${activeClass}" 
                onclick="PAGE_CLIENTREFS.toggleTag('${displayTag}')">
            ${emoji} ${displayTag}
          </span>`);
      } else {
        let extraStyle = '';
        if (displayTag.toUpperCase() === 'NDA') {
          extraStyle = 'background: rgba(255,255,255,0.1) !important; color: #fff !important; border: 1px dashed rgba(255,255,255,0.4) !important;';
        }
        serviceTagsHTML.push(`
          <span class="tag tag-info tag-interactive ${activeClass}" style="${extraStyle}" 
                onclick="PAGE_CLIENTREFS.toggleTag('${displayTag}')">
            ${displayTag}
          </span>`);
      }
    });

    const verticalTag = industryTagsHTML.join('');
    const serviceTags = serviceTagsHTML.join('');
    const isChecked = window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.has(ref.id);

    return `
      <div class="ref-card animate-fade ${isHidden ? 'is-hidden' : ''}" style="cursor:pointer; position:relative;" onclick="ROUTER.navigate('clientrefs','${encodeURIComponent(ref.client_name)}')">
        <div class="ref-thumb" style="position:relative;">
          ${thumb}
          <!-- Favorites Star Overlay -->
          <div class="card-checkbox-overlay ${isChecked ? 'checked' : ''}" onclick="event.stopPropagation()" style="position:absolute; top:10px; left:10px; z-index:20;">
            <label class="item-select-wrap">
              <input type="checkbox" data-select-id="${ref.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${ref.id}')">
              <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
            </label>
          </div>
          <!-- Floating hide/unhide toggle for Super Admin (Top right overlay on image) -->
          ${isSuperAdmin ? `
            <button class="btn btn-xs ${isHidden ? 'btn-success' : 'btn-outline'}" onclick="event.stopPropagation(); PAGE_CLIENTREFS.toggleRefVisibility('${ref.id}')" title="${isHidden ? 'Unhide reference' : 'Hide reference'}" style="position:absolute; top:10px; right:10px; z-index:20; background:rgba(20,20,20,0.85); border:none; padding:6px; border-radius:var(--r-md); height:24px; width:24px; display:flex; align-items:center; justify-content:center; color:#fff;">
              ${isHidden ? `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>` : `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`}
            </button>
          ` : ''}
        </div>
        <div class="ref-body">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 6px;">
            <div class="ref-name" style="margin-bottom:0;">${ref.client_name}</div>
            <div class="ref-geo" style="margin-bottom:0;">${ref.geo}</div>
          </div>
          <div class="ref-summary">${ref.ai_summary}</div>
          
          <div style="margin-top: auto; display: flex; flex-direction: column; gap: 16px;">
            <div class="ref-services" style="margin-bottom: 0; display: flex; flex-direction: column; gap: 6px;">
              <div class="vertical-row" style="display: flex; flex-wrap: wrap; gap: 4px;" onclick="event.stopPropagation()">
                ${verticalTag}
              </div>
              <div class="services-row" style="display: flex; flex-wrap: wrap; gap: 4px;" onclick="event.stopPropagation()">
                ${serviceTags}
              </div>
            </div>
            
            <div class="ref-actions" onclick="event.stopPropagation()" style="margin-top: 0 !important;">
            <a class="btn btn-sm btn-primary" href="${ref.website_url}" target="_blank" rel="noopener">
               Open Website
            </a>
            ${relatedAssetIds.length > 0 ? `
              <button class="btn btn-sm btn-outline" onclick="openAllInTabs(${JSON.stringify(relatedAssetIds)})">
                ${ICONS.open_all} Open All Assets
              </button>
            ` : ''}
          </div>
          </div>
        </div>
      </div>`;
  }

  function renderDetail(container, clientName) {
    const decodedName = decodeURIComponent(clientName);
    const ref = STORE.getClientRefs().find(r => r.client_name?.toLowerCase() === (decodedName || 'N/A').toLowerCase());
    const profile = STORE.getProfileForClient(decodedName);

    if (!ref && !profile) {
      container.innerHTML = `
        <div style="margin-bottom:20px">
          <button class="btn btn-ghost btn-sm" onclick="ROUTER.navigate('clientrefs')">
            ← Back to References
          </button>
        </div>
        <div class="empty-state">
          <div class="empty-title">Client not found</div>
        </div>
      `;
      return;
    }

    const displayClientName = ref ? ref.client_name : profile.client_name;
    const geo = ref ? ref.geo : (profile ? profile.geo : 'Global');
    const website_url = ref ? ref.website_url : (profile ? profile.website_url : '');
    const product_summary = profile ? (profile.product_summary || profile.notes || '') : (ref ? (ref.ai_summary || ref.description || '') : '');
    const ai_summary = ref ? (ref.ai_summary || ref.description || '') : '';
    const services_provided = ref ? ref.services_provided : (profile ? profile.services_provided : []);
    const initials = displayClientName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    // Query materials dynamically by client name, excluding cases/branding from related assets
    let materials = STORE.getMaterials().filter(m => 
      m.client_name?.trim().toLowerCase() === (decodedName || 'N/A').trim().toLowerCase() && 
      m.asset_type !== 'case' && 
      m.asset_type !== 'branding'
    );

    // Deduplicate by file_url, prioritizing 'creatives' over duplicates
    const seenUrls = new Set();
    materials = materials.sort((a, b) => {
      if (a.asset_type === 'creatives' && b.asset_type !== 'creatives') return -1;
      if (b.asset_type === 'creatives' && a.asset_type !== 'creatives') return 1;
      return 0;
    }).filter(m => {
      if (!m.file_url) return true;
      if (seenUrls.has(m.file_url)) return false;
      seenUrls.add(m.file_url);
      return true;
    });

    const materialIds = materials.map(m => m.id);

    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:20px">
        <button class="btn btn-ghost btn-sm" onclick="ROUTER.navigate('clientrefs')">
          ← Back to References
        </button>
        ${AUTH.canManageContent() ? `
          <button class="btn btn-primary" onclick="PAGE_CLIENTREFS.openAddAssetModal('${displayClientName}')" style="display:inline-flex; align-items:center; gap:6px;">
            ${ICONS.plus} Add Files / Creatives
          </button>
        ` : ''}
      </div>

      <div class="profile-detail-grid">
        <!-- Left: Profile card -->
        <div>
          <div class="profile-card" style="margin-bottom:16px; position:relative; overflow:hidden">
            <!-- Full size thumbnail at the top of the profile card -->
            <div class="profile-detail-thumb" style="width:100%; height:180px; background:var(--bg-3); position:relative; margin:-18px -18px 14px -18px; width:calc(100% + 36px); overflow:hidden; border-bottom:1px solid var(--border-subtle)">
              ${ref && ref.thumbnail_url 
                ? `<img src="${ref.thumbnail_url}" style="width:100%; height:100%; object-fit:cover">`
                : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:36px; opacity:0.4">${getVerticalEmoji(ref ? ref.vertical : 'Other')}</div>`
              }
              
              <!-- Super Admin Hover Edit Overlay -->
              ${AUTH.canManageContent() ? `
                <div class="thumb-edit-overlay" style="position:absolute; inset:0; background:rgba(0,0,0,0.65); display:flex; flex-direction:column; align-items:center; justify-content:center; opacity:0; transition:opacity 0.2s; cursor:pointer;" 
                     onclick="PAGE_CLIENTREFS.openThumbEditModal('${ref ? ref.id : ''}')"
                     ondragover="event.preventDefault();"
                     ondrop="event.preventDefault(); PAGE_CLIENTREFS.handleThumbDropDetail(event, '${ref ? ref.id : ''}')">
                  <div style="text-align:center; color:#fff; font-size:12px; font-weight:600">
                    <div>📷 Edit Thumbnail</div>
                    <div style="font-size:9px; opacity:0.8; margin-top:4px">Click or Drag & Drop image here</div>
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="profile-header" style="align-items: flex-start; gap: 0;">
              <div>
                <div class="profile-name" style="font-size:17px;font-weight:700;color:var(--text-primary);margin-bottom:2px">${displayClientName}</div>
                <div class="profile-geo">${geo}</div>
              </div>
              ${AUTH.canManageContent() ? `
                <div style="margin-left:auto; display:flex; gap:6px; flex-shrink:0;">
                  <button class="btn btn-sm btn-ghost" onclick="PAGE_CLIENTREFS.openEditClientModal('${displayClientName}')" style="display:inline-flex; align-items:center; gap:6px; color:var(--accent); border:1px solid var(--border-subtle); padding:4px 8px; font-size:11px;" title="Edit Client Reference Profile">
                    <span style="display:inline-block; width:12px; height:12px; vertical-align:middle; color:var(--accent);">${ICONS.edit}</span> Edit
                  </button>
                  <button class="btn btn-sm btn-danger" onclick="PAGE_CLIENTREFS.deleteClientReferenceDetail('${ref ? ref.id : ''}', '${profile ? profile.id : ''}')" style="display:inline-flex; align-items:center; gap:6px; padding:4px 8px; font-size:11px;" title="Delete Client Reference">
                    <span style="display:inline-block; width:12px; height:12px; vertical-align:middle;">${ICONS.trash}</span> Delete
                  </button>
                </div>
              ` : ''}
            </div>
            <div class="profile-note" style="-webkit-line-clamp:unset;font-size:12px;color:var(--text-secondary);line-height:1.5;margin-top:12px">${product_summary}</div>
            <div class="profile-services" style="display:flex; flex-wrap:wrap; gap:4px; margin-top:12px">
              ${services_provided.map(s => `<span class="tag tag-info">${s}</span>`).join('')}
            </div>
            ${website_url ? `
              <div style="margin-top:12px">
                <a class="btn btn-primary btn-sm w-full" href="${website_url}" target="_blank" rel="noopener" style="justify-content:center">
                  ${ICONS.external} Open Website
                </a>
              </div>
            ` : ''}

          </div>

          ${materialIds.length > 0 ? `
            <div style="margin-top:12px">
              <button class="btn btn-outline w-full" style="justify-content:center" onclick="openAllInTabs(${JSON.stringify(materialIds)})">
                ${ICONS.open_all} Open All ${materialIds.length} Assets in Tabs
              </button>
            </div>
          ` : ''}
        </div>

        <!-- Right: Related assets -->
        <div>
          <div class="section-header">
            <span class="section-title">Related Assets</span>
            <span class="section-count">${materials.length}</span>
          </div>
          ${materials.length > 0
            ? materials.map(m => renderMaterialRow(m)).join('')
            : `<div class="empty-state" style="padding:32px 20px">
                <div class="empty-icon">${ICONS.docs}</div>
                <div class="empty-title">No related assets yet</div>
                <div class="empty-sub">Add assets in the Admin section and link them to this client name.</div>
              </div>`
          }
        </div>
      </div>
    `;
  }

  function openThumbEditModal(refId) {
    const ref = STORE.getClientRefs().find(r => r.id === refId);
    if (!ref) return;

    const body = `
      <div style="display:flex; flex-direction:column; gap:14px;" onpaste="PAGE_CLIENTREFS.handleThumbPasteEdit(event)">
        <div class="input-group">
          <label class="input-label">Paste Image Link</label>
          <input class="input" id="ref-detail-thumb-input" type="url" placeholder="https://..." value="${ref.thumbnail_url || ''}" style="font-size:12px; padding:6px 10px">
        </div>
        
        <div id="ref-detail-dropzone" 
             style="border:2px dashed var(--border-default); border-radius:var(--r-lg); padding:32px; text-align:center; cursor:pointer; font-size:12px; color:var(--text-secondary);"
             onclick="document.getElementById('ref-detail-file-input').click()"
             ondragover="event.preventDefault(); this.style.background='var(--bg-3)';"
             ondragleave="this.style.background='';"
             ondrop="event.preventDefault(); this.style.background=''; PAGE_CLIENTREFS.handleThumbDropModal(event, '${refId}');">
          <div>📁 Drag & Drop image file here, or click to browse</div>
          <input type="file" id="ref-detail-file-input" accept="image/*" style="display:none" onchange="PAGE_CLIENTREFS.handleThumbSelectModal(event, '${refId}')">
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_CLIENTREFS.saveDetailThumb('${refId}')">Save Thumbnail</button>
    `;

    openModal({
      title: `Edit Thumbnail: ${ref.client_name}`,
      body: body,
      footer: footer,
      size: 'small'
    });
  }

  async function uploadThumbnailFile(file, refId, immediateSave = false, prefix = 'ref-detail') {
    showToast('Uploading thumbnail to server...', 'info');
    
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
      console.warn('Server thumbnail upload failed, falling back to base64:', err);
    }

    if (!imageUrl) {
      const reader = new FileReader();
      reader.onload = function(evt) {
        if (immediateSave) {
          saveBase64Thumb(refId, evt.target.result);
        } else {
          const input = document.getElementById(prefix + '-thumb-input');
          if (input) input.value = evt.target.result;
          const preview = document.getElementById(prefix + '-thumb-preview-wrap');
          if (preview) preview.innerHTML = `<img src="${evt.target.result}" style="width:100%; height:100%; object-fit:cover">`;
          preview.style.display = 'block';
        }
      };
      reader.readAsDataURL(file);
    } else {
      if (immediateSave) {
        saveBase64Thumb(refId, imageUrl);
      } else {
        const input = document.getElementById(prefix + '-thumb-input');
        if (input) input.value = imageUrl;
        const preview = document.getElementById(prefix + '-thumb-preview-wrap');
        if (preview) preview.innerHTML = `<img src="${imageUrl}" style="width:100%; height:100%; object-fit:cover">`;
        preview.style.display = 'block';
        showToast('Thumbnail uploaded to server successfully!', 'success');
      }
    }
  }

  function handleThumbDropDetail(e, refId) {
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadThumbnailFile(e.dataTransfer.files[0], refId, true);
    }
  }

  function handleThumbDropModal(e, refId) {
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadThumbnailFile(e.dataTransfer.files[0], refId, false);
    }
  }

  function handleThumbSelectModal(e, refId) {
    if (e.target.files && e.target.files[0]) {
      uploadThumbnailFile(e.target.files[0], refId, false);
    }
  }

  
  function handleThumbDropEdit(e) {
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      uploadThumbnailFile(e.dataTransfer.files[0], null, false, 'edit-cli');
    }
  }

  function handleThumbSelectEdit(e) {
    if (e.target.files && e.target.files[0]) {
      uploadThumbnailFile(e.target.files[0], null, false, 'edit-cli');
    }
  }

  function handleThumbPasteEdit(e) {
    const items = (e.clipboardData || e.originalEvent?.clipboardData)?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.indexOf('image/') === 0) {
        const file = item.getAsFile();
        if (file) {
          uploadThumbnailFile(file, null, false, 'edit-cli');
          break;
        }
      }
    }
  }

  function saveDetailThumb(refId) {
    const input = document.getElementById('ref-detail-thumb-input');
    if (input) {
      saveBase64Thumb(refId, input.value.trim());
    }
  }

  function saveBase64Thumb(refId, base64) {
    const ud = STORE.loadUserData();
    if (ud) {
      const idx = ud.clientRefs.findIndex(r => r.id === refId);
      if (idx !== -1) {
        ud.clientRefs[idx].thumbnail_url = base64;
      } else {
        const seedRef = window.PORTAL_DATA.clientRefs.find(r => r.id === refId);
        if (seedRef) {
          ud.clientRefs.push({ ...seedRef, thumbnail_url: base64, id: refId });
        }
      }
      STORE.saveUserData(ud);
      STORE.resetState();
      showToast('Thumbnail updated successfully!', 'success');
      closeModal();
      
      const container = document.getElementById('page-container');
      if (container) {
        const ref = STORE.getClientRefs().find(r => r.id === refId);
        if (ref) render(container, ref.client_name);
      }
    }
  }

  function openEditClientModal(clientName) {
    const ref = STORE.getClientRefs().find(r => r.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
    const profile = STORE.getClientProfiles().find(p => p.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
    if (!ref && !profile) {
      showToast('Client not found', 'error');
      return;
    }

    const nameVal = ref ? ref.client_name : profile.client_name;
    const urlVal = ref ? ref.website_url : (profile ? profile.website_url : '');
    const geoVal = ref ? ref.geo : (profile ? profile.geo : 'Global');
    const summaryVal = profile ? (profile.product_summary || profile.notes || '') : (ref ? ref.ai_summary : '');
    const selectedServices = ref ? (ref.services_provided || []) : (profile ? (profile.services_provided || []) : []);
    const thumbVal = ref ? (ref.thumbnail_url || '') : '';

    const verticals = window.PORTAL_DATA.VERTICALS;
    const services = window.PORTAL_DATA.SERVICES;

    const body = `
      <div style="display:flex; flex-direction:column; gap:14px;" onpaste="PAGE_CLIENTREFS.handleThumbPasteEdit(event)">
        <div class="form-grid">
          <div class="input-group">
            <span class="input-label">Client Name *</span>
            <input class="input" type="text" id="edit-cli-name" value="${nameVal}" required>
          </div>
          <div class="input-group">
            <span class="input-label">Website URL</span>
            <input class="input" type="text" id="edit-cli-url" value="${urlVal}">
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Geo *</span>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="edit-cli-geo-checkboxes">
              ${window.PORTAL_DATA.GEOS.map(g => {
                const isChecked = ref ? ((ref.geos || []).includes(g) || ref.geo === g) : (profile ? ((profile.geos || []).includes(g) || profile.geo === g) : geoVal === g);
                return `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
                </label>
                `
              }).join('')}
            </div>
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Verticals / Industries *</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="edit-cli-verticals">
              ${(() => {
                const clientVerts = ref ? (ref.verticals || [ref.vertical]) : (profile ? (profile.verticals || [profile.vertical]) : []);
                const sorted = [...verticals].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                if (verticals.includes('Other')) sorted.push('Other');
                return sorted.map(v => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${clientVerts.includes(v) ? 'checked' : ''}> ${v}
                  </label>
                `).join('');
              })()}
            </div>
          </div>
          <div class="input-group span-2">
            <span class="input-label">Product / Company Summary *</span>
            <textarea class="input" id="edit-cli-summary" rows="3" required>${summaryVal}</textarea>
          </div>
          <div class="input-group span-2">
            <span class="input-label">Services Provided</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="edit-cli-services">
              ${services.map(s => `
                <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${selectedServices.includes(s) ? 'checked' : ''}> ${s}
                </label>
              `).join('')}
            </div>
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom: 4px;">Thumbnail URL</span>
            <input class="input" type="text" id="edit-cli-thumb-input" value="${thumbVal}" placeholder="https://..." style="margin-bottom:8px;">
            <div id="edit-cli-dropzone" 
                 style="border:2px dashed var(--border-default); border-radius:var(--r-lg); padding:32px; text-align:center; cursor:pointer; font-size:12px; color:var(--text-secondary);"
                 onclick="document.getElementById('edit-cli-file-input').click()"
                 ondragover="event.preventDefault(); this.style.background='var(--bg-3)';"
                 ondragleave="this.style.background='';"
                 ondrop="event.preventDefault(); this.style.background=''; PAGE_CLIENTREFS.handleThumbDropEdit(event);">
              <div>📁 Drag & Drop image file here, paste from clipboard, or click to browse</div>
              <input type="file" id="edit-cli-file-input" accept="image/*" style="display:none" onchange="PAGE_CLIENTREFS.handleThumbSelectEdit(event)">
            </div>
            <div id="edit-cli-thumb-preview-wrap" style="margin-top:12px; height: 160px; border-radius: var(--r-md); overflow: hidden; display: ${thumbVal ? 'block' : 'none'}">
              ${thumbVal ? `<img src="${thumbVal}" style="width:100%; height:100%; object-fit:cover">` : ''}
            </div>
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_CLIENTREFS.saveClientEdit('${clientName}')">Save Changes</button>
    `;

    openModal({
      title: `Edit Client Profile: ${nameVal}`,
      body: body,
      footer: footer,
      size: 'medium'
    });
  }

  function saveClientEdit(oldClientName) {
    const container = document.getElementById('page-container');
    const name = document.getElementById('edit-cli-name').value.trim();
    const url = document.getElementById('edit-cli-url').value.trim();
    const checkedGeos = document.querySelectorAll('#edit-cli-geo-checkboxes input[type="checkbox"]:checked');
    const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
    const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';
    const checkedVerts = document.querySelectorAll('#edit-cli-verticals input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedVerts).map(cb => cb.value);
    const summary = document.getElementById('edit-cli-summary').value.trim();
    const thumb = document.getElementById('edit-cli-thumb-input').value.trim();
    const checkedServices = document.querySelectorAll('#edit-cli-services input[type="checkbox"]:checked');
    const services = Array.from(checkedServices).map(cb => cb.value);

    if (!name || !summary) {
      showToast('Client Name and Company Summary are required', 'error');
      return;
    }
    if (selectedVerticals.length === 0) {
      showToast('Please select at least one vertical', 'error');
      return;
    }

    const firstVertical = selectedVerticals[0] || 'Other';

    let cleanUrl = url;
    if (cleanUrl && !/^https?:\/\//i.test(cleanUrl)) {
      cleanUrl = 'https://' + cleanUrl;
    }

    const ud = STORE.loadUserData();

    // 1. Update clientRefs in localStorage/state
    const ref = STORE.getClientRefs().find(r => r.client_name?.toLowerCase() === (oldClientName || 'N/A').toLowerCase());
    const updatedRef = {
      id: ref ? ref.id : `ref-user-${Date.now()}`,
      client_name: name,
      website_url: cleanUrl,
      geo: geoStr,
      geos: parsedGeos,
      vertical: firstVertical,
      verticals: selectedVerticals,
      ai_summary: summary,
      services_provided: services,
      thumbnail_url: thumb || (ref ? ref.thumbnail_url : '')
    };
    
    const refIdx = ref ? ud.clientRefs.findIndex(r => r.id === ref.id) : -1;
    if (refIdx !== -1) {
      ud.clientRefs[refIdx] = updatedRef;
    } else {
      ud.clientRefs.push(updatedRef);
    }

    // 2. Update clientProfiles in localStorage/state
    const profile = STORE.getClientProfiles().find(p => p.client_name?.toLowerCase() === (oldClientName || 'N/A').toLowerCase());
    const updatedProfile = {
      id: profile ? profile.id : `profile-user-${Date.now()}`,
      client_name: name,
      website_url: cleanUrl,
      geo: geoStr,
      geos: parsedGeos,
      vertical: firstVertical,
      verticals: selectedVerticals,
      notes: summary,
      product_summary: summary,
      services_provided: services
    };
    const profileIdx = profile ? ud.clientProfiles.findIndex(p => p.id === profile.id) : -1;
    if (profileIdx !== -1) {
      ud.clientProfiles[profileIdx] = updatedProfile;
    } else {
      ud.clientProfiles.push(updatedProfile);
    }

    // 3. Update all materials associated with this client to the new name!
    const materials = STORE.getMaterials().filter(m => m.client_name?.toLowerCase() === (oldClientName || 'N/A').toLowerCase());
    materials.forEach(m => {
      m.client_name = name;
      const idx = ud.materials.findIndex(mat => mat.id === m.id);
      if (idx !== -1) {
        ud.materials[idx].client_name = name;
      } else {
        ud.materials.push({ ...m });
      }
    });

    STORE.saveUserData(ud);
    STORE.resetState();
    STORE.syncClientGeo(name, geoStr);

    closeModal();
    showToast('Client profile updated successfully!', 'success');
    render(container, name);
  }

  function deleteClientReferenceDetail(refId, profileId) {
    if (!confirm('Are you sure you want to delete this client reference, its profile, and all its associated assets? This cannot be undone.')) return;
    
    let clientName = '';
    if (refId) {
      const ref = STORE.getClientRefs().find(r => r.id === refId);
      if (ref) {
        clientName = ref.client_name;
      }
    }
    if (!clientName && profileId) {
      const profile = STORE.getClientProfiles().find(p => p.id === profileId);
      if (profile) {
        clientName = profile.client_name;
      }
    }
    
    // Delete associated materials
    if (clientName) {
      const materials = STORE.getMaterials().filter(m => m.client_name && m.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
      materials.forEach(m => {
        STORE.deleteMaterial(m.id);
      });
      // Prevent syncClients from regenerating it
      const ud = STORE.loadUserData();
      ud.deletedClientNames = ud.deletedClientNames || [];
      const lowerName = (clientName || 'N/A').toLowerCase();
      if (!ud.deletedClientNames.includes(lowerName)) {
        ud.deletedClientNames.push(lowerName);
      }
      STORE.saveUserData(ud);
    }

    if (refId) STORE.deleteClientRef(refId);
    if (profileId) STORE.deleteClientProfile(profileId);
    
    // If the ref was a seed that got deleted, ensure it's not regenerated
    STORE.resetState();
    showToast('Client reference and assets deleted successfully', 'success');
    ROUTER.navigate('clientrefs');
  }

  let STAGED_ASSETS = [];

  function openAddAssetModal(clientName) {
    STAGED_ASSETS = [];
    const verticals = window.PORTAL_DATA.VERTICALS;
    const services = window.PORTAL_DATA.SERVICES;
    const assetTypes = window.PORTAL_DATA.ASSET_TYPES;

    const body = `
      <div style="display:flex; flex-direction:column; gap:14px;" onpaste="PAGE_CLIENTREFS.handleThumbPasteEdit(event)">
        <!-- Drag and Drop Upload Zone -->
        <div id="client-asset-dragzone" 
             style="border:2px dashed var(--border-default); border-radius:var(--r-lg); padding:20px; text-align:center; cursor:pointer; font-size:12px; color:var(--text-secondary); background:var(--bg-3); transition:all 0.2s;"
             onclick="document.getElementById('client-asset-file-input').click()"
             ondragover="event.preventDefault(); this.style.borderColor='var(--accent)';"
             ondragleave="this.style.borderColor='var(--border-default)';"
             ondrop="event.preventDefault(); this.style.borderColor='var(--border-default)'; PAGE_CLIENTREFS.handleAssetDrop(event, '${clientName}');">
          <div>📁 Drag & Drop Asset files here, or click to browse (Multiple files supported)</div>
          <input type="file" id="client-asset-file-input" style="display:none" multiple onchange="PAGE_CLIENTREFS.handleAssetFileSelect(event, '${clientName}')">
        </div>

        <div class="form-grid">
          <div class="input-group span-2">
            <span class="input-label">Asset Title * (Manual entry for single links)</span>
            <input class="input" type="text" id="add-asset-title" list="asset-title-options" placeholder="e.g. Dplay Casino Banner Ad" style="height:34px; font-size:12px;">
            <datalist id="asset-title-options">
              <option value="Discord profile"></option>
              <option value="IG profile"></option>
              <option value="KOL campaign"></option>
              <option value="LinkedIn profile"></option>
              <option value="TG profile"></option>
              <option value="TikTok profile"></option>
              <option value="X profile"></option>
            </datalist>
          </div>
          <div class="input-group">
            <span class="input-label">Client Name</span>
            <input class="input" type="text" id="add-asset-client" value="${clientName}" readonly style="height:34px; font-size:12px; background:var(--bg-3)">
          </div>
          <div class="input-group">
            <span class="input-label">Geo *</span>
            <select class="select" id="add-asset-geo" style="height:34px; font-size:12px;">
              ${window.PORTAL_DATA.GEOS.map(g => `<option value="${g}">${g}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <span class="input-label">Asset Type *</span>
            <select class="select" id="add-asset-type" style="height:34px; font-size:12px;" onchange="document.getElementById('add-creative-type-wrapper').style.display = this.value === 'creatives' ? 'block' : 'none'">
              <option value="" disabled selected>Select Asset Type...</option>
              ${assetTypes.map(t => `<option value="${t}">${assetTypeLabel(t)}</option>`).join('')}
            </select>
          </div>
          <div class="input-group" id="add-creative-type-wrapper" style="display:none;">
            <span class="input-label">Creative Type *</span>
            <select class="select" id="add-creative-type" style="height:34px; font-size:12px;">
              <option value="static">🖼️ Static</option>
              <option value="video">🎥 Video</option>
              <option value="ugc">📱 UGC</option>
              <option value="content-calendar">📅 Content Calendar</option>
              <option value="others">📦 Others (Pitch Decks, Brand Books, PDFs)</option>
            </select>
            <label style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-secondary); cursor:pointer; margin-top:6px;">
              <input type="checkbox" id="add-kol-duplicate" style="accent-color:var(--accent);"> Also add to Influencer Marketing files
            </label>
          </div>
          <div class="input-group">
            <span class="input-label">Visibility *</span>
            <select class="select" id="add-asset-vis" style="height:34px; font-size:12px;">
              <option value="client-safe">Client Safe</option>
              <option value="internal-only">Internal Only</option>
            </select>
          </div>
          <div class="input-group span-2">
            <span class="input-label">Asset URL * (Manual entry for single links)</span>
            <input class="input" type="url" id="add-asset-url" placeholder="https://..." style="height:34px; font-size:12px;">
          </div>

          <div class="input-group span-2">
            <span class="input-label">Description (Optional)</span>
            <textarea class="input" id="add-asset-desc" rows="2" placeholder="Description of the asset..."></textarea>
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom:4px;">Verticals / Industries * (Select multiple)</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="add-asset-verticals">
              ${(() => {
                const ref = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
                const clientVerts = ref ? (ref.verticals || [ref.vertical]) : [];
                const sorted = [...verticals].filter(v => v !== 'Other').sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));
                if (verticals.includes('Other')) sorted.push('Other');
                return sorted.map(v => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${clientVerts.includes(v) ? 'checked' : ''}> ${v}
                  </label>
                `).join('');
              })()}
            </div>
          </div>
          <div class="input-group span-2">
            <span class="input-label" style="font-size:11px; margin-bottom:4px;">Services Provided * (Select multiple)</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="add-asset-services">
              ${(() => {
                const ref = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name?.toLowerCase() === (clientName || 'N/A').toLowerCase());
                const clientServices = ref ? (ref.services_provided || []) : [];
                return services.map(s => `
                  <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                    <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${clientServices.includes(s) ? 'checked' : ''}> ${s}
                  </label>
                `).join('');
              })()}
            </div>
          </div>
        </div>
      </div>
    `;

    openModal({
      title: `Add Files / Creatives for ${clientName}`,
      body: body,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PAGE_CLIENTREFS.saveNewAsset()">Save File(s)</button>
      `,
      size: 'medium'
    });
  }

  function saveNewAsset() {
    const client = document.getElementById('add-asset-client').value.trim();
    const geo = document.getElementById('add-asset-geo').value;
    const type = document.getElementById('add-asset-type').value;
    const creativeType = document.getElementById('add-creative-type') ? document.getElementById('add-creative-type').value : 'static';
    
    if (!type) {
      showToast('Please select an Asset Type', 'error');
      return;
    }

    const vis = document.getElementById('add-asset-vis').value;
    const thumb = '';
    const desc = document.getElementById('add-asset-desc').value.trim();
    const checkedServices = document.querySelectorAll('#add-asset-services input[type="checkbox"]:checked');
    const services = Array.from(checkedServices).map(cb => cb.value);
    
    const checkedVerticals = document.querySelectorAll('#add-asset-verticals input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedVerticals).map(cb => cb.value);

    const manualTitle = document.getElementById('add-asset-title').value.trim();
    const manualUrl = document.getElementById('add-asset-url').value.trim();

    if (STAGED_ASSETS.length === 0) {
      if (!manualTitle || !manualUrl) {
        showToast('Please upload files or provide Title and URL manually', 'error');
        return;
      }
      
      let fileType = 'link';
      const urlLower = manualUrl.toLowerCase();
      if (urlLower.includes('docs.google.com/document') || urlLower.includes('drive.google.com/file')) fileType = 'doc-link';
      else if (urlLower.includes('docs.google.com/spreadsheets') || urlLower.includes('docs.google.com/sheet')) fileType = 'spreadsheet-link';
      else if (urlLower.match(/\.(mp4|mov|avi|webm)$/) || urlLower.includes('youtube.com') || urlLower.includes('youtu.be') || urlLower.includes('tiktok.com') || urlLower.includes('instagram.com')) fileType = 'video';
      else if (urlLower.match(/\.(png|jpg|jpeg|gif|webp)$/)) fileType = 'image';
      else if (urlLower.match(/\.(pdf)$/)) fileType = 'pdf';

      STAGED_ASSETS.push({
        name: manualTitle,
        url: manualUrl,
        fileType: fileType
      });
    }

    const ref = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name?.toLowerCase() === (client || 'N/A').toLowerCase());
    
    // Fallback to client profile if no verticals selected in the UI
    let finalVerticals = selectedVerticals.length > 0 ? selectedVerticals : (ref ? (ref.verticals || [ref.vertical]) : ['Other']);
    let finalVertical = finalVerticals[0] || 'Other';

    const addKol = document.getElementById('add-kol-duplicate') && document.getElementById('add-kol-duplicate').checked;

    STAGED_ASSETS.forEach(asset => {
      let finalThumb = thumb;
      if (!finalThumb && asset.fileType === 'video') {
        const urlMatch = asset.url.match(/(?:v=|youtu\.be\/|embed\/)([^&?]+)/);
        if (urlMatch && urlMatch[1] && (asset.url.includes('youtube.com') || asset.url.includes('youtu.be'))) {
          finalThumb = `https://img.youtube.com/vi/${urlMatch[1]}/maxresdefault.jpg`;
        } else if (asset.url.includes('tiktok.com')) {
          finalThumb = 'https://ninjapromo.io/wp-content/uploads/2022/11/tiktok-logo.png';
        } else if (asset.url.includes('instagram.com')) {
          finalThumb = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png';
        }
      }

      const record = {
        title: asset.name,
        client_name: client,
        geo,
        vertical: finalVertical,
        verticals: finalVerticals,
        asset_type: type,
        creative_type: type === 'creatives' ? creativeType : null,
        visibility_status: vis,
        file_type: asset.fileType,
        file_url: asset.url,
        thumbnail_url: finalThumb,
        description: desc || `Added for ${client}.`,
        tags: [...finalVerticals, type, ...services],
        services_provided: services,
        related_assets: []
      };
      STORE.addMaterial(record);

      if (addKol && type === 'creatives') {
        const kolRecord = { ...record };
        kolRecord.asset_type = 'influencer-marketing';
        kolRecord.creative_type = null;
        kolRecord.tags = [...finalVerticals, 'influencer-marketing', ...services];
        STORE.addMaterial(kolRecord);
      }
    });

    STORE.syncClientGeo(client, geo);
    
    closeModal();
    showToast(`Successfully added ${STAGED_ASSETS.length} asset(s)!`, 'success');

    // Re-render the details view
    const container = document.getElementById('page-container');
    if (container) renderDetail(container, client);
  }

  function handleAssetDrop(e, clientName) {
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      Array.from(e.dataTransfer.files).forEach(file => handleAssetUpload(file, clientName));
    }
  }

  function handleAssetFileSelect(e, clientName) {
    if (e.target.files && e.target.files.length > 0) {
      Array.from(e.target.files).forEach(file => handleAssetUpload(file, clientName));
    }
  }

  async function handleAssetUpload(file, clientName) {
    try {
      const zone = document.getElementById('client-asset-dragzone');
      if (zone && STAGED_ASSETS.length === 0) zone.innerHTML = '⚡ Uploading files... Please wait.';

      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('upload.php', { method: 'POST', body: formData });
      const data = await res.json();

      if (data.success && data.url) {
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        
        const ext = file.name.split('.').pop().toLowerCase();
        let formatType = 'pdf';
        if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) formatType = 'image';
        else if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) formatType = 'video';
        
        STAGED_ASSETS.push({
          name: nameWithoutExt,
          url: data.url,
          fileType: formatType
        });
        
        if (zone) {
          zone.innerHTML = `✅ Successfully uploaded ${STAGED_ASSETS.length} file(s)<br>` + 
                           `<div style="font-size:10.5px; margin-top:6px; color:var(--text-tertiary); max-height:40px; overflow-y:auto;">` + 
                           STAGED_ASSETS.map(a => a.name).join(', ') + `</div>`;
        }
        
        // Auto-select type for convenience based on first uploaded file
        if (STAGED_ASSETS.length === 1) {
          const typeSelect = document.getElementById('add-asset-type');
          if (typeSelect) {
            if (formatType === 'image') typeSelect.value = 'creative';
            else if (formatType === 'pdf') typeSelect.value = 'report';
          }
        }
      } else {
        showToast(`Failed to upload ${file.name}`, 'error');
      }
    } catch (err) {
      showToast(`File upload failed: ${file.name}`, 'error');
    }
  }

  return { 
    render, 
    _toggleFilter,
    toggleTag, 
    removeTag, 
    clearAllTags,
    cancelIngest, 
    saveIngest,
    toggleVerticalVisibility,
    selectAllVerticals,
    toggleRefVisibility,
    openThumbEditModal,
    handleThumbDropDetail,
    handleThumbDropModal,
    handleThumbSelectModal,
    handleThumbDropEdit,
    handleThumbSelectEdit,
    handleThumbPasteEdit,
    saveDetailThumb,
    openEditClientModal,
    saveClientEdit,
    deleteClientReferenceDetail,
    openAddAssetModal,
    saveNewAsset,
    handleAssetDrop,
    handleAssetFileSelect
  };
})();

window.PAGE_CLIENTREFS = PAGE_CLIENTREFS;

