import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGemini } from '../services/geminiService';

export const Chatbot: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model'; text: string }[]>([
    { role: 'model', text: "Chào cậu! Tớ là Nhí Nhố đây. Hôm nay cậu cảm thấy thế nào? Có chuyện gì vui hay buồn kể tớ nghe với nhé! 🤖❤️" }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsTyping(true);

    // Prepare history for Gemini
    const history = messages.map(m => ({
      role: m.role,
      parts: [{ text: m.text }]
    }));

    const response = await sendMessageToGemini(history, userMsg);
    
    setIsTyping(false);
    setMessages(prev => [...prev, { role: 'model', text: response || "Tớ chưa hiểu lắm, cậu nói lại được không?" }]);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-sm overflow-hidden border border-pink-100">
      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-4 border-b border-pink-200 flex items-center shadow-md">
        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl mr-3 shadow-sm">
          🤖
        </div>
        <div>
            <span className="font-bold text-white text-lg block leading-none">Nhí Nhố</span>
            <span className="text-white/80 text-xs">Luôn lắng nghe cậu</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-purple-50">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-2xl text-sm shadow-sm break-words whitespace-pre-wrap ${
              msg.role === 'user' 
                ? 'bg-blue-500 text-white rounded-br-none' // User Message: Blue Background, White Text
                : 'bg-white text-gray-800 rounded-bl-none border border-gray-200'
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