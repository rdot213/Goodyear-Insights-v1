// ============================================================
// CORE VOCABULARY TYPES
// ============================================================

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  example: string;
  exampleTranslation: string;
}

export interface FunctionalContext {
  scenario: 'restaurant' | 'business' | 'travel' | 'social' | 'shopping' | 'daily' | 'academic';
  example: string;
  exampleTranslation: string;
  register: 'casual' | 'formal' | 'idiomatic';
}

export interface EnhancedVocabularyItem extends VocabularyItem {
  frequencyRank?: number;
  functionalContexts: FunctionalContext[];
  grammaticalCategory?: 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'expression';
}

export interface Lesson {
  id: string;
  title: string;
  vocabulary: VocabularyItem[];
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  lessons: Lesson[];
}

// ============================================================
// VOCABULARY STATE MACHINE
// ============================================================

export type VocabularyRetentionState = 'active_focus' | 'review_queue' | 'mastered';

export interface VocabularyStateItem {
  vocabularyId: string;
  word: string;
  translation: string;
  retentionState: VocabularyRetentionState;
  sessionCount: number;
  correctUsesCurrentSession: number;
  lastReviewedSession: number;
  totalCorrectUses: number;
  totalAttempts: number;
  contextVariationsUsed: string[];
}

// ============================================================
// ERROR TRACKING SYSTEM
// ============================================================

export type ErrorSeverity = 'slip' | 'pattern' | 'fossilized';

export interface ErrorLogEntry {
  id: string;
  errorPattern: string;
  severity: ErrorSeverity;
  occurrenceCount: number;
  correctionStrategy?: string;
  firstSeenSession: number;
  lastSeenSession: number;
  resolved: boolean;
  examples: string[];
}

// ============================================================
// LEARNER PROFILE & PERSONALIZATION
// ============================================================

export type MotivationGoal = 'travel' | 'business' | 'literature' | 'social' | 'academic' | 'cultural';
export type TonePreference = 'strict' | 'casual' | 'academic' | 'expert_guide';
export type CorrectionTolerance = 'high' | 'medium' | 'low';
export type LearningPace = 'slow' | 'moderate' | 'fast';
export type SessionLength = '15min' | '30min' | '60min';
export type PracticeFrequency = 'daily' | 'weekly' | 'as_needed';
export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LearnerProfile {
  userId: string;

  identity: {
    targetLanguage: string;
    currentLevel: CEFRLevel;
    nativeLanguage: string;
  };

  motivation: {
    primaryGoal: MotivationGoal;
    specificObjectives: string[];
    urgency: 'casual' | 'moderate' | 'intensive';
  };

  preferences: {
    tone: TonePreference;
    correctionTolerance: CorrectionTolerance;
    pace: LearningPace;
  };

  interests: {
    domains: string[];
    useForExamples: boolean;
  };

  constraints: {
    sessionLength: SessionLength;
    practiceFrequency: PracticeFrequency;
  };

  createdAt: number;
  lastActive: number;
}

// ============================================================
// SESSION MANAGEMENT
// ============================================================

export interface SessionState {
  sessionId: string;
  sessionNumber: number;
  startTime: number;
  exchangeCount: number;

  activeFocus: VocabularyStateItem[];
  reviewQueue: VocabularyStateItem[];

  vocabularyUsedThisSession: Record<string, number>;
  errorsThisSession: ErrorLogEntry[];

  midSessionCheckDue: boolean;
  lastMidSessionCheck: number;

  currentContext: {
    topic?: string;
    scenario?: string;
    register?: 'casual' | 'formal' | 'idiomatic';
  };

  conversationHistory: ConversationExchange[];
}

export interface ConversationExchange {
  id: string;
  timestamp: number;
  userMessage: string;
  agentResponse: string;
  vocabularyTargeted: string[];
  errorsDetected: string[];
  correctionApplied: boolean;
}

export interface SessionSummary {
  sessionId: string;
  sessionNumber: number;
  startTime: number;
  endTime: number;
  vocabularyPracticed: string[];
  promotions: string[];
  demotions: string[];
  newErrors: string[];
  resolvedErrors: string[];
  summary: string;
}

// ============================================================
// AGENT STATE MACHINE
// ============================================================

export type AgentState =
  | 'load_profile'
  | 'load_active_focus'
  | 'load_review_queue'
  | 'elicit'
  | 'evaluate'
  | 'correct'
  | 'reinforce'
  | 'mid_session_check'
  | 'adapt'
  | 'end_session'
  | 'memory_consolidation';

export interface AgentContext {
  currentState: AgentState;
  learnerProfile: LearnerProfile;
  sessionState: SessionState;
  vocabularyStates: Record<string, VocabularyStateItem>;
  errorLog: ErrorLogEntry[];
  sessionHistory: SessionSummary[];

  pendingCorrection?: {
    errorPattern: string;
    severity: ErrorSeverity;
    strategy: string;
  };

  nextPromptGuidance?: {
    vocabularyToInclude: string[];
    contextSuggestion?: string;
    difficultyAdjustment: 'maintain' | 'increase' | 'decrease';
  };
}

// ============================================================
// QUIZ & ASSESSMENT (Updated)
// ============================================================

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  vocabularyId?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface AssessmentResult {
  questionId: string;
  vocabularyId: string;
  correct: boolean;
  responseTimeMs: number;
  selectedAnswer: number;
}

// ============================================================
// USER PROGRESS (Enhanced)
// ============================================================

export interface UserProgress {
  language: string;
  lessonsCompleted: string[];
  score: number;
  cardsReviewed: number;
}

export interface EnhancedUserProgress extends UserProgress {
  profile?: LearnerProfile;
  vocabularyStates: Record<string, VocabularyStateItem>;
  errorLog: ErrorLogEntry[];
  sessionHistory: SessionSummary[];
  totalSessions: number;
  currentSessionNumber: number;
}

// ============================================================
// DIFFICULTY CALIBRATION (i+1 System)
// ============================================================

export interface DifficultyMetrics {
  averageResponseTime: number;
  recentAccuracyRate: number;
  hesitationCount: number;
  cognitiveLoadIndicators: {
    confusionSignals: number;
    requestsForHelp: number;
    abandonedAttempts: number;
  };
}

export interface DifficultyAdjustment {
  currentLevel: number;
  recommendedLevel: number;
  newVariableToIntroduce?: {
    type: 'word' | 'structure' | 'tense' | 'context';
    item: string;
  };
  itemsToRemoveFromFocus?: string[];
}

// ============================================================
// SPACED REPETITION CONFIG
// ============================================================

export interface SpacedRepetitionConfig {
  activeFocusReviewFrequency: number;
  reviewQueueFrequency: number;
  masteredSpotCheckFrequency: number;
  correctUsesForPromotion: number;
  failuresForDemotion: number;
  sessionsForMastery: number;
}

export const DEFAULT_SRS_CONFIG: SpacedRepetitionConfig = {
  activeFocusReviewFrequency: 1,
  reviewQueueFrequency: 3,
  masteredSpotCheckFrequency: 6,
  correctUsesForPromotion: 3,
  failuresForDemotion: 1,
  sessionsForMastery: 2,
};
