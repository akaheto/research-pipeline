export interface CustomTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  queries: Array<{
    label: string;
    query: string;
  }>;
  created_at: string;
  updated_at: string;
}

const STORAGE_KEY = "research-pipeline-custom-templates";

export function loadCustomTemplates(): CustomTemplate[] {
  try {
    if (typeof window === "undefined") return [];
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: CustomTemplate): void {
  try {
    if (typeof window === "undefined") return;
    const templates = loadCustomTemplates();
    const index = templates.findIndex((t) => t.id === template.id);
    if (index >= 0) {
      templates[index] = template;
    } else {
      templates.push(template);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (e) {
    console.error("Failed to save template:", e);
  }
}

export function deleteCustomTemplate(id: string): void {
  try {
    if (typeof window === "undefined") return;
    const templates = loadCustomTemplates();
    const filtered = templates.filter((t) => t.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (e) {
    console.error("Failed to delete template:", e);
  }
}

export function createCustomTemplate(
  name: string,
  description: string,
  icon: string,
  queries: Array<{ label: string; query: string }>
): CustomTemplate {
  const template: CustomTemplate = {
    id: `custom-${Date.now()}`,
    name,
    description,
    icon,
    queries,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  saveCustomTemplate(template);
  return template;
}

// Validate template
export function validateTemplate(name: string, queries: Array<{ label: string; query: string }>): string | null {
  if (!name || name.trim().length === 0) {
    return "Template name is required";
  }

  if (name.length > 50) {
    return "Template name must be less than 50 characters";
  }

  if (!queries || queries.length === 0) {
    return "At least one search query is required";
  }

  if (queries.length > 10) {
    return "Maximum 10 queries per template";
  }

  for (const q of queries) {
    if (!q.label || q.label.trim().length === 0) {
      return "Each query must have a label";
    }

    if (!q.query || q.query.trim().length === 0) {
      return "Each query must have search text";
    }

    if (q.query.length < 10) {
      return "Each query must be at least 10 characters";
    }

    if (q.query.length > 200) {
      return "Each query must be less than 200 characters";
    }
  }

  return null;
}

export function getEmptyTemplate(): Partial<CustomTemplate> {
  return {
    name: "",
    description: "",
    icon: "📋",
    queries: [
      { label: "Main Topic", query: "" },
      { label: "Secondary Aspect", query: "" },
    ],
  };
}
