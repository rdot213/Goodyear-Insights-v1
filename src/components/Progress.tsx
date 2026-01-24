import { useEffect, useState } from 'react';
import { Language, UserProgress, SessionSummary } from '../types';
import { loadVocabularyStates, getVocabularyStats } from '../engine/VocabularyStateMachine';
import { loadErrorLog, getErrorStats } from '../engine/ErrorTracking';
import { loadSessionHistory } from '../engine/SessionManager';
import { loadProfile } from '../engine/LearnerProfile';

interface ProgressProps {
  language: Language;
  progress: UserProgress | undefined;
}

function Progress({ language, progress }: ProgressProps) {
  const [vocabStats, setVocabStats] = useState<ReturnType<typeof getVocabularyStats> | null>(null);
  const [errorStats, setErrorStats] = useState<ReturnType<typeof getErrorStats> | null>(null);
  const [sessionHistory, setSessionHistory] = useState<SessionSummary[]>([]);
  const [profile, setProfile] = useState<ReturnType<typeof loadProfile>>(null);

  useEffect(() => {
    const states = loadVocabularyStates(language.code);
    setVocabStats(getVocabularyStats(states));

    const errors = loadErrorLog(language.code);
    setErrorStats(getErrorStats(errors));

    const history = loadSessionHistory(language.code);
    setSessionHistory(history);

    const prof = loadProfile(language.code);
    setProfile(prof);
  }, [language.code]);

  if (!progress && !vocabStats) {
    return (
      <div className="progress">
        <h2>Learning Progress - {language.name}</h2>
        <p className="no-progress">No learning data yet. Start a practice session to begin tracking.</p>
      </div>
    );
  }

  const totalLessons = language.lessons.length;
  const completedLessons = progress?.lessonsCompleted.length || 0;
  const totalVocab = language.lessons.reduce((sum, l) => sum + l.vocabulary.length, 0);

  const getRetentionAssessment = () => {
    if (!vocabStats || vocabStats.total === 0) return 'Not enough data';
    const masteryRate = vocabStats.mastered / vocabStats.total;
    if (masteryRate > 0.7) return 'Strong retention across vocabulary';
    if (masteryRate > 0.4) return 'Moderate retention - continue regular practice';
    if (vocabStats.activeFocus > 0) return 'Building foundation - focus on active items';
    return 'Early stage - consistent practice recommended';
  };

  const getErrorAssessment = () => {
    if (!errorStats || errorStats.total === 0) return 'No errors recorded';
    if (errorStats.fossilized > 0) {
      return `${errorStats.fossilized} persistent error pattern(s) need focused attention`;
    }
    if (errorStats.patterns > 0) {
      return `${errorStats.patterns} emerging pattern(s) - monitor in upcoming sessions`;
    }
    return 'No persistent error patterns detected';
  };

  const getPracticeRecommendation = () => {
    if (!vocabStats || vocabStats.total === 0) {
      return 'Begin with conversational practice to build your vocabulary.';
    }
    if (vocabStats.activeFocus > 7) {
      return 'Focus on mastering current items before adding new vocabulary.';
    }
    if (vocabStats.reviewQueue > vocabStats.activeFocus) {
      return 'Good progress. Review queue items will reinforce your learning.';
    }
    if (vocabStats.averageAccuracy < 0.5) {
      return 'Accuracy is below 50%. Consider more focused, slower-paced practice.';
    }
    return 'Maintain regular practice to continue progress.';
  };

  return (
    <div className="progress">
      <h2>Learning Progress - {language.name}</h2>

      {profile && (
        <div className="profile-summary">
          <p>
            Level: <strong>{profile.identity.currentLevel}</strong> |
            Focus: <strong>{profile.motivation.primaryGoal}</strong> |
            Style: <strong>{profile.preferences.tone.replace('_', ' ')}</strong>
          </p>
        </div>
      )}

      <div className="progress-stats">
        <div className="stat-card">
          <h3>Vocabulary Status</h3>
          {vocabStats ? (
            <>
              <div className="vocab-breakdown">
                <div className="vocab-row">
                  <span>Active Focus</span>
                  <span className="vocab-count">{vocabStats.activeFocus}</span>
                </div>
                <div className="vocab-row">
                  <span>Review Queue</span>
                  <span className="vocab-count">{vocabStats.reviewQueue}</span>
                </div>
                <div className="vocab-row">
                  <span>Mastered</span>
                  <span className="vocab-count">{vocabStats.mastered}</span>
                </div>
              </div>
              <div className="accuracy-display">
                <span>Overall Accuracy</span>
                <span className="accuracy-value">{(vocabStats.averageAccuracy * 100).toFixed(0)}%</span>
              </div>
            </>
          ) : (
            <p>No vocabulary data</p>
          )}
        </div>

        <div className="stat-card">
          <h3>Content Covered</h3>
          <p className="stat-detail">
            {completedLessons} of {totalLessons} lessons viewed
          </p>
          <p className="stat-detail">
            {vocabStats?.total || 0} of {totalVocab} vocabulary items introduced
          </p>
        </div>

        <div className="stat-card">
          <h3>Practice Sessions</h3>
          <p className="stat-detail">
            {sessionHistory.length} session{sessionHistory.length !== 1 ? 's' : ''} completed
          </p>
          {sessionHistory.length > 0 && (
            <p className="stat-detail">
              Last session: {new Date(sessionHistory[sessionHistory.length - 1].endTime).toLocaleDateString()}
            </p>
          )}
        </div>
      </div>

      <div className="assessment-section">
        <h3>Assessment</h3>
        <div className="assessment-item">
          <strong>Retention:</strong> {getRetentionAssessment()}
        </div>
        <div className="assessment-item">
          <strong>Error Patterns:</strong> {getErrorAssessment()}
        </div>
        <div className="assessment-item recommendation">
          <strong>Recommendation:</strong> {getPracticeRecommendation()}
        </div>
      </div>

      {errorStats && errorStats.fossilized > 0 && (
        <div className="attention-section">
          <h3>Areas Needing Attention</h3>
          <p>
            You have {errorStats.fossilized} fossilized error pattern(s) that persist despite correction.
            These require focused practice with explicit attention to the correct form.
          </p>
        </div>
      )}

      <div className="lesson-checklist">
        <h3>Content Overview</h3>
        <ul>
          {language.lessons.map((lesson) => {
            const isCompleted = progress?.lessonsCompleted.includes(lesson.id);
            return (
              <li key={lesson.id} className={isCompleted ? 'completed' : 'incomplete'}>
                <span className="checkbox">{isCompleted ? '✓' : '○'}</span>
                <span className="lesson-title">{lesson.title}</span>
                <span className="lesson-words">{lesson.vocabulary.length} items</span>
              </li>
            );
          })}
        </ul>
      </div>

      {sessionHistory.length > 0 && (
        <div className="session-history">
          <h3>Recent Sessions</h3>
          <ul>
            {sessionHistory.slice(-5).reverse().map((session) => (
              <li key={session.sessionId}>
                <span className="session-date">
                  {new Date(session.endTime).toLocaleDateString()}
                </span>
                <span className="session-summary">{session.summary}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default Progress;
