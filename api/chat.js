export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        const API_KEY = process.env.ZHIPU_API_KEY?.trim();
        if (!API_KEY) { return res.status(500).json({ error: { message: '服务器未配置 ZHIPU_API_KEY。' } }); }

        const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
            
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({
                model: "glm-4-flash", 
                messages: messages, 
                temperature: 0.4 
            })
        });

        const data = await response.json();
        if (response.ok && data.choices && data.choices.length > 0) {
            return res.status(200).json({ choices: [{ message: { content: data.choices[0].message.content } }] });
        } else {
            return res.status(500).json({ error: { message: `智谱中枢报错: ${data.error?.message || JSON.stringify(data)}` } });
        }
    } catch (error) {
        return res.status(500).json({ error: { message: '云端算力网络崩溃', details: error.message } });
    }
}