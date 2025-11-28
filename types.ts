export interface Student {
  id: string;
  name: string;
  class: string;
  password?: string; // Simplified for mock
}

export interface Teacher {
  name: string;
  phone: string;
  email: string; // Added email requirement
  password?: string;
}

export enum ReportType {
  EMERGENCY = 'EMERGENCY',
  BULLYING = 'BULLYING',
  COUNSELING = 'COUNSELING',
}

export interface Report {
  id: string;
  studentId: string | null; // null if anonymous
  studentName: string; // "Ẩn danh" if anonymous
  content: string;
  location?: string;
  timestamp: number;
  type: ReportType;
  isResolved: boolean;
  replies: Reply[];
}

export interface Reply {
  id: string;
  author: 'Admin' | 'Teacher' | 'Student' | 'Robot';
  content: string;
  timestamp: number;
}

export interface UserSession {
  role: 'STUDENT' | 'ADMIN' | 'TEACHER';
  student?: Student;
  teacher?: Teacher;
  token: string;
}

export interface ContactRequest {
  id: string;
  studentName: string;
  studentClass: string;
  teacherName: string;
  status: 'PENDING' | 'DONE';
  timestamp: number;
}