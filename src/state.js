export const modules = [
  {
    id: 'speaking-writing',
    name: 'Speaking & Writing',
    questionTypes: [
      { id: 'personal-introduction', name: 'Personal Introduction' },
      { id: 'read-aloud', name: 'Read Aloud' },
      { id: 'repeat-sentence', name: 'Repeat Sentence' },
      { id: 'describe-image', name: 'Describe Image' },
      { id: 'retell-lecture', name: 'Retell Lecture' },
      { id: 'answer-short-question', name: 'Answer Short Question' },
      { id: 'summarize-group-discussion', name: 'Summarize Group Discussion' },
      { id: 'respond-to-a-situation', name: 'Respond to a Situation' },
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

const questionTypeNameToId = new Map(
  modules.flatMap((module) =>
    module.questionTypes.map((questionType) => [
      normalizeQuestionName(questionType.name),
      questionType.id,
    ])
  )
);

const weightageEntries = weightageChart
  .map((entry) => ({
    ...entry,
    questionTypeId: questionTypeNameToId.get(normalizeQuestionName(entry.question)),
  }))
  .filter((entry) => entry.questionTypeId);

const getSkillTotal = (skill) =>
  weightageEntries.reduce((total, entry) => total + (entry.scores[skill] || 0), 0);

export const getTopQuestionTypeIdsBySkill = (skill, threshold = 0.8) => {
  const total = getSkillTotal(skill);
  if (!total) {
    return [];
  }

  const sorted = weightageEntries
    .filter((entry) => entry.scores[skill])
    .sort((a, b) => b.scores[skill] - a.scores[skill]);

  const result = [];
  let runningTotal = 0;
  const target = total * threshold;

  for (const entry of sorted) {
    if (runningTotal >= target) {
      break;
    }
    result.push(entry.questionTypeId);
    runningTotal += entry.scores[skill];
  }

  return result;
};

export const getPriorityQuestionTypeIds = (threshold = 0.8) => {
  const skills = ['listening', 'speaking', 'reading', 'writing'];
  const ids = new Set();

  skills.forEach((skill) => {
    getTopQuestionTypeIdsBySkill(skill, threshold).forEach((id) => ids.add(id));
  });

  return Array.from(ids);
};

export const getPriorityQuestionTypesForModule = (moduleId, threshold = 0.8) => {
  if (moduleId === 'speaking-writing') {
    const ids = new Set([
      ...getTopQuestionTypeIdsBySkill('speaking', threshold),
      ...getTopQuestionTypeIdsBySkill('writing', threshold),
    ]);
    return modules
      .find((module) => module.id === moduleId)
      .questionTypes.filter((questionType) => ids.has(questionType.id));
  }

  const skill = moduleId === 'listening' ? 'listening' : 'reading';
  const ids = new Set(getTopQuestionTypeIdsBySkill(skill, threshold));
  return modules
    .find((module) => module.id === moduleId)
    .questionTypes.filter((questionType) => ids.has(questionType.id));
};

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

  return classDefaults.map((classItem) => {
    const existing = classes.find((item) => item.id === classItem.id);
    return existing ? { ...classItem, name: existing.name || classItem.name } : classItem;
  });
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
          id: session.id || crypto.randomUUID(),
          date: session.date || new Date().toISOString().slice(0, 10),
          moduleId: session.moduleId || 'speaking-writing',
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

export const getQuestionTypeById = (questionTypeId) =>
  modules.flatMap((module) => module.questionTypes).find((item) => item.id === questionTypeId);

export const getAllQuestionTypes = () => modules.flatMap((module) => module.questionTypes);
