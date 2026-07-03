# Training Scheduler — User Manual

## 1. Introduction

**Training Scheduler** is a web application for managing annual training plans. It allows you to manage courses, trainers, venues, schedules, and assignments — all within named **Workspaces** that represent a single training year.

### Technology Stack

- React 19 + TypeScript + Vite
- Tailwind CSS 4 (dark mode, RTL support)
- Recharts (dashboard charts)
- Lucide React (icons)

---

## 2. Getting Started

### Workspace Concept

A **Workspace** is an annual training plan container. Every piece of data (courses, trainers, venues, schedule entries, etc.) belongs to exactly one workspace. To begin, you must create or select a workspace.

### Creating a Workspace

1. Go to **Workspaces** from the sidebar.
2. Click **New Workspace**.
3. Fill in the form:
   - **Name** — e.g., "Training Plan 2026"
   - **Description** — optional
   - **Year** — the training year
   - **Color** — a badge colour for identification
   - **Status** — Draft / Imported / Optimized / Disabled
4. Click **Create**.

### Selecting the Active Workspace

The active workspace is shown in the top bar. Click the dropdown to switch between workspaces. All pages display data scoped to the currently selected workspace.

### Workspace Statuses

| Status | Meaning |
|--------|---------|
| Draft | In preparation |
| Imported | Data has been imported |
| Optimized | Scheduling has been optimised |
| Disabled | Archived / inactive |

---

## 3. Navigation

### Sidebar

The sidebar contains 14 navigation items:

| Page | Arabic Label | English Label |
|------|-------------|---------------|
| Dashboard | لوحة التحكم | Dashboard |
| Workspaces | مساحات العمل | Workspaces |
| Import Data | استيراد البيانات | Import Data |
| Courses | الدورات | Courses |
| Trainers | المدربون | Trainers |
| Venues | القاعات | Venues |
| Calendar | التقويم | Calendar |
| Trainer Assignments | تعيين المدربين | Trainer Assignments |
| Schedule | الجدول | Schedule |
| Conflicts | التعارضات | Conflicts |
| Unscheduled | غير المجدولة | Unscheduled |
| Tasks | المهام | Tasks |
| Export / Reports | التصدير والتقارير | Export / Reports |
| Settings | الإعدادات | Settings |

Click any item to navigate. The sidebar can be collapsed using the arrow button at the bottom.

### TopBar

- **Breadcrumb** — shows the current page name.
- **Workspace Selector** — dropdown to change the active workspace.
- **Language Toggle** — switch between Arabic and English.
- **Theme Toggle** — switch between Light and Dark mode.

---

## 4. Data Management

### 4.1 Courses

The Courses page lists all training courses in the active workspace.

**View:** Table with columns for ID, Name, Specialisation, Duration, City, Priority, Type, Trainees, and Actions.

**Actions:**
- **Create** — click **New Course** to open a side drawer with fields: Name, Specialisation, Duration Days, Hours/Day, Expected Trainees, City, Beneficiary, Priority, Type, Earliest Start, Latest End, Colour, Notes.
- **Edit** — click the edit icon on any row.
- **Delete** — click the trash icon on any row.
- **Bulk Delete** — select rows via checkboxes, then click **Delete Selected**.

**Features:**
- **Search** — by course name or external ID.
- **Filters** — by Priority (High / Medium / Low), Type (In-person / Online / External), City.
- **Sort** — click any column header to sort ascending/descending.
- **Pagination** — 5 courses per page.

### 4.2 Trainers

The Trainers page lists all trainers in the active workspace.

**View:** Card grid showing name, city, type badge, specialities, and key stats (max days/month, consecutive days, cost/day).

**Actions:**
- **Create** — click **New Trainer** to open a side drawer with fields: Name, City, Specialities, Trainer Type (Internal / External / Freelance), Unavailable Dates, Max Days/Month, Max Consecutive Days, Cost/Day, Notes.
- **Edit** — click **Edit** on any card.
- **Delete** — click the trash icon on any card.

**Features:**
- **Search** — by trainer name.
- **Filters** — by City and Trainer Type.

### 4.3 Venues

The Venues page lists all training venues in the active workspace.

**View:** Card grid showing name, city, type icon, capacity badge, availability dates, and equipment notes.

**Actions:**
- **Create** — click **New Venue** to open a side drawer with fields: Name, City, Type, Capacity, Available From/To, Unavailable Dates, Equipment Notes.
- **Edit** — click **Edit** on any card.
- **Delete** — click the trash icon on any card.

**Features:**
- **Search** — by venue name.
- **Filters** — by City and Venue Type.

### 4.4 Trainer Assignments

Assign trainers to specific courses. Two view modes:

**Table View:** Flat list of all assignments with Course, Trainer, Speciality, and Assigned Date.

**Matrix View:** Courses on rows, Trainers on columns. Click a cell to toggle the assignment (green checkmark = assigned). Duplicate assignments are prevented.

**Actions:**
- **Create** — via the modal form (select course + trainer) or by clicking an empty cell in the matrix.
- **Delete** — click the X icon in the table, or click an assigned cell in the matrix.

---

## 5. Scheduling

### 5.1 Calendar

Manage working days, holidays, and non-working days for the workspace.

**View:** Monthly calendar grid or table view.

**Features:**
- Navigate months using the left/right arrows.
- **Click a day** to cycle through: Working Day → Holiday → Non-working → Working Day.
- Summary counters show counts of Working Days, Holidays, and Non-working days for the month.

### 5.2 Schedule

Create and manage schedule entries (assigning a course to a trainer, venue, and time period).

**Three View Modes:**
- **Calendar** — monthly overview with entries on their start dates.
- **Table** — detailed list of all entries with columns for Course, Trainer, Venue, City, Start/End Dates, Status, and Actions.
- **Kanban** — columns grouped by status: Scheduled, Confirmed, Completed, Conflict.

**Creating an Entry:**
1. Click **New Entry**.
2. Select Course, Trainer, Venue, Start Date, End Date, and optional Notes.
3. The system checks for trainer and venue conflicts automatically.
4. If conflicts are detected, you can either **Save with Conflict** or **Review** and adjust.
5. After saving, the entry appears with its appropriate status.

**Status Progression:**
- **Scheduled** → click the checkmark to mark as **Confirmed**.
- **Confirmed** → click the checkmark to mark as **Completed**.
- **Conflict** entries are highlighted in red.

### 5.3 Unscheduled Courses

Lists all courses that have not yet been added to the schedule, along with the likely reason:

| Reason | Meaning |
|--------|---------|
| Not in schedule | Course exists but has no schedule entry |
| Date window too narrow | The available start-to-end window is shorter than the course duration |
| No preferred city | City is not set, so no venue can be assigned |

### 5.4 Conflicts

Lists all schedule entries that have conflict notes. Conflicts are inferred from backend notes.

**Severity Levels:**
- **Critical** — trainer or venue conflicts.
- **Warning** — capacity issues or holiday scheduling.
- **Info** — minor advisory notes.

**Actions:**
- Click a conflict card to view details in the side panel.
- Click **Resolve** to mark it as resolved (client-side only; does not update the backend).
- Summary cards show counts of Critical, Warning, Info, and Resolved conflicts.

---

## 6. Import & Export

### 6.1 Import Data

Import course, trainer, venue, calendar, and assignment data from an Excel file (`.xlsx` or `.xls`).

**5-Step Wizard:**
1. **Upload File** — drag & drop or click to browse.
2. **Validate Sheets** — the system checks that expected sheet names are present.
3. **Preview Data** — shows counts of entities that will be parsed.
4. **Errors & Warnings** — reviews warnings before committing.
5. **Import Summary** — shows how many records were parsed vs. inserted per entity type.

### 6.2 Export / Reports

Export data as an Excel workbook (`.xlsx`).

**Ready-Made Reports:**
- **Full Workbook** — all sheets.
- **Schedule Only** — schedule entries only.
- **Conflict Report** — entries with conflicts.
- **Unscheduled Courses** — courses not yet scheduled.

**Custom Export:**
Select which sheets to include: Courses, Trainers, Venues, Schedule, Assignments, Calendar.

**Recent Exports:** The last 5 exports are listed for quick re-download.

---

## 7. Dashboard

The Dashboard provides an overview of the active workspace with:

- **6 KPI Cards:** Total Courses, Scheduled, Unscheduled, Trainers, Venues, Conflicts.
- **Bar Chart:** Courses scheduled per month.
- **Pie Chart:** Delivery type distribution (In-person / Online / External).
- **Trainer Utilisation:** Usage bars per trainer with percentage.
- **Upcoming Sessions:** The next 4 scheduled sessions.
- **Quick Actions:** Buttons to quickly navigate to Workspaces, Import, Courses, Schedule, or Export.

---

## 8. Tasks

Background processing tasks (auto-scheduling, imports, conflict checks).

**Task Statuses:**
| Status | Meaning |
|--------|---------|
| Pending | Awaiting execution |
| Running | Currently executing (animated progress bar) |
| Completed | Finished successfully (green bar) |
| Failed | Finished with errors (red status) |

**Actions:**
- **New Task** — create a new background task.
- **Run** — start a pending task.
- **Expand Log** — view the execution log for any task.
- **Refresh** — reload the task list.

---

## 9. Settings

### Language

Toggle between **Arabic** and **English**. The entire interface, including text direction (RTL / LTR), fonts, and document title, switches accordingly.

### Theme

Toggle between **Light** and **Dark** mode. Changes take effect immediately.

---

## 10. Notifications (Toasts)

Toast notifications appear at the bottom of the screen for 4 seconds.

| Type | Meaning |
|------|---------|
| Success | Operation completed successfully |
| Error | Operation failed |
| Warning | Something needs attention |
| Info | General information |

You can dismiss a toast early by clicking the X button.

---

## 11. FAQ / Troubleshooting

**Q: Why is a page showing 0 records?**
A: Make sure a workspace is selected in the top bar. The active workspace may not contain any data yet, or data may still be loading.

**Q: Why can't I create a course/trainer/venue?**
A: Ensure a workspace is active. Some fields marked with `*` are required.

**Q: Why is nothing displayed on the Dashboard?**
A: The Dashboard loads data from all entity types. If the active workspace has no courses, all KPIs will show 0.

**Q: How do I delete a workspace?**
A: Go to Workspaces, click the trash icon on the workspace card, and confirm the deletion.

**Q: My export didn't download.**
A: Check your browser's pop-up blocker and download permissions. Ensure the workspace has data to export.

---

## 12. API Reference

The application communicates with a REST backend at the URL configured via the `VITE_API_BASE_URL` environment variable (default: `http://localhost:8080`).

All endpoints are prefixed with `/api/workspaces/{workspaceId}/` and support standard CRUD operations for:

- Courses
- Trainers
- Venues
- Schedule Entries
- Calendar Days
- Assignments
- Tasks
- Import (multipart POST)
- Export (GET, returns `.xlsx` blob)

---

*Document version 1.0 — July 2026*
