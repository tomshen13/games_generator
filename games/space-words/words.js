/**
 * Space Words — Static curated English vocabulary word lists.
 * Each category is a "planet" with 50+ words ordered from common to uncommon.
 * Words are grouped in tiers of 8; the adaptive system controls which tiers are active.
 */

const WORD_CATEGORIES = [
  {
    id: 'animals',
    heLabel: 'חיות',
    enLabel: 'Animals',
    emoji: '🐾',
    planetColor: '#4ade80',
    words: [
      // Tier 1 — very common
      { id: 'a01', he: 'כלב', en: 'Dog', emoji: '🐕' },
      { id: 'a02', he: 'חתול', en: 'Cat', emoji: '🐈' },
      { id: 'a03', he: 'דג', en: 'Fish', emoji: '🐟' },
      { id: 'a04', he: 'ציפור', en: 'Bird', emoji: '🐦' },
      { id: 'a05', he: 'ארנב', en: 'Rabbit', emoji: '🐇' },
      { id: 'a06', he: 'סוס', en: 'Horse', emoji: '🐴' },
      { id: 'a07', he: 'פרה', en: 'Cow', emoji: '🐄' },
      { id: 'a08', he: 'כבשה', en: 'Sheep', emoji: '🐑' },
      // Tier 2
      { id: 'a09', he: 'נחש', en: 'Snake', emoji: '🐍' },
      { id: 'a10', he: 'צפרדע', en: 'Frog', emoji: '🐸' },
      { id: 'a11', he: 'דב', en: 'Bear', emoji: '🐻' },
      { id: 'a12', he: 'אריה', en: 'Lion', emoji: '🦁' },
      { id: 'a13', he: 'קוף', en: 'Monkey', emoji: '🐒' },
      { id: 'a14', he: 'פיל', en: 'Elephant', emoji: '🐘' },
      { id: 'a15', he: "ג'ירפה", en: 'Giraffe', emoji: '🦒' },
      { id: 'a16', he: 'זברה', en: 'Zebra', emoji: '🦓' },
      // Tier 3
      { id: 'a17', he: 'דולפין', en: 'Dolphin', emoji: '🐬' },
      { id: 'a18', he: 'לווייתן', en: 'Whale', emoji: '🐋' },
      { id: 'a19', he: 'פינגווין', en: 'Penguin', emoji: '🐧' },
      { id: 'a20', he: 'נשר', en: 'Eagle', emoji: '🦅' },
      { id: 'a21', he: 'ינשוף', en: 'Owl', emoji: '🦉' },
      { id: 'a22', he: 'עקרב', en: 'Scorpion', emoji: '🦂' },
      { id: 'a23', he: 'תמנון', en: 'Octopus', emoji: '🐙' },
      { id: 'a24', he: 'כריש', en: 'Shark', emoji: '🦈' },
      // Tier 4
      { id: 'a25', he: 'עטלף', en: 'Bat', emoji: '🦇' },
      { id: 'a26', he: 'חיפושית', en: 'Beetle', emoji: '🪲' },
      { id: 'a27', he: 'פרפר', en: 'Butterfly', emoji: '🦋' },
      { id: 'a28', he: 'זיקית', en: 'Chameleon', emoji: '🦎' },
      { id: 'a29', he: 'קיפוד', en: 'Hedgehog', emoji: '🦔' },
      { id: 'a30', he: 'תנין', en: 'Crocodile', emoji: '🐊' },
      { id: 'a31', he: 'נמר', en: 'Leopard', emoji: '🐆' },
      { id: 'a32', he: 'גמל', en: 'Camel', emoji: '🐪' },
      // Tier 5
      { id: 'a33', he: 'חזיר', en: 'Pig', emoji: '🐷' },
      { id: 'a34', he: 'עז', en: 'Goat', emoji: '🐐' },
      { id: 'a35', he: 'תרנגול', en: 'Rooster', emoji: '🐓' },
      { id: 'a36', he: 'ברווז', en: 'Duck', emoji: '🦆' },
      { id: 'a37', he: 'צב', en: 'Turtle', emoji: '🐢' },
      { id: 'a38', he: 'נמלה', en: 'Ant', emoji: '🐜' },
      { id: 'a39', he: 'דבורה', en: 'Bee', emoji: '🐝' },
      { id: 'a40', he: 'עכביש', en: 'Spider', emoji: '🕷️' },
      // Tier 6
      { id: 'a41', he: 'תוכי', en: 'Parrot', emoji: '🦜' },
      { id: 'a42', he: 'ברבור', en: 'Swan', emoji: '🦢' },
      { id: 'a43', he: 'פלמינגו', en: 'Flamingo', emoji: '🦩' },
      { id: 'a44', he: 'טווס', en: 'Peacock', emoji: '🦚' },
      { id: 'a45', he: 'כלבת ים', en: 'Seal', emoji: '🦭' },
      { id: 'a46', he: 'קרנף', en: 'Rhinoceros', emoji: '🦏' },
      { id: 'a47', he: 'היפופוטם', en: 'Hippopotamus', emoji: '🦛' },
      { id: 'a48', he: 'גורילה', en: 'Gorilla', emoji: '🦍' },
      // Tier 7
      { id: 'a49', he: 'חילזון', en: 'Snail', emoji: '🐌' },
      { id: 'a50', he: 'תולעת', en: 'Worm', emoji: '🪱' },
      { id: 'a51', he: 'שפירית', en: 'Dragonfly', emoji: '🪰' },
      { id: 'a52', he: 'סרטן', en: 'Crab', emoji: '🦀' },
      { id: 'a53', he: 'שרימפס', en: 'Shrimp', emoji: '🦐' },
      { id: 'a54', he: 'מדוזה', en: 'Jellyfish', emoji: '🪼' },
      { id: 'a55', he: 'זאב', en: 'Wolf', emoji: '🐺' },
      { id: 'a56', he: 'שועל', en: 'Fox', emoji: '🦊' },
    ],
  },
  {
    id: 'food',
    heLabel: 'אוכל',
    enLabel: 'Food',
    emoji: '🍕',
    planetColor: '#f97316',
    words: [
      // Tier 1
      { id: 'f01', he: 'תפוח', en: 'Apple', emoji: '🍎' },
      { id: 'f02', he: 'בננה', en: 'Banana', emoji: '🍌' },
      { id: 'f03', he: 'לחם', en: 'Bread', emoji: '🍞' },
      { id: 'f04', he: 'חלב', en: 'Milk', emoji: '🥛' },
      { id: 'f05', he: 'ביצה', en: 'Egg', emoji: '🥚' },
      { id: 'f06', he: 'גבינה', en: 'Cheese', emoji: '🧀' },
      { id: 'f07', he: 'עוגה', en: 'Cake', emoji: '🎂' },
      { id: 'f08', he: 'גלידה', en: 'Ice Cream', emoji: '🍦' },
      // Tier 2
      { id: 'f09', he: 'תפוז', en: 'Orange', emoji: '🍊' },
      { id: 'f10', he: 'ענבים', en: 'Grapes', emoji: '🍇' },
      { id: 'f11', he: 'אבטיח', en: 'Watermelon', emoji: '🍉' },
      { id: 'f12', he: 'גזר', en: 'Carrot', emoji: '🥕' },
      { id: 'f13', he: 'עגבנייה', en: 'Tomato', emoji: '🍅' },
      { id: 'f14', he: 'מלפפון', en: 'Cucumber', emoji: '🥒' },
      { id: 'f15', he: 'תירס', en: 'Corn', emoji: '🌽' },
      { id: 'f16', he: 'אורז', en: 'Rice', emoji: '🍚' },
      // Tier 3
      { id: 'f17', he: 'דבש', en: 'Honey', emoji: '🍯' },
      { id: 'f18', he: 'פיצה', en: 'Pizza', emoji: '🍕' },
      { id: 'f19', he: 'שוקולד', en: 'Chocolate', emoji: '🍫' },
      { id: 'f20', he: 'עוגייה', en: 'Cookie', emoji: '🍪' },
      { id: 'f21', he: 'תות', en: 'Strawberry', emoji: '🍓' },
      { id: 'f22', he: 'לימון', en: 'Lemon', emoji: '🍋' },
      { id: 'f23', he: 'אגס', en: 'Pear', emoji: '🍐' },
      { id: 'f24', he: 'אפרסק', en: 'Peach', emoji: '🍑' },
      // Tier 4
      { id: 'f25', he: 'אגוז', en: 'Nut', emoji: '🥜' },
      { id: 'f26', he: 'פלפל', en: 'Pepper', emoji: '🌶️' },
      { id: 'f27', he: 'בצל', en: 'Onion', emoji: '🧅' },
      { id: 'f28', he: 'שום', en: 'Garlic', emoji: '🧄' },
      { id: 'f29', he: 'חציל', en: 'Eggplant', emoji: '🍆' },
      { id: 'f30', he: 'רימון', en: 'Pomegranate', emoji: '🫐' },
      { id: 'f31', he: 'דלעת', en: 'Pumpkin', emoji: '🎃' },
      { id: 'f32', he: 'פטריה', en: 'Mushroom', emoji: '🍄' },
      // Tier 5
      { id: 'f33', he: 'מים', en: 'Water', emoji: '💧' },
      { id: 'f34', he: 'מיץ', en: 'Juice', emoji: '🧃' },
      { id: 'f35', he: 'תה', en: 'Tea', emoji: '🍵' },
      { id: 'f36', he: 'סוכר', en: 'Sugar', emoji: '🍬' },
      { id: 'f37', he: 'מלח', en: 'Salt', emoji: '🧂' },
      { id: 'f38', he: 'חמאה', en: 'Butter', emoji: '🧈' },
      { id: 'f39', he: 'סלט', en: 'Salad', emoji: '🥗' },
      { id: 'f40', he: 'מרק', en: 'Soup', emoji: '🍜' },
      // Tier 6
      { id: 'f41', he: 'המבורגר', en: 'Hamburger', emoji: '🍔' },
      { id: 'f42', he: 'נקניקייה', en: 'Sausage', emoji: '🌭' },
      { id: 'f43', he: 'טוסט', en: 'Toast', emoji: '🍞' },
      { id: 'f44', he: 'פנקייק', en: 'Pancake', emoji: '🥞' },
      { id: 'f45', he: 'סופגנייה', en: 'Donut', emoji: '🍩' },
      { id: 'f46', he: 'קרמל', en: 'Caramel', emoji: '🍮' },
      { id: 'f47', he: 'וופל', en: 'Waffle', emoji: '🧇' },
      { id: 'f48', he: 'קינמון', en: 'Cinnamon', emoji: '🫚' },
      // Tier 7
      { id: 'f49', he: 'אבוקדו', en: 'Avocado', emoji: '🥑' },
      { id: 'f50', he: 'ברוקולי', en: 'Broccoli', emoji: '🥦' },
      { id: 'f51', he: 'חסה', en: 'Lettuce', emoji: '🥬' },
      { id: 'f52', he: 'תפוח אדמה', en: 'Potato', emoji: '🥔' },
      { id: 'f53', he: 'בטטה', en: 'Sweet Potato', emoji: '🍠' },
      { id: 'f54', he: 'דובדבן', en: 'Cherry', emoji: '🍒' },
      { id: 'f55', he: 'קוקוס', en: 'Coconut', emoji: '🥥' },
      { id: 'f56', he: 'מנגו', en: 'Mango', emoji: '🥭' },
    ],
  },
  {
    id: 'home',
    heLabel: 'בית',
    enLabel: 'Home',
    emoji: '🏠',
    planetColor: '#a78bfa',
    words: [
      // Tier 1
      { id: 'h01', he: 'דלת', en: 'Door', emoji: '🚪' },
      { id: 'h02', he: 'חלון', en: 'Window', emoji: '🪟' },
      { id: 'h03', he: 'שולחן', en: 'Table', emoji: '🪑' },
      { id: 'h04', he: 'כיסא', en: 'Chair', emoji: '💺' },
      { id: 'h05', he: 'מיטה', en: 'Bed', emoji: '🛏️' },
      { id: 'h06', he: 'מנורה', en: 'Lamp', emoji: '💡' },
      { id: 'h07', he: 'טלוויזיה', en: 'Television', emoji: '📺' },
      { id: 'h08', he: 'מקרר', en: 'Fridge', emoji: '🧊' },
      // Tier 2
      { id: 'h09', he: 'מפתח', en: 'Key', emoji: '🔑' },
      { id: 'h10', he: 'שעון', en: 'Clock', emoji: '🕐' },
      { id: 'h11', he: 'כרית', en: 'Pillow', emoji: '🛋️' },
      { id: 'h12', he: 'שמיכה', en: 'Blanket', emoji: '🧶' },
      { id: 'h13', he: 'כף', en: 'Spoon', emoji: '🥄' },
      { id: 'h14', he: 'מזלג', en: 'Fork', emoji: '🍴' },
      { id: 'h15', he: 'צלחת', en: 'Plate', emoji: '🍽️' },
      { id: 'h16', he: 'כוס', en: 'Cup', emoji: '🥤' },
      // Tier 3
      { id: 'h17', he: 'מראה', en: 'Mirror', emoji: '🪞' },
      { id: 'h18', he: 'סבון', en: 'Soap', emoji: '🧼' },
      { id: 'h19', he: 'מברשת', en: 'Brush', emoji: '🪥' },
      { id: 'h20', he: 'מגבת', en: 'Towel', emoji: '🛁' },
      { id: 'h21', he: 'סכין', en: 'Knife', emoji: '🔪' },
      { id: 'h22', he: 'סיר', en: 'Pot', emoji: '🍲' },
      { id: 'h23', he: 'תנור', en: 'Oven', emoji: '🔥' },
      { id: 'h24', he: 'מטאטא', en: 'Broom', emoji: '🧹' },
      // Tier 4
      { id: 'h25', he: 'גג', en: 'Roof', emoji: '🏠' },
      { id: 'h26', he: 'קיר', en: 'Wall', emoji: '🧱' },
      { id: 'h27', he: 'רצפה', en: 'Floor', emoji: '🟫' },
      { id: 'h28', he: 'מדרגות', en: 'Stairs', emoji: '🪜' },
      { id: 'h29', he: 'ארון', en: 'Closet', emoji: '🗄️' },
      { id: 'h30', he: 'מקלחת', en: 'Shower', emoji: '🚿' },
      { id: 'h31', he: 'שטיח', en: 'Carpet', emoji: '🟤' },
      { id: 'h32', he: 'וילון', en: 'Curtain', emoji: '🪟' },
      // Tier 5
      { id: 'h33', he: 'ספה', en: 'Sofa', emoji: '🛋️' },
      { id: 'h34', he: 'מגירה', en: 'Drawer', emoji: '🗃️' },
      { id: 'h35', he: 'מדף', en: 'Shelf', emoji: '📚' },
      { id: 'h36', he: 'שקע', en: 'Plug', emoji: '🔌' },
      { id: 'h37', he: 'מאוורר', en: 'Fan', emoji: '🌀' },
      { id: 'h38', he: 'מכונת כביסה', en: 'Washing Machine', emoji: '🫧' },
      { id: 'h39', he: 'מחשב', en: 'Computer', emoji: '💻' },
      { id: 'h40', he: 'טלפון', en: 'Phone', emoji: '📱' },
      // Tier 6
      { id: 'h41', he: 'אמבטיה', en: 'Bathtub', emoji: '🛁' },
      { id: 'h42', he: 'שואב אבק', en: 'Vacuum', emoji: '🧹' },
      { id: 'h43', he: 'גדר', en: 'Fence', emoji: '🏡' },
      { id: 'h44', he: 'מרפסת', en: 'Balcony', emoji: '🏢' },
      { id: 'h45', he: 'בריכה', en: 'Pool', emoji: '🏊' },
      { id: 'h46', he: 'מזגן', en: 'Air Conditioner', emoji: '❄️' },
      { id: 'h47', he: 'פעמון', en: 'Bell', emoji: '🔔' },
      { id: 'h48', he: 'תמונה', en: 'Picture', emoji: '🖼️' },
      // Tier 7
      { id: 'h49', he: 'נר', en: 'Candle', emoji: '🕯️' },
      { id: 'h50', he: 'אגרטל', en: 'Vase', emoji: '🏺' },
      { id: 'h51', he: 'שעון מעורר', en: 'Alarm Clock', emoji: '⏰' },
      { id: 'h52', he: 'מנעול', en: 'Lock', emoji: '🔒' },
      { id: 'h53', he: 'מכתב', en: 'Letter', emoji: '✉️' },
      { id: 'h54', he: 'חבילה', en: 'Package', emoji: '📦' },
      { id: 'h55', he: 'סולם', en: 'Ladder', emoji: '🪜' },
      { id: 'h56', he: 'פח', en: 'Trash Can', emoji: '🗑️' },
    ],
  },
  {
    id: 'nature',
    heLabel: 'טבע',
    enLabel: 'Nature',
    emoji: '🌿',
    planetColor: '#22c55e',
    words: [
      // Tier 1
      { id: 'n01', he: 'שמש', en: 'Sun', emoji: '☀️' },
      { id: 'n02', he: 'ירח', en: 'Moon', emoji: '🌙' },
      { id: 'n03', he: 'כוכב', en: 'Star', emoji: '⭐' },
      { id: 'n04', he: 'עץ', en: 'Tree', emoji: '🌳' },
      { id: 'n05', he: 'פרח', en: 'Flower', emoji: '🌸' },
      { id: 'n06', he: 'גשם', en: 'Rain', emoji: '🌧️' },
      { id: 'n07', he: 'ענן', en: 'Cloud', emoji: '☁️' },
      { id: 'n08', he: 'הר', en: 'Mountain', emoji: '🏔️' },
      // Tier 2
      { id: 'n09', he: 'ים', en: 'Sea', emoji: '🌊' },
      { id: 'n10', he: 'נהר', en: 'River', emoji: '🏞️' },
      { id: 'n11', he: 'אבן', en: 'Stone', emoji: '🪨' },
      { id: 'n12', he: 'חול', en: 'Sand', emoji: '🏖️' },
      { id: 'n13', he: 'רוח', en: 'Wind', emoji: '💨' },
      { id: 'n14', he: 'שלג', en: 'Snow', emoji: '❄️' },
      { id: 'n15', he: 'קשת', en: 'Rainbow', emoji: '🌈' },
      { id: 'n16', he: 'עלה', en: 'Leaf', emoji: '🍃' },
      // Tier 3
      { id: 'n17', he: 'יער', en: 'Forest', emoji: '🌲' },
      { id: 'n18', he: 'מדבר', en: 'Desert', emoji: '🏜️' },
      { id: 'n19', he: 'אגם', en: 'Lake', emoji: '🏞️' },
      { id: 'n20', he: 'מערה', en: 'Cave', emoji: '🕳️' },
      { id: 'n21', he: 'ברק', en: 'Lightning', emoji: '⚡' },
      { id: 'n22', he: 'קרח', en: 'Ice', emoji: '🧊' },
      { id: 'n23', he: 'זרע', en: 'Seed', emoji: '🌱' },
      { id: 'n24', he: 'אדמה', en: 'Earth', emoji: '🌍' },
      // Tier 4
      { id: 'n25', he: 'הר געש', en: 'Volcano', emoji: '🌋' },
      { id: 'n26', he: 'מפל', en: 'Waterfall', emoji: '💧' },
      { id: 'n27', he: 'אי', en: 'Island', emoji: '🏝️' },
      { id: 'n28', he: 'שורש', en: 'Root', emoji: '🌿' },
      { id: 'n29', he: 'רעם', en: 'Thunder', emoji: '🌩️' },
      { id: 'n30', he: 'מעיין', en: 'Spring', emoji: '⛲' },
      { id: 'n31', he: 'סלע', en: 'Rock', emoji: '🪨' },
      { id: 'n32', he: 'אלמוג', en: 'Coral', emoji: '🪸' },
      // Tier 5
      { id: 'n33', he: 'שמיים', en: 'Sky', emoji: '🌤️' },
      { id: 'n34', he: 'אוויר', en: 'Air', emoji: '🌬️' },
      { id: 'n35', he: 'אש', en: 'Fire', emoji: '🔥' },
      { id: 'n36', he: 'עשב', en: 'Grass', emoji: '🌾' },
      { id: 'n37', he: 'בוץ', en: 'Mud', emoji: '🟤' },
      { id: 'n38', he: 'ערפל', en: 'Fog', emoji: '🌫️' },
      { id: 'n39', he: 'טל', en: 'Dew', emoji: '💦' },
      { id: 'n40', he: 'גבעה', en: 'Hill', emoji: '⛰️' },
      // Tier 6
      { id: 'n41', he: 'חוף', en: 'Beach', emoji: '🏖️' },
      { id: 'n42', he: 'גל', en: 'Wave', emoji: '🌊' },
      { id: 'n43', he: 'צל', en: 'Shadow', emoji: '👤' },
      { id: 'n44', he: 'אור', en: 'Light', emoji: '💡' },
      { id: 'n45', he: 'חושך', en: 'Darkness', emoji: '🌑' },
      { id: 'n46', he: 'שקיעה', en: 'Sunset', emoji: '🌅' },
      { id: 'n47', he: 'זריחה', en: 'Sunrise', emoji: '🌄' },
      { id: 'n48', he: 'בועה', en: 'Bubble', emoji: '🫧' },
      // Tier 7
      { id: 'n49', he: 'עמק', en: 'Valley', emoji: '🏞️' },
      { id: 'n50', he: 'צוק', en: 'Cliff', emoji: '🏔️' },
      { id: 'n51', he: 'ביצה', en: 'Swamp', emoji: '🐊' },
      { id: 'n52', he: 'קוץ', en: 'Thorn', emoji: '🌵' },
      { id: 'n53', he: 'טחב', en: 'Moss', emoji: '🌿' },
      { id: 'n54', he: 'יבשת', en: 'Continent', emoji: '🗺️' },
      { id: 'n55', he: 'קוטב', en: 'Pole', emoji: '🧭' },
      { id: 'n56', he: 'מכתש', en: 'Crater', emoji: '🌕' },
    ],
  },
  {
    id: 'body',
    heLabel: 'גוף',
    enLabel: 'Body',
    emoji: '🦴',
    planetColor: '#f43f5e',
    words: [
      // Tier 1
      { id: 'b01', he: 'ראש', en: 'Head', emoji: '🗣️' },
      { id: 'b02', he: 'יד', en: 'Hand', emoji: '✋' },
      { id: 'b03', he: 'רגל', en: 'Leg', emoji: '🦵' },
      { id: 'b04', he: 'עין', en: 'Eye', emoji: '👁️' },
      { id: 'b05', he: 'אוזן', en: 'Ear', emoji: '👂' },
      { id: 'b06', he: 'אף', en: 'Nose', emoji: '👃' },
      { id: 'b07', he: 'פה', en: 'Mouth', emoji: '👄' },
      { id: 'b08', he: 'לב', en: 'Heart', emoji: '❤️' },
      // Tier 2
      { id: 'b09', he: 'שן', en: 'Tooth', emoji: '🦷' },
      { id: 'b10', he: 'לשון', en: 'Tongue', emoji: '👅' },
      { id: 'b11', he: 'אצבע', en: 'Finger', emoji: '☝️' },
      { id: 'b12', he: 'ברך', en: 'Knee', emoji: '🦵' },
      { id: 'b13', he: 'כתף', en: 'Shoulder', emoji: '💪' },
      { id: 'b14', he: 'גב', en: 'Back', emoji: '🔙' },
      { id: 'b15', he: 'בטן', en: 'Stomach', emoji: '🫄' },
      { id: 'b16', he: 'צוואר', en: 'Neck', emoji: '🧣' },
      // Tier 3
      { id: 'b17', he: 'שיער', en: 'Hair', emoji: '💇' },
      { id: 'b18', he: 'מרפק', en: 'Elbow', emoji: '💪' },
      { id: 'b19', he: 'אגודל', en: 'Thumb', emoji: '👍' },
      { id: 'b20', he: 'כף רגל', en: 'Foot', emoji: '🦶' },
      { id: 'b21', he: 'עצם', en: 'Bone', emoji: '🦴' },
      { id: 'b22', he: 'מוח', en: 'Brain', emoji: '🧠' },
      { id: 'b23', he: 'עור', en: 'Skin', emoji: '🤚' },
      { id: 'b24', he: 'דם', en: 'Blood', emoji: '🩸' },
      // Tier 4
      { id: 'b25', he: 'גבה', en: 'Eyebrow', emoji: '🤨' },
      { id: 'b26', he: 'סנטר', en: 'Chin', emoji: '😐' },
      { id: 'b27', he: 'קרסול', en: 'Ankle', emoji: '🦶' },
      { id: 'b28', he: 'ריאות', en: 'Lungs', emoji: '🫁' },
      { id: 'b29', he: 'שריר', en: 'Muscle', emoji: '💪' },
      { id: 'b30', he: 'ציפורן', en: 'Nail', emoji: '💅' },
      { id: 'b31', he: 'מצח', en: 'Forehead', emoji: '😶' },
      { id: 'b32', he: 'לחי', en: 'Cheek', emoji: '😊' },
      // Tier 5
      { id: 'b33', he: 'זרוע', en: 'Arm', emoji: '💪' },
      { id: 'b34', he: 'חזה', en: 'Chest', emoji: '🫀' },
      { id: 'b35', he: 'ירך', en: 'Thigh', emoji: '🦵' },
      { id: 'b36', he: 'שפה', en: 'Lip', emoji: '👄' },
      { id: 'b37', he: 'ריסים', en: 'Eyelash', emoji: '👁️' },
      { id: 'b38', he: 'כף יד', en: 'Palm', emoji: '🤲' },
      { id: 'b39', he: 'פרק', en: 'Wrist', emoji: '⌚' },
      { id: 'b40', he: 'עקב', en: 'Heel', emoji: '🦶' },
      // Tier 6
      { id: 'b41', he: 'עמוד שדרה', en: 'Spine', emoji: '🦴' },
      { id: 'b42', he: 'כליות', en: 'Kidneys', emoji: '🫘' },
      { id: 'b43', he: 'כבד', en: 'Liver', emoji: '🫀' },
      { id: 'b44', he: 'קיבה', en: 'Belly', emoji: '🤰' },
      { id: 'b45', he: 'צלעות', en: 'Ribs', emoji: '🦴' },
      { id: 'b46', he: 'גולגולת', en: 'Skull', emoji: '💀' },
      { id: 'b47', he: 'עורק', en: 'Artery', emoji: '🩸' },
      { id: 'b48', he: 'גיד', en: 'Tendon', emoji: '💪' },
    ],
  },
  {
    id: 'clothes',
    heLabel: 'בגדים',
    enLabel: 'Clothes',
    emoji: '👕',
    planetColor: '#ec4899',
    words: [
      // Tier 1
      { id: 'c01', he: 'חולצה', en: 'Shirt', emoji: '👕' },
      { id: 'c02', he: 'מכנסיים', en: 'Pants', emoji: '👖' },
      { id: 'c03', he: 'נעליים', en: 'Shoes', emoji: '👟' },
      { id: 'c04', he: 'כובע', en: 'Hat', emoji: '🧢' },
      { id: 'c05', he: 'שמלה', en: 'Dress', emoji: '👗' },
      { id: 'c06', he: 'גרביים', en: 'Socks', emoji: '🧦' },
      { id: 'c07', he: 'מעיל', en: 'Coat', emoji: '🧥' },
      { id: 'c08', he: 'צעיף', en: 'Scarf', emoji: '🧣' },
      // Tier 2
      { id: 'c09', he: 'כפפות', en: 'Gloves', emoji: '🧤' },
      { id: 'c10', he: 'חגורה', en: 'Belt', emoji: '👔' },
      { id: 'c11', he: 'משקפיים', en: 'Glasses', emoji: '👓' },
      { id: 'c12', he: 'מגפיים', en: 'Boots', emoji: '🥾' },
      { id: 'c13', he: 'סנדלים', en: 'Sandals', emoji: '🩴' },
      { id: 'c14', he: 'חצאית', en: 'Skirt', emoji: '👗' },
      { id: 'c15', he: 'עניבה', en: 'Tie', emoji: '👔' },
      { id: 'c16', he: "פיג'מה", en: 'Pajamas', emoji: '🛌' },
      // Tier 3
      { id: 'c17', he: 'תיק', en: 'Bag', emoji: '👜' },
      { id: 'c18', he: 'ארנק', en: 'Wallet', emoji: '👛' },
      { id: 'c19', he: 'מטריה', en: 'Umbrella', emoji: '☂️' },
      { id: 'c20', he: 'טבעת', en: 'Ring', emoji: '💍' },
      { id: 'c21', he: 'שרשרת', en: 'Necklace', emoji: '📿' },
      { id: 'c22', he: 'כיס', en: 'Pocket', emoji: '👖' },
      { id: 'c23', he: 'כפתור', en: 'Button', emoji: '🔘' },
      { id: 'c24', he: 'רוכסן', en: 'Zipper', emoji: '🔗' },
      // Tier 4
      { id: 'c25', he: 'אפודה', en: 'Vest', emoji: '🦺' },
      { id: 'c26', he: 'תחתונים', en: 'Underwear', emoji: '🩲' },
      { id: 'c27', he: 'שרוול', en: 'Sleeve', emoji: '👕' },
      { id: 'c28', he: 'צווארון', en: 'Collar', emoji: '👔' },
      { id: 'c29', he: 'סרט שיער', en: 'Headband', emoji: '💆' },
      { id: 'c30', he: 'שעון יד', en: 'Watch', emoji: '⌚' },
      { id: 'c31', he: 'תיק גב', en: 'Backpack', emoji: '🎒' },
      { id: 'c32', he: 'עגילים', en: 'Earrings', emoji: '💎' },
      // Tier 5
      { id: 'c33', he: 'חליפה', en: 'Suit', emoji: '🤵' },
      { id: 'c34', he: 'גלימה', en: 'Robe', emoji: '👘' },
      { id: 'c35', he: 'סינר', en: 'Apron', emoji: '🧑‍🍳' },
      { id: 'c36', he: 'כפכפים', en: 'Flip Flops', emoji: '🩴' },
      { id: 'c37', he: 'משקפי שמש', en: 'Sunglasses', emoji: '🕶️' },
      { id: 'c38', he: 'צמיד', en: 'Bracelet', emoji: '📿' },
      { id: 'c39', he: 'סיכה', en: 'Pin', emoji: '📌' },
      { id: 'c40', he: 'מדים', en: 'Uniform', emoji: '👮' },
      // Tier 6
      { id: 'c41', he: 'קסדה', en: 'Helmet', emoji: '⛑️' },
      { id: 'c42', he: 'שריון', en: 'Armor', emoji: '🛡️' },
      { id: 'c43', he: 'כתר', en: 'Crown', emoji: '👑' },
      { id: 'c44', he: 'מסכה', en: 'Mask', emoji: '🎭' },
      { id: 'c45', he: 'תחפושת', en: 'Costume', emoji: '🎃' },
      { id: 'c46', he: 'סרט', en: 'Ribbon', emoji: '🎀' },
      { id: 'c47', he: 'פרווה', en: 'Fur', emoji: '🧸' },
      { id: 'c48', he: 'עור', en: 'Leather', emoji: '👞' },
    ],
  },
  {
    id: 'vehicles',
    heLabel: 'כלי תחבורה',
    enLabel: 'Vehicles',
    emoji: '🚗',
    planetColor: '#3b82f6',
    words: [
      // Tier 1
      { id: 'v01', he: 'מכונית', en: 'Car', emoji: '🚗' },
      { id: 'v02', he: 'אוטובוס', en: 'Bus', emoji: '🚌' },
      { id: 'v03', he: 'רכבת', en: 'Train', emoji: '🚂' },
      { id: 'v04', he: 'אופניים', en: 'Bicycle', emoji: '🚲' },
      { id: 'v05', he: 'מטוס', en: 'Airplane', emoji: '✈️' },
      { id: 'v06', he: 'סירה', en: 'Boat', emoji: '⛵' },
      { id: 'v07', he: 'אופנוע', en: 'Motorcycle', emoji: '🏍️' },
      { id: 'v08', he: 'מסוק', en: 'Helicopter', emoji: '🚁' },
      // Tier 2
      { id: 'v09', he: 'משאית', en: 'Truck', emoji: '🚛' },
      { id: 'v10', he: 'אמבולנס', en: 'Ambulance', emoji: '🚑' },
      { id: 'v11', he: 'כבאית', en: 'Fire Truck', emoji: '🚒' },
      { id: 'v12', he: 'טרקטור', en: 'Tractor', emoji: '🚜' },
      { id: 'v13', he: 'קורקינט', en: 'Scooter', emoji: '🛴' },
      { id: 'v14', he: 'מונית', en: 'Taxi', emoji: '🚕' },
      { id: 'v15', he: 'ספינה', en: 'Ship', emoji: '🚢' },
      { id: 'v16', he: 'רקטה', en: 'Rocket', emoji: '🚀' },
      // Tier 3
      { id: 'v17', he: 'צוללת', en: 'Submarine', emoji: '🛳️' },
      { id: 'v18', he: 'עגלה', en: 'Cart', emoji: '🛒' },
      { id: 'v19', he: 'רחפן', en: 'Drone', emoji: '🛸' },
      { id: 'v20', he: 'גלשן', en: 'Surfboard', emoji: '🏄' },
      { id: 'v21', he: 'כדור פורח', en: 'Hot Air Balloon', emoji: '🎈' },
      { id: 'v22', he: 'מזחלת', en: 'Sled', emoji: '🛷' },
      { id: 'v23', he: 'רכבל', en: 'Cable Car', emoji: '🚡' },
      { id: 'v24', he: 'סקייטבורד', en: 'Skateboard', emoji: '🛹' },
      // Tier 4
      { id: 'v25', he: 'כרכרה', en: 'Carriage', emoji: '🎠' },
      { id: 'v26', he: 'טנק', en: 'Tank', emoji: '🪖' },
      { id: 'v27', he: 'קנו', en: 'Canoe', emoji: '🛶' },
      { id: 'v28', he: 'לוויין', en: 'Satellite', emoji: '🛰️' },
      { id: 'v29', he: "ג'יפ", en: 'Jeep', emoji: '🚙' },
      { id: 'v30', he: 'אווירון', en: 'Glider', emoji: '🪂' },
      { id: 'v31', he: 'ניידת משטרה', en: 'Police Car', emoji: '🚓' },
      { id: 'v32', he: 'רכבת תחתית', en: 'Subway', emoji: '🚇' },
      // Tier 5
      { id: 'v33', he: 'עגלת תינוק', en: 'Stroller', emoji: '👶' },
      { id: 'v34', he: 'כיסא גלגלים', en: 'Wheelchair', emoji: '♿' },
      { id: 'v35', he: 'מכבש', en: 'Roller', emoji: '🚧' },
      { id: 'v36', he: 'מנוף', en: 'Crane', emoji: '🏗️' },
      { id: 'v37', he: 'דוברה', en: 'Raft', emoji: '🛟' },
      { id: 'v38', he: 'יאכטה', en: 'Yacht', emoji: '🛥️' },
      { id: 'v39', he: 'מטוס קל', en: 'Biplane', emoji: '🛩️' },
      { id: 'v40', he: 'רכבת הרים', en: 'Roller Coaster', emoji: '🎢' },
      // Tier 6
      { id: 'v41', he: 'אוניה', en: 'Ferry', emoji: '⛴️' },
      { id: 'v42', he: 'חללית', en: 'Spaceship', emoji: '🚀' },
      { id: 'v43', he: 'הוברקרפט', en: 'Hovercraft', emoji: '🛥️' },
      { id: 'v44', he: 'אופני הרים', en: 'Mountain Bike', emoji: '🚵' },
      { id: 'v45', he: 'גלגיליות', en: 'Roller Skates', emoji: '⛸️' },
      { id: 'v46', he: 'מצנח', en: 'Parachute', emoji: '🪂' },
      { id: 'v47', he: 'קרוואן', en: 'Caravan', emoji: '🚐' },
      { id: 'v48', he: 'לימוזינה', en: 'Limousine', emoji: '🚗' },
    ],
  },
  {
    id: 'colors_shapes',
    heLabel: 'צבעים וצורות',
    enLabel: 'Colors & Shapes',
    emoji: '🎨',
    planetColor: '#eab308',
    words: [
      // Tier 1
      { id: 'cs01', he: 'אדום', en: 'Red', emoji: '🔴' },
      { id: 'cs02', he: 'כחול', en: 'Blue', emoji: '🔵' },
      { id: 'cs03', he: 'ירוק', en: 'Green', emoji: '🟢' },
      { id: 'cs04', he: 'צהוב', en: 'Yellow', emoji: '🟡' },
      { id: 'cs05', he: 'עיגול', en: 'Circle', emoji: '⭕' },
      { id: 'cs06', he: 'ריבוע', en: 'Square', emoji: '🟧' },
      { id: 'cs07', he: 'משולש', en: 'Triangle', emoji: '🔺' },
      { id: 'cs08', he: 'כוכב', en: 'Star', emoji: '⭐' },
      // Tier 2
      { id: 'cs09', he: 'לבן', en: 'White', emoji: '⬜' },
      { id: 'cs10', he: 'שחור', en: 'Black', emoji: '⬛' },
      { id: 'cs11', he: 'כתום', en: 'Orange', emoji: '🟠' },
      { id: 'cs12', he: 'סגול', en: 'Purple', emoji: '🟣' },
      { id: 'cs13', he: 'ורוד', en: 'Pink', emoji: '🩷' },
      { id: 'cs14', he: 'חום', en: 'Brown', emoji: '🟤' },
      { id: 'cs15', he: 'אפור', en: 'Gray', emoji: '🩶' },
      { id: 'cs16', he: 'מלבן', en: 'Rectangle', emoji: '▬' },
      // Tier 3
      { id: 'cs17', he: 'זהב', en: 'Gold', emoji: '🥇' },
      { id: 'cs18', he: 'כסף', en: 'Silver', emoji: '🥈' },
      { id: 'cs19', he: 'יהלום', en: 'Diamond', emoji: '💎' },
      { id: 'cs20', he: 'לב', en: 'Heart', emoji: '💜' },
      { id: 'cs21', he: 'חץ', en: 'Arrow', emoji: '➡️' },
      { id: 'cs22', he: 'כדור', en: 'Ball', emoji: '⚽' },
      { id: 'cs23', he: 'קובייה', en: 'Cube', emoji: '🧊' },
      { id: 'cs24', he: 'פסים', en: 'Stripes', emoji: '🦓' },
      // Tier 4
      { id: 'cs25', he: 'מחומש', en: 'Pentagon', emoji: '⬠' },
      { id: 'cs26', he: 'משושה', en: 'Hexagon', emoji: '⬡' },
      { id: 'cs27', he: 'חרוט', en: 'Cone', emoji: '🔺' },
      { id: 'cs28', he: 'גליל', en: 'Cylinder', emoji: '🧴' },
      { id: 'cs29', he: 'נקודות', en: 'Dots', emoji: '🔵' },
      { id: 'cs30', he: 'אליפסה', en: 'Oval', emoji: '🥚' },
      { id: 'cs31', he: 'ספירלה', en: 'Spiral', emoji: '🌀' },
      { id: 'cs32', he: 'פירמידה', en: 'Pyramid', emoji: '🔺' },
      // Tier 5
      { id: 'cs33', he: 'טורקיז', en: 'Turquoise', emoji: '🔵' },
      { id: 'cs34', he: 'בז\'', en: 'Beige', emoji: '🟫' },
      { id: 'cs35', he: 'חאקי', en: 'Khaki', emoji: '🟤' },
      { id: 'cs36', he: 'ארגמן', en: 'Crimson', emoji: '🔴' },
      { id: 'cs37', he: 'שנהב', en: 'Ivory', emoji: '⬜' },
      { id: 'cs38', he: 'אלכסון', en: 'Diagonal', emoji: '📐' },
      { id: 'cs39', he: 'משבצות', en: 'Checkered', emoji: '♟️' },
      { id: 'cs40', he: 'זיגזג', en: 'Zigzag', emoji: '⚡' },
      // Tier 6
      { id: 'cs41', he: 'גוון', en: 'Shade', emoji: '🎨' },
      { id: 'cs42', he: 'בהיר', en: 'Bright', emoji: '☀️' },
      { id: 'cs43', he: 'כהה', en: 'Dark', emoji: '🌑' },
      { id: 'cs44', he: 'שקוף', en: 'Transparent', emoji: '💧' },
      { id: 'cs45', he: 'מבריק', en: 'Shiny', emoji: '✨' },
      { id: 'cs46', he: 'עגול', en: 'Round', emoji: '🔵' },
      { id: 'cs47', he: 'חד', en: 'Sharp', emoji: '📌' },
      { id: 'cs48', he: 'שטוח', en: 'Flat', emoji: '📄' },
    ],
  },
];

// ===== HELPER FUNCTIONS =====

const TIER_SIZE = 8;

function getCategoryById(catId) {
  return WORD_CATEGORIES.find(c => c.id === catId);
}

function getWordById(catId, wordId) {
  const cat = getCategoryById(catId);
  return cat ? cat.words.find(w => w.id === wordId) : null;
}

/**
 * Find which category a word belongs to.
 */
function findCategoryByWordId(wordId) {
  return WORD_CATEGORIES.find(c => c.words.some(w => w.id === wordId));
}

/**
 * Build the pool of word IDs for a category up to given tier count.
 * tierCount=1 → first 8, tierCount=2 → first 16, etc.
 */
function buildCategoryPool(catId, tierCount) {
  const cat = getCategoryById(catId);
  if (!cat) return [];
  const count = Math.min(tierCount * TIER_SIZE, cat.words.length);
  return cat.words.slice(0, count).map(w => w.id);
}

/**
 * Get the maximum number of tiers for a category.
 */
function getMaxTiers(catId) {
  const cat = getCategoryById(catId);
  if (!cat) return 0;
  return Math.ceil(cat.words.length / TIER_SIZE);
}

/**
 * Build adaptive key: "en:<wordId>"
 */
function adaptiveKey(wordId) {
  return `en:${wordId}`;
}

/**
 * Pick N random items from an array (Fisher-Yates partial shuffle).
 */
function pickRandom(arr, n) {
  const copy = arr.slice();
  const result = [];
  for (let i = 0; i < n && copy.length > 0; i++) {
    const idx = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(idx, 1)[0]);
  }
  return result;
}

/**
 * Shuffle an array in place (Fisher-Yates).
 */
function shuffleArray(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
