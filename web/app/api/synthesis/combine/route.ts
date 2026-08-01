import { NextRequest } from "next/server";

function createSSEResponse(encoder: TextEncoder, controller: ReadableStreamDefaultController) {
  return {
    send: (event: string, data: unknown) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
  };
}

async function synthesizeMultipleSearches(
  searches: any[],
  title: string,
  claudeApiKey: string
) {
  console.log("[SYNTHESIS] Synthesizing", searches.length, "searches...");

  // Build a comprehensive context from all searches
  const searchSummaries = searches
    .map(
      (search, i) => `
## Search ${i + 1}: ${search.topic}
**Method:** ${search.method || "unknown"}
**Date:** ${search.created_at || "unknown"}

### Summary
${search.summary || "No summary available"}

### Key Content
${search.findings?.[0]?.text?.substring(0, 500) || "No findings"}...
`
    )
    .join("\n---\n");

  const payload = {
    model: "claude-opus-4-1",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are synthesizing research across multiple related searches about "${title}". Your task is to:

1. **Connect the findings** - Show how insights from different searches relate to each other
2. **Identify patterns** - What themes emerge across all searches?
3. **Surface contradictions** - Note any conflicting information or different perspectives
4. **Create a unified narrative** - Write prose that integrates all findings into one coherent story
5. **Highlight implications** - What do these combined insights suggest?

Research Results to Synthesize:
${searchSummaries}

Write a comprehensive synthesis that:
- Opens with a clear thesis connecting all searches
- Uses headers to organize major themes
- Cites which search(es) support each point using [Search N] notation
- Identifies gaps or missing information across searches
- Concludes with strategic implications or recommendations

Structure your response with clear sections and proper formatting. Make it a professional synthesis report, not a summary of summaries.`,
      },
    ],
  };

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": claudeApiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Claude API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.content?.[0]?.text || "",
    usage: data.usage,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { searches, title } = body;

    if (!searches || searches.length === 0) {
      return new Response(JSON.stringify({ error: "At least one search is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (searches.length > 10) {
      return new Response(
        JSON.stringify({ error: "Maximum 10 searches can be synthesized at once" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
      },
    });

    (async () => {
      const sse = createSSEResponse(encoder, controller);

      try {
        const claudeKey = process.env.ANTHROPIC_API_KEY;
        if (!claudeKey) {
          throw new Error("ANTHROPIC_API_KEY not set");
        }

        // Send progress
        sse.send("progress", {
          stage: "synthesizing",
          message: `🧠 Synthesizing ${searches.length} searches...`,
        });

        // Synthesize
        const synthesis = await synthesizeMultipleSearches(searches, title, claudeKey);

        // Calculate cost
        const claudeCost =
          (synthesis.usage.input_tokens * 3) / 1000000 +
          (synthesis.usage.output_tokens * 15) / 1000000;

        // Build result
        const result = {
          topic: title || `Combined Research: ${searches.map((s: any) => s.topic).join(", ")}`,
          method: "multi-search-synthesis",
          searchCount: searches.length,
          searches: searches.map((s: any) => ({ topic: s.topic, date: s.created_at })),
          summary: synthesis.content.split("\n").slice(0, 3).join("\n"),
          synthesis: synthesis.content,
          findings: searches.flatMap((search: any) => search.findings || []),
          created_at: new Date().toISOString(),
          cost: {
            model: "Claude Synthesis",
            input_tokens: synthesis.usage.input_tokens,
            output_tokens: synthesis.usage.output_tokens,
            estimated_cost: `$${claudeCost.toFixed(4)}`,
          },
        };

        sse.send("complete", result);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[SYNTHESIS] Error:", errorMsg);
        sse.send("error", { message: errorMsg });
      } finally {
        controller.close();
      }
    })();

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
      },
    });
  } catch (error) {
    console.error("Synthesis error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
