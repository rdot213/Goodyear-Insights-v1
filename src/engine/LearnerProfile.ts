import {
  LearnerProfile,
  CEFRLevel,
  TonePreference,
  MotivationGoal,
} from '../types';

const STORAGE_KEY = 'learnerProfile';

export function createDefaultProfile(
  targetLanguage: string,
  userId: string = crypto.randomUUID()
): LearnerProfile {
  return {
    userId,
    identity: {
      targetLanguage,
      currentLevel: 'A1',
      nativeLanguage: 'English',
    },
    motivation: {
      primaryGoal: 'travel',
      specificObjectives: [],
      urgency: 'casual',
    },
    preferences: {
      tone: 'expert_guide',
      correctionTolerance: 'medium',
      pace: 'moderate',
    },
    interests: {
      domains: [],
      useForExamples: true,
    },
    constraints: {
      sessionLength: '30min',
      practiceFrequency: 'as_needed',
    },
    createdAt: Date.now(),
    lastActive: Date.now(),
  };
}

export function loadProfile(languageCode: string): LearnerProfile | null {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${languageCode}`);
    if (stored) {
      return JSON.parse(stored) as LearnerProfile;
    }
  } catch (e) {
    console.error('Failed to load learner profile:', e);
  }
  return null;
}

export function saveProfile(profile: LearnerProfile): void {
  try {
    profile.lastActive = Date.now();
    localStorage.setItem(
      `${STORAGE_KEY}_${profile.identity.targetLanguage}`,
      JSON.stringify(profile)
    );
  } catch (e) {
    console.error('Failed to save learner profile:', e);
  }
}

export function updateProfile(
  languageCode: string,
  updates: Partial<LearnerProfile>
): LearnerProfile {
  let profile = loadProfile(languageCode);
  if (!profile) {
    profile = createDefaultProfile(languageCode);
  }

  const updatedProfile: LearnerProfile = {
    ...profile,
    ...updates,
    identity: {
      ...profile.identity,
      ...(updates.identity || {}),
    },
    motivation: {
      ...profile.motivation,
      ...(updates.motivation || {}),
    },
    preferences: {
      ...profile.preferences,
      ...(updates.preferences || {}),
    },
    interests: {
      ...profile.interests,
      ...(updates.interests || {}),
    },
    constraints: {
      ...profile.constraints,
      ...(updates.constraints || {}),
    },
  };

  saveProfile(updatedProfile);
  return updatedProfile;
}

export function updateLevel(languageCode: string, level: CEFRLevel): void {
  updateProfile(languageCode, {
    identity: { targetLanguage: languageCode, currentLevel: level, nativeLanguage: 'English' },
  });
}

export function updateTone(languageCode: string, tone: TonePreference): void {
  const profile = loadProfile(languageCode);
  if (profile) {
    updateProfile(languageCode, {
      preferences: { ...profile.preferences, tone },
    });
  }
}

export function updateMotivation(
  languageCode: string,
  primaryGoal: MotivationGoal,
  specificObjectives: string[] = []
): void {
  const profile = loadProfile(languageCode);
  if (profile) {
    updateProfile(languageCode, {
      motivation: { ...profile.motivation, primaryGoal, specificObjectives },
    });
  }
}

export function updateInterests(languageCode: string, domains: string[]): void {
  const profile = loadProfile(languageCode);
  if (profile) {
    updateProfile(languageCode, {
      interests: { ...profile.interests, domains },
    });
  }
}

export function getOrCreateProfile(languageCode: string): LearnerProfile {
  let profile = loadProfile(languageCode);
  if (!profile) {
    profile = createDefaultProfile(languageCode);
    saveProfile(profile);
  }
  return profile;
}

export function getToneDescription(tone: TonePreference): string {
  const descriptions: Record<TonePreference, string> = {
    strict: 'Direct correction with minimal encouragement. Standards-based feedback.',
    casual: 'Friendly and relaxed. Flow-preserving corrections with moderate encouragement.',
    academic: 'Precise and detailed. Intellectual respect with thorough explanations.',
    expert_guide: 'Selective and purposeful. Calm acknowledgment with contextualized examples.',
  };
  return descriptions[tone];
}

export function getCorrectionBehavior(profile: LearnerProfile): {
  correctSlips: boolean;
  correctPatterns: boolean;
  correctFossilized: boolean;
  explanationDetail: 'minimal' | 'moderate' | 'detailed';
} {
  const { tone, correctionTolerance } = profile.preferences;

  return {
    correctSlips: tone === 'strict' || correctionTolerance === 'high',
    correctPatterns: true,
    correctFossilized: true,
    explanationDetail:
      tone === 'academic' ? 'detailed' :
      tone === 'casual' ? 'minimal' : 'moderate',
  };
}

export function shouldProvideGrammarExplanation(
  profile: LearnerProfile,
  userAskedWhy: boolean
): boolean {
  if (userAskedWhy) return true;
  return profile.preferences.tone === 'academic';
}

export function getExampleDomains(profile: LearnerProfile): string[] {
  if (profile.interests.useForExamples && profile.interests.domains.length > 0) {
    return profile.interests.domains;
  }
  return ['daily', 'travel', 'social'];
}
