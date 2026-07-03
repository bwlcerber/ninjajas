/** PAGE: Docs */
'use strict';

const PAGE_DOCS = (() => {

  let _customCategories = [];
  try {
    const raw = localStorage.getItem('np_custom_doc_categories');
    if (raw) _customCategories = JSON.parse(raw);
  } catch (e) {}

  function getCategories() {
    const defaults = [
      { id: 'all', label: 'All Docs', types: ['contract','offer-prep','deck','process-doc','template','training','social-media-link','doc-link','pdf','other'] },
      { id: 'contract', label: 'Contracts & NDAs', types: ['contract'] },
      { id: 'offer-prep', label: 'Offer Preparation', types: ['offer-prep'] },
      { id: 'deck', label: 'Pitch Decks', types: ['deck'] },
      { id: 'process-doc', label: 'Process Docs', types: ['process-doc'] },
      { id: 'template', label: 'Templates', types: ['template'] },
      { id: 'training', label: 'Training', types: ['training'] },
      { id: 'social-media-link', label: 'Social Media Links', types: ['social-media-link'] },
      { id: 'other', label: 'Other', types: ['other'] },
    ];
    const customWithTypes = _customCategories.map(c => ({
      id: c.id,
      label: c.label,
      types: [c.id]
    }));
    customWithTypes.forEach(c => {
      if (!defaults[0].types.includes(c.id)) {
        defaults[0].types.push(c.id);
      }
    });

    const first = defaults[0];
    const last = defaults[defaults.length - 1];
    const mid = defaults.slice(1, -1);
    
    // Merge mid default categories and custom categories, ensuring no duplicate IDs
    const merged = [...mid, ...customWithTypes];
    const uniqueMap = {};
    merged.forEach(item => {
      if (item.id !== 'other') {
        uniqueMap[item.id] = item;
      }
    });
    
    const sortedMid = Object.values(uniqueMap).sort((a, b) => a.label.localeCompare(b.label));
    return [first, ...sortedMid, last];
  }

  function getDocTypes() {
    return getCategories().flatMap(c => c.types);
  }

  let _activeCat = 'all';
  let _query = '';
  const _selectedTags = new Set();

  function render(container) {
    const allDocs = STORE.getByTypes(getDocTypes());
    const cats = getCategories();

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Contracts, NDAs, decks, process docs, training materials, and sales resources.</div>
          <div style="display:flex; gap:8px; align-items:center;">
            ${window.CAN_MANAGE ? `
              <button class="btn btn-secondary" onclick="PAGE_DOCS.openManageCategoriesModal()" title="Manage Document Categories" style="display:flex; align-items:center; justify-content:center; padding:10px; width:36px; height:36px;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              </button>
            ` : ''}
            <button class="btn btn-primary" onclick="checkSuperAdminAction(() => PAGE_DOCS.openAddDocModal())">
              ${ICONS.plus} Add Files
            </button>
          </div>
        </div>

        <div class="search-bar" style="margin-bottom:16px">
          ${ICONS.search}
          <input id="docs-search" type="text" placeholder="Search documents…" value="${_query}" autocomplete="off">
        </div>

        <!-- Selected active filters -->
        <div id="docs-active-filters" class="active-filters" style="display:none"></div>
      </div>

      <div style="display:grid; grid-template-columns:1fr ${_editDocId ? '400px' : '0px'}; gap:${_editDocId ? '24px' : '0px'}; align-items:start; transition: all 0.3s ease;">
        <div class="docs-categories" style="min-width:0; overflow:hidden;">
          <!-- Category nav -->
          <div class="docs-category-nav">
            ${cats.map(c => {
              const count = c.id === 'all'
                ? allDocs.length
                : allDocs.filter(m => c.types.includes(m.asset_type)).length;
              return `
                <div class="docs-cat-item ${_activeCat === c.id ? 'active' : ''}" data-cat="${c.id}" style="font-size:14px; padding:10px 12px;">
                  ${c.label}
                  <span class="docs-cat-count" style="font-size:13.5px; padding:2px 8px;">${count}</span>
                </div>`;
            }).join('')}
          </div>

          <!-- Doc list -->
          <div id="docs-list" class="reports-list"></div>
        </div>

        ${_editDocId ? `
          <div id="docs-edit-wrap" style="position: sticky; top: 20px; align-self: start; background:var(--bg-2); border:1px solid var(--border-subtle); border-radius:var(--r-md); padding:16px; overflow:hidden;">
            ${renderInlineEditForm(STORE.getById(_editDocId))}
          </div>
        ` : ''}
      </div>
    `;

    if (_editDocId) {
      bindInlineEditForm(container.querySelector('#docs-edit-wrap'), STORE.getById(_editDocId));
    }

    container.querySelector('#docs-search').addEventListener('input', e => {
      _query = e.target.value;
      renderList(container, allDocs);
    });

    container.querySelectorAll('.docs-cat-item').forEach(el => {
      el.addEventListener('click', () => {
        _activeCat = el.dataset.cat;
        container.querySelectorAll('.docs-cat-item').forEach(i => i.classList.toggle('active', i.dataset.cat === _activeCat));
        renderList(container, allDocs);
      });
    });

    renderList(container, allDocs);
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
      const allDocs = STORE.getByTypes(getDocTypes());
      renderList(container, allDocs);
    }
  }

  function removeTag(tag) {
    _selectedTags.delete(tag);
    const container = document.getElementById('page-container');
    if (container) {
      renderActiveFilters(container);
      const allDocs = STORE.getByTypes(getDocTypes());
      renderList(container, allDocs);
    }
  }

  function clearAllTags() {
    _selectedTags.clear();
    const container = document.getElementById('page-container');
    if (container) {
      renderActiveFilters(container);
      const allDocs = STORE.getByTypes(getDocTypes());
      renderList(container, allDocs);
    }
  }

  function renderActiveFilters(container) {
    const wrap = container.querySelector('#docs-active-filters');
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
          <span class="filter-badge-remove" onclick="PAGE_DOCS.removeTag('${t}')">✕</span>
        </span>
      `).join('')}
      <a style="font-size:11px; color:var(--danger); cursor:pointer; margin-left:8px; font-family:var(--font-mono)" onclick="PAGE_DOCS.clearAllTags()">Clear All</a>
    `;
  }

  function renderList(container, allDocs) {
    const cat = getCategories().find(c => c.id === _activeCat);
    let items = _activeCat === 'all' ? allDocs : allDocs.filter(m => cat.types.includes(m.asset_type));

    // Apply multi-select tags filtering
    if (_selectedTags.size > 0) {
      items = items.filter(m => {
        return Array.from(_selectedTags).every(t => {
          return m.vertical === t || (m.services_provided && m.services_provided.includes(t)) || (m.tags && m.tags.includes(t)) || m.asset_type === t;
        });
      });
    }

    if (_query.trim()) {
      const q = _query.toLowerCase();
      items = items.filter(m =>
        [m.title, m.description, m.client_name, ...(m.tags || [])].join(' ').toLowerCase().includes(q)
      );
    }

    // Sort by pinned first, then alphabetical by title
    items.sort((a, b) => {
      const aPinned = a.pinned ? 1 : 0;
      const bPinned = b.pinned ? 1 : 0;
      if (aPinned !== bPinned) return bPinned - aPinned; // pinned first (1 > 0)
      return (a.title || '').localeCompare(b.title || '');
    });

    const list = container.querySelector('#docs-list');

    if (items.length === 0) {
      list.innerHTML = `<div class="empty-state"><div class="empty-icon">${ICONS.docs}</div><div class="empty-title">No documents found</div></div>`;
      return;
    }

    list.innerHTML = items.map(m => {
      const isChecked = window.CALL_PREP_BASKET && window.CALL_PREP_BASKET.has(m.id);

      // Clickable tags
      const assetTag = `<span class="tag tag-default tag-interactive ${_selectedTags.has(m.asset_type) ? 'active' : ''}" onclick="event.stopPropagation(); PAGE_DOCS.toggleTag('${m.asset_type}')">${assetTypeLabel(m.asset_type)}</span>`;
      const verticalTag = m.vertical ? `<span class="tag ${getVerticalClass(m.vertical)} tag-interactive ${_selectedTags.has(m.vertical) ? 'active' : ''}" onclick="event.stopPropagation(); PAGE_DOCS.toggleTag('${m.vertical}')">${m.vertical}</span>` : '';

      return `
        <div class="material-row animate-fade" data-id="${m.id}" onclick="PAGE_DOCS.openDocumentViewer('${m.id}')">
          <div class="material-row-checkbox" onclick="event.stopPropagation()">
            <label class="item-select-wrap">
              <input type="checkbox" data-select-id="${m.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${m.id}')">
              <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
            </label>
          </div>
          <div class="material-row-icon">${getFileIcon(m.file_type)}</div>
          <div class="material-row-info">
            <div class="material-row-title">${m.title}</div>
            <div class="material-row-sub">${m.client_name} · ${assetTypeLabel(m.asset_type)} · ${formatDate(m.created_at)}</div>
          </div>
          <div style="display:flex;gap:6px;align-items:center;flex-shrink:0">
            ${visibilityTag(m.visibility_status)}
            ${verticalTag}
            ${assetTag}
          </div>
          <div style="display:flex;gap:4px">
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();PAGE_DOCS.togglePin('${m.id}')" title="${m.pinned ? 'Unpin' : 'Pin'}" style="color:${m.pinned ? 'var(--accent)' : 'var(--text-tertiary)'}; padding:4px;">
              ${m.pinned ? ICONS.pinSolid || '📌' : ICONS.pinOutline || '📌'}
            </button>
            <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();PAGE_DOCS.openDocumentViewer('${m.id}')">
              ${ICONS.eye} Open
            </button>
            <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();window.open('${m.file_url}','_blank')">
              ${ICONS.external}
            </button>
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();copyToClipboard('${m.file_url}','Link')">
              ${ICONS.copy}
            </button>
            ${window.CAN_MANAGE ? `
              <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); PAGE_DOCS.openEditDocModal('${m.id}')" title="Edit Metadata" style="color:var(--accent); display:inline-flex; align-items:center; justify-content:center; padding:4px;">
                ${ICONS.edit}
              </button>
              <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); checkSuperAdminAction(() => { if (confirm('Are you sure you want to delete this document? This action cannot be undone.')) { STORE.deleteMaterial('${m.id}'); showToast('Document moved to Recycle Bin', 'success'); ROUTER.render(); } })" title="Delete Document" style="color:var(--danger); display:inline-flex; align-items:center; justify-content:center; padding:4px;">
                ${ICONS.trash}
              </button>
            ` : ''}
          </div>
        </div>
      `;
    }).join('');
  }

  function togglePin(matId) {
    const mat = STORE.getMaterialById(matId);
    if (!mat) return;
    STORE.updateMaterial(matId, { pinned: !mat.pinned });
    const container = document.getElementById('page-container');
    if (container) {
      renderList(container, STORE.getByTypes(getDocTypes()));
    }
  }

  function openAddDocModal() {
    const cats = getCategories().filter(c => c.id !== 'all');
    const verticals = window.PORTAL_DATA.VERTICALS;

    const modalBody = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <!-- Drag and Drop Upload Zone -->
        <div id="doc-dragzone" 
             style="border:2px dashed var(--border-default); border-radius:var(--r-lg); padding:20px; text-align:center; cursor:pointer; font-size:12px; color:var(--text-secondary); background:var(--bg-3); transition:all 0.2s;"
             onclick="document.getElementById('doc-file-input').click()"
             ondragover="event.preventDefault(); this.style.borderColor='var(--accent)';"
             ondragleave="this.style.borderColor='var(--border-default)';"
             ondrop="event.preventDefault(); this.style.borderColor='var(--border-default)'; PAGE_DOCS.handleDocFileDrop(event);">
          <div>📁 Drag & Drop Document PDF, Doc, XLS here, or click to browse</div>
          <input type="file" id="doc-file-input" style="display:none" onchange="PAGE_DOCS.handleDocFileSelect(event)">
        </div>

        <div class="form-grid">
          <div class="input-group span-2">
            <label class="input-label">Document Title *</label>
            <input class="input" type="text" id="doc-new-title" placeholder="e.g. Master Services Agreement" required>
          </div>
          <div class="input-group span-2">
            <label class="input-label">File Link / URL *</label>
            <input class="input" type="url" id="doc-new-url" placeholder="https://docs.google.com/..." required>
          </div>
          
          <div class="input-group">
            <label class="input-label">File Format / Input Type</label>
            <select class="select" id="doc-new-filetype">
              <option value="doc-link">.docx / Word</option>
              <option value="google-doc">Google Doc</option>
              <option value="google-drive">Google Drive</option>
              <option value="link">Link</option>
              <option value="other">Other / Asset</option>
              <option value="pdf">PDF</option>
              <option value="spreadsheet-link">.xls / Excel</option>
            </select>
          </div>

          <div class="input-group">
            <label class="input-label">Visibility Status</label>
            <select class="select" id="doc-new-vis">
              <option value="internal-only">Internal Only</option>
              <option value="client-safe">Client Safe</option>
            </select>
          </div>

          <div class="input-group span-2">
            <label class="input-label">Document Category</label>
            <div style="display:flex; gap:8px;">
              <select class="select" id="doc-new-category" style="flex:1;">
                ${[...cats].sort((a,b) => {
                  if (a.id === 'other') return 1;
                  if (b.id === 'other') return -1;
                  return a.label.localeCompare(b.label);
                }).map(c => `<option value="${c.id}">${c.label}</option>`).join('')}
              </select>
              <button class="btn btn-secondary btn-sm" onclick="PAGE_DOCS.showCreateCategoryInput()">+ New Category</button>
            </div>
          </div>

          <div class="input-group span-2" id="new-category-input-wrap" style="display:none; background:var(--bg-3); padding:10px; border-radius:var(--r-md); border:1px solid var(--border-subtle);">
            <label class="input-label" style="font-size:10px;">New Category Name</label>
            <div style="display:flex; gap:8px; margin-top:4px;">
              <input class="input" type="text" id="new-cat-label-input" placeholder="e.g. Legal Templates" style="font-size:12px; padding:6px 10px;">
              <button class="btn btn-primary btn-sm" onclick="PAGE_DOCS.addCustomCategory()" style="padding: 4px 10px;">Create</button>
            </div>
          </div>

          <div class="input-group span-2">
            <label class="input-label">Tags (comma-separated)</label>
            <input class="input" type="text" id="doc-new-tags" placeholder="legal, agreement, master">
          </div>

          <div class="input-group span-2">
            <label class="input-label">Description (Optional)</label>
            <textarea class="input" id="doc-new-desc" rows="2" placeholder="Brief context..."></textarea>
          </div>
        </div>
      </div>
    `;

    const modalFooter = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_DOCS.saveNewDocument()">Save Document</button>
    `;

    openModal({
      title: 'Add Document Record',
      body: modalBody,
      footer: modalFooter,
      size: 'medium'
    });
  }

  async function handleDocUpload(file) {
    showToast('Uploading file...', 'info');
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'internal-docs');

      const response = await fetch('upload.php', {
        method: 'POST',
        body: formData
      });
      const data = await response.json();
      if (data.success) {
        showToast('File uploaded successfully!', 'success');
        
        // Auto fill title
        const nameWithoutExt = file.name.substring(0, file.name.lastIndexOf('.')) || file.name;
        document.getElementById('doc-new-title').value = nameWithoutExt;
        
        // Auto fill url
        document.getElementById('doc-new-url').value = data.url;
        
        // Detect format
        const ext = file.name.split('.').pop().toLowerCase();
        let formatType = 'other';
        if (ext === 'pdf') formatType = 'pdf';
        else if (['doc', 'docx', 'rtf'].includes(ext)) formatType = 'doc-link';
        else if (['xls', 'xlsx', 'csv'].includes(ext)) formatType = 'spreadsheet-link';
        else if (['png', 'jpg', 'jpeg', 'gif', 'webp'].includes(ext)) formatType = 'image';
        
        document.getElementById('doc-new-filetype').value = formatType;
      } else {
        showToast(data.message || 'Upload failed', 'error');
      }
    } catch (err) {
      showToast('File upload failed', 'error');
      console.error(err);
    }
  }

  function handleDocFileDrop(e) {
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleDocUpload(e.dataTransfer.files[0]);
    }
  }

  function handleDocFileSelect(e) {
    if (e.target.files && e.target.files[0]) {
      handleDocUpload(e.target.files[0]);
    }
  }

  function showCreateCategoryInput() {
    const el = document.getElementById('new-category-input-wrap');
    if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }

  function addCustomCategory() {
    const input = document.getElementById('new-cat-label-input');
    if (!input || !input.value.trim()) return;

    const label = input.value.trim();
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (_customCategories.some(c => c.id === id)) {
      showToast('Category already exists', 'error');
      return;
    }

    _customCategories.push({ id, label });
    localStorage.setItem('np_custom_doc_categories', JSON.stringify(_customCategories));

    const select = document.getElementById('doc-new-category');
    if (select) {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      opt.selected = true;
      select.appendChild(opt);
    }

    input.value = '';
    document.getElementById('new-category-input-wrap').style.display = 'none';
    showToast(`Category "${label}" created successfully!`, 'success');
  }

  function saveNewDocument() {
    const title = document.getElementById('doc-new-title').value.trim();
    const url = document.getElementById('doc-new-url').value.trim();
    const fileType = document.getElementById('doc-new-filetype').value;
    const visibility = document.getElementById('doc-new-vis').value;
    const category = document.getElementById('doc-new-category').value;
    const vertical = 'Other';
    const client = 'Internal';
    const description = document.getElementById('doc-new-desc').value.trim();
    const tagsInput = document.getElementById('doc-new-tags').value.split(',').map(t => t.trim()).filter(Boolean);

    if (!title || !url) {
      showToast('Please enter both title and file link', 'error');
      return;
    }

    const item = {
      title: title,
      client_name: client,
      geo: 'Global',
      vertical: vertical,
      verticals: [vertical],
      asset_type: category,
      visibility_status: visibility,
      file_type: fileType,
      file_url: url,
      thumbnail_url: '',
      description: description,
      tags: [...tagsInput, category],
      services_provided: ['NDA'],
      related_assets: [],
      created_at: new Date().toISOString().split('T')[0]
    };

    STORE.addMaterial(item);
    closeModal();
    showToast('Document saved successfully!', 'success');

    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function openManageCategoriesModal() {
    const listHtml = _customCategories.map(c => `
      <div style="display:flex; justify-content:space-between; align-items:center; background:var(--bg-3); border:1px solid var(--border-subtle); padding:8px 12px; border-radius:var(--r-md); gap:8px;">
        <span style="font-size:13px; font-weight:600; color:var(--text-primary);" id="cat-label-${c.id}">${c.label}</span>
        <div style="display:flex; gap:6px;">
          <button class="btn btn-sm btn-ghost" onclick="PAGE_DOCS.renameCategoryInline('${c.id}')" title="Rename Category" style="padding:4px; color:var(--accent);">${ICONS.edit}</button>
          <button class="btn btn-sm btn-ghost" onclick="PAGE_DOCS.deleteCategoryInline('${c.id}')" title="Delete Category" style="padding:4px; color:var(--danger);">${ICONS.trash}</button>
        </div>
      </div>
    `).join('');

    const body = `
      <div style="display:flex; flex-direction:column; gap:14px;">
        <div style="font-size:12px; color:var(--text-secondary); line-height:1.4;">
          Below are the custom categories you've added. You can add new ones, rename existing labels, or delete them (docs in deleted categories will revert to 'Other').
        </div>
        
        <!-- Add Category Inline -->
        <div style="display:flex; gap:8px; background:var(--bg-4); padding:10px; border-radius:var(--r-md); border:1px solid var(--border-subtle);">
          <input class="input" type="text" id="manage-new-cat-input" placeholder="e.g. Sales Playbooks" style="font-size:12px; flex:1;">
          <button class="btn btn-primary btn-sm" onclick="PAGE_DOCS.addCategoryFromManager()">Add</button>
        </div>

        <div style="display:flex; flex-direction:column; gap:8px; max-height:220px; overflow-y:auto; padding-right:4px;">
          ${listHtml || '<div style="font-size:11.5px; color:var(--text-tertiary); text-align:center; padding:12px;">No custom categories found.</div>'}
        </div>
      </div>
    `;

    openModal({
      title: 'Manage Document Categories',
      body: body,
      footer: `<button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>`,
      size: 'medium'
    });
  }

  function addCategoryFromManager() {
    const input = document.getElementById('manage-new-cat-input');
    if (!input || !input.value.trim()) return;
    const label = input.value.trim();
    const id = label.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    if (_customCategories.some(c => c.id === id)) {
      showToast('Category already exists', 'error');
      return;
    }

    _customCategories.push({ id, label });
    localStorage.setItem('np_custom_doc_categories', JSON.stringify(_customCategories));
    showToast(`Category "${label}" added!`, 'success');
    openManageCategoriesModal();
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function renameCategoryInline(id) {
    const old = _customCategories.find(c => c.id === id);
    if (!old) return;
    const next = prompt(`Enter new label name for category "${old.label}":`, old.label);
    if (!next || !next.trim() || next.trim() === old.label) return;

    old.label = next.trim();
    localStorage.setItem('np_custom_doc_categories', JSON.stringify(_customCategories));
    showToast('Category renamed successfully', 'success');
    openManageCategoriesModal();
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function deleteCategoryInline(id) {
    if (!confirm('Are you sure you want to delete this category? Documents in this category will automatically move to "Other".')) return;
    
    // Move any materials assigned to this custom category to 'other'
    STORE.getMaterials().forEach(m => {
      if (m.asset_type === id) {
        m.asset_type = 'other';
        STORE.updateMaterial(m);
      }
    });

    _customCategories = _customCategories.filter(c => c.id !== id);
    localStorage.setItem('np_custom_doc_categories', JSON.stringify(_customCategories));
    showToast('Category deleted successfully', 'success');
  }
  
  function openDocumentViewer(id) {
    const doc = STORE.getById(id);
    if (!doc) return;

    // Fallback for PDFs or Spreadsheets that open in external tab directly
    if (doc.file_type === 'pdf' || doc.file_type === 'spreadsheet-link') {
      window.open(doc.file_url, '_blank');
      return;
    }

    // Default structured mock text content (e.g. Sales Playbook) for internal documents that do not have text
    const textBody = doc.description || `
# Executive Overview
Welcome to the sales playbook and training documentation for ${doc.title}. This asset contains internal sales strategies, target positioning, key questions, and competitor objection handling scripts.

## Sales Tactics
1. Active listening.
2. Build trust by mapping features to explicit pain points.
3. Keep demos under 15 minutes, leaving 15 minutes for QA.

## Competitor Objections
* "The competitor is cheaper."
  * Response: Focus on the high ROI, direct developer access, and our comprehensive onboarding service package.
* "We need more custom features."
  * Response: Review our API coverage; we can build customized extensions in sprint intervals.

## Conclusion
Always end meetings with a defined next step: book the follow-up meeting, share the NDA template, or trigger the staging environment onboarding.
    `;

    // Parse headers to build a Table of Contents (TOC) dynamically
    const headerLines = textBody.split('\n').filter(line => line.trim().startsWith('#'));
    const tocItems = headerLines.map(line => {
      const level = line.trim().match(/^#+/)[0].length;
      const title = line.trim().replace(/^#+\s*/, '');
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return { level, title, slug };
    });

    const tocHtml = tocItems.map(item => `
      <div onclick="document.getElementById('doc-viewer-anchor-${item.slug}').scrollIntoView({ behavior: 'smooth' })" 
           style="cursor:pointer; font-size:12px; color:var(--text-secondary); margin-left:${(item.level - 1) * 12}px; padding:4px 0; font-weight:500; transition:color 0.2s;"
           onmouseover="this.style.color='var(--accent)'" 
           onmouseout="this.style.color='var(--text-secondary)'">
        ${item.title}
      </div>
    `).join('');

    // Convert markdown headings to HTML headings with anchors
    let parsedBodyHtml = textBody;
    tocItems.forEach(item => {
      const headingTag = `h${Math.min(item.level + 1, 6)}`;
      const regex = new RegExp(`^#{${item.level}}\\s+${item.title.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'm');
      parsedBodyHtml = parsedBodyHtml.replace(regex, `
        <div id="doc-viewer-anchor-${item.slug}" style="height: 10px; margin-top: -10px;"></div>
        <${headingTag} style="color:var(--text-primary); font-weight:700; margin:16px 0 10px; border-bottom:1px solid var(--border-subtle); padding-bottom:6px;">${item.title}</${headingTag}>
      `);
    });

    // Format paragraphs and bullets
    parsedBodyHtml = parsedBodyHtml.split('\n').map(line => {
      if (line.trim().startsWith('* ') || line.trim().startsWith('- ')) {
        return `<li style="margin-left: 16px; margin-bottom: 6px; font-size: 13px; color: var(--text-secondary);">${line.trim().substring(2)}</li>`;
      }
      if (line.trim().length > 0 && !line.trim().startsWith('<')) {
        return `<p style="font-size:13.5px; color:var(--text-secondary); line-height:1.6; margin-bottom:12px;">${line}</p>`;
      }
      return line;
    }).join('\n');

    const body = `
      <div style="display:flex; height:60vh; max-height:550px; min-height:380px; gap:16px; overflow:hidden;">
        <!-- Table of Contents Sidebar -->
        <div style="width:190px; border-right:1px solid var(--border-default); padding-right:16px; display:flex; flex-direction:column; gap:12px; overflow-y:auto; flex-shrink:0;">
          <div style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary); text-transform:uppercase; font-weight:700;">Table of Contents</div>
          <div style="display:flex; flex-direction:column; gap:4px;">
            ${tocHtml || '<div style="font-size:11px; color:var(--text-tertiary);">No headers found</div>'}
          </div>
        </div>

        <!-- Document Content Reader -->
        <div style="flex:1; overflow-y:auto; padding-right:8px; scroll-behavior:smooth;" id="doc-viewer-scroll-body">
          <div style="font-size:11px; color:var(--accent); font-family:var(--font-mono); text-transform:uppercase; margin-bottom:4px;">${assetTypeLabel(doc.asset_type)}</div>
          <h1 style="color:var(--text-primary); font-size:20px; font-weight:800; margin:0 0 16px 0; line-height:1.2;">${doc.title}</h1>
          <div style="font-size:12px; color:var(--text-tertiary); margin-bottom:20px;">Added on ${formatDate(doc.created_at)}</div>
          <div style="font-family:var(--font-ui)">
            ${parsedBodyHtml}
          </div>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Close Reader</button>
      <button class="btn btn-primary btn-sm" onclick="window.open('${doc.file_url}','_blank')">Open Source URL ↗</button>
    `;

    openModal({
      title: 'Internal Document Reader',
      body: body,
      footer: footer,
      size: 'large'
    });
  }

  let _editDocId = null;

  function openEditDocModal(id) {
    _editDocId = id;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function closeEditDocPanel() {
    _editDocId = null;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function renderInlineEditForm(data) {
    const assetTypes = [...new Set(getCategories().flatMap(c => c.types))];
    return `
      <div style="margin-bottom:16px; font-size:13px; font-weight:700; color:var(--accent); font-family:var(--font-ui); display:flex; justify-content:space-between; align-items:center;">
        <span>EDIT METADATA</span>
        <button class="btn btn-sm btn-ghost" onclick="PAGE_DOCS.closeEditDocPanel()" style="padding:4px;">${ICONS.close}</button>
      </div>
      <div class="form-grid" style="grid-template-columns:1fr; gap:16px;">
        
        <!-- ROW 1 -->
        <div class="input-group">
          <label class="input-label" style="font-size:11px; font-weight:700;">TITLE *</label>
          <input class="input" id="doc-edit-title" type="text" placeholder="Title..." value="${data.title || ''}" style="font-size:13px; padding:10px;">
        </div>
        
        <!-- ROW 2 -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
          <div class="input-group">
            <label class="input-label" style="font-size:11px; font-weight:700;">CLIENT NAME</label>
            <input class="input" id="doc-edit-client" type="text" value="${data.client_name || 'Internal'}" style="font-size:13px; padding:10px;">
          </div>
          <div class="input-group">
            <label class="input-label" style="font-size:11px; font-weight:700;">VISIBILITY</label>
            <select class="select" id="doc-edit-vis" style="font-size:13px; height:38px;">
              <option value="internal-only" ${data.visibility_status === 'internal-only' || !data.visibility_status ? 'selected':''}>Internal Only</option>
              <option value="client-safe" ${data.visibility_status === 'client-safe' ? 'selected':''}>Client Safe</option>
            </select>
          </div>
        </div>

        <!-- ROW 3 -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; align-items:start;">
          <div class="input-group">
            <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">ASSET TYPE</label>
            <select class="select" id="doc-edit-type" style="font-size:13px; height:38px;">
              ${assetTypes.map(t => `<option value="${t}" ${data.asset_type === t ? 'selected':''}>${assetTypeLabel(t)}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">GEO *</label>
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px;" id="doc-edit-geos">
              ${['Global','North America','Europe','LATAM','APAC','Middle East','Africa'].map(g => {
                const isChecked = (data.geos || []).includes(g) || data.geo === g;
                return `
                <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${g}" style="accent-color:var(--accent);" ${isChecked ? 'checked' : ''}> ${g}
                </label>
                `
              }).join('')}
            </div>
          </div>
        </div>

        <!-- ROW 4 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">VERTICALS / INDUSTRIES *</label>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;" id="doc-edit-verticals">
            ${['AI','Apps','B2B','B2C','Cyber Security','eCommerce','Education','FinTech','Gaming','Healthcare','iGaming','Real Estate','SaaS','Sports Betting','Trading','Web3','Other'].map(v => `
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${v}" style="accent-color:var(--accent);" ${(data.verticals || []).includes(v) || data.vertical === v ? 'checked' : ''}> ${v}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- ROW 5 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700; margin-bottom:8px;">SERVICES PROVIDED *</label>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;" id="doc-edit-services">
            ${['Analytics','Content','Design','Email Marketing','Influencer Marketing','NDA','PPC','PR','SEO','Social Media','Web / Landing Pages'].map(s => `
              <label style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" value="${s}" style="accent-color:var(--accent);" ${(data.services_provided || []).includes(s) ? 'checked' : ''}> ${s}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- ROW 6 -->
        <div class="input-group" style="padding-top:8px; border-top:1px solid var(--border-subtle);">
          <label class="input-label" style="font-size:11px; font-weight:700;">FILE URL / LINK *</label>
          <input class="input" id="doc-edit-url" type="url" placeholder="https://…" value="${data.file_url || ''}" style="font-size:13px; padding:10px;">
        </div>

        <!-- ROW 7 -->
        <div class="input-group">
          <label class="input-label" style="font-size:11px; font-weight:700;">DESCRIPTION</label>
          <textarea class="input" id="doc-edit-desc" rows="3" placeholder="Short description…" style="font-size:13px; padding:10px; line-height:1.4;">${data.description || ''}</textarea>
        </div>

        <div style="display:flex; justify-content:center; margin-top:16px;">
          <button class="btn btn-primary" id="doc-edit-save-btn" style="padding:10px 32px; font-size:14px; font-weight:600; border-radius:6px; letter-spacing:0.3px; width:100%; max-width:240px;">
            Save Changes
          </button>
        </div>
        <div id="doc-edit-error" class="login-error" style="margin-top:10px; display:none; text-align:center;"></div>
      </div>
    `;
  }

  function bindInlineEditForm(wrap, originalData) {
    const btn = wrap.querySelector('#doc-edit-save-btn');
    if (!btn) return;

    btn.addEventListener('click', () => {
      const title = wrap.querySelector('#doc-edit-title').value.trim();
      const url = wrap.querySelector('#doc-edit-url').value.trim();
      const err = wrap.querySelector('#doc-edit-error');

      if (!title || !url) {
        err.style.display = 'block';
        err.textContent = 'Title and File URL are required.';
        return;
      }
      err.style.display = 'none';

      const checkedVerts = wrap.querySelectorAll('#doc-edit-verticals input[type="checkbox"]:checked');
      const parsedVerticals = Array.from(checkedVerts).map(cb => cb.value);
      const firstVertical = parsedVerticals[0] || 'Other';

      const checkedServices = wrap.querySelectorAll('#doc-edit-services input[type="checkbox"]:checked');
      const services = Array.from(checkedServices).map(cb => cb.value);
      
      const checkedGeos = wrap.querySelectorAll('#doc-edit-geos input[type="checkbox"]:checked');
      const parsedGeos = Array.from(checkedGeos).map(cb => cb.value);
      const geoStr = parsedGeos.length ? parsedGeos.join(', ') : 'Global';

      const assetType = wrap.querySelector('#doc-edit-type').value || 'other';

      let fileType = originalData.file_type || 'pdf';
      const urlLower = url.toLowerCase();
      if (urlLower.includes('docs.google.com/document') || urlLower.includes('drive.google.com/file')) fileType = 'doc-link';
      else if (urlLower.includes('docs.google.com/spreadsheets') || urlLower.includes('docs.google.com/sheet')) fileType = 'spreadsheet-link';
      
      const record = {
        title,
        client_name: wrap.querySelector('#doc-edit-client').value.trim() || 'Internal',
        geo: geoStr,
        geos: parsedGeos,
        vertical: firstVertical,
        verticals: parsedVerticals.length ? parsedVerticals : [firstVertical],
        asset_type: assetType,
        visibility_status: wrap.querySelector('#doc-edit-vis').value,
        file_type: fileType,
        file_url: url,
        thumbnail_url: originalData.thumbnail_url || '',
        description: wrap.querySelector('#doc-edit-desc').value.trim(),
        tags: [...parsedVerticals, assetType, ...services],
        services_provided: services,
        related_assets: originalData.related_assets || []
      };

      STORE.updateMaterial(originalData.id, record);
      STORE.syncClientGeo(record.client_name, record.geo);
      showToast('Document updated successfully', 'success');
      
      _editDocId = null;
      const container = document.getElementById('page-container');
      if (container) render(container);
    });
  }

  return { 
    render, 
    toggleTag, 
    removeTag, 
    clearAllTags,
    openAddDocModal,
    openManageCategoriesModal,
    openDocumentViewer,
    addCategoryFromManager,
    renameCategoryInline,
    deleteCategoryInline,
    showCreateCategoryInput,
    addCustomCategory,
    saveNewDocument,
    handleDocFileDrop,
    handleDocFileSelect,
    openEditDocModal,
    closeEditDocPanel,
    togglePin,
    getDocTypes
  };
})();

window.PAGE_DOCS = PAGE_DOCS;
