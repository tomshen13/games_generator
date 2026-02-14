/**
 * Unicorn Numbers — Shop Item Catalog
 */
const SHOP_ITEMS = {
  characters: [
    { id: 'sparky',  name: 'Sparky',  emoji: '\u{1F984}', price: 0,  desc: 'Default unicorn' },
    { id: 'pegasus', name: 'Pegasus', emoji: '\u{1FABD}', price: 10, desc: 'Winged horse' },
    { id: 'fairy',   name: 'Fairy',   emoji: '\u{1F98B}', price: 15, desc: 'Magical butterfly' },
    { id: 'dragon',  name: 'Dragon',  emoji: '\u{1F409}', price: 25, desc: 'Friendly dragon' },
    { id: 'phoenix', name: 'Phoenix', emoji: '\u{1F525}', price: 30, desc: 'Fire bird' },
    { id: 'crystal', name: 'Crystal', emoji: '\u{1F48E}', price: 40, desc: 'Gem unicorn' },
  ],
  accessories: [
    { id: 'crown',      name: 'Crown',      emoji: '\u{1F451}', price: 10, desc: 'Royal crown' },
    { id: 'sunglasses', name: 'Sunglasses', emoji: '\u{1F576}\uFE0F', price: 8,  desc: 'Cool shades' },
    { id: 'star',       name: 'Star',       emoji: '\u{1F31F}', price: 12, desc: 'Shining star' },
    { id: 'bow',        name: 'Bow',        emoji: '\u{1F380}', price: 8,  desc: 'Cute bow' },
    { id: 'cape',       name: 'Cape',       emoji: '\u{1F9B8}', price: 15, desc: 'Hero cape' },
    { id: 'wizard',     name: 'Wizard Hat', emoji: '\u{1F9D9}', price: 20, desc: 'Magic hat' },
  ],
  trails: [
    { id: 'default', name: 'Default', emoji: '\u{2728}',  price: 0,  desc: 'Normal effects', effect: 'default' },
    { id: 'hearts',  name: 'Hearts',  emoji: '\u{1F495}', price: 12, desc: 'Heart burst',    effect: 'hearts' },
    { id: 'stars',   name: 'Stars',   emoji: '\u{1F31F}', price: 12, desc: 'Star burst',     effect: 'stars' },
    { id: 'bolt',    name: 'Lightning', emoji: '\u{26A1}', price: 18, desc: 'Electric bolt',  effect: 'bolt' },
    { id: 'leaves',  name: 'Leaves',  emoji: '\u{1F343}', price: 15, desc: 'Leaf storm',     effect: 'leaves' },
  ],
  themes: [
    { id: 'default', name: 'Default', emoji: '\u{1F3A8}', price: 0,  desc: 'Power-based', colors: null },
    { id: 'space',   name: 'Space',   emoji: '\u{1F30C}', price: 20, desc: 'Deep space',  colors: ['#0b0028', '#1a0050'] },
    { id: 'candy',   name: 'Candy',   emoji: '\u{1F36D}', price: 15, desc: 'Sweet pastels', colors: ['#4a0030', '#2e0040'] },
    { id: 'ocean',   name: 'Ocean',   emoji: '\u{1F30A}', price: 15, desc: 'Deep sea',    colors: ['#001a2e', '#003040'] },
    { id: 'sunset',  name: 'Sunset',  emoji: '\u{1F305}', price: 20, desc: 'Warm glow',   colors: ['#2e1000', '#3a0020'] },
  ],
};

/** Flat lookup: id → item (with category attached) */
const SHOP_LOOKUP = {};
for (const [cat, items] of Object.entries(SHOP_ITEMS)) {
  for (const item of items) {
    SHOP_LOOKUP[item.id] = { ...item, category: cat };
  }
}
