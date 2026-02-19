/**
 * Categories and topics for General Knowledge Tutor.
 * Content (facts + quiz) is generated at runtime by Gemini API.
 */
const CATEGORIES = [
  {
    id: 'animals',
    label: 'בעלי חיים',
    emoji: '🦁',
    topics: [
      { id: 'lions', label: 'אריות', emoji: '🦁' },
      { id: 'dolphins', label: 'דולפינים', emoji: '🐬' },
      { id: 'eagles', label: 'נשרים', emoji: '🦅' },
      { id: 'elephants', label: 'פילים', emoji: '🐘' },
      { id: 'penguins', label: 'פינגווינים', emoji: '🐧' },
      { id: 'octopus', label: 'תמנונים', emoji: '🐙' },
      { id: 'dogs', label: 'כלבים', emoji: '🐕' },
      { id: 'butterflies', label: 'פרפרים', emoji: '🦋' },
    ],
  },
  {
    id: 'space',
    label: 'חלל',
    emoji: '🚀',
    topics: [
      { id: 'sun', label: 'השמש', emoji: '☀️' },
      { id: 'moon', label: 'הירח', emoji: '🌙' },
      { id: 'planets', label: 'כוכבי לכת', emoji: '🪐' },
      { id: 'stars', label: 'כוכבים', emoji: '⭐' },
      { id: 'astronauts', label: 'אסטרונאוטים', emoji: '👨‍🚀' },
      { id: 'rockets', label: 'טילים', emoji: '🚀' },
      { id: 'earth', label: 'כדור הארץ', emoji: '🌍' },
      { id: 'milky-way', label: 'שביל החלב', emoji: '🌌' },
    ],
  },
  {
    id: 'science',
    label: 'מדע',
    emoji: '🔬',
    topics: [
      { id: 'water', label: 'מים', emoji: '💧' },
      { id: 'magnets', label: 'מגנטים', emoji: '🧲' },
      { id: 'colors', label: 'צבעים', emoji: '🌈' },
      { id: 'electricity', label: 'חשמל', emoji: '⚡' },
      { id: 'air', label: 'אוויר', emoji: '💨' },
      { id: 'ice', label: 'קרח', emoji: '🧊' },
      { id: 'plants', label: 'צמחים', emoji: '🌱' },
      { id: 'dinosaurs', label: 'דינוזאורים', emoji: '🦕' },
    ],
  },
  {
    id: 'geography',
    label: 'גאוגרפיה',
    emoji: '🌍',
    topics: [
      { id: 'oceans', label: 'אוקיינוסים', emoji: '🌊' },
      { id: 'mountains', label: 'הרים', emoji: '🏔️' },
      { id: 'deserts', label: 'מדבריות', emoji: '🏜️' },
      { id: 'rivers', label: 'נהרות', emoji: '🏞️' },
      { id: 'volcanoes', label: 'הרי געש', emoji: '🌋' },
      { id: 'forests', label: 'יערות', emoji: '🌲' },
      { id: 'islands', label: 'איים', emoji: '🏝️' },
      { id: 'poles', label: 'הקטבים', emoji: '🧊' },
    ],
  },
  {
    id: 'history',
    label: 'היסטוריה',
    emoji: '🏛️',
    topics: [
      { id: 'pyramids', label: 'פירמידות', emoji: '🔺' },
      { id: 'castles', label: 'טירות', emoji: '🏰' },
      { id: 'knights', label: 'אבירים', emoji: '⚔️' },
      { id: 'ancient-egypt', label: 'מצרים העתיקה', emoji: '🏛️' },
      { id: 'ancient-greece', label: 'יוון העתיקה', emoji: '🏺' },
      { id: 'pirates', label: 'פיראטים', emoji: '🏴‍☠️' },
      { id: 'cave-people', label: 'אנשי המערות', emoji: '🪨' },
      { id: 'vikings', label: 'ויקינגים', emoji: '⛵' },
    ],
  },
  {
    id: 'human-body',
    label: 'גוף האדם',
    emoji: '🫀',
    topics: [
      { id: 'heart', label: 'הלב', emoji: '❤️' },
      { id: 'bones', label: 'עצמות', emoji: '🦴' },
      { id: 'brain', label: 'המוח', emoji: '🧠' },
      { id: 'eyes', label: 'עיניים', emoji: '👁️' },
      { id: 'teeth', label: 'שיניים', emoji: '🦷' },
      { id: 'muscles', label: 'שרירים', emoji: '💪' },
      { id: 'lungs', label: 'ריאות', emoji: '🫁' },
      { id: 'skin', label: 'עור', emoji: '🤚' },
    ],
  },
  {
    id: 'music',
    label: 'מוזיקה',
    emoji: '🎵',
    topics: [
      { id: 'piano', label: 'פסנתר', emoji: '🎹' },
      { id: 'guitar', label: 'גיטרה', emoji: '🎸' },
      { id: 'drums', label: 'תופים', emoji: '🥁' },
      { id: 'violin', label: 'כינור', emoji: '🎻' },
      { id: 'singing', label: 'שירה', emoji: '🎤' },
      { id: 'orchestra', label: 'תזמורת', emoji: '🎼' },
      { id: 'flute', label: 'חליל', emoji: '🪈' },
      { id: 'rhythm', label: 'קצב', emoji: '🎶' },
    ],
  },
  {
    id: 'sports',
    label: 'ספורט',
    emoji: '⚽',
    topics: [
      { id: 'soccer', label: 'כדורגל', emoji: '⚽' },
      { id: 'basketball', label: 'כדורסל', emoji: '🏀' },
      { id: 'swimming', label: 'שחייה', emoji: '🏊' },
      { id: 'gymnastics', label: 'התעמלות', emoji: '🤸' },
      { id: 'running', label: 'ריצה', emoji: '🏃' },
      { id: 'tennis', label: 'טניס', emoji: '🎾' },
      { id: 'cycling', label: 'רכיבה על אופניים', emoji: '🚴' },
      { id: 'martial-arts', label: 'אומנויות לחימה', emoji: '🥋' },
    ],
  },
  {
    id: 'nature',
    label: 'טבע',
    emoji: '🌿',
    topics: [
      { id: 'trees', label: 'עצים', emoji: '🌳' },
      { id: 'flowers', label: 'פרחים', emoji: '🌸' },
      { id: 'rain', label: 'גשם', emoji: '🌧️' },
      { id: 'seasons', label: 'עונות השנה', emoji: '🍂' },
      { id: 'bees', label: 'דבורים', emoji: '🐝' },
      { id: 'coral-reefs', label: 'שוניות אלמוגים', emoji: '🪸' },
      { id: 'lightning', label: 'ברקים', emoji: '🌩️' },
      { id: 'rainbows', label: 'קשתות', emoji: '🌈' },
    ],
  },
  {
    id: 'inventions',
    label: 'המצאות',
    emoji: '💡',
    topics: [
      { id: 'wheel', label: 'הגלגל', emoji: '☸️' },
      { id: 'lightbulb', label: 'הנורה', emoji: '💡' },
      { id: 'airplane', label: 'המטוס', emoji: '✈️' },
      { id: 'telephone', label: 'הטלפון', emoji: '📞' },
      { id: 'printing', label: 'הדפוס', emoji: '🖨️' },
      { id: 'internet', label: 'האינטרנט', emoji: '🌐' },
      { id: 'camera', label: 'המצלמה', emoji: '📷' },
      { id: 'robot', label: 'רובוטים', emoji: '🤖' },
    ],
  },
];

function getCategoryById(categoryId) {
  return CATEGORIES.find(c => c.id === categoryId);
}

function getTopicById(categoryId, topicId) {
  const cat = getCategoryById(categoryId);
  return cat ? cat.topics.find(t => t.id === topicId) : null;
}
