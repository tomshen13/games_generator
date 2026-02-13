/**
 * Israeli Ministry of Education Curriculum Data
 * Phase: Grade 3 (Kita Gimel)
 */

const GRADE_3_DATA = {
  subjects: {
    math:    { name: 'Math',    hebrewName: 'חשבון',  icon: '🔢', color: '#4ade80' },
    hebrew:  { name: 'Hebrew',  hebrewName: 'עברית',  icon: '🔤', color: '#4a9eff' },
    english: { name: 'English', hebrewName: 'אנגלית', icon: '🌎', color: '#a855f7' },
    logic:   { name: 'Logic',   hebrewName: 'חשיבה',  icon: '🧠', color: '#f97316' },
  },

  phase: {
    id: 'grade-3',
    name: '3rd Grade',
    hebrewName: 'כיתה ג׳',
    shortName: 'Gimel',
    grade: 3,
    ageRange: [8, 9],
    icon: '📗',
    skills: [
      {
        id: 'g3-math-mastery',
        name: 'Mastery of Whole Numbers',
        hebrewName: 'שליטה במספרים שלמים',
        subject: 'math',
        icon: '✖️',
        levels: [
          {
            level: 1,
            name: 'Incomplete Tables',
            description: 'Struggles with multiplication/subtraction',
            kpi: 'Solves 3x4 by counting up; Errors in vertical subtraction (400-129)',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Basic Tables',
            description: 'Tables 1-5 and Ops to 1,000',
            kpi: 'Solves 3x8; Reads numbers to 1,000; Solves 12/3 with counters',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'multiply',
              factorRule: { include: [3, 4], maxFactor: 10, exclude: [2, 5, 10] },
            },
          },
          {
            level: 3,
            name: 'Full Tables',
            description: 'Tables 1-10 and Division (MoE Standard)',
            kpi: 'Solves 45/5 and 23/5 (remainder); Calc perimeter; Identifies place value in 5,432',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'multiply',
              factorRule: { squares: true, minFactor: 1, maxFactor: 9 },
            },
          },
          {
            level: 4,
            name: 'Multi-Digit Ops',
            description: '2-digit mult and data interpretation',
            kpi: 'Solves 123x4 vertically; Interprets bar graphs; Solves 2-step word problems',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'multiply',
              factorRule: { include: [6, 7, 8, 9], maxFactor: 12, exclude: [2, 3, 4, 5, 10] },
            },
          },
          {
            level: 5,
            name: 'Fraction Intro',
            description: 'Unit fractions and logic',
            kpi: 'Identifies fractions on number line; Uses unitary method (3 pens=12); Estimates sums',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'divide',
              factorRule: { include: [2, 3, 4, 5, 10], maxFactor: 10 },
            },
          },
        ],
      },
      {
        id: 'g3-hebrew-texts',
        name: 'Variety of Texts',
        hebrewName: 'מגוון טקסטים',
        subject: 'hebrew',
        icon: '📰',
        levels: [
          {
            level: 1,
            name: 'Limited Extraction',
            description: 'Slow reading, no punctuation',
            kpi: 'Reads <60 WPM; Writes without punctuation; Can only answer explicit questions',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Main Ideas',
            description: 'Phonetic writing, identifying genre',
            kpi: 'Answers Who/What/Where; Uses basic conjunctions; Identifies title/author',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'Fluent Unvocalized',
            description: 'Standard fluency and cohesion',
            kpi: 'Reads 80–90 WPM; Identifies text purpose; Writes paragraph with opening/closing',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Inference',
            description: 'Cause/Effect and Roots',
            kpi: 'Identifies root words; Writes opinion piece; Infers why events happened',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Analysis',
            description: 'Metaphors and structured reports',
            kpi: 'Distinguishes fact/opinion; Uses diverse connectors; Explains moral of fable',
            gameMapping: null,
          },
        ],
      },
      {
        id: 'g3-english-basic',
        name: 'Basic User (Pre-A1/A1)',
        hebrewName: 'משתמש בסיסי',
        subject: 'english',
        icon: '🗣️',
        levels: [
          {
            level: 1,
            name: 'Decoding Struggle',
            description: 'Visual memory reliance',
            kpi: 'Reads <10 words/min; Confuses vowel sounds; Needs translation',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'CVC & Lists',
            description: 'Simple sight words and labels',
            kpi: 'Decodes "pen", "map"; Copies text accurately; Matches words to pictures',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'A1 Foundation',
            description: 'Short texts and sentences',
            kpi: 'Reads 50-word text; Writes "My favorite food is..."; Uses "I have/like/can"',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Grammar Basics',
            description: 'Present Simple and Q&A',
            kpi: 'Uses "He/She has"; Asks "Where is the book?"; Reads story with dialogue',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Contextual Reading',
            description: 'Guessing from context',
            kpi: 'Guesses meaning from pictures; Writes email invitation; Describes picture in detail',
            gameMapping: null,
          },
        ],
      },
      {
        id: 'g3-logic-conditionals',
        name: 'Conditionals & Logic',
        hebrewName: 'תנאים ולוגיקה',
        subject: 'logic',
        icon: '🔀',
        levels: [
          {
            level: 1,
            name: 'Passive Execution',
            description: 'Running pre-made code',
            kpi: 'Presses Play on existing projects; Cannot change outcome',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Modification',
            description: 'Changing parameters',
            kpi: 'Changes "Move 10" to "Move 50"; Changes sprite costumes',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'Logic Gates',
            description: 'If-Then statements',
            kpi: 'Programs "If touching edge, bounce"; Uses arrow keys; Uses "If Red then Stop"',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Variables & Sync',
            description: 'Scoring and Broadcasting',
            kpi: 'Creates score counter; Syncs dialogue with Wait; Uses Broadcast Message',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Game Design',
            description: 'Decomposition and Rules',
            kpi: 'Plans project on paper; Programs win/loss condition; Remixes projects',
            gameMapping: null,
          },
        ],
      },
    ],
  },
};