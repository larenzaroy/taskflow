/**
 * TaskFlow - Interactive Yearly & Monthly Calendar Module
 * Provides a comprehensive 12-month Yearly calendar overview with task markers,
 * interactive day inspector, seamless year navigation, and month zoom view.
 */

export class CalendarView {
  constructor(taskManager, onDateSelect, onAddTaskForDate, onTaskClick) {
    this.taskManager = taskManager;
    this.onDateSelect = onDateSelect;
    this.onAddTaskForDate = onAddTaskForDate;
    this.onTaskClick = onTaskClick;

    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth(); // 0-indexed (0 = Jan, 11 = Dec)
    this.selectedDateStr = today.toISOString().split('T')[0];
    this.viewMode = 'year'; // Default to 'year' view (all 12 months)
  }

  nextYear() {
    this.currentYear++;
  }

  prevYear() {
    this.currentYear--;
  }

  nextMonth() {
    this.currentMonth++;
    if (this.currentMonth > 11) {
      this.currentMonth = 0;
      this.currentYear++;
    }
  }

  prevMonth() {
    this.currentMonth--;
    if (this.currentMonth < 0) {
      this.currentMonth = 11;
      this.currentYear--;
    }
  }

  goToToday() {
    const today = new Date();
    this.currentYear = today.getFullYear();
    this.currentMonth = today.getMonth();
    this.selectedDateStr = today.toISOString().split('T')[0];
  }

  setViewMode(mode) {
    if (mode === 'year' || mode === 'month') {
      this.viewMode = mode;
    }
  }

  zoomToMonth(monthIndex) {
    this.currentMonth = monthIndex;
    this.viewMode = 'month';
  }

  /**
   * Helper: Format YYYY-MM-DD
   */
  static toDateStr(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  /**
   * Helper: Get month names
   */
  static getMonthNames() {
    return [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
  }

  /**
   * Inline SVG Icons for 100% reliable rendering without CDN dependencies
   */
  static icons = {
    chevronLeft: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>`,
    chevronRight: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>`,
    calendarRange: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M17 14h-6"/><path d="M13 18H7"/></svg>`,
    calendar: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>`,
    calendarDays: `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/><path d="M16 18h.01"/></svg>`,
    calendarCheck: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/><path d="m9 16 2 2 4-4"/></svg>`,
    maximize: `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" x2="14" y1="3" y2="10"/><line x1="3" x2="10" y1="21" y2="14"/></svg>`,
    clock: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`,
    plus: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>`,
    externalLink: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" x2="21" y1="14" y2="3"/></svg>`,
    arrowLeft: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>`
  };

  /**
   * Render Yearly & Monthly Calendar
   */
  render(container) {
    if (!container) return;

    const monthNames = CalendarView.getMonthNames();
    const dayNamesShort = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    const dayNamesFull = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayStr = new Date().toISOString().split('T')[0];

    // Group tasks by due date
    const allTasks = this.taskManager.getAllTasks();
    const tasksByDate = {};
    let yearTaskCount = 0;
    let yearCompletedCount = 0;

    allTasks.forEach(task => {
      if (task.dueDate) {
        if (!tasksByDate[task.dueDate]) {
          tasksByDate[task.dueDate] = [];
        }
        tasksByDate[task.dueDate].push(task);

        if (task.dueDate.startsWith(String(this.currentYear))) {
          yearTaskCount++;
          if (task.status === 'Completed') {
            yearCompletedCount++;
          }
        }
      }
    });

    // Main calendar content depending on view mode (Year vs Month)
    let calendarContentHtml = '';

    if (this.viewMode === 'year') {
      calendarContentHtml = this.renderYearGrid(monthNames, dayNamesShort, todayStr, tasksByDate);
    } else {
      calendarContentHtml = this.renderMonthDetail(monthNames, dayNamesFull, todayStr, tasksByDate);
    }

    // Side pane: Selected date tasks & schedule inspector
    const sidePaneHtml = this.renderSidePane(tasksByDate, yearTaskCount, yearCompletedCount);

    // Assemble outer wrapper
    container.innerHTML = `
      <div class="calendar-wrapper">
        <div class="calendar-main-pane">
          <!-- Calendar Header Toolbar -->
          <div class="calendar-header-toolbar">
            <div class="cal-nav-group">
              <button class="btn btn-icon cal-prev-btn" title="${this.viewMode === 'year' ? 'Previous Year' : 'Previous Month'}" aria-label="Previous">
                ${CalendarView.icons.chevronLeft}
              </button>

              <div class="cal-title-wrapper">
                <h3 class="cal-main-title">
                  ${this.viewMode === 'year' ? `${this.currentYear} Yearly Calendar` : `${monthNames[this.currentMonth]} ${this.currentYear}`}
                </h3>
                <span class="badge badge-subtle cal-year-pill">
                  ${yearTaskCount} task${yearTaskCount !== 1 ? 's' : ''} in ${this.currentYear}
                </span>
              </div>

              <button class="btn btn-icon cal-next-btn" title="${this.viewMode === 'year' ? 'Next Year' : 'Next Month'}" aria-label="Next">
                ${CalendarView.icons.chevronRight}
              </button>
            </div>

            <div class="cal-actions-group">
              <!-- View Switcher Tabs -->
              <div class="cal-view-toggle">
                <button class="btn btn-xs ${this.viewMode === 'year' ? 'btn-primary' : 'btn-ghost'} cal-toggle-year-btn" title="View all 12 months">
                  ${CalendarView.icons.calendarRange} Year (12M)
                </button>
                <button class="btn btn-xs ${this.viewMode === 'month' ? 'btn-primary' : 'btn-ghost'} cal-toggle-month-btn" title="Focus on single month">
                  ${CalendarView.icons.calendar} Month View
                </button>
              </div>

              <button class="btn btn-sm btn-outline cal-today-btn" title="Jump to today">
                ${CalendarView.icons.clock} Today
              </button>
            </div>
          </div>

          <!-- Calendar Body (Year or Month View) -->
          ${calendarContentHtml}
        </div>

        <!-- Right Side: Day Schedule Inspector -->
        <div class="calendar-side-pane">
          ${sidePaneHtml}
        </div>
      </div>
    `;

    // Re-initialize Lucide icons if any
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
      window.lucide.createIcons({ root: container });
    }

    // Attach Event Listeners
    this.attachEventListeners(container);
  }

  /**
   * Render 12-Month Yearly Grid
   */
  renderYearGrid(monthNames, dayNamesShort, todayStr, tasksByDate) {
    let monthsHtml = '';

    for (let m = 0; m < 12; m++) {
      const firstDayIndex = new Date(this.currentYear, m, 1).getDay();
      const daysInMonth = new Date(this.currentYear, m + 1, 0).getDate();

      // Count tasks in this month
      let monthTaskCount = 0;
      for (let d = 1; d <= daysInMonth; d++) {
        const dStr = CalendarView.toDateStr(this.currentYear, m, d);
        if (tasksByDate[dStr] && tasksByDate[dStr].length > 0) {
          monthTaskCount += tasksByDate[dStr].length;
        }
      }

      // Build day cells
      let daysGridHtml = '';

      // Blank lead cells
      for (let i = 0; i < firstDayIndex; i++) {
        daysGridHtml += '<div class="cal-mini-day is-empty" aria-hidden="true"></div>';
      }

      // Days of month
      for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = CalendarView.toDateStr(this.currentYear, m, day);
        const isToday = dateStr === todayStr;
        const isSelected = dateStr === this.selectedDateStr;
        const dayTasks = tasksByDate[dateStr] || [];

        let dotHtml = '';
        let taskClass = '';

        if (dayTasks.length > 0) {
          const hasHigh = dayTasks.some(t => t.priority === 'High' && t.status !== 'Completed');
          const hasMedium = dayTasks.some(t => t.priority === 'Medium' && t.status !== 'Completed');
          const allCompleted = dayTasks.every(t => t.status === 'Completed');

          let dotClass = 'dot-normal';
          if (allCompleted) dotClass = 'dot-completed';
          else if (hasHigh) dotClass = 'dot-high';
          else if (hasMedium) dotClass = 'dot-medium';

          taskClass = 'has-tasks';
          dotHtml = `<span class="cal-mini-dot ${dotClass}" title="${dayTasks.length} task(s)"></span>`;
        }

        daysGridHtml += `
          <button type="button" class="cal-mini-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''} ${taskClass}"
                  data-date="${dateStr}"
                  title="${monthNames[m]} ${day}, ${this.currentYear}${dayTasks.length > 0 ? ` • ${dayTasks.length} task(s)` : ''}">
            <span class="cal-mini-day-num">${day}</span>
            ${dotHtml}
          </button>
        `;
      }

      // Month Card
      monthsHtml += `
        <div class="cal-mini-month-card ${m === this.currentMonth ? 'is-current-month' : ''}" data-month="${m}">
          <div class="cal-mini-month-header">
            <span class="cal-mini-month-title" data-month="${m}" title="Click to zoom into ${monthNames[m]}">
              ${monthNames[m]}
            </span>
            <div class="cal-mini-month-actions">
              ${monthTaskCount > 0 ? `<span class="cal-mini-month-badge">${monthTaskCount}</span>` : ''}
              <button type="button" class="btn btn-ghost btn-xs cal-zoom-month-btn" data-month="${m}" title="Zoom into ${monthNames[m]}">
                ${CalendarView.icons.maximize}
              </button>
            </div>
          </div>

          <div class="cal-mini-weekdays">
            ${dayNamesShort.map(d => `<span class="cal-mini-weekday">${d}</span>`).join('')}
          </div>

          <div class="cal-mini-days-grid">
            ${daysGridHtml}
          </div>
        </div>
      `;
    }

    return `
      <div class="cal-year-grid">
        ${monthsHtml}
      </div>
    `;
  }

  /**
   * Render Single-Month Focused View (when zoomed in)
   */
  renderMonthDetail(monthNames, dayNamesFull, todayStr, tasksByDate) {
    const firstDayIndex = new Date(this.currentYear, this.currentMonth, 1).getDay();
    const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
    const prevMonthDays = new Date(this.currentYear, this.currentMonth, 0).getDate();

    let daysHtml = '';

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const dayNum = prevMonthDays - i;
      const prevMonth = this.currentMonth === 0 ? 11 : this.currentMonth - 1;
      const prevYear = this.currentMonth === 0 ? this.currentYear - 1 : this.currentYear;
      const dateStr = CalendarView.toDateStr(prevYear, prevMonth, dayNum);
      const dayTasks = tasksByDate[dateStr] || [];

      daysHtml += `
        <div class="cal-day other-month" data-date="${dateStr}">
          <span class="cal-day-num">${dayNum}</span>
          ${dayTasks.length > 0 ? `<div class="cal-dots"><span class="cal-dot-pill">${dayTasks.length}</span></div>` : ''}
        </div>
      `;
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = CalendarView.toDateStr(this.currentYear, this.currentMonth, day);
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === this.selectedDateStr;
      const dayTasks = tasksByDate[dateStr] || [];

      let markersHtml = '';
      if (dayTasks.length > 0) {
        const hasHigh = dayTasks.some(t => t.priority === 'High' && t.status !== 'Completed');
        const hasMedium = dayTasks.some(t => t.priority === 'Medium' && t.status !== 'Completed');
        const allCompleted = dayTasks.every(t => t.status === 'Completed');

        let dotClass = 'dot-normal';
        if (allCompleted) dotClass = 'dot-completed';
        else if (hasHigh) dotClass = 'dot-high';
        else if (hasMedium) dotClass = 'dot-medium';

        markersHtml = `
          <div class="cal-dots">
            <span class="cal-dot ${dotClass}" title="${dayTasks.length} task(s)"></span>
            <span class="cal-task-count">${dayTasks.length}</span>
          </div>
        `;
      }

      daysHtml += `
        <div class="cal-day ${isToday ? 'is-today' : ''} ${isSelected ? 'is-selected' : ''}" data-date="${dateStr}">
          <div class="cal-day-header">
            <span class="cal-day-num">${day}</span>
            ${isToday ? '<span class="today-chip">Today</span>' : ''}
          </div>
          ${markersHtml}
        </div>
      `;
    }

    // Next month padding
    const totalRendered = firstDayIndex + daysInMonth;
    const remaining = (7 - (totalRendered % 7)) % 7;
    for (let day = 1; day <= remaining; day++) {
      const nextMonth = this.currentMonth === 11 ? 0 : this.currentMonth + 1;
      const nextYear = this.currentMonth === 11 ? this.currentYear + 1 : this.currentYear;
      const dateStr = CalendarView.toDateStr(nextYear, nextMonth, day);
      const dayTasks = tasksByDate[dateStr] || [];

      daysHtml += `
        <div class="cal-day other-month" data-date="${dateStr}">
          <span class="cal-day-num">${day}</span>
          ${dayTasks.length > 0 ? `<div class="cal-dots"><span class="cal-dot-pill">${dayTasks.length}</span></div>` : ''}
        </div>
      `;
    }

    return `
      <div class="cal-month-detail-card">
        <div class="cal-month-detail-bar">
          <button class="btn btn-xs btn-outline cal-back-to-year-btn">
            ${CalendarView.icons.arrowLeft} Back to 12-Month Year View
          </button>
          <span class="cal-month-detail-indicator">
            Viewing <strong>${monthNames[this.currentMonth]} ${this.currentYear}</strong>
          </span>
        </div>

        <div class="calendar-weekdays">
          ${dayNamesFull.map(d => `<div class="cal-weekday">${d}</div>`).join('')}
        </div>

        <div class="calendar-days-grid">
          ${daysHtml}
        </div>
      </div>
    `;
  }

  /**
   * Render Right-Side Day Inspector & Schedule Overview
   */
  renderSidePane(tasksByDate, yearTotalTasks, yearCompletedTasks) {
    const selectedTasks = tasksByDate[this.selectedDateStr] || [];
    let formattedSelectedDate = this.selectedDateStr;
    try {
      formattedSelectedDate = new Date(this.selectedDateStr + 'T00:00:00').toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (e) {
      formattedSelectedDate = this.selectedDateStr;
    }

    let selectedTasksListHtml = '';
    if (selectedTasks.length === 0) {
      selectedTasksListHtml = `
        <div class="cal-empty-day">
          <div class="cal-empty-icon-wrap">
            ${CalendarView.icons.calendarCheck}
          </div>
          <p class="cal-empty-title">No tasks due on this date</p>
          <p class="cal-empty-desc">Schedule a new task or deadline for this day.</p>
          <button class="btn btn-sm btn-primary add-task-for-date-btn" data-date="${this.selectedDateStr}">
            ${CalendarView.icons.plus} Add Task for this Day
          </button>
        </div>
      `;
    } else {
      selectedTasksListHtml = `
        <div class="cal-day-tasks-header">
          <span class="cal-tasks-count-pill">${selectedTasks.length} task${selectedTasks.length > 1 ? 's' : ''} scheduled</span>
          <button class="btn btn-xs btn-outline add-task-for-date-btn" data-date="${this.selectedDateStr}">
            ${CalendarView.icons.plus} Add
          </button>
        </div>
        <div class="cal-day-tasks-list">
          ${selectedTasks.map(task => `
            <div class="cal-task-item ${task.status === 'Completed' ? 'is-completed' : ''}" data-task-id="${task.id}" title="Click to view/edit task">
              <div class="cal-task-priority-indicator priority-${task.priority.toLowerCase()}"></div>
              <div class="cal-task-info">
                <span class="cal-task-title">${task.title}</span>
                <div class="cal-task-meta">
                  <span class="badge badge-xs badge-${task.category.toLowerCase()}">${task.category}</span>
                  <span class="badge badge-xs badge-status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</span>
                  ${task.priority === 'High' ? '<span class="badge badge-xs badge-priority-high">High</span>' : ''}
                </div>
              </div>
              <button class="btn btn-ghost btn-xs cal-task-edit-btn" data-task-id="${task.id}" title="Edit Task">
                ${CalendarView.icons.externalLink}
              </button>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <!-- Schedule Overview Header -->
      <div class="cal-side-header">
        <div class="cal-side-header-top">
          <h4>${CalendarView.icons.calendarDays} Schedule Overview</h4>
        </div>
        <div class="cal-side-selected-date-badge">
          ${CalendarView.icons.clock}
          <span>${formattedSelectedDate}</span>
        </div>
      </div>

      <!-- Quick Year Progress -->
      <div class="cal-year-stats-strip">
        <div class="cal-stat-pill">
          <span class="cal-stat-label">Year ${this.currentYear}</span>
          <span class="cal-stat-val">${yearTotalTasks} tasks</span>
        </div>
        <div class="cal-stat-pill">
          <span class="cal-stat-label">Completed</span>
          <span class="cal-stat-val text-success">${yearCompletedTasks}</span>
        </div>
        <div class="cal-stat-pill">
          <span class="cal-stat-label">Pending</span>
          <span class="cal-stat-val text-warning">${yearTotalTasks - yearCompletedTasks}</span>
        </div>
      </div>

      <!-- Day Tasks List -->
      <div class="cal-side-content">
        ${selectedTasksListHtml}
      </div>
    `;
  }

  /**
   * Event Listeners Binding
   */
  attachEventListeners(container) {
    // Prev button (Prev Year in year mode, Prev Month in month mode)
    container.querySelector('.cal-prev-btn')?.addEventListener('click', () => {
      if (this.viewMode === 'year') {
        this.prevYear();
      } else {
        this.prevMonth();
      }
      this.render(container);
    });

    // Next button (Next Year in year mode, Next Month in month mode)
    container.querySelector('.cal-next-btn')?.addEventListener('click', () => {
      if (this.viewMode === 'year') {
        this.nextYear();
      } else {
        this.nextMonth();
      }
      this.render(container);
    });

    // Today button
    container.querySelector('.cal-today-btn')?.addEventListener('click', () => {
      this.goToToday();
      this.render(container);
    });

    // View mode switches
    container.querySelector('.cal-toggle-year-btn')?.addEventListener('click', () => {
      this.setViewMode('year');
      this.render(container);
    });

    container.querySelector('.cal-toggle-month-btn')?.addEventListener('click', () => {
      this.setViewMode('month');
      this.render(container);
    });

    container.querySelector('.cal-back-to-year-btn')?.addEventListener('click', () => {
      this.setViewMode('year');
      this.render(container);
    });

    // Zoom to specific month buttons
    container.querySelectorAll('.cal-zoom-month-btn, .cal-mini-month-title').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const m = parseInt(el.getAttribute('data-month'), 10);
        if (!isNaN(m)) {
          this.zoomToMonth(m);
          this.render(container);
        }
      });
    });

    // Mini day cell selection (Year View)
    container.querySelectorAll('.cal-mini-day[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
          this.selectedDateStr = dateStr;
          this.render(container);
          if (typeof this.onDateSelect === 'function') {
            this.onDateSelect(dateStr);
          }
        }
      });
    });

    // Detailed day cell selection (Month View)
    container.querySelectorAll('.cal-day[data-date]').forEach(cell => {
      cell.addEventListener('click', () => {
        const dateStr = cell.getAttribute('data-date');
        if (dateStr) {
          this.selectedDateStr = dateStr;
          this.render(container);
          if (typeof this.onDateSelect === 'function') {
            this.onDateSelect(dateStr);
          }
        }
      });
    });

    // Add task for date button
    container.querySelectorAll('.add-task-for-date-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const dateStr = btn.getAttribute('data-date') || this.selectedDateStr;
        if (typeof this.onAddTaskForDate === 'function') {
          this.onAddTaskForDate(dateStr);
        }
      });
    });

    // Task item click -> open task modal to edit
    container.querySelectorAll('.cal-task-item, .cal-task-edit-btn').forEach(el => {
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        const target = el.closest('[data-task-id]');
        const taskId = target ? target.getAttribute('data-task-id') : null;
        if (taskId && typeof this.onTaskClick === 'function') {
          this.onTaskClick(taskId);
        }
      });
    });
  }
}
