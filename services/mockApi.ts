import { Report, Student, Teacher, ReportType, ContactRequest, Reply } from '../types';
import { STUDENTS, TEACHERS, DEFAULT_STUDENT_PASSWORD, ADMIN_PASSWORD } from '../constants';
import { analyzeReportWithGemini } from './geminiService';

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// LocalStorage Keys
const REPORTS_KEY = 'safe_school_reports_v2'; 
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
    // Không delay ở đây để cảm giác nhanh hơn, AI chạy ngầm
    const reports = getStoredReports();
    
    // Gọi AI phân tích nội dung (nếu không phải khẩn cấp SOS - SOS cần nhanh nhất có thể)
    let aiAnalysis = undefined;
    if (type !== ReportType.EMERGENCY) {
        aiAnalysis = await analyzeReportWithGemini(content);
    }

    const newReport: Report = {
      id: Date.now().toString(),
      studentId: student ? student.id : null,
      studentName: student ? student.name : 'Ẩn danh',
      content,
      location,
      type,
      timestamp: Date.now(),
      isResolved: false,
      aiAnalysis: aiAnalysis, // Lưu kết quả phân tích
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
    const reports = getStoredReports();
    const now = Date.now();
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

    // Lọc bỏ các báo cáo đã quá 7 ngày (tự động xóa)
    // CHỈ áp dụng lọc này cho view chung, hoặc có thể giữ lại nhưng ẩn đi
    // Ở đây ta lọc cứng luôn theo yêu cầu "hết 1 tuần thì vụ việc sẽ mất đi"
    const recentReports = reports.filter(r => (now - r.timestamp) < SEVEN_DAYS_MS);
    
    // Nếu có sự thay đổi (đã xóa bớt), lưu lại
    if (recentReports.length !== reports.length) {
        saveReports(recentReports);
    }

    if (studentId) {
      return recentReports.filter(r => r.studentId === studentId);
    }
    return recentReports;
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
      if (!reports[index].isAiConversation) {
          reports[index].isResolved = true; // Đánh dấu đã xử lý
      }
      saveReports(reports);
      return reports[index];
    }
    return null;
  },

  // --- AI CHAT SPECIFIC LOGIC ---
  getOrCreateAiSession: async (student: Student): Promise<Report> => {
    const reports = getStoredReports();
    const today = new Date().toDateString();
    
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
        reports.unshift(session); 
        saveReports(reports);
    }
    return session;
  },

  syncAiChat: async (sessionId: string, userMsg: string, aiMsg: string | null) => {
      const reports = getStoredReports();
      const index = reports.findIndex(r => r.id === sessionId);
      
      if (index !== -1) {
          if (userMsg) {
             reports[index].replies.push({
                 id: Date.now().toString() + '_u',
                 author: 'Student',
                 content: userMsg,
                 timestamp: Date.now()
             });
          }
          if (aiMsg) {
              reports[index].replies.push({
                  id: Date.now().toString() + '_ai',
                  author: 'Robot',
                  content: aiMsg,
                  timestamp: Date.now() + 100 
              });
          }
          reports[index].timestamp = Date.now();
          saveReports(reports);
          return reports[index];
      }
      return null;
  },

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
  
  // Tính toán số liệu thống kê
  getStats: async () => {
    await delay(100);
    const reports = getStoredReports();
    // Lọc reports để đảm bảo chỉ tính cái còn hiệu lực (trong 7 ngày) - logic đã có trong getStoredReports nếu gọi qua getReports, nhưng đây gọi raw
    const now = Date.now();
    const validReports = reports.filter(r => (now - r.timestamp) < 7 * 24 * 60 * 60 * 1000);

    const totalUsers = STUDENTS.length + TEACHERS.length;
    const totalReports = validReports.length;
    const emergencyCount = validReports.filter(r => r.type === ReportType.EMERGENCY).length;
    const counselingCount = validReports.filter(r => r.type === ReportType.COUNSELING).length;
    const resolvedCount = validReports.filter(r => r.isResolved).length;
    
    // Tính toán số lượng báo cáo trong 7 ngày gần nhất (Real-time based on timestamps)
    const last7Days = [0, 0, 0, 0, 0, 0, 0];
    const today = new Date();
    today.setHours(0,0,0,0); 

    validReports.forEach(r => {
        const reportDate = new Date(r.timestamp);
        reportDate.setHours(0,0,0,0);
        
        const diffTime = today.getTime() - reportDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
        
        // 0 là hôm nay, 6 là 6 ngày trước
        if (diffDays >= 0 && diffDays < 7) {
            const index = 6 - diffDays; // Đảo ngược để index 6 là hôm nay (cột cuối cùng biểu đồ)
            if (index >= 0 && index <= 6) {
                last7Days[index] += 1;
            }
        }
    });
    
    // --- TOP CLASSES LOGIC ---
    const classCounts: {[key: string]: number} = {};
    validReports.forEach(r => {
        if (r.studentId) {
            const st = STUDENTS.find(s => s.id === r.studentId);
            if (st) {
                classCounts[st.class] = (classCounts[st.class] || 0) + 1;
            }
        }
    });

    const topClasses = Object.entries(classCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // Lấy top 5 lớp

    let robotInteractions = 0;
    validReports.forEach(r => {
        robotInteractions += r.replies.filter(rep => rep.author === 'Robot').length;
    });
    
    return { 
        totalUsers, 
        totalReports, 
        emergencyCount, 
        counselingCount, 
        resolvedCount, 
        robotInteractions,
        weeklyData: last7Days,
        topClasses 
    };
  }
};
