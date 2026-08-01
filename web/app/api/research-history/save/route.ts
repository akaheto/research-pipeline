import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { topic, method, summary, findings, cost } = body;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("research_results")
      .insert([
        {
          topic,
          method,
          summary,
          findings,
          cost,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[SAVE] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[SAVE] Research saved:", data.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[SAVE] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
