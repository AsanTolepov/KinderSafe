import Groq from "groq-sdk";

const API_KEY = import.meta.env.VITE_GROQ_API_KEY || '';

export const askParentingAdvice = async (question: string, babyContext: string): Promise<string> => {
  if (!API_KEY) {
    console.error("API Key topilmadi. .env faylni tekshiring.");
    return "Tizim xatoligi: API kalit yo'q.";
  }

  try {
    const groq = new Groq({ 
      apiKey: API_KEY,
      dangerouslyAllowBrowser: true 
    });

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a helpful, empathetic parenting assistant (pediatric expert).
          Context about the baby: ${babyContext}.
          
          INSTRUCTION:
          Detect the language of the user's message (Uzbek, Russian, or English).
          - If the user asks in Uzbek, answer in Uzbek.
          - If the user asks in Russian, answer in Russian.
          - If the user asks in English, answer in English.
          
          Answer in the EXACT SAME language as the user's question. Keep it short, helpful and supportive.`
        },
        {
          role: "user",
          content: question
        }
      ],
      model: "llama-3.3-70b-versatile", 
      temperature: 0.5,
      max_tokens: 1024,
    });

    return completion.choices[0]?.message?.content || "Javob bo'sh keldi.";

  } catch (error: any) {
    console.error("Groq API Xatolik:", error);
    return "Uzr, texnik xatolik yuz berdi. Internetni tekshiring.";
  }
};