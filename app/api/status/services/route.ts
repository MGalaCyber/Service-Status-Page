import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

export async function GET(request: NextRequest) {
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
        const { data, error } = await supabase.from("services").select("*").order("is_pinned", { ascending: false }).order("name", { ascending: true });

        if (error) throw error;
        return NextResponse.json(data, {
            headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate",
            },
        });
    } catch (err) {
        console.error("❌ Error fetching services:", err);
        return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
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
        const body = await request.json();
        const { data, error } = await supabase.from("services").insert([body]).select();

        if (error) throw error;
        return NextResponse.json(data[0]);
    } catch (err) {
        console.error("❌ Error adding service:", err);
        return NextResponse.json({ error: "Failed to add service" }, { status: 500 });
    }
}
