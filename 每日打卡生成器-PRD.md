# 每日打卡生成器 PRD

**文档版本：** v1.2  
**日期：** 2026-03-27  
**状态：** 待开发

---

## 一、产品概述

### 1.1 产品背景

帮助家长为孩子生成可打印的每日任务打卡表，支持自定义姓名、日期范围、按星期配置不同任务、励志语（含 AI 生成）。生成结果可直接网页打印或导出 Word 文档（.docx）。

### 1.2 参考样式

每页按列展示若干天的打卡表，每天包含日期标题、任务清单（含已完成/未完成两个勾选框）、底部鼓励语。

### 1.3 产品目标

- **核心目标**：5 分钟内完成配置，一键生成可打印的打卡表
- **输出格式**：网页直接打印 + 导出 Word 文档（.docx）
- **目标用户**：家长、教师、有自我管理需求的成年用户

### 1.4 技术架构概览

```
用户浏览器（React）
    ↓ POST /api/generate-encouragement
代理服务（Vercel Function）← DeepSeek API Key 存于此
    ├── IP 限流检查（每 IP 每天 5 次）
    ├── 全局限流检查（每天 50 次）
    └── 转发至 DeepSeek API
```

前端永远不持有 DeepSeek Key。Key 仅存在于 Vercel 后台环境变量中。

---

## 二、功能需求

### 2.1 基本配置模块

#### 2.1.1 姓名设置
- 输入框：填写打卡人姓名（如"尚思嘉"）
- 姓名用于鼓励语中的称呼（如"尚思嘉，加油！"）

#### 2.1.2 日期范围设置
- **开始日期 / 结束日期**：日历选择器
- **最大范围**：365 天，超出则禁用并提示
- **快捷选项**：

| 标签 | 含义 |
|---|---|
| 本周 | 当前周一 ～ 周日 |
| 本月 | 当月 1 日 ～ 月末 |
| 30 天 | 今天起 30 天 |
| 90 天 | 今天起 90 天 |
| 半年 | 今天起 180 天 |
| 一年 | 今天起 365 天 |

- **性能提示**：超过 90 天时顶部展示"共 N 天，预计 X 页，导出可能需要几秒"

---

### 2.2 任务管理模块（支持按星期配置）

#### 2.2.1 任务配置模式（二选一，可随时切换）

**模式一：统一任务（默认）**  
所有天使用同一套任务列表，适合任务固定不变的场景。

**模式二：按星期配置**  
分别为周一 ～ 周日配置独立的任务列表，适合上课日/休息日任务不同的场景。UI 展示 7 个 Tab，每个 Tab 内独立维护。

#### 2.2.2 任务列表操作
- 每套任务上限 15 条，超出提示
- 每条任务支持：输入名称（限 20 字）、拖拽排序、删除

#### 2.2.3 跨星期复制（按星期模式专属）
- 每个星期 Tab 顶部提供"复制到其他天"按钮
- 多选目标星期 → 二次确认 → 覆盖目标天任务列表
- 典型用途：配置好周一后批量复制到周二至周五

#### 2.2.4 打印表每天结构

| 列 | 内容 |
|---|---|
| 今日任务 | 任务名称（按当天星期取对应列表） |
| □ 已完成 | 勾选框 |
| □ 未完成 | 勾选框 |

#### 2.2.5 预置任务模板

| 模板名 | 包含任务 |
|---|---|
| 学生工作日 | 学校作业、天天默写、口算、英语打卡、阅读书单 |
| 学生周末 | 兴趣班练习、体育锻炼、阅读、整理房间 |
| 运动版 | 跳绳、跑步、做操、拉伸 |
| 清空 | 清空当前列表，从头配置 |

---

### 2.3 鼓励语模块

#### 2.3.1 手动输入
- 逐条维护，支持增删、拖拽排序
- 所有日期共用同一组鼓励语，按索引取模循环分配（每天一条）

#### 2.3.2 AI 生成鼓励语

**入口**：点击"✨ AI 生成"按钮

**风格选择（单选）：**

| 风格 | 说明 |
|---|---|
| 温柔鼓励 | 温暖亲切，适合低年级小孩 |
| 活泼可爱 | 充满活力，带拟声词或颜文字风格 |
| 正能量 | 积极向上，简洁有力 |
| 诗意唯美 | 文艺风，短句优美 |
| 搞笑幽默 | 轻松调侃，带点小幽默 |

**生成数量策略：**

| 日期范围 | 生成条数 | 说明 |
|---|---|---|
| ≤ 14 天 | 与天数相同 | 每天不重复 |
| 15 ～ 90 天 | 14 条 | 循环覆盖两周 |
| > 90 天 | 30 条 | 循环覆盖一个月 |

**生成流程：**
1. 确认已填写姓名 → 选择风格 → 点击"生成"
2. 展示 loading（"AI 生成中…"）并显示今日剩余次数
3. 结果列表逐条可编辑，支持 🔄 单条重新生成
4. 点击"使用这批鼓励语"确认填入

**免费额度用完后的降级路径：**
1. 弹出提示弹窗，说明今日免费次数已用完
2. 弹窗提供两个选项：
   - "填写自己的 DeepSeek Key" → 进入设置，前端直接调用 DeepSeek（不走代理，不消耗平台配额）
   - "手动输入鼓励语" → 关闭弹窗
3. 顶部始终展示"今日平台剩余 N 次"，让用户有感知

#### 2.3.3 AI 请求走向判断逻辑

```
用户点击"AI 生成"
    ↓
是否填写了自己的 DeepSeek Key？
    ├── 是 → 前端直接调用 DeepSeek API（绕过代理，不消耗平台配额）
    └── 否 → 调用 /api/generate-encouragement（走代理，受限流约束）
```

---

### 2.4 布局设置

#### 2.4.1 每行显示天数

| 选项 | 适合场景 |
|---|---|
| 1 列 | 任务多，内容详细 |
| 2 列（默认） | 参考样式，最常用 |
| 3 列 | 任务少，节省纸张 |

#### 2.4.2 纸张方向

- 1 列 → 推荐竖向
- 2 列 → 竖向或横向均可
- 3 列 → 推荐横向
- 支持手动切换

---

### 2.5 预览与输出

#### 2.5.1 实时预览
- 左侧配置面板，右侧实时预览区
- 配置变更自动刷新预览
- 超过 90 天时默认只渲染前 30 天，底部提示"仅预览前 30 天，打印/导出将包含全部 N 天"
- 提供"展开全部预览"按钮

#### 2.5.2 打印功能
- "🖨️ 直接打印"按钮 → 触发浏览器打印对话框
- `@media print` 隐藏配置面板，只输出打卡表
- 每页边距 10mm，自动分页

#### 2.5.3 导出 Word 文档
- "📄 导出 Word"按钮 → 生成 .docx 文件
- 文件名：`{姓名}_打卡表_{开始日期}_{结束日期}.docx`
- 超过 90 天时展示进度条"正在生成第 X 页 / 共 Y 页…"

---

## 三、界面设计规范

### 3.1 整体布局

```
┌─────────────────────────────────────────────────────────┐
│  📋 每日打卡生成器              [⚙️ 设置] [🖨️ 打印] [📄 导出] │
├──────────────────┬──────────────────────────────────────┤
│  配置面板（380px）│  实时预览区（可滚动）                  │
│                  │                                      │
│  ▸ 基本信息      │  ┌─────────┬─────────┐               │
│  ▸ 任务管理      │  │ 3月24日  │ 3月25日  │               │
│    [统一/按星期]  │  │ 周二任务  │ 周三任务  │               │
│  ▸ 鼓励语        │  │ □ □      │ □ □      │               │
│  ▸ 布局设置      │  │ 鼓励语    │ 鼓励语    │               │
│                  │  └─────────┴─────────┘               │
│                  │  [仅预览前30天] [展开全部]             │
└──────────────────┴──────────────────────────────────────┘
```

### 3.2 配置面板分区（Accordion 样式）

**分区一：基本信息**
- 姓名输入框
- 开始 / 结束日期 + 快捷日期按钮
- 天数提示（"共 365 天，预计约 183 页"）

**分区二：任务管理**
- 模式切换 Toggle：`统一任务` / `按星期配置`
- 统一模式：单一任务列表 + 模板快速填入
- 按星期模式：7 个 Tab（周一～周日），Tab 显示任务数角标，每 Tab 内含任务列表 + "复制到其他天"

**分区三：鼓励语**
- 鼓励语列表（增删 / 编辑 / 拖拽排序）
- "✨ AI 生成"按钮，旁边显示"今日平台剩余 N 次"
- AI 生成结果区（逐条编辑 / 🔄 单条重新生成）

**分区四：布局设置**
- 每行天数：[1] [2] [3] 单选
- 纸张方向：竖向 / 横向 单选

**⚙️ 设置面板（右上角 Modal）**
- DeepSeek API Key 输入框（密码框，可切换可见）
- 说明文字："填写后 AI 生成将使用您自己的 Key，不消耗平台免费额度"
- 保存 / 清除按钮

### 3.3 按星期模式 UI

```
┌───────────────────────────────────────────────┐
│ 任务配置    ● 统一任务   ○ 按星期配置            │
├───────────────────────────────────────────────┤
│ [周一⁵][周二⁵][周三⁵][周四⁵][周五⁵][周六²][周日²] │
├───────────────────────────────────────────────┤
│ 周一 的任务                   [复制到其他天 ↓]  │
│  ≡  1. 学校作业                             ✕ │
│  ≡  2. 天天默写                             ✕ │
│  ≡  3. 口算                                 ✕ │
│  ≡  4. 英语打卡                             ✕ │
│  ≡  5. 读书并完成阅读书单                    ✕ │
│  [+ 添加任务]           [📋 使用模板]          │
└───────────────────────────────────────────────┘
```

### 3.4 打卡表单元格结构

```
┌─────────────────────────────────────┐
│   2026 年 03 月 24 日  星期二         │  标题行，加粗居中，浅灰背景
├──────────────────┬────────┬─────────┤
│  今日任务         │ □ 已完成 │ □ 未完成 │  表头行
├──────────────────┼────────┼─────────┤
│  1. 学校作业      │   □    │    □    │
├──────────────────┼────────┼─────────┤
│  2. 天天默写      │   □    │    □    │
├──────────────────┼────────┼─────────┤
│  ...              │   □    │    □    │
├──────────────────┴────────┴─────────┤
│                                     │  空白备注区
├─────────────────────────────────────┤
│  ✨ 尚思嘉真棒，今天也要闪闪发光！    │  鼓励语
└─────────────────────────────────────┘
```

### 3.5 设计细节

| 元素 | 规格 |
|---|---|
| 主色调 | 白底黑字 |
| 日期标题背景 | `#F5F5F5`（工作日）/ `#EBEBEB`（周末） |
| 日期标题字号 | 13-14pt，加粗，居中 |
| 任务文字 | 11-12pt，左对齐 |
| 勾选框 | Unicode `□`（U+25A1），14×14px，居中 |
| 鼓励语 | 10-11pt，金色 `#F59E0B`，前置 ✨ |
| 表格外框 | 1.5px |
| 表格内框 | 0.5px，`#E5E7EB` |
| 单元格圆角 | 2-4px |
| 列间距 | 12px |
| 单元格内边距 | 6-8px |

---

## 四、后端代理服务

### 4.1 必要性说明

API Key 不能存放在前端代码中，任何人打开 DevTools 即可提取并滥用。代理服务解决三个问题：Key 安全隔离、调用次数控制、成本可控。

### 4.2 部署方案

**推荐：Vercel Functions + Vercel KV**

与前端 React 项目同仓库，零额外配置，`git push` 即完成部署。Vercel 免费套餐包含每月 100 万次函数调用，Vercel KV 免费套餐包含每天 3000 次读写，均远超本项目需求。

| 方案 | 优点 | 备选场景 |
|---|---|---|
| Vercel Functions + Vercel KV | 同仓库部署，上手最快 | **首选** |
| Cloudflare Workers + CF KV | 全球延迟更低，免费额度更大 | 追求性能时 |
| 自建 Node.js + Redis | 完全控制 | 有服务器资源时 |

### 4.3 代理接口设计

**接口：**
```
POST /api/generate-encouragement
Content-Type: application/json
```

**请求 Body（前端发送，无需携带任何 Key）：**
```json
{
  "name": "尚思嘉",
  "count": 14,
  "style": "gentle"
}
```

**响应（成功 200）：**
```json
{
  "success": true,
  "lines": ["尚思嘉真棒，今天也要闪闪发光！", "..."],
  "remaining": 3
}
```

`remaining`：当天该 IP 剩余可调用次数，前端用于展示"今日剩余 N 次"。

**响应（IP 超限 429）：**
```json
{
  "success": false,
  "error": "rate_limited",
  "message": "今日免费生成次数已用完（每天最多 5 次），请明天再试或填写自己的 API Key"
}
```

**响应（全局超限 429）：**
```json
{
  "success": false,
  "error": "global_limit",
  "message": "今日平台免费额度已用完，请明天再试或填写自己的 API Key"
}
```

**响应（上游错误 502）：**
```json
{
  "success": false,
  "error": "upstream_error",
  "message": "AI 服务暂时不可用，请稍后重试"
}
```

### 4.4 限流策略

两层限流，任一超限即拒绝请求：

**第一层：IP 维度（防单用户滥用）**

```
KV Key:  rate:ip:{ip}:{YYYY-MM-DD}
Value:   调用次数（integer，原子递增）
TTL:     86400 秒（次日自动清零）
上限:    5 次 / IP / 天
```

**第二层：全局维度（控总成本兜底）**

```
KV Key:  rate:global:{YYYY-MM-DD}
Value:   全局总调用次数（integer，原子递增）
TTL:     86400 秒
上限:    50 次 / 天（全平台）
```

**检查顺序**：先全局后 IP。全局超限直接返回，减少不必要的 KV 读写。

**限流参数通过环境变量配置，无需改代码：**

| 环境变量 | 默认值 | 说明 |
|---|---|---|
| `RATE_LIMIT_PER_IP_DAY` | `5` | 每 IP 每天最多次数 |
| `RATE_LIMIT_GLOBAL_DAY` | `50` | 全平台每天上限 |

### 4.5 Vercel Function 完整实现

```typescript
// /api/generate-encouragement.ts
import { kv } from '@vercel/kv';

const STYLE_PROMPTS: Record<string, string> = {
  gentle:   '温柔亲切，像妈妈说话的语气，给孩子温暖感',
  lively:   '活泼开朗，可以用叠词、拟声词，语气轻松有趣',
  positive: '积极向上，简洁有力，像运动员宣言',
  poetic:   '文艺清新，句式优美，带有画面感',
  humorous: '轻松幽默，可以有小玩笑，让孩子看了想笑',
};

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method_not_allowed' });
  }

  // ── 参数校验 ──────────────────────────────────────────
  const { name, count, style } = req.body ?? {};
  if (!name || !count || !style || !STYLE_PROMPTS[style]) {
    return res.status(400).json({ success: false, error: 'invalid_params' });
  }
  const safeCount = Math.min(Math.max(1, parseInt(count)), 60);

  // ── 获取 IP ───────────────────────────────────────────
  const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ?? 'unknown';
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD UTC

  // ── 读取限流配置 ──────────────────────────────────────
  const perIpLimit  = parseInt(process.env.RATE_LIMIT_PER_IP_DAY  ?? '5');
  const globalLimit = parseInt(process.env.RATE_LIMIT_GLOBAL_DAY  ?? '50');

  const globalKey = `rate:global:${today}`;
  const ipKey     = `rate:ip:${ip}:${today}`;

  // ── 先检查全局限流（节省 KV 操作）────────────────────
  const globalCount = await kv.incr(globalKey);
  if (globalCount === 1) await kv.expire(globalKey, 86400);

  if (globalCount > globalLimit) {
    return res.status(429).json({
      success: false,
      error: 'global_limit',
      message: '今日平台免费额度已用完，请明天再试或在设置中填写自己的 API Key',
    });
  }

  // ── 再检查 IP 限流 ────────────────────────────────────
  const ipCount = await kv.incr(ipKey);
  if (ipCount === 1) await kv.expire(ipKey, 86400);

  if (ipCount > perIpLimit) {
    // IP 超限时回滚全局计数（避免浪费配额）
    await kv.decr(globalKey);
    return res.status(429).json({
      success: false,
      error: 'rate_limited',
      message: `今日免费生成次数已用完（每天最多 ${perIpLimit} 次），请明天再试或填写自己的 API Key`,
    });
  }

  // ── 调用 DeepSeek ─────────────────────────────────────
  const styleDesc = STYLE_PROMPTS[style];

  let upstream: Response;
  try {
    upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.9,
        messages: [
          {
            role: 'system',
            content: '你是一个专门为孩子生成打卡鼓励语的助手。只输出鼓励语列表，每条独占一行，不要编号，不要引号，不要任何其他内容。',
          },
          {
            role: 'user',
            content: `请为名叫「${name}」的孩子生成 ${safeCount} 条每日打卡鼓励语。\n风格要求：${styleDesc}\n要求：每条不超过 20 字，语气亲切自然，每条独立一行。`,
          },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
  } catch (err) {
    // 网络超时或 DeepSeek 不可达，回滚计数
    await Promise.all([kv.decr(globalKey), kv.decr(ipKey)]);
    return res.status(502).json({ success: false, error: 'upstream_error', message: 'AI 服务暂时不可用，请稍后重试' });
  }

  if (!upstream.ok) {
    await Promise.all([kv.decr(globalKey), kv.decr(ipKey)]);
    return res.status(502).json({ success: false, error: 'upstream_error', message: 'AI 服务返回错误，请稍后重试' });
  }

  const data = await upstream.json();
  const content: string = data.choices?.[0]?.message?.content ?? '';
  const lines = content.split('\n').map((l: string) => l.trim()).filter(Boolean);

  if (lines.length === 0) {
    await Promise.all([kv.decr(globalKey), kv.decr(ipKey)]);
    return res.status(502).json({ success: false, error: 'empty_response', message: 'AI 未返回有效内容，请重试' });
  }

  // 数量不足时循环补齐
  while (lines.length < safeCount) lines.push(...lines.slice(0, safeCount - lines.length));

  return res.status(200).json({
    success: true,
    lines: lines.slice(0, safeCount),
    remaining: Math.max(0, perIpLimit - ipCount), // 该 IP 今日剩余次数
  });
}
```

### 4.6 环境变量清单

在 Vercel 项目后台 → Settings → Environment Variables 中配置：

| 变量名 | 说明 | 必须 |
|---|---|---|
| `DEEPSEEK_API_KEY` | DeepSeek 平台申请的 API Key | 必须 |
| `KV_REST_API_URL` | Vercel KV 连接地址（绑定 KV 数据库后自动注入） | 自动 |
| `KV_REST_API_TOKEN` | Vercel KV Token（自动注入） | 自动 |
| `RATE_LIMIT_PER_IP_DAY` | 每 IP 每天限制次数，默认 `5` | 可选 |
| `RATE_LIMIT_GLOBAL_DAY` | 全平台每天上限，默认 `50` | 可选 |

> 调整限流阈值只需修改环境变量并重新部署，无需改代码。

### 4.7 成本估算

每次生成约 14 条鼓励语，估算消耗约 400 token（含 system prompt）。DeepSeek Chat API 价格约 ¥1/百万输入 token、¥2/百万输出 token。

| 每日全局上限 | 估算每日费用 | 估算每月费用 |
|---|---|---|
| **50 次（当前配置）** | **≈ ¥0.04** | **≈ ¥1.2** |
| 200 次 | ≈ ¥0.16 | ≈ ¥5 |
| 500 次 | ≈ ¥0.40 | ≈ ¥12 |

50 次/天的成本极低，如未来用户量增长可随时通过环境变量调高上限。

---

## 五、技术方案

### 5.1 技术栈

| 层 | 选型 |
|---|---|
| 前端框架 | React 18 + TypeScript |
| 样式 | Tailwind CSS |
| 日期处理 | dayjs |
| 日历组件 | react-datepicker |
| 拖拽排序 | @dnd-kit/sortable |
| Word 导出 | docx（npm） |
| 后端函数 | Vercel Functions（TypeScript） |
| KV 存储 | Vercel KV（限流计数） |
| 状态管理 | Zustand 或 React Context + useReducer |
| 打包 | Vite |

### 5.2 核心数据结构

```typescript
// 星期枚举，与 Date.getDay() 一致：0=周日, 1=周一, ..., 6=周六
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

interface Task {
  id: string;
  name: string; // 最多 20 字
}

// 两种任务配置模式
type TaskConfig =
  | { mode: 'unified'; tasks: Task[] }
  | { mode: 'byWeekday'; tasksByDay: Record<Weekday, Task[]> };

interface PrintConfig {
  name: string;
  startDate: string;               // ISO，如 "2026-03-24"
  endDate: string;                 // ISO，最多 startDate + 365 天
  taskConfig: TaskConfig;
  encouragements: string[];        // 循环分配
  columnsPerRow: 1 | 2 | 3;
  pageOrientation: 'portrait' | 'landscape';
}

// 渲染用每日卡片
interface DayCard {
  isoDate: string;
  displayDate: string;             // "2026 年 03 月 24 日"
  weekday: Weekday;
  weekdayLabel: string;            // "星期二"
  tasks: Task[];                   // 已按星期取值
  encouragement: string;
  isWeekend: boolean;
}
```

### 5.3 关键函数

```typescript
// 按星期取任务
function resolveTasksForDay(config: TaskConfig, weekday: Weekday): Task[] {
  if (config.mode === 'unified') return config.tasks;
  return config.tasksByDay[weekday] ?? [];
}

// 枚举日期（最多 365 天）
function enumerateDates(start: string, end: string): string[] {
  const dates: string[] = [];
  const cur = new Date(start);
  const endDate = new Date(end);
  while (cur <= endDate && dates.length < 366) {
    dates.push(cur.toISOString().slice(0, 10));
    cur.setDate(cur.getDate() + 1);
  }
  return dates;
}

// 鼓励语循环分配
function assignEncouragements(list: string[], count: number): string[] {
  if (!list.length) return Array(count).fill('继续加油！');
  return Array.from({ length: count }, (_, i) => list[i % list.length]);
}

// AI 生成数量策略
function resolveGenerateCount(dayCount: number): number {
  if (dayCount <= 14) return dayCount;
  if (dayCount <= 90) return 14;
  return 30;
}
```

### 5.4 前端 AI 调用封装（双路径）

```typescript
const STYLE_PROMPTS: Record<string, string> = {
  gentle:   '温柔亲切，像妈妈说话的语气，给孩子温暖感',
  lively:   '活泼开朗，可以用叠词、拟声词，语气轻松有趣',
  positive: '积极向上，简洁有力，像运动员宣言',
  poetic:   '文艺清新，句式优美，带有画面感',
  humorous: '轻松幽默，可以有小玩笑，让孩子看了想笑',
};

async function callAI(name: string, count: number, style: string): Promise<{
  lines: string[];
  remaining?: number;
}> {
  const userKey = localStorage.getItem('deepseek_api_key');

  if (userKey) {
    // 路径 A：用户自带 Key，直接调 DeepSeek，不走代理
    const res = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${userKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat',
        temperature: 0.9,
        messages: [
          { role: 'system', content: '你是一个专门为孩子生成打卡鼓励语的助手。只输出鼓励语列表，每条独占一行，不要编号，不要引号，不要任何其他内容。' },
          { role: 'user',   content: `请为名叫「${name}」的孩子生成 ${count} 条每日打卡鼓励语。\n风格要求：${STYLE_PROMPTS[style]}\n要求：每条不超过 20 字，语气亲切自然，每条独立一行。` },
        ],
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`DeepSeek 错误 ${res.status}`);
    const data = await res.json();
    const lines = data.choices[0].message.content.split('\n').map((l: string) => l.trim()).filter(Boolean);
    return { lines };
  }

  // 路径 B：使用平台代理（受限流约束）
  const res = await fetch('/api/generate-encouragement', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, count, style }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json();
  if (!data.success) throw Object.assign(new Error(data.message), { code: data.error });
  return { lines: data.lines, remaining: data.remaining };
}
```

**前端调用示例：**

```typescript
try {
  setLoading(true);
  const { lines, remaining } = await callAI(name, count, style);
  setGeneratedLines(lines);
  if (remaining !== undefined) setRemainingCount(remaining);
} catch (err: any) {
  if (err.code === 'rate_limited' || err.code === 'global_limit') {
    showRateLimitDialog(err.message); // 弹出降级弹窗
  } else {
    showToast(err.message ?? 'AI 生成失败，请稍后重试');
  }
} finally {
  setLoading(false);
}
```

### 5.5 大日期范围的性能处理

**预览（React）：**
```typescript
const PREVIEW_LIMIT = 30;
const visibleCards = showFullPreview ? dayCards : dayCards.slice(0, PREVIEW_LIMIT);
```

**打印：** 完整渲染所有天至隐藏 div，`window.print()` 后清除。

**Word 导出：** 分批处理每 30 天一组，通过 `setTimeout(0)` 让进度条有机会更新 UI：
```typescript
for (let i = 0; i < totalBatches; i++) {
  const batch = dayCards.slice(i * 30, (i + 1) * 30);
  // 生成该批的 Section，追加到 doc
  setProgress(Math.round((i + 1) / totalBatches * 100));
  await new Promise(r => setTimeout(r, 0)); // 释放主线程
}
```

### 5.6 Word 导出实现要点

- 页面尺寸用 DXA 单位（1440 DXA = 1 inch）
- 竖向 A4：`width: 11906, height: 16838`，边距各 720 DXA
- 横向 A4：同尺寸 + `orientation: PageOrientation.LANDSCAPE`
- 表格宽度用 `WidthType.DXA`，禁用百分比（Google Docs 不兼容）
- `columnWidths` 数组与每个 cell 的 `width` 必须同时设置且数值匹配
- 勾选框用 Unicode `□`（U+25A1）
- 单元格底色用 `ShadingType.CLEAR`（`SOLID` 会变黑底）
- 字体主选 `"Microsoft YaHei"`，回退 `"Arial"`

### 5.7 打印样式

```css
@media print {
  .config-panel,
  .toolbar,
  .preview-hint { display: none !important; }

  .preview-area { width: 100%; margin: 0; padding: 0; }

  .day-row {
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .page-break {
    page-break-after: always;
    break-after: page;
  }

  @page { margin: 10mm; }
}
```

---

## 六、页面分页逻辑

| 每行列数 | 纸张方向 | 参考每页天数 |
|---|---|---|
| 1 列 | A4 竖向 | 2 天/页 |
| 2 列 | A4 竖向 | 4 天/页 |
| 2 列 | A4 横向 | 6 天/页 |
| 3 列 | A4 横向 | 6 天/页 |

> 实际分页以内容高度动态计算为准，任务越多每行高度越大，每页天数越少。

---

## 七、边界情况处理

| 场景 | 处理方式 |
|---|---|
| 姓名为空 | 提示"请输入姓名"，鼓励语中使用"小朋友"替代 |
| 统一模式任务为空 | 提示"请至少添加 1 条任务" |
| 某星期任务为空（按星期模式） | 该天任务列为空并标注"暂无任务"，不阻断生成 |
| 日期超过 365 天 | 禁用超出部分，提示"最多支持 365 天" |
| 鼓励语数量少于天数 | 自动取模循环 |
| 平台额度用完 | 弹出降级弹窗，引导填写自己的 Key 或手动输入 |
| 用户 Key 无效（401） | Toast 提示"API Key 无效，请检查"，建议清除后重填 |
| AI 生成超时 | Toast 提示"请求超时，请检查网络后重试" |
| 任务名超过 20 字 | 输入框限制 20 字，超出截断 |
| Word 导出超过 300 天 | 展示进度条，完成后触发浏览器下载 |

---

## 八、非功能性需求

| 指标 | 要求 |
|---|---|
| 首屏加载 | < 2s |
| 预览渲染（≤ 30 天） | < 500ms |
| Word 导出（≤ 90 天） | < 5s |
| Word 导出（365 天） | < 20s，展示进度条 |
| AI 生成响应 | < 15s，展示 loading |
| 浏览器兼容 | Chrome 90+、Safari 15+、Edge 90+ |
| 移动端 | 配置可用，预览降级为单列，打印建议桌面端 |
| 无障碍 | 所有按钮和表单有 aria-label |
| 配置持久化 | PrintConfig 自动保存至 localStorage，刷新后恢复 |

---

## 九、MVP 范围与迭代规划

### MVP（第一版，全部必须实现）

- [x] 姓名 + 日期范围配置（快捷选项，支持最多 365 天）
- [x] 统一任务模式（增删排序）
- [x] 按星期配置任务（7 Tab，含跨天复制）
- [x] 每行 1/2/3 列布局 + 纸张方向切换
- [x] 鼓励语手动输入（循环分配）
- [x] AI 鼓励语生成（**双路径：平台代理 / 用户自带 Key**）
- [x] 后端代理服务（Vercel Function + Vercel KV）
- [x] 限流：每 IP 每天 5 次 + 全局每天 50 次
- [x] 网页实时预览（> 30 天截断，含提示）
- [x] 浏览器打印（完整输出全部天数）
- [x] 配置持久化（localStorage）

### V1.1（后续迭代）

- [ ] 导出 Word 文档（.docx），365 天含进度条
- [ ] 任务模板预置（学生工作日 / 学生周末 / 运动版）
- [ ] 按星期独立配置鼓励语

### V1.2（进阶功能）

- [ ] 导出 PDF
- [ ] 管理后台：查看每日调用次数、调整限流阈值
- [ ] 用户 Token 方案（邮箱注册，按账号计数，替代纯 IP 限流）
- [ ] 多套外观主题
- [ ] 节假日自动标记不同样式

---

## 十、附录

### 10.1 星期常量

```typescript
// 与 Date.getDay() 一致：0=周日, 1=周一, ..., 6=周六
const WEEKDAY_LABELS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
const WEEKDAY_SHORT  = ['周日',   '周一',   '周二',   '周三',   '周四',   '周五',   '周六'];
```

### 10.2 日期显示格式

```typescript
function formatDisplayDate(isoDate: string): string {
  const d = new Date(isoDate);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y} 年 ${m} 月 ${day} 日`;
}
```

### 10.3 项目目录结构参考

```
/
├── api/
│   └── generate-encouragement.ts   # Vercel Function（后端代理）
├── src/
│   ├── components/
│   │   ├── ConfigPanel/             # 左侧配置面板
│   │   │   ├── BasicInfo.tsx
│   │   │   ├── TaskManager.tsx      # 含统一/按星期模式切换
│   │   │   ├── Encouragement.tsx
│   │   │   └── LayoutSettings.tsx
│   │   ├── PreviewArea/             # 右侧预览
│   │   │   ├── DayCard.tsx
│   │   │   └── PageLayout.tsx
│   │   └── SettingsModal.tsx        # API Key 设置弹窗
│   ├── lib/
│   │   ├── buildDayCards.ts         # 核心数据处理
│   │   ├── exportWord.ts            # Word 导出
│   │   ├── callAI.ts                # AI 双路径调用
│   │   └── rateLimit.ts             # （仅后端用）
│   ├── store/
│   │   └── useAppStore.ts           # Zustand 全局状态
│   └── App.tsx
├── .env.local                       # 本地开发环境变量（不提交 git）
└── vercel.json
```

### 10.4 DeepSeek API 参考

- 官方文档：https://platform.deepseek.com/docs
- 与 OpenAI API 格式兼容，`model` 字段用 `"deepseek-chat"`
- 建议在 UI 侧对 AI 生成按钮加 3s 冷却，避免短时间内重复点击
- 本项目使用非流式响应（等待完整返回后统一解析），无需处理 SSE
