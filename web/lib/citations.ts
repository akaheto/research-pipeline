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

type CitationFormat = "apa" | "mla" | "chicago";

function parseUrl(url: string) {
  try {
    const u = new URL(url);
    return {
      domain: u.hostname?.replace("www.", "") || "",
      path: u.pathname,
    };
  } catch {
    return { domain: "", path: "" };
  }
}

function getAccessedDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function formatCitation(finding: Finding, format: CitationFormat): string {
  const { title, url, retrieved_at } = finding.source;
  const accessedDate = getAccessedDate(retrieved_at);
  const { domain } = parseUrl(url);

  switch (format) {
    case "apa":
      return `${domain}. (${new Date(retrieved_at).getFullYear()}). ${title}. Retrieved ${accessedDate}, from ${url}`;

    case "mla":
      return `"${title}." ${domain}, ${new Date(retrieved_at).getFullYear()}, ${url}. Accessed ${accessedDate}.`;

    case "chicago":
      return `${domain}. "${title}." Accessed ${accessedDate}. ${url}.`;

    default:
      return url;
  }
}

export function formatAllCitations(findings: Finding[], format: CitationFormat): string {
  return findings
    .map((finding, i) => `${i + 1}. ${formatCitation(finding, format)}`)
    .join("\n\n");
}

export function getFormatLabel(format: CitationFormat): string {
  const labels: Record<CitationFormat, string> = {
    apa: "APA",
    mla: "MLA",
    chicago: "Chicago",
  };
  return labels[format];
}
