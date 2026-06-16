import { Schema } from "effect";

/**
 * Branded type for Class ID.
 */
export const ClassIdSchema = Schema.String.pipe(Schema.brand("ClassId"));
export type ClassId = Schema.Schema.Type<typeof ClassIdSchema>;
export const createClassId = (value: string): ClassId =>
  Schema.decodeUnknownSync(ClassIdSchema)(value);

/**
 * Branded type for Module ID.
 */
export const ModuleIdSchema = Schema.String.pipe(Schema.brand("ModuleId"));
export type ModuleId = Schema.Schema.Type<typeof ModuleIdSchema>;
export const createModuleId = (value: string): ModuleId =>
  Schema.decodeUnknownSync(ModuleIdSchema)(value);

/**
 * Branded type for Question Type ID.
 */
export const QuestionTypeIdSchema = Schema.String.pipe(Schema.brand("QuestionTypeId"));
export type QuestionTypeId = Schema.Schema.Type<typeof QuestionTypeIdSchema>;
export const createQuestionTypeId = (value: string): QuestionTypeId =>
  Schema.decodeUnknownSync(QuestionTypeIdSchema)(value);

/**
 * Branded type for Session ID.
 */
export const SessionIdSchema = Schema.String.pipe(Schema.brand("SessionId"));
export type SessionId = Schema.Schema.Type<typeof SessionIdSchema>;
export const createSessionIdPrimitive = (value: string): SessionId =>
  Schema.decodeUnknownSync(SessionIdSchema)(value);

/**
 * Schema for a single communicative skill.
 */
export const SkillKeySchema = Schema.Literal("speaking", "writing", "reading", "listening");
export type SkillKey = Schema.Schema.Type<typeof SkillKeySchema>;

/**
 * Schema for scores keyed by communicative skill.
 */
export const SkillScoresSchema = Schema.Record({ key: SkillKeySchema, value: Schema.Number });
export type SkillScores = Schema.Schema.Type<typeof SkillScoresSchema>;

/**
 * Schema for a single PTE question type.
 */
export const QuestionTypeSchema = Schema.Struct({
  id: QuestionTypeIdSchema,
  name: Schema.String,
});
export type QuestionType = Schema.Schema.Type<typeof QuestionTypeSchema>;

/**
 * Schema for a PTE exam module.
 */
export const ModuleSchema = Schema.Struct({
  id: ModuleIdSchema,
  name: Schema.String,
  questionTypes: Schema.Array(QuestionTypeSchema),
});
export type Module = Schema.Schema.Type<typeof ModuleSchema>;

/**
 * Schema for a class time-slot.
 */
export const ClassItemSchema = Schema.Struct({
  id: ClassIdSchema,
  name: Schema.String,
});
export type ClassItem = Schema.Schema.Type<typeof ClassItemSchema>;

/**
 * Schema for one row in the score-weightage chart.
 */
export const WeightageEntrySchema = Schema.Struct({
  question: Schema.String,
  avgQs: Schema.String,
  module: Schema.String,
  scores: SkillScoresSchema,
  total: Schema.Number,
});
export type WeightageEntry = Schema.Schema.Type<typeof WeightageEntrySchema>;

/**
 * Schema for resolved weightage entry with linked question-type.
 */
export const ResolvedWeightageEntrySchema = Schema.extend(
  WeightageEntrySchema,
  Schema.Struct({
    questionTypeId: Schema.optional(QuestionTypeIdSchema),
    originModuleId: Schema.optional(ModuleIdSchema),
  }),
);
export type ResolvedWeightageEntry = Schema.Schema.Type<typeof ResolvedWeightageEntrySchema>;

/**
 * Schema for a recorded class session.
 */
export const SessionSchema = Schema.Struct({
  id: SessionIdSchema,
  date: Schema.String,
  moduleId: ModuleIdSchema,
  questionTypeIds: Schema.Array(QuestionTypeIdSchema),
  note: Schema.String,
});
export type Session = Schema.Schema.Type<typeof SessionSchema>;

/**
 * Schema for per-class coverage mapping.
 */
export const CoverageMapSchema = Schema.Record({
  key: ClassIdSchema,
  value: Schema.Record({
    key: QuestionTypeIdSchema,
    value: Schema.Boolean,
  }),
});
export type CoverageMap = Schema.Schema.Type<typeof CoverageMapSchema>;

/**
 * Schema for per-class session history.
 */
export const SessionMapSchema = Schema.Record({
  key: ClassIdSchema,
  value: Schema.Array(SessionSchema),
});
export type SessionMap = Schema.Schema.Type<typeof SessionMapSchema>;

/**
 * The full application state schema.
 */
export const AppStateSchema = Schema.Struct({
  classes: Schema.Array(ClassItemSchema),
  coverage: CoverageMapSchema,
  sessions: SessionMapSchema,
});
export type AppState = Schema.Schema.Type<typeof AppStateSchema>;

/**
 * Schema for accumulated score totals.
 */
export const WeightageTotalsSchema = Schema.Struct({
  listening: Schema.Number,
  speaking: Schema.Number,
  reading: Schema.Number,
  writing: Schema.Number,
  total: Schema.Number,
});
export type WeightageTotals = Schema.Schema.Type<typeof WeightageTotalsSchema>;
