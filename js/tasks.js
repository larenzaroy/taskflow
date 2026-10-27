/**
 * TaskFlow - Task Management & State Module
 * Implements CRUD operations, subtasks, filtering, sorting, and metrics calculations.
 */

import { Storage } from './storage.js';

export class TaskManager {
  constructor() {
    this.userTasks = Storage.getTasks();
    this.sampleTasks = []; // Separate from userTasks as required by Section 9

    // Active filters
    this.currentView = 'dashboard';
    this.searchQuery = '';
    this.filterCategory = 'All';
    this.filterPriority = 'All';
    this.filterStatus = 'All';
    this.filterDate = 'All';
    this.filterFavoriteOnly = false;
    this.sortBy = 'dueDate-asc';

    // Subscribers for state changes
    this.listeners = [];
  }

  /**
   * Register a listener callback to run on state updates
   */
  subscribe(callback) {
    this.listeners.push(callback);
  }

  notify() {
    this.listeners.forEach(cb => {
      try {
        cb(this);
      } catch (err) {
        console.error('Task listener error:', err);
      }
    });
  }

  /**
   * Returns all active user tasks
   */
  getAllTasks() {
    return [...this.userTasks];
  }

  /**
   * Find a task by ID
   */
  getTaskById(id) {
    const userTask = this.userTasks.find(t => t.id === id);
    if (userTask) return userTask;
    return this.sampleTasks.find(t => t.id === id) || null;
  }

  /**
   * Create a new task (CRUD: Create)
   */
  createTask(data) {
    if (!data.title || !data.title.trim()) {
      throw new Error('Task title is required');
    }

    const newTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: data.title.trim(),
      description: data.description ? data.description.trim() : '',
      priority: ['High', 'Medium', 'Low'].includes(data.priority) ? data.priority : 'Medium',
      category: ['GDG', 'Academics', 'Personal'].includes(data.category) ? data.category : 'GDG',
      dueDate: data.dueDate || new Date().toISOString().split('T')[0],
      status: ['Pending', 'In Progress', 'Completed'].includes(data.status) ? data.status : 'Pending',
      isFavourite: Boolean(data.isFavourite),
      createdAt: new Date().toISOString(),
      isSample: false,
      subtasks: Array.isArray(data.subtasks)
        ? data.subtasks.map((s, idx) => ({
            id: s.id || `sub_${Date.now()}_${idx}`,
            title: s.title.trim(),
            completed: Boolean(s.completed)
          })).filter(s => s.title.length > 0)
        : []
    };

    this.userTasks.unshift(newTask);
    Storage.saveTasks(this.userTasks);
    this.notify();
    return newTask;
  }

  /**
   * Update an existing task (CRUD: Update)
   */
  updateTask(id, fields) {
    const isUserTask = this.userTasks.some(t => t.id === id);

    if (isUserTask) {
      this.userTasks = this.userTasks.map(task => {
        if (task.id === id) {
          const updated = { ...task, ...fields };
          if (fields.title) updated.title = fields.title.trim();
          return updated;
        }
        return task;
      });
      Storage.saveTasks(this.userTasks);
    } else {
      // In-memory sample task update
      this.sampleTasks = this.sampleTasks.map(task => {
        if (task.id === id) {
          return { ...task, ...fields };
        }
        return task;
      });
    }

    this.notify();
    return this.getTaskById(id);
  }

  /**
   * Delete a task by ID (CRUD: Delete)
   */
  deleteTask(id) {
    const isUser = this.userTasks.some(t => t.id === id);
    if (isUser) {
      this.userTasks = this.userTasks.filter(t => t.id !== id);
      Storage.saveTasks(this.userTasks);
    } else {
      this.sampleTasks = this.sampleTasks.filter(t => t.id !== id);
    }
    this.notify();
    return true;
  }

  /**
   * Toggle task completion status
   */
  toggleTaskComplete(id) {
    const task = this.getTaskById(id);
    if (!task) return null;

    const newStatus = task.status === 'Completed' ? 'Pending' : 'Completed';
    return this.updateTask(id, { status: newStatus });
  }

  /**
   * Toggle favourite / starred flag
   */
  toggleTaskFavourite(id) {
    const task = this.getTaskById(id);
    if (!task) return null;

    return this.updateTask(id, { isFavourite: !task.isFavourite });
  }

  /**
   * Clear all completed tasks with confirmation
   */
  clearCompletedTasks() {
    const initialUserCount = this.userTasks.length;
    this.userTasks = this.userTasks.filter(t => t.status !== 'Completed');
    Storage.saveTasks(this.userTasks);
    this.notify();
    return initialUserCount - this.userTasks.length;
  }

  /**
   * Import a sample task from DummyJSON into user tasks list
   * (Fulfills Section 9: Import a sample task into personal task list without overwriting)
   */
  importSampleTask(sampleId) {
    const sample = this.sampleTasks.find(t => t.id === sampleId);
    if (!sample) return null;

    // Create a new permanent user task from the sample
    const userTask = {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      title: sample.title,
      description: `Imported from DummyJSON Todos API (ID: #${sample.dummyId || ''}). ${sample.description || ''}`,
      priority: sample.priority || 'Medium',
      category: sample.category || 'GDG',
      dueDate: sample.dueDate || new Date().toISOString().split('T')[0],
      status: sample.status || 'Pending',
      isFavourite: false,
      createdAt: new Date().toISOString(),
      isSample: false,
      subtasks: Array.isArray(sample.subtasks)
        ? sample.subtasks.map((s, idx) => ({
            id: `sub_${Date.now()}_${idx}`,
            title: s.title,
            completed: Boolean(s.completed)
          }))
        : []
    };

    // Remove from sample tasks
    this.sampleTasks = this.sampleTasks.filter(t => t.id !== sampleId);

    // Add to user tasks
    this.userTasks.unshift(userTask);
    Storage.saveTasks(this.userTasks);
    this.notify();
    return userTask;
  }

  /**
   * Set sample tasks fetched from DummyJSON API
   */
  setSampleTasks(sampleTodos) {
    this.sampleTasks = sampleTodos;
    this.notify();
  }

  /**
   * Clear sample tasks
   */
  clearSampleTasks() {
    this.sampleTasks = [];
    this.notify();
  }

  /**
   * Subtask operations
   */
  addSubtask(taskId, title) {
    const task = this.getTaskById(taskId);
    if (!task || !title || !title.trim()) return null;

    const subtasks = Array.isArray(task.subtasks) ? [...task.subtasks] : [];
    subtasks.push({
      id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      title: title.trim(),
      completed: false
    });

    return this.updateTask(taskId, { subtasks });
  }

  toggleSubtask(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task || !Array.isArray(task.subtasks)) return null;

    const subtasks = task.subtasks.map(sub => {
      if (sub.id === subtaskId) {
        return { ...sub, completed: !sub.completed };
      }
      return sub;
    });

    return this.updateTask(taskId, { subtasks });
  }

  deleteSubtask(taskId, subtaskId) {
    const task = this.getTaskById(taskId);
    if (!task || !Array.isArray(task.subtasks)) return null;

    const subtasks = task.subtasks.filter(sub => sub.id !== subtaskId);
    return this.updateTask(taskId, { subtasks });
  }

  /**
   * Date comparison helpers
   */
  static isToday(dateStr) {
    if (!dateStr) return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr.startsWith(today);
  }

  static isOverdue(dateStr, status) {
    if (!dateStr || status === 'Completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr < today;
  }

  static isDueWithin24Hours(dateStr, status) {
    if (!dateStr || status === 'Completed') return false;
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    return dateStr === todayStr || dateStr === tomorrowStr;
  }

  static isUpcoming(dateStr, status) {
    if (!dateStr || status === 'Completed') return false;
    const today = new Date().toISOString().split('T')[0];
    return dateStr > today;
  }

  /**
   * Priority numeric weight for sorting
   */
  static getPriorityWeight(priority) {
    switch (priority) {
      case 'High': return 3;
      case 'Medium': return 2;
      case 'Low': return 1;
      default: return 0;
    }
  }

  /**
   * Filter and sort the tasks list according to active navigation view, search, and filters
   */
  getFilteredTasks(viewOverride = null) {
    const view = viewOverride || this.currentView;
    const all = this.getAllTasks();

    return all
      .filter(task => {
        // 1. Navigation View constraint
        switch (view) {
          case 'dashboard':
          case 'my-tasks':
          case 'all':
            break; // Show all
          case 'today': {
            const isToday = TaskManager.isToday(task.dueDate);
            if (!isToday) return false;
            break;
          }
          case 'upcoming': {
            const isUp = TaskManager.isUpcoming(task.dueDate, task.status);
            if (!isUp) return false;
            break;
          }
          case 'favorites':
          case 'important':
            if (!task.isFavourite) return false;
            break;
          case 'in-progress':
            if (task.status !== 'In Progress') return false;
            break;
          case 'completed':
            if (task.status !== 'Completed') return false;
            break;
          case 'pending':
            if (task.status !== 'Pending') return false;
            break;
          case 'gdg':
            if (task.category !== 'GDG') return false;
            break;
          case 'academics':
            if (task.category !== 'Academics') return false;
            break;
          case 'personal':
            if (task.category !== 'Personal') return false;
            break;
          case 'calendar':
          case 'settings':
            break;
          default:
            break;
        }

        // 2. Search query (title or description)
        if (this.searchQuery && this.searchQuery.trim()) {
          const q = this.searchQuery.toLowerCase().trim();
          const titleMatch = task.title.toLowerCase().includes(q);
          const descMatch = (task.description || '').toLowerCase().includes(q);
          const categoryMatch = (task.category || '').toLowerCase().includes(q);
          if (!titleMatch && !descMatch && !categoryMatch) return false;
        }

        // 3. Category Filter
        if (this.filterCategory !== 'All' && task.category !== this.filterCategory) {
          return false;
        }

        // 4. Priority Filter
        if (this.filterPriority !== 'All' && task.priority !== this.filterPriority) {
          return false;
        }

        // 5. Status Filter (when not already restricted by specific status view)
        if (['dashboard', 'my-tasks', 'all', 'today', 'upcoming', 'favorites'].includes(view)) {
          if (this.filterStatus !== 'All' && task.status !== this.filterStatus) {
            return false;
          }
        }

        // 6. Favorite Filter toggle
        if (this.filterFavoriteOnly && !task.isFavourite) {
          return false;
        }

        // 7. Due Date Filter
        if (this.filterDate !== 'All') {
          if (this.filterDate === 'Today' && !TaskManager.isToday(task.dueDate)) return false;
          if (this.filterDate === 'Upcoming' && !TaskManager.isUpcoming(task.dueDate, task.status)) return false;
          if (this.filterDate === 'Overdue' && !TaskManager.isOverdue(task.dueDate, task.status)) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Apply active sorting
        switch (this.sortBy) {
          case 'dueDate-asc': {
            const dateA = a.dueDate || '9999-99-99';
            const dateB = b.dueDate || '9999-99-99';
            return dateA.localeCompare(dateB);
          }
          case 'dueDate-desc': {
            const dateA = a.dueDate || '0000-00-00';
            const dateB = b.dueDate || '0000-00-00';
            return dateB.localeCompare(dateA);
          }
          case 'priority-desc': {
            return TaskManager.getPriorityWeight(b.priority) - TaskManager.getPriorityWeight(a.priority);
          }
          case 'priority-asc': {
            return TaskManager.getPriorityWeight(a.priority) - TaskManager.getPriorityWeight(b.priority);
          }
          case 'createdAt-desc': {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
          }
          case 'title-asc': {
            return a.title.localeCompare(b.title);
          }
          case 'title-desc': {
            return b.title.localeCompare(a.title);
          }
          default:
            return 0;
        }
      });
  }

  /**
   * Calculate dynamic counts for sidebar navigation badges
   */
  getBadges() {
    const all = this.userTasks;
    const todayStr = new Date().toISOString().split('T')[0];

    return {
      myTasks: all.length,
      today: all.filter(t => t.dueDate === todayStr && t.status !== 'Completed').length,
      upcoming: all.filter(t => t.dueDate > todayStr && t.status !== 'Completed').length,
      favorites: all.filter(t => t.isFavourite).length,
      inProgress: all.filter(t => t.status === 'In Progress').length,
      completed: all.filter(t => t.status === 'Completed').length,
      gdg: all.filter(t => t.category === 'GDG').length,
      academics: all.filter(t => t.category === 'Academics').length,
      personal: all.filter(t => t.category === 'Personal').length
    };
  }

  /**
   * Calculate dashboard statistics and summary metrics
   * Fulfills Section 5:
   * 1. Total Tasks
   * 2. Completed
   * 3. Pending
   * 4. Completion Rate (%)
   * + animated completion progress bar and compact visualization of Pending, In Progress, and Completed
   */
  getStats() {
    const all = this.userTasks;
    const total = all.length;
    const pending = all.filter(t => t.status === 'Pending').length;
    const inProgress = all.filter(t => t.status === 'In Progress').length;
    const completed = all.filter(t => t.status === 'Completed').length;
    const favourite = all.filter(t => t.isFavourite).length;
    const overdue = all.filter(t => TaskManager.isOverdue(t.dueDate, t.status)).length;
    const dueToday = all.filter(t => TaskManager.isToday(t.dueDate) && t.status !== 'Completed').length;

    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    const pendingRate = total > 0 ? Math.round((pending / total) * 100) : 0;
    const inProgressRate = total > 0 ? Math.round((inProgress / total) * 100) : 0;

    // Category distribution
    const categories = {
      GDG: { total: 0, completed: 0 },
      Academics: { total: 0, completed: 0 },
      Personal: { total: 0, completed: 0 }
    };

    all.forEach(t => {
      const cat = categories[t.category] ? t.category : 'Personal';
      categories[cat].total += 1;
      if (t.status === 'Completed') {
        categories[cat].completed += 1;
      }
    });

    // Priority distribution
    const priorities = {
      High: all.filter(t => t.priority === 'High').length,
      Medium: all.filter(t => t.priority === 'Medium').length,
      Low: all.filter(t => t.priority === 'Low').length
    };

    return {
      total,
      pending,
      inProgress,
      completed,
      favourite,
      overdue,
      dueToday,
      completionRate,
      pendingRate,
      inProgressRate,
      categories,
      priorities,
      userTasksCount: this.userTasks.length,
      sampleTasksCount: this.sampleTasks.length
    };
  }

  /**
   * Get urgent deadlines (overdue, due today, due tomorrow)
   */
  getUpcomingDeadlines(limit = 5) {
    const all = this.userTasks.filter(t => t.status !== 'Completed');
    return all
      .sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'))
      .slice(0, limit);
  }
}
