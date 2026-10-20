import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { Badge } from "@/components/ui/badge";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { SettingItem } from "@/components/ui/setting-item";
import { DEFAULT_SETTINGS } from "@/constants";
import { MiyoClient } from "@/miyo/MiyoClient";
import { getMiyoCustomUrl, getMiyoFolderName } from "@/miyo/miyoUtils";
import { useIsSelfHostEligible, validateSelfHostMode } from "@/plusUtils";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { Notice } from "obsidian";
import React, { useState } from "react";
import { ToolSettingsSection } from "./ToolSettingsSection";

export const CopilotPlusSettings: React.FC = () => {
  const settings = useSettingsValue();
  const [isValidatingSelfHost, setIsValidatingSelfHost] = useState(false);
  const isSelfHostEligible = useIsSelfHostEligible();

  /**
   * Toggle self-host mode and handle validation requirements.
   *
   * @param enabled - Whether self-host mode should be enabled.
   */
  const handleSelfHostModeToggle = async (enabled: boolean) => {
    if (enabled) {
      setIsValidatingSelfHost(true);
      const isValid = await validateSelfHostMode();
      setIsValidatingSelfHost(false);
      if (!isValid) {
        // Validation failed - Notice already shown by validateSelfHostMode
        return;
      }
      updateSetting("enableSelfHostMode", true);
    } else {
      updateSetting("enableSelfHostMode", false);
      updateSetting("enableMiyo", false);
    }
  };

  /**
   * Toggle Miyo-backed semantic search and refresh the index when enabling.
   *
   * @param enabled - Whether Miyo search should be enabled.
   */
  const handleMiyoSearchToggle = async (enabled: boolean) => {
    if (enabled === settings.enableMiyo) {
      return;
    }

    if (!enabled) {
      updateSetting("enableMiyo", false);
      return;
    }

    setIsValidatingSelfHost(true);
    try {
      const miyoClient = new MiyoClient();
      const isMiyoAvailable = await miyoClient.isBackendAvailable(getMiyoCustomUrl(settings));
      if (!isMiyoAvailable) {
        new Notice("找不到 Miyo。请先启动 Miyo，然后再试。");
        return;
      }
    } finally {
      setIsValidatingSelfHost(false);
    }

    const confirmChange = async () => {
      if (enabled && settings.embeddingBatchSize !== DEFAULT_SETTINGS.embeddingBatchSize) {
        updateSetting("embeddingBatchSize", DEFAULT_SETTINGS.embeddingBatchSize);
      }

      updateSetting("enableMiyo", enabled);

      if (enabled && !settings.enableSemanticSearchV3) {
        updateSetting("enableSemanticSearchV3", true);
      }

      if (settings.enableSemanticSearchV3 || enabled) {
        const VectorStoreManager = (await import("@/search/vectorStoreManager")).default;
        await VectorStoreManager.getInstance().indexVaultToVectorStore(false, {
          userInitiated: true,
        });
      }
    };

    new ConfirmModal(
      app,
      confirmChange,
      `启用 Miyo 搜索后，会把当前库的文件夹名作为 Miyo 文件夹标识，并向 Miyo 请求扫描。请确认这个文件夹已经在 Miyo 中登记。为保证本地稳定，嵌入批大小会重置为默认值（${DEFAULT_SETTINGS.embeddingBatchSize}）。要继续吗？`,
      "请求 Miyo 扫描"
    ).open();
  };

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <section className="tw-flex tw-flex-col tw-gap-4">
        <div className="tw-flex tw-items-center tw-py-4">
          <Badge variant="secondary" className="tw-text-accent">
            需要 Plus
          </Badge>
        </div>
        <div className="tw-flex tw-flex-col tw-gap-4">
          <div className="tw-pt-4 tw-text-xl tw-font-semibold">自主代理</div>

          <SettingItem
            type="switch"
            title="启用自主代理"
            description="在 Plus 对话中启用自主代理。AI 会分步推理，并自动决定使用哪些工具，从而提升复杂问题的回答质量。"
            checked={settings.enableAutonomousAgent}
            onCheckedChange={(checked) => {
              updateSetting("enableAutonomousAgent", checked);
            }}
          />

          {settings.enableAutonomousAgent && (
            <>
              <ToolSettingsSection />
            </>
          )}

          <div className="tw-pt-4 tw-text-xl tw-font-semibold">文档处理</div>

          <SettingItem
            type="text"
            title="转换后的 Markdown 保存到"
            description="处理 PDF 和其他文档后，转换出的 Markdown 会保存到这个文件夹。留空则不保存。"
            value={settings.convertedDocOutputFolder}
            onChange={(value) => {
              updateSetting("convertedDocOutputFolder", value);
            }}
            placeholder="例如 copilot/converteddocs"
          />

          <div className="tw-pt-4 tw-text-xl tw-font-semibold">记忆（实验功能）</div>

          <SettingItem
            type="text"
            title="记忆文件夹名称"
            description="指定记忆数据的保存文件夹。"
            value={settings.memoryFolderName}
            onChange={(value) => {
              updateSetting("memoryFolderName", value);
            }}
            placeholder="copilot/memory"
          />

          <SettingItem
            type="switch"
            title="参考最近对话"
            description="启用后，Copilot 会参考最近的对话记录，让回答更贴合上下文。所有历史数据都保存在本地库中。"
            checked={settings.enableRecentConversations}
            onCheckedChange={(checked) => {
              updateSetting("enableRecentConversations", checked);
            }}
          />

          {settings.enableRecentConversations && (
            <SettingItem
              type="slider"
              title="最近对话数量上限"
              description="用于提供上下文的最近对话数量。数值越大，上下文越多，但回答可能变慢。"
              min={10}
              max={50}
              step={1}
              value={settings.maxRecentConversations}
              onChange={(value) => updateSetting("maxRecentConversations", value)}
            />
          )}

          <SettingItem
            type="switch"
            title="参考已保存的记忆"
            description="启用后，Copilot 可以读取你明确要求它记住的内容。适合保存重要事实、偏好或以后对话需要的上下文。"
            checked={settings.enableSavedMemory}
            onCheckedChange={(checked) => {
              updateSetting("enableSavedMemory", checked);
            }}
          />

          {isSelfHostEligible && (
            <>
              <div className="tw-flex tw-items-center tw-gap-1.5 tw-pt-4 tw-text-xl tw-font-semibold">
                自托管模式
                <HelpTooltip content="需要终身许可证" />
              </div>

              <SettingItem
                type="switch"
                title="启用自托管模式"
                description={
                  <div className="tw-flex tw-items-center tw-gap-1.5">
                    <span className="tw-leading-none">
                      通过桌面应用 Miyo，使用你自己的基础设施来运行大模型、嵌入和本地文档理解。
                    </span>
                    <HelpTooltip
                      content={
                        <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2 tw-py-4">
                          <div className="tw-text-sm tw-font-medium tw-text-accent">
                            自托管模式（仅限 Believer/Supporter）
                          </div>
                          <div className="tw-text-xs tw-text-muted">
                            连接到你自己托管的后端（例如 Miyo），完全控制 AI
                            基础设施。可以离线使用，也可以部署自定义模型。
                          </div>
                          <div className="tw-text-xs tw-text-muted">
                            联网时每 15 天需要重新验证一次。
                          </div>
                        </div>
                      }
                    />
                  </div>
                }
                checked={settings.enableSelfHostMode}
                onCheckedChange={handleSelfHostModeToggle}
                disabled={isValidatingSelfHost}
              />

              {settings.enableSelfHostMode && (
                <>
                  <SettingItem
                    type="text"
                    title="远程 Miyo 服务器地址（可选）"
                    description="在本机访问 Miyo 时留空。只有 Miyo 运行在另一台机器上时才填写，填写后会覆盖本地服务发现。"
                    value={settings.miyoServerUrl || ""}
                    onChange={(value) => updateSetting("miyoServerUrl", value)}
                  />

                  <SettingItem
                    type="switch"
                    title="启用 Miyo"
                    description="把 Miyo 用作本地搜索、PDF 解析和上下文中心。Copilot 会把当前库的文件夹名发送给 Miyo，也可以请求扫描，但文件夹登记仍在 Miyo 中管理。"
                    checked={settings.enableMiyo}
                    onCheckedChange={handleMiyoSearchToggle}
                    disabled={isValidatingSelfHost}
                  />

                  {settings.enableMiyo && (
                    <>
                      <SettingItem
                        type="switch"
                        title="搜索 Miyo 中的全部内容"
                        description="启用后，Miyo 会搜索所有文件夹中已索引的内容。关闭后，只搜索当前库对应的文件夹。"
                        checked={settings.miyoSearchAll}
                        onCheckedChange={(checked) => updateSetting("miyoSearchAll", checked)}
                      />

                      {!settings.miyoSearchAll && (
                        <div className="tw-text-xs tw-text-muted">
                          发送给 Miyo 的文件夹标识：{" "}
                          <span className="tw-font-medium tw-text-normal">
                            {getMiyoFolderName(app)}
                          </span>
                        </div>
                      )}
                    </>
                  )}

                  <SettingItem
                    type="select"
                    title="网页搜索服务"
                    description="选择自托管模式下使用的网页搜索服务。"
                    value={settings.selfHostSearchProvider}
                    onChange={(value) =>
                      updateSetting("selfHostSearchProvider", value as "firecrawl" | "perplexity")
                    }
                    options={[
                      { label: "Firecrawl（默认）", value: "firecrawl" },
                      { label: "Perplexity Sonar", value: "perplexity" },
                    ]}
                  />

                  {settings.selfHostSearchProvider === "firecrawl" && (
                    <SettingItem
                      type="password"
                      title="Firecrawl API Key"
                      description={
                        <span>
                          通过 Firecrawl 进行网页搜索的 API 密钥。{" "}
                          <a
                            href="https://firecrawl.link/logan-yang"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tw-text-accent"
                          >
                            注册 &rarr;
                          </a>
                        </span>
                      }
                      value={settings.firecrawlApiKey}
                      onChange={(value) => updateSetting("firecrawlApiKey", value)}
                      placeholder="fc-..."
                    />
                  )}

                  {settings.selfHostSearchProvider === "perplexity" && (
                    <SettingItem
                      type="password"
                      title="Perplexity API Key"
                      description={
                        <span>
                          通过 Perplexity Sonar 进行网页搜索的 API 密钥。{" "}
                          <a
                            href="https://docs.perplexity.ai"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="tw-text-accent"
                          >
                            获取 API 密钥 &rarr;
                          </a>
                        </span>
                      }
                      value={settings.perplexityApiKey}
                      onChange={(value) => updateSetting("perplexityApiKey", value)}
                      placeholder="pplx-..."
                    />
                  )}

                  <SettingItem
                    type="password"
                    title="Supadata API Key"
                    description={
                      <span>
                        通过 Supadata 获取 YouTube 字幕的 API 密钥。{" "}
                        <a
                          href="https://supadata.ai/?ref=obcopilot"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="tw-text-accent"
                        >
                          注册 &rarr;
                        </a>
                      </span>
                    }
                    value={settings.supadataApiKey}
                    onChange={(value) => updateSetting("supadataApiKey", value)}
                    placeholder="sd-..."
                  />
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
};
