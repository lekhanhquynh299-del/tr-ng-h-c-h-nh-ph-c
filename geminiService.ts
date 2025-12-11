import { GoogleGenAI, Type } from "@google/genai";
import { AiAnalysis } from "../types";

let ai: GoogleGenAI | null = null;

// Hàm lấy client
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

// --- CẤU HÌNH TRẢ LỜI OFFLINE (KHI MẤT MẠNG) ---
// Thay vì random, ta dùng từ khóa để chọn câu trả lời phù hợp
const OFFLINE_KNOWLEDGE_BASE = [
  {
    keywords: ['chào', 'hi', 'hello', 'alo'],
    answers: [
      "Chào cậu! Tớ là Nhí Nhố đây. Hôm nay cậu thế nào? 🤖",
      "Hi cậu! Rất vui được gặp cậu. Có chuyện gì vui kể tớ nghe với!",
      "Chào nha! Tớ đang chờ cậu đây. ❤️"
    ]
  },
  {
    keywords: ['buồn', 'khóc', 'chán', 'mệt', 'nản'],
    answers: [
      "Tớ nghe thấy cậu đang không vui. Muốn kể cho tớ nghe không? Tớ biết giữ bí mật mà.",
      "Đừng buồn nha, có tớ ở đây rồi. Cậu cứ khóc nếu muốn, tớ sẽ đợi.",
      "Ôm cậu một cái này! 🫂 Mọi chuyện rồi sẽ ổn thôi.",
      "Hôm nay vất vả cho cậu rồi. Cậu nghỉ ngơi một chút đi nhé."
    ]
  },
  {
    keywords: ['đánh', 'bắt nạt', 'dọa', 'sợ', 'chặn đường'],
    answers: [
      "Nguy hiểm quá! Cậu hãy báo ngay cho thầy cô hoặc bấm nút SOS nhé! 🚨",
      "Đừng sợ, cậu không cô đơn đâu. Hãy kể chi tiết cho thầy cô biết đi cậu.",
      "Việc này không thể giấu được đâu. Cậu cần được bảo vệ ngay lập tức!"
    ]
  },
  {
    keywords: ['học', 'điểm', 'thi', 'bài tập', 'kém'],
    answers: [
      "Điểm số quan trọng nhưng sức khỏe của cậu còn quan trọng hơn. Cố gắng hết sức là được mà! 💪",
      "Đừng áp lực quá nha. Học là một chặng đường dài, vấp ngã một chút không sao đâu.",
      "Nếu bài khó quá, cậu thử hỏi bạn bè hoặc thầy cô xem sao?"
    ]
  },
  {
    keywords: ['cảm ơn', 'thank', 'iu', 'yêu'],
    answers: [
      "Hì hì, không có chi! Cậu vui là tớ vui rồi. 🥰",
      "Yêu cậu nhiều! Cố lên nhé!",
      "Tớ luôn ở đây mà. Cần gì cứ gọi tớ nha."
    ]
  }
];

const DEFAULT_OFFLINE_ANSWERS = [
  "Tớ đang bị mất kết nối mạng xíu, nên chưa hiểu ý cậu lắm. Nhưng tớ vẫn ở đây nghe cậu nè! 🤖",
  "Mạng yếu quá, tớ load không kịp. Cậu nói lại rõ hơn được không?",
  "Tớ hiểu mà. Cậu kể tiếp đi...",
  "Ừm ừm... Tớ đang lắng nghe đây."
];

// Hàm tìm câu trả lời offline dựa trên từ khóa
const getOfflineResponse = (input: string): string => {
  const lowerInput = input.toLowerCase();
  
  for (const topic of OFFLINE_KNOWLEDGE_BASE) {
    // Nếu tìm thấy bất kỳ từ khóa nào trong nhóm
    if (topic.keywords.some(k => lowerInput.includes(k))) {
      // Chọn ngẫu nhiên 1 câu trả lời trong nhóm đó
      return topic.answers[Math.floor(Math.random() * topic.answers.length)];
    }
  }
  
  // Nếu không khớp từ khóa nào, trả về câu mặc định
  return DEFAULT_OFFLINE_ANSWERS[Math.floor(Math.random() * DEFAULT_OFFLINE_ANSWERS.length)];
};

// Hàm chat chính
export const sendMessageToGemini = async (history: { role: 'user' | 'model', parts: { text: string }[] }[], message: string) => {
  // 1. Kiểm tra mạng trình duyệt trước
  if (!navigator.onLine) {
    console.warn("Browser is Offline. Using Rule-based Bot.");
    await new Promise(resolve => setTimeout(resolve, 800)); // Delay giả lập suy nghĩ
    return getOfflineResponse(message);
  }

  try {
    const client = getAiClient();
    
    // 2. Nếu có mạng và có Key Gemini -> Gọi AI thật
    if (client) {
        const chat = client.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction: SYSTEM_INSTRUCTION },
        history: history,
        });
        const result = await chat.sendMessage({ message });
        return result.text;
    } else {
        // 3. Nếu có mạng nhưng KHÔNG có API Key (Chế độ Demo Online) -> Vẫn dùng Logic Offline trả lời cho thông minh
        console.warn("No API Key provided. Using Rule-based Bot.");
        await new Promise(resolve => setTimeout(resolve, 1000));
        return getOfflineResponse(message);
    }
  } catch (error) {
    // 4. Lỗi kết nối API -> Fallback về Offline
    console.error("Gemini Connection Error:", error);
    return getOfflineResponse(message);
  }
};

// Hàm phân tích vụ việc (Giữ nguyên logic fake data khi offline)
export const analyzeReportWithGemini = async (content: string): Promise<AiAnalysis | undefined> => {
    // Nếu offline hoặc không có key, trả về dữ liệu giả định ngẫu nhiên để không bị lỗi App
    if (!navigator.onLine || !process.env.API_KEY) {
        return {
            severityScore: Math.floor(Math.random() * 40) + 40, // Random 40-80
            potentialRisks: [
                "Học sinh có thể đang gặp áp lực tâm lý", 
                "Cần theo dõi thêm biểu hiện trên lớp"
            ],
            teacherAdvice: [
                "Giáo viên nên gặp riêng để hỏi thăm nhẹ nhàng", 
                "Liên hệ phụ huynh nếu cần thiết"
            ]
        };
    }

    try {
        const client = getAiClient();
        if (!client) return undefined;

        const response = await client.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Phân tích báo cáo bạo lực học đường/tâm lý này: "${content}". 
            Hãy đánh giá mức độ nghiêm trọng (0-100), liệt kê 2-3 nguy cơ tiềm ẩn có thể xảy ra tiếp theo, và đưa ra 2-3 gợi ý xử lý sư phạm phù hợp cho giáo viên.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        severityScore: { type: Type.INTEGER, description: "Điểm mức độ nghiêm trọng từ 0 đến 100" },
                        potentialRisks: { 
                            type: Type.ARRAY, 
                            items: { type: Type.STRING },
                            description: "Các nguy cơ tiềm ẩn"
                        },
                        teacherAdvice: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "Lời khuyên xử lý cho giáo viên"
                        }
                    },
                    required: ["severityScore", "potentialRisks", "teacherAdvice"]
                }
            }
        });

        if (response.text) {
            return JSON.parse(response.text) as AiAnalysis;
        }
        return undefined;

    } catch (error) {
        console.error("Analysis Error:", error);
        // Fallback khi lỗi
        return {
            severityScore: 50,
            potentialRisks: ["Không thể phân tích do lỗi kết nối"],
            teacherAdvice: ["Vui lòng kiểm tra lại báo cáo thủ công"]
        };
    }
};
