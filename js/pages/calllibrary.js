/** PAGE: Call Library */
'use strict';

const PAGE_CALLLIBRARY = (() => {

  const SALESPEOPLE = ['Alex', 'Damon', 'Julia', 'Max', 'Maxime', 'Melina', 'Paul'];

  let _selectedDealSize = 'all';
  let _selectedIndustry = 'all';

  // Seed default calls if none exist
  function getCalls() {
    try {
      const raw = localStorage.getItem('np_call_library');
      if (raw) return JSON.parse(raw);
    } catch (e) {}

    const seed = [
      {
        id: 'call-001',
        category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-fintech-480h',
        followup_link: 'https://fathom.video/share/won-fintech-followup',
        prospect_link: 'https://fathom.video/share/won-fintech-presales',
        deal_size: '480 hours',
        industries: ['FinTech', 'SaaS'],
        salesperson: 'Julia',
        created_at: '2026-05-12'
      },
      {
        id: 'call-002',
        category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-igaming-commission',
        followup_link: '',
        prospect_link: 'https://fathom.video/share/won-igaming-presales',
        deal_size: 'commission',
        industries: ['iGaming', 'Sports Betting'],
        salesperson: 'Max',
        created_at: '2026-06-01'
      }
    ];
    localStorage.setItem('np_call_library', JSON.stringify(seed));
    return seed;
  }

  function saveCall(call) {
    const calls = getCalls();
    calls.push(call);
    localStorage.setItem('np_call_library', JSON.stringify(calls));
  }

  function render(container) {
    const allCalls = getCalls();
    const isSuperAdmin = AUTH.canManageContent();
    const industries = window.PORTAL_DATA ? window.PORTAL_DATA.VERTICALS : ['FinTech', 'Web3', 'Trading', 'eCommerce', 'Healthcare', 'iGaming', 'Sports Betting', 'SaaS', 'B2B', 'B2C', 'AI', 'Real Estate', 'Other'];

    // Apply filtering
    const filteredCalls = allCalls.filter(c => {
      const sizeMatch = _selectedDealSize === 'all' || c.deal_size.toLowerCase() === _selectedDealSize.toLowerCase();
      const industryMatch = _selectedIndustry === 'all' || c.industries.includes(_selectedIndustry);
      return sizeMatch && industryMatch;
    });

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:none; line-height:1.3; margin-top:0;">Internal archive of successful sales calls.</div>
          <div style="display:flex; gap:8px;">
            ${isSuperAdmin ? `
              <button class="btn btn-primary" onclick="PAGE_CALLLIBRARY.openAddCallModal()">
                ${ICONS.plus} Add Fathom Link
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filters Block -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:16px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary); text-transform:uppercase;">Browse by Deal Size</span>
            <select class="select" id="filter-deal-size" onchange="PAGE_CALLLIBRARY.setDealSizeFilter(this.value)" style="height:32px; padding:0 24px 0 10px; font-size:12px; width:160px;">
              <option value="all" ${_selectedDealSize === 'all' ? 'selected' : ''}>All Deal Sizes</option>
              <option value="120 hours" ${_selectedDealSize === '120 hours' ? 'selected' : ''}>120 hours</option>
              <option value="240 hours" ${_selectedDealSize === '240 hours' ? 'selected' : ''}>240 hours</option>
              <option value="480 hours" ${_selectedDealSize === '480 hours' ? 'selected' : ''}>480 hours</option>
              <option value="960 hours" ${_selectedDealSize === '960 hours' ? 'selected' : ''}>960 hours</option>
              <option value="1920 hours" ${_selectedDealSize === '1920 hours' ? 'selected' : ''}>1920 hours</option>
              <option value="commission" ${_selectedDealSize === 'commission' ? 'selected' : ''}>Commission</option>
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary); text-transform:uppercase;">Browse by Industry</span>
            <select class="select" id="filter-industry" onchange="PAGE_CALLLIBRARY.setIndustryFilter(this.value)" style="height:32px; padding:0 24px 0 10px; font-size:12px; width:160px;">
              <option value="all" ${_selectedIndustry === 'all' ? 'selected' : ''}>All Industries</option>
              ${industries.map(ind => `<option value="${ind}" ${_selectedIndustry === ind ? 'selected' : ''}>${ind}</option>`).join('')}
            </select>
          </div>

          ${(_selectedDealSize !== 'all' || _selectedIndustry !== 'all') ? `
            <button class="btn btn-sm btn-ghost" onclick="PAGE_CALLLIBRARY.resetFilters()" style="align-self:flex-end; color:var(--danger); font-size:11.5px; height:32px;">
              ✕ Clear Filters
            </button>
          ` : ''}
        </div>
      </div>

      <div class="call-library-container" style="display:flex; flex-direction:column; gap:16px; margin-top:16px;">
        <div style="font-family:var(--font-mono); font-size:11px; color:var(--accent); text-transform:uppercase; letter-spacing:0.08em;">CLOSED WON DEALS</div>

        <div id="call-list-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:16px;">
          ${filteredCalls.map(c => renderCallCard(c)).join('')}
        </div>

        ${filteredCalls.length === 0 ? `
          <div class="empty-state">
            <div class="empty-icon">🎥</div>
            <div class="empty-title">No recordings match selected filters</div>
          </div>
        ` : ''}
      </div>
    `;
  }

  function setDealSizeFilter(val) {
    _selectedDealSize = val;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function setIndustryFilter(val) {
    _selectedIndustry = val;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function resetFilters() {
    _selectedDealSize = 'all';
    _selectedIndustry = 'all';
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function renderCallCard(c) {
    return `
      <div class="card call-record-card" style="border:1px solid var(--border-default); border-radius:var(--r-md); background:var(--bg-2); display:flex; flex-direction:column; height:auto; overflow:hidden;">
        <!-- Header -->
        <div style="padding:16px; border-bottom: 1px solid var(--border-subtle); display:flex; justify-content:space-between; align-items:center;">
          <div>
            <span class="tag tag-accent" style="font-size:9px;">${c.industries[0] || 'General'}</span>
            <span class="tag tag-default" style="font-size:9px; margin-left:4px;">${c.deal_size}</span>
          </div>
          <span style="font-family:var(--font-mono); font-size:10px; color:var(--text-tertiary)">${c.created_at}</span>
        </div>

        <!-- Body / Main Video Link -->
        <div style="padding:16px; display:flex; flex-direction:column; gap:12px;">
          <div style="background:var(--bg-3); border-radius:4px; padding:16px; border:1px solid var(--border-subtle); text-align:center; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:8px;">
            <div style="font-size:24px;">🎙️</div>
            <div style="font-size:12px; font-weight:700; color:var(--text-primary)">Primary Deal Call</div>
            <a href="${c.main_link}" target="_blank" style="text-transform:none; font-family:var(--font-mono); font-size:11px; color:#3990e0; font-weight:normal; text-decoration:underline;">
              ${c.main_link.replace('https://', '')} ↗
            </a>
          </div>

          <div style="display:flex; justify-content:space-between; align-items:center; font-size:12px;">
            <div style="color:var(--text-secondary)">Sales: <strong style="color:var(--text-primary)">${c.salesperson}</strong></div>
            <div style="display:flex; gap:4px;">
              ${c.industries.slice(1).map(ind => `<span class="tag tag-default" style="font-size:9px;">${ind}</span>`).join('')}
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div style="padding:12px 16px; background:var(--bg-3); border-top:1px solid var(--border-top); display:flex; justify-content:flex-end;">
          <button class="btn btn-sm btn-secondary" onclick="PAGE_CALLLIBRARY.openMoreAssets('${c.id}')" style="width:100%; justify-content:center;">
            More Assets
          </button>
        </div>
      </div>
    `;
  }

  function openAddCallModal() {
    const industries = window.PORTAL_DATA ? window.PORTAL_DATA.VERTICALS : ['FinTech', 'Web3', 'Trading', 'eCommerce', 'Healthcare', 'iGaming', 'Sports Betting', 'SaaS', 'B2B', 'B2C', 'AI', 'Real Estate', 'Other'];
    const packageSizes = ['120 hours', '240 hours', '480 hours', '960 hours', '1920 hours', 'commission'];

    const body = `
      <div style="display:flex; flex-direction:column; gap:14px;" id="add-call-form">
        <div class="input-group">
          <span class="input-label">Main Sales Call Link (Fathom URL)*</span>
          <input class="input" type="url" id="call-main-link" placeholder="https://fathom.video/share/..." required>
        </div>

        <div class="input-group">
          <span class="input-label">Second Follow-up Call Link (Optional)</span>
          <input class="input" type="url" id="call-followup-link" placeholder="https://fathom.video/share/...">
        </div>

        <div class="input-group">
          <span class="input-label">Presales / Prospect Call Link (Optional)</span>
          <input class="input" type="url" id="call-prospect-link" placeholder="https://fathom.video/share/...">
        </div>

        <!-- Deal Size Checkboxes -->
        <div class="input-group">
          <span class="input-label">Package Deal Size</span>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:8px;">
            ${packageSizes.map(sz => `
              <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                <input type="radio" name="deal-size" value="${sz}" style="accent-color:var(--accent);" ${sz === '120 hours' ? 'checked' : ''}> ${sz}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Industries (1 to 3 max) -->
        <div class="input-group">
          <span class="input-label">Industry Assignment (Max 3)</span>
          <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:6px;" id="call-industries-list">
            ${industries.map(ind => `
              <label style="display:flex; align-items:center; gap:6px; font-size:11.5px; color:var(--text-secondary); cursor:pointer;">
                <input type="checkbox" class="ind-checkbox" value="${ind}" style="accent-color:var(--accent);" onchange="PAGE_CALLLIBRARY.limitIndustries(this)"> ${ind}
              </label>
            `).join('')}
          </div>
        </div>

        <!-- Salesperson -->
        <div class="input-group">
          <span class="input-label">Sales Assigned</span>
          <select class="select" id="call-salesperson">
            ${SALESPEOPLE.map(sp => `<option value="${sp}">${sp}</option>`).join('')}
          </select>
        </div>
      </div>
    `;

    const footer = `
      <button class="btn btn-secondary btn-sm" onclick="closeModal()">Cancel</button>
      <button class="btn btn-primary btn-sm" onclick="PAGE_CALLLIBRARY.saveCallRecord()">Save Call</button>
    `;

    openModal({
      title: 'Add New Call Record',
      body: body,
      footer: footer,
      size: 'medium'
    });
  }

  function limitIndustries(cb) {
    const checked = document.querySelectorAll('#call-industries-list input:checked');
    if (checked.length > 3) {
      cb.checked = false;
      showToast('You can select a maximum of 3 industries', 'warning');
    }
  }

  function saveCallRecord() {
    const mainLink = document.getElementById('call-main-link').value.trim();
    const followupLink = document.getElementById('call-followup-link').value.trim();
    const prospectLink = document.getElementById('call-prospect-link').value.trim();
    
    if (!mainLink) {
      showToast('Main sales call link is required', 'error');
      return;
    }

    const sizeChecked = document.querySelector('input[name="deal-size"]:checked');
    const dealSize = sizeChecked ? sizeChecked.value : 'commission';

    const indChecked = document.querySelectorAll('#call-industries-list input:checked');
    const selectedIndustries = Array.from(indChecked).map(c => c.value);

    if (selectedIndustries.length === 0) {
      showToast('Please select at least one industry', 'error');
      return;
    }

    const salesperson = document.getElementById('call-salesperson').value;

    const callObj = {
      id: 'call-' + Date.now(),
      category: 'Closed Won Deals',
      main_link: mainLink,
      followup_link: followupLink,
      prospect_link: prospectLink,
      deal_size: dealSize,
      industries: selectedIndustries,
      salesperson: salesperson,
      created_at: new Date().toISOString().split('T')[0]
    };

    saveCall(callObj);
    closeModal();
    showToast('Call record successfully saved');
    
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function openMoreAssets(callId) {
    const calls = getCalls();
    const c = calls.find(x => x.id === callId);
    if (!c) return;

    const makeThumb = (title, url) => {
      if (!url) return '';
      return `
        <div style="background:var(--bg-4); border:1px solid var(--border-default); border-radius:var(--r-md); padding:16px; flex:1; display:flex; flex-direction:column; align-items:center; gap:10px;">
          <div style="font-size:28px;">📹</div>
          <div style="font-size:12px; font-weight:700; color:var(--text-primary); font-family:var(--font-ui)">${title}</div>
          <a href="${url}" target="_blank" style="text-transform:none; font-family:var(--font-mono); font-size:11px; color:#3990e0; font-weight:normal; text-decoration:underline;">
            fathom.video ↗
          </a>
        </div>
      `;
    };

    const body = `
      <div style="display:flex; flex-direction:column; gap:16px;">
        <div style="display:flex; flex-direction:row; gap:12px; flex-wrap:wrap;">
          ${makeThumb('Primary Sales Call', c.main_link)}
          ${c.followup_link ? makeThumb('Follow-up Sales Call', c.followup_link) : ''}
          ${c.prospect_link ? makeThumb('Presales & Prospect Call', c.prospect_link) : ''}
        </div>
        ${(!c.followup_link && !c.prospect_link) ? `
          <div style="font-size:12px; color:var(--text-tertiary); text-align:center; padding:12px;">No secondary or prospect recordings attached to this deal.</div>
        ` : ''}
      </div>
    `;

    openModal({
      title: `More Assets — Sales: ${c.salesperson} (${c.deal_size})`,
      body: body,
      footer: `<button class="btn btn-secondary btn-sm" onclick="closeModal()">Close</button>`,
      size: 'medium'
    });
  }

  return {
    render,
    openAddCallModal,
    saveCallRecord,
    limitIndustries,
    openMoreAssets,
    setDealSizeFilter,
    setIndustryFilter,
    resetFilters
  };
})();

window.PAGE_CALLLIBRARY = PAGE_CALLLIBRARY;
