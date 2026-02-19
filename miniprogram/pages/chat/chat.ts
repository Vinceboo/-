// pages/chat/chat.ts
// 使用 Component()，与项目 glass-easel 组件框架保持一致

// 后端地址：使用 127.0.0.1 而非 localhost，避免 Windows 上的 IPv6 解析问题
// 上线后替换为真实的 HTTPS 域名
const API_BASE = 'http://127.0.0.1:3000';

interface ChatMessage {
  id: number;
  content: string;
  isUser: boolean;
}

Component({
  data: {
    title: '电影助手',
    inputValue: '',
    messages: [] as ChatMessage[],
    toView: '',
    isLoading: false,      // AI 是否正在回复
    conversationId: '',    // 多轮对话 ID
  },

  methods: {
    // ────── 页面生命周期 ──────

    onLoad(options: { name?: string }) {
      if (options.name) {
        this.setData({ title: `《${options.name}》` });
        // 自动发送电影名作为首条消息
        this.sendMessage(`请介绍一下电影《${options.name}》`);
      }
    },

    // ────── 核心发送逻辑 ──────

    sendMessage(content: string) {
      // 1. 添加用户消息气泡
      this.addMessage(content, true);

      // 2. 添加占位 AI 消息（内容为空，显示加载动画）
      const aiMsgId = Date.now();
      this.addMessage('', false, aiMsgId);

      // 3. 禁用输入
      this.setData({ isLoading: true });

      // 4. 发起流式请求
      const requestQuery = this.buildRequestQuery(content);
      this.streamFromAPI(requestQuery, aiMsgId);
    },

    buildRequestQuery(content: string): string {
      // 首轮保持原始提问（用于展示电影封面/评分等欢迎信息）
      if (!this.data.conversationId) return content;

      // 后续轮次强制自然聊天，不再输出固定模板内容
      return `${content}

[回复要求：请不要在回复中复述本段]
从这一轮开始，只需像真实聊天一样自然回答。
除非用户明确要求，否则不要再输出海报、图片、评分、星级、毒舌标题、分栏模板或固定栏目。`;
    },

    streamFromAPI(query: string, aiMsgId: number) {
      let accumulated = '';   // 累积 AI 回复文本
      let sseBuffer = '';     // SSE 分帧缓冲

      const consumeSSEText = (text: string) => {
        sseBuffer += text;

        // SSE 协议：每条事件以 \n\n 结尾
        const parts = sseBuffer.split('\n\n');
        sseBuffer = parts.pop() || '';  // 最后一段可能不完整，留到下次

        for (const part of parts) {
          for (const line of part.split('\n')) {
            if (!line.startsWith('data: ')) continue;
            const raw = line.slice(6).trim();
            if (raw === '[DONE]') continue;

            try {
              const evt = JSON.parse(raw);
              if (evt.event === 'delta' && evt.content) {
                accumulated += evt.content;
                this.updateAIMessage(aiMsgId, accumulated);
              } else if (evt.event === 'completed' && evt.conversation_id) {
                this.setData({ conversationId: evt.conversation_id });
              } else if (evt.event === 'error') {
                accumulated = `❌ 请求出错：${evt.message || '未知错误'}`;
                this.updateAIMessage(aiMsgId, accumulated);
              }
            } catch (_) {
              // 忽略 JSON 解析失败的行
            }
          }
        }
      };

      const requestTask = wx.request({
        url: `${API_BASE}/api/chat/stream`,
        method: 'POST',
        header: { 'content-type': 'application/json' },
        data: {
          query,
          conversation_id: this.data.conversationId || undefined,
        },
        enableChunked: true,  // 开启流式接收

        success: (res: any) => {
          // 非 2xx 时，透出后端返回错误，避免被“未返回内容”掩盖
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const dataObj = (res && res.data && typeof res.data === 'object') ? res.data : null;
            const errMsg =
              (dataObj && dataObj.error) ||
              (typeof res.data === 'string' && res.data) ||
              `请求失败（${res.statusCode}）`;
            this.updateAIMessage(aiMsgId, `❌ ${errMsg}`);
            this.setData({ isLoading: false });
            return;
          }

          // 兼容某些环境 chunk 回调不触发：尝试按完整 SSE 文本兜底解析
          if (!accumulated && typeof res.data === 'string' && res.data) {
            consumeSSEText(res.data);
            consumeSSEText('\n\n');
          }

          // 流结束后解锁输入
          if (!accumulated) {
            this.updateAIMessage(aiMsgId, '（AI 未返回内容，请重试）');
          }
          this.setData({ isLoading: false });
        },

        fail: (err: any) => {
          console.error('请求失败', err);
          this.updateAIMessage(aiMsgId, '❌ 网络请求失败，请检查后端服务是否启动。');
          this.setData({ isLoading: false });
        },
      });

      // 通过 RequestTask 监听 chunk；部分基础库不支持时会走 success 兜底解析
      const task = requestTask as any;
      if (task && typeof task.onChunkReceived === 'function') {
        task.onChunkReceived((res: any) => {
          consumeSSEText(this.decodeBuffer(res.data));
        });
      }
    },

    // ────── 消息列表操作 ──────

    addMessage(content: string, isUser: boolean, customId?: number) {
      const messages: ChatMessage[] = this.data.messages;
      const msg: ChatMessage = {
        id: customId || Date.now(),
        content,
        isUser,
      };
      messages.push(msg);
      this.setData({ messages, toView: `msg-${msg.id}` });
    },

    updateAIMessage(id: number, content: string) {
      const messages: ChatMessage[] = this.data.messages.map((m: ChatMessage) =>
        m.id === id ? { ...m, content } : m
      );
      this.setData({ messages, toView: `msg-${id}` });
    },

    // ────── 输入区域 ──────

    onInput(e: any) {
      this.setData({ inputValue: e.detail.value });
    },

    onTapSend() {
      if (this.data.isLoading) {
        wx.showToast({ title: 'AI 正在回复，请稍候…', icon: 'none', duration: 2000 });
        return;
      }
      this.onSendMessage();
    },

    onSendMessage() {
      if (this.data.isLoading) return;
      const content = this.data.inputValue.trim();
      if (!content) return;
      this.setData({ inputValue: '' });
      this.sendMessage(content);
    },

    // ────── 工具方法 ──────

    // 将 ArrayBuffer 解码为 UTF-8 字符串
    decodeBuffer(buffer: ArrayBuffer): string {
      const bytes = new Uint8Array(buffer);
      let str = '';
      for (let i = 0; i < bytes.length; i++) {
        str += String.fromCharCode(bytes[i]);
      }
      try {
        return decodeURIComponent(escape(str));
      } catch (_) {
        return str;
      }
    },
  },
});
