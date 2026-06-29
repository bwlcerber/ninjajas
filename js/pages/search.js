/** PAGE: Global Search */
'use strict';

const PAGE_SEARCH = (() => {

  let _query = '';
  let _mode = 'client'; // 'client' or 'internal'
  let _activeFilters = [];

  function render(container, opts = { mode: 'client' }) {
    _mode = opts.mode || 'client';
    const isInternal = _mode === 'internal';

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
          <button id="search-clear-btn" style="background:none; border:none; color:var(--text-secondary); cursor:pointer; padding:8px; display:${(_query || _activeFilters.length > 0) ? 'flex' : 'none'}; align-items:center; justify-content:center; margin-right:8px;" title="Reset all search & filters">
            ${ICONS.close}
          </button>
          <span class="topbar-search-kbd" style="margin-left:auto">⌘K</span>
        </div>
      </div>

      <!-- Active Filters Bar -->
      <div id="active-filters-bar" style="margin-top:12px; display:${_activeFilters.length > 0 ? 'flex' : 'none'}; flex-wrap:wrap; gap:8px; align-items:center;">
        <span class="text-secondary text-sm" style="font-size:13px">Active filters:</span>
        ${_activeFilters.map(f => `
          <span class="tag tag-accent" style="display:inline-flex; align-items:center; gap:4px; padding:4px 8px; border-radius:12px; font-size:13px; cursor:pointer" onclick="PAGE_SEARCH._toggleFilter('${f}')">
            ${f} <span style="font-weight:bold; font-size:11px; opacity:0.7">✕</span>
          </span>
        `).join('')}
        <button class="text-btn" style="font-size:12px; color:var(--danger); background:none; border:none; cursor:pointer; padding:0 4px;" onclick="PAGE_SEARCH._clearAllFilters()">Clear all</button>
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
        _query = '';
        _activeFilters = [];
        input.value = '';
        updateClearButtonVisibility();
        const filtersBar = container.querySelector('#active-filters-bar');
        if (filtersBar) {
          filtersBar.style.display = 'none';
        }
        renderResults(container.querySelector('#search-results-wrap'), '');
      });
    }

    function updateClearButtonVisibility() {
      if (clearBtn) {
        clearBtn.style.display = (_query || _activeFilters.length > 0) ? 'flex' : 'none';
      }
    }

    if (_query || _activeFilters.length > 0) {
      renderResults(container.querySelector('#search-results-wrap'), _query);
    } else {
      renderDefault(container.querySelector('#search-results-wrap'));
    }
  }

  function renderDefault(wrap) {
    const verticals = window.PORTAL_DATA.VERTICALS;
    const services = window.PORTAL_DATA.SERVICES;
    wrap.innerHTML = `
      <div class="search-filters-container" style="display:grid; grid-template-columns:1fr 1fr; gap:24px; margin-top:16px;">
        <!-- Vertical Column -->
        <div class="filter-group-card" style="background:var(--bg-2); border:1px solid var(--border-default); border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.02)">
          <div class="divider-label" style="margin-bottom:16px; border-bottom:2px solid var(--accent, #3de892); padding-bottom:8px; font-weight:bold; color:var(--text-primary)">
            <span style="font-size:15px; letter-spacing:0.05em; text-transform:uppercase">Browse by Industry / Category</span>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px">
            ${verticals.map(v => {
              const isActive = _activeFilters.includes(v);
              return `
                <button class="filter-chip ${isActive ? 'active' : ''}" 
                        style="padding:8px 14px; border-radius:8px; border:${isActive ? '1.5px solid var(--accent)' : '1.5px solid var(--border-default)'}; background:${isActive ? 'var(--accent-dim)' : 'var(--bg-3)'}; color:${isActive ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-weight:${isActive ? '700' : '500'}; display:flex; align-items:center; gap:6px; transition:all 0.2s; font-size:13px;"
                        onclick="PAGE_SEARCH._toggleFilter('${v}')">
                  ${getVerticalEmoji(v)} ${v}
                </button>`;
            }).join('')}
          </div>
        </div>

        <!-- Service Column -->
        <div class="filter-group-card" style="background:var(--bg-2); border:1px solid var(--border-default); border-radius:12px; padding:20px; box-shadow:0 2px 8px rgba(0,0,0,0.02)">
          <div class="divider-label" style="margin-bottom:16px; border-bottom:2px solid var(--info, #3990e0); padding-bottom:8px; font-weight:bold; color:var(--text-primary)">
            <span style="font-size:15px; letter-spacing:0.05em; text-transform:uppercase">Browse by Service</span>
          </div>
          <div style="display:flex; flex-wrap:wrap; gap:8px">
            ${services.map(s => {
              const isActive = _activeFilters.includes(s);
              return `
                <button class="filter-chip ${isActive ? 'active' : ''}" 
                        style="padding:8px 14px; border-radius:8px; border:${isActive ? '1.5px solid var(--accent)' : '1.5px solid var(--border-default)'}; background:${isActive ? 'var(--accent-dim)' : 'var(--bg-3)'}; color:${isActive ? 'var(--accent)' : 'var(--text-secondary)'}; cursor:pointer; font-weight:${isActive ? '700' : '500'}; display:flex; align-items:center; gap:6px; transition:all 0.2s; font-size:13px;"
                        onclick="PAGE_SEARCH._toggleFilter('${s}')">
                  ${s}
                </button>`;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  function renderResults(wrap, q) {
    if ((!q || q.trim().length < 2) && _activeFilters.length === 0) {
      renderDefault(wrap);
      return;
    }

    const results = search(q.trim(), _activeFilters);

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
        <span class="text-secondary text-sm">${results.length} result${results.length !== 1 ? 's' : ''} for</span>
        ${q ? `<span class="tag tag-accent">"${q}"</span>` : ''}
        ${_activeFilters.map(f => `
          <span class="tag tag-accent" style="display:inline-flex; align-items:center; gap:4px; cursor:pointer" onclick="PAGE_SEARCH._toggleFilter('${f}')">
            ${f} ✕
          </span>
        `).join('')}
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
      sub = `${r.client_name} · ${r.vertical} · ${r.geo} · ${assetTypeLabel(r.asset_type)}`;
      onClick = `openMaterial(STORE.getMaterialById('${r.id}'))`;
    } else if (r.resultType === 'clientRef') {
      title = r.client_name;
      sub = `${r.vertical} · ${r.geo} · Client Reference`;
      onClick = `ROUTER.navigate('clientrefs','${encodeURIComponent(r.client_name)}')`;
    } else {
      title = r.client_name;
      sub = `${r.geo} · ${r.services_provided.join(', ')} · Mini Profile`;
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

  function search(q, filters) {
    const lower = q.toLowerCase();
    const results = [];

    // Materials (client safe vs internal depending on mode)
    let mats = STORE.getMaterials();
    if (_mode !== 'internal') {
      mats = mats.filter(m => m.visibility_status === 'client-safe');
    }
    mats.forEach(m => {
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

      let matchesFilters = true;
      if (filters && filters.length > 0) {
        matchesFilters = filters.every(f => {
          const fLower = f.toLowerCase();
          const list = [
            m.vertical,
            ...(m.services_provided || []),
            ...(m.tags || [])
          ].map(x => x.toLowerCase());
          return list.includes(fLower);
        });
      }

      if (matchesText && matchesFilters) {
        results.push({ ...m, resultType: 'material' });
      }
    });

    // Client refs
    STORE.getClientRefs().forEach(r => {
      let matchesText = true;
      if (lower) {
        const searchStr = [
          r.client_name, r.geo, r.vertical,
          r.ai_summary, r.website_url,
          ...(r.services_provided || [])
        ].join(' ').toLowerCase();
        matchesText = searchStr.includes(lower);
      }

      let matchesFilters = true;
      if (filters && filters.length > 0) {
        matchesFilters = filters.every(f => {
          const fLower = f.toLowerCase();
          const list = [
            r.vertical,
            ...(r.services_provided || [])
          ].map(x => x.toLowerCase());
          return list.includes(fLower);
        });
      }

      if (matchesText && matchesFilters) {
        results.push({ ...r, resultType: 'clientRef' });
      }
    });

    // Client profiles
    if (_mode === 'internal') {
      STORE.getClientProfiles().forEach(p => {
        let matchesText = true;
        if (lower) {
          const searchStr = [
            p.client_name, p.geo, p.product_summary,
            ...(p.services_provided || [])
          ].join(' ').toLowerCase();
          matchesText = searchStr.includes(lower);
        }

        let matchesFilters = true;
        if (filters && filters.length > 0) {
          matchesFilters = filters.every(f => {
            const fLower = f.toLowerCase();
            const list = [
              p.vertical || '',
              ...(p.services_provided || [])
            ].map(x => x.toLowerCase());
            return list.includes(fLower);
          });
        }

        if (matchesText && matchesFilters) {
          results.push({ ...p, resultType: 'clientProfile' });
        }
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

  function _quickSearch(term) {
    const idx = _activeFilters.indexOf(term);
    if (idx === -1) {
      _activeFilters.push(term);
    }
    const container = document.getElementById('page-container');
    if (container) {
      render(container, { mode: _mode });
    }
  }

  function _toggleFilter(term) {
    const idx = _activeFilters.indexOf(term);
    if (idx > -1) {
      _activeFilters.splice(idx, 1);
    } else {
      _activeFilters.push(term);
    }
    const container = document.getElementById('page-container');
    if (container) {
      render(container, { mode: _mode });
    }
  }

  function _clearAllFilters() {
    _activeFilters = [];
    const container = document.getElementById('page-container');
    if (container) {
      render(container, { mode: _mode });
    }
  }

  return { render, _quickSearch, _toggleFilter, _clearAllFilters };
})();

window.PAGE_SEARCH = PAGE_SEARCH;
