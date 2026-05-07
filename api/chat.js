export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY;
        
        if (!API_KEY) {
            return res.status(500).json({ error: { message: '环境变量 GEMINI_API_KEY 未配置' } });
        }

        const sysMsg = messages.find(m => m.role === 'system')?.content || "";
        const usrMsg = messages.find(m => m.role === 'user')?.content || "";

        // 谷歌原生 API 端点
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysMsg }] },
                contents: [{ role: "user", parts: [{ text: usrMsg }] }],
                generationConfig: { 
                    temperature: 0.7,
                    maxOutputTokens: 1000 
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorText = data.error?.message || JSON.stringify(data);
            return res.status(response.status).json({ error: { message: `Gemini API 错误: ${errorText}` } });
        }

        // 解析谷歌原生响应并包装成前端兼容格式
        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({
                choices: [{ message: { content: reply } }]
            });
        } else {
            throw new Error("模型未返回有效内容");
        }

    } catch (error) {
        console.error("Vercel Function Error:", error);
        return res.status(500).json({ error: { message: '后端中转异常', details: error.message } });
    }
}
