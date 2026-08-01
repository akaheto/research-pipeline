import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const results = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
    status: "PASS" as "PASS" | "FAIL",
  };

  try {
    // Test 1: Environment check
    console.log("[QA] Test 1: Checking environment...");
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      results.tests.push({ name: "Environment", status: "FAIL", error: "PERPLEXITY_API_KEY not set" });
      results.status = "FAIL";
      return NextResponse.json(results);
    }
    results.tests.push({ name: "Environment", status: "PASS", message: "API key configured" });

    // Test 2: Quick API test (minimal tokens - single word query, max 3 results)
    console.log("[QA] Test 2: Running quick API test...");
    const testResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar",
        messages: [
          {
            role: "user",
            content: "AI",
          },
        ],
        max_tokens: 200,
      }),
    });

    if (!testResponse.ok) {
      const errorText = await testResponse.text();
      results.tests.push({
        name: "Perplexity API",
        status: "FAIL",
        error: `HTTP ${testResponse.status}: ${errorText.substring(0, 100)}`,
      });
      results.status = "FAIL";
      return NextResponse.json(results);
    }

    const apiData = await testResponse.json();
    const content = apiData.choices?.[0]?.message?.content || "";

    if (!content) {
      results.tests.push({
        name: "Perplexity API",
        status: "FAIL",
        error: "Empty response from API",
      });
      results.status = "FAIL";
      return NextResponse.json(results);
    }

    results.tests.push({ name: "Perplexity API", status: "PASS", message: `Got ${content.length} char response` });

    // Test 3: Parse response
    console.log("[QA] Test 3: Testing response parsing...");
    try {
      const lines = content.split("\n").filter((l: string) => l.trim().length > 5);
      if (lines.length < 1) {
        throw new Error("No content parsed");
      }
      results.tests.push({ name: "Response Parsing", status: "PASS", message: `Parsed ${lines.length} lines` });
    } catch (e) {
      results.tests.push({
        name: "Response Parsing",
        status: "FAIL",
        error: e instanceof Error ? e.message : String(e),
      });
      results.status = "FAIL";
    }

    // Test 4: Check research endpoint (via SSE)
    console.log("[QA] Test 4: Testing research endpoint...");
    try {
      const researchResponse = await fetch(new URL("/api/research", request.url), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: "test",
          max_results: 3,
        }),
      });

      if (!researchResponse.ok) {
        throw new Error(`HTTP ${researchResponse.status}`);
      }

      const reader = researchResponse.body?.getReader();
      if (!reader) throw new Error("No response body");

      let hasData = false;
      const decoder = new TextDecoder();
      const chunk = await reader.read();
      const text = decoder.decode(chunk.value);

      if (text.includes("complete") || text.includes("progress")) {
        hasData = true;
      }

      if (!hasData) {
        throw new Error("No SSE events received");
      }

      results.tests.push({ name: "Research Endpoint", status: "PASS", message: "SSE streaming works" });
    } catch (e) {
      results.tests.push({
        name: "Research Endpoint",
        status: "FAIL",
        error: e instanceof Error ? e.message : String(e),
      });
      results.status = "FAIL";
    }
  } catch (e) {
    results.tests.push({
      name: "Overall",
      status: "FAIL",
      error: e instanceof Error ? e.message : String(e),
    });
    results.status = "FAIL";
  }

  return NextResponse.json(results);
}
