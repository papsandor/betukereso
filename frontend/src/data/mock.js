// Mock data for Hungarian literacy app
export const hungarianGraphemes = [
  "a", "á", "b", "c", "cs", "d", "dz", "dzs", "e", "é", "f", "g", "gy", "h", "i", "í", 
  "j", "k", "l", "ly", "m", "n", "ny", "o", "ó", "ö", "ő", "p", "r", "s", "sz", 
  "t", "ty", "u", "ú", "ü", "ű", "v", "z", "zs"
];

export const foreignGraphemes = ["q", "w", "x", "y"];

export const troubleGraphemes = ["b", "d", "p", "q"];

export const phonemeMapHU = {
  "a": "alma",
  "á": "ház", 
  "b": "béka",
  "c": "ceruza",
  "cs": "család",
  "d": "dió",
  "dz": "bodza",
  "dzs": "dzsungel",
  "e": "egér",
  "é": "étel",
  "f": "fa",
  "g": "gomb",
  "gy": "gyerek",
  "h": "ház",
  "i": "iskola",
  "í": "íj",
  "j": "jég",
  "k": "kutya",
  "l": "labda",
  "ly": "lyuk",
  "m": "macska",
  "n": "nap",
  "ny": "nyúl",
  "o": "óra",
  "ó": "óriás",
  "ö": "ördög",
  "ő": "őz",
  "p": "piros",
  "r": "repülő",
  "s": "sajt",
  "sz": "szék",
  "t": "teve",
  "ty": "tyúk",
  "u": "ujj",
  "ú": "úszik",
  "ü": "üveg",
  "ű": "űrhajó",
  "v": "virág",
  "z": "zöld",
  "zs": "zsiráf",
  "q": "quiche",
  "w": "walkman", 
  "x": "xilofon",
  "y": "yacht"
};

export const mockChildren = [
  {
    id: "1",
    name: "Anna",
    streak: 5,
    totalStickers: 3,
    progress: {
      "a": { stars: 3, attempts: 15, correct: 14 },
      "b": { stars: 2, attempts: 8, correct: 6 },
      "cs": { stars: 1, attempts: 5, correct: 3 }
    },
    createdAt: new Date("2025-01-10").toISOString()
  },
  {
    id: "2", 
    name: "Péter",
    streak: 8,
    totalStickers: 5,
    progress: {
      "a": { stars: 3, attempts: 12, correct: 11 },
      "e": { stars: 3, attempts: 10, correct: 9 },
      "gy": { stars: 2, attempts: 6, correct: 4 }
    },
    createdAt: new Date("2025-01-08").toISOString()
  }
];

export const mockSettings = {
  lettersPerSession: 9,
  letterCase: "mixed", // lowercase | uppercase | titlecase | mixed
  includeForeignLetters: false,
  streakThresholds: [3, 5, 10],
  troubleGraphemes: ["b", "d", "p", "q"],
  soundEnabled: true,
  highContrast: false,
  difficulty: "Medium" // Easy=6, Medium=9, Hard=12
};

export const mockStickers = [
  { id: "1", name: "Arany Csillag", emoji: "⭐", earnedAt: new Date("2025-01-10").toISOString() },
  { id: "2", name: "Szuper Olvasó", emoji: "📚", earnedAt: new Date("2025-01-09").toISOString() },
  { id: "3", name: "Betű Mester", emoji: "🎯", earnedAt: new Date("2025-01-08").toISOString() }
];

// Helper functions
export const getGraphemeCase = (grapheme, caseType) => {
  switch (caseType) {
    case "uppercase":
      return grapheme.toUpperCase();
    case "titlecase":
      return grapheme.charAt(0).toUpperCase() + grapheme.slice(1).toLowerCase();
    case "lowercase":
    default:
      return grapheme.toLowerCase();
  }
};

export const getRandomGraphemes = (count, includeForeign = false, troubleBias = true) => {
  let pool = [...hungarianGraphemes];
  if (includeForeign) {
    pool = [...pool, ...foreignGraphemes];
  }
  
  // Bias toward trouble graphemes if they exist in the pool
  if (troubleBias) {
    const availableTrouble = troubleGraphemes.filter(g => pool.includes(g));
    if (availableTrouble.length > 0) {
      // Add trouble graphemes multiple times to increase selection probability
      pool = [...pool, ...availableTrouble, ...availableTrouble];
    }
  }
  
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

export const generateSessionSeed = (childName) => {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  return `${date}_${childName}`;
};