import type { Module } from "../types";

/**
 * The standard PTE modules and their question types.
 */
export const modules: readonly Module[] = [
  {
    id: "speaking",
    name: "Speaking",
    questionTypes: [
      { id: "personal-introduction", name: "Personal Introduction" },
      { id: "read-aloud", name: "Read Aloud" },
      { id: "repeat-sentence", name: "Repeat Sentence" },
      { id: "describe-image", name: "Describe Image" },
      { id: "retell-lecture", name: "Retell Lecture" },
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
      { id: "write-essay", name: "Write Essay" },
    ],
  },
  {
    id: "reading",
    name: "Reading",
    questionTypes: [
      { id: "reading-fill-blanks-dropdown", name: "Fill in the Blanks (Dropdown)" },
      { id: "reading-mcma", name: "Multiple Choice, Multiple Answers" },
      { id: "reorder-paragraph", name: "Reorder Paragraph" },
      { id: "reading-fill-blanks-drag", name: "Fill in the Blanks (Drag and Drop)" },
      { id: "reading-mcsa", name: "Multiple Choice, Single Answer" },
    ],
  },
  {
    id: "listening",
    name: "Listening",
    questionTypes: [
      { id: "summarize-spoken-text", name: "Summarize Spoken Text" },
      { id: "listening-mcma", name: "Multiple Choice, Multiple Answers" },
      { id: "listening-fill-blanks", name: "Fill in the Blanks (Type In)" },
      { id: "highlight-correct-summary", name: "Highlight Correct Summary" },
      { id: "listening-mcsa", name: "Multiple Choice, Single Answer" },
      { id: "select-missing-word", name: "Select Missing Word" },
      { id: "highlight-incorrect-words", name: "Highlight Incorrect Words" },
      { id: "write-from-dictation", name: "Write from Dictation" },
    ],
  },
] as const;
