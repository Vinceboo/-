/**
 * Coze API 工具函数
 * 用于在微信小程序中调用后端 Coze API 服务
 */

// 配置后端 API 地址
// 开发环境可以使用本地地址，生产环境需要配置实际服务器地址
const API_BASE_URL = 'http://localhost:3000'; // 请根据实际情况修改

/**
 * 通用请求函数
 */
const request = (url, method = 'GET', data = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
      },
      success: (res) => {
        if (res.statusCode === 200) {
          resolve(res.data);
        } else {
          reject(new Error(`请求失败: ${res.statusCode}`));
        }
      },
      fail: (err) => {
        reject(err);
      },
    });
  });
};

/**
 * 发送聊天消息（非流式）
 * @param {string} botId - Bot ID
 * @param {string} query - 用户消息
 * @param {string} userId - 用户 ID（可选）
 * @param {string} conversationId - 会话 ID（可选）
 */
export const sendChat = async (botId, query, userId = 'default_user', conversationId = null) => {
  try {
    const result = await request('/api/chat', 'POST', {
      bot_id: botId,
      user_id: userId,
      query,
      conversation_id: conversationId,
    });
    return result;
  } catch (error) {
    console.error('发送聊天消息失败:', error);
    throw error;
  }
};

/**
 * 获取对话历史
 * @param {string} conversationId - 会话 ID
 * @param {number} limit - 返回数量限制
 * @param {string} order - 排序方式 ('asc' | 'desc')
 */
export const getChatHistory = async (conversationId, limit = 20, order = 'desc') => {
  try {
    const result = await request(`/api/chat/history/${conversationId}?limit=${limit}&order=${order}`);
    return result;
  } catch (error) {
    console.error('获取对话历史失败:', error);
    throw error;
  }
};

/**
 * 获取 Bot 列表
 */
export const getBots = async () => {
  try {
    const result = await request('/api/bots');
    return result;
  } catch (error) {
    console.error('获取 Bot 列表失败:', error);
    throw error;
  }
};

/**
 * 运行工作流
 * @param {string} workflowId - 工作流 ID
 * @param {object} inputData - 输入数据
 */
export const runWorkflow = async (workflowId, inputData = {}) => {
  try {
    const result = await request('/api/workflow/run', 'POST', {
      workflow_id: workflowId,
      input_data: inputData,
    });
    return result;
  } catch (error) {
    console.error('运行工作流失败:', error);
    throw error;
  }
};

