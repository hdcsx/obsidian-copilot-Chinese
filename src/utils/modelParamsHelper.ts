import { DEFAULT_MODEL_SETTING, ReasoningEffort, Verbosity } from "@/constants";

/**
 * Model parameters configuration interface
 */
export interface ModelParams {
  temperature?: number;
  topP?: number;
  frequencyPenalty?: number;
  maxTokens?: number;
  reasoningEffort?: ReasoningEffort;
  verbosity?: Verbosity;
}

/**
 * Reasoning effort options configuration
 */
export const REASONING_EFFORT_OPTIONS = [
  { value: ReasoningEffort.MINIMAL, label: "最低" },
  { value: ReasoningEffort.LOW, label: "低" },
  { value: ReasoningEffort.MEDIUM, label: "中" },
  { value: ReasoningEffort.HIGH, label: "高" },
  { value: ReasoningEffort.XHIGH, label: "极高" },
];

/**
 * Verbosity options configuration
 */
export const VERBOSITY_OPTIONS = [
  { value: Verbosity.LOW, label: "低" },
  { value: Verbosity.MEDIUM, label: "中" },
  { value: Verbosity.HIGH, label: "高" },
];

/**
 * Get the default reasoning effort value
 */
export function getDefaultReasoningEffort(): ReasoningEffort {
  return DEFAULT_MODEL_SETTING.REASONING_EFFORT;
}

/**
 * Get the default verbosity value
 */
export function getDefaultVerbosity(): Verbosity {
  return DEFAULT_MODEL_SETTING.VERBOSITY;
}
