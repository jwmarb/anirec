/**
 * Converts a string to the closest matching media format based on similarity
 * @param {string} input - The input string to match
 * @param {number} [threshold=0.6] - Minimum similarity threshold (0 to 1)
 * @returns {string|null} - The matched format or null if no good match found
 */
export function findClosestOf(data: Iterable<string>, input: string, threshold = 0.6) {
  if (!input) return null;

  const normalizedInput = input
    .trim()
    .toUpperCase()
    .replace(/[-_\s]+/g, '_');

  // Create a normalized version of the data
  const normalizedData = [...data].map((item) =>
    item
      .trim()
      .toUpperCase()
      .replace(/[-_\s]+/g, '_')
  );

  // Exact match check
  const exactMatchIndex = normalizedData.findIndex((item) => item === normalizedInput);
  if (exactMatchIndex !== -1) {
    return [...data][exactMatchIndex];
  }

  // Calculate similarity using Levenshtein distance
  function levenshteinDistance(a: string, b: string) {
    const matrix = Array(a.length + 1)
      .fill(0)
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + cost // substitution
        );
      }
    }

    return matrix[a.length][b.length];
  }

  // Find the best match using only Levenshtein distance
  let bestMatch = null;
  let bestSimilarity = 0;
  const dataArray = [...data];

  for (let i = 0; i < normalizedData.length; i++) {
    const format = normalizedData[i];

    // Calculate Levenshtein distance and similarity
    const distance = levenshteinDistance(normalizedInput, format);
    const maxLength = Math.max(normalizedInput.length, format.length);
    const similarity = 1 - distance / maxLength;

    // Add a bonus for matching prefixes
    const prefixLength = getCommonPrefixLength(normalizedInput, format);
    const prefixBonus = prefixLength > 2 ? (prefixLength / normalizedInput.length) * 0.2 : 0;

    const totalSimilarity = similarity + prefixBonus;

    if (totalSimilarity > bestSimilarity) {
      bestSimilarity = totalSimilarity;
      bestMatch = dataArray[i];
    }
  }

  // Debug output
  console.log(`Match: ${bestMatch}, Score: ${bestSimilarity}, Input: ${input}`);

  return bestSimilarity >= threshold ? bestMatch : null;
}

// Helper function to get common prefix length
function getCommonPrefixLength(a: string, b: string) {
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) {
    i++;
  }
  return i;
}
