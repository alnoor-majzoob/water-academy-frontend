import { cachedRequest, clearApiCache, invalidateCache, type CacheOptions } from './apiCache';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

const TTL = {
  dashboard: 90_000,
  workspaceList: 180_000,
  list: 90_000,
  listAll: 180_000,
  filterOptions: 900_000,
  calendar: 180_000,
  assignments: 90_000,
} as const;

type ApiRequestInit = Omit<RequestInit, 'cache'> & { cache?: CacheOptions };

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
  cvAnalyzed: boolean;
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
  venueCity: string | null;
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

export interface MatchingRecommendedTrainer {
  trainerId: number;
  trainerNumber: string;
  trainerName: string;
  jobTitle: string;
  score: number;
  localScore: number;
  aiScore: number | null;
  matchMethod: string;
  fitLevel: string | null;
  reasons: string[];
  risks: string[];
  topics: string[];
}

export interface MatchingRecommendationResult {
  ok: boolean;
  planId: number;
  recommendedTrainers: MatchingRecommendedTrainer[];
  proposal: { trainerId: number | null };
  matching: { enabled: boolean; used: boolean; provider?: string; model?: string; durationMs?: number; error?: string };
}

export interface MatchingProfileResult {
  profile: Record<string, unknown>;
  cvText: string;
  cvFilename: string;
  ai: { provider: string; model: string; durationMs: number };
}

export interface MatchingTrainer {
  id: number;
  trainerId: string;
  fullName: string;
  profile: Record<string, unknown>;
  createdAt: string;
}

export interface MatchingTrainerDetail extends MatchingTrainer {
  cvText: string;
  cvFilename: string;
}

export interface MatchingPlanDto {
  id: number;
  courseName: string;
  courseDesc: string;
  attendees: number;
  proposedTrainerId: number | null;
  assignedTrainerId: number | null;
  matchScore: number | null;
  matchReasons: string[];
  status: string;
  trainerName: string | null;
  trainerNumber: string | null;
  createdAt: string;
}

export interface MatchingCoursePlanResponse {
  ok: boolean;
  plan: MatchingPlanDto;
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

export interface DashboardDto {
  totalCourses: number;
  scheduledCourses: number;
  unscheduledCourses: number;
  totalTrainers: number;
  totalVenues: number;
  conflicts: number;
  coursesByMonth: number[];
  coursesByType: {
    inPerson: number;
    online: number;
    external: number;
  };
  trainerUtilization: {
    trainerId: number;
    trainerName: string;
    scheduledDays: number;
    maxDaysPerMonth: number;
  }[];
  upcomingSessions: {
    id: number;
    courseName: string;
    trainerName: string;
    startDate: string;
    status: ScheduleStatus;
    hasConflict: boolean;
  }[];
}

async function request<T>(path: string, init?: ApiRequestInit): Promise<T> {
  const { cache, ...fetchInit } = init || {};
  const method = (fetchInit.method || 'GET').toUpperCase();
  const canCache = method === 'GET' && cache && cache.ttlMs && !(fetchInit.body instanceof FormData);
  const fetcher = async () => {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
        ...(fetchInit.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
        ...(fetchInit.headers || {}),
    },
      ...fetchInit,
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
  };

  if (!canCache) return fetcher();
  return cachedRequest<T>(cache.key || path, cache, fetcher);
}

function invalidateWorkspace(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/`);
}

function invalidateDashboard(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/dashboard`);
}

function invalidateCourses(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/courses`);
}

function invalidateTrainers(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/trainers`);
}

function invalidateVenues(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/venues`);
}

function invalidateSchedule(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/schedule-entries`);
}

function invalidateAssignments(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/assignments`);
}

function invalidateCalendar(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/calendar-days`);
}

function invalidateTasks(workspaceId: number) {
  invalidateCache(`/api/workspaces/${workspaceId}/tasks`);
}

async function mutate<T>(path: string, init: ApiRequestInit, after?: () => void): Promise<T> {
  const data = await request<T>(path, init);
  after?.();
  return data;
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
  cache: {
    clear: clearApiCache,
    invalidateWorkspace,
    invalidateDashboard,
    invalidateCourses,
    invalidateTrainers,
    invalidateVenues,
    invalidateSchedule,
    invalidateAssignments,
    invalidateCalendar,
    invalidateTasks,
  },
  dashboard: {
    get: (workspaceId: number, options?: CacheOptions) =>
      request<DashboardDto>(`/api/workspaces/${workspaceId}/dashboard`, { cache: { ttlMs: TTL.dashboard, ...options } }),
  },
  workspaces: {
    list: (options?: CacheOptions) => request<WorkspaceDto[]>('/api/workspaces', { cache: { ttlMs: TTL.workspaceList, ...options } }),
    create: (body: { name: string; description?: string | null; year: number; color?: string | null }) =>
      mutate<WorkspaceDto>('/api/workspaces', { method: 'POST', body: JSON.stringify(body) }, () => invalidateCache('/api/workspaces')),
    update: (id: number, body: { name: string; description?: string | null; year: number; color?: string | null }) =>
      mutate<WorkspaceDto>(`/api/workspaces/${id}`, { method: 'PUT', body: JSON.stringify(body) }, () => invalidateCache('/api/workspaces')),
    updateStatus: (id: number, status: WorkspaceStatus) =>
      mutate<WorkspaceDto>(`/api/workspaces/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, () => invalidateCache('/api/workspaces')),
    delete: (id: number) => mutate<void>(`/api/workspaces/${id}`, { method: 'DELETE' }, () => invalidateCache('/api/workspaces')),
  },
  courses: {
    list: (workspaceId: number, params?: PageParams, options?: CacheOptions) =>
      request<PageResponse<CourseDto>>(`/api/workspaces/${workspaceId}/courses${query(params)}`, { cache: { ttlMs: TTL.list, ...options } }),
    listAll: (workspaceId: number, options?: CacheOptions) =>
      request<CourseDto[]>(`/api/workspaces/${workspaceId}/courses/all`, { cache: { ttlMs: TTL.listAll, ...options } }),
    filterOptions: (workspaceId: number, options?: CacheOptions) =>
      request<CourseFilterOptionsDto>(`/api/workspaces/${workspaceId}/courses/filter-options`, { cache: { ttlMs: TTL.filterOptions, ...options } }),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      mutate<CourseDto>(`/api/workspaces/${workspaceId}/courses`, { method: 'POST', body: JSON.stringify(body) }, () => {
        invalidateCourses(workspaceId); invalidateDashboard(workspaceId); invalidateAssignments(workspaceId); invalidateSchedule(workspaceId);
      }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      mutate<CourseDto>(`/api/workspaces/${workspaceId}/courses/${id}`, { method: 'PUT', body: JSON.stringify(body) }, () => {
        invalidateCourses(workspaceId); invalidateDashboard(workspaceId); invalidateAssignments(workspaceId); invalidateSchedule(workspaceId);
      }),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/courses/${id}`, { method: 'DELETE' }, () => {
      invalidateCourses(workspaceId); invalidateDashboard(workspaceId); invalidateAssignments(workspaceId); invalidateSchedule(workspaceId);
    }),
  },
  trainers: {
    list: (workspaceId: number, params?: PageParams, options?: CacheOptions) =>
      request<PageResponse<TrainerDto>>(`/api/workspaces/${workspaceId}/trainers${query(params)}`, { cache: { ttlMs: TTL.list, ...options } }),
    listAll: (workspaceId: number, options?: CacheOptions) =>
      request<TrainerDto[]>(`/api/workspaces/${workspaceId}/trainers/all`, { cache: { ttlMs: TTL.listAll, ...options } }),
    filterOptions: (workspaceId: number, options?: CacheOptions) =>
      request<TrainerFilterOptionsDto>(`/api/workspaces/${workspaceId}/trainers/filter-options`, { cache: { ttlMs: TTL.filterOptions, ...options } }),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      mutate<TrainerDto>(`/api/workspaces/${workspaceId}/trainers`, { method: 'POST', body: JSON.stringify(body) }, () => {
        invalidateTrainers(workspaceId); invalidateDashboard(workspaceId); invalidateAssignments(workspaceId); invalidateSchedule(workspaceId);
      }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      mutate<TrainerDto>(`/api/workspaces/${workspaceId}/trainers/${id}`, { method: 'PUT', body: JSON.stringify(body) }, () => {
        invalidateTrainers(workspaceId); invalidateDashboard(workspaceId); invalidateAssignments(workspaceId); invalidateSchedule(workspaceId);
      }),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/trainers/${id}`, { method: 'DELETE' }, () => {
      invalidateTrainers(workspaceId); invalidateDashboard(workspaceId); invalidateAssignments(workspaceId); invalidateSchedule(workspaceId);
    }),
  },
  venues: {
    list: (workspaceId: number, params?: PageParams, options?: CacheOptions) =>
      request<PageResponse<VenueDto>>(`/api/workspaces/${workspaceId}/venues${query(params)}`, { cache: { ttlMs: TTL.list, ...options } }),
    listAll: (workspaceId: number, options?: CacheOptions) =>
      request<VenueDto[]>(`/api/workspaces/${workspaceId}/venues/all`, { cache: { ttlMs: TTL.listAll, ...options } }),
    filterOptions: (workspaceId: number, options?: CacheOptions) =>
      request<VenueFilterOptionsDto>(`/api/workspaces/${workspaceId}/venues/filter-options`, { cache: { ttlMs: TTL.filterOptions, ...options } }),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      mutate<VenueDto>(`/api/workspaces/${workspaceId}/venues`, { method: 'POST', body: JSON.stringify(body) }, () => {
        invalidateVenues(workspaceId); invalidateDashboard(workspaceId); invalidateSchedule(workspaceId);
      }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      mutate<VenueDto>(`/api/workspaces/${workspaceId}/venues/${id}`, { method: 'PUT', body: JSON.stringify(body) }, () => {
        invalidateVenues(workspaceId); invalidateDashboard(workspaceId); invalidateSchedule(workspaceId);
      }),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/venues/${id}`, { method: 'DELETE' }, () => {
      invalidateVenues(workspaceId); invalidateDashboard(workspaceId); invalidateSchedule(workspaceId);
    }),
  },
  calendarDays: {
    list: (workspaceId: number, params?: PageParams, options?: CacheOptions) =>
      request<PageResponse<CalendarDayDto>>(`/api/workspaces/${workspaceId}/calendar-days${query(params)}`, { cache: { ttlMs: TTL.calendar, ...options } }),
    listAll: (workspaceId: number, options?: CacheOptions) =>
      request<CalendarDayDto[]>(`/api/workspaces/${workspaceId}/calendar-days/all`, { cache: { ttlMs: TTL.calendar, ...options } }),
    create: (workspaceId: number, body: { date: string; isWorkDay: boolean; isHoliday: boolean }) =>
      mutate<CalendarDayDto>(`/api/workspaces/${workspaceId}/calendar-days`, { method: 'POST', body: JSON.stringify(body) }, () => invalidateCalendar(workspaceId)),
    bulkCreate: (workspaceId: number, body: { date: string; isWorkDay: boolean; isHoliday: boolean }[]) =>
      mutate<CalendarDayDto[]>(`/api/workspaces/${workspaceId}/calendar-days/bulk`, { method: 'POST', body: JSON.stringify(body) }, () => invalidateCalendar(workspaceId)),
    update: (workspaceId: number, id: number, body: { date: string; isWorkDay: boolean; isHoliday: boolean }) =>
      mutate<CalendarDayDto>(`/api/workspaces/${workspaceId}/calendar-days/${id}`, { method: 'PUT', body: JSON.stringify(body) }, () => invalidateCalendar(workspaceId)),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/calendar-days/${id}`, { method: 'DELETE' }, () => invalidateCalendar(workspaceId)),
  },
  assignments: {
    list: (workspaceId: number, params?: PageParams, options?: CacheOptions) =>
      request<PageResponse<AssignmentDto>>(`/api/workspaces/${workspaceId}/assignments${query(params)}`, { cache: { ttlMs: TTL.assignments, ...options } }),
    listAll: (workspaceId: number, options?: CacheOptions) =>
      request<AssignmentDto[]>(`/api/workspaces/${workspaceId}/assignments/all`, { cache: { ttlMs: TTL.assignments, ...options } }),
    create: (workspaceId: number, body: { trainerId: number; courseId: number }) =>
      mutate<AssignmentDto>(`/api/workspaces/${workspaceId}/assignments`, { method: 'POST', body: JSON.stringify(body) }, () => {
        invalidateAssignments(workspaceId); invalidateDashboard(workspaceId);
      }),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/assignments/${id}`, { method: 'DELETE' }, () => {
      invalidateAssignments(workspaceId); invalidateDashboard(workspaceId);
    }),
  },
  scheduleEntries: {
    list: (workspaceId: number, params?: PageParams, options?: CacheOptions) =>
      request<PageResponse<ScheduleEntryDto>>(`/api/workspaces/${workspaceId}/schedule-entries${query(params)}`, { cache: { ttlMs: TTL.list, ...options } }),
    listAll: (workspaceId: number, options?: CacheOptions) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/all`, { cache: { ttlMs: TTL.listAll, ...options } }),
    filterOptions: (workspaceId: number, options?: CacheOptions) =>
      request<ScheduleEntryFilterOptionsDto>(`/api/workspaces/${workspaceId}/schedule-entries/filter-options`, { cache: { ttlMs: TTL.filterOptions, ...options } }),
    create: (workspaceId: number, body: Record<string, unknown>) =>
      mutate<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries`, { method: 'POST', body: JSON.stringify(body) }, () => {
        invalidateSchedule(workspaceId); invalidateDashboard(workspaceId); invalidateCourses(workspaceId);
      }),
    update: (workspaceId: number, id: number, body: Record<string, unknown>) =>
      mutate<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries/${id}`, { method: 'PUT', body: JSON.stringify(body) }, () => {
        invalidateSchedule(workspaceId); invalidateDashboard(workspaceId); invalidateCourses(workspaceId);
      }),
    updateStatus: (workspaceId: number, id: number, status: ScheduleStatus) =>
      mutate<ScheduleEntryDto>(`/api/workspaces/${workspaceId}/schedule-entries/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }, () => {
        invalidateSchedule(workspaceId); invalidateDashboard(workspaceId);
      }),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/schedule-entries/${id}`, { method: 'DELETE' }, () => {
      invalidateSchedule(workspaceId); invalidateDashboard(workspaceId); invalidateCourses(workspaceId);
    }),
    venueConflicts: (workspaceId: number, venueId: number, startDate: string, endDate: string) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/conflicts/venue?venueId=${encodeURIComponent(venueId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
    trainerConflicts: (workspaceId: number, trainerId: number, startDate: string, endDate: string) =>
      request<ScheduleEntryDto[]>(`/api/workspaces/${workspaceId}/schedule-entries/conflicts/trainer?trainerId=${encodeURIComponent(trainerId)}&startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`),
  },
  tasks: {
    list: (workspaceId: number, params?: PageParams) => request<PageResponse<TaskDto>>(`/api/workspaces/${workspaceId}/tasks${query(params)}`),
    listAll: (workspaceId: number) => request<TaskDto[]>(`/api/workspaces/${workspaceId}/tasks/all`),
    filterOptions: (workspaceId: number, options?: CacheOptions) =>
      request<TaskFilterOptionsDto>(`/api/workspaces/${workspaceId}/tasks/filter-options`, { cache: { ttlMs: TTL.filterOptions, ...options } }),
    get: (workspaceId: number, id: number) => request<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}`),
    create: (workspaceId: number) => mutate<TaskDto>(`/api/workspaces/${workspaceId}/tasks`, { method: 'POST' }, () => invalidateTasks(workspaceId)),
    start: (workspaceId: number, id: number) => mutate<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/start`, { method: 'POST' }, () => invalidateTasks(workspaceId)),
    complete: (workspaceId: number, id: number, log: string) => mutate<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/complete`, { method: 'POST', body: log }, () => invalidateTasks(workspaceId)),
    fail: (workspaceId: number, id: number, log: string) => mutate<TaskDto>(`/api/workspaces/${workspaceId}/tasks/${id}/fail`, { method: 'POST', body: log }, () => invalidateTasks(workspaceId)),
    delete: (workspaceId: number, id: number) => mutate<void>(`/api/workspaces/${workspaceId}/tasks/${id}`, { method: 'DELETE' }, () => invalidateTasks(workspaceId)),
  },
  schedule: {
    run: (workspaceId: number, mode: 'new' | 'update') =>
      mutate<TaskDto>(`/api/workspaces/${workspaceId}/schedule?mode=${mode}`, { method: 'POST' }, () => {
        invalidateTasks(workspaceId); invalidateSchedule(workspaceId); invalidateDashboard(workspaceId);
      }),
  },
  importExcel: async (workspaceId: number, file: File) => {
    const form = new FormData();
    form.append('file', file);
    return mutate<ImportResultDto>(`/api/workspaces/${workspaceId}/import`, { method: 'POST', body: form }, () => {
      invalidateWorkspace(workspaceId); invalidateCache('/api/workspaces');
    });
  },
  exportExcel: (workspaceId: number, params?: { sheets?: string[]; type?: string }) => {
    const query = new URLSearchParams();
    if (params?.sheets?.length) query.set('sheets', params.sheets.join(','));
    if (params?.type) query.set('type', params.type);
    const qs = query.toString();
    return download(`/api/workspaces/${workspaceId}/export${qs ? '?' + qs : ''}`);
  },
  matching: {
    health: (workspaceId: number) =>
      request<Record<string, unknown>>(`/api/workspaces/${workspaceId}/matching/health`),
    settings: (workspaceId: number) =>
      request<Record<string, unknown>>(`/api/workspaces/${workspaceId}/matching/settings`),
    analyzeCv: (workspaceId: number, formData: FormData) =>
      mutate<MatchingProfileResult>(`/api/workspaces/${workspaceId}/matching/trainers/analyze`, { method: 'POST', body: formData }),
    saveTrainer: (workspaceId: number, body: Record<string, unknown>) =>
      mutate<Record<string, unknown>>(`/api/workspaces/${workspaceId}/matching/trainers`, { method: 'POST', body: JSON.stringify(body) }),
    listTrainers: (workspaceId: number) =>
      request<{ trainers: MatchingTrainer[] }>(`/api/workspaces/${workspaceId}/matching/trainers`),
    getTrainerByTrainerId: (workspaceId: number, trainerId: string) =>
      request<MatchingTrainerDetail>(`/api/workspaces/${workspaceId}/matching/trainers/by-trainer-id/${trainerId}`),
    deleteTrainer: (workspaceId: number, id: number) =>
      mutate<Record<string, unknown>>(`/api/workspaces/${workspaceId}/matching/trainers/${id}`, { method: 'DELETE' }),
    recommend: (workspaceId: number, body: Record<string, unknown>) =>
      mutate<MatchingRecommendationResult>(`/api/workspaces/${workspaceId}/matching/recommendations`, { method: 'POST', body: JSON.stringify(body) }),
    assignTrainer: (workspaceId: number, planId: number, body: Record<string, unknown>) =>
      mutate<MatchingCoursePlanResponse>(`/api/workspaces/${workspaceId}/matching/course-plans/${planId}/assign`, { method: 'POST', body: JSON.stringify(body) }),
    listPlans: (workspaceId: number) =>
      request<{ plans: MatchingPlanDto[] }>(`/api/workspaces/${workspaceId}/matching/course-plans`),
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
