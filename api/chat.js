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

        // 终极杀手锏：建立动态尝试列表。谷歌API名字老变，我们把常用的名字全试一遍。
        // gemini-2.0-flash 是当前最新最稳的，其次降级到 1.5 系列。
        const modelsToTry = ["gemini-2.0-flash", "gemini-1.5-flash"];
        let lastError = "";

        for (const model of modelsToTry) {
            const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${API_KEY}`;
            
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

            // 如果成功，立刻返回给前端
            if (response.ok && data.candidates && data.candidates[0].content) {
                const reply = data.candidates[0].content.parts[0].text;
                return res.status(200).json({ choices: [{ message: { content: reply } }] });
            } else {
                lastError = data.error?.message || JSON.stringify(data);
                console.log(`Model ${model} failed:`, lastError);
                // 失败了不报错，继续循环尝试下一个模型！
            }
        }

        // 如果全部失败，把最后的错误抛出来
        return res.status(500).json({ error: { message: `谷歌接口拒绝访问: ${lastError}` } });

    } catch (error) {
        console.error("Vercel Error:", error);
        return res.status(500).json({ error: { message: '后端中转崩溃', details: error.message } });
    }
}
