import { logInfo } from "@/logger";
import { ToolMetadata } from "@/tools/ToolRegistry";
import { BaseChatModel } from "@langchain/core/language_models/chat_models";

/**
 * Represents a labeled segment of the system prompt used for tool prompting.
 */
export interface PromptSection {
  id: string;
  label: string;
  source: string;
  content: string;
}

/**
 * Join prompt sections into a single prompt while preserving blank line separation.
 *
 * @param sections - Prompt sections to concatenate in order.
 * @returns The combined prompt content suitable for LLM input.
 */
export function joinPromptSections(sections: PromptSection[]): string {
  return sections
    .map((section) => section.content)
    .filter((content) => content && content.trim().length > 0)
    .join("\n\n");
}

/**
 * Model-specific adaptations for autonomous agent
 * Handles quirks and requirements of different LLM providers
 */

export interface ModelAdapter {
  /**
   * Enhance system prompt with model-specific instructions
   * @param basePrompt - The base system prompt to enhance
   * @param toolDescriptions - Available tool descriptions to include
   * @param availableToolNames - List of enabled tool names (for backward compatibility)
   * @param toolMetadata - Tool metadata including custom instructions
   * @returns The enhanced system prompt
   */
  enhanceSystemPrompt(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): string;

  /**
   * Build ordered system prompt sections tagged with their source information.
   *
   * @param basePrompt - The base system prompt to enhance.
   * @param toolDescriptions - The tool descriptions included in the prompt.
   * @param availableToolNames - Names of tools enabled for the run.
   * @param toolMetadata - Metadata with custom instructions for each tool.
   * @returns Array of prompt sections in the order they should appear.
   */
  buildSystemPromptSections(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): PromptSection[];

  /**
   * Enhance user message if needed for specific models
   * @param message - The user's message to enhance
   * @param requiresTools - Whether the message likely requires tool usage
   * @returns The enhanced user message
   */
  enhanceUserMessage(message: string, requiresTools: boolean): string;

  /**
   * Parse tool calls from model response (future: handle different formats)
   * @param response - The model's response text containing tool calls
   * @returns Array of parsed tool calls
   */
  parseToolCalls?(response: string): any[];

  /**
   * Check if model needs special handling
   * @returns True if the model requires special handling beyond base behavior
   */
  needsSpecialHandling(): boolean;
}

/**
 * Base adapter with default behavior (no modifications)
 */
class BaseModelAdapter implements ModelAdapter {
  constructor(protected modelName: string) {}

  private buildToolSpecificInstructions(toolMetadata: ToolMetadata[]): string {
    const instructions: string[] = [];

    // Collect all custom instructions from tool metadata
    for (const meta of toolMetadata) {
      if (meta.customPromptInstructions) {
        instructions.push(meta.customPromptInstructions);
      }
    }

    const copilotCommandInstructions = this.buildCopilotCommandInstructions(toolMetadata);
    if (copilotCommandInstructions) {
      instructions.push(copilotCommandInstructions);
    }

    return instructions.length > 0 ? instructions.join("\n\n") : "";
  }

  /**
   * Build instructional text that maps Copilot command aliases to tool names.
   *
   * @param toolMetadata - Metadata for all tools available to the agent.
   * @returns Instructional string or null if there are no Copilot aliases.
   */
  private buildCopilotCommandInstructions(toolMetadata: ToolMetadata[]): string | null {
    const aliasLines: string[] = [];

    for (const meta of toolMetadata) {
      if (!meta.copilotCommands || meta.copilotCommands.length === 0) {
        continue;
      }

      for (const command of meta.copilotCommands) {
        aliasLines.push(`- ${command}: call the tool named ${meta.id}`);
      }
    }

    if (aliasLines.length === 0) {
      return null;
    }

    return [
      "When the user explicitly includes a Copilot command alias (e.g., @vault) in their message, treat it as a direct request to call the mapped tool before proceeding.",
      "Honor these aliases exactly (case-insensitive):",
      ...aliasLines,
      "If the referenced tool is unavailable, explain that the command cannot be fulfilled instead of ignoring it.",
    ].join("\n");
  }

  enhanceSystemPrompt(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): string {
    const sections = this.buildSystemPromptSections(
      basePrompt,
      toolDescriptions,
      availableToolNames,
      toolMetadata
    );
    return joinPromptSections(sections);
  }

  buildSystemPromptSections(
    basePrompt: string,
    toolDescriptions: string,
    _availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): PromptSection[] {
    const metadata = toolMetadata || [];
    const toolSpecificInstructions = this.buildToolSpecificInstructions(metadata).trim();
    const normalizedBasePrompt = basePrompt.trimEnd();
    const sections: PromptSection[] = [
      {
        id: "base-system-prompt",
        label: "System prompt with memory",
        source: "src/system-prompts/systemPromptBuilder.ts#getSystemPromptWithMemory",
        content: normalizedBasePrompt,
      },
      {
        id: "autonomous-agent-intro",
        label: "Autonomous agent introduction",
        source:
          "src/LLMProviders/chainRunner/utils/modelAdapter.ts#BaseModelAdapter.buildSystemPromptSections",
        content: `# 自主代理模式

你现在处于自主代理模式。可以使用工具逐步收集信息并完成任务。

工具通过原生函数调用提供。需要完成任务时就使用它们。
`,
      },
    ];

    const trimmedToolDescriptions = toolDescriptions.trim();

    if (trimmedToolDescriptions.length > 0) {
      sections.push({
        id: "tool-descriptions",
        label: "Tool descriptions (native tool calling via bindTools)",
        source: "Native tool calling - schemas provided via bindTools()",
        content: `可用工具：
${trimmedToolDescriptions}`,
      });
    }

    sections.push({
      id: "tool-usage-guidelines",
      label: "Tool usage guidelines",
      source:
        "src/LLMProviders/chainRunner/utils/modelAdapter.ts#BaseModelAdapter.buildSystemPromptSections",
      content: `# 工具使用规则

## 与时间有关的查询
当用户询问某个时间段（例如“我上个月做了什么”“给我看上周的笔记”）时，你必须：
1. 先调用 getTimeRangeMs，把时间表达转换成正确的时间范围
2. 再使用 localSearch，并传入第 1 步得到的 timeRange 参数
3. salientTerms 只能使用用户原始查询中的词语，不包括时间表达

“我上个月做了什么”的示例：
1. 调用 getTimeRangeMs，timeExpression 为“last month”
2. 使用 localSearch，query 与用户的问题相符
3. salientTerms: []。这里留空，因为“what”“I”“do”不是有意义的搜索词

“上周关于项目 X 的会议”的示例：
1. 调用 getTimeRangeMs，timeExpression 为“last week”
2. 使用 localSearch，query 为“meetings about project X”
3. salientTerms: ["meetings", "project", "X"]。这些词都出现在原始查询中

## 与文件有关的查询

### 处理不明确的文件夹或笔记路径
如果用户只提到文件夹名（例如“会议文件夹”）或笔记名（例如“会议笔记模板”），没有给出准确路径，
必须先调用 getFileTree，找出最符合用户查询的文件夹或笔记。
如果有多个结果或没有结果，应请用户提供更具体的路径。
`,
    });

    if (toolSpecificInstructions.length > 0) {
      sections.push({
        id: "tool-specific-instructions",
        label: "Tool-specific instructions",
        source:
          "src/LLMProviders/chainRunner/utils/modelAdapter.ts#BaseModelAdapter.buildToolSpecificInstructions",
        content: toolSpecificInstructions,
      });
    }

    sections.push({
      id: "general-guidelines",
      label: "General guidelines",
      source:
        "src/LLMProviders/chainRunner/utils/modelAdapter.ts#BaseModelAdapter.buildSystemPromptSections",
      content: `## 回答来源优先级（关键）
你是用户的个人知识助手。回答必须依据真实来源，而不是你自己的训练数据。按以下优先级：

1. **明确提供的上下文优先。** 如果用户在对话中附加了笔记、文档、网址、YouTube 字幕、推文或其他内容，就以这些内容为主要来源。用户添加它们是有原因的。
2. **其次是库。** 只要问题有可能由用户的笔记回答，就搜索库（localSearch）。用户自己的文字、会议记录、日记和保存的参考资料都很有价值。
3. **再次是网页。** 如果库中没有相关结果，或问题涉及库里不太可能有的外部信息、最新信息，就搜索网页。
4. **最后才使用你自己的知识。** 只有以上来源都已用尽，或明显不适用时（例如解释一般概念、编写代码，或不需要来源材料的创作任务），才回退到训练数据。

有疑问时就搜索库。查过但没有结果，总比跳过搜索而漏掉相关笔记更好。

## 通用规则
- 回复中绝不要提到“localSearch”“webSearch”等工具名。使用自然语言，例如“正在搜索你的库”“正在搜索网页”。

可以按顺序使用多个工具。每次工具执行后，你会收到结果，再决定继续使用工具还是给出最终回复。

使用工具前始终说明你的判断。用对话式语言清楚说明正在做什么。
收集到足够信息后，给出最终回复，不再调用工具。

## 引用完整性（关键）
- 只能引用来自你实际调用并收到结果的工具
- 绝不要编造搜索结果、网页搜索结果或任何工具输出
- 如果没有调用某个工具，就不要声称调用过，也不要引用它的结果
- 每条引用都必须对应本次对话中某个工具返回的真实文档或结果`,
    });

    return sections;
  }

  enhanceUserMessage(message: string, _requiresTools: boolean): string {
    return message;
  }

  needsSpecialHandling(): boolean {
    return false;
  }
}

/**
 * GPT-specific adapter with aggressive prompting
 */
class GPTModelAdapter extends BaseModelAdapter {
  /**
   * Check if this is a GPT-5 model
   * @returns True if the model is in the GPT-5 family
   */
  protected isGPT5Model(): boolean {
    return this.modelName.includes("gpt-5") || this.modelName.includes("gpt5");
  }
  buildSystemPromptSections(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): PromptSection[] {
    const sections = super.buildSystemPromptSections(
      basePrompt,
      toolDescriptions,
      availableToolNames,
      toolMetadata
    );

    const tools = availableToolNames || [];
    const hasComposerTools = tools.includes("writeFile") || tools.includes("editFile");

    const gptSectionParts: string[] = [];

    if (this.isGPT5Model()) {
      gptSectionParts.push(`GPT-5 专用规则：
- 最初最多调用 2 次工具，然后给出回答
- 每个不同的查询只调用同一工具一次
- 不需要的可选参数应完全省略，不要传入空字符串或 null
- 使用 localSearch 时，如果不是按时间搜索，就省略 timeRange`);
    } else {
      gptSectionParts.push(
        "GPT 模型的关键要求：用户请求需要工具时，你必须使用工具。不要只描述打算做什么，而要实际调用工具。"
      );
    }

    if (hasComposerTools) {
      gptSectionParts.push(`🚨 使用 Composer 工具编辑文件 🚨

当用户要求编辑或修改文件时，你必须：
1. 判断这是小幅修改（使用 editFile）还是大幅重写（使用 writeFile）
2. 立刻调用工具，不要只描述打算做什么

调用 editFile 时，传入要查找的精确文本及其替换文本：
- path：相对于库的文件路径
- oldText：要查找的精确文本（包含周围的上下文行，使其唯一）
- newText：替换文本（空字符串表示删除）

❌ 错误：“我会帮你把第 4 项加到列表中，现在就更新。”［没有调用工具 = 失败］
✅ 正确：实际调用 editFile 或 writeFile，并传入正确参数`);
    }

    gptSectionParts.push(
      "给 GPT 模型的最后提醒：如果用户要求搜索、查找、编辑或修改任何内容，必须立刻调用合适的工具，不要等到下一轮。"
    );

    const gptSpecificContent = gptSectionParts.join("\n\n");

    sections.push({
      id: "gpt-specific-guidelines",
      label: "GPT-specific guidance",
      source:
        "src/LLMProviders/chainRunner/utils/modelAdapter.ts#GPTModelAdapter.buildSystemPromptSections",
      content: gptSpecificContent,
    });

    return sections;
  }

  enhanceUserMessage(message: string, requiresTools: boolean): string {
    if (requiresTools) {
      return this.getBaseEnhancement(message, requiresTools);
    }
    return message;
  }

  private getBaseEnhancement(message: string, requiresTools: boolean): string {
    if (!requiresTools) return message;

    const lowerMessage = message.toLowerCase();
    const requiresSearch =
      lowerMessage.includes("find") ||
      lowerMessage.includes("search") ||
      lowerMessage.includes("my notes");

    const requiresFileEdit =
      lowerMessage.includes("edit") ||
      lowerMessage.includes("modify") ||
      lowerMessage.includes("update") ||
      lowerMessage.includes("change") ||
      lowerMessage.includes("fix") ||
      lowerMessage.includes("add") ||
      lowerMessage.includes("typo");

    if (requiresSearch) {
      return `${message}\n\n提醒：现在就调用 localSearch 工具。`;
    }

    if (requiresFileEdit) {
      return `${message}\n\n🚨 GPT 提醒：小幅修改使用 editFile（参数为 oldText 和 newText），完整重写使用 writeFile。`;
    }

    return message;
  }

  needsSpecialHandling(): boolean {
    return true;
  }
}

/**
 * Claude adapter with special handling for thinking models
 */
class ClaudeModelAdapter extends BaseModelAdapter {
  /**
   * Check if this is a Claude thinking model (3.7 Sonnet or Claude 4)
   * @returns True if the model supports thinking/reasoning modes
   */
  private isThinkingModel(): boolean {
    return (
      this.modelName.includes("claude-3-7-sonnet") ||
      this.modelName.includes("claude-sonnet-4") ||
      this.modelName.includes("claude-3.7-sonnet") ||
      this.modelName.includes("claude-4-sonnet") ||
      this.modelName.includes("claude-opus-4")
    );
  }

  /**
   * Check if this is specifically Claude Sonnet 4 (has hallucination issues)
   * @returns True if the model is Claude Sonnet 4 variants
   */
  private isClaudeSonnet4(): boolean {
    return (
      this.modelName.includes("claude-sonnet-4") ||
      this.modelName.includes("claude-4-sonnet") ||
      this.modelName.includes("claude-sonnet-4-20250514")
    );
  }

  buildSystemPromptSections(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): PromptSection[] {
    const sections = super.buildSystemPromptSections(
      basePrompt,
      toolDescriptions,
      availableToolNames,
      toolMetadata
    );

    if (!this.isThinkingModel()) {
      return sections;
    }

    const thinkingSectionParts: string[] = [
      `Claude 思考模型的重要说明：
- 你是具备内部推理能力的思考模型
- 思考过程会自动包裹在 <think> 标签中，不要手动添加思考标签
- 思考完成后再调用工具
- 使用工具前不要给出最终答案；先使用工具，再根据结果回复

思考模型的正确流程：
1. 思考问题（这一步自动进行）
2. 使用工具收集信息
3. 等待工具结果
4. 根据收集到的信息给出最终回复

错误：使用工具前就给出最终答案
正确：先使用工具，再根据结果回答`,
    ];

    if (this.isClaudeSonnet4()) {
      thinkingSectionParts.push(`🚨 Claude Sonnet 4 自主代理模式的关键说明 🚨

⚠️ 警告：你特别容易在调用工具后立刻写出完整回复。这会破坏自主代理流程！

🔄 正确的自主代理循环：
1. 用户提出问题
2. 用一句简短的话说明将要做什么（最多一句）
3. 使用工具收集信息
4. ✋ 调用工具后停止，不要再写其他内容
5. 等待工具结果（由系统提供）
6. 评估结果，然后继续使用工具，或给出最终答案

✅ 理想的回复流程：
- 简短的行动说明（一句）
- 调用工具
- 停止（等待结果）
- 简短的过渡说明（一句）
- 继续调用工具，或给出最终答案

🎯 正确模式：
我会在你的库中搜索钢琴练习信息。
［调用 localSearch 工具］
［回复到此结束，不要再写文字］

❌ 错误模式（不要这样做）：
［调用工具］
根据搜索结果，这是一份完整的练习计划……
［这是禁止的：你还没有收到结果！］

🔑 Claude 4 的关键理解：
- 调用工具前用一句简短说明是合适的
- 每次回复只是多步骤流程中的一步
- 调用工具后停止，等待系统提供结果
- 思考过程会自动放在 <think> 块中

⚡ Claude 4 的自主代理规则：
1. 需要工具时：一句简短说明 + 调用工具，然后停止
2. 收到工具结果后：判断是否还需要更多工具
3. 还需要工具时：一句简短说明 + 继续调用工具，然后停止
4. 信息已经足够时：这时才给出最终回复

记住：工具前一句简短说明刚刚好。调用工具后不要再写任何内容。`);
    }

    sections.push({
      id: "claude-thinking-guidelines",
      label: "Claude thinking model guidance",
      source:
        "src/LLMProviders/chainRunner/utils/modelAdapter.ts#ClaudeModelAdapter.buildSystemPromptSections",
      content: thinkingSectionParts.join("\n\n"),
    });

    return sections;
  }

  needsSpecialHandling(): boolean {
    return this.isThinkingModel();
  }
}

/**
 * Gemini adapter with aggressive tool calling prompts
 */
class GeminiModelAdapter extends BaseModelAdapter {
  buildSystemPromptSections(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): PromptSection[] {
    const sections = super.buildSystemPromptSections(
      basePrompt,
      toolDescriptions,
      availableToolNames,
      toolMetadata
    );

    // Gemini needs very explicit instructions about tool usage
    const tools = availableToolNames || [];
    const hasLocalSearch = tools.includes("localSearch");

    const geminiSectionParts: string[] = [
      `🚨 Gemini 自主代理模式的关键说明 🚨

你必须使用工具完成任务。不要询问用户下一步该怎么做。
${
  hasLocalSearch
    ? `
当用户提到“我的笔记”或“我的库”时，使用 localSearch 工具。

❌ 错误：
“我们先搜索你的笔记。我应该查找哪类信息？”

✅ 正确：立刻调用 localSearch，并把用户的主题作为 query`
    : ""
}`.trim(),
    ];

    geminiSectionParts.push(`Gemini 专用规则：
1. 用户提到关于 X 的“我的笔记”时 → 使用 localSearch，query 为“X”
2. 不要追问搜索词
3. 不要等待用户允许后再使用工具
4. 根据用户请求使用工具

🚨 关键：顺序调用与并行调用 🚨

如果一个工具的输出需要作为另一个工具的输入，必须分成不同回复：
1. 调用第一个工具
2. 停止并等待结果
3. 在下一次回复中，把第 1 步的结果用于第二个工具调用

❌ 错误（不要这样做）：
用户：“总结我上周的内容”
- 同时调用 getTimeRangeMs 和 localSearch，并编造 timeRange 的值
- 这是错误的，因为你在臆造 timeRange 的值！

✅ 正确（这样做）：
用户：“总结我上周的内容”
- 第一步：调用 getTimeRangeMs，timeExpression 为“last week”
- 等待结果
- 第二步：使用结果中的真实 timeRange 调用 localSearch

规则：绝不要编造或猜测参数值。如果需要某个工具的输出，先调用该工具，再等待结果。

记住：用户已经说明要做什么。现在就用可用工具执行。`);

    sections.push({
      id: "gemini-specific-guidelines",
      label: "Gemini-specific guidance",
      source:
        "src/LLMProviders/chainRunner/utils/modelAdapter.ts#GeminiModelAdapter.buildSystemPromptSections",
      content: geminiSectionParts.join("\n\n"),
    });

    return sections;
  }

  enhanceUserMessage(message: string, requiresTools: boolean): string {
    if (requiresTools) {
      // Add explicit reminder for Gemini
      return `${message}\n\n提醒：立刻使用工具，不要提问。涉及“我的笔记”时使用 localSearch。`;
    }
    return message;
  }

  needsSpecialHandling(): boolean {
    return true;
  }
}

/**
 * Copilot Plus adapter for Flash models with anti-hallucination focus
 */
class CopilotPlusModelAdapter extends BaseModelAdapter {
  buildSystemPromptSections(
    basePrompt: string,
    toolDescriptions: string,
    availableToolNames?: string[],
    toolMetadata?: ToolMetadata[]
  ): PromptSection[] {
    const sections = super.buildSystemPromptSections(
      basePrompt,
      toolDescriptions,
      availableToolNames,
      toolMetadata
    );

    sections.push({
      id: "copilot-plus-guidelines",
      label: "Copilot Plus model guidance",
      source:
        "src/LLMProviders/chainRunner/utils/modelAdapter.ts#CopilotPlusModelAdapter.buildSystemPromptSections",
      content: `🚨 关键：禁止编造工具调用或来源 🚨

你是 Copilot Plus 模型，必须严格遵守以下规则：

## 工具调用完整性
- 只能引用本次对话中你实际调用过的工具结果
- 除非调用了 webSearch 并收到结果，否则绝不能声称进行过网页搜索
- 除非调用了 localSearch 并收到结果，否则绝不能声称搜索过笔记
- 如果要搜索网页，必须先调用 webSearch，不能编造结果

## 引用规则
- 每个引用 [1]、[2] 等都必须对应工具返回的真实来源
- 除非确实调用了 webSearch，否则不要编造“关于 X 的一般网页搜索结果”之类的来源
- 如果只调用了 localSearch，引用只能来自那次搜索返回的笔记
- 数清实际的工具调用次数；如果只调用了 1 次，就不能引用来自多个不同工具的结果

## 写引用之前
先问自己：“我是否真的调用了这个工具并收到了这个结果？”
- 如果是：可以引用
- 如果不是：不要引用，也不要声称做过

记住：说“我只搜索了你的笔记，没有搜索网页”，也比编造网页搜索结果更好。

## 格式规则
- 避免使用 Markdown 表格，它们在聊天界面中经常显示不佳
- 用项目符号、编号列表或简单的格式化文本代替表格
- 只有用户明确要求表格时才使用表格`,
    });

    return sections;
  }

  needsSpecialHandling(): boolean {
    return true;
  }
}

/**
 * Factory to create appropriate adapter based on model
 */
export class ModelAdapterFactory {
  static createAdapter(model: BaseChatModel): ModelAdapter {
    const modelName = ((model as any).modelName || (model as any).model || "").toLowerCase();

    logInfo(`Creating model adapter for: ${modelName}`);

    // GPT models need special handling
    if (modelName.includes("gpt")) {
      const adapter = new GPTModelAdapter(modelName);
      // Log if it's a GPT-5 model for debugging
      if ((adapter as any).isGPT5Model()) {
        logInfo("Using GPTModelAdapter with GPT-5 specific enhancements");
      } else {
        logInfo("Using GPTModelAdapter");
      }
      return adapter;
    }

    // Claude models
    if (modelName.includes("claude")) {
      logInfo("Using ClaudeModelAdapter");
      return new ClaudeModelAdapter(modelName);
    }

    // Gemini models (check for both "gemini" and "google" prefixes)
    if (modelName.includes("gemini") || modelName.includes("google/gemini")) {
      logInfo("Using GeminiModelAdapter");
      return new GeminiModelAdapter(modelName);
    }

    // Copilot Plus models (Flash-based, needs anti-hallucination guidance)
    if (modelName.includes("copilot-plus")) {
      logInfo("Using CopilotPlusModelAdapter");
      return new CopilotPlusModelAdapter(modelName);
    }

    // Default adapter for unknown models
    logInfo("Using BaseModelAdapter (default)");
    return new BaseModelAdapter(modelName);
  }
}

/**
 * Helper to detect if user message likely requires tools
 * @param message - The user's message to analyze
 * @returns True if the message likely requires tool usage
 */
export function messageRequiresTools(message: string): boolean {
  const toolIndicators = [
    "find",
    "search",
    "look for",
    "look up",
    "my notes",
    "in my vault",
    "from my vault",
    "check the web",
    "search online",
    "from the internet",
    "current time",
    "what time",
    "timer",
    "youtube",
    "video",
    "transcript",
  ];

  const lowerMessage = message.toLowerCase();
  return toolIndicators.some((indicator) => lowerMessage.includes(indicator));
}
