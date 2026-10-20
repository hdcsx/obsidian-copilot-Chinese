# Copilot 中文版

Copilot 是 Obsidian 的 AI 助手插件。

这个仓库基于官方插件的 `3.2.8` 版本，把界面和发给模型的提示词改成了中文，没有添加官方版本之后的新功能。

翻译由 AI 完成，主要用于个人使用，不保证持续更新。想自己对照修改的，可以看 [翻译文件说明](TRANSLATION.md)。

实际安装并使用的 Obsidian 版本是 **1.5.12**（Android）。插件清单声明的最低版本仍是官方的 `0.15.0`，其他 Obsidian 版本没有验证。

## 主要改动

**界面改成中文**

- 设置页、模型配置、命令菜单和状态提示
- 聊天输入、上下文菜单和常用按钮
- 侧边栏的「相关笔记」与「建议提示词」
- 索引、检索、项目模式和 Copilot Plus 的说明

这次没有覆盖全部界面。右键菜单、快捷提问、项目列表、Composer 应用改动、部分弹窗和索引通知仍有英文。完整的已改文件和未改位置见 [翻译文件说明](TRANSLATION.md)。

**提示词改成中文**

- 默认系统提示词和快捷命令提示词
- Composer 输出格式、引用规则和编辑助手提示词
- GPT、Claude、Gemini、Copilot Plus 的代理提示词
- 侧边栏建议提示词；点击后会直接以中文发给模型

**默认命令改成中文**

- 修正语法和拼写、翻译成中文、总结、简化
- 像对五岁孩子一样解释、添加表情符号、缩短、扩写
- 生成目录、生成术语表、移除网址
- 改写成一条推文、改写成推文串

这些命令首次导入后保存在笔记库的 `copilot/copilot-custom-prompts/`。之后插件不会自动覆盖，已有笔记需要单独替换。

模型名称、设置键、路径、工具名、参数名，以及 `{activeNote}`、`[[<note>]]`、`@vault`、`@websearch` 等程序识别内容保持原文。

---

如果你想了解 Copilot 的完整功能，请到原作者仓库查看 -> [原 Copilot 插件仓库](https://github.com/logancyang/obsidian-copilot)

本仓库对应的上游版本为 **3.2.8**，提交 `95d23b2387d4d22e5538e84ea176c6d878f6d36b`。

Obsidian Copilot 是一个免费且开源的 LLM 接口，直接内置于 Obsidian。

- 在 Obsidian 中与笔记对话。
- 用快捷命令处理选中的文字。
- 搜索并问答整个笔记库。
- 使用 Copilot Plus 的自主代理、网页、YouTube 和文件工具。

## 安装

这个仓库只保存源码。直接克隆后，Obsidian 不能加载它，也不需要自己编译。

打开本仓库的 **Releases**，下载最新发布里的这三个文件：

- `manifest.json`
- `main.js`
- `styles.css`

放到笔记库的 `.obsidian/plugins/copilot/`。如果目录里已经有 `data.json`，不要覆盖，那是你自己的设置。

然后在 Obsidian 中重新启用或重新加载 Copilot。目前只在 **Obsidian 1.5.12** 上使用过。

## 自己构建

只有想从源码重新打包时才需要：

```bash
npm ci --ignore-scripts
npm run build
```

把生成的 `main.js`、`styles.css` 和 `manifest.json` 放到 `.obsidian/plugins/copilot/`。不要覆盖其中的 `data.json`。

上游项目 © Logan Yang / Brevilabs，许可证为 **AGPL-3.0**。