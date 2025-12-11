import React, { useState, useEffect } from 'react';
import { UserSession, ReportType, Report, Teacher } from '../types';
import { mockApi } from '../services/mockApi';
import { Chatbot } from './Chatbot';

interface StudentDashboardProps {
  user: UserSession;
}

type StudentTab = 'HOME' | 'CHAT_AI' | 'REPORT' | 'OPINION' | 'CONTACT';

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ user }) => {
  const [activeTab, setActiveTabState] = useState<StudentTab>('HOME');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [contentInput, setContentInput] = useState('');
  const [isEmergencyActive, setIsEmergencyActive] = useState(false);
  const [reports, setReports] = useState<Report[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [showGuide, setShowGuide] = useState(false);

  // --- HISTORY & BACK BUTTON HANDLING ---
  useEffect(() => {
    window.history.replaceState({ tab: 'HOME' }, '');

    // Show Guide on first entry
    const hasSeenGuide = sessionStorage.getItem('hasSeenGuide');
    if (!hasSeenGuide) {
        setShowGuide(true);
        sessionStorage.setItem('hasSeenGuide', 'true');
    }

    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        setActiveTabState(event.state.tab);
      } else {
        setActiveTabState('HOME');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const setActiveTab = (tab: StudentTab) => {
    setActiveTabState(tab);
    window.history.pushState({ tab }, '');
  };
  // -----------------------------------------------------------

  useEffect(() => {
    loadReports();
    loadTeachers();
  }, [activeTab]);

  const loadReports = async () => {
    if (user.student) {
      const data = await mockApi.getReports(user.student.id);
      // Lọc bỏ các hội thoại AI khỏi danh sách Báo cáo/Ý kiến để tránh rác
      const visibleReports = data.filter(r => !r.isAiConversation);
      setReports(visibleReports);
    }
  };

  const loadTeachers = async () => {
    const data = await mockApi.getTeachers();
    setTeachers(data);
  };

  const handleEmergency = () => {
    setIsEmergencyActive(true);
    
    const sendSos = (loc: string) => {
        mockApi.submitReport(user.student || null, "KHẨN CẤP: Cần hỗ trợ ngay!", ReportType.EMERGENCY, loc);
        setNotification("⚠️ ĐÃ GỬI TÍN HIỆU KHẨN CẤP!");
        setTimeout(() => {
            setIsEmergencyActive(false);
            setNotification(null);
            loadReports();
        }, 3000);
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            const { latitude, longitude } = position.coords;
            sendSos(`${latitude.toFixed(5)}, ${longitude.toFixed(5)}`);
        }, (error) => {
            sendSos("Không xác định vị trí");
        });
    } else {
        sendSos("Không hỗ trợ định vị");
    }
  };

  const handleSubmit = async () => {
    if (!contentInput.trim()) return;
    
    const author = isAnonymous ? null : user.student || null;
    const type = activeTab === 'OPINION' ? ReportType.COUNSELING : ReportType.BULLYING;
    
    await mockApi.submitReport(author, contentInput, type);
    
    setContentInput('');
    loadReports();
    setNotification("Đã gửi thành công! Thông tin được bảo mật.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleRequestCallback = async (teacherName: string) => {
    if (!user.student) return;
    setNotification(`Đang gửi yêu cầu tới ${teacherName}...`);
    await mockApi.submitContactRequest(user.student, teacherName);
    setNotification("Đã gửi yêu cầu gọi lại! Giáo viên sẽ liên hệ sớm.");
    setTimeout(() => setNotification(null), 3000);
  };

  // Render functions
  const renderLetterStyle = (r: Report) => (
    <div key={r.id} className="bg-white rounded-xl shadow-sm border border-pink-100 overflow-hidden mb-4 relative animate-fadeIn">
       <div className="bg-pink-50 p-3 border-b border-pink-100 flex justify-between items-center">
          <div className="text-xs text-gray-600">
            <span className="font-bold">Gửi:</span> Ban Tư Vấn | <span className="font-bold">Từ:</span> {r.studentId ? 'Học sinh' : 'Ẩn danh'}
          </div>
          <div className="text-2xl opacity-50">💌</div>
       </div>
       <div className="p-4 bg-white">
          <p className="text-gray-700 whitespace-pre-wrap font-medium leading-relaxed">{r.content}</p>
       </div>
       {r.replies.length > 0 && (
         <div className="bg-yellow-50 p-3 border-t border-yellow-100">
           {r.replies.map(rep => (
             <div key={rep.id} className="bg-white border border-yellow-200 rounded-lg p-3 mb-2 shadow-sm">
                <div className="flex items-center mb-1">
                   <span className="text-xs font-bold text-pink-600 mr-2">{rep.author === 'Robot' ? '🤖 Nhí Nhố' : '👩‍🏫 Giáo viên'}</span>
                   <span className="text-[10px] text-gray-400">{new Date(rep.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-gray-700 text-sm">{rep.content}</p>
             </div>
           ))}
         </div>
       )}
    </div>
  );

  const renderChatStyle = (r: Report) => (
    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 mb-4 animate-fadeIn">
        <div className="flex justify-end mb-2">
           <div className={`p-3 rounded-2xl rounded-tr-none text-white text-sm shadow-sm ${r.type === ReportType.EMERGENCY ? 'bg-red-500' : 'bg-blue-500'}`}>
              {r.content}
           </div>
        </div>
        {r.replies.map(rep => (
          <div key={rep.id} className="flex justify-start mb-2">
             <div className="bg-gray-100 p-3 rounded-2xl rounded-tl-none text-gray-800 text-sm shadow-sm border border-gray-200">
                <span className="block text-xs font-bold text-gray-500 mb-1">{rep.author === 'Robot' ? 'Nhí Nhố' : 'Thầy Cô'}</span>
                {rep.content}
             </div>
          </div>
        ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full max-w-md mx-auto w-full bg-[#FFF9F0]">
      {/* GUIDE POPUP */}
      {showGuide && (
          <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl p-6 shadow-2xl max-w-sm w-full animate-bounce-slow">
                  <div className="text-center">
                      <div className="text-4xl mb-2">🏫</div>
                      <h2 className="text-xl font-bold text-pink-600 mb-2">Chào mừng bạn!</h2>
                      <p className="text-gray-600 text-sm mb-4">Đây là ứng dụng <span className="font-bold">Trường Học Hạnh Phúc</span>. Nơi lắng nghe và bảo vệ bạn.</p>
                      <ul className="text-left text-sm space-y-2 bg-yellow-50 p-4 rounded-xl mb-4 text-gray-700">
                          <li>📢 <b>Báo cáo vụ việc:</b> Nếu bạn thấy hoặc bị bắt nạt.</li>
                          <li>💌 <b>Góp ý:</b> Tâm sự điều thầm kín (có thể ẩn danh).</li>
                          <li>🤖 <b>Nhí Nhố AI:</b> Trò chuyện vui vẻ 24/7.</li>
                          <li>📞 <b>Liên hệ:</b> Gọi thầy cô khi cần gấp.</li>
                      </ul>
                      <button onClick={() => setShowGuide(false)} className="bg-gradient-to-r from-yellow-400 to-pink-500 text-white w-full py-3 rounded-xl font-bold shadow-lg">Bắt đầu ngay</button>
                  </div>
              </div>
          </div>
      )}

      {isEmergencyActive && (
        <div className="fixed inset-0 bg-red-600 z-[90] flex flex-col items-center justify-center text-white animate-pulse">
          <div className="text-6xl mb-4">🚨</div>
          <h1 className="text-2xl font-bold uppercase">ĐANG GỬI SOS!</h1>
          <p className="mt-2 text-white/90">Giáo viên đã nhận được tín hiệu...</p>
        </div>
      )}

      {notification && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-4 py-3 rounded-full shadow-xl z-50 font-bold text-xs flex items-center animate-fadeIn w-max">
          ✅ {notification}
        </div>
      )}

      <div className="flex-1 overflow-y-auto no-scrollbar pb-24 px-4 pt-4">
        {activeTab === 'HOME' && (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-yellow-100 to-pink-100 rounded-3xl p-6 shadow-sm border border-white text-center">
               <h2 className="text-xl font-bold text-gray-800 mb-1">Chào, {user.student?.name}! ☀️</h2>
               <p className="text-gray-600 text-sm">Hôm nay của bạn thế nào?</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
               <button onClick={handleEmergency} className="bg-red-500 text-white p-4 rounded-2xl shadow-lg flex items-center justify-between hover:bg-red-600 transition-all active:scale-95">
                  <div className="text-left"><div className="font-bold text-lg">SOS Khẩn Cấp</div><div className="text-xs text-red-100">Bấm khi gặp nguy hiểm</div></div>
                  <div className="text-3xl">🚨</div>
               </button>

               <button onClick={() => setActiveTab('REPORT')} className="bg-orange-400 text-white p-4 rounded-2xl shadow-md flex items-center justify-between hover:bg-orange-500 transition-all active:scale-95">
                  <div className="text-left"><div className="font-bold text-lg">Báo Cáo Vụ Việc</div><div className="text-xs text-orange-100">Bắt nạt, đánh nhau...</div></div>
                  <div className="text-3xl">📢</div>
               </button>

               <button onClick={() => setActiveTab('OPINION')} className="bg-green-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between hover:bg-green-600 transition-all active:scale-95">
                  <div className="text-left"><div className="font-bold text-lg">Hòm Thư Tâm Sự</div><div className="text-xs text-green-100">Tư vấn tâm lý, góp ý</div></div>
                  <div className="text-3xl">💌</div>
               </button>

               <button onClick={() => setActiveTab('CONTACT')} className="bg-blue-500 text-white p-4 rounded-2xl shadow-md flex items-center justify-between hover:bg-blue-600 transition-all active:scale-95">
                  <div className="text-left"><div className="font-bold text-lg">Gọi Thầy Cô</div><div className="text-xs text-blue-100">Hỗ trợ trực tiếp</div></div>
                  <div className="text-3xl">📞</div>
               </button>
            </div>
            
            <div className="text-center p-4 bg-white/50 rounded-xl border border-dashed border-gray-300">
                <p className="text-[10px] text-gray-500">🔒 Thông tin của bạn được bảo mật tuyệt đối. Chỉ bạn, giáo viên tư vấn và quản lý mới đọc được nội dung này.</p>
            </div>
          </div>
        )}

        {/* CHAT TAB with Student Info passed down */}
        {activeTab === 'CHAT_AI' && <div className="h-full pb-4"><Chatbot student={user.student} /></div>}

        {activeTab === 'REPORT' && (
          <div className="space-y-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-orange-100">
               <h2 className="font-bold text-lg text-orange-600 mb-2 flex items-center">📢 Báo Cáo</h2>
               <div className="flex justify-end mb-2">
                 <button onClick={() => setIsAnonymous(!isAnonymous)} className={`text-[10px] font-bold px-2 py-1 rounded-full ${isAnonymous ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {isAnonymous ? '🕵️ Đang ẩn danh' : '👤 Đang hiện tên'}
                 </button>
               </div>
               <textarea value={contentInput} onChange={(e) => setContentInput(e.target.value)} placeholder="Kể lại sự việc..." className="w-full h-24 p-3 bg-gray-50 rounded-xl border border-gray-200 text-sm mb-3" />
               <button onClick={handleSubmit} className="w-full py-3 rounded-xl font-bold text-white bg-orange-500 hover:bg-orange-600">Gửi đi</button>
             </div>
             <div className="space-y-2">{reports.filter(r => r.type !== ReportType.COUNSELING).map(renderChatStyle)}</div>
          </div>
        )}

        {activeTab === 'OPINION' && (
          <div className="space-y-4">
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-green-100">
               <h2 className="font-bold text-lg text-green-600 mb-2 flex items-center">💌 Tâm Sự</h2>
               <div className="flex justify-end mb-2">
                 <button onClick={() => setIsAnonymous(!isAnonymous)} className={`text-[10px] font-bold px-2 py-1 rounded-full ${isAnonymous ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-600'}`}>
                    {isAnonymous ? '🕵️ Đang ẩn danh' : '👤 Đang hiện tên'}
                 </button>
               </div>
               <textarea value={contentInput} onChange={(e) => setContentInput(e.target.value)} placeholder="Viết tâm sự của bạn..." className="w-full h-32 p-3 bg-yellow-50 rounded-xl border border-yellow-100 text-sm mb-3 font-medium" />
               <button onClick={handleSubmit} className="w-full py-3 rounded-xl font-bold text-white bg-green-500 hover:bg-green-600">Gửi thư</button>
             </div>
             <div className="space-y-2">{reports.filter(r => r.type === ReportType.COUNSELING).map(renderLetterStyle)}</div>
          </div>
        )}

        {activeTab === 'CONTACT' && (
           <div className="space-y-4">
              <h2 className="font-bold text-lg text-blue-700 ml-1">Giáo Viên Tư Vấn</h2>
              {teachers.map((teacher, index) => (
                 <div key={index} className="flex flex-col bg-white p-4 rounded-2xl shadow-sm border border-blue-50">
                    <div className="flex items-center mb-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold mr-3">{teacher.name.charAt(0)}</div>
                        <div><div className="font-bold text-gray-800">{teacher.name}</div><div className="text-xs text-gray-500">{teacher.phone}</div></div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <a href={`tel:${teacher.phone}`} className="bg-green-500 text-white py-2 rounded-lg text-xs font-bold text-center shadow-sm flex items-center justify-center">📞 Gọi</a>
                        <a href={`mailto:${teacher.email}`} className="bg-red-500 text-white py-2 rounded-lg text-xs font-bold text-center shadow-sm flex items-center justify-center">📧 Email</a>
                        <button onClick={() => handleRequestCallback(teacher.name)} className="bg-white border border-blue-200 text-blue-500 py-2 rounded-lg text-xs font-bold">👋 Gọi lại</button>
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex justify-around py-3 pb-5 z-40 rounded-t-3xl shadow-[0_-5px_15px_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('HOME')} className={`flex flex-col items-center w-1/5 ${activeTab === 'HOME' ? 'text-pink-500' : 'text-gray-300'}`}>
          <span className="text-xl">🏠</span>
        </button>
        <button onClick={() => setActiveTab('REPORT')} className={`flex flex-col items-center w-1/5 ${activeTab === 'REPORT' ? 'text-orange-500' : 'text-gray-300'}`}>
           <span className="text-xl">📢</span>
        </button>
        <div className="w-1/5 flex justify-center">
             <button onClick={() => setActiveTab('CHAT_AI')} className="relative -top-8 bg-gradient-to-tr from-purple-500 to-pink-500 p-4 rounded-full shadow-xl text-white transform hover:scale-105 transition-all border-4 border-[#FFF9F0]">
               <span className="text-2xl">🤖</span>
             </button>
        </div>
        <button onClick={() => setActiveTab('OPINION')} className={`flex flex-col items-center w-1/5 ${activeTab === 'OPINION' ? 'text-green-500' : 'text-gray-300'}`}>
           <span className="text-xl">💌</span>
        </button>
        <button onClick={() => setActiveTab('CONTACT')} className={`flex flex-col items-center w-1/5 ${activeTab === 'CONTACT' ? 'text-blue-500' : 'text-gray-300'}`}>
           <span className="text-xl">📞</span>
        </button>
      </div>
    </div>
  );
};
