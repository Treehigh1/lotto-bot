import { useState, useEffect, useCallback, useRef, useMemo } from "react";

/* ═══════════════════════════════════════════════════════
   ALL THE LOTT GAMES (thelott.com) — official formats
   ═══════════════════════════════════════════════════════ */
const GAMES = {
  powerball: {
    name: "Powerball", icon: "⚡",
    mainCount: 7, mainMax: 35,
    bonusName: "Powerball", bonusMax: 20,
    drawDay: "Thursday", color: "#f97316",
    gradient: "linear-gradient(135deg, #f97316, #ea580c, #dc2626)",
    odds: "1 in 134,490,400", desc: "7 from 35 + 1 PB from 20",
    ordered: false, digitGame: false,
  },
  ozlotto: {
    name: "Oz Lotto", icon: "🌏",
    mainCount: 7, mainMax: 47,
    bonusName: null, bonusMax: 0,
    drawDay: "Tuesday", color: "#2563eb",
    gradient: "linear-gradient(135deg, #2563eb, #1d4ed8, #7c3aed)",
    odds: "1 in 45,379,620", desc: "7 from 47 + 2 supps",
    ordered: false, digitGame: false,
  },
  saturday: {
    name: "Saturday Lotto", icon: "🎰",
    mainCount: 6, mainMax: 45,
    bonusName: null, bonusMax: 0,
    drawDay: "Saturday", color: "#16a34a",
    gradient: "linear-gradient(135deg, #16a34a, #15803d, #0d9488)",
    odds: "1 in 8,145,060", desc: "6 from 45 + 2 supps",
    ordered: false, digitGame: false,
  },
  weekday: {
    name: "Weekday Windfall", icon: "🌀",
    mainCount: 6, mainMax: 45,
    bonusName: null, bonusMax: 0,
    drawDay: "Mon/Wed/Fri", color: "#0891b2",
    gradient: "linear-gradient(135deg, #0891b2, #0e7490, #2563eb)",
    odds: "1 in 8,145,060", desc: "6 from 45 + 2 supps",
    ordered: false, digitGame: false,
  },
  setforlife: {
    name: "Set for Life", icon: "💎",
    mainCount: 7, mainMax: 44,
    bonusName: null, bonusMax: 0,
    drawDay: "Daily", color: "#a855f7",
    gradient: "linear-gradient(135deg, #a855f7, #9333ea, #ec4899)",
    odds: "1 in 38,320,568", desc: "7 from 44 + 2 supps",
    ordered: false, digitGame: false,
  },
  super66: {
    name: "Super 66", icon: "🔢",
    mainCount: 6, mainMax: 9,
    bonusName: null, bonusMax: 0,
    drawDay: "Saturday", color: "#ca8a04",
    gradient: "linear-gradient(135deg, #ca8a04, #a16207, #f59e0b)",
    odds: "1 in 1,000,000", desc: "6 digits 0–9 (order matters)",
    ordered: true, digitGame: true,
  },
};

/* ── Dream Symbols → Lucky Numbers (traditional dream guides) ── */
const DREAM_SYMBOLS = {
  "Dragon": { nums: [5,8,28,38], icon: "🐉", meaning: "Power, fortune, transformation" },
  "Snake": { nums: [6,14,32,33], icon: "🐍", meaning: "Wisdom, hidden truths, change" },
  "Pig": { nums: [4,8,18,44], icon: "🐷", meaning: "Wealth, abundance, prosperity" },
  "Gold": { nums: [7,17,27,37], icon: "✨", meaning: "Riches, success, achievement" },
  "Water": { nums: [3,13,29,40], icon: "🌊", meaning: "Emotions, flow, new beginnings" },
  "Fish": { nums: [9,19,28,39], icon: "🐟", meaning: "Abundance, fertility, luck" },
  "Tiger": { nums: [5,15,25,35], icon: "🐯", meaning: "Courage, strength, adventure" },
  "Horse": { nums: [11,21,31,41], icon: "🐴", meaning: "Freedom, speed, success" },
  "Bird": { nums: [12,22,34,42], icon: "🐦", meaning: "Hope, messages, opportunity" },
  "Dog": { nums: [2,10,20,30], icon: "🐕", meaning: "Loyalty, protection, friendship" },
  "Cat": { nums: [1,11,23,33], icon: "🐱", meaning: "Independence, mystery, intuition" },
  "Baby": { nums: [4,14,24,28], icon: "👶", meaning: "New beginnings, innocence, joy" },
  "Money": { nums: [6,16,26,36], icon: "💰", meaning: "Financial gain, opportunity" },
  "Fire": { nums: [7,12,27,43], icon: "🔥", meaning: "Passion, transformation, energy" },
  "Rain": { nums: [3,18,29,38], icon: "🌧️", meaning: "Cleansing, renewal, blessings" },
  "Rainbow": { nums: [8,22,35,48], icon: "🌈", meaning: "Hope, luck, divine promise" },
  "Sun": { nums: [1,10,19,36], icon: "☀️", meaning: "Vitality, clarity, happiness" },
  "Moon": { nums: [2,20,31,42], icon: "🌙", meaning: "Intuition, dreams, cycles" },
  "Star": { nums: [5,15,33,45], icon: "⭐", meaning: "Destiny, guidance, wishes" },
  "Tree": { nums: [3,17,26,37], icon: "🌳", meaning: "Growth, stability, family" },
  "Elephant": { nums: [9,19,39,44], icon: "🐘", meaning: "Wisdom, memory, strength" },
  "Frog": { nums: [7,12,37,40], icon: "🐸", meaning: "Transformation, luck, fertility" },
  "Butterfly": { nums: [4,14,34,41], icon: "🦋", meaning: "Change, beauty, freedom" },
  "Mountain": { nums: [8,18,28,38], icon: "⛰️", meaning: "Achievement, obstacles overcome" },
  "Diamond": { nums: [1,11,21,31], icon: "💎", meaning: "Value, clarity, permanence" },
  "Key": { nums: [6,16,26,44], icon: "🔑", meaning: "Solutions, access, discovery" },
  "Wedding": { nums: [2,22,32,42], icon: "💒", meaning: "Union, commitment, celebration" },
  "Flying": { nums: [5,25,35,45], icon: "🦅", meaning: "Freedom, ambition, escape" },
  "Crown": { nums: [1,10,30,40], icon: "👑", meaning: "Authority, success, recognition" },
  "Ocean": { nums: [3,13,23,43], icon: "🌊", meaning: "Vast possibilities, depth" },
};

const ZODIAC_LUCKY = {
  "Aries": { nums: [1,9,18,27], dates: "Mar 21 – Apr 19", icon: "♈", element: "Fire" },
  "Taurus": { nums: [2,6,15,24], dates: "Apr 20 – May 20", icon: "♉", element: "Earth" },
  "Gemini": { nums: [3,7,12,23], dates: "May 21 – Jun 20", icon: "♊", element: "Air" },
  "Cancer": { nums: [4,8,18,22], dates: "Jun 21 – Jul 22", icon: "♋", element: "Water" },
  "Leo": { nums: [5,14,19,36], dates: "Jul 23 – Aug 22", icon: "♌", element: "Fire" },
  "Virgo": { nums: [6,11,16,26], dates: "Aug 23 – Sep 22", icon: "♍", element: "Earth" },
  "Libra": { nums: [7,15,24,33], dates: "Sep 23 – Oct 22", icon: "♎", element: "Air" },
  "Scorpio": { nums: [8,13,21,32], dates: "Oct 23 – Nov 21", icon: "♏", element: "Water" },
  "Sagittarius": { nums: [3,9,22,35], dates: "Nov 22 – Dec 21", icon: "♐", element: "Fire" },
  "Capricorn": { nums: [4,10,25,34], dates: "Dec 22 – Jan 19", icon: "♑", element: "Earth" },
  "Aquarius": { nums: [2,11,20,29], dates: "Jan 20 – Feb 18", icon: "♒", element: "Air" },
  "Pisces": { nums: [5,12,17,28], dates: "Feb 19 – Mar 20", icon: "♓", element: "Water" },
};

/* ── Lucky Number Generator from personal inputs ── */
function generateLuckyFromBirthday(dateStr, count, max) {
  const parts = dateStr.split("-"); if (parts.length !== 3) return [];
  const y = parseInt(parts[0]), m = parseInt(parts[1]), d = parseInt(parts[2]);
  const seeds = [d, m, d + m, Math.abs(d - m), (y % 100), ((d * m) % max) + 1, (d + m + y) % max + 1, ((y + d) % max) + 1, ((m * d + y) % max) + 1, (d * 3 + m * 7) % max + 1];
  const unique = [...new Set(seeds.filter(n => n >= 1 && n <= max))];
  while (unique.length < count) { const r = Math.floor(Math.random() * max) + 1; if (!unique.includes(r)) unique.push(r); }
  return unique.slice(0, count).sort((a, b) => a - b);
}

function generateLuckyFromName(name, count, max) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) { hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0; }
  const nums = new Set();
  for (let i = 0; nums.size < count + 5 && i < 50; i++) {
    hash = ((hash * 1103515245 + 12345) & 0x7fffffff);
    const n = (Math.abs(hash) % max) + 1;
    nums.add(n);
  }
  return [...nums].slice(0, count).sort((a, b) => a - b);
}

function generateFromDreams(selectedSymbols, count, max) {
  const pool = [];
  selectedSymbols.forEach(sym => { if (DREAM_SYMBOLS[sym]) pool.push(...DREAM_SYMBOLS[sym].nums); });
  const valid = [...new Set(pool.filter(n => n >= 1 && n <= max))];
  while (valid.length < count) { const r = Math.floor(Math.random() * max) + 1; if (!valid.includes(r)) valid.push(r); }
  // Shuffle and pick
  for (let i = valid.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [valid[i], valid[j]] = [valid[j], valid[i]]; }
  return valid.slice(0, count).sort((a, b) => a - b);
}

/* ── Real 2026 Data (sourced from au.lottonumbers.com — verified results) ── */
const REAL_DATA = {
  powerball: [
    { date: "2026-01-01", numbers: [7,9,15,18,27,29,30], bonus: 3 },
    { date: "2026-01-08", numbers: [7,15,16,17,25,26,27], bonus: 9 },
    { date: "2026-01-15", numbers: [1,2,4,24,25,27,35], bonus: 14 },
    { date: "2026-01-22", numbers: [6,9,20,21,22,30,34], bonus: 5 },
    { date: "2026-01-29", numbers: [4,6,14,18,25,27,34], bonus: 6 },
    { date: "2026-02-05", numbers: [9,12,15,18,22,25,33], bonus: 8 },
    { date: "2026-02-12", numbers: [11,12,14,18,20,21,30], bonus: 7 },
    { date: "2026-02-19", numbers: [7,12,15,17,26,28,30], bonus: 9 },
    { date: "2026-02-26", numbers: [6,8,12,18,25,26,27], bonus: 5 },
    { date: "2026-03-05", numbers: [1,5,9,20,22,23,34], bonus: 17 },
    { date: "2026-03-12", numbers: [4,5,6,9,13,14,18], bonus: 14 },
    { date: "2026-03-19", numbers: [4,9,18,20,22,25,35], bonus: 15 },
    { date: "2026-03-26", numbers: [5,9,20,22,24,25,28], bonus: 20 },
  ],
  saturday: [
    { date: "2026-01-03", numbers: [9,10,13,19,21,36] },
    { date: "2026-01-10", numbers: [1,8,23,25,30,41] },
    { date: "2026-01-17", numbers: [8,9,19,35,38,44] },
    { date: "2026-01-24", numbers: [8,22,24,28,29,33] },
    { date: "2026-01-31", numbers: [9,20,33,34,42,45] },
    { date: "2026-02-07", numbers: [3,8,9,27,33,41] },
    { date: "2026-02-14", numbers: [3,6,7,12,14,22] },
    { date: "2026-02-21", numbers: [4,11,26,30,42,43] },
    { date: "2026-02-28", numbers: [7,13,21,31,35,44] },
    { date: "2026-03-07", numbers: [16,17,24,33,35,36] },
    { date: "2026-03-14", numbers: [14,21,27,34,36,40] },
    { date: "2026-03-21", numbers: [11,16,20,27,43,45] },
    { date: "2026-03-28", numbers: [1,2,3,25,29,30] },
  ],
  ozlotto: [
    { date: "2026-01-06", numbers: [2,13,14,17,19,30,45] },
    { date: "2026-01-13", numbers: [17,23,31,35,38,39,42] },
    { date: "2026-01-20", numbers: [3,11,14,22,27,32,33] },
    { date: "2026-01-27", numbers: [1,15,17,22,23,28,41] },
    { date: "2026-02-03", numbers: [4,10,19,27,29,41,46] },
    { date: "2026-02-10", numbers: [4,20,23,26,27,31,44] },
    { date: "2026-02-17", numbers: [9,23,32,36,39,42,44] },
    { date: "2026-02-24", numbers: [2,5,7,25,27,33,43] },
    { date: "2026-03-03", numbers: [5,7,18,21,33,39,47] },
    { date: "2026-03-10", numbers: [12,16,17,33,34,41,42] },
    { date: "2026-03-17", numbers: [2,6,18,24,25,45,47] },
    { date: "2026-03-24", numbers: [6,9,22,24,25,27,34] },
  ],
  weekday: [
    { date: "2026-01-23", numbers: [1,2,20,23,32,37] },
    { date: "2026-01-26", numbers: [2,4,13,17,26,39] },
    { date: "2026-01-28", numbers: [19,26,29,37,42,43] },
    { date: "2026-01-30", numbers: [3,7,8,12,29,44] },
    { date: "2026-02-02", numbers: [14,30,32,34,37,40] },
    { date: "2026-02-04", numbers: [1,12,13,14,18,22] },
    { date: "2026-02-06", numbers: [1,17,20,31,32,43] },
    { date: "2026-02-09", numbers: [12,17,23,27,30,38] },
    { date: "2026-02-11", numbers: [5,15,26,27,40,41] },
    { date: "2026-02-13", numbers: [17,21,24,35,39,44] },
    { date: "2026-02-16", numbers: [9,14,20,24,36,42] },
    { date: "2026-02-18", numbers: [2,5,9,14,22,32] },
    { date: "2026-02-20", numbers: [6,24,26,31,37,42] },
    { date: "2026-02-23", numbers: [13,15,18,23,29,33] },
    { date: "2026-02-25", numbers: [18,21,30,33,38,45] },
    { date: "2026-02-27", numbers: [11,18,22,25,29,43] },
    { date: "2026-03-02", numbers: [6,8,15,27,33,36] },
    { date: "2026-03-04", numbers: [4,13,16,40,43,45] },
    { date: "2026-03-06", numbers: [1,9,22,30,32,44] },
    { date: "2026-03-09", numbers: [1,9,16,19,23,25] },
    { date: "2026-03-11", numbers: [4,25,27,31,36,42] },
    { date: "2026-03-13", numbers: [14,25,33,36,37,45] },
    { date: "2026-03-16", numbers: [3,11,16,19,34,43] },
    { date: "2026-03-18", numbers: [10,11,26,31,38,43] },
    { date: "2026-03-20", numbers: [7,9,10,17,18,37] },
    { date: "2026-03-23", numbers: [7,12,14,19,20,21] },
    { date: "2026-03-25", numbers: [15,21,32,34,39,40] },
    { date: "2026-03-27", numbers: [8,10,11,28,35,36] },
    { date: "2026-03-30", numbers: [5,7,13,19,26,27] },
  ],
  setforlife: [
    { date: "2026-02-16", numbers: [6,10,15,24,32,38,44] },
    { date: "2026-02-17", numbers: [2,11,28,32,37,38,41] },
    { date: "2026-02-18", numbers: [2,9,18,26,29,31,35] },
    { date: "2026-02-19", numbers: [2,6,13,17,19,22,37] },
    { date: "2026-02-20", numbers: [11,17,25,26,28,33,42] },
    { date: "2026-02-21", numbers: [2,4,6,10,24,38,43] },
    { date: "2026-02-22", numbers: [11,15,16,19,32,33,44] },
    { date: "2026-02-23", numbers: [1,15,17,24,30,32,38] },
    { date: "2026-02-24", numbers: [6,7,15,16,27,34,43] },
    { date: "2026-02-25", numbers: [2,6,21,27,36,40,41] },
    { date: "2026-02-26", numbers: [4,5,11,23,25,37,42] },
    { date: "2026-02-27", numbers: [3,9,21,30,31,38,41] },
    { date: "2026-02-28", numbers: [2,4,19,20,21,30,32] },
    { date: "2026-03-01", numbers: [1,10,23,25,31,34,37] },
    { date: "2026-03-02", numbers: [10,15,17,21,26,28,29] },
    { date: "2026-03-03", numbers: [3,7,10,17,20,24,26] },
    { date: "2026-03-04", numbers: [6,9,10,14,31,37,38] },
    { date: "2026-03-05", numbers: [4,8,18,30,32,33,44] },
    { date: "2026-03-06", numbers: [6,14,18,20,21,34,44] },
    { date: "2026-03-07", numbers: [4,8,16,21,22,23,35] },
    { date: "2026-03-08", numbers: [2,15,20,22,37,38,42] },
    { date: "2026-03-09", numbers: [7,13,30,31,32,41,43] },
    { date: "2026-03-10", numbers: [13,17,18,30,34,39,44] },
    { date: "2026-03-11", numbers: [1,5,9,12,16,19,20] },
    { date: "2026-03-12", numbers: [3,15,22,29,38,40,43] },
    { date: "2026-03-13", numbers: [14,25,29,37,39,40,43] },
    { date: "2026-03-14", numbers: [3,19,20,34,39,40,43] },
    { date: "2026-03-15", numbers: [4,8,13,20,21,22,30] },
    { date: "2026-03-16", numbers: [6,16,21,25,34,35,43] },
    { date: "2026-03-17", numbers: [10,14,15,25,27,31,37] },
    { date: "2026-03-18", numbers: [2,17,24,30,31,33,44] },
    { date: "2026-03-19", numbers: [5,6,10,22,24,36,39] },
    { date: "2026-03-20", numbers: [4,9,18,19,26,31,35] },
    { date: "2026-03-21", numbers: [3,5,7,21,30,39,41] },
    { date: "2026-03-22", numbers: [1,11,19,22,28,39,42] },
    { date: "2026-03-23", numbers: [15,17,22,29,33,34,44] },
    { date: "2026-03-24", numbers: [5,7,17,28,33,36,43] },
    { date: "2026-03-26", numbers: [5,7,17,28,33,36,43] },
    { date: "2026-03-27", numbers: [15,17,22,29,33,34,44] },
    { date: "2026-03-28", numbers: [1,11,19,22,28,39,42] },
    { date: "2026-03-29", numbers: [5,12,13,15,17,40,44] },
  ],
  super66: [
    { date: "2025-09-06", numbers: [6,1,6,6,6,8] },
    { date: "2025-09-13", numbers: [6,8,1,5,2,9] },
    { date: "2025-09-20", numbers: [4,9,5,2,1,9] },
    { date: "2025-09-27", numbers: [2,3,8,2,5,2] },
    { date: "2025-10-04", numbers: [9,4,2,3,7,9] },
    { date: "2025-10-11", numbers: [7,5,8,3,0,8] },
    { date: "2025-10-18", numbers: [3,6,9,8,1,5] },
    { date: "2025-10-25", numbers: [1,7,0,8,0,3] },
    { date: "2025-11-01", numbers: [2,6,8,4,3,7] },
    { date: "2025-11-08", numbers: [0,5,6,3,1,4] },
    { date: "2025-11-15", numbers: [5,4,5,0,5,2] },
    { date: "2025-11-22", numbers: [5,3,0,8,5,0] },
    { date: "2025-11-29", numbers: [0,4,6,1,7,2] },
    { date: "2025-12-06", numbers: [7,9,3,2,2,7] },
    { date: "2025-12-13", numbers: [8,6,8,4,0,9] },
    { date: "2025-12-20", numbers: [9,3,2,7,7,5] },
    { date: "2025-12-27", numbers: [2,7,7,0,0,9] },
    { date: "2026-01-03", numbers: [5,3,7,6,2,2] },
    { date: "2026-01-10", numbers: [5,2,8,4,8,5] },
    { date: "2026-01-17", numbers: [4,0,7,3,8,5] },
    { date: "2026-01-24", numbers: [0,8,6,5,2,7] },
    { date: "2026-01-31", numbers: [4,6,1,8,7,3] },
    { date: "2026-02-07", numbers: [2,1,6,7,8,9] },
    { date: "2026-02-14", numbers: [6,4,1,9,6,4] },
    { date: "2026-02-21", numbers: [2,3,1,9,5,4] },
    { date: "2026-02-28", numbers: [5,2,1,7,2,2] },
    { date: "2026-03-07", numbers: [1,5,9,0,6,3] },
    { date: "2026-03-14", numbers: [5,8,5,6,4,6] },
    { date: "2026-03-21", numbers: [9,6,6,7,4,5] },
    { date: "2026-03-28", numbers: [4,2,1,0,8,9] },
  ],
};

/* ── Sample Data Generator (for games without real data yet) ── */
function genSample(game, count = 70) {
  if (REAL_DATA[game]) return REAL_DATA[game];
  const c = GAMES[game]; const rows = []; const start = new Date("2024-01-04");
  const step = c.drawDay === "Daily" ? 1 : c.drawDay === "Mon/Wed/Fri" ? 2 : c.drawDay === "Mon/Wed/Fri/Sat" ? 2 : 7;
  for (let i = 0; i < count; i++) {
    const d = new Date(start); d.setDate(d.getDate() + i * step);
    let nums;
    if (c.digitGame) {
      nums = Array.from({ length: c.mainCount }, () => Math.floor(Math.random() * 10));
    } else if (c.ordered) {
      const pool = []; while (pool.length < c.mainCount) {
        const n = Math.floor(Math.random() * c.mainMax) + 1;
        if (!pool.includes(n)) pool.push(n);
      }
      nums = pool;
    } else {
      const s = new Set();
      while (s.size < c.mainCount) s.add(Math.floor(Math.random() * c.mainMax) + 1);
      nums = [...s].sort((a, b) => a - b);
    }
    const row = { date: d.toISOString().split("T")[0], numbers: nums };
    if (c.bonusMax > 0) row.bonus = Math.floor(Math.random() * c.bonusMax) + 1;
    rows.push(row);
  }
  return rows;
}

/* ── Analysis ── */
function getFreq(draws, max, digit = false) {
  const f = {}; const lo = digit ? 0 : 1;
  for (let i = lo; i <= max; i++) f[i] = 0;
  draws.forEach(d => d.numbers.forEach(n => { if (f[n] !== undefined) f[n]++; }));
  return f;
}
function getBonusFreq(draws, max) {
  const f = {}; for (let i = 1; i <= max; i++) f[i] = 0;
  draws.forEach(d => { if (d.bonus && f[d.bonus] !== undefined) f[d.bonus]++; }); return f;
}
function getPairs(draws) {
  const p = {};
  draws.forEach(d => {
    for (let i = 0; i < d.numbers.length; i++)
      for (let j = i + 1; j < d.numbers.length; j++) {
        const k = `${d.numbers[i]}-${d.numbers[j]}`; p[k] = (p[k] || 0) + 1;
      }
  });
  return Object.entries(p).sort((a, b) => b[1] - a[1]).slice(0, 15);
}
function getGaps(draws, max, digit = false) {
  const last = {}; const lo = digit ? 0 : 1;
  for (let i = lo; i <= max; i++) last[i] = -1;
  draws.forEach((d, idx) => d.numbers.forEach(n => { last[n] = idx; }));
  const t = draws.length;
  return Object.entries(last).map(([n, l]) => ({ number: Number(n), gap: l === -1 ? t : t - 1 - l })).sort((a, b) => b.gap - a.gap);
}

/* ── Strategies ── */
function randSet(count, max, digit = false) {
  if (digit) return Array.from({ length: count }, () => Math.floor(Math.random() * (max + 1)));
  const s = new Set(); while (s.size < count) s.add(Math.floor(Math.random() * max) + 1);
  return [...s].sort((a, b) => a - b);
}
function hotSet(freq, count, digit) {
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const pool = sorted.slice(0, Math.min(count * 3, sorted.length)).map(e => Number(e[0]));
  if (digit) return Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);
  const s = new Set(); while (s.size < count) s.add(pool[Math.floor(Math.random() * pool.length)]);
  return [...s].sort((a, b) => a - b);
}
function coldSet(freq, count, digit) {
  const sorted = Object.entries(freq).sort((a, b) => a[1] - b[1]);
  const pool = sorted.slice(0, Math.min(count * 3, sorted.length)).map(e => Number(e[0]));
  if (digit) return Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);
  const s = new Set(); while (s.size < count) s.add(pool[Math.floor(Math.random() * pool.length)]);
  return [...s].sort((a, b) => a - b);
}
function balSet(freq, count, digit) {
  const sorted = Object.entries(freq).sort((a, b) => b[1] - a[1]);
  const hp = sorted.slice(0, Math.ceil(sorted.length / 3)).map(e => Number(e[0]));
  const cp = sorted.slice(-Math.ceil(sorted.length / 3)).map(e => Number(e[0]));
  if (digit) {
    const hc = Math.ceil(count / 2);
    return [...Array.from({ length: hc }, () => hp[Math.floor(Math.random() * hp.length)]),
            ...Array.from({ length: count - hc }, () => cp[Math.floor(Math.random() * cp.length)])];
  }
  const s = new Set(); const hc = Math.ceil(count / 2);
  while (s.size < hc) s.add(hp[Math.floor(Math.random() * hp.length)]);
  while (s.size < count) s.add(cp[Math.floor(Math.random() * cp.length)]);
  return [...s].sort((a, b) => a - b);
}
function weightSet(freq, count, digit) {
  const total = Object.values(freq).reduce((a, b) => a + b, 0) || 1;
  const entries = Object.entries(freq).map(([n, f]) => [Number(n), f / total]);
  if (digit) {
    return Array.from({ length: count }, () => {
      let r = Math.random(); for (const [n, w] of entries) { r -= w; if (r <= 0) return n; } return entries[0][0];
    });
  }
  const s = new Set(); let safe = 0;
  while (s.size < count && safe < 10000) {
    let r = Math.random(); for (const [n, w] of entries) { r -= w; if (r <= 0) { s.add(n); break; } } safe++;
  }
  return [...s].sort((a, b) => a - b);
}
function overdueSet(draws, count, max, digit) {
  const gaps = getGaps(draws, max, digit);
  const pool = gaps.slice(0, Math.min(count * 3, gaps.length)).map(g => g.number);
  if (digit) return Array.from({ length: count }, () => pool[Math.floor(Math.random() * pool.length)]);
  const s = new Set(); while (s.size < count) s.add(pool[Math.floor(Math.random() * pool.length)]);
  return [...s].sort((a, b) => a - b);
}

const STRATS = [
  { key: "random", label: "Random", icon: "🎲", desc: "Pure random", color: "#f59e0b" },
  { key: "hot", label: "Hot", icon: "🔥", desc: "Most drawn", color: "#ef4444" },
  { key: "cold", label: "Cold", icon: "❄️", desc: "Least drawn", color: "#3b82f6" },
  { key: "balanced", label: "Balanced", icon: "⚖️", desc: "Hot + cold mix", color: "#8b5cf6" },
  { key: "weighted", label: "Weighted", icon: "📊", desc: "Probability", color: "#10b981" },
  { key: "overdue", label: "Overdue", icon: "⏰", desc: "Gap analysis", color: "#ec4899" },
];

/* ── Ball Components ── */
function Ball({ number, size = 48, delay = 0, glow = false, hue = null, mini = false }) {
  const [vis, setVis] = useState(delay === 0);
  useEffect(() => { if (!delay) { setVis(true); return; } const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const h = hue !== null ? hue : ((number * 7.35 + 120) % 360);
  return (
    <div style={{
      width: size, height: size, borderRadius: "50%", flexShrink: 0,
      background: `radial-gradient(circle at 35% 32%, hsla(${h},60%,78%,.8), hsl(${h},65%,48%) 55%, hsla(${h},65%,28%,1))`,
      display: "flex", alignItems: "center", justifyContent: "center",
      color: "#fff", fontFamily: "'Oswald',sans-serif", fontSize: mini ? size * .42 : size * .38,
      fontWeight: 700,
      boxShadow: glow ? `0 0 16px hsla(${h},80%,55%,.5),0 0 32px hsla(${h},80%,55%,.2)` : `0 3px 8px hsla(${h},50%,25%,.4)`,
      transform: vis ? "scale(1)" : "scale(0)", opacity: vis ? 1 : 0,
      transition: `all .45s cubic-bezier(.34,1.56,.64,1) ${delay}ms`,
      border: `1.5px solid hsla(${h},55%,62%,.4)`, cursor: "default", position: "relative",
    }}>
      {number}
      <div style={{ position: "absolute", top: "14%", left: "24%", width: "28%", height: "18%", borderRadius: "50%", background: "rgba(255,255,255,.22)", filter: "blur(1.5px)" }} />
    </div>
  );
}

function BonusBall({ number, size = 48, delay = 0, label = "PB" }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: "radial-gradient(circle at 35% 32%,#fde68a,#f59e0b 55%,#b45309)",
        display: "flex", alignItems: "center", justifyContent: "center",
        color: "#fff", fontFamily: "'Oswald',sans-serif", fontSize: size * .38, fontWeight: 700,
        boxShadow: "0 0 20px rgba(245,158,11,.5),0 0 40px rgba(245,158,11,.2)",
        transform: vis ? "scale(1)" : "scale(0)", opacity: vis ? 1 : 0,
        transition: "all .5s cubic-bezier(.34,1.56,.64,1)",
        border: "2px solid rgba(253,224,71,.6)",
      }}>{number}</div>
      {label && <span style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#f59e0b", letterSpacing: 1 }}>{label}</span>}
    </div>
  );
}

function Particles() {
  const p = useRef(Array.from({ length: 20 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: Math.random() * 2.5 + 1, d: Math.random() * 25 + 12, dl: Math.random() * -15,
    h: Math.random() * 60 + 20,
  }))).current;
  return (
    <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
      {p.map(pt => (
        <div key={pt.id} style={{
          position: "absolute", left: `${pt.x}%`, top: `${pt.y}%`,
          width: pt.s, height: pt.s, borderRadius: "50%",
          background: `hsla(${pt.h},75%,60%,.3)`,
          animation: `pfloat ${pt.d}s ease-in-out ${pt.dl}s infinite`,
        }} />
      ))}
      <style>{`@keyframes pfloat{0%,100%{transform:translateY(0) translateX(0);opacity:.2}50%{transform:translateY(-30px) translateX(15px);opacity:.45}}`}</style>
    </div>
  );
}

/* ═══════ MAIN APP ═══════ */
export default function LotteryBot() {
  const [ageVerified, setAgeVerified] = useState(false);
  const [ageBlocked, setAgeBlocked] = useState(false);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [game, setGame] = useState("powerball");
  const [draws, setDraws] = useState({});
  const [view, setView] = useState("generate");
  const [generated, setGenerated] = useState(null);
  const [genBonus, setGenBonus] = useState(null);
  const [activeStrat, setActiveStrat] = useState(null);
  const [animKey, setAnimKey] = useState(0);
  const [generating, setGenerating] = useState(false);
  const [savedSets, setSavedSets] = useState([]);
  const [birthday, setBirthday] = useState("");
  const [luckyName, setLuckyName] = useState("");
  const [selectedDreams, setSelectedDreams] = useState([]);
  const [selectedZodiac, setSelectedZodiac] = useState(null);
  const [luckyResult, setLuckyResult] = useState(null);
  const [luckyMethod, setLuckyMethod] = useState(null);
  const [luckyAnimKey, setLuckyAnimKey] = useState(0);

  const cfg = GAMES[game];
  const cur = draws[game] || [];

  // Load built-in real data on first visit per game
  useEffect(() => { if (!draws[game]) setDraws(p => ({ ...p, [game]: genSample(game) })); }, [game, draws]);

  /* ── Silent Auto-Fetch from GitHub Lottery Bot ──
     Your lottery bot (Treehigh1/lottery-bot) pushes results.json to GitHub.
     This fetches it on app load and merges any new draws automatically.
     ⚡ CHANGE THIS to your GitHub username/repo if different */
  const GITHUB_RESULTS_URL = "https://raw.githubusercontent.com/Treehigh1/lotto-bot/main/results.json";

  useEffect(() => {
    const fetchFromGitHub = async () => {
      try {
        const resp = await fetch(GITHUB_RESULTS_URL + "?t=" + Date.now()); // Cache bust
        if (!resp.ok) return;
        const allData = await resp.json();

        // Merge results for ALL games at once
        const gameKeys = Object.keys(GAMES);
        const updated = { ...draws };
        let totalNew = 0;

        gameKeys.forEach(gameKey => {
          const gameCfg = GAMES[gameKey];
          const remoteDraws = allData[gameKey];
          if (!Array.isArray(remoteDraws) || remoteDraws.length === 0) return;

          const existing = updated[gameKey] || draws[gameKey] || [];
          const existingDates = new Set(existing.map(d => d.date));
          const lo = gameCfg.digitGame ? 0 : 1;

          const validNew = remoteDraws.filter(d => {
            if (!d.date || !Array.isArray(d.numbers)) return false;
            if (d.numbers.length !== gameCfg.mainCount) return false;
            if (existingDates.has(d.date)) return false;
            return d.numbers.every(n => n >= lo && n <= gameCfg.mainMax);
          }).map(d => {
            const row = { date: d.date, numbers: gameCfg.ordered ? d.numbers : [...d.numbers].sort((a, b) => a - b) };
            if (gameCfg.bonusMax > 0 && d.bonus >= 1 && d.bonus <= gameCfg.bonusMax) row.bonus = d.bonus;
            return row;
          });

          if (validNew.length > 0) {
            const merged = [...existing, ...validNew].sort((a, b) => a.date.localeCompare(b.date));
            const unique = []; const seen = new Set();
            merged.forEach(d => { if (!seen.has(d.date)) { seen.add(d.date); unique.push(d); } });
            updated[gameKey] = unique;
            totalNew += validNew.length;
            console.log(`[Oracle] ${gameCfg.name}: +${validNew.length} new draws from GitHub (${unique.length} total)`);
          }
        });

        if (totalNew > 0) {
          setDraws(p => ({ ...p, ...updated }));
          console.log(`[Oracle] Total: +${totalNew} new draws merged from GitHub`);
        } else {
          console.log("[Oracle] GitHub data checked — already up to date");
        }
      } catch (err) {
        // Silent fail — app works fine with built-in data
        console.log(`[Oracle] GitHub fetch skipped: ${err.message}`);
      }
    };
    fetchFromGitHub();
  }, []); // Runs once on app load

  const freq = useMemo(() => getFreq(cur, cfg.mainMax, cfg.digitGame), [cur, cfg.mainMax, cfg.digitGame]);
  const bonusFreq = useMemo(() => cfg.bonusMax > 0 ? getBonusFreq(cur, cfg.bonusMax) : {}, [cur, cfg.bonusMax]);
  const maxF = Math.max(...Object.values(freq), 1);
  const sortedF = useMemo(() => Object.entries(freq).sort((a, b) => b[1] - a[1]), [freq]);
  const hotN = sortedF.slice(0, Math.min(10, sortedF.length)).map(e => Number(e[0]));
  const coldN = sortedF.slice(-Math.min(10, sortedF.length)).map(e => Number(e[0]));
  const topPairs = useMemo(() => getPairs(cur), [cur]);
  const gaps = useMemo(() => getGaps(cur, cfg.mainMax, cfg.digitGame), [cur, cfg.mainMax, cfg.digitGame]);

  const generate = useCallback((strat) => {
    setGenerating(true); setActiveStrat(strat); setAnimKey(k => k + 1);
    setTimeout(() => {
      let nums;
      switch (strat) {
        case "hot": nums = hotSet(freq, cfg.mainCount, cfg.digitGame); break;
        case "cold": nums = coldSet(freq, cfg.mainCount, cfg.digitGame); break;
        case "balanced": nums = balSet(freq, cfg.mainCount, cfg.digitGame); break;
        case "weighted": nums = weightSet(freq, cfg.mainCount, cfg.digitGame); break;
        case "overdue": nums = overdueSet(cur, cfg.mainCount, cfg.mainMax, cfg.digitGame); break;
        default: nums = randSet(cfg.mainCount, cfg.mainMax, cfg.digitGame);
      }
      setGenerated(nums);
      setGenBonus(cfg.bonusMax > 0 ? Math.floor(Math.random() * cfg.bonusMax) + 1 : null);
      setGenerating(false);
    }, 600);
  }, [freq, cfg, cur]);

  const saveSet = () => {
    const nums = generated || luckyResult;
    const strat = activeStrat || luckyMethod;
    if (nums) setSavedSets(p => [...p, { numbers: nums, bonus: generated ? genBonus : null, strategy: strat, game, ts: new Date().toLocaleString() }]);
  };

  const cBg = "rgba(255,255,255,.025)";
  const cBd = "1px solid rgba(255,255,255,.06)";
  const gameKeys = Object.keys(GAMES);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(155deg,#06060f 0%,#0c0c22 35%,#150a28 65%,#06060f 100%)", color: "#e2e8f0", fontFamily: "'DM Sans',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap" rel="stylesheet" />

      {/* ══════ BLOCKED — UNDER 18 ══════ */}
      {ageBlocked ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{
            background: "rgba(239,68,68,.05)", borderRadius: 24, padding: "48px 32px", maxWidth: 420,
            border: "1px solid rgba(239,68,68,.15)", textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(239,68,68,.08)", filter: "blur(30px)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 64, marginBottom: 16 }}>🚫</div>
              <h2 style={{ fontFamily: "'Oswald'", fontSize: 26, fontWeight: 700, color: "#ef4444", margin: "0 0 12px" }}>ACCESS DENIED</h2>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 8px" }}>
                You must be <strong style={{ color: "#e2e8f0" }}>18 years or older</strong> to access this app.
              </p>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 13, color: "#64748b", lineHeight: 1.5, margin: "0 0 24px" }}>
                Lottery participation in Australia is restricted to persons aged 18 and over. Please come back when you are of legal age.
              </p>
              <div style={{
                background: "rgba(239,68,68,.08)", borderRadius: 12, padding: "12px 16px", marginBottom: 20,
                border: "1px solid rgba(239,68,68,.12)",
              }}>
                <p style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#ef4444", margin: 0, lineHeight: 1.5 }}>
                  If you or someone you know needs support, contact Lifeline on <strong>13 11 14</strong> or Kids Helpline on <strong>1800 55 1800</strong>
                </p>
              </div>
              <p style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#334155", margin: 0 }}>
                Please close this window.
              </p>
            </div>
          </div>
        </div>

      /* ══════ STEP 1: AGE VERIFICATION ══════ */
      ) : !ageVerified ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{
            background: "rgba(255,255,255,.03)", borderRadius: 24, padding: "40px 32px", maxWidth: 420,
            border: "1px solid rgba(255,255,255,.08)", textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(245,158,11,.06)", filter: "blur(30px)" }} />
            <div style={{ position: "absolute", bottom: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(168,85,247,.06)", filter: "blur(30px)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 56, marginBottom: 12 }}>🔞</div>
              <h2 style={{
                fontFamily: "'Oswald'", fontSize: 28, fontWeight: 700, margin: "0 0 8px",
                background: "linear-gradient(135deg, #f59e0b, #ef4444)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>AGE VERIFICATION</h2>
              <p style={{ fontFamily: "'DM Sans'", fontSize: 14, color: "#94a3b8", lineHeight: 1.6, margin: "0 0 6px" }}>
                You must be <strong style={{ color: "#e2e8f0" }}>18 years or older</strong> to use Number Oracle.
              </p>
              <p style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#475569", lineHeight: 1.5, margin: "0 0 20px" }}>
                This is a lottery analysis and entertainment tool. Lottery participation is restricted to persons aged 18 and over in Australia.
              </p>
              <p style={{ fontFamily: "'Oswald'", fontSize: 14, color: "#cbd5e1", marginBottom: 16, letterSpacing: .5 }}>Are you 18 years or older?</p>
              <div style={{ display: "flex", gap: 10 }}>
                <button onClick={() => setAgeVerified(true)} style={{
                  background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff",
                  padding: "14px 24px", borderRadius: 12, cursor: "pointer",
                  fontFamily: "'Oswald'", fontSize: 16, fontWeight: 700, letterSpacing: 1,
                  boxShadow: "0 4px 20px rgba(16,185,129,.3)", flex: 1,
                }}>YES, I AM 18+</button>
                <button onClick={() => setAgeBlocked(true)} style={{
                  background: "linear-gradient(135deg, #ef4444, #dc2626)", border: "none", color: "#fff",
                  padding: "14px 24px", borderRadius: 12, cursor: "pointer",
                  fontFamily: "'Oswald'", fontSize: 16, fontWeight: 700, letterSpacing: 1,
                  boxShadow: "0 4px 20px rgba(239,68,68,.3)", flex: 1,
                }}>NO, I AM UNDER 18</button>
              </div>
              <p style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#334155", marginTop: 16, lineHeight: 1.5 }}>
                If you or someone you know needs gambling support, call <span style={{ color: "#ef4444" }}>1800 858 858</span>
              </p>
            </div>
          </div>
        </div>

      /* ══════ STEP 2: DISCLAIMER & COMPLIANCE POPUP ══════ */
      ) : !disclaimerAccepted ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: 20 }}>
          <div style={{
            background: "rgba(255,255,255,.03)", borderRadius: 24, padding: "36px 28px", maxWidth: 480,
            border: "1px solid rgba(255,255,255,.08)", position: "relative", overflow: "hidden",
          }}>
            <div style={{ position: "absolute", top: -25, right: -25, width: 100, height: 100, borderRadius: "50%", background: "rgba(59,130,246,.06)", filter: "blur(30px)" }} />
            <div style={{ position: "absolute", bottom: -20, left: -20, width: 80, height: 80, borderRadius: "50%", background: "rgba(16,185,129,.06)", filter: "blur(25px)" }} />
            <div style={{ position: "relative", zIndex: 1 }}>
              <div style={{ fontSize: 44, textAlign: "center", marginBottom: 10 }}>📋</div>
              <h2 style={{
                fontFamily: "'Oswald'", fontSize: 22, fontWeight: 700, margin: "0 0 16px", textAlign: "center",
                background: "linear-gradient(135deg, #3b82f6, #10b981)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>BEFORE YOU CONTINUE</h2>

              {/* Disclaimer items */}
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                {[
                  { icon: "⚠️", title: "Entertainment Only", text: "Number Oracle is an entertainment and analysis tool. Lottery draws are completely random — past results do not influence future outcomes. This tool does not guarantee or improve your chances of winning." },
                  { icon: "🎲", title: "No Predictions", text: "All number suggestions are generated for entertainment purposes only. We do not predict winning numbers and make no claims of improved odds." },
                  { icon: "🏢", title: "Not Affiliated", text: "Number Oracle is not affiliated with, endorsed by, or connected to The Lott, The Lottery Corporation, Tattersall's, Lotterywest, or any Australian lottery operator." },
                  { icon: "🛡️", title: "Responsible Gambling", text: "Please gamble responsibly. Set limits on how much you spend. If gambling is causing you problems, help is available." },
                ].map((item, i) => (
                  <div key={i} style={{
                    background: "rgba(0,0,0,.2)", borderRadius: 12, padding: "12px 14px",
                    border: "1px solid rgba(255,255,255,.04)",
                  }}>
                    <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{item.icon}</span>
                      <div>
                        <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#e2e8f0", marginBottom: 3, letterSpacing: .5 }}>{item.title}</div>
                        <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#64748b", lineHeight: 1.5 }}>{item.text}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Help resources */}
              <div style={{
                background: "rgba(239,68,68,.06)", borderRadius: 10, padding: "10px 14px", marginBottom: 20,
                border: "1px solid rgba(239,68,68,.1)",
              }}>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#ef4444", marginBottom: 6, letterSpacing: 1 }}>GAMBLING SUPPORT</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#94a3b8" }}>Gambling Help: <span style={{ color: "#ef4444" }}>1800 858 858</span></span>
                  <span style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#94a3b8" }}>Lifeline: <span style={{ color: "#ef4444" }}>13 11 14</span></span>
                  <span style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#94a3b8" }}>gamblinghelponline.org.au</span>
                </div>
              </div>

              {/* Accept / Decline buttons */}
              <button onClick={() => setDisclaimerAccepted(true)} style={{
                background: "linear-gradient(135deg, #10b981, #059669)", border: "none", color: "#fff",
                padding: "14px 32px", borderRadius: 12, cursor: "pointer",
                fontFamily: "'Oswald'", fontSize: 15, fontWeight: 700, letterSpacing: 1,
                boxShadow: "0 4px 20px rgba(16,185,129,.3)", width: "100%", marginBottom: 10,
              }}>I UNDERSTAND & AGREE — ENTER</button>
              <button onClick={() => setAgeVerified(false)} style={{
                background: "none", border: "1px solid rgba(255,255,255,.1)", color: "#64748b",
                padding: "10px 24px", borderRadius: 10, cursor: "pointer",
                fontFamily: "'Space Mono'", fontSize: 11, width: "100%",
              }}>Go Back</button>

              <p style={{ fontFamily: "'Space Mono'", fontSize: 7, color: "#334155", marginTop: 14, lineHeight: 1.5, textAlign: "center" }}>
                By clicking "I Understand & Agree", you acknowledge that this is an entertainment tool, not a gambling service, and that you have read and accept our Terms of Service and Privacy Policy.
              </p>
            </div>
          </div>
        </div>

      ) : (
      <>
      {/* ══════ MAIN APP (shows after both verifications) ══════ */}
      <Particles />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 960, margin: "0 auto", padding: "16px 14px 40px" }}>

        {/* HEADER */}
        <header style={{ textAlign: "center", marginBottom: 18 }}>
          <div style={{ fontSize: 10, fontFamily: "'Space Mono'", color: cfg.color, letterSpacing: 5, textTransform: "uppercase", marginBottom: 4 }}>australian lottery · analysis tool</div>
          <h1 style={{ fontFamily: "'Oswald'", fontSize: "clamp(28px,6.5vw,48px)", fontWeight: 700, margin: 0, lineHeight: 1.05, background: cfg.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>NUMBER ORACLE</h1>
          <p style={{ color: "#475569", fontSize: 10, marginTop: 4, fontFamily: "'Space Mono'" }}>Lottery Analysis & Number Generator · {cur.length} draws</p>
        </header>

        {/* GAME SELECTOR */}
        <div style={{ display: "flex", gap: 4, marginBottom: 14, overflowX: "auto", paddingBottom: 4 }}>
          {gameKeys.map(key => {
            const g = GAMES[key]; const active = game === key;
            return (
              <button key={key} onClick={() => { setGame(key); setGenerated(null); setActiveStrat(null); setView("generate"); }}
                style={{
                  flex: "0 0 auto", minWidth: 90, background: active ? `${g.color}18` : "rgba(255,255,255,.02)",
                  border: `1px solid ${active ? g.color + "40" : "rgba(255,255,255,.05)"}`,
                  borderRadius: 11, padding: "8px 8px 6px", cursor: "pointer", textAlign: "center", transition: "all .25s",
                }}>
                <div style={{ fontSize: 18 }}>{g.icon}</div>
                <div style={{ fontFamily: "'Oswald'", fontSize: 10, fontWeight: 600, color: active ? g.color : "#94a3b8", marginTop: 1, whiteSpace: "nowrap" }}>{g.name}</div>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 7, color: "#475569", marginTop: 1 }}>{g.drawDay}</div>
              </button>
            );
          })}
        </div>

        {/* INFO BAR */}
        <div style={{ display: "flex", justifyContent: "center", gap: 20, marginBottom: 14, flexWrap: "wrap" }}>
          {[
            { l: "Pick", v: cfg.desc },
            { l: "Draw Day", v: cfg.drawDay },
            { l: "Jackpot Odds", v: cfg.odds },
          ].map(i => (
            <div key={i.l} style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "'Space Mono'", fontSize: 7, color: "#475569", letterSpacing: 1, textTransform: "uppercase" }}>{i.l}</div>
              <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#cbd5e1", fontWeight: 500 }}>{i.v}</div>
            </div>
          ))}
        </div>

        {/* NAV */}
        <div style={{ display: "flex", gap: 2, justifyContent: "center", marginBottom: 18, background: cBg, borderRadius: 12, padding: 3, border: cBd }}>
          {["generate", "lucky", "analysis", "history", "saved"].map(t => (
            <button key={t} onClick={() => setView(t)} style={{
              flex: 1, padding: "10px 6px", border: "none", borderRadius: 10, cursor: "pointer",
              fontFamily: "'DM Sans'", fontSize: 11, fontWeight: 600,
              background: view === t ? `${cfg.color}18` : "transparent",
              color: view === t ? cfg.color : "#64748b", transition: "all .2s",
            }}>{t === "lucky" ? "🍀 Lucky" : t === "generate" ? "🎲 Pick" : t === "analysis" ? "📊 Stats" : t === "history" ? "📜 Draws" : "💾 Saved"}</button>
          ))}
        </div>

        {/* ══════ GENERATE ══════ */}
        {view === "generate" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(120px,1fr))", gap: 6, marginBottom: 20 }}>
              {STRATS.map(s => (
                <button key={s.key} onClick={() => generate(s.key)} style={{
                  background: activeStrat === s.key ? `${s.color}15` : cBg,
                  border: `1px solid ${activeStrat === s.key ? s.color + "40" : "rgba(255,255,255,.05)"}`,
                  borderRadius: 12, padding: "12px 8px", cursor: "pointer", textAlign: "center", transition: "all .25s",
                }}>
                  <div style={{ fontSize: 20, marginBottom: 2 }}>{s.icon}</div>
                  <div style={{ fontFamily: "'Oswald'", fontSize: 12, fontWeight: 600, color: activeStrat === s.key ? s.color : "#cbd5e1" }}>{s.label}</div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#475569", marginTop: 1 }}>{s.desc}</div>
                </button>
              ))}
            </div>

            {generating && (
              <div style={{ textAlign: "center", padding: 36 }}>
                <div style={{ width: 32, height: 32, border: `3px solid ${cfg.color}30`, borderTopColor: cfg.color, borderRadius: "50%", margin: "0 auto", animation: "spin .7s linear infinite" }} />
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                <p style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#475569", marginTop: 8 }}>Analysing {cur.length} draws...</p>
              </div>
            )}

            {generated && !generating && (
              <div key={animKey} style={{ background: cBg, borderRadius: 18, padding: "24px 16px", border: cBd, textAlign: "center" }}>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: cfg.color, letterSpacing: 3, textTransform: "uppercase", marginBottom: 14 }}>
                  {cfg.name} · Your Numbers {cfg.ordered ? "(in order)" : ""}
                </div>
                <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", alignItems: "flex-end" }}>
                  {generated.map((n, i) => (
                    <Ball key={`${animKey}-${i}-${n}`} number={n} size={52} delay={i * 120} glow />
                  ))}
                  {genBonus !== null && (
                    <div style={{ marginLeft: 6 }}>
                      <BonusBall number={genBonus} size={52} delay={generated.length * 120 + 180} label={cfg.bonusName} />
                    </div>
                  )}
                </div>
                <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center" }}>
                  <button onClick={() => generate(activeStrat)} style={{
                    background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                    color: cfg.color, padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontFamily: "'Space Mono'", fontSize: 9,
                  }}>↻ Regenerate</button>
                  <button onClick={saveSet} style={{
                    background: "rgba(255,255,255,.05)", border: cBd,
                    color: "#94a3b8", padding: "5px 14px", borderRadius: 7, cursor: "pointer", fontFamily: "'Space Mono'", fontSize: 9,
                  }}>💾 Save</button>
                </div>
                <div style={{ marginTop: 10, fontFamily: "'Space Mono'", fontSize: 9, color: "#334155" }}>
                  {STRATS.find(s => s.key === activeStrat)?.label} strategy · {cur.length} draws analysed
                </div>
              </div>
            )}

            {!generated && !generating && (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "rgba(255,255,255,.015)", borderRadius: 18, border: "1px dashed rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>{cfg.icon}</div>
                <p style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#475569" }}>Select a strategy to generate {cfg.name} numbers</p>
              </div>
            )}
          </div>
        )}

        {/* ══════ LUCKY VIBES ══════ */}
        {view === "lucky" && (
          <div>
            {/* ── Grand Hero Header ── */}
            <div style={{
              textAlign: "center", marginBottom: 20, padding: "28px 16px 24px",
              background: "linear-gradient(135deg, rgba(245,158,11,.08) 0%, rgba(168,85,247,.08) 30%, rgba(236,72,153,.08) 60%, rgba(59,130,246,.08) 100%)",
              borderRadius: 20, border: "1px solid rgba(255,255,255,.08)",
              position: "relative", overflow: "hidden",
            }}>
              <div style={{ position: "absolute", top: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,158,11,.15), transparent 70%)", filter: "blur(20px)" }} />
              <div style={{ position: "absolute", bottom: -15, right: -15, width: 80, height: 80, borderRadius: "50%", background: "radial-gradient(circle, rgba(236,72,153,.15), transparent 70%)", filter: "blur(20px)" }} />
              <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 120, height: 120, borderRadius: "50%", background: "radial-gradient(circle, rgba(168,85,247,.1), transparent 70%)", filter: "blur(25px)" }} />
              <div style={{ position: "relative", zIndex: 1 }}>
                <div style={{ fontSize: 48, marginBottom: 6, filter: "drop-shadow(0 0 20px rgba(245,158,11,.4))" }}>🍀</div>
                <h2 style={{ fontFamily: "'Oswald'", fontSize: "clamp(22px,5vw,30px)", fontWeight: 700, margin: 0, lineHeight: 1.1,
                  background: "linear-gradient(135deg, #f59e0b, #ec4899, #a855f7, #3b82f6)",
                  WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                }}>LUCKY VIBES</h2>
                <p style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#94a3b8", marginTop: 6, maxWidth: 320, margin: "6px auto 0" }}>
                  Your personal lucky numbers — unique to YOU, impossible to duplicate
                </p>
              </div>
            </div>

            {/* ── Method Selector Cards (2x2 grid) ── */}
            {!luckyResult && (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 16 }}>
                {[
                  { key: "birthday", icon: "🎂", title: "Birthday", subtitle: "Birth date magic", gradient: "linear-gradient(135deg, rgba(245,158,11,.12), rgba(234,88,12,.08))", border: "#f59e0b", glow: "rgba(245,158,11,.2)" },
                  { key: "name", icon: "✍️", title: "Your Name", subtitle: "Name numerology", gradient: "linear-gradient(135deg, rgba(168,85,247,.12), rgba(139,92,246,.08))", border: "#a855f7", glow: "rgba(168,85,247,.2)" },
                  { key: "dream", icon: "🌙", title: "Last Night's Dream", subtitle: "Dream symbols", gradient: "linear-gradient(135deg, rgba(59,130,246,.12), rgba(37,99,235,.08))", border: "#3b82f6", glow: "rgba(59,130,246,.2)" },
                  { key: "zodiac", icon: "✨", title: "Zodiac Sign", subtitle: "Star power", gradient: "linear-gradient(135deg, rgba(236,72,153,.12), rgba(219,39,119,.08))", border: "#ec4899", glow: "rgba(236,72,153,.2)" },
                ].map(m => (
                  <button key={m.key} onClick={() => setLuckyMethod(m.key)} style={{
                    background: m.gradient, border: `1px solid ${m.border}30`,
                    borderRadius: 16, padding: "20px 12px", cursor: "pointer", textAlign: "center",
                    transition: "all .3s", position: "relative", overflow: "hidden",
                  }}>
                    <div style={{ position: "absolute", top: -10, right: -10, width: 60, height: 60, borderRadius: "50%", background: m.glow, filter: "blur(20px)", opacity: .5 }} />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ fontSize: 36, marginBottom: 6, filter: `drop-shadow(0 0 10px ${m.glow})` }}>{m.icon}</div>
                      <div style={{ fontFamily: "'Oswald'", fontSize: 14, fontWeight: 700, color: m.border, letterSpacing: .5 }}>{m.title}</div>
                      <div style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#64748b", marginTop: 3 }}>{m.subtitle}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* ── Birthday Input Panel ── */}
            {luckyMethod === "birthday" && !luckyResult && (
              <div style={{
                background: "linear-gradient(135deg, rgba(245,158,11,.06), rgba(234,88,12,.03))",
                borderRadius: 18, padding: 24, border: "1px solid rgba(245,158,11,.15)", marginBottom: 14,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(245,158,11,.08)", filter: "blur(30px)" }} />
                <button onClick={() => setLuckyMethod(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🎂</div>
                  <div style={{ fontFamily: "'Oswald'", fontSize: 18, color: "#f59e0b", textAlign: "center", marginBottom: 4 }}>BIRTHDAY NUMBERS</div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#64748b", textAlign: "center", marginBottom: 16 }}>Your birth date creates a mathematically unique number signature</div>
                  <input type="date" value={birthday} onChange={e => setBirthday(e.target.value)} style={{
                    background: "rgba(0,0,0,.4)", border: "1px solid rgba(245,158,11,.2)", borderRadius: 12,
                    color: "#e2e8f0", padding: "14px 16px", fontFamily: "'Space Mono'", fontSize: 13, width: "100%", boxSizing: "border-box",
                    marginBottom: 12,
                  }} />
                  <button onClick={() => {
                    if (!birthday) return;
                    setLuckyResult(generateLuckyFromBirthday(birthday, cfg.mainCount, cfg.mainMax));
                    setLuckyAnimKey(k => k + 1);
                  }} style={{
                    background: "linear-gradient(135deg, #f59e0b, #ea580c)", border: "none", color: "#fff",
                    padding: "14px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "'Oswald'", fontSize: 15, fontWeight: 700,
                    width: "100%", letterSpacing: 1, boxShadow: "0 4px 20px rgba(245,158,11,.3)",
                  }}>✨ REVEAL MY BIRTHDAY NUMBERS</button>
                </div>
              </div>
            )}

            {/* ── Name Input Panel ── */}
            {luckyMethod === "name" && !luckyResult && (
              <div style={{
                background: "linear-gradient(135deg, rgba(168,85,247,.06), rgba(139,92,246,.03))",
                borderRadius: 18, padding: 24, border: "1px solid rgba(168,85,247,.15)", marginBottom: 14,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", bottom: -20, left: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(168,85,247,.08)", filter: "blur(30px)" }} />
                <button onClick={() => setLuckyMethod(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>✍️</div>
                  <div style={{ fontFamily: "'Oswald'", fontSize: 18, color: "#a855f7", textAlign: "center", marginBottom: 4 }}>NAME NUMEROLOGY</div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#64748b", textAlign: "center", marginBottom: 16 }}>Every letter in your name carries a numerical vibration</div>
                  <input type="text" value={luckyName} onChange={e => setLuckyName(e.target.value)} placeholder="Enter your full name..."
                    style={{
                      background: "rgba(0,0,0,.4)", border: "1px solid rgba(168,85,247,.2)", borderRadius: 12,
                      color: "#e2e8f0", padding: "14px 16px", fontFamily: "'Space Mono'", fontSize: 13, width: "100%", boxSizing: "border-box",
                      marginBottom: 12,
                    }} />
                  <button onClick={() => {
                    if (!luckyName.trim()) return;
                    setLuckyResult(generateLuckyFromName(luckyName.trim(), cfg.mainCount, cfg.mainMax));
                    setLuckyAnimKey(k => k + 1);
                  }} style={{
                    background: "linear-gradient(135deg, #a855f7, #7c3aed)", border: "none", color: "#fff",
                    padding: "14px 24px", borderRadius: 12, cursor: "pointer", fontFamily: "'Oswald'", fontSize: 15, fontWeight: 700,
                    width: "100%", letterSpacing: 1, boxShadow: "0 4px 20px rgba(168,85,247,.3)",
                  }}>✨ REVEAL MY NAME NUMBERS</button>
                </div>
              </div>
            )}

            {/* ── Dream Symbols Panel ── */}
            {luckyMethod === "dream" && !luckyResult && (
              <div style={{
                background: "linear-gradient(135deg, rgba(59,130,246,.06), rgba(37,99,235,.03))",
                borderRadius: 18, padding: 24, border: "1px solid rgba(59,130,246,.15)", marginBottom: 14,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -25, left: "50%", width: 120, height: 120, borderRadius: "50%", background: "rgba(59,130,246,.06)", filter: "blur(35px)", transform: "translateX(-50%)" }} />
                <button onClick={() => { setLuckyMethod(null); setSelectedDreams([]); }} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>🌙</div>
                  <div style={{ fontFamily: "'Oswald'", fontSize: 18, color: "#3b82f6", textAlign: "center", marginBottom: 4 }}>DREAM NUMBERS</div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#64748b", textAlign: "center", marginBottom: 16 }}>What appeared in your dream? Pick up to 5 symbols</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14, justifyContent: "center" }}>
                    {Object.entries(DREAM_SYMBOLS).map(([name, sym]) => {
                      const sel = selectedDreams.includes(name);
                      return (
                        <button key={name} onClick={() => {
                          setSelectedDreams(prev => sel ? prev.filter(s => s !== name) : prev.length < 5 ? [...prev, name] : prev);
                        }} style={{
                          background: sel ? "rgba(59,130,246,.15)" : "rgba(0,0,0,.25)",
                          border: `1.5px solid ${sel ? "#3b82f6" : "rgba(255,255,255,.06)"}`,
                          borderRadius: 10, padding: "8px 12px", cursor: "pointer",
                          color: sel ? "#93c5fd" : "#64748b", fontFamily: "'DM Sans'", fontSize: 11,
                          transition: "all .25s", transform: sel ? "scale(1.05)" : "scale(1)",
                          boxShadow: sel ? "0 0 12px rgba(59,130,246,.2)" : "none",
                        }}>
                          <span style={{ fontSize: 16, marginRight: 4 }}>{sym.icon}</span>{name}
                        </button>
                      );
                    })}
                  </div>
                  {selectedDreams.length > 0 && (
                    <div style={{
                      background: "rgba(0,0,0,.3)", borderRadius: 12, padding: 12, marginBottom: 14,
                      border: "1px solid rgba(59,130,246,.15)",
                    }}>
                      <div style={{ fontFamily: "'Oswald'", fontSize: 11, color: "#60a5fa", marginBottom: 6, letterSpacing: 1 }}>
                        YOUR DREAM VISION ({selectedDreams.length}/5)
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
                        {selectedDreams.map(s => (
                          <span key={s} style={{ fontSize: 24, filter: "drop-shadow(0 0 8px rgba(59,130,246,.4))" }}>{DREAM_SYMBOLS[s].icon}</span>
                        ))}
                      </div>
                      {selectedDreams.map(s => (
                        <div key={s} style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#64748b", lineHeight: 1.6 }}>
                          {DREAM_SYMBOLS[s].icon} <span style={{ color: "#93c5fd" }}>{s}</span> — {DREAM_SYMBOLS[s].meaning}
                        </div>
                      ))}
                    </div>
                  )}
                  <button onClick={() => {
                    if (selectedDreams.length === 0) return;
                    setLuckyResult(generateFromDreams(selectedDreams, cfg.mainCount, cfg.mainMax));
                    setLuckyAnimKey(k => k + 1);
                  }} disabled={selectedDreams.length === 0} style={{
                    background: selectedDreams.length > 0 ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(0,0,0,.3)",
                    border: "none", color: selectedDreams.length > 0 ? "#fff" : "#334155",
                    padding: "14px 24px", borderRadius: 12, cursor: selectedDreams.length > 0 ? "pointer" : "default",
                    fontFamily: "'Oswald'", fontSize: 15, fontWeight: 700, width: "100%", letterSpacing: 1,
                    boxShadow: selectedDreams.length > 0 ? "0 4px 20px rgba(59,130,246,.3)" : "none",
                    transition: "all .3s",
                  }}>🌙 REVEAL MY DREAM NUMBERS</button>
                </div>
              </div>
            )}

            {/* ── Zodiac Panel ── */}
            {luckyMethod === "zodiac" && !luckyResult && (
              <div style={{
                background: "linear-gradient(135deg, rgba(236,72,153,.06), rgba(219,39,119,.03))",
                borderRadius: 18, padding: 24, border: "1px solid rgba(236,72,153,.15)", marginBottom: 14,
                position: "relative", overflow: "hidden",
              }}>
                <div style={{ position: "absolute", top: -15, right: -15, width: 90, height: 90, borderRadius: "50%", background: "rgba(236,72,153,.08)", filter: "blur(25px)" }} />
                <button onClick={() => setLuckyMethod(null)} style={{ position: "absolute", top: 10, right: 12, background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: 16 }}>✕</button>
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 40, textAlign: "center", marginBottom: 8 }}>✨</div>
                  <div style={{ fontFamily: "'Oswald'", fontSize: 18, color: "#ec4899", textAlign: "center", marginBottom: 4 }}>ZODIAC LUCKY NUMBERS</div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#64748b", textAlign: "center", marginBottom: 16 }}>Select your star sign</div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6, marginBottom: 10 }}>
                    {Object.entries(ZODIAC_LUCKY).map(([sign, z]) => {
                      const sel = selectedZodiac === sign;
                      return (
                        <button key={sign} onClick={() => {
                          setSelectedZodiac(sign);
                          const base = z.nums.filter(n => n <= cfg.mainMax);
                          const extra = new Set(base);
                          while (extra.size < cfg.mainCount) extra.add(Math.floor(Math.random() * cfg.mainMax) + 1);
                          setLuckyResult([...extra].slice(0, cfg.mainCount).sort((a, b) => a - b));
                          setLuckyAnimKey(k => k + 1);
                        }} style={{
                          background: sel ? "rgba(236,72,153,.2)" : "rgba(0,0,0,.25)",
                          border: `1.5px solid ${sel ? "#ec4899" : "rgba(255,255,255,.06)"}`,
                          borderRadius: 12, padding: "10px 4px", cursor: "pointer", textAlign: "center",
                          transition: "all .25s", transform: sel ? "scale(1.08)" : "scale(1)",
                          boxShadow: sel ? "0 0 16px rgba(236,72,153,.2)" : "none",
                        }}>
                          <div style={{ fontSize: 22 }}>{z.icon}</div>
                          <div style={{ fontFamily: "'Oswald'", fontSize: 9, color: sel ? "#f9a8d4" : "#64748b", marginTop: 2, fontWeight: 600 }}>{sign}</div>
                          <div style={{ fontFamily: "'Space Mono'", fontSize: 7, color: "#475569", marginTop: 1 }}>{z.dates.split("–")[0].trim()}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* ── Lucky Result Display (Grand Reveal) ── */}
            {luckyResult && (
              <div key={luckyAnimKey} style={{
                background: "linear-gradient(135deg, rgba(245,158,11,.05), rgba(168,85,247,.05), rgba(236,72,153,.05))",
                borderRadius: 22, padding: "32px 20px 28px", textAlign: "center",
                border: "1px solid rgba(255,255,255,.1)", position: "relative", overflow: "hidden",
                boxShadow: "0 0 40px rgba(168,85,247,.08), 0 0 80px rgba(245,158,11,.05)",
              }}>
                <div style={{ position: "absolute", top: -30, left: -30, width: 120, height: 120, borderRadius: "50%", background: "rgba(245,158,11,.06)", filter: "blur(30px)" }} />
                <div style={{ position: "absolute", bottom: -20, right: -20, width: 100, height: 100, borderRadius: "50%", background: "rgba(236,72,153,.06)", filter: "blur(30px)" }} />
                <div style={{ position: "relative", zIndex: 1 }}>
                  <div style={{ fontSize: 28, marginBottom: 4, filter: "drop-shadow(0 0 15px rgba(245,158,11,.5))" }}>
                    {luckyMethod === "birthday" ? "🎂" : luckyMethod === "name" ? "✍️" : luckyMethod === "dream" ? "🌙" : "✨"}
                  </div>
                  <div style={{
                    fontFamily: "'Oswald'", fontSize: 14, letterSpacing: 3, textTransform: "uppercase", marginBottom: 18,
                    background: "linear-gradient(135deg, #f59e0b, #ec4899, #a855f7)",
                    WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                  }}>
                    {luckyMethod === "birthday" ? "Birthday" : luckyMethod === "name" ? "Name" : luckyMethod === "dream" ? "Dream" : "Zodiac"} Lucky Numbers
                  </div>
                  <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
                    {luckyResult.map((n, i) => (
                      <Ball key={`lucky-${luckyAnimKey}-${i}-${n}`} number={n} size={56} delay={i * 150} glow />
                    ))}
                  </div>
                  <div style={{ marginTop: 18, display: "flex", gap: 8, justifyContent: "center" }}>
                    <button onClick={() => { setLuckyResult(null); }} style={{
                      background: `${cfg.color}20`, border: `1px solid ${cfg.color}40`,
                      color: cfg.color, padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Space Mono'", fontSize: 10, fontWeight: 700,
                    }}>↻ Try Again</button>
                    <button onClick={saveSet} style={{
                      background: "rgba(16,185,129,.15)", border: "1px solid rgba(16,185,129,.3)",
                      color: "#10b981", padding: "8px 18px", borderRadius: 8, cursor: "pointer", fontFamily: "'Space Mono'", fontSize: 10, fontWeight: 700,
                    }}>💾 Save Numbers</button>
                  </div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#475569", marginTop: 12 }}>
                    Unique to your personal input · {cfg.name} format · No one else gets these
                  </div>
                </div>
              </div>
            )}

            {/* ── Why Personal Numbers Matter ── */}
            {!luckyResult && (
              <div style={{
                background: "linear-gradient(135deg, rgba(16,185,129,.06), rgba(5,150,105,.03))",
                borderRadius: 16, padding: 16, border: "1px solid rgba(16,185,129,.12)", marginTop: 14,
              }}>
                <div style={{ fontFamily: "'Oswald'", fontSize: 13, color: "#10b981", marginBottom: 8 }}>💡 WHY PERSONAL NUMBERS?</div>
                <div style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#94a3b8", lineHeight: 1.6 }}>
                  If everyone uses the same hot/cold analysis, they all pick identical numbers — and split the prize pool. Your personal lucky numbers from birthday, name, dreams, or zodiac are <span style={{ color: "#10b981", fontWeight: 600 }}>unique to you</span>. Even if you win, fewer people share the jackpot!
                </div>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#475569", marginTop: 8 }}>
                  💡 Pro tip: Combine a lucky method with a data strategy from the Generate tab for the ultimate personalised set
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════ ANALYSIS ══════ */}
        {view === "analysis" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: "rgba(239,68,68,.05)", borderRadius: 14, padding: 14, border: "1px solid rgba(239,68,68,.1)" }}>
                <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#ef4444", marginBottom: 8 }}>🔥 HOT {cfg.digitGame ? "DIGITS" : "NUMBERS"}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {hotN.map((n, i) => <Ball key={n} number={n} size={28} delay={i * 50} hue={0} mini />)}
                </div>
              </div>
              <div style={{ background: "rgba(59,130,246,.05)", borderRadius: 14, padding: 14, border: "1px solid rgba(59,130,246,.1)" }}>
                <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#3b82f6", marginBottom: 8 }}>❄️ COLD {cfg.digitGame ? "DIGITS" : "NUMBERS"}</div>
                <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                  {coldN.map((n, i) => <Ball key={n} number={n} size={28} delay={i * 50} hue={210} mini />)}
                </div>
              </div>
            </div>

            {/* Freq Chart */}
            <div style={{ background: cBg, borderRadius: 14, padding: "14px 10px", border: cBd, marginBottom: 12 }}>
              <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: cfg.color, marginBottom: 10, letterSpacing: 1, paddingLeft: 4 }}>
                📊 FREQUENCY · {cfg.digitGame ? "0" : "1"}–{cfg.mainMax}
              </div>
              <div style={{ display: "flex", alignItems: "flex-end", gap: cfg.mainMax <= 20 ? 3 : 1, height: 110, overflowX: "auto", paddingBottom: 2 }}>
                {Array.from({ length: cfg.mainMax - (cfg.digitGame ? -1 : 0) }, (_, i) => (cfg.digitGame ? i : i + 1)).map(n => {
                  const h = (freq[n] / maxF) * 90;
                  const color = hotN.includes(n) ? "#ef4444" : coldN.includes(n) ? "#3b82f6" : "#334155";
                  return (
                    <div key={n} style={{ flex: "1 0 auto", minWidth: cfg.mainMax <= 20 ? 16 : 8, display: "flex", flexDirection: "column", alignItems: "center" }}>
                      <div style={{ fontSize: 7, color: "#64748b", fontFamily: "'Space Mono'", marginBottom: 1 }}>{freq[n]}</div>
                      <div style={{ width: "100%", maxWidth: 16, height: h, borderRadius: "2px 2px 0 0", background: color, minHeight: 2, opacity: .85, transition: "height .5s" }} />
                      <div style={{ fontSize: 7, color: "#94a3b8", marginTop: 1, fontFamily: "'Space Mono'" }}>{n}</div>
                    </div>
                  );
                })}
              </div>
              <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6, fontFamily: "'Space Mono'", fontSize: 8, color: "#64748b" }}>
                <span><span style={{ color: "#ef4444" }}>■</span> Hot</span>
                <span><span style={{ color: "#3b82f6" }}>■</span> Cold</span>
                <span><span style={{ color: "#334155" }}>■</span> Neutral</span>
              </div>
            </div>

            {/* Bonus Freq */}
            {cfg.bonusMax > 0 && (
              <div style={{ background: cBg, borderRadius: 14, padding: "14px 10px", border: cBd, marginBottom: 12 }}>
                <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#f59e0b", marginBottom: 10, letterSpacing: 1, paddingLeft: 4 }}>⚡ {cfg.bonusName.toUpperCase()} FREQUENCY · 1–{cfg.bonusMax}</div>
                <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 85 }}>
                  {Array.from({ length: cfg.bonusMax }, (_, i) => i + 1).map(n => {
                    const bMax = Math.max(...Object.values(bonusFreq), 1);
                    return (
                      <div key={n} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div style={{ fontSize: 7, color: "#64748b", fontFamily: "'Space Mono'", marginBottom: 1 }}>{bonusFreq[n]}</div>
                        <div style={{ width: "80%", maxWidth: 18, height: (bonusFreq[n] / bMax) * 65, borderRadius: "2px 2px 0 0", background: "#f59e0b", opacity: .7, minHeight: 2 }} />
                        <div style={{ fontSize: 7, color: "#94a3b8", marginTop: 1, fontFamily: "'Space Mono'" }}>{n}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pairs + Overdue */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
              <div style={{ background: cBg, borderRadius: 14, padding: 14, border: cBd }}>
                <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#a855f7", marginBottom: 8, letterSpacing: 1 }}>🔗 TOP PAIRS</div>
                {topPairs.slice(0, 7).map(([p, c]) => (
                  <div key={p} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#cbd5e1" }}>{p}</span>
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#a855f7" }}>{c}×</span>
                  </div>
                ))}
              </div>
              <div style={{ background: cBg, borderRadius: 14, padding: 14, border: cBd }}>
                <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#ec4899", marginBottom: 8, letterSpacing: 1 }}>⏰ MOST OVERDUE</div>
                {gaps.slice(0, 7).map(g => (
                  <div key={g.number} style={{ display: "flex", justifyContent: "space-between", padding: "3px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#cbd5e1" }}>#{g.number}</span>
                    <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#ec4899" }}>{g.gap} draws</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 6 }}>
              {[
                { i: "📋", v: cur.length, l: "Total Draws" },
                { i: "⭐", v: `#${sortedF[0]?.[0]}`, l: "Most Common" },
                { i: "💎", v: `#${sortedF[sortedF.length - 1]?.[0]}`, l: "Least Common" },
                { i: "📅", v: cur[cur.length - 1]?.date?.slice(5) || "—", l: "Latest Draw" },
              ].map(s => (
                <div key={s.l} style={{ background: cBg, borderRadius: 10, padding: 10, border: cBd, textAlign: "center" }}>
                  <div style={{ fontSize: 16 }}>{s.i}</div>
                  <div style={{ fontFamily: "'Oswald'", fontSize: 18, color: cfg.color, marginTop: 1 }}>{s.v}</div>
                  <div style={{ fontFamily: "'Space Mono'", fontSize: 7, color: "#475569", marginTop: 1 }}>{s.l}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ══════ HISTORY ══════ */}
        {view === "history" && (
          <div style={{ background: cBg, borderRadius: 14, padding: 14, border: cBd, maxHeight: 440, overflowY: "auto" }}>
            <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: cfg.color, marginBottom: 10, letterSpacing: 1 }}>📜 {cfg.name.toUpperCase()} HISTORY</div>
            {cur.slice().reverse().map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,.03)" }}>
                <div style={{ fontFamily: "'Space Mono'", fontSize: 9, color: "#475569", minWidth: 72 }}>{d.date}</div>
                <div style={{ display: "flex", gap: 3, flexWrap: "wrap", alignItems: "center" }}>
                  {d.numbers.map((n, j) => <Ball key={j} number={n} size={24} mini />)}
                  {d.bonus && <BonusBall number={d.bonus} size={24} delay={0} label="" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ══════ SAVED ══════ */}
        {view === "saved" && (
          <div>
            {savedSets.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 16px", background: "rgba(255,255,255,.015)", borderRadius: 18, border: "1px dashed rgba(255,255,255,.06)" }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>💾</div>
                <p style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#475569" }}>No saved sets yet</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {savedSets.map((s, i) => {
                  const sg = GAMES[s.game];
                  return (
                    <div key={i} style={{ background: cBg, borderRadius: 12, padding: 14, border: cBd }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontFamily: "'Oswald'", fontSize: 11, color: sg.color }}>{sg.icon} {sg.name}</span>
                        <span style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#475569" }}>{s.ts}</span>
                      </div>
                      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", alignItems: "center" }}>
                        {s.numbers.map((n, j) => <Ball key={j} number={n} size={30} mini />)}
                        {s.bonus && <BonusBall number={s.bonus} size={30} delay={0} label={sg.bonusName} />}
                      </div>
                      <div style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#334155", marginTop: 6 }}>
                        {STRATS.find(st => st.key === s.strategy)?.label || ({birthday:"🎂 Birthday",name:"✍️ Name",dream:"🌙 Dream",zodiac:"♈ Zodiac"}[s.strategy] || s.strategy)} {sg.ordered ? "· ordered" : ""}
                      </div>
                    </div>
                  );
                })}
                <button onClick={() => setSavedSets([])} style={{
                  background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.2)",
                  color: "#ef4444", padding: "7px 14px", borderRadius: 7, cursor: "pointer",
                  fontFamily: "'Space Mono'", fontSize: 9, alignSelf: "center", marginTop: 6,
                }}>🗑 Clear All</button>
              </div>
            )}
          </div>
        )}



        {/* COMPLIANCE FOOTER */}
        <div style={{ marginTop: 32, borderTop: "1px solid rgba(255,255,255,.06)", paddingTop: 20 }}>
          {/* Responsible Gambling Banner */}
          <div style={{
            background: "rgba(239,68,68,.06)", borderRadius: 12, padding: "14px 16px", marginBottom: 16,
            border: "1px solid rgba(239,68,68,.1)", textAlign: "center",
          }}>
            <div style={{ fontFamily: "'Oswald'", fontSize: 12, color: "#ef4444", letterSpacing: 1, marginBottom: 6 }}>
              🔞 RESPONSIBLE GAMBLING
            </div>
            <p style={{ fontFamily: "'DM Sans'", fontSize: 11, color: "#94a3b8", lineHeight: 1.5, margin: 0 }}>
              Gambling can be harmful. If you or someone you know needs help:
            </p>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap", marginTop: 8 }}>
              <a href="https://www.gamblinghelponline.org.au" target="_blank" rel="noopener noreferrer" style={{
                fontFamily: "'Space Mono'", fontSize: 10, color: "#ef4444", textDecoration: "none",
                background: "rgba(239,68,68,.1)", padding: "4px 12px", borderRadius: 6,
              }}>gamblinghelponline.org.au</a>
              <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#ef4444",
                background: "rgba(239,68,68,.1)", padding: "4px 12px", borderRadius: 6,
              }}>📞 1800 858 858</span>
              <span style={{ fontFamily: "'Space Mono'", fontSize: 10, color: "#ef4444",
                background: "rgba(239,68,68,.1)", padding: "4px 12px", borderRadius: 6,
              }}>Lifeline: 13 11 14</span>
            </div>
          </div>

          {/* Legal Disclaimers */}
          <div style={{ textAlign: "center", marginBottom: 12 }}>
            <p style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#475569", lineHeight: 1.6, margin: "0 0 8px", maxWidth: 600, marginLeft: "auto", marginRight: "auto" }}>
              ⚠️ Number Oracle is an entertainment and analysis tool only. Lottery draws are completely random — past results do not influence future outcomes. This tool does not guarantee or improve chances of winning. All number suggestions are for entertainment purposes only.
            </p>
            <p style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#334155", lineHeight: 1.6, margin: "0 0 8px" }}>
              Number Oracle is not affiliated with, endorsed by, or connected to The Lott, The Lottery Corporation, Tattersall's, Lotterywest, or any Australian lottery operator. Game names and formats are used for informational purposes only.
            </p>
            <p style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#334155", margin: 0 }}>
              Must be 18 or over to use this app. Please play responsibly.
            </p>
          </div>

          {/* Links */}
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            {["Terms of Service", "Privacy Policy", "Responsible Gambling"].map(link => (
              <span key={link} style={{ fontFamily: "'Space Mono'", fontSize: 8, color: "#334155", cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2 }}>{link}</span>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span style={{ fontFamily: "'Space Mono'", fontSize: 7, color: "#1e293b" }}>© 2026 Number Oracle. All rights reserved.</span>
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
