import { CustomModel } from "@/aiParams";
import { type CopilotSettings } from "@/settings/model";
import { v4 as uuidv4 } from "uuid";
import { ChainType } from "./chainFactory";
import { PromptSortStrategy } from "./types";

export const BREVILABS_API_BASE_URL = "https://api.brevilabs.com/v1";
export const BREVILABS_MODELS_BASE_URL = "https://models.brevilabs.com/v1";
export const CHAT_VIEWTYPE = "copilot-chat-view";
export const USER_SENDER = "user";
export const AI_SENDER = "ai";

// Default folder names
export const COPILOT_FOLDER_ROOT = "copilot";
export const DEFAULT_CHAT_HISTORY_FOLDER = `${COPILOT_FOLDER_ROOT}/copilot-conversations`;
export const DEFAULT_CUSTOM_PROMPTS_FOLDER = `${COPILOT_FOLDER_ROOT}/copilot-custom-prompts`;
export const DEFAULT_MEMORY_FOLDER = `${COPILOT_FOLDER_ROOT}/memory`;
export const DEFAULT_SYSTEM_PROMPTS_FOLDER = `${COPILOT_FOLDER_ROOT}/system-prompts`;
export const DEFAULT_CONVERTED_DOC_OUTPUT_FOLDER = "";
export const DEFAULT_QA_EXCLUSIONS_SETTING = COPILOT_FOLDER_ROOT;
export const DEFAULT_SYSTEM_PROMPT = `你是 Obsidian Copilot，一个帮助用户使用 Obsidian 记笔记的 AI 助手。
  1. 不要说自己无法访问某些内容，始终以用户提供的上下文为准。
  2. 始终尽你所知回答。如果不确定，就说明不确定，并请用户补充上下文。
  3. 用户提到“笔记”时，通常是指库中的 Obsidian 笔记，而不是泛指一张便条。
  4. 用户提到“@vault”时，表示希望你在 Obsidian 库中查找与问题相关的信息。搜索结果会和用户问题一起放在上下文中，请仔细阅读并据此回答。如果库中没有相关信息，就直接说明。
  5. 用户用 @ 提到其他工具时，请查看上下文中的工具结果。如果没有结果，就忽略查询中的 @ 符号。
  6. LaTeX 公式始终使用 $，不要使用 \\[ 等形式。
  7. 显示笔记标题时使用 [[标题]] 格式，不要用 \` \` 包裹。
  8. 显示 Obsidian 内部图片链接时使用 ![[链接]] 格式，不要用 \` \` 包裹。
  9. 显示网页图片链接时使用 ![说明](网址) 格式，不要用 \` \` 包裹。
 10. 生成表格时使用 GitHub Markdown 表格。表格标题行之后，立刻补上一行以“ |”开头的分隔行。
  11. 始终使用用户提问所用的语言回答。
  12. 如果 getCurrentTime、getTimeRangeMs 等附加上下文与用户消息无关，不要提及它们。
  13. 用户提到“标签”时，通常是指 Obsidian 笔记属性中的标签。
  14. YouTube 链接：如果用户消息中包含 YouTube 链接，字幕会自动获取并提供给你。你不需要做额外处理，直接使用已提供的字幕内容。
  15. Markdown 列表的项目符号始终使用“- ”（连字符后正好一个空格），连字符前不要有空格。不要使用“*”作为项目符号。`;

export const COMPOSER_OUTPUT_INSTRUCTIONS = `在 <writeFile> 标签中返回新的笔记内容或画布 JSON。

  # 查找目标笔记的步骤
  1. 从用户消息中提取目标笔记信息，并在下方上下文中找出笔记路径。
  2. 如果没有指定目标笔记，就使用 <active_note>。
  3. 如果仍然找不到目标笔记或笔记路径，请用户明确指定目标笔记。

  # 示例

  输入：向笔记 A 添加一个新章节
  输出：
  <writeFile>
  <path>path/to/file.md</path>
  <content>这里放笔记 A 添加新章节后的完整内容</content>
  </writeFile>

  输入：创建一个包含“Hello, world!”的新画布
  输出：
  <writeFile>
  <path>path/to/file.canvas</path>
  <content>
  {
    "nodes": [
      {
        "id": "1",
        "type": "text",
        "text": "Hello, world!",
        "x": 0,
        "y": 0,
        "width": 200,
        "height": 50
      }
    ],
    "edges": []
  }
  </content>
  </writeFile>

  输入：创建一个包含文件节点和分组的画布
  输出：
  <writeFile>
  <path>path/to/file.canvas</path>
  <content>
  {
    "nodes": [
      {"id": "1", "type": "file", "file": "note.md", "subpath": "#heading", "x": 100, "y": 100, "width": 300, "height": 200, "color": "2"},
      {"id": "2", "type": "group", "label": "My Group", "x": 50, "y": 50, "width": 400, "height": 300, "color": "1"},
      {"id": "3", "type": "link", "url": "https://example.com", "x": 500, "y": 100, "width": 200, "height": 100, "color": "#FF5733"}
    ],
    "edges": [
      {"id": "e1-2", "fromNode": "1", "toNode": "3", "fromSide": "right", "toSide": "left", "fromEnd": "arrow", "toEnd": "none", "color": "3", "label": "references"}
    ]
  }
  </content>
  </writeFile>

  # 画布 JSON 格式（JSON Canvas 规范 1.0）
  节点必填字段：id、type、x、y、width、height
  节点类型："text"（需要 text）、"file"（需要 file）、"link"（需要 url）、"group"（label 可选）
  节点可选字段：color（十六进制颜色如 #FF0000，或预设值 "1" 到 "6"）、subpath（仅文件节点，以 # 开头）
  连线必填字段：id、fromNode、toNode
  连线可选字段：fromSide/toSide（"top"、"right"、"bottom"、"left"）、fromEnd/toEnd（"none"、"arrow"）、color、label
  所有 ID 必须唯一。连线必须引用已经存在的节点 ID。
  节点之间应留出合理间距，并形成符合逻辑的视觉流向。
  `;

export const NOTE_CONTEXT_PROMPT_TAG = "note_context";
export const SELECTED_TEXT_TAG = "selected_text";
export const WEB_SELECTED_TEXT_TAG = "web_selected_text";
export const VARIABLE_TAG = "variable";
export const VARIABLE_NOTE_TAG = "variable_note";
export const EMBEDDED_PDF_TAG = "embedded_pdf";
export const EMBEDDED_NOTE_TAG = "embedded_note";
export const DATAVIEW_BLOCK_TAG = "dataview_block";
export const VAULT_NOTE_TAG = "vault_note";
export const RETRIEVED_DOCUMENT_TAG = "retrieved_document";
export const WEB_TAB_CONTEXT_TAG = "web_tab_context";
export const ACTIVE_WEB_TAB_CONTEXT_TAG = "active_web_tab";
export const YOUTUBE_VIDEO_CONTEXT_TAG = "youtube_video_context";
/** Marker text used as placeholder for active web tab in serialized content */
export const ACTIVE_WEB_TAB_MARKER = "{activeWebTab}";
export const EMPTY_INDEX_ERROR_MESSAGE =
  "Copilot 索引不存在。请先为库建立索引！\n\n1. 在问答设置中选择一个可用的嵌入模型。如果不是本地模型，别忘了设置 API 密钥。\n\n2. 点击“刷新库索引”，并等待索引完成。如果遇到速率限制错误，请在问答设置中降低每秒请求数。";
export const CHUNK_SIZE = 6000;
export const TEXT_WEIGHT = 0.4;
export const MAX_CHARS_FOR_LOCAL_SEARCH_CONTEXT = 448000;
export const LLM_TIMEOUT_MS = 30000; // 30 seconds timeout for LLM operations
export const DEFAULT_MAX_SOURCE_CHUNKS = 30; // Default max chunks for search results (with diverse top-K)
export const AGENT_LOOP_TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes timeout for agent loop
export const AGENT_MAX_ITERATIONS_LIMIT = 16; // Maximum allowed value for agent iterations setting
export const LOADING_MESSAGES = {
  DEFAULT: "",
  READING_FILES: "正在读取文件",
  SEARCHING_WEB: "正在搜索网页",
  READING_FILE_TREE: "正在读取文件树",
  COMPACTING: "正在压缩上下文",
};
export const PLUS_UTM_MEDIUMS = {
  SETTINGS: "settings",
  EXPIRED_MODAL: "expired_modal",
  CHAT_MODE_SELECT: "chat_mode_select",
  MODE_SELECT_TOOLTIP: "mode_select_tooltip",
};
export type PlusUtmMedium = (typeof PLUS_UTM_MEDIUMS)[keyof typeof PLUS_UTM_MEDIUMS];

/**
 * Reasoning effort levels for OpenAI reasoning models
 */
export enum ReasoningEffort {
  MINIMAL = "minimal",
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  XHIGH = "xhigh",
}

/**
 * Output verbosity levels for GPT-5 models
 */
export enum Verbosity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
}

export const DEFAULT_MODEL_SETTING = {
  MAX_TOKENS: 6000,
  TEMPERATURE: 0.1,
  REASONING_EFFORT: ReasoningEffort.LOW,
  VERBOSITY: Verbosity.MEDIUM,
} as const;

// Reason: Ollama defaults to a small context window (2048). We override to 131072
// for backward compatibility (PR #2147), configurable via UI (#2275).
export const DEFAULT_OLLAMA_NUM_CTX = 131072;

export enum ChatModels {
  COPILOT_PLUS_FLASH = "copilot-plus-flash",
  GPT_5_4 = "gpt-5.4",
  GPT_5_mini = "gpt-5-mini",
  GPT_5_nano = "gpt-5-nano",
  GPT_41 = "gpt-4.1",
  GPT_41_mini = "gpt-4.1-mini",
  GPT_41_nano = "gpt-4.1-nano",
  O4_mini = "o4-mini",
  GEMINI_3_PRO_PREVIEW = "gemini-3.1-pro-preview",
  GEMINI_3_FLASH_PREVIEW = "gemini-3-flash-preview",
  GEMINI_3_FLASH_LITE_PREVIEW = "gemini-3.1-flash-lite-preview",
  GEMINI_PRO = "gemini-2.5-pro",
  GEMINI_FLASH = "gemini-2.5-flash",
  CLAUDE_OPUS_4_6 = "claude-opus-4-6",
  CLAUDE_SONNET_4_6 = "claude-sonnet-4-6",
  GROK_4_1_FAST = "grok-4-1-fast",
  GROQ_LLAMA_8b = "llama3-8b-8192",
  COMMAND_R = "command-r",
  MISTRAL_TINY = "mistral-tiny-latest",
  DEEPSEEK_REASONER = "deepseek-reasoner",
  DEEPSEEK_CHAT = "deepseek-chat",
  OPENROUTER_GEMINI_3_FLASH_PREVIEW = "google/gemini-3-flash-preview",
  OPENROUTER_GEMINI_3_PRO_PREVIEW = "google/gemini-3.1-pro-preview",
  OPENROUTER_GEMINI_2_5_FLASH = "google/gemini-2.5-flash",
  OPENROUTER_GEMINI_2_5_PRO = "google/gemini-2.5-pro",
  OPENROUTER_GPT_5_4 = "openai/gpt-5.4",
  OPENROUTER_GPT_5_MINI = "openai/gpt-5-mini",
  OPENROUTER_GROK_4_1_FAST = "x-ai/grok-4.1-fast",
  SILICONFLOW_DEEPSEEK_V3 = "deepseek-ai/DeepSeek-V3",
  SILICONFLOW_DEEPSEEK_R1 = "deepseek-ai/DeepSeek-R1",
}

// Model Providers
export enum ChatModelProviders {
  OPENROUTERAI = "openrouterai",
  OPENAI = "openai",
  OPENAI_FORMAT = "3rd party (openai-format)",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  XAI = "xai",
  AMAZON_BEDROCK = "amazon-bedrock",
  AZURE_OPENAI = "azure openai",
  GROQ = "groq",
  OLLAMA = "ollama",
  LM_STUDIO = "lm-studio",
  COPILOT_PLUS = "copilot-plus",
  MISTRAL = "mistralai",
  DEEPSEEK = "deepseek",
  COHEREAI = "cohereai",
  SILICONFLOW = "siliconflow",
  GITHUB_COPILOT = "github-copilot",
}

export enum ModelCapability {
  REASONING = "reasoning",
  VISION = "vision",
  WEB_SEARCH = "websearch",
}

export const MODEL_CAPABILITIES: Record<ModelCapability, string> = {
  reasoning: "这个模型支持常规推理。",
  vision: "这个模型支持图片输入。",
  websearch: "这个模型可以访问互联网。",
};

export const BUILTIN_CHAT_MODELS: CustomModel[] = [
  // Enabled models first
  {
    name: ChatModels.COPILOT_PLUS_FLASH,
    provider: ChatModelProviders.COPILOT_PLUS,
    enabled: true,
    isBuiltIn: true,
    core: true,
    plusExclusive: true,
    projectEnabled: false,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.OPENROUTER_GEMINI_2_5_FLASH,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: true,
    isBuiltIn: true,
    core: true,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.GPT_5_4,
    provider: ChatModelProviders.OPENAI,
    enabled: true,
    isBuiltIn: true,
    core: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.GPT_5_mini,
    provider: ChatModelProviders.OPENAI,
    enabled: true,
    isBuiltIn: true,
    core: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.CLAUDE_SONNET_4_6,
    provider: ChatModelProviders.ANTHROPIC,
    enabled: true,
    isBuiltIn: true,
    capabilities: [ModelCapability.VISION, ModelCapability.REASONING],
  },
  {
    name: ChatModels.GEMINI_3_FLASH_LITE_PREVIEW,
    provider: ChatModelProviders.GOOGLE,
    enabled: true,
    isBuiltIn: true,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.GEMINI_FLASH,
    provider: ChatModelProviders.GOOGLE,
    enabled: true,
    isBuiltIn: true,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  // Disabled models
  {
    name: ChatModels.OPENROUTER_GEMINI_3_FLASH_PREVIEW,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: false,
    isBuiltIn: true,
    capabilities: [ModelCapability.VISION, ModelCapability.REASONING],
  },
  {
    name: ChatModels.OPENROUTER_GEMINI_3_PRO_PREVIEW,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: false,
    isBuiltIn: true,
    capabilities: [ModelCapability.VISION, ModelCapability.REASONING],
  },
  {
    name: ChatModels.OPENROUTER_GEMINI_2_5_PRO,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.OPENROUTER_GPT_5_4,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.OPENROUTER_GPT_5_MINI,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.GROK_4_1_FAST,
    provider: ChatModelProviders.XAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.OPENROUTER_GROK_4_1_FAST,
    provider: ChatModelProviders.OPENROUTERAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.GPT_41,
    provider: ChatModelProviders.OPENAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.GPT_41_mini,
    provider: ChatModelProviders.OPENAI,
    enabled: false,
    isBuiltIn: true,
    core: false,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.CLAUDE_OPUS_4_6,
    provider: ChatModelProviders.ANTHROPIC,
    enabled: false,
    isBuiltIn: true,
    capabilities: [ModelCapability.VISION, ModelCapability.REASONING],
  },
  {
    name: ChatModels.GEMINI_3_FLASH_PREVIEW,
    provider: ChatModelProviders.GOOGLE,
    enabled: false,
    isBuiltIn: true,
    capabilities: [ModelCapability.VISION, ModelCapability.REASONING],
  },
  {
    name: ChatModels.GEMINI_3_PRO_PREVIEW,
    provider: ChatModelProviders.GOOGLE,
    enabled: false,
    isBuiltIn: true,
    capabilities: [ModelCapability.VISION, ModelCapability.REASONING],
  },
  {
    name: ChatModels.GEMINI_PRO,
    provider: ChatModelProviders.GOOGLE,
    enabled: false,
    isBuiltIn: true,
    projectEnabled: true,
    capabilities: [ModelCapability.VISION],
  },
  {
    name: ChatModels.DEEPSEEK_CHAT,
    provider: ChatModelProviders.DEEPSEEK,
    enabled: false,
    isBuiltIn: true,
  },
  {
    name: ChatModels.DEEPSEEK_REASONER,
    provider: ChatModelProviders.DEEPSEEK,
    enabled: false,
    isBuiltIn: true,
    capabilities: [ModelCapability.REASONING],
  },
  {
    name: ChatModels.SILICONFLOW_DEEPSEEK_V3,
    provider: ChatModelProviders.SILICONFLOW,
    enabled: false,
    isBuiltIn: false,
    baseUrl: "https://api.siliconflow.com/v1",
  },
  {
    name: ChatModels.SILICONFLOW_DEEPSEEK_R1,
    provider: ChatModelProviders.SILICONFLOW,
    enabled: false,
    isBuiltIn: false,
    baseUrl: "https://api.siliconflow.com/v1",
    capabilities: [ModelCapability.REASONING],
  },
];

export enum EmbeddingModelProviders {
  OPENAI = "openai",
  OPENROUTERAI = "openrouterai",
  COHEREAI = "cohereai",
  GOOGLE = "google",
  AZURE_OPENAI = "azure openai",
  OLLAMA = "ollama",
  LM_STUDIO = "lm-studio",
  OPENAI_FORMAT = "3rd party (openai-format)",
  COPILOT_PLUS = "copilot-plus",
  COPILOT_PLUS_JINA = "copilot-plus-jina",
  SILICONFLOW = "siliconflow",
}

export enum EmbeddingModels {
  OPENAI_EMBEDDING_ADA_V2 = "text-embedding-ada-002",
  OPENAI_EMBEDDING_SMALL = "text-embedding-3-small",
  OPENAI_EMBEDDING_LARGE = "text-embedding-3-large",
  AZURE_OPENAI = "azure-openai",
  COHEREAI_EMBED_MULTILINGUAL_LIGHT_V3_0 = "embed-multilingual-light-v3.0",
  GOOGLE_ENG = "text-embedding-004",
  GOOGLE_GEMINI_EMBEDDING = "gemini-embedding-001",
  GOOGLE_GEMINI_EMBEDDING_2_PREVIEW = "gemini-embedding-2-preview",
  COPILOT_PLUS_SMALL = "copilot-plus-small",
  COPILOT_PLUS_LARGE = "copilot-plus-large",
  COPILOT_PLUS_MULTILINGUAL = "copilot-plus-multilingual",
  SILICONFLOW_QWEN3_EMBEDDING_0_6B = "Qwen/Qwen3-Embedding-0.6B",
  OPENROUTER_OPENAI_EMBEDDING_SMALL = "openai/text-embedding-3-small",
}

export const BUILTIN_EMBEDDING_MODELS: CustomModel[] = [
  {
    name: EmbeddingModels.COPILOT_PLUS_SMALL,
    provider: EmbeddingModelProviders.COPILOT_PLUS,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
    plusExclusive: true,
  },
  {
    name: EmbeddingModels.COPILOT_PLUS_LARGE,
    provider: EmbeddingModelProviders.COPILOT_PLUS_JINA,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
    plusExclusive: true,
    believerExclusive: true,
    dimensions: 1024,
  },
  {
    name: EmbeddingModels.COPILOT_PLUS_MULTILINGUAL,
    provider: EmbeddingModelProviders.COPILOT_PLUS_JINA,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
    plusExclusive: true,
    dimensions: 512,
  },
  {
    name: EmbeddingModels.OPENROUTER_OPENAI_EMBEDDING_SMALL,
    provider: EmbeddingModelProviders.OPENROUTERAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
  },
  {
    name: EmbeddingModels.OPENAI_EMBEDDING_SMALL,
    provider: EmbeddingModelProviders.OPENAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
  },
  {
    name: EmbeddingModels.OPENAI_EMBEDDING_LARGE,
    provider: EmbeddingModelProviders.OPENAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.COHEREAI_EMBED_MULTILINGUAL_LIGHT_V3_0,
    provider: EmbeddingModelProviders.COHEREAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.GOOGLE_ENG,
    provider: EmbeddingModelProviders.GOOGLE,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.GOOGLE_GEMINI_EMBEDDING,
    provider: EmbeddingModelProviders.GOOGLE,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
  },
  {
    name: EmbeddingModels.GOOGLE_GEMINI_EMBEDDING_2_PREVIEW,
    provider: EmbeddingModelProviders.GOOGLE,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
  },
  {
    name: EmbeddingModels.AZURE_OPENAI,
    provider: EmbeddingModelProviders.AZURE_OPENAI,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
  },
  {
    name: EmbeddingModels.SILICONFLOW_QWEN3_EMBEDDING_0_6B,
    provider: EmbeddingModelProviders.SILICONFLOW,
    enabled: true,
    isBuiltIn: true,
    isEmbeddingModel: true,
    core: true,
    baseUrl: "https://api.siliconflow.com/v1",
  },
];

// Embedding Models
export const NOMIC_EMBED_TEXT = "nomic-embed-text";
// export const DISTILBERT_NLI = 'sentence-transformers/distilbert-base-nli-mean-tokens';
// export const INSTRUCTOR_XL = 'hkunlp/instructor-xl'; // Inference API is off for this
// export const MPNET_V2 = 'sentence-transformers/all-mpnet-base-v2'; // Inference API returns 400

export type Provider = ChatModelProviders | EmbeddingModelProviders;

export type SettingKeyProviders = Exclude<
  ChatModelProviders,
  ChatModelProviders.OPENAI_FORMAT | ChatModelProviders.LM_STUDIO | ChatModelProviders.OLLAMA
>;

// Provider metadata interface
export interface ProviderMetadata {
  label: string;
  host: string;
  /**
   * Base URL used when generating example curl commands (and UI placeholders).
   * This must be deterministic and must NOT include endpoint suffixes like `/chat/completions`.
   * It intentionally does not affect runtime SDK configuration.
   */
  curlBaseURL: string;
  keyManagementURL: string;
  listModelURL: string;
  testModel?: ChatModels;
}

// Unified provider information
export const ProviderInfo: Record<Provider, ProviderMetadata> = {
  [ChatModelProviders.OPENROUTERAI]: {
    label: "OpenRouter",
    host: "https://openrouter.ai/api/v1/",
    curlBaseURL: "https://openrouter.ai/api/v1",
    keyManagementURL: "https://openrouter.ai/keys",
    listModelURL: "https://openrouter.ai/api/v1/models",
    testModel: ChatModels.OPENROUTER_GPT_5_MINI,
  },
  [ChatModelProviders.GOOGLE]: {
    label: "Gemini",
    host: "https://generativelanguage.googleapis.com",
    curlBaseURL: "https://generativelanguage.googleapis.com/v1beta",
    keyManagementURL: "https://makersuite.google.com/app/apikey",
    listModelURL: "https://generativelanguage.googleapis.com/v1beta/models",
    testModel: ChatModels.GEMINI_FLASH,
  },
  [ChatModelProviders.ANTHROPIC]: {
    label: "Anthropic",
    host: "https://api.anthropic.com/",
    curlBaseURL: "https://api.anthropic.com",
    keyManagementURL: "https://console.anthropic.com/settings/keys",
    listModelURL: "https://api.anthropic.com/v1/models",
    testModel: ChatModels.CLAUDE_SONNET_4_6,
  },
  [ChatModelProviders.OPENAI]: {
    label: "OpenAI",
    host: "https://api.openai.com",
    curlBaseURL: "https://api.openai.com/v1",
    keyManagementURL: "https://platform.openai.com/api-keys",
    listModelURL: "https://api.openai.com/v1/models",
    testModel: ChatModels.GPT_5_4,
  },
  [ChatModelProviders.XAI]: {
    label: "XAI",
    host: "https://api.x.ai/v1",
    curlBaseURL: "https://api.x.ai/v1",
    keyManagementURL: "https://console.x.ai",
    listModelURL: "https://api.x.ai/v1/models",
    testModel: ChatModels.GROK_4_1_FAST,
  },
  [ChatModelProviders.AZURE_OPENAI]: {
    label: "Azure",
    host: "https://<resource>.services.ai.azure.com/models",
    curlBaseURL: "https://<resource>.services.ai.azure.com/models",
    keyManagementURL: "https://ai.azure.com",
    listModelURL: "",
  },
  [ChatModelProviders.GROQ]: {
    label: "Groq",
    host: "https://api.groq.com/openai",
    curlBaseURL: "https://api.groq.com/openai/v1",
    keyManagementURL: "https://console.groq.com/keys",
    listModelURL: "https://api.groq.com/openai/v1/models",
    testModel: ChatModels.GROQ_LLAMA_8b,
  },
  [ChatModelProviders.COHEREAI]: {
    label: "Cohere",
    host: "https://api.cohere.com",
    curlBaseURL: "https://api.cohere.com/v1",
    keyManagementURL: "https://dashboard.cohere.ai/api-keys",
    listModelURL: "https://api.cohere.com/v1/models",
    testModel: ChatModels.COMMAND_R,
  },
  [ChatModelProviders.SILICONFLOW]: {
    label: "SiliconFlow",
    host: "https://api.siliconflow.com/v1",
    curlBaseURL: "https://api.siliconflow.com/v1",
    keyManagementURL: "https://cloud.siliconflow.com/me/account/ak",
    listModelURL: "https://api.siliconflow.com/v1/models",
    testModel: ChatModels.SILICONFLOW_DEEPSEEK_V3,
  },
  [ChatModelProviders.OLLAMA]: {
    label: "Ollama",
    host: "http://localhost:11434/v1/",
    curlBaseURL: "http://localhost:11434",
    keyManagementURL: "",
    listModelURL: "",
  },
  [ChatModelProviders.LM_STUDIO]: {
    label: "LM Studio",
    host: "http://localhost:1234/v1",
    curlBaseURL: "http://localhost:1234/v1",
    keyManagementURL: "",
    listModelURL: "",
  },
  [ChatModelProviders.OPENAI_FORMAT]: {
    label: "OpenAI Format",
    host: "https://api.example.com/v1",
    curlBaseURL: "https://api.example.com/v1",
    keyManagementURL: "",
    listModelURL: "",
  },
  [ChatModelProviders.MISTRAL]: {
    label: "Mistral",
    host: "https://api.mistral.ai/v1",
    curlBaseURL: "https://api.mistral.ai/v1",
    keyManagementURL: "https://console.mistral.ai/api-keys",
    listModelURL: "https://api.mistral.ai/v1/models",
    testModel: ChatModels.MISTRAL_TINY,
  },
  [ChatModelProviders.DEEPSEEK]: {
    label: "DeepSeek",
    host: "https://api.deepseek.com/",
    curlBaseURL: "https://api.deepseek.com",
    keyManagementURL: "https://platform.deepseek.com/api-keys",
    listModelURL: "https://api.deepseek.com/models",
    testModel: ChatModels.DEEPSEEK_CHAT,
  },
  [ChatModelProviders.AMAZON_BEDROCK]: {
    label: "Amazon Bedrock",
    host: "https://bedrock-runtime.{region}.amazonaws.com",
    curlBaseURL: "https://bedrock-runtime.{region}.amazonaws.com",
    keyManagementURL: "https://console.aws.amazon.com/iam/home#/security_credentials",
    listModelURL: "",
  },
  [EmbeddingModelProviders.COPILOT_PLUS]: {
    label: "Copilot Plus",
    host: BREVILABS_MODELS_BASE_URL,
    curlBaseURL: BREVILABS_MODELS_BASE_URL,
    keyManagementURL: "",
    listModelURL: "",
  },
  [EmbeddingModelProviders.COPILOT_PLUS_JINA]: {
    label: "Copilot Plus",
    host: BREVILABS_MODELS_BASE_URL,
    curlBaseURL: BREVILABS_MODELS_BASE_URL,
    keyManagementURL: "",
    listModelURL: "",
  },
  [ChatModelProviders.GITHUB_COPILOT]: {
    label: "GitHub Copilot",
    host: "https://api.githubcopilot.com",
    curlBaseURL: "https://api.githubcopilot.com",
    keyManagementURL: "https://github.com/settings/apps/authorizations",
    listModelURL: "",
  },
};

// Map provider to its settings key for API key
export const ProviderSettingsKeyMap: Record<SettingKeyProviders, keyof CopilotSettings> = {
  anthropic: "anthropicApiKey",
  openai: "openAIApiKey",
  "azure openai": "azureOpenAIApiKey",
  google: "googleApiKey",
  groq: "groqApiKey",
  openrouterai: "openRouterAiApiKey",
  cohereai: "cohereApiKey",
  xai: "xaiApiKey",
  "copilot-plus": "plusLicenseKey",
  mistralai: "mistralApiKey",
  deepseek: "deepseekApiKey",
  "amazon-bedrock": "amazonBedrockApiKey",
  siliconflow: "siliconflowApiKey",
  "github-copilot": "githubCopilotToken",
};

export enum VAULT_VECTOR_STORE_STRATEGY {
  NEVER = "NEVER",
  ON_STARTUP = "ON STARTUP",
  ON_MODE_SWITCH = "ON MODE SWITCH",
}

export const VAULT_VECTOR_STORE_STRATEGIES = [
  VAULT_VECTOR_STORE_STRATEGY.NEVER,
  VAULT_VECTOR_STORE_STRATEGY.ON_STARTUP,
  VAULT_VECTOR_STORE_STRATEGY.ON_MODE_SWITCH,
];

export enum DEFAULT_OPEN_AREA {
  EDITOR = "editor",
  VIEW = "view",
}

export enum SEND_SHORTCUT {
  ENTER = "enter",
  SHIFT_ENTER = "shift+enter",
}

export const COMMAND_IDS = {
  TRIGGER_QUICK_COMMAND: "trigger-quick-command",
  CLEAR_LOCAL_COPILOT_INDEX: "clear-local-copilot-index",
  CLEAR_COPILOT_CACHE: "clear-copilot-cache",
  COUNT_WORD_AND_TOKENS_SELECTION: "count-word-and-tokens-selection",
  COUNT_TOTAL_VAULT_TOKENS: "count-total-vault-tokens",
  DEBUG_WORD_COMPLETION: "debug-word-completion",
  FORCE_REINDEX_VAULT_TO_COPILOT_INDEX: "force-reindex-vault-to-copilot-index",
  GARBAGE_COLLECT_COPILOT_INDEX: "garbage-collect-copilot-index",
  INDEX_VAULT_TO_COPILOT_INDEX: "index-vault-to-copilot-index",
  INSPECT_COPILOT_INDEX_BY_NOTE_PATHS: "copilot-inspect-index-by-note-paths",
  LIST_INDEXED_FILES: "copilot-list-indexed-files",
  LOAD_COPILOT_CHAT_CONVERSATION: "load-copilot-chat-conversation",
  NEW_CHAT: "new-chat",
  OPEN_COPILOT_CHAT_WINDOW: "chat-open-window",
  REMOVE_FILES_FROM_COPILOT_INDEX: "remove-files-from-copilot-index",
  SEARCH_ORAMA_DB: "copilot-search-orama-db",
  TOGGLE_COPILOT_CHAT_WINDOW: "chat-toggle-window",
  ADD_SELECTION_TO_CHAT_CONTEXT: "add-selection-to-chat-context",
  ADD_WEB_SELECTION_TO_CHAT_CONTEXT: "add-web-selection-to-chat-context",
  ADD_CUSTOM_COMMAND: "add-custom-command",
  APPLY_CUSTOM_COMMAND: "apply-custom-command",
  OPEN_LOG_FILE: "open-log-file",
  CLEAR_LOG_FILE: "clear-log-file",
  DOWNLOAD_YOUTUBE_SCRIPT: "download-youtube-script",
  TRIGGER_QUICK_ASK: "trigger-quick-ask",
} as const;

export const COMMAND_NAMES: Record<CommandId, string> = {
  [COMMAND_IDS.TRIGGER_QUICK_COMMAND]: "触发快捷命令",
  [COMMAND_IDS.CLEAR_LOCAL_COPILOT_INDEX]: "清除本地 Copilot 索引",
  [COMMAND_IDS.CLEAR_COPILOT_CACHE]: "清除 Copilot 缓存",
  [COMMAND_IDS.COUNT_TOTAL_VAULT_TOKENS]: "统计整个库的 token 数",
  [COMMAND_IDS.COUNT_WORD_AND_TOKENS_SELECTION]: "统计选中内容的字数和 token 数",
  [COMMAND_IDS.DEBUG_WORD_COMPLETION]: "词语补全：调试",
  [COMMAND_IDS.FORCE_REINDEX_VAULT_TO_COPILOT_INDEX]: "强制重建库索引",
  [COMMAND_IDS.GARBAGE_COLLECT_COPILOT_INDEX]:
    "清理 Copilot 索引（移除库中已不存在的文件）",
  [COMMAND_IDS.INDEX_VAULT_TO_COPILOT_INDEX]: "索引（刷新）整个库",
  [COMMAND_IDS.INSPECT_COPILOT_INDEX_BY_NOTE_PATHS]: "按笔记路径检查 Copilot 索引（调试）",
  [COMMAND_IDS.LIST_INDEXED_FILES]: "列出全部已索引文件（调试）",
  [COMMAND_IDS.LOAD_COPILOT_CHAT_CONVERSATION]: "加载 Copilot 聊天记录",
  [COMMAND_IDS.NEW_CHAT]: "新建 Copilot 对话",
  [COMMAND_IDS.OPEN_COPILOT_CHAT_WINDOW]: "打开 Copilot 对话窗口",
  [COMMAND_IDS.REMOVE_FILES_FROM_COPILOT_INDEX]: "从 Copilot 索引中移除文件（调试）",
  [COMMAND_IDS.SEARCH_ORAMA_DB]: "搜索语义索引（调试）",
  [COMMAND_IDS.TOGGLE_COPILOT_CHAT_WINDOW]: "开关 Copilot 对话窗口",
  [COMMAND_IDS.ADD_SELECTION_TO_CHAT_CONTEXT]: "将选中内容加入对话上下文",
  [COMMAND_IDS.ADD_WEB_SELECTION_TO_CHAT_CONTEXT]: "将网页选中内容加入对话上下文",
  [COMMAND_IDS.ADD_CUSTOM_COMMAND]: "添加自定义命令",
  [COMMAND_IDS.APPLY_CUSTOM_COMMAND]: "应用自定义命令",
  [COMMAND_IDS.OPEN_LOG_FILE]: "创建日志文件",
  [COMMAND_IDS.CLEAR_LOG_FILE]: "清空日志文件",
  [COMMAND_IDS.DOWNLOAD_YOUTUBE_SCRIPT]: "下载 YouTube 字幕（Plus）",
  [COMMAND_IDS.TRIGGER_QUICK_ASK]: "快速提问",
};

export type CommandId = (typeof COMMAND_IDS)[keyof typeof COMMAND_IDS];

/**
 * Icons for commands displayed in the mobile toolbar.
 * Uses Lucide icon names supported by Obsidian.
 */
export const COMMAND_ICONS: Partial<Record<CommandId, string>> = {
  [COMMAND_IDS.NEW_CHAT]: "message-square-plus",
  [COMMAND_IDS.OPEN_COPILOT_CHAT_WINDOW]: "message-square",
  [COMMAND_IDS.TOGGLE_COPILOT_CHAT_WINDOW]: "message-square",
  [COMMAND_IDS.LOAD_COPILOT_CHAT_CONVERSATION]: "history",
  [COMMAND_IDS.TRIGGER_QUICK_COMMAND]: "terminal-square",
  [COMMAND_IDS.TRIGGER_QUICK_ASK]: "sparkles",
  [COMMAND_IDS.ADD_SELECTION_TO_CHAT_CONTEXT]: "text-cursor-input",
  [COMMAND_IDS.ADD_WEB_SELECTION_TO_CHAT_CONTEXT]: "globe",
  [COMMAND_IDS.ADD_CUSTOM_COMMAND]: "plus-circle",
  [COMMAND_IDS.APPLY_CUSTOM_COMMAND]: "play-circle",
  [COMMAND_IDS.INDEX_VAULT_TO_COPILOT_INDEX]: "refresh-cw",
  [COMMAND_IDS.FORCE_REINDEX_VAULT_TO_COPILOT_INDEX]: "rotate-cw",
  [COMMAND_IDS.CLEAR_LOCAL_COPILOT_INDEX]: "trash-2",
  [COMMAND_IDS.CLEAR_COPILOT_CACHE]: "eraser",
  [COMMAND_IDS.GARBAGE_COLLECT_COPILOT_INDEX]: "filter-x",
  [COMMAND_IDS.COUNT_TOTAL_VAULT_TOKENS]: "calculator",
  [COMMAND_IDS.COUNT_WORD_AND_TOKENS_SELECTION]: "hash",
  [COMMAND_IDS.OPEN_LOG_FILE]: "file-text",
  [COMMAND_IDS.CLEAR_LOG_FILE]: "file-x",
  [COMMAND_IDS.DOWNLOAD_YOUTUBE_SCRIPT]: "youtube",
};

/**
 * Text-readable file extensions that all chains can process without Plus mode.
 * These files can be read directly via `vault.read()` and don't require special parsers.
 * Add new text-based extensions here to enable them everywhere (active note, context, chain).
 */
export const TEXT_READABLE_EXTENSIONS = ["md", "canvas", "base"];

/**
 * Valid file extensions for note context.
 * Includes text-readable files plus Plus-only formats like PDF.
 * This does NOT include images - images are handled separately in the UI.
 */
export const ALLOWED_NOTE_CONTEXT_EXTENSIONS = [...TEXT_READABLE_EXTENSIONS, "pdf"];

export const RESTRICTION_MESSAGES = {
  NON_MARKDOWN_FILES_RESTRICTED:
    "Non-markdown files are only available in Copilot Plus mode. Please upgrade to access this file type.",
  URL_PROCESSING_RESTRICTED:
    "URL processing is only available in Copilot Plus mode. URLs will not be processed for context.",
  UNSUPPORTED_FILE_TYPE: (extension: string) =>
    `${extension.toUpperCase()} files are not supported in the current mode.`,
} as const;

export const DEFAULT_SETTINGS: CopilotSettings = {
  userId: uuidv4(),
  isPlusUser: false,
  plusLicenseKey: "",
  openAIApiKey: "",
  openAIOrgId: "",
  huggingfaceApiKey: "",
  cohereApiKey: "",
  anthropicApiKey: "",
  azureOpenAIApiKey: "",
  azureOpenAIApiInstanceName: "",
  azureOpenAIApiDeploymentName: "",
  azureOpenAIApiVersion: "",
  azureOpenAIApiEmbeddingDeploymentName: "",
  googleApiKey: "",
  openRouterAiApiKey: "",
  xaiApiKey: "",
  mistralApiKey: "",
  deepseekApiKey: "",
  amazonBedrockApiKey: "",
  amazonBedrockRegion: "",
  siliconflowApiKey: "",
  // GitHub Copilot OAuth tokens
  githubCopilotAccessToken: "",
  githubCopilotToken: "",
  githubCopilotTokenExpiresAt: 0,
  defaultChainType: ChainType.LLM_CHAIN,
  defaultModelKey: ChatModels.OPENROUTER_GEMINI_2_5_FLASH + "|" + ChatModelProviders.OPENROUTERAI,
  embeddingModelKey:
    EmbeddingModels.OPENROUTER_OPENAI_EMBEDDING_SMALL + "|" + EmbeddingModelProviders.OPENROUTERAI,
  temperature: DEFAULT_MODEL_SETTING.TEMPERATURE,
  maxTokens: DEFAULT_MODEL_SETTING.MAX_TOKENS,
  contextTurns: 15,
  userSystemPrompt: "",
  openAIProxyBaseUrl: "",
  openAIEmbeddingProxyBaseUrl: "",
  stream: true,
  defaultSaveFolder: DEFAULT_CHAT_HISTORY_FOLDER,
  defaultConversationTag: "copilot-conversation",
  autosaveChat: true,
  generateAIChatTitleOnSave: true,
  autoAddActiveContentToContext: true,
  defaultOpenArea: DEFAULT_OPEN_AREA.VIEW,
  defaultSendShortcut: SEND_SHORTCUT.ENTER,
  customPromptsFolder: DEFAULT_CUSTOM_PROMPTS_FOLDER,
  indexVaultToVectorStore: VAULT_VECTOR_STORE_STRATEGY.ON_MODE_SWITCH,
  qaExclusions: DEFAULT_QA_EXCLUSIONS_SETTING,
  qaInclusions: "",
  chatNoteContextPath: "",
  chatNoteContextTags: [],
  enableIndexSync: true,
  debug: false,
  enableEncryption: false,
  maxSourceChunks: DEFAULT_MAX_SOURCE_CHUNKS,
  enableInlineCitations: true,
  groqApiKey: "",
  activeModels: BUILTIN_CHAT_MODELS,
  activeEmbeddingModels: BUILTIN_EMBEDDING_MODELS,
  embeddingRequestsPerMin: 60,
  embeddingBatchSize: 16,
  disableIndexOnMobile: true,
  showSuggestedPrompts: true,
  showRelevantNotes: true,
  numPartitions: 1,
  lexicalSearchRamLimit: 100, // Default 100 MB
  promptUsageTimestamps: {},
  promptSortStrategy: PromptSortStrategy.TIMESTAMP,
  chatHistorySortStrategy: "recent",
  projectListSortStrategy: "recent",
  defaultConversationNoteName: "{$topic}@{$date}_{$time}",
  /** @deprecated */
  inlineEditCommands: [],
  projectList: [],
  lastDismissedVersion: null,
  passMarkdownImages: true,
  enableAutonomousAgent: true,
  enableCustomPromptTemplating: true,
  enableSemanticSearchV3: false,
  enableSelfHostMode: false,
  enableMiyo: false,
  miyoSearchAll: false,
  selfHostModeValidatedAt: null,
  selfHostValidationCount: 0,
  selfHostUrl: "",
  selfHostApiKey: "",
  miyoServerUrl: "",
  selfHostSearchProvider: "firecrawl",
  firecrawlApiKey: "",
  perplexityApiKey: "",
  supadataApiKey: "",
  enableLexicalBoosts: true,
  suggestedDefaultCommands: false,
  autonomousAgentMaxIterations: 4,
  autonomousAgentEnabledToolIds: [
    "localSearch",
    "readNote",
    "webSearch",
    "pomodoro",
    "youtubeTranscription",
    "writeFile",
    "editFile",
    "updateMemory",
  ],
  reasoningEffort: DEFAULT_MODEL_SETTING.REASONING_EFFORT,
  verbosity: DEFAULT_MODEL_SETTING.VERBOSITY,
  memoryFolderName: DEFAULT_MEMORY_FOLDER,
  enableRecentConversations: true,
  maxRecentConversations: 30,
  enableSavedMemory: true,
  quickCommandModelKey: undefined,
  quickCommandIncludeNoteContext: true,
  autoIncludeTextSelection: false,
  autoAddSelectionToContext: false,
  autoAcceptEdits: false,
  diffViewMode: "split",
  userSystemPromptsFolder: DEFAULT_SYSTEM_PROMPTS_FOLDER,
  defaultSystemPromptTitle: "",
  autoCompactThreshold: 128000,
  convertedDocOutputFolder: DEFAULT_CONVERTED_DOC_OUTPUT_FOLDER,
};

export const EVENT_NAMES = {
  CHAT_IS_VISIBLE: "chat-is-visible",
  ACTIVE_LEAF_CHANGE: "active-leaf-change",
  ABORT_STREAM: "abort-stream",
};

export enum ABORT_REASON {
  USER_STOPPED = "user-stopped",
  NEW_CHAT = "new-chat",
  UNMOUNT = "component-unmount",
}
