import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const apiKey = process.env.PERPLEXITY_API_KEY;
    const format = body.format || "perplexity-only"; // "perplexity-only" or "perplexity-claude"

    if (!apiKey) {
      return NextResponse.json({ error: "PERPLEXITY_API_KEY not set" }, { status: 400 });
    }

    let messages: any[];

    if (format === "perplexity-only") {
      // Simple, unformatted query
      messages = [
        {
          role: "user",
          content: body.query || "What is artificial intelligence?"
        }
      ];
    } else if (format === "custom") {
      // Our custom formatted query
      messages = [
        {
          role: "system",
          content: `You are a research analyst. Provide a comprehensive research assessment that synthesizes findings into actionable insights.

Format your response as:

COMPREHENSIVE ASSESSMENT: [4-6 paragraphs providing a thorough synthesis of the research. Evaluate key trends, tensions, evidence quality, and actionable insights. Reference specific findings and sources with citations. This is the main analytical response - make it substantive and evaluative, not just a summary.]

DETAILED FINDINGS:

SECTION: [Topic/Category 1]
[2-3 paragraphs of supporting evidence and details. Include specific sources in brackets like [1] or [2].]

SECTION: [Topic/Category 2]
[2-3 paragraphs of supporting evidence with citations.]

SOURCES:
[1] Source Title - domain.com
[2] Source Title - domain.com
[3] Source Title - domain.com

Write in flowing prose, not bullet points. The comprehensive assessment should synthesize and evaluate across all findings. Organize detailed findings by major themes/categories. Be specific with data and include citations.`
        },
        {
          role: "user",
          content: `Research "${body.query || "artificial intelligence"}" and provide a comprehensive assessment synthesizing all findings, followed by detailed supporting sections.`
        }
      ];
    } else {
      return NextResponse.json({ error: "Invalid format. Use 'perplexity-only' or 'perplexity-claude'" }, { status: 400 });
    }

    const payload = {
      model: "sonar",
      messages,
      max_tokens: 1500
    };

    const response = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({
        status: "error",
        format,
        perplexityError: data,
        timestamp: new Date().toISOString()
      }, { status: response.status });
    }

    // Return the complete response
    return NextResponse.json({
      status: "success",
      format,
      timestamp: new Date().toISOString(),
      query: body.query,
      content: data.choices?.[0]?.message?.content || "",
      usage: data.usage,
      metadata: {
        hasChoices: !!data.choices,
        choicesCount: data.choices?.length || 0,
        finishReason: data.choices?.[0]?.finish_reason,
        contentLength: data.choices?.[0]?.message?.content?.length || 0
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
