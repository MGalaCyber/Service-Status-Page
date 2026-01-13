import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

const timeout = 1 * 60 * 1000;

export async function GET() {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
            },
        });

        // Get newest timestamp from all service_stats
        const { data: statsData, error: statsError } = await supabase.from("service_stats").select("newest_timestamp").order("newest_timestamp", { ascending: false }).limit(1);

        if (statsError) throw statsError;

        const lastUpdated = statsData?.[0]?.newest_timestamp;

        // Next check is timeout from last update (or now if no data)
        const lastUpdateTime = lastUpdated ? new Date(lastUpdated).getTime() : Date.now();
        const nextCheckTime = lastUpdateTime + timeout;

        return NextResponse.json({
            lastUpdated: lastUpdated || new Date().toISOString(),
            nextCheckIn: nextCheckTime,
        });
    } catch (error) {
        console.error("❌ Last update API error:", error);
        return NextResponse.json({ error: "Failed to fetch last update info" }, { status: 500 });
    }
}
