import { useState, useEffect } from 'react';
import { Language, QuizQuestion } from '../types';

interface QuizProps {
  language: Language;
  onComplete: (score: number) => void;
}

function Quiz({ language, onComplete }: QuizProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);

  useEffect(() => {
    generateQuestions();
  }, [language]);

  const generateQuestions = () => {
    const allVocab = language.lessons.flatMap(l => l.vocabulary);
    const shuffled = [...allVocab].sort(() => Math.random() - 0.5);
    const selectedWords = shuffled.slice(0, Math.min(10, shuffled.length));

    const quizQuestions: QuizQuestion[] = selectedWords.map((word, index) => {
      const correctAnswer = word.translation;
      const wrongAnswers = allVocab
        .filter(v => v.id !== word.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(v => v.translation);

      const options = [correctAnswer, ...wrongAnswers].sort(() => Math.random() - 0.5);
      const correctIndex = options.indexOf(correctAnswer);

      return {
        id: `q-${index}`,
        question: word.word,
        options,
        correctAnswer: correctIndex,
        explanation: word.example
      };
    });

    setQuestions(quizQuestions);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
  };

  if (questions.length === 0) {
    return <div className="quiz">Loading quiz...</div>;
  }

  const currentQuestion = questions[currentQuestionIndex];

  const handleAnswer = (answerIndex: number) => {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
    setShowResult(true);

    if (answerIndex === currentQuestion.correctAnswer) {
      setScore(score + 10);
    }
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      onComplete(score + (selectedAnswer === currentQuestion.correctAnswer ? 10 : 0));
    }
  };

  const handleRestart = () => {
    generateQuestions();
  };

  if (quizComplete) {
    const finalScore = score + (selectedAnswer === currentQuestion.correctAnswer ? 10 : 0);
    const percentage = (finalScore / (questions.length * 10)) * 100;

    return (
      <div className="quiz-complete">
        <h2>🎉 Quiz Complete!</h2>
        <div className="quiz-results">
          <h1>{finalScore} / {questions.length * 10}</h1>
          <p className="percentage">{percentage.toFixed(0)}%</p>
          <p className="result-message">
            {percentage >= 80 ? 'Excellent work!' : percentage >= 60 ? 'Good job!' : 'Keep practicing!'}
          </p>
        </div>
        <button onClick={handleRestart} className="restart-button">
          Try Another Quiz
        </button>
      </div>
    );
  }

  return (
    <div className="quiz">
      <div className="quiz-header">
        <h2>✅ Quiz - {language.name}</h2>
        <div className="quiz-progress">
          <p>Question {currentQuestionIndex + 1} of {questions.length}</p>
          <p>Score: {score}</p>
        </div>
      </div>

      <div className="quiz-question">
        <h3>What does this mean?</h3>
        <h1 className="question-word">{currentQuestion.question}</h1>

        <div className="quiz-options">
          {currentQuestion.options.map((option, index) => (
            <button
              key={index}
              className={`quiz-option ${
                showResult
                  ? index === currentQuestion.correctAnswer
                    ? 'correct'
                    : index === selectedAnswer
                    ? 'incorrect'
                    : ''
                  : selectedAnswer === index
                  ? 'selected'
                  : ''
              }`}
              onClick={() => handleAnswer(index)}
              disabled={showResult}
            >
              {option}
            </button>
          ))}
        </div>

        {showResult && (
          <div className={`quiz-feedback ${selectedAnswer === currentQuestion.correctAnswer ? 'correct' : 'incorrect'}`}>
            <p>
              {selectedAnswer === currentQuestion.correctAnswer
                ? '✓ Correct!'
                : `✗ Incorrect. The answer is: ${currentQuestion.options[currentQuestion.correctAnswer]}`}
            </p>
            <p className="example-text">Example: {currentQuestion.explanation}</p>
            <button onClick={handleNext} className="next-question-button">
              {currentQuestionIndex < questions.length - 1 ? 'Next Question →' : 'See Results'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Quiz;
