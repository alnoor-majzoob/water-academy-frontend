export type Lang = 'ar' | 'en';
export type Theme = 'light' | 'dark';

export interface Workspace {
  id: string;
  name: string;
  nameEn: string;
  year: number;
  status: 'Draft' | 'Imported' | 'Optimized' | 'Disabled';
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  externalId: string;
  name: string;
  nameEn: string;
  specialization: string;
  durationDays: number;
  hoursPerDay: number;
  expectedTrainees: number;
  city: string;
  beneficiary: string;
  priority: 'High' | 'Medium' | 'Low';
  type: 'In-person' | 'Online' | 'External';
  earliestStart: string;
  latestEnd: string;
  fixedDate: boolean;
  notes: string;
  color: string;
}

export interface Trainer {
  id: string;
  externalId: string;
  name: string;
  nameEn: string;
  specialties: string[];
  city: string;
  trainerType: 'Internal' | 'External' | 'Freelance';
  unavailableDates: string[];
  maxDaysPerMonth: number;
  maxConsecutiveDays: number;
  costPerDay: number;
  notes: string;
}

export interface Venue {
  id: string;
  externalId: string;
  name: string;
  nameEn: string;
  city: string;
  type: 'Classroom' | 'Lab' | 'Conference' | 'Online';
  capacity: number;
  availableFrom: string;
  availableTo: string;
  unavailableDates: string[];
  equipmentNotes: string;
}

export interface ScheduleEntry {
  id: string;
  courseId: string;
  courseName: string;
  courseNameEn: string;
  trainerId: string;
  trainerName: string;
  venueId: string;
  venueName: string;
  city: string;
  startDate: string;
  endDate: string;
  status: 'Scheduled' | 'Confirmed' | 'Completed' | 'Conflict' | 'Unscheduled';
  hasConflict: boolean;
  notes: string;
}

export interface Conflict {
  id: string;
  type: 'Trainer' | 'Venue' | 'DateOverlap' | 'Capacity' | 'Holiday' | 'Mismatch';
  severity: 'Critical' | 'Warning' | 'Info';
  description: string;
  descriptionEn: string;
  affectedEntries: string[];
  resolved: boolean;
}

export interface Task {
  id: string;
  workspace: string;
  type: string;
  status: 'Pending' | 'Running' | 'Completed' | 'Failed';
  startedAt: string;
  completedAt?: string;
  log: string[];
  progress: number;
}

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  courseNameEn: string;
  trainerId: string;
  trainerName: string;
  trainerNameEn: string;
  assignedDate: string;
  specialty: string;
}

// ─── Mock Data ───────────────────────────────────────────────────────────────

export const workspaces: Workspace[] = [
  { id: 'ws1', name: 'خطة التدريب 2025', nameEn: 'Training Plan 2025', year: 2025, status: 'Optimized', color: '#3B82F6', createdAt: '2024-12-01', updatedAt: '2025-01-15' },
  { id: 'ws2', name: 'خطة التدريب 2024', nameEn: 'Training Plan 2024', year: 2024, status: 'Disabled', color: '#10B981', createdAt: '2023-11-20', updatedAt: '2024-12-30' },
  { id: 'ws3', name: 'خطة التدريب 2026', nameEn: 'Training Plan 2026', year: 2026, status: 'Draft', color: '#F59E0B', createdAt: '2025-01-01', updatedAt: '2025-01-10' },
];

export const courses: Course[] = [
  { id: 'c1', externalId: 'CRS-001', name: 'إدارة المشاريع المتقدمة', nameEn: 'Advanced Project Management', specialization: 'إدارة', durationDays: 5, hoursPerDay: 8, expectedTrainees: 20, city: 'الرياض', beneficiary: 'قسم المشاريع', priority: 'High', type: 'In-person', earliestStart: '2025-01-15', latestEnd: '2025-03-30', fixedDate: false, notes: '', color: '#3B82F6' },
  { id: 'c2', externalId: 'CRS-002', name: 'السلامة والصحة المهنية', nameEn: 'Occupational Health & Safety', specialization: 'سلامة', durationDays: 3, hoursPerDay: 7, expectedTrainees: 30, city: 'جدة', beneficiary: 'جميع الأقسام', priority: 'High', type: 'In-person', earliestStart: '2025-02-01', latestEnd: '2025-04-30', fixedDate: false, notes: 'إلزامي', color: '#EF4444' },
  { id: 'c3', externalId: 'CRS-003', name: 'تحليل البيانات باستخدام Excel', nameEn: 'Data Analysis with Excel', specialization: 'تقنية', durationDays: 2, hoursPerDay: 6, expectedTrainees: 15, city: 'الرياض', beneficiary: 'قسم المالية', priority: 'Medium', type: 'In-person', earliestStart: '2025-03-01', latestEnd: '2025-05-31', fixedDate: false, notes: '', color: '#10B981' },
  { id: 'c4', externalId: 'CRS-004', name: 'القيادة والإدارة التنفيذية', nameEn: 'Executive Leadership', specialization: 'قيادة', durationDays: 4, hoursPerDay: 8, expectedTrainees: 12, city: 'الدمام', beneficiary: 'الإدارة العليا', priority: 'High', type: 'External', earliestStart: '2025-02-15', latestEnd: '2025-04-15', fixedDate: false, notes: '', color: '#8B5CF6' },
  { id: 'c5', externalId: 'CRS-005', name: 'إدارة العقود والمشتريات', nameEn: 'Contracts & Procurement Management', specialization: 'إدارة', durationDays: 3, hoursPerDay: 7, expectedTrainees: 18, city: 'جدة', beneficiary: 'قسم المشتريات', priority: 'Medium', type: 'In-person', earliestStart: '2025-04-01', latestEnd: '2025-06-30', fixedDate: false, notes: '', color: '#F59E0B' },
  { id: 'c6', externalId: 'CRS-006', name: 'التحول الرقمي وتقنية المعلومات', nameEn: 'Digital Transformation & IT', specialization: 'تقنية', durationDays: 5, hoursPerDay: 8, expectedTrainees: 25, city: 'الرياض', beneficiary: 'قسم تقنية المعلومات', priority: 'High', type: 'Online', earliestStart: '2025-01-20', latestEnd: '2025-03-31', fixedDate: false, notes: '', color: '#06B6D4' },
  { id: 'c7', externalId: 'CRS-007', name: 'إدارة الجودة الشاملة', nameEn: 'Total Quality Management', specialization: 'جودة', durationDays: 4, hoursPerDay: 7, expectedTrainees: 22, city: 'الدمام', beneficiary: 'قسم الجودة', priority: 'Medium', type: 'In-person', earliestStart: '2025-05-01', latestEnd: '2025-07-31', fixedDate: false, notes: '', color: '#F97316' },
  { id: 'c8', externalId: 'CRS-008', name: 'المالية للمديرين غير الماليين', nameEn: 'Finance for Non-Finance Managers', specialization: 'مالية', durationDays: 2, hoursPerDay: 8, expectedTrainees: 16, city: 'الرياض', beneficiary: 'الإدارة الوسطى', priority: 'Low', type: 'In-person', earliestStart: '2025-06-01', latestEnd: '2025-08-31', fixedDate: false, notes: '', color: '#EC4899' },
];

export const trainers: Trainer[] = [
  { id: 't1', externalId: 'TRN-001', name: 'أحمد محمد الغامدي', nameEn: 'Ahmed Mohammed Al-Ghamdi', specialties: ['إدارة المشاريع', 'القيادة'], city: 'الرياض', trainerType: 'Internal', unavailableDates: ['2025-02-10', '2025-02-11'], maxDaysPerMonth: 20, maxConsecutiveDays: 5, costPerDay: 1500, notes: '' },
  { id: 't2', externalId: 'TRN-002', name: 'فاطمة علي الزهراني', nameEn: 'Fatima Ali Al-Zahrani', specialties: ['السلامة المهنية', 'إدارة المخاطر'], city: 'جدة', trainerType: 'Internal', unavailableDates: [], maxDaysPerMonth: 18, maxConsecutiveDays: 4, costPerDay: 1200, notes: '' },
  { id: 't3', externalId: 'TRN-003', name: 'خالد عبدالله السعدي', nameEn: 'Khalid Abdullah Al-Saadi', specialties: ['تقنية المعلومات', 'البيانات'], city: 'الرياض', trainerType: 'External', unavailableDates: ['2025-03-15'], maxDaysPerMonth: 15, maxConsecutiveDays: 5, costPerDay: 2000, notes: 'متخصص في التحليل' },
  { id: 't4', externalId: 'TRN-004', name: 'نورة سعد العتيبي', nameEn: 'Noura Saad Al-Otaibi', specialties: ['القيادة', 'الإدارة التنفيذية'], city: 'الدمام', trainerType: 'Freelance', unavailableDates: [], maxDaysPerMonth: 12, maxConsecutiveDays: 3, costPerDay: 2500, notes: '' },
  { id: 't5', externalId: 'TRN-005', name: 'سعد محمد الدوسري', nameEn: 'Saad Mohammed Al-Dosari', specialties: ['المشتريات', 'العقود', 'إدارة'], city: 'جدة', trainerType: 'Internal', unavailableDates: [], maxDaysPerMonth: 20, maxConsecutiveDays: 5, costPerDay: 1300, notes: '' },
];

export const venues: Venue[] = [
  { id: 'v1', externalId: 'VEN-001', name: 'قاعة المؤتمرات الرئيسية', nameEn: 'Main Conference Hall', city: 'الرياض', type: 'Conference', capacity: 50, availableFrom: '08:00', availableTo: '17:00', unavailableDates: [], equipmentNotes: 'شاشة عرض، وايت بورد، نظام صوت' },
  { id: 'v2', externalId: 'VEN-002', name: 'قاعة التدريب أ', nameEn: 'Training Room A', city: 'الرياض', type: 'Classroom', capacity: 25, availableFrom: '08:00', availableTo: '17:00', unavailableDates: ['2025-02-05'], equipmentNotes: 'أجهزة كمبيوتر، شاشة' },
  { id: 'v3', externalId: 'VEN-003', name: 'مركز التدريب جدة', nameEn: 'Jeddah Training Center', city: 'جدة', type: 'Classroom', capacity: 30, availableFrom: '08:00', availableTo: '18:00', unavailableDates: [], equipmentNotes: 'مجهز بالكامل' },
  { id: 'v4', externalId: 'VEN-004', name: 'معمل الحاسب - الدمام', nameEn: 'Computer Lab - Dammam', city: 'الدمام', type: 'Lab', capacity: 20, availableFrom: '09:00', availableTo: '17:00', unavailableDates: [], equipmentNotes: '20 جهاز كمبيوتر، إنترنت' },
  { id: 'v5', externalId: 'VEN-005', name: 'قاعة افتراضية', nameEn: 'Virtual Room', city: 'أونلاين', type: 'Online', capacity: 100, availableFrom: '00:00', availableTo: '23:59', unavailableDates: [], equipmentNotes: 'Teams / Zoom' },
];

export const scheduleEntries: ScheduleEntry[] = [
  { id: 'se1', courseId: 'c1', courseName: 'إدارة المشاريع المتقدمة', courseNameEn: 'Advanced Project Management', trainerId: 't1', trainerName: 'أحمد الغامدي', venueId: 'v1', venueName: 'قاعة المؤتمرات', city: 'الرياض', startDate: '2025-01-20', endDate: '2025-01-24', status: 'Confirmed', hasConflict: false, notes: '' },
  { id: 'se2', courseId: 'c2', courseName: 'السلامة والصحة المهنية', courseNameEn: 'Occupational Health & Safety', trainerId: 't2', trainerName: 'فاطمة الزهراني', venueId: 'v3', venueName: 'مركز جدة', city: 'جدة', startDate: '2025-02-10', endDate: '2025-02-12', status: 'Conflict', hasConflict: true, notes: 'تعارض مع إجازة' },
  { id: 'se3', courseId: 'c3', courseName: 'تحليل البيانات', courseNameEn: 'Data Analysis', trainerId: 't3', trainerName: 'خالد السعدي', venueId: 'v2', venueName: 'قاعة التدريب أ', city: 'الرياض', startDate: '2025-03-05', endDate: '2025-03-06', status: 'Scheduled', hasConflict: false, notes: '' },
  { id: 'se4', courseId: 'c6', courseName: 'التحول الرقمي', courseNameEn: 'Digital Transformation', trainerId: 't3', trainerName: 'خالد السعدي', venueId: 'v5', venueName: 'قاعة افتراضية', city: 'أونلاين', startDate: '2025-02-03', endDate: '2025-02-07', status: 'Completed', hasConflict: false, notes: '' },
  { id: 'se5', courseId: 'c4', courseName: 'القيادة والإدارة التنفيذية', courseNameEn: 'Executive Leadership', trainerId: 't4', trainerName: 'نورة العتيبي', venueId: 'v4', venueName: 'معمل الدمام', city: 'الدمام', startDate: '2025-03-10', endDate: '2025-03-13', status: 'Scheduled', hasConflict: false, notes: '' },
  { id: 'se6', courseId: 'c5', courseName: 'إدارة العقود', courseNameEn: 'Contracts Management', trainerId: 't5', trainerName: 'سعد الدوسري', venueId: 'v3', venueName: 'مركز جدة', city: 'جدة', startDate: '2025-04-07', endDate: '2025-04-09', status: 'Scheduled', hasConflict: false, notes: '' },
];

export const conflicts: Conflict[] = [
  { id: 'cf1', type: 'Trainer', severity: 'Critical', description: 'المدرب أحمد الغامدي لديه تعارض في التواريخ بين دورتين', descriptionEn: 'Trainer Ahmed Al-Ghamdi has date overlap between 2 courses', affectedEntries: ['se1', 'se4'], resolved: false },
  { id: 'cf2', type: 'Holiday', severity: 'Warning', description: 'دورة السلامة المهنية مجدولة على يوم إجازة رسمية', descriptionEn: 'OHS course scheduled on official holiday', affectedEntries: ['se2'], resolved: false },
  { id: 'cf3', type: 'Capacity', severity: 'Warning', description: 'قاعة التدريب أ لا تستوعب العدد المتوقع (25 < 30)', descriptionEn: 'Training Room A capacity insufficient (25 < 30)', affectedEntries: ['se3'], resolved: false },
  { id: 'cf4', type: 'Venue', severity: 'Info', description: 'مركز جدة محجوز لدورتين في نفس الأسبوع', descriptionEn: 'Jeddah center double-booked same week', affectedEntries: ['se2', 'se6'], resolved: true },
];

export const tasks: Task[] = [
  { id: 'task1', workspace: 'خطة 2025', type: 'Auto Schedule', status: 'Completed', startedAt: '2025-01-10 09:00', completedAt: '2025-01-10 09:04', log: ['بدء عملية الجدولة التلقائية...', 'تحليل 8 دورات...', 'تحديد المدربين المتاحين...', 'تحديد القاعات المناسبة...', 'تم توليد 6 مدخلات جدول...', 'اكتملت العملية بنجاح!'], progress: 100 },
  { id: 'task2', workspace: 'خطة 2025', type: 'Import Excel', status: 'Completed', startedAt: '2025-01-08 14:30', completedAt: '2025-01-08 14:31', log: ['رفع الملف...', 'تحليل ورقة الدورات... 8 صفوف', 'تحليل ورقة المدربين... 5 صفوف', 'تحليل ورقة القاعات... 5 صفوف', 'اكتمل الاستيراد!'], progress: 100 },
  { id: 'task3', workspace: 'خطة 2026', type: 'Conflict Check', status: 'Running', startedAt: '2025-01-15 10:00', log: ['بدء فحص التعارضات...', 'تحليل التعارضات الزمنية...'], progress: 45 },
  { id: 'task4', workspace: 'خطة 2026', type: 'Auto Schedule', status: 'Pending', startedAt: '', log: [], progress: 0 },
];

export const assignments: Assignment[] = [
  { id: 'asgn1', courseId: 'c1', courseName: 'إدارة المشاريع المتقدمة', courseNameEn: 'Advanced Project Management', trainerId: 't1', trainerName: 'أحمد الغامدي', trainerNameEn: 'Ahmed Al-Ghamdi', assignedDate: '2024-12-15', specialty: 'إدارة المشاريع' },
  { id: 'asgn2', courseId: 'c2', courseName: 'السلامة والصحة المهنية', courseNameEn: 'OHS', trainerId: 't2', trainerName: 'فاطمة الزهراني', trainerNameEn: 'Fatima Al-Zahrani', assignedDate: '2024-12-16', specialty: 'السلامة المهنية' },
  { id: 'asgn3', courseId: 'c3', courseName: 'تحليل البيانات', courseNameEn: 'Data Analysis', trainerId: 't3', trainerName: 'خالد السعدي', trainerNameEn: 'Khalid Al-Saadi', assignedDate: '2024-12-17', specialty: 'تقنية المعلومات' },
  { id: 'asgn4', courseId: 'c4', courseName: 'القيادة التنفيذية', courseNameEn: 'Executive Leadership', trainerId: 't4', trainerName: 'نورة العتيبي', trainerNameEn: 'Noura Al-Otaibi', assignedDate: '2024-12-18', specialty: 'القيادة' },
  { id: 'asgn5', courseId: 'c5', courseName: 'إدارة العقود', courseNameEn: 'Contracts Management', trainerId: 't5', trainerName: 'سعد الدوسري', trainerNameEn: 'Saad Al-Dosari', assignedDate: '2024-12-19', specialty: 'المشتريات' },
  { id: 'asgn6', courseId: 'c6', courseName: 'التحول الرقمي', courseNameEn: 'Digital Transformation', trainerId: 't3', trainerName: 'خالد السعدي', trainerNameEn: 'Khalid Al-Saadi', assignedDate: '2024-12-20', specialty: 'تقنية المعلومات' },
];

export const monthlyData = [
  { month: 'يناير', ar: 'يناير', en: 'Jan', courses: 3 },
  { month: 'فبراير', ar: 'فبراير', en: 'Feb', courses: 5 },
  { month: 'مارس', ar: 'مارس', en: 'Mar', courses: 4 },
  { month: 'أبريل', ar: 'أبريل', en: 'Apr', courses: 6 },
  { month: 'مايو', ar: 'مايو', en: 'May', courses: 3 },
  { month: 'يونيو', ar: 'يونيو', en: 'Jun', courses: 2 },
  { month: 'يوليو', ar: 'يوليو', en: 'Jul', courses: 4 },
  { month: 'أغسطس', ar: 'أغسطس', en: 'Aug', courses: 1 },
  { month: 'سبتمبر', ar: 'سبتمبر', en: 'Sep', courses: 5 },
  { month: 'أكتوبر', ar: 'أكتوبر', en: 'Oct', courses: 7 },
  { month: 'نوفمبر', ar: 'نوفمبر', en: 'Nov', courses: 4 },
  { month: 'ديسمبر', ar: 'ديسمبر', en: 'Dec', courses: 2 },
];

export const cityData = [
  { city: 'الرياض', en: 'Riyadh', count: 18 },
  { city: 'جدة', en: 'Jeddah', count: 12 },
  { city: 'الدمام', en: 'Dammam', count: 8 },
  { city: 'أبها', en: 'Abha', count: 4 },
  { city: 'أونلاين', en: 'Online', count: 10 },
];

export const typeData = [
  { type: 'حضوري', en: 'In-person', value: 45 },
  { type: 'أونلاين', en: 'Online', value: 30 },
  { type: 'خارجي', en: 'External', value: 25 },
];

export const trainerUtilization = [
  { name: 'أحمد الغامدي', days: 18, max: 20 },
  { name: 'فاطمة الزهراني', days: 12, max: 18 },
  { name: 'خالد السعدي', days: 10, max: 15 },
  { name: 'نورة العتيبي', days: 8, max: 12 },
  { name: 'سعد الدوسري', days: 15, max: 20 },
];
