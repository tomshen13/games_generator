/**
 * Ciao Italia — Static curated Italian vocabulary word lists.
 * Each category is a "city" with 24+ words ordered from common to uncommon.
 * Words are grouped in tiers of 8; the adaptive system controls which tiers are active.
 */

const ITALIAN_CATEGORIES = [
  {
    id: 'greetings',
    enLabel: 'Greetings',
    itLabel: 'Saluti',
    emoji: '👋',
    cityName: 'Roma',
    cityEmoji: '🏛️',
    color: '#e74c3c',
    words: [
      // Tier 1 — essentials
      { id: 'g01', en: 'Hello', it: 'Ciao', phonetic: 'CHOW', emoji: '👋' },
      { id: 'g02', en: 'Good morning', it: 'Buongiorno', phonetic: 'bwon-JOR-no', emoji: '🌅' },
      { id: 'g03', en: 'Good night', it: 'Buonanotte', phonetic: 'bwon-ah-NOT-teh', emoji: '🌙' },
      { id: 'g04', en: 'Please', it: 'Per favore', phonetic: 'pair fah-VOH-reh', emoji: '🙏' },
      { id: 'g05', en: 'Thank you', it: 'Grazie', phonetic: 'GRAH-tsee-eh', emoji: '😊' },
      { id: 'g06', en: 'Yes', it: 'Sì', phonetic: 'SEE', emoji: '✅' },
      { id: 'g07', en: 'No', it: 'No', phonetic: 'NO', emoji: '❌' },
      { id: 'g08', en: 'Goodbye', it: 'Arrivederci', phonetic: 'ah-ree-veh-DAIR-chee', emoji: '🫡' },
      // Tier 2
      { id: 'g09', en: 'Good evening', it: 'Buonasera', phonetic: 'bwon-ah-SEH-rah', emoji: '🌆' },
      { id: 'g10', en: "You're welcome", it: 'Prego', phonetic: 'PREH-go', emoji: '😄' },
      { id: 'g11', en: 'Excuse me', it: 'Scusa', phonetic: 'SKOO-zah', emoji: '🙇' },
      { id: 'g12', en: "I'm sorry", it: 'Mi dispiace', phonetic: 'mee dee-SPYAH-cheh', emoji: '😔' },
      { id: 'g13', en: 'How are you?', it: 'Come stai?', phonetic: 'KOH-meh STAI', emoji: '🤗' },
      { id: 'g14', en: "I'm fine", it: 'Sto bene', phonetic: 'sto BEH-neh', emoji: '😀' },
      { id: 'g15', en: 'My name is...', it: 'Mi chiamo...', phonetic: 'mee KYAH-mo', emoji: '🏷️' },
      { id: 'g16', en: 'Nice to meet you', it: 'Piacere', phonetic: 'pyah-CHEH-reh', emoji: '🤝' },
      // Tier 3
      { id: 'g17', en: 'See you later', it: 'A dopo', phonetic: 'ah DOH-po', emoji: '👋' },
      { id: 'g18', en: 'See you tomorrow', it: 'A domani', phonetic: 'ah doh-MAH-nee', emoji: '📅' },
      { id: 'g19', en: 'Help!', it: 'Aiuto!', phonetic: 'ah-YOO-toh', emoji: '🆘' },
      { id: 'g20', en: 'Welcome', it: 'Benvenuto', phonetic: 'ben-veh-NOO-toh', emoji: '🎉' },
      { id: 'g21', en: 'Have a good day', it: 'Buona giornata', phonetic: 'BWOH-nah jor-NAH-tah', emoji: '☀️' },
      { id: 'g22', en: 'Friend', it: 'Amico', phonetic: 'ah-MEE-ko', emoji: '🧑‍🤝‍🧑' },
      { id: 'g23', en: 'Love', it: 'Amore', phonetic: 'ah-MOH-reh', emoji: '❤️' },
      { id: 'g24', en: 'Happy', it: 'Felice', phonetic: 'feh-LEE-cheh', emoji: '😃' },
    ],
  },
  {
    id: 'food',
    enLabel: 'Food & Drinks',
    itLabel: 'Cibo e Bevande',
    emoji: '🍕',
    cityName: 'Napoli',
    cityEmoji: '🍕',
    color: '#f39c12',
    words: [
      // Tier 1 — common food
      { id: 'f01', en: 'Pizza', it: 'Pizza', phonetic: 'PEET-tsah', emoji: '🍕' },
      { id: 'f02', en: 'Ice cream', it: 'Gelato', phonetic: 'jeh-LAH-toh', emoji: '🍦' },
      { id: 'f03', en: 'Water', it: 'Acqua', phonetic: 'AH-kwah', emoji: '💧' },
      { id: 'f04', en: 'Bread', it: 'Pane', phonetic: 'PAH-neh', emoji: '🍞' },
      { id: 'f05', en: 'Cheese', it: 'Formaggio', phonetic: 'for-MAH-jo', emoji: '🧀' },
      { id: 'f06', en: 'Apple', it: 'Mela', phonetic: 'MEH-lah', emoji: '🍎' },
      { id: 'f07', en: 'Milk', it: 'Latte', phonetic: 'LAH-teh', emoji: '🥛' },
      { id: 'f08', en: 'Cake', it: 'Torta', phonetic: 'TOR-tah', emoji: '🎂' },
      // Tier 2
      { id: 'f09', en: 'Pasta', it: 'Pasta', phonetic: 'PAH-stah', emoji: '🍝' },
      { id: 'f10', en: 'Egg', it: 'Uovo', phonetic: 'WOH-voh', emoji: '🥚' },
      { id: 'f11', en: 'Banana', it: 'Banana', phonetic: 'bah-NAH-nah', emoji: '🍌' },
      { id: 'f12', en: 'Orange', it: 'Arancia', phonetic: 'ah-RAHN-chah', emoji: '🍊' },
      { id: 'f13', en: 'Tomato', it: 'Pomodoro', phonetic: 'poh-moh-DOH-roh', emoji: '🍅' },
      { id: 'f14', en: 'Chocolate', it: 'Cioccolato', phonetic: 'chok-koh-LAH-toh', emoji: '🍫' },
      { id: 'f15', en: 'Cookie', it: 'Biscotto', phonetic: 'bee-SKOT-toh', emoji: '🍪' },
      { id: 'f16', en: 'Juice', it: 'Succo', phonetic: 'SOOK-koh', emoji: '🧃' },
      // Tier 3
      { id: 'f17', en: 'Fish', it: 'Pesce', phonetic: 'PEH-sheh', emoji: '🐟' },
      { id: 'f18', en: 'Chicken', it: 'Pollo', phonetic: 'POH-loh', emoji: '🍗' },
      { id: 'f19', en: 'Rice', it: 'Riso', phonetic: 'REE-zoh', emoji: '🍚' },
      { id: 'f20', en: 'Strawberry', it: 'Fragola', phonetic: 'FRAH-goh-lah', emoji: '🍓' },
      { id: 'f21', en: 'Grapes', it: 'Uva', phonetic: 'OO-vah', emoji: '🍇' },
      { id: 'f22', en: 'Carrot', it: 'Carota', phonetic: 'kah-ROH-tah', emoji: '🥕' },
      { id: 'f23', en: 'Honey', it: 'Miele', phonetic: 'MYEH-leh', emoji: '🍯' },
      { id: 'f24', en: 'Watermelon', it: 'Anguria', phonetic: 'ahn-GOO-ree-ah', emoji: '🍉' },
    ],
  },
  {
    id: 'numbers',
    enLabel: 'Numbers',
    itLabel: 'Numeri',
    emoji: '🔢',
    cityName: 'Firenze',
    cityEmoji: '🎨',
    color: '#9b59b6',
    words: [
      // Tier 1 — 1 through 8
      { id: 'n01', en: 'One', it: 'Uno', phonetic: 'OO-no', emoji: '1️⃣' },
      { id: 'n02', en: 'Two', it: 'Due', phonetic: 'DOO-eh', emoji: '2️⃣' },
      { id: 'n03', en: 'Three', it: 'Tre', phonetic: 'TREH', emoji: '3️⃣' },
      { id: 'n04', en: 'Four', it: 'Quattro', phonetic: 'KWAH-troh', emoji: '4️⃣' },
      { id: 'n05', en: 'Five', it: 'Cinque', phonetic: 'CHEEN-kweh', emoji: '5️⃣' },
      { id: 'n06', en: 'Six', it: 'Sei', phonetic: 'SAY', emoji: '6️⃣' },
      { id: 'n07', en: 'Seven', it: 'Sette', phonetic: 'SET-teh', emoji: '7️⃣' },
      { id: 'n08', en: 'Eight', it: 'Otto', phonetic: 'OT-toh', emoji: '8️⃣' },
      // Tier 2 — 9, 10, and bigger
      { id: 'n09', en: 'Nine', it: 'Nove', phonetic: 'NOH-veh', emoji: '9️⃣' },
      { id: 'n10', en: 'Ten', it: 'Dieci', phonetic: 'DYEH-chee', emoji: '🔟' },
      { id: 'n11', en: 'Zero', it: 'Zero', phonetic: 'DZEH-roh', emoji: '0️⃣' },
      { id: 'n12', en: 'Twenty', it: 'Venti', phonetic: 'VEN-tee', emoji: '🔢' },
      { id: 'n13', en: 'Thirty', it: 'Trenta', phonetic: 'TREN-tah', emoji: '🔢' },
      { id: 'n14', en: 'Forty', it: 'Quaranta', phonetic: 'kwah-RAHN-tah', emoji: '🔢' },
      { id: 'n15', en: 'Fifty', it: 'Cinquanta', phonetic: 'cheen-KWAHN-tah', emoji: '🔢' },
      { id: 'n16', en: 'Hundred', it: 'Cento', phonetic: 'CHEN-toh', emoji: '💯' },
      // Tier 3 — teens
      { id: 'n17', en: 'Eleven', it: 'Undici', phonetic: 'OON-dee-chee', emoji: '🔢' },
      { id: 'n18', en: 'Twelve', it: 'Dodici', phonetic: 'DOH-dee-chee', emoji: '🔢' },
      { id: 'n19', en: 'Thirteen', it: 'Tredici', phonetic: 'TREH-dee-chee', emoji: '🔢' },
      { id: 'n20', en: 'Fourteen', it: 'Quattordici', phonetic: 'kwah-TOR-dee-chee', emoji: '🔢' },
      { id: 'n21', en: 'Fifteen', it: 'Quindici', phonetic: 'KWEEN-dee-chee', emoji: '🔢' },
      { id: 'n22', en: 'Sixteen', it: 'Sedici', phonetic: 'SEH-dee-chee', emoji: '🔢' },
      { id: 'n23', en: 'Seventeen', it: 'Diciassette', phonetic: 'dee-chah-SET-teh', emoji: '🔢' },
      { id: 'n24', en: 'Eighteen', it: 'Diciotto', phonetic: 'dee-CHOT-toh', emoji: '🔢' },
    ],
  },
  {
    id: 'animals',
    enLabel: 'Animals',
    itLabel: 'Animali',
    emoji: '🐾',
    cityName: 'Venezia',
    cityEmoji: '🛶',
    color: '#3498db',
    words: [
      // Tier 1 — common animals
      { id: 'a01', en: 'Cat', it: 'Gatto', phonetic: 'GAH-toh', emoji: '🐈' },
      { id: 'a02', en: 'Dog', it: 'Cane', phonetic: 'KAH-neh', emoji: '🐕' },
      { id: 'a03', en: 'Fish', it: 'Pesce', phonetic: 'PEH-sheh', emoji: '🐟' },
      { id: 'a04', en: 'Bird', it: 'Uccello', phonetic: 'oo-CHEL-loh', emoji: '🐦' },
      { id: 'a05', en: 'Horse', it: 'Cavallo', phonetic: 'kah-VAH-loh', emoji: '🐴' },
      { id: 'a06', en: 'Rabbit', it: 'Coniglio', phonetic: 'koh-NEE-lyoh', emoji: '🐇' },
      { id: 'a07', en: 'Cow', it: 'Mucca', phonetic: 'MOO-kah', emoji: '🐄' },
      { id: 'a08', en: 'Pig', it: 'Maiale', phonetic: 'mah-YAH-leh', emoji: '🐷' },
      // Tier 2
      { id: 'a09', en: 'Lion', it: 'Leone', phonetic: 'leh-OH-neh', emoji: '🦁' },
      { id: 'a10', en: 'Bear', it: 'Orso', phonetic: 'OR-soh', emoji: '🐻' },
      { id: 'a11', en: 'Monkey', it: 'Scimmia', phonetic: 'SHEEM-myah', emoji: '🐒' },
      { id: 'a12', en: 'Elephant', it: 'Elefante', phonetic: 'eh-leh-FAHN-teh', emoji: '🐘' },
      { id: 'a13', en: 'Butterfly', it: 'Farfalla', phonetic: 'far-FAH-lah', emoji: '🦋' },
      { id: 'a14', en: 'Frog', it: 'Rana', phonetic: 'RAH-nah', emoji: '🐸' },
      { id: 'a15', en: 'Snake', it: 'Serpente', phonetic: 'ser-PEN-teh', emoji: '🐍' },
      { id: 'a16', en: 'Turtle', it: 'Tartaruga', phonetic: 'tar-tah-ROO-gah', emoji: '🐢' },
      // Tier 3
      { id: 'a17', en: 'Dolphin', it: 'Delfino', phonetic: 'del-FEE-noh', emoji: '🐬' },
      { id: 'a18', en: 'Penguin', it: 'Pinguino', phonetic: 'peen-GWEE-noh', emoji: '🐧' },
      { id: 'a19', en: 'Owl', it: 'Gufo', phonetic: 'GOO-foh', emoji: '🦉' },
      { id: 'a20', en: 'Shark', it: 'Squalo', phonetic: 'SKWAH-loh', emoji: '🦈' },
      { id: 'a21', en: 'Bee', it: 'Ape', phonetic: 'AH-peh', emoji: '🐝' },
      { id: 'a22', en: 'Spider', it: 'Ragno', phonetic: 'RAH-nyoh', emoji: '🕷️' },
      { id: 'a23', en: 'Wolf', it: 'Lupo', phonetic: 'LOO-poh', emoji: '🐺' },
      { id: 'a24', en: 'Fox', it: 'Volpe', phonetic: 'VOL-peh', emoji: '🦊' },
    ],
  },
  {
    id: 'colors',
    enLabel: 'Colors',
    itLabel: 'Colori',
    emoji: '🎨',
    cityName: 'Milano',
    cityEmoji: '👗',
    color: '#e91e63',
    words: [
      // Tier 1 — basic colors
      { id: 'c01', en: 'Red', it: 'Rosso', phonetic: 'ROHS-soh', emoji: '🔴' },
      { id: 'c02', en: 'Blue', it: 'Blu', phonetic: 'BLOO', emoji: '🔵' },
      { id: 'c03', en: 'Green', it: 'Verde', phonetic: 'VEHR-deh', emoji: '🟢' },
      { id: 'c04', en: 'Yellow', it: 'Giallo', phonetic: 'JAH-loh', emoji: '🟡' },
      { id: 'c05', en: 'White', it: 'Bianco', phonetic: 'BYAHN-koh', emoji: '⬜' },
      { id: 'c06', en: 'Black', it: 'Nero', phonetic: 'NEH-roh', emoji: '⬛' },
      { id: 'c07', en: 'Orange', it: 'Arancione', phonetic: 'ah-rahn-CHOH-neh', emoji: '🟠' },
      { id: 'c08', en: 'Pink', it: 'Rosa', phonetic: 'ROH-zah', emoji: '🩷' },
      // Tier 2 — more colors
      { id: 'c09', en: 'Purple', it: 'Viola', phonetic: 'vee-OH-lah', emoji: '🟣' },
      { id: 'c10', en: 'Brown', it: 'Marrone', phonetic: 'mah-ROH-neh', emoji: '🟤' },
      { id: 'c11', en: 'Gray', it: 'Grigio', phonetic: 'GREE-joh', emoji: '🩶' },
      { id: 'c12', en: 'Gold', it: 'Oro', phonetic: 'OH-roh', emoji: '🥇' },
      { id: 'c13', en: 'Silver', it: 'Argento', phonetic: 'ar-JEN-toh', emoji: '🥈' },
      { id: 'c14', en: 'Light blue', it: 'Azzurro', phonetic: 'ah-TSOO-roh', emoji: '🩵' },
      { id: 'c15', en: 'Big', it: 'Grande', phonetic: 'GRAHN-deh', emoji: '🐘' },
      { id: 'c16', en: 'Small', it: 'Piccolo', phonetic: 'PEE-koh-loh', emoji: '🐜' },
      // Tier 3 — descriptions
      { id: 'c17', en: 'Beautiful', it: 'Bello', phonetic: 'BEH-loh', emoji: '🌟' },
      { id: 'c18', en: 'Good', it: 'Buono', phonetic: 'BWOH-noh', emoji: '👍' },
      { id: 'c19', en: 'Bad', it: 'Cattivo', phonetic: 'kah-TEE-voh', emoji: '👎' },
      { id: 'c20', en: 'Hot', it: 'Caldo', phonetic: 'KAHL-doh', emoji: '🔥' },
      { id: 'c21', en: 'Cold', it: 'Freddo', phonetic: 'FRED-doh', emoji: '🥶' },
      { id: 'c22', en: 'New', it: 'Nuovo', phonetic: 'NWOH-voh', emoji: '✨' },
      { id: 'c23', en: 'Fast', it: 'Veloce', phonetic: 'veh-LOH-cheh', emoji: '⚡' },
      { id: 'c24', en: 'Slow', it: 'Lento', phonetic: 'LEN-toh', emoji: '🐌' },
    ],
  },
  {
    id: 'family',
    enLabel: 'Family',
    itLabel: 'Famiglia',
    emoji: '👨‍👩‍👧‍👦',
    cityName: 'Verona',
    cityEmoji: '💕',
    color: '#e67e22',
    words: [
      // Tier 1 — immediate family
      { id: 'fm01', en: 'Mom', it: 'Mamma', phonetic: 'MAH-mah', emoji: '👩' },
      { id: 'fm02', en: 'Dad', it: 'Papà', phonetic: 'pah-PAH', emoji: '👨' },
      { id: 'fm03', en: 'Brother', it: 'Fratello', phonetic: 'frah-TEH-loh', emoji: '👦' },
      { id: 'fm04', en: 'Sister', it: 'Sorella', phonetic: 'soh-REH-lah', emoji: '👧' },
      { id: 'fm05', en: 'Baby', it: 'Bambino', phonetic: 'bahm-BEE-noh', emoji: '👶' },
      { id: 'fm06', en: 'Family', it: 'Famiglia', phonetic: 'fah-MEE-lyah', emoji: '👨‍👩‍👧‍👦' },
      { id: 'fm07', en: 'Grandma', it: 'Nonna', phonetic: 'NON-nah', emoji: '👵' },
      { id: 'fm08', en: 'Grandpa', it: 'Nonno', phonetic: 'NON-noh', emoji: '👴' },
      // Tier 2 — people & roles
      { id: 'fm09', en: 'Boy', it: 'Ragazzo', phonetic: 'rah-GAH-tsoh', emoji: '👦' },
      { id: 'fm10', en: 'Girl', it: 'Ragazza', phonetic: 'rah-GAH-tsah', emoji: '👧' },
      { id: 'fm11', en: 'Man', it: 'Uomo', phonetic: 'WOH-moh', emoji: '👨' },
      { id: 'fm12', en: 'Woman', it: 'Donna', phonetic: 'DON-nah', emoji: '👩' },
      { id: 'fm13', en: 'Child', it: 'Bambino', phonetic: 'bahm-BEE-noh', emoji: '🧒' },
      { id: 'fm14', en: 'Teacher', it: 'Maestro', phonetic: 'mah-EH-stroh', emoji: '👩‍🏫' },
      { id: 'fm15', en: 'Doctor', it: 'Dottore', phonetic: 'doh-TOH-reh', emoji: '👨‍⚕️' },
      { id: 'fm16', en: 'Friend', it: 'Amico', phonetic: 'ah-MEE-koh', emoji: '🧑‍🤝‍🧑' },
      // Tier 3 — pronouns & basics
      { id: 'fm17', en: 'I', it: 'Io', phonetic: 'EE-oh', emoji: '🙋' },
      { id: 'fm18', en: 'You', it: 'Tu', phonetic: 'TOO', emoji: '👉' },
      { id: 'fm19', en: 'He', it: 'Lui', phonetic: 'LOO-ee', emoji: '👦' },
      { id: 'fm20', en: 'She', it: 'Lei', phonetic: 'LAY', emoji: '👧' },
      { id: 'fm21', en: 'We', it: 'Noi', phonetic: 'NOY', emoji: '👫' },
      { id: 'fm22', en: 'Uncle', it: 'Zio', phonetic: 'TSEE-oh', emoji: '👨' },
      { id: 'fm23', en: 'Aunt', it: 'Zia', phonetic: 'TSEE-ah', emoji: '👩' },
      { id: 'fm24', en: 'Cousin', it: 'Cugino', phonetic: 'koo-JEE-noh', emoji: '🧒' },
    ],
  },
  {
    id: 'places',
    enLabel: 'Around Town',
    itLabel: 'In Città',
    emoji: '🏘️',
    cityName: 'Torino',
    cityEmoji: '🏪',
    color: '#2ecc71',
    words: [
      // Tier 1 — common places
      { id: 'p01', en: 'House', it: 'Casa', phonetic: 'KAH-zah', emoji: '🏠' },
      { id: 'p02', en: 'School', it: 'Scuola', phonetic: 'SKWOH-lah', emoji: '🏫' },
      { id: 'p03', en: 'Park', it: 'Parco', phonetic: 'PAR-koh', emoji: '🏞️' },
      { id: 'p04', en: 'Beach', it: 'Spiaggia', phonetic: 'SPYAH-jah', emoji: '🏖️' },
      { id: 'p05', en: 'Shop', it: 'Negozio', phonetic: 'neh-GOH-tsyoh', emoji: '🏪' },
      { id: 'p06', en: 'Restaurant', it: 'Ristorante', phonetic: 'ree-stoh-RAHN-teh', emoji: '🍽️' },
      { id: 'p07', en: 'Church', it: 'Chiesa', phonetic: 'KYEH-zah', emoji: '⛪' },
      { id: 'p08', en: 'Street', it: 'Strada', phonetic: 'STRAH-dah', emoji: '🛣️' },
      // Tier 2 — more places
      { id: 'p09', en: 'Museum', it: 'Museo', phonetic: 'moo-ZEH-oh', emoji: '🏛️' },
      { id: 'p10', en: 'Hospital', it: 'Ospedale', phonetic: 'oh-speh-DAH-leh', emoji: '🏥' },
      { id: 'p11', en: 'Bathroom', it: 'Bagno', phonetic: 'BAH-nyoh', emoji: '🚻' },
      { id: 'p12', en: 'Bridge', it: 'Ponte', phonetic: 'PON-teh', emoji: '🌉' },
      { id: 'p13', en: 'Castle', it: 'Castello', phonetic: 'kah-STEH-loh', emoji: '🏰' },
      { id: 'p14', en: 'Garden', it: 'Giardino', phonetic: 'jar-DEE-noh', emoji: '🌷' },
      { id: 'p15', en: 'Square', it: 'Piazza', phonetic: 'PYAH-tsah', emoji: '🏛️' },
      { id: 'p16', en: 'Tower', it: 'Torre', phonetic: 'TOR-reh', emoji: '🗼' },
      // Tier 3 — things in town
      { id: 'p17', en: 'Train', it: 'Treno', phonetic: 'TREH-noh', emoji: '🚂' },
      { id: 'p18', en: 'Bus', it: 'Autobus', phonetic: 'OW-toh-boos', emoji: '🚌' },
      { id: 'p19', en: 'Car', it: 'Macchina', phonetic: 'MAH-kee-nah', emoji: '🚗' },
      { id: 'p20', en: 'Boat', it: 'Barca', phonetic: 'BAR-kah', emoji: '⛵' },
      { id: 'p21', en: 'Airplane', it: 'Aereo', phonetic: 'ah-EH-reh-oh', emoji: '✈️' },
      { id: 'p22', en: 'Bicycle', it: 'Bicicletta', phonetic: 'bee-chee-KLEH-tah', emoji: '🚲' },
      { id: 'p23', en: 'Fountain', it: 'Fontana', phonetic: 'fon-TAH-nah', emoji: '⛲' },
      { id: 'p24', en: 'Market', it: 'Mercato', phonetic: 'mer-KAH-toh', emoji: '🧺' },
    ],
  },
  {
    id: 'nature',
    enLabel: 'Nature & Weather',
    itLabel: 'Natura',
    emoji: '🌿',
    cityName: 'Amalfi',
    cityEmoji: '🏖️',
    color: '#1abc9c',
    words: [
      // Tier 1 — sky & basics
      { id: 'w01', en: 'Sun', it: 'Sole', phonetic: 'SOH-leh', emoji: '☀️' },
      { id: 'w02', en: 'Moon', it: 'Luna', phonetic: 'LOO-nah', emoji: '🌙' },
      { id: 'w03', en: 'Star', it: 'Stella', phonetic: 'STEH-lah', emoji: '⭐' },
      { id: 'w04', en: 'Rain', it: 'Pioggia', phonetic: 'PYOH-jah', emoji: '🌧️' },
      { id: 'w05', en: 'Sea', it: 'Mare', phonetic: 'MAH-reh', emoji: '🌊' },
      { id: 'w06', en: 'Tree', it: 'Albero', phonetic: 'AHL-beh-roh', emoji: '🌳' },
      { id: 'w07', en: 'Flower', it: 'Fiore', phonetic: 'FYOH-reh', emoji: '🌸' },
      { id: 'w08', en: 'Mountain', it: 'Montagna', phonetic: 'mon-TAH-nyah', emoji: '🏔️' },
      // Tier 2 — more nature
      { id: 'w09', en: 'Cloud', it: 'Nuvola', phonetic: 'NOO-voh-lah', emoji: '☁️' },
      { id: 'w10', en: 'Snow', it: 'Neve', phonetic: 'NEH-veh', emoji: '❄️' },
      { id: 'w11', en: 'Wind', it: 'Vento', phonetic: 'VEN-toh', emoji: '💨' },
      { id: 'w12', en: 'Rainbow', it: 'Arcobaleno', phonetic: 'ar-koh-bah-LEH-noh', emoji: '🌈' },
      { id: 'w13', en: 'River', it: 'Fiume', phonetic: 'FYOO-meh', emoji: '🏞️' },
      { id: 'w14', en: 'Sky', it: 'Cielo', phonetic: 'CHEH-loh', emoji: '🌤️' },
      { id: 'w15', en: 'Fire', it: 'Fuoco', phonetic: 'FWOH-koh', emoji: '🔥' },
      { id: 'w16', en: 'Earth', it: 'Terra', phonetic: 'TEH-rah', emoji: '🌍' },
      // Tier 3 — environment
      { id: 'w17', en: 'Forest', it: 'Foresta', phonetic: 'foh-REH-stah', emoji: '🌲' },
      { id: 'w18', en: 'Lake', it: 'Lago', phonetic: 'LAH-goh', emoji: '🏞️' },
      { id: 'w19', en: 'Island', it: 'Isola', phonetic: 'EE-zoh-lah', emoji: '🏝️' },
      { id: 'w20', en: 'Leaf', it: 'Foglia', phonetic: 'FOH-lyah', emoji: '🍃' },
      { id: 'w21', en: 'Sand', it: 'Sabbia', phonetic: 'SAH-byah', emoji: '🏖️' },
      { id: 'w22', en: 'Stone', it: 'Pietra', phonetic: 'PYEH-trah', emoji: '🪨' },
      { id: 'w23', en: 'Volcano', it: 'Vulcano', phonetic: 'vool-KAH-noh', emoji: '🌋' },
      { id: 'w24', en: 'Sunset', it: 'Tramonto', phonetic: 'trah-MON-toh', emoji: '🌅' },
    ],
  },
];

// ===== HELPER FUNCTIONS =====

const TIER_SIZE = 8;

function getCategoryById(catId) {
  return ITALIAN_CATEGORIES.find(c => c.id === catId);
}

function getWordById(catId, wordId) {
  const cat = getCategoryById(catId);
  return cat ? cat.words.find(w => w.id === wordId) : null;
}

function findCategoryByWordId(wordId) {
  return ITALIAN_CATEGORIES.find(c => c.words.some(w => w.id === wordId));
}

function buildCategoryPool(catId, tierCount) {
  const cat = getCategoryById(catId);
  if (!cat) return [];
  const count = Math.min(tierCount * TIER_SIZE, cat.words.length);
  return cat.words.slice(0, count).map(w => w.id);
}

function getMaxTiers(catId) {
  const cat = getCategoryById(catId);
  if (!cat) return 0;
  return Math.ceil(cat.words.length / TIER_SIZE);
}

function adaptiveKey(wordId) {
  return `it:${wordId}`;
}

function pickRandom(arr, n) {
  const copy = arr.slice();
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
