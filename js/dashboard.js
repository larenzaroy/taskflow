/**
 * TaskFlow - Dashboard UI & Rendering Engine
 * Responsible for rendering task cards, summary metrics, statistics view,
 * daily inspiration showcase, sample tasks explore section, and interactive micro-interactions.
 */

import { TaskManager } from './tasks.js';

export class DashboardUI {
  constructor(taskManager, appHandlers) {
    this.taskManager = taskManager;
    this.handlers = appHandlers;
    this.viewMode = 'grid'; // 'grid' | 'table'
  }

  /**
   * Animate number counting for summary metric cards
   */
  animateCounter(element, targetValue, duration = 500, suffix = '') {
    if (!element) return;
    const startValue = parseInt(element.textContent, 10) || 0;
    if (startValue === targetValue) {
      element.textContent = `${targetValue}${suffix}`;
      return;
    }

    const startTime = performance.now();
    const update = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // easeOutQuad
      const easeProgress = 1 - (1 - progress) * (1 - progress);
      const current = Math.round(startValue + (targetValue - startValue) * easeProgress);
      element.textContent = `${current}${suffix}`;

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        element.textContent = `${targetValue}${suffix}`;
      }
    };
    requestAnimationFrame(update);
  }

  /**
   * Render dynamic count badges on sidebar navigation items
   */
  renderSidebarBadges() {
    const badges = this.taskManager.getBadges();

    const badgeMap = {
      'badge-nav-all': badges.myTasks,
      'badge-nav-today': badges.today,
      'badge-nav-upcoming': badges.upcoming,
      'badge-nav-favorites': badges.favorites,
      'badge-nav-progress': badges.inProgress,
      'badge-nav-completed': badges.completed,
      'badge-nav-gdg': badges.gdg,
      'badge-nav-academics': badges.academics,
      'badge-nav-personal': badges.personal
    };

    Object.entries(badgeMap).forEach(([id, count]) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = count;
        if (count > 0) {
          el.style.display = 'inline-flex';
        } else {
          el.style.display = 'none';
        }
      }
    });
  }

  /**
   * Render top 4 summary statistic cards & animated completion progress bar (Section 5)
   * 1. Total Tasks
   * 2. Completed
   * 3. Pending
   * 4. Completion Rate (%)
   */
  renderSummaryCards() {
    const stats = this.taskManager.getStats();

    // Elements
    const totalEl = document.getElementById('stat-total-tasks');
    const completedEl = document.getElementById('stat-completed-tasks');
    const pendingEl = document.getElementById('stat-pending-tasks');
    const rateEl = document.getElementById('stat-completion-rate');

    const progressFillEl = document.getElementById('dashboard-progress-fill');
    const progressPercentEl = document.getElementById('dashboard-progress-percent');
    const progressTextEl = document.getElementById('dashboard-progress-text');

    // 4 Summary Metric Cards
    if (totalEl) this.animateCounter(totalEl, stats.total);
    if (completedEl) this.animateCounter(completedEl, stats.completed);
    if (pendingEl) this.animateCounter(pendingEl, stats.pending);
    if (rateEl) this.animateCounter(rateEl, stats.completionRate, 500, '%');

    // Animated Completion Progress Bar
    if (progressFillEl) {
      progressFillEl.style.width = `${stats.completionRate}%`;
    }
    if (progressPercentEl) {
      progressPercentEl.textContent = `${stats.completionRate}%`;
    }
    if (progressTextEl) {
      progressTextEl.textContent = `${stats.completed} of ${stats.total} tasks completed`;
    }

    // Compact Distribution Breakdown Bar (Pending, In Progress, Completed)
    this.renderDistributionBreakdown(stats);

    // Update Notifications Badge
    this.renderNotificationBadge(stats);

    // Update Sidebar Navigation Badges
    this.renderSidebarBadges();
  }

  /**
   * Render compact visualization of the distribution of Pending, In Progress, and Completed tasks
   */
  renderDistributionBreakdown(stats) {
    const segPending = document.getElementById('dist-seg-pending');
    const segProgress = document.getElementById('dist-seg-progress');
    const segCompleted = document.getElementById('dist-seg-completed');

    const lblPending = document.getElementById('dist-lbl-pending');
    const lblProgress = document.getElementById('dist-lbl-progress');
    const lblCompleted = document.getElementById('dist-lbl-completed');

    if (stats.total === 0) {
      if (segPending) segPending.style.width = '0%';
      if (segProgress) segProgress.style.width = '0%';
      if (segCompleted) segCompleted.style.width = '0%';
      if (lblPending) lblPending.textContent = 'Pending: 0 (0%)';
      if (lblProgress) lblProgress.textContent = 'In Progress: 0 (0%)';
      if (lblCompleted) lblCompleted.textContent = 'Completed: 0 (0%)';
      return;
    }

    const pPct = Math.round((stats.pending / stats.total) * 100);
    const ipPct = Math.round((stats.inProgress / stats.total) * 100);
    const cPct = Math.max(0, 100 - pPct - ipPct); // Ensure sum is 100%

    if (segPending) {
      segPending.style.width = `${pPct}%`;
      segPending.title = `Pending: ${stats.pending} (${pPct}%)`;
    }
    if (segProgress) {
      segProgress.style.width = `${ipPct}%`;
      segProgress.title = `In Progress: ${stats.inProgress} (${ipPct}%)`;
    }
    if (segCompleted) {
      segCompleted.style.width = `${cPct}%`;
      segCompleted.title = `Completed: ${stats.completed} (${cPct}%)`;
    }

    if (lblPending) lblPending.textContent = `Pending: ${stats.pending} (${pPct}%)`;
    if (lblProgress) lblProgress.textContent = `In Progress: ${stats.inProgress} (${ipPct}%)`;
    if (lblCompleted) lblCompleted.textContent = `Completed: ${stats.completed} (${cPct}%)`;
  }

  /**
   * Render notifications dropdown content and count badge
   */
  renderNotificationBadge(stats) {
    const badgeEl = document.getElementById('notifications-badge');
    const listEl = document.getElementById('notifications-list');
    const allTasks = this.taskManager.getAllTasks();

    const overdueTasks = allTasks.filter(t => TaskManager.isOverdue(t.dueDate, t.status));
    const upcomingTasks = allTasks.filter(t => TaskManager.isDueWithin24Hours(t.dueDate, t.status));

    const totalAlerts = overdueTasks.length + upcomingTasks.length;

    if (badgeEl) {
      if (totalAlerts > 0) {
        badgeEl.textContent = totalAlerts > 9 ? '9+' : totalAlerts;
        badgeEl.style.display = 'flex';
      } else {
        badgeEl.style.display = 'none';
      }
    }

    if (listEl) {
      if (totalAlerts === 0) {
        listEl.innerHTML = `
          <div class="notif-empty">
            <i data-lucide="check-circle-2"></i>
            <p>You're all caught up! No urgent deadlines.</p>
          </div>
        `;
      } else {
        let itemsHtml = '';
        overdueTasks.forEach(t => {
          itemsHtml += `
            <div class="notif-item overdue" data-task-id="${t.id}">
              <div class="notif-icon"><i data-lucide="alert-triangle"></i></div>
              <div class="notif-details">
                <span class="notif-title">${this.escapeHtml(t.title)}</span>
                <span class="notif-desc">Overdue — was due ${t.dueDate}</span>
              </div>
            </div>
          `;
        });

        upcomingTasks.forEach(t => {
          const isToday = t.dueDate === new Date().toISOString().split('T')[0];
          itemsHtml += `
            <div class="notif-item upcoming" data-task-id="${t.id}">
              <div class="notif-icon"><i data-lucide="clock"></i></div>
              <div class="notif-details">
                <span class="notif-title">${this.escapeHtml(t.title)}</span>
                <span class="notif-desc">Due soon — ${isToday ? 'Today' : 'Tomorrow'}</span>
              </div>
            </div>
          `;
        });

        listEl.innerHTML = itemsHtml;
      }

      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ root: listEl });
      }
    }
  }

  /**
   * Render the upcoming deadlines widget on the dashboard
   */
  renderUpcomingDeadlinesWidget() {
    const container = document.getElementById('upcoming-deadlines-container');
    if (!container) return;

    const upcoming = this.taskManager.getUpcomingDeadlines(4);

    if (upcoming.length === 0) {
      container.innerHTML = `
        <div class="empty-mini-state">
          <i data-lucide="check-check"></i>
          <p>No pressing deadlines. Great job staying ahead!</p>
        </div>
      `;
    } else {
      container.innerHTML = upcoming.map(task => {
        const isOverdue = TaskManager.isOverdue(task.dueDate, task.status);
        const isToday = TaskManager.isToday(task.dueDate);

        let badgeClass = 'badge-upcoming';
        let badgeText = task.dueDate;
        if (isOverdue) {
          badgeClass = 'badge-overdue';
          badgeText = 'Overdue';
        } else if (isToday) {
          badgeClass = 'badge-today';
          badgeText = 'Due Today';
        }

        return `
          <div class="deadline-item" data-task-id="${task.id}">
            <div class="deadline-left">
              <span class="deadline-priority-dot priority-${task.priority.toLowerCase()}"></span>
              <span class="deadline-title">${this.escapeHtml(task.title)}</span>
            </div>
            <div class="deadline-right">
              <span class="badge badge-xs ${badgeClass}">${badgeText}</span>
            </div>
          </div>
        `;
      }).join('');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: container });
    }
  }

  /**
   * Render Dashboard Quick Active Tasks preview
   */
  renderDashboardQuickTasks() {
    const container = document.getElementById('dashboard-quick-tasks-container');
    if (!container) return;

    const activeTasks = this.taskManager.getAllTasks()
      .filter(t => t.status !== 'Completed')
      .slice(0, 4);

    if (activeTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-mini-state">
          <i data-lucide="sparkles"></i>
          <p>All clear! No active pending tasks.</p>
        </div>
      `;
    } else {
      container.innerHTML = activeTasks.map(task => `
        <div class="quick-task-row" data-task-id="${task.id}">
          <label class="custom-checkbox-container" title="Complete task">
            <input type="checkbox" class="task-checkbox" data-task-id="${task.id}">
            <span class="checkbox-checkmark">
              <i data-lucide="check" class="check-icon"></i>
            </span>
          </label>
          <div class="quick-task-info">
            <span class="quick-task-title">${this.escapeHtml(task.title)}</span>
            <div class="quick-task-meta">
              <span class="badge badge-category badge-xs badge-${task.category.toLowerCase()}">${task.category}</span>
              <span class="badge badge-priority badge-xs badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
          </div>
          <button class="btn-icon btn-edit-task" data-task-id="${task.id}" title="Edit task">
            <i data-lucide="pencil"></i>
          </button>
        </div>
      `).join('');
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: container });
    }
  }

  /**
   * Render "Explore Sample Tasks" Section (Fulfills Section 9)
   * Displays tasks fetched from DummyJSON in a dedicated container with 1-click import.
   */
  renderSampleTasksSection(isLoading = false, errorMsg = null) {
    const container = document.getElementById('sample-tasks-grid');
    const headerCount = document.getElementById('sample-tasks-count');
    if (!container) return;

    if (isLoading) {
      container.innerHTML = `
        <div class="sample-skeleton-card">
          <div class="skeleton-line w-50"></div>
          <div class="skeleton-line w-80"></div>
          <div class="skeleton-line w-30"></div>
        </div>
        <div class="sample-skeleton-card">
          <div class="skeleton-line w-60"></div>
          <div class="skeleton-line w-75"></div>
          <div class="skeleton-line w-40"></div>
        </div>
        <div class="sample-skeleton-card">
          <div class="skeleton-line w-40"></div>
          <div class="skeleton-line w-90"></div>
          <div class="skeleton-line w-50"></div>
        </div>
      `;
      return;
    }

    if (errorMsg) {
      container.innerHTML = `
        <div class="sample-error-state card">
          <i data-lucide="wifi-off" class="text-danger"></i>
          <h4>Unable to load DummyJSON sample tasks</h4>
          <p class="text-xs text-muted">${this.escapeHtml(errorMsg)}</p>
          <button class="btn btn-outline btn-sm" id="btn-retry-sample-tasks">
            <i data-lucide="refresh-cw"></i> Retry Connection
          </button>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ root: container });
      }
      return;
    }

    const sampleTasks = this.taskManager.sampleTasks;
    if (headerCount) {
      headerCount.textContent = `(${sampleTasks.length} available)`;
    }

    if (sampleTasks.length === 0) {
      container.innerHTML = `
        <div class="empty-mini-state">
          <i data-lucide="check-circle-2"></i>
          <p>All sample tasks have been imported or none loaded yet.</p>
          <button class="btn btn-outline btn-sm" id="btn-reload-sample-tasks">
            <i data-lucide="download-cloud"></i> Fetch Sample Tasks
          </button>
        </div>
      `;
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ root: container });
      }
      return;
    }

    container.innerHTML = sampleTasks.map(sample => `
      <div class="sample-task-card card" data-sample-id="${sample.id}">
        <div class="sample-card-header">
          <span class="badge badge-api">
            <i data-lucide="database"></i> DummyJSON #${sample.dummyId}
          </span>
          <span class="badge badge-category badge-xs badge-${sample.category.toLowerCase()}">
            ${sample.category}
          </span>
        </div>
        <div class="sample-card-body">
          <h4 class="sample-card-title">${this.escapeHtml(sample.title)}</h4>
          <p class="sample-card-desc">${this.escapeHtml(sample.description)}</p>
        </div>
        <div class="sample-card-footer">
          <div class="sample-meta">
            <span class="badge badge-priority badge-xs badge-priority-${sample.priority.toLowerCase()}">${sample.priority}</span>
            <span class="sample-status-text">${sample.status}</span>
          </div>
          <button class="btn btn-sm btn-primary btn-import-sample" data-sample-id="${sample.id}" title="Import this task into your personal task list">
            <i data-lucide="plus"></i> Import Task
          </button>
        </div>
      </div>
    `).join('');

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: container });
    }
  }

  /**
   * Format human-readable date representation
   */
  static formatDueDate(dateStr, status) {
    if (!dateStr) return { text: 'No Date', badgeClass: 'date-none', isOverdue: false };

    const todayStr = new Date().toISOString().split('T')[0];
    const isCompleted = status === 'Completed';

    if (dateStr === todayStr) {
      return {
        text: 'Due Today',
        badgeClass: isCompleted ? 'date-completed' : 'date-today',
        isOverdue: false
      };
    }

    const today = new Date(todayStr);
    const due = new Date(dateStr);
    const diffDays = Math.round((due - today) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      return {
        text: 'Due Tomorrow',
        badgeClass: isCompleted ? 'date-completed' : 'date-tomorrow',
        isOverdue: false
      };
    }

    if (diffDays < 0) {
      return {
        text: isCompleted ? `Completed (${dateStr})` : `${Math.abs(diffDays)}d Overdue`,
        badgeClass: isCompleted ? 'date-completed' : 'date-overdue',
        isOverdue: !isCompleted
      };
    }

    const formatted = due.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    return {
      text: `Due ${formatted}`,
      badgeClass: isCompleted ? 'date-completed' : 'date-normal',
      isOverdue: false
    };
  }

  /**
   * Render the list of tasks (in either Grid or Table mode)
   */
  renderTaskList(containerId = 'tasks-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    const tasks = this.taskManager.getFilteredTasks();

    if (tasks.length === 0) {
      container.innerHTML = this.renderEmptyState();
      if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons({ root: container });
      }
      return;
    }

    if (this.viewMode === 'table') {
      container.innerHTML = this.renderTaskTable(tasks);
    } else {
      container.innerHTML = `
        <div class="tasks-grid">
          ${tasks.map(task => this.renderTaskCard(task)).join('')}
        </div>
      `;
    }

    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: container });
    }
  }

  /**
   * Render an individual Task Card with rich micro-interactions
   */
  renderTaskCard(task) {
    const isCompleted = task.status === 'Completed';
    const dateMeta = DashboardUI.formatDueDate(task.dueDate, task.status);

    // Subtasks summary
    const subtasks = Array.isArray(task.subtasks) ? task.subtasks : [];
    const completedSubtasks = subtasks.filter(s => s.completed).length;
    const hasSubtasks = subtasks.length > 0;
    const subtaskPercent = hasSubtasks ? Math.round((completedSubtasks / subtasks.length) * 100) : 0;

    return `
      <div class="task-card ${isCompleted ? 'is-completed' : ''} priority-border-${task.priority.toLowerCase()}" data-task-id="${task.id}">
        <div class="task-card-header">
          <div class="task-card-tags">
            <span class="badge badge-category badge-${task.category.toLowerCase()}">
              ${task.category}
            </span>
            <span class="badge badge-priority badge-priority-${task.priority.toLowerCase()}">
              <span class="priority-dot"></span> ${task.priority}
            </span>
          </div>

          <div class="task-card-quick-actions">
            <button class="btn-icon btn-favourite ${task.isFavourite ? 'is-favourite' : ''}" title="${task.isFavourite ? 'Remove from Favorites' : 'Mark as Favorite'}" data-task-id="${task.id}">
              <i data-lucide="star" class="${task.isFavourite ? 'fill-gold' : ''}"></i>
            </button>
            <div class="task-dropdown-menu">
              <button class="btn-icon btn-more" title="More options" data-task-id="${task.id}">
                <i data-lucide="more-vertical"></i>
              </button>
              <div class="dropdown-popover">
                <button class="dropdown-item btn-edit-task" data-task-id="${task.id}">
                  <i data-lucide="pencil"></i> Edit Task
                </button>
                <button class="dropdown-item btn-delete-task text-danger" data-task-id="${task.id}">
                  <i data-lucide="trash-2"></i> Delete Task
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="task-card-body">
          <div class="task-card-checkbox-row">
            <label class="custom-checkbox-container" title="Toggle completion">
              <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${isCompleted ? 'checked' : ''}>
              <span class="checkbox-checkmark">
                <i data-lucide="check" class="check-icon"></i>
              </span>
            </label>
            <h4 class="task-card-title ${isCompleted ? 'strike-through' : ''}">
              ${this.escapeHtml(task.title)}
            </h4>
          </div>

          ${task.description ? `
            <p class="task-card-desc">${this.escapeHtml(task.description)}</p>
          ` : ''}

          ${hasSubtasks ? `
            <div class="task-subtasks-preview">
              <div class="subtasks-summary-header" data-task-id="${task.id}">
                <span class="subtasks-count-text">
                  <i data-lucide="check-square"></i> Subtasks: ${completedSubtasks}/${subtasks.length}
                </span>
                <span class="subtasks-percent">${subtaskPercent}%</span>
              </div>
              <div class="subtasks-mini-progress">
                <div class="subtasks-mini-fill" style="width: ${subtaskPercent}%"></div>
              </div>

              <div class="subtasks-checklist-container" id="subtasks-list-${task.id}">
                ${subtasks.map(sub => `
                  <label class="subtask-item ${sub.completed ? 'is-subtask-done' : ''}">
                    <input type="checkbox" class="subtask-checkbox" data-task-id="${task.id}" data-subtask-id="${sub.id}" ${sub.completed ? 'checked' : ''}>
                    <span class="subtask-label">${this.escapeHtml(sub.title)}</span>
                  </label>
                `).join('')}
              </div>
            </div>
          ` : ''}
        </div>

        <div class="task-card-footer">
          <div class="task-card-date">
            <span class="deadline-pill ${dateMeta.badgeClass}">
              <i data-lucide="${dateMeta.isOverdue ? 'alert-circle' : 'calendar'}"></i>
              ${dateMeta.text}
            </span>
          </div>

          <div class="task-card-status">
            <select class="status-select status-select-${task.status.toLowerCase().replace(' ', '-')}" data-task-id="${task.id}" title="Change status">
              <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
              <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
              <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
            </select>
          </div>
        </div>
      </div>
    `;
  }

  /**
   * Render table view option
   */
  renderTaskTable(tasks) {
    return `
      <div class="table-responsive">
        <table class="task-table">
          <thead>
            <tr>
              <th width="40"></th>
              <th>Task Title</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Due Date</th>
              <th>Status</th>
              <th>Subtasks</th>
              <th width="90">Actions</th>
            </tr>
          </thead>
          <tbody>
            ${tasks.map(task => {
              const isCompleted = task.status === 'Completed';
              const dateMeta = DashboardUI.formatDueDate(task.dueDate, task.status);
              const subtasks = task.subtasks || [];
              const completedSubtasks = subtasks.filter(s => s.completed).length;

              return `
                <tr class="table-row ${isCompleted ? 'row-completed' : ''}" data-task-id="${task.id}">
                  <td>
                    <label class="custom-checkbox-container">
                      <input type="checkbox" class="task-checkbox" data-task-id="${task.id}" ${isCompleted ? 'checked' : ''}>
                      <span class="checkbox-checkmark">
                        <i data-lucide="check" class="check-icon"></i>
                      </span>
                    </label>
                  </td>
                  <td>
                    <div class="table-task-name">
                      <span class="table-title ${isCompleted ? 'strike-through' : ''}">${this.escapeHtml(task.title)}</span>
                    </div>
                  </td>
                  <td>
                    <span class="badge badge-category badge-${task.category.toLowerCase()}">${task.category}</span>
                  </td>
                  <td>
                    <span class="badge badge-priority badge-priority-${task.priority.toLowerCase()}">${task.priority}</span>
                  </td>
                  <td>
                    <span class="deadline-pill ${dateMeta.badgeClass}">${dateMeta.text}</span>
                  </td>
                  <td>
                    <select class="status-select status-select-${task.status.toLowerCase().replace(' ', '-')}" data-task-id="${task.id}">
                      <option value="Pending" ${task.status === 'Pending' ? 'selected' : ''}>Pending</option>
                      <option value="In Progress" ${task.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
                      <option value="Completed" ${task.status === 'Completed' ? 'selected' : ''}>Completed</option>
                    </select>
                  </td>
                  <td>
                    ${subtasks.length > 0 ? `<span class="table-subtask-pill">${completedSubtasks}/${subtasks.length}</span>` : '—'}
                  </td>
                  <td>
                    <div class="table-actions">
                      <button class="btn-icon btn-favourite ${task.isFavourite ? 'is-favourite' : ''}" data-task-id="${task.id}" title="Star task">
                        <i data-lucide="star" class="${task.isFavourite ? 'fill-gold' : ''}"></i>
                      </button>
                      <button class="btn-icon btn-edit-task" data-task-id="${task.id}" title="Edit task">
                        <i data-lucide="pencil"></i>
                      </button>
                      <button class="btn-icon btn-delete-task text-danger" data-task-id="${task.id}" title="Delete task">
                        <i data-lucide="trash-2"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  /**
   * Render an engaging empty state
   */
  renderEmptyState() {
    const hasSearchOrFilter = this.taskManager.searchQuery ||
      this.taskManager.filterCategory !== 'All' ||
      this.taskManager.filterPriority !== 'All' ||
      this.taskManager.filterStatus !== 'All' ||
      this.taskManager.filterFavoriteOnly;

    if (hasSearchOrFilter) {
      return `
        <div class="empty-state-card animated-fade-in">
          <div class="empty-icon-wrap">
            <i data-lucide="search-x"></i>
          </div>
          <h3>No matching tasks found</h3>
          <p>No tasks matched your active search query or filter criteria. Try adjusting your search keywords or resetting filters.</p>
          <button class="btn btn-primary" id="btn-reset-filters">
            <i data-lucide="rotate-ccw"></i> Reset Filters
          </button>
        </div>
      `;
    }

    const view = this.taskManager.currentView;
    let message = 'No tasks found in this view.';
    let icon = 'clipboard-list';

    if (view === 'today') {
      message = 'Your day is clear! Plan ahead by adding tasks due today.';
      icon = 'calendar-check-2';
    } else if (view === 'favorites') {
      message = 'No favorites starred yet. Click the star icon on any task to pin it here.';
      icon = 'star';
    } else if (view === 'completed') {
      message = 'No completed tasks yet. Finish your pending tasks to see them celebrated here!';
      icon = 'check-circle-2';
    } else if (view === 'upcoming') {
      message = 'No upcoming deadlines scheduled for future dates.';
      icon = 'calendar-clock';
    } else if (view === 'in-progress') {
      message = 'No tasks currently marked In Progress. Start a task to track its momentum!';
      icon = 'timer';
    } else if (view === 'gdg') {
      message = 'No GDG Tech Team tasks created yet. Click "+ New Task" to plan your next initiative!';
      icon = 'sparkles';
    } else if (view === 'academics') {
      message = 'No Academic tasks created yet. Keep track of your courses, labs, and exams here.';
      icon = 'book-open';
    } else if (view === 'personal') {
      message = 'No Personal tasks created yet. Track side projects, habits, and self-care routines.';
      icon = 'user';
    }

    return `
      <div class="empty-state-card animated-fade-in">
        <div class="empty-icon-wrap">
          <i data-lucide="${icon}"></i>
        </div>
        <h3>Everything is clear!</h3>
        <p>${message}</p>
        <div class="empty-actions">
          <button class="btn btn-primary btn-open-new-task-modal">
            <i data-lucide="plus"></i> Create New Task
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}
