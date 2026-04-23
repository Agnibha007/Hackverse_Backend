const BLOCKED_WORDS = [
  "fuck", "shit", "bitch", "cunt", "nigger", "nigga", "faggot",
  "whore", "slut", "bastard", "retard", "rape", "nazi", "hitler",
  "porn", "dildo", "jizz", "wank", "twat", "spic", "chink", "kike",
  "wetback", "tranny",
];

export function containsProfanity(text) {
  const lower = text.toLowerCase().replace(/[^a-z0-9]/g, " ");
  return BLOCKED_WORDS.some((word) => {
    const regex = new RegExp(`(?<![a-z])${word}(?![a-z])`, "i");
    return regex.test(lower);
  });
}
