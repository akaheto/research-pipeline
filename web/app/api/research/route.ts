import { NextRequest, NextResponse } from "next/server";

// Mock research function - in production, call the Python API
async function performResearch(params: {
  topic: string;
  max_results: number;
  similarity_threshold: number;
  min_score: number;
}) {
  // For demo, return mock data
  // In production: call Python backend via subprocess or HTTP API

  const mockFindings = [
    {
      text: `Key finding about ${params.topic}: This demonstrates how the research pipeline works with real data collection and processing.`,
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
      text: `Research insight about ${params.topic}: Understanding trends requires analyzing multiple sources and comprehensive analysis.`,
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
      text: `Analysis of ${params.topic}: Real-time data collection and processing provides comprehensive insights for decision-making.`,
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

  return {
    topic: params.topic,
    findings: mockFindings.slice(0, params.max_results),
    summary: `Comprehensive research findings on "${params.topic}" collected from multiple sources with quality scoring across relevance, credibility, and recency dimensions.`,
    created_at: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate input
    if (!body.topic || body.topic.trim().length === 0) {
      return NextResponse.json({ error: "Topic is required" }, { status: 400 });
    }

    // Perform research (mock for now, would call Python API in production)
    const result = await performResearch({
      topic: body.topic,
      max_results: body.max_results || 20,
      similarity_threshold: body.similarity_threshold || 0.85,
      min_score: body.min_score || 0,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Research error:", error);
    return NextResponse.json(
      { error: "Research failed. Ensure ANTHROPIC_API_KEY is set." },
      { status: 500 }
    );
  }
}
