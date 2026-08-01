export interface Source {
  url: string;
  title: string;
  domain: string;
  citationCount: number;
  appearances: Array<{
    searchTopic: string;
    context: string;
  }>;
  credibilityScore: number;
  credibilityFactors: {
    domainReputation: number;
    recency: number;
    academicCredibility: number;
    authoritative: number;
  };
}

// Extract citations from text in markdown format [title](url)
export function extractCitations(text: string): Array<{ title: string; url: string; context: string }> {
  const citations: Array<{ title: string; url: string; context: string }> = [];
  const citationRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

  let match;
  while ((match = citationRegex.exec(text)) !== null) {
    const title = match[1];
    const url = match[2];

    // Get surrounding context (100 chars before and after)
    const startIndex = Math.max(0, match.index - 100);
    const endIndex = Math.min(text.length, match.index + match[0].length + 100);
    const context = text.substring(startIndex, endIndex).trim();

    citations.push({ title, url, context });
  }

  return citations;
}

// Extract domain from URL
function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace("www.", "");
  } catch {
    return url;
  }
}

// Rate domain credibility
function rateDomainReputation(domain: string): number {
  const reputedDomains: { [key: string]: number } = {
    // Academic
    "edu": 0.95,
    "ac.uk": 0.95,
    ".org": 0.85,

    // News/Media
    "bbc.com": 0.9,
    "reuters.com": 0.9,
    "apnews.com": 0.9,
    "theguardian.com": 0.85,
    "ft.com": 0.85,
    "wsj.com": 0.85,
    "nytimes.com": 0.85,

    // Research/Analysis
    "gartner.com": 0.85,
    "forrester.com": 0.85,
    "mckinsey.com": 0.85,
    "github.com": 0.8,

    // Tech
    "developer.apple.com": 0.9,
    "developer.google.com": 0.9,
    "docs.microsoft.com": 0.9,
    "stackoverflow.com": 0.75,

    // Government
    "gov": 0.9,
  };

  // Check exact matches
  for (const [key, score] of Object.entries(reputedDomains)) {
    if (domain.includes(key)) {
      return score;
    }
  }

  // Default scores based on TLD
  if (domain.endsWith(".edu")) return 0.90;
  if (domain.endsWith(".gov")) return 0.85;
  if (domain.endsWith(".org")) return 0.70;
  if (domain.endsWith(".com")) return 0.50;
  if (domain.endsWith(".net")) return 0.45;

  return 0.40; // Unknown domains
}

// Aggregate sources from multiple search results
export function aggregateSources(
  searches: Array<{
    topic: string;
    content: string;
  }>
): { [url: string]: Source } {
  const sourceMap: { [url: string]: Source } = {};

  searches.forEach((search) => {
    const citations = extractCitations(search.content);

    citations.forEach(({ title, url, context }) => {
      const domain = extractDomain(url);

      if (!sourceMap[url]) {
        sourceMap[url] = {
          url,
          title,
          domain,
          citationCount: 0,
          appearances: [],
          credibilityScore: 0,
          credibilityFactors: {
            domainReputation: rateDomainReputation(domain),
            recency: 0.7, // Default, could be enhanced
            academicCredibility: domain.includes("edu") ? 0.95 : 0.5,
            authoritative: domain.includes("official") || domain.includes("org") ? 0.9 : 0.6,
          },
        };
      }

      sourceMap[url].citationCount++;
      sourceMap[url].appearances.push({
        searchTopic: search.topic,
        context,
      });
    });
  });

  // Calculate final credibility scores
  Object.values(sourceMap).forEach((source) => {
    const factors = source.credibilityFactors;
    source.credibilityScore =
      factors.domainReputation * 0.4 +
      factors.academicCredibility * 0.3 +
      factors.authoritative * 0.2 +
      factors.recency * 0.1;
  });

  return sourceMap;
}

// Detect contradictions between sources
export function detectContradictions(
  sources: { [url: string]: Source }
): Array<{
  source1: Source;
  source2: Source;
  conflictDescription: string;
}> {
  const contradictions: Array<{
    source1: Source;
    source2: Source;
    conflictDescription: string;
  }> = [];

  const sourceArray = Object.values(sources);

  // Flag sources with very different credibility scores citing same topic
  sourceArray.forEach((source1, i) => {
    sourceArray.slice(i + 1).forEach((source2) => {
      // Check if they appear in the same search
      const commonSearches = source1.appearances
        .map((a) => a.searchTopic)
        .filter((t) => source2.appearances.some((a) => a.searchTopic === t));

      if (commonSearches.length > 0) {
        const credibilityDiff = Math.abs(source1.credibilityScore - source2.credibilityScore);

        // Flag if credibility difference is significant
        if (credibilityDiff > 0.4) {
          contradictions.push({
            source1,
            source2,
            conflictDescription: `Different credibility levels (${source1.credibilityScore.toFixed(2)} vs ${source2.credibilityScore.toFixed(2)}) on topic: ${commonSearches[0]}`,
          });
        }
      }
    });
  });

  return contradictions;
}

// Get credibility color
export function getCredibilityColor(score: number): string {
  if (score >= 0.8) return "#4caf50"; // Green
  if (score >= 0.6) return "#ff9800"; // Orange
  return "#f44336"; // Red
}

// Get credibility label
export function getCredibilityLabel(score: number): string {
  if (score >= 0.8) return "Highly Credible";
  if (score >= 0.6) return "Credible";
  if (score >= 0.4) return "Moderate";
  return "Low Credibility";
}
