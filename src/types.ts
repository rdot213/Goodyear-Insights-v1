export interface Lesson {
  id: string;
  title: string;
  vocabulary: VocabularyItem[];
}

export interface VocabularyItem {
  id: string;
  word: string;
  translation: string;
  pronunciation?: string;
  example: string;
  exampleTranslation: string;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
  lessons: Lesson[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface UserProgress {
  language: string;
  lessonsCompleted: string[];
  score: number;
  cardsReviewed: number;
}
