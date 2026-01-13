import { NextResponse } from "next/server";

export async function POST() {
    const authHeader = process.env.CRON_SECRET;

    try {
        const response = await fetch(new URL("/api/monitor", process.env.NEXT_PUBLIC_DEPLOYMENT_URL || "http://localhost:3000"), {
            method: "GET",
            headers: {
                Authorization: `Bearer ${authHeader}`,
            },
        });

        const result = await response.json();
        return NextResponse.json(result);
    } catch (error) {
        console.error("❌ Cron monitoring error:", error);
        return NextResponse.json({ error: "Cron job failed" }, { status: 500 });
    }
}
