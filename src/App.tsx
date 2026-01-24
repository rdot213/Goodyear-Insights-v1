import { useState, useEffect } from 'react';
import { Language, UserProgress, VocabularyItem } from './types';
import { languages } from './data/languages';
import LanguageSelector from './components/LanguageSelector';
import Lesson from './components/Lesson';
import Flashcards from './components/Flashcards';
import Quiz from './components/Quiz';
import Progress from './components/Progress';
import { ConversationalPractice } from './components/ConversationalPractice';
import { ProfileSetup } from './components/ProfileSetup';
import { loadProfile } from './engine/LearnerProfile';
import './App.css';

type View = 'selector' | 'lesson' | 'flashcards' | 'quiz' | 'progress' | 'practice' | 'profile';

function App() {
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [currentView, setCurrentView] = useState<View>('selector');
  const [userProgress, setUserProgress] = useState<Record<string, UserProgress>>({});
  const [needsProfileSetup, setNeedsProfileSetup] = useState(false);

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

    const profile = loadProfile(language.code);
    if (!profile || profile.interests.domains.length === 0) {
      setNeedsProfileSetup(true);
      setCurrentView('profile');
    } else {
      setCurrentView('practice');
    }
  };

  const handleBackToSelector = () => {
    setSelectedLanguage(null);
    setCurrentView('selector');
    setNeedsProfileSetup(false);
  };

  const handleProfileComplete = () => {
    setNeedsProfileSetup(false);
    setCurrentView('practice');
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

  const getAllVocabulary = (language: Language): VocabularyItem[] => {
    return language.lessons.flatMap(lesson => lesson.vocabulary);
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>Language Learning</h1>
        {selectedLanguage && currentView !== 'profile' && (
          <nav className="nav-bar">
            <button onClick={handleBackToSelector}>Languages</button>
            <button
              onClick={() => setCurrentView('practice')}
              className={currentView === 'practice' ? 'active' : ''}
            >
              Practice
            </button>
            <button
              onClick={() => setCurrentView('lesson')}
              className={currentView === 'lesson' ? 'active' : ''}
            >
              Lessons
            </button>
            <button
              onClick={() => setCurrentView('flashcards')}
              className={currentView === 'flashcards' ? 'active' : ''}
            >
              Flashcards
            </button>
            <button
              onClick={() => setCurrentView('quiz')}
              className={currentView === 'quiz' ? 'active' : ''}
            >
              Quiz
            </button>
            <button
              onClick={() => setCurrentView('progress')}
              className={currentView === 'progress' ? 'active' : ''}
            >
              Progress
            </button>
            <button
              onClick={() => setCurrentView('profile')}
            >
              Profile
            </button>
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

        {currentView === 'profile' && selectedLanguage && (
          <ProfileSetup
            languageCode={selectedLanguage.code}
            languageName={selectedLanguage.name}
            onComplete={handleProfileComplete}
            onBack={needsProfileSetup ? handleBackToSelector : () => setCurrentView('practice')}
          />
        )}

        {currentView === 'practice' && selectedLanguage && (
          <ConversationalPractice
            languageCode={selectedLanguage.code}
            languageName={selectedLanguage.name}
            vocabulary={getAllVocabulary(selectedLanguage)}
            onBack={handleBackToSelector}
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
        <p>Central American Spanish, Korean, Chinese, and Japanese</p>
      </footer>
    </div>
  );
}

export default App;
