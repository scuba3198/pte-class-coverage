import { z } from "zod";

/**
 * Schema for a single communicative skill.
 */
export const SkillKeySchema = z.enum(["speaking", "writing", "reading", "listening"]);
export type SkillKey = z.infer<typeof SkillKeySchema>;

/**
 * Schema for scores keyed by communicative skill.
 */
export const SkillScoresSchema = z.record(SkillKeySchema, z.number());
export type SkillScores = z.infer<typeof SkillScoresSchema>;

/**
 * Schema for a single PTE question type.
 */
export const QuestionTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

/**
 * Schema for a PTE exam module.
 */
export const ModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  questionTypes: z.array(QuestionTypeSchema),
});
export type Module = z.infer<typeof ModuleSchema>;

/**
 * Schema for a class time-slot.
 */
export const ClassItemSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type ClassItem = z.infer<typeof ClassItemSchema>;

/**
 * Schema for one row in the score-weightage chart.
 */
export const WeightageEntrySchema = z.object({
  question: z.string(),
  avgQs: z.string(),
  module: z.string(),
  scores: SkillScoresSchema,
  total: z.number(),
});
export type WeightageEntry = z.infer<typeof WeightageEntrySchema>;

/**
 * Schema for resolved weightage entry with linked question-type.
 */
export const ResolvedWeightageEntrySchema = WeightageEntrySchema.extend({
  questionTypeId: z.string().optional(),
  originModuleId: z.string().optional(),
});
export type ResolvedWeightageEntry = z.infer<typeof ResolvedWeightageEntrySchema>;

/**
 * Schema for a recorded class session.
 */
export const SessionSchema = z.object({
  id: z.string(),
  date: z.string(),
  moduleId: z.string(),
  questionTypeIds: z.array(z.string()),
  note: z.string(),
});
export type Session = z.infer<typeof SessionSchema>;

/**
 * Schema for per-class coverage mapping.
 */
export const CoverageMapSchema = z.record(z.string(), z.record(z.string(), z.boolean()));
export type CoverageMap = z.infer<typeof CoverageMapSchema>;

/**
 * Schema for per-class session history.
 */
export const SessionMapSchema = z.record(z.string(), z.array(SessionSchema));
export type SessionMap = z.infer<typeof SessionMapSchema>;

/**
 * The full application state schema.
 */
export const AppStateSchema = z.object({
  classes: z.array(ClassItemSchema),
  coverage: CoverageMapSchema,
  sessions: SessionMapSchema,
});
export type AppState = z.infer<typeof AppStateSchema>;

/**
 * Schema for accumulated score totals.
 */
export const WeightageTotalsSchema = z.object({
  listening: z.number(),
  speaking: z.number(),
  reading: z.number(),
  writing: z.number(),
  total: z.number(),
});
export type WeightageTotals = z.infer<typeof WeightageTotalsSchema>;
