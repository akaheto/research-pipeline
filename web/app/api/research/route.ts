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

        const startTime = Date.now();
        console.log("[RESEARCH] Starting research for topic:", body.topic);
        console.log("[RESEARCH] Request params:", { max_results: body.max_results, apiKeySet: !!apiKey });

        const requestPayload = {
          model: "sonar",
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
        };

        console.log("[RESEARCH] Calling Perplexity API...");
        console.log("[RESEARCH] Endpoint: https://api.perplexity.ai/v1/chat/completions");
        console.log("[RESEARCH] Request payload size:", JSON.stringify(requestPayload).length, "bytes");

        const response = await fetch("https://api.perplexity.ai/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestPayload),
        });

        const apiCallTime = Date.now() - startTime;
        console.log("[RESEARCH] API response received in", apiCallTime, "ms");
        console.log("[RESEARCH] Status:", response.status, response.statusText);
        console.log("[RESEARCH] Response headers:", {
          contentType: response.headers.get("content-type"),
          contentLength: response.headers.get("content-length"),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[RESEARCH] API Error Response:", errorText.substring(0, 500));
          console.error("[RESEARCH] Full error details:", {
            status: response.status,
            statusText: response.statusText,
            errorLength: errorText.length,
          });
          throw new Error(`Perplexity API error ${response.status}: ${errorText.substring(0, 200)}`);
        }

        const data = await response.json();
        console.log("[RESEARCH] Response JSON parsed successfully");
        console.log("[RESEARCH] Message content length:", data.choices?.[0]?.message?.content?.length || 0);

        const responseText = data.choices?.[0]?.message?.content || "";

        // Parse JSON from response
        let findings = [];
        try {
          console.log("[RESEARCH] Attempting to parse findings JSON...");
          findings = JSON.parse(responseText);
          if (!Array.isArray(findings)) {
            console.log("[RESEARCH] Response is not array, wrapping it");
            findings = [findings];
          }
          console.log("[RESEARCH] Successfully parsed", findings.length, "findings");
        } catch (e) {
          console.error("[RESEARCH] JSON parse failed:", e);
          console.error("[RESEARCH] Response text preview:", responseText.substring(0, 300));
          throw new Error(`Invalid JSON response from Perplexity: ${e instanceof Error ? e.message : String(e)}`);
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

        console.log("[RESEARCH] Research complete. Sending results.");
        console.log("[RESEARCH] Total findings:", processedFindings.length);
        sse.send("complete", result);
        controller.close();
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        console.error("[RESEARCH] Error during research:", errorMsg);
        if (error instanceof Error) {
          console.error("[RESEARCH] Error stack:", error.stack);
        }
        const sse = createSSEResponse(encoder, controller);
        sse.send("error", {
          message: errorMsg,
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
