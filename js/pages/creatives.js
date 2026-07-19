/** PAGE: Creatives */
'use strict';

const PAGE_CREATIVES = (() => {

  const _selectedVerticals = new Set(['all']);
  let _selectedType = 'all';

  function getCreativeType(m) {
    if (m.creative_type) return m.creative_type;
    const title = (m.title || '').toLowerCase();
    const desc = (m.description || '').toLowerCase();
    const tags = (m.tags || []).map(t => t.toLowerCase());
    const fileType = (m.file_type || '').toLowerCase();
    const assetType = (m.asset_type || '').toLowerCase();

    if (tags.includes('ugc') || title.includes('ugc') || desc.includes('ugc')) {
      return 'ugc';
    }
    if (title.includes('calendar') || desc.includes('calendar') || tags.includes('calendar') || tags.includes('content-calendar')) {
      return 'content-calendar';
    }
    if (fileType === 'video' || fileType === 'mp4' || assetType === 'video') {
      return 'video';
    }
    if (fileType === 'image' || fileType === 'png' || fileType === 'jpg' || fileType === 'jpeg' || assetType === 'image') {
      return 'static';
    }
    return 'others';
  }

  function toggleTypeFilter(type) {
    _selectedType = type;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function getHiddenCreatives() {
    try {
      const raw = localStorage.getItem('np_hidden_creatives');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function toggleVerticalFilter(vertical) {
    if (vertical === 'all') {
      _selectedVerticals.clear();
      _selectedVerticals.add('all');
    } else {
      _selectedVerticals.delete('all');
      if (_selectedVerticals.has(vertical)) {
        _selectedVerticals.delete(vertical);
      } else {
        _selectedVerticals.add(vertical);
      }
      if (_selectedVerticals.size === 0) {
        _selectedVerticals.add('all');
      }
    }
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function setViewMode(mode) {
    localStorage.setItem('np_creatives_view_mode', mode);
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function render(container) {
    const activeViewMode = localStorage.getItem('np_creatives_view_mode') || 'medium';
    const hiddenList = getHiddenCreatives();
    const allCreatives = STORE.getMaterials().filter(m => {
      const hiddenList = getHiddenCreatives();
      if (!window.CAN_MANAGE && hiddenList.includes(m.id)) return false;
      const type = getCreativeType(m);
      
      const creativeTypes = ['creative', 'creatives', 'video', 'image'];
      const isCreativeRel = creativeTypes.includes(m.asset_type);
      
      const isContentCal = type === 'content-calendar';
      const isOthersMatch = type === 'others' && (m.asset_type === 'creative' || m.asset_type === 'creatives');
      return isCreativeRel || isContentCal || isOthersMatch;
    });

    const extractTime = (item) => {
      if (item.updated_at) return new Date(item.updated_at).getTime();
      if (item.created_at) return new Date(item.created_at).getTime();
      if (item.id) {
        const match = String(item.id).match(/\d{10,13}/);
        if (match) return parseInt(match[0], 10);
      }
      return 0;
    };
    allCreatives.sort((a, b) => extractTime(b) - extractTime(a));

    const verticals = window.PORTAL_DATA.VERTICALS;

    // Group by vertical (supporting display-level duplication for assets in multiple verticals)
    const grouped = {};
    verticals.forEach(v => {
      const items = allCreatives.filter(m => {
        if (m.verticals && Array.isArray(m.verticals)) {
          return m.verticals.includes(v);
        }
        return m.vertical === v;
      });
      if (items.length > 0) grouped[v] = items;
    });

    // Filter grouped categories based on selection
    const renderedGroups = {};
    Object.entries(grouped).forEach(([vertical, items]) => {
      if (_selectedVerticals.has('all') || _selectedVerticals.has(vertical)) {
        const filteredItems = items.filter(m => {
          if (_selectedType === 'all') return true;
          return getCreativeType(m) === _selectedType;
        });
        if (filteredItems.length > 0) {
          renderedGroups[vertical] = filteredItems;
        }
      }
    });

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row" style="align-items: center;">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Visual advertising and creative design showcases.</div>
          <div style="display:flex; gap:8px; align-items:center;">
            <!-- View Mode Switcher -->
            <div class="view-mode-switcher" style="display:inline-flex; background:var(--bg-3); border:1px solid var(--border-subtle); border-radius:var(--r-md); padding:2px; margin-right:8px;">
              <button class="view-mode-btn ${activeViewMode === 'list' ? 'active' : ''}" onclick="PAGE_CREATIVES.setViewMode('list')" title="List View" style="background:transparent; border:none; color:var(--text-secondary); width:28px; height:28px; border-radius:var(--r-sm); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>
              </button>
              <button class="view-mode-btn ${activeViewMode === 'small' ? 'active' : ''}" onclick="PAGE_CREATIVES.setViewMode('small')" title="Small Grid" style="background:transparent; border:none; color:var(--text-secondary); width:28px; height:28px; border-radius:var(--r-sm); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="4" height="4"/><rect x="10" y="3" width="4" height="4"/><rect x="17" y="3" width="4" height="4"/><rect x="3" y="10" width="4" height="4"/><rect x="10" y="10" width="4" height="4"/><rect x="17" y="10" width="4" height="4"/><rect x="3" y="17" width="4" height="4"/><rect x="10" y="17" width="4" height="4"/><rect x="17" y="17" width="4" height="4"/></svg>
              </button>
              <button class="view-mode-btn ${activeViewMode === 'medium' ? 'active' : ''}" onclick="PAGE_CREATIVES.setViewMode('medium')" title="Normal Grid" style="background:transparent; border:none; color:var(--text-secondary); width:28px; height:28px; border-radius:var(--r-sm); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
              </button>
              <button class="view-mode-btn ${activeViewMode === 'large' ? 'active' : ''}" onclick="PAGE_CREATIVES.setViewMode('large')" title="Large Grid" style="background:transparent; border:none; color:var(--text-secondary); width:28px; height:28px; border-radius:var(--r-sm); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="18" height="18"/></svg>
              </button>
            </div>

            ${window.CAN_MANAGE ? `
              <button class="btn btn-secondary" onclick="PAGE_CREATIVES.openHiddenItemsModal()">
                👁️ Restore Hidden (${hiddenList.length})
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="checkSuperAdminAction(() => PAGE_CREATIVES.openUploadModal())">
              ${ICONS.plus} Upload Creative
            </button>
          </div>
        </div>

        <!-- Vertical filter chips -->
        <div class="filter-row" id="creatives-jump-nav" style="margin-top:12px">
          <button class="filter-chip ${_selectedVerticals.has('all') ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleVerticalFilter('all')">All</button>
          ${verticals.map(v => {
            const active = _selectedVerticals.has(v);
            return `
              <button class="filter-chip ${active ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleVerticalFilter('${v}')">
                ${getVerticalEmoji(v)} ${v}
              </button>
            `;
          }).join('')}
        </div>

        <!-- Creative Type filter chips (Second row) -->
        <div class="filter-row" id="creatives-type-nav" style="margin-top:8px">
          <button class="filter-chip ${_selectedType === 'all' ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleTypeFilter('all')">
            All Types
          </button>
          <button class="filter-chip ${_selectedType === 'ugc' ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleTypeFilter('ugc')">
            <svg style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>UGC
          </button>
          <button class="filter-chip ${_selectedType === 'static' ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleTypeFilter('static')">
            <svg style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>Static
          </button>
          <button class="filter-chip ${_selectedType === 'video' ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleTypeFilter('video')">
            <svg style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>Video
          </button>
          <button class="filter-chip ${_selectedType === 'content-calendar' ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleTypeFilter('content-calendar')">
            <svg style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>Content Calendar
          </button>
          <button class="filter-chip ${_selectedType === 'others' ? 'active' : ''}" onclick="PAGE_CREATIVES.toggleTypeFilter('others')">
            <svg style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>Others (Pitch Decks, Brand Books, PDFs)
          </button>
        </div>
      </div>

      <div class="creatives-page" id="creatives-content" style="background:var(--bg-2); padding:20px; border-radius:var(--r-md); border:1px solid var(--border-subtle)">
        <style>
          .creative-card-item:hover .video-brand-overlay {
            opacity: 0 !important;
          }
        </style>
        <h2 class="creative-gallery-heading" style="margin-bottom:24px">BRAND CREATIVE GALLERY</h2>

        ${Object.entries(renderedGroups).map(([vertical, items]) => renderVerticalSection(vertical, items, activeViewMode)).join('')}
        
        ${Object.keys(renderedGroups).length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">${ICONS.creatives}</div>
            <div class="empty-title">No creatives match selected filters</div>
          </div>
        ` : ''}
      </div>
    `;

    // Handle pending jump
    if (_pendingJump) {
      requestAnimationFrame(() => {
        const el = document.getElementById(`vertical-section-${_pendingJump.replace(/\s+/g, '-')}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        _pendingJump = null;
      });
    }

    // Removed IntersectionObserver logic for videos as native src with preload="metadata" replaces it

    // Attach play/pause JS logic for video element hover states
    container.querySelectorAll('.creative-card-item, .creative-list-item').forEach(card => {
      const v = card.querySelector('video');
      if (v) {
        card.addEventListener('mouseenter', () => {
          v.muted = true; // Ensure browser autoplay policies are satisfied
          v.play().catch(err => console.log('Video autoplay blocked:', err));
        });
        card.addEventListener('mouseleave', () => {
          v.pause();
          v.currentTime = 0;
        });
      }
    });
  }

  function renderVerticalSection(vertical, items, viewMode) {
    const sectionId = `vertical-section-${vertical.replace(/\s+/g, '-')}`;
    return `
      <div class="creative-row-wrapper" id="${sectionId}" style="border-bottom: 1px solid var(--border-subtle); padding-bottom: 12px; margin-bottom: 24px;">
        <div class="creative-row-title" style="color: var(--text-primary)">
          <span>${getVerticalEmoji(vertical)}</span>
          <span style="font-weight:800; font-size:14px; letter-spacing:0.02em">${vertical}</span>
          <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-secondary); margin-left:8px; font-weight:normal">(${items.length} assets)</span>
        </div>
        <div class="creative-cards-row view-mode-${viewMode}">
          ${items.map(m => renderCreativeItem(m, viewMode)).join('')}
        </div>
      </div>`;
  }

  function renderCreativeItem(mat, viewMode) {
    const isDriveVideo = mat.file_url && mat.file_url.includes('drive.google.com/file/d/');
    const isVideo = mat.file_type === 'video' || isDriveVideo;
    const isChecked = window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.has(mat.id);
    const _ext = (mat.file_url || '').split('.').pop().split('?')[0].toUpperCase();
    const _knownExts = ['JPG','JPEG','PNG','GIF','WEBP','SVG','MP4','MOV','AVI','WEBM','PDF'];
    const badgeType = isVideo ? (_knownExts.includes(_ext) && ['MP4','MOV','AVI','WEBM'].includes(_ext) ? _ext : 'Video') : (mat.file_type === 'link' ? 'Link' : (_knownExts.includes(_ext) ? _ext : (mat.file_type || 'File').toUpperCase()));
    const hiddenList = getHiddenCreatives();
    
    let embedUrl = mat.file_url;
    if (isDriveVideo) {
      const match = mat.file_url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
      if (match && match[1]) {
        embedUrl = `https://drive.google.com/file/d/${match[1]}/preview`;
      }
    }
    const isHidden = hiddenList.includes(mat.id);

    if (viewMode === 'list') {
      return `
        <div class="creative-list-item animate-fade ${isHidden ? 'is-hidden' : ''}" onclick="openMaterial(STORE.getMaterialById('${mat.id}'))" style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-1); border: 1px solid var(--border-subtle); border-radius: 8px; padding: 10px 16px; gap: 16px; cursor: pointer; transition: all 0.2s;">
          <div style="display: flex; align-items: center; gap: 12px; flex: 1; min-width: 0;">
            <!-- Checkbox overlay -->
            <div class="creative-card-checkbox checked" onclick="event.stopPropagation()" style="position: static; opacity: 1; flex-shrink: 0; display: block;">
              <label class="item-select-wrap">
                <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
                <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
              </label>
            </div>
            
            <!-- Tiny thumbnail -->
            <div class="creative-list-thumb-container" style="width: 44px; height: 44px; border-radius: 6px; overflow: hidden; background: var(--bg-3); flex-shrink: 0; position: relative; display: flex; align-items: center; justify-content: center; color: var(--text-tertiary);">
              ${isDriveVideo
                ? `<iframe class="creative-list-media" src="${embedUrl}" style="width: 100%; height: 100%; object-fit: cover; background: #000; border:none; pointer-events: none;"></iframe>`
                : (mat.file_url && mat.file_url.includes('drive.google.com')
                ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`
                : (isVideo 
                ? `<video class="creative-list-media" src="${mat.file_url}" poster="${mat.thumbnail_url || ''}" muted playsinline preload="metadata" style="width: 100%; height: 100%; object-fit: cover; background: #000;"></video>`
                : `<img class="creative-list-media" src="${mat.thumbnail_url || mat.file_url}" loading="lazy" alt="${mat.title}" style="width: 100%; height: 100%; object-fit: cover;" onerror="if(!this.dataset.retried){this.dataset.retried='1'; this.src=this.src.match(/png$/i) ? this.src.replace(/png$/i,'jpg') : this.src.replace(/jpe?g$/i,'png');} else {this.style.display='none';}">`))}
            </div>
            
            <!-- Titles -->
            <div style="min-width: 0; flex: 1;">
              <div style="font-family: var(--font-ui); font-size: 14px; font-weight: 600; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${mat.title}</div>
              <div style="font-family: var(--font-mono); font-size: 11px; color: var(--text-tertiary); margin-top: 2px;">${mat.client_name} · ${mat.vertical}</div>
            </div>
          </div>
          
          <div style="display: flex; align-items: center; gap: 16px; flex-shrink: 0;">
            <div class="creative-card-badge" style="position: static; padding: 2px 6px; font-size: 9px; opacity: 1; height: fit-content; border: 1px solid var(--border-subtle); display: inline-block;">${badgeType}</div>
            
            <!-- Admin Actions -->
            ${window.CAN_MANAGE ? `
              <div class="creative-list-admin-actions" style="display: flex; gap: 6px;" onclick="event.stopPropagation()">
                ${isHidden ? `
                  <button class="creative-card-edit-btn" onclick="PAGE_CREATIVES.openEditCreativeModal('${mat.id}')" title="Edit Metadata" style="background:rgba(20,20,20,0.85); border:1px solid var(--border-subtle); width:28px; height:28px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="creative-card-restore-btn" onclick="PAGE_CREATIVES.restoreSingleCreative('${mat.id}')" title="Restore to gallery" style="background:rgba(61,232,146,0.9); border:none; width:28px; height:28px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#000;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                  </button>
                  <button class="creative-card-delete-forever-btn" onclick="PAGE_CREATIVES.deleteCreativeForever('${mat.id}')" title="Delete permanently" style="background:rgba(224,80,57,0.9); border:none; width:28px; height:28px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                    ${ICONS.trash}
                  </button>
                ` : `
                  <button class="creative-card-edit-btn" onclick="PAGE_CREATIVES.openEditCreativeModal('${mat.id}')" title="Edit Metadata" style="background:rgba(20,20,20,0.85); border:1px solid var(--border-subtle); width:28px; height:28px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                  </button>
                  <button class="creative-card-delete-btn" onclick="PAGE_CREATIVES.hideSingleCreative('${mat.id}')" title="Hide from gallery" style="background:rgba(20,20,20,0.85); border:1px solid var(--border-subtle); width:28px; height:28px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
                  </button>
                  <button class="creative-card-delete-forever-btn" onclick="PAGE_CREATIVES.deleteCreativeForever('${mat.id}')" title="Delete permanently" style="background:rgba(224,80,57,0.9); border:none; width:28px; height:28px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                    ${ICONS.trash}
                  </button>
                `}
              </div>
            ` : ''}
          </div>
        </div>
      `;
    }

    return `
      <div class="creative-card-item animate-fade ${isHidden ? 'is-hidden' : ''}" onclick="openMaterial(STORE.getMaterialById('${mat.id}'))">
        <!-- Checkbox overlay -->
        <div class="creative-card-checkbox ${isChecked ? 'checked' : ''}" onclick="event.stopPropagation()">
          <label class="item-select-wrap">
            <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
            <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
          </label>
        </div>

        <!-- Delete/Restore/Delete-Forever Overlays for Super Admin -->
        ${window.CAN_MANAGE ? (
          isHidden ? `
            <div class="creative-card-admin-actions">
              <button class="creative-card-edit-btn" onclick="event.stopPropagation(); PAGE_CREATIVES.openEditCreativeModal('${mat.id}')" title="Edit Metadata" style="background:rgba(20,20,20,0.85); border:none; width:24px; height:24px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                ${ICONS.edit}
              </button>
              <button class="creative-card-restore-btn" onclick="event.stopPropagation(); PAGE_CREATIVES.restoreSingleCreative('${mat.id}')" title="Restore to gallery" style="background:rgba(61,232,146,0.9); border:none; width:24px; height:24px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#000;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
              </button>
              <button class="creative-card-delete-forever-btn" onclick="event.stopPropagation(); PAGE_CREATIVES.deleteCreativeForever('${mat.id}')" title="Delete permanently" style="background:rgba(224,80,57,0.9); border:none; width:24px; height:24px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                ${ICONS.trash}
              </button>
            </div>
          ` : `
            <div class="creative-card-admin-actions">
              <button class="creative-card-edit-btn" onclick="event.stopPropagation(); PAGE_CREATIVES.openEditCreativeModal('${mat.id}')" title="Edit Metadata" style="background:rgba(20,20,20,0.85); border:none; width:24px; height:24px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                ${ICONS.edit}
              </button>
              <button class="creative-card-delete-btn" onclick="event.stopPropagation(); PAGE_CREATIVES.hideSingleCreative('${mat.id}')" title="Hide from gallery" style="background:rgba(20,20,20,0.85); border:none; width:24px; height:24px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              </button>
              <button class="creative-card-delete-forever-btn" onclick="event.stopPropagation(); PAGE_CREATIVES.deleteCreativeForever('${mat.id}')" title="Delete permanently" style="background:rgba(224,80,57,0.9); border:none; width:24px; height:24px; border-radius:var(--r-sm); display:flex; align-items:center; justify-content:center; cursor:pointer; color:#fff;">
                ${ICONS.trash}
              </button>
            </div>
          `
        ) : ''}
        
        <!-- Media -->
        ${isDriveVideo 
          ? `<div class="static-video-wrapper" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: #111;">
               <iframe class="creative-card-media" src="${embedUrl}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border:none; pointer-events:none;"></iframe>
               <div class="video-brand-overlay" style="position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; pointer-events: none; z-index: 10; font-family: var(--font-ui); transition: opacity 0.3s; opacity: 1;">${mat.client_name}</div>
             </div>`
          : (mat.file_url && mat.file_url.includes('drive.google.com')
          ? `<div class="static-video-wrapper" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: var(--bg-2); display: flex; align-items: center; justify-content: center; color: var(--text-tertiary);">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
               <div class="video-brand-overlay" style="position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; pointer-events: none; z-index: 10; font-family: var(--font-ui); transition: opacity 0.3s; opacity: 1;">${mat.client_name}</div>
             </div>`
          : (isVideo 
          ? `<div class="static-video-wrapper" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0; background: #000;">
               <video class="creative-card-media" src="${mat.file_url}" poster="${mat.thumbnail_url || ''}" muted playsinline preload="metadata" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; object-fit: cover; background: #000;"></video>
               <div class="video-play-button">
                 <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
               </div>
               <div class="video-brand-overlay" style="position: absolute; top: 8px; left: 8px; font-size: 10px; font-weight: 700; color: #fff; background: rgba(0,0,0,0.5); padding: 2px 6px; border-radius: 4px; pointer-events: none; z-index: 10; font-family: var(--font-ui); transition: opacity 0.3s; opacity: 1;">${mat.client_name}</div>
             </div>`
          : `<div style="width:100%;height:100%;position:absolute;top:0;left:0;background:var(--bg-2);display:flex;align-items:center;justify-content:center;">
               <img class="creative-card-media" src="${mat.thumbnail_url || mat.file_url}" loading="lazy" alt="${mat.title}" style="width:100%;height:100%;object-fit:cover;display:block;position:absolute;top:0;left:0;" onerror="if(!this.dataset.retried){this.dataset.retried='1'; this.src=this.src.match(/png$/i) ? this.src.replace(/png$/i,'jpg') : this.src.replace(/jpe?g$/i,'png');} else {this.style.display='none';}">
               <svg style="color:var(--text-tertiary);width:32px;height:32px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
             </div>`))}
        
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
      </div>`;
  }

  let _uploadedFilesBatch = [];

  async function handleAddLink() {
    const input = document.getElementById('creative-link-input');
    const url = input.value.trim();
    if (!url) return;

    let thumbnail = '';
    let name = url;
    let type = 'link';

    const ytMatch = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
    if (ytMatch) {
      thumbnail = `https://img.youtube.com/vi/${ytMatch[1]}/0.jpg`;
      name = 'YouTube Video';
      type = 'video/youtube';
    } else if (url.includes('tiktok.com')) {
      name = 'TikTok Video';
      type = 'video/tiktok';
      try {
        const res = await fetch(`https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        if (data && data.thumbnail_url) thumbnail = data.thumbnail_url;
      } catch (e) {
        console.warn('Could not fetch tiktok thumbnail', e);
        thumbnail = 'https://sf-tb-sg.ibytedtos.com/obj/eden-sg/uhtyvueh7nulogpouzhm/tiktok-icon2.png';
      }
    } else if (url.includes('instagram.com')) {
      name = 'Instagram Post';
      type = 'video/instagram';
      thumbnail = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png';
    } else {
      name = 'External Link';
      type = 'link/external';
      thumbnail = 'https://via.placeholder.com/150?text=Link';
    }

    if (!_uploadedFilesBatch.some(existing => existing.url === url)) {
      _uploadedFilesBatch.push({
        name: name,
        url: url,
        isLink: true,
        type: type,
        thumbnail: thumbnail,
        size: 0
      });
      input.value = '';
      PAGE_CREATIVES.updateBatchUI();
    }
  }

  function openUploadModal() {
    const verticals = window.PORTAL_DATA.VERTICALS;

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div id="creative-dropzone" style="border: 2px dashed var(--border-default); border-radius: var(--r-lg); padding: 32px; text-align: center; cursor: pointer; transition: background 0.2s;" ondragover="event.preventDefault(); this.style.background='var(--bg-3)';" ondragleave="this.style.background='';" ondrop="event.preventDefault(); this.style.background=''; PAGE_CREATIVES.handleFilesDrop(event);">
          <div style="font-size: 28px; margin-bottom: 8px;">📁</div>
          <div style="font-size: 13px; font-weight: 600; color: var(--text-primary);">Drag & drop files here or click to browse</div>
          <div style="font-size: 11px; color: var(--text-tertiary); margin-top: 4px;">Supports MP4, MOV, AVI, GIF, JPG, PNG</div>
          <input type="file" id="creative-files-input" multiple accept="image/*,video/*" style="display:none;" onchange="PAGE_CREATIVES.handleFilesSelect(event);">
        </div>

        <div style="display:flex; gap:8px; align-items:center;">
          <input type="text" id="creative-link-input" class="input" placeholder="Or paste link (YouTube, TikTok, Instagram)" style="flex:1;">
          <button class="btn btn-secondary" onclick="PAGE_CREATIVES.handleAddLink()">Add Link</button>
        </div>

        <div id="creative-upload-previews" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; max-height: 150px; overflow-y: auto;"></div>

        <div style="background: var(--bg-3); padding: 14px; border-radius: var(--r-md); border: 1px solid var(--border-subtle); display:flex; flex-direction:column; gap:10px;">
          <div style="font-size:12px; font-weight:500; color:var(--accent); font-family:var(--font-ui)">🛠️ BATCH APPLY INDUSTRIES / CATEGORIES *</div>
          <div style="display:flex; flex-wrap:wrap; gap:8px;" id="batch-verticals-checkboxes">
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
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:4px;">
            <div class="input-group">
              <span class="input-label">Client Name *</span>
              <input class="input" type="text" id="batch-creative-client" placeholder="e.g. BankFlow" value="Internal">
            </div>
            <div class="input-group">
              <span class="input-label">Client Website URL</span>
              <input class="input" type="text" id="batch-creative-website" placeholder="https://example.com">
            </div>
            <div class="input-group">
              <span class="input-label">Geo Location *</span>
              <select class="select" id="batch-creative-geo" style="height:34px; font-size:12px;">
                ${window.PORTAL_DATA.GEOS.map(g => `<option value="${g}">${g}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <span class="input-label">Creative Type *</span>
              <select class="select" id="batch-creative-type" style="height:34px; font-size:12px;">
                <option value="static">🖼️ Static</option>
                <option value="video">🎥 Video</option>
                <option value="ugc">📱 UGC</option>
                <option value="content-calendar">📅 Content Calendar</option>
                <option value="others">📦 Others (Pitch Decks, Brand Books, PDFs)</option>
              </select>
            </div>
          </div>
          <label style="display:inline-flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
            <input type="checkbox" onchange="PAGE_CREATIVES.toggleClientNameField(this)"> Client Name Not Available
          </label>
        </div>
      </div>
    `;

    const modalFooter = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_CREATIVES.saveBatchUpload()" id="save-batch-btn" disabled>Batch Save (0)</button>
    `;

    openModal({
      title: 'Bulk Upload Creative Assets',
      body: modalBody,
      footer: modalFooter,
      size: 'medium'
    });

    document.getElementById('creative-dropzone').addEventListener('click', () => {
      document.getElementById('creative-files-input').click();
    });
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
    const allowed = ['mp4', 'mov', 'avi', 'gif', 'jpg', 'jpeg', 'png'];
    files.forEach(f => {
      const ext = f.name.split('.').pop().toLowerCase();
      if (allowed.includes(ext)) {
        if (!_uploadedFilesBatch.some(existing => existing.name === f.name && existing.size === f.size)) {
          // Read file into Base64 so it can load instantly on local or web hosted portals
          const reader = new FileReader();
          reader.onload = function(e) {
            f.base64Data = e.target.result;
            updateBatchUI();
          };
          reader.readAsDataURL(f);
          _uploadedFilesBatch.push(f);
        }
      } else {
        showToast(`File type .${ext} not supported`, 'error');
      }
    });
    updateBatchUI();
  }

  function removeFileFromBatch(idx) {
    _uploadedFilesBatch.splice(idx, 1);
    updateBatchUI();
  }

  function updateBatchUI() {
    const previewContainer = document.getElementById('creative-upload-previews');
    const saveBtn = document.getElementById('save-batch-btn');
    if (!previewContainer) return;

    if (_uploadedFilesBatch.length === 0) {
      previewContainer.innerHTML = '';
      saveBtn.disabled = true;
      saveBtn.textContent = 'Batch Save (0)';
      return;
    }

    saveBtn.disabled = false;
    saveBtn.textContent = `Batch Save (${_uploadedFilesBatch.length})`;

    previewContainer.innerHTML = _uploadedFilesBatch.map((file, idx) => {
      let previewContent = '';
      if (file.isLink) {
        previewContent = `<div style="width:100%; height:40px; background:url('${file.thumbnail}') center/cover; border-radius:4px; margin-bottom:4px;"></div>`;
      } else {
        const isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi');
        const icon = isVideo ? '🎥' : '🖼️';
        previewContent = `<div style="font-size:20px; margin-top:4px;">${icon}</div>`;
      }
      return `
        <div style="position:relative; width:80px; height:80px; background:var(--bg-4); border:1px solid var(--border-default); border-radius:var(--r-md); overflow:hidden; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:4px;">
          ${previewContent}
          <div style="font-size:8px; color:var(--text-secondary); text-align:center; word-break:break-all; max-height:24px; overflow:hidden;">${file.name}</div>
          <button onclick="PAGE_CREATIVES.removeFileFromBatch(${idx}); event.stopPropagation();" style="position:absolute; top:2px; right:2px; background:var(--danger-dim); border:none; color:var(--danger); width:16px; height:16px; border-radius:50%; font-size:9px; cursor:pointer; display:flex; align-items:center; justify-content:center;">✕</button>
        </div>
      `;
    }).join('');
  }

  async function saveBatchUpload() {
    if (_uploadedFilesBatch.length === 0) return;

    const checkedBoxes = document.querySelectorAll('#batch-verticals-checkboxes input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedBoxes).map(cb => cb.value);
    let clientName = document.getElementById('batch-creative-client').value.trim() || 'Internal';
    const clientWebsite = document.getElementById('batch-creative-website').value.trim() || '';

    if (selectedVerticals.length === 0) {
      showToast('Please assign at least one vertical', 'error');
      return;
    }

    const saveBtn = document.getElementById('save-batch-btn');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Uploading...';
    }

    // Auto-create client reference/profile if name is custom and doesn't exist yet
    const batchCreativeGeo = document.getElementById('batch-creative-geo') ? document.getElementById('batch-creative-geo').value : 'Global';

    if (clientName !== 'Internal' && clientName !== 'Client Name Not Available') {
      const existingRef = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === clientName.toLowerCase());
      if (existingRef) {
        clientName = existingRef.client_name;
      } else {
        STORE.addClientRef({
          client_name: clientName,
          website_url: clientWebsite || 'https://ninjapromo.io',
          vertical: selectedVerticals[0],
          geo: batchCreativeGeo,
          ai_summary: `Newly registered client profile for ${clientName}.`,
          services_provided: ['Design'],
          thumbnail_url: ''
        });
        STORE.addClientProfile({
          client_name: clientName,
          vertical: selectedVerticals[0],
          geo: batchCreativeGeo,
          website_url: clientWebsite || 'https://ninjapromo.io',
          services_provided: ['Design'],
          notes: `Added automatically during creative upload.`,
          budget_range: '$10k-$25k',
          contacts: []
        });
        showToast(`Auto-created Client Reference and Profile for "${clientName}"`, 'info');
      }
    }

    const batchCreativeType = document.getElementById('batch-creative-type').value;

    let successCount = 0;

    for (let i = 0; i < _uploadedFilesBatch.length; i++) {
      const file = _uploadedFilesBatch[i];
      let filePath = '';
      let isVideo = false;
      let fileType = 'image';
      let thumbnail_url = '';
      let title = file.name;

      if (file.isLink) {
        isVideo = file.type.startsWith('video');
        fileType = isVideo ? 'video' : 'link';
        filePath = file.url;
        thumbnail_url = file.thumbnail;
      } else {
        isVideo = file.type.startsWith('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.avi');
        fileType = isVideo ? 'video' : 'image';
        filePath = file.base64Data || `uploads/creatives/${file.name}`;
        title = file.name.split('.')[0].replace(/[-_]/g, ' ');

        // Try uploading to server
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('type', 'creatives');

          const response = await fetch('upload.php', {
            method: 'POST',
            body: formData
          });
          const resData = await response.json();
          if (resData.success) {
            filePath = resData.url;
          }
        } catch (err) {
          console.warn('Server upload failed for creative asset:', err);
        }
        thumbnail_url = isVideo ? '' : filePath;
      }

      const item = {
        title: title,
        client_name: clientName,
        geo: batchCreativeGeo,
        vertical: selectedVerticals[0],
        verticals: selectedVerticals,
        asset_type: 'creative',
        creative_type: batchCreativeType,
        visibility_status: 'client-safe',
        file_type: fileType,
        file_url: filePath,
        thumbnail_url: thumbnail_url,
        description: '',
        tags: [...selectedVerticals, fileType, batchCreativeType],
        services_provided: ['Design'],
        related_assets: []
      };

      STORE.addMaterial(item);
      successCount++;
    }

    closeModal();
    showToast(`Successfully saved ${successCount} creatives`, 'success');
    _uploadedFilesBatch = [];

    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function hideSingleCreative(id) {
    const hidden = getHiddenCreatives();
    if (!hidden.includes(id)) {
      hidden.push(id);
      localStorage.setItem('np_hidden_creatives', JSON.stringify(hidden));
    }
    showToast('Creative hidden from website');
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function deleteStaged() {
    const hidden = getHiddenCreatives();
    const ids = Array.from(window.CALL_PREP_BASKET);
    ids.forEach(id => {
      const mat = STORE.getMaterialById(id);
      if (mat && ['creative', 'video', 'image'].includes(mat.file_type || mat.asset_type)) {
        if (!hidden.includes(id)) {
          hidden.push(id);
        }
      }
    });
    localStorage.setItem('np_hidden_creatives', JSON.stringify(hidden));
    clearCallPrep();
    showToast('Selected creatives hidden from website');
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function openHiddenItemsModal() {
    const hiddenIds = getHiddenCreatives();
    if (hiddenIds.length === 0) {
      showToast('No hidden creatives found', 'info');
      return;
    }

    const items = hiddenIds.map(id => STORE.getMaterialById(id)).filter(Boolean);

    const body = `
      <div style="max-height:400px; overflow-y:auto; display:flex; flex-direction:column; gap:8px;">
        ${items.map(m => `
          <div style="display:flex; align-items:center; justify-content:space-between; padding:10px; background:var(--bg-3); border:1px solid var(--border-default); border-radius:var(--r-md)">
            <div style="display:flex; align-items:center; gap:10px">
              ${m.file_type === 'video' 
                ? `<video src="${m.file_url}" poster="${m.thumbnail_url || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;" preload="none" muted></video>`
                : `<img src="${m.thumbnail_url || m.file_url}" style="width:40px; height:40px; object-fit:cover; border-radius:4px;">`
              }
              <div>
                <div style="font-size:12px; font-weight:600; color:var(--text-primary)">${m.title}</div>
                <div style="font-size:10px; color:var(--text-secondary)">${m.client_name} · ${m.vertical}</div>
              </div>
            </div>
            <button class="btn btn-sm btn-outline" onclick="PAGE_CREATIVES.restoreSingleCreative('${m.id}')" style="margin-left:auto;">Unhide</button>
          </div>
        `).join('')}
      </div>
    `;

    openModal({
      title: 'Hidden Creative Assets',
      body: body,
      footer: `
        <button class="btn btn-success btn-sm" onclick="PAGE_CREATIVES.restoreAllHidden()" style="margin-right:auto;">Restore All</button>
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>
      `,
      size: 'medium'
    });
  }

  function restoreSingleCreative(id) {
    let hidden = getHiddenCreatives();
    hidden = hidden.filter(x => x !== id);
    localStorage.setItem('np_hidden_creatives', JSON.stringify(hidden));
    showToast('Asset restored to gallery');
    // Re-render
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function restoreAllHidden() {
    localStorage.setItem('np_hidden_creatives', JSON.stringify([]));
    showToast('All hidden assets restored to gallery');
    closeModal();
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function toggleClientNameField(chk) {
    const input = document.getElementById('batch-creative-client');
    if (chk.checked) {
      input.value = 'Client Name Not Available';
      input.disabled = true;
    } else {
      input.value = 'Internal';
      input.disabled = false;
    }
  }

  function deleteCreativeForever(id) {
    if (confirm("Are you sure you want to permanently delete this creative?")) {
      STORE.deleteMaterial(id);
      showToast('Creative permanently deleted', 'success');
      const container = document.getElementById('page-container');
      if (container) render(container);
    }
  }

  function openEditCreativeModal(matId) {
    const mat = STORE.getMaterialById(matId);
    if (!mat) return;

    const verticals = window.PORTAL_DATA.VERTICALS;
    const services = window.PORTAL_DATA.SERVICES;
    const matVerts = mat.verticals || (mat.vertical ? [mat.vertical] : []);
    const matServices = mat.services_provided || [];

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="background: var(--bg-3); padding: 14px; border-radius: var(--r-md); border: 1px solid var(--border-subtle); display:flex; flex-direction:column; gap:10px;">
          
          <div class="input-group">
            <span class="input-label" style="font-size:11px;">Title *</span>
            <input class="input" type="text" id="edit-creative-title" value="${mat.title || ''}" style="height:34px; font-size:12px;">
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <span class="input-label" style="font-size:11px; margin-bottom: 2px;">Industry / Category * (Select multiple)</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="edit-creative-verticals">
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

          <div class="input-group">
            <span class="input-label" style="font-size:11px;">Services Provided *</span>
            <div style="display:flex; flex-wrap:wrap; gap:8px;" id="edit-creative-services">
              ${[...services].sort().map(s => `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${matServices.includes(s) ? 'checked' : ''}> ${s}
                </label>
              `).join('')}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:6px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <div class="input-group">
                <span class="input-label" style="font-size:11px;">Client Name *</span>
                <input class="input" type="text" id="edit-creative-client" value="${mat.client_name || 'Internal'}" style="height:34px; font-size:12px;">
              </div>
              <div class="input-group">
                <span class="input-label" style="font-size:11px;">Client Website URL</span>
                <input class="input" type="text" id="edit-creative-website" placeholder="https://example.com" value="${(() => {
                  const ref = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === (mat.client_name || '').toLowerCase());
                  return ref ? ref.website_url : '';
                })()}" style="height:34px; font-size:12px;">
              </div>
              <div class="input-group">
                <span class="input-label" style="font-size:11px;">Geo *</span>
                <select class="select" id="edit-creative-geo" style="height:34px; font-size:12px;">
                  ${window.PORTAL_DATA.GEOS.map(g => `<option value="${g}" ${(mat.geo || 'Global') === g ? 'selected' : ''}>${g}</option>`).join('')}
                </select>
              </div>
              <div class="input-group">
                <span class="input-label" style="font-size:11px;">Creative Type *</span>
                <select class="select" id="edit-creative-type" style="height:34px; font-size:12px;">
                  <option value="ugc" ${getCreativeType(mat) === 'ugc' ? 'selected' : ''}>📱 UGC</option>
                  <option value="static" ${getCreativeType(mat) === 'static' ? 'selected' : ''}>🖼️ Static</option>
                  <option value="video" ${getCreativeType(mat) === 'video' ? 'selected' : ''}>🎥 Video</option>
                  <option value="content-calendar" ${getCreativeType(mat) === 'content-calendar' ? 'selected' : ''}>📅 Content Calendar</option>
                  <option value="others" ${getCreativeType(mat) === 'others' ? 'selected' : ''}>📦 Others</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    openModal({
      title: 'Edit Creative Metadata',
      body: modalBody,
      footer: `
        <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary btn-sm" onclick="PAGE_CREATIVES.saveCreativeEdit('${mat.id}')">Save Changes</button>
      `,
      size: 'medium'
    });
  }

  function saveCreativeEdit(matId) {
    const mat = STORE.getMaterialById(matId);
    if (!mat) return;

    const title = document.getElementById('edit-creative-title').value.trim();
    const checkedVerts = document.querySelectorAll('#edit-creative-verticals input[type="checkbox"]:checked');
    const selectedVerticals = Array.from(checkedVerts).map(cb => cb.value);
    const checkedServices = document.querySelectorAll('#edit-creative-services input[type="checkbox"]:checked');
    const services = Array.from(checkedServices).map(cb => cb.value);
    const clientName = document.getElementById('edit-creative-client').value.trim() || 'Internal';
    const clientWebsite = document.getElementById('edit-creative-website').value.trim();
    const geo = document.getElementById('edit-creative-geo').value || 'Global';

    const creativeType = document.getElementById('edit-creative-type').value;

    if (!title) {
      showToast('Title is required', 'error');
      return;
    }
    if (selectedVerticals.length === 0) {
      showToast('Please select at least one vertical', 'error');
      return;
    }

    // Auto-create/sync client reference profile
    if (clientName !== 'Internal' && clientName !== 'Client Name Not Available') {
      let cleanUrl = clientWebsite.trim();
      if (cleanUrl) {
        if (!/^https?:\/\//i.test(cleanUrl)) {
          cleanUrl = 'https://' + cleanUrl;
        }
      }

      const existingRef = STORE.getClientRefs().find(r => r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === clientName.toLowerCase());
      if (existingRef) {
        existingRef.website_url = cleanUrl;
        const ud = STORE.loadUserData();
        const refIdx = ud.clientRefs.findIndex(r => r.id === existingRef.id);
        if (refIdx !== -1) {
          ud.clientRefs[refIdx].website_url = cleanUrl;
          STORE.saveUserData(ud);
        } else {
          ud.clientRefs.push({ ...existingRef, website_url: cleanUrl });
          STORE.saveUserData(ud);
        }
      } else {
        STORE.addClientRef({
          client_name: clientName,
          website_url: cleanUrl || 'https://ninjapromo.io',
          vertical: selectedVerticals[0] || 'Other',
          geo: geo,
          ai_summary: `Newly registered client profile for ${clientName}.`,
          services_provided: services.length ? services : ['Design'],
          thumbnail_url: ''
        });
        STORE.addClientProfile({
          client_name: clientName,
          vertical: selectedVerticals[0] || 'Other',
          geo: geo,
          website_url: cleanUrl || 'https://ninjapromo.io',
          services_provided: services.length ? services : ['Design'],
          notes: `Added automatically during document upload.`,
          budget_range: '$10k-$25k',
          contacts: []
        });
      }
    }

    STORE.updateMaterial(matId, {
      title: title,
      client_name: clientName,
      geo: geo,
      vertical: selectedVerticals[0] || 'Other',
      verticals: selectedVerticals,
      services_provided: services,
      tags: [...selectedVerticals, ...services, creativeType],
      creative_type: creativeType
    });

    STORE.syncClientGeo(clientName, geo);

    closeModal();
    showToast('Creative metadata updated successfully', 'success');

    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  return { 
    render, 
    toggleVerticalFilter,
    toggleTypeFilter,
    setViewMode,
    getCreativeType,
    openUploadModal,
    handleAddLink,
    updateBatchUI,
    handleFilesDrop,
    handleFilesSelect,
    removeFileFromBatch,
    saveBatchUpload,
    hideSingleCreative,
    deleteStaged,
    openHiddenItemsModal,
    restoreSingleCreative,
    restoreAllHidden,
    toggleClientNameField,
    deleteCreativeForever,
    openEditCreativeModal,
    saveCreativeEdit
  };
})();

window.PAGE_CREATIVES = PAGE_CREATIVES;
