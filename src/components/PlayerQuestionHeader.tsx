"use client";

import type { Question } from "@/lib/types";

type Props = {
  question: Question;
};

export function PlayerQuestionHeader({ question }: Props) {
  return (
    <div className="shrink-0 border-b border-neutral-100 px-6 py-4 text-center">
      <p className="text-sm text-neutral-500">{question.points} points</p>
      <p className="mt-2 text-lg font-normal leading-snug text-neutral-800">
        {question.text}
      </p>
    </div>
  );
}
