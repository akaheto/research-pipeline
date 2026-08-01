import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: {
      perplexityKeySet: !!process.env.PERPLEXITY_API_KEY,
      perplexityKeyLength: process.env.PERPLEXITY_API_KEY?.length || 0,
      perplexityKeyPrefix: process.env.PERPLEXITY_API_KEY
        ? process.env.PERPLEXITY_API_KEY.substring(0, 10) + "..."
        : "NOT SET",
      nodeEnv: process.env.NODE_ENV,
    },
    tests: {
      perplexityConnection: null as any,
    },
  };

  // Test Perplexity API connection
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;

    if (!apiKey) {
      diagnostics.tests.perplexityConnection = {
        status: "FAILED",
        error: "PERPLEXITY_API_KEY environment variable not set",
        timestamp: new Date().toISOString(),
      };
    } else {
      console.log("[DEBUG] Testing Perplexity API connection...");

      const testPayload = {
        model: "pplx-70b-online",
        messages: [
          {
            role: "user",
            content: "What is 2+2? Answer briefly.",
          },
        ],
        max_tokens: 50,
      };

      console.log("[DEBUG] Request URL: https://api.perplexity.ai/v1/chat/completions");
      console.log("[DEBUG] Request headers: Authorization: Bearer [KEY], Content-Type: application/json");
      console.log("[DEBUG] Request body:", JSON.stringify(testPayload, null, 2));

      const startTime = Date.now();
      const response = await fetch("https://api.perplexity.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(testPayload),
      });

      const elapsed = Date.now() - startTime;
      const responseText = await response.text();

      console.log("[DEBUG] Response status:", response.status);
      console.log("[DEBUG] Response time:", elapsed, "ms");
      console.log("[DEBUG] Response headers:", {
        contentType: response.headers.get("content-type"),
        contentLength: response.headers.get("content-length"),
      });
      console.log("[DEBUG] Response body:", responseText.substring(0, 500));

      diagnostics.tests.perplexityConnection = {
        status: response.ok ? "SUCCESS" : "FAILED",
        statusCode: response.status,
        statusText: response.statusText,
        responseTime: elapsed,
        responseLength: responseText.length,
        responsePreview: responseText.substring(0, 200),
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString(),
      };

      if (!response.ok) {
        diagnostics.tests.perplexityConnection.error = `HTTP ${response.status}: ${responseText.substring(0, 300)}`;
      }
    }
  } catch (error) {
    console.error("[DEBUG] Perplexity connection test error:", error);
    diagnostics.tests.perplexityConnection = {
      status: "ERROR",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    };
  }

  return NextResponse.json(diagnostics, {
    headers: {
      "Content-Type": "application/json",
    },
  });
}
