import {
  SessionState,
  SessionSummary,
  ConversationExchange,
  VocabularyStateItem,
  ErrorLogEntry,
  LearnerProfile,
} from '../types';
import { getActiveFocus, getReviewQueue, processSessionEnd } from './VocabularyStateMachine';

const SESSION_STORAGE_KEY = 'currentSession';
const HISTORY_STORAGE_KEY = 'sessionHistory';
const MID_SESSION_CHECK_INTERVAL = 8;

export function createSession(
  _languageCode: string,
  sessionNumber: number,
  vocabularyStates: Record<string, VocabularyStateItem>
): SessionState {
  const activeFocus = getActiveFocus(vocabularyStates);
  const reviewQueue = getReviewQueue(vocabularyStates, sessionNumber);

  return {
    sessionId: crypto.randomUUID(),
    sessionNumber,
    startTime: Date.now(),
    exchangeCount: 0,
    activeFocus,
    reviewQueue,
    vocabularyUsedThisSession: {},
    errorsThisSession: [],
    midSessionCheckDue: false,
    lastMidSessionCheck: 0,
    currentContext: {},
    conversationHistory: [],
  };
}

export function loadCurrentSession(languageCode: string): SessionState | null {
  try {
    const stored = localStorage.getItem(`${SESSION_STORAGE_KEY}_${languageCode}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load session:', e);
  }
  return null;
}

export function saveCurrentSession(languageCode: string, session: SessionState): void {
  try {
    localStorage.setItem(`${SESSION_STORAGE_KEY}_${languageCode}`, JSON.stringify(session));
  } catch (e) {
    console.error('Failed to save session:', e);
  }
}

export function clearCurrentSession(languageCode: string): void {
  localStorage.removeItem(`${SESSION_STORAGE_KEY}_${languageCode}`);
}

export function loadSessionHistory(languageCode: string): SessionSummary[] {
  try {
    const stored = localStorage.getItem(`${HISTORY_STORAGE_KEY}_${languageCode}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load session history:', e);
  }
  return [];
}

export function saveSessionHistory(languageCode: string, history: SessionSummary[]): void {
  try {
    localStorage.setItem(`${HISTORY_STORAGE_KEY}_${languageCode}`, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save session history:', e);
  }
}

export function recordExchange(
  session: SessionState,
  userMessage: string,
  agentResponse: string,
  vocabularyTargeted: string[],
  errorsDetected: string[],
  correctionApplied: boolean
): SessionState {
  const exchange: ConversationExchange = {
    id: crypto.randomUUID(),
    timestamp: Date.now(),
    userMessage,
    agentResponse,
    vocabularyTargeted,
    errorsDetected,
    correctionApplied,
  };

  const updatedVocabUsage = { ...session.vocabularyUsedThisSession };
  for (const vocabId of vocabularyTargeted) {
    updatedVocabUsage[vocabId] = (updatedVocabUsage[vocabId] || 0) + 1;
  }

  const newExchangeCount = session.exchangeCount + 1;
  const midSessionCheckDue =
    newExchangeCount > 0 &&
    newExchangeCount % MID_SESSION_CHECK_INTERVAL === 0 &&
    newExchangeCount > session.lastMidSessionCheck;

  return {
    ...session,
    exchangeCount: newExchangeCount,
    vocabularyUsedThisSession: updatedVocabUsage,
    conversationHistory: [...session.conversationHistory, exchange],
    midSessionCheckDue,
  };
}

export function performMidSessionCheck(session: SessionState): {
  session: SessionState;
  underreviewedItems: string[];
  recommendations: string[];
} {
  const underreviewedItems: string[] = [];
  const recommendations: string[] = [];

  for (const item of session.activeFocus) {
    const uses = session.vocabularyUsedThisSession[item.vocabularyId] || 0;
    if (uses < 2) {
      underreviewedItems.push(item.vocabularyId);
    }
  }

  if (underreviewedItems.length > 0) {
    recommendations.push(
      `Include these words in upcoming prompts: ${underreviewedItems
        .map((id) => {
          const item = session.activeFocus.find((i) => i.vocabularyId === id);
          return item?.word || id;
        })
        .join(', ')}`
    );
  }

  const errorCount = session.errorsThisSession.length;
  if (errorCount > 3) {
    recommendations.push('Consider simplifying difficulty - multiple errors detected');
  }

  return {
    session: {
      ...session,
      midSessionCheckDue: false,
      lastMidSessionCheck: session.exchangeCount,
    },
    underreviewedItems,
    recommendations,
  };
}

export function endSession(
  session: SessionState,
  vocabularyStates: Record<string, VocabularyStateItem>,
  languageCode: string
): {
  summary: SessionSummary;
  updatedVocabularyStates: Record<string, VocabularyStateItem>;
} {
  const { states: updatedStates, promotions, demotions, graduations } = processSessionEnd(
    vocabularyStates,
    session.sessionNumber
  );

  const summary: SessionSummary = {
    sessionId: session.sessionId,
    sessionNumber: session.sessionNumber,
    startTime: session.startTime,
    endTime: Date.now(),
    vocabularyPracticed: Object.keys(session.vocabularyUsedThisSession),
    promotions,
    demotions,
    newErrors: session.errorsThisSession.map((e) => e.errorPattern),
    resolvedErrors: [],
    summary: generateSessionSummary(session, promotions, demotions, graduations),
  };

  const history = loadSessionHistory(languageCode);
  history.push(summary);
  saveSessionHistory(languageCode, history);

  clearCurrentSession(languageCode);

  return {
    summary,
    updatedVocabularyStates: updatedStates,
  };
}

function generateSessionSummary(
  session: SessionState,
  promotions: string[],
  demotions: string[],
  graduations: string[]
): string {
  const parts: string[] = [];

  parts.push(`Session ${session.sessionNumber}: ${session.exchangeCount} exchanges`);

  const vocabCount = Object.keys(session.vocabularyUsedThisSession).length;
  parts.push(`${vocabCount} vocabulary items practiced`);

  if (promotions.length > 0) {
    parts.push(`${promotions.length} items promoted to review queue`);
  }

  if (graduations.length > 0) {
    parts.push(`${graduations.length} items mastered`);
  }

  if (demotions.length > 0) {
    parts.push(`${demotions.length} items need more practice`);
  }

  if (session.errorsThisSession.length > 0) {
    parts.push(`${session.errorsThisSession.length} errors recorded`);
  }

  return parts.join('. ') + '.';
}

export function getSessionNumber(languageCode: string): number {
  const history = loadSessionHistory(languageCode);
  return history.length + 1;
}

export function setSessionContext(
  session: SessionState,
  context: { topic?: string; scenario?: string; register?: 'casual' | 'formal' | 'idiomatic' }
): SessionState {
  return {
    ...session,
    currentContext: { ...session.currentContext, ...context },
  };
}

export function addSessionError(
  session: SessionState,
  error: ErrorLogEntry
): SessionState {
  return {
    ...session,
    errorsThisSession: [...session.errorsThisSession, error],
  };
}

export function getRecentExchanges(
  session: SessionState,
  count: number = 5
): ConversationExchange[] {
  return session.conversationHistory.slice(-count);
}

export function shouldEndSession(
  session: SessionState,
  profile: LearnerProfile
): { shouldEnd: boolean; reason?: string } {
  const sessionDurationMs = Date.now() - session.startTime;
  const sessionLengthMap = {
    '15min': 15 * 60 * 1000,
    '30min': 30 * 60 * 1000,
    '60min': 60 * 60 * 1000,
  };

  const maxDuration = sessionLengthMap[profile.constraints.sessionLength];
  if (sessionDurationMs >= maxDuration) {
    return { shouldEnd: true, reason: 'Session duration reached' };
  }

  const allItemsPracticed = session.activeFocus.every((item) => {
    const uses = session.vocabularyUsedThisSession[item.vocabularyId] || 0;
    return uses >= 3;
  });

  if (allItemsPracticed && session.exchangeCount >= 10) {
    return { shouldEnd: true, reason: 'All active focus items sufficiently practiced' };
  }

  return { shouldEnd: false };
}

export function getSessionStats(session: SessionState): {
  duration: number;
  exchangeCount: number;
  vocabularyPracticed: number;
  errorsCount: number;
  averageUsesPerItem: number;
} {
  const duration = Date.now() - session.startTime;
  const vocabPracticed = Object.keys(session.vocabularyUsedThisSession).length;
  const totalUses = Object.values(session.vocabularyUsedThisSession).reduce((a, b) => a + b, 0);
  const averageUses = vocabPracticed > 0 ? totalUses / vocabPracticed : 0;

  return {
    duration,
    exchangeCount: session.exchangeCount,
    vocabularyPracticed: vocabPracticed,
    errorsCount: session.errorsThisSession.length,
    averageUsesPerItem: averageUses,
  };
}
