/** PAGE: Call Library */
'use strict';

const PAGE_CALLLIBRARY3 = (() => {

  const SALESPEOPLE = ['Alex', 'Damon', 'Julia', 'Max', 'Maxime', 'Melina', 'Paul'];
  const OBJECTION_TYPES = ['!Think about it', 'Budget / Price', 'Competition', 'Decision Makers / Partner', 'Past Experience', 'Timing', 'Trust and Authority', 'Window Shopping'];

  let _selectedDealSize = 'all';
  let _selectedIndustry = 'all';
  let _selectedObjectionType = 'all';

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
        industries: ['Fintech', 'SaaS'],
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
      },
      {
        id: 'call-003',
        category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-price-demo',
        deal_size: '120 hours',
        industries: ['SaaS'],
        salesperson: 'Alex',
        objection_type: 'Budget / Price',
        created_at: '2026-06-15'
      },
      {
        id: 'call-004',
        category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-trust-cold',
        deal_size: 'commission',
        industries: ['Web3'],
        salesperson: 'Damon',
        objection_type: 'Trust and Authority',
        created_at: '2026-06-20'
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
    const industries = window.PORTAL_DATA ? window.PORTAL_DATA.VERTICALS : ['Fintech', 'Web3', 'Trading', 'eCommerce', 'Healthcare', 'iGaming', 'Sports Betting', 'SaaS', 'B2B', 'B2C', 'AI', 'Real Estate', 'Other'];

    // Apply filtering
    const filteredClosedWon = allCalls.filter(c => {
      if (c.category !== 'Closed Won Deals') return false;
      const sizeMatch = _selectedDealSize === 'all' || c.deal_size.toLowerCase() === _selectedDealSize.toLowerCase();
      const industryMatch = _selectedIndustry === 'all' || c.industries.includes(_selectedIndustry);
      return sizeMatch && industryMatch;
    });

    const filteredObjections = allCalls.filter(c => {
      if (c.category !== 'Objection Handling') return false;
      const sizeMatch = _selectedDealSize === 'all' || c.deal_size.toLowerCase() === _selectedDealSize.toLowerCase();
      const industryMatch = _selectedIndustry === 'all' || c.industries.includes(_selectedIndustry);
      const objectionMatch = _selectedObjectionType === 'all' || c.objection_type === _selectedObjectionType;
      return sizeMatch && industryMatch && objectionMatch;
    });

    container.innerHTML = `
      <div class="page-header">
        <div class="page-header-row">
            <div class="page-subtitle" style="font-size:22px; font-weight:700; color:var(--text-primary); max-width:none; line-height:1.3; margin-top:0;">Internal archive of successful sales calls.</div>
          <div style="display:flex; gap:8px;">
            ${isSuperAdmin ? `
              <button class="btn btn-primary" onclick="PAGE_CALLLIBRARY3.openAddCallModal()">
                ${ICONS.plus} Add Fathom Link
              </button>
            ` : ''}
          </div>
        </div>

        <!-- Filters Block -->
        <div style="display:flex; flex-wrap:wrap; gap:12px; margin-top:16px;">
          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary); text-transform:uppercase;">Browse by Deal Size</span>
            <select class="select" id="filter-deal-size" onchange="PAGE_CALLLIBRARY3.setDealSizeFilter(this.value)" style="height:32px; padding:0 24px 0 10px; font-size:12px; width:160px;">
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
            <select class="select" id="filter-industry" onchange="PAGE_CALLLIBRARY3.setIndustryFilter(this.value)" style="height:36px; padding:0 24px 0 12px; font-size:13px; width:180px;">
              <option value="all" ${_selectedIndustry === 'all' ? 'selected' : ''}>All Industries</option>
              ${(window.PORTAL_DATA ? window.PORTAL_DATA.VERTICALS : ['Fintech', 'Web3', 'Trading', 'eCommerce', 'Healthcare', 'iGaming', 'Sports Betting', 'SaaS', 'B2B', 'B2C', 'AI', 'Real Estate', 'Other']).map(i => `<option value="${i}" ${_selectedIndustry === i ? 'selected' : ''}>${i}</option>`).join('')}
            </select>
          </div>

          <div style="display:flex; flex-direction:column; gap:4px;">
            <span style="font-size:10px; font-family:var(--font-mono); color:var(--text-tertiary); text-transform:uppercase;">Browse by Objection</span>
            <select class="select" id="filter-objection" onchange="PAGE_CALLLIBRARY3.setObjectionFilter(this.value)" style="height:36px; padding:0 24px 0 12px; font-size:13px; width:180px;">
              <option value="all" ${_selectedObjectionType === 'all' ? 'selected' : ''}>All Objections</option>
              ${OBJECTION_TYPES.map(obj => `<option value="${obj}" ${_selectedObjectionType === obj ? 'selected' : ''}>${obj}</option>`).join('')}
            </select>
          </div>

          ${(_selectedDealSize !== 'all' || _selectedIndustry !== 'all' || _selectedObjectionType !== 'all') ? `
            <button class="btn btn-sm btn-ghost" onclick="PAGE_CALLLIBRARY3.resetFilters()" style="align-self:flex-end; color:var(--danger); font-size:12px; height:36px;">
              ✕ Clear Filters
            </button>
          ` : ''}
        </div>

        <div style="display:flex; flex-direction:column; gap:48px;">
          
          <div style="display:flex; flex-direction:column; gap:20px;">
            <div style="font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:8px;">
              <span style="width:8px; height:8px; border-radius:50%; background:#2ecc71;"></span> Closed Won Deals
            </div>
            <div class="v3-gallery">
              ${filteredClosedWon.map(c => renderGalleryCard(c)).join('')}
            </div>
          </div>

          <div style="display:flex; flex-direction:column; gap:20px;">
            <div style="font-family:var(--font-mono); font-size:13px; font-weight:700; color:var(--text-primary); text-transform:uppercase; letter-spacing:0.05em; display:flex; align-items:center; gap:8px;">
              <span style="width:8px; height:8px; border-radius:50%; background:var(--danger);"></span> Objection Handling
            </div>
            <div class="v3-gallery">
              ${filteredObjections.map(c => renderGalleryCard(c)).join('')}
            </div>
          </div>

        </div>
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

  function setObjectionFilter(val) {
    _selectedObjectionType = val;
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function resetFilters() {
    _selectedDealSize = 'all';
    _selectedIndustry = 'all';
    _selectedObjectionType = 'all';
    const container = document.getElementById('page-container');
    if (container) render(container);
  }

  function renderGalleryCard(c) {
    const isObjection = c.category === 'Objection Handling';
    const title = isObjection ? (c.objection_type || 'Objection') : 'Primary Deal Call';
    const bgGradient = isObjection ? 'linear-gradient(45deg, #1f0b0b, #331515)' : 'linear-gradient(45deg, #091c10, #133a21)';

    return `
      <a href="${c.main_link}" target="_blank" class="v3-card" style="background: ${bgGradient}; text-decoration: none;">
        
        <div class="v3-top-tags">
          ${isObjection 
            ? `<span class="v3-tag" style="background:var(--danger)">Objection</span>` 
            : `<span class="v3-tag" style="background:#2ecc71; color:#000;">Deal Won</span>`}
          <span class="v3-tag">${c.salesperson}</span>
        </div>

        <div class="v3-related-btn" onclick="event.preventDefault(); PAGE_CALLLIBRARY3.openMoreAssets('${c.id}')">
          Related Calls
        </div>

        <div class="v3-play-icon">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
        </div>

        <div style="display:flex; flex-direction:column; gap:4px;">
          <div style="font-size:24px; font-weight:700; line-height:1.2;">
            ${title}
          </div>
          <div style="display:flex; justify-content:space-between; align-items:flex-end;">
            <div style="font-family:var(--font-mono); font-size:12px; color:rgba(255,255,255,0.7);">
              ${isObjection && c.objection_timing ? `⏱ ${c.objection_timing} • ` : ''}
              ${c.created_at}
            </div>
            ${!isObjection ? `<div style="font-family:var(--font-mono); font-size:12px; font-weight:700;">${c.industries[0]||'General'} / ${c.deal_size}</div>` : ''}
          </div>
        </div>
      </a>
    `;
  }

  window.toggleCallCategoryFields = function(category) {
    const objFields = document.getElementById('call-objection-fields');
    const closedWonFields = document.getElementById('call-closedwon-fields');
    const dealSizeFields = document.getElementById('call-deal-size-fields');
    if (category === 'Objection Handling') {
      objFields.style.display = 'flex';
      closedWonFields.style.display = 'none';
      dealSizeFields.style.display = 'none';
    } else {
      objFields.style.display = 'none';
      closedWonFields.style.display = 'flex';
      dealSizeFields.style.display = 'block';
    }
  };

  function openAddCallModal() {
    const industries = window.PORTAL_DATA ? window.PORTAL_DATA.VERTICALS : ['Fintech', 'Web3', 'Trading', 'eCommerce', 'Healthcare', 'iGaming', 'Sports Betting', 'SaaS', 'B2B', 'B2C', 'AI', 'Real Estate', 'Other'];
    const packageSizes = ['120 hours', '240 hours', '480 hours', '960 hours', '1920 hours', 'commission'];

    const body = `
      <div style="display:flex; flex-direction:column; gap:14px;" id="add-call-form">
        
        <div class="input-group">
          <span class="input-label">Call Category *</span>
          <div style="display:flex; gap:16px;">
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; cursor:pointer;">
              <input type="radio" name="call-category" value="Closed Won Deals" checked onchange="toggleCallCategoryFields(this.value)"> Closed Won Deal
            </label>
            <label style="display:flex; align-items:center; gap:6px; font-size:12px; cursor:pointer;">
              <input type="radio" name="call-category" value="Objection Handling" onchange="toggleCallCategoryFields(this.value)"> Objection Handling
            </label>
          </div>
        </div>

        <div class="input-group">
          <span class="input-label">Main Sales Call Link (Fathom URL)*</span>
          <input class="input" type="url" id="call-main-link" placeholder="https://fathom.video/share/..." required>
        </div>

        <div id="call-closedwon-fields" style="display:flex; flex-direction:column; gap:14px;">
          <div class="input-group">
            <span class="input-label">Second Follow-up Call Link (Optional)</span>
            <input class="input" type="url" id="call-followup-link" placeholder="https://fathom.video/share/...">
          </div>

          <div class="input-group">
            <span class="input-label">Presales / Prospect Call Link (Optional)</span>
            <input class="input" type="url" id="call-prospect-link" placeholder="https://fathom.video/share/...">
          </div>
        </div>

        <div id="call-objection-fields" style="display:none; flex-direction:column; gap:14px;">
          <div style="display:flex; gap:16px; align-items: flex-end;">
            <div class="input-group" style="flex:1; margin:0;">
              <span class="input-label">Objection Type *</span>
              <select class="select" id="call-objection-type" style="width:100%;">
                ${OBJECTION_TYPES.map(obj => `<option value="${obj}">${obj}</option>`).join('')}
              </select>
            </div>
            <div class="input-group" style="flex:1.5; margin:0;">
              <span class="input-label">Timing *</span>
              <input class="input" type="text" id="call-objection-timing" placeholder="e.g. 16:54" required style="width:100%;">
            </div>
          </div>
        </div>

        <!-- Deal Size Checkboxes -->
        <div class="input-group" id="call-deal-size-fields">
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
                <input type="checkbox" class="ind-checkbox" value="${ind}" style="accent-color:var(--accent);" onchange="PAGE_CALLLIBRARY3.limitIndustries(this)"> ${ind}
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
      <button class="btn btn-primary btn-sm" onclick="PAGE_CALLLIBRARY3.saveCallRecord()">Save Call</button>
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
    const categoryChecked = document.querySelector('input[name="call-category"]:checked');
    const category = categoryChecked ? categoryChecked.value : 'Closed Won Deals';

    const mainLink = document.getElementById('call-main-link').value.trim();
    let followupLink = '';
    let prospectLink = '';
    let objectionType = '';
    let objectionTiming = '';

    if (category === 'Closed Won Deals') {
      followupLink = document.getElementById('call-followup-link').value.trim();
      prospectLink = document.getElementById('call-prospect-link').value.trim();
    } else {
      objectionType = document.getElementById('call-objection-type').value;
      objectionTiming = document.getElementById('call-objection-timing').value.trim();
      if (!objectionTiming) {
        showToast('Objection timing is required', 'error');
        return;
      }
    }
    
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
      category: category,
      main_link: mainLink,
      followup_link: followupLink,
      prospect_link: prospectLink,
      deal_size: dealSize,
      industries: selectedIndustries,
      salesperson: salesperson,
      objection_type: objectionType,
      objection_timing: objectionTiming,
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
    setObjectionFilter,
    resetFilters
  };
})();

window.PAGE_CALLLIBRARY3 = PAGE_CALLLIBRARY3;
