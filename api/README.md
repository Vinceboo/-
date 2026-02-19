# Coze Node.js SDK 使用指南

本项目已安装 `@coze/api` SDK，版本 `^1.3.9`。

## 📦 安装状态

SDK 已安装在 `node_modules/@coze/api` 中，可以直接使用。

## 🚀 快速开始

### 1. 环境变量配置

创建 `.env` 文件（在项目根目录）：

```env
# Coze Personal Access Token (PAT)
# 获取方式：登录 Coze 平台 -> 个人设置 -> 访问令牌
COZE_TOKEN=your_personal_access_token_here

# Coze API 基础 URL
# 使用 coze.cn 时: https://api.coze.cn
# 使用 coze.com 时: https://api.coze.com
COZE_BASE_URL=https://api.coze.cn

# 服务端口
PORT=3000
```

### 2. 基本使用

```javascript
const { CozeAPI } = require('@coze/api');

// 初始化客户端
const coze = new CozeAPI({
  baseURL: 'https://api.coze.cn', // 或 'https://api.coze.com'
  token: 'your_token_here',
  debug: true, // 开发环境启用调试
});

// 创建聊天会话
const result = await coze.chat.create({
  bot_id: 'your_bot_id',
  user_id: 'user_123',
  additional_messages: [
    {
      role: 'user',
      content: '你好',
      content_type: 'text',
    },
  ],
  auto_save_history: true,
});

console.log(result);
```

### 3. 流式聊天

```javascript
// 流式响应
const stream = await coze.chat.stream({
  bot_id: 'your_bot_id',
  user_id: 'user_123',
  additional_messages: [
    {
      role: 'user',
      content: '请介绍一下这部电影',
      content_type: 'text',
    },
  ],
});

for await (const chunk of stream) {
  console.log('收到数据:', chunk);
  // 处理流式数据
}
```

## 📚 主要功能模块

### Chat (聊天)
- `coze.chat.create()` - 创建聊天会话
- `coze.chat.stream()` - 流式聊天
- `coze.chat.messages.list()` - 获取消息列表
- `coze.chat.messages.create()` - 创建消息

### Bots (机器人)
- `coze.bots.list()` - 获取 Bot 列表
- `coze.bots.retrieve()` - 获取 Bot 详情

### Conversations (会话)
- `coze.conversations.create()` - 创建会话
- `coze.conversations.retrieve()` - 获取会话详情

### Workflows (工作流)
- `coze.workflows.runs.create()` - 运行工作流
- `coze.workflows.runs.stream()` - 流式运行工作流

### Datasets (数据集)
- `coze.datasets.create()` - 创建数据集
- `coze.datasets.list()` - 获取数据集列表

### Audio (音频)
- `coze.audio.speech.create()` - 文本转语音
- `coze.audio.transcriptions.create()` - 语音转文本

## 🔧 在微信小程序中使用

**重要提示**：微信小程序不能直接使用 Node.js SDK，需要通过后端服务代理。

### 方案 1: 使用 Express 后端服务

1. 启动后端服务：
```bash
npm run dev
# 或
node api/index.js
```

2. 在小程序中调用：
```javascript
// miniprogram/utils/coze.js
const request = (url, data) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `http://localhost:3000${url}`, // 替换为实际的后端地址
      method: 'POST',
      data,
      success: resolve,
      fail: reject,
    });
  });
};

// 发送聊天消息
export const sendChat = (botId, query, userId) => {
  return request('/api/chat', {
    bot_id: botId,
    user_id: userId,
    query,
  });
};
```

### 方案 2: 使用云函数

如果使用微信云开发，可以在云函数中使用 Coze SDK。

## 📖 官方文档

- [Coze 开发者文档 (中文)](https://www.coze.cn/docs)
- [Coze 开发者文档 (English)](https://www.coze.com/docs)
- [npm 包地址](https://www.npmjs.com/package/@coze/api)

## ⚠️ 注意事项

1. **Token 安全**：不要在前端代码中暴露 Token，必须通过后端服务代理
2. **跨域问题**：如果后端服务与小程序不在同一域名，需要配置 CORS
3. **HTTPS**：生产环境必须使用 HTTPS
4. **错误处理**：建议实现完善的错误处理和重试机制

## 🎯 示例代码

查看 `api/coze-example.js` 获取完整的使用示例。

