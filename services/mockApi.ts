import { Report, Student, Teacher, ReportType, ContactRequest } from '../types';
import { STUDENTS, TEACHERS, DEFAULT_STUDENT_PASSWORD, ADMIN_PASSWORD } from '../constants';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// LocalStorage Keys
const REPORTS_KEY = 'safe_school_reports';
const CONTACTS_KEY = 'safe_school_contacts';

// Get reports from storage
const getStoredReports = (): Report[] => {
  const data = localStorage.getItem(REPORTS_KEY);
  return data ? JSON.parse(data) : [];
};

// Save reports to storage
const saveReports = (reports: Report[]) => {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

// Get contacts from storage
const getStoredContacts = (): ContactRequest[] => {
  const data = localStorage.getItem(CONTACTS_KEY);
  return data ? JSON.parse(data) : [];
};

// Save contacts to storage
const saveContacts = (contacts: ContactRequest[]) => {
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
};

export const mockApi = {
  // Auth Logic
  findStudentById: async (id: string): Promise<Student | null> => {
    return STUDENTS.find(s => s.id === id) || null;
  },

  verifyStudent: async (id: string, password: string): Promise<Student | null> => {
    await delay(300);
    const student = STUDENTS.find(s => s.id === id);
    if (student && (password === DEFAULT_STUDENT_PASSWORD || password === '123' || password.length > 0)) {
      return student;
    }
    return null;
  },

  // Cập nhật: Thêm check số điện thoại
  verifyTeacher: async (email: string, phone: string, password: string): Promise<Teacher | null> => {
    await delay(300);
    
    // Check phone number input (bắt buộc phải nhập)
    if (!phone || phone.length < 9) {
        return null; 
    }

    if (password.length > 0) {
       return {
         name: 'Giáo viên (Ba Tơ)',
         phone: phone,
         email: email
       };
    }
    return null;
  },

  verifyAdmin: async (password: string): Promise<boolean> => {
    await delay(300);
    return password === ADMIN_PASSWORD;
  },

  getTeachers: async (): Promise<Teacher[]> => {
    await delay(100);
    return TEACHERS; // Chỉ trả về 2 giáo viên cố định
  },

  // Report Logic
  submitReport: async (
    student: Student | null, 
    content: string, 
    type: ReportType,
    location?: string
  ): Promise<boolean> => {
    await delay(300);
    const reports = getStoredReports();
    
    const newReport: Report = {
      id: Date.now().toString(),
      studentId: student ? student.id : null,
      studentName: student ? student.name : 'Ẩn danh',
      content,
      location,
      type,
      timestamp: Date.now(),
      isResolved: false,
      replies: []
    };

    if (type === ReportType.EMERGENCY) {
      console.log("SERVER ALERT: KÍCH HOẠT CÒI - VỊ TRÍ: ", location);
    }

    reports.unshift(newReport);
    saveReports(reports);
    return true;
  },

  getReports: async (studentId?: string): Promise<Report[]> => {
    await delay(200);
    const reports = getStoredReports();
    if (studentId) {
      return reports.filter(r => r.studentId === studentId);
    }
    return reports;
  },

  resolveReport: async (reportId: string, replyContent: string, authorRole: 'Admin' | 'Teacher' | 'Robot' = 'Teacher'): Promise<Report | null> => {
    await delay(300);
    const reports = getStoredReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      reports[index].replies.push({
        id: Date.now().toString(),
        author: authorRole,
        content: replyContent,
        timestamp: Date.now()
      });
      reports[index].isResolved = true;
      saveReports(reports);
      return reports[index];
    }
    return null;
  },
  
  // Contact Request Logic
  submitContactRequest: async (student: Student, teacherName: string): Promise<boolean> => {
    await delay(200);
    const contacts = getStoredContacts();
    contacts.unshift({
      id: Date.now().toString(),
      studentName: student.name,
      studentClass: student.class,
      teacherName: teacherName,
      status: 'PENDING',
      timestamp: Date.now()
    });
    saveContacts(contacts);
    return true;
  },

  getContactRequests: async (): Promise<ContactRequest[]> => {
    await delay(100);
    return getStoredContacts();
  },

  acceptContactRequest: async (id: string): Promise<void> => {
    await delay(100);
    const contacts = getStoredContacts();
    const index = contacts.findIndex(c => c.id === id);
    if (index !== -1) {
      contacts[index].status = 'DONE';
      saveContacts(contacts);
    }
  },
  
  // Tính toán số liệu thực tế cho Biểu đồ
  getStats: async () => {
    await delay(100);
    const reports = getStoredReports();
    const totalUsers = STUDENTS.length + TEACHERS.length;
    const totalReports = reports.length;
    const emergencyCount = reports.filter(r => r.type === ReportType.EMERGENCY).length;
    const counselingCount = reports.filter(r => r.type === ReportType.COUNSELING).length;
    const resolvedCount = reports.filter(r => r.isResolved).length;
    
    // Tính toán số lượng báo cáo trong 7 ngày gần nhất
    const last7Days = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    today.setHours(0,0,0,0); // Reset về đầu ngày hôm nay

    reports.forEach(r => {
        const reportDate = new Date(r.timestamp);
        reportDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today.getTime() - reportDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // 0 là hôm nay, 1 là hôm qua... đến 6
        if (diffDays < 7) {
            // Đảo ngược index để khớp với biểu đồ (cũ nhất bên trái, hôm nay bên phải)
            const index = 6 - diffDays; 
            if (index >= 0 && index <= 6) {
                last7Days[index] += 1;
            }
        }
    });
    
    // Đếm số lần Robot tương tác (dựa trên replies có author='Robot')
    let robotInteractions = 0;
    reports.forEach(r => {
        robotInteractions += r.replies.filter(rep => rep.author === 'Robot').length;
    });
    
    return { 
        totalUsers, 
        totalReports, 
        emergencyCount, 
        counselingCount, 
        resolvedCount, 
        robotInteractions,
        weeklyData: last7Days // Trả về dữ liệu thực tế
    };
  }
};