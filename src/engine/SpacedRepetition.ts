import {
  VocabularyStateItem,
  VocabularyItem,
  SpacedRepetitionConfig,
  DEFAULT_SRS_CONFIG,
  SessionState,
} from '../types';
import {
  getActiveFocus,
  getReviewQueue,
  getMasteredForSpotCheck,
} from './VocabularyStateMachine';

export interface SessionVocabularyPlan {
  reviewFirst: VocabularyStateItem[];
  activeFocus: VocabularyStateItem[];
  spotCheck: VocabularyStateItem[];
  newToIntroduce: VocabularyItem[];
}

export function planSessionVocabulary(
  vocabularyStates: Record<string, VocabularyStateItem>,
  availableVocabulary: VocabularyItem[],
  currentSession: number,
  config: SpacedRepetitionConfig = DEFAULT_SRS_CONFIG,
  maxNewItems: number = 2
): SessionVocabularyPlan {
  const activeFocus = getActiveFocus(vocabularyStates, 10);

  const reviewQueue = getReviewQueue(vocabularyStates, currentSession, config);

  const spotCheck = getMasteredForSpotCheck(vocabularyStates, currentSession, config, 3);

  const existingIds = new Set(Object.keys(vocabularyStates));
  const availableSlots = Math.max(0, 10 - activeFocus.length);
  const slotsForNew = Math.min(availableSlots, maxNewItems);

  const newToIntroduce = availableVocabulary
    .filter((v) => !existingIds.has(v.id))
    .slice(0, slotsForNew);

  return {
    reviewFirst: reviewQueue.slice(0, 3),
    activeFocus,
    spotCheck,
    newToIntroduce,
  };
}

export function selectNextVocabularyItem(
  session: SessionState,
  preferUnderreviewed: boolean = true
): VocabularyStateItem | null {
  if (preferUnderreviewed) {
    for (const item of session.activeFocus) {
      const uses = session.vocabularyUsedThisSession[item.vocabularyId] || 0;
      if (uses < 2) {
        return item;
      }
    }
  }

  for (const item of session.reviewQueue) {
    const uses = session.vocabularyUsedThisSession[item.vocabularyId] || 0;
    if (uses < 1) {
      return item;
    }
  }

  const leastUsed = [...session.activeFocus].sort((a, b) => {
    const usesA = session.vocabularyUsedThisSession[a.vocabularyId] || 0;
    const usesB = session.vocabularyUsedThisSession[b.vocabularyId] || 0;
    return usesA - usesB;
  });

  return leastUsed[0] || null;
}

export function getContextVariation(
  _item: VocabularyStateItem,
  usedContexts: string[]
): 'casual' | 'formal' | 'idiomatic' {
  const allContexts: ('casual' | 'formal' | 'idiomatic')[] = [
    'casual',
    'formal',
    'idiomatic',
  ];

  const available = allContexts.filter((c) => !usedContexts.includes(c));

  if (available.length > 0) {
    return available[0];
  }

  return 'casual';
}

export function calculateRecyclingProgress(session: SessionState): {
  itemsFullyCycled: number;
  itemsPartialyCycled: number;
  itemsNotStarted: number;
  overallProgress: number;
} {
  let fully = 0;
  let partial = 0;
  let notStarted = 0;

  for (const item of session.activeFocus) {
    const uses = session.vocabularyUsedThisSession[item.vocabularyId] || 0;
    if (uses >= 3) {
      fully++;
    } else if (uses > 0) {
      partial++;
    } else {
      notStarted++;
    }
  }

  const total = session.activeFocus.length;
  const progress = total > 0 ? (fully * 3 + partial * 1.5) / (total * 3) : 0;

  return {
    itemsFullyCycled: fully,
    itemsPartialyCycled: partial,
    itemsNotStarted: notStarted,
    overallProgress: Math.min(1, progress),
  };
}

export function shouldIntroduceNewVocabulary(
  session: SessionState,
  vocabularyStates: Record<string, VocabularyStateItem>
): boolean {
  const activeFocus = getActiveFocus(vocabularyStates);
  if (activeFocus.length >= 10) {
    return false;
  }

  const recyclingProgress = calculateRecyclingProgress(session);
  if (recyclingProgress.overallProgress < 0.5) {
    return false;
  }

  const recentErrors = session.errorsThisSession.filter(
    (_e) => Date.now() - session.startTime < 5 * 60 * 1000
  );
  if (recentErrors.length > 2) {
    return false;
  }

  return true;
}

export function getItemsNeedingReinforcement(
  session: SessionState,
  minContextVariations: number = 2
): VocabularyStateItem[] {
  return session.activeFocus.filter((item) => {
    const uses = session.vocabularyUsedThisSession[item.vocabularyId] || 0;
    return uses < minContextVariations;
  });
}

export function prioritizeVocabularyForPrompt(
  session: SessionState,
  maxItems: number = 3
): VocabularyStateItem[] {
  const needsReinforcement = getItemsNeedingReinforcement(session);

  if (needsReinforcement.length > 0) {
    return needsReinforcement.slice(0, maxItems);
  }

  return session.activeFocus
    .sort((a, b) => {
      const usesA = session.vocabularyUsedThisSession[a.vocabularyId] || 0;
      const usesB = session.vocabularyUsedThisSession[b.vocabularyId] || 0;
      return usesA - usesB;
    })
    .slice(0, maxItems);
}

export function estimateRetentionStrength(item: VocabularyStateItem): {
  strength: 'weak' | 'developing' | 'strong' | 'stable';
  confidence: number;
} {
  const accuracy =
    item.totalAttempts > 0 ? item.totalCorrectUses / item.totalAttempts : 0;

  if (item.retentionState === 'mastered' && accuracy > 0.9) {
    return { strength: 'stable', confidence: 0.9 };
  }

  if (item.retentionState === 'review_queue' && accuracy > 0.75) {
    return { strength: 'strong', confidence: 0.75 };
  }

  if (accuracy > 0.5) {
    return { strength: 'developing', confidence: 0.6 };
  }

  return { strength: 'weak', confidence: 0.4 };
}

export function getSpacedRepetitionStatus(
  vocabularyStates: Record<string, VocabularyStateItem>
): {
  totalItems: number;
  byState: {
    active_focus: number;
    review_queue: number;
    mastered: number;
  };
  averageAccuracy: number;
  itemsNeedingAttention: string[];
} {
  const items = Object.values(vocabularyStates);

  const byState = {
    active_focus: items.filter((i) => i.retentionState === 'active_focus').length,
    review_queue: items.filter((i) => i.retentionState === 'review_queue').length,
    mastered: items.filter((i) => i.retentionState === 'mastered').length,
  };

  const totalAttempts = items.reduce((sum, i) => sum + i.totalAttempts, 0);
  const totalCorrect = items.reduce((sum, i) => sum + i.totalCorrectUses, 0);
  const averageAccuracy = totalAttempts > 0 ? totalCorrect / totalAttempts : 0;

  const needsAttention = items
    .filter((i) => {
      const accuracy = i.totalAttempts > 0 ? i.totalCorrectUses / i.totalAttempts : 0;
      return i.retentionState === 'active_focus' && accuracy < 0.5 && i.totalAttempts > 2;
    })
    .map((i) => i.vocabularyId);

  return {
    totalItems: items.length,
    byState,
    averageAccuracy,
    itemsNeedingAttention: needsAttention,
  };
}
