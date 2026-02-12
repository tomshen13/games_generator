/**
 * Pokemon data for the multiplication game.
 * Sprites from PokeAPI (free, open-source).
 */

const SPRITE_BASE = 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon';

const TYPE_COLORS = {
  fire:     { primary: '#F08030', glow: '#FF4500', bg: 'linear-gradient(135deg, #1a0a00 0%, #2d1810 50%, #1a0500 100%)' },
  water:    { primary: '#6890F0', glow: '#00BFFF', bg: 'linear-gradient(135deg, #000a1a 0%, #0d1b2a 50%, #000a1a 100%)' },
  grass:    { primary: '#78C850', glow: '#00FF41', bg: 'linear-gradient(135deg, #001a00 0%, #0d2a10 50%, #001a05 100%)' },
  electric: { primary: '#F8D030', glow: '#FFD700', bg: 'linear-gradient(135deg, #1a1a00 0%, #2d2a10 50%, #1a1500 100%)' },
  normal:   { primary: '#A8A878', glow: '#C0C0C0', bg: 'linear-gradient(135deg, #1a1a1e 0%, #2d2d35 50%, #1a1a1e 100%)' },
  psychic:  { primary: '#F85888', glow: '#FF69B4', bg: 'linear-gradient(135deg, #1a001a 0%, #2d102a 50%, #1a0020 100%)' },
  fighting: { primary: '#C03028', glow: '#FF2020', bg: 'linear-gradient(135deg, #1a0000 0%, #2d1010 50%, #1a0505 100%)' },
  poison:   { primary: '#A040A0', glow: '#DA70D6', bg: 'linear-gradient(135deg, #1a0020 0%, #2d102a 50%, #1a0020 100%)' },
  ghost:    { primary: '#705898', glow: '#8B5CF6', bg: 'linear-gradient(135deg, #0d001a 0%, #1a102a 50%, #0d001a 100%)' },
  dragon:   { primary: '#7038F8', glow: '#6366F1', bg: 'linear-gradient(135deg, #0a001a 0%, #1a0a2d 50%, #0a0020 100%)' },
};

const POKEMON = {
  starters: [
    { id: 1,   name: 'Bulbasaur',  type: 'grass'    },
    { id: 4,   name: 'Charmander', type: 'fire'     },
    { id: 7,   name: 'Squirtle',   type: 'water'    },
    { id: 25,  name: 'Pikachu',    type: 'electric' },
  ],

  tier1: [
    { id: 10,  name: 'Caterpie',    type: 'grass',    price: 10 },
    { id: 16,  name: 'Pidgey',      type: 'normal',   price: 10 },
    { id: 19,  name: 'Rattata',     type: 'normal',   price: 10 },
    { id: 21,  name: 'Spearow',     type: 'normal',   price: 12 },
    { id: 23,  name: 'Ekans',       type: 'poison',   price: 15 },
    { id: 27,  name: 'Sandshrew',   type: 'normal',   price: 15 },
    { id: 29,  name: 'Nidoran♀',    type: 'poison',   price: 15 },
    { id: 35,  name: 'Clefairy',    type: 'normal',   price: 18 },
    { id: 39,  name: 'Jigglypuff',  type: 'normal',   price: 18 },
    { id: 41,  name: 'Zubat',       type: 'poison',   price: 12 },
    { id: 43,  name: 'Oddish',      type: 'grass',    price: 15 },
    { id: 52,  name: 'Meowth',      type: 'normal',   price: 18 },
    { id: 54,  name: 'Psyduck',     type: 'water',    price: 18 },
    { id: 58,  name: 'Growlithe',   type: 'fire',     price: 20 },
    { id: 60,  name: 'Poliwag',     type: 'water',    price: 15 },
    { id: 63,  name: 'Abra',        type: 'psychic',  price: 20 },
    { id: 66,  name: 'Machop',      type: 'fighting', price: 20 },
    { id: 74,  name: 'Geodude',     type: 'normal',   price: 15 },
    { id: 81,  name: 'Magnemite',   type: 'electric', price: 20 },
    { id: 92,  name: 'Gastly',      type: 'ghost',    price: 20 },
  ],

  tier2: [
    { id: 2,   name: 'Ivysaur',     type: 'grass',    price: 30 },
    { id: 5,   name: 'Charmeleon',   type: 'fire',     price: 30 },
    { id: 8,   name: 'Wartortle',    type: 'water',    price: 30 },
    { id: 26,  name: 'Raichu',       type: 'electric', price: 35 },
    { id: 37,  name: 'Vulpix',       type: 'fire',     price: 25 },
    { id: 77,  name: 'Ponyta',       type: 'fire',     price: 28 },
    { id: 79,  name: 'Slowpoke',     type: 'water',    price: 25 },
    { id: 95,  name: 'Onix',         type: 'normal',   price: 30 },
    { id: 104, name: 'Cubone',       type: 'normal',   price: 25 },
    { id: 109, name: 'Koffing',      type: 'poison',   price: 25 },
    { id: 111, name: 'Rhyhorn',      type: 'normal',   price: 30 },
    { id: 116, name: 'Horsea',       type: 'water',    price: 28 },
    { id: 120, name: 'Staryu',       type: 'water',    price: 28 },
    { id: 123, name: 'Scyther',      type: 'grass',    price: 35 },
    { id: 125, name: 'Electabuzz',   type: 'electric', price: 35 },
    { id: 126, name: 'Magmar',       type: 'fire',     price: 35 },
    { id: 133, name: 'Eevee',        type: 'normal',   price: 40 },
    { id: 147, name: 'Dratini',      type: 'dragon',   price: 40 },
  ],

  tier3: [
    { id: 3,   name: 'Venusaur',     type: 'grass',    price: 60 },
    { id: 6,   name: 'Charizard',    type: 'fire',     price: 60 },
    { id: 9,   name: 'Blastoise',    type: 'water',    price: 60 },
    { id: 65,  name: 'Alakazam',     type: 'psychic',  price: 55 },
    { id: 68,  name: 'Machamp',      type: 'fighting', price: 55 },
    { id: 94,  name: 'Gengar',       type: 'ghost',    price: 60 },
    { id: 130, name: 'Gyarados',     type: 'water',    price: 70 },
    { id: 131, name: 'Lapras',       type: 'water',    price: 65 },
    { id: 134, name: 'Vaporeon',     type: 'water',    price: 50 },
    { id: 135, name: 'Jolteon',      type: 'electric', price: 50 },
    { id: 136, name: 'Flareon',      type: 'fire',     price: 50 },
    { id: 143, name: 'Snorlax',      type: 'normal',   price: 70 },
    { id: 148, name: 'Dragonair',    type: 'dragon',   price: 65 },
    { id: 149, name: 'Dragonite',    type: 'dragon',   price: 80 },
  ],

  legendary: [
    { id: 144, name: 'Articuno',  type: 'water',    price: 120 },
    { id: 145, name: 'Zapdos',    type: 'electric', price: 120 },
    { id: 146, name: 'Moltres',   type: 'fire',     price: 120 },
    { id: 150, name: 'Mewtwo',    type: 'psychic',  price: 200 },
    { id: 151, name: 'Mew',       type: 'psychic',  price: 250 },
  ],
};

const ALL_SHOP_POKEMON = [
  ...POKEMON.tier1,
  ...POKEMON.tier2,
  ...POKEMON.tier3,
  ...POKEMON.legendary,
];

// Keys = level indices that have battleAfter: true (0, 2, 4, 6, 7, 8, 9)
const WILD_ENCOUNTERS = {
  0: [
    { id: 10, name: 'Caterpie',    type: 'grass',    hp: 40 },
    { id: 13, name: 'Weedle',      type: 'grass',    hp: 40 },
    { id: 16, name: 'Pidgey',      type: 'normal',   hp: 40 },
  ],
  2: [
    { id: 37, name: 'Vulpix',      type: 'fire',     hp: 50 },
    { id: 60, name: 'Poliwag',     type: 'water',    hp: 50 },
    { id: 43, name: 'Oddish',      type: 'grass',    hp: 50 },
  ],
  4: [
    { id: 77, name: 'Ponyta',      type: 'fire',     hp: 60 },
    { id: 120, name: 'Staryu',     type: 'water',    hp: 60 },
    { id: 81, name: 'Magnemite',   type: 'electric', hp: 60 },
  ],
  6: [
    { id: 123, name: 'Scyther',    type: 'grass',    hp: 80 },
    { id: 125, name: 'Electabuzz', type: 'electric', hp: 80 },
    { id: 126, name: 'Magmar',     type: 'fire',     hp: 80 },
  ],
  7: [
    { id: 94,  name: 'Gengar',     type: 'ghost',    hp: 90 },
    { id: 148, name: 'Dragonair',  type: 'dragon',   hp: 90 },
  ],
  8: [
    { id: 130, name: 'Gyarados',   type: 'water',    hp: 110 },
    { id: 149, name: 'Dragonite',  type: 'dragon',   hp: 120 },
  ],
  9: [
    { id: 150, name: 'Mewtwo',     type: 'psychic',  hp: 150 },
    { id: 149, name: 'Dragonite',  type: 'dragon',   hp: 140 },
    { id: 143, name: 'Snorlax',    type: 'normal',   hp: 160 },
  ],
};

function getPokemonSprite(id) {
  return `${SPRITE_BASE}/${id}.png`;
}

function getPokemonById(id) {
  const all = [...POKEMON.starters, ...ALL_SHOP_POKEMON];
  return all.find(p => p.id === id) || null;
}
