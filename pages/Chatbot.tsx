import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';
import { mockApi } from '../services/mockApi';
import { Student, Report } from '../types';

interface ChatbotProps {
  student: Student | undefined;
}

export const Chatbot: React.FC<ChatbotProps> = ({ student }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model' | 'teacher', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  // Fixed type error: Namespace 'NodeJS' has no exported member 'Timeout'
  const pollingInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  // 1. Khởi tạo session chat khi component load
  useEffect(() => {
    const initChat = async () => {
        if (!student) return;
        
        const session = await mockApi.getOrCreateAiSession(student);
        setSessionId(session.id);
        
        // Map replies từ DB sang format của UI
        const mappedMsgs = session.replies.map(r => ({
            role: r.author === 'Student' ? 'user' : (r.author === 'Robot' ? 'model' : 'teacher'),
            text: r.content
        })) as any[];
        
        setMessages(mappedMsgs);
    };
    initChat();

    return () => {
        if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [student]);

  // 2. Tự động cuộn xuống cuối
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Polling để nhận tin nhắn mới từ Giáo viên (Real-time simulation)
  useEffect(() => {
      if (!sessionId) return;

      pollingInterval.current = setInterval(async () => {
          const report = await mockApi.getReportById(sessionId);
          if (report) {
              // So sánh độ dài để xem có tin mới không
              const currentCount = messages.length;
              const dbCount = report.replies.length;
              
              if (dbCount > currentCount) {
                   const mappedMsgs = report.replies.map(r => ({
                        role: r.author === 'Student' ? 'user' : (r.author === 'Robot' ? 'model' : 'teacher'),
                        text: r.content
                    })) as any[];
                    setMessages(mappedMsgs);
              }
          }
      }, 2000); // Check mỗi 2 giây

      return () => {
          if (pollingInterval.current) clearInterval(pollingInterval.current);
      }
  }, [sessionId, messages.length]); // Dependencies quan trọng

  const handleSend = async () => {
    if (!input.trim() || !sessionId) return;

    const userMsg = input;
    setInput('');
    setIsTyping(true);

    // 1. Hiển thị ngay lên UI
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
        // 2. Gọi AI
        // Lấy lịch sử chat để AI hiểu ngữ cảnh (chỉ lấy text user và model)
        const history = messages
            .filter(m => m.role === 'user' || m.role === 'model')
            .map(m => ({
                role: m.role === 'user' ? 'user' : 'model',
                parts: [{ text: m.text }]
            })) as any;

        const aiResponse = await sendMessageToGemini(history, userMsg);
        
        // 3. Lưu cả 2 vào Database (để giáo viên thấy)
        await mockApi.syncAiChat(sessionId, userMsg, aiResponse);
        
        // 4. Cập nhật UI với phản hồi AI
        setMessages(prev => [...prev, { role: 'model', text: aiResponse }]);
    } catch (error) {
        console.error("Chat error", error);
    } finally {
        setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 border-b border-pink-100 flex items-center shadow-md">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl mr-3 shadow-sm">
          🤖
        </div>
        <div>
            <span className="font-bold text-white text-lg block leading-none">Nhí Nhố</span>
            <span className="text-white/80 text-xs">AI Tâm lý & Giáo viên hỗ trợ</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-purple-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
             {msg.role !== 'user' && (
                 <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-1 text-xs font-bold border ${msg.role === 'teacher' ? 'bg-blue-100 text-blue-600 border-blue-200' : 'bg-white text-purple-600 border-purple-200'}`}>
                     {msg.role === 'teacher' ? 'GV' : 'AI'}
                 </div>
             )}
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm break-words whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' 
                : (msg.role === 'teacher' ? 'bg-blue-50 text-blue-900 border border-blue-200 rounded-bl-none' : 'bg-white text-gray-800 rounded-bl-none border border-gray-200')
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-3 rounded-2xl rounded-bl-none flex space-x-1 items-center border border-gray-200 shadow-sm">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s'}}></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s'}}></div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="p-3 border-t bg-white flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Tâm sự với Nhí Nhố..."
          className="flex-1 border border-gray-200 rounded-full px-5 py-3 text-sm focus:ring-2 focus:ring-purple-300 outline-none bg-gray-50 text-gray-800"
        />
        <button 
          onClick={handleSend}
          className="bg-purple-500 hover:bg-purple-600 text-white rounded-full w-12 h-12 flex items-center justify-center transition-colors shadow-lg transform active:scale-95"
        >
          <svg className="w-5 h-5 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  );
};
