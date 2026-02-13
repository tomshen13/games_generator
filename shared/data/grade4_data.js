/**
 * Israeli Ministry of Education Curriculum Data
 * Phase: Grade 4 (Kita Dalet)
 */

const GRADE_4_DATA = {
  subjects: {
    math:    { name: 'Math',    hebrewName: 'חשבון',  icon: '🔢', color: '#4ade80' },
    hebrew:  { name: 'Hebrew',  hebrewName: 'עברית',  icon: '🔤', color: '#4a9eff' },
    english: { name: 'English', hebrewName: 'אנגלית', icon: '🌎', color: '#a855f7' },
    logic:   { name: 'Logic',   hebrewName: 'חשיבה',  icon: '🧠', color: '#f97316' },
  },

  phase: {
    id: 'grade-4',
    name: '4th Grade',
    hebrewName: 'כיתה ד׳',
    shortName: 'Dalet',
    grade: 4,
    ageRange: [9, 10],
    icon: '📙',
    skills: [
      {
        id: 'g4-math-complex',
        name: 'Fractions & Algorithms',
        hebrewName: 'שברים ואלגוריתמים',
        subject: 'math',
        icon: '➗',
        levels: [
          {
            level: 1,
            name: 'Gaps',
            description: 'Struggles with large numbers',
            kpi: 'Unable to do 1000-25; No fraction concept; Division difficulties',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Scaffolded Ops',
            description: 'Guided division and simple fractions',
            kpi: 'Solves 42/3 with guidance; Compares 1/2 > 1/4; Identifies right angles',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'divide',
              factorRule: { include: [2, 3, 4, 5, 10], maxFactor: 10 },
            },
          },
          {
            level: 3,
            name: 'Long Division',
            description: 'Standard Algorithm and Fractions',
            kpi: 'Solves 3456/8; Adds fractions with like denominators; Area/Perimeter of rectangles',
            gameMapping: {
              gameId: 'pokemon-multiply',
              mode: 'divide',
              factorRule: { include: [6, 7, 8, 9], maxFactor: 12 },
            },
          },
          {
            level: 4,
            name: 'Mixed Numbers',
            description: 'Improper fractions and 2-digit mult',
            kpi: 'Converts 1 1/2 to 3/2; Solves 23x45; Solves fraction word problems',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Decimals & Order',
            description: 'Decimals and Order of Operations',
            kpi: 'Identifies 0.5 = 1/2; Solves (3+5)x2; Explains estimation reasoning',
            gameMapping: null,
          },
        ],
      },
      {
        id: 'g4-hebrew-info',
        name: 'Information Processing',
        hebrewName: 'עיבוד מידע',
        subject: 'hebrew',
        icon: '🧠',
        levels: [
          {
            level: 1,
            name: 'Disorganized',
            description: 'Struggles with non-narrative',
            kpi: 'Misses main point of science text; Struggles with academic vocabulary',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Basic Navigation',
            description: 'Grammar errors and identifying ideas',
            kpi: 'Extracts one fact; Writes with mixed tenses; Uses headings to find info',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'Summary',
            description: 'Summarizing informational text',
            kpi: 'Writes 10-sentence report; Conjugates verbs correctly; Uses Table of Contents',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Critical Reading',
            description: 'Bias and rich writing',
            kpi: 'Explains author purpose; Uses similes/metaphors; Uses relative clauses',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Persuasion',
            description: 'Debate and analysis',
            kpi: 'Writes formal complaint; Debates using evidence; Analyzes poem rhyme scheme',
            gameMapping: null,
          },
        ],
      },
      {
        id: 'g4-english-progression',
        name: 'A1 Progression',
        hebrewName: 'התקדמות A1',
        subject: 'english',
        icon: '📈',
        levels: [
          {
            level: 1,
            name: 'Phonetic Reading',
            description: 'No comprehension',
            kpi: 'Reads "The dog is big" without understanding; Struggles to copy words',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Simple Comprehension',
            description: 'Short descriptions',
            kpi: 'Writes "I have a dog" (grammar errors); Matches Q&A; Identifies keywords in audio',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'A1 Mastery',
            description: '100-word texts and daily routine',
            kpi: 'Describes picture ("He is playing"); Uses Present Progressive; Talks about routine',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'Connected Speech',
            description: 'Conjunctions and prediction',
            kpi: 'Uses "because/so"; Retells story; Reads specific info from ads',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Emergent A2',
            description: 'Past tense and independent reading',
            kpi: 'Uses Past Simple (was/were); Improvised dialogue; Reads 10-page reader',
            gameMapping: null,
          },
        ],
      },
      {
        id: 'g4-logic-data',
        name: 'Variables & Data',
        hebrewName: 'משתנים ונתונים',
        subject: 'logic',
        icon: '📊',
        levels: [
          {
            level: 1,
            name: 'Copying',
            description: 'No understanding of variables',
            kpi: 'Creates moving sprite but cannot control; Confuses Variable vs Sprite',
            gameMapping: null,
          },
          {
            level: 2,
            name: 'Basic Variables',
            description: 'Scoring with bugs',
            kpi: 'Creates timer; Animates sprite walking',
            gameMapping: null,
          },
          {
            level: 3,
            name: 'Data Handling',
            description: 'Tracking state (Score/Lives)',
            kpi: 'Creates Maze Game with collision; Broadcasts between sprites; Resets game on loss',
            gameMapping: null,
          },
          {
            level: 4,
            name: 'AI & Randomness',
            description: 'Loops and unpredictable behavior',
            kpi: 'Programs chasing enemy (AI); Uses Pick Random; Uses Repeat Until',
            gameMapping: null,
          },
          {
            level: 5,
            name: 'Complex Logic',
            description: 'Nested Ifs and Peer Tutoring',
            kpi: 'Creates math quiz game; Debugs peer project; Adds Start/Game Over screens',
            gameMapping: null,
          },
        ],
      },
    ],
  },
};