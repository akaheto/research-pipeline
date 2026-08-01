export interface Claim {
  text: string;
  citations: Array<{ title: string; url: string }>;
  isSupported: boolean;
  appearanceCount: number;
  appearances: Array<{
    searchTopic: string;
    context: string;
  }>;
  conflicts: string[];
}

// Extract assertions/claims from text
// Claims are typically sentences with factual assertions
export function extractClaims(text: string): Array<{ text: string; context: string }> {
  const claims: Array<{ text: string; context: string }> = [];

  // Split into sentences
  const sentences = text.match(/[^.!?]+[.!?]+/g) || [];

  sentences.forEach((sentence) => {
    const cleaned = sentence.trim();

    // Filter out questions, greetings, generic statements
    if (
      !cleaned.startsWith("Q:") &&
      !cleaned.startsWith("A:") &&
      !cleaned.startsWith("To") &&
      !cleaned.includes("?") &&
      cleaned.length > 30 &&
      cleaned.length < 300
    ) {
      // Check if it's a factual claim (contains numbers, dates, percentages, comparisons)
      const isFactual =
        /\d+|compared|more than|less than|increased|decreased|highest|lowest|best|worst|percent|%|rate|growth/i.test(
          cleaned
        );

      if (isFactual) {
        claims.push({
          text: cleaned,
          context: cleaned,
        });
      }
    }
  });

  return claims;
}

// Extract citations from text
function extractCitationsFromText(text: string): Array<{ title: string; url: string }> {
  const citations: Array<{ title: string; url: string }> = [];
  const citationRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    citations.push({
      title: match[1],
      url: match[2],
    });
  }

  return citations;
}

// Check if claim has supporting citations nearby
function checkClaimSupport(text: string, claimText: string): Array<{ title: string; url: string }> {
  // Find the claim in the full text
  const claimIndex = text.indexOf(claimText);
  if (claimIndex === -1) return [];

  // Look for citations within 500 chars after the claim
  const contextAfter = text.substring(claimIndex, claimIndex + 500);
  return extractCitationsFromText(contextAfter);
}

// Aggregate claims from multiple searches
export function aggregateClaims(
  searches: Array<{
    topic: string;
    content: string;
  }>
): Claim[] {
  const claimMap: { [key: string]: Claim } = {};

  searches.forEach((search) => {
    const claims = extractClaims(search.content);

    claims.forEach(({ text }) => {
      const normalized = text.toLowerCase().trim();

      if (!claimMap[normalized]) {
        const citations = checkClaimSupport(search.content, text);
        claimMap[normalized] = {
          text: text,
          citations: citations,
          isSupported: citations.length > 0,
          appearanceCount: 0,
          appearances: [],
          conflicts: [],
        };
      }

      claimMap[normalized].appearanceCount++;
      claimMap[normalized].appearances.push({
        searchTopic: search.topic,
        context: text,
      });
    });
  });

  return Object.values(claimMap);
}

// Detect conflicting claims
export function detectConflicts(claims: Claim[]): Array<{ claim1: Claim; claim2: Claim; reason: string }> {
  const conflicts: Array<{ claim1: Claim; claim2: Claim; reason: string }> = [];

  claims.forEach((claim1, i) => {
    claims.slice(i + 1).forEach((claim2) => {
      // Check if claims are about the same topic but have contradictory values
      const keywords1 = claim1.text.toLowerCase().split(" ");
      const keywords2 = claim2.text.toLowerCase().split(" ");
      const commonKeywords = keywords1.filter((k) => keywords2.includes(k) && k.length > 4);

      if (commonKeywords.length > 2) {
        // Check for contradictory keywords
        const contradictoryPairs = [
          ["increase", "decrease"],
          ["growth", "decline"],
          ["higher", "lower"],
          ["more", "less"],
          ["best", "worst"],
          ["highest", "lowest"],
        ];

        const hasContradiction = contradictoryPairs.some(([word1, word2]) => {
          const has1 = claim1.text.toLowerCase().includes(word1);
          const has2 = claim2.text.toLowerCase().includes(word2);
          return (has1 && keywords2.some((k) => k.includes(word2))) || (has2 && keywords1.some((k) => k.includes(word1)));
        });

        if (hasContradiction) {
          conflicts.push({
            claim1,
            claim2,
            reason: `Contradictory statements about: ${commonKeywords.slice(0, 3).join(", ")}`,
          });
        }
      }
    });
  });

  return conflicts;
}

// Get claim confidence
export function getClaimConfidence(claim: Claim): "high" | "medium" | "low" {
  if (!claim.isSupported) return "low";
  if (claim.appearanceCount >= 2 && claim.citations.length >= 2) return "high";
  if (claim.appearanceCount >= 1 && claim.citations.length >= 1) return "medium";
  return "low";
}

// Get confidence color
export function getConfidenceColor(confidence: "high" | "medium" | "low"): string {
  if (confidence === "high") return "#4caf50";
  if (confidence === "medium") return "#ff9800";
  return "#f44336";
}
