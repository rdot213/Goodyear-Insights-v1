import { useState, useEffect } from 'react';
import { Language, UserProgress } from './types';
import { languages } from './data/languages';
import LanguageSelector from './components/LanguageSelector';
import Lesson from './components/Lesson';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import Progress from './components/Progress';
import './App.css';

type View = 'selector' | 'lesson' | 'flashcards' | 'quiz' | 'progress';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [currentView, setCurrentView] = useState<View>('selector');
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});

  useEffect(() => {
    const savedProgress = localStorage.getItem('languageAppProgress');
    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('languageAppProgress', JSON.stringify(userProgress));
  }, [userProgress]);

  const handleLanguageSelect = (language: Language) => {
    setSelectedLanguage(language);
    setCurrentView('lesson');
  };

  const handleBackToSelector = () => {
    setSelectedLanguage(null);
    setCurrentView('selector');
  };

  const updateProgress = (language: string, update: Partial<UserProgress>) => {
    setUserProgress(prev => ({
      ...prev,
      [language]: {
        language,
        lessonsCompleted: update.lessonsCompleted || prev[language]?.lessonsCompleted || [],
        score: update.score !== undefined ? update.score : prev[language]?.score || 0,
        cardsReviewed: update.cardsReviewed !== undefined ? update.cardsReviewed : prev[language]?.cardsReviewed || 0,
      }
    }));
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>🌍 Language Learning App</h1>
        {selectedLanguage && (
          <nav className="nav-bar">
            <button onClick={handleBackToSelector}>← Languages</button>
            <button onClick={() => setCurrentView('lesson')}>📚 Lessons</button>
            <button onClick={() => setCurrentView('flashcards')}>🎴 Flashcards</button>
            <button onClick={() => setCurrentView('quiz')}>✅ Quiz</button>
            <button onClick={() => setCurrentView('progress')}>📊 Progress</button>
          </nav>
        )}
      </header>

      <main className="app-main">
        {currentView === 'selector' && (
          <LanguageSelector
            languages={languages}
            onSelect={handleLanguageSelect}
            userProgress={userProgress}
          />
        )}

        {currentView === 'lesson' && selectedLanguage && (
          <Lesson
            language={selectedLanguage}
            onComplete={(lessonId) => {
              const progress = userProgress[selectedLanguage.code] || {
                language: selectedLanguage.code,
                lessonsCompleted: [],
                score: 0,
                cardsReviewed: 0
              };
              if (!progress.lessonsCompleted.includes(lessonId)) {
                updateProgress(selectedLanguage.code, {
                  ...progress,
                  lessonsCompleted: [...progress.lessonsCompleted, lessonId]
                });
              }
            }}
          />
        )}

        {currentView === 'flashcards' && selectedLanguage && (
          <Flashcards
            language={selectedLanguage}
            onCardReview={() => {
              const progress = userProgress[selectedLanguage.code] || {
                language: selectedLanguage.code,
                lessonsCompleted: [],
                score: 0,
                cardsReviewed: 0
              };
              updateProgress(selectedLanguage.code, {
                ...progress,
                cardsReviewed: progress.cardsReviewed + 1
              });
            }}
          />
        )}

        {currentView === 'quiz' && selectedLanguage && (
          <Quiz
            language={selectedLanguage}
            onComplete={(score) => {
              const progress = userProgress[selectedLanguage.code] || {
                language: selectedLanguage.code,
                lessonsCompleted: [],
                score: 0,
                cardsReviewed: 0
              };
              updateProgress(selectedLanguage.code, {
                ...progress,
                score: progress.score + score
              });
            }}
          />
        )}

        {currentView === 'progress' && selectedLanguage && (
          <Progress
            language={selectedLanguage}
            progress={userProgress[selectedLanguage.code]}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>Learn Central American Spanish, Korean, Chinese, and Japanese!</p>
      </footer>
    </div>
  );
}

export default App;
