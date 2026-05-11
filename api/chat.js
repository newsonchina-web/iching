export default async function handler(req, res) {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const { messages } = req.body;
        const API_KEY = process.env.ZHIPU_API_KEY?.trim();
        
        const response = await fetch("https://open.bigmodel.cn/api/paas/v4/chat/completions", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${API_KEY}` },
            body: JSON.stringify({ 
                model: "glm-4-flash", 
                messages: messages, 
                temperature: 0.5, 
                max_tokens: 1500 
            })
        });

        const data = await response.json();
        return res.status(200).json(data);
    } catch (error) {
        return res.status(500).json({ error: { message: 'Network transmission error' } });
    }
}