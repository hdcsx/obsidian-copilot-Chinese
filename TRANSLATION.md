# 翻译文件说明

这份说明供其他人用 AI 对照官方 Copilot `3.2.8` 继续翻译或复查。

翻译由 AI 完成，主要用于个人使用，不保证持续更新。

## 对照基准

官方提交：

`95d23b2387d4d22e5538e84ea176c6d878f6d36b`

对照时使用一份未修改的官方 3.2.8 源码。当前工作区里的 `.obsidian-copilot-src-backup-3.2.8` 不能当作干净英文源：它的提交号相同，但 `manifest.json` 的描述已经是中文，界面翻译也已经混在里面。

相对官方提交，当前仓库有 42 个源码文件和 2 个根目录文件不同，没有缺失官方文件。多出来的只有本文件 `TRANSLATION.md`。

每个文件只应改变用户可见的文字或发给模型的提示词，不应改变函数、参数、设置键和调用流程。

建议让 AI 对照时保留：

- 模型名称、模型 ID 和产品名 “Copilot”“Copilot Plus”
- 设置键、文件路径、frontmatter 键
- 工具名、函数名、参数名
- `{activeNote}`、`[[<note>]]`、`@vault`、`@websearch` 等占位符
- Markdown、XML、HTML 标签，以及 JSON、代码示例的结构

## 已修改的源码

### 界面与通用提示

- `src/constants.ts`：命令名称、错误提示、聊天与项目相关文案，以及默认系统提示词。
- `src/chainFactory.ts`：对话模式和链类型的显示名称。
- `src/core/ChatPersistenceManager.ts`：聊天记录保存与读取时显示给用户的提示。
- `src/main.ts`：插件入口中的用户提示。
- `src/utils/modelParamsHelper.ts`：模型参数相关的用户可见说明。

### 聊天界面

- `src/components/Chat.tsx`
- `src/components/CopilotView.tsx`
- `src/components/chat-components/ChatButtons.tsx`
- `src/components/chat-components/ChatControls.tsx`
- `src/components/chat-components/ChatInput.tsx`
- `src/components/chat-components/ChatToolControls.tsx`
- `src/components/modals/ConfirmModal.tsx`
- `src/components/modals/NewChatConfirmModal.tsx`
- `src/components/modals/ResetSettingsConfirmModal.tsx`
- `src/components/ui/ModelParametersEditor.tsx`
- `src/components/ui/parameter-controls.tsx`

### 设置页

- `src/settings/v2/SettingsMainV2.tsx`
- `src/settings/v2/components/AdvancedSettings.tsx`
- `src/settings/v2/components/ApiKeyDialog.tsx`
- `src/settings/v2/components/BasicSettings.tsx`
- `src/settings/v2/components/CommandSettings.tsx`
- `src/settings/v2/components/CopilotPlusSettings.tsx`
- `src/settings/v2/components/ModelAddDialog.tsx`
- `src/settings/v2/components/ModelEditDialog.tsx`
- `src/settings/v2/components/ModelSettings.tsx`
- `src/settings/v2/components/ModelTable.tsx`
- `src/settings/v2/components/PlusSettings.tsx`
- `src/settings/v2/components/QASettings.tsx`
- `src/settings/v2/components/ToolSettingsSection.tsx`

### 命令与快捷操作

- `src/commands/constants.ts`：13 条默认自定义命令的标题和提示词。
- `src/commands/CustomCommandSettingsModal.tsx`：自定义命令设置窗口。
- `src/commands/quickCommandPrompts.ts`：选中文字后使用的快捷命令提示词。
- `src/commands/customCommandChatEngine.ts`：自定义命令使用的默认编辑助手提示词。
- `src/LLMProviders/promptManager.ts`：提示词整理、发送前拼接和相关提示文案。

### 发给模型的规则

- `src/LLMProviders/chainRunner/utils/modelAdapter.ts`：自主代理的通用提示词，以及 GPT、Claude、Gemini、Copilot Plus 的专用说明。
- `src/LLMProviders/chainRunner/utils/citationUtils.ts`：回答中的引用格式和来源规则。
- `src/LLMProviders/chainRunner/VaultQAChainRunner.ts`：库内问答使用的检索与回答提示。
- `src/LLMProviders/chainRunner/CopilotPlusChainRunner.ts`：Copilot Plus 检索和文件处理流程中的提示词。
- `src/tools/builtinTools.ts`：内置工具说明和发给模型的工具使用规则。

### 侧边栏

- `src/components/chat-components/RelevantNotes.tsx`：「相关笔记」、索引按钮、相似度和链接说明。
- `src/components/chat-components/SuggestedPrompts.tsx`：「建议提示词」及其点击后发给模型的中文问题，包括当前笔记、笔记链接、模型测试、库内问答和 Copilot Plus。

### 根目录

- `manifest.json`：插件描述已改为中文。
- `README.md`：替换为这份中文修改的说明。

## 笔记库中的对应文件

`src/commands/constants.ts` 只提供首次导入时的默认命令。笔记库中已经存在的命令位于：

`copilot/copilot-custom-prompts/`

本次对应更新的笔记有：

- `修正语法和拼写.md`
- `翻译成中文.md`
- `总结.md`
- `简化.md`
- `像对五岁孩子一样解释.md`
- `添加表情符号.md`
- `缩短.md`
- `扩写.md`
- `生成目录.md`
- `生成术语表.md`
- `移除网址.md`
- `改写成一条推文.md`
- `改写成推文串.md`

修改源码后重新构建，不会自动覆盖这些已经导入的笔记。

## 尚未翻译的用户可见英文

以下文件相对官方 3.2.8 没有改动，但界面、通知或发给模型的说明仍是英文。继续翻译时优先处理这些：

- `src/commands/index.ts`：命令执行后的 Notice，例如索引、缓存、日志和复制结果。
- `src/commands/contextMenu.ts`：右键菜单 “Add selection to chat context”“Quick Ask”“Trigger quick command”。
- `src/commands/CustomCommandChatModal.tsx`、`src/components/quick-ask/`：快捷提问窗口的按钮、提示和错误通知。
- `src/components/chat-components/ChatHistoryPopover.tsx`、`ChatSettingsPopover.tsx`、`ProjectList.tsx`、`TokenLimitWarning.tsx`：历史记录、会话设置、项目和截断警告。
- `src/components/composer/ApplyView.tsx`：Composer 应用改动界面的 “Original”“Modified”“Accepted”“Rejected”。
- `src/components/modals/` 中尚未列出的弹窗：Copilot Plus 欢迎与过期、YouTube 字幕、项目和模式输入。
- `src/system-prompts/SystemPromptAddModal.tsx`：添加系统提示词时的英文示例，选择后会发给模型。
- `src/tools/` 下除 `builtinTools.ts` 以外的工具说明，以及 `src/LLMProviders/chainRunner/utils/AgentReasoningState.ts` 的代理状态文字。
- `src/search/`、`src/plusUtils.ts`、`src/utils.ts`：索引、Plus 资格和插入笔记时的 Notice。

测试文件、类型定义、构建脚本、日志字符串和第三方依赖不作为翻译对象。

## 已知语义差异

`src/constants.ts` 的默认系统提示词第 10 条与官方原文不完全对应。官方要求在 Markdown 表头后立即追加 `' |'`；当前中文改成了补一条分隔行。复查或重新翻译时应按官方原文处理。

## 对照命令

在同时拥有官方树 `upstream/` 和本仓库时：

```bash
diff -rq upstream/src src
```

若后续发现其他界面仍有英文，先确认该文字确实来自插件，再按上面的保留规则修改。
