import { NextRequest } from "next/server";

const mockFindings = (topic: string) => [
  {
    text: `Key finding about ${topic}: This demonstrates how the research pipeline works with real data collection and processing.`,
    source: {
      url: "https://example.com/article1",
      title: "Example Research Source",
      domain: "example.com",
      retrieved_at: new Date().toISOString(),
    },
    scores: {
      relevance: 0.95,
      credibility: 0.92,
      recency: 0.98,
      combined: 0.95,
    },
  },
  {
    text: `Research insight about ${topic}: Understanding trends requires analyzing multiple sources and comprehensive analysis.`,
    source: {
      url: "https://research.example.com/paper",
      title: "Research Paper Portal",
      domain: "research.example.com",
      retrieved_at: new Date().toISOString(),
    },
    scores: {
      relevance: 0.88,
      credibility: 0.95,
      recency: 0.85,
      combined: 0.89,
    },
  },
  {
    text: `Analysis of ${topic}: Real-time data collection and processing provides comprehensive insights for decision-making.`,
    source: {
      url: "https://news.example.com/report",
      title: "News and Analysis",
      domain: "news.example.com",
      retrieved_at: new Date().toISOString(),
    },
    scores: {
      relevance: 0.82,
      credibility: 0.88,
      recency: 0.92,
      combined: 0.87,
    },
  },
];

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
        await new Promise((r) => setTimeout(r, 800));

        // Stage 2: Processing
        sse.send("progress", { stage: "processing", message: "⚙️ Processing findings..." });
        await new Promise((r) => setTimeout(r, 600));

        // Stage 3: Ranking
        sse.send("progress", { stage: "ranking", message: "📊 Ranking by quality..." });
        await new Promise((r) => setTimeout(r, 500));

        // Stage 4: Complete
        const findings = mockFindings(body.topic).slice(0, body.max_results || 20);
        const result = {
          topic: body.topic,
          findings,
          summary: `Comprehensive research findings on "${body.topic}" collected from multiple sources with quality scoring across relevance, credibility, and recency dimensions.`,
          created_at: new Date().toISOString(),
        };

        sse.send("complete", result);
        controller.close();
      } catch (error) {
        console.error("Research streaming error:", error);
        const sse = createSSEResponse(encoder, controller);
        sse.send("error", { message: "Research failed" });
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
