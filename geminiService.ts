import { GoogleGenAI } from "@google/genai";
import { OFFLINE_RESPONSES } from "./OFFLINE_RESPONSES";

let ai: GoogleGenAI | null = null;

// Hàm lấy client, nếu không có API KEY thì trả về null (để chạy chế độ Offline)
const getAiClient = () => {
  if (!ai && process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
  return ai;
};

const SYSTEM_INSTRUCTION = `
Bạn là "Nhí Nhố", một robot trợ lý tâm lý học đường thân thiện, dễ thương dành cho học sinh cấp 2 (11-15 tuổi).
Phong cách giao tiếp:
- Xưng hô: "Tớ" (Nhí Nhố) và "Cậu" (Học sinh).
- Giọng điệu: Vui vẻ, cảm thông, lắng nghe, không phán xét.
- Nhiệm vụ: Lắng nghe tâm sự, đưa ra lời khuyên nhẹ nhàng về áp lực học tập, bạn bè, gia đình.
`;

export const sendMessageToGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  try {
    const client = getAiClient();
    
    // Nếu có API Key thì dùng Gemini thật
    if (client) {
        const chat = client.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        history: history,
        });
        const result = await chat.sendMessage({ message });
        return result.text;
    } 
    
    // Nếu KHÔNG có API Key (Chạy trên AppsGeyser mà chưa nạp tiền), dùng chế độ Demo
    else {
        console.warn("Running in Offline Demo Mode (No API Key)");
        await new Promise(resolve => setTimeout(resolve, 1000)); // Giả lập đang suy nghĩ
        const randomResponse = OFFLINE_RESPONSES[Math.floor(Math.random() * OFFLINE_RESPONSES.length)];
        return randomResponse;
    }

  } catch (error) {
    console.error("Gemini Error:", error);
    return "câu hỏi này qua sức của tớ rồi cậu có thể hỏi câu này với thầy cô bằng cách nhấp vào phần tâm sự ";
  }
};