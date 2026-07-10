const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export type WorkspaceStatus = 'DRAFT' | 'IMPORTED' | 'OPTIMIZED' | 'DISABLED';
export type CourseType = 'IN_PERSON' | 'ONLINE' | 'EXTERNAL';
export type ScheduleStatus = 'SCHEDULED' | 'CONFIRMED' | 'COMPLETED';
export type TaskStatus = 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}

export interface PageParams {
  page?: number;
  size?: number;
  sort?: string | string[];
  search?: string;
  [key: string]: unknown;
}

export interface CourseFilterOptionsDto {
  cities: string[];
  types: CourseType[];
  priorities: string[];
  specializations: string[];
}

export interface TrainerFilterOptionsDto {
  cities: string[];
  trainerTypes: string[];
  specialties: string[];
}

export interface VenueFilterOptionsDto {
  cities: string[];
  types: CourseType[];
}

export interface ScheduleEntryFilterOptionsDto {
  cities: string[];
  statuses: ScheduleStatus[];
  months: string[];
  hasConflicts: boolean[];
}

export interface TaskFilterOptionsDto {
  statuses: TaskStatus[];
  types: string[];
}

export interface WorkspaceDto {
  id: number;
  name: string;
  description: string | null;
  year: number;
  status: WorkspaceStatus;
  color: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CourseDto {
  id: number;
  workspaceId: number;
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
  id: number;
  workspaceId: number;
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
  id: number;
  workspaceId: number;
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
  id: number;
  workspaceId: number;
  date: string;
  isWorkDay: boolean;
  isHoliday: boolean;
  createdAt: string;
}

export interface AssignmentDto {
  id: number;
  workspaceId: number;
  trainerId: number;
  courseId: number;
  createdAt: string;
}

export interface ScheduleEntryDto {
  id: number;
  workspaceId: number;
  courseId: number;
  courseName: string;
  trainerId: number;
  trainerName: string;
  venueId: number | null;
  venueName: string | null;
  startDate: string;
  endDate: string;
  status: ScheduleStatus;
  conflictNotes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDto {
  id: number;
  workspaceId: number;
  status: TaskStatus;
  type: string | null;
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

function query(params?: PageParams): string {
  if (!params) return '';
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    if (Array.isArray(value)) {
      value.forEach((item) => search.append(key, String(item)));
      return;
    }
    search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `?${qs}` : '';
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
    update: (id: number, body: { name: string; description?: string | null; year: number; color?: string | null }) =>
      request<WorkspaceDto>(`/api/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (id: number, status: WorkspaceStatus) =>
      request<WorkspaceDto>(`/api/workspaces/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (id: number) => request<void>(`/api/workspaces/${id}`, { method: 'DELETE' }),
  },
  courses: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<CourseDto>>(`/api/workspaces/${workspaceId}/courses${query(params)}`),
    listAll: (workspaceId: number) => request<CourseDto[]>(`/api/workspaces/${workspaceId}/courses/all`),
    filterOptions: (workspaceId: number) => request<CourseFilterOptionsDto>(`/api/workspaces/${workspaceId}/courses/filter-options`),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      request<CourseDto>(`/api/workspaces/${workspaceId}/courses`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      request<CourseDto>(`/api/workspaces/${workspaceId}/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/courses/${id}`, { method: 'DELETE' }),
  },
  trainers: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<TrainerDto>>(`/api/workspaces/${workspaceId}/trainers${query(params)}`),
    listAll: (workspaceId: number) => request<TrainerDto[]>(`/api/workspaces/${workspaceId}/trainers/all`),
    filterOptions: (workspaceId: number) => request<TrainerFilterOptionsDto>(`/api/workspaces/${workspaceId}/trainers/filter-options`),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      request<TrainerDto>(`/api/workspaces/${workspaceId}/trainers`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      request<TrainerDto>(`/api/workspaces/${workspaceId}/trainers/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/trainers/${id}`, { method: 'DELETE' }),
  },
  venues: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<VenueDto>>(`/api/workspaces/${workspaceId}/venues${query(params)}`),
    listAll: (workspaceId: number) => request<VenueDto[]>(`/api/workspaces/${workspaceId}/venues/all`),
    filterOptions: (workspaceId: number) => request<VenueFilterOptionsDto>(`/api/workspaces/${workspaceId}/venues/filter-options`),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      request<VenueDto>(`/api/workspaces/${workspaceId}/venues`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      request<VenueDto>(`/api/workspaces/${workspaceId}/venues/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/venues/${id}`, { method: 'DELETE' }),
  },
  calendarDays: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<CalendarDayDto>>(`/api/workspaces/${workspaceId}/calendar-days${query(params)}`),
    listAll: (workspaceId: number) => request<CalendarDayDto[]>(`/api/workspaces/${workspaceId}/calendar-days/all`),
    create: (workspaceId: number, body: { date: string; isWorkDay: boolean; isHoliday: boolean }) =>
      request<CalendarDayDto>(`/api/workspaces/${workspaceId}/calendar-days`, { method: 'POST', body: JSON.stringify(body) }),
    bulkCreate: (workspaceId: number, body: { date: string; isWorkDay: boolean; isHoliday: boolean }[]) =>
      request<CalendarDayDto[]>(`/api/workspaces/${workspaceId}/calendar-days/bulk`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: number, id: number, body: { date: string; isWorkDay: boolean; isHoliday: boolean }) =>
      request<CalendarDayDto>(`/api/workspaces/${workspaceId}/calendar-days/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/calendar-days/${id}`, { method: 'DELETE' }),
  },
  assignments: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<AssignmentDto>>(`/api/workspaces/${workspaceId}/assignments${query(params)}`),
    listAll: (workspaceId: number) => request<AssignmentDto[]>(`/api/workspaces/${workspaceId}/assignments/all`),
    create: (workspaceId: number, body: { trainerId: number; courseId: number }) =>
      request<AssignmentDto>(`/api/workspaces/${workspaceId}/assignments`, { method: 'POST', body: JSON.stringify(body) }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/assignments/${id}`, { method: 'DELETE' }),
  },
  scheduleEntries: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<ScheduleEntryDto>>(`/api/workspaces/${workspaceId}/schedule-entries${query(params)}`),
    listAll: (workspaceId: number) => request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/all`),
    filterOptions: (workspaceId: number) => request<ScheduleEntryFilterOptionsDto>(`/api/workspaces/${workspaceId}/schedule-entries/filter-options`),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      request<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries`, { method: 'POST', body: JSON.stringify(body) }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      request<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
    updateStatus: (workspaceId: number, id: number, status: ScheduleStatus) =>
      request<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/schedule-entries/${id}`, { method: 'DELETE' }),
    venueConflicts: (workspaceId: number, venueId: number, startDate: string, endDate: string) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/conflicts/venue?venueId=${encodeURIComponent(venueId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
    trainerConflicts: (workspaceId: number, trainerId: number, startDate: string, endDate: string) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/conflicts/trainer?trainerId=${encodeURIComponent(trainerId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
  },
  tasks: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<TaskDto>>(`/api/workspaces/${workspaceId}/tasks${query(params)}`),
    listAll: (workspaceId: number) => request<TaskDto[]>(`/api/workspaces/${workspaceId}/tasks/all`),
    filterOptions: (workspaceId: number) => request<TaskFilterOptionsDto>(`/api/workspaces/${workspaceId}/tasks/filter-options`),
    get: (workspaceId: number, id: number) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}`),
    create: (workspaceId: number) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks`, { method: 'POST' }),
    start: (workspaceId: number, id: number) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/start`, { method: 'POST' }),
    complete: (workspaceId: number, id: number, log: string) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/complete`, { method: 'POST', body: log }),
    fail: (workspaceId: number, id: number, log: string) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/fail`, { method: 'POST', body: log }),
    delete: (workspaceId: number, id: number) => request<void>(`/api/workspaces/${workspaceId}/tasks/${id}`, { method: 'DELETE' }),
  },
  schedule: {
    run: (workspaceId: number, mode: 'new' | 'update') =>
      request<TaskDto>(`/api/workspaces/${workspaceId}/schedule?mode=${mode}`, { method: 'POST' }),
  },
  importExcel: async (workspaceId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<ImportResultDto>(`/api/workspaces/${workspaceId}/import`, { method: 'POST', body: form });
  },
  exportExcel: (workspaceId: number, params?: { sheets?: string[]; type?: string }) => {
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
  return ({ DRAFT: 'Draft', IMPORTED: 'Imported', OPTIMIZED: 'Optimized', DISABLED: 'Disabled' } as const)[status];
}

export function uiToWorkspaceStatus(status: 'Draft' | 'Imported' | 'Optimized' | 'Disabled'): WorkspaceStatus {
  return ({ Draft: 'DRAFT', Imported: 'IMPORTED', Optimized: 'OPTIMIZED', Disabled: 'DISABLED' } as const)[status];
}

export function courseTypeLabel(type: CourseType): 'In-person' | 'Online' | 'External' {
  return ({ IN_PERSON: 'In-person', ONLINE: 'Online', EXTERNAL: 'External' } as const)[type];
}

export function uiToCourseType(type: string): CourseType {
  return type === 'Online' ? 'ONLINE' : type === 'External' ? 'EXTERNAL' : 'IN_PERSON';
}

export function scheduleStatusLabel(status: ScheduleStatus, conflictNotes?: string | null): 'Scheduled' | 'Confirmed' | 'Completed' | 'Conflict' {
  if (conflictNotes) return 'Conflict';
  return ({ SCHEDULED: 'Scheduled', CONFIRMED: 'Confirmed', COMPLETED: 'Completed' } as const)[status];
}

export function uiToScheduleStatus(status: 'Scheduled' | 'Confirmed' | 'Completed'): ScheduleStatus {
  return ({ Scheduled: 'SCHEDULED', Confirmed: 'CONFIRMED', Completed: 'COMPLETED' } as const)[status];
}

export function taskStatusLabel(status: TaskStatus): 'Pending' | 'Running' | 'Completed' | 'Failed' {
  return ({ PENDING: 'Pending', RUNNING: 'Running', COMPLETED: 'Completed', FAILED: 'Failed' } as const)[status];
}
