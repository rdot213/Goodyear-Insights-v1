import { useState, useEffect } from 'react';
import { Language, VocabularyItem } from '../types';

interface FlashcardsProps {
  language: Language;
  onCardReview: () => void;
}

function Flashcards({ language, onCardReview }: FlashcardsProps) {
  const [allCards, setAllCards] = useState<VocabularyItem[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<string | null>(null);

  useEffect(() => {
    if (selectedLesson) {
      const lesson = language.lessons.find(l => l.id === selectedLesson);
      if (lesson) {
        const shuffled = [...lesson.vocabulary].sort(() => Math.random() - 0.5);
        setAllCards(shuffled);
        setCurrentCardIndex(0);
        setIsFlipped(false);
      }
    } else {
      const allVocab = language.lessons.flatMap(l => l.vocabulary);
      const shuffled = [...allVocab].sort(() => Math.random() - 0.5);
      setAllCards(shuffled);
      setCurrentCardIndex(0);
      setIsFlipped(false);
    }
  }, [language, selectedLesson]);

  if (allCards.length === 0) {
    return <div className="flashcards">Loading cards...</div>;
  }

  const currentCard = allCards[currentCardIndex];

  const handleFlip = () => {
    if (!isFlipped) {
      onCardReview();
    }
    setIsFlipped(!isFlipped);
  };

  const handleNext = () => {
    if (currentCardIndex < allCards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    setAllCards(shuffled);
    setCurrentCardIndex(0);
    setIsFlipped(false);
  };

  return (
    <div className="flashcards">
      <div className="flashcards-header">
        <h2>🎴 Flashcards - {language.name}</h2>
        <div className="flashcard-controls-top">
          <select
            value={selectedLesson || 'all'}
            onChange={(e) => setSelectedLesson(e.target.value === 'all' ? null : e.target.value)}
          >
            <option value="all">All Lessons</option>
            {language.lessons.map(lesson => (
              <option key={lesson.id} value={lesson.id}>{lesson.title}</option>
            ))}
          </select>
          <button onClick={handleShuffle}>🔀 Shuffle</button>
        </div>
        <p>Card {currentCardIndex + 1} of {allCards.length}</p>
      </div>

      <div className={`flashcard ${isFlipped ? 'flipped' : ''}`} onClick={handleFlip}>
        <div className="flashcard-inner">
          <div className="flashcard-front">
            <h1>{currentCard.word}</h1>
            {currentCard.pronunciation && (
              <p className="pronunciation">({currentCard.pronunciation})</p>
            )}
            <p className="hint">Click to reveal translation</p>
          </div>
          <div className="flashcard-back">
            <h2>{currentCard.translation}</h2>
            <div className="card-example">
              <p><strong>Example:</strong></p>
              <p>{currentCard.example}</p>
              <p className="example-translation">{currentCard.exampleTranslation}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flashcard-controls">
        <button
          onClick={handlePrevious}
          disabled={currentCardIndex === 0}
          className="control-button"
        >
          ← Previous
        </button>
        <button onClick={handleFlip} className="control-button primary">
          {isFlipped ? '🔄 Flip Back' : '🔄 Show Answer'}
        </button>
        <button
          onClick={handleNext}
          disabled={currentCardIndex === allCards.length - 1}
          className="control-button"
        >
          Next →
        </button>
      </div>
    </div>
  );
}

export default Flashcards;
