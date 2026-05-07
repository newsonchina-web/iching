export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        const API_KEY = process.env.GEMINI_API_KEY?.trim();
        
        if (!API_KEY) {
            return res.status(500).json({ error: { message: '环境变量 GEMINI_API_KEY 未配置。' } });
        }

        const sysMsg = messages.find(m => m.role === 'system')?.content || "";
        const usrMsg = messages.find(m => m.role === 'user')?.content || "";

        // 核心修复：gemini-1.5-flash 已被谷歌彻底停用！我们直接调用最新的 gemini-2.0-flash
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`;
            
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysMsg }] },
                contents: [{ role: "user", parts: [{ text: usrMsg }] }],
                generationConfig: { temperature: 0.75 }
            })
        });

        const data = await response.json();

        if (response.ok && data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ choices: [{ message: { content: reply } }] });
        } else {
            const errorMsg = data.error?.message || JSON.stringify(data);
            return res.status(500).json({ error: { message: `谷歌接口拒绝访问: ${errorMsg}` } });
        }

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ error: { message: '后端中转崩溃', details: error.message } });
    }
}
