import { NextResponse } from "next/server";
import {
  fetchAnalyticsDashboard,
  parseMetric,
  parseRange,
} from "@/lib/admin/fetch-analytics";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: admin } = await supabase
    .from("admin_users")
    .select("user_id")
    .eq("user_id", user.id)
    .maybeSingle();

  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const range = parseRange(searchParams.get("range"));
  const metric = parseMetric(searchParams.get("metric"));

  try {
    const data = await fetchAnalyticsDashboard({ range, metric });
    return NextResponse.json(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to load analytics.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
