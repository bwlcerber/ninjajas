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
      displayName: 'Marie',
      glowColor:   '#06b6d4' // cyan
    }
  ];

  function getUsers() {
    try {
      const raw = localStorage.getItem(LOCAL_USERS_KEY);
      if (raw) {
        let localUsers = JSON.parse(raw);
        // Ensure any new default users added to the source code are synced to localStorage
        DEFAULT_USERS.forEach(du => {
          if (!localUsers.some(lu => lu.username === du.username)) {
            localUsers.push(du);
          }
        });
        return localUsers;
      }
      return DEFAULT_USERS;
    } catch {
      return DEFAULT_USERS;
    }
  }

  function saveUsers(usersList) {
    try {
      localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(usersList));
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
