/**
 * AUTH.JS — Authentication module
 *
 * ⚠️  DEMO CREDENTIALS — REPLACE BEFORE PRODUCTION
 *
 *   Super Admin  →  username: "super admin"  |  password: "admin"
 *                   Role: SUPERADMIN — full portal access + admin panel + all CRUD
 *
 *   Admin        →  username: "admin"         |  password: "admin"
 *                   Role: ADMIN — view-only (browse all content, no add/edit/delete)
 *
 * ── Production upgrade path ──────────────────────────────────────────
 *  1. Replace login() with a real POST /api/auth/login call
 *  2. Replace sessionStorage with JWT / httpOnly cookies
 *  3. Move role enforcement to the backend — never trust client-side roles in prod
 *  4. Add rate limiting + CSRF protection on the login endpoint
 *  5. Remove the demo user table and login hint from index.html
 * ─────────────────────────────────────────────────────────────────────
 */

'use strict';

const AUTH = (() => {

  const LOCAL_USERS_KEY = 'np_portal_users';
  const LOCAL_DELETED_USERS_KEY = 'np_deleted_users';

  const DEFAULT_USERS = [
    {
      username:    'super admin',
      password:    'Np7$vK#9q!X',
      role:        'superadmin',
      displayName: 'Super Admin',
      glowColor:   '#2563eb' // dark blue
    },
    {
      username:    'alex_np',
      password:    'Ax9#Kq2!',
      role:        'admin',
      displayName: 'Alex',
      glowColor:   '#3b82f6' // blue
    },
    {
      username:    'damon_n',
      password:    'Dm5$Wr9?',
      role:        'admin',
      displayName: 'Damon',
      glowColor:   '#8b5cf6' // purple
    },
    {
      username:    'julia_n',
      password:    'Jl7*Yp4&',
      role:        'admin',
      displayName: 'Julia',
      glowColor:   '#ec4899' // red/pink
    },
    {
      username:    'max_np',
      password:    'Mx3@Zb8%',
      role:        'admin',
      displayName: 'Max',
      glowColor:   '#f97316' // orange
    },
    {
      username:    'maxim_n',
      password:    'Mn8#Fv2$',
      role:        'admin',
      displayName: 'Maxim',
      glowColor:   '#78350f' // brown
    },
    {
      username:    'melina_',
      password:    'Ml4!Kd9^',
      role:        'admin',
      displayName: 'Melina',
      glowColor:   '#000000' // black
    },
    {
      username:    'paul_np',
      password:    'Pl9(Xn5_',
      role:        'admin',
      displayName: 'Paul',
      glowColor:   '#10b981' // green
    },
    {
      username:    'mariesm',
      password:    'sef2!3fse)_1',
      role:        'admin',
      displayName: 'Marie (SMM team)',
      glowColor:   '#06b6d4' // cyan
    }
  ];

  function getUsers() {
    let usersList = [...DEFAULT_USERS];
    
    // 1. Try server sync first
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('GET', 'data.php?type=users&t=' + Date.now(), false); // synchronous, cache-busting
      xhr.send(null);
      if (xhr.status === 200) {
        const serverData = JSON.parse(xhr.responseText);
        if (Array.isArray(serverData) && serverData.length > 0) {
          usersList = serverData;
        }
      }
    } catch (e) {}

    // 2. Merge local storage overrides
    try {
      const raw = localStorage.getItem(LOCAL_USERS_KEY);
      if (raw) {
        let localUsers = JSON.parse(raw);
        localUsers.forEach(lu => {
          const idx = usersList.findIndex(su => su.username === lu.username);
          if (idx === -1) {
            usersList.push(lu);
          } else {
            usersList[idx] = lu; // local override
          }
        });
      }
    } catch (e) {}

    // Load deleted users list to prevent respawn
    let deletedUsers = [];
    try {
      const rawDeleted = localStorage.getItem(LOCAL_DELETED_USERS_KEY);
      if (rawDeleted) {
        deletedUsers = JSON.parse(rawDeleted);
      }
    } catch (e) {}

    // Ensure all defaults exist UNLESS they were explicitly deleted
    DEFAULT_USERS.forEach(du => {
      if (!usersList.some(lu => lu.username === du.username) && !deletedUsers.includes(du.username)) {
        usersList.push(du);
      }
    });

    // Final filter just in case a deleted user snuck through from server sync
    usersList = usersList.filter(u => !deletedUsers.includes(u.username));

    return usersList;
  }

  function saveUsers(usersList) {
    let deletedUsers = [];
    DEFAULT_USERS.forEach(du => {
      if (!usersList.some(lu => lu.username === du.username)) {
        deletedUsers.push(du.username);
      }
    });

    try {
      localStorage.setItem(LOCAL_DELETED_USERS_KEY, JSON.stringify(deletedUsers));
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));
    } catch (e) {}
    
    try {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', 'data.php?type=users', true); // async
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(usersList));
    } catch (e) {}
  }

  const SESSION_KEY = 'np_portal_session';
  const ADMIN_KEY   = 'np_admin_auth';
  const THEME_KEY   = 'np_portal_theme';

  // ── Login ──
  function login(username, password) {
    const user = getUsers().find(
      u => u.username.toLowerCase() === username.toLowerCase().trim()
        && u.password === password
    );

    if (user) {
      const session = {
        username:    user.username,
        displayName: user.displayName,
        role:        user.role,
        loginAt:     new Date().toISOString()
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      return { success: true, session };
    }

    return { success: false, error: 'Invalid username or password.' };
  }

  function logout() {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(ADMIN_KEY);
    window.location.replace('index.html');
  }

  function getSession() {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }

  function isAuthenticated() { return !!getSession(); }

  // ── Role helpers ──
  function getRole() {
    const s = getSession();
    return s ? s.role : null;
  }

  /** Only superadmin can add, edit, or delete content */
  function canManageContent() { return getRole() === 'superadmin'; }

  /** Only superadmin can access the Admin panel */
  function canAccessAdmin() { return getRole() === 'superadmin'; }

  // ── Admin sub-auth (Admin panel re-auth) ──
  function unlockAdmin(password) {
    if (!canAccessAdmin()) return false;
    // Password for super admin is 'admin' or whatever they set
    const superAdmin = getUsers().find(u => u.role === 'superadmin');
    if (superAdmin && password === superAdmin.password) {
      sessionStorage.setItem(ADMIN_KEY, '1');
      return true;
    }
    return false;
  }

  function isAdminUnlocked() {
    return canAccessAdmin() && sessionStorage.getItem(ADMIN_KEY) === '1';
  }

  function requireAuth() {
    if (!isAuthenticated()) {
      window.location.replace('index.html');
      return false;
    }
    return true;
  }

  // ── Theme persistence ──
  function getSavedTheme() {
    return localStorage.getItem(THEME_KEY) || 'dark';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(THEME_KEY, theme);
  }

  return {
    login, logout, getSession, isAuthenticated,
    getRole, canManageContent, canAccessAdmin,
    unlockAdmin, isAdminUnlocked,
    requireAuth,
    getSavedTheme, applyTheme,
    getUsers, saveUsers
  };
})();
