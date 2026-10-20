import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { USER_SENDER } from "@/constants";
import { cn } from "@/lib/utils";
import { ChatMessage } from "@/types/message";
import {
  Check,
  Copy,
  LibraryBig,
  PenSquare,
  RotateCw,
  TextCursorInput,
  Trash2,
} from "lucide-react";
import { Platform } from "obsidian";
import React from "react";

interface ChatButtonsProps {
  message: ChatMessage;
  onCopy: () => void;
  isCopied: boolean;
  onInsertIntoEditor?: () => void;
  onRegenerate?: () => void;
  onEdit?: () => void;
  onDelete: () => void;
  onShowSources?: () => void;
  hasSources: boolean;
}

export const ChatButtons: React.FC<ChatButtonsProps> = ({
  message,
  onCopy,
  isCopied,
  onInsertIntoEditor,
  onRegenerate,
  onEdit,
  onDelete,
  onShowSources,
  hasSources,
}) => {
  return (
    <div
      className={cn("tw-flex tw-gap-1", {
        "group-hover:opacity-100 opacity-0": !Platform.isMobile,
      })}
    >
      {message.sender === USER_SENDER ? (
        <>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost2" size="fit" onClick={onCopy} title="复制">
                {isCopied ? <Check className="tw-size-4" /> : <Copy className="tw-size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>复制</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onEdit} variant="ghost2" size="fit" title="编辑">
                <PenSquare className="tw-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>编辑</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onDelete} variant="ghost2" size="fit" title="删除">
                <Trash2 className="tw-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除</TooltipContent>
          </Tooltip>
        </>
      ) : (
        <>
          {hasSources && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Button onClick={onShowSources} variant="ghost2" size="fit" title="查看来源">
                  <LibraryBig className="tw-size-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>查看来源</TooltipContent>
            </Tooltip>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={onInsertIntoEditor}
                variant="ghost2"
                size="fit"
                title="在光标处插入或替换"
              >
                <TextCursorInput className="tw-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>在光标处插入或替换</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost2" size="fit" onClick={onCopy} title="复制">
                {isCopied ? <Check className="tw-size-4" /> : <Copy className="tw-size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>复制</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onRegenerate} variant="ghost2" size="fit" title="重新生成">
                <RotateCw className="tw-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>重新生成</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button onClick={onDelete} variant="ghost2" size="fit" title="删除">
                <Trash2 className="tw-size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>删除</TooltipContent>
          </Tooltip>
        </>
      )}
    </div>
  );
};
