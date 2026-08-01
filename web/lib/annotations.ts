export interface Annotation {
  id: string;
  researchId: string;
  section: string;
  text: string;
  startIndex?: number;
  endIndex?: number;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "research-pipeline-annotations";

export function loadAnnotations(researchId: string): Annotation[] {
  try {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const allAnnotations = JSON.parse(stored);
    return allAnnotations.filter((a: Annotation) => a.researchId === researchId);
  } catch {
    return [];
  }
}

export function saveAnnotation(annotation: Annotation): void {
  try {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    const allAnnotations = stored ? JSON.parse(stored) : [];
    const index = allAnnotations.findIndex((a: Annotation) => a.id === annotation.id);
    if (index >= 0) {
      allAnnotations[index] = annotation;
    } else {
      allAnnotations.push(annotation);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(allAnnotations));
  } catch (e) {
    console.error("Failed to save annotation:", e);
  }
}

export function deleteAnnotation(id: string): void {
  try {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const allAnnotations = JSON.parse(stored);
    const filtered = allAnnotations.filter((a: Annotation) => a.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete annotation:", e);
  }
}

export function createAnnotation(researchId: string, section: string, text: string): Annotation {
  const annotation: Annotation = {
    id: `anno-${Date.now()}`,
    researchId,
    section,
    text,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  saveAnnotation(annotation);
  return annotation;
}

export function getResearchComparison(
  research1: any,
  research2: any
): Array<{
  type: "claim" | "source" | "change";
  description: string;
  value1?: string;
  value2?: string;
}> {
  const changes: Array<{
    type: "claim" | "source" | "change";
    description: string;
    value1?: string;
    value2?: string;
  }> = [];

  // Compare basic metrics
  const findings1Count = research1.findings?.length || 0;
  const findings2Count = research2.findings?.length || 0;

  if (findings1Count !== findings2Count) {
    changes.push({
      type: "change",
      description: "Number of findings changed",
      value1: `${findings1Count} findings`,
      value2: `${findings2Count} findings`,
    });
  }

  // Compare summaries for key differences
  const summary1 = research1.summary || research1.synthesis || "";
  const summary2 = research2.summary || research2.synthesis || "";

  // Extract percentages/numbers to compare
  const extractNumbers = (text: string) => text.match(/\d+\.?\d*%?/g) || [];
  const nums1 = extractNumbers(summary1);
  const nums2 = extractNumbers(summary2);

  if (nums1.join() !== nums2.join()) {
    changes.push({
      type: "claim",
      description: "Key metrics/statistics changed",
      value1: `${nums1.slice(0, 2).join(", ")}`,
      value2: `${nums2.slice(0, 2).join(", ")}`,
    });
  }

  return changes;
}
