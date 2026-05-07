export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        // 关键修复：加入 .trim() 防止环境变量末尾不小心多复制了空格导致验证失败
        const API_KEY = process.env.GEMINI_API_KEY?.trim();
        
        if (!API_KEY) {
            return res.status(500).json({ error: { message: '环境变量 GEMINI_API_KEY 未配置' } });
        }

        const sysMsg = messages.find(m => m.role === 'system')?.content || "";
        const usrMsg = messages.find(m => m.role === 'user')?.content || "";

        // 关键修复：改用 gemini-1.5-flash-latest，防止某些老节点找不到基础名称
        const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: sysMsg }] },
                contents: [{ role: "user", parts: [{ text: usrMsg }] }],
                generationConfig: { 
                    temperature: 0.75
                }
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const errorText = data.error?.message || JSON.stringify(data);
            return res.status(response.status).json({ error: { message: `大模型拒绝访问: ${errorText}` } });
        }

        if (data.candidates && data.candidates[0].content) {
            const reply = data.candidates[0].content.parts[0].text;
            return res.status(200).json({ choices: [{ message: { content: reply } }] });
        } else {
            throw new Error("大模型未返回有效文本");
        }

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ error: { message: '中转站执行异常', details: error.message } });
    }
}
