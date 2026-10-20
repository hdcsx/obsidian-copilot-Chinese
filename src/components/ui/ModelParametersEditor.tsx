import React from "react";
import { CustomModel } from "@/aiParams";
import { FormField } from "@/components/ui/form-field";
import { ParameterControl } from "@/components/ui/parameter-controls";
import {
  ChatModelProviders,
  DEFAULT_MODEL_SETTING,
  DEFAULT_OLLAMA_NUM_CTX,
  ModelCapability,
  ReasoningEffort,
} from "@/constants";
import { CopilotSettings } from "@/settings/model";
import {
  getDefaultReasoningEffort,
  getDefaultVerbosity,
  REASONING_EFFORT_OPTIONS,
  VERBOSITY_OPTIONS,
} from "@/utils/modelParamsHelper";

/**
 * Parameter range configuration
 */
const PARAM_RANGES = {
  temperature: { min: 0, max: 2, step: 0.01, default: DEFAULT_MODEL_SETTING.TEMPERATURE },
  topP: { min: 0, max: 1, step: 0.05, default: 0.9 },
  frequencyPenalty: { min: 0, max: 2, step: 0.05, default: 0 },
  maxTokens: { min: 100, max: 128000, step: 100, default: DEFAULT_MODEL_SETTING.MAX_TOKENS },
  numCtx: { min: 0, max: DEFAULT_OLLAMA_NUM_CTX, step: 1024, default: DEFAULT_OLLAMA_NUM_CTX },
};

interface ModelParametersEditorProps {
  model: CustomModel;
  settings: CopilotSettings;
  onChange: (field: keyof CustomModel, value: any) => void;
  onReset?: (field: keyof CustomModel) => void;
  showTokenLimit?: boolean; // Whether to show Token limit, defaults to true
}

/**
 * Shared model parameters editor component.
 * Used by ChatSettingsPopover and ModelEditDialog.
 */
export function ModelParametersEditor({
  model,
  settings,
  onChange,
  onReset,
  showTokenLimit = true,
}: ModelParametersEditorProps) {
  const isOllamaModel = model.provider === ChatModelProviders.OLLAMA;

  // Parameter values: model.xxx ?? settings.xxx
  const temperature = model.temperature ?? settings.temperature;
  const maxTokens = model.maxTokens ?? settings.maxTokens;
  const topP = model.topP;
  const frequencyPenalty = model.frequencyPenalty;
  // Reason: Ollama defaults to a small num_ctx (2048), so we default to 131072
  // for backward compatibility. Users can adjust via slider.
  const numCtx = isOllamaModel ? (model.numCtx ?? PARAM_RANGES.numCtx.default) : model.numCtx;
  const reasoningEffort = model.reasoningEffort;
  const verbosity = model.verbosity;

  // Check if this is an OpenAI native reasoning model
  const isOpenAIReasoningModel =
    (model.name.startsWith("o1") ||
      model.name.startsWith("o3") ||
      model.name.startsWith("o4") ||
      model.name.startsWith("gpt-5")) &&
    model.provider === ChatModelProviders.OPENAI;

  // Check if model has REASONING capability enabled
  const hasReasoningCapability = model.capabilities?.includes(ModelCapability.REASONING) ?? false;

  // Show reasoning effort for: OpenAI reasoning models, OpenRouter, LM Studio, or any model with REASONING capability
  const showReasoningEffort =
    isOpenAIReasoningModel ||
    model.provider === ChatModelProviders.OPENROUTERAI ||
    model.provider === "lm_studio" ||
    model.provider === ChatModelProviders.LM_STUDIO ||
    hasReasoningCapability;
  const showVerbosity = model.name.startsWith("gpt-5") && model.provider === ChatModelProviders.OPENAI;

  return (
    <div className="tw-space-y-4">
      {/* Token limit */}
      {showTokenLimit && (
        <FormField>
          <ParameterControl
            type="slider"
            optional={false}
            label="输出长度上限"
            value={maxTokens}
            onChange={(value) => onChange("maxTokens", value)}
            max={PARAM_RANGES.maxTokens.max}
            min={PARAM_RANGES.maxTokens.min}
            step={PARAM_RANGES.maxTokens.step}
            defaultValue={PARAM_RANGES.maxTokens.default}
            helpText={
              <>
                <p>
                  模型最多生成的<em>输出 token</em>数量。默认是{" "}
                  {PARAM_RANGES.maxTokens.default}。
                </p>
                <em>
                  这个数值加上提示词长度（输入 token）必须小于模型的上下文窗口。
                </em>
              </>
            }
          />
        </FormField>
      )}

      {/* num_ctx - Ollama only */}
      {isOllamaModel && (
        <FormField>
          <ParameterControl
            type="slider"
            optional={false}
            label="num_ctx"
            value={numCtx}
            onChange={(value) => onChange("numCtx", value)}
            min={PARAM_RANGES.numCtx.min}
            max={PARAM_RANGES.numCtx.max}
            step={PARAM_RANGES.numCtx.step}
            defaultValue={PARAM_RANGES.numCtx.default}
            helpText={
              <>
                <p>
                  发送给 Ollama 的 <code>num_ctx</code> 参数，控制模型可用的上下文 token 数量。默认是 {DEFAULT_OLLAMA_NUM_CTX}。
                </p>
                <em>
                  显存不足时可以调低。Ollama 会把它限制在模型实际支持的最大值以内。
                </em>
              </>
            }
          />
        </FormField>
      )}

      {/* Temperature */}
      <FormField>
        <ParameterControl
          type="slider"
          optional={false}
          label="温度"
          value={temperature}
          onChange={(value) => onChange("temperature", value)}
          min={PARAM_RANGES.temperature.min}
          max={PARAM_RANGES.temperature.max}
          step={PARAM_RANGES.temperature.step}
          defaultValue={PARAM_RANGES.temperature.default}
          helpText={`默认是 ${PARAM_RANGES.temperature.default}。数值越高越有创造性，但也更容易出错。设为 0 则不加入随机性。`}
        />
      </FormField>

      {/* Top-P */}
      <FormField>
        <ParameterControl
          type="slider"
          optional={true}
          label="核采样"
          value={topP}
          onChange={(value) => onChange("topP", value)}
          disableFn={onReset ? () => onReset("topP") : undefined}
          min={PARAM_RANGES.topP.min}
          max={PARAM_RANGES.topP.max}
          step={PARAM_RANGES.topP.step}
          defaultValue={PARAM_RANGES.topP.default}
          helpText={`默认是 ${PARAM_RANGES.topP.default}。数值越小，回答变化越少、越容易理解；数值越大，用词范围越广、内容越多样。`}
        />
      </FormField>

      {/* Frequency Penalty */}
      <FormField>
        <ParameterControl
          type="slider"
          optional={true}
          label="重复惩罚"
          value={frequencyPenalty}
          onChange={(value) => onChange("frequencyPenalty", value)}
          disableFn={onReset ? () => onReset("frequencyPenalty") : undefined}
          min={PARAM_RANGES.frequencyPenalty.min}
          max={PARAM_RANGES.frequencyPenalty.max}
          step={PARAM_RANGES.frequencyPenalty.step}
          defaultValue={PARAM_RANGES.frequencyPenalty.default}
          helpText={
            <>
              <p>
                这个参数要求模型避免重复对话中已经多次出现的词语。
              </p>
              <em>数值越高，模型重复用词时受到的惩罚越大。</em>
            </>
          }
        />
      </FormField>

      {/* Reasoning Effort - For models with reasoning capability */}
      {showReasoningEffort && (
        <FormField>
          <ParameterControl
            type="select"
            optional={true}
            label="推理强度"
            value={reasoningEffort}
            onChange={(value) => onChange("reasoningEffort", value)}
            disableFn={onReset ? () => onReset("reasoningEffort") : undefined}
            defaultValue={settings.reasoningEffort ?? getDefaultReasoningEffort()}
            options={[
              ...(model.name.startsWith("gpt-5") && model.provider === "openai"
                ? [{ value: ReasoningEffort.MINIMAL, label: "最低" }]
                : []),
              ...REASONING_EFFORT_OPTIONS.filter(
                (opt) =>
                  opt.value !== ReasoningEffort.MINIMAL && opt.value !== ReasoningEffort.XHIGH
              ),
              ...(model.name.startsWith("gpt-5.4") && model.provider === "openai"
                ? [{ value: ReasoningEffort.XHIGH, label: "极高" }]
                : []),
            ]}
            helpText={
              <>
                <p>
                  控制模型投入多少推理。强度越高，推理越充分，但耗时也越长。
                </p>
                <ul className="tw-mt-2 tw-space-y-1 tw-text-xs">
                  {model.name.startsWith("gpt-5") && model.provider === "openai" && (
                    <li>最低：回答最快，推理最少（仅 GPT-5）</li>
                  )}
                  <li>低：回答较快，基础推理（默认）</li>
                  <li>中：速度和质量较均衡</li>
                  <li>高：推理更充分，回答更慢</li>
                  {model.name.startsWith("gpt-5.4") && model.provider === "openai" && (
                    <li>极高：最大推理深度（仅 GPT-5.4）</li>
                  )}
                </ul>
                {!hasReasoningCapability && !isOpenAIReasoningModel && (
                  <p className="tw-mt-2 tw-text-warning">
                    请先在上方启用「推理」能力，才能使用这项。
                  </p>
                )}
              </>
            }
          />
        </FormField>
      )}

      {/* Verbosity - Only for GPT-5 models */}
      {showVerbosity && (
        <FormField>
          <ParameterControl
            type="select"
            optional={true}
            label="详细程度"
            value={verbosity}
            onChange={(value) => onChange("verbosity", value)}
            disableFn={onReset ? () => onReset("verbosity") : undefined}
            defaultValue={settings.verbosity ?? getDefaultVerbosity()}
            options={VERBOSITY_OPTIONS}
            helpText={
              <>
                <p>控制回答的长度和详细程度。</p>
                <ul className="tw-mt-2 tw-space-y-1 tw-text-xs">
                  <li>低：简洁、简短</li>
                  <li>中：详略适中</li>
                  <li>高：详细、完整</li>
                </ul>
              </>
            }
          />
        </FormField>
      )}
    </div>
  );
}
