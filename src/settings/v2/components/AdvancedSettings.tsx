import { Button } from "@/components/ui/button";
import { SettingItem } from "@/components/ui/setting-item";
import { ObsidianNativeSelect } from "@/components/ui/obsidian-native-select";
import { logFileManager } from "@/logFileManager";
import { flushRecordedPromptPayloadToLog } from "@/LLMProviders/chainRunner/utils/promptPayloadRecorder";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { ArrowUpRight, Plus } from "lucide-react";
import React from "react";
import { getPromptFilePath, SystemPromptAddModal } from "@/system-prompts";
import { useSystemPrompts } from "@/system-prompts/state";

export const AdvancedSettings: React.FC = () => {
  const settings = useSettingsValue();
  const prompts = useSystemPrompts();

  // Check if the default system prompt exists in the current prompts list
  const defaultPromptExists = prompts.some(
    (prompt) => prompt.title === settings.defaultSystemPromptTitle
  );

  // Display value: use the default prompt if it exists, otherwise empty string (will show placeholder)
  const displayValue = defaultPromptExists ? settings.defaultSystemPromptTitle : "";

  const handleSelectChange = (value: string) => {
    updateSetting("defaultSystemPromptTitle", value);
  };

  const handleOpenSourceFile = () => {
    if (!displayValue) return;
    const filePath = getPromptFilePath(displayValue);
    // Close the settings modal before opening the file
    (app as any).setting.close();
    app.workspace.openLinkText(filePath, "", true);
  };

  const handleAddPrompt = () => {
    const modal = new SystemPromptAddModal(app, prompts);
    modal.open();
  };

  return (
    <div className="tw-space-y-4">
      {/* User System Prompt Section */}
      <section className="tw-space-y-4 tw-rounded-lg tw-border tw-p-4">
        <h3 className="tw-text-lg tw-font-semibold">用户系统提示词</h3>

        <SettingItem
          type="custom"
          title="默认系统提示词"
          description="为所有消息自定义系统提示词，可能导致意外行为。"
        >
          <div className="tw-flex tw-items-center tw-gap-2">
            <ObsidianNativeSelect
              value={displayValue}
              onChange={(e) => handleSelectChange(e.target.value)}
              options={[
                { label: "无（使用内置提示词）", value: "" },
                ...prompts.map((prompt) => ({
                  label:
                    prompt.title === settings.defaultSystemPromptTitle
                      ? `${prompt.title}（默认）`
                      : prompt.title,
                  value: prompt.title,
                })),
              ]}
              containerClassName="tw-flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={handleOpenSourceFile}
              className="tw-size-5 tw-shrink-0 tw-p-0"
              title="打开源文件"
              disabled={!displayValue}
            >
              <ArrowUpRight className="tw-size-5" />
            </Button>
            <Button variant="default" size="icon" onClick={handleAddPrompt} title="添加提示词">
              <Plus className="tw-size-4" />
            </Button>
          </div>
        </SettingItem>

        <SettingItem
          type="text"
          title="系统提示词文件夹"
          description="存放系统提示词的文件夹。"
          value={settings.userSystemPromptsFolder}
          onChange={(value) => updateSetting("userSystemPromptsFolder", value)}
          placeholder="copilot/system-prompts"
        />
      </section>

      {/* Others Section */}
      <section className="tw-space-y-4 tw-rounded-lg tw-border tw-p-4">
        <h3 className="tw-text-lg tw-font-semibold">其他</h3>

        <SettingItem
          type="switch"
          title="启用加密"
          description="加密保存 API 密钥。"
          checked={settings.enableEncryption}
          onCheckedChange={(checked) => {
            updateSetting("enableEncryption", checked);
          }}
        />

        <SettingItem
          type="switch"
          title="调试模式"
          description="调试模式会向控制台输出一些调试信息。"
          checked={settings.debug}
          onCheckedChange={(checked) => {
            updateSetting("debug", checked);
          }}
        />

        <SettingItem
          type="custom"
          title="创建日志文件"
          description={`打开 Copilot 日志文件（${logFileManager.getLogPath()}），便于反馈问题时分享。`}
        >
          <Button
            variant="secondary"
            size="sm"
            onClick={async () => {
              await flushRecordedPromptPayloadToLog();
              await logFileManager.flush();
              await logFileManager.openLogFile();
            }}
          >
            创建日志文件
          </Button>
        </SettingItem>
      </section>
    </div>
  );
};
