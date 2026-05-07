export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        // 智谱 API Key
        const API_KEY = process.env.ZHIPU_API_KEY?.trim();
        
        if (!API_KEY) {
            return res.status(500).json({ error: { message: '环境变量 ZHIPU_API_KEY 未配置。' } });
        }

        const API_URL = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
            
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: "glm-4-flash", 
                messages: messages,
                temperature: 0.5 // 稍微调低一点温度，保证它严格按照 JSON 格式输出原文
            })
        });

        const data = await response.json();

        if (response.ok && data.choices && data.choices.length > 0) {
            return res.status(200).json({ choices: [{ message: { content: data.choices[0].message.content } }] });
        } else {
            const errorMsg = data.error?.message || JSON.stringify(data);
            return res.status(500).json({ error: { message: `智谱算力接口异常: ${errorMsg}` } });
        }

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ error: { message: '后端节点崩溃', details: error.message } });
    }
}
