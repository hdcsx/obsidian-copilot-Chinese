import { getCurrentProject, setCurrentProject, setProjectLoading, useChainType } from "@/aiParams";
import { ProjectContextCache } from "@/cache/projectContextCache";
import { ChainType } from "@/chainFactory";
import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Button } from "@/components/ui/button";
import { DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { SettingSwitch } from "@/components/ui/setting-switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { PLUS_UTM_MEDIUMS } from "@/constants";
import { logError } from "@/logger";
import { shouldUseMiyo } from "@/miyo/miyoUtils";
import { navigateToPlusPage, useIsPlusUser } from "@/plusUtils";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { Docs4LLMParser } from "@/tools/FileParserManager";
import { isRateLimitError } from "@/utils/rateLimitUtils";
import { DropdownMenu, DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import {
  AlertTriangle,
  CheckCircle,
  ChevronDown,
  Download,
  FileText,
  History,
  LibraryBig,
  MessageCirclePlus,
  MoreHorizontal,
  RefreshCw,
  Sparkles,
  SquareArrowOutUpRight,
} from "lucide-react";
import { Notice } from "obsidian";
import React from "react";
import {
  ChatHistoryItem,
  ChatHistoryPopover,
} from "@/components/chat-components/ChatHistoryPopover";
import { TokenCounter } from "./TokenCounter";
import { ChatSettingsPopover } from "@/components/chat-components/ChatSettingsPopover";

export async function refreshVaultIndex() {
  try {
    const { getSettings } = await import("@/settings/model");
    const settings = getSettings();

    if (settings.enableSemanticSearchV3) {
      // Use VectorStoreManager for semantic search indexing
      const VectorStoreManager = (await import("@/search/vectorStoreManager")).default;
      const count = await VectorStoreManager.getInstance().indexVaultToVectorStore(false, {
        userInitiated: true,
      });
      if (shouldUseMiyo(settings)) {
        new Notice("已开始刷新 Miyo 文件夹索引。请打开 Miyo 应用查看详情。");
      } else {
        new Notice(`语义搜索索引已刷新，共 ${count} 篇文档。`);
      }
    } else {
      // V3 search builds indexes on demand
      new Notice("词法搜索会按需建立索引，无需手动索引。");
    }
  } catch (error) {
    console.error("Error refreshing vault index:", error);
    new Notice("刷新库索引失败。详情请查看控制台。");
  }
}

export async function forceReindexVault() {
  try {
    const { getSettings } = await import("@/settings/model");
    const settings = getSettings();

    if (settings.enableSemanticSearchV3) {
      // Use VectorStoreManager for semantic search indexing
      const VectorStoreManager = (await import("@/search/vectorStoreManager")).default;
      const count = await VectorStoreManager.getInstance().indexVaultToVectorStore(true, {
        userInitiated: true,
      });
      if (shouldUseMiyo(settings)) {
        new Notice("已开始刷新 Miyo 文件夹索引。请打开 Miyo 应用查看详情。");
      } else {
        new Notice(`语义搜索索引已重建，共 ${count} 篇文档。`);
      }
    } else {
      // V3 search builds indexes on demand
      new Notice("词法搜索会按需建立索引，无需手动索引。");
    }
  } catch (error) {
    console.error("Error force reindexing vault:", error);
    new Notice("强制重建库索引失败。详情请查看控制台。");
  }
}

export async function reloadCurrentProject() {
  const currentProject = getCurrentProject();
  if (!currentProject) {
    new Notice("当前没有选中要重新加载的项目。");
    return;
  }

  // Directly execute the reload logic without a confirmation modal
  try {
    setProjectLoading(true); // Start loading indicator

    // Invalidate the markdown context first. This also cleans up file references
    // for files that no longer match project patterns. It will also clear
    // web/youtube contexts to force their reload.
    await ProjectContextCache.getInstance().invalidateMarkdownContext(currentProject, true);

    // Then, trigger the full load and processing logic via ProjectManager.
    // getProjectContext will call loadProjectContext if markdownNeedsReload is true (which it is now).
    // loadProjectContext will handle markdown, web, youtube, and other file types (including API calls for new ones).
    const plugin = (app as any).plugins.getPlugin("copilot");
    if (plugin && plugin.projectManager) {
      await plugin.projectManager.getProjectContext(currentProject.id);
      new Notice(`项目「${currentProject.name}」的上下文已重新加载。`);
    } else {
      throw new Error("Copilot plugin or ProjectManager not available.");
    }
  } catch (error) {
    logError("Error reloading project context:", error);

    // Check if this is a rate limit error and let the FileParserManager notice handle it
    if (!isRateLimitError(error)) {
      new Notice("重新加载项目上下文失败。详情请查看控制台。");
    }
    // If it's a rate limit error, don't show generic failure message - let the rate limit notice show
  } finally {
    setProjectLoading(false); // Stop loading indicator
  }
}

export async function forceRebuildCurrentProjectContext() {
  const currentProject = getCurrentProject();
  if (!currentProject) {
    new Notice("当前没有选中要重建的项目。");
    return;
  }

  const modal = new ConfirmModal(
    app,
    async () => {
      try {
        setProjectLoading(true); // Start loading indicator
        new Notice(
          `正在强制重建项目「${currentProject.name}」的上下文……这会花一些时间并重新获取全部数据。`,
          10000 // Longer notice as this is a bigger operation
        );

        // Step 1: Completely clear all cached data for this project (in-memory and on-disk)
        // Reset rate limit notice timer to allow showing notices during force rebuild
        Docs4LLMParser.resetRateLimitNoticeTimer();

        await ProjectContextCache.getInstance().clearForProject(currentProject);
        new Notice(`项目「${currentProject.name}」的缓存已清空。`);

        // Step 2: Trigger a full reload from scratch.
        // getProjectContext will call loadProjectContext as the cache is now empty.
        // loadProjectContext will handle markdown, web, youtube, and all other file types.
        const plugin = (app as any).plugins.getPlugin("copilot");
        if (plugin && plugin.projectManager) {
          await plugin.projectManager.getProjectContext(currentProject.id);
          new Notice(
            `项目「${currentProject.name}」的上下文已从头重建。`
          );
        } else {
          throw new Error("Copilot plugin or ProjectManager not available for rebuild.");
        }
      } catch (error) {
        logError("Error force rebuilding project context:", error);

        // Check if this is a rate limit error and let the FileParserManager notice handle it
        if (!isRateLimitError(error)) {
          new Notice("强制重建项目上下文失败。详情请查看控制台。");
        }
        // If it's a rate limit error, don't show generic failure message - let the rate limit notice show
      } finally {
        setProjectLoading(false); // Stop loading indicator
      }
    },
    // Confirmation message with a strong warning
    `危险：这会从内存和磁盘中永久删除项目「${currentProject.name}」的全部缓存（Markdown、网页链接、YouTube 字幕和处理过的文件内容）。随后会从头重建上下文，重新获取远程数据并重新处理本地文件。此操作无法撤销。确定继续吗？`,
    "强制重建项目上下文" // Modal title
  );
  modal.open();
}

interface ChatControlsProps {
  onNewChat: () => void;
  onSaveAsNote: () => Promise<void>;
  onLoadHistory: () => void;
  onModeChange: (mode: ChainType) => void;
  onCloseProject?: () => void;
  chatHistory: ChatHistoryItem[];
  onUpdateChatTitle: (id: string, newTitle: string) => Promise<void>;
  onDeleteChat: (id: string) => Promise<void>;
  onLoadChat: (id: string) => Promise<void>;
  onOpenSourceFile?: (id: string) => Promise<void>;
  latestTokenCount?: number | null;
}

export function ChatControls({
  onNewChat,
  onSaveAsNote,
  onLoadHistory,
  onModeChange,
  onCloseProject,
  chatHistory,
  onUpdateChatTitle,
  onDeleteChat,
  onLoadChat,
  onOpenSourceFile,
  latestTokenCount,
}: ChatControlsProps) {
  const settings = useSettingsValue();
  const [selectedChain, setSelectedChain] = useChainType();
  const isPlusUser = useIsPlusUser();

  const handleModeChange = async (chainType: ChainType) => {
    // If leaving project mode with autosave enabled, save chat BEFORE clearing project context
    // This ensures the chat is saved with the correct project prefix
    const isLeavingProjectMode =
      selectedChain === ChainType.PROJECT_CHAIN && chainType !== ChainType.PROJECT_CHAIN;
    if (isLeavingProjectMode && settings.autosaveChat) {
      await onSaveAsNote();
    }

    setSelectedChain(chainType);
    onModeChange(chainType);
    if (chainType !== ChainType.PROJECT_CHAIN) {
      setCurrentProject(null);
      onCloseProject?.();
    }
  };

  return (
    <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-p-1">
      <div className="tw-flex-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost2" size="fit" className="tw-ml-1 tw-text-sm tw-text-muted">
              {selectedChain === ChainType.LLM_CHAIN && "对话（免费）"}
              {selectedChain === ChainType.VAULT_QA_CHAIN && "库问答（免费）"}
              {selectedChain === ChainType.COPILOT_PLUS_CHAIN && (
                <div className="tw-flex tw-items-center tw-gap-1">
                  <Sparkles className="tw-size-4" />
                  Copilot Plus
                </div>
              )}
              {selectedChain === ChainType.PROJECT_CHAIN && "项目（测试）"}
              <ChevronDown className="tw-mt-0.5 tw-size-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem
              onSelect={() => {
                handleModeChange(ChainType.LLM_CHAIN);
              }}
            >
              对话（免费）
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                handleModeChange(ChainType.VAULT_QA_CHAIN);
              }}
            >
              库问答（免费）
            </DropdownMenuItem>
            {isPlusUser ? (
              <DropdownMenuItem
                onSelect={() => {
                  handleModeChange(ChainType.COPILOT_PLUS_CHAIN);
                }}
              >
                <div className="tw-flex tw-items-center tw-gap-1">
                  <Sparkles className="tw-size-4" />
                  Copilot Plus
                </div>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  navigateToPlusPage(PLUS_UTM_MEDIUMS.CHAT_MODE_SELECT);
                  onCloseProject?.();
                }}
              >
                Copilot Plus
                <SquareArrowOutUpRight className="tw-size-3" />
              </DropdownMenuItem>
            )}

            {isPlusUser ? (
              <DropdownMenuItem
                className="tw-flex tw-items-center tw-gap-1"
                onSelect={() => {
                  handleModeChange(ChainType.PROJECT_CHAIN);
                }}
              >
                <LibraryBig className="tw-size-4" />
                项目（测试）
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem
                onSelect={() => {
                  navigateToPlusPage(PLUS_UTM_MEDIUMS.CHAT_MODE_SELECT);
                  onCloseProject?.();
                }}
              >
                Copilot Plus
                <SquareArrowOutUpRight className="tw-size-3" />
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="tw-flex tw-items-center tw-gap-1">
        <div className="tw-mr-2">
          <TokenCounter tokenCount={latestTokenCount ?? null} />
        </div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost2" size="icon" title="新建对话" onClick={onNewChat}>
              <MessageCirclePlus className="tw-size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>新建对话</TooltipContent>
        </Tooltip>
        {selectedChain !== ChainType.PROJECT_CHAIN && <ChatSettingsPopover />}
        {!settings.autosaveChat && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost2" size="icon" title="把对话保存为笔记" onClick={onSaveAsNote}>
                <Download className="tw-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>把对话保存为笔记</TooltipContent>
          </Tooltip>
        )}
        <Tooltip>
          <ChatHistoryPopover
            chatHistory={chatHistory}
            onUpdateTitle={onUpdateChatTitle}
            onDeleteChat={onDeleteChat}
            onLoadChat={onLoadChat}
            onOpenSourceFile={onOpenSourceFile}
          >
            <TooltipTrigger asChild>
              <Button variant="ghost2" size="icon" title="对话历史" onClick={onLoadHistory}>
                <History className="tw-size-4" />
              </Button>
            </TooltipTrigger>
          </ChatHistoryPopover>
          <TooltipContent>对话历史</TooltipContent>
        </Tooltip>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost2" size="icon" title="高级设置">
              <MoreHorizontal className="tw-size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="tw-w-64">
            <DropdownMenuItem
              className="tw-flex tw-justify-between"
              onSelect={(e) => {
                e.preventDefault();
                updateSetting("showSuggestedPrompts", !settings.showSuggestedPrompts);
              }}
            >
              <div className="tw-flex tw-items-center tw-gap-2">
                <Sparkles className="tw-size-4" />
                推荐提示词
              </div>
              <SettingSwitch checked={settings.showSuggestedPrompts} />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="tw-flex tw-justify-between"
              onSelect={(e) => {
                e.preventDefault();
                updateSetting("showRelevantNotes", !settings.showRelevantNotes);
              }}
            >
              <div className="tw-flex tw-items-center tw-gap-2">
                <FileText className="tw-size-4" />
                相关笔记
              </div>
              <SettingSwitch checked={settings.showRelevantNotes} />
            </DropdownMenuItem>
            <DropdownMenuItem
              className="tw-flex tw-justify-between"
              onSelect={(e) => {
                e.preventDefault();
                updateSetting("autoAcceptEdits", !settings.autoAcceptEdits);
              }}
            >
              <div className="tw-flex tw-items-center tw-gap-2">
                <CheckCircle className="tw-size-4" />
                自动接受修改
              </div>
              <SettingSwitch checked={settings.autoAcceptEdits} />
            </DropdownMenuItem>
            {selectedChain === ChainType.PROJECT_CHAIN ? (
              <>
                <DropdownMenuItem
                  className="tw-flex tw-items-center tw-gap-2"
                  onSelect={() => reloadCurrentProject()}
                >
                  <RefreshCw className="tw-size-4" />
                  重新加载当前项目
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="tw-flex tw-items-center tw-gap-2"
                  onSelect={() => forceRebuildCurrentProjectContext()}
                >
                  <AlertTriangle className="tw-size-4" />
                  强制重建上下文
                </DropdownMenuItem>
              </>
            ) : (
              <>
                <DropdownMenuItem
                  className="tw-flex tw-items-center tw-gap-2"
                  onSelect={() => refreshVaultIndex()}
                >
                  <RefreshCw className="tw-size-4" />
                  刷新库索引
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="tw-flex tw-items-center tw-gap-2"
                  onSelect={() => {
                    const modal = new ConfirmModal(
                      app,
                      () => forceReindexVault(),
                      "这会删除并从头重建整个库索引。此操作无法撤销。确定继续吗？",
                      "强制重建库索引"
                    );
                    modal.open();
                  }}
                >
                  <AlertTriangle className="tw-size-4" />
                  强制重建库索引
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
