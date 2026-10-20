import { App } from "obsidian";
import { ConfirmModal } from "./ConfirmModal";

export class NewChatConfirmModal extends ConfirmModal {
  constructor(app: App, onConfirm: () => void) {
    super(
      app,
      onConfirm,
      "开始新对话会清空当前对话历史。未保存的消息将会丢失。确定继续吗？",
      "开始新对话"
    );
  }
}
