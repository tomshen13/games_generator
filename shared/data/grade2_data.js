/**
 * Israeli Ministry of Education Curriculum Data
 * Phase: Grade 2 (Kita Bet)
 */

const GRADE_2_DATA = {
  subjects: {
    math:    { name: 'Math',    hebrewName: 'חשבון',  icon: '🔢', color: '#4ade80' },
    hebrew:  { name: 'Hebrew',  hebrewName: 'עברית',  icon: '🔤', color: '#4a9eff' },
    english: { name: 'English', hebrewName: 'אנגלית', icon: '🌎', color: '#a855f7' },
    logic:   { name: 'Logic',   hebrewName: 'חשיבה',  icon: '🧠', color: '#f97316' },
  },

  phase: {
    id: 'grade-2',
    name: '2nd Grade',
    hebrewName: 'כיתה ב׳',
    shortName: 'Bet',
    grade: 2,
    ageRange: [7, 8],
    icon: '📘',
    skills: [
      {
        id: 'g2-math-operations',
        name: 'Extending Operations',
        hebrewName: 'הרחבת הפעולות',
        subject: 'math',
        icon: '✖️',
        levels: [
          {
            level: 1,
            name: 'Place Value Struggle',
            description: 'Confusing tens/ones and counting by ones',
            kpi: 'Adds within 20 but fails 23+4; Identifies 1-100 but cannot order; Cannot calc change from 10',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'No Regrouping',
            description: 'Simple 2-digit operations',
            kpi: 'Solves 24+13; Skips counts by 10s/5s; Measures length with non-standard units',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'add',
              additionRule: { minOperand: 10, maxOperand: 50, maxSum: 50 },
            },
          },
          {
            level: 3,
            name: 'Regrouping Mastery',
            description: 'Addition/Subtraction to 100 with carry',
            kpi: 'Solves 45+37 vertically; Represents 3x5 as 5+5+5; Reads numbers to 1,000',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'add',
              additionRule: { minOperand: 10, maxOperand: 99, maxSum: 199 },
            },
          },
          {
            level: 4,
            name: 'Early Multiplication',
            description: 'Tables 1-5 and Time',
            kpi: 'Recalls facts for 2, 5, 10; Tells time to quarter-hour; Solves money word problems',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'multiply',
              factorRule: { include: [2, 5, 10], maxFactor: 10 },
            },
          },
          {
            level: 5,
            name: 'Mental Flexibility',
            description: 'Compensation and Division concepts',
            kpi: 'Solves 98+45 via 100+43; Divides 12 into 3 groups; Solves Magic Squares',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'subtract',
              subtractionRule: { maxMinuend: 100, maxOperand: 50 },
            },
          },
        ],
      },
      {
        id: 'g2-hebrew-fluency',
        name: 'Fluency & Comprehension',
        hebrewName: 'שטף והבנה',
        subject: 'hebrew',
        icon: '📖',
        levels: [
          {
            level: 1,
            name: 'Stilted Reading',
            description: 'Slow reading with heavy vowel reliance',
            kpi: 'Reads <30 WPM; Struggles with literal questions; Writing is illegible/phonetic',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Literal Understanding',
            description: 'Accurate but slow',
            kpi: 'Reads 40–50 WPM; Identifies main character; Writes simple picture descriptions',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'Fluent Standard',
            description: 'Proper pace and intonation (MoE Standard)',
            kpi: 'Reads 60–70 WPM (95% acc); Infers character feelings; Writes 5-sentence paragraph',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Independent Reading',
            description: 'Chapter books and basic punctuation',
            kpi: 'Summarizes short story; Distinguishes poems vs stories; Uses synonyms/antonyms',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Deep Comprehension',
            description: 'High fluency and creative writing',
            kpi: 'Reads >90 WPM; Writes story with dialogue; Compares characters from different stories',
            gameMapping: null,
          },
        ],
      },
      {
        id: 'g2-english-phonics',
        name: 'Alphabet & Phonemics',
        hebrewName: 'א-ב ופונטיקה',
        subject: 'english',
        icon: '🔤',
        levels: [
          {
            level: 1,
            name: 'Letter Confusion',
            description: 'Knowing names but not sounds',
            kpi: 'Sings ABCs but cannot identify letters; Struggles to form Latin letters',
            gameMapping: { gameId: 'voice-tutor', focus: 'pronunciation', adaptiveKeys: ['phonemes'] },
          },
          {
            level: 2,
            name: 'Sound Matching',
            description: 'Matching letters to sounds',
            kpi: 'Writes 10 letters from dictation; Copies words accurately; Identifies initial sounds',
            gameMapping: { gameId: 'voice-tutor', focus: 'pronunciation', adaptiveKeys: ['pronunciation'] },
          },
          {
            level: 3,
            name: 'CVC Decoding',
            description: 'Reading simple words (Pre-A1)',
            kpi: 'Decodes "cat", "dog", "sit"; Writes A-Z; Reads simple captions',
            gameMapping: { gameId: 'voice-tutor', focus: 'vocabulary', theme: 'nouns', adaptiveKeys: ['nouns'] },
          },
          {
            level: 4,
            name: 'Sight Sentences',
            description: 'Reading short sentences',
            kpi: 'Reads "The cat is on the mat"; Spells "red", "big"; Categorizes words',
            gameMapping: { gameId: 'voice-tutor', focus: 'vocabulary', theme: 'adjectives', adaptiveKeys: ['adjectives'] },
          },
          {
            level: 5,
            name: 'Early Readers',
            description: 'Reading simple storybooks',
            kpi: 'Reads 4-page leveled reader; Writes "I like pizza"; Asks "What is this?"',
            gameMapping: { gameId: 'voice-tutor', focus: 'conversation', adaptiveKeys: ['my-self'] },
          },
        ],
      },
      {
        id: 'g2-logic-loops',
        name: 'Loops & Events',
        hebrewName: 'לולאות ואירועים',
        subject: 'logic',
        icon: '🔁',
        levels: [
          {
            level: 1,
            name: 'Linear Execution',
            description: 'Inefficient long code',
            kpi: 'Drags blocks randomly; Fails to connect "Start" block',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Simple Loops',
            description: 'Shortening code with repetition',
            kpi: 'Replaces repeated moves with "Repeat 3"; Orders 5 blocks for movement',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'Event-Driven',
            description: 'Triggers and interactivity',
            kpi: 'Uses "When Green Flag Clicked"; Programs tap-to-move; Uses "Start on Bump"',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Concurrency',
            description: 'Multiple interacting sprites',
            kpi: 'Programs 2 characters moving simultaneously; Debugs 5-block script; Uses "Wait"',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Interactive Story',
            description: 'Animation and dialogue',
            kpi: 'Programs speech bubbles; Changes backgrounds; Records voice sounds',
            gameMapping: null,
          },
        ],
      },
    ],
  },
};