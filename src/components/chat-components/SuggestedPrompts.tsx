import { useChainType } from "@/aiParams";
import { ChainType } from "@/chainFactory";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VAULT_VECTOR_STORE_STRATEGY } from "@/constants";
import { useSettingsValue } from "@/settings/model";
import { PlusCircle, TriangleAlert } from "lucide-react";
import React, { useMemo } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface NotePrompt {
  title: string;
  prompts: string[];
}

const SUGGESTED_PROMPTS: Record<string, NotePrompt> = {
  activeNote: {
    title: "当前笔记洞察",
    prompts: [
      `请根据 {activeNote}，用我向你提问的口吻给出三个后续问题。`,
      `{activeNote} 回答了哪些关键问题？`,
      `用两句话快速概括 {activeNote}。`,
    ],
  },
  quoteNote: {
    title: "笔记链接对话",
    prompts: [
      `根据 [[<note>]]，我们下一步应该重点改进什么？`,
      `总结 [[<note>]] 的要点。`,
      `总结 [[<note>]] 的最近更新。`,
      `点评 [[<note>]] 的写作，并给出具体、可执行的反馈`,
    ],
  },
  fun: {
    title: "测试模型",
    prompts: [
      `9.11 和 9.8，哪个更大？`,
      `世界上最长的河流是哪一条？`,
      `如果同时从同一高度丢下一个铅球和一根羽毛，哪个会先落地？`,
    ],
  },
  qaVault: {
    title: "库内问答",
    prompts: [
      `关于 <topic>，我能从自己的笔记中得到哪些洞察？`,
      `根据我保存的笔记解释 <concept>。`,
      `从我的笔记中标出关于 <topic> 的重要细节。`,
      `根据我关于 <topic> 的笔记，我应该问但还没有问的问题是什么？`,
    ],
  },
  copilotPlus: {
    title: "Copilot Plus",
    prompts: [
      `回顾我上周的内容 @vault`,
      `我关于 <topic> 的笔记有哪些要点 @vault`,
      `把 <url> 总结成不超过 10 条要点`,
      `总结 <youtube_video_url>`,
      `@websearch 人工智能行业最近有哪些更新`,
      `这篇论文有哪些关键洞察 <arxiv_url>`,
      `这篇论文提出了哪些新方法 [[<note_with_embedded_pdf>]]`,
    ],
  },
};

const PROMPT_KEYS: Record<ChainType, Array<keyof typeof SUGGESTED_PROMPTS>> = {
  [ChainType.LLM_CHAIN]: ["activeNote", "quoteNote", "fun"],
  [ChainType.VAULT_QA_CHAIN]: ["qaVault", "qaVault", "quoteNote"],
  [ChainType.COPILOT_PLUS_CHAIN]: ["copilotPlus", "copilotPlus", "copilotPlus"],
  [ChainType.PROJECT_CHAIN]: ["copilotPlus", "copilotPlus", "copilotPlus"],
};

function getRandomPrompt(chainType: ChainType = ChainType.LLM_CHAIN) {
  const keys = PROMPT_KEYS[chainType] || PROMPT_KEYS[ChainType.LLM_CHAIN];

  // For repeated keys, shuffle once and take multiple items
  const shuffledPrompts: Record<string, string[]> = {};

  return keys.map((key) => {
    if (!shuffledPrompts[key]) {
      shuffledPrompts[key] = [...SUGGESTED_PROMPTS[key].prompts].sort(() => Math.random() - 0.5);
    }
    return {
      title: SUGGESTED_PROMPTS[key].title,
      text: shuffledPrompts[key].pop() || SUGGESTED_PROMPTS[key].prompts[0],
    };
  });
}

interface SuggestedPromptsProps {
  onClick: (text: string) => void;
}

export const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onClick }) => {
  const [chainType] = useChainType();
  const prompts = useMemo(() => getRandomPrompt(chainType), [chainType]);
  const settings = useSettingsValue();
  const indexVaultToVectorStore = settings.indexVaultToVectorStore as VAULT_VECTOR_STORE_STRATEGY;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <Card className="tw-w-full tw-bg-transparent">
        <CardHeader className="tw-px-2">
          <CardTitle>建议提示词</CardTitle>
        </CardHeader>
        <CardContent className="tw-p-2 tw-pt-0">
          <div className="tw-flex tw-flex-col tw-gap-2">
            {prompts.map((prompt, i) => (
              <div
                key={i}
                className="tw-flex tw-justify-between tw-gap-2 tw-rounded-md tw-border tw-border-solid tw-border-border tw-p-2 tw-text-sm"
              >
                <div className="tw-flex tw-flex-col tw-gap-1">
                  <div className="tw-text-muted">{prompt.title}</div>
                  <div>{prompt.text}</div>
                </div>
                <div className="tw-flex tw-h-full tw-items-start">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost2"
                        size="fit"
                        className="tw-text-muted"
                        onClick={() => onClick(prompt.text)}
                      >
                        <PlusCircle className="tw-size-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>添加到对话</TooltipContent>
                  </Tooltip>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {chainType === ChainType.VAULT_QA_CHAIN && (
        <div className="tw-rounded-md tw-border tw-border-solid tw-border-border tw-p-2 tw-text-sm">
          请注意，这是基于检索的问答。问题应包含笔记库中实际出现的关键词和概念。
        </div>
      )}
      {chainType === ChainType.VAULT_QA_CHAIN &&
        indexVaultToVectorStore === VAULT_VECTOR_STORE_STRATEGY.NEVER && (
          <div className="tw-rounded-md tw-border tw-border-solid tw-border-border tw-p-2 tw-text-sm">
            <div>
              <TriangleAlert className="tw-size-4" /> 自动索引策略已设为{" "}
              <b>从不</b>。继续之前，请点击下方的{" "}
              <span className="tw-text-accent">刷新索引</span> 按钮，或运行{" "}
              <span className="tw-text-accent">Copilot 命令：为问答建立（刷新）笔记库索引</span>
              来更新索引。
            </div>
          </div>
        )}
    </div>
  );
};
