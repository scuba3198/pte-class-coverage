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
