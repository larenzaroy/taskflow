/**
 * TaskFlow - Main Application Controller
 * Orchestrates navigation, events, modals, APIs, notifications, audio feedback, and initialization.
 */

import { Storage } from './storage.js';
import { Api } from './api.js';
import { TaskManager } from './tasks.js';
import { DashboardUI } from './dashboard.js';
import { CalendarView } from './calendar.js';

// Sound effect synthesizer via Web Audio API (lightweight, zero external audio assets)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = Storage.getSettings().soundEffects;
  }

  init() {
    if (!this.ctx && (window.AudioContext || window.webkitAudioContext)) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
  }

  playComplete() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';

      // Cheerful chime: C5 -> G5
      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.35);
    } catch {
      // Audio autoplay policy or unavailable, silently pass
    }
  }

  playPop() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      if (this.ctx.state === 'suspended') this.ctx.resume();

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';

      const now = this.ctx.currentTime;
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.08);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch {
      // pass
    }
  }
}

class App {
  constructor() {
    this.taskManager = new TaskManager();
    this.soundManager = new SoundManager();
    this.ui = new DashboardUI(this.taskManager, this);
    this.calendar = new CalendarView(
      this.taskManager,
      (dateStr) => this.handleCalendarDateSelect(dateStr),
      (dateStr) => this.openTaskModalForDate(dateStr),
      (taskId) => this.openTaskModal(taskId)
    );

    // Active modal state
    this.editingTaskId = null;
    this.tempModalSubtasks = [];
    this.taskToDeleteId = null;
    this.currentInspiration = null;

    // View title mappings
    this.viewTitles = {
      dashboard: 'My Productivity Dashboard',
      'my-tasks': 'My Tasks',
      all: 'My Tasks',
      today: "Today's Priorities",
      upcoming: 'Upcoming Tasks & Deadlines',
      calendar: 'Yearly Calendar & Schedule',
      favorites: 'Starred & Favorite Tasks',
      'in-progress': 'In Progress Tasks',
      completed: 'Completed Tasks',
      gdg: 'GDG Tech Team Tasks',
      academics: 'Academics & Coursework',
      personal: 'Personal Projects & Habits',
      settings: 'Preferences & Settings'
    };
  }

  /**
   * Application entry point
   */
  async init() {
    // 0. Initialize Authentication State
    this.initAuth();

    // 1. Initialize Theme
    this.initTheme();

    // 2. Initialize Sidebar state
    this.initSidebar();

    // 3. Initialize Top Bar (live time, greeting, profile)
    this.initTopBar();

    // 4. Initialize Live Weather Widget
    this.initWeather();

    // 5. Register Event Listeners
    this.bindEvents();

    // 6. Subscribe UI updates to taskManager state changes
    this.taskManager.subscribe(() => {
      this.render();
    });

    // 7. Initial render
    this.render();

    // 8. Fetch initial Daily Inspiration from Advice Slip API
    this.loadAdviceSlip();

    // 9. Fetch sample tasks from DummyJSON Todos API for "Explore Sample Tasks"
    this.loadSampleTasks();
  }

  /**
   * Safe Icon Refresh (uses Lucide or inline SVG fallback if offline)
   */
  refreshIcons(rootEl = null) {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons(rootEl ? { root: rootEl } : undefined);
    } else {
      this.renderFallbackIcons(rootEl || document);
    }
  }

  renderFallbackIcons(root = document) {
    const icons = root.querySelectorAll('i[data-lucide]');
    icons.forEach(el => {
      if (el.dataset.fallbackDone) return;
      const name = el.getAttribute('data-lucide');
      el.dataset.fallbackDone = 'true';
      el.style.display = 'inline-flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
      el.style.fontStyle = 'normal';

      const svgMap = {
        'layout-dashboard': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/><rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/></svg>',
        'check-square': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/></svg>',
        'calendar-check-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>',
        'calendar-clock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><circle cx="16" cy="17" r="4"/><path d="M16 15v2l1 1"/></svg>',
        'calendar-days': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>',
        'sun': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
        'moon': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
        'star': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        'plus': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
        'check': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>',
        'clock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
        'timer': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="10" x2="14" y1="2" y2="2"/><line x1="12" x2="15" y1="14" y2="11"/><circle cx="12" cy="14" r="8"/></svg>',
        'check-circle-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>',
        'bell': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
        'trash-2': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>',
        'pencil': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>',
        'refresh-cw': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/><path d="M8 16H3v5"/></svg>',
        'copy': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>',
        'sparkles': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>',
        'mail': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
        'lock': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
        'eye': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
        'eye-off': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
        'log-in': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" x2="3" y1="12" y2="12"/></svg>',
        'log-out': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
        'user-plus': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>',
        'shield-check': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>',
        'key-round': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z"/><circle cx="16.5" cy="7.5" r=".5" fill="currentColor"/></svg>',
        'arrow-right': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>',
        'zap': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
        'user': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        'briefcase': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>',
        'info': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
        'calendar': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
        'bar-chart-3': '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 3v18h18"/><path d="M18 17V9"/><path d="M13 17V5"/><path d="M8 17v-3"/></svg>'
      };

      if (svgMap[name]) {
        el.innerHTML = svgMap[name];
      }
    });
  }

  /**
   * Theme Setup
   */
  initTheme() {
    const savedTheme = Storage.getTheme();
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcons(savedTheme, false);
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    Storage.setTheme(newTheme);
    this.updateThemeIcons(newTheme, true);
    this.showToast(`Switched to ${newTheme.toUpperCase()} mode`, 'info');
  }

  updateThemeIcons(theme, animate = true) {
    const iconName = theme === 'dark' ? 'sun' : 'moon';

    // SVG paths for sun and moon (used when Lucide has already replaced <i> with <svg>)
    const svgSun  = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`;
    const svgMoon = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>`;
    const newSvg  = theme === 'dark' ? svgSun : svgMoon;

    const btnIds = ['btn-theme-toggle', 'sidebar-theme-toggle', 'btn-auth-theme-toggle'];

    btnIds.forEach(id => {
      const btn = document.getElementById(id);
      if (!btn) return;

      // Find either an <i data-lucide> or an already-rendered <svg> inside the button
      const existingIcon = btn.querySelector('i[data-lucide], svg:not(.google-icon):not(.brand-svg):not(.auth-logo-svg)');
      if (existingIcon) {
        if (!animate) {
          // Instant swap without animation (e.g. on initial page load)
          const wrapper = existingIcon.parentNode;
          const newEl   = document.createElement('i');
          newEl.setAttribute('data-lucide', iconName);
          if (existingIcon.tagName === 'I') {
            newEl.className = existingIcon.className;
          }
          wrapper.replaceChild(newEl, existingIcon);

          if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons({ root: btn });
          } else {
            newEl.innerHTML = newSvg;
          }
        } else {
          // Rotate 90 degrees with ZERO fading (opacity stays 1, no scale change)
          existingIcon.style.transition = 'transform 0.18s cubic-bezier(0.4, 0, 0.2, 1)';
          existingIcon.style.transform  = 'rotate(90deg)';

          setTimeout(() => {
            const wrapper = existingIcon.parentNode;
            const newEl   = document.createElement('i');
            newEl.setAttribute('data-lucide', iconName);
            if (existingIcon.tagName === 'I') {
              newEl.className = existingIcon.className;
            }
            wrapper.replaceChild(newEl, existingIcon);

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
              window.lucide.createIcons({ root: btn });
            } else {
              newEl.innerHTML = newSvg;
            }

            const rendered = btn.querySelector('i[data-lucide], svg:not(.google-icon):not(.brand-svg):not(.auth-logo-svg)');
            if (rendered) {
              rendered.style.transition = 'none';
              rendered.style.transform  = 'rotate(-90deg)';
              rendered.getBoundingClientRect(); // Force reflow
              rendered.style.transition = 'transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)';
              rendered.style.transform  = 'rotate(0deg)';
            }
          }, 180);
        }
      }

      const label = btn.querySelector('.theme-label-text');
      if (label) {
        label.textContent = theme === 'dark' ? 'Light Mode' : 'Dark Mode';
      }
    });
  }

  /**
   * Sidebar Setup — always start expanded so nav labels are visible.
   * We reset any stale 'collapsed' state from localStorage on load
   * so a first-time (or returning) user always sees the full sidebar.
   */
  initSidebar() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;

    // Clear any previously stored collapsed state — always open expanded on load
    Storage.setSidebarState('expanded');
    sidebar.classList.remove('collapsed');
    document.body.classList.remove('sidebar-is-collapsed');
  }

  toggleSidebarCollapse() {
    const sidebar = document.getElementById('app-sidebar');
    if (!sidebar) return;
    const isCollapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-is-collapsed', isCollapsed);
    Storage.setSidebarState(isCollapsed ? 'collapsed' : 'expanded');
  }

  toggleMobileSidebar(forceClose = false) {
    const sidebar = document.getElementById('app-sidebar');
    const overlay = document.getElementById('sidebar-mobile-overlay');
    if (!sidebar || !overlay) return;

    if (forceClose) {
      sidebar.classList.remove('mobile-open');
      overlay.classList.remove('active');
    } else {
      const isOpen = sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active', isOpen);
    }
  }

  /**
   * Top bar setup: dynamic greeting, live clock, user profile
   */
  initTopBar() {
    this.updateGreetingAndDate();
    setInterval(() => this.updateGreetingAndDate(), 30000);
    this.renderUserProfile();
  }

  updateGreetingAndDate() {
    const greetingEl = document.getElementById('topbar-greeting');
    const dateEl = document.getElementById('topbar-date');
    const profile = Storage.getProfile();

    const now = new Date();

    // Use Indian Standard Time (IST, UTC+05:30) for greeting & date calculation
    const istFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      hour12: false
    });
    const hourIST = parseInt(istFormatter.format(now), 10);

    let timeGreeting;
    if (hourIST >= 5 && hourIST < 12) {
      timeGreeting = 'Good morning';      // 05:00–11:59 IST
    } else if (hourIST >= 12 && hourIST < 17) {
      timeGreeting = 'Good afternoon';   // 12:00–16:59 IST
    } else {
      timeGreeting = 'Good evening';     // 17:00–04:59 IST (including 22:00–04:59 IST)
    }

    if (greetingEl) {
      greetingEl.textContent = `${timeGreeting}, ready to be productive? ✨`;
    }

    if (dateEl) {
      const options = { timeZone: 'Asia/Kolkata', weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
      dateEl.textContent = now.toLocaleDateString('en-IN', options);
    }
  }

  /**
   * Authentication State Management
   */
  initAuth() {
    const isAuth = Storage.isAuthenticated();
    const authWrapper = document.getElementById('auth-page-wrapper');
    if (!authWrapper) return;

    if (isAuth) {
      authWrapper.classList.add('is-hidden');
      const auth = Storage.getAuth();
      if (auth && auth.user) {
        this.applyUserProfile(auth.user);
      }
    } else {
      authWrapper.classList.remove('is-hidden');
    }

    this.bindAuthEvents();
  }

  showAuthPage(tab = 'signin') {
    const authWrapper = document.getElementById('auth-page-wrapper');
    if (!authWrapper) return;
    this.switchAuthTab(tab);
    authWrapper.classList.remove('is-hidden');
    this.refreshIcons(authWrapper);
  }

  hideAuthPage() {
    const authWrapper = document.getElementById('auth-page-wrapper');
    if (!authWrapper) return;
    authWrapper.classList.add('is-hidden');
  }

  switchAuthTab(tab) {
    const signinTab = document.getElementById('tab-btn-signin');
    const signupTab = document.getElementById('tab-btn-signup');
    const signinForm = document.getElementById('auth-form-signin');
    const signupForm = document.getElementById('auth-form-signup');
    const titleEl = document.getElementById('auth-main-title');
    const subtitleEl = document.getElementById('auth-main-subtitle');

    if (tab === 'signup') {
      signinTab?.classList.remove('active');
      signupTab?.classList.add('active');
      if (signinForm) signinForm.style.display = 'none';
      if (signupForm) signupForm.style.display = 'flex';
      if (titleEl) titleEl.textContent = 'Create Your Account';
      if (subtitleEl) subtitleEl.textContent = 'Join TaskFlow and supercharge your productivity.';
    } else {
      signupTab?.classList.remove('active');
      signinTab?.classList.add('active');
      if (signupForm) signupForm.style.display = 'none';
      if (signinForm) signinForm.style.display = 'flex';
      if (titleEl) titleEl.textContent = 'Welcome to TaskFlow';
      if (subtitleEl) subtitleEl.textContent = 'Your intelligent space for peak productivity.';
    }
    this.refreshIcons();
  }

  applyUserProfile(user) {
    Storage.saveProfile(user);
    this.renderUserProfile();
    this.updateGreetingAndDate();
  }

  bindAuthEvents() {
    // 1. Tab switches
    document.getElementById('tab-btn-signin')?.addEventListener('click', () => this.switchAuthTab('signin'));
    document.getElementById('tab-btn-signup')?.addEventListener('click', () => this.switchAuthTab('signup'));

    // 2. Show/hide password toggles
    this.setupPasswordToggle('btn-toggle-signin-pw', 'signin-password');
    this.setupPasswordToggle('btn-toggle-signup-pw', 'signup-password');

    // 3. Social Google Login
    document.getElementById('btn-google-signin')?.addEventListener('click', () => this.handleGoogleLogin());

    // 4. Instant Demo Access Login
    document.getElementById('btn-quick-demo-login')?.addEventListener('click', () => this.handleDemoLogin());

    // 5. Explore as Guest
    document.getElementById('btn-auth-guest-access')?.addEventListener('click', () => {
      this.hideAuthPage();
      this.showToast('Welcome, Guest! Exploring TaskFlow in preview mode.', 'info');
    });

    // 6. Sign In Form Submission
    document.getElementById('auth-form-signin')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignInSubmit();
    });

    // 7. Sign Up Form Submission
    document.getElementById('auth-form-signup')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignUpSubmit();
    });

    // 8. Forgot Password Modal
    document.getElementById('link-forgot-password')?.addEventListener('click', () => {
      document.getElementById('auth-forgot-modal')?.classList.add('active');
    });
    document.getElementById('btn-close-forgot-modal')?.addEventListener('click', () => {
      document.getElementById('auth-forgot-modal')?.classList.remove('active');
    });
    document.getElementById('auth-form-forgot')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('forgot-email')?.value.trim();
      document.getElementById('auth-forgot-modal')?.classList.remove('active');
      this.showToast(`Password recovery link sent to ${email || 'your email'}. Check your inbox!`, 'success');
    });

    // 9. Auth page theme toggle
    document.getElementById('btn-auth-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // 10. Logout triggers (Topbar dropdown, Sidebar, Settings)
    document.getElementById('btn-topbar-logout')?.addEventListener('click', () => this.handleLogout());
    document.getElementById('btn-sidebar-logout')?.addEventListener('click', () => this.handleLogout());
    document.getElementById('btn-settings-logout')?.addEventListener('click', () => this.handleLogout());
    document.getElementById('btn-settings-switch-account')?.addEventListener('click', () => this.handleLogout());
  }

  setupPasswordToggle(btnId, inputId) {
    const btn = document.getElementById(btnId);
    const input = document.getElementById(inputId);
    if (!btn || !input) return;

    btn.addEventListener('click', () => {
      const isPassword = input.type === 'password';
      input.type = isPassword ? 'text' : 'password';
      const icon = btn.querySelector('i');
      if (icon) {
        icon.setAttribute('data-lucide', isPassword ? 'eye-off' : 'eye');
        delete icon.dataset.fallbackDone;
      }
      this.refreshIcons(btn);
    });
  }

  handleDemoLogin() {
    const submitBtn = document.getElementById('btn-quick-demo-login');
    if (submitBtn) submitBtn.style.opacity = '0.7';

    setTimeout(() => {
      const demoUser = {
        name: 'Uttam Kumar Roy',
        email: 'uttam.gdg@gmail.com',
        role: 'GDG BPPIMT Tech Team Lead',
        avatar: '👨‍💻'
      };
      Storage.setAuth(demoUser, true);
      this.applyUserProfile(demoUser);
      this.hideAuthPage();
      this.showToast('Welcome back, Uttam! Ready to lead productivity. ✨', 'success');
      if (submitBtn) submitBtn.style.opacity = '1';
    }, 350);
  }

  handleGoogleLogin() {
    const googleBtn = document.getElementById('btn-google-signin');
    if (googleBtn) {
      googleBtn.style.pointerEvents = 'none';
      googleBtn.innerHTML = `
        <svg class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10" stroke-opacity="0.25"/>
          <path d="M12 2a10 10 0 0 1 10 10" stroke-linecap="round"/>
        </svg>
        <span>Connecting with Google...</span>
      `;
    }

    setTimeout(() => {
      const googleUser = {
        name: 'Uttam Kumar Roy',
        email: 'uttam.gdg@gmail.com',
        role: 'GDG BPPIMT Tech Lead',
        avatar: '👨‍💻'
      };
      Storage.setAuth(googleUser, true);
      this.applyUserProfile(googleUser);
      this.hideAuthPage();
      this.showToast('Signed in with Google successfully!', 'success');

      if (googleBtn) {
        googleBtn.style.pointerEvents = 'auto';
        googleBtn.innerHTML = `
          <svg class="google-icon" viewBox="0 0 24 24" width="20" height="20">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
          </svg>
          <span>Continue with Google</span>
        `;
      }
    }, 600);
  }

  handleSignInSubmit() {
    const emailEl = document.getElementById('signin-email');
    const pwEl = document.getElementById('signin-password');
    const rememberEl = document.getElementById('signin-remember');
    const emailErr = document.getElementById('signin-email-error');
    const pwErr = document.getElementById('signin-password-error');

    if (emailErr) emailErr.textContent = '';
    if (pwErr) pwErr.textContent = '';

    const email = emailEl?.value.trim() || '';
    const password = pwEl?.value || '';
    const remember = rememberEl ? rememberEl.checked : true;

    let hasError = false;
    if (!email || !email.includes('@')) {
      if (emailErr) emailErr.textContent = 'Please enter a valid email address.';
      hasError = true;
    }
    if (!password || password.length < 4) {
      if (pwErr) pwErr.textContent = 'Please enter your password (min 4 characters).';
      hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('btn-submit-signin');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>Signing in...</span>`;
    }

    setTimeout(() => {
      const derivedName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const user = {
        name: derivedName || 'Uttam Kumar Roy',
        email: email,
        role: 'TaskFlow Member',
        avatar: '👨‍💻'
      };

      Storage.setAuth(user, remember);
      this.applyUserProfile(user);
      this.hideAuthPage();
      this.showToast(`Signed in as ${user.name}! Welcome to TaskFlow.`, 'success');

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-text">Sign In to Dashboard</span> <i data-lucide="arrow-right"></i>`;
        this.refreshIcons(btn);
      }
    }, 450);
  }

  handleSignUpSubmit() {
    const nameEl = document.getElementById('signup-name');
    const emailEl = document.getElementById('signup-email');
    const roleEl = document.getElementById('signup-role');
    const pwEl = document.getElementById('signup-password');
    const termsEl = document.getElementById('signup-terms');

    const nameErr = document.getElementById('signup-name-error');
    const emailErr = document.getElementById('signup-email-error');
    const pwErr = document.getElementById('signup-password-error');

    if (nameErr) nameErr.textContent = '';
    if (emailErr) emailErr.textContent = '';
    if (pwErr) pwErr.textContent = '';

    const name = nameEl?.value.trim() || '';
    const email = emailEl?.value.trim() || '';
    const role = roleEl?.value.trim() || 'Productivity Enthusiast';
    const password = pwEl?.value || '';

    let hasError = false;
    if (!name) {
      if (nameErr) nameErr.textContent = 'Please enter your full name.';
      hasError = true;
    }
    if (!email || !email.includes('@')) {
      if (emailErr) emailErr.textContent = 'Please enter a valid email address.';
      hasError = true;
    }
    if (!password || password.length < 6) {
      if (pwErr) pwErr.textContent = 'Password must be at least 6 characters.';
      hasError = true;
    }
    if (termsEl && !termsEl.checked) {
      this.showToast('Please agree to the Terms & Community Guidelines to continue.', 'warning');
      hasError = true;
    }

    if (hasError) return;

    const btn = document.getElementById('btn-submit-signup');
    if (btn) {
      btn.disabled = true;
      btn.innerHTML = `<span>Creating Account...</span>`;
    }

    setTimeout(() => {
      const newUser = {
        name: name,
        email: email,
        role: role,
        avatar: '🚀'
      };

      Storage.setAuth(newUser, true);
      this.applyUserProfile(newUser);
      this.hideAuthPage();
      this.showToast(`Account created! Welcome to TaskFlow, ${newUser.name}!`, 'success');

      if (btn) {
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-text">Create Free Account</span> <i data-lucide="user-plus"></i>`;
        this.refreshIcons(btn);
      }
    }, 550);
  }

  handleLogout() {
    Storage.clearAuth();
    this.showAuthPage('signin');
    this.showToast('You have been signed out successfully.', 'info');
  }

  renderUserProfile() {
    const profile = Storage.getProfile();
    const nameEl = document.getElementById('sidebar-user-name');
    const roleEl = document.getElementById('sidebar-user-role');
    const avatarEl = document.getElementById('sidebar-user-avatar');
    const topAvatarEl = document.getElementById('topbar-avatar');
    const menuNameEl = document.getElementById('profile-menu-name');
    const menuRoleEl = document.getElementById('profile-menu-role');

    if (nameEl) nameEl.textContent = profile.name;
    if (roleEl) roleEl.textContent = profile.role;
    if (avatarEl) avatarEl.textContent = profile.avatar || '👨‍💻';
    if (topAvatarEl) topAvatarEl.textContent = profile.avatar || '👨‍💻';
    if (menuNameEl) menuNameEl.textContent = profile.name;
    if (menuRoleEl) menuRoleEl.textContent = profile.role;
  }

  /**
   * Live Weather Widget Initialization
   */
  async initWeather() {
    const pill = document.getElementById('topbar-weather-pill');
    if (!pill) return;

    const settings = Storage.getSettings();
    const result = await Api.fetchLiveWeather(settings.weatherApiKey, settings.weatherCity);

    if (result && result.success) {
      pill.innerHTML = `
        <i data-lucide="${result.icon || 'sun'}" class="weather-icon"></i>
        <span class="weather-temp">${result.temp}°C</span>
        <span class="weather-city">${result.city}</span>
      `;
      pill.title = `${result.condition} in ${result.city}`;
      this.refreshIcons(pill);
    }
  }

  /**
   * Switch active navigation view
   */
  navigateTo(viewName) {
    if (!this.viewTitles[viewName]) viewName = 'dashboard';
    this.taskManager.currentView = viewName;

    // Update active class on all sidebar items
    document.querySelectorAll('.nav-item').forEach(item => {
      const itemTarget = item.getAttribute('data-view');
      item.classList.toggle('active', itemTarget === viewName);
    });

    // Update main heading
    const titleEl = document.getElementById('main-view-title');
    if (titleEl) {
      titleEl.textContent = this.viewTitles[viewName];
    }

    // Toggle view containers
    const dashboardContainer = document.getElementById('view-dashboard');
    const tasksViewContainer = document.getElementById('view-tasks-page');
    const calendarContainer = document.getElementById('view-calendar');
    const settingsContainer = document.getElementById('view-settings');

    if (dashboardContainer) dashboardContainer.style.display = 'none';
    if (tasksViewContainer) tasksViewContainer.style.display = 'none';
    if (calendarContainer) calendarContainer.style.display = 'none';
    if (settingsContainer) settingsContainer.style.display = 'none';

    if (viewName === 'calendar') {
      if (calendarContainer) {
        calendarContainer.style.display = 'block';
        this.calendar.render(calendarContainer);
      }
    } else if (viewName === 'settings') {
      if (settingsContainer) {
        settingsContainer.style.display = 'block';
        this.renderSettingsView();
      }
    } else if (viewName === 'dashboard') {
      if (dashboardContainer) {
        dashboardContainer.style.display = 'block';
        this.ui.renderSummaryCards();
        this.ui.renderUpcomingDeadlinesWidget();
        this.ui.renderDashboardQuickTasks();
        this.ui.renderSampleTasksSection();
      }
    } else {
      // Any list view: 'my-tasks', 'today', 'upcoming', 'favorites', 'in-progress', 'completed', 'gdg', 'academics', 'personal'
      if (tasksViewContainer) {
        tasksViewContainer.style.display = 'block';
        this.ui.renderTaskList('main-tasks-container');
      }
    }

    // Close mobile drawer on navigation
    this.toggleMobileSidebar(true);

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.refreshIcons();
  }

  /**
   * Main render trigger
   */
  render() {
    this.ui.renderSummaryCards();
    this.ui.renderUpcomingDeadlinesWidget();
    this.ui.renderDashboardQuickTasks();

    const view = this.taskManager.currentView;
    if (view === 'calendar') {
      const calContainer = document.getElementById('view-calendar');
      this.calendar.render(calContainer);
    } else if (view === 'settings') {
      // on demand
    } else if (view === 'dashboard') {
      this.ui.renderDashboardQuickTasks();
      this.ui.renderSampleTasksSection();
    } else {
      this.ui.renderTaskList('main-tasks-container');
    }

    this.refreshIcons();
  }

  /**
   * Fetch Daily Inspiration from Advice Slip API with smooth transitions
   */
  async loadAdviceSlip() {
    const quoteEl = document.getElementById('advice-quote-text');
    const badgeEl = document.getElementById('advice-id-badge');
    const themeEl = document.getElementById('inspiration-theme-tag');
    const imgEl = document.getElementById('inspiration-hero-img');
    const captionEl = document.getElementById('inspiration-photo-caption');
    const refreshBtn = document.getElementById('btn-refresh-advice');
    const refreshIcon = refreshBtn?.querySelector('i');

    if (!quoteEl) return;

    // Start loading transition
    if (refreshIcon) refreshIcon.classList.add('spin-animation');
    quoteEl.classList.add('quote-transitioning');
    if (imgEl) imgEl.classList.add('img-transitioning');

    const result = await Api.fetchAdvice();
    this.currentInspiration = result;

    setTimeout(() => {
      // Update text and tags
      quoteEl.textContent = `“${result.advice}”`;
      if (badgeEl) badgeEl.textContent = result.sourceBadge;
      if (themeEl) themeEl.textContent = result.tag || result.theme;

      // Update image with smooth crossfade
      if (imgEl) {
        imgEl.src = result.photoUrl;
        imgEl.alt = result.photoAlt || result.theme;
        imgEl.onerror = () => {
          // Gracefully fall back to local SVG illustration if offline
          imgEl.src = result.fallbackUrl;
        };
      }

      if (captionEl) {
        captionEl.textContent = result.photoCaption || result.theme;
      }

      // Remove transition classes
      quoteEl.classList.remove('quote-transitioning');
      if (imgEl) imgEl.classList.remove('img-transitioning');
      if (refreshIcon) refreshIcon.classList.remove('spin-animation');
    }, 200);
  }

  /**
   * Copy current quote to clipboard
   */
  copyCurrentQuote() {
    const quoteEl = document.getElementById('advice-quote-text');
    if (!quoteEl) return;

    const textToCopy = quoteEl.textContent.trim();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        this.showToast('Quote copied to clipboard! ✨', 'success');
      }).catch(() => {
        this.fallbackCopyText(textToCopy);
      });
    } else {
      this.fallbackCopyText(textToCopy);
    }
  }

  fallbackCopyText(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      document.execCommand('copy');
      this.showToast('Quote copied to clipboard! ✨', 'success');
    } catch {
      this.showToast('Failed to copy quote.', 'warning');
    }
    document.body.removeChild(textArea);
  }

  /**
   * Fetch sample tasks from DummyJSON Todos API for "Explore Sample Tasks"
   */
  async loadSampleTasks() {
    this.ui.renderSampleTasksSection(true);
    const result = await Api.fetchDemoTodos(6);

    if (result.success && result.todos.length > 0) {
      this.taskManager.setSampleTasks(result.todos);
      this.ui.renderSampleTasksSection(false);
    } else {
      this.ui.renderSampleTasksSection(false, result.error || 'Network error');
    }
  }

  /**
   * Import sample task into user tasks
   */
  handleImportSampleTask(sampleId) {
    const userTask = this.taskManager.importSampleTask(sampleId);
    if (userTask) {
      this.soundManager.playPop();
      this.showToast(`Imported "${userTask.title}" to My Tasks! 🎉`, 'success');
      this.ui.renderSampleTasksSection();
    }
  }

  /**
   * Modal Management: Create / Edit Task
   */
  openTaskModal(taskId = null, defaultDate = null) {
    const modal = document.getElementById('task-modal');
    const titleInput = document.getElementById('task-modal-title-input');
    const descInput = document.getElementById('task-modal-desc-input');
    const prioritySelect = document.getElementById('task-modal-priority-select');
    const categorySelect = document.getElementById('task-modal-category-select');
    const dueDateInput = document.getElementById('task-modal-duedate-input');
    const statusSelect = document.getElementById('task-modal-status-select');
    const modalHeading = document.getElementById('task-modal-heading');
    const submitBtnText = document.getElementById('task-modal-submit-text');

    if (!modal) return;

    this.editingTaskId = taskId;
    this.tempModalSubtasks = [];

    const todayStr = new Date().toISOString().split('T')[0];

    if (taskId) {
      const task = this.taskManager.getTaskById(taskId);
      if (!task) return;

      modalHeading.textContent = 'Edit Task';
      submitBtnText.textContent = 'Save Changes';
      titleInput.value = task.title;
      descInput.value = task.description || '';
      prioritySelect.value = task.priority;
      categorySelect.value = task.category;
      dueDateInput.value = task.dueDate || todayStr;
      statusSelect.value = task.status;
      this.tempModalSubtasks = Array.isArray(task.subtasks) ? JSON.parse(JSON.stringify(task.subtasks)) : [];
    } else {
      modalHeading.textContent = 'Create New Task';
      submitBtnText.textContent = 'Create Task';
      titleInput.value = '';
      descInput.value = '';
      prioritySelect.value = 'Medium';
      categorySelect.value = 'GDG';
      dueDateInput.value = defaultDate || todayStr;
      statusSelect.value = 'Pending';
      this.tempModalSubtasks = [];
    }

    this.renderModalSubtasks();
    modal.classList.add('active');
    setTimeout(() => titleInput.focus(), 150);
    this.refreshIcons(modal);
  }

  closeTaskModal() {
    const modal = document.getElementById('task-modal');
    if (modal) modal.classList.remove('active');
    this.editingTaskId = null;
    this.tempModalSubtasks = [];
  }

  renderModalSubtasks() {
    const container = document.getElementById('modal-subtasks-list');
    if (!container) return;

    if (this.tempModalSubtasks.length === 0) {
      container.innerHTML = '<span class="text-muted text-xs">No subtasks added yet. Break down large tasks above!</span>';
      return;
    }

    container.innerHTML = this.tempModalSubtasks.map((sub, index) => `
      <div class="modal-subtask-item" data-index="${index}">
        <label class="custom-checkbox-container subtask-cb">
          <input type="checkbox" ${sub.completed ? 'checked' : ''} data-index="${index}" class="temp-subtask-toggle">
          <span class="checkbox-checkmark"><i data-lucide="check" class="check-icon"></i></span>
        </label>
        <span class="subtask-title-text ${sub.completed ? 'strike-through' : ''}">${this.ui.escapeHtml(sub.title)}</span>
        <button type="button" class="btn-icon btn-remove-subtask" data-index="${index}" title="Remove subtask">
          <i data-lucide="x"></i>
        </button>
      </div>
    `).join('');

    this.refreshIcons(container);
  }

  handleAddModalSubtask() {
    const input = document.getElementById('modal-subtask-input');
    if (!input || !input.value.trim()) return;

    this.tempModalSubtasks.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: input.value.trim(),
      completed: false
    });

    input.value = '';
    this.renderModalSubtasks();
    input.focus();
  }

  handleSaveTaskForm(e) {
    e.preventDefault();
    const titleInput = document.getElementById('task-modal-title-input');
    const descInput = document.getElementById('task-modal-desc-input');
    const prioritySelect = document.getElementById('task-modal-priority-select');
    const categorySelect = document.getElementById('task-modal-category-select');
    const dueDateInput = document.getElementById('task-modal-duedate-input');
    const statusSelect = document.getElementById('task-modal-status-select');

    const title = titleInput.value.trim();
    if (!title) {
      this.showToast('Please enter a task title.', 'error');
      titleInput.focus();
      return;
    }

    const taskData = {
      title,
      description: descInput.value.trim(),
      priority: prioritySelect.value,
      category: categorySelect.value,
      dueDate: dueDateInput.value,
      status: statusSelect.value,
      subtasks: this.tempModalSubtasks
    };

    if (this.editingTaskId) {
      this.taskManager.updateTask(this.editingTaskId, taskData);
      this.showToast('Task updated successfully!', 'success');
      this.soundManager.playPop();
    } else {
      this.taskManager.createTask(taskData);
      this.showToast('New task created!', 'success');
      this.soundManager.playPop();
    }

    this.closeTaskModal();
  }

  /**
   * Delete Confirmation Modal
   */
  openDeleteConfirmModal(taskId) {
    const task = this.taskManager.getTaskById(taskId);
    if (!task) return;

    this.taskToDeleteId = taskId;
    const modal = document.getElementById('delete-modal');
    const taskNameEl = document.getElementById('delete-task-name');

    if (taskNameEl) {
      taskNameEl.textContent = `"${task.title}"`;
    }

    if (modal) {
      modal.classList.add('active');
      this.refreshIcons(modal);
    }
  }

  closeDeleteConfirmModal() {
    const modal = document.getElementById('delete-modal');
    if (modal) modal.classList.remove('active');
    this.taskToDeleteId = null;
  }

  handleConfirmDelete() {
    if (!this.taskToDeleteId) return;

    const cardEl = document.querySelector(`.task-card[data-task-id="${this.taskToDeleteId}"]`);

    if (cardEl) {
      cardEl.classList.add('task-card-deleting');
      setTimeout(() => {
        this.taskManager.deleteTask(this.taskToDeleteId);
        this.closeDeleteConfirmModal();
        this.showToast('Task deleted.', 'info');
      }, 250);
    } else {
      this.taskManager.deleteTask(this.taskToDeleteId);
      this.closeDeleteConfirmModal();
      this.showToast('Task deleted.', 'info');
    }
  }

  /**
   * Calendar Date Selection Handler
   */
  handleCalendarDateSelect(dateStr) {
    this.showToast(`Selected date: ${dateStr}`, 'info');
  }

  openTaskModalForDate(dateStr) {
    this.openTaskModal(null, dateStr);
  }

  /**
   * Settings View Rendering & Logic
   */
  renderSettingsView() {
    const profile = Storage.getProfile();
    const settings = Storage.getSettings();

    const nameInput = document.getElementById('settings-name-input');
    const roleInput = document.getElementById('settings-role-input');
    const emailInput = document.getElementById('settings-email-input');
    const soundToggle = document.getElementById('settings-sound-toggle');
    const compactToggle = document.getElementById('settings-compact-toggle');
    const cityInput = document.getElementById('settings-weather-city');
    const weatherKeyInput = document.getElementById('settings-weather-key');

    if (nameInput) nameInput.value = profile.name;
    if (roleInput) roleInput.value = profile.role;
    if (emailInput) emailInput.value = profile.email;
    if (soundToggle) soundToggle.checked = settings.soundEffects;
    if (compactToggle) compactToggle.checked = settings.compactView;
    if (cityInput) cityInput.value = settings.weatherCity || 'Kolkata';
    if (weatherKeyInput) weatherKeyInput.value = settings.weatherApiKey || '';
  }

  saveSettingsForm() {
    const nameInput = document.getElementById('settings-name-input');
    const roleInput = document.getElementById('settings-role-input');
    const emailInput = document.getElementById('settings-email-input');
    const soundToggle = document.getElementById('settings-sound-toggle');
    const compactToggle = document.getElementById('settings-compact-toggle');
    const cityInput = document.getElementById('settings-weather-city');
    const weatherKeyInput = document.getElementById('settings-weather-key');

    const updatedProfile = {
      name: nameInput.value.trim() || 'GDG Member',
      role: roleInput.value.trim() || 'Tech Team',
      email: emailInput.value.trim() || '',
      avatar: Storage.getProfile().avatar || '👨‍💻'
    };

    const updatedSettings = {
      ...Storage.getSettings(),
      soundEffects: soundToggle ? soundToggle.checked : true,
      compactView: compactToggle ? compactToggle.checked : false,
      weatherCity: cityInput ? cityInput.value.trim() : 'Kolkata',
      weatherApiKey: weatherKeyInput ? weatherKeyInput.value.trim() : ''
    };

    Storage.saveProfile(updatedProfile);
    Storage.saveSettings(updatedSettings);
    this.soundManager.enabled = updatedSettings.soundEffects;

    this.renderUserProfile();
    this.updateGreetingAndDate();
    this.initWeather();
    this.showToast('Settings saved successfully!', 'success');
  }

  /**
   * Data Management: Export & Import
   */
  handleExportData() {
    const tasks = this.taskManager.userTasks;
    if (tasks.length === 0) {
      this.showToast('No user tasks to export.', 'warning');
      return;
    }
    const success = Storage.exportTasks(tasks);
    if (success) {
      this.showToast('Exported tasks to JSON backup file!', 'success');
    } else {
      this.showToast('Failed to export tasks.', 'error');
    }
  }

  handleImportData(file) {
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target.result;
      const result = Storage.importTasks(content, this.taskManager.userTasks, 'merge');

      if (result.success) {
        this.taskManager.userTasks = result.tasks;
        this.taskManager.notify();
        this.showToast(`Imported ${result.importedCount} tasks successfully!`, 'success');
      } else {
        this.showToast(`Import failed: ${result.error}`, 'error');
      }
    };
    reader.onerror = () => {
      this.showToast('Failed to read file.', 'error');
    };
    reader.readAsText(file);
  }

  /**
   * Toast Notifications Helper
   */
  showToast(message, type = 'info', duration = 3200) {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    const iconMap = {
      success: 'check-circle-2',
      error: 'alert-circle',
      warning: 'alert-triangle',
      info: 'info'
    };

    toast.innerHTML = `
      <div class="toast-icon"><i data-lucide="${iconMap[type] || 'info'}"></i></div>
      <div class="toast-message">${this.ui.escapeHtml(message)}</div>
      <button class="toast-close" aria-label="Close notification"><i data-lucide="x"></i></button>
      <div class="toast-progress"></div>
    `;

    container.appendChild(toast);
    this.refreshIcons(toast);

    const removeToast = () => {
      toast.classList.add('toast-fade-out');
      setTimeout(() => toast.remove(), 250);
    };

    toast.querySelector('.toast-close')?.addEventListener('click', removeToast);
    setTimeout(removeToast, duration);
  }

  /**
   * Bind DOM Events & Keyboard Shortcuts
   */
  bindEvents() {
    // 1. Navigation clicks
    document.querySelectorAll('.nav-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const view = item.getAttribute('data-view');
        if (view) this.navigateTo(view);
      });
    });

    // 2. Sidebar toggle buttons
    document.getElementById('btn-collapse-sidebar')?.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        this.toggleMobileSidebar(true);
      } else {
        this.toggleSidebarCollapse();
      }
    });

    document.querySelector('.brand-logo-wrap')?.addEventListener('click', () => {
      const sidebar = document.getElementById('app-sidebar');
      if (sidebar && sidebar.classList.contains('collapsed')) {
        this.toggleSidebarCollapse();
      }
    });

    document.getElementById('btn-mobile-menu')?.addEventListener('click', () => {
      this.toggleMobileSidebar();
    });

    document.getElementById('sidebar-mobile-overlay')?.addEventListener('click', () => {
      this.toggleMobileSidebar(true);
    });

    // 3. Theme Toggles (topbar & sidebar)
    document.getElementById('btn-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });
    document.getElementById('sidebar-theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // 4. Quick "+ New Task" buttons (all occurrences)
    document.querySelectorAll('.btn-open-new-task-modal').forEach(btn => {
      btn.addEventListener('click', () => this.openTaskModal());
    });

    // 5. Daily Inspiration Section Actions
    document.getElementById('btn-refresh-advice')?.addEventListener('click', () => {
      this.loadAdviceSlip();
    });
    document.getElementById('btn-copy-quote')?.addEventListener('click', () => {
      this.copyCurrentQuote();
    });

    // 6. Explore Sample Tasks section buttons
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-reload-sample-tasks') || e.target.closest('#btn-retry-sample-tasks')) {
        this.loadSampleTasks();
      }

      const importBtn = e.target.closest('.btn-import-sample');
      if (importBtn) {
        const sampleId = importBtn.getAttribute('data-sample-id');
        this.handleImportSampleTask(sampleId);
      }
    });

    // 7. Search Input (Real-time filtering)
    const searchInput = document.getElementById('topbar-search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.taskManager.searchQuery = e.target.value;
        this.render();
      });
    }

    const tasksPageSearch = document.getElementById('tasks-page-search');
    if (tasksPageSearch) {
      tasksPageSearch.addEventListener('input', (e) => {
        this.taskManager.searchQuery = e.target.value;
        this.render();
      });
    }

    // 8. Filters & Sorting Toolbar
    document.getElementById('filter-category')?.addEventListener('change', (e) => {
      this.taskManager.filterCategory = e.target.value;
      this.render();
    });

    document.getElementById('filter-priority')?.addEventListener('change', (e) => {
      this.taskManager.filterPriority = e.target.value;
      this.render();
    });

    document.getElementById('filter-status')?.addEventListener('change', (e) => {
      this.taskManager.filterStatus = e.target.value;
      this.render();
    });

    document.getElementById('sort-by-select')?.addEventListener('change', (e) => {
      this.taskManager.sortBy = e.target.value;
      this.render();
    });

    // Quick status filter pills
    document.querySelectorAll('.quick-filter-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        document.querySelectorAll('.quick-filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
        const status = pill.getAttribute('data-status') || 'All';
        this.taskManager.filterStatus = status;

        const select = document.getElementById('filter-status');
        if (select) select.value = status;

        this.render();
      });
    });

    // Grid vs Table Toggle
    document.getElementById('btn-view-grid')?.addEventListener('click', () => {
      this.ui.viewMode = 'grid';
      document.getElementById('btn-view-grid')?.classList.add('active');
      document.getElementById('btn-view-table')?.classList.remove('active');
      this.render();
    });

    document.getElementById('btn-view-table')?.addEventListener('click', () => {
      this.ui.viewMode = 'table';
      document.getElementById('btn-view-table')?.classList.add('active');
      document.getElementById('btn-view-grid')?.classList.remove('active');
      this.render();
    });

    // Clear completed tasks
    document.getElementById('btn-clear-completed')?.addEventListener('click', () => {
      if (confirm('Clear all completed tasks from your workspace?')) {
        const count = this.taskManager.clearCompletedTasks();
        if (count > 0) {
          this.showToast(`Cleared ${count} completed tasks!`, 'info');
        } else {
          this.showToast('No completed tasks to clear.', 'warning');
        }
      }
    });

    // 9. Delegated Change listener for Checkboxes and Selects
    document.addEventListener('change', (e) => {
      // Task completion checkbox
      const taskCb = e.target.closest('.task-checkbox');
      if (taskCb) {
        const taskId = taskCb.getAttribute('data-task-id');
        const updated = this.taskManager.toggleTaskComplete(taskId);
        if (updated && updated.status === 'Completed') {
          this.soundManager.playComplete();
          this.showToast('Task marked as completed! 🎉', 'success');
        } else {
          this.soundManager.playPop();
        }
        return;
      }

      // Subtask checkbox
      const subCb = e.target.closest('.subtask-checkbox');
      if (subCb) {
        const taskId = subCb.getAttribute('data-task-id');
        const subId = subCb.getAttribute('data-subtask-id');
        this.taskManager.toggleSubtask(taskId, subId);
        this.soundManager.playPop();
        return;
      }

      // Status select change inside card or table
      const statusSelect = e.target.closest('.status-select');
      if (statusSelect) {
        const taskId = statusSelect.getAttribute('data-task-id');
        const newStatus = statusSelect.value;
        this.taskManager.updateTask(taskId, { status: newStatus });
        if (newStatus === 'Completed') {
          this.soundManager.playComplete();
          this.showToast('Task completed! Great job! 🚀', 'success');
        }
      }
    });

    // 10. Delegated Task Card and Global Click Interactions
    document.addEventListener('click', (e) => {
      // Favorite star
      const favBtn = e.target.closest('.btn-favourite');
      if (favBtn) {
        const taskId = favBtn.getAttribute('data-task-id');
        this.taskManager.toggleTaskFavourite(taskId);
        return;
      }

      // More dropdown toggle
      const moreBtn = e.target.closest('.btn-more');
      if (moreBtn) {
        e.stopPropagation();
        const popover = moreBtn.nextElementSibling;
        document.querySelectorAll('.dropdown-popover.active').forEach(p => {
          if (p !== popover) p.classList.remove('active');
        });
        popover?.classList.toggle('active');
        return;
      }

      // Close dropdowns on outside click
      if (!e.target.closest('.task-dropdown-menu')) {
        document.querySelectorAll('.dropdown-popover.active').forEach(p => p.classList.remove('active'));
      }

      // Edit task button
      const editBtn = e.target.closest('.btn-edit-task');
      if (editBtn) {
        const taskId = editBtn.getAttribute('data-task-id');
        this.openTaskModal(taskId);
        return;
      }

      // Delete task button
      const deleteBtn = e.target.closest('.btn-delete-task');
      if (deleteBtn) {
        const taskId = deleteBtn.getAttribute('data-task-id');
        this.openDeleteConfirmModal(taskId);
        return;
      }

      // Notification item click
      const notifItem = e.target.closest('.notif-item');
      if (notifItem) {
        const taskId = notifItem.getAttribute('data-task-id');
        if (taskId) {
          this.navigateTo('my-tasks');
          const card = document.querySelector(`.task-card[data-task-id="${taskId}"]`);
          if (card) {
            card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            card.classList.add('pulse-highlight');
            setTimeout(() => card.classList.remove('pulse-highlight'), 1800);
          }
        }
        document.getElementById('notifications-popover')?.classList.remove('active');
        return;
      }

      // Empty state reset filters
      if (e.target.closest('#btn-reset-filters')) {
        this.taskManager.searchQuery = '';
        this.taskManager.filterCategory = 'All';
        this.taskManager.filterPriority = 'All';
        this.taskManager.filterStatus = 'All';
        this.taskManager.filterFavoriteOnly = false;

        const searchEl = document.getElementById('topbar-search-input');
        if (searchEl) searchEl.value = '';
        const catEl = document.getElementById('filter-category');
        if (catEl) catEl.value = 'All';
        const priEl = document.getElementById('filter-priority');
        if (priEl) priEl.value = 'All';
        const stEl = document.getElementById('filter-status');
        if (stEl) stEl.value = 'All';
        document.querySelectorAll('.quick-filter-pill').forEach(p => p.classList.remove('active'));
        document.querySelector('.quick-filter-pill[data-status="All"]')?.classList.add('active');

        this.render();
      }
    });

    // Profile Dropdown Menu in Topbar
    const profileTrigger = document.getElementById('topbar-avatar-wrap');
    const profileDropdown = document.getElementById('profile-dropdown-menu');
    if (profileTrigger && profileDropdown) {
      profileTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        profileDropdown.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#topbar-avatar-wrap')) {
          profileDropdown.classList.remove('active');
        }
      });
    }

    // Notifications Bell Toggle
    const notifBtn = document.getElementById('btn-notifications-toggle');
    const notifPopover = document.getElementById('notifications-popover');
    if (notifBtn && notifPopover) {
      notifBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        notifPopover.classList.toggle('active');
      });

      document.addEventListener('click', (e) => {
        if (!e.target.closest('#notifications-wrapper')) {
          notifPopover.classList.remove('active');
        }
      });
    }

    // Modal Subtasks input handling
    document.getElementById('btn-modal-add-subtask')?.addEventListener('click', () => {
      this.handleAddModalSubtask();
    });

    document.getElementById('modal-subtask-input')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.handleAddModalSubtask();
      }
    });

    // Modal Subtasks delegated toggle and remove
    document.getElementById('modal-subtasks-list')?.addEventListener('click', (e) => {
      const toggle = e.target.closest('.temp-subtask-toggle');
      if (toggle) {
        const index = parseInt(toggle.getAttribute('data-index'), 10);
        if (this.tempModalSubtasks[index]) {
          this.tempModalSubtasks[index].completed = toggle.checked;
          this.renderModalSubtasks();
        }
        return;
      }

      const removeBtn = e.target.closest('.btn-remove-subtask');
      if (removeBtn) {
        const index = parseInt(removeBtn.getAttribute('data-index'), 10);
        this.tempModalSubtasks.splice(index, 1);
        this.renderModalSubtasks();
        return;
      }
    });

    // Modal Form Submit
    document.getElementById('task-form')?.addEventListener('submit', (e) => {
      this.handleSaveTaskForm(e);
    });

    // Close Modal buttons
    document.querySelectorAll('.btn-close-modal').forEach(btn => {
      btn.addEventListener('click', () => {
        this.closeTaskModal();
        this.closeDeleteConfirmModal();
      });
    });

    // Modal backdrop clicks
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) {
          this.closeTaskModal();
          this.closeDeleteConfirmModal();
        }
      });
    });

    // Delete confirm button
    document.getElementById('btn-confirm-delete')?.addEventListener('click', () => {
      this.handleConfirmDelete();
    });

    // Settings view events
    document.getElementById('btn-save-settings')?.addEventListener('click', () => {
      this.saveSettingsForm();
    });

    document.getElementById('btn-export-json')?.addEventListener('click', () => {
      this.handleExportData();
    });

    const importInput = document.getElementById('settings-import-file');
    document.getElementById('btn-trigger-import')?.addEventListener('click', () => {
      importInput?.click();
    });

    importInput?.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleImportData(e.target.files[0]);
        e.target.value = '';
      }
    });

    document.getElementById('btn-reset-all-data')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all user tasks and settings to defaults? This cannot be undone.')) {
        Storage.clearAll();
        this.taskManager.userTasks = Storage.getTasks();
        this.taskManager.notify();
        this.showToast('Workspace reset to defaults.', 'info');
      }
    });

    // Keyboard Shortcuts: '/' or 'Ctrl+K' for search, 'Escape' for modals, 'N' for new task
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeTaskModal();
        this.closeDeleteConfirmModal();
        document.getElementById('notifications-popover')?.classList.remove('active');
        document.getElementById('profile-dropdown-menu')?.classList.remove('active');
      }

      const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
      if (!isInput && (e.key === '/' || (e.ctrlKey && e.key.toLowerCase() === 'k'))) {
        e.preventDefault();
        searchInput?.focus();
        searchInput?.select();
      }

      if (!isInput && e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        this.openTaskModal();
      }
    });
  }
}

// Instantiate and start app on DOM content loaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new App();
  app.init();
  window.taskFlowApp = app;
});
