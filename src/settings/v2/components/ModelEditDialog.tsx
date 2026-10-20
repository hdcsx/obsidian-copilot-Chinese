import { CustomModel } from "@/aiParams";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";

import { HelpTooltip } from "@/components/ui/help-tooltip";
import {
  ChatModelProviders,
  EmbeddingModelProviders,
  MODEL_CAPABILITIES,
  ModelCapability,
  ProviderMetadata,
  SettingKeyProviders,
} from "@/constants";
import { getSettings } from "@/settings/model";
import { debounce, getProviderInfo, getProviderLabel } from "@/utils";
import { getApiKeyForProvider } from "@/utils/modelUtils";
import { App, Modal, Platform } from "obsidian";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createRoot, Root } from "react-dom/client";
import { ModelParametersEditor } from "@/components/ui/ModelParametersEditor";

interface ModelEditModalContentProps {
  model: CustomModel;
  isEmbeddingModel: boolean;
  onUpdate: (
    isEmbeddingModel: boolean,
    originalModel: CustomModel,
    updatedModel: CustomModel
  ) => void;
  onCancel: () => void;
}

export const ModelEditModalContent: React.FC<ModelEditModalContentProps> = ({
  model,
  onUpdate,
  isEmbeddingModel,
  onCancel,
}) => {
  const [localModel, setLocalModel] = useState<CustomModel>(model);
  const [originalModel, setOriginalModel] = useState<CustomModel>(model);
  const [providerInfo, setProviderInfo] = useState<ProviderMetadata>({} as ProviderMetadata);
  const settings = getSettings();
  const isBedrockProvider = localModel.provider === ChatModelProviders.AMAZON_BEDROCK;

  useEffect(() => {
    setLocalModel(model);
    setOriginalModel(model);
    if (model.provider) {
      setProviderInfo(getProviderInfo(model.provider));
    }
  }, [model]);

  // Debounce the onUpdate callback
  const debouncedOnUpdate = useMemo(
    () =>
      debounce((currentOriginalModel: CustomModel, updatedModel: CustomModel) => {
        onUpdate(isEmbeddingModel, currentOriginalModel, updatedModel);
      }, 500),
    [isEmbeddingModel, onUpdate]
  );

  // Function to update local state immediately
  const handleLocalUpdate = useCallback(
    (field: keyof CustomModel, value: any) => {
      setLocalModel((prevModel) => {
        const updatedModel = {
          ...prevModel,
          [field]: value,
        };
        // Call the debounced update function, passing the stable originalModel and the new updatedModel
        debouncedOnUpdate(originalModel, updatedModel);
        return updatedModel; // Return the updated model for immediate state update
      });
    },
    [originalModel, debouncedOnUpdate]
  );

  const handleLocalReset = useCallback(
    (field: keyof CustomModel) => {
      setLocalModel((prevModel) => {
        const updatedModel = { ...prevModel };
        delete updatedModel[field];
        // Call the debounced update function, passing the stable originalModel and the new updatedModel
        debouncedOnUpdate(originalModel, updatedModel);
        return updatedModel; // Return the updated model for immediate state update
      });
    },
    [debouncedOnUpdate, originalModel]
  );

  if (!localModel) return null;

  const getPlaceholderUrl = () => {
    if (!localModel || !localModel.provider || localModel.provider !== "azure-openai") {
      return providerInfo.host || "https://api.example.com/v1";
    }

    const instanceName = localModel.azureOpenAIApiInstanceName || "[instance]";
    const deploymentName = localModel.isEmbeddingModel
      ? localModel.azureOpenAIApiEmbeddingDeploymentName || "[deployment]"
      : localModel.azureOpenAIApiDeploymentName || "[deployment]";
    const apiVersion = localModel.azureOpenAIApiVersion || "[api-version]";
    const endpoint = localModel.isEmbeddingModel ? "embeddings" : "chat/completions";

    return `https://${instanceName}.openai.azure.com/openai/deployments/${deploymentName}/${endpoint}?api-version=${apiVersion}`;
  };

  const capabilityOptions = Object.entries(MODEL_CAPABILITIES).map(([id, description]) => ({
    id: id as ModelCapability,
    label:
      id === ModelCapability.REASONING ? "推理" : id === ModelCapability.VISION ? "图片" : "联网",
    description,
  }));

  const displayApiKey = getApiKeyForProvider(
    localModel.provider as SettingKeyProviders,
    localModel
  );
  const showOtherParameters =
    !isEmbeddingModel && localModel.provider !== EmbeddingModelProviders.COPILOT_PLUS_JINA;

  return (
    <div className="tw-space-y-3 tw-p-4">
      <div className="tw-space-y-3">
        <FormField label="模型名称" required>
          <Input
            type="text"
            disabled={localModel.core}
            value={localModel.name}
            onChange={(e) => handleLocalUpdate("name", e.target.value)}
            placeholder="填写模型名称"
          />
        </FormField>

        <FormField
          label={
            <div className="tw-flex tw-items-center tw-gap-1.5">
              <span className="tw-leading-none">显示名称</span>
              <HelpTooltip
                content={
                  <div className="tw-flex tw-flex-col tw-gap-0.5 tw-text-sm tw-text-muted">
                    <div className="tw-text-[12px] tw-font-bold">建议格式：</div>
                    <div className="tw-text-accent">[来源]-[付费方式]:[模型显示名]</div>
                    <div className="tw-text-[12px]">
                      示例：
                      <li>Direct-Paid:Ds-r1</li>
                      <li>OpenRouter-Paid:Ds-r1</li>
                      <li>Perplexity-Paid:lg</li>
                    </div>
                  </div>
                }
                contentClassName="tw-max-w-96"
              />
            </div>
          }
        >
          <Input
            type="text"
            placeholder="自定义显示名称（可选）"
            value={localModel.displayName || ""}
            onChange={(e) => handleLocalUpdate("displayName", e.target.value)}
          />
        </FormField>

        <FormField label="服务商">
          <Input type="text" value={getProviderLabel(localModel.provider)} disabled />
        </FormField>

        <FormField label="接口地址" description="使用代理时才需要填写，否则留空。">
          <Input
            type="text"
            placeholder={getPlaceholderUrl()}
            value={localModel.baseUrl || ""}
            onChange={(e) => handleLocalUpdate("baseUrl", e.target.value)}
          />
        </FormField>

        {isBedrockProvider && (
          <FormField
            label="区域（可选）"
            description="留空时默认使用 us-east-1。使用推理配置（global.、us.、eu.、apac.）时，区域会自动管理。"
          >
            <Input
              type="text"
              placeholder="填写 AWS 区域（例如 us-east-1）"
              value={localModel.bedrockRegion || ""}
              onChange={(e) => handleLocalUpdate("bedrockRegion", e.target.value)}
            />
          </FormField>
        )}

        <FormField label="API 密钥">
          <PasswordInput
            placeholder={`填写 ${providerInfo.label || "服务商"} API 密钥`}
            value={displayApiKey}
            onChange={(value) => handleLocalUpdate("apiKey", value)}
          />
          {providerInfo.keyManagementURL && (
            <p className="tw-text-xs tw-text-muted">
              <a href={providerInfo.keyManagementURL} target="_blank" rel="noopener noreferrer">
                获取 {providerInfo.label} API 密钥
              </a>
            </p>
          )}
        </FormField>

        {/* Prompt Caching Toggle for OpenRouter */}
        {localModel.provider === ChatModelProviders.OPENROUTERAI && (
          <div className="tw-flex tw-items-center tw-gap-2">
            <Checkbox
              id="enable-prompt-caching"
              checked={localModel.enablePromptCaching !== false}
              onCheckedChange={(checked) => handleLocalUpdate("enablePromptCaching", checked)}
            />
            <Label htmlFor="enable-prompt-caching" className="tw-cursor-pointer tw-text-sm">
              提示缓存
            </Label>
            <HelpTooltip
              content={
                <div className="tw-text-sm tw-text-muted">
                  如果 OpenRouter 接口使用零数据保留（ZDR），请关闭。该模式不支持提示缓存。
                </div>
              }
            />
          </div>
        )}

        {showOtherParameters && (
          <>
            <FormField
              label={
                <div className="tw-flex tw-items-center tw-gap-1.5">
                  <span className="tw-leading-none">模型能力</span>
                  <HelpTooltip
                    content={
                      <div className="tw-text-sm tw-text-muted">
                        只用于显示模型能力，不影响模型的实际功能
                      </div>
                    }
                    contentClassName="tw-max-w-96"
                  />
                </div>
              }
            >
              <div className="tw-flex tw-items-center tw-gap-4">
                {capabilityOptions.map(({ id, label, description }) => (
                  <div key={id} className="tw-flex tw-items-center tw-gap-2">
                    <Checkbox
                      id={id}
                      checked={localModel.capabilities?.includes(id)}
                      onCheckedChange={(checked) => {
                        const newCapabilities = localModel.capabilities || [];
                        const value = checked
                          ? [...newCapabilities, id]
                          : newCapabilities.filter((cap) => cap !== id);
                        handleLocalUpdate("capabilities", value);
                      }}
                    />
                    <HelpTooltip content={description}>
                      <Label htmlFor={id} className="tw-text-sm">
                        {label}
                      </Label>
                    </HelpTooltip>
                  </div>
                ))}
              </div>
            </FormField>

            {/* Stream Usage Toggle for OpenAI-format providers */}
            {(localModel.provider === ChatModelProviders.OPENAI_FORMAT ||
              localModel.provider === ChatModelProviders.LM_STUDIO) && (
              <FormField label="流式选项">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <Checkbox
                    id="stream-usage"
                    checked={localModel.streamUsage || false}
                    onCheckedChange={(checked) => handleLocalUpdate("streamUsage", checked)}
                  />
                  <HelpTooltip
                    content={
                      <div className="tw-text-sm tw-text-muted">
                        如果服务商支持用 stream_options 统计 token 用量，就启用。不支持的服务商请关闭（例如 Databricks、MLFlow）。
                      </div>
                    }
                  >
                    <Label htmlFor="stream-usage" className="tw-cursor-pointer tw-text-sm">
                      流式用量
                    </Label>
                  </HelpTooltip>
                </div>
              </FormField>
            )}

            {/* Responses API Toggle for LM Studio */}
            {localModel.provider === ChatModelProviders.LM_STUDIO && (
              <FormField label="Responses 接口">
                <div className="tw-flex tw-items-center tw-gap-2">
                  <Checkbox
                    id="use-responses-api"
                    checked={localModel.useResponsesApi !== false}
                    onCheckedChange={(checked) => handleLocalUpdate("useResponsesApi", checked)}
                  />
                  <HelpTooltip
                    content={
                      <div className="tw-text-sm tw-text-muted">
                        使用 /v1/responses 代替 /v1/chat/completions，用于修复 LM Studio 的兼容问题（text.format、工具定义）。需要 LM Studio 0.3.6 或更高版本。
                      </div>
                    }
                  >
                    <Label htmlFor="use-responses-api" className="tw-cursor-pointer tw-text-sm">
                      使用 Responses 接口（推理更快）
                    </Label>
                  </HelpTooltip>
                </div>
              </FormField>
            )}

            {/* Model Parameters Editor */}
            <ModelParametersEditor
              model={localModel}
              settings={settings}
              onChange={handleLocalUpdate}
              onReset={handleLocalReset}
              showTokenLimit={true}
            />
          </>
        )}
      </div>

      <div className="tw-mt-6 tw-flex tw-justify-end tw-gap-2 tw-border-t tw-border-border tw-pt-4">
        <Button variant="secondary" onClick={onCancel}>
          关闭
        </Button>
      </div>
    </div>
  );
};

export class ModelEditModal extends Modal {
  private root: Root;

  constructor(
    app: App,
    private model: CustomModel,
    private isEmbeddingModel: boolean,
    private onUpdate: (
      isEmbeddingModel: boolean,
      originalModel: CustomModel,
      updatedModel: CustomModel
    ) => void
  ) {
    super(app);
    // @ts-ignore
    this.setTitle(`模型设置 - ${this.model.name}`);
  }

  onOpen() {
    const { contentEl, modalEl } = this;
    // It occupies only 80% of the height, leaving a clickable blank area to prevent the close icon from malfunctioning.
    if (Platform.isMobile) {
      modalEl.style.height = "80%";
    }
    this.root = createRoot(contentEl);

    const handleUpdate = (
      isEmbeddingModel: boolean,
      originalModel: CustomModel,
      updatedModel: CustomModel
    ) => {
      this.onUpdate(isEmbeddingModel, originalModel, updatedModel);
    };

    const handleCancel = () => {
      this.close();
    };

    this.root.render(
      <ModelEditModalContent
        model={this.model}
        isEmbeddingModel={this.isEmbeddingModel}
        onUpdate={handleUpdate}
        onCancel={handleCancel}
      />
    );
  }

  onClose() {
    this.root.unmount();
  }
}
