import { CopilotPlusWelcomeModal } from "@/components/modals/CopilotPlusWelcomeModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { PLUS_UTM_MEDIUMS } from "@/constants";
import { checkIsPlusUser, navigateToPlusPage, useIsPlusUser } from "@/plusUtils";
import { updateSetting, useSettingsValue } from "@/settings/model";
import { ExternalLink, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";

export function PlusSettings() {
  const settings = useSettingsValue();
  const [error, setError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const isPlusUser = useIsPlusUser();
  const [localLicenseKey, setLocalLicenseKey] = useState(settings.plusLicenseKey);
  useEffect(() => {
    setLocalLicenseKey(settings.plusLicenseKey);
  }, [settings.plusLicenseKey]);

  return (
    <section className="tw-flex tw-flex-col tw-gap-4 tw-rounded-lg tw-bg-secondary tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-text-xl tw-font-bold">
        <span>Copilot Plus</span>
        {isPlusUser && (
          <Badge variant="outline" className="tw-text-success">
            已激活
          </Badge>
        )}
      </div>
      <div className="tw-flex tw-flex-col tw-gap-2 tw-text-sm tw-text-muted">
        <div>
          Copilot Plus 用更强的 AI 能力提升 Obsidian 体验。这个付费层级解锁高级功能：
          <strong>
            包括对话上下文、PDF 与图片支持、网页搜索、专属对话和向量模型等。
          </strong>
        </div>
        <div>Copilot Plus 更新很快，新功能和改进会持续推出。现在加入可以锁定较低价格并抢先体验。</div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-2">
        <PasswordInput
          className="tw-w-full"
          placeholder="输入许可证密钥"
          value={localLicenseKey}
          onChange={(value) => {
            setLocalLicenseKey(value);
          }}
        />
        <Button
          disabled={isChecking}
          onClick={async () => {
            updateSetting("plusLicenseKey", localLicenseKey);
            setIsChecking(true);
            const result = await checkIsPlusUser();
            setIsChecking(false);
            if (!result) {
              setError("许可证密钥无效");
            } else {
              setError(null);
              new CopilotPlusWelcomeModal(app).open();
            }
          }}
          className="tw-min-w-10 tw-text-xs md:tw-text-sm"
        >
          {isChecking ? <Loader2 className="tw-size-2 tw-animate-spin md:tw-size-4" /> : "应用"}
        </Button>
        <Button
          className="tw-text-xs md:tw-text-sm"
          variant="secondary"
          onClick={() => navigateToPlusPage(PLUS_UTM_MEDIUMS.SETTINGS)}
        >
          立即加入 <ExternalLink className="tw-size-2 md:tw-size-4" />
        </Button>
      </div>
      <div className="tw-text-error">{error}</div>
    </section>
  );
}
