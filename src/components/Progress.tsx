import { Language, UserProgress } from '../types';

interface ProgressProps {
  language: Language;
  progress: UserProgress | undefined;
}

function Progress({ language, progress }: ProgressProps) {
  if (!progress) {
    return (
      <div className="progress">
        <h2>📊 Progress - {language.name}</h2>
        <p className="no-progress">No progress yet. Start learning to track your progress!</p>
      </div>
    );
  }

  const totalLessons = language.lessons.length;
  const completedLessons = progress.lessonsCompleted.length;
  const completionPercentage = (completedLessons / totalLessons) * 100;

  return (
    <div className="progress">
      <h2>📊 Progress - {language.name}</h2>

      <div className="progress-stats">
        <div className="stat-card">
          <h3>Lessons Completed</h3>
          <p className="stat-number">{completedLessons} / {totalLessons}</p>
          <div className="progress-bar">
            <div
              className="progress-bar-fill"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
          <p className="stat-percentage">{completionPercentage.toFixed(0)}%</p>
        </div>

        <div className="stat-card">
          <h3>Cards Reviewed</h3>
          <p className="stat-number">{progress.cardsReviewed}</p>
          <p className="stat-label">flashcards</p>
        </div>

        <div className="stat-card">
          <h3>Quiz Score</h3>
          <p className="stat-number">{progress.score}</p>
          <p className="stat-label">points earned</p>
        </div>
      </div>

      <div className="lesson-checklist">
        <h3>Lesson Progress</h3>
        <ul>
          {language.lessons.map((lesson) => {
            const isCompleted = progress.lessonsCompleted.includes(lesson.id);
            return (
              <li key={lesson.id} className={isCompleted ? 'completed' : 'incomplete'}>
                <span className="checkbox">{isCompleted ? '✓' : '○'}</span>
                <span className="lesson-title">{lesson.title}</span>
                <span className="lesson-words">{lesson.vocabulary.length} words</span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="achievements">
        <h3>🏆 Achievements</h3>
        <div className="achievement-grid">
          {completedLessons > 0 && (
            <div className="achievement">
              <span className="achievement-icon">🎓</span>
              <p>First Lesson</p>
            </div>
          )}
          {completedLessons >= totalLessons && (
            <div className="achievement">
              <span className="achievement-icon">🌟</span>
              <p>All Lessons Complete</p>
            </div>
          )}
          {progress.cardsReviewed >= 10 && (
            <div className="achievement">
              <span className="achievement-icon">🎴</span>
              <p>Card Master</p>
            </div>
          )}
          {progress.score >= 50 && (
            <div className="achievement">
              <span className="achievement-icon">⭐</span>
              <p>Quiz Champion</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Progress;
