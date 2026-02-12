/**
 * Mode definitions for Unicorn Numbers / Letters.
 * Each mode provides level data, display logic, speech, and localized strings.
 */

const HEBREW_LETTER_NAMES = {
  'א': { he: 'אָלֶף', en: 'Alef' },
  'ב': { he: 'בֵּית', en: 'Bet' },
  'ג': { he: 'גִּימֶל', en: 'Gimel' },
  'ד': { he: 'דָּלֶת', en: 'Dalet' },
  'ה': { he: 'הֵא', en: 'He' },
  'ו': { he: 'וָו', en: 'Vav' },
  'ז': { he: 'זַיִן', en: 'Zayin' },
  'ח': { he: 'חֵית', en: 'Chet' },
  'ט': { he: 'טֵית', en: 'Tet' },
  'י': { he: 'יוֹד', en: 'Yod' },
  'כ': { he: 'כָּף', en: 'Kaf' },
  'ל': { he: 'לָמֶד', en: 'Lamed' },
  'מ': { he: 'מֵם', en: 'Mem' },
  'נ': { he: 'נוּן', en: 'Nun' },
  'ס': { he: 'סָמֶך', en: 'Samekh' },
  'ע': { he: 'עַיִן', en: 'Ayin' },
  'פ': { he: 'פֵּא', en: 'Pe' },
  'צ': { he: 'צָדִי', en: 'Tsadi' },
  'ק': { he: 'קוֹף', en: 'Kof' },
  'ר': { he: 'רֵישׁ', en: 'Resh' },
  'ש': { he: 'שִׁין', en: 'Shin' },
  'ת': { he: 'תָּו', en: 'Tav' },
};

const ALL_HEBREW_LETTERS = ['א','ב','ג','ד','ה','ו','ז','ח','ט','י','כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'];

const HEBREW_LETTER_LEVELS = [
  {
    id: 1,
    items: ['א','ב','ג','ד','ה'],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '🔥 Alef to He!',
  },
  {
    id: 2,
    items: ['א','ב','ג','ד','ה'],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: '💧 Alef to He!',
  },
  {
    id: 3,
    items: ['ו','ז','ח','ט','י'],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '🔥 Vav to Yod!',
  },
  {
    id: 4,
    items: ['א','ב','ג','ד','ה','ו','ז','ח','ט','י'],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: '💧 Alef to Yod!',
  },
  {
    id: 5,
    items: ['כ','ל','מ','נ','ס'],
    targetsPerRound: 3,
    rounds: 5,
    power: 'fire',
    title: '🔥 Kaf to Samekh!',
  },
  {
    id: 6,
    items: ['ע','פ','צ','ק','ר','ש','ת'],
    targetsPerRound: 4,
    rounds: 5,
    power: 'water',
    title: '💧 Ayin to Tav!',
  },
  {
    id: 7,
    items: ['כ','ל','מ','נ','ס','ע','פ','צ','ק','ר','ש','ת'],
    targetsPerRound: 5,
    rounds: 5,
    power: 'rainbow',
    title: '🌈 Kaf to Tav!',
  },
  {
    id: 8,
    items: ALL_HEBREW_LETTERS.slice(),
    targetsPerRound: 6,
    rounds: 7,
    power: 'choice',
    title: '🎉 Full Alef-Bet!',
  },
];

const MODES = {
  numbers: {
    id: 'numbers',
    storageKey: 'unicorn-numbers',
    icon: '🔢',
    label: { en: 'Numbers', he: 'מספרים' },
    titleText: { en: 'Unicorn Numbers', he: 'מספרי חד-קרן' },
    subtitle: { en: 'Learn numbers 1–20 with Sparky!', he: '!למדו מספרים 1–20 עם ספארקי' },
    promptText: { en: 'Which number do you hear?', he: '?איזה מספר אני אומר' },
    completeTitle: { en: "You're a Number Wizard!", he: '!את קוסמת של מספרים' },
    completeSpeech: { en: 'You are a Number Wizard!', he: '!את קוסמת של מספרים' },
    completeSubtitle: { en: 'You learned all numbers 1–20!', he: '!למדת את כל המספרים 1–20' },
    congratsSpeech: { en: 'Great job!', he: '!כל הכבוד' },
    displayItem(item) { return String(item); },
    supportsDots: true,
    allItems: Array.from({ length: 20 }, (_, i) => i + 1),
    levels: [], // filled by levels.js
  },

  'hebrew-letters': {
    id: 'hebrew-letters',
    storageKey: 'unicorn-hebrew',
    icon: 'אב',
    label: { en: 'Letters', he: 'אותיות' },
    titleText: { en: 'Unicorn Letters', he: 'אותיות חד-קרן' },
    subtitle: { en: 'Learn the Alef-Bet with Sparky!', he: '!למדו את האלף-בית עם ספארקי' },
    promptText: { en: 'Which letter do you hear?', he: '?איזה אות אני אומר' },
    completeTitle: { en: "You're an Alef-Bet Star!", he: '!את כוכבת האלף-בית' },
    completeSpeech: { en: 'You know the whole Alef Bet!', he: '!את יודעת את כל האלף בית' },
    completeSubtitle: { en: 'You learned the whole Alef-Bet!', he: '!למדת את כל האלף-בית' },
    congratsSpeech: { en: 'Great job!', he: '!כל הכבוד' },
    displayItem(item) { return item; },
    supportsDots: false,
    allItems: ALL_HEBREW_LETTERS,
    levels: HEBREW_LETTER_LEVELS,
  },
};
