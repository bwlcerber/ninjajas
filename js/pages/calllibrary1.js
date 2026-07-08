/** PAGE: Call Library V0 */
'use strict';

const PAGE_CALLLIBRARY1 = (() => {

  const SALESPEOPLE = ['Alex', 'Damon', 'Julia', 'Max', 'Maxime', 'Melina', 'Paul'];
  const OBJECTION_TYPES = ['!Think about it', 'Budget / Price', 'Competition', 'Decision Makers / Partner', 'Past Experience', 'Timing', 'Trust and Authority', 'Window Shopping'];

  let _selectedDealSize = 'all';
  let _selectedIndustry = 'all';
  let _selectedObjectionType = 'all';

  function getCalls() {
    let serverCalls = [];
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'data.php?type=calls&t=' + Date.now(), false);
      xhr.send();
      if (xhr.status === 200) {
        const parsed = JSON.parse(xhr.responseText);
        if (Array.isArray(parsed) && parsed.length > 0) {
          serverCalls = parsed;
        }
      }
    } catch (e) {}

    let localCalls = [];
    try {
      const raw = localStorage.getItem('np_call_library');
      if (raw) localCalls = JSON.parse(raw);
    } catch (e) {}

    if (serverCalls.length > 0) {
      if (serverCalls.length > localCalls.length) {
          localStorage.setItem('np_call_library', JSON.stringify(serverCalls));
      }
      return serverCalls;
    }

    if (localCalls.length > 0) {
      try {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', 'data.php?type=calls', true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(localCalls));
      } catch (e) {}
      return localCalls;
    }

    const seed = [
      {
        id: 'call-v0-1', category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-1',
        deal_size: '480 hours', industries: ['Fintech'],
        salesperson: 'Alex', created_at: '2026-05-10',
        thumbnail: 'linear-gradient(135deg, oklch(0.32 0.14 240), oklch(0.28 0.16 210))'
      },
      {
        id: 'call-v0-2', category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-2',
        deal_size: 'commission', industries: ['Web3'],
        salesperson: 'Melina', created_at: '2026-05-15',
        thumbnail: 'linear-gradient(135deg, oklch(0.35 0.18 295), oklch(0.25 0.12 328))'
      },
      {
        id: 'call-v0-3', category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-3',
        deal_size: '240 hours', industries: ['SaaS'],
        salesperson: 'Marcus', created_at: '2026-06-01',
        thumbnail: 'linear-gradient(135deg, oklch(0.35 0.15 155), oklch(0.28 0.10 180))'
      },
      {
        id: 'call-v0-4', category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-4',
        deal_size: '120 hours', industries: ['Fintech'],
        salesperson: 'Sarah', created_at: '2026-06-10',
        thumbnail: 'linear-gradient(135deg, oklch(0.32 0.14 240), oklch(0.28 0.16 210))'
      },
      {
        id: 'call-v0-5', category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-5',
        deal_size: 'commission', industries: ['Web3'],
        salesperson: 'Jordan', created_at: '2026-06-22',
        thumbnail: 'linear-gradient(135deg, oklch(0.35 0.18 295), oklch(0.25 0.12 328))'
      },
      {
        id: 'call-v0-6', category: 'Closed Won Deals',
        main_link: 'https://fathom.video/share/won-6',
        deal_size: '480 hours', industries: ['SaaS'],
        salesperson: 'Alex', created_at: '2026-07-01',
        thumbnail: 'linear-gradient(135deg, oklch(0.35 0.15 155), oklch(0.28 0.10 180))'
      },
      {
        id: 'call-v0-7', category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-1?t=150',
        salesperson: 'Melina', objection_type: 'Budget / Price', created_at: '2026-05-20',
        timing: '02:30', summary: 'Client pushed back on the retainer size, handled by breaking down the hourly ROI.'
      },
      {
        id: 'call-v0-8', category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-2?t=340',
        salesperson: 'Marcus', objection_type: 'Timing', created_at: '2026-06-05',
        timing: '05:40', summary: 'They wanted to wait until Q3. Used the cost of inaction framework to create urgency.'
      },
      {
        id: 'call-v0-9', category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-3?t=420',
        salesperson: 'Sarah', objection_type: 'Competition', created_at: '2026-06-15',
        timing: '07:00', summary: 'Compared us to an offshore agency. Pivot to quality of deliverables and timezone overlap.'
      },
      {
        id: 'call-v0-10', category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-4?t=180',
        salesperson: 'Jordan', objection_type: '!Think about it', created_at: '2026-06-25',
        timing: '03:00', summary: 'Standard stall tactic. Asked what exactly they needed to think about to uncover the real objection.'
      },
      {
        id: 'call-v0-11', category: 'Objection Handling',
        main_link: 'https://fathom.video/share/obj-5?t=500',
        salesperson: 'Alex', objection_type: 'Decision Makers / Partner', created_at: '2026-07-02',
        timing: '08:20', summary: 'Need to run it by the CEO. Scheduled a micro-demo for the CEO next week.'
      }
    ];
    localStorage.setItem('np_call_library', JSON.stringify(seed));
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php?type=calls', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(seed));
    } catch (e) {}
    return seed;
  }

  function saveCall(call) {
    const calls = getCalls();
    calls.push(call);
    localStorage.setItem('np_call_library', JSON.stringify(calls));
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php?type=calls', true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(calls));
    } catch (e) {}
  }

  function render(container) {
    const allCalls = getCalls();
    
    const filteredClosedWon = allCalls.filter(c => {
      if (c.category !== 'Closed Won Deals') return false;
      const sizeMatch = _selectedDealSize === 'all' || (c.deal_size && c.deal_size.toLowerCase() === _selectedDealSize.toLowerCase());
      const industryMatch = _selectedIndustry === 'all' || (c.industries && c.industries.includes(_selectedIndustry));
      return sizeMatch && industryMatch;
    });

    const filteredObjections = allCalls.filter(c => {
      if (c.category !== 'Objection Handling') return false;
      const objectionMatch = _selectedObjectionType === 'all' || c.objection_type === _selectedObjectionType;
      return objectionMatch;
    });

    container.innerHTML = `
      <style>
        .cl1-container {
          /* Injecting V1 Tokens directly so they map correctly in Light/Dark mode */
          --v0-background: var(--bg-0, #060608);
          --v0-foreground: var(--text-primary, #f0f0f2);
          --v0-muted: var(--bg-2, #111116);
          --v0-muted-foreground: var(--text-secondary, #a1a1aa);
          --v0-card: var(--bg-1, #0d0d10);
          --v0-border: var(--border-default, rgba(255,255,255,0.08));
          --v0-brand: #7c3aed;
          --v0-brand-secondary: #db2777;
          --v0-success: #10b981;
          --v0-surface-1: var(--bg-1, #0d0d10);
          --v0-shadow-glow-brand: 0 0 20px rgba(124,58,237,0.15);
          --v0-shadow-glow-secondary: 0 0 20px rgba(219,39,119,0.15);
          --v0-brand-foreground: #ffffff;
          --v0-brand-secondary-foreground: #ffffff;

          max-width: 80rem; /* 1280px ~ max-w-7xl */
          margin: 0 auto;
          padding: 24px;
          background-color: var(--v0-background);
          color: var(--v0-foreground);
          font-family: var(--font-ui);
          min-height: 100%;
        }
        [data-theme="light"] .cl1-container {
          --v0-brand: #6d28d9;
          --v0-brand-secondary: #be185d;
          --v0-success: #059669;
        }
        @media (min-width: 768px) {
          .cl1-container { padding: 48px; }
        }

        /* Header */
        .cl1-header-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 24px;
        }
        .cl1-pill-internal {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background-color: color-mix(in srgb, var(--v0-brand) 10%, transparent);
          border: 1px solid color-mix(in srgb, var(--v0-brand) 20%, transparent);
          color: var(--v0-brand);
          text-transform: uppercase;
          font-size: 10px;
          letter-spacing: 0.05em;
          padding: 4px 8px;
          border-radius: 9999px;
          margin-bottom: 12px;
          font-weight: 700;
        }
        .cl1-dot {
          width: 6px; height: 6px;
          border-radius: 50%;
          background-color: var(--v0-brand);
          animation: cl1-pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes cl1-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .cl1-title {
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.025em;
          margin: 0 0 8px 0;
          line-height: 1.1;
        }
        @media (min-width: 768px) {
          .cl1-title { font-size: 48px; }
        }
        .cl1-subtitle {
          color: var(--v0-muted-foreground);
          font-size: 18px;
          margin: 0;
        }
        .cl1-btn-primary {
          height: 48px;
          padding: 0 32px;
          background-color: var(--v0-brand);
          color: var(--v0-brand-foreground);
          border-radius: 12px;
          font-weight: 600;
          font-size: 14px;
          box-shadow: var(--v0-shadow-glow-brand);
          border: none;
          cursor: pointer;
          transition: opacity 150ms ease;
        }
        .cl1-btn-primary:hover { opacity: 0.9; }

        /* Filter Bar */
        .cl1-filters {
          background-color: color-mix(in srgb, var(--v0-surface-1) 60%, transparent);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid var(--v0-border);
          border-radius: var(--r-md);
          padding: 16px;
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
          margin-bottom: 48px;
          align-items: flex-end;
        }
        .cl1-filter-group {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .cl1-filter-label {
          font-size: 11px;
          font-weight: 600;
          color: var(--v0-muted-foreground);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .cl1-select {
          background-color: color-mix(in srgb, #ffffff 5%, transparent);
          border: 1px solid var(--v0-border);
          color: var(--v0-foreground);
          border-radius: 8px;
          height: 36px;
          padding: 0 16px 0 12px;
          font-size: 14px;
          outline: none;
          transition: border-color 150ms ease;
          appearance: none;
        }
        .cl1-select:focus {
          border-color: color-mix(in srgb, var(--v0-brand) 50%, transparent);
        }
        .cl1-btn-clear {
          height: 36px;
          padding: 0 16px;
          border: 1px solid var(--v0-border);
          color: var(--v0-muted-foreground);
          background: transparent;
          border-radius: 8px;
          font-size: 14px;
          cursor: pointer;
          transition: all 150ms ease;
        }
        .cl1-btn-clear:hover {
          color: var(--v0-foreground);
          border-color: color-mix(in srgb, var(--v0-brand) 30%, transparent);
        }

        /* Section Header */
        .cl1-section-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
          margin-top: 48px;
        }
        .cl1-section-title {
          text-transform: uppercase;
          font-size: 20px;
          font-weight: 700;
          letter-spacing: -0.025em;
          margin: 0;
        }
        .cl1-section-count {
          font-family: var(--font-mono);
          text-transform: uppercase;
          color: var(--v0-muted-foreground);
          font-size: 10px;
        }
        @keyframes cl1-glow-pulse {
          0% { opacity: 1; transform: scaleX(1); }
          50% { opacity: 0.1; transform: scaleX(0.7); }
          100% { opacity: 1; transform: scaleX(1); }
        }
        .cl1-section-rule {
          height: 1px;
          flex: 1;
          transform-origin: left;
          animation: cl1-glow-pulse 3s ease-in-out infinite;
        }
        .cl1-rule-brand {
          background: linear-gradient(to right, color-mix(in srgb, var(--v0-brand) 50%, transparent), transparent);
        }
        .cl1-rule-secondary {
          background: linear-gradient(to right, color-mix(in srgb, var(--v0-brand-secondary) 50%, transparent), transparent);
        }
        .cl1-text-secondary {
          color: var(--v0-brand-secondary);
        }

        /* Grid */
        .cl1-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .cl1-grid { grid-template-columns: repeat(2, 1fr); }
          .cl1-grid.cl1-grid-objections { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 1024px) {
          .cl1-grid { grid-template-columns: repeat(3, 1fr); }
          .cl1-grid.cl1-grid-objections { grid-template-columns: repeat(6, 1fr); }
        }
        }

        /* Card Base */
        .cl1-card {
          background-color: var(--v0-card);
          border: 1px solid var(--v0-border);
          border-radius: var(--r-md);
          overflow: hidden;
          transition: all 150ms ease;
          position: relative;
        }
        .cl1-card:hover {
          transform: translateY(-2px);
          border-color: color-mix(in srgb, var(--v0-brand) 40%, transparent);
        }
        .cl1-card.objection:hover {
          border-color: color-mix(in srgb, var(--v0-brand-secondary) 40%, transparent);
        }

        /* Thumbnail */
        .cl1-thumb {
          aspect-ratio: 16 / 9;
          position: relative;
          background-size: cover;
          background-position: center;
        }
        .cl1-thumb-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, color-mix(in srgb, var(--v0-background) 60%, transparent), transparent);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
        }
        .cl1-thumb-top {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }
        .cl1-thumb-label {
          color: rgba(255,255,255,0.7);
          font-size: 10px;
          font-weight: 600;
        }
        .cl1-pill-success {
          background-color: color-mix(in srgb, var(--v0-success) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--v0-success) 30%, transparent);
          color: var(--v0-success);
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 9999px;
        }
        .cl1-play-btn {
          align-self: flex-end;
          width: 44px; height: 44px;
          border-radius: 50%;
          background-color: rgba(255,255,255,0.9);
          color: var(--v0-background);
          display: grid;
          place-items: center;
          font-size: 14px;
          transition: transform 150ms ease;
        }
        .cl1-card:hover .cl1-play-btn {
          transform: scale(1.1);
        }

        /* Card Body */
        .cl1-card-body {
          padding: 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .cl1-card-meta {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .cl1-avatar {
          width: 32px; height: 32px;
          border-radius: 50%;
          background-color: color-mix(in srgb, var(--v0-brand) 15%, transparent);
          border: 1px solid color-mix(in srgb, var(--v0-brand) 25%, transparent);
          color: var(--v0-brand);
          font-weight: 700;
          font-size: 12px;
          display: grid;
          place-items: center;
        }
        .cl1-meta-text {
          font-size: 12px;
          color: var(--v0-muted-foreground);
        }
        .cl1-card-title {
          font-size: 18px;
          font-weight: 700;
          line-height: 1.2;
          color: var(--v0-foreground);
          margin: 0;
          transition: color 150ms ease;
        }
        .cl1-card:hover .cl1-card-title {
          color: var(--v0-brand);
        }
        .cl1-card.objection:hover .cl1-card-title {
          color: var(--v0-brand-secondary);
        }
        .cl1-tags {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .cl1-tag {
          background-color: var(--v0-muted);
          border: 1px solid var(--v0-border);
          padding: 4px 10px;
          border-radius: 4px;
          font-size: 12px;
          color: color-mix(in srgb, var(--v0-foreground) 80%, transparent);
        }
        .cl1-actions {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .cl1-btn-fathom {
          flex: 1;
          height: 40px;
          border-radius: 8px;
          background-color: var(--v0-muted);
          color: var(--v0-foreground);
          font-size: 12px;
          font-weight: 700;
          display: grid;
          place-items: center;
          text-decoration: none;
          transition: background-color 150ms ease;
        }
        .cl1-btn-fathom:hover {
          background-color: color-mix(in srgb, var(--v0-muted) 70%, transparent);
        }
        .cl1-btn-related {
          height: 40px;
          padding: 0 16px;
          border-radius: 8px;
          background-color: transparent;
          border: 1px solid var(--v0-border);
          color: var(--v0-foreground);
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: background-color 150ms ease;
        }
        .cl1-btn-related:hover {
          background-color: color-mix(in srgb, var(--v0-muted) 50%, transparent);
        }

        /* Objection specific */
        .cl1-obj-top {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .cl1-pill-obj {
          background-color: color-mix(in srgb, var(--v0-brand-secondary) 10%, transparent);
          color: var(--v0-brand-secondary);
          border: 1px solid color-mix(in srgb, var(--v0-brand-secondary) 20%, transparent);
          font-size: 10px;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          padding: 4px 8px;
          border-radius: 4px;
        }
        .cl1-pill-time {
          font-family: var(--font-mono);
          font-size: 12px;
          color: var(--v0-muted-foreground);
          background-color: var(--v0-muted);
          padding: 4px 8px;
          border-radius: 4px;
        }
        .cl1-obj-summary {
          font-size: 14px;
          color: var(--v0-muted-foreground);
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
          margin: 0;
          line-height: 1.5;
        }
        .cl1-btn-obj-fathom {
          width: 100%;
          height: 40px;
          border-radius: 8px;
          background-color: var(--v0-brand-secondary);
          color: var(--v0-brand-secondary-foreground);
          font-size: 12px;
          font-weight: 700;
          display: grid;
          place-items: center;
          text-decoration: none;
          box-shadow: var(--v0-shadow-glow-secondary);
          transition: opacity 150ms ease;
          border: none;
        }
        .cl1-btn-obj-fathom:hover { opacity: 0.9; }
        .cl1-btn-obj-related {
          width: 100%;
          height: 40px;
          background-color: var(--v0-muted);
          border: 1px solid var(--v0-border);
          color: var(--v0-foreground);
          border-radius: 8px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          margin-top: 8px;
        }
        .cl1-btn-obj-related:hover {
          background-color: color-mix(in srgb, var(--v0-muted) 70%, transparent);
        }

        .cl1-empty {
          border: 1px dashed var(--v0-border);
          border-radius: var(--r-md);
          padding: 48px;
          text-align: center;
          color: var(--v0-muted-foreground);
          font-size: 14px;
        }
      /* Modal */
        .cl1-modal-backdrop {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(0,0,0,0.5); backdrop-filter: blur(4px);
          display: flex; align-items: center; justify-content: center;
          padding: 24px;
        }
        .cl1-modal-content {
          background-color: var(--v0-card);
          border: 1px solid var(--v0-border);
          border-radius: var(--r-lg);
          width: 100%; max-width: 600px;
          padding: 32px; position: relative;
          color: var(--v0-foreground);
        }
        .cl1-modal-close {
          position: absolute; top: 16px; right: 16px;
          width: 32px; height: 32px; border-radius: 50%;
          background: transparent; border: 1px solid var(--v0-border);
          color: var(--v0-muted-foreground); cursor: pointer;
          display: grid; place-items: center; font-size: 14px;
        }
        .cl1-modal-close:hover { color: var(--v0-foreground); background: var(--v0-muted); }
        .cl1-modal-title { font-size: 24px; font-weight: 700; margin: 0 0 8px 0; }
        .cl1-modal-subtitle { font-size: 14px; color: var(--v0-muted-foreground); margin: 0 0 24px 0; }
        
        .cl1-related-list { display: flex; flex-direction: column; gap: 12px; }
        .cl1-related-item {
          display: flex; align-items: center; gap: 16px;
          background-color: color-mix(in srgb, var(--v0-muted) 30%, transparent);
          border-radius: var(--r-md); padding: 16px;
        }
        .cl1-related-details { flex: 1; }
        .cl1-related-title { font-size: 14px; font-weight: 700; color: var(--v0-foreground); margin-bottom: 4px; }
        .cl1-btn-watch {
          background-color: var(--v0-muted); border: none; border-radius: var(--r-md);
          color: var(--v0-foreground); padding: 8px 16px; font-size: 12px; font-weight: 700;
          text-decoration: none; transition: background 150ms;
        }
        .cl1-btn-watch:hover { background-color: color-mix(in srgb, var(--v0-muted) 70%, transparent); }
      </style>

      <div class="cl1-container">
        <!-- Header -->
        <div class="cl1-header-row">
          <div>
            <div class="cl1-pill-internal">
              <div class="cl1-dot"></div>
              INTERNAL ACCESS ONLY
            </div>
            <h1 class="cl1-title">Call Library</h1>
            <p class="cl1-subtitle">Internal archive of successful sales calls.</p>
          </div>
          <button class="cl1-btn-primary" onclick="PAGE_CALLLIBRARY1.openAddModal()">Add Call Record</button>
        </div>

        <!-- Filters -->
        <div class="cl1-filters">
          <div class="cl1-filter-group">
            <span class="cl1-filter-label">Deal Size</span>
            <select class="cl1-select" id="cl1-filter-size" onchange="PAGE_CALLLIBRARY1.updateFilters()">
              <option value="all">All sizes</option>
              <option value="120 hours" ${_selectedDealSize === '120 hours' ? 'selected' : ''}>120 hours</option>
              <option value="240 hours" ${_selectedDealSize === '240 hours' ? 'selected' : ''}>240 hours</option>
              <option value="commission" ${_selectedDealSize === 'commission' ? 'selected' : ''}>Commission</option>
            </select>
          </div>
          <div class="cl1-filter-group">
            <span class="cl1-filter-label">Industry</span>
            <select class="cl1-select" id="cl1-filter-industry" onchange="PAGE_CALLLIBRARY1.updateFilters()">
              <option value="all">All industries</option>
              <option value="Fintech" ${_selectedIndustry === 'Fintech' ? 'selected' : ''}>Fintech</option>
              <option value="Web3" ${_selectedIndustry === 'Web3' ? 'selected' : ''}>Web3</option>
              <option value="SaaS" ${_selectedIndustry === 'SaaS' ? 'selected' : ''}>SaaS</option>
            </select>
          </div>
          <div class="cl1-filter-group">
            <span class="cl1-filter-label">Objection Type</span>
            <select class="cl1-select" id="cl1-filter-objection" onchange="PAGE_CALLLIBRARY1.updateFilters()">
              <option value="all">All types</option>
              ${OBJECTION_TYPES.map(t => `<option value="${t}" ${_selectedObjectionType === t ? 'selected' : ''}>${t}</option>`).join('')}
            </select>
          </div>
          ${(_selectedDealSize !== 'all' || _selectedIndustry !== 'all' || _selectedObjectionType !== 'all') ? 
            `<button class="cl1-btn-clear" onclick="PAGE_CALLLIBRARY1.clearFilters()">Clear Filters</button>` : ''}
        </div>

        <!-- Section A: Closed Won -->
        <div class="cl1-section-header">
          <h2 class="cl1-section-title">Closed Won Deals</h2>
          <span class="cl1-section-count">${filteredClosedWon.length} records</span>
          <div class="cl1-section-rule cl1-rule-brand"></div>
        </div>

        ${filteredClosedWon.length === 0 ? `
          <div class="cl1-empty">No closed won deals match the selected filters.</div>
        ` : `
          <div class="cl1-grid cl1-grid-objections">
            ${filteredClosedWon.map(c => `
              <div class="cl1-card">
                <div class="cl1-thumb" style="background: ${c.thumbnail || 'linear-gradient(135deg, #333, #111)'}">
                  <div class="cl1-thumb-overlay">
                    <div class="cl1-thumb-top" style="justify-content: flex-end;">
                      <span class="cl1-pill-success">WON</span>
                    </div>
                    <div class="cl1-play-btn">▶</div>
                  </div>
                </div>
                <div class="cl1-card-body">
                  <div class="cl1-card-meta">
                    <span class="cl1-meta-text"><strong>${c.salesperson}</strong><br/>${c.created_at}</span>
                  </div>
                  <div class="cl1-tags">
                    ${c.industries ? c.industries.map(i => `<span class="cl1-tag">${i}</span>`).join('') : ''}
                    ${c.deal_size ? `<span class="cl1-tag">${c.deal_size}</span>` : ''}
                  </div>
                  <div class="cl1-actions">
                    <a href="${c.main_link}" target="_blank" rel="noreferrer" class="cl1-btn-fathom">Watch on Fathom</a>
                    <button class="cl1-btn-related" onclick="PAGE_CALLLIBRARY1.openRelatedModal('${c.id}')">Related</button>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}

        <!-- Section B: Objection Handling -->
        <div class="cl1-section-header">
          <h2 class="cl1-section-title cl1-text-secondary">Objection Handling</h2>
          <span class="cl1-section-count">${filteredObjections.length} records</span>
          <div class="cl1-section-rule cl1-rule-secondary"></div>
        </div>

        ${filteredObjections.length === 0 ? `
          <div class="cl1-empty">No objection handling calls match the selected filters.</div>
        ` : `
          <div class="cl1-grid">
            ${filteredObjections.map(c => `
              <div class="cl1-card objection">
                <div class="cl1-card-body">
                  <div class="cl1-obj-top">
                    <span class="cl1-pill-obj">${c.objection_type}</span>
                    <span class="cl1-pill-time">⏱ ${c.timing || '00:00'}</span>
                  </div>
                  <h3 class="cl1-card-title" style="font-size: 14px; margin-bottom: 8px;">${c.title || c.summary || c.objection_type}</h3>
                  <div class="cl1-card-meta" style="margin-top:auto; padding-top:8px;">
                    <span class="cl1-meta-text"><strong>${c.salesperson}</strong><br/>${c.created_at}</span>
                  </div>
                  <div style="margin-top:16px;">
                    <a href="${c.main_link}" target="_blank" rel="noreferrer" class="cl1-btn-obj-fathom">Watch on Fathom</a>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;
  }

  function updateFilters() {
    _selectedDealSize = document.getElementById('cl1-filter-size').value;
    _selectedIndustry = document.getElementById('cl1-filter-industry').value;
    _selectedObjectionType = document.getElementById('cl1-filter-objection').value;
    render(document.getElementById('app-content'));
  }

  function clearFilters() {
    _selectedDealSize = 'all';
    _selectedIndustry = 'all';
    _selectedObjectionType = 'all';
    render(document.getElementById('app-content'));
  }

  function openAddModal() {
    alert("Add Call Record Modal implementation would go here as per spec. This is a functional stub for V0 UI demo.");
  }

  function closeRelatedModal() {
    const m = document.getElementById('cl1-related-modal');
    if (m) m.remove();
  }

  function openRelatedModal(id) {
    const calls = getCalls();
    const call = calls.find(c => c.id === id);
    if (!call) return;

    // Build related items
    const relatedHtml = `
      <div class="cl1-related-item">
        <div class="cl1-pill-internal" style="margin:0; padding:2px 8px;">DISCOVERY</div>
        <div class="cl1-related-details">
          <div class="cl1-related-title">Same prospect — discovery call</div>
          <div class="cl1-meta-text">${call.salesperson} • 2024-06-29</div>
        </div>
        <a href="#" class="cl1-btn-watch" onclick="event.preventDefault()">Watch ↗</a>
      </div>
      <div class="cl1-related-item">
        <div class="cl1-pill-internal" style="margin:0; padding:2px 8px; color:var(--v0-brand-secondary); border-color:color-mix(in srgb, var(--v0-brand-secondary) 30%, transparent); background:color-mix(in srgb, var(--v0-brand-secondary) 15%, transparent);">PROPOSAL</div>
        <div class="cl1-related-details">
          <div class="cl1-related-title">Same prospect — proposal review</div>
          <div class="cl1-meta-text">${call.salesperson} • 2024-07-05</div>
        </div>
        <a href="#" class="cl1-btn-watch" onclick="event.preventDefault()">Watch ↗</a>
      </div>
    `;

    const subtitle = call.category === 'Closed Won Deals' ? 
      `Assets connected to ${call.salesperson}'s won deal` : 
      `Assets connected to this call`;

    const html = `
      <div id="cl1-related-modal" class="cl1-modal-backdrop" onclick="if(event.target === this) PAGE_CALLLIBRARY1.closeRelatedModal()">
        <div class="cl1-modal-content">
          <button class="cl1-modal-close" onclick="PAGE_CALLLIBRARY1.closeRelatedModal()">✕</button>
          <h2 class="cl1-modal-title">Related Calls</h2>
          <p class="cl1-modal-subtitle">${subtitle}</p>
          <div class="cl1-related-list">
            ${relatedHtml}
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', html);
  }

  return {
    closeRelatedModal,
    render,
    updateFilters,
    clearFilters,
    openAddModal,
    openRelatedModal
  };
})();
