export const modules = [
  {
    id: 'speaking',
    name: 'Speaking',
    questionTypes: [
      { id: 'personal-introduction', name: 'Personal Introduction' },
      { id: 'read-aloud', name: 'Read Aloud' },
      { id: 'repeat-sentence', name: 'Repeat Sentence' },
      { id: 'describe-image', name: 'Describe Image' },
      { id: 'retell-lecture', name: 'Retell Lecture' },
      { id: 'answer-short-question', name: 'Answer Short Question' },
      { id: 'summarize-group-discussion', name: 'Summarize Group Discussion' },
      { id: 'respond-to-a-situation', name: 'Respond to a Situation' },
    ],
  },
  {
    id: 'writing',
    name: 'Writing',
    questionTypes: [
      { id: 'summarize-written-text', name: 'Summarize Written Text' },
      { id: 'write-essay', name: 'Write Essay' },
    ],
  },
  {
    id: 'reading',
    name: 'Reading',
    questionTypes: [
      { id: 'reading-fill-blanks-dropdown', name: 'Fill in the Blanks (Dropdown)' },
      { id: 'reading-mcma', name: 'Multiple Choice, Multiple Answers' },
      { id: 'reorder-paragraph', name: 'Reorder Paragraph' },
      { id: 'reading-fill-blanks-drag', name: 'Fill in the Blanks (Drag and Drop)' },
      { id: 'reading-mcsa', name: 'Multiple Choice, Single Answer' },
    ],
  },
  {
    id: 'listening',
    name: 'Listening',
    questionTypes: [
      { id: 'summarize-spoken-text', name: 'Summarize Spoken Text' },
      { id: 'listening-mcma', name: 'Multiple Choice, Multiple Answers' },
      { id: 'listening-fill-blanks', name: 'Fill in the Blanks (Type In)' },
      { id: 'highlight-correct-summary', name: 'Highlight Correct Summary' },
      { id: 'listening-mcsa', name: 'Multiple Choice, Single Answer' },
      { id: 'select-missing-word', name: 'Select Missing Word' },
      { id: 'highlight-incorrect-words', name: 'Highlight Incorrect Words' },
      { id: 'write-from-dictation', name: 'Write from Dictation' },
    ],
  },
];

export const classDefaults = [
  { id: 'class-7-8', name: '7-8' },
  { id: 'class-8-9', name: '8-9' },
  { id: 'class-9-10', name: '9-10' },
  { id: 'class-10-11', name: '10-11' },
];

export const weightageChart = [
  {
    question: 'Read Aloud',
    avgQs: '6-7',
    module: 'Speaking',
    scores: { speaking: 8.0 },
    total: 8.0,
  },
  {
    question: 'Describe Image',
    avgQs: '5-6',
    module: 'Speaking',
    scores: { speaking: 28.0 },
    total: 28.0,
  },
  {
    question: 'Repeat Sentence',
    avgQs: '10-12',
    module: 'Speaking',
    scores: { listening: 15.0, speaking: 14.0 },
    total: 29.0,
  },
  {
    question: 'Re-Tell Lecture',
    avgQs: '2-3',
    module: 'Speaking',
    scores: { listening: 12.0, speaking: 11.0 },
    total: 23.0,
  },
  {
    question: 'Answer Short Question',
    avgQs: '5-6',
    module: 'Speaking',
    scores: { listening: 3.0 },
    total: 3.0,
  },
  {
    question: 'Summarize Group Discussion',
    avgQs: '2-3',
    module: 'Speaking',
    scores: { listening: 18.0, speaking: 17.0 },
    total: 35.0,
  },
  {
    question: 'Respond to a Situation',
    avgQs: '2-3',
    module: 'Speaking',
    scores: { speaking: 12.0 },
    total: 12.0,
  },
  {
    question: 'Summarize Written Text',
    avgQs: '2',
    module: 'Writing',
    scores: { reading: 20.0, writing: 25.0 },
    total: 45.0,
  },
  {
    question: 'Essay',
    avgQs: '1',
    module: 'Writing',
    scores: { writing: 28.0 },
    total: 28.0,
  },
  {
    question: 'Fill in the Blanks (Drop-Down)',
    avgQs: '5-6',
    module: 'Reading',
    scores: { reading: 25.0 },
    total: 25.0,
  },
  {
    question: 'MCQ-Multiple',
    avgQs: '2-3',
    module: 'Reading',
    scores: { reading: 4.0 },
    total: 4.0,
  },
  {
    question: 'Re-order Paragraph',
    avgQs: '2-3',
    module: 'Reading',
    scores: { reading: 8.0 },
    total: 8.0,
  },
  {
    question: 'Fill in the Blanks (Drag & Drop)',
    avgQs: '4-5',
    module: 'Reading',
    scores: { reading: 17.0 },
    total: 17.0,
  },
  {
    question: 'MCQ-Single',
    avgQs: '2-3',
    module: 'Reading',
    scores: { reading: 2.0 },
    total: 2.0,
  },
  {
    question: 'Summarize Spoken Text',
    avgQs: '1',
    module: 'Listening',
    scores: { listening: 9.0, writing: 17.0 },
    total: 26.0,
  },
  {
    question: 'MCQ-Multiple',
    avgQs: '2-3',
    module: 'Listening',
    scores: { listening: 3.0 },
    total: 3.0,
  },
  {
    question: 'Fill in the Blanks (Type In)',
    avgQs: '2-3',
    module: 'Listening',
    scores: { listening: 7.0 },
    total: 7.0,
  },
  {
    question: 'MCQ-Single',
    avgQs: '2-3',
    module: 'Listening',
    scores: { listening: 1.5 },
    total: 1.5,
  },
  {
    question: 'Select Missing Word',
    avgQs: '1-2',
    module: 'Listening',
    scores: { listening: 1.0 },
    total: 1.0,
  },
  {
    question: 'Highlight Correct Summary',
    avgQs: '2-3',
    module: 'Listening',
    scores: { listening: 1.5, reading: 2.0 },
    total: 3.5,
  },
  {
    question: 'Highlight Incorrect Words',
    avgQs: '2-3',
    module: 'Listening',
    scores: { listening: 7.0, reading: 12.0 },
    total: 19.0,
  },
  {
    question: 'Write from Dictation',
    avgQs: '3-4',
    module: 'Listening',
    scores: { listening: 12.0, writing: 20.0 },
    total: 32.0,
  },
];

const normalizeQuestionName = (value) =>
  value.toLowerCase().replace(/[^a-z0-9]/g, '');

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `session-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const questionTypeIdToModuleId = new Map(
  modules.flatMap((module) =>
    module.questionTypes.map((questionType) => [questionType.id, module.id])
  )
);

const questionTypeNameToId = new Map(
  modules.flatMap((module) =>
    module.questionTypes.map((questionType) => [
      `${normalizeQuestionName(questionType.name)}|${module.id}`,
      questionType.id,
    ])
  )
);

const questionTypeAliases = new Map([
  ['essay|writing', 'write-essay'],
  ['mcqmultiple|reading', 'reading-mcma'],
  ['mcqsingle|reading', 'reading-mcsa'],
  ['fillintheblanksdragdrop|reading', 'reading-fill-blanks-drag'],
  ['mcqmultiple|listening', 'listening-mcma'],
  ['mcqsingle|listening', 'listening-mcsa'],
  ['fillintheblanks|listening', 'listening-fill-blanks'],
  ['selectmissingword|listening', 'select-missing-word'],
]);

const moduleNameToId = {
  Speaking: 'speaking',
  Writing: 'writing',
  Reading: 'reading',
  Listening: 'listening',
};

const weightageEntries = weightageChart
  .map((entry) => ({
    ...entry,
    questionTypeId: null,
  }))
  .map((entry) => {
    const moduleId = moduleNameToId[entry.module] || 'speaking';
    const key = `${normalizeQuestionName(entry.question)}|${moduleId}`;
    const questionTypeId = questionTypeNameToId.get(key) || questionTypeAliases.get(key);
    return {
      ...entry,
      questionTypeId,
    };
  })
  .map((entry) => ({
    ...entry,
    originModuleId: entry.questionTypeId
      ? questionTypeIdToModuleId.get(entry.questionTypeId)
      : null,
  }))
  .filter((entry) => entry.questionTypeId && entry.originModuleId);

const allQuestionTypeIds = modules.flatMap((module) =>
  module.questionTypes.map((questionType) => questionType.id)
);

export const buildDefaultState = () => {
  const coverage = {};
  const sessions = {};

  classDefaults.forEach((classItem) => {
    coverage[classItem.id] = {};
    allQuestionTypeIds.forEach((questionTypeId) => {
      coverage[classItem.id][questionTypeId] = false;
    });
    sessions[classItem.id] = [];
  });

  return {
    classes: classDefaults.map((classItem) => ({ ...classItem })),
    coverage,
    sessions,
  };
};

const normalizeClasses = (classes) => {
  const fallback = classDefaults.map((classItem) => ({ ...classItem }));
  if (!Array.isArray(classes)) {
    return fallback;
  }

  const defaultNameById = new Map(classDefaults.map((classItem) => [classItem.id, classItem.name]));
  const normalized = [];
  const seen = new Set();

  classes.forEach((classItem) => {
    if (!classItem || typeof classItem !== 'object') {
      return;
    }
    const name = classItem.name || defaultNameById.get(classItem.id);
    if (!classItem.id || !name || seen.has(classItem.id)) {
      return;
    }
    normalized.push({ id: classItem.id, name });
    seen.add(classItem.id);
  });

  return normalized.length ? normalized : fallback;
};

const writingQuestionTypeIds = new Set(
  modules.find((module) => module.id === 'writing').questionTypes.map((item) => item.id)
);

const normalizeSessionModuleId = (moduleId, questionTypeIds) => {
  if (modules.some((module) => module.id === moduleId)) {
    return moduleId;
  }
  if (moduleId === 'speaking-writing') {
    const hasWriting = questionTypeIds.some((id) => writingQuestionTypeIds.has(id));
    return hasWriting ? 'writing' : 'speaking';
  }
  return 'speaking';
};

export const normalizeState = (state) => {
  const safeState = state && typeof state === 'object' ? state : {};
  const normalizedClasses = normalizeClasses(safeState.classes);
  const coverage = {};
  const sessions = {};

  normalizedClasses.forEach((classItem) => {
    coverage[classItem.id] = {};
    allQuestionTypeIds.forEach((questionTypeId) => {
      const existingValue =
        safeState.coverage &&
        safeState.coverage[classItem.id] &&
        typeof safeState.coverage[classItem.id][questionTypeId] === 'boolean'
          ? safeState.coverage[classItem.id][questionTypeId]
          : false;
      coverage[classItem.id][questionTypeId] = existingValue;
    });

    const existingSessions =
      safeState.sessions && Array.isArray(safeState.sessions[classItem.id])
        ? safeState.sessions[classItem.id]
        : [];

    sessions[classItem.id] = existingSessions
      .map((session) => {
        if (!session || typeof session !== 'object') {
          return null;
        }

        const questionTypeIds = Array.isArray(session.questionTypeIds)
          ? session.questionTypeIds.filter((id) => allQuestionTypeIds.includes(id))
          : [];

        return {
          id: session.id || createSessionId(),
          date: session.date || new Date().toISOString().slice(0, 10),
          moduleId: normalizeSessionModuleId(session.moduleId, questionTypeIds),
          questionTypeIds,
          note: session.note || '',
        };
      })
      .filter(Boolean);
  });

  return {
    classes: normalizedClasses,
    coverage,
    sessions,
  };
};

export const mergeStates = (remoteState, localState) => {
  const normalizedRemote = normalizeState(remoteState);
  const normalizedLocal = normalizeState(localState);
  const coverage = {};
  const sessions = {};

  normalizedLocal.classes.forEach((classItem) => {
    coverage[classItem.id] = {};
    allQuestionTypeIds.forEach((questionTypeId) => {
      coverage[classItem.id][questionTypeId] =
        normalizedLocal.coverage[classItem.id][questionTypeId] ??
        normalizedRemote.coverage[classItem.id][questionTypeId] ??
        false;
    });

    const mergedSessions = new Map();
    normalizedRemote.sessions[classItem.id].forEach((session) => {
      mergedSessions.set(session.id, session);
    });
    normalizedLocal.sessions[classItem.id].forEach((session) => {
      mergedSessions.set(session.id, session);
    });
    sessions[classItem.id] = Array.from(mergedSessions.values()).sort((a, b) =>
      a.date.localeCompare(b.date)
    );
  });

  return {
    classes: normalizedLocal.classes,
    coverage,
    sessions,
  };
};

export const getModuleById = (moduleId) =>
  modules.find((module) => module.id === moduleId) || modules[0];

export const getModuleIdByQuestionTypeId = (questionTypeId) =>
  questionTypeIdToModuleId.get(questionTypeId);

export const getQuestionTypeById = (questionTypeId) =>
  modules.flatMap((module) => module.questionTypes).find((item) => item.id === questionTypeId);

export const getAllQuestionTypes = () => modules.flatMap((module) => module.questionTypes);

const forcedEntriesBySkill = {
  writing: new Set([normalizeQuestionName('Summarize Spoken Text')]),
  listening: new Set([
    normalizeQuestionName('Highlight Incorrect Words'),
    normalizeQuestionName('Fill in the Blanks (Type In)'),
  ]),
};

const getTopEntriesForSkillTarget = (skill, target = 72) => {
  const forcedNames = forcedEntriesBySkill[skill] || new Set();
  const forcedEntries = weightageEntries.filter((entry) =>
    forcedNames.has(normalizeQuestionName(entry.question))
  );
  const entries = weightageEntries
    .filter((entry) => entry.scores[skill])
    .filter((entry) => !forcedNames.has(normalizeQuestionName(entry.question)))
    .sort((a, b) => b.scores[skill] - a.scores[skill]);

  if (!entries.length) {
    return forcedEntries;
  }

  const result = [...forcedEntries];
  let runningTotal = forcedEntries.reduce((sum, entry) => sum + (entry.scores[skill] || 0), 0);

  for (const entry of entries) {
    result.push(entry);
    runningTotal += entry.scores[skill];
    if (runningTotal >= target) {
      break;
    }
  }

  return result;
};

export const getCoverageEntriesForSkill = (skill, target = 72) =>
  getTopEntriesForSkillTarget(skill, target);

export const getCoverageQuestionTypeIdsForSkill = (skill, target = 72) =>
  getTopEntriesForSkillTarget(skill, target).map((entry) => entry.questionTypeId);

