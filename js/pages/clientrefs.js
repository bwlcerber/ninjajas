/** PAGE: Client References */
'use strict';

const PAGE_CLIENTREFS = (() => {

  let _vertical = 'all';
  let _query = '';
  const _selectedTags = new Set();

  // Ingestion temporary state
  let _fetchedData = null;
  let _isFetching = false;
  let _sortOrder = 'recent';

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
        const hasMaterials = materials.some(m => m.client_name?.trim().toLowerCase() === (ref.client_name || '').toLowerCase());
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
          <div style="display:flex; gap:8px; flex-wrap:wrap; margin-bottom:10px;">
            <button class="btn btn-xs btn-outline" onclick="PAGE_CLIENTREFS.selectAllVerticals(true)" style="font-size:11px; padding:4px 8px; display:inline-flex; align-items:center; gap:6px; border-color:var(--accent) !important; color:var(--text-primary) !important; background:transparent;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg> Select All
            </button>
            <button class="btn btn-xs btn-outline" onclick="PAGE_CLIENTREFS.selectAllVerticals(false)" style="font-size:11px; padding:4px 8px; display:inline-flex; align-items:center; gap:6px; border-color:var(--danger) !important; color:var(--danger) !important; background:transparent;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg> Deselect All
            </button>
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
              ${services.map(s => `
                <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                  <input type="checkbox" value="${s}" style="accent-color:var(--accent);"> ${s}
                </label>
              `).join('')}
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
      
      let fileType = 'pdf';
      const urlLower = manualUrl.toLowerCase();
      if (urlLower.includes('docs.google.com/document') || urlLower.includes('drive.google.com/file')) fileType = 'doc-link';
      else if (urlLower.includes('docs.google.com/spreadsheets') || urlLower.includes('docs.google.com/sheet')) fileType = 'spreadsheet-link';
      else if (urlLower.match(/\.(mp4|mov|avi|webm)$/)) fileType = 'video';
      else if (urlLower.match(/\.(png|jpg|jpeg|gif|webp)$/)) fileType = 'image';

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

    STAGED_ASSETS.forEach(asset => {
      const record = {
        title: asset.name,
        client_name: client,
        geo,
        vertical: finalVertical,
        verticals: finalVerticals,
        asset_type: type,
        visibility_status: vis,
        file_type: asset.fileType,
        file_url: asset.url,
        thumbnail_url: thumb,
        description: desc || `Added for ${client}.`,
        tags: [...finalVerticals, type, ...services],
        services_provided: services,
        related_assets: []
      };
      STORE.addMaterial(record);
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

