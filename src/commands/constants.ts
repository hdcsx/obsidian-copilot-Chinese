import { CustomCommand } from "@/commands/type";

export const LEGACY_SELECTED_TEXT_PLACEHOLDER = "{copilot-selection}";
export const COMMAND_NAME_MAX_LENGTH = 50;
export const QUICK_COMMAND_CODE_BLOCK = "copilotquickcommand";
export const EMPTY_COMMAND: CustomCommand = {
  title: "",
  content: "",
  showInContextMenu: true,
  showInSlashMenu: true,
  order: 0,
  modelKey: "",
  lastUsedMs: 0,
};

// Custom command frontmatter property constants
export const COPILOT_COMMAND_CONTEXT_MENU_ENABLED = "copilot-command-context-menu-enabled";
export const COPILOT_COMMAND_SLASH_ENABLED = "copilot-command-slash-enabled";
export const COPILOT_COMMAND_CONTEXT_MENU_ORDER = "copilot-command-context-menu-order";
export const COPILOT_COMMAND_MODEL_KEY = "copilot-command-model-key";
export const COPILOT_COMMAND_LAST_USED = "copilot-command-last-used";
export const DEFAULT_COMMANDS: CustomCommand[] = [
  {
    title: "修正语法和拼写",
    content: `修正 {} 的语法和拼写。保留所有格式、换行和特殊字符，不要增加或删除内容。只返回修正后的文本。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1000,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "翻译成中文",
    content: `把 {} 翻译成中文：
    1. 保留原意和语气
    2. 维持合适的文化语境
    3. 保持格式和结构
    只返回译文。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1010,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "总结",
    content: `为 {} 生成项目符号摘要。每个项目符号概括一个要点。只返回项目符号摘要。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1020,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "简化",
    content: `把 {} 简化到小学六年级阅读水平（约 11–12 岁）。使用简单句子、常用词和清楚的解释，保留原来的关键概念。只返回简化后的文本。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1030,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "像对五岁孩子一样解释",
    content: `用五岁孩子能理解的简单方式解释 {}：
    1. 使用基础词汇
    2. 加入简单类比
    3. 拆开复杂概念
    只返回简化后的解释。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1040,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "添加表情符号",
    content: `为 {} 添加贴切的表情符号。遵循以下规则：
    1. 在文本的自然停顿处插入表情符号
    2. 不要让两个表情符号相邻
    3. 保持全部原文不变
    4. 选择符合上下文和语气的表情符号
    只返回添加表情符号后的文本。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1050,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "缩短",
    content: `把 {} 缩短到原来的一半，同时保留：
    1. 主要思想和要点
    2. 必要细节
    3. 原来的语气和风格
    只返回缩短后的文本。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1060,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "扩写",
    content: `把 {} 扩写到原来的两倍：
    1. 增加相关细节和例子
    2. 展开要点
    3. 保持原来的语气和风格
    只返回扩写后的文本。`,
    showInContextMenu: true,
    showInSlashMenu: true,
    order: 1070,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "生成目录",
    content: `为 {} 生成分层目录。使用合适的标题级别（H1、H2、H3 等）。如果原文有页码，也保留页码。只返回目录。`,
    showInContextMenu: false,
    showInSlashMenu: false,
    order: 1080,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "生成术语表",
    content: `从 {} 中提取重要术语、概念和短语，生成术语表。每条格式为“术语：定义”，并按拼音或字母顺序排列。只返回术语表。`,
    showInContextMenu: false,
    showInSlashMenu: false,
    order: 1090,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "移除网址",
    content: `移除 {} 中的全部网址。保留其他内容和格式。网址可能是 http、https 或 www 等形式。只返回移除网址后的文本。`,
    showInContextMenu: false,
    showInSlashMenu: false,
    order: 1100,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "改写成一条推文",
    content: `把 {} 改写成一条推文，要求：
    1. 最多 280 个字符
    2. 语言简洁、有力
    3. 保留核心信息
    只返回推文文本。`,
    showInContextMenu: false,
    showInSlashMenu: false,
    order: 1110,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "改写成推文串",
    content: `把 {} 转换成一条 Twitter 推文串，遵循以下规则：
    1. 每条推文少于 240 个字符
    2. 开头单独一行写“THREAD START”
    3. 推文之间用“\n\n---\n\n”分隔
    4. 结尾单独一行写“THREAD END”
    5. 内容清楚且有吸引力
    只返回格式化后的推文串。`,
    showInContextMenu: false,
    showInSlashMenu: false,
    order: 1120,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "剪藏 YouTube 字幕",
    content: `
根据上下文中的 YouTube 视频信息和字幕，按以下格式生成一篇完整的 Obsidian 笔记。

重要：如果没有找到 YouTube 视频上下文，请提醒用户：
1. 在网页查看器中打开一个 YouTube 视频（或用 @ 选择一个 YouTube 网页标签）
2. 然后再次使用此命令

按这个精确结构生成笔记：

---
title: "<视频标题>"
description: "<简介的前 200 个字符>"
channel: "<频道名称>"
url: "<视频网址>"
duration: "<时长>"
published: <上传日期，格式为 YYYY-MM-DD>
thumbnailUrl: "<YouTube 缩略图网址：使用 https 协议的 i.ytimg.com/vi/VIDEO_ID/maxresdefault.jpg>"
genre:
  - "<类型>"
watched:
---
![<视频标题>](<视频网址>)

> [!summary]- 简介
> <完整视频简介，保留换行>

## 摘要

<用 2–3 段简要总结视频内容>

## 要点

<用项目符号列出 5–8 个要点>

## 思维导图

必须严格遵守以下 Mermaid 思维导图语法：
- 根节点格式：root(主题名称)，使用圆括号，不要使用双括号
- 子节点只使用纯文本，不需要括号
- 文本中不要使用引号、圆括号、方括号或任何特殊字符
- 不要使用图标或表情符号
- 每个节点文字简短，最多 3–4 个词
- 只使用字母、数字和空格

正确语法示例：
\`\`\`mermaid
mindmap
  root(Video Main Topic)
    First Theme
      Detail one
      Detail two
    Second Theme
      Detail three
    Third Theme
\`\`\`

## 值得摘录的话

<从字幕中列出 5–10 句值得摘录的话。每条格式如下：>
- [<时间戳>: <摘录文本>](<视频网址>&t=<秒数>s)

只返回 Markdown 内容，不要添加解释或注释。`,
    showInContextMenu: false,
    showInSlashMenu: true,
    order: 1130,
    modelKey: "",
    lastUsedMs: 0,
  },
  {
    title: "剪藏网页",
    content: `
根据上下文中的网页内容（来自 Obsidian Web Clipper 或网页查看器），生成一篇完整的 Obsidian 笔记。

重要：如果没有找到网页上下文，请提醒用户：
1. 在网页查看器中打开一个网页（或用 @ 选择一个网页标签）
2. 或者打开一篇由 Obsidian Web Clipper 剪藏的笔记
3. 然后再次使用此命令

按这个精确结构生成笔记：

---
title: "<页面标题>"
source: "<页面网址>"
description: "<简短描述>"
tags:
  - "clippings"
---

## 摘要

<用 2–3 段简要总结页面内容>

## 要点

<用项目符号列出 5–8 个要点>

## 思维导图

必须严格遵守以下 Mermaid 思维导图语法：
- 根节点格式：root(主题名称)，使用圆括号，不要使用双括号
- 子节点只使用纯文本，不需要括号
- 文本中不要使用引号、圆括号、方括号或任何特殊字符
- 每个节点文字简短，最多 3–4 个词

\`\`\`mermaid
mindmap
  root(Main Topic)
    Theme One
      Detail
    Theme Two
      Detail
\`\`\`

## 值得摘录的话

<如有内容，列出 3–5 句值得摘录的话>

只返回 Markdown 内容，不要添加解释或注释。`,
    showInContextMenu: false,
    showInSlashMenu: true,
    order: 1140,
    modelKey: "",
    lastUsedMs: 0,
  },
];
