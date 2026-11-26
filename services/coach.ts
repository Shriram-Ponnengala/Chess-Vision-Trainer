// What the VCA Coach, the in-game coach, says. Short, warm lines for kids,
// sorted by moment, and real hints after a mistake (how the tapped square
// relates to the right one).
//
// Lines can use these blanks, filled in when he speaks:
//   {sq}  the square (e.g. d4)        {s}   seconds it took (e.g. 0.8)
//   {n}   streak length               {w}   the square that was asked
//   {t}   the square tapped           {f}   the asked file letter
//   {r}   the asked rank number       {dir} up / down / left / right
//   {part} which part of the board (e.g. "top left")

import { FILES } from '../constants';
import type { Coordinate, Difficulty } from '../types';

export type Mood = 'happy' | 'wow' | 'fire' | 'think' | 'oops' | 'clock';

export interface CoachLine {
  text: string;
  mood: Mood;
}

type Blanks = Partial<Record<'sq' | 's' | 'n' | 'w' | 't' | 'f' | 'r' | 'dir' | 'part', string | number>>;

// ───────────────────────── The lines ─────────────────────────

const START = [
  'Ready for take-off! ✈️ Tap the square before the plane lands.',
  "Hi pilot! Read the letter, then the number. Let's go! 🚀",
  "Engines on! Let's see how many squares you can spot. 👀",
  'Welcome aboard! Letters run along the bottom, numbers up the side. 🛫',
  "Seatbelts on! It's square-spotting time. 🎯",
  "I'm your VCA Coach and co-pilot today. Let's fly! 🐴",
  'Runway clear! Find each square as fast as you can. 🏁',
  "Let's warm up those chess eyes! 👀✨",
  'Tower to pilot: you are cleared for take-off! 📡',
  'One minute, lots of squares. You can do this! 💪',
  "Here comes the first plane. Ready? Let's go! ✈️",
  "Every square has a name. Let's learn them all! 📚",
  'Deep breath, eyes on the board. Go! 🌟',
  'Grandmasters started right here. Your turn! 🏆',
  'Letter first, then number. That is the secret! 🤫',
];

const START_EASY = [
  'Nice and slow today. Take your time and get them right! 🐢',
  'Easy pace: perfect for learning every square. 🌱',
  'Slow planes today. Focus on getting each one right! 🎯',
];

const START_HARD = [
  'Hard mode?! Brave pilot! These planes are FAST. ⚡',
  'Turbo speed today! Trust your eyes. 🏎️',
  'Fast planes ahead! Only the sharpest eyes win here. 🦅',
  'Hard pace: real speed training. Let me see your reflexes! ⚡',
  "Whoa, hard mode! Don't think too long, just tap! 💨",
];

const FIRST = [
  'First one down: {sq}! Keep going 🚀',
  '{sq}, perfect landing! 🛬',
  'And we are off! {sq} was right! 🎉',
  "That's one! Many more to go! ✅",
  'Great start with {sq}! 😄',
  'Nailed the first one! 🔨',
  'First plane landed safely! 🛬✨',
  "{sq}! You're warmed up already! 🔥",
  'Off to a flying start! ✈️',
  'Boom, first point! Keep it rolling! 🎳',
  'Yes! {sq} on the first try! 👏',
  'First landing: smooth as butter! 🧈',
];

const FAST = [
  'Whoa, {sq} in {s}s! Lightning fast ⚡',
  "You didn't even blink! 😮",
  'Speedy! {sq} like a pro 🏎️',
  'Super quick eyes! 👀⚡',
  '{s} seconds?! Are you a robot? 🤖',
  'Zoom! {sq} before I could say it! 💨',
  "That was faster than a knight's jump! 🐴⚡",
  'Rocket fingers! 🚀',
  'Blink and you miss it: {sq} in {s}s! 😲',
  'Speed of light! ⚡⚡',
  'How are you so fast?! 🤯',
  'Turbo mode activated! 🏎️💨',
  '{sq} in a flash! ⚡',
  'Faster than a cheetah! 🐆',
  'That plane barely took off! 🛫💨',
  'You knew that one by heart! ❤️',
  'Instant! {sq} is your friend now. 🤝',
  'Quick as a cat! 🐱⚡',
  '{s}s! New speed record? 🏁',
  'Your eyes are on fire today! 🔥👀',
  'Snap! Got it! 🫰',
  'Super speedy pilot! 🦸',
  'Lightning reflexes! ⚡🙌',
  'Wow, you found {sq} straight away! 🎯',
  'That was SO fast! 😮‍💨',
];

const NICE = [
  'Nice one! ✅',
  'Spot on, {sq}!',
  'Great eye! 👀',
  'You know your squares! 😄',
  "That's it! Smooth landing 🛬",
  'Correct! ✨',
  'Yes, {sq}! 👍',
  'Bullseye! 🎯',
  'Perfect landing on {sq}! 🛬',
  'Well spotted! 🔍',
  'Exactly right! ✔️',
  'Good job! 👏',
  'You got it! 🙌',
  'Brilliant! 🌟',
  'Super! ⭐',
  'That is the one! ☝️',
  'Ding ding, correct! 🔔',
  'Sharp eyes, pilot! 🦅',
  'Right on target! 🎯',
  'Smooth! 😎',
  'Excellent! 🏅',
  'Way to go! 🚀',
  'Keep them coming! 📦',
  '{sq}, nailed it! 🔨',
  "You're getting good at this! 📈",
  'Great work! 💪',
  'Fantastic! 🎉',
  "That's how a champion does it! 🏆",
  'Another safe landing! 🛬',
  'Yes yes yes! 🙌',
  'You make it look easy! 😌',
  "Woohoo! 🥳",
  'Lovely! 💚',
  'Splendid, pilot! 🎩',
  'Top marks! 💯',
  'On the money! 💰',
  'Clean landing! ✨',
  "That's my pilot! 🐴",
  'Correctamundo! 😄',
  'Bravo! 👏👏',
];

const COMEBACK = [
  'Back on track! 💪',
  'Shake it off, that was perfect! 👏',
  "That's the way! Mistakes help us learn 🌱",
  'See? You bounced right back! 🏀',
  'Comeback kid! 🦸',
  'Much better! Keep that focus! 🎯',
  'Yes! Forget the last one, this is what counts. ✨',
  'You learned from it already! 🧠',
  'Back in the air! ✈️',
  'That is the spirit! 💥',
  'Nothing stops you! 🚀',
  'Great recovery, pilot! 🛟',
  'Mistake fixed! Onwards! ➡️',
  'Phew, back to winning! 😅',
  'Champions bounce back. You just did! 🏆',
  'Right back at it! 🔁',
  'There you go! Confidence restored! 😎',
  'Smooth recovery! 🛬',
  'Strong comeback! 💪✨',
  'Yes! You found your rhythm again. 🎵',
];

const STREAK_5 = [
  '{n} in a row! You are on fire 🔥 +10 bonus!',
  'WOW, {n} straight! Bonus points for you 🎉',
  '{n} in a row?! Are you a grandmaster? 🏆',
  'Five-star pilot! ⭐⭐⭐⭐⭐ +10!',
  'Streak bonus unlocked! 🔓 +10',
  'High five for five in a row! 🖐️',
  "{n} perfect landings! You're unstoppable 🚀",
  'Combo! 🔥 That is +10 extra!',
];

const STREAK_10 = [
  '{n} in a row! This is AMAZING 🤩',
  'TEN straight?! My hooves are shaking! 🐴😱',
  '{n}-streak! You are flying high! ✈️🔥',
  'Double bonus territory! {n} in a row! 💥',
  'Incredible! {n} without a single miss! 🏆',
  '{n} in a row: you are a coordinate wizard! 🧙',
  "Someone call the tower, we've got a superstar! 📡⭐",
  '{n}! I have never seen eyes this sharp! 🦅',
];

const STREAK_BIG = [
  '{n} IN A ROW?! Legendary! 👑',
  'Is this a world record? {n} straight! 🌍🏆',
  '{n}! You could teach ME the squares! 🐴📚',
  'UNSTOPPABLE! {n} in a row! 🚀🚀🚀',
  '{n} streak! Grandmaster eyes confirmed! 👀👑',
  'The whole academy is cheering! {n} in a row! 📣',
  '{n}! My wings are flapping with joy! 🪽😮',
  'You are on another level! {n} straight! 🌌',
  '{n} in a row! Somebody stop this pilot! 🛑😄',
];

const CLOSE = [
  'Sooo close! {w} is right next to {t}. 🤏',
  'Almost! Just one square away. 🤏',
  'Nearly! {w} is a neighbour of {t}. 🏘️',
  'So close I could touch it! 🤏 {w} is right beside it.',
  'Just a tiny bit off! {w} is next door. 🚪',
  'Ooh, one square away! Next time! 🎯',
  'Close call! {w} was just next to that. 📍',
  'Almost had it! Look one square over. 👀',
  'So near! {w} and {t} are neighbours. 🤝',
  'A whisker away! {w} is right there. 🐱',
  'Very close! Just one step off. 👣',
  'Nearly perfect! {w} is one square away. ✨',
];

const SAME_FILE = [
  'Right file, the {f}-file! 👍 But {w} is on rank {r}: go {dir}.',
  'Good letter! Now count to rank {r}. Go {dir}! ⬆️⬇️',
  'The {f} was right! The number is {r}, a bit further {dir}. 🔢',
  'You found the {f}-file! Now climb to {r}. 🧗',
  'Half right! {f} is correct, but the rank is {r}. Go {dir}.',
  'Nice letter! Count the numbers on the side to {r}. 👆',
  'Great column! Now just find row {r}. 📏',
  'Letter perfect! Look {dir} for rank {r}. 👀',
  "You're on the {f}-file, good! {w} is further {dir}. ↕️",
  'Correct file! Read the number again: {r}. 🔁',
  'So close! Same file, slide {dir} to rank {r}. 🛝',
  'Almost! Keep the {f}, change the number to {r}. ✏️',
];

const SAME_RANK = [
  'Right rank! 👍 Now the letter: {w} is to the {dir} of {t}.',
  'Good number! Now find the {f}-file, to the {dir}. ↔️',
  'Rank {r} was right! Slide {dir} to the {f}. 🛝',
  "Correct row! The letter is {f}. Look {dir}. 👀",
  'Half right! {r} is correct, now find {f}. 🔤',
  'Nice number! Check the letters along the bottom for {f}. ⬇️',
  'You found rank {r}! Now just go {dir} to the {f}-file.',
  'Number perfect! {w} is further {dir}. ↔️',
  "You're on the right row! Hop {dir} to {f}. 🐴",
  'Good! Same rank, but the letter is {f}. 🔁',
  'Almost! Keep the {r}, change the letter to {f}. ✏️',
  'Right height! Move {dir} to find {w}. ➡️⬅️',
];

const FAR = [
  'Oops, that was {t}. {w} is in the {part} part of the board. 🗺️',
  'Tricky! Find the {f}-file first, then count to rank {r}. 🤔',
  'Not quite! {w} lives in the {part}. 🏠',
  'Hmm, {t} is far from {w}. Look {part}! 🔭',
  'Letter first: {f}. Then number: {r}. Try again! 🔤🔢',
  'Wrong corner! {w} is in the {part} area. 🧭',
  "That's {t}. {w} is over in the {part}. 👉",
  'Let me help: {f} is a letter along the bottom, {r} is up the side. 📐',
  'Not that one! Look for {f} along the edge first. 👀',
  'Oops! Read it slowly: {f}... {r}. 🐢',
  "Don't worry! {w} is in the {part}. You'll get it next time! 💚",
  'Close your eyes and picture it: {w} is {part}. 🧠',
  "Hmm, that's a different square. Find the {f} column first. 📏",
  'Mistakes are how we learn! {w} is in the {part}. 🌱',
  'Whoops! {w}: {f}-file, rank {r}. You got this! 💪',
];

const SLOW = [
  'The plane got away! ⏳ Find the {f}-file, then climb to rank {r}.',
  'Too slow this time ⏳ Letter first, then number. You got this!',
  '{w} was hiding! Look at the letters along the edge. 👀',
  'Missed the landing! {w} is in the {part}. 🛬',
  "Time's up for that one! {w}: {f} then {r}. ⏰",
  'That plane was sneaky! It was {w}. 🥷',
  'No rush, but be quick! {w} was the one. 🏃',
  "It's okay! Next time read the letter first: {f}. 🔤",
  'Oops, the plane crashed! It wanted {w}. 💥',
  'Too late! {w} is in the {part}. You will spot it next time. 🔭',
  'Hmm, {w} was a tricky one. Remember it! 🧠',
  'Speed up a little! Trust your first guess. 🎯',
  'That one flew past! {w} lives in the {part}. 🏠',
  "Don't freeze! Even a guess is better than waiting. 😉",
  'The plane ran out of fuel! It was {w}. ⛽',
  'Look for {f} along the bottom, quick! ⬇️',
  'So close to landing! {w} next time! 🛬',
  'Gone! It was {w}. Shake it off! 🐶',
];

const STRUGGLE = [
  "Hey, it's okay! Slow down and read the letter first. 🐢",
  "Don't worry, everyone starts somewhere! You're learning. 🌱",
  'Tip: find the letter along the bottom, then the number up the side. 📐',
  'Take a breath. You are doing better than you think! 💚',
  'Tricky round! Focus on one square at a time. 🎯',
  'Mistakes mean your brain is growing! 🧠✨',
  "Let's reset! Letter... number... tap! 🔁",
  "I believe in you, pilot! The next one's yours. 💪",
  'Even grandmasters miss sometimes. Keep going! 🏆',
  'Try saying the square out loud. It really helps! 🗣️',
  'Look at the edge of the board: the names are written there. 👀',
  "Slow is smooth, smooth is fast. You've got this! 🐢➡️🐇",
  'Stick with it! The squares will start to feel familiar. 🤝',
  "You're braver than the plane! Try again. ✈️💚",
  'No giving up! Your best answer is coming. 🌟',
];

const HALF = [
  'Halfway there! Keep it up ⏱️',
  '30 seconds left. You are doing great! 🙌',
  'Half time! Stay focused, pilot. 🎯',
  'Halfway! Can you beat your first half? 📈',
  '30 more seconds of awesome! ⏳✨',
  'Half the flight done! Keep those eyes sharp. 👀',
  'Halfway! Planes get faster now. Ready? ⚡',
  "You're halfway to the finish line! 🏁",
  '30 seconds to go! Show me your best! 🌟',
  'Halfway! Your score is climbing. 📈',
];

const LAST10 = [
  '10 seconds left. Go go go! 🏁',
  'Final countdown! Fastest fingers now! ⏰',
  'Last 10 seconds! Give it everything! 💥',
  'Almost done! Finish strong! 💪',
  'Ten seconds! Every square counts! 🔟',
  'Sprint to the finish! 🏃💨',
  'Final approach! Land them all! 🛬',
  'Hurry, pilot! The tower is closing! 🗼',
  "Last push! You're nearly there! 🚀",
  "10... 9... 8... Keep tapping! ⏰",
  "Don't stop now! 10 seconds! ⚡",
  'Final seconds! Make them count! 🎯',
];

const TIP = [
  'Fun fact: a1 is always a dark square, bottom left. 🤓',
  'Tip: the d and e files are the middle of the board. 🎯',
  "Fun fact: White's king starts on e1. 👑",
  'Tip: rank 1 is at the bottom, rank 8 at the top. ⬆️',
  'Fun fact: h1 is always a light square. ☀️',
  "Fun fact: the Black king starts on e8. 👑",
  'Tip: the files go a, b, c, d, e, f, g, h from left to right. 🔤',
  'Fun fact: the white queen starts on d1, on her own colour! 👸',
  'Tip: d4, d5, e4 and e5 are the four centre squares. 🎯',
  'Fun fact: there are 64 squares on a chessboard. 🔢',
  'Tip: white pawns start on rank 2, black pawns on rank 7. ♟️',
  'Fun fact: knights start on b1, g1, b8 and g8. 🐴',
  'Tip: the a-file is on the left, the h-file on the right. ↔️',
  "Fun fact: White's rooks start in the corners, a1 and h1. 🏰",
  'Tip: say the square in your head: "letter, number". 🗣️',
  'Fun fact: e4 is the most popular first move in chess! ♟️',
  'Tip: light squares are always on your right at the bottom. ☀️',
  'Fun fact: bishops start on c1, f1, c8 and f8. ⛪',
  'Tip: the 4th and 5th ranks cut the board in half. ✂️',
  'Fun fact: g1 and g8 are where the knights love to jump from! 🐴',
  'Tip: castling kingside puts your king on g1. 🏰',
  'Fun fact: every file has 8 squares, and so does every rank. 📏',
  'Tip: use the board edge labels, they are your map! 🗺️',
  'Fun fact: a8 is a light square, top left. ☀️',
  'Tip: the long diagonal a1 to h8 is all dark squares. ↗️',
];

// ───────────────────────── Picking a line ─────────────────────────

/** The last lines he said, so he never repeats himself too soon. */
const recent: string[] = [];

function pick(list: string[]): string {
  const fresh = list.filter((l) => !recent.includes(l));
  const line = (fresh.length ? fresh : list)[Math.floor(Math.random() * (fresh.length || list.length))];
  recent.push(line);
  if (recent.length > 40) recent.shift();
  return line;
}

function fill(template: string, blanks: Blanks): string {
  return template.replace(/\{(\w+)\}/g, (_, k: keyof Blanks) => String(blanks[k] ?? ''));
}

const say = (list: string[], mood: Mood, blanks: Blanks = {}): CoachLine => ({ text: fill(pick(list), blanks), mood });

const sqName = (c: Coordinate) => `${c.file}${c.rank}`;

/** "top left", "bottom right" and so on, for where a square sits on the board. */
function part(c: Coordinate) {
  const f = FILES.indexOf(c.file);
  const vertical = c.rank >= 6 ? 'top' : c.rank <= 3 ? 'bottom' : 'middle';
  const side = f <= 2 ? 'left' : f >= 5 ? 'right' : 'centre';
  if (vertical === 'middle' && side === 'centre') return 'very centre';
  if (vertical === 'middle') return `middle ${side}`;
  if (side === 'centre') return `${vertical} middle`;
  return `${vertical} ${side}`;
}

// ───────────────────────── What he says, by moment ─────────────────────────

export const coach = {
  start(pace: Difficulty): CoachLine {
    if (pace === 'hard' && Math.random() < 0.7) return say(START_HARD, 'wow');
    if (pace === 'easy' && Math.random() < 0.5) return say(START_EASY, 'happy');
    return say(START, 'happy');
  },

  first: (sq: string) => say(FIRST, 'happy', { sq }),

  fast: (sq: string, secs: number) => say(FAST, 'wow', { sq, s: secs.toFixed(1) }),

  nice: (sq: string) => say(NICE, 'happy', { sq }),

  comeback: () => say(COMEBACK, 'happy'),

  streak(n: number): CoachLine {
    const list = n >= 15 ? STREAK_BIG : n >= 10 ? STREAK_10 : STREAK_5;
    return say(list, 'fire', { n });
  },

  /** After a wrong tap: say how close it was and point the way. */
  wrong(wanted: Coordinate, tapped: Coordinate): CoachLine {
    const fileDiff = FILES.indexOf(wanted.file) - FILES.indexOf(tapped.file);
    const rankDiff = wanted.rank - tapped.rank;
    const blanks: Blanks = { w: sqName(wanted), t: sqName(tapped), f: wanted.file, r: wanted.rank, part: part(wanted) };

    if (Math.abs(fileDiff) <= 1 && Math.abs(rankDiff) <= 1) return say(CLOSE, 'oops', blanks);
    if (fileDiff === 0) return say(SAME_FILE, 'think', { ...blanks, dir: rankDiff > 0 ? 'up' : 'down' });
    if (rankDiff === 0) return say(SAME_RANK, 'think', { ...blanks, dir: fileDiff > 0 ? 'right' : 'left' });
    return say(FAR, Math.random() < 0.5 ? 'oops' : 'think', blanks);
  },

  slow: (wanted: Coordinate) => say(SLOW, 'oops', { w: sqName(wanted), f: wanted.file, r: wanted.rank, part: part(wanted) }),

  /** Three or more misses in a row: kind words and a simple method. */
  struggle: () => say(STRUGGLE, 'think'),

  half: () => say(HALF, 'clock'),

  last10: () => say(LAST10, 'clock'),

  /** Little facts now and then, between answers. */
  tip: () => say(TIP, 'think'),
};

/** How many lines he knows, by moment (for checking the count). */
export const COACH_LINE_COUNTS = {
  start: START.length + START_EASY.length + START_HARD.length,
  first: FIRST.length,
  fast: FAST.length,
  correct: NICE.length,
  comeback: COMEBACK.length,
  streak: STREAK_5.length + STREAK_10.length + STREAK_BIG.length,
  mistakeClose: CLOSE.length,
  mistakeSameFile: SAME_FILE.length,
  mistakeSameRank: SAME_RANK.length,
  mistakeFar: FAR.length,
  tooSlow: SLOW.length,
  struggling: STRUGGLE.length,
  halfway: HALF.length,
  last10: LAST10.length,
  tips: TIP.length,
};
