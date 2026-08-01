import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

export interface ResearchResult {
  id: string;
  topic: string;
  method: "perplexity-only" | "perplexity-claude";
  summary: string;
  findings: any[];
  cost: any;
  created_at: string;
  updated_at: string;
}
