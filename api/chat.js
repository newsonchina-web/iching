export default async function handler(req, res) {
    // 允许跨域请求或预检请求
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // Vercel 会自动解析 JSON body
        const requestBody = req.body;
        
        const geminiKey = process.env.GEMINI_API_KEY;
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        
        let API_KEY = geminiKey;
        let API_URL = "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";
        let modelName = "gemini-1.5-flash";
        
        if (!geminiKey && deepseekKey) {
            API_KEY = deepseekKey;
            API_URL = "https://api.deepseek.com/v1/chat/completions";
            modelName = "deepseek-chat";
        }

        if (!API_KEY) {
            return res.status(500).json({ 
                error: { message: '服务器未配置 API 密钥。请在 Vercel 环境变量中添加 GEMINI_API_KEY。' } 
            });
        }

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: modelName,
                messages: requestBody.messages,
                temperature: 0.75
            })
        });

        const data = await response.json();

        if (!response.ok) {
            return res.status(response.status).json(data);
        }

        return res.status(200).json(data);

    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: { message: '云端中转站异常' }, details: error.message });
    }
}
