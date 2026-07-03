const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type WorkspaceStatus = 'DRAFT' | 'IMPORTED' | 'OPTIMIZED' | 'DISABLED';
export type CourseType = 'IN_PERSON' | 'ONLINE' | 'EXTERNAL';
export type ScheduleStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface WorkspaceDto {
  id: string;
  name: string;
  description: string | null;
  year: number;
  status: WorkspaceStatus;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDto {
  id: string;
  workspaceId: string;
  externalId: string | null;
  name: string;
  specialization: string | null;
  durationDays: number | null;
  hoursPerDay: number | null;
  expectedTrainees: number | null;
  city: string | null;
  beneficiary: string | null;
  priority: string | null;
  type: CourseType;
  earliestStart: string | null;
  latestEnd: string | null;
  fixedDate: string | null;
  notes: string | null;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TrainerDto {
  id: string;
  workspaceId: string;
  externalId: string | null;
  name: string;
  specialties: string | null;
  city: string | null;
  trainerType: string | null;
  unavailableDates: string | null;
  maxDaysPerMonth: number | null;
  maxConsecutiveDays: number | null;
  costPerDay: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface VenueDto {
  id: string;
  workspaceId: string;
  externalId: string | null;
  name: string;
  city: string | null;
  capacity: number | null;
  type: CourseType;
  availableFrom: string | null;
  availableTo: string | null;
  unavailableDates: string | null;
  equipmentNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarDayDto {
  id: string;
  workspaceId: string;
  date: string;
  isWorkDay: boolean;
  isHoliday: boolean;
  createdAt: string;
}

export interface AssignmentDto {
  id: string;
  workspaceId: string;
  trainerId: string;
  courseId: string;
  createdAt: string;
}

export interface ScheduleEntryDto {
  id: string;
  workspaceId: string;
  courseId: string;
  courseName: string;
  trainerId: string;
  trainerName: string;
  venueId: string | null;
  venueName: string | null;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  conflictNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDto {
  id: string;
  workspaceId: string;
  status: TaskStatus;
  startedAt: string | null;
  completedAt: string | null;
  log: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportResultDto {
  coursesParsed: number;
  coursesInserted: number;
  trainersParsed: number;
  trainersInserted: number;
  venuesParsed: number;
  venuesInserted: number;
  calendarDaysParsed: number;
  calendarDaysInserted: number;
  assignmentsParsed: number;
  assignmentsInserted: number;
  error: string | null;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...(init?.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(init?.headers || {}),
    },
    ...init,
  });

  if (!response.ok) {
    let message = `Request failed: ${response.status}`;
    try {
      const data = await response.json() as { message?: string; errors?: string[] };
      message = data.message || data.errors?.join(', ') || message;
    } catch {
      const text = await response.text();
      if (text) message = text;
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function download(path: string): Promise<Blob> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) {
    throw new Error(`Download failed: ${response.status}`);
  }
  return response.blob();
}

export const api = {
  workspaces: {
    list: () => request<WorkspaceDto[]>('/api/workspaces'),
    create: (body: { name: string; description?: string | null; year: number; color?: string | null }) =>
      request<WorkspaceDto>('/api/workspaces', { method: 'POST', body: JSON.stringify(body) }),
    update: (id: string, body: { name: string; description?: string | null; year: number; color?: string | null }) =>
      request<WorkspaceDto>(`/api/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (id: string, status: WorkspaceStatus) =>
      request<WorkspaceDto>(`/api/workspaces/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: string) => request<void>(`/api/workspaces/${id}`, { method: 'DELETE' }),
  },
  courses: {
    list: (workspaceId: string) => request<CourseDto[]>(`/api/workspaces/${workspaceId}/courses`),
    create: (workspaceId: string, body: Record<string, unknown>) =>
      request<CourseDto>(`/api/workspaces/${workspaceId}/courses`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: string, id: string, body: Record<string, unknown>) =>
      request<CourseDto>(`/api/workspaces/${workspaceId}/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/courses/${id}`, { method: 'DELETE' }),
  },
  trainers: {
    list: (workspaceId: string) => request<TrainerDto[]>(`/api/workspaces/${workspaceId}/trainers`),
    create: (workspaceId: string, body: Record<string, unknown>) =>
      request<TrainerDto>(`/api/workspaces/${workspaceId}/trainers`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: string, id: string, body: Record<string, unknown>) =>
      request<TrainerDto>(`/api/workspaces/${workspaceId}/trainers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/trainers/${id}`, { method: 'DELETE' }),
  },
  venues: {
    list: (workspaceId: string) => request<VenueDto[]>(`/api/workspaces/${workspaceId}/venues`),
    create: (workspaceId: string, body: Record<string, unknown>) =>
      request<VenueDto>(`/api/workspaces/${workspaceId}/venues`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: string, id: string, body: Record<string, unknown>) =>
      request<VenueDto>(`/api/workspaces/${workspaceId}/venues/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/venues/${id}`, { method: 'DELETE' }),
  },
  calendarDays: {
    list: (workspaceId: string) => request<CalendarDayDto[]>(`/api/workspaces/${workspaceId}/calendar-days`),
    create: (workspaceId: string, body: { date: string; isWorkDay: boolean; isHoliday: boolean }) =>
      request<CalendarDayDto>(`/api/workspaces/${workspaceId}/calendar-days`, { method: 'POST', body: JSON.stringify(body) }),
    bulkCreate: (workspaceId: string, body: { date: string; isWorkDay: boolean; isHoliday: boolean }[]) =>
      request<CalendarDayDto[]>(`/api/workspaces/${workspaceId}/calendar-days/bulk`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: string, id: string, body: { date: string; isWorkDay: boolean; isHoliday: boolean }) =>
      request<CalendarDayDto>(`/api/workspaces/${workspaceId}/calendar-days/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/calendar-days/${id}`, { method: 'DELETE' }),
  },
  assignments: {
    list: (workspaceId: string) => request<AssignmentDto[]>(`/api/workspaces/${workspaceId}/assignments`),
    create: (workspaceId: string, body: { trainerId: string; courseId: string }) =>
      request<AssignmentDto>(`/api/workspaces/${workspaceId}/assignments`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/assignments/${id}`, { method: 'DELETE' }),
  },
  scheduleEntries: {
    list: (workspaceId: string) => request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries`),
    create: (workspaceId: string, body: Record<string, unknown>) =>
      request<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: string, id: string, body: Record<string, unknown>) =>
      request<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (workspaceId: string, id: string, status: ScheduleStatus) =>
      request<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/schedule-entries/${id}`, { method: 'DELETE' }),
    venueConflicts: (workspaceId: string, venueId: string, startDate: string, endDate: string) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/conflicts/venue?venueId=${encodeURIComponent(venueId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
    trainerConflicts: (workspaceId: string, trainerId: string, startDate: string, endDate: string) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/conflicts/trainer?trainerId=${encodeURIComponent(trainerId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
  },
  tasks: {
    list: (workspaceId: string) => request<TaskDto[]>(`/api/workspaces/${workspaceId}/tasks`),
    create: (workspaceId: string) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks`, { method: 'POST' }),
    start: (workspaceId: string, id: string) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/start`, { method: 'POST' }),
    complete: (workspaceId: string, id: string, log: string) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/complete`, { method: 'POST', body: log }),
    fail: (workspaceId: string, id: string, log: string) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/fail`, { method: 'POST', body: log }),
    delete: (workspaceId: string, id: string) => request<void>(`/api/workspaces/${workspaceId}/tasks/${id}`, { method: 'DELETE' }),
  },
  importExcel: async (workspaceId: string, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ImportResultDto>(`/api/workspaces/${workspaceId}/import`, { method: 'POST', body: form });
  },
  exportExcel: (workspaceId: string, params?: { sheets?: string[]; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.sheets?.length) query.set('sheets', params.sheets.join(','));
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return download(`/api/workspaces/${workspaceId}/export${qs ? '?' + qs : ''}`);
  },
};

export function formatDate(value?: string | null): string {
  return value ? value.slice(0, 10) : '';
}

export function workspaceStatusLabel(status: WorkspaceStatus): 'Draft' | 'Imported' | 'Optimized' | 'Disabled' {
  return ({ DRAFT: 'Draft', IMPORTED: 'Imported', OPTIMIZED: 'Optimized', DISABLED: 'Disabled' })[status];
}

export function uiToWorkspaceStatus(status: 'Draft' | 'Imported' | 'Optimized' | 'Disabled'): WorkspaceStatus {
  return ({ Draft: 'DRAFT', Imported: 'IMPORTED', Optimized: 'OPTIMIZED', Disabled: 'DISABLED' })[status];
}

export function courseTypeLabel(type: CourseType): 'In-person' | 'Online' | 'External' {
  return ({ IN_PERSON: 'In-person', ONLINE: 'Online', EXTERNAL: 'External' })[type];
}

export function uiToCourseType(type: string): CourseType {
  return type === 'Online' ? 'ONLINE' : type === 'External' ? 'EXTERNAL' : 'IN_PERSON';
}

export function scheduleStatusLabel(status: ScheduleStatus, conflictNotes?: string | null): 'Scheduled' | 'Confirmed' | 'Completed' | 'Conflict' {
  if (conflictNotes) return 'Conflict';
  return ({ SCHEDULED: 'Scheduled', CONFIRMED: 'Confirmed', COMPLETED: 'Completed' })[status];
}

export function uiToScheduleStatus(status: 'Scheduled' | 'Confirmed' | 'Completed'): ScheduleStatus {
  return ({ Scheduled: 'SCHEDULED', Confirmed: 'CONFIRMED', Completed: 'COMPLETED' })[status];
}

export function taskStatusLabel(status: TaskStatus): 'Pending' | 'Running' | 'Completed' | 'Failed' {
  return ({ PENDING: 'Pending', RUNNING: 'Running', COMPLETED: 'Completed', FAILED: 'Failed' })[status];
}
