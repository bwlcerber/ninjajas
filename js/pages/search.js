/** PAGE: Global Search */
'use strict';

const PAGE_SEARCH = (() => {

  let _query = '';
  let _mode = 'client'; // 'client' or 'internal'
  
  let _selectedVerticals = new Set();
  let _selectedServices = new Set();
  let _selectedGeos = new Set();
  let _selectedTypes = new Set();

  function render(container, opts = { mode: 'client' }) {
    _mode = opts.mode || 'client';
    const isInternal = _mode === 'internal';
    const hasFilters = _selectedVerticals.size > 0 || _selectedServices.size > 0 || _selectedGeos.size > 0 || _selectedTypes.size > 0;

    container.innerHTML = `
      <div class="page-header">
        <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:none; line-height:1.3; margin-top:0;">Search across all client-safe materials and references${isInternal ? ' as well as internal docs and profiles' : ''}.</div>
      </div>

      <div class="global-search-input-wrap">
        <div class="search-bar" style="padding:0 16px; position:relative; display:flex; align-items:center; width:100%">
          ${ICONS.search}
          <input
            type="text"
            id="global-search-input"
            class="global-search-input"
            placeholder="Search by client, service, vertical, asset type, tag, or title..."
            autocomplete="off"
            value="${_query}"
            style="flex:1; border:none; background:transparent; outline:none; padding:12px; font-size:16px;"
          />
          <button id="search-clear-btn" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:8px; display:${(_query || hasFilters) ? 'flex' : 'none'}; align-items:center; justify-content:center; margin-right:8px;" title="Reset all search & filters">
            ${ICONS.close}
          </button>
          <span class="topbar-search-kbd" style="margin-left:auto">⌘K</span>
        </div>
      </div>

      <!-- Advanced Filters (4 rows) -->
      <div id="advanced-filters" style="margin-top:16px; display:flex; flex-direction:column; gap:8px;">
        
        <!-- Row 1: Industries -->
        <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; text-transform:uppercase">Industries</span>
          ${window.PORTAL_DATA.VERTICALS.map(v => {
            const active = _selectedVerticals.has(v);
            return `<button class="filter-chip ${active ? 'active' : ''}" onclick="PAGE_SEARCH._toggleFilter('verticals', '${v}')">${getVerticalEmoji(v)} ${v}</button>`;
          }).join('')}
        </div>

        <!-- Row 2: Services -->
        <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; text-transform:uppercase">Services</span>
          ${window.PORTAL_DATA.SERVICES.map(s => {
            const active = _selectedServices.has(s);
            return `<button class="filter-chip ${active ? 'active' : ''}" onclick="PAGE_SEARCH._toggleFilter('services', '${s}')">${s}</button>`;
          }).join('')}
        </div>

        <!-- Row 3: Geos -->
        <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; text-transform:uppercase">Geos</span>
          ${window.PORTAL_DATA.GEOS.map(g => {
            const active = _selectedGeos.has(g);
            return `<button class="filter-chip ${active ? 'active' : ''}" onclick="PAGE_SEARCH._toggleFilter('geos', '${g}')">${g}</button>`;
          }).join('')}
        </div>

        <!-- Row 4: Asset Types -->
        <div class="filter-row" style="display:flex; flex-wrap:wrap; gap:6px; align-items:center;">
          <span style="font-size:11px; font-weight:bold; color:var(--text-tertiary); width:80px; text-transform:uppercase">Asset Types</span>
          ${window.PORTAL_DATA.ASSET_TYPES.map(a => {
            const active = _selectedTypes.has(a);
            return `<button class="filter-chip ${active ? 'active' : ''}" onclick="PAGE_SEARCH._toggleFilter('types', '${a}')">${assetTypeLabel(a)}</button>`;
          }).join('')}
        </div>

      </div>

      <div id="search-results-wrap" style="margin-top:24px"></div>
    `;

    const input = container.querySelector('#global-search-input');
    input.focus();
    // Position cursor at the end of text
    const val = input.value;
    input.value = '';
    input.value = val;

    input.addEventListener('input', (e) => {
      _query = e.target.value;
      updateClearButtonVisibility();
      renderResults(container.querySelector('#search-results-wrap'), _query);
    });

    const clearBtn = container.querySelector('#search-clear-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => {
        PAGE_SEARCH._clearAllFilters();
      });
    }

    function updateClearButtonVisibility() {
      if (clearBtn) {
        clearBtn.style.display = (_query || _selectedVerticals.size > 0 || _selectedServices.size > 0 || _selectedGeos.size > 0 || _selectedTypes.size > 0) ? 'flex' : 'none';
      }
    }

    renderResults(container.querySelector('#search-results-wrap'), _query);
  }

  function renderResults(wrap, q) {
    const hasFilters = _selectedVerticals.size > 0 || _selectedServices.size > 0 || _selectedGeos.size > 0 || _selectedTypes.size > 0;
    
    if ((!q || q.trim().length < 2) && !hasFilters) {
      wrap.innerHTML = `<div class="gsearch-empty" style="padding:20px 0; color:var(--text-secondary)">Start typing or select a filter above to search across all portal content.</div>`;
      return;
    }

    const results = search(q.trim());

    if (results.length === 0) {
      wrap.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">${ICONS.search}</div>
          <div class="empty-title">No results for matching search</div>
          <div class="empty-sub">Try adjusting your filters or search term.</div>
        </div>`;
      return;
    }

    const grouped = groupBy(results, 'resultType');

    let html = `
      <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px; margin-bottom:16px">
        <span class="text-secondary text-sm">${results.length} result${results.length !== 1 ? 's' : ''}</span>
        ${q ? `<span class="tag tag-accent">"${q}"</span>` : ''}
        ${hasFilters ? `<button class="text-btn" style="font-size:12px; color:var(--danger); background:none; border:none; cursor:pointer; padding:0 4px; margin-left:auto;" onclick="PAGE_SEARCH._clearAllFilters()">Clear all filters</button>` : ''}
      </div>`;

    const typeOrder = ['material', 'clientRef', 'clientProfile'];
    const typeLabels = { material: 'Materials', clientRef: 'Client References', clientProfile: 'Client Profiles' };

    typeOrder.forEach(type => {
      const items = grouped[type];
      if (!items || items.length === 0) return;

      html += `
        <div style="margin-bottom:20px">
          <div class="section-header">
            <span class="section-title">${typeLabels[type]}</span>
            <span class="section-count">${items.length}</span>
          </div>
          <div class="search-results-grid">
            ${items.map(r => renderSearchResult(r, q)).join('')}
          </div>
        </div>`;
    });

    wrap.innerHTML = html;
  }

  function renderSearchResult(r, q) {
    const typeMap = { material: 'Material', clientRef: 'Ref', clientProfile: 'Profile' };
    let title = '', sub = '', onClick = '';

    if (r.resultType === 'material') {
      title = r.title;
      sub = `${r.client_name} · ${r.vertical} · ${r.geo || ''} · ${assetTypeLabel(r.asset_type)}`;
      onClick = `openMaterial(STORE.getMaterialById('${r.id}'))`;
    } else if (r.resultType === 'clientRef') {
      title = r.client_name;
      sub = `${r.vertical} · ${r.geo || ''} · Client Reference`;
      onClick = `ROUTER.navigate('clientrefs','${encodeURIComponent(r.client_name)}')`;
    } else {
      title = r.client_name;
      sub = `${r.geo || ''} · ${(r.services_provided || []).join(', ')} · Mini Profile`;
      onClick = `ROUTER.navigate('clientrefs','${encodeURIComponent(r.client_name)}')`;
    }

    return `
      <div class="search-result-item" onclick="${onClick}">
        <span class="search-result-type">${typeMap[r.resultType]}</span>
        <div class="search-result-info">
          <div class="search-result-title">${highlight(title, q)}</div>
          <div class="search-result-sub">${highlight(sub, q)}</div>
        </div>
        ${r.resultType === 'material' ? `
          <div style="display:flex;gap:6px;flex-shrink:0">
            ${visibilityTag(r.visibility_status)}
            <span class="tag ${getVerticalClass(r.vertical)}" style="font-size:9px">${r.vertical}</span>
          </div>
        ` : `<span class="tag ${getVerticalClass(r.vertical)}">${r.vertical}</span>`}
      </div>`;
  }

  function _checkFilters(item) {
    if (_selectedVerticals.size > 0 && !_selectedVerticals.has(item.vertical)) return false;
    if (_selectedGeos.size > 0 && !_selectedGeos.has(item.geo)) return false;
    if (_selectedTypes.size > 0 && !_selectedTypes.has(item.asset_type)) return false;
    if (_selectedServices.size > 0) {
      const svcs = item.services_provided || [];
      const hasAnyService = svcs.some(s => _selectedServices.has(s));
      if (!hasAnyService) return false;
    }
    return true;
  }

  function search(q) {
    const lower = q ? q.toLowerCase() : '';
    const results = [];

    // Materials (client safe vs internal depending on mode)
    let mats = STORE.getMaterials();
    if (_mode !== 'internal') {
      mats = mats.filter(m => m.visibility_status === 'client-safe');
    }
    mats.forEach(m => {
      if (!_checkFilters(m)) return;
      
      let matchesText = true;
      if (lower) {
        const searchStr = [
          m.title, m.client_name, m.geo, m.vertical,
          m.asset_type, m.description, m.visibility_status,
          ...(m.services_provided || []),
          ...(m.tags || [])
        ].join(' ').toLowerCase();
        matchesText = searchStr.includes(lower);
      }
      if (matchesText) results.push({ ...m, resultType: 'material' });
    });

    // Client refs
    STORE.getClientRefs().forEach(r => {
      if (!_checkFilters(r)) return;

      let matchesText = true;
      if (lower) {
        const searchStr = [
          r.client_name, r.geo, r.vertical,
          r.ai_summary, r.website_url,
          ...(r.services_provided || [])
        ].join(' ').toLowerCase();
        matchesText = searchStr.includes(lower);
      }
      if (matchesText) results.push({ ...r, resultType: 'clientRef' });
    });

    // Client profiles
    if (_mode === 'internal') {
      STORE.getClientProfiles().forEach(p => {
        if (!_checkFilters(p)) return;

        let matchesText = true;
        if (lower) {
          const searchStr = [
            p.client_name, p.geo, p.product_summary,
            ...(p.services_provided || [])
          ].join(' ').toLowerCase();
          matchesText = searchStr.includes(lower);
        }
        if (matchesText) results.push({ ...p, resultType: 'clientProfile' });
      });
    }

    return results;
  }

  function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
      (acc[item[key]] = acc[item[key]] || []).push(item);
      return acc;
    }, {});
  }

  function _toggleFilter(category, term) {
    let set;
    if (category === 'verticals') set = _selectedVerticals;
    if (category === 'services') set = _selectedServices;
    if (category === 'geos') set = _selectedGeos;
    if (category === 'types') set = _selectedTypes;

    if (set.has(term)) {
      set.delete(term);
    } else {
      set.add(term);
    }
    const container = document.getElementById('page-container');
    if (container) {
      render(container, { mode: _mode });
    }
  }

  function _clearAllFilters() {
    _query = '';
    _selectedVerticals.clear();
    _selectedServices.clear();
    _selectedGeos.clear();
    _selectedTypes.clear();
    const container = document.getElementById('page-container');
    if (container) {
      render(container, { mode: _mode });
    }
  }

  return { render, _toggleFilter, _clearAllFilters };
})();

window.PAGE_SEARCH = PAGE_SEARCH;
