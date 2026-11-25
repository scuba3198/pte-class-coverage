import type { ClassItem, Module, WeightageEntry } from "./types";

export const classDefaults: readonly ClassItem[] = [
  { id: "class-7-8", name: "7-8" },
  { id: "class-8-9", name: "8-9" },
  { id: "class-9-10", name: "9-10" },
  { id: "class-10-11", name: "10-11" },
];

export const modules: readonly Module[] = [
  {
    id: "speaking",
    name: "Speaking",
    questionTypes: [
      { id: "personal-introduction", name: "Personal Introduction" },
      { id: "read-aloud", name: "Read Aloud" },
      { id: "repeat-sentence", name: "Repeat Sentence" },
      { id: "describe-image", name: "Describe Image" },
      { id: "retell-lecture", name: "Re-Tell Lecture" },
      { id: "answer-short-question", name: "Answer Short Question" },
      { id: "summarize-group-discussion", name: "Summarize Group Discussion" },
      { id: "respond-to-a-situation", name: "Respond to a Situation" },
    ],
  },
  {
    id: "writing",
    name: "Writing",
    questionTypes: [
      { id: "summarize-written-text", name: "Summarize Written Text" },
      { id: "write-essay", name: "Essay" },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    questionTypes: [
      { id: "reading-fill-blanks-dropdown", name: "Fill in the Blanks (Drop-Down)" },
      { id: "reading-mcma", name: "MCQ-Multiple" },
      { id: "reorder-paragraph", name: "Re-order Paragraph" },
      { id: "reading-fill-blanks-drag", name: "Fill in the Blanks (Drag & Drop)" },
      { id: "reading-mcsa", name: "MCQ-Single" },
    ],
  },
  {
    id: "listening",
    name: "Listening",
    questionTypes: [
      { id: "summarize-spoken-text", name: "Summarize Spoken Text" },
      { id: "listening-mcma", name: "MCQ-Multiple" },
      { id: "listening-fill-blanks", name: "Fill in the Blanks (Type In)" },
      { id: "highlight-correct-summary", name: "Highlight Correct Summary" },
      { id: "listening-mcsa", name: "MCQ-Single" },
      { id: "select-missing-word", name: "Select Missing Word" },
      { id: "highlight-incorrect-words", name: "Highlight Incorrect Words" },
      { id: "write-from-dictation", name: "Write from Dictation" },
    ],
  },
];

/** PTE score weightage chart: marks each question type contributes per skill. */
export const weightageChart: readonly WeightageEntry[] = [
  {
    question: "Read Aloud",
    avgQs: "6-7",
    module: "speaking",
    typeId: "read-aloud",
    scores: {
      speaking: 8,
    },
    total: 8,
  },
  {
    question: "Describe Image",
    avgQs: "5-6",
    module: "speaking",
    typeId: "describe-image",
    scores: {
      speaking: 28,
    },
    total: 28,
  },
  {
    question: "Repeat Sentence",
    avgQs: "10-12",
    module: "speaking",
    typeId: "repeat-sentence",
    scores: {
      listening: 15,
      speaking: 14,
    },
    total: 29,
  },
  {
    question: "Re-Tell Lecture",
    avgQs: "2-3",
    module: "speaking",
    typeId: "retell-lecture",
    scores: {
      listening: 12,
      speaking: 11,
    },
    total: 23,
  },
  {
    question: "Answer Short Question",
    avgQs: "5-6",
    module: "speaking",
    typeId: "answer-short-question",
    scores: {
      listening: 3,
    },
    total: 3,
  },
  {
    question: "Summarize Group Discussion",
    avgQs: "2-3",
    module: "speaking",
    typeId: "summarize-group-discussion",
    scores: {
      listening: 18,
      speaking: 17,
    },
    total: 35,
  },
  {
    question: "Respond to a Situation",
    avgQs: "2-3",
    module: "speaking",
    typeId: "respond-to-a-situation",
    scores: {
      speaking: 12,
    },
    total: 12,
  },
  {
    question: "Summarize Written Text",
    avgQs: "2",
    module: "writing",
    typeId: "summarize-written-text",
    scores: {
      reading: 20,
      writing: 25,
    },
    total: 45,
  },
  {
    question: "Essay",
    avgQs: "1",
    module: "writing",
    typeId: "write-essay",
    scores: {
      writing: 28,
    },
    total: 28,
  },
  {
    question: "Fill in the Blanks (Drop-Down)",
    avgQs: "5-6",
    module: "reading",
    typeId: "reading-fill-blanks-dropdown",
    scores: {
      reading: 25,
    },
    total: 25,
  },
  {
    question: "MCQ-Multiple",
    avgQs: "2-3",
    module: "reading",
    typeId: "reading-mcma",
    scores: {
      reading: 4,
    },
    total: 4,
  },
  {
    question: "Re-order Paragraph",
    avgQs: "2-3",
    module: "reading",
    typeId: "reorder-paragraph",
    scores: {
      reading: 8,
    },
    total: 8,
  },
  {
    question: "Fill in the Blanks (Drag & Drop)",
    avgQs: "4-5",
    module: "reading",
    typeId: "reading-fill-blanks-drag",
    scores: {
      reading: 17,
    },
    total: 17,
  },
  {
    question: "MCQ-Single",
    avgQs: "2-3",
    module: "reading",
    typeId: "reading-mcsa",
    scores: {
      reading: 2,
    },
    total: 2,
  },
  {
    question: "Summarize Spoken Text",
    avgQs: "1",
    module: "listening",
    typeId: "summarize-spoken-text",
    scores: {
      listening: 9,
      writing: 17,
    },
    total: 26,
  },
  {
    question: "MCQ-Multiple",
    avgQs: "2-3",
    module: "listening",
    typeId: "listening-mcma",
    scores: {
      listening: 3,
    },
    total: 3,
  },
  {
    question: "Fill in the Blanks (Type In)",
    avgQs: "2-3",
    module: "listening",
    typeId: "listening-fill-blanks",
    scores: {
      listening: 7,
    },
    total: 7,
  },
  {
    question: "MCQ-Single",
    avgQs: "2-3",
    module: "listening",
    typeId: "listening-mcsa",
    scores: {
      listening: 1.5,
    },
    total: 1.5,
  },
  {
    question: "Select Missing Word",
    avgQs: "1-2",
    module: "listening",
    typeId: "select-missing-word",
    scores: {
      listening: 1,
    },
    total: 1,
  },
  {
    question: "Highlight Correct Summary",
    avgQs: "2-3",
    module: "listening",
    typeId: "highlight-correct-summary",
    scores: {
      listening: 1.5,
      reading: 2,
    },
    total: 3.5,
  },
  {
    question: "Highlight Incorrect Words",
    avgQs: "2-3",
    module: "listening",
    typeId: "highlight-incorrect-words",
    scores: {
      listening: 7,
      reading: 12,
    },
    total: 19,
  },
  {
    question: "Write from Dictation",
    avgQs: "3-4",
    module: "listening",
    typeId: "write-from-dictation",
    scores: {
      listening: 12,
      writing: 20,
    },
    total: 32,
  },
];
