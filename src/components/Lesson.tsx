import { useState } from 'react';
import { Language, Lesson as LessonType } from '../types';

interface LessonProps {
  language: Language;
  onComplete: (lessonId: string) => void;
}

function Lesson({ language, onComplete }: LessonProps) {
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);

  if (!selectedLesson) {
    return (
      <div className="lesson-list">
        <h2>{language.flag} {language.name} - Lessons</h2>
        <div className="lessons-grid">
          {language.lessons.map((lesson) => (
            <div
              key={lesson.id}
              className="lesson-card"
              onClick={() => {
                setSelectedLesson(lesson);
                setCurrentWordIndex(0);
              }}
            >
              <h3>{lesson.title}</h3>
              <p>{lesson.vocabulary.length} vocabulary items</p>
              <button>Start Lesson →</button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const currentWord = selectedLesson.vocabulary[currentWordIndex];
  const isLastWord = currentWordIndex === selectedLesson.vocabulary.length - 1;

  const handleNext = () => {
    if (isLastWord) {
      onComplete(selectedLesson.id);
      setSelectedLesson(null);
      setCurrentWordIndex(0);
    } else {
      setCurrentWordIndex(currentWordIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setCurrentWordIndex(currentWordIndex - 1);
    }
  };

  return (
    <div className="lesson-view">
      <div className="lesson-header">
        <button onClick={() => setSelectedLesson(null)}>← Back to Lessons</button>
        <h2>{selectedLesson.title}</h2>
        <p>Word {currentWordIndex + 1} of {selectedLesson.vocabulary.length}</p>
      </div>

      <div className="vocabulary-card">
        <div className="word-main">
          <h1 className="word">{currentWord.word}</h1>
          {currentWord.pronunciation && (
            <p className="pronunciation">({currentWord.pronunciation})</p>
          )}
          <h2 className="translation">{currentWord.translation}</h2>
        </div>

        <div className="word-example">
          <h3>Example:</h3>
          <p className="example">{currentWord.example}</p>
          <p className="example-translation">{currentWord.exampleTranslation}</p>
        </div>
      </div>

      <div className="lesson-controls">
        <button
          onClick={handlePrevious}
          disabled={currentWordIndex === 0}
          className="control-button"
        >
          ← Previous
        </button>
        <div className="progress-dots">
          {selectedLesson.vocabulary.map((_, index) => (
            <span
              key={index}
              className={`dot ${index === currentWordIndex ? 'active' : ''} ${index < currentWordIndex ? 'completed' : ''}`}
            />
          ))}
        </div>
        <button
          onClick={handleNext}
          className="control-button primary"
        >
          {isLastWord ? 'Complete ✓' : 'Next →'}
        </button>
      </div>
    </div>
  );
}

export default Lesson;
