import { Language, UserProgress } from '../types';

interface LanguageSelectorProps {
  languages: Language[];
  onSelect: (language: Language) => void;
  userProgress: Record<string, UserProgress>;
}

function LanguageSelector({ languages, onSelect, userProgress }: LanguageSelectorProps) {
  return (
    <div className="language-selector">
      <h2>Choose a Language to Learn</h2>
      <div className="language-grid">
        {languages.map((language) => {
          const progress = userProgress[language.code];
          const totalLessons = language.lessons.length;
          const completedLessons = progress?.lessonsCompleted.length || 0;

          return (
            <div
              key={language.code}
              className="language-card"
              onClick={() => onSelect(language)}
            >
              <div className="language-flag">{language.flag}</div>
              <h3>{language.name}</h3>
              <div className="language-stats">
                <p>{totalLessons} lessons available</p>
                {progress && (
                  <>
                    <p>✓ {completedLessons} completed</p>
                    <p>🎴 {progress.cardsReviewed} cards reviewed</p>
                    <p>⭐ Score: {progress.score}</p>
                  </>
                )}
              </div>
              <button className="start-button">Start Learning →</button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default LanguageSelector;
