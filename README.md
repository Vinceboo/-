🎬 电影 AI 助手 - 项目结构文档
NOTE

本文档提供了 miniprogram 架构的全面概述。这是一份动态文档，请随着新功能的添加及时更新。

🌟 项目概览
这是一个用于电影探索和 AI 智能交互的微信小程序。 核心功能：

Netflix 风格主页：沉浸式、深色主题的电影浏览体验。
Apple HIG 设计：遵循 iOS 人机界面指南（深色模式）的一致性 UI。
AI 聊天助手：关于电影的实时流式对话。
🛠 技术栈
框架：微信小程序 (原生)
语言：TypeScript (
.ts
)
样式：Less (
.less
 -> 
.wxss
)
渲染引擎：Skyline (查看 
app.json
)
后端 API：http://127.0.0.1:3000 (开发环境 Localhost)
📂 目录结构
plaintext
minipro_0217/
├── .claude/                # AI 助手技能与配置
├── api/                    # (后端/API 相关代码，如适用)
├── miniprogram/            # 小程序主源码
│   ├── components/         # 可复用 UI 组件
│   │   ├── navigation-bar/ # 自定义导航栏 (基于 WeUI)
│   │   └── wemark/         # Markdown 渲染组件
│   ├── images/             # 静态资源 (图标, 占位图)
│   ├── pages/              # 应用页面
│   │   ├── index/          # 主页 (电影列表, 顶部推荐)
│   │   ├── chat/           # AI 聊天界面 (流式 API)
│   │   └── logs/           # 系统日志
│   ├── utils/              # 工具函数 & 模拟数据
│   │   └── movie.data.ts   # 静态电影数据 (Mock)
│   ├── app.ts              # 全局生命周期 & 数据
│   ├── app.json            # 全局配置 (路由, 窗口)
│   └── app.less            # 全局样式
├── project.config.json     # 微信开发者工具配置
└── tsconfig.json           # TypeScript 配置
🧩 核心模块
1. 主页 (miniprogram/pages/index/)
角色：电影探索的落地页。

设计："Netflix x Apple HIG" 深色主题，沉浸式体验。
组件：
顶部推荐 (Hero Banner)：带渐变遮罩的精选电影。
横向滚动："热映榜单" (Top Rated)。
竖向列表："全部影片"。
交互：点击任意电影跳转至 聊天页面 (Chat Page)，并传递电影名称。
数据源：utils/movie.data.ts。
2. AI 聊天页 (miniprogram/pages/chat/)
角色：用于电影查询的交互式 AI 助手。

设计：Apple HIG 深色模式 (iMessage 风格)。
用户气泡：系统蓝 (#0A84FF)。
AI 气泡：系统灰 (#2C2C2E)。
功能：
自动发送：进入页面时自动发送电影名称，触发上下文。
流式 API：连接 POST /api/chat/stream 实现实时打字机效果。
SSE 逻辑：通过 wx.request 分块传输 (chunked transfer) 手动管理 Server-Sent Events。
3. 组件 (miniprogram/components/)
navigation-bar：自定义导航栏，支持透明/自定义颜色，对于沉浸式设计至关重要。
🔌 后端集成
聊天功能依赖于本地专用后端：

服务端点：http://127.0.0.1:3000/api/chat/stream
请求方法：POST
数据格式：Server-Sent Events (SSE)
传输协议：分块传输编码 (Chunked Transfer Encoding)
IMPORTANT

确保本地后端服务运行在 3000 端口，以启用 AI 聊天功能。

🎨 设计规范 (Apple HIG)
字体排印：San Francisco (系统字体)，易读字号 (17pt 正文)。
配色方案：
背景色：#000000 (纯黑)
卡片背景：#1C1C1E (二级系统背景)
主色调：#0A84FF (系统蓝)
布局：
充足的内边距 (16px/32rpx)。
平滑的圆角 (12px-20px)。
模糊效果 (在支持的场景下)。
📝 维护日志
2026-02-18: 创建初始项目结构文档。
2026-02-18: 实现电影聊天功能，支持流式 API。
2026-02-18: 修复导航参数双重编码问题。
2026-02-18: 文档国际化（中文化）。
