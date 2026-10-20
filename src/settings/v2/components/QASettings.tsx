import React from "react";

import { Notice } from "obsidian";

import { RebuildIndexConfirmModal } from "@/components/modals/RebuildIndexConfirmModal";
import { SemanticSearchToggleModal } from "@/components/modals/SemanticSearchToggleModal";
import { HelpTooltip } from "@/components/ui/help-tooltip";
import { getModelDisplayWithIcons } from "@/components/ui/model-display";
import { SettingItem } from "@/components/ui/setting-item";
import { VAULT_VECTOR_STORE_STRATEGIES } from "@/constants";
import { getModelKeyFromModel, updateSetting, useSettingsValue } from "@/settings/model";
import { PatternListEditor } from "@/settings/v2/components/PatternListEditor";

export const QASettings: React.FC = () => {
  const settings = useSettingsValue();
  const isMiyoSearchActive = settings.enableMiyo;
  const visibleEmbeddingModels = settings.activeEmbeddingModels;

  const handleSetDefaultEmbeddingModel = async (modelKey: string) => {
    if (modelKey === settings.embeddingModelKey) return;

    if (settings.enableSemanticSearchV3) {
      // Persist only after user confirms rebuild
      new RebuildIndexConfirmModal(app, async () => {
        updateSetting("embeddingModelKey", modelKey);
        const VectorStoreManager = (await import("@/search/vectorStoreManager")).default;
        await VectorStoreManager.getInstance().indexVaultToVectorStore(false, {
          userInitiated: true,
        });
      }).open();
      return;
    }

    // Persist without rebuild when semantic search is disabled
    updateSetting("embeddingModelKey", modelKey);
    new Notice("向量模型已保存。启用语义搜索后才会建立索引。");
  };

  // Partitions are automatically managed in v3 (150MB per JSONL partition).
  // Remove UI control; keep handler stub to avoid accidental usage.
  // const handlePartitionsChange = (_value: string) => {};

  return (
    <div className="tw-space-y-4">
      <section>
        <div className="tw-space-y-4">
          {/* Enable Semantic Search (v3) */}
          <SettingItem
            type="switch"
            title="启用语义搜索"
            description="按语义检索相关笔记。关闭后只使用较快的关键词搜索。可用「刷新库索引」或「强制重建库索引」建立向量索引。"
            checked={settings.enableSemanticSearchV3}
            onCheckedChange={(checked) => {
              // Show confirmation modal with appropriate message
              new SemanticSearchToggleModal(
                app,
                async () => {
                  updateSetting("enableSemanticSearchV3", checked);
                  if (!checked && settings.enableMiyo) {
                    updateSetting("enableMiyo", false);
                  }
                  if (checked) {
                    const VectorStoreManager = (await import("@/search/vectorStoreManager"))
                      .default;
                    await VectorStoreManager.getInstance().indexVaultToVectorStore(false, {
                      userInitiated: true,
                    });
                  }
                },
                checked // true = enabling, false = disabling
              ).open();
            }}
          />

          {/* Enable Inline Citations */}
          <SettingItem
            type="switch"
            title="启用行内引用（实验）"
            description="开启后，AI 回复会在正文中加入脚注式引用，并在末尾列出编号来源。这是实验功能，并非所有模型都能正常工作。"
            checked={settings.enableInlineCitations}
            onCheckedChange={(checked) => updateSetting("enableInlineCitations", checked)}
          />

          <SettingItem
            type="select"
            title="向量模型"
            description={
              <div className="tw-space-y-2">
                <div className="tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-font-medium tw-leading-none tw-text-accent">
                    用于库的语义搜索和相关笔记。需要先启用语义搜索。
                  </span>
                  <HelpTooltip
                    content={
                      <div className="tw-flex tw-max-w-96 tw-flex-col tw-gap-2">
                        <div className="tw-pt-2 tw-text-sm tw-text-muted">
                          这个模型把文字转成向量，供语义搜索和问答使用。更换向量模型后：
                        </div>
                        <ul className="tw-pl-4 tw-text-sm tw-text-muted">
                          <li>需要重建整个库的向量索引</li>
                          <li>会影响语义搜索质量</li>
                          <li>会影响问答效果</li>
                        </ul>
                      </div>
                    }
                  />
                </div>
                {isMiyoSearchActive && (
                  <div className="tw-text-sm tw-text-muted">
                    已启用 Miyo 搜索，向量由 Miyo 生成，此设置会被忽略。
                  </div>
                )}
              </div>
            }
            value={settings.embeddingModelKey}
            onChange={handleSetDefaultEmbeddingModel}
            options={visibleEmbeddingModels.map((model) => ({
              label: getModelDisplayWithIcons(model),
              value: getModelKeyFromModel(model),
            }))}
            placeholder="模型"
            disabled={isMiyoSearchActive}
          />

          {/* Auto-Index Strategy */}
          <SettingItem
            type="select"
            title="自动索引策略"
            description={
              <div className="tw-flex tw-items-center tw-gap-1.5">
                <span className="tw-leading-none">
                  决定何时为整个库建立索引。
                </span>
                <HelpTooltip
                  content={
                    <div className="tw-space-y-2 tw-py-2">
                      <div className="tw-space-y-1">
                        <div className="tw-text-sm tw-text-muted">
                          选择何时索引整个库：
                        </div>
                        <ul className="tw-list-disc tw-space-y-1 tw-pl-2 tw-text-sm">
                          <li>
                            <div className="tw-flex tw-items-center tw-gap-1">
                              <strong className="tw-inline-block tw-whitespace-nowrap">
                                NEVER:
                              </strong>
                              <span>只通过命令或手动刷新建立索引</span>
                            </div>
                          </li>
                          <li>
                            <div className="tw-flex tw-items-center tw-gap-1">
                              <strong className="tw-inline-block tw-whitespace-nowrap">
                                ON STARTUP:
                              </strong>
                              <span>插件加载或重新加载时更新索引</span>
                            </div>
                          </li>
                          <li>
                            <div className="tw-flex tw-items-center tw-gap-1">
                              <strong className="tw-inline-block tw-whitespace-nowrap">
                                ON MODE SWITCH:
                              </strong>
                              <span>进入问答模式时更新（推荐）</span>
                            </div>
                          </li>
                        </ul>
                      </div>
                      <p className="tw-text-sm tw-text-callout-warning">
                        注意：大型库使用付费模型时可能产生费用
                      </p>
                    </div>
                  }
                />
              </div>
            }
            value={settings.indexVaultToVectorStore}
            onChange={(value) => {
              updateSetting("indexVaultToVectorStore", value);
            }}
            options={VAULT_VECTOR_STORE_STRATEGIES.map((strategy) => ({
              label: strategy,
              value: strategy,
            }))}
            placeholder="策略"
          />

          {/* Max Sources */}
          <SettingItem
            type="slider"
            title="最大来源数"
            description="Copilot 会在库中查找相关笔记，并把最相关的前 N 条交给模型。N 默认是 30。想让回答参考更多笔记时可以调高。"
            min={1}
            max={128}
            step={1}
            value={settings.maxSourceChunks}
            onChange={(value) => updateSetting("maxSourceChunks", value)}
          />

          {/* Embedding-related settings - Only shown when semantic search is enabled */}
          {settings.enableSemanticSearchV3 && (
            <>
              {/* Requests per Minute */}
              <SettingItem
                type="slider"
                title="每分钟请求数"
                description="默认 60。如果向量服务商限制了请求频率，请调低。"
                min={10}
                max={60}
                step={10}
                value={Math.min(settings.embeddingRequestsPerMin, 60)}
                onChange={(value) => updateSetting("embeddingRequestsPerMin", value)}
              />

              {/* Embedding batch size */}
              <SettingItem
                type="slider"
                title="向量批大小"
                description="默认 16。如果向量服务商限制了请求频率，可以调高。"
                min={1}
                max={128}
                step={1}
                value={settings.embeddingBatchSize}
                onChange={(value) => updateSetting("embeddingBatchSize", value)}
              />

              {/* Number of Partitions */}
              <SettingItem
                type="select"
                title="分区数量"
                description="Copilot 索引的分区数，默认 1。大型库索引出问题时可以增加。注意：修改后必须清空并重建索引。"
                value={String(settings.numPartitions || 1)}
                onChange={(value) => updateSetting("numPartitions", Number(value))}
                options={[
                  { label: "1", value: "1" },
                  { label: "2", value: "2" },
                  { label: "4", value: "4" },
                  { label: "8", value: "8" },
                  { label: "16", value: "16" },
                  { label: "32", value: "32" },
                  { label: "40", value: "40" },
                ]}
                placeholder="选择分区数"
              />
            </>
          )}

          {/* Lexical Search RAM Limit */}
          <SettingItem
            type="slider"
            title="关键词搜索内存上限"
            description="全文搜索索引最多占用的内存。数值越低越省内存，但大型库的搜索性能可能下降。默认 100 MB。"
            min={20}
            max={1000}
            step={20}
            value={settings.lexicalSearchRamLimit || 100}
            onChange={(value) => updateSetting("lexicalSearchRamLimit", value)}
            suffix=" MB"
          />

          {/* Enable Folder and Graph Boosts */}
          <SettingItem
            type="switch"
            title="启用文件夹和图谱加权"
            description="让关键词搜索结果同时考虑文件夹和笔记关联。关闭后只按关键词计算相关度，不再按文件夹或链接调整。"
            checked={settings.enableLexicalBoosts}
            onCheckedChange={(checked) => updateSetting("enableLexicalBoosts", checked)}
          />

          {/* Exclusions */}
          <SettingItem
            type="custom"
            title="排除项"
            description="按文件夹、标签、笔记标题或文件扩展名排除索引。已索引的文件会保留，直到执行强制重建索引。"
          >
            <PatternListEditor
              value={settings.qaExclusions}
              onChange={(value) => updateSetting("qaExclusions", value)}
            />
          </SettingItem>

          {/* Inclusions */}
          <SettingItem
            type="custom"
            title="包含项"
            description="只索引指定的路径、标签或笔记标题。排除项优先于包含项。已索引的文件会保留，直到执行强制重建索引。"
          >
            <PatternListEditor
              value={settings.qaInclusions}
              onChange={(value) => updateSetting("qaInclusions", value)}
            />
          </SettingItem>

          {/* Enable Obsidian Sync */}
          <SettingItem
            type="switch"
            title="让 Copilot 索引参与 Obsidian Sync"
            description="开启后，语义索引保存在 .obsidian 中，可随 Obsidian Sync 同步。关闭后保存在库根目录的 .copilot/ 下。"
            checked={settings.enableIndexSync}
            onCheckedChange={(checked) => updateSetting("enableIndexSync", checked)}
          />

          {/* Disable index loading on mobile */}
          <SettingItem
            type="switch"
            title="手机上不加载索引"
            description="开启后，手机上不加载 Copilot 索引以节省资源，只能使用对话模式。桌面端同步来的索引会保留。取消勾选后，手机上才能使用问答模式。"
            checked={settings.disableIndexOnMobile}
            onCheckedChange={(checked) => updateSetting("disableIndexOnMobile", checked)}
          />
        </div>
      </section>
    </div>
  );
};
