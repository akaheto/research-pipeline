interface Finding {
  text: string;
  source: {
    url: string;
    title: string;
    domain: string;
    retrieved_at: string;
  };
  scores: {
    relevance: number;
    credibility: number;
    recency: number;
    combined: number;
  };
}

export interface GroupedFinding {
  primary: Finding;
  duplicates: Finding[];
  similarity: number;
}

// Calculate text similarity using Jaccard index (simple word overlap)
function calculateSimilarity(text1: string, text2: string): number {
  const normalize = (text: string) =>
    text
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3);

  const words1 = new Set(normalize(text1));
  const words2 = new Set(normalize(text2));

  if (words1.size === 0 || words2.size === 0) return 0;

  const intersection = Array.from(words1).filter((w) => words2.has(w)).length;
  const union = new Set([...words1, ...words2]).size;

  return intersection / union;
}

// Group similar findings
export function deduplicateFindings(
  findings: Finding[],
  threshold: number = 0.6
): GroupedFinding[] {
  if (findings.length === 0) return [];

  const grouped: GroupedFinding[] = [];
  const used = new Set<number>();

  for (let i = 0; i < findings.length; i++) {
    if (used.has(i)) continue;

    const primary = findings[i];
    const duplicates: Finding[] = [];

    for (let j = i + 1; j < findings.length; j++) {
      if (used.has(j)) continue;

      const similarity = calculateSimilarity(primary.text, findings[j].text);

      if (similarity >= threshold) {
        duplicates.push(findings[j]);
        used.add(j);
      }
    }

    grouped.push({
      primary,
      duplicates,
      similarity: duplicates.length > 0 ? 0.7 : 1.0,
    });

    used.add(i);
  }

  // Sort by combined score
  return grouped.sort((a, b) => b.primary.scores.combined - a.primary.scores.combined);
}

export function hasGroupedFindings(grouped: GroupedFinding[]): boolean {
  return grouped.some((g) => g.duplicates.length > 0);
}
