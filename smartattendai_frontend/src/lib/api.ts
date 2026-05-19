const BASE_URL = 'http://localhost:5000';

function getToken(): string | null {
  return localStorage.getItem('smartattend_token');
}

interface FetchOptions extends RequestInit {
  skipAuth?: boolean;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { skipAuth = false, ...fetchOptions } = options;
  const token = getToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  if (!skipAuth && token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...fetchOptions,
    headers,
  });

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const data = await response.json();
      message = data.error || data.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

// Auth endpoints
export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiFetch<{ user: ApiUser; token: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
        skipAuth: true,
      }),
    register: (data: RegisterPayload) =>
      apiFetch<{ user: ApiUser; token: string }>('/api/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
        skipAuth: true,
      }),
    profile: () => apiFetch<{ user: ApiUser }>('/api/auth/profile'),
  },

  students: {
    list: (params?: { grade?: string; section?: string; search?: string }) => {
      const qs = new URLSearchParams(
        Object.entries(params ?? {}).filter(([, v]) => v) as [string, string][]
      ).toString();
      return apiFetch<{ students: ApiStudent[]; total: number }>(
        `/api/students${qs ? '?' + qs : ''}`
      );
    },
    create: (data: Partial<ApiStudent>) =>
      apiFetch<{ student: ApiStudent }>('/api/students', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    grades: () =>
      apiFetch<{ classes: { grade: string; section: string }[] }>('/api/students/grades'),
  },

  attendance: {
    mark: (payload: MarkAttendancePayload) =>
      apiFetch<{ message: string; attendances: ApiAttendance[]; alerts_triggered: number }>(
        '/api/attendance/mark',
        { method: 'POST', body: JSON.stringify(payload) }
      ),
    getForStudent: (studentId: number, params?: Record<string, string>) => {
      const qs = new URLSearchParams(params ?? {}).toString();
      return apiFetch<{ attendances: ApiAttendance[]; total_records: number }>(
        `/api/attendance/student/${studentId}${qs ? '?' + qs : ''}`
      );
    },
    getClass: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch<{ records: ClassAttendanceRecord[]; total_students: number }>(
        `/api/attendance/class?${qs}`
      );
    },
    getReport: (params: Record<string, string>) => {
      const qs = new URLSearchParams(params).toString();
      return apiFetch<{ data: ReportEntry[]; total_students: number; report_period: { start_date: string; end_date: string } }>(
        `/api/attendance/report?${qs}`
      );
    },
  },

  parents: {
    dashboard: () =>
      apiFetch<{ dashboard: ParentDashboardEntry[]; total_children: number }>(
        '/api/parents/dashboard'
      ),
    childAttendance: (studentId: number, params?: Record<string, string>) => {
      const qs = new URLSearchParams(params ?? {}).toString();
      return apiFetch<{ attendances: ApiAttendance[]; statistics: AttendanceStats }>(
        `/api/parents/children/${studentId}/attendance${qs ? '?' + qs : ''}`
      );
    },
    linkTelegram: (studentId: number, chatId: string) =>
      apiFetch<{ message: string }>('/api/parents/link-telegram', {
        method: 'POST',
        body: JSON.stringify({ student_id: studentId, chat_id: chatId }),
      }),
    link: (parentId: number, studentId: number, opts?: { relationship?: string; is_primary?: boolean }) =>
      apiFetch<{ message: string; mapping?: ApiMapping }>('/api/parents/link', {
        method: 'POST',
        body: JSON.stringify({ parent_id: parentId, student_id: studentId, ...opts }),
      }),
    notifications: () =>
      apiFetch<{ notifications: ApiNotification[]; total: number }>('/api/parents/notifications'),
    children: () =>
      apiFetch<{ children: { student: ApiStudent; mapping: ApiMapping }[]; total: number }>(
        '/api/parents/children'
      ),
  },

  users: {
    list: (params?: { role?: string }) => {
      const qs = new URLSearchParams(params as Record<string, string>).toString();
      return apiFetch<{ users: ApiUser[]; total: number }>(
        `/api/users${qs ? '?' + qs : ''}`
      );
    },
    update: (userId: number, data: Partial<ApiUser>) =>
      apiFetch<{ user: ApiUser }>(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data),
      }),
  },
};

// ── Types ──────────────────────────────────────────────────────────────────

export interface ApiUser {
  id: number;
  username: string;
  email: string;
  role: 'hod' | 'teacher' | 'parent';
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiStudent {
  id: number;
  student_id: string;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string | null;
  date_of_birth: string | null;
  grade: string | null;
  section: string | null;
  roll_number: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ApiAttendance {
  id: number;
  student_id: number;
  teacher_id: number;
  date: string;
  status: 'present' | 'absent' | 'late';
  subject: string | null;
  period: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface ApiNotification {
  id: number;
  parent_id: number;
  student_id: number;
  message: string;
  message_type: 'alert' | 'report' | 'general';
  sent_at: string;
  status: 'sent' | 'failed' | 'pending';
  telegram_response: string | null;
}

export interface ApiMapping {
  id: number;
  parent_id: number;
  student_id: number;
  relationship: string;
  is_primary: boolean;
  telegram_chat_id: string | null;
  created_at: string;
}

export interface AttendanceStats {
  total_days: number;
  present_days: number;
  absent_days: number;
  late_days: number;
  attendance_percentage: number;
}

export interface ParentDashboardEntry {
  student: ApiStudent;
  recent_stats: {
    total_days: number;
    present_days: number;
    absent_days: number;
    late_days: number;
    attendance_percentage: number;
  };
  today_attendance: ApiAttendance | null;
  alert_status: 'critical' | 'normal';
}

export interface ClassAttendanceRecord {
  student: ApiStudent;
  attendance: ApiAttendance | null;
}

export interface ReportEntry {
  student: ApiStudent;
  summary: AttendanceStats;
}

export interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role: 'hod' | 'teacher' | 'parent';
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface MarkAttendancePayload {
  attendances: { student_id: number; status: 'present' | 'absent' | 'late'; notes?: string }[];
  date?: string;
  subject?: string;
  period?: string;
}
