/**
 * STORE.JS — Unified content store
 *
 * Manages in-memory state from seed data + localStorage overrides.
 * Admin-created records are persisted to localStorage and merged on load.
 *
 * In production: replace localStorage calls with API persistence.
 */

'use strict';

const STORE = (() => {

  const LS_KEY = 'np_portal_content';

  // ── Load user-created records from localStorage/Server ──
  function loadUserData() {
    let data = null;

    // 1. Try fetching from server data.php synchronously
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'data.php?t=' + Date.now(), false); // synchronous XHR with cache-busting
      xhr.send(null);
      if (xhr.status === 200) {
        data = JSON.parse(xhr.responseText);
      }
    } catch (e) {
      console.warn('Server database load failed, using localStorage fallback:', e);
    }

    // 2. Load local storage data to check for local-only overrides (to prevent data loss from Brave)
    let localData = null;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        localData = JSON.parse(raw);
      }
    } catch (e) {
      console.warn('LocalStorage load failed:', e);
    }

    // 3. Merge server and local data
    if (data && localData) {
      let merged = false;
      
      const serverMaterialIdx = new Map((data.materials || []).map((m, i) => [m.id, i]));
      (localData.materials || []).forEach(m => {
        if (!serverMaterialIdx.has(m.id)) {
          data.materials.push(m);
          merged = true;
        } else {
          data.materials[serverMaterialIdx.get(m.id)] = m;
          merged = true;
        }
      });

      const serverRefIdx = new Map((data.clientRefs || []).map((r, i) => [r.id, i]));
      (localData.clientRefs || []).forEach(r => {
        if (!serverRefIdx.has(r.id)) {
          data.clientRefs.push(r);
          merged = true;
        } else {
          data.clientRefs[serverRefIdx.get(r.id)] = r;
          merged = true;
        }
      });

      const serverProfileIdx = new Map((data.clientProfiles || []).map((p, i) => [p.id, i]));
      (localData.clientProfiles || []).forEach(p => {
        if (!serverProfileIdx.has(p.id)) {
          data.clientProfiles.push(p);
          merged = true;
        } else {
          data.clientProfiles[serverProfileIdx.get(p.id)] = p;
          merged = true;
        }
      });

      // Merge _deletedSeeds
      const serverDeleted = new Set(data._deletedSeeds || []);
      (localData._deletedSeeds || []).forEach(id => {
        if (!serverDeleted.has(id)) {
          data._deletedSeeds = data._deletedSeeds || [];
          data._deletedSeeds.push(id);
          merged = true;
        }
      });

      // Merge deletedClientNames
      const serverDeletedNames = new Set(data.deletedClientNames || []);
      (localData.deletedClientNames || []).forEach(name => {
        if (!serverDeletedNames.has(name)) {
          data.deletedClientNames = data.deletedClientNames || [];
          data.deletedClientNames.push(name);
          merged = true;
        }
      });

      // Merge recycleBin
      if (localData.recycleBin) {
        data.recycleBin = data.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
        // materials
        const serverBinMats = new Set((data.recycleBin.materials || []).map(m => m.id));
        (localData.recycleBin.materials || []).forEach(m => {
          if (!serverBinMats.has(m.id)) {
            data.recycleBin.materials = data.recycleBin.materials || [];
            data.recycleBin.materials.push(m);
            merged = true;
          }
        });
        // clientRefs
        const serverBinRefs = new Set((data.recycleBin.clientRefs || []).map(r => r.id));
        (localData.recycleBin.clientRefs || []).forEach(r => {
          if (!serverBinRefs.has(r.id)) {
            data.recycleBin.clientRefs = data.recycleBin.clientRefs || [];
            data.recycleBin.clientRefs.push(r);
            merged = true;
          }
        });
        // clientProfiles
        const serverBinProfiles = new Set((data.recycleBin.clientProfiles || []).map(p => p.id));
        (localData.recycleBin.clientProfiles || []).forEach(p => {
          if (!serverBinProfiles.has(p.id)) {
            data.recycleBin.clientProfiles = data.recycleBin.clientProfiles || [];
            data.recycleBin.clientProfiles.push(p);
            merged = true;
          }
        });

        // Strip deleted items from stale server data
        if (data.materials) {
          const binned = new Set((data.recycleBin.materials || []).map(m => m.id));
          const deleted = new Set(data._deletedSeeds || []);
          data.materials = data.materials.filter(m => !binned.has(m.id) && !deleted.has(m.id));
        }
        if (data.clientRefs) {
          const binned = new Set((data.recycleBin.clientRefs || []).map(r => r.id));
          const deleted = new Set(data._deletedSeeds || []);
          data.clientRefs = data.clientRefs.filter(r => !binned.has(r.id) && !deleted.has(r.id));
        }
        if (data.clientProfiles) {
          const binned = new Set((data.recycleBin.clientProfiles || []).map(p => p.id));
          const deleted = new Set(data._deletedSeeds || []);
          data.clientProfiles = data.clientProfiles.filter(p => !binned.has(p.id) && !deleted.has(p.id));
        }
      }

      if (merged) {
        // Asynchronously save merged data back to the server
        try {
          const xhr = new XMLHttpRequest();
          xhr.open('POST', 'data.php', true);
          xhr.setRequestHeader('Content-Type', 'application/json');
          xhr.send(JSON.stringify(data));
        } catch (e) {}
      }
    } else if (!data && localData) {
      data = localData;
    }

    if (!data) {
      data = { materials: [], clientRefs: [], clientProfiles: [] };
    }

    data.materials = data.materials || [];
    data.clientRefs = data.clientRefs || [];
    data.clientProfiles = data.clientProfiles || [];

    // Heal duplicate IDs if any exist
    let modified = false;
    const seenIds = new Set();
    data.materials.forEach((m, idx) => {
      if (!m.id || seenIds.has(m.id)) {
        m.id = `mat-user-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
        modified = true;
      }
      seenIds.add(m.id);

      if (m.title === 'drive' && m.client_name && m.client_name !== 'Internal' && m.client_name !== 'Client Name Not Available') {
        m.title = m.client_name;
        modified = true;
      }
    });

    const seenRefIds = new Set();
    data.clientRefs.forEach((r, idx) => {
      if (!r.id || seenRefIds.has(r.id)) {
        r.id = `ref-user-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`;
        modified = true;
      }
      seenRefIds.add(r.id);
    });

    if (modified) {
      saveUserData(data);
    }
    return data;
  }

  function saveUserData(data) {
    // 1. Save to server database (asynchronous POST to data.php)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(data));
    } catch (e) {
      console.warn('Server save failed:', e);
    }

    // 2. Local backup
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }

  // ── Merged state ──
  let _state = null;

  function getState() {
    if (!_state) {
      const seed = window.PORTAL_DATA;
      const user = loadUserData();
      const deleted = user._deletedSeeds || [];

      // Materials override matching id
      const userMatIds = new Set(user.materials.map(m => m.id));
      const seededMaterials = seed.materials.filter(m => !deleted.includes(m.id) && !userMatIds.has(m.id));

      // Client references override matching client_name or id
      const userRefKeys = new Set(user.clientRefs.map(r => r.client_name.toLowerCase()));
      const userRefIds = new Set(user.clientRefs.map(r => r.id));
      const seededRefs = seed.clientRefs.filter(r => 
        !deleted.includes(r.id) && 
        !userRefIds.has(r.id) && 
        !userRefKeys.has(r.client_name.toLowerCase())
      );

      // Client profiles override matching client_name or id
      const userProfKeys = new Set(user.clientProfiles.map(p => p.client_name.toLowerCase()));
      const userProfIds = new Set(user.clientProfiles.map(p => p.id));
      const seededProfiles = seed.clientProfiles.filter(p => 
        !deleted.includes(p.id) && 
        !userProfIds.has(p.id) && 
        !userProfKeys.has(p.client_name.toLowerCase())
      );

      _state = {
        materials:      [...seededMaterials, ...user.materials],
        clientRefs:     [...seededRefs,      ...user.clientRefs],
        clientProfiles: [...seededProfiles,  ...user.clientProfiles]
      };
    }
    return _state;
  }

  function resetState() { _state = null; }

  // ── Getters ──
  function getMaterials() {
    const mats = getState().materials;
    if (window.SCREEN_SHARE_ACTIVE) {
      return mats.filter(m => m.visibility_status !== 'internal-only');
    }
    return mats;
  }
  function getClientRefs() {
    const refs = getState().clientRefs;
    if (!AUTH.canManageContent()) {
      try {
        const hidden = JSON.parse(localStorage.getItem('np_hidden_refs') || '[]');
        return refs.filter(r => !hidden.includes(r.id));
      } catch (e) {
        return refs;
      }
    }
    return refs;
  }
  function getClientProfiles() { return getState().clientProfiles; }

  // Filtered getters
  function getByType(assetType) {
    return getMaterials().filter(m => m.asset_type === assetType);
  }

  function getByVertical(vertical) {
    return getMaterials().filter(m => m.vertical === vertical);
  }

  function getByTypes(types) {
    return getMaterials().filter(m => types.includes(m.asset_type));
  }

  function getById(id) {
    return getMaterials().find(m => m.id === id)
      || getClientRefs().find(r => r.id === id)
      || getClientProfiles().find(p => p.id === id)
      || null;
  }

  function getMaterialById(id) {
    return getMaterials().find(m => m.id === id) || null;
  }

  function getProfileForClient(clientName) {
    return getClientProfiles().find(p =>
      p.client_name.toLowerCase() === clientName.toLowerCase()
    ) || null;
  }

  // ── Mutations (user content only) ──
  function _getUserData() { return loadUserData(); }

  function addMaterial(record) {
    record.id = record.id || `mat-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    record.created_at = record.created_at || new Date().toISOString().slice(0,10);
    const ud = _getUserData();
    ud.materials.push(record);
    saveUserData(ud);
    resetState();

    // Enablement material adoption hook
    try {
      if (window.PAGE_ENABLEMENT && typeof window.PAGE_ENABLEMENT.addNewMaterialTask === 'function') {
        window.PAGE_ENABLEMENT.addNewMaterialTask(record);
      }
    } catch(e) {
      console.warn("Enablement hook failed:", e);
    }

    return record;
  }

  function addClientRef(record) {
    record.id = record.id || `ref-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ud = _getUserData();
    ud.clientRefs.push(record);
    saveUserData(ud);
    resetState();
    return record;
  }

  function addClientProfile(record) {
    record.id = record.id || `profile-user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const ud = _getUserData();
    ud.clientProfiles.push(record);
    saveUserData(ud);
    resetState();
    return record;
  }

  function updateMaterial(id, updates) {
    const ud = _getUserData();
    const idx = ud.materials.findIndex(m => m.id === id);
    if (idx !== -1) {
      ud.materials[idx] = { ...ud.materials[idx], ...updates };
      saveUserData(ud);
    } else {
      // Editing seed data: store as override in user data
      const seed = window.PORTAL_DATA.materials.find(m => m.id === id);
      if (seed) {
        ud.materials.push({ ...seed, ...updates, _override: true });
        saveUserData(ud);
      }
    }
    resetState();
  }

  function deleteRecord(id, type) {
    const ud = _getUserData();
    if (type === 'material')      ud.materials      = ud.materials.filter(m => m.id !== id);
    if (type === 'clientRef')     ud.clientRefs     = ud.clientRefs.filter(r => r.id !== id);
    if (type === 'clientProfile') ud.clientProfiles = ud.clientProfiles.filter(p => p.id !== id);
    saveUserData(ud);
    resetState();
  }

  function deleteMaterial(id) {
    const ud = _getUserData();
    const material = getMaterialById(id);
    if (material) {
      ud.recycleBin = ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
      ud.recycleBin.materials = ud.recycleBin.materials || [];
      if (!ud.recycleBin.materials.some(x => x.id === id)) {
        ud.recycleBin.materials.push({ ...material, deleted_at_time: Date.now() });
      }
    }
    const wasUser = ud.materials.some(m => m.id === id);
    ud.materials = ud.materials.filter(m => m.id !== id);
    if (!wasUser) {
      ud._deletedSeeds = ud._deletedSeeds || [];
      if (!ud._deletedSeeds.includes(id)) ud._deletedSeeds.push(id);
    }
    saveUserData(ud);
    resetState();
  }

  function deleteClientRef(id) {
    const ud = _getUserData();
    const ref = getClientRefs().find(r => r.id === id);
    if (ref) {
      ud.recycleBin = ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
      ud.recycleBin.clientRefs = ud.recycleBin.clientRefs || [];
      if (!ud.recycleBin.clientRefs.some(x => x.id === id)) {
        ud.recycleBin.clientRefs.push({ ...ref, deleted_at_time: Date.now() });
      }
      
      // Store deleted client name to prevent auto-regeneration via syncClients
      if (ref.client_name) {
        ud.deletedClientNames = ud.deletedClientNames || [];
        const lowerName = ref.client_name.toLowerCase();
        if (!ud.deletedClientNames.includes(lowerName)) {
          ud.deletedClientNames.push(lowerName);
        }
      }
    }
    const wasUser = ud.clientRefs.some(r => r.id === id);
    ud.clientRefs = ud.clientRefs.filter(r => r.id !== id);
    if (!wasUser) {
      ud._deletedSeeds = ud._deletedSeeds || [];
      if (!ud._deletedSeeds.includes(id)) ud._deletedSeeds.push(id);
    }
    saveUserData(ud);
    resetState();
  }

  function deleteClientProfile(id) {
    const ud = _getUserData();
    const profile = getClientProfiles().find(p => p.id === id);
    if (profile) {
      ud.recycleBin = ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
      ud.recycleBin.clientProfiles = ud.recycleBin.clientProfiles || [];
      if (!ud.recycleBin.clientProfiles.some(x => x.id === id)) {
        ud.recycleBin.clientProfiles.push({ ...profile, deleted_at_time: Date.now() });
      }
    }
    const wasUser = ud.clientProfiles.some(p => p.id === id);
    ud.clientProfiles = ud.clientProfiles.filter(p => p.id !== id);
    if (!wasUser) {
      ud._deletedSeeds = ud._deletedSeeds || [];
      if (!ud._deletedSeeds.includes(id)) ud._deletedSeeds.push(id);
    }
    saveUserData(ud);
    resetState();
  }

  function getDeletedClientNames() {
    const ud = loadUserData();
    return ud.deletedClientNames || [];
  }

  function getRecycleBin() {
    const ud = loadUserData();
    return ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
  }

  function restoreRecord(id, type) {
    const ud = loadUserData();
    ud.recycleBin = ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
    
    if (type === 'material') {
      const idx = ud.recycleBin.materials.findIndex(m => m.id === id);
      if (idx !== -1) {
        const record = ud.recycleBin.materials.splice(idx, 1)[0];
        delete record.deleted_at_time;
        if (record.id.startsWith('mat-user')) {
          ud.materials.push(record);
        } else {
          ud._deletedSeeds = (ud._deletedSeeds || []).filter(sid => sid !== id);
        }
      }
    } else if (type === 'clientRef') {
      const idx = ud.recycleBin.clientRefs.findIndex(r => r.id === id);
      if (idx !== -1) {
        const record = ud.recycleBin.clientRefs.splice(idx, 1)[0];
        delete record.deleted_at_time;
        if (record.id.startsWith('ref-user')) {
          ud.clientRefs.push(record);
        } else {
          ud._deletedSeeds = (ud._deletedSeeds || []).filter(sid => sid !== id);
        }
        if (record.client_name) {
          ud.deletedClientNames = (ud.deletedClientNames || []).filter(name => name !== record.client_name.toLowerCase());
        }
      }
    } else if (type === 'clientProfile') {
      const idx = ud.recycleBin.clientProfiles.findIndex(p => p.id === id);
      if (idx !== -1) {
        const record = ud.recycleBin.clientProfiles.splice(idx, 1)[0];
        delete record.deleted_at_time;
        ud.clientProfiles.push(record);
      }
    }
    saveUserData(ud);
    resetState();
  }

  function purgeRecord(id, type) {
    const ud = loadUserData();
    ud.recycleBin = ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
    
    if (type === 'material') {
      ud.recycleBin.materials = ud.recycleBin.materials.filter(m => m.id !== id);
    } else if (type === 'clientRef') {
      ud.recycleBin.clientRefs = ud.recycleBin.clientRefs.filter(r => r.id !== id);
    } else if (type === 'clientProfile') {
      ud.recycleBin.clientProfiles = ud.recycleBin.clientProfiles.filter(p => p.id !== id);
    }
    saveUserData(ud);
    resetState();
  }

  function syncClientGeo(clientName, geo) {
    if (!clientName || typeof clientName !== 'string' || clientName === 'Internal' || clientName === 'Client Name Not Available') return;
    const ud = _getUserData();

    // 1. Update materials in user data
    ud.materials.forEach(m => {
      if (m.client_name && typeof m.client_name === 'string' && m.client_name.toLowerCase() === clientName.toLowerCase()) {
        m.geo = geo;
      }
    });
    // Override seed materials matching this client
    window.PORTAL_DATA.materials.forEach(m => {
      if (m.client_name && typeof m.client_name === 'string' && m.client_name.toLowerCase() === clientName.toLowerCase()) {
        const alreadyOverridden = ud.materials.some(um => um.id === m.id);
        if (!alreadyOverridden) {
          ud.materials.push({ ...m, geo: geo, _override: true });
        }
      }
    });

    // 2. Update clientRefs in user data
    ud.clientRefs.forEach(r => {
      if (r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === clientName.toLowerCase()) {
        r.geo = geo;
      }
    });
    window.PORTAL_DATA.clientRefs.forEach(r => {
      if (r.client_name && typeof r.client_name === 'string' && r.client_name.toLowerCase() === clientName.toLowerCase()) {
        const alreadyOverridden = ud.clientRefs.some(ur => ur.id === r.id);
        if (!alreadyOverridden) {
          ud.clientRefs.push({ ...r, geo: geo });
        }
      }
    });

    // 3. Update clientProfiles in user data
    ud.clientProfiles.forEach(p => {
      if (p.client_name && typeof p.client_name === 'string' && p.client_name.toLowerCase() === clientName.toLowerCase()) {
        p.geo = geo;
      }
    });
    window.PORTAL_DATA.clientProfiles.forEach(p => {
      if (p.client_name && typeof p.client_name === 'string' && p.client_name.toLowerCase() === clientName.toLowerCase()) {
        const alreadyOverridden = ud.clientProfiles.some(up => up.id === p.id);
        if (!alreadyOverridden) {
          ud.clientProfiles.push({ ...p, geo: geo });
        }
      }
    });

    saveUserData(ud);
    resetState();
  }

  // ── Stats ──
  function getStats() {
    const mats = getMaterials();
    const refs = getClientRefs();
    const profiles = getClientProfiles();
    return {
      totalMaterials:  mats.length,
      totalCases:      mats.filter(m => m.asset_type === 'case').length,
      totalCreatives:  mats.filter(m => ['creative','video','image'].includes(m.asset_type)).length,
      totalDocs:       mats.filter(m => ['contract','template','process-doc','training','deck'].includes(m.asset_type)).length,
      totalRefs:       refs.length,
      totalProfiles:   profiles.length,
      clientSafe:      mats.filter(m => m.visibility_status === 'client-safe').length,
      internalOnly:    mats.filter(m => m.visibility_status === 'internal-only').length
    };
  }

  return {
    getMaterials, getClientRefs, getClientProfiles,
    getByType, getByVertical, getByTypes, getById, getMaterialById, getProfileForClient,
    addMaterial, addClientRef, addClientProfile,
    updateMaterial, deleteMaterial, deleteClientRef, deleteClientProfile,
    getDeletedClientNames, getRecycleBin, restoreRecord, purgeRecord,
    syncClientGeo,
    getStats,
    loadUserData, saveUserData, resetState
  };
})();
