import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const filter = searchParams.get("filter"); // "active" or "resolved"

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
        let query = supabase.from("incidents").select("*, service:services(name), updates:incident_updates(*)");

        if (filter === "active") {
            query = query.is("resolved_at", null);
        } else if (filter === "resolved") {
            query = query.not("resolved_at", "is", null).limit(50);
        }

        const { data, error } = await query.order("started_at", { ascending: false });

        if (error) throw error;
        return NextResponse.json(data, {
            headers: { "Cache-Control": "no-cache, no-store, must-revalidate" },
        });
    } catch (err) {
        console.error("❌ Error fetching incidents:", err);
        return NextResponse.json({ error: "Failed to fetch incidents" }, { status: 500 });
    }
}

export async function PATCH(request: NextRequest) {
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
        const { incidentId, ...updates } = await request.json();
        const { data, error } = await supabase.from("incidents").update(updates).eq("id", incidentId).select();

        if (error) throw error;
        return NextResponse.json(data[0]);
    } catch (err) {
        console.error("❌ Error updating incident:", err);
        return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
    }
}
