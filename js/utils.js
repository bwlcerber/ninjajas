/**
 * UTILS.JS — Shared helpers: SVG icons, toast, modal, open-tabs
 */

'use strict';

// ─────────────────────────────────────────────
// ICONS (inline SVG strings)
// ─────────────────────────────────────────────

const ICONS = {
  pinOutline: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`,
  pinSolid: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="17" x2="12" y2="22"></line><path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.68V6a3 3 0 0 0-3-3 3 3 0 0 0-3 3v4.68a2 2 0 0 1-1.11 1.87l-1.78.9A2 2 0 0 0 5 15.24Z"></path></svg>`,
  dashboard: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>`,
  search:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  reports:   `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>`,
  creatives: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  docs:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  cases:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>`,
  refs:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>`,
  profiles:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  admin:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93A10 10 0 1 0 21 12h-1"/><path d="m22 2-5 5"/><path d="m17 2 5 5"/></svg>`,
  logout:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  external:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
  copy:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  close:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  plus:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>`,
  eye:       `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  file_pdf:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>`,
  file_img:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  file_vid:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>`,
  file_link: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
  file_doc:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>`,
  file_sheet:`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="3" y1="15" x2="21" y2="15"/><line x1="9" y1="3" x2="9" y2="21"/></svg>`,
  lock:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>`,
  shield:    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  lightning: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  open_all:  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>`,
  check:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  ninja:     `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="5"/><path d="M3 21a9 9 0 0 1 18 0"/></svg>`,
  star:      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>`,
};

// ─────────────────────────────────────────────
// FILE TYPE ICON PICKER
// ─────────────────────────────────────────────

function getFileIcon(fileType) {
  const base = `style="width:20px;height:20px;vertical-align:middle;display:inline-block;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"`;
  const map = {
    'pdf': `<svg ${base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`,
    'image': `<svg ${base}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    'video': `<svg ${base}><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
    'doc-link': `<svg ${base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="12" y1="17" x2="8" y2="17"></line></svg>`,
    'google-doc': `<svg ${base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>`,
    'google-drive': `<svg ${base}><path d="M22 10v4l-8 5v-4l8-5zM14 15l-8-5v4l8 5v-4zM6 10l8-5v4L6 14v-4z"></path></svg>`,
    'link': `<svg ${base}><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>`,
    'spreadsheet-link': `<svg ${base}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line><line x1="9" y1="3" x2="9" y2="21"></line></svg>`,
    'default': `<svg ${base}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline></svg>`
  };
  return map[fileType] || map.default;
}

// ─────────────────────────────────────────────
// VERTICAL TAG CSS CLASS
// ─────────────────────────────────────────────

function getVerticalClass(vertical) {
  const map = {
    'FinTech': 'tag-fintech',
    'Web3': 'tag-web3',
    'Trading': 'tag-trading',
    'eCommerce': 'tag-ecom',
    'Healthcare': 'tag-health',
    'iGaming': 'tag-igaming',
    'Sports Betting': 'tag-sports',
    'SaaS': 'tag-saas',
    'Cyber Security': 'tag-cyber',
    'B2B': 'tag-b2b',
    'B2C': 'tag-b2c',
    'Apps': 'tag-apps',
    'AI': 'tag-ai',
    'Real Estate': 'tag-realestate',
    'Other': 'tag-other'
  };
  return map[vertical] || 'tag-other';
}

function getVerticalEmoji(vertical) {
  const base = `style="display:inline-block;width:14px;height:14px;vertical-align:middle;margin-right:6px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"`;
  const map = {
    'FinTech': `<svg ${base}><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>`,
    'Web3': `<svg ${base}><rect x="2" y="2" width="7" height="7" rx="1.5"></rect><rect x="15" y="2" width="7" height="7" rx="1.5"></rect><rect x="2" y="15" width="7" height="7" rx="1.5"></rect><rect x="15" y="15" width="7" height="7" rx="1.5"></rect><path d="M9 5.5h6M5.5 9v6M18.5 9v6M9 18.5h6"></path></svg>`,
    'Trading': `<svg ${base}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline><polyline points="16 7 22 7 22 13"></polyline></svg>`,
    'eCommerce': `<svg ${base}><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path><line x1="3" y1="6" x2="21" y2="6"></line><path d="M16 10a4 4 0 0 1-8 0"></path></svg>`,
    'Healthcare': `<svg ${base}><path d="M22 12h-4l-3 9L9 3l-3 9H2"></path></svg>`,
    'iGaming': `<svg ${base}><path d="M12 2L2 12l10 10 10-10z"></path></svg>`,
    'Sports Betting': `<svg ${base}><circle cx="12" cy="12" r="10"></circle><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path><path d="M2 12h20"></path></svg>`,
    'SaaS': `<svg ${base}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>`,
    'Cyber Security': `<svg ${base}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>`,
    'B2B': `<svg ${base}><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>`,
    'B2C': `<svg ${base}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`,
    'Apps': `<svg ${base}><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>`,
    'AI': `<svg ${base}><rect x="4" y="4" width="16" height="16" rx="2"></rect><rect x="9" y="9" width="6" height="6"></rect><path d="M9 1v3M15 1v3M9 20v3M15 20v3M20 9h3M20 15h3M1 9h3M1 15h3"></path></svg>`,
    'Real Estate': `<svg ${base}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
    'Other': `<svg ${base}><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
  };
  return map[vertical] || map.Other;
}

// ─────────────────────────────────────────────
// TOAST
// ─────────────────────────────────────────────

function showToast(message, type = 'success', duration = 2800) {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  const icon = type === 'success'
    ? `<span style="color:var(--accent)">${ICONS.check}</span>`
    : `<span style="color:var(--danger)">${ICONS.close}</span>`;
  toast.innerHTML = `${icon} <span>${message}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(20px)';
    toast.style.transition = 'all 300ms ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─────────────────────────────────────────────
// MODAL
// ─────────────────────────────────────────────

let _activeModal = null;

function openModal({ title, body, footer = '', size = '' }) {
  closeModal();

  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.id = 'active-modal-overlay';

  overlay.innerHTML = `
    <div class="modal ${size}" role="dialog" aria-modal="true" aria-label="${title}">
      <div class="modal-header">
        <span class="modal-title">${title}</span>
        <button class="modal-close" id="modal-close-btn" aria-label="Close">${ICONS.close}</button>
      </div>
      <div class="modal-body">${body}</div>
      ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
    </div>
  `;

  document.body.appendChild(overlay);
  requestAnimationFrame(() => overlay.classList.add('open'));

  const closeBtn = overlay.querySelector('#modal-close-btn');
  closeBtn.addEventListener('click', closeModal);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal();
  });

  document.addEventListener('keydown', _escClose);
  _activeModal = overlay;

  return overlay;
}

function closeModal() {
  if (_activeModal) {
    const modalToRemove = _activeModal;
    modalToRemove.classList.remove('open');
    setTimeout(() => { 
      if (modalToRemove && modalToRemove.parentNode) { 
        modalToRemove.remove(); 
      }
      if (_activeModal === modalToRemove) {
        _activeModal = null;
      }
    }, 200);
    document.removeEventListener('keydown', _escClose);
  }
}

function _escClose(e) {
  if (e.key === 'Escape') closeModal();
}

// ─────────────────────────────────────────────
// COPY TO CLIPBOARD
// ─────────────────────────────────────────────

function copyToClipboard(text, label = 'Link') {
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} copied to clipboard`);
  }).catch(() => {
    showToast('Failed to copy', 'error');
  });
}

// ─────────────────────────────────────────────
// OPEN ALL ASSETS IN TABS
// ─────────────────────────────────────────────

function openAllInTabs(assetIds) {
  if (!assetIds || assetIds.length === 0) {
    showToast('No assets to open', 'error');
    return;
  }
  let opened = 0;
  assetIds.forEach((id, idx) => {
    const asset = STORE.getMaterialById(id);
    if (asset && asset.file_url) {
      setTimeout(() => {
        window.open(asset.file_url, '_blank');
        opened++;
      }, idx * 200);
    }
  });
  setTimeout(() => {
    showToast(`Opening ${opened} asset${opened !== 1 ? 's' : ''} in new tabs`);
  }, 100);
}

// ─────────────────────────────────────────────
// HIGHLIGHT SEARCH MATCH
// ─────────────────────────────────────────────

function highlight(text, query) {
  if (!query || !text) return text || '';
  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp(`(${escaped})`, 'gi'), '<mark class="highlight">$1</mark>');
}

// ─────────────────────────────────────────────
// FORMAT HELPERS
// ─────────────────────────────────────────────

function formatDate(str) {
  if (!str) return '';
  const d = new Date(str);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function truncate(str, len = 80) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}

function assetTypeLabel(type) {
  const map = {
    'report': 'Report', 'creative': 'Creative', 'case': 'Case Study',
    'deck': 'Deck', 'template': 'Template', 'contract': 'Contract',
    'process-doc': 'Process Doc', 'media-plan': 'Media Plan',
    'training': 'Training', 'video': 'Video', 'image': 'Image',
    'pdf': 'PDF', 'spreadsheet-link': 'Spreadsheet', 'doc-link': 'Document',
    'offer-prep': 'Offer Preparation',
    'social-media-link': 'Social Media Links'
  };
  return map[type] || type;
}

function visibilityTag(status) {
  if (status === 'internal-only') {
    return `<span class="tag tag-danger">${ICONS.lock} Internal Only</span>`;
  }
  return `<span class="tag tag-safe">${ICONS.shield} Client Safe</span>`;
}

// ─────────────────────────────────────────────
// MATERIAL OPEN HANDLER
// ─────────────────────────────────────────────

function openMaterial(material) {
  if (!material) return;

  const isMedia = ['image', 'video'].includes(material.file_type);
  const isLink = ['doc-link', 'spreadsheet-link'].includes(material.file_type);

  if (isLink || material.file_type === 'pdf') {
    window.open(material.file_url, '_blank');
    return;
  }

  // Get active list of media items based on current page/view context to support keyboard/arrows navigation
  let mediaList = [];
  const currentHash = window.location.hash;
  if (currentHash.startsWith('#creatives')) {
    const hiddenList = (JSON.parse(localStorage.getItem('np_hidden_creatives') || '[]'));
    mediaList = STORE.getByTypes(['creative', 'video', 'image']).filter(m => {
      if (window.CAN_MANAGE) return true;
      return !hiddenList.includes(m.id);
    });
  } else {
    // Default to all media
    mediaList = STORE.getMaterials().filter(m => ['creative', 'video', 'image', 'image', 'video'].includes(m.asset_type || m.file_type));
  }

  const currentIndex = mediaList.findIndex(m => m.id === material.id);

  // Keyboard navigation logic
  const handleKeydown = (e) => {
    if (e.key === 'ArrowRight') {
      navigateMedia(1);
    } else if (e.key === 'ArrowLeft') {
      navigateMedia(-1);
    }
  };

  const cleanupListeners = () => {
    document.removeEventListener('keydown', handleKeydown);
  };

  const navigateMedia = (dir) => {
    if (currentIndex === -1 || mediaList.length <= 1) return;
    let nextIdx = currentIndex + dir;
    if (nextIdx < 0) nextIdx = mediaList.length - 1;
    if (nextIdx >= mediaList.length) nextIdx = 0;
    cleanupListeners();
    openMaterial(mediaList[nextIdx]);
  };

  document.addEventListener('keydown', handleKeydown);

  // Intercept closeModal to cleanup listeners
  const originalCloseModal = window.closeModal;
  window.closeModal = function() {
    cleanupListeners();
    window.closeModal = originalCloseModal;
    originalCloseModal();
  };

  // Setup Title: client name or "project name, N/A" (avoiding raw filenames)
  let modalTitle = material.client_name;
  if (!modalTitle || modalTitle.trim().toLowerCase() === 'internal' || modalTitle.trim() === '') {
    modalTitle = 'project name, N/A';
  }

  // Navigation Arrows HTML
  const arrowStyle = `position:absolute; top:50%; transform:translateY(-50%); width:44px; height:44px; background:rgba(20,20,20,0.6); border:1px solid rgba(255,255,255,0.1); border-radius:50%; color:#fff; font-size:20px; display:flex; align-items:center; justify-content:center; cursor:pointer; z-index:10; transition:all 0.2s;`;
  const prevBtnHtml = (currentIndex !== -1 && mediaList.length > 1) ? `<button onclick="event.stopPropagation(); window.openMaterialNavigate(-1);" style="${arrowStyle} left:10px;" onmouseover="this.style.background='rgba(20,20,20,0.9)'" onmouseout="this.style.background='rgba(20,20,20,0.6)'">←</button>` : '';
  const nextBtnHtml = (currentIndex !== -1 && mediaList.length > 1) ? `<button onclick="event.stopPropagation(); window.openMaterialNavigate(1);" style="${arrowStyle} right:10px;" onmouseover="this.style.background='rgba(20,20,20,0.9)'" onmouseout="this.style.background='rgba(20,20,20,0.6)'">→</button>` : '';

  window.openMaterialNavigate = (dir) => {
    navigateMedia(dir);
  };

  if (material.file_type === 'video') {
    const body = `
      <div style="position:relative; margin-bottom:12px; display:flex; justify-content:center; align-items:center;">
        ${prevBtnHtml}
        <video src="${material.file_url}" controls autoplay
          style="width:100%;border-radius:8px;background:#000;max-height:60vh"></video>
        ${nextBtnHtml}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
        ${visibilityTag(material.visibility_status)}
        <span class="tag tag-default">${assetTypeLabel(material.asset_type)}</span>
        <span class="tag ${getVerticalClass(material.vertical)}">${material.vertical}</span>
      </div>
      <p style="margin-top:12px;font-size:12px;color:var(--text-secondary);line-height:1.6">${material.description || ''}</p>
    `;
    openModal({ title: modalTitle, body, size: 'modal-lg' });
    return;
  }

  if (material.file_type === 'image') {
    const body = `
      <div style="position:relative; display:flex; justify-content:center; align-items:center; min-height:200px;">
        ${prevBtnHtml}
        <img class="preview-img" src="${material.file_url}" alt="${material.title}" style="max-height:65vh; object-fit:contain; border-radius:8px;" />
        ${nextBtnHtml}
      </div>
      <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:12px">
        ${visibilityTag(material.visibility_status)}
        <span class="tag tag-default">${assetTypeLabel(material.asset_type)}</span>
        <span class="tag ${getVerticalClass(material.vertical)}">${material.vertical}</span>
      </div>
      <p style="margin-top:12px;font-size:12px;color:var(--text-secondary);line-height:1.6">${material.description || ''}</p>
    `;
    openModal({ title: modalTitle, body, size: 'modal-lg' });
    return;
  }

  // Default: open URL
  if (material.file_url) {
    window.open(material.file_url, '_blank');
  }
}

// ─────────────────────────────────────────────
// RENDER MATERIAL CARD
// ─────────────────────────────────────────────

// ─────────────────────────────────────────────
// CALL PREP BASKET (BATCH TABS SELECTOR)
// ─────────────────────────────────────────────

// Load basket from localStorage fallback
window.CALL_PREP_BASKET = new Set();
try {
  const savedBasket = localStorage.getItem('np_call_prep_basket');
  if (savedBasket) {
    const list = JSON.parse(savedBasket);
    list.forEach(id => window.CALL_PREP_BASKET.add(id));
  }
} catch(e) {}

function toggleCallPrepItem(id) {
  if (window.CALL_PREP_BASKET.has(id)) {
    window.CALL_PREP_BASKET.delete(id);
    // clean up expiration stamp
    try {
      const storedTimestamps = localStorage.getItem('np_call_prep_timestamps');
      if (storedTimestamps) {
        const parsed = JSON.parse(storedTimestamps);
        delete parsed[id];
        localStorage.setItem('np_call_prep_timestamps', JSON.stringify(parsed));
      }
    } catch(e){}
  } else {
    window.CALL_PREP_BASKET.add(id);
    // write expiration stamp
    try {
      const storedTimestamps = localStorage.getItem('np_call_prep_timestamps') || '{}';
      const parsed = JSON.parse(storedTimestamps);
      parsed[id] = Date.now();
      localStorage.setItem('np_call_prep_timestamps', JSON.stringify(parsed));
    } catch(e){}
  }
  
  // Sync to localStorage
  try {
    localStorage.setItem('np_call_prep_basket', JSON.stringify(Array.from(window.CALL_PREP_BASKET)));
  } catch(e){}
  
  // Sync checkboxes on screen
  document.querySelectorAll(`input[data-select-id="${id}"]`).forEach(input => {
    const isChecked = window.CALL_PREP_BASKET.has(id);
    input.checked = isChecked;
    if (isChecked) {
      input.setAttribute('checked', 'checked');
    } else {
      input.removeAttribute('checked');
    }
    const wrap = input.closest('.card-checkbox-overlay') || input.closest('.creative-card-checkbox') || input.closest('.material-row-checkbox');
    if (wrap) wrap.classList.toggle('checked', isChecked);
  });
  
  updateCallPrepTray();
}

function clearCallPrep() {
  window.CALL_PREP_BASKET.clear();
  try {
    localStorage.setItem('np_call_prep_basket', JSON.stringify([]));
    localStorage.setItem('np_call_prep_timestamps', JSON.stringify({}));
  } catch(e){}
  document.querySelectorAll('input[data-select-id]').forEach(input => {
    input.checked = false;
    input.removeAttribute('checked');
    const wrap = input.closest('.card-checkbox-overlay') || input.closest('.creative-card-checkbox') || input.closest('.material-row-checkbox');
    if (wrap) wrap.classList.remove('checked');
  });
  updateCallPrepTray();
}

function openCallPrepItems() {
  const ids = Array.from(window.CALL_PREP_BASKET);
  if (ids.length === 0) return;
  openAllInTabs(ids);
  clearCallPrep();
}

function updateCallPrepTray() {
  let tray = document.getElementById('call-prep-tray');
  if (tray) {
    tray.style.display = 'none';
    tray.remove();
  }
}

function deleteStagedReports() {
  const ids = Array.from(window.CALL_PREP_BASKET);
  if (ids.length === 0) return;
  
  // Delete from STORE
  let deletedCount = 0;
  ids.forEach(id => {
    // If STORE has a delete/remove method, or we can filter it out:
    if (typeof STORE.deleteMaterial === 'function') {
      STORE.deleteMaterial(id);
      deletedCount++;
    } else {
      // Direct mutation/fallback if deleteMaterial isn't defined
      const materials = STORE.getMaterials();
      const idx = materials.findIndex(m => m.id === id);
      if (idx !== -1) {
        materials.splice(idx, 1);
        deletedCount++;
      }
    }
  });

  showToast(`Successfully deleted ${deletedCount} report${deletedCount !== 1 ? 's' : ''}`, 'success');
  clearCallPrep();
  
  // Re-render current page list if we are on reports/dashboard/etc.
  if (window.ROUTER) {
    window.ROUTER.render();
  }
}

function renderCheckbox(id) {
  const isChecked = window.CALL_PREP_BASKET.has(id);
  return `
    <div class="material-row-checkbox" onclick="event.stopPropagation()">
      <label class="item-select-wrap">
        <input type="checkbox" data-select-id="${id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${id}')">
        <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
      </label>
    </div>
  `;
}

// ─────────────────────────────────────────────
// RENDER MATERIAL CARD
// ─────────────────────────────────────────────

function renderMaterialCard(mat, opts = {}) {
  const { showActions = true } = opts;
  const isMedia = ['image', 'video'].includes(mat.file_type);
  const thumb = mat.thumbnail_url
    ? `<img src="${mat.thumbnail_url}" alt="${mat.title}" loading="lazy">`
    : `<div class="card-thumb-placeholder">
         ${getFileIcon(mat.file_type)}
         <span>${assetTypeLabel(mat.asset_type)}</span>
       </div>`;

  const profile = STORE.getProfileForClient(mat.client_name);
  const isChecked = window.CALL_PREP_BASKET.has(mat.id);

  return `
    <div class="card animate-fade" data-id="${mat.id}" onclick="openMaterial(STORE.getMaterialById('${mat.id}'))">
      <div class="card-checkbox-overlay ${isChecked ? 'checked' : ''}" onclick="event.stopPropagation()">
        <label class="item-select-wrap">
          <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
          <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
        </label>
      </div>
      <div class="card-thumbnail">${thumb}</div>
      <div class="card-body">
        <div class="card-meta">
          ${visibilityTag(mat.visibility_status)}
          <span class="tag ${getVerticalClass(mat.vertical)}">${mat.vertical}</span>
        </div>
        <div class="card-title">${mat.title}</div>
        <div class="card-desc text-secondary">${mat.description}</div>
        <div class="card-meta" style="margin-top:8px">
          <span class="tag tag-default">${mat.client_name}</span>
          <span class="tag tag-default">${mat.geo}</span>
          ${mat.services_provided.slice(0,2).map(s=>`<span class="tag tag-info" style="font-size:9px">${s}</span>`).join('')}
        </div>
      </div>
      ${showActions ? `
      <div class="card-footer">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openMaterial(STORE.getMaterialById('${mat.id}'))">
          ${ICONS.eye} Open
        </button>
        <button class="btn btn-sm btn-secondary" onclick="event.stopPropagation();window.open('${mat.file_url}','_blank')" title="Open in new tab">
          ${ICONS.external}
        </button>
        <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();copyToClipboard('${mat.file_url}','Link')" title="Copy link">
          ${ICONS.copy}
        </button>
        ${profile ? `
          <button class="btn btn-sm btn-ghost" style="margin-left:auto" onclick="event.stopPropagation();ROUTER.navigate('miniprofiles','${profile.id}')" title="View client profile">
            ${ICONS.profiles}
          </button>
        ` : ''}
      </div>` : ''}
    </div>`;
}

// ─────────────────────────────────────────────
// RENDER MATERIAL ROW
// ─────────────────────────────────────────────

function renderMaterialRow(mat) {
  const isChecked = window.CALL_PREP_BASKET.has(mat.id);
  
  let previewHtml = '';
  const hasThumb = mat.thumbnail_url && mat.thumbnail_url.trim().length > 0;
  const isImage = mat.file_type === 'image' || (mat.file_url && mat.file_url.match(/\.(png|jpg|jpeg|gif|webp)$/i));
  const isVideo = mat.file_type === 'video' || (mat.file_url && mat.file_url.match(/\.(mp4|mov|avi|webm)$/i));

  if (hasThumb) {
    previewHtml = `<img src="${mat.thumbnail_url}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; display:block;" alt="">`;
  } else if (isImage && mat.file_url) {
    previewHtml = `<img src="${mat.file_url}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; display:block;" alt="">`;
  } else if (isVideo && mat.file_url) {
    previewHtml = `<video src="${mat.file_url}" style="width:24px; height:24px; object-fit:cover; border-radius:4px; display:block;" muted preload="metadata"></video>`;
  } else {
    previewHtml = getFileIcon(mat.file_type);
  }

  return `
    <div class="material-row animate-fade" data-id="${mat.id}" onclick="openMaterial(STORE.getMaterialById('${mat.id}'))">
      <div class="material-row-checkbox" onclick="event.stopPropagation()">
        <label class="item-select-wrap">
          <input type="checkbox" data-select-id="${mat.id}" ${isChecked ? 'checked' : ''} onchange="toggleCallPrepItem('${mat.id}')">
          <div class="item-select-box" title="Add to Call Prep Favorites">${ICONS.star}</div>
        </label>
      </div>
      <div class="material-row-icon" style="width:24px; height:24px; display:flex; align-items:center; justify-content:center; flex-shrink:0;">${previewHtml}</div>
      <div class="material-row-info">
        <div class="material-row-title">${mat.title}</div>
        <div class="material-row-sub">${mat.client_name} · ${mat.vertical} · ${mat.geo}</div>
      </div>
      <div style="display:flex;gap:6px;align-items:center">
        ${visibilityTag(mat.visibility_status)}
        <span class="tag tag-default">${assetTypeLabel(mat.asset_type)}</span>
      </div>
      <div class="material-row-actions" style="opacity: 1; pointer-events: auto;">
        <button class="btn btn-sm btn-primary" onclick="event.stopPropagation();openMaterial(STORE.getMaterialById('${mat.id}'))" title="Open preview inside dashboard">
          ${ICONS.eye} Preview
        </button>
        <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation();copyToClipboard('${mat.file_url}','Link')" title="Copy link">
          ${ICONS.copy}
        </button>
        ${window.CAN_MANAGE ? `
          <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); ${mat.asset_type === 'case' ? "PAGE_CASES.openEditCaseModal('" + mat.id + "')" : "PAGE_REPORTS.openEditModal('" + mat.id + "')"};" title="Edit Metadata" style="color:var(--accent); display:inline-flex; align-items:center; justify-content:center; padding:4px;">
            ${ICONS.edit}
          </button>
          <button class="btn btn-sm btn-ghost" onclick="event.stopPropagation(); checkSuperAdminAction(() => { if (confirm('Are you sure you want to delete this material? This action cannot be undone.')) { STORE.deleteMaterial('${mat.id}'); showToast('Material moved to Recycle Bin', 'success'); ROUTER.render(); } })" title="Delete Material" style="color:var(--danger); display:inline-flex; align-items:center; justify-content:center; padding:4px;">
            ${ICONS.trash}
          </button>
        ` : ''}
      </div>
    </div>`;
}

// ─────────────────────────────────────────────
// SERVICE SELECT OPTIONS
// ─────────────────────────────────────────────

function renderSelectOptions(arr, selectedArr = []) {
  return arr.map(v => `<option value="${v}" ${selectedArr.includes(v) ? 'selected' : ''}>${v}</option>`).join('');
}

window.ICONS = ICONS;
window.getFileIcon = getFileIcon;
window.getVerticalClass = getVerticalClass;
window.getVerticalEmoji = getVerticalEmoji;
window.showToast = showToast;
window.openModal = openModal;
window.closeModal = closeModal;
window.copyToClipboard = copyToClipboard;
window.openAllInTabs = openAllInTabs;
window.highlight = highlight;
window.formatDate = formatDate;
window.truncate = truncate;
window.assetTypeLabel = assetTypeLabel;
window.visibilityTag = visibilityTag;
window.openMaterial = openMaterial;
window.renderMaterialCard = renderMaterialCard;
window.renderMaterialRow = renderMaterialRow;
window.renderSelectOptions = renderSelectOptions;
window.toggleCallPrepItem = toggleCallPrepItem;
window.clearCallPrep = clearCallPrep;
window.openCallPrepItems = openCallPrepItems;
window.updateCallPrepTray = updateCallPrepTray;
window.renderCheckbox = renderCheckbox;
window.deleteStagedReports = deleteStagedReports;

const DRAG_DROP = {
  draggedItem: null,
  draggedId: null,
  dragStart: function(e) {
    this.draggedItem = e.target.closest('.card');
    if (!this.draggedItem) return;
    this.draggedId = this.draggedItem.dataset.id;
    setTimeout(() => this.draggedItem.classList.add('dragging'), 0);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', this.draggedId);
  },
  dragOver: function(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const targetCard = e.target.closest('.card');
    if (targetCard && targetCard !== this.draggedItem) {
      targetCard.classList.add('drag-over');
    }
  },
  dragLeave: function(e) {
    const targetCard = e.target.closest('.card');
    if (targetCard) {
      targetCard.classList.remove('drag-over');
    }
  },
  drop: function(e, type) {
    e.preventDefault();
    const targetCard = e.target.closest('.card');
    if (targetCard) {
      targetCard.classList.remove('drag-over');
    }
    if (targetCard && targetCard !== this.draggedItem) {
      // Determine array order
      const grid = targetCard.parentNode;
      const allCards = Array.from(grid.querySelectorAll('.card'));
      const draggedIdx = allCards.indexOf(this.draggedItem);
      const targetIdx = allCards.indexOf(targetCard);
      
      const position = draggedIdx < targetIdx ? 'after' : 'before';
      if (draggedIdx < targetIdx) {
        targetCard.after(this.draggedItem);
      } else {
        targetCard.before(this.draggedItem);
      }
      
      // Fractional sorting: identify neighbors
      const prevSibling = this.draggedItem.previousElementSibling;
      const nextSibling = this.draggedItem.nextElementSibling;
      const prevId = prevSibling && prevSibling.classList.contains('card') ? prevSibling.dataset.id : null;
      const nextId = nextSibling && nextSibling.classList.contains('card') ? nextSibling.dataset.id : null;
      
      // Save order
      if (window.STORE && window.STORE.moveMaterialScore) {
        window.STORE.moveMaterialScore(type, this.draggedItem.dataset.id, prevId, nextId);
      }
      if (window.ROUTER) {
        setTimeout(() => window.ROUTER.render(), 100);
      }
    }
  },
  dragEnd: function(e) {
    if (this.draggedItem) {
      this.draggedItem.classList.remove('dragging');
      this.draggedItem = null;
      this.draggedId = null;
    }
    document.querySelectorAll('.card').forEach(c => c.classList.remove('drag-over'));
  }
};
window.DRAG_DROP = DRAG_DROP;

function checkSuperAdminAction(actionFn) {
  if (AUTH.canManageContent()) {
    actionFn();
  } else {
    showToast('Super Admin access required', 'error');
  }
}
window.checkSuperAdminAction = checkSuperAdminAction;

// Global hover logic to play any video thumbnail immediately
document.addEventListener('mouseover', (e) => {
  const target = e.target;
  if (!target) return;
  const container = target.closest('.creative-card-item, .creative-list-item, .material-row, .dashboard-col-row, .ref-card, .card, td, tr, li, div[onclick]');
  if (container) {
    const video = container.querySelector('video');
    if (video && video.paused) {
      video.loop = true;
      video.muted = true;
      video.play().catch(() => {});
    }
  } else if (target.tagName === 'VIDEO') {
    if (target.paused) {
      target.loop = true;
      target.muted = true;
      target.play().catch(() => {});
    }
  }
}, true);

document.addEventListener('mouseout', (e) => {
  const target = e.target;
  if (!target) return;
  const container = target.closest('.creative-card-item, .creative-list-item, .material-row, .dashboard-col-row, .ref-card, .card, td, tr, li, div[onclick]');
  if (container) {
    if (e.relatedTarget && container.contains(e.relatedTarget)) {
      return;
    }
    const video = container.querySelector('video');
    if (video && !video.paused && !video.controls) {
      video.pause();
      video.currentTime = 0;
    }
  } else if (target.tagName === 'VIDEO') {
    if (e.relatedTarget === target) return;
    if (!target.paused && !target.controls) {
      target.pause();
      target.currentTime = 0;
    }
  }
}, true);


