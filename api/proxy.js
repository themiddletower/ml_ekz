export default async function handler(req, res) {
  // Настройка CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    const { apiKey, prompt } = req.body;
    if (!apiKey || !prompt) return res.status(400).json({ error: 'Missing Data' });

    // ==========================================
    // НАСТРОЙКИ (ВЫБЕРИ ПРОВАЙДЕРА)
    // ==========================================
    
    // ВАРИАНТ 1: GROQ (Рекомендую! Llama 3)
    // const ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
    // const MODEL_NAME = 'llama-3.3-70b-versatile'; // Очень умная и быстрая

    ВАРИАНТ 2: DEEPSEEK (Раскомментируй эти 2 строки, если хочешь DeepSeek)
    const ENDPOINT = 'https://api.deepseek.com/chat/completions';
    const MODEL_NAME = 'deepseek-chat';

    // ВАРИАНТ 3: OPENAI (Если купишь ключ за 5$)
    // const ENDPOINT = 'https://api.openai.com/v1/chat/completions';
    // const MODEL_NAME = 'gpt-4o-mini';

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
          // Системный промпт (можно сказать ему отвечать кратко)
          { role: "system", content: "You are a helpful assistant." },
          { role: "user", content: prompt }
        ],
        "stream": false
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    // Приводим ответ к формату, который ждет твой index.html
    // (У Gemini формат другой, поэтому мы тут "подделываем" структуру под Gemini)
    const text = data.choices[0].message.content;
    
    res.status(200).json({
      candidates: [
        { content: { parts: [{ text: text }] } }
      ]
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
