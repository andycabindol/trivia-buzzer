"use client";

import type { Question } from "@/lib/types";

type Props = {
  question: Question;
};

export function PlayerAnswerReveal({ question }: Props) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
      <p className="mb-2 text-sm text-neutral-500">{question.points} pts</p>
      <h1 className="text-4xl font-bold leading-tight text-green-700 md:text-5xl">
        {question.answer}
      </h1>
      {question.imageUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={question.imageUrl}
          alt=""
          className="mx-auto mt-6 max-h-[45vh] w-auto max-w-full rounded-lg object-contain"
        />
      )}
    </div>
  );
}
