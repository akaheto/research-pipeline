import { NextRequest } from "next/server";

// Detect if query is a comparison/ranking type
function isComparisonQuery(topic: string): boolean {
  const comparisonKeywords = [
    "compare", "vs", "versus", "which is better", "difference between",
    "ranking", "best", "top", "worst", "review", "pros and cons",
    "side by side", "versus", "head to head", "comparison",
    "advantages and disadvantages", "strengths and weaknesses"
  ];

  const lowerTopic = topic.toLowerCase();
  return comparisonKeywords.some(keyword => lowerTopic.includes(keyword));
}

function createSSEResponse(encoder: TextEncoder, controller: ReadableStreamDefaultController) {
  return {
    send: (event: string, data: unknown) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
  };
}

async function callPerplexity(topic: string, apiKey: string) {
  console.log("[RESEARCH] Calling Perplexity API...");

  const isComparison = isComparisonQuery(topic);

  const payload = {
    model: "sonar",
    messages: [
      {
        role: "user",
        content: isComparison
          ? `Research and provide a side-by-side comparison of: ${topic}

CRITICAL: Return this ONLY as a structured markdown table with these columns:
| Item | Best for | Strengths | Weaknesses | Key takeaway |

After the table, add:
1. Brief summary (2-3 sentences)
2. "Which to choose" decision guide with clear recommendations
3. Inline citations [source](url) throughout

Make the table comprehensive and comparable across rows.`
          : `Research and provide a comprehensive response about: ${topic}

Format your response clearly with:
- A concise opening summary
- Key findings or main points
- Direct answers to the core question
- Inline citations [source name](url) after factual claims
- Actionable takeaways when relevant`,
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
  const content = data.choices?.[0]?.message?.content || "";

  return {
    content,
    usage: data.usage,
  };
}

async function callClaude(perplexityContent: string, topic: string, claudeApiKey: string) {
  console.log("[RESEARCH] Calling Claude API for synthesis...");

  const payload = {
    model: "claude-opus-4-1",
    max_tokens: 3000,
    messages: [
      {
        role: "user",
        content: `Synthesize and enhance the following research about "${topic}" following these principles:

STRUCTURE (PRESERVE ALL OF THESE):
- Keep all tables, comparison matrices, and structured data exactly as-is
- Preserve all bullet points and numbered lists
- Do not remove or reformat any existing comparison sections

ENHANCEMENT (ADD ONLY THIS):
1. Lead with a 1-2 paragraph synthesis that connects key findings
2. Add brief analytical transitions between existing sections (1-2 sentences)
3. Enhance existing pros/cons, not replace them
4. Add "Key Takeaway" summary at end (2-3 sentences)
5. Include inline citations [Source Name](URL) immediately after new claims

TONE & FORMAT:
- Professional and analytical
- Concise headers (under 6 words)
- Only synthesize explanatory prose - do not restructure existing content

Research content to enhance:
${perplexityContent}

Produce the enhanced analysis:`,
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
  const content = data.content?.[0]?.text || "";

  return {
    content,
    usage: data.usage,
  };
}

function parsePerplexityOnly(content: string): { summary: string; findings: any[] } {
  // For Perplexity Only, format the raw response into our standard format
  // Extract key sections and citations
  const summaryMatch = content.match(/^([\s\S]{100,500}?)(?=\n\n|$)/);
  const summary = summaryMatch ? summaryMatch[1].trim() : content.substring(0, 300);

  // Create a single finding from the entire content
  const finding = {
    text: content,
    source: {
      url: "https://www.perplexity.ai",
      title: "Perplexity Research",
      domain: "perplexity.ai",
      retrieved_at: new Date().toISOString(),
    },
    scores: {
      relevance: 1.0,
      credibility: 0.95,
      recency: 0.9,
      combined: 0.95,
    },
  };

  return { summary, findings: [finding] };
}

function parseClaudeFormatted(claudeContent: string): { summary: string; findings: any[] } {
  // Claude already formatted it, so extract the components
  // Try to find assessment and sections
  const assessmentMatch = claudeContent.match(/^([\s\S]*?)(?=###|##|\n##|$)/);
  const summary = assessmentMatch ? assessmentMatch[1].trim() : claudeContent.substring(0, 500);

  // Create a finding from the full formatted response
  const finding = {
    text: claudeContent,
    source: {
      url: "https://www.anthropic.com",
      title: "Claude Analysis",
      domain: "anthropic.com",
      retrieved_at: new Date().toISOString(),
    },
    scores: {
      relevance: 1.0,
      credibility: 0.98,
      recency: 0.95,
      combined: 0.98,
    },
  };

  return { summary, findings: [finding] };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.topic || body.topic.trim().length === 0) {
      return new Response(JSON.stringify({ error: "Topic is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    let researchMethod = body.researchMethod || "perplexity-claude";

    // Auto-detect and override method for comparison queries
    const isComparison = isComparisonQuery(body.topic);
    if (isComparison && researchMethod !== "perplexity-only") {
      console.log("[RESEARCH] Query detected as comparison - auto-routing to Perplexity Only");
      researchMethod = "perplexity-only";
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

        // Stage 1: Searching
        sse.send("progress", { stage: "searching", message: "🔍 Searching the web..." });

        const perplexityKey = process.env.PERPLEXITY_API_KEY;
        if (!perplexityKey) {
          throw new Error("PERPLEXITY_API_KEY not set");
        }

        const startTime = Date.now();
        console.log("[RESEARCH] Method:", researchMethod);
        console.log("[RESEARCH] Topic:", body.topic);
        console.log("[RESEARCH] Is comparison query:", isComparison);

        // Step 1: Call Perplexity
        const perplexityResult = await callPerplexity(body.topic, perplexityKey);
        const perplexityTime = Date.now() - startTime;
        console.log("[RESEARCH] Perplexity API returned in", perplexityTime, "ms");
        console.log("[RESEARCH] Perplexity usage:", perplexityResult.usage);

        let finalContent: string;
        let claudeUsage: any = null;
        let totalCost = 0;

        if (researchMethod === "perplexity-only") {
          // Use Perplexity's response directly
          sse.send("progress", { stage: "formatting", message: "📝 Formatting results..." });
          finalContent = perplexityResult.content;
          const parsed = parsePerplexityOnly(finalContent);

          // Calculate Perplexity cost (estimate: $0.005 per 1K input, $0.015 per 1K output)
          const perplexityCost =
            (perplexityResult.usage.prompt_tokens * 0.005) / 1000 +
            (perplexityResult.usage.completion_tokens * 0.015) / 1000;
          totalCost = perplexityCost;

          const result = {
            topic: body.topic,
            method: "perplexity-only",
            summary: parsed.summary,
            findings: parsed.findings,
            created_at: new Date().toISOString(),
            cost: {
              model: "Perplexity (sonar)",
              prompt_tokens: perplexityResult.usage.prompt_tokens,
              completion_tokens: perplexityResult.usage.completion_tokens,
              total_tokens: perplexityResult.usage.total_tokens,
              estimated_cost: `$${perplexityCost.toFixed(4)}`,
            },
          };

          // Save to Supabase
          try {
            await fetch(new URL("/api/research-history/save", request.url), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic: body.topic,
                method: researchMethod,
                summary: result.summary,
                findings: result.findings,
                cost: result.cost,
              }),
            });
          } catch (e) {
            console.log("[RESEARCH] Supabase save error (non-critical)");
          }

          sse.send("complete", result);
        } else {
          // perplexity-claude: Use Perplexity research + Claude synthesis
          sse.send("progress", { stage: "synthesizing", message: "🧠 Synthesizing with Claude..." });

          const claudeKey = process.env.ANTHROPIC_API_KEY;
          if (!claudeKey) {
            throw new Error("ANTHROPIC_API_KEY not set");
          }

          const claudeStart = Date.now();
          const claudeResult = await callClaude(
            perplexityResult.content,
            body.topic,
            claudeKey
          );
          const claudeTime = Date.now() - claudeStart;
          console.log("[RESEARCH] Claude API returned in", claudeTime, "ms");
          console.log("[RESEARCH] Claude usage:", claudeResult.usage);

          finalContent = claudeResult.content;
          claudeUsage = claudeResult.usage;

          // Calculate costs
          // Perplexity: $0.005 per 1K input, $0.015 per 1K output
          const perplexityCost =
            (perplexityResult.usage.prompt_tokens * 0.005) / 1000 +
            (perplexityResult.usage.completion_tokens * 0.015) / 1000;

          // Claude Opus 4.1: $3 per 1M input, $15 per 1M output
          const claudeCost =
            (claudeUsage.input_tokens * 3) / 1000000 +
            (claudeUsage.output_tokens * 15) / 1000000;

          totalCost = perplexityCost + claudeCost;

          const parsed = parseClaudeFormatted(finalContent);

          const result = {
            topic: body.topic,
            method: "perplexity-claude",
            summary: parsed.summary,
            findings: parsed.findings,
            created_at: new Date().toISOString(),
            cost: {
              perplexity: {
                model: "Perplexity (sonar)",
                prompt_tokens: perplexityResult.usage.prompt_tokens,
                completion_tokens: perplexityResult.usage.completion_tokens,
                total_tokens: perplexityResult.usage.total_tokens,
                estimated_cost: `$${perplexityCost.toFixed(4)}`,
              },
              claude: {
                model: "Claude Opus 4.1",
                input_tokens: claudeUsage.input_tokens,
                output_tokens: claudeUsage.output_tokens,
                estimated_cost: `$${claudeCost.toFixed(4)}`,
              },
              total_estimated_cost: `$${totalCost.toFixed(4)}`,
            },
          };

          // Save to Supabase
          try {
            await fetch(new URL("/api/research-history/save", request.url), {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                topic: body.topic,
                method: researchMethod,
                summary: result.summary,
                findings: result.findings,
                cost: result.cost,
              }),
            });
          } catch (e) {
            console.log("[RESEARCH] Supabase save error (non-critical)");
          }

          sse.send("complete", result);
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[RESEARCH] Error:", errorMsg);
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
    console.error("Research error:", error);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
}
