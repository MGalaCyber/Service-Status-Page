import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const serviceId = searchParams.get("serviceId");

    const cookieStore = await cookies();
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
        cookies: {
            getAll() {
                return cookieStore.getAll();
            },
            setAll(cookiesToSet) {
                try {
                    cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
                } catch {}
            },
        },
    });

    try {
        if (serviceId) {
            const { data, error } = await supabase.from("service_stats").select("stats").eq("service_id", serviceId).single();
            if (error) throw error;
            return NextResponse.json(data?.stats || [], {
                headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
            });
        } else {
            const { data, error } = await supabase.from("service_stats").select("*");
            if (error) throw error;
            return NextResponse.json(data, {
                headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
            });
        }
    } catch (err) {
        console.error("❌ Error fetching stats:", err);
        return NextResponse.json({ error: "Failed to fetch stats" }, { status: 500 });
    }
}
