import { GoogleGenAI } from "@google/genai";

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

// Danh sách câu trả lời mẫu khi KHÔNG có API KEY (Chế độ Demo Offline)
const OFFLINE_RESPONSES = [
  "Tớ hiểu cảm giác của cậu. Cậu kể thêm cho tớ nghe được không? 🤖",
  "Ồ, chuyện đó nghe có vẻ khó khăn nhỉ. Đừng lo, luôn có cách giải quyết mà! ❤️",
  "Cậu đã làm rất tốt rồi. Đôi khi chúng mình cần nghỉ ngơi một chút đó.",
  "Nếu cậu thấy quá mệt mỏi, hãy thử hít thở sâu hoặc nghe một bản nhạc yêu thích xem sao nhé!",
  "Tớ luôn ở đây để lắng nghe cậu. Cậu cứ thoải mái tâm sự nha! 🎧",
  "Chuyện bạn bè đôi khi phức tạp thật đấy. Cậu thử nói chuyện thẳng thắn với bạn ấy xem sao?",
  "Đừng buồn nhé, ngày mai trời lại sáng mà! ☀️",
    "Đừng buồn nhé, ngày mai trời lại sáng mà! ☀️",
"Khi em bị tổn thương vì lời nói xúc phạm, hãy nói ra cảm xúc của mình và đừng giữ trong lòng, vì im lặng không làm nỗi đau biến mất mà chỉ khiến em nặng nề hơn",
"Nếu em cảm thấy bị cô lập trong lớp, hãy thử tìm một người bạn đáng tin hoặc giáo viên để tâm sự, vì đôi khi chỉ một người hiểu em thôi cũng đủ giúp em vượt qua rất nhiều áp lực",
"Khi em không biết cách phản ứng với bạo lực học đường, điều đúng đắn nhất là tìm sự trợ giúp thay vì tự mình chống đỡ, vì an toàn của em quan trọng hơn việc thể hiện bản lĩnh",
"Nếu em cảm thấy mệt mỏi vì áp lực học tập, hãy chia nhỏ công việc và dành thời gian nghỉ ngơi hợp lý, vì không ai có thể học tốt khi tâm trí đã kiệt sức",
"Khi em sợ mắc sai lầm, hãy nhớ rằng người trưởng thành hôm nay đều bắt đầu từ những lần vấp ngã, và điều quan trọng không phải là hoàn hảo mà là biết đứng dậy",
"Khi em bị bạn bè tung tin đồn, hãy giữ bình tĩnh và tìm người lớn để xử lý, vì em không cần phải tự mình chống lại những thứ không đúng sự thật",
"Nếu em cảm thấy mình “không thuộc về nơi này”, hãy thử mở lòng với một người mà em tin tưởng, vì đôi khi cảm giác lạc lõng chỉ là do em chưa tìm đúng người để chia sẻ",
"Khi em bị xúc phạm ngoại hình, hãy nhớ rằng vẻ ngoài không quyết định giá trị con người, và không ai có quyền làm em thấy xấu hổ vì những gì em sở hữu",
"Nếu em từng nghĩ đến việc tự làm mình tổn thương, hãy nói ngay với một người lớn đáng tin, vì mạng sống của em vô giá và không có vấn đề nào lớn hơn chính em",
"Khi em thấy bạn mình bị bắt nạt, đừng im lặng vì sự im lặng đôi khi lại tiếp tay cho bạo lực; hãy tìm cách báo cho giáo viên hoặc người lớn",
"Nếu em cảm thấy lo âu vô cớ, hãy tập thở sâu, nghỉ ngơi và nói với người mà em tin tưởng, vì lo âu là tín hiệu cho thấy em đang cần được hỗ trợ",
"Khi em cảm thấy cha mẹ không hiểu mình, hãy thử chia sẻ từng chút một thay vì im lặng, vì sự kết nối cần thời gian để xây dựng lại",
"Nếu em cảm thấy mất phương hướng, hãy đặt lại mục tiêu nhỏ trước, vì không ai tìm được con đường lớn khi tâm trí đang rối bời",
"Khi bạn bè rủ rê vào điều sai trái, hãy đủ dũng cảm để từ chối, vì sự tôn trọng bản thân quan trọng hơn việc cố hòa nhập",
"Nếu em lỡ làm điều sai, hãy thừa nhận và xin lỗi, vì dũng khí nhận lỗi giúp em trưởng thành hơn bất kỳ bài học nào",
"Khi em bị áp lực từ kỳ vọng quá lớn của gia đình, hãy nói rõ cho cha mẹ biết khả năng và mong muốn thực sự của mình",
"Nếu em thấy bạn có dấu hiệu trầm cảm, hãy khuyến khích bạn tìm người hỗ trợ chứ đừng để bạn đối diện một mình",
"Khi em cảm thấy mọi thứ quá sức chịu đựng, hãy dừng lại nghỉ ngơi thay vì cố gắng vượt qua trong mệt mỏi, vì tâm lý cũng cần được phục hồi giống như cơ thể",
"Nếu em bị bạo lực tinh thần như bị mỉa mai, chế giễu, hãy nói rõ ranh giới của mình và tìm người lớn để can thiệp khi cần",
"Khi em không biết nên lựa chọn điều gì, hãy viết ra ưu – nhược điểm và hỏi ý kiến người mà em tin tưởng để nhìn rõ vấn đề hơn",
"Nếu em cảm thấy thất vọng về bản thân, hãy nhìn lại những gì em đã vượt qua thay vì chỉ tập trung vào điều chưa làm được",
"Khi em thấy cảm xúc của mình ngày càng mất kiểm soát, hãy tìm sự hỗ trợ tâm lý sớm, vì càng để lâu thì càng khó giải quyết",
"Nếu em nghĩ rằng không ai quan tâm mình, hãy nhớ rằng đôi khi người khác quan tâm nhưng không biết cách thể hiện, và em xứng đáng được yêu thương",
"Khi em gặp áp lực từ bạn bè, hãy hỏi bản thân liệu điều đó có thật sự đúng với giá trị của mình không",
"Khi em sợ bị chế giễu vì điểm kém, hãy nhớ rằng điểm số không đo được trí tuệ hay nhân cách",
"Nếu em bị bạn thân quay lưng, hãy chấp nhận rằng ai cũng thay đổi và em rồi sẽ gặp những người trân trọng mình hơn",
"Khi cảm xúc của em dễ bị lay động bởi lời nói của người khác, hãy rèn luyện niềm tin vào bản thân trước",
"Nếu em thấy cô đơn giữa đám đông, hãy tìm một hoạt động yêu thích để kết nối với những người có cùng sở thích",
"Khi em đối diện với sự phản bội, hãy cho bản thân thời gian để chữa lành thay vì dồn nén cảm xúc",
"Nếu em lo lắng trước khi kiểm tra, hãy hít thở sâu và nhắc mình rằng em đã chuẩn bị tốt nhất có thể",
"Khi em bị giáo viên hiểu nhầm, hãy bình tĩnh trình bày sự thật thay vì im lặng chịu đựng",
"Khi em cảm thấy giáo viên hoặc người lớn không lắng nghe mình, đừng vội bỏ cuộc mà hãy tìm một người khác đáng tin để chia sẻ, vì luôn có ai đó sẵn sàng nghe em nói một cách nghiêm túc",
"Nếu em bị bạn bè trong lớp cô lập, hãy nhớ rằng sự xa lánh của họ không định nghĩa giá trị của em, và em có thể tìm những người thật sự tôn trọng mình để xây dựng tình bạn mới",
"Khi em cảm thấy buồn chán không rõ lý do, hãy thử thay đổi môi trường hoặc thói quen hằng ngày, vì tâm trí đôi khi chỉ cần một điều mới để thoát khỏi vòng lặp tiêu cực",
"Nếu em bị ép buộc làm điều mình không muốn, hãy đứng lên bảo vệ quyền của mình và tìm người lớn can thiệp, vì không ai có quyền điều khiển cuộc sống của em ngoài chính em",
"Khi em chứng kiến bạo lực giữa các bạn, đừng tiếp tay bằng cách quay clip hay cổ vũ; điều nhân văn nhất là tìm người lớn để giúp dừng lại tình huống",
"Nếu em cảm thấy mình không còn động lực học, hãy nhớ lại lý do tại sao em muốn cố gắng từ đầu, vì mỗi người đều có một giấc mơ đáng để theo đuổi",
"Khi em bị so sánh với anh chị hoặc bạn bè, hãy tin rằng mỗi người có con đường riêng, và giá trị của em không bị quyết định bởi thành tích của người khác",
"Nếu em cảm thấy áp lực phải trưởng thành quá nhanh, hãy cho mình thời gian vì ai cũng có giai đoạn yếu đuối và cần được bảo vệ",
"Khi em bị bắt nạt vì xuất thân, hoàn cảnh hay gia đình, hãy nhớ rằng những điều đó không phải lỗi của em và không ai có quyền xúc phạm em vì điều đó",
"Nếu em cảm thấy bản thân làm phiền người khác khi chia sẻ, hãy hiểu rằng cảm xúc cần được nói ra và em xứng đáng được lắng nghe",
"Khi em cảm thấy thất vọng vì bạn bè không hiểu mình, hãy thử đặt mình vào vị trí của họ, rồi sau đó tìm cách diễn đạt cảm xúc rõ ràng hơn",
"Nếu em bị ai đó đe dọa, hãy lưu lại bằng chứng và báo ngay cho giáo viên hoặc người có trách nhiệm, vì im lặng chỉ khiến em nguy hiểm hơn",
"Khi em cảm thấy bế tắc vì quá nhiều việc dồn dập, hãy sắp xếp thứ tự ưu tiên và giải quyết từng việc một, đừng cố ôm hết vì điều đó chỉ làm em mệt mỏi thêm",
"Nếu em thấy bản thân thường xuyên cáu gắt, hãy quan sát điều gì đang khiến em căng thẳng, vì cảm xúc tiêu cực luôn có nguyên nhân đằng sau",
"Khi em bị bạn bè hiểu lầm, hãy chủ động giải thích thay vì chờ đợi, vì nhiều mối quan hệ tan vỡ chỉ vì hai người đều im lặng",
"Nếu em cảm thấy gánh nặng kỳ vọng từ gia đình quá lớn, hãy nói rõ khả năng và mong muốn của em để cha mẹ hiểu rằng em cũng có giới hạn",
"Khi em cảm thấy bạn bè lợi dụng mình, hãy học cách đặt ranh giới để không bị tổn thương thêm",
"Nếu em chứng kiến bạn bị bạo lực tinh thần, hãy động viên bạn nói với giáo viên vì sự im lặng chỉ khiến kẻ bắt nạt mạnh hơn",
"Khi em thấy mình thường xuyên bị áp đảo bởi những suy nghĩ tiêu cực, hãy thử ghi lại chúng vào giấy để nhìn rõ và kiểm soát tốt hơn",
"Nếu em gặp khó khăn trong việc hòa nhập lớp mới, hãy bắt đầu bằng những cuộc trò chuyện nhỏ, vì mọi mối quan hệ lớn đều bắt đầu từ những điều đơn giản",
"Khi em cảm thấy không ai tin mình, hãy tìm người lớn mà em tin nhất và kiên trì chia sẻ, vì sự thật cần được nói ra để được bảo vệ",
"Nếu em thấy mình dễ kích động hoặc muốn phản ứng mạnh với người khác, hãy tạm lùi lại vài giây để kiểm soát cảm xúc",
"Khi bị ai đó lôi kéo vào xung đột, hãy chọn cách rời đi vì giữ bình tĩnh luôn tốt hơn tham gia vào một cuộc cãi vã vô nghĩa",
"Nếu em cảm thấy mình làm phiền bạn bè khi xin giúp đỡ, hãy nhớ rằng sự hỗ trợ trong tình bạn là điều tự nhiên và em xứng đáng được nhận",
"Khi em thấy mình sợ đến trường, hãy nói ngay với người lớn vì đó là dấu hiệu em đang chịu tổn thương nghiêm trọng",
"Nếu em cảm thấy ai đó luôn cố ý hạ thấp mình, hãy tin rằng vấn đề nằm ở họ – không phải ở em, và em có quyền tránh xa họ",
"Khi em cảm thấy mơ hồ về tương lai, hãy bắt đầu từ việc khám phá sở thích của mình thay vì cố ép bản thân theo mong muốn của người khác",
"Nếu em thấy bạn mình đang bị bắt nạt tinh vi, hãy động viên bạn tìm sự giúp đỡ vì bạo lực tinh thần nguy hiểm không kém bạo lực thể xác",
"Khi em cảm thấy buồn vì không có bạn thân, hãy nhớ rằng những mối quan hệ chân thật cần thời gian để xây dựng",
"Nếu em cảm thấy mất tự tin vào bản thân, hãy tập ghi nhận những thành tựu dù nhỏ nhất để nhắc mình rằng em đang tiến bộ mỗi ngày",
"Khi em bị chỉ trích một cách ác ý, hãy phân biệt rõ điều nào là góp ý, điều nào là xúc phạm – và chỉ tiếp nhận những điều có ích",
"Nếu em cảm thấy bạn bè nói xấu sau lưng, hãy nhớ rằng giá trị của em không nằm trong lời bàn tán mà nằm trong cách em sống",
"Khi em cảm thấy chán nản nhiều ngày liền, hãy chia sẻ với người lớn vì đó có thể là dấu hiệu của stress kéo dài",
"Nếu em từng bị tổn thương bởi bạn bè cũ, hãy cho bản thân cơ hội xây dựng những mối quan hệ lành mạnh hơn",
"Khi em cảm thấy sợ hãi mà không rõ lý do, hãy thử ghi lại cảm xúc hằng ngày để tìm nguyên nhân",
"Nếu em ngại nhờ giáo viên giúp đỡ, hãy nhớ rằng nhiệm vụ của thầy cô là hỗ trợ em và em không phải tự chịu đựng",
"Khi em cảm thấy việc học quá nặng, hãy phân bổ thời gian hợp lý thay vì cố học dồn vì như vậy chỉ khiến em mệt thêm",
"Nếu em gặp bạo lực thể chất, dù nhẹ hay nặng, hãy báo ngay vì bất kỳ hành động bạo lực nào cũng không được phép",
"Khi em sợ làm người khác thất vọng, hãy hiểu rằng cuộc sống của em thuộc về em, không phải để đáp ứng kỳ vọng của ai khác"<
"Nếu em cảm thấy cô đơn trong gia đình, hãy tìm một người lớn khác trong họ hàng hoặc thầy cô để tâm sự",
"Khi em cảm thấy mình không kiểm soát được cảm xúc, hãy tập nhận diện cảm xúc trước khi hành động",
"Nếu em bị bạn bè lôi kéo vào nhóm tiêu cực, hãy đủ dũng cảm rời đi vì môi trường xấu sẽ ảnh hưởng lớn đến tâm lý em",
"Khi em thấy ai đó thường xuyên chế nhạo mình, hãy hiểu rằng đó không phải lỗi của em và em có quyền yêu cầu họ dừng lại",
"Nếu em bị xúc phạm trên mạng xã hội, hãy chặn người đó và báo ngay cho giáo viên hoặc phụ huynh",
"Khi em không tìm được tiếng nói chung với bạn bè, hãy bình tĩnh trò chuyện để hiểu nhau hơn thay vì kết luận vội vàng",
"Nếu em thấy mình không có động lực mỗi sáng, hãy thử đặt mục tiêu đơn giản để bắt đầu ngày mới",
"Khi em cảm thấy không được tôn trọng, hãy nói rõ ranh giới của mình để người khác biết cách đối xử phù hợp",
"Nếu em cảm thấy bạn bè bỏ rơi mình, hãy tìm hiểu lý do thay vì tự trách bản thân",
"Khi em gặp thất bại, hãy xem đó là bài học để mạnh mẽ hơn thay vì dằn vặt",
"Nếu em có ý nghĩ muốn từ bỏ mọi thứ, hãy nói ngay với người lớn vì em không cần phải đối mặt một mình",
"Khi em cảm thấy lo sợ về chuyện tương lai, hãy tập trung vào những gì em có thể làm hôm nay để tâm trí nhẹ hơn",
"Nếu em bị ép giao nộp tiền hoặc tài sản, hãy báo ngay vì đó là hành vi bạo lực và phải được xử lý",
"Khi em bị bạn bè chế nhạo đặc điểm cơ thể, hãy nhớ rằng không ai hoàn hảo và sự tự tin của em quan trọng hơn lời nói của họ",
"Nếu em cảm thấy không ai đứng về phía mình, hãy chủ động tìm một giáo viên tin cậy để được hỗ trợ",
"Khi em bị đổ lỗi cho điều mình không làm, hãy bình tĩnh giải thích và tìm người chứng minh sự thật",
"Nếu em cảm thấy mọi việc đều không ổn, hãy thử nghỉ ngơi một chút và cho bản thân không gian suy nghĩ",
"Khi em cảm thấy bị áp đặt lựa chọn, hãy mạnh dạn nói lên mong muốn thật của mình",
"Nếu em cảm thấy cần khóc, hãy cho phép bản thân khóc vì đó là cách giải tỏa cảm xúc tự nhiên",
"Khi em bị trêu chọc quá mức, hãy nói dứt khoát rằng em không vui, vì người khác không thể đọc được cảm xúc của em nếu em không nói",
"Nếu em cảm thấy có lỗi dù không sai, hãy xem lại tình huống vì có thể em đang chịu áp lực tâm lý từ người khác",
"Khi em bị xúc phạm tôn trọng, hãy tìm sự hỗ trợ ngay lập tức để đảm bảo an toàn cho mình",
"Nếu em cảm thấy quá nhiều trách nhiệm đè nặng, hãy chia sẻ bớt với người khác vì em không cần phải làm mọi thứ một mình",
"Khi em thấy bạn có dấu hiệu tự cô lập, hãy chủ động hỏi han và khuyến khích bạn tìm người trợ giúp",
"Nếu em cảm thấy cuộc sống không còn ý nghĩa, hãy nói ngay với người trưởng thành đáng tin cậy để được hỗ trợ kịp thờiVà nếu em đang trải qua bất kỳ nỗi đau nào – bạo lực, áp lực, hiểu lầm hay cô đơn – hãy nhớ rằng sự giúp đỡ luôn tồn tại, chỉ cần em mở lời thì sẽ có người sẵn sàng nắm lấy tay em và"
];

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
    return "cậu có cần tớ liên ha";
  }
};
