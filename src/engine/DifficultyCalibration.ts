import {
  DifficultyMetrics,
  DifficultyAdjustment,
  SessionState,
  VocabularyStateItem,
  LearnerProfile,
  ConversationExchange,
} from '../types';

const MAX_COGNITIVE_LOAD_ITEMS = 10;
const HESITATION_THRESHOLD_MS = 5000;
const ACCURACY_THRESHOLD_LOW = 0.5;
const ACCURACY_THRESHOLD_HIGH = 0.85;

export function calculateDifficultyMetrics(
  session: SessionState,
  recentExchanges: number = 5
): DifficultyMetrics {
  const exchanges = session.conversationHistory.slice(-recentExchanges);

  if (exchanges.length === 0) {
    return {
      averageResponseTime: 0,
      recentAccuracyRate: 1,
      hesitationCount: 0,
      cognitiveLoadIndicators: {
        confusionSignals: 0,
        requestsForHelp: 0,
        abandonedAttempts: 0,
      },
    };
  }

  const responseTimes: number[] = [];
  let correctResponses = 0;
  let totalResponses = 0;
  let hesitations = 0;
  let confusionSignals = 0;
  let helpRequests = 0;
  let abandonedAttempts = 0;

  for (let i = 1; i < exchanges.length; i++) {
    const timeDiff = exchanges[i].timestamp - exchanges[i - 1].timestamp;
    responseTimes.push(timeDiff);

    if (timeDiff > HESITATION_THRESHOLD_MS) {
      hesitations++;
    }
  }

  for (const exchange of exchanges) {
    totalResponses++;
    if (exchange.errorsDetected.length === 0) {
      correctResponses++;
    }

    const userMsg = exchange.userMessage.toLowerCase();
    if (
      userMsg.includes('?') ||
      userMsg.includes("don't understand") ||
      userMsg.includes('confused') ||
      userMsg.includes('what does') ||
      userMsg.includes('how do')
    ) {
      confusionSignals++;
    }

    if (
      userMsg.includes('help') ||
      userMsg.includes('hint') ||
      userMsg.includes('explain')
    ) {
      helpRequests++;
    }

    if (userMsg.length < 3 || userMsg === '...' || userMsg === 'idk') {
      abandonedAttempts++;
    }
  }

  const avgResponseTime =
    responseTimes.length > 0
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
      : 0;

  const accuracyRate = totalResponses > 0 ? correctResponses / totalResponses : 1;

  return {
    averageResponseTime: avgResponseTime,
    recentAccuracyRate: accuracyRate,
    hesitationCount: hesitations,
    cognitiveLoadIndicators: {
      confusionSignals,
      requestsForHelp: helpRequests,
      abandonedAttempts,
    },
  };
}

export function assessCognitiveLoad(metrics: DifficultyMetrics): 'low' | 'optimal' | 'high' {
  const { cognitiveLoadIndicators, hesitationCount, recentAccuracyRate } = metrics;

  const stressSignals =
    cognitiveLoadIndicators.confusionSignals +
    cognitiveLoadIndicators.requestsForHelp +
    cognitiveLoadIndicators.abandonedAttempts +
    hesitationCount;

  if (stressSignals >= 3 || recentAccuracyRate < ACCURACY_THRESHOLD_LOW) {
    return 'high';
  }

  if (stressSignals === 0 && recentAccuracyRate > ACCURACY_THRESHOLD_HIGH) {
    return 'low';
  }

  return 'optimal';
}

export function recommendDifficultyAdjustment(
  session: SessionState,
  vocabularyStates: Record<string, VocabularyStateItem>,
  profile: LearnerProfile
): DifficultyAdjustment {
  const metrics = calculateDifficultyMetrics(session);
  const cognitiveLoad = assessCognitiveLoad(metrics);

  const activeFocusCount = Object.values(vocabularyStates).filter(
    (v) => v.retentionState === 'active_focus'
  ).length;

  const currentLevel = activeFocusCount;

  let recommendedLevel = currentLevel;
  let newVariable: DifficultyAdjustment['newVariableToIntroduce'];
  let itemsToRemove: string[] = [];

  switch (cognitiveLoad) {
    case 'high':
      recommendedLevel = Math.max(3, currentLevel - 2);

      const lowestAccuracy = Object.values(vocabularyStates)
        .filter((v) => v.retentionState === 'active_focus')
        .sort((a, b) => {
          const accA = a.totalAttempts > 0 ? a.totalCorrectUses / a.totalAttempts : 0;
          const accB = b.totalAttempts > 0 ? b.totalCorrectUses / b.totalAttempts : 0;
          return accA - accB;
        })
        .slice(0, currentLevel - recommendedLevel)
        .map((v) => v.vocabularyId);

      itemsToRemove = lowestAccuracy;
      break;

    case 'low':
      if (currentLevel < MAX_COGNITIVE_LOAD_ITEMS) {
        recommendedLevel = currentLevel + 1;
        newVariable = determineNextVariable(session, profile);
      }
      break;

    case 'optimal':
    default:
      break;
  }

  return {
    currentLevel,
    recommendedLevel,
    newVariableToIntroduce: newVariable,
    itemsToRemoveFromFocus: itemsToRemove.length > 0 ? itemsToRemove : undefined,
  };
}

function determineNextVariable(
  session: SessionState,
  profile: LearnerProfile
): DifficultyAdjustment['newVariableToIntroduce'] {
  const recentContexts = session.conversationHistory
    .slice(-5)
    .flatMap((e) => e.vocabularyTargeted);

  const contextVariety = new Set(recentContexts).size;

  if (contextVariety < 3) {
    return {
      type: 'context',
      item: selectNewContext(session.currentContext.scenario),
    };
  }

  const level = profile.identity.currentLevel;
  if (['A1', 'A2'].includes(level)) {
    return {
      type: 'word',
      item: 'new vocabulary item',
    };
  }

  if (['B1', 'B2'].includes(level)) {
    return {
      type: 'structure',
      item: 'new grammatical structure',
    };
  }

  return {
    type: 'tense',
    item: 'new tense or aspect',
  };
}

function selectNewContext(currentScenario?: string): string {
  const contexts = ['restaurant', 'travel', 'business', 'social', 'shopping', 'daily'];
  const available = contexts.filter((c) => c !== currentScenario);
  return available[Math.floor(Math.random() * available.length)];
}

export function validateIPlusOne(
  currentPrompt: {
    vocabularyItems: string[];
    newElements: string[];
    grammarStructures: string[];
    contextType: string;
  },
  previousPrompts: Array<typeof currentPrompt>
): {
  valid: boolean;
  violations: string[];
  suggestions: string[];
} {
  const violations: string[] = [];
  const suggestions: string[] = [];

  if (currentPrompt.newElements.length > 1) {
    violations.push(
      `Too many new elements (${currentPrompt.newElements.length}). i+1 allows only 1.`
    );
    suggestions.push('Remove all but one new element from this prompt.');
  }

  if (currentPrompt.vocabularyItems.length > MAX_COGNITIVE_LOAD_ITEMS) {
    violations.push(
      `Too many vocabulary items (${currentPrompt.vocabularyItems.length}). Max is ${MAX_COGNITIVE_LOAD_ITEMS}.`
    );
    suggestions.push('Reduce vocabulary to focus on fewer items.');
  }

  const lastPrompt = previousPrompts[previousPrompts.length - 1];
  if (lastPrompt) {
    const newVocab = currentPrompt.vocabularyItems.filter(
      (v) => !lastPrompt.vocabularyItems.includes(v)
    );
    const newGrammar = currentPrompt.grammarStructures.filter(
      (g) => !lastPrompt.grammarStructures.includes(g)
    );

    const totalNew = newVocab.length + newGrammar.length + currentPrompt.newElements.length;

    if (totalNew > 2) {
      violations.push(
        `Cumulative new content (${totalNew} items) may overwhelm learner.`
      );
      suggestions.push('Introduce new content more gradually across exchanges.');
    }
  }

  return {
    valid: violations.length === 0,
    violations,
    suggestions,
  };
}

export function adjustPaceBasedOnProfile(
  adjustment: DifficultyAdjustment,
  profile: LearnerProfile
): DifficultyAdjustment {
  const { pace } = profile.preferences;

  switch (pace) {
    case 'slow':
      return {
        ...adjustment,
        recommendedLevel: Math.max(3, adjustment.recommendedLevel - 1),
      };

    case 'fast':
      if (adjustment.recommendedLevel < MAX_COGNITIVE_LOAD_ITEMS) {
        return {
          ...adjustment,
          recommendedLevel: adjustment.recommendedLevel + 1,
        };
      }
      break;

    case 'moderate':
    default:
      break;
  }

  return adjustment;
}

export function generateDifficultyFeedback(
  metrics: DifficultyMetrics,
  adjustment: DifficultyAdjustment
): string {
  const load = assessCognitiveLoad(metrics);

  if (load === 'high') {
    return 'Taking it slower to reinforce what you know.';
  }

  if (load === 'low' && adjustment.newVariableToIntroduce) {
    return `Ready for something new: ${adjustment.newVariableToIntroduce.item}.`;
  }

  return 'Good pace. Continuing with current focus.';
}

export function shouldSimplifyNextPrompt(session: SessionState): boolean {
  if (session.exchangeCount < 3) return false;

  const recentExchanges = session.conversationHistory.slice(-3);
  const errorRate =
    recentExchanges.filter((e) => e.errorsDetected.length > 0).length /
    recentExchanges.length;

  return errorRate > 0.5;
}

export function getComprehensionSignals(
  exchange: ConversationExchange
): {
  confident: boolean;
  hesitant: boolean;
  confused: boolean;
} {
  const msg = exchange.userMessage.toLowerCase();

  return {
    confident:
      !msg.includes('?') &&
      msg.length > 10 &&
      exchange.errorsDetected.length === 0,
    hesitant:
      msg.includes('...') ||
      msg.includes('um') ||
      msg.includes('uh') ||
      msg.includes('maybe'),
    confused:
      msg.includes('?') ||
      msg.includes("don't know") ||
      msg.includes('not sure') ||
      msg.includes('help'),
  };
}
