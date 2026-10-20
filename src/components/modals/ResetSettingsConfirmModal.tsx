import { ConfirmModal } from "@/components/modals/ConfirmModal";
import { App } from "obsidian";

export class ResetSettingsConfirmModal extends ConfirmModal {
  constructor(app: App, onConfirm: () => void) {
    super(
      app,
      onConfirm,
      "重置会清除全部设置并恢复默认值。你已修改的自定义设置（包括 API 密钥）都会丢失。确定要继续吗？",
      "重置设置"
    );
  }
}
