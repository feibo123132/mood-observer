const axios = require('axios');

/**
 * 云函数入口函数
 * 
 * @param {Object} event
 * @param {number[]} event.moodScores - 一周的情绪分数数组，如 [80, 90, 50, ...]
 * @param {string[]} event.notes - 一周的用户笔记数组
 * @param {Object} context
 */
exports.main = async (event, context) => {
  console.log('Function analyzeMood invoked with:', JSON.stringify(event));

  const { moodScores, notes } = event;

  // 1. 参数校验
  if (!moodScores || !Array.isArray(moodScores) || moodScores.length === 0) {
    console.error('Invalid moodScores:', moodScores);
    return {
      success: false,
      error: '请提供有效的情绪分数数据 (moodScores)'
    };
  }

  // 笔记允许为空，给个默认值
  const safeNotes = (Array.isArray(notes) && notes.length > 0) ? notes : ['(本周无详细文字记录)'];

  // 2. 检查环境变量
  const API_KEY = process.env.DEEPSEEK_API_KEY;
  if (!API_KEY) {
    console.error('Missing DEEPSEEK_API_KEY environment variable');
    return {
      success: false,
      error: '服务端配置错误：缺少 API 密钥'
    };
  }

  // 3. 构建 Prompt
  const prompt = `
你是一位温暖、包容且专业的心理咨询师。请根据以下用户本周的情绪数据和日记，生成一份简明扼要的情绪周报（约300字）。

【数据概览】
- 情绪分数趋势（0-100分，分数越高代表心情越好）：${moodScores.join(', ')}
- 用户日记关键词/片段：${safeNotes.join('; ')}

【生成要求】
1. **共情与接纳**：用温暖的语调开场，肯定用户记录情绪的努力。
2. **趋势分析**：观察分数的波动，结合日记内容尝试分析可能的影响因素（如果日记内容较少，则更多基于分数趋势进行通用解读）。
3. **实用建议**：给出1-2条简单易行的心理调节或生活建议。
4. **结语**：给予一句充满希望的鼓励。
5. 格式清晰，分段输出，不要使用Markdown标题语法（#），直接使用文本段落。
`;

  try {
    console.log('Calling DeepSeek API...');
    
    // 4. 调用 DeepSeek API
    const response = await axios.post(
      'https://api.deepseek.com/chat/completions',
      {
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "你是专业的心理咨询师，擅长认知行为疗法(CBT)和共情沟通。" },
          { role: "user", content: prompt }
        ],
        temperature: 0.7, // 稍微增加一点创造性
        max_tokens: 1000,
        stream: false
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`
        },
        timeout: 55000 // 设置 axios 请求超时为 55s (留 5s 给云函数自身启动和返回)
      }
    );

    // 5. 解析返回结果
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      const content = response.data.choices[0].message.content;
      console.log('DeepSeek API response success');
      
      return {
        success: true,
        report: content,
        timestamp: Date.now()
      };
    } else {
      console.error('DeepSeek API returned unexpected structure:', JSON.stringify(response.data));
      return {
        success: false,
        error: 'AI 服务返回数据异常'
      };
    }

  } catch (error) {
    // 详细错误日志
    if (error.response) {
      // 请求已发出，服务器返回状态码不在 2xx 范围
      console.error('DeepSeek API Error Status:', error.response.status);
      console.error('DeepSeek API Error Data:', JSON.stringify(error.response.data));
      return {
        success: false,
        error: `AI 服务请求失败 (${error.response.status}): ${JSON.stringify(error.response.data)}`
      };
    } else if (error.request) {
      // 请求已发出，但没有收到响应
      console.error('DeepSeek API No Response:', error.request);
      return {
        success: false,
        error: 'AI 服务响应超时，请稍后重试'
      };
    } else {
      // 设置请求时发生错误
      console.error('DeepSeek API Setup Error:', error.message);
      return {
        success: false,
        error: `系统错误: ${error.message}`
      };
    }
  }
};
