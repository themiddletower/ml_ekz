export default async function handler(req, res) {
  // 1. Настройка CORS (чтобы работало с любого домена)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Обработка preflight запросов
  if (req.method === 'OPTIONS') return res.status(200).end();
  
  // Разрешаем только POST
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { apiKey, prompt } = req.body;
    
    // Проверка данных
    if (!apiKey || !prompt) {
        return res.status(400).json({ error: 'Missing Data: Нужен API ключ и вопрос' });
    }

    // ==========================================
    // НАСТРОЙКИ ДЛЯ OPENAI (GPT-4o-mini)
    // ==========================================
    const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    
    // Если захочешь DeepSeek, просто поменяй эти две строчки:
    // const ENDPOINT = 'https://api.deepseek.com/chat/completions';
    // const MODEL_NAME = 'deepseek-reasoner'; // Или 'deepseek-chat'
    
    const MODEL_NAME = 'gpt-4o-mini'; 
    // ==========================================

    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages: [
          // Системный промпт (задает поведение)
          { role: "system", content: "You are a helpful assistant. Please answer correctly and concisely." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6 // Креативность (0.6 - оптимально для экзамена)
      })
    });

    const data = await response.json();

    // Если OpenAI вернул ошибку (например, кончились деньги)
    if (!response.ok) {
      // Возвращаем ошибку так, чтобы твой HTML её показал
      return res.status(response.status).json({
          error: data.error?.message || "Unknown OpenAI Error"
      });
    }

    // ВАЖНО: Превращаем ответ OpenAI в формат Gemini
    // Твой index.html ждет data.candidates[0].content...
    const text = data.choices[0].message.content;
    
    res.status(200).json({
      candidates: [
        { content: { parts: [{ text: text }] } }
      ]
    });

  } catch (error) {
    res.status(500).json({ error: "Server Error: " + error.message });
  }
}
