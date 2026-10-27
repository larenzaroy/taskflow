# TaskFlow — Modern Task & Productivity Dashboard

> **GDG BPPIMT Tech Team Selection Project**  
> A premium, responsive SaaS-style productivity application inspired by Linear, Notion, and Todoist. Built with pure HTML5, modern responsive CSS3 Grid & Flexbox, and modular Vanilla JavaScript (ES6+). Zero AI/ML frameworks used.

![TaskFlow Banner](https://img.shields.io/badge/GDG%20BPPIMT-Tech%20Team%20Project-4285F4?style=for-the-badge&logo=google)
![Vanilla JS](https://img.shields.io/badge/Vanilla-JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![CSS3 Grid & Flexbox](https://img.shields.io/badge/CSS3-Modern%20Design-1572B6?style=for-the-badge&logo=css3)
![License MIT](https://img.shields.io/badge/License-MIT-34A853?style=for-the-badge)

---

## 🎯 Project Overview & Objectives

**TaskFlow** is a comprehensive, functional, and responsive task and productivity dashboard built specifically for the **GDG BPPIMT Tech Team Selection**. It embodies modern software craft: clean typography, purposeful whitespace, smooth animations, persistent state management, robust API integrations, and an intuitive two-pane desktop layout with a persistent left navigation sidebar.

### Core Objectives
1. **Production-Grade Vanilla JavaScript**: Demonstrate deep architectural and algorithmic competence without relying on heavy frameworks (React/Vue/Angular) or AI/ML libraries.
2. **Persistent Left Navigation Pane**: Ensure a fixed sidebar navigation layout on desktop with active state highlights, dynamic count badges, collapsible icon-only view, and a fluid mobile slide-out drawer.
3. **Large Daily Inspiration Feature**: Position a high-impact, editorial-style inspiration showcase directly below the header with real-time Advice Slip API integration, curated thematic photography, and smooth crossfades.
4. **Complete Task Lifecycle (CRUD)**: Create, Read, Update, and Delete tasks with subtasks/checklists, priority tags, categories, due dates, statuses, and favorite pinning.
5. **Dynamic Dashboard Analytics**: Instantly calculate 4 key metrics (Total Tasks, Completed, Pending, Completion Rate), an animated completion bar, and a compact 3-part status distribution breakdown.
6. **Isolated API Integrations**: Provide an "Explore Sample Tasks" section from the DummyJSON Todos API with 1-click import into user tasks without data collision.
7. **Offline-First Resilience**: Browser `localStorage` persistence, error handling, timeouts, local SVG illustration fallbacks, and JSON backup/restore.

---

## ✨ Features Breakdown

### 1. Design System & Visual Identity
- **Minimal, Elegant Aesthetics**: Inspired by Linear, Notion, and Todoist with generous whitespace, crisp typography, and refined accent colors.
- **Light & Dark Theme**:
  - **Light Mode**: Soft off-white background (`#f8fafc`), pure white cards (`#ffffff`) with subtle borders (`#e2e8f0`), soft shadows, dark charcoal typography (`#0f172a`), and refined indigo accent (`#4f46e5`).
  - **Dark Mode**: Sleek slate background (`#0b0f19`), deep slate cards (`#162032`), border accents (`rgba(255,255,255,0.08)`), and soft luminous typography (`#f8fafc`).
  - Automatically respects user OS system preference and saves manual toggles to `localStorage`.
- **Fluid Micro-Animations**: Smooth counter number animations, modal scale-ups with backdrop blur, button press depth, and task completion strikethrough.

### 2. Persistent Left Navigation Sidebar
- **Desktop Layout**: Fixed on the left while main content scrolls smoothly to its right.
- **Brand Area**: TaskFlow logo, GDG badge, and subtitle: *"Your productivity space."*
- **Main Navigation Items** (with live dynamic task-count badges):
  - 📊 **Dashboard**: Master productivity hub.
  - 📋 **My Tasks**: Comprehensive task list with full controls toolbar.
  - ☀️ **Today**: Filtered view for tasks due today.
  - ⏳ **Upcoming**: Tasks due in the future, sorted by due date.
  - 📅 **Calendar**: Interactive monthly calendar.
  - ⭐ **Favorites**: Filtered view for starred priority tasks.
  - 🟣 **In Progress**: Tasks currently under execution.
  - 🟢 **Completed**: Archive of finished tasks.
- **Category Filter Views**:
  - 🚀 **GDG**: Google Developer Groups tech team tasks.
  - 📚 **Academics**: Coursework, lab assignments, and study tasks.
  - 🌿 **Personal**: Personal goals, fitness, and side projects.
- **Bottom Section**:
  - Prominent **"+ New Task"** button (always 1-click away).
  - **Settings** view link.
  - **Light/Dark Mode toggle** button.
  - **User Profile card** (avatar, name, role, and active status indicator).
- **Responsive Drawer**: Collapsible to compact icon-only view on desktop; slides in as an off-canvas drawer on mobile via hamburger menu.

### 3. Dashboard Header
- **Personalized Time-Aware Greeting**: "Good morning / afternoon / evening, ready to be productive? ✨"
- **Current Live Date**: Formatted dynamically (e.g., *"Monday, October 26, 2026"*).
- **Live Weather Pill Widget**: Real-time temperature, condition, and city powered by Open-Meteo (zero API keys required, safe for public repos).
- **Global Search Bar**: Real-time filtering across titles, descriptions, and categories with keyboard shortcut (`/` to focus).
- **Notifications Bell**: Live badge and popover alerting users to overdue tasks and deadlines approaching within 24 hours.
- **Profile Avatar Dropdown**: Quick access to profile details, theme switcher, and JSON backup export.
- **Create Task Button**: Direct modal trigger.

### 4. Large Daily Inspiration Showcase (Highest Visual Priority)
- **Prominent Editorial Two-Column Showcase**: Wide card directly below the header and above statistics.
- **Inspiration Content**:
  - `"DAILY INSPIRATION"` pill badge with sparkle icon.
  - Thematic tag (e.g., *"New Beginnings"*, *"Deep Focus"*, *"Grit & Persistence"*, *"Personal Growth"*, *"Inner Calm"*).
  - Large motivational quote in elegant serif/display typography with stylized quotes.
  - Attribution badge (*"Advice Slip API"* or curated wisdom — never inventing authors for unattributed responses).
  - Subtitle: *"A little inspiration for your day."*
  - **"New Inspiration"** button with spinning refresh icon and loading crossfade transition.
  - **"Copy Quote"** button with immediate clipboard copy and toast notification feedback.
- **High-Definition Photography**:
  - Curated collection of high-resolution photographs representing sunrise over mountains, serene minimalist workspaces, mountain summits, forest paths, and calm lakes.
  - Embedded local SVG illustration fallbacks (`assets/images/*.svg`) ensuring the section renders flawlessly even completely offline.

### 5. Dashboard Statistics & Distribution Breakdown
- **4 Responsive Summary Cards**:
  1. **Total Tasks**: Total user-created tasks.
  2. **Completed**: Count of completed tasks.
  3. **Pending**: Count of pending tasks.
  4. **Completion Rate**: Dynamic percentage of completed tasks (`%`).
- **Animated Completion Progress Bar**: Displays overall progress with smooth CSS easing.
- **Compact Multi-Segment Status Distribution**: Segmented bar visualizing Pending (amber), In Progress (blue), and Completed (green) tasks with a labeled legend and live counts.

### 6. Split Grid: Active Tasks & Urgent Deadlines
- **Today's Priorities & Active Tasks**: Clean list of active pending tasks with 1-click completion checkbox and category tags.
- **Urgent Deadlines**: Highlights overdue tasks and deadlines approaching in the next 24 hours with countdown tags.

### 7. Explore Sample Tasks Section (DummyJSON Todos API)
- **Isolated Section**: Dedicated card container titled *"Explore Sample Tasks"* located on the dashboard.
- **DummyJSON Todos API Integration**: Fetches sample tasks asynchronously using `fetch()` and `async/await`.
- **Loading Skeleton & Retry**: Features shimmer placeholder skeletons and a network error state with a *"Retry Connection"* button.
- **1-Click Import**: Users can click **"+ Import Task"** on any sample card to import it directly into their personal workflow with custom priorities and subtasks.
- **Zero Collision Guarantee**: Sample tasks are kept strictly isolated in memory and never overwrite or pollute saved user tasks in `localStorage`.

### 8. Complete Task Management (CRUD)
- **Create**: Modal dialog with input validation (Title, Description, Priority, Category, Due Date, Status, Subtasks builder).
- **Read**: Flexible view switcher between **Card Grid** and **Table View**.
- **Update**: Edit any task property; inline status dropdown directly on cards and tables.
- **Delete**: Custom confirmation dialog preventing accidental deletions.
- **Subtasks & Checklists**: Interactive subtask checklist directly on task cards with live percentage completion bars.
- **Favorites**: Toggle star icon to pin high-priority tasks to the Favorites view.
- **Bulk Action**: Clear all completed tasks with confirmation.

### 9. Interactive Calendar View
- Monthly calendar grid with month navigation (Previous, Next, Today).
- Color-coded priority task markers on scheduled due dates.
- Interactive day cell selection with dedicated schedule inspection panel.
- Direct **"+ Add Task for this Day"** action with pre-filled due date.

### 10. Data Persistence & Backups
- Complete persistence in browser `localStorage`.
- Corrupt data handling with safe fallbacks.
- **Export Tasks as JSON**: Downloads `taskflow-tasks-[date].json`.
- **Import Tasks from JSON**: Uploads and validates schema with duplicate protection.
- Reset workspace to defaults option.

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Structure** | HTML5 | Semantic markup, accessible modal dialogs, responsive containers |
| **Styling** | CSS3 | CSS Custom Properties (Variables), Grid, Flexbox, Keyframes, Glassmorphism |
| **Logic** | Vanilla JavaScript (ES6+) | Modular ES classes, `fetch()`, `async/await`, Event Delegation, State Management |
| **Audio** | Web Audio API | Pure synthesized audio chimes on completion (zero MP3 dependencies) |
| **Persistence** | `localStorage` API | JSON serialization, schema validation, Export/Import |
| **Icons** | Lucide Icons + SVG Fallbacks | Dual-layer icon system with CDN and local inline fallbacks |
| **APIs** | DummyJSON & Advice Slip | Remote REST data integration with graceful offline resilience |

---

## 🌐 External API Endpoints

| API | Endpoint | Usage in TaskFlow | Resilience & Safety |
|---|---|---|---|
| **Advice Slip API** | `https://api.adviceslip.com/advice` | Daily Inspiration quote generation | 6.5s timeout, cache-buster, curated fallback quotes & offline SVG illustrations |
| **DummyJSON Todos API** | `https://dummyjson.com/todos` | Sample tasks for "Explore Sample Tasks" section | 7.5s timeout, skeleton loaders, 1-click import, isolated from user data |
| **Open-Meteo API** | `https://api.open-meteo.com/v1/forecast` | Real-time weather widget | 100% free, zero API key required, zero secrets committed |

*Strict Constraint Verification: Zero AI/ML frameworks, models, or paid backend services were used.*

---

## 📁 Project Folder Structure

```
Task_Management/
├── index.html              # Main HTML5 application shell & view templates
├── package.json            # Node.js project manifest & npm scripts
├── server.js               # Zero-dependency local development static server
├── README.md               # Complete project documentation & deployment guide
├── .gitignore              # Git ignore rules
├── css/
│   └── style.css           # Modern SaaS design system, light/dark themes, and animations
├── js/
│   ├── app.js              # Main application controller, routing, and event delegation
│   ├── api.js              # Advice Slip, DummyJSON, and Live Weather fetch handlers
│   ├── tasks.js            # TaskManager state model, CRUD, subtasks, filters, and stats
│   ├── storage.js          # LocalStorage persistence, validation, and JSON export/import
│   ├── dashboard.js        # DOM rendering engine, stats animations, and card templates
│   └── calendar.js         # Interactive monthly calendar component
└── assets/
    ├── icons/
    │   └── favicon.svg     # TaskFlow SVG brand favicon
    └── images/             # Curated local vector fallbacks for Daily Inspiration
        ├── inspiration-mountain.svg
        ├── inspiration-workspace.svg
        ├── inspiration-climber.svg
        ├── inspiration-forest.svg
        ├── inspiration-lake.svg
        └── inspiration-architecture.svg
```

---

## 🚀 Local Setup & Running Instructions

### Method 1: Using the Included Node.js Static Server (Recommended)
Make sure you have Node.js installed (`node -v`):
```bash
# 1. Open your terminal and navigate to the project directory:
cd Task_Management

# 2. Start the built-in server:
node server.js 3000
# or
npm start
```
Open **`http://localhost:3000`** in your browser.

---

### Method 2: Running with Python
If you are on Linux Mint, Ubuntu, or macOS:
```bash
cd Task_Management
python3 -m http.server 3000
```
Open **`http://localhost:3000`** in your browser.

---

### Method 3: VS Code Live Server Extension
1. Open the `Task_Management` directory in Visual Studio Code.
2. Right-click `index.html` and click **"Open with Live Server"**.

---

## 🚢 Deployment Instructions

TaskFlow requires zero build steps, bundlers, or compilers. It is 100% static and ready for instant deployment:

### Deploy to GitHub Pages
1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "feat: TaskFlow v1.0.0 GDG submission"
   ```
2. Create a repository on GitHub and push:
   ```bash
   git remote add origin https://github.com/<your-username>/taskflow-dashboard.git
   git branch -M main
   git push -u origin main
   ```
3. In GitHub repository settings, go to **Settings > Pages > Source: Deploy from a branch > Branch: main / root > Save**.

### Deploy to Netlify / Vercel
- **Netlify**: Drag and drop the `Task_Management` folder into [Netlify Drop](https://app.netlify.com/drop).
- **Vercel**: Run `vercel` in the project root directory or link the GitHub repository.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `/` or `Ctrl + K` | Focus task search input |
| `N` | Open "+ New Task" modal |
| `Escape` | Close active modal, drawer, or popover |

---

## 👨‍💻 Author & Acknowledgements

- **Developer**: Uttam Kumar Roy
- **Organization**: Google Developer Groups (GDG) BPPIMT Tech Team Selection
- **Submission Date**: October 2026

*Crafted with precision, clean code architecture, and dedication to the GDG developer community!*
