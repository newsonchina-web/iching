export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        const API_KEY = process.env.ZHIPU_API_KEY?.trim();
        if (!API_KEY) return res.status(500).json({ error: { message: 'API key not configured' } });

        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: "glm-4-flash",
                messages: messages,
                temperature: 0.5,
                max_tokens: 2500 // 调高以支持极其详尽的结构化输出
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: { message: 'Cloud connection failure' } });
    }
}