import { ErrorLogEntry, ErrorSeverity, LearnerProfile } from '../types';

const STORAGE_KEY = 'errorLog';

export function createErrorEntry(
  errorPattern: string,
  currentSession: number,
  example: string
): ErrorLogEntry {
  return {
    id: crypto.randomUUID(),
    errorPattern,
    severity: 'slip',
    occurrenceCount: 1,
    firstSeenSession: currentSession,
    lastSeenSession: currentSession,
    resolved: false,
    examples: [example],
  };
}

export function loadErrorLog(languageCode: string): ErrorLogEntry[] {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${languageCode}`);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load error log:', e);
  }
  return [];
}

export function saveErrorLog(languageCode: string, errorLog: ErrorLogEntry[]): void {
  try {
    localStorage.setItem(`${STORAGE_KEY}_${languageCode}`, JSON.stringify(errorLog));
  } catch (e) {
    console.error('Failed to save error log:', e);
  }
}

export function classifyErrorSeverity(occurrenceCount: number): ErrorSeverity {
  if (occurrenceCount === 1) return 'slip';
  if (occurrenceCount <= 3) return 'pattern';
  return 'fossilized';
}

export function recordError(
  errorLog: ErrorLogEntry[],
  errorPattern: string,
  currentSession: number,
  example: string
): {
  errorLog: ErrorLogEntry[];
  entry: ErrorLogEntry;
  escalated: boolean;
  previousSeverity?: ErrorSeverity;
} {
  const existingIndex = errorLog.findIndex(
    (e) => e.errorPattern.toLowerCase() === errorPattern.toLowerCase() && !e.resolved
  );

  if (existingIndex === -1) {
    const newEntry = createErrorEntry(errorPattern, currentSession, example);
    return {
      errorLog: [...errorLog, newEntry],
      entry: newEntry,
      escalated: false,
    };
  }

  const existing = errorLog[existingIndex];
  const previousSeverity = existing.severity;
  const newCount = existing.occurrenceCount + 1;
  const newSeverity = classifyErrorSeverity(newCount);

  const updatedEntry: ErrorLogEntry = {
    ...existing,
    occurrenceCount: newCount,
    severity: newSeverity,
    lastSeenSession: currentSession,
    examples: [...existing.examples.slice(-4), example],
  };

  const updatedLog = [...errorLog];
  updatedLog[existingIndex] = updatedEntry;

  return {
    errorLog: updatedLog,
    entry: updatedEntry,
    escalated: newSeverity !== previousSeverity,
    previousSeverity,
  };
}

export function resolveError(
  errorLog: ErrorLogEntry[],
  errorId: string,
  strategy?: string
): ErrorLogEntry[] {
  return errorLog.map((entry) => {
    if (entry.id === errorId) {
      return {
        ...entry,
        resolved: true,
        correctionStrategy: strategy || entry.correctionStrategy,
      };
    }
    return entry;
  });
}

export function addCorrectionStrategy(
  errorLog: ErrorLogEntry[],
  errorId: string,
  strategy: string
): ErrorLogEntry[] {
  return errorLog.map((entry) => {
    if (entry.id === errorId) {
      return { ...entry, correctionStrategy: strategy };
    }
    return entry;
  });
}

export function shouldCorrectError(
  entry: ErrorLogEntry,
  profile: LearnerProfile
): boolean {
  if (entry.severity === 'fossilized') return true;

  if (entry.severity === 'pattern') return true;

  if (entry.severity === 'slip') {
    return (
      profile.preferences.tone === 'strict' ||
      profile.preferences.correctionTolerance === 'high'
    );
  }

  return false;
}

export function getActiveErrors(errorLog: ErrorLogEntry[]): ErrorLogEntry[] {
  return errorLog.filter((e) => !e.resolved);
}

export function getFossilizedErrors(errorLog: ErrorLogEntry[]): ErrorLogEntry[] {
  return errorLog.filter((e) => e.severity === 'fossilized' && !e.resolved);
}

export function getPatternErrors(errorLog: ErrorLogEntry[]): ErrorLogEntry[] {
  return errorLog.filter((e) => e.severity === 'pattern' && !e.resolved);
}

export function getErrorsByPattern(
  errorLog: ErrorLogEntry[],
  pattern: string
): ErrorLogEntry | undefined {
  return errorLog.find(
    (e) => e.errorPattern.toLowerCase().includes(pattern.toLowerCase()) && !e.resolved
  );
}

export function generateCorrectionFeedback(
  entry: ErrorLogEntry,
  profile: LearnerProfile
): string {
  const { tone } = profile.preferences;

  const baseCorrection = entry.correctionStrategy || `Focus on: ${entry.errorPattern}`;

  switch (tone) {
    case 'strict':
      return `Correction: ${baseCorrection}`;
    case 'casual':
      return `Quick note - ${baseCorrection}`;
    case 'academic':
      return `Observation: ${baseCorrection}. This pattern has appeared ${entry.occurrenceCount} time(s).`;
    case 'expert_guide':
    default:
      return baseCorrection;
  }
}

export function getErrorStats(errorLog: ErrorLogEntry[]): {
  total: number;
  slips: number;
  patterns: number;
  fossilized: number;
  resolved: number;
  active: number;
} {
  const active = errorLog.filter((e) => !e.resolved);
  return {
    total: errorLog.length,
    slips: active.filter((e) => e.severity === 'slip').length,
    patterns: active.filter((e) => e.severity === 'pattern').length,
    fossilized: active.filter((e) => e.severity === 'fossilized').length,
    resolved: errorLog.filter((e) => e.resolved).length,
    active: active.length,
  };
}

export function detectPotentialError(
  userInput: string,
  targetWord: string,
  translation: string
): { hasError: boolean; errorType?: string; errorPattern?: string } {
  const normalizedInput = userInput.toLowerCase().trim();
  const normalizedTarget = targetWord.toLowerCase().trim();
  const normalizedTranslation = translation.toLowerCase().trim();

  if (normalizedInput === normalizedTarget) {
    return { hasError: false };
  }

  if (normalizedInput === normalizedTranslation) {
    return {
      hasError: true,
      errorType: 'language_confusion',
      errorPattern: `Provided English "${translation}" instead of target language "${targetWord}"`,
    };
  }

  const levenshtein = calculateLevenshteinDistance(normalizedInput, normalizedTarget);
  const similarityThreshold = Math.max(1, Math.floor(normalizedTarget.length * 0.3));

  if (levenshtein <= similarityThreshold && levenshtein > 0) {
    return {
      hasError: true,
      errorType: 'spelling',
      errorPattern: `Spelling error: "${userInput}" instead of "${targetWord}"`,
    };
  }

  if (levenshtein > similarityThreshold) {
    return {
      hasError: true,
      errorType: 'unknown',
      errorPattern: `Incorrect response: "${userInput}" for "${translation}"`,
    };
  }

  return { hasError: false };
}

function calculateLevenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[b.length][a.length];
}
