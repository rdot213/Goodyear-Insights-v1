import { useState, useEffect, useRef } from 'react';
import {
  SessionState,
  VocabularyStateItem,
  LearnerProfile,
  ErrorLogEntry,
  VocabularyItem,
} from '../types';
import {
  createSession,
  loadCurrentSession,
  saveCurrentSession,
  recordExchange,
  performMidSessionCheck,
  endSession,
  getSessionNumber,
  getSessionStats,
  shouldEndSession,
} from '../engine/SessionManager';
import {
  loadVocabularyStates,
  saveVocabularyStates,
  recordCorrectUse,
  recordIncorrectUse,
  getVocabularyStats,
  introduceNewVocabulary,
} from '../engine/VocabularyStateMachine';
import {
  recordError,
  loadErrorLog,
  saveErrorLog,
  shouldCorrectError,
  generateCorrectionFeedback,
  detectPotentialError,
} from '../engine/ErrorTracking';
import { getOrCreateProfile } from '../engine/LearnerProfile';
import {
  selectNextVocabularyItem,
  prioritizeVocabularyForPrompt,
  calculateRecyclingProgress,
} from '../engine/SpacedRepetition';
import {
  recommendDifficultyAdjustment,
  shouldSimplifyNextPrompt,
} from '../engine/DifficultyCalibration';

interface ConversationalPracticeProps {
  languageCode: string;
  languageName: string;
  vocabulary: VocabularyItem[];
  onBack: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'agent' | 'system';
  content: string;
  timestamp: number;
  vocabularyTargeted?: string[];
  correction?: string;
}

export function ConversationalPractice({
  languageCode,
  languageName,
  vocabulary,
  onBack,
}: ConversationalPracticeProps) {
  const [session, setSession] = useState<SessionState | null>(null);
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [vocabularyStates, setVocabularyStates] = useState<Record<string, VocabularyStateItem>>({});
  const [errorLog, setErrorLog] = useState<ErrorLogEntry[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [currentPrompt, setCurrentPrompt] = useState<{
    instruction: string;
    targetVocab: VocabularyStateItem[];
    context: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showStats, setShowStats] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initializeSession();
  }, [languageCode]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const initializeSession = () => {
    const loadedProfile = getOrCreateProfile(languageCode);
    setProfile(loadedProfile);

    let states = loadVocabularyStates(languageCode);
    if (Object.keys(states).length === 0) {
      const { states: newStates } = introduceNewVocabulary(states, vocabulary.slice(0, 5));
      states = newStates;
      saveVocabularyStates(languageCode, states);
    }
    setVocabularyStates(states);

    const errors = loadErrorLog(languageCode);
    setErrorLog(errors);

    let currentSession = loadCurrentSession(languageCode);
    if (!currentSession) {
      const sessionNum = getSessionNumber(languageCode);
      currentSession = createSession(languageCode, sessionNum, states);
      saveCurrentSession(languageCode, currentSession);
    }
    setSession(currentSession);

    setIsLoading(false);

    setTimeout(() => {
      generateNextPrompt(currentSession, states, loadedProfile);
    }, 500);
  };

  const generateNextPrompt = (
    sess: SessionState,
    states: Record<string, VocabularyStateItem>,
    prof: LearnerProfile
  ) => {
    const prioritized = prioritizeVocabularyForPrompt(sess);
    const nextItem = selectNextVocabularyItem(sess) || prioritized[0];

    if (!nextItem) {
      addSystemMessage('All vocabulary has been well practiced. Consider adding new words.');
      return;
    }

    const simplify = shouldSimplifyNextPrompt(sess);
    // Use difficulty adjustment to determine whether to introduce new vocabulary
    const _adjustment = recommendDifficultyAdjustment(sess, states, prof);

    let instruction: string;
    let context: string;

    if (simplify || _adjustment.recommendedLevel < _adjustment.currentLevel) {
      instruction = `How would you say "${nextItem.translation}" in ${languageName}?`;
      context = 'recall';
    } else {
      const scenarios = ['ordering at a restaurant', 'meeting someone new', 'asking for directions', 'shopping', 'casual conversation'];
      const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];

      instruction = `Imagine you're ${scenario}. Use "${nextItem.word}" (${nextItem.translation}) in a sentence.`;
      context = scenario;
    }

    const prompt = {
      instruction,
      targetVocab: [nextItem],
      context,
    };

    setCurrentPrompt(prompt);

    const agentMessage: Message = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: instruction,
      timestamp: Date.now(),
      vocabularyTargeted: [nextItem.vocabularyId],
    };

    setMessages((prev) => [...prev, agentMessage]);
  };

  const addSystemMessage = (content: string) => {
    const msg: Message = {
      id: crypto.randomUUID(),
      role: 'system',
      content,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, msg]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || !session || !profile || !currentPrompt) return;

    const userInput = inputValue.trim();
    setInputValue('');

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: userInput,
      timestamp: Date.now(),
    };
    setMessages((prev) => [...prev, userMessage]);

    processUserResponse(userInput);
  };

  const processUserResponse = (userInput: string) => {
    if (!session || !profile || !currentPrompt) return;

    const targetItem = currentPrompt.targetVocab[0];
    const errorCheck = detectPotentialError(userInput, targetItem.word, targetItem.translation);

    let updatedStates = { ...vocabularyStates };
    let updatedErrors = [...errorLog];
    let correctionMessage: string | undefined;
    const errorsDetected: string[] = [];

    if (errorCheck.hasError && errorCheck.errorPattern) {
      errorsDetected.push(errorCheck.errorPattern);

      const { errorLog: newErrorLog, entry } = recordError(
        updatedErrors,
        errorCheck.errorPattern,
        session.sessionNumber,
        userInput
      );
      updatedErrors = newErrorLog;

      if (shouldCorrectError(entry, profile)) {
        correctionMessage = generateCorrectionFeedback(entry, profile);
      }

      const { states: newStates } = recordIncorrectUse(updatedStates, targetItem.vocabularyId);
      updatedStates = newStates;
    } else {
      const { states: newStates } = recordCorrectUse(
        updatedStates,
        targetItem.vocabularyId,
        currentPrompt.context
      );
      updatedStates = newStates;
    }

    setVocabularyStates(updatedStates);
    saveVocabularyStates(languageCode, updatedStates);

    setErrorLog(updatedErrors);
    saveErrorLog(languageCode, updatedErrors);

    const updatedSession = recordExchange(
      session,
      userInput,
      currentPrompt.instruction,
      [targetItem.vocabularyId],
      errorsDetected,
      !!correctionMessage
    );

    let responseContent: string;

    if (correctionMessage) {
      responseContent = `${correctionMessage}\n\nThe correct form is: "${targetItem.word}"`;
    } else {
      const acknowledgments = [
        'Good.',
        'That works.',
        'Correct usage.',
        'Well done.',
      ];
      responseContent = acknowledgments[Math.floor(Math.random() * acknowledgments.length)];
    }

    if (updatedSession.midSessionCheckDue) {
      const { session: checkedSession, recommendations } = performMidSessionCheck(updatedSession);

      if (recommendations.length > 0) {
        addSystemMessage(`Mid-session note: ${recommendations[0]}`);
      }

      setSession(checkedSession);
      saveCurrentSession(languageCode, checkedSession);
    } else {
      setSession(updatedSession);
      saveCurrentSession(languageCode, updatedSession);
    }

    const agentResponse: Message = {
      id: crypto.randomUUID(),
      role: 'agent',
      content: responseContent,
      timestamp: Date.now(),
      correction: correctionMessage,
    };
    setMessages((prev) => [...prev, agentResponse]);

    const { shouldEnd, reason } = shouldEndSession(updatedSession, profile);
    if (shouldEnd) {
      setTimeout(() => {
        handleEndSession(reason);
      }, 2000);
    } else {
      setTimeout(() => {
        generateNextPrompt(updatedSession, updatedStates, profile);
      }, 1500);
    }
  };

  const handleEndSession = (_reason?: string) => {
    if (!session) return;

    const { summary, updatedVocabularyStates } = endSession(
      session,
      vocabularyStates,
      languageCode
    );

    setVocabularyStates(updatedVocabularyStates);
    saveVocabularyStates(languageCode, updatedVocabularyStates);

    addSystemMessage(`Session complete. ${summary.summary}`);

    if (summary.promotions.length > 0) {
      addSystemMessage(
        `Progress: ${summary.promotions.length} item(s) moved to review queue.`
      );
    }

    setSession(null);
    setCurrentPrompt(null);
  };

  const handleStartNewSession = () => {
    if (!profile) return;

    const sessionNum = getSessionNumber(languageCode);
    const newSession = createSession(languageCode, sessionNum, vocabularyStates);
    setSession(newSession);
    saveCurrentSession(languageCode, newSession);
    setMessages([]);

    setTimeout(() => {
      generateNextPrompt(newSession, vocabularyStates, profile);
    }, 500);
  };

  const stats = session ? getSessionStats(session) : null;
  const vocabStats = getVocabularyStats(vocabularyStates);
  const recyclingProgress = session ? calculateRecyclingProgress(session) : null;

  if (isLoading) {
    return (
      <div className="practice-loading">
        <p>Loading session...</p>
      </div>
    );
  }

  return (
    <div className="conversational-practice">
      <div className="practice-header">
        <button onClick={onBack} className="back-button">
          Back
        </button>
        <h2>Practice: {languageName}</h2>
        <button onClick={() => setShowStats(!showStats)} className="stats-toggle">
          {showStats ? 'Hide Stats' : 'Stats'}
        </button>
      </div>

      {showStats && (
        <div className="practice-stats">
          <div className="stat-group">
            <h4>Vocabulary</h4>
            <p>Active Focus: {vocabStats.activeFocus}</p>
            <p>Review Queue: {vocabStats.reviewQueue}</p>
            <p>Mastered: {vocabStats.mastered}</p>
            <p>Accuracy: {(vocabStats.averageAccuracy * 100).toFixed(0)}%</p>
          </div>
          {stats && (
            <div className="stat-group">
              <h4>This Session</h4>
              <p>Exchanges: {stats.exchangeCount}</p>
              <p>Words Practiced: {stats.vocabularyPracticed}</p>
              <p>Duration: {Math.floor(stats.duration / 60000)} min</p>
            </div>
          )}
          {recyclingProgress && (
            <div className="stat-group">
              <h4>Recycling</h4>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${recyclingProgress.overallProgress * 100}%` }}
                />
              </div>
              <p>
                {recyclingProgress.itemsFullyCycled} complete,{' '}
                {recyclingProgress.itemsPartialyCycled} in progress
              </p>
            </div>
          )}
        </div>
      )}

      <div className="messages-container">
        {messages.map((msg) => (
          <div key={msg.id} className={`message message-${msg.role}`}>
            <div className="message-content">
              {msg.content.split('\n').map((line, i) => (
                <p key={i}>{line}</p>
              ))}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {session ? (
        <form onSubmit={handleSubmit} className="input-form">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your response..."
            className="practice-input"
            autoFocus
          />
          <button type="submit" className="send-button">
            Send
          </button>
          <button
            type="button"
            onClick={() => handleEndSession('Manual end')}
            className="end-session-button"
          >
            End Session
          </button>
        </form>
      ) : (
        <div className="session-ended">
          <button onClick={handleStartNewSession} className="new-session-button">
            Start New Session
          </button>
        </div>
      )}
    </div>
  );
}
