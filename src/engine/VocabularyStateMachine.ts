import {
  VocabularyStateItem,
  VocabularyRetentionState,
  SpacedRepetitionConfig,
  DEFAULT_SRS_CONFIG,
  VocabularyItem,
} from '../types';

const STORAGE_KEY = 'vocabularyStates';

export function createVocabularyState(
  vocab: VocabularyItem,
  initialState: VocabularyRetentionState = 'active_focus'
): VocabularyStateItem {
  return {
    vocabularyId: vocab.id,
    word: vocab.word,
    translation: vocab.translation,
    retentionState: initialState,
    sessionCount: 0,
    correctUsesCurrentSession: 0,
    lastReviewedSession: 0,
    totalCorrectUses: 0,
    totalAttempts: 0,
    contextVariationsUsed: [],
  };
}

export function loadVocabularyStates(
  languageCode: string
): Record<string, VocabularyStateItem> {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${languageCode}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load vocabulary states:', e);
  }
  return {};
}

export function saveVocabularyStates(
  languageCode: string,
  states: Record<string, VocabularyStateItem>
): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${languageCode}`, JSON.stringify(states));
  } catch (e) {
    console.error('Failed to save vocabulary states:', e);
  }
}

export function getActiveFocus(
  states: Record<string, VocabularyStateItem>,
  maxItems: number = 10
): VocabularyStateItem[] {
  return Object.values(states)
    .filter((item) => item.retentionState === 'active_focus')
    .sort((a, b) => a.correctUsesCurrentSession - b.correctUsesCurrentSession)
    .slice(0, maxItems);
}

export function getReviewQueue(
  states: Record<string, VocabularyStateItem>,
  currentSession: number,
  config: SpacedRepetitionConfig = DEFAULT_SRS_CONFIG
): VocabularyStateItem[] {
  return Object.values(states)
    .filter((item) => {
      if (item.retentionState !== 'review_queue') return false;
      const sessionsSinceReview = currentSession - item.lastReviewedSession;
      return sessionsSinceReview >= config.reviewQueueFrequency;
    })
    .sort((a, b) => a.lastReviewedSession - b.lastReviewedSession);
}

export function getMasteredForSpotCheck(
  states: Record<string, VocabularyStateItem>,
  currentSession: number,
  config: SpacedRepetitionConfig = DEFAULT_SRS_CONFIG,
  maxItems: number = 3
): VocabularyStateItem[] {
  return Object.values(states)
    .filter((item) => {
      if (item.retentionState !== 'mastered') return false;
      const sessionsSinceReview = currentSession - item.lastReviewedSession;
      return sessionsSinceReview >= config.masteredSpotCheckFrequency;
    })
    .sort((a, b) => a.lastReviewedSession - b.lastReviewedSession)
    .slice(0, maxItems);
}

export function recordCorrectUse(
  states: Record<string, VocabularyStateItem>,
  vocabularyId: string,
  context?: string
): { states: Record<string, VocabularyStateItem>; promoted: boolean } {
  const item = states[vocabularyId];
  if (!item) {
    return { states, promoted: false };
  }

  const updatedItem: VocabularyStateItem = {
    ...item,
    correctUsesCurrentSession: item.correctUsesCurrentSession + 1,
    totalCorrectUses: item.totalCorrectUses + 1,
    totalAttempts: item.totalAttempts + 1,
  };

  if (context && !updatedItem.contextVariationsUsed.includes(context)) {
    updatedItem.contextVariationsUsed = [...updatedItem.contextVariationsUsed, context];
  }

  return {
    states: { ...states, [vocabularyId]: updatedItem },
    promoted: false,
  };
}

export function recordIncorrectUse(
  states: Record<string, VocabularyStateItem>,
  vocabularyId: string
): { states: Record<string, VocabularyStateItem>; demoted: boolean } {
  const item = states[vocabularyId];
  if (!item) {
    return { states, demoted: false };
  }

  let demoted = false;
  let newState = item.retentionState;

  if (item.retentionState === 'review_queue') {
    newState = 'active_focus';
    demoted = true;
  } else if (item.retentionState === 'mastered') {
    newState = 'active_focus';
    demoted = true;
  }

  const updatedItem: VocabularyStateItem = {
    ...item,
    retentionState: newState,
    totalAttempts: item.totalAttempts + 1,
    correctUsesCurrentSession: demoted ? 0 : item.correctUsesCurrentSession,
  };

  return {
    states: { ...states, [vocabularyId]: updatedItem },
    demoted,
  };
}

export function processSessionEnd(
  states: Record<string, VocabularyStateItem>,
  currentSession: number,
  config: SpacedRepetitionConfig = DEFAULT_SRS_CONFIG
): {
  states: Record<string, VocabularyStateItem>;
  promotions: string[];
  demotions: string[];
  graduations: string[];
} {
  const promotions: string[] = [];
  const demotions: string[] = [];
  const graduations: string[] = [];
  const updatedStates: Record<string, VocabularyStateItem> = {};

  for (const [id, item] of Object.entries(states)) {
    let newState = item.retentionState;
    let resetSessionCount = item.sessionCount;

    if (item.retentionState === 'active_focus') {
      if (item.correctUsesCurrentSession >= config.correctUsesForPromotion) {
        newState = 'review_queue';
        promotions.push(id);
        resetSessionCount = 0;
      }
    }

    if (item.retentionState === 'review_queue') {
      if (item.correctUsesCurrentSession >= 1) {
        resetSessionCount = item.sessionCount + 1;
        if (resetSessionCount >= config.sessionsForMastery) {
          newState = 'mastered';
          graduations.push(id);
          resetSessionCount = 0;
        }
      }
    }

    updatedStates[id] = {
      ...item,
      retentionState: newState,
      sessionCount: resetSessionCount,
      correctUsesCurrentSession: 0,
      lastReviewedSession: currentSession,
      contextVariationsUsed: [],
    };
  }

  return { states: updatedStates, promotions, demotions, graduations };
}

export function introduceNewVocabulary(
  states: Record<string, VocabularyStateItem>,
  vocabulary: VocabularyItem[],
  maxActiveFocus: number = 10
): {
  states: Record<string, VocabularyStateItem>;
  introduced: string[];
} {
  const currentActiveFocus = getActiveFocus(states).length;
  const availableSlots = maxActiveFocus - currentActiveFocus;

  if (availableSlots <= 0) {
    return { states, introduced: [] };
  }

  const introduced: string[] = [];
  const updatedStates = { ...states };

  for (const vocab of vocabulary) {
    if (introduced.length >= availableSlots) break;
    if (!updatedStates[vocab.id]) {
      updatedStates[vocab.id] = createVocabularyState(vocab);
      introduced.push(vocab.id);
    }
  }

  return { states: updatedStates, introduced };
}

export function getVocabularyStats(
  states: Record<string, VocabularyStateItem>
): {
  activeFocus: number;
  reviewQueue: number;
  mastered: number;
  total: number;
  averageAccuracy: number;
} {
  const items = Object.values(states);
  const activeFocus = items.filter((i) => i.retentionState === 'active_focus').length;
  const reviewQueue = items.filter((i) => i.retentionState === 'review_queue').length;
  const mastered = items.filter((i) => i.retentionState === 'mastered').length;

  const totalAttempts = items.reduce((sum, i) => sum + i.totalAttempts, 0);
  const totalCorrect = items.reduce((sum, i) => sum + i.totalCorrectUses, 0);
  const averageAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  return {
    activeFocus,
    reviewQueue,
    mastered,
    total: items.length,
    averageAccuracy,
  };
}

export function getUnderreviewedItems(
  states: Record<string, VocabularyStateItem>,
  usedThisSession: Record<string, number>,
  minUsesPerSession: number = 2
): VocabularyStateItem[] {
  const activeFocus = getActiveFocus(states);
  return activeFocus.filter((item) => {
    const uses = usedThisSession[item.vocabularyId] || 0;
    return uses < minUsesPerSession;
  });
}
