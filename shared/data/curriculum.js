/**
 * Israeli Ministry of Education Curriculum Data
 *
 * 5 Phases → 12 Skills → 60 Levels, each with a KPI.
 * Edit this file to add/change skills, levels, or game mappings.
 *
 * gameMapping: null        → level is locked (no game yet)
 * gameMapping.adaptiveKeys → explicit list of adaptive record keys
 * gameMapping.factorRule   → multiplication keys computed at runtime
 */

const CURRICULUM_DATA = {
  subjects: {
    math:    { name: 'Math',    hebrewName: 'חשבון',  icon: '🔢', color: '#4ade80' },
    hebrew:  { name: 'Hebrew',  hebrewName: 'עברית',  icon: '🔤', color: '#4a9eff' },
    english: { name: 'English', hebrewName: 'אנגלית', icon: '🌎', color: '#a855f7' },
    logic:   { name: 'Logic',   hebrewName: 'חשיבה',  icon: '🧠', color: '#f97316' },
  },

  phases: [
    // ──────────────────────────────────────────────────────
    // Phase 1: Kindergarten (גן חובה / Ages 5-6)
    // ──────────────────────────────────────────────────────
    {
      id: 'kindergarten',
      name: 'Kindergarten',
      hebrewName: 'גן חובה',
      shortName: 'Gan',
      grade: 0,
      ageRange: [5, 6],
      icon: '🌱',
      skills: [
        {
          id: 'phonological-awareness',
          name: 'Phonological Awareness',
          hebrewName: 'מודעות פונולוגית',
          subject: 'hebrew',
          icon: '👂',
          levels: [
            {
              level: 1,
              name: 'Listening',
              description: 'Differentiate between environmental sounds vs. human speech',
              kpi: 'Correctly identifies 5 distinct sounds (bell, dog, car) without visual cues',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Rhyming',
              description: 'Identify if two words rhyme',
              kpi: 'Correctly answers "Does Sullam rhyme with Olam?" (80% accuracy)',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Syllabication',
              description: 'Breaking words into "claps" (Havarot)',
              kpi: 'Correctly taps out syllables for 3-syllable words (e.g., A-vi-ron = 3)',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Isolation',
              description: 'Identifying the first sound of a word',
              kpi: 'Identifies that "Abba" starts with /A/ and "Bamba" starts with /B/',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Segmentation',
              description: 'Breaking a whole word into its phonemes',
              kpi: 'Can break a CVC word like Sus into /s/ - /u/ - /s/',
              gameMapping: null,
            },
          ],
        },
        {
          id: 'number-sense',
          name: 'Number Sense',
          hebrewName: 'חוש מספרי',
          subject: 'math',
          icon: '🔢',
          levels: [
            {
              level: 1,
              name: 'Counting',
              description: 'Rote counting 1-10',
              kpi: 'Recites numbers 1-10 in correct order without skipping',
              gameMapping: {
                gameId: 'unicorn-numbers',
                adaptiveKeys: ['1','2','3','4','5','6','7','8','9','10'],
              },
            },
            {
              level: 2,
              name: 'Correspondence',
              description: '1-to-1 matching',
              kpi: 'Drags exactly 5 apples to feed 5 horses (no more, no less)',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Subitizing',
              description: 'Seeing quantity without counting',
              kpi: 'Instantly recognizes dice patterns (1-6) within 1 second',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Comparison',
              description: 'More vs. Less',
              kpi: 'Identifies which group has more items when visual size is misleading',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Composition',
              description: 'Parts of a whole (up to 5)',
              kpi: 'Understands that 2 and 3 make 5 (visual grouping)',
              gameMapping: null,
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────
    // Phase 2: 1st Grade (כיתה א׳ / Ages 6-7)
    // ──────────────────────────────────────────────────────
    {
      id: 'grade-1',
      name: '1st Grade',
      hebrewName: 'כיתה א׳',
      shortName: 'Alef',
      grade: 1,
      ageRange: [6, 7],
      icon: '📖',
      skills: [
        {
          id: 'reading-acquisition',
          name: 'Reading Acquisition',
          hebrewName: 'רכישת קריאה',
          subject: 'hebrew',
          icon: '🔤',
          levels: [
            {
              level: 1,
              name: 'The Alphabet',
              description: 'Letter recognition',
              kpi: 'Identifies all 22 letters by name',
              gameMapping: {
                gameId: 'unicorn-hebrew',
                adaptiveKeys: ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'],
              },
            },
            {
              level: 2,
              name: 'The Vowels',
              description: 'Nikud basics (Kamatz, Patach, Shva)',
              kpi: 'Matches the sound /Ah/ to the correct symbol under a letter',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Blending',
              description: 'Letter + Vowel',
              kpi: 'Reads open syllables (Ba, Ga, Da) accurately',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Decoding Words',
              description: 'Reading without meaning',
              kpi: 'Reads simple non-words (Hakam, Zapad) to prove decoding skills',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Meaningful Reading',
              description: 'First words',
              kpi: 'Reads a word and matches it to a picture (e.g., reads Kad → clicks jar)',
              gameMapping: null,
            },
          ],
        },
        {
          id: 'operations-to-20',
          name: 'Operations to 20',
          hebrewName: 'חיבור/חיסור',
          subject: 'math',
          icon: '➕',
          levels: [
            {
              level: 1,
              name: 'Number Line',
              description: 'Forward/Backward',
              kpi: 'Fills in missing numbers in a sequence (e.g., 14, __, 16)',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Simple Addition',
              description: 'Sums within 10',
              kpi: 'Solves 3 + 4 using fingers or objects',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'The Ten Frame',
              description: 'Complements to 10',
              kpi: 'Instantly knows 8 + 2 = 10 and 6 + 4 = 10',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Crossing Ten',
              description: 'Addition with regrouping',
              kpi: 'Solves 8 + 5 by breaking it into 8 + 2 + 3',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Subtraction',
              description: 'Taking away',
              kpi: 'Solves subtraction problems within 20 (15 - 4)',
              gameMapping: null,
            },
          ],
        },
        {
          id: 'english-ear',
          name: 'The Ear',
          hebrewName: 'שמיעה',
          subject: 'english',
          icon: '👂',
          levels: [
            {
              level: 1,
              name: 'Phonemes',
              description: 'Hearing "Hebrew-illegal" sounds',
              kpi: 'Distinguishes /th/ from /s/ and /w/ from /v/ in audio clips',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Nouns',
              description: 'Core vocabulary (My World)',
              kpi: 'Identifies 20 classroom objects (Bag, Pen, Desk)',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Verbs',
              description: 'Total Physical Response (TPR)',
              kpi: 'Performs the action for "Jump," "Sit," "Clap" correctly',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Adjectives',
              description: 'Colors and Sizes',
              kpi: 'Selects the "Big Red Ball" out of 4 options',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Chunks',
              description: 'Set phrases',
              kpi: 'Understands "Good Morning," "How are you," "Sit down"',
              gameMapping: null,
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────
    // Phase 3: 2nd Grade (כיתה ב׳ / Ages 7-8)
    // ──────────────────────────────────────────────────────
    {
      id: 'grade-2',
      name: '2nd Grade',
      hebrewName: 'כיתה ב׳',
      shortName: 'Bet',
      grade: 2,
      ageRange: [7, 8],
      icon: '📚',
      skills: [
        {
          id: 'hebrew-fluency',
          name: 'Fluency',
          hebrewName: 'שטף',
          subject: 'hebrew',
          icon: '📖',
          levels: [
            {
              level: 1,
              name: 'Sight Words',
              description: 'High frequency words',
              kpi: 'Recognizes common words (Gam, Shel, Et, Im) in < 0.5 seconds',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Cursive/Ktiv',
              description: 'Print to Script conversion',
              kpi: 'Matches Print Aleph to Cursive Aleph',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Accuracy',
              description: 'Reading aloud',
              kpi: 'Reads a 50-word text with fewer than 3 errors',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Pacing',
              description: 'Speed',
              kpi: 'Reads grade-level text at 30+ words per minute',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Prosody',
              description: 'Expression',
              kpi: 'Pauses correctly at periods and uses upward inflection for question marks',
              gameMapping: null,
            },
          ],
        },
        {
          id: 'structure-geometry',
          name: 'Structure & Geometry',
          hebrewName: 'מבנה וגיאומטריה',
          subject: 'math',
          icon: '📐',
          levels: [
            {
              level: 1,
              name: 'Place Value',
              description: 'Units vs Tens',
              kpi: 'Identifies that in "42", the 4 represents 40',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Vertical Math',
              description: 'Column addition',
              kpi: 'Solves 2-digit addition without carrying',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Carrying/Borrowing',
              description: 'Complex vertical math',
              kpi: 'Solves 45 + 27 correctly handling the carry-over',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Multiplication Concept',
              description: 'Repeated addition',
              kpi: 'Represents 3 x 4 as 4 + 4 + 4',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Geometry 3D',
              description: 'Solids',
              kpi: 'Identifies vertices, edges, and faces on a cube',
              gameMapping: null,
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────
    // Phase 4: 3rd Grade (כיתה ג׳ / Ages 8-9)
    // ──────────────────────────────────────────────────────
    {
      id: 'grade-3',
      name: '3rd Grade',
      hebrewName: 'כיתה ג׳',
      shortName: 'Gimel',
      grade: 3,
      ageRange: [8, 9],
      icon: '✖️',
      skills: [
        {
          id: 'multiplication',
          name: 'Multiplication',
          hebrewName: 'לוח הכפל',
          subject: 'math',
          icon: '✖️',
          levels: [
            {
              level: 1,
              name: 'Skip Counting',
              description: '2s, 5s, 10s',
              kpi: 'Counts by 5s to 50 in under 10 seconds',
              gameMapping: {
                gameId: 'pokemon-multiply',
                factorRule: { include: [2, 5, 10], maxFactor: 10 },
              },
            },
            {
              level: 2,
              name: 'Low Tables',
              description: '3s and 4s',
              kpi: '90% accuracy on mixed 3x and 4x problems',
              gameMapping: {
                gameId: 'pokemon-multiply',
                factorRule: { include: [3, 4], maxFactor: 10, exclude: [2, 5, 10] },
              },
            },
            {
              level: 3,
              name: 'The Squares',
              description: '6x6, 7x7, 8x8',
              kpi: 'Instant recall of perfect squares',
              gameMapping: {
                gameId: 'pokemon-multiply',
                factorRule: { squares: true, minFactor: 1, maxFactor: 9 },
              },
            },
            {
              level: 4,
              name: 'Hard Tables',
              description: '6s, 7s, 8s, 9s',
              kpi: 'Solves 7 x 8 and 6 x 9 within 3 seconds',
              gameMapping: {
                gameId: 'pokemon-multiply',
                factorRule: { include: [6, 7, 8, 9], maxFactor: 9, exclude: [2, 3, 4, 5, 10] },
              },
            },
            {
              level: 5,
              name: 'Division',
              description: 'Inverse operations',
              kpi: 'Solves 42 / 7 = ? by knowing 6 x 7 = 42',
              gameMapping: null,
            },
          ],
        },
        {
          id: 'english-speaking',
          name: 'Speaking',
          hebrewName: 'דיבור',
          subject: 'english',
          icon: '🗣️',
          levels: [
            {
              level: 1,
              name: 'Pronunciation',
              description: '"Th" and "R"',
              kpi: 'AI detects correct pronunciation of "Three" vs "Tree"',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'My Self',
              description: 'Fixed phrases',
              kpi: 'Can state Name, Age, and Location in a full sentence',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Q&A',
              description: 'Answering',
              kpi: 'Answers "Do you like pizza?" with "Yes, I do" (not just "Yes")',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Description',
              description: 'Adjective placement',
              kpi: 'Says "Blue car" (correct) instead of "Car blue" (Hebrew syntax error)',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Dialogue',
              description: '3-turn exchange',
              kpi: 'Completes a 3-step conversation (Greeting → Question → Farewell)',
              gameMapping: null,
            },
          ],
        },
      ],
    },

    // ──────────────────────────────────────────────────────
    // Phase 5: 4th Grade (כיתה ד׳ / Ages 9-10)
    // ──────────────────────────────────────────────────────
    {
      id: 'grade-4',
      name: '4th Grade',
      hebrewName: 'כיתה ד׳',
      shortName: 'Dalet',
      grade: 4,
      ageRange: [9, 10],
      icon: '🧠',
      skills: [
        {
          id: 'algorithmic-thinking',
          name: 'Algorithmic Thinking',
          hebrewName: 'חשיבה אלגוריתמית',
          subject: 'logic',
          icon: '🧠',
          levels: [
            {
              level: 1,
              name: 'Sequencing',
              description: 'Order of operations',
              kpi: 'Arranges 5 steps to solve a maze',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Loops',
              description: 'Efficiency',
              kpi: 'Replaces "Walk, Walk, Walk, Walk" with "Repeat(Walk, 4)"',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Conditionals',
              description: 'If/Else',
              kpi: 'Programs a bot: "If Red, Turn Right; Else, Turn Left"',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Debugging',
              description: 'Find the error',
              kpi: 'Identifies why a given sequence failed to solve the level',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Variables',
              description: 'Score keeping',
              kpi: 'Understands the concept of Score = Score + 1',
              gameMapping: null,
            },
          ],
        },
        {
          id: 'fractions-division',
          name: 'Fractions & Division',
          hebrewName: 'שברים וחילוק',
          subject: 'math',
          icon: '➗',
          levels: [
            {
              level: 1,
              name: 'Parts',
              description: 'Visualizing fractions',
              kpi: 'Identifies 1/4 of a pizza vs 1/2',
              gameMapping: null,
            },
            {
              level: 2,
              name: 'Comparison',
              description: 'Denominators',
              kpi: 'Knows that 1/3 is larger than 1/8',
              gameMapping: null,
            },
            {
              level: 3,
              name: 'Long Division',
              description: 'The Algorithm',
              kpi: 'Solves 48 / 2 using the standard algorithm',
              gameMapping: null,
            },
            {
              level: 4,
              name: 'Remainders',
              description: 'Modulo',
              kpi: 'Solves 10 / 3 and identifies the remainder is 1',
              gameMapping: null,
            },
            {
              level: 5,
              name: 'Word Problems',
              description: 'Multi-step',
              kpi: 'Extracts a two-step equation from a text story (e.g., (4x5) + 2)',
              gameMapping: null,
            },
          ],
        },
      ],
    },
  ],
};
