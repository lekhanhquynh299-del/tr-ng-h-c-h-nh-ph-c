import { Report, Student, Teacher, ReportType, ContactRequest, Reply } from '../types';
import { STUDENTS, TEACHERS, DEFAULT_STUDENT_PASSWORD, ADMIN_PASSWORD } from '../constants';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// LocalStorage Keys
const REPORTS_KEY = 'safe_school_reports_v2'; // Bump version to clear old struct if needed
const CONTACTS_KEY = 'safe_school_contacts_v2';

// Get reports from storage
const getStoredReports = (): Report[] => {
  try {
    const data = localStorage.getItem(REPORTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
};

// Save reports to storage
const saveReports = (reports: Report[]) => {
  localStorage.setItem(REPORTS_KEY, JSON.stringify(reports));
};

// Get contacts from storage
const getStoredContacts = (): ContactRequest[] => {
  try {
    const data = localStorage.getItem(CONTACTS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (e) {
    return [];
  }
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
    return TEACHERS;
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
    // Không delay ở đây để UI cập nhật nhanh hơn
    const reports = getStoredReports();
    if (studentId) {
      return reports.filter(r => r.studentId === studentId);
    }
    return reports;
  },

  resolveReport: async (reportId: string, replyContent: string, authorRole: 'Admin' | 'Teacher' | 'Robot' = 'Teacher'): Promise<Report | null> => {
    const reports = getStoredReports();
    const index = reports.findIndex(r => r.id === reportId);
    if (index !== -1) {
      reports[index].replies.push({
        id: Date.now().toString(),
        author: authorRole,
        content: replyContent,
        timestamp: Date.now()
      });
      // Nếu là Robot chat, ta không đánh dấu là resolved để hội thoại tiếp tục
      if (!reports[index].isAiConversation) {
          reports[index].isResolved = true;
      }
      saveReports(reports);
      return reports[index];
    }
    return null;
  },

  // --- AI CHAT SPECIFIC LOGIC ---
  // Lấy hoặc tạo một phiên chat cho học sinh ngày hôm nay
  getOrCreateAiSession: async (student: Student): Promise<Report> => {
    const reports = getStoredReports();
    const today = new Date().toDateString();
    
    // Tìm xem hôm nay học sinh này đã chat chưa
    let session = reports.find(r => 
        r.studentId === student.id && 
        r.isAiConversation === true && 
        new Date(r.timestamp).toDateString() === today
    );

    if (!session) {
        session = {
            id: 'chat_' + student.id + '_' + Date.now(),
            studentId: student.id,
            studentName: student.name,
            content: "Phiên trò chuyện với Robot Nhí Nhố",
            type: ReportType.COUNSELING,
            timestamp: Date.now(),
            isResolved: false,
            isAiConversation: true,
            replies: [
                {
                    id: Date.now().toString(),
                    author: 'Robot',
                    content: `Chào ${student.name}! Tớ là Nhí Nhố. Hôm nay cậu thế nào? ❤️`,
                    timestamp: Date.now()
                }
            ]
        };
        reports.unshift(session); // Đưa lên đầu
        saveReports(reports);
    }
    return session;
  },

  // Cập nhật tin nhắn mới vào phiên chat (cả User và AI)
  syncAiChat: async (sessionId: string, userMsg: string, aiMsg: string | null) => {
      const reports = getStoredReports();
      const index = reports.findIndex(r => r.id === sessionId);
      
      if (index !== -1) {
          // 1. Thêm tin nhắn của User
          if (userMsg) {
             reports[index].replies.push({
                 id: Date.now().toString() + '_u',
                 author: 'Student',
                 content: userMsg,
                 timestamp: Date.now()
             });
          }
          
          // 2. Thêm tin nhắn của AI (nếu có)
          if (aiMsg) {
              reports[index].replies.push({
                  id: Date.now().toString() + '_ai',
                  author: 'Robot',
                  content: aiMsg,
                  timestamp: Date.now() + 100 // Đảm bảo timestamp sau user 1 chút
              });
          }
          
          // Cập nhật timestamp của report để nó nổi lên đầu ở Dashboard giáo viên
          reports[index].timestamp = Date.now();
          
          saveReports(reports);
          return reports[index];
      }
      return null;
  },

  // Lấy chi tiết 1 report (dùng để poll chat mới từ giáo viên)
  getReportById: async (id: string): Promise<Report | null> => {
      const reports = getStoredReports();
      return reports.find(r => r.id === id) || null;
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
  
  // Tính toán số liệu
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
    today.setHours(0,0,0,0); 

    reports.forEach(r => {
        const reportDate = new Date(r.timestamp);
        reportDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today.getTime() - reportDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        if (diffDays < 7) {
            const index = 6 - diffDays; 
            if (index >= 0 && index <= 6) {
                last7Days[index] += 1;
            }
        }
    });
    
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
        weeklyData: last7Days 
    };
  }
};
