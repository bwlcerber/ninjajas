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

  let _cachedUserData = null;

  // ── Load user-created records from localStorage/Server ──
  function loadUserData() {
    if (_cachedUserData) {
      return JSON.parse(JSON.stringify(_cachedUserData));
    }

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
        if (serverMaterialIdx.has(m.id)) {
          data.materials[serverMaterialIdx.get(m.id)] = m;
          merged = true;
        } else {
          data.materials.push(m);
          merged = true;
        }
      });

      const serverRefIdx = new Map((data.clientRefs || []).map((r, i) => [r.id, i]));
      (localData.clientRefs || []).forEach(r => {
        if (serverRefIdx.has(r.id)) {
          data.clientRefs[serverRefIdx.get(r.id)] = r;
          merged = true;
        } else {
          data.clientRefs.push(r);
          merged = true;
        }
      });

      const serverProfileIdx = new Map((data.clientProfiles || []).map((p, i) => [p.id, i]));
      (localData.clientProfiles || []).forEach(p => {
        if (serverProfileIdx.has(p.id)) {
          data.clientProfiles[serverProfileIdx.get(p.id)] = p;
          merged = true;
        } else {
          data.clientProfiles.push(p);
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

        // Sanitize clientRefs website_url
        if (data.clientRefs) {
          data.clientRefs.forEach(r => {
            if (r.website_url && r.website_url.includes('ninjapromo.io')) {
              r.website_url = '';
            }
          });
          merged = true;
        }

        // Merge customOrder
        if (localData.customOrder) {
          data.customOrder = data.customOrder || {};
          for (let type in localData.customOrder) {
             if (!data.customOrder[type]) {
               data.customOrder[type] = localData.customOrder[type];
               merged = true;
             }
          }
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
      data = { materials: [], clientRefs: [], clientProfiles: [], customOrder: {} };
    }

    data.materials = data.materials || [];
    data.clientRefs = data.clientRefs || [];
    data.clientProfiles = data.clientProfiles || [];
    data.customOrder = data.customOrder || {};

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
      
      // Migrate 'Design' and 'Web / Landing Pages' to 'Web & LP Design'
      if (m.services_provided && Array.isArray(m.services_provided)) {
        let changed = false;
        
        const designIdx = m.services_provided.indexOf('Design');
        if (designIdx !== -1) {
          m.services_provided[designIdx] = 'Web & LP Design';
          changed = true;
        }
        
        const webIdx = m.services_provided.indexOf('Web / Landing Pages');
        if (webIdx !== -1) {
          m.services_provided[webIdx] = 'Web & LP Design';
          changed = true;
        }
        
        if (changed) {
          m.services_provided = Array.from(new Set(m.services_provided)); // Deduplicate
          modified = true;
        }
      }
    });

    // Cleanup duplicate influencer-marketing creatives caused by legacy addKol logic
    const toKeepMats = [];
    data.materials.forEach(m => {
      if (m.asset_type === 'influencer-marketing' && m.file_url) {
        // Find matching original creative
        const original = data.materials.find(other => 
          other.asset_type === 'creatives' && 
          other.file_url === m.file_url && 
          other.client_name === m.client_name && 
          other.id !== m.id
        );
        if (original) {
          // Ensure original has the tag, then discard this duplicate
          if (!original.tags) original.tags = [];
          if (!original.tags.includes('influencer-marketing')) {
            original.tags.push('influencer-marketing');
          }
          modified = true;
          return; // skip pushing to toKeepMats
        }
      }
      toKeepMats.push(m);
    });
    if (data.materials.length !== toKeepMats.length) {
      data.materials = toKeepMats;
      modified = true;
    }

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
    
    // Sanitize customOrder to prevent v2 ghost IDs breaking drag-and-drop
    if (data.customOrder) {
      const idMap = {
        'mat-wafee-v2': 'mat-wafee-v3',
        'mat-b01': 'mat-wafee-v3',
        'mat-voto-v2': 'mat-voto-v3',
        'mat-b03': 'mat-voto-v3'
      };
      for (let type in data.customOrder) {
        data.customOrder[type] = data.customOrder[type].map(id => idMap[id] || id);
        data.customOrder[type] = Array.from(new Set(data.customOrder[type]));
      }
    }

    // Migrate old customOrder to customScores (Fractional Sorting)
    if (data.customOrder && !data.customScores) {
      data.customScores = {};
      for (let type in data.customOrder) {
        data.customScores[type] = {};
        let score = 1000;
        for (let id of data.customOrder[type]) {
          data.customScores[type][id] = score;
          score += 1000;
        }
      }
      modified = true;
    }
    
    if (modified) {
      saveUserData(data);
    }
    
    
    // ── AUTOMATED GLOBAL MIGRATIONS ──
    const arraysToMigrate = [data.materials, data.clientRefs, data.clientDocs, data.clientProfiles];
    arraysToMigrate.forEach(arr => {
      if (arr && Array.isArray(arr)) {
        arr.forEach(item => {
          if (!item) return;
          
          // 1. Rename Web Design variations to Web & LP Design globally
          const serviceFields = ['services_provided', 'verticals']; 
          serviceFields.forEach(field => {
            if (item[field] && Array.isArray(item[field])) {
              let changed = false;
              item[field] = item[field].map(svc => {
                if (typeof svc === 'string' && svc.toLowerCase().includes('web design') && svc.toLowerCase().includes('landing pages')) {
                  changed = true;
                  return 'Web & LP Design';
                }
                if (typeof svc === 'string' && svc.toLowerCase().includes('web') && svc.toLowerCase().includes('landing pages')) {
                  changed = true;
                  return 'Web & LP Design';
                }
                return svc;
              });
              if (changed) {
                item[field] = Array.from(new Set(item[field])); // dedupe
                modified = true;
              }
            }
          });

          // Migrate social-media-link to smm-profiles
          if (item.asset_type === 'social-media-link' || item.asset_type === 'social-media-profile') {
            item.asset_type = 'smm-profiles';
            modified = true;
          }
          if (item.tags && Array.isArray(item.tags)) {
            const smIdx = item.tags.indexOf('social-media-link');
            if (smIdx !== -1) {
              item.tags[smIdx] = 'smm-profiles';
              item.tags = Array.from(new Set(item.tags)); // dedupe
              modified = true;
            }
          }

          // Also check string fields just in case
          const stringFields = ['vertical'];
          stringFields.forEach(field => {
            if (item[field] && typeof item[field] === 'string') {
              if (item[field].toLowerCase().includes('web design') && item[field].toLowerCase().includes('landing pages')) {
                item[field] = 'Web & LP Design';
                modified = true;
              }
            }
          });

          // 2. Append 'Performance Report [Paid ads]' to Performance Marketing docs
          if (item.title === 'Reply Guy report' && item.asset_type === 'case') {
            item.asset_type = 'other';
            modified = true;
          }

          if (item.asset_type === 'report' || item.asset_type === 'performance-marketing') {
            if (item.title && typeof item.title === 'string' && !item.title.toLowerCase().includes('performance report')) {
              item.title = item.title.trim() + ' Performance Report [Paid ads]';
              modified = true;
            }
          }

          // 3. Migrate legacy asset types to new Client Files taxonomy
          if (item.client_name !== 'Internal' && !['case', 'branding', 'creative', 'creatives', 'video', 'image'].includes(item.asset_type)) {
            const oldType = item.asset_type;
            const services = item.services_provided || [];
            const tags = item.tags || [];
            let newType = oldType;

            if (services.includes('Influencer Marketing') || tags.includes('influencer')) {
              if (oldType === 'smm-profiles' || oldType === 'social-media-link' || oldType === 'social-media-profile') {
                newType = 'smm-profiles';
              } else if (oldType === 'contract') {
                newType = 'other-files';
              } else {
                newType = 'influencer-marketing';
              }
            } else if (services.includes('SEO')) {
              newType = 'seo-geo';
            } else if (oldType === 'smm-profiles' || oldType === 'social-media-link' || oldType === 'social-media-profile') {
              newType = 'smm-profiles';
            } else if (oldType === 'gtm' || tags.includes('gtm')) {
              newType = 'gtms';
            } else if (services.includes('PR') || tags.includes('pr')) {
              newType = 'pr-demos';
            } else if (oldType === 'report') {
              newType = 'performance-marketing';
            } else if (oldType === 'media-plan') {
              newType = 'ppc-media-plans';
            } else if (['deck', 'contract', 'template', 'process-doc', 'pdf', 'doc-link', 'spreadsheet-link', 'offer-prep', 'other', 'others'].includes(oldType)) {
              newType = 'other-files';
            }

            if (oldType !== newType) {
              item.asset_type = newType;
              modified = true;
            }
          }


        });
      }
    });

    _cachedUserData = JSON.parse(JSON.stringify(data));
    return data;
  }

  function saveUserData(data) {
    // Sanitize any massive Base64 images from old buggy uploads to prevent crashing the DB
    if (data && data.materials) {
      data.materials.forEach(m => {
        if (m.thumbnail_url && m.thumbnail_url.startsWith('data:image') && m.thumbnail_url.length > 3000000) {
          m.thumbnail_url = ''; // Wipe out massive base64 string
        }
        if (m.file_url && m.file_url.startsWith('data:image') && m.file_url.length > 3000000) {
          m.file_url = '';
        }
      });
    }

    _cachedUserData = JSON.parse(JSON.stringify(data));
    
    // 1. Save to server database (async POST to data.php)
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.onload = function() {
        try {
          const res = JSON.parse(xhr.responseText);
          if (!res.success) {
            console.error('Server save failed:', res);
            if (typeof showToast === 'function') {
              showToast('⚠️ Save to server failed: ' + (res.error || 'unknown error') + '. Data is in local backup only.', 'error');
            }
          }
        } catch (e) {
          console.error('Save response parse error:', e, xhr.responseText);
        }
      };
      xhr.onerror = function() {
        console.error('Server save XHR error');
        if (typeof showToast === 'function') {
          showToast('⚠️ Could not reach server. Data saved locally only — may not sync to other devices.', 'error');
        }
      };
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
      const userMatsMap = new Map(user.materials.map(m => [m.id, m]));
      const resolvedMaterials = seed.materials.filter(m => !deleted.includes(m.id)).map(m => userMatsMap.has(m.id) ? userMatsMap.get(m.id) : m);
      const seedMatIds = new Set(seed.materials.map(m => m.id));
      const userOnlyMats = user.materials.filter(m => !seedMatIds.has(m.id));

      // Client references override matching client_name or id
      const userRefsMap = new Map(user.clientRefs.map(r => [r.id, r]));
      const userRefKeys = new Map(user.clientRefs.map(r => [(r.client_name || 'N/A').toLowerCase(), r]));
      const resolvedRefs = seed.clientRefs.filter(r => !deleted.includes(r.id)).map(r => {
        if (userRefsMap.has(r.id)) return userRefsMap.get(r.id);
        if (userRefKeys.has((r.client_name || 'N/A').toLowerCase())) return userRefKeys.get((r.client_name || 'N/A').toLowerCase());
        return r;
      });
      const seedRefIds = new Set(seed.clientRefs.map(r => r.id));
      const seedRefKeys = new Set(seed.clientRefs.map(r => (r.client_name || 'N/A').toLowerCase()));
      const userOnlyRefs = user.clientRefs.filter(r => !seedRefIds.has(r.id) && !seedRefKeys.has((r.client_name || 'N/A').toLowerCase()));

      // Client profiles override matching client_name or id
      const userProfsMap = new Map(user.clientProfiles.map(p => [p.id, p]));
      const userProfKeys = new Map(user.clientProfiles.map(p => [(p.client_name || 'N/A').toLowerCase(), p]));
      const resolvedProfiles = seed.clientProfiles.filter(p => !deleted.includes(p.id)).map(p => {
        if (userProfsMap.has(p.id)) return userProfsMap.get(p.id);
        if (userProfKeys.has((p.client_name || 'N/A').toLowerCase())) return userProfKeys.get((p.client_name || 'N/A').toLowerCase());
        return p;
      });
      const seedProfIds = new Set(seed.clientProfiles.map(p => p.id));
      const seedProfKeys = new Set(seed.clientProfiles.map(p => (p.client_name || 'N/A').toLowerCase()));
      const userOnlyProfs = user.clientProfiles.filter(p => !seedProfIds.has(p.id) && !seedProfKeys.has((p.client_name || 'N/A').toLowerCase()));

      const materialsArr = [...resolvedMaterials, ...userOnlyMats];
      
      // Aggressive deduplication by client_name + title + asset_type + file_url to fix cache duplicates
      const uniqueMatsMap = new Map();
      materialsArr.forEach(m => {
        const key = `${(m.client_name || '').toLowerCase().trim()}-${(m.title || '').toLowerCase().trim()}-${m.asset_type}-${(m.file_url || '').toLowerCase().trim()}`;
        if (!uniqueMatsMap.has(key)) {
          uniqueMatsMap.set(key, m);
        }
      });
      const dedupedMaterials = Array.from(uniqueMatsMap.values());

      // Aggressive deduplication by client_name to fix cache duplicates for refs
      const uniqueRefsMap = new Map();
      [...resolvedRefs, ...userOnlyRefs].forEach(r => {
        const key = (r.client_name || '').toLowerCase().trim();
        if (!uniqueRefsMap.has(key)) {
          uniqueRefsMap.set(key, r);
        }
      });
      const dedupedRefs = Array.from(uniqueRefsMap.values());
      
      // Apply customOrder if exists
      dedupedMaterials.sort((a, b) => {
        // Group by asset type first to preserve stable ordering across types
        const aType = a.asset_type || '';
        const bType = b.asset_type || '';
        const typeDiff = aType.localeCompare(bType);
        if (typeDiff !== 0) return typeDiff;

        // Apply custom score if exists
        const type = a.asset_type;
        if (user.customScores && user.customScores[type]) {
          const scores = user.customScores[type];
          
          let aId = a.id;
          let bId = b.id;
          // Alias check for ghost IDs
          if (aId === 'mat-b01' || aId === 'mat-wafee-v2') aId = 'mat-wafee-v3';
          if (aId === 'mat-b03' || aId === 'mat-voto-v2') aId = 'mat-voto-v3';
          if (bId === 'mat-b01' || bId === 'mat-wafee-v2') bId = 'mat-wafee-v3';
          if (bId === 'mat-b03' || bId === 'mat-voto-v2') bId = 'mat-voto-v3';

          const aScore = scores[aId] !== undefined ? scores[aId] : 999999;
          const bScore = scores[bId] !== undefined ? scores[bId] : 999999;
          
          if (aScore !== bScore) return aScore - bScore;
        }
        return 0; // preserve original relative order for non-matching or un-ordered
      });

      _state = {
        materials:      dedupedMaterials,
        clientRefs:     dedupedRefs,
        clientProfiles: [...resolvedProfiles,  ...userOnlyProfs]
      };
    }
    return _state;
  }

  function resetState() { _state = null; }

  function moveMaterialScore(type, draggedId, previousId, nextId) {
    const ud = loadUserData();
    ud.customScores = ud.customScores || {};
    
    if (!ud.customScores[type] || Object.keys(ud.customScores[type]).length === 0) {
      // Initialize with natural order if missing
      ud.customScores[type] = {};
      const seed = window.PORTAL_DATA;
      const allMats = [...seed.materials, ...(ud.materials || [])].filter(m => m.asset_type === type);
      let s = 1000;
      for (let m of allMats) {
        ud.customScores[type][m.id] = s;
        s += 1000;
      }
    }
    
    const scores = ud.customScores[type];
    const prevScore = previousId && scores[previousId] !== undefined ? scores[previousId] : null;
    const nextScore = nextId && scores[nextId] !== undefined ? scores[nextId] : null;
    
    let newScore = 0;
    if (prevScore !== null && nextScore !== null) {
      newScore = (prevScore + nextScore) / 2;
    } else if (prevScore !== null) {
      newScore = prevScore + 1000;
    } else if (nextScore !== null) {
      newScore = nextScore - 1000;
    } else {
      newScore = 1000;
    }
    
    scores[draggedId] = newScore;
    saveUserData(ud);
    resetState();
  }

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
      (p.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()
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
    record.updated_at = Date.now();
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
    const oldMaterial = getMaterialById(id);
    if (oldMaterial && typeof extractServerFilesFromRecord === 'function' && typeof deleteServerFile === 'function') {
      const oldFiles = extractServerFilesFromRecord(oldMaterial);
      const newMaterial = { ...oldMaterial, ...updates };
      const newFiles = extractServerFilesFromRecord(newMaterial);
      const replacedFiles = oldFiles.filter(f => !newFiles.includes(f));
      if (replacedFiles.length > 0) {
        deleteServerFile(replacedFiles);
      }
    }
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
    let recordToDelete = null;
    if (type === 'material') {
      recordToDelete = (ud.materials || []).find(m => m.id === id);
      ud.materials = ud.materials.filter(m => m.id !== id);
    }
    if (type === 'clientRef') {
      recordToDelete = (ud.clientRefs || []).find(r => r.id === id);
      ud.clientRefs = ud.clientRefs.filter(r => r.id !== id);
    }
    if (type === 'clientProfile') {
      recordToDelete = (ud.clientProfiles || []).find(p => p.id === id);
      ud.clientProfiles = ud.clientProfiles.filter(p => p.id !== id);
    }

    if (recordToDelete && typeof extractServerFilesFromRecord === 'function' && typeof deleteServerFile === 'function') {
      const serverFiles = extractServerFilesFromRecord(recordToDelete);
      if (serverFiles.length > 0) {
        deleteServerFile(serverFiles);
      }
    }

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
    ud.materials = ud.materials.filter(m => m.id !== id);
    ud._deletedSeeds = ud._deletedSeeds || [];
    if (!ud._deletedSeeds.includes(id)) ud._deletedSeeds.push(id);
    
    // Also remove from any customOrder arrays so it doesn't leave gaps
    if (ud.customOrder) {
      for (let t in ud.customOrder) {
        ud.customOrder[t] = ud.customOrder[t].filter(mId => mId !== id);
      }
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
        const lowerName = (ref.client_name || 'N/A').toLowerCase();
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
          ud.deletedClientNames = (ud.deletedClientNames || []).filter(name => name !== (record.client_name || 'N/A').toLowerCase());
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
    let recordToPurge = null;
    
    if (type === 'material') {
      recordToPurge = (ud.recycleBin.materials || []).find(m => m.id === id);
      ud.recycleBin.materials = (ud.recycleBin.materials || []).filter(m => m.id !== id);
    } else if (type === 'clientRef') {
      recordToPurge = (ud.recycleBin.clientRefs || []).find(r => r.id === id);
      ud.recycleBin.clientRefs = (ud.recycleBin.clientRefs || []).filter(r => r.id !== id);
    } else if (type === 'clientProfile') {
      recordToPurge = (ud.recycleBin.clientProfiles || []).find(p => p.id === id);
      ud.recycleBin.clientProfiles = (ud.recycleBin.clientProfiles || []).filter(p => p.id !== id);
    }

    if (recordToPurge && typeof extractServerFilesFromRecord === 'function' && typeof deleteServerFile === 'function') {
      const serverFiles = extractServerFilesFromRecord(recordToPurge);
      if (serverFiles.length > 0) {
        deleteServerFile(serverFiles);
      }
    }

    saveUserData(ud);
    resetState();
  }

  function emptyRecycleBin() {
    const ud = loadUserData();
    ud.recycleBin = ud.recycleBin || { materials: [], clientRefs: [], clientProfiles: [] };
    
    const allRecords = [
      ...(ud.recycleBin.materials || []),
      ...(ud.recycleBin.clientRefs || []),
      ...(ud.recycleBin.clientProfiles || [])
    ];

    const allFiles = new Set();
    allRecords.forEach(rec => {
      if (typeof extractServerFilesFromRecord === 'function') {
        const files = extractServerFilesFromRecord(rec);
        files.forEach(f => allFiles.add(f));
      }
    });

    if (allFiles.size > 0 && typeof deleteServerFile === 'function') {
      deleteServerFile(Array.from(allFiles));
    }

    ud.recycleBin = { materials: [], clientRefs: [], clientProfiles: [] };
    saveUserData(ud);
    resetState();
    return allFiles.size;
  }

  function syncClientGeo(clientName, geo, providedUd = null) {
    if (!clientName || typeof clientName !== 'string' || clientName === 'Internal' || clientName === 'Client Name Not Available') return;
    const shouldSave = !providedUd;
    const ud = providedUd || _getUserData();

    // 1. Update materials in user data
    ud.materials.forEach(m => {
      if (m.client_name && typeof m.client_name === 'string' && (m.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()) {
        m.geo = geo;
      }
    });
    // Override seed materials matching this client
    window.PORTAL_DATA.materials.forEach(m => {
      if (m.client_name && typeof m.client_name === 'string' && (m.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()) {
        const alreadyOverridden = ud.materials.some(um => um.id === m.id);
        if (!alreadyOverridden) {
          ud.materials.push({ ...m, geo: geo, _override: true });
        }
      }
    });

    // 2. Update clientRefs in user data
    ud.clientRefs.forEach(r => {
      if (r.client_name && typeof r.client_name === 'string' && (r.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()) {
        r.geo = geo;
      }
    });
    window.PORTAL_DATA.clientRefs.forEach(r => {
      if (r.client_name && typeof r.client_name === 'string' && (r.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()) {
        const alreadyOverridden = ud.clientRefs.some(ur => ur.id === r.id);
        if (!alreadyOverridden) {
          ud.clientRefs.push({ ...r, geo: geo });
        }
      }
    });

    // 3. Update clientProfiles in user data
    ud.clientProfiles.forEach(p => {
      if (p.client_name && typeof p.client_name === 'string' && (p.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()) {
        p.geo = geo;
      }
    });
    window.PORTAL_DATA.clientProfiles.forEach(p => {
      if (p.client_name && typeof p.client_name === 'string' && (p.client_name || 'N/A').toLowerCase() === clientName.toLowerCase()) {
        const alreadyOverridden = ud.clientProfiles.some(up => up.id === p.id);
        if (!alreadyOverridden) {
          ud.clientProfiles.push({ ...p, geo: geo });
        }
      }
    });

    if (shouldSave) {
      saveUserData(ud);
      resetState();
    }
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
    moveMaterialScore,
    getDeletedClientNames, getRecycleBin, restoreRecord, purgeRecord, emptyRecycleBin,
    syncClientGeo,
    getStats,
    loadUserData, saveUserData, resetState
  };
})();
