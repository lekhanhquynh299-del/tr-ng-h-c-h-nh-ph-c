import React, { useState, useEffect } from 'react';
import { mockApi } from '../services/mockApi';
import { Report, ReportType, UserSession, ContactRequest } from '../types';

interface AdminDashboardProps {
  userSession: UserSession;
}

type TabType = 'DASHBOARD' | 'EMERGENCY' | 'REPORTS' | 'OPINIONS' | 'ROBOT_MODE' | 'CONTACTS';

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ userSession }) => {
  const isAdmin = userSession.role === 'ADMIN';
  const [reports, setReports] = useState<Report[]>([]);
  const [contactRequests, setContactRequests] = useState<ContactRequest[]>([]);
  const [stats, setStats] = useState({ totalUsers: 0, totalReports: 0, emergencyCount: 0, counselingCount: 0, resolvedCount: 0, robotInteractions: 0, weeklyData: [0,0,0,0,0,0,0] });
  const [replyContent, setReplyContent] = useState<{ [key: string]: string }>({});
  const [activeTab, setActiveTabState] = useState<TabType>(isAdmin ? 'DASHBOARD' : 'EMERGENCY');
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null);

  // --- SOUND ALERT LOGIC ---
  const playAlertSound = () => {
      const ctx = audioContext || new (window.AudioContext || (window as any).webkitAudioContext)();
      if (!audioContext) setAudioContext(ctx);

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(1000, ctx.currentTime + 0.5);
      gain.gain.setValueAtTime(0.5, ctx.currentTime);
      
      osc.start();
      osc.stop(ctx.currentTime + 1);
  };

  useEffect(() => {
    window.history.replaceState({ tab: isAdmin ? 'DASHBOARD' : 'EMERGENCY' }, '');
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) setActiveTabState(event.state.tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [isAdmin]);

  const setActiveTab = (tab: TabType) => {
    setActiveTabState(tab);
    window.history.pushState({ tab }, '');
  };

  useEffect(() => {
    const fetchData = async () => {
      const r = await mockApi.getReports();
      const emergencyReports = r.filter(rep => rep.type === ReportType.EMERGENCY && !rep.isResolved);
      if (emergencyReports.length > 0) {
          if (Math.random() > 0.8) playAlertSound(); 
      }

      const s = await mockApi.getStats();
      const c = await mockApi.getContactRequests();
      setReports(r);
      setStats(s as any);
      setContactRequests(c);
    };
    fetchData();
    const interval = setInterval(fetchData, 2000); 
    return () => clearInterval(interval);
  }, []);

  const handleReply = async (reportId: string, asRobot: boolean = false) => {
    const content = replyContent[reportId];
    if (!content) return;
    const author = asRobot ? 'Robot' : (isAdmin ? 'Admin' : 'Teacher');
    await mockApi.resolveReport(reportId, content, author);
    const updatedReports = await mockApi.getReports();
    setReports(updatedReports);
    setReplyContent(prev => ({...prev, [reportId]: ''}));
  };
  
  const handleAcceptContact = async (id: string) => {
      await mockApi.acceptContactRequest(id);
      const c = await mockApi.getContactRequests();
      setContactRequests(c);
  };

  const getFilteredReports = () => {
    switch (activeTab) {
      case 'EMERGENCY': return reports.filter(r => r.type === ReportType.EMERGENCY);
      case 'REPORTS': return reports.filter(r => r.type === ReportType.BULLYING);
      case 'OPINIONS': return reports.filter(r => r.type === ReportType.COUNSELING && !r.isAiConversation);
      // Ở chế độ Robot Mode, hiển thị cả "Thư tâm sự" (Counseling) và "Hội thoại AI"
      case 'ROBOT_MODE': return reports.filter(r => r.type === ReportType.COUNSELING || r.isAiConversation === true); 
      default: return [];
    }
  };

  const filteredReports = getFilteredReports();
  const pendingContacts = contactRequests.filter(c => c.status === 'PENDING');

  // Chart Logic
  const weeklyData = stats.weeklyData || [0,0,0,0,0,0,0];
  const maxVal = Math.max(...weeklyData) || 1; 
  
  const getLast7DaysLabels = () => {
      const days = [];
      for (let i=6; i>=0; i--) {
          const d = new Date();
          d.setDate(d.getDate() - i);
          days.push(`${d.getDate()}/${d.getMonth()+1}`);
      }
      return days;
  };
  const labels = getLast7DaysLabels();

  return (
    <div className={`flex flex-col h-full bg-yellow-50`}>
      {/* Top Nav */}
      <div className={`shadow-sm px-2 py-3 flex overflow-x-auto no-scrollbar space-x-2 bg-white sticky top-0 z-10 border-b border-yellow-200`}>
         {isAdmin && (
            <button onClick={() => setActiveTab('DASHBOARD')} className={`whitespace-nowrap px-4 py-2 rounded-full font-bold text-xs transition-all ${activeTab === 'DASHBOARD' ? 'bg-pink-500 text-white' : 'text-gray-600 bg-gray-100'}`}>
              📊 Thống Kê
            </button>
         )}
         {!isAdmin && (
           <>
             <button onClick={() => setActiveTab('EMERGENCY')} className={`whitespace-nowrap px-3 py-2 rounded-full font-bold text-xs transition-all flex items-center ${activeTab === 'EMERGENCY' ? 'bg-red-500 text-white' : 'text-gray-600 bg-gray-100'}`}>
                🚨 SOS {stats.emergencyCount > 0 && <span className="ml-1 bg-white text-red-500 text-[10px] px-1.5 rounded-full">{stats.emergencyCount}</span>}
             </button>
             <button onClick={() => setActiveTab('REPORTS')} className={`whitespace-nowrap px-3 py-2 rounded-full font-bold text-xs transition-all ${activeTab === 'REPORTS' ? 'bg-orange-500 text-white' : 'text-gray-600 bg-gray-100'}`}>
                📢 Vụ Việc
             </button>
             <button onClick={() => setActiveTab('OPINIONS')} className={`whitespace-nowrap px-3 py-2 rounded-full font-bold text-xs transition-all ${activeTab === 'OPINIONS' ? 'bg-green-500 text-white' : 'text-gray-600 bg-gray-100'}`}>
                💌 Ý Kiến
             </button>
             <button onClick={() => setActiveTab('CONTACTS')} className={`whitespace-nowrap px-3 py-2 rounded-full font-bold text-xs transition-all flex items-center ${activeTab === 'CONTACTS' ? 'bg-blue-500 text-white' : 'text-gray-600 bg-gray-100'}`}>
                📞 Liên Hệ {pendingContacts.length > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full animate-pulse">{pendingContacts.length}</span>}
             </button>
             <button onClick={() => setActiveTab('ROBOT_MODE')} className={`whitespace-nowrap px-3 py-2 rounded-full font-bold text-xs transition-all flex items-center ${activeTab === 'ROBOT_MODE' ? 'bg-purple-600 text-white shadow-lg border border-purple-400' : 'text-purple-600 bg-purple-50 border border-purple-200'}`}>
                🎭 Nhập vai Robot
             </button>
           </>
         )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 max-w-4xl mx-auto w-full relative">
        {!audioContext && !isAdmin && (
            <button onClick={playAlertSound} className="w-full bg-red-100 text-red-600 text-xs p-2 rounded mb-4 text-center">
                🔊 Bấm vào đây để Bật Âm Thanh Cảnh Báo Khẩn Cấp
            </button>
        )}

        {activeTab === 'DASHBOARD' && (
          <div className="animate-fadeIn space-y-6">
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-pink-100 text-center">
               <h1 className="text-xl font-bold text-pink-600">THỐNG KÊ TUẦN</h1>
               <p className="text-xs text-gray-500">Dữ liệu thực tế theo ngày</p>
             </div>
             
             {/* Weekly Bar Chart */}
             <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="text-sm font-bold text-gray-700 mb-4">Số lượng báo cáo/tương tác (7 ngày qua)</h3>
                <div className="flex items-end justify-between h-40 space-x-2">
                    {weeklyData.map((val, idx) => (
                        <div key={idx} className="flex flex-col items-center flex-1">
                            <div 
                                className="w-full bg-gradient-to-t from-pink-400 to-yellow-400 rounded-t-md transition-all duration-500 min-h-[4px]" 
                                style={{height: `${(val/maxVal)*100}%`}}
                            ></div>
                            <span className="text-[10px] text-gray-500 mt-1">{labels[idx]}</span>
                        </div>
                    ))}
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-500 text-white p-4 rounded-2xl shadow-md"><div className="text-3xl font-bold">{stats.totalUsers}</div><div className="text-xs">Thành viên</div></div>
                <div className="bg-red-500 text-white p-4 rounded-2xl shadow-md"><div className="text-3xl font-bold">{stats.emergencyCount}</div><div className="text-xs">SOS Khẩn cấp</div></div>
                <div className="bg-purple-600 text-white p-4 rounded-2xl shadow-md"><div className="text-3xl font-bold">{stats.robotInteractions}</div><div className="text-xs">Tương tác AI</div></div>
                <div className="bg-green-500 text-white p-4 rounded-2xl shadow-md"><div className="text-3xl font-bold">{stats.counselingCount}</div><div className="text-xs">Thư Tư vấn</div></div>
             </div>
          </div>
        )}

        {activeTab === 'CONTACTS' && (
           <div className="animate-fadeIn space-y-4">
              <h2 className="text-lg font-bold text-blue-800">📞 Yêu Cầu Gọi Lại</h2>
              {contactRequests.length === 0 && <div className="text-center text-gray-400 text-sm py-10">Chưa có yêu cầu nào.</div>}
              {contactRequests.map((req) => (
                 <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
                    <div>
                        <div className="font-bold text-gray-800">{req.studentName} <span className="text-xs font-normal bg-gray-100 px-2 rounded">{req.studentClass}</span></div>
                        <div className="text-xs text-gray-400">{new Date(req.timestamp).toLocaleString()}</div>
                    </div>
                    {req.status === 'PENDING' ? (
                       <button onClick={() => handleAcceptContact(req.id)} className="bg-green-500 text-white px-4 py-2 rounded-lg text-xs font-bold shadow-md animate-pulse">Nhận</button>
                    ) : (
                        <span className="text-green-600 text-xs font-bold border border-green-200 px-2 py-1 rounded">Đã xong</span>
                    )}
                 </div>
              ))}
           </div>
        )}

        {activeTab !== 'DASHBOARD' && activeTab !== 'CONTACTS' && (
          <div className="space-y-4 animate-fadeIn">
            {activeTab === 'ROBOT_MODE' && <div className="bg-purple-600 text-white p-4 rounded-xl shadow-md mb-4 text-center text-sm">🤖 Bạn đang nhập vai <b>Robot Nhí Nhố</b>. Mọi cuộc trò chuyện AI của học sinh đều hiện ở đây để bạn theo dõi và hỗ trợ.</div>}
            
            {filteredReports.length === 0 && <div className="text-center text-gray-400 text-sm py-10">Không có dữ liệu.</div>}
            
            {filteredReports.map(report => (
               <div key={report.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden ${report.isAiConversation ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-100'}`}>
                  <div className={`px-4 py-3 border-b flex justify-between items-center ${report.isAiConversation ? 'bg-purple-50' : 'bg-gray-50'}`}>
                      <div>
                          <span className="font-bold text-sm text-gray-800">{report.studentName}</span>
                          {report.type === ReportType.EMERGENCY && <span className="ml-2 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">KHẨN CẤP</span>}
                          {report.isAiConversation && <span className="ml-2 bg-purple-500 text-white text-[10px] px-2 py-0.5 rounded font-bold">LIVE CHAT</span>}
                      </div>
                      <span className="text-[10px] text-gray-400">{new Date(report.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <div className="p-4">
                     {/* Nếu là AI Chat thì không hiện content gốc (vì nó là tiêu đề dummy), chỉ hiện replies */}
                     {!report.isAiConversation && (
                         <p className="mb-3 text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{report.content}</p>
                     )}
                     
                     <div className="space-y-2 mb-3 max-h-60 overflow-y-auto custom-scrollbar">
                         {report.replies.map(rep => (
                             <div key={rep.id} className={`flex flex-col text-xs p-2 rounded border w-max max-w-[90%] 
                                ${rep.author === 'Robot' ? 'bg-purple-50 border-purple-100 text-purple-900 ml-auto' : 
                                  rep.author === 'Teacher' || rep.author === 'Admin' ? 'bg-blue-50 border-blue-100 text-blue-900 ml-auto' :
                                  'bg-white border-gray-200 text-gray-800 mr-auto'
                                }`}>
                                 <span className="font-bold mb-0.5">{rep.author === 'Robot' ? '🤖 AI' : (rep.author === 'Student' ? 'Học sinh' : 'Giáo viên')}</span>
                                 <span>{rep.content}</span>
                             </div>
                         ))}
                     </div>
                     <div className="flex gap-2">
                        <input 
                            value={replyContent[report.id] || ''} 
                            onChange={(e) => setReplyContent({...replyContent, [report.id]: e.target.value})} 
                            placeholder={report.isAiConversation ? "Nhập vai Robot để trả lời..." : "Nhập phản hồi..."} 
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-pink-400" 
                        />
                        <button 
                            onClick={() => handleReply(report.id, activeTab === 'ROBOT_MODE')} 
                            className={`px-4 py-2 rounded-lg font-bold text-white text-xs ${activeTab === 'ROBOT_MODE' ? 'bg-purple-600' : 'bg-blue-600'}`}
                        >
                            Gửi {activeTab === 'ROBOT_MODE' ? '(vai Robot)' : ''}
                        </button>
                     </div>
                  </div>
               </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
