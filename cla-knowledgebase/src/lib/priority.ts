const HIGH_PRIORITY_PATTERNS = [
  /must[- ]read/i,
  /important-/i,
  /slides/i,
  /exam/i,
  /summary/i,
  /use case/i,
];

const PPTX_EXTENSION = /\.pptx$/i;

export function detectPriority(filename: string): 'high' | 'normal' {
  if (PPTX_EXTENSION.test(filename)) return 'high';

  for (const pattern of HIGH_PRIORITY_PATTERNS) {
    if (pattern.test(filename)) return 'high';
  }

  return 'normal';
}
