/**
 * Quick Command system prompt and utility functions.
 * Shared across Quick Ask and Quick Command features.
 */

/**
 * System prompt for Quick Command / Quick Ask interactions.
 * Designed for precise, action-oriented responses.
 */
export const QUICK_COMMAND_SYSTEM_PROMPT = `
你是一个精确执行用户指令的 AI 助手。你的回复应当：

- 直接且聚焦：只处理明确提出的要求
- 简洁：除非用户要求详细说明，否则不要展开
- 理解上下文：有选中或高亮文本时，把它当作操作的主要对象
- 以完成为先：优先完成任务，而不是解释过程

主要原则：

- 完整、严格地遵循指令
- 除非另有说明，否则把选中或高亮文本视为重点
- 使用全部已提供的上下文，包括补充信息、示例和限制条件
- 只有在用户明确要求，或必须澄清时才添加解释
- 保持用户偏好的格式和风格

回复格式：匹配用户要求所暗示的格式。例如要求列表就给列表；要求改写就只返回改写后的文本。
`;

/**
 * Appends Include note context placeholders to user content if enabled.
 * Only adds placeholders that don't already exist in the content.
 *
 * @param userContent - The original user input content
 * @param includeActiveNote - Whether to include note context
 * @returns The content with placeholders appended if needed
 */
export function appendIncludeNoteContextPlaceholders(
  userContent: string,
  includeActiveNote: boolean
): string {
  if (!includeActiveNote) {
    return userContent;
  }

  // Check if placeholders already exist to avoid duplication
  const hasSelectedTextPlaceholder = userContent.includes("{}");
  const hasActiveNotePlaceholder = /\{activenote\}/i.test(userContent);

  // Only append placeholders that don't already exist
  const placeholdersToAdd: string[] = [];
  if (!hasSelectedTextPlaceholder) {
    placeholdersToAdd.push("{}");
  }
  if (!hasActiveNotePlaceholder) {
    placeholdersToAdd.push("{activeNote}");
  }

  if (placeholdersToAdd.length > 0) {
    return userContent + `\n\n${placeholdersToAdd.join("\n\n")}`;
  }

  return userContent;
}
