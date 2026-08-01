import { NextRequest } from "next/server";

function createSSEResponse(encoder: TextEncoder, controller: ReadableStreamDefaultController) {
  return {
    send: (event: string, data: unknown) => {
      const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
      controller.enqueue(encoder.encode(message));
    },
  };
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

    const encoder = new TextEncoder();
    let controller: ReadableStreamDefaultController;

    const stream = new ReadableStream({
      start(ctrl) {
        controller = ctrl;
      },
    });

    (async () => {
      try {
        const sse = createSSEResponse(encoder, controller);

        // Stage 1: Searching
        sse.send("progress", { stage: "searching", message: "🔍 Searching the web..." });

        const apiKey = process.env.PERPLEXITY_API_KEY;
        if (!apiKey) {
          throw new Error("PERPLEXITY_API_KEY environment variable not set in Vercel");
        }

        console.log("Calling Perplexity API for topic:", body.topic);

        // Call Perplexity API (correct endpoint with /v1/)
        const response = await fetch("https://api.perplexity.ai/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "pplx-70b-online",
            messages: [
              {
                role: "system",
                content: `You are a research assistant. Research the query thoroughly and provide findings as a JSON array.
Each finding should have:
- text: The research finding or insight (2-3 sentences)
- source_url: URL where found
- source_title: Source name/title
- source_domain: Domain
- relevance: 0.0-1.0 relevance score
- credibility: 0.0-1.0 credibility score

Return ONLY valid JSON array, no markdown. Limit to ${body.max_results || 20} findings.`,
              },
              {
                role: "user",
                content: `Research this topic: ${body.topic}`,
              },
            ],
            max_tokens: 2000,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Perplexity API error ${response.status}:`, errorText);
          throw new Error(`Perplexity API error: ${response.status} - Check API key and endpoint`);
        }

        const data = await response.json();
        const responseText = data.choices?.[0]?.message?.content || "";

        // Parse JSON from response
        let findings = [];
        try {
          findings = JSON.parse(responseText);
          if (!Array.isArray(findings)) findings = [findings];
        } catch (e) {
          console.error("Failed to parse Perplexity response:", e);
          throw new Error("Invalid response format from research API");
        }

        // Stage 2: Processing
        sse.send("progress", { stage: "processing", message: "⚙️ Processing findings..." });
        await new Promise((r) => setTimeout(r, 600));

        // Stage 3: Ranking
        sse.send("progress", { stage: "ranking", message: "📊 Ranking by quality..." });
        await new Promise((r) => setTimeout(r, 500));

        // Transform findings to include recency score
        const processedFindings = findings
          .slice(0, body.max_results || 20)
          .map((f: any) => ({
            text: f.text || "",
            source: {
              url: f.source_url || "",
              title: f.source_title || "Unknown Source",
              domain: f.source_domain || new URL(f.source_url).hostname || "",
              retrieved_at: new Date().toISOString(),
            },
            scores: {
              relevance: Math.min(1, Math.max(0, f.relevance || 0.5)),
              credibility: Math.min(1, Math.max(0, f.credibility || 0.7)),
              recency: 0.85,
              combined: 0,
            },
          }))
          .map((f: any) => ({
            ...f,
            scores: {
              ...f.scores,
              combined: f.scores.relevance * 0.5 + f.scores.credibility * 0.3 + f.scores.recency * 0.2,
            },
          }));

        const result = {
          topic: body.topic,
          findings: processedFindings,
          summary: `Comprehensive research findings on "${body.topic}" from Perplexity real-time web search with quality scoring.`,
          created_at: new Date().toISOString(),
        };

        sse.send("complete", result);
        controller.close();
      } catch (error) {
        console.error("Research streaming error:", error);
        const sse = createSSEResponse(encoder, controller);
        sse.send("error", {
          message: error instanceof Error ? error.message : "Research failed",
        });
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
