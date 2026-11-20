import { createModuleId, createQuestionTypeId, type Module } from "../types";

/**
 * The standard PTE modules and their question types.
 */
export const modules: readonly Module[] = [
  {
    id: createModuleId("speaking"),
    name: "Speaking",
    questionTypes: [
      { id: createQuestionTypeId("personal-introduction"), name: "Personal Introduction" },
      { id: createQuestionTypeId("read-aloud"), name: "Read Aloud" },
      { id: createQuestionTypeId("repeat-sentence"), name: "Repeat Sentence" },
      { id: createQuestionTypeId("describe-image"), name: "Describe Image" },
      { id: createQuestionTypeId("retell-lecture"), name: "Retell Lecture" },
      { id: createQuestionTypeId("answer-short-question"), name: "Answer Short Question" },
      {
        id: createQuestionTypeId("summarize-group-discussion"),
        name: "Summarize Group Discussion",
      },
      { id: createQuestionTypeId("respond-to-a-situation"), name: "Respond to a Situation" },
    ],
  },
  {
    id: createModuleId("writing"),
    name: "Writing",
    questionTypes: [
      { id: createQuestionTypeId("summarize-written-text"), name: "Summarize Written Text" },
      { id: createQuestionTypeId("write-essay"), name: "Write Essay" },
    ],
  },
  {
    id: createModuleId("reading"),
    name: "Reading",
    questionTypes: [
      {
        id: createQuestionTypeId("reading-fill-blanks-dropdown"),
        name: "Fill in the Blanks (Dropdown)",
      },
      { id: createQuestionTypeId("reading-mcma"), name: "Multiple Choice, Multiple Answers" },
      { id: createQuestionTypeId("reorder-paragraph"), name: "Reorder Paragraph" },
      {
        id: createQuestionTypeId("reading-fill-blanks-drag"),
        name: "Fill in the Blanks (Drag and Drop)",
      },
      { id: createQuestionTypeId("reading-mcsa"), name: "Multiple Choice, Single Answer" },
    ],
  },
  {
    id: createModuleId("listening"),
    name: "Listening",
    questionTypes: [
      { id: createQuestionTypeId("summarize-spoken-text"), name: "Summarize Spoken Text" },
      { id: createQuestionTypeId("listening-mcma"), name: "Multiple Choice, Multiple Answers" },
      { id: createQuestionTypeId("listening-fill-blanks"), name: "Fill in the Blanks (Type In)" },
      { id: createQuestionTypeId("highlight-correct-summary"), name: "Highlight Correct Summary" },
      { id: createQuestionTypeId("listening-mcsa"), name: "Multiple Choice, Single Answer" },
      { id: createQuestionTypeId("select-missing-word"), name: "Select Missing Word" },
      { id: createQuestionTypeId("highlight-incorrect-words"), name: "Highlight Incorrect Words" },
      { id: createQuestionTypeId("write-from-dictation"), name: "Write from Dictation" },
    ],
  },
];
