/**
 * TaskFlow - Storage Module
 * Handles localStorage persistence, data schema validation, export & import.
 */

const STORAGE_KEYS = {
  TASKS: 'taskflow_user_tasks',
  THEME: 'taskflow_theme',
  SIDEBAR: 'taskflow_sidebar_state',
  PROFILE: 'taskflow_profile',
  SETTINGS: 'taskflow_settings',
  AUTH: 'taskflow_auth'
};

// Default seed tasks for first-time visitors
const DEFAULT_SEED_TASKS = [
  {
    id: 'seed-task-1',
    title: 'Prepare GDG BPPIMT Tech Induction Deck',
    description: 'Finalize presentation slides covering Google Cloud, Web Dev roadmap, and upcoming GDG hackathons.',
    priority: 'High',
    category: 'GDG',
    dueDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
    status: 'In Progress',
    isFavourite: true,
    createdAt: new Date().toISOString(),
    isSample: false,
    subtasks: [
      { id: 'sub-1-1', title: 'Collect speaker bios and track topics', completed: true },
      { id: 'sub-1-2', title: 'Review slide designs and GDG branding guidelines', completed: true },
      { id: 'sub-1-3', title: 'Rehearse live coding session demo', completed: false }
    ]
  },
  {
    id: 'seed-task-2',
    title: 'Complete Computer Networks Lab Assignment',
    description: 'Implement socket programming client-server communication in C/Python with error handling and packet tracing.',
    priority: 'Medium',
    category: 'Academics',
    dueDate: new Date(Date.now() + 2 * 86400000).toISOString().split('T')[0], // 2 days from now
    status: 'Pending',
    isFavourite: false,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    isSample: false,
    subtasks: [
      { id: 'sub-2-1', title: 'Write socket client connection code', completed: false },
      { id: 'sub-2-2', title: 'Document Wireshark test run output', completed: false }
    ]
  },
  {
    id: 'seed-task-3',
    title: 'Review PRs for TaskFlow Web Application',
    description: 'Verify responsive CSS grid, theme toggle, and Advice Slip API error states for GDG submission.',
    priority: 'High',
    category: 'GDG',
    dueDate: new Date().toISOString().split('T')[0], // Today
    status: 'Completed',
    isFavourite: true,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    isSample: false,
    subtasks: [
      { id: 'sub-3-1', title: 'Check mobile drawer accessibility', completed: true },
      { id: 'sub-3-2', title: 'Test offline advice fallback', completed: true },
      { id: 'sub-3-3', title: 'Verify DummyJSON sample import', completed: true }
    ]
  },
  {
    id: 'seed-task-4',
    title: 'Set up Morning Fitness & Coding Routine',
    description: 'Dedicate 45 minutes to DSA problem solving and 30 minutes to running every morning.',
    priority: 'Low',
    category: 'Personal',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString().split('T')[0],
    status: 'Pending',
    isFavourite: false,
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    isSample: false,
    subtasks: [
      { id: 'sub-4-1', title: 'Solve 2 LeetCode medium questions', completed: false }
    ]
  },
  {
    id: 'seed-task-5',
    title: 'Organize GDG Cloud Study Jam Workshop',
    description: 'Coordinate venue, projector setup, and RSVP approvals for 100+ BPPIMT student developers.',
    priority: 'High',
    category: 'GDG',
    dueDate: new Date().toISOString().split('T')[0], // Today
    status: 'In Progress',
    isFavourite: true,
    createdAt: new Date(Date.now() - 14400000).toISOString(),
    isSample: false,
    subtasks: [
      { id: 'sub-5-1', title: 'Send RSVP confirmation email', completed: true },
      { id: 'sub-5-2', title: 'Prepare lab badges and access passes', completed: false }
    ]
  }
];

const DEFAULT_PROFILE = {
  name: 'Uttam Kumar Roy',
  role: 'GDG BPPIMT Tech Team Lead',
  email: 'uttam.gdg@gmail.com',
  avatar: '👨‍💻'
};

const DEFAULT_SETTINGS = {
  soundEffects: true,
  compactView: false,
  showCelebration: true,
  weatherCity: 'Kolkata',
  weatherApiKey: ''
};

export const Storage = {
  /**
   * Get all user tasks from localStorage.
   * If first time, seeds default tasks so the dashboard is immediately interactive.
   */
  getTasks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TASKS);
      if (!data) {
        this.saveTasks(DEFAULT_SEED_TASKS);
        return DEFAULT_SEED_TASKS;
      }
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.filter(this.isValidTask);
      }
      return [];
    } catch (err) {
      console.error('Storage.getTasks error:', err);
      return [];
    }
  },

  /**
   * Persist user tasks to localStorage
   */
  saveTasks(tasks) {
    try {
      if (!Array.isArray(tasks)) return false;
      // Filter out any transient external sample tasks
      const userTasksOnly = tasks.filter(t => !t.isSample && !t.isDemo);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(userTasksOnly));
      return true;
    } catch (err) {
      console.error('Storage.saveTasks error:', err);
      return false;
    }
  },

  /**
   * Validate a single task object's structure
   */
  isValidTask(task) {
    return (
      task &&
      typeof task === 'object' &&
      typeof task.id === 'string' &&
      typeof task.title === 'string' &&
      task.title.trim().length > 0 &&
      ['High', 'Medium', 'Low'].includes(task.priority) &&
      ['Pending', 'In Progress', 'Completed'].includes(task.status)
    );
  },

  /**
   * Theme preference
   */
  getTheme() {
    try {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
      // Default to clean, modern, high-contrast light mode
      return 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (err) {
      console.error('Storage.setTheme error:', err);
    }
  },

  /**
   * Sidebar state ('expanded' or 'collapsed')
   */
  getSidebarState() {
    try {
      return localStorage.getItem(STORAGE_KEYS.SIDEBAR) || 'expanded';
    } catch {
      return 'expanded';
    }
  },

  setSidebarState(state) {
    try {
      localStorage.setItem(STORAGE_KEYS.SIDEBAR, state);
    } catch (err) {
      console.error('Storage.setSidebarState error:', err);
    }
  },

  /**
   * User profile
   */
  getProfile() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROFILE);
      return data ? { ...DEFAULT_PROFILE, ...JSON.parse(data) } : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  },

  saveProfile(profile) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
      return true;
    } catch (err) {
      console.error('Storage.saveProfile error:', err);
      return false;
    }
  },

  /**
   * User Authentication & Session
   */
  getAuth() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.AUTH) || sessionStorage.getItem(STORAGE_KEYS.AUTH);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch {
      return null;
    }
  },

  isAuthenticated() {
    const auth = this.getAuth();
    return !!(auth && auth.isAuthenticated);
  },

  setAuth(user, remember = true) {
    try {
      const authData = {
        isAuthenticated: true,
        user: {
          name: user.name || DEFAULT_PROFILE.name,
          email: user.email || DEFAULT_PROFILE.email,
          role: user.role || DEFAULT_PROFILE.role,
          avatar: user.avatar || DEFAULT_PROFILE.avatar
        },
        remember: !!remember,
        loginTime: new Date().toISOString()
      };

      const payload = JSON.stringify(authData);
      if (remember) {
        localStorage.setItem(STORAGE_KEYS.AUTH, payload);
        sessionStorage.removeItem(STORAGE_KEYS.AUTH);
      } else {
        sessionStorage.setItem(STORAGE_KEYS.AUTH, payload);
        localStorage.removeItem(STORAGE_KEYS.AUTH);
      }

      // Sync active profile as well
      this.saveProfile(authData.user);
      return authData;
    } catch (err) {
      console.error('Storage.setAuth error:', err);
      return null;
    }
  },

  clearAuth() {
    try {
      localStorage.removeItem(STORAGE_KEYS.AUTH);
      sessionStorage.removeItem(STORAGE_KEYS.AUTH);
      return true;
    } catch (err) {
      console.error('Storage.clearAuth error:', err);
      return false;
    }
  },

  /**
   * Settings
   */
  getSettings() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  saveSettings(settings) {
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
      return true;
    } catch (err) {
      console.error('Storage.saveSettings error:', err);
      return false;
    }
  },

  /**
   * Export all user tasks to a formatted JSON file download
   */
  exportTasks(tasks) {
    try {
      const exportData = {
        app: 'TaskFlow',
        version: '1.0.0',
        exportedAt: new Date().toISOString(),
        tasksCount: tasks.length,
        tasks: tasks.filter(t => !t.isSample && !t.isDemo)
      };

      const jsonStr = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const dateStr = new Date().toISOString().split('T')[0];
      const link = document.createElement('a');
      link.href = url;
      link.download = `taskflow-tasks-${dateStr}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      return true;
    } catch (err) {
      console.error('Export failed:', err);
      return false;
    }
  },

  /**
   * Import tasks from JSON string
   * Returns: { success: boolean, importedCount: number, error?: string, tasks?: Array }
   */
  importTasks(jsonString, currentTasks = [], mode = 'merge') {
    try {
      const parsed = JSON.parse(jsonString);
      let incomingTasks = [];

      if (Array.isArray(parsed)) {
        incomingTasks = parsed;
      } else if (parsed && Array.isArray(parsed.tasks)) {
        incomingTasks = parsed.tasks;
      } else {
        return { success: false, error: 'Invalid JSON format: Must contain an array of tasks.' };
      }

      // Validate each task and normalize
      const validTasks = [];
      for (const t of incomingTasks) {
        if (!t.title || typeof t.title !== 'string') continue;
        const normalized = {
          id: t.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 7)}`,
          title: t.title.trim(),
          description: t.description || '',
          priority: ['High', 'Medium', 'Low'].includes(t.priority) ? t.priority : 'Medium',
          category: ['GDG', 'Academics', 'Personal'].includes(t.category) ? t.category : 'GDG',
          dueDate: t.dueDate || new Date().toISOString().split('T')[0],
          status: ['Pending', 'In Progress', 'Completed'].includes(t.status) ? t.status : 'Pending',
          isFavourite: Boolean(t.isFavourite),
          createdAt: t.createdAt || new Date().toISOString(),
          isSample: false,
          subtasks: Array.isArray(t.subtasks)
            ? t.subtasks.map((s, idx) => ({
                id: s.id || `sub_${Date.now()}_${idx}`,
                title: s.title || 'Subtask',
                completed: Boolean(s.completed)
              }))
            : []
        };
        validTasks.push(normalized);
      }

      if (validTasks.length === 0) {
        return { success: false, error: 'No valid tasks found in the file.' };
      }

      let combinedTasks;
      if (mode === 'replace') {
        combinedTasks = validTasks;
      } else {
        // Merge without duplicate IDs
        const existingIds = new Set(currentTasks.map(t => t.id));
        const newTasks = validTasks.filter(t => !existingIds.has(t.id));
        // For duplicates, update existing
        const updatedCurrent = currentTasks.map(t => {
          const match = validTasks.find(vt => vt.id === t.id);
          return match || t;
        });
        combinedTasks = [...updatedCurrent, ...newTasks];
      }

      this.saveTasks(combinedTasks);
      return {
        success: true,
        importedCount: validTasks.length,
        tasks: combinedTasks
      };
    } catch (err) {
      console.error('Import parse error:', err);
      return { success: false, error: 'Invalid JSON syntax. Please check your file.' };
    }
  },

  /**
   * Reset all data to defaults
   */
  clearAll() {
    try {
      localStorage.removeItem(STORAGE_KEYS.TASKS);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.THEME);
      return true;
    } catch {
      return false;
    }
  }
};
