/**
 * Coze Node.js SDK 使用示例
 * 
 * 这是一个后端 API 服务示例，用于在小程序中调用 Coze API
 * 注意：小程序不能直接使用 Node.js SDK，需要通过后端服务代理
 */

const { CozeAPI } = require('@coze/api');
const express = require('express');
require('dotenv').config();

const app = express();
app.use(express.json());

// 初始化 Coze API 客户端
const coze = new CozeAPI({
  // 使用 https://api.coze.cn 如果使用 coze.cn
  // 使用 https://api.coze.com 如果使用 coze.com
  baseURL: process.env.COZE_BASE_URL || 'https://api.coze.cn',
  // Personal Access Token (PAT) 或 OAuth2.0 token
  token: process.env.COZE_TOKEN || '',
  // 是否启用调试模式
  debug: process.env.NODE_ENV === 'development',
});

/**
 * 示例 1: 创建聊天会话（非流式）
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { bot_id, user_id, query, conversation_id } = req.body;

    if (!bot_id || !query) {
      return res.status(400).json({ 
        error: '缺少必要参数: bot_id 和 query 是必需的' 
      });
    }

    const result = await coze.chat.create({
      bot_id,
      user_id: user_id || 'default_user',
      additional_messages: [
        {
          role: 'user',
          content: query,
          content_type: 'text',
        },
      ],
      conversation_id,
      auto_save_history: true,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '聊天请求失败',
    });
  }
});

/**
 * 示例 2: 创建聊天会话（流式响应）
 */
app.post('/api/chat/stream', async (req, res) => {
  try {
    const { bot_id, user_id, query, conversation_id } = req.body;

    if (!bot_id || !query) {
      return res.status(400).json({ 
        error: '缺少必要参数: bot_id 和 query 是必需的' 
      });
    }

    // 设置 SSE (Server-Sent Events) 响应头
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = await coze.chat.stream({
      bot_id,
      user_id: user_id || 'default_user',
      additional_messages: [
        {
          role: 'user',
          content: query,
          content_type: 'text',
        },
      ],
      conversation_id,
      auto_save_history: true,
    });

    for await (const chunk of stream) {
      // 发送 SSE 格式的数据
      res.write(`data: ${JSON.stringify(chunk)}\n\n`);
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error) {
    console.error('Stream chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '流式聊天请求失败',
    });
  }
});

/**
 * 示例 3: 获取对话历史
 */
app.get('/api/chat/history/:conversation_id', async (req, res) => {
  try {
    const { conversation_id } = req.params;
    const { limit = 20, order = 'desc' } = req.query;

    const result = await coze.chat.messages.list({
      conversation_id,
      limit: parseInt(limit),
      order,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get history error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取历史记录失败',
    });
  }
});

/**
 * 示例 4: 获取 Bot 列表
 */
app.get('/api/bots', async (req, res) => {
  try {
    const result = await coze.bots.list({
      limit: 20,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Get bots error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '获取 Bot 列表失败',
    });
  }
});

/**
 * 示例 5: 创建工作流运行
 */
app.post('/api/workflow/run', async (req, res) => {
  try {
    const { workflow_id, input_data } = req.body;

    if (!workflow_id) {
      return res.status(400).json({ 
        error: '缺少必要参数: workflow_id 是必需的' 
      });
    }

    const result = await coze.workflows.runs.create({
      workflow_id,
      input_data: input_data || {},
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error('Workflow run error:', error);
    res.status(500).json({
      success: false,
      error: error.message || '工作流运行失败',
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Coze API 服务运行在 http://localhost:${PORT}`);
  console.log('请确保已设置环境变量:');
  console.log('  - COZE_TOKEN: Coze Personal Access Token');
  console.log('  - COZE_BASE_URL: Coze API 基础 URL (可选，默认 https://api.coze.cn)');
});

