# Language Learning App

A modern, interactive language learning application built with React and TypeScript. Learn Central American Spanish, Korean, Chinese (Mandarin), and Japanese through structured lessons, flashcards, and quizzes.

## Features

### 🌍 Multiple Languages
- **Central American Spanish** - Including regional phrases like "Pura vida" and "Tuanis"
- **Korean (한국어)** - Learn Hangul and common Korean expressions
- **Chinese (中文)** - Mandarin with pinyin pronunciation guides
- **Japanese (日本語)** - Essential Japanese phrases and greetings

### 📚 Learning Modes

#### Lessons
- Structured vocabulary lessons for each language
- Multiple lessons per language covering different topics
- Interactive word cards with translations, pronunciations, and example sentences
- Progress tracking for completed lessons

#### 🎴 Flashcards
- Interactive flip cards for vocabulary review
- Filter by specific lessons or review all vocabulary
- Shuffle feature for randomized practice
- Track number of cards reviewed

#### ✅ Quizzes
- Multiple-choice quizzes to test your knowledge
- Randomized questions from your vocabulary
- Instant feedback with explanations
- Score tracking and percentage calculation
- Retake quizzes to improve your score

#### 📊 Progress Tracking
- View completion percentage for each language
- Track lessons completed
- Monitor flashcards reviewed
- See your quiz scores
- Unlock achievements as you progress
  - 🎓 First Lesson
  - 🌟 All Lessons Complete
  - 🎴 Card Master (10+ cards reviewed)
  - ⭐ Quiz Champion (50+ points)

## Technology Stack

- **React 18** - Modern React with hooks
- **TypeScript** - Type-safe code
- **Vite** - Fast build tool and dev server
- **CSS3** - Custom styling with CSS variables
- **LocalStorage** - Persistent progress tracking

## Getting Started

### Prerequisites
- Node.js 16+ installed
- npm or yarn package manager

### Installation

1. Clone the repository
```bash
git clone <repository-url>
cd Goodyear-Insights-v1
```

2. Install dependencies
```bash
npm install
```

3. Start the development server
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/          # React components
│   ├── LanguageSelector.tsx
│   ├── Lesson.tsx
│   ├── Flashcards.tsx
│   ├── Quiz.tsx
│   └── Progress.tsx
├── data/
│   └── languages.ts    # Language content and vocabulary
├── types.ts            # TypeScript type definitions
├── App.tsx             # Main app component
├── App.css             # Global styles
└── main.tsx            # App entry point
```

## Adding New Content

### Adding a New Language

1. Open `src/data/languages.ts`
2. Add a new language object to the `languages` array:

```typescript
{
  code: 'fr',
  name: 'French',
  flag: '🇫🇷',
  lessons: [
    // Add lessons here
  ]
}
```

### Adding Vocabulary

Each lesson contains vocabulary items with the following structure:

```typescript
{
  id: 'unique-id',
  word: 'Word in target language',
  translation: 'English translation',
  pronunciation: 'phonetic guide',
  example: 'Example sentence',
  exampleTranslation: 'Example translation'
}
```

## Features in Detail

### Responsive Design
The app is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile phones

### Progress Persistence
All progress is automatically saved to browser localStorage:
- Completed lessons
- Cards reviewed count
- Quiz scores
- Achievements unlocked

### Keyboard Navigation
Navigate through lessons and flashcards using:
- Arrow keys for previous/next
- Space bar to flip flashcards
- Enter to submit quiz answers

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

Contributions are welcome! To add new languages or improve existing content:

1. Fork the repository
2. Create a feature branch
3. Add your changes
4. Submit a pull request

## License

This project is open source and available for educational purposes.

## Future Enhancements

- Audio pronunciation for vocabulary
- Writing practice exercises
- Conversation scenarios
- Spaced repetition system
- User accounts and cloud sync
- Mobile app version
- More languages
- Advanced grammar lessons

## Acknowledgments

- Vocabulary and phrases compiled from various language learning resources
- Central American Spanish includes regional variations from Costa Rica, Guatemala, and other Central American countries

---

Made with ❤️ for language learners everywhere
