import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createServerClient } from "@supabase/ssr";

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
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
        const { error } = await supabase.from("incidents").update(body).eq("id", params.id);
        if (error) throw error;
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error("❌ Error updating incident:", err);
        return NextResponse.json({ error: "Failed to update incident" }, { status: 500 });
    }
}
