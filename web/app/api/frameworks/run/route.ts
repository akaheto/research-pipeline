import { NextRequest } from "next/server";
import { frameworks } from "@/lib/frameworks";

function createSSEResponse(encoder: TextEncoder, controller: ReadableStreamDefaultController) {
  return {
    send: (event: string, data: unknown) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
  };
}

async function runFrameworkSearch(topic: string, query: string, apiKey: string) {
  const payload = {
    model: "sonar",
    messages: [
      {
        role: "user",
        content: `Research the following for "${topic}":\n\n${query}\n\nProvide a detailed, structured response with key findings and data.`,
      },
    ],
    max_tokens: 2000,
  };

  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Perplexity API error ${response.status}: ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  return {
    content: data.choices?.[0]?.message?.content || "",
    usage: data.usage,
  };
}

async function synthesizeFrameworkResults(
  topic: string,
  results: any[],
  synthesisPrompt: string,
  claudeApiKey: string
) {
  const resultsText = results
    .map(
      (r, i) =>
        `## ${r.label}\n\n${r.content}`
    )
    .join("\n\n---\n\n");

  const payload = {
    model: "claude-opus-4-1",
    max_tokens: 4000,
    messages: [
      {
        role: "user",
        content: `You are synthesizing research about "${topic}".

Research Results:
${resultsText}

Framework Synthesis Instructions:
${synthesisPrompt}

Generate the synthesized analysis:`,
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
    const { topic, frameworkId } = body;

    if (!topic || !frameworkId) {
      return new Response(JSON.stringify({ error: "Topic and frameworkId are required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const framework = frameworks.find((f) => f.id === frameworkId);
    if (!framework) {
      return new Response(JSON.stringify({ error: "Framework not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
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
        const perplexityKey = process.env.PERPLEXITY_API_KEY;
        const claudeKey = process.env.ANTHROPIC_API_KEY;

        if (!perplexityKey) {
          throw new Error("PERPLEXITY_API_KEY not set");
        }
        if (!claudeKey) {
          throw new Error("ANTHROPIC_API_KEY not set");
        }

        // Run each query in the framework
        const results = [];
        let totalPerplexityCost = 0;

        for (let i = 0; i < framework.queries.length; i++) {
          const q = framework.queries[i];
          sse.send("progress", {
            stage: "searching",
            step: i + 1,
            total: framework.queries.length,
            message: `🔍 Searching: ${q.label}...`,
          });

          const result = await runFrameworkSearch(`${topic}: ${q.label}`, q.query, perplexityKey);
          results.push({
            label: q.label,
            content: result.content,
            usage: result.usage,
          });

          // Calculate cost
          const cost =
            (result.usage.prompt_tokens * 0.005) / 1000 +
            (result.usage.completion_tokens * 0.015) / 1000;
          totalPerplexityCost += cost;

          // Send progress
          sse.send("progress", {
            stage: "searching",
            step: i + 1,
            total: framework.queries.length,
            completed: i + 1,
            message: `✓ Completed: ${q.label}`,
          });
        }

        // Synthesize results with Claude
        sse.send("progress", {
          stage: "synthesizing",
          message: "🧠 Synthesizing results...",
        });

        const synthesisPrompt = framework.synthesisPrompt || "Synthesize the above research into a comprehensive report.";
        const synthesis = await synthesizeFrameworkResults(topic, results, synthesisPrompt, claudeKey);

        // Calculate Claude cost
        const claudeCost =
          (synthesis.usage.input_tokens * 3) / 1000000 +
          (synthesis.usage.output_tokens * 15) / 1000000;

        const totalCost = totalPerplexityCost + claudeCost;

        // Build final result
        const finalResult = {
          topic,
          framework: framework.name,
          frameworkId,
          method: "framework-synthesis",
          summary: synthesis.content.split("\n").slice(0, 2).join("\n"),
          synthesis: synthesis.content,
          findings: results.map((r) => ({
            text: r.content,
            source: {
              url: "https://www.perplexity.ai",
              title: `Framework: ${r.label}`,
              domain: "perplexity.ai",
              retrieved_at: new Date().toISOString(),
            },
            scores: {
              relevance: 1.0,
              credibility: 0.95,
              recency: 0.9,
              combined: 0.95,
            },
          })),
          created_at: new Date().toISOString(),
          cost: {
            model: "Perplexity + Claude Synthesis",
            perplexity_cost: `$${totalPerplexityCost.toFixed(4)}`,
            claude_cost: `$${claudeCost.toFixed(4)}`,
            total_estimated_cost: `$${totalCost.toFixed(4)}`,
          },
        };

        // Save to Supabase
        try {
          await fetch(new URL("/api/research-history/save", request.url), {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              topic,
              method: "framework-synthesis",
              summary: finalResult.summary,
              findings: finalResult.findings,
              cost: finalResult.cost,
            }),
          });
        } catch (e) {
          console.log("[FRAMEWORK] Supabase save error (non-critical)");
        }

        sse.send("complete", finalResult);
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[FRAMEWORK] Error:", errorMsg);
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
    console.error("Framework error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
