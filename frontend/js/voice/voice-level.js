import { getCurrentLevel } from "./voice-state.js";
import { scenarios } from "./scenarios.js";

export function getLevel() {
  return getCurrentLevel();
}

export function getSystemPrompt(mode) {
  return `
${scenarios[mode]?.system || "You are a helpful assistant"}

IMPORTANT LEVEL RULE:
Current student level: ${getCurrentLevel()}

- Level A: very simple words, 5–8 words max, slow English
- Level B: normal everyday English
- Level C: advanced natural English, idioms allowed

You MUST strictly follow the level rules.
`;
}