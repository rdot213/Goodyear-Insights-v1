import { useState, useEffect } from 'react';
import {
  LearnerProfile,
  CEFRLevel,
  TonePreference,
  MotivationGoal,
  CorrectionTolerance,
  LearningPace,
} from '../types';
import {
  getOrCreateProfile,
  updateProfile,
  getToneDescription,
} from '../engine/LearnerProfile';

interface ProfileSetupProps {
  languageCode: string;
  languageName: string;
  onComplete: () => void;
  onBack: () => void;
}

export function ProfileSetup({
  languageCode,
  languageName,
  onComplete,
  onBack,
}: ProfileSetupProps) {
  const [profile, setProfile] = useState<LearnerProfile | null>(null);
  const [step, setStep] = useState(1);

  const [level, setLevel] = useState<CEFRLevel>('A1');
  const [motivation, setMotivation] = useState<MotivationGoal>('travel');
  const [objectives, setObjectives] = useState<string[]>([]);
  const [tone, setTone] = useState<TonePreference>('expert_guide');
  const [correctionTolerance, setCorrectionTolerance] = useState<CorrectionTolerance>('medium');
  const [pace, setPace] = useState<LearningPace>('moderate');
  const [interests, setInterests] = useState<string[]>([]);

  useEffect(() => {
    const existing = getOrCreateProfile(languageCode);
    setProfile(existing);
    setLevel(existing.identity.currentLevel);
    setMotivation(existing.motivation.primaryGoal);
    setObjectives(existing.motivation.specificObjectives);
    setTone(existing.preferences.tone);
    setCorrectionTolerance(existing.preferences.correctionTolerance);
    setPace(existing.preferences.pace);
    setInterests(existing.interests.domains);
  }, [languageCode]);

  const handleSave = () => {
    if (!profile) return;

    updateProfile(languageCode, {
      identity: {
        ...profile.identity,
        currentLevel: level,
      },
      motivation: {
        primaryGoal: motivation,
        specificObjectives: objectives,
        urgency: 'casual',
      },
      preferences: {
        tone,
        correctionTolerance,
        pace,
      },
      interests: {
        domains: interests,
        useForExamples: true,
      },
    });

    onComplete();
  };

  const toggleInterest = (interest: string) => {
    if (interests.includes(interest)) {
      setInterests(interests.filter((i) => i !== interest));
    } else {
      setInterests([...interests, interest]);
    }
  };

  const toggleObjective = (objective: string) => {
    if (objectives.includes(objective)) {
      setObjectives(objectives.filter((o) => o !== objective));
    } else {
      setObjectives([...objectives, objective]);
    }
  };

  const levels: { value: CEFRLevel; label: string; description: string }[] = [
    { value: 'A1', label: 'A1 - Beginner', description: 'Basic phrases and expressions' },
    { value: 'A2', label: 'A2 - Elementary', description: 'Simple everyday situations' },
    { value: 'B1', label: 'B1 - Intermediate', description: 'Main points of clear standard input' },
    { value: 'B2', label: 'B2 - Upper Intermediate', description: 'Complex texts and abstract topics' },
    { value: 'C1', label: 'C1 - Advanced', description: 'Demanding texts, implicit meaning' },
    { value: 'C2', label: 'C2 - Proficient', description: 'Near-native understanding' },
  ];

  const motivations: { value: MotivationGoal; label: string }[] = [
    { value: 'travel', label: 'Travel & Tourism' },
    { value: 'business', label: 'Business & Career' },
    { value: 'social', label: 'Social & Relationships' },
    { value: 'academic', label: 'Academic Study' },
    { value: 'cultural', label: 'Cultural Interest' },
    { value: 'literature', label: 'Literature & Arts' },
  ];

  const objectiveOptions = [
    'Ordering food',
    'Asking for directions',
    'Making small talk',
    'Business meetings',
    'Reading news',
    'Watching movies',
    'Making friends',
    'Professional emails',
  ];

  const tones: { value: TonePreference; label: string }[] = [
    { value: 'expert_guide', label: 'Expert Guide' },
    { value: 'casual', label: 'Casual & Friendly' },
    { value: 'strict', label: 'Strict & Direct' },
    { value: 'academic', label: 'Academic & Detailed' },
  ];

  const interestOptions = [
    'Food & Cooking',
    'Travel',
    'Technology',
    'Sports',
    'Music',
    'History',
    'Nature',
    'Business',
    'Art',
    'Science',
  ];

  return (
    <div className="profile-setup">
      <div className="setup-header">
        <button onClick={onBack} className="back-button">
          Back
        </button>
        <h2>Set Up Your {languageName} Profile</h2>
        <span className="step-indicator">Step {step} of 4</span>
      </div>

      <div className="setup-content">
        {step === 1 && (
          <div className="setup-step">
            <h3>What's your current level?</h3>
            <p className="step-description">
              Select the level that best describes your current ability.
            </p>
            <div className="level-options">
              {levels.map((l) => (
                <button
                  key={l.value}
                  className={`level-option ${level === l.value ? 'selected' : ''}`}
                  onClick={() => setLevel(l.value)}
                >
                  <strong>{l.label}</strong>
                  <span>{l.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="setup-step">
            <h3>Why are you learning {languageName}?</h3>
            <div className="motivation-options">
              {motivations.map((m) => (
                <button
                  key={m.value}
                  className={`option-button ${motivation === m.value ? 'selected' : ''}`}
                  onClick={() => setMotivation(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <h4>Specific objectives (optional)</h4>
            <div className="objective-options">
              {objectiveOptions.map((obj) => (
                <button
                  key={obj}
                  className={`option-chip ${objectives.includes(obj) ? 'selected' : ''}`}
                  onClick={() => toggleObjective(obj)}
                >
                  {obj}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="setup-step">
            <h3>How would you like to be taught?</h3>

            <div className="preference-section">
              <h4>Teaching Style</h4>
              <div className="tone-options">
                {tones.map((t) => (
                  <button
                    key={t.value}
                    className={`tone-option ${tone === t.value ? 'selected' : ''}`}
                    onClick={() => setTone(t.value)}
                  >
                    <strong>{t.label}</strong>
                    <span className="tone-description">{getToneDescription(t.value)}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="preference-section">
              <h4>Error Correction</h4>
              <div className="correction-options">
                <button
                  className={`option-button ${correctionTolerance === 'high' ? 'selected' : ''}`}
                  onClick={() => setCorrectionTolerance('high')}
                >
                  Correct all errors
                </button>
                <button
                  className={`option-button ${correctionTolerance === 'medium' ? 'selected' : ''}`}
                  onClick={() => setCorrectionTolerance('medium')}
                >
                  Correct important errors
                </button>
                <button
                  className={`option-button ${correctionTolerance === 'low' ? 'selected' : ''}`}
                  onClick={() => setCorrectionTolerance('low')}
                >
                  Minimal correction
                </button>
              </div>
            </div>

            <div className="preference-section">
              <h4>Learning Pace</h4>
              <div className="pace-options">
                <button
                  className={`option-button ${pace === 'slow' ? 'selected' : ''}`}
                  onClick={() => setPace('slow')}
                >
                  Slow & Steady
                </button>
                <button
                  className={`option-button ${pace === 'moderate' ? 'selected' : ''}`}
                  onClick={() => setPace('moderate')}
                >
                  Moderate
                </button>
                <button
                  className={`option-button ${pace === 'fast' ? 'selected' : ''}`}
                  onClick={() => setPace('fast')}
                >
                  Fast & Challenging
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="setup-step">
            <h3>What topics interest you?</h3>
            <p className="step-description">
              Examples and scenarios will be tailored to your interests.
            </p>
            <div className="interest-options">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  className={`option-chip ${interests.includes(interest) ? 'selected' : ''}`}
                  onClick={() => toggleInterest(interest)}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="setup-navigation">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)} className="nav-button">
            Previous
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)} className="nav-button primary">
            Next
          </button>
        ) : (
          <button onClick={handleSave} className="nav-button primary">
            Start Learning
          </button>
        )}
      </div>
    </div>
  );
}
