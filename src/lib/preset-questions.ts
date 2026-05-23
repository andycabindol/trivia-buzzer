import type { Question } from "./types";
import { v4 as uuidv4 } from "uuid";
import rawQuestions from "@/data/questions.json";

/** Shape for each entry in src/data/questions.json */
export type PresetQuestionInput = {
  text: string;
  answer?: string;
  points?: number;
  /** Filename in public/questions/ (e.g. "andy.jpg") or path (e.g. "/questions/andy.jpg") */
  image?: string;
};

export function normalizeImageUrl(image?: string): string | undefined {
  if (!image?.trim()) return undefined;
  const trimmed = image.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  if (trimmed.startsWith("/")) return trimmed;
  return `/questions/${trimmed}`;
}

export function presetToQuestion(input: PresetQuestionInput): Omit<Question, "id"> {
  return {
    text: input.text.trim(),
    answer: input.answer?.trim() || undefined,
    points: input.points ?? 100,
    imageUrl: normalizeImageUrl(input.image),
  };
}

export function loadPresetQuestionsFromFile(): Omit<Question, "id">[] {
  const list = rawQuestions as PresetQuestionInput[];
  if (!Array.isArray(list)) {
    throw new Error("questions.json must be an array");
  }
  return list
    .filter((q) => q.text?.trim())
    .map(presetToQuestion);
}

export function getPresetQuestionCount(): number {
  return loadPresetQuestionsFromFile().length;
}
