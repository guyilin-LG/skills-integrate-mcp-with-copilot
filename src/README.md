# Mergington High School - Activities Management System

一个现代化的学校课外活动管理系统，包含多页面前端和 FastAPI 后端。学生可浏览、筛选、报名和管理课外活动。

## 功能特性

### 前端
- 📱 **响应式多页面设计**：主页、活动列表、活动详情、讲座、相册、评论
- 🎨 **学校品牌配色**：白色 + 青柠绿 (`#00ff00`) 
- 📊 **活动网格**：PC 4 列 / 平板 3 列 / 手机 1-2 列（自适应）
- 🔍 **分类筛选**：按活动类别筛选（Strategic & Academic / Technology / Sports & Fitness / Arts & Creativity）
- 📝 **完整管理**：报名、取消报名、实时参与者列表刷新
- 🎯 **全卡片可点击**：点击整张卡片进入活动详情页

### 后端
- ⚡ **FastAPI 服务**：轻量级、高性能的 Python 框架
- 📡 **RESTful API**：标准化的数据接口
- 💾 **JSON 存储**：简单可靠的数据持久化（易于扩展至数据库）
- 📚 **自动文档**：内置 Swagger UI 和 ReDoc

## 快速开始

### 环境要求
- Python 3.8+
- pip（Python 包管理器）

### 安装与运行

1. **安装依赖**
   ```bash
   cd /workspaces/skills-integrate-mcp-with-copilot
   pip install fastapi uvicorn
   ```

2. **启动服务器**
   ```bash
   python3 -m uvicorn src.app:app --host 0.0.0.0 --port 8000 --reload
   ```

3. **访问应用**
   - 🖥️ 桌面/本地: [http://localhost:8000](http://localhost:8000)
   - 📱 移动设备/同局域网: `http://10.0.1.60:8000`（替换为实际 IP）
   - 📖 API 文档 (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
   - 📘 备用文档 (ReDoc): [http://localhost:8000/redoc](http://localhost:8000/redoc)

## 项目结构

```
src/
├── app.py                          # FastAPI 应用入口
├── activities.json                 # 活动数据（9 个活动）
├── lectures.json                   # 讲座数据（占位符）
├── gallery.json                    # 相册数据（占位符）
├── testimonials.json               # 评论数据（占位符）
└── static/
    ├── home.html                   # 主页
    ├── activities.html             # 活动列表页
    ├── activity-detail.html        # 活动详情页
    ├── lectures.html               # 讲座页
    ├── gallery.html                # 相册页
    ├── testimonials.html           # 评论页
    ├── 404.html                    # 错误页面
    ├── home.js                     # 主页逻辑
    ├── activities-list.js          # 活动列表逻辑
    ├── activity-detail.js          # 详情页逻辑
    └── styles.css                  # 全局样式（843 行）
```

## API 端点

| 方法 | 端点 | 描述 | 示例 |
|------|------|------|------|
| GET | `/activities` | 获取所有活动 | `curl http://localhost:8000/activities` |
| GET | `/lectures` | 获取讲座列表 | `curl http://localhost:8000/lectures` |
| GET | `/gallery` | 获取相册数据 | `curl http://localhost:8000/gallery` |
| GET | `/testimonials` | 获取评论数据 | `curl http://localhost:8000/testimonials` |
| POST | `/activities/{activity_name}/signup?email=...` | 学生报名活动 | `curl -X POST "http://localhost:8000/activities/Chess%20Club/signup?email=student@example.com"` |
| DELETE | `/activities/{activity_name}/unregister?email=...` | 学生取消报名 | `curl -X DELETE "http://localhost:8000/activities/Chess%20Club/unregister?email=student@example.com"` |

## 数据模型

### 活动数据结构（activities.json）
```json
{
  "活动名称": {
    "description": "简短描述",
    "schedule": "时间表（如 Fridays, 3:30 PM - 5:00 PM）",
    "max_participants": 12,
    "participants": ["email1@...", "email2@..."],
    "featured": true,                    // 是否在主页显示
    "category": "Strategic & Academic",  // 分类
    "location": "Library Room 201",      // 地点
    "instructor": "Mr. Anderson",        // 讲师
    "full_description": "...",           // 完整描述
    "tags": ["strategy", "competition"]  // 标签
  }
}
```

### 当前活动列表
1. **Chess Club** - Strategic & Academic（战略与学术）
2. **Programming Class** - Technology（技术）
3. **Gym Class** - Sports & Fitness（体育与健身）
4. **Soccer Team** - Sports & Fitness
5. **Basketball Team** - Sports & Fitness
6. **Art Club** - Arts & Creativity（艺术与创意）
7. **Drama Club** - Arts & Creativity
8. **Math Club** - Strategic & Academic
9. **Debate Team** - Strategic & Academic

## 响应式设计

| 设备类型 | 屏幕宽度 | 网格列数 |
|---------|---------|---------|
| 桌面 | ≥1200px | 4 列 |
| 平板横屏 | 768-1199px | 3 列 |
| 平板竖屏 | 600-767px | 2 列 |
| 手机 | <600px | 1 列 |

## 学校配色

- **主色**：青柠绿 `#00ff00`（品牌色，导航、按钮、强调）
- **次色**：深青柠 `#00cc00`（悬停、活跃状态）
- **背景**：白色 `#ffffff`（卡片、容器）
- **页面背景**：浅灰 `#f5f5f5`

## 开发与调试

### 自动热重载
服务启动时加入 `--reload` 标志，修改代码后自动重启服务。

### 浏览器开发者工具
1. 打开 DevTools（F12）
2. Network 选项卡查看 API 调用
3. Console 查看 JavaScript 错误
4. Elements 检查页面结构与样式

### 常见问题

**Q: 报名后未显示在参与者列表？**
A: 页面自动刷新列表。如未刷新，检查浏览器 Console 是否有错误；确保邮箱格式正确。

**Q: 添加新活动后无法显示？**
A: 在 `activities.json` 中添加新活动对象，确保 JSON 格式正确（可用 [jsonlint.com](https://jsonlint.com) 验证）。

**Q: 页面出现 404？**
A: 检查 URL 拼写（注意大小写）；如活动名称包含特殊字符，在 URL 中需 URL 编码（如空格为 `%20`）。

## 后续开发建议

- [ ] **Issue #5**：实现管理员模式（登录、权限、学生/教师角色）
- [ ] **Issue #13**：集成 Bootstrap 5 简化样式维护
- [ ] 补充讲座、相册、评论页的实际内容
- [ ] 添加搜索功能
- [ ] 多条件筛选（分类 + 讲师 + 时间段）
- [ ] 邮件通知系统
- [ ] 数据导出（CSV/Excel）
- [ ] 上传活动封面图片
- [ ] 迁移至关系型数据库（SQLite / PostgreSQL）

## 许可证与联系

Mergington High School 2026 | All rights reserved
