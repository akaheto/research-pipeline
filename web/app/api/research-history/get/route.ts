import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: "Supabase not configured" },
        { status: 500 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Get all research results, ordered by newest first
    const { data, error } = await supabase
      .from("research_results")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100); // Limit to last 100 for performance

    if (error) {
      console.error("[GET] Supabase error:", error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    console.log("[GET] Retrieved", data?.length || 0, "research results");
    return NextResponse.json(data || []);
  } catch (error) {
    console.error("[GET] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
