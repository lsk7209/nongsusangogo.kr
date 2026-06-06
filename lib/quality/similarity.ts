export function titleSimilarity(a: string, b: string) {
  const left = bigrams(normalize(a));
  const right = bigrams(normalize(b));

  if (left.size === 0 || right.size === 0) {
    return 0;
  }

  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;

  return intersection / union;
}

function normalize(value: string) {
  return value.toLowerCase().replace(/\s+/g, "");
}

function bigrams(value: string) {
  const tokens = new Set<string>();

  for (let index = 0; index < value.length - 1; index += 1) {
    tokens.add(value.slice(index, index + 2));
  }

  return tokens;
}

