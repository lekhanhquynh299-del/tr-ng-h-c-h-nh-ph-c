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

export interface AiAnalysis {
  severityScore: number; // 0 - 100
  potentialRisks: string[];
  teacherAdvice: string[];
}

export interface Report {
  id: string;
  studentId: string | null; // null if anonymous
  studentName: string; // "Ẩn danh" if anonymous
  content: string; // Nội dung khởi tạo hoặc tiêu đề
  location?: string;
  timestamp: number;
  type: ReportType;
  isResolved: boolean;
  isAiConversation?: boolean; // Đánh dấu đây là đoạn chat với AI
  aiAnalysis?: AiAnalysis; // Phân tích chuyên sâu từ AI
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
