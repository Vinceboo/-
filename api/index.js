/**
 * Coze Node.js SDK 后端服务
 *
 * 环境变量（.env）:
 *   COZE_API_TOKEN - Coze Personal Access Token
 *   BOT_ID         - 目标 Bot ID
 *   COZE_BASE_URL  - API 地址（默认 https://api.coze.cn）
 *   PORT           - 服务端口（默认 3000）
 */

const { CozeAPI, ChatEventType } = require('@coze/api');
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// 初始化 Coze API 客户端
const coze = new CozeAPI({
  baseURL: process.env.COZE_BASE_URL || 'https://api.coze.cn',
  token: process.env.COZE_API_TOKEN || '',
  debug: process.env.NODE_ENV === 'development',
});

/**
 * 健康检查
 * GET /health
 */
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Coze API 服务运行正常' });
});

/**
 * 流式聊天接口（供小程序调用）
 * POST /api/chat/stream
 *
 * Body: { query: string, conversation_id?: string, user_id?: string }
 * Response: SSE（text/event-stream）
 *   - 增量：data: {"event":"conversation.message.delta","content":"..."}
 *   - 结束：data: [DONE]
 */
app.post('/api/chat/stream', async (req, res) => {
  const { query, conversation_id, user_id } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: '缺少必要参数: query' });
  }

  const botId = process.env.BOT_ID;
  if (!botId) {
    return res.status(500).json({ success: false, error: '服务端未配置 BOT_ID' });
  }

  // SSE 响应头
  res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  try {
    const stream = await coze.chat.stream({
      bot_id: botId,
      user_id: user_id || 'miniprogram_user',
      additional_messages: [
        {
          role: 'user',
          content: query,
          content_type: 'text',
        },
      ],
      conversation_id: conversation_id || undefined,
      auto_save_history: true,
    });

    for await (const event of stream) {
      // Coze SDK v1.x 实际结构：event.data（不是 event.message）
      const data = event.data;

      if (event.event === ChatEventType.CONVERSATION_MESSAGE_DELTA) {
        // 只转发 assistant 的 answer 类型文本增量
        if (data?.role === 'assistant' && data?.type === 'answer' && data?.content) {
          res.write(`data: ${JSON.stringify({ event: 'delta', content: data.content })}\n\n`);
        }
      } else if (event.event === ChatEventType.CONVERSATION_MESSAGE_COMPLETED) {
        // 消息完成：转发 conversation_id 供前端多轮对话使用
        if (data?.role === 'assistant' && data?.type === 'answer') {
          res.write(`data: ${JSON.stringify({
            event: 'completed',
            conversation_id: data.conversation_id || '',
          })}\n\n`);
        }
      } else if (event.event === ChatEventType.ERROR) {
        // Coze 返回的业务错误（如 Bot 未发布、权限不足等）
        console.error('Coze error event:', data);
        res.write(`data: ${JSON.stringify({
          event: 'error',
          message: data?.msg || `Coze 错误 ${data?.code || ''}`,
        })}\n\n`);
      }
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: error.message || '流式聊天请求失败' });
    } else {
      res.write(`data: ${JSON.stringify({ event: 'error', message: error.message || '请求失败' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
    }
  }
});

/**
 * 普通聊天接口（非流式，备用）
 * POST /api/chat
 */
app.post('/api/chat', async (req, res) => {
  const { query, conversation_id, user_id } = req.body;

  if (!query) {
    return res.status(400).json({ success: false, error: '缺少必要参数: query' });
  }

  const botId = process.env.BOT_ID;
  if (!botId) {
    return res.status(500).json({ success: false, error: '服务端未配置 BOT_ID' });
  }

  try {
    const result = await coze.chat.createAndPoll({
      bot_id: botId,
      user_id: user_id || 'miniprogram_user',
      additional_messages: [
        {
          role: 'user',
          content: query,
          content_type: 'text',
        },
      ],
      conversation_id: conversation_id || undefined,
      auto_save_history: true,
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({ success: false, error: error.message || '聊天请求失败' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Coze API 服务运行在 http://localhost:${PORT}`);
  console.log(`🤖 BOT_ID: ${process.env.BOT_ID || '⚠️  未配置'}`);
  console.log(`🔑 TOKEN: ${process.env.COZE_API_TOKEN ? '已配置' : '⚠️  未配置'}`);
});
