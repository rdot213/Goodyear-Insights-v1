import { Language } from '../types';

export const languages: Language[] = [
  {
    code: 'es',
    name: 'Central American Spanish',
    flag: '🇬🇹',
    lessons: [
      {
        id: 'es-1',
        title: 'Basic Greetings',
        vocabulary: [
          {
            id: 'es-1-1',
            word: 'Hola',
            translation: 'Hello',
            pronunciation: 'OH-lah',
            example: '¡Hola! ¿Cómo estás?',
            exampleTranslation: 'Hello! How are you?'
          },
          {
            id: 'es-1-2',
            word: 'Buenos días',
            translation: 'Good morning',
            pronunciation: 'BWEH-nohs DEE-ahs',
            example: 'Buenos días, señor.',
            exampleTranslation: 'Good morning, sir.'
          },
          {
            id: 'es-1-3',
            word: 'Pura vida',
            translation: 'Pure life (Costa Rican greeting)',
            pronunciation: 'POO-rah VEE-dah',
            example: '¡Pura vida, mae!',
            exampleTranslation: 'Pure life, dude!'
          },
          {
            id: 'es-1-4',
            word: 'Tuanis',
            translation: 'Cool/great (Costa Rican slang)',
            pronunciation: 'too-AH-nees',
            example: 'Ese lugar está tuanis.',
            exampleTranslation: 'That place is cool.'
          },
          {
            id: 'es-1-5',
            word: 'Adiós',
            translation: 'Goodbye',
            pronunciation: 'ah-dee-OHS',
            example: 'Adiós, hasta luego.',
            exampleTranslation: 'Goodbye, see you later.'
          }
        ]
      },
      {
        id: 'es-2',
        title: 'Common Phrases',
        vocabulary: [
          {
            id: 'es-2-1',
            word: 'Por favor',
            translation: 'Please',
            pronunciation: 'pohr fah-VOHR',
            example: 'Un café, por favor.',
            exampleTranslation: 'A coffee, please.'
          },
          {
            id: 'es-2-2',
            word: 'Gracias',
            translation: 'Thank you',
            pronunciation: 'GRAH-see-ahs',
            example: 'Muchas gracias.',
            exampleTranslation: 'Thank you very much.'
          },
          {
            id: 'es-2-3',
            word: 'De nada',
            translation: "You're welcome",
            pronunciation: 'deh NAH-dah',
            example: 'De nada, con mucho gusto.',
            exampleTranslation: "You're welcome, with pleasure."
          },
          {
            id: 'es-2-4',
            word: '¿Cuánto cuesta?',
            translation: 'How much does it cost?',
            pronunciation: 'KWAHN-toh KWEHS-tah',
            example: '¿Cuánto cuesta este libro?',
            exampleTranslation: 'How much does this book cost?'
          },
          {
            id: 'es-2-5',
            word: 'No entiendo',
            translation: "I don't understand",
            pronunciation: 'noh ehn-tee-EHN-doh',
            example: 'Lo siento, no entiendo.',
            exampleTranslation: "I'm sorry, I don't understand."
          }
        ]
      }
    ]
  },
  {
    code: 'ko',
    name: 'Korean',
    flag: '🇰🇷',
    lessons: [
      {
        id: 'ko-1',
        title: 'Basic Greetings',
        vocabulary: [
          {
            id: 'ko-1-1',
            word: '안녕하세요',
            translation: 'Hello',
            pronunciation: 'annyeonghaseyo',
            example: '안녕하세요! 만나서 반갑습니다.',
            exampleTranslation: 'Hello! Nice to meet you.'
          },
          {
            id: 'ko-1-2',
            word: '감사합니다',
            translation: 'Thank you',
            pronunciation: 'gamsahamnida',
            example: '정말 감사합니다.',
            exampleTranslation: 'Thank you very much.'
          },
          {
            id: 'ko-1-3',
            word: '안녕히 가세요',
            translation: 'Goodbye (to person leaving)',
            pronunciation: 'annyeonghi gaseyo',
            example: '안녕히 가세요. 또 만나요.',
            exampleTranslation: 'Goodbye. See you again.'
          },
          {
            id: 'ko-1-4',
            word: '죄송합니다',
            translation: "I'm sorry",
            pronunciation: 'joesonghamnida',
            example: '죄송합니다. 제 잘못이에요.',
            exampleTranslation: "I'm sorry. It's my fault."
          },
          {
            id: 'ko-1-5',
            word: '네',
            translation: 'Yes',
            pronunciation: 'ne',
            example: '네, 알겠습니다.',
            exampleTranslation: 'Yes, I understand.'
          }
        ]
      },
      {
        id: 'ko-2',
        title: 'Essential Phrases',
        vocabulary: [
          {
            id: 'ko-2-1',
            word: '이름이 뭐예요?',
            translation: 'What is your name?',
            pronunciation: 'ireumi mwoyeyo?',
            example: '이름이 뭐예요? 제 이름은 민수예요.',
            exampleTranslation: 'What is your name? My name is Minsu.'
          },
          {
            id: 'ko-2-2',
            word: '얼마예요?',
            translation: 'How much is it?',
            pronunciation: 'eolmayeyo?',
            example: '이거 얼마예요?',
            exampleTranslation: 'How much is this?'
          },
          {
            id: 'ko-2-3',
            word: '잘 먹겠습니다',
            translation: 'I will eat well (before meal)',
            pronunciation: 'jal meokgesseumnida',
            example: '잘 먹겠습니다!',
            exampleTranslation: "I'll enjoy this meal!"
          },
          {
            id: 'ko-2-4',
            word: '도와주세요',
            translation: 'Please help me',
            pronunciation: 'dowajuseyo',
            example: '도와주세요. 길을 잃었어요.',
            exampleTranslation: 'Please help me. I am lost.'
          },
          {
            id: 'ko-2-5',
            word: '한국어 못해요',
            translation: "I can't speak Korean",
            pronunciation: 'hangugo mothaeyo',
            example: '죄송해요. 한국어 못해요.',
            exampleTranslation: "Sorry. I can't speak Korean."
          }
        ]
      }
    ]
  },
  {
    code: 'zh',
    name: 'Chinese (Mandarin)',
    flag: '🇨🇳',
    lessons: [
      {
        id: 'zh-1',
        title: 'Basic Greetings',
        vocabulary: [
          {
            id: 'zh-1-1',
            word: '你好',
            translation: 'Hello',
            pronunciation: 'nǐ hǎo',
            example: '你好！很高兴见到你。',
            exampleTranslation: 'Hello! Nice to meet you.'
          },
          {
            id: 'zh-1-2',
            word: '谢谢',
            translation: 'Thank you',
            pronunciation: 'xièxie',
            example: '非常谢谢你。',
            exampleTranslation: 'Thank you very much.'
          },
          {
            id: 'zh-1-3',
            word: '再见',
            translation: 'Goodbye',
            pronunciation: 'zàijiàn',
            example: '再见！明天见。',
            exampleTranslation: 'Goodbye! See you tomorrow.'
          },
          {
            id: 'zh-1-4',
            word: '对不起',
            translation: "I'm sorry",
            pronunciation: 'duìbuqǐ',
            example: '对不起，我错了。',
            exampleTranslation: "I'm sorry, I was wrong."
          },
          {
            id: 'zh-1-5',
            word: '不客气',
            translation: "You're welcome",
            pronunciation: 'bù kèqi',
            example: '不客气，没问题。',
            exampleTranslation: "You're welcome, no problem."
          }
        ]
      },
      {
        id: 'zh-2',
        title: 'Common Expressions',
        vocabulary: [
          {
            id: 'zh-2-1',
            word: '你叫什么名字？',
            translation: 'What is your name?',
            pronunciation: 'nǐ jiào shénme míngzi?',
            example: '你叫什么名字？我叫李明。',
            exampleTranslation: 'What is your name? My name is Li Ming.'
          },
          {
            id: 'zh-2-2',
            word: '多少钱？',
            translation: 'How much is it?',
            pronunciation: 'duōshao qián?',
            example: '这个多少钱？',
            exampleTranslation: 'How much is this?'
          },
          {
            id: 'zh-2-3',
            word: '我不懂',
            translation: "I don't understand",
            pronunciation: 'wǒ bù dǒng',
            example: '对不起，我不懂。',
            exampleTranslation: "Sorry, I don't understand."
          },
          {
            id: 'zh-2-4',
            word: '请',
            translation: 'Please',
            pronunciation: 'qǐng',
            example: '请坐。',
            exampleTranslation: 'Please sit.'
          },
          {
            id: 'zh-2-5',
            word: '帮帮我',
            translation: 'Help me',
            pronunciation: 'bāng bāng wǒ',
            example: '请帮帮我。',
            exampleTranslation: 'Please help me.'
          }
        ]
      }
    ]
  },
  {
    code: 'ja',
    name: 'Japanese',
    flag: '🇯🇵',
    lessons: [
      {
        id: 'ja-1',
        title: 'Basic Greetings',
        vocabulary: [
          {
            id: 'ja-1-1',
            word: 'こんにちは',
            translation: 'Hello',
            pronunciation: 'konnichiwa',
            example: 'こんにちは！お元気ですか？',
            exampleTranslation: 'Hello! How are you?'
          },
          {
            id: 'ja-1-2',
            word: 'ありがとう',
            translation: 'Thank you',
            pronunciation: 'arigatou',
            example: 'どうもありがとうございます。',
            exampleTranslation: 'Thank you very much.'
          },
          {
            id: 'ja-1-3',
            word: 'さようなら',
            translation: 'Goodbye',
            pronunciation: 'sayounara',
            example: 'さようなら、またね。',
            exampleTranslation: 'Goodbye, see you later.'
          },
          {
            id: 'ja-1-4',
            word: 'すみません',
            translation: 'Excuse me / Sorry',
            pronunciation: 'sumimasen',
            example: 'すみません、道を教えてください。',
            exampleTranslation: 'Excuse me, please tell me the way.'
          },
          {
            id: 'ja-1-5',
            word: 'はい',
            translation: 'Yes',
            pronunciation: 'hai',
            example: 'はい、わかりました。',
            exampleTranslation: 'Yes, I understand.'
          }
        ]
      },
      {
        id: 'ja-2',
        title: 'Daily Phrases',
        vocabulary: [
          {
            id: 'ja-2-1',
            word: 'おはようございます',
            translation: 'Good morning',
            pronunciation: 'ohayou gozaimasu',
            example: 'おはようございます！今日はいい天気ですね。',
            exampleTranslation: 'Good morning! Nice weather today.'
          },
          {
            id: 'ja-2-2',
            word: 'いくらですか？',
            translation: 'How much is it?',
            pronunciation: 'ikura desu ka?',
            example: 'これはいくらですか？',
            exampleTranslation: 'How much is this?'
          },
          {
            id: 'ja-2-3',
            word: 'お名前は？',
            translation: 'What is your name?',
            pronunciation: 'onamae wa?',
            example: 'お名前は何ですか？',
            exampleTranslation: 'What is your name?'
          },
          {
            id: 'ja-2-4',
            word: 'いただきます',
            translation: 'I will receive (before meal)',
            pronunciation: 'itadakimasu',
            example: 'いただきます！',
            exampleTranslation: "Let's eat!"
          },
          {
            id: 'ja-2-5',
            word: 'わかりません',
            translation: "I don't understand",
            pronunciation: 'wakarimasen',
            example: 'すみません、わかりません。',
            exampleTranslation: "Sorry, I don't understand."
          }
        ]
      }
    ]
  }
];
