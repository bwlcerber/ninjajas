/** PAGE: Client Mini Profiles */
'use strict';

const PAGE_MINIPROFILES = (() => {

  let _query = '';

  function render(container, focusId = null) {
    const profiles = STORE.getClientProfiles();

    // If focusId provided, open that profile detail
    if (focusId) {
      const profile = profiles.find(p => p.id === focusId);
      if (profile) {
        renderDetail(container, profile);
        return;
      }
    }

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:850px; line-height:1.3; margin-top:0;">Lightweight context cards for sales storytelling. Click any profile to view related assets.</div>
          ${window.CAN_MANAGE ? `<button class="btn btn-primary" onclick="ROUTER.navigate('admin')">${ICONS.plus} Add Profile</button>` : ''}
        </div>

        <div class="search-bar">
          ${ICONS.search}
          <input id="profiles-search" type="text" placeholder="Search by client name, service, or geo…" value="${_query}" autocomplete="off">
        </div>
      </div>

      <div id="profiles-grid" class="profiles-grid"></div>
    `;

    container.querySelector('#profiles-search').addEventListener('input', e => {
      _query = e.target.value;
      renderGrid(container);
    });

    renderGrid(container);
  }

  function renderGrid(container) {
    let items = STORE.getClientProfiles();

    if (_query.trim()) {
      const q = _query.toLowerCase();
      items = items.filter(p =>
        [p.client_name, p.geo, p.product_summary, ...(p.services_provided || [])].join(' ').toLowerCase().includes(q)
      );
    }

    const grid = container.querySelector('#profiles-grid');

    if (items.length === 0) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><div class="empty-icon">${ICONS.profiles}</div><div class="empty-title">No profiles found</div></div>`;
      return;
    }

    grid.innerHTML = items.map(p => renderProfileCard(p)).join('');
  }

  function renderProfileCard(profile) {
    const assets = profile.related_assets || [];
    const initials = profile.client_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    return `
      <div class="profile-card animate-fade" style="cursor:pointer" onclick="ROUTER.navigate('miniprofiles','${profile.id}')">
        <div class="profile-header">
          <div class="profile-avatar">${initials}</div>
          <div>
            <div class="profile-name">${profile.client_name}</div>
            <div class="profile-geo">${profile.geo}</div>
          </div>
          ${profile.website_url ? `
            <a class="btn btn-sm btn-ghost" href="${profile.website_url}" target="_blank" rel="noopener"
               onclick="event.stopPropagation()" style="margin-left:auto" title="Open website">
              ${ICONS.external}
            </a>
          ` : ''}
        </div>
        <div class="profile-note">${truncate(profile.product_summary, 120)}</div>
        <div class="profile-services">
          ${(profile.services_provided || []).map(s => `<span class="tag tag-info" style="font-size:9px">${s}</span>`).join('')}
        </div>
        ${assets.length > 0 ? `
          <div style="display:flex;align-items:center;gap:8px;border-top:1px solid var(--border-subtle);padding-top:12px;margin-top:4px">
            <span class="count-pill">${assets.length} asset${assets.length !== 1 ? 's' : ''}</span>
            <button class="btn btn-sm btn-outline" onclick="event.stopPropagation();openAllInTabs(${JSON.stringify(assets)})">
              ${ICONS.open_all} Open All
            </button>
            <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();ROUTER.navigate('miniprofiles','${profile.id}')">
              View Profile
            </button>
          </div>
        ` : ''}
      </div>`;
  }

  function renderDetail(container, profile) {
    const assets = profile.related_assets || [];
    const materials = assets.map(id => STORE.getMaterialById(id)).filter(Boolean);
    const ref = STORE.getClientRefs().find(r => r.client_name.toLowerCase() === profile.client_name.toLowerCase());
    const initials = profile.client_name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

    container.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:20px">
        <button class="btn btn-ghost btn-sm" onclick="ROUTER.navigate('miniprofiles')">
          ← Back to Profiles
        </button>
      </div>

      <div class="profile-detail-grid">
        <!-- Left: Profile card -->
        <div>
          <div class="profile-card" style="margin-bottom:16px">
            <div class="profile-header">
              <div class="profile-avatar" style="width:48px;height:48px;font-size:18px">${initials}</div>
              <div>
                <div class="profile-name" style="font-size:17px">${profile.client_name}</div>
                <div class="profile-geo">${profile.geo}</div>
              </div>
            </div>
            <div class="profile-note" style="-webkit-line-clamp:unset">${profile.product_summary}</div>
            <div class="profile-services">
              ${(profile.services_provided || []).map(s => `<span class="tag tag-info">${s}</span>`).join('')}
            </div>
            ${profile.website_url ? `
              <div style="margin-top:12px">
                <a class="btn btn-primary btn-sm w-full" href="${profile.website_url}" target="_blank" rel="noopener" style="justify-content:center">
                  ${ICONS.external} Open Website
                </a>
              </div>
            ` : ''}
          </div>



          ${assets.length > 0 ? `
            <div style="margin-top:12px">
              <button class="btn btn-outline w-full" style="justify-content:center" onclick="openAllInTabs(${JSON.stringify(assets)})">
                ${ICONS.open_all} Open All ${assets.length} Assets in Tabs
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
                <div class="empty-sub">Add assets in the Admin section and link them to this profile.</div>
              </div>`
          }
        </div>
      </div>
    `;
  }

  return { render };
})();

window.PAGE_MINIPROFILES = PAGE_MINIPROFILES;
